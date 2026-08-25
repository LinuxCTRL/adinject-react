import type {
  AdInjectionResult,
  AdUnit,
  InjectedAdSlot,
  PlacementRule,
} from "../types";

export interface InjectHtmlAdsOptions {
  html: string;
  rule: PlacementRule;
  adUnit: AdUnit;
  placeholderTemplate?: (slot: InjectedAdSlot) => string;
}

/**
 * Counts words in an HTML snippet (stripping markup)
 */
export function countWordsInHtml(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(" ").length : 0;
}

/**
 * Checks if paragraph contains or is immediately preceded by an excluded selector/tag
 */
function isExcludedParagraph(
  pContent: string,
  excludedSelectors: string[] = [],
): boolean {
  for (const selector of excludedSelectors) {
    if (selector.startsWith(".") && pContent.includes(selector.slice(1))) {
      return true;
    }
    if (
      pContent.includes(`<${selector}`) ||
      pContent.includes(`</${selector}>`)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Injects Google AdSense markers or placeholders into raw HTML string
 */
export function injectHtmlAds({
  html,
  rule,
  adUnit,
  placeholderTemplate,
}: InjectHtmlAdsOptions): AdInjectionResult<string> {
  if (!html || !rule.enabled) {
    return {
      content: html,
      insertedAds: [],
      totalWords: countWordsInHtml(html),
      totalParagraphs: (html.match(/<\/p>/gi) || []).length,
    };
  }

  const defaultTemplate = (slot: InjectedAdSlot) => `
<!-- ADINJECT_SLOT_START id="${slot.adUnit.id}" index="${slot.index}" -->
<div class="adinject-slot-wrapper my-6" data-adinject-index="${slot.index}" data-adinject-unit="${slot.adUnit.id}">
  <ins class="adsbygoogle"
       style="display:block; text-align:center;"
       data-ad-layout="${slot.adUnit.format === "fluid" ? "in-article" : ""}"
       data-ad-format="${slot.adUnit.format || "fluid"}"
       data-ad-client="${slot.adUnit.client}"
       data-ad-slot="${slot.adUnit.slot}"></ins>
</div>
<!-- ADINJECT_SLOT_END -->
`;

  const renderTemplate = placeholderTemplate || defaultTemplate;

  // Split by closing paragraph tags </p>
  const parts = html.split(/(<\/p>)/i);
  let totalParagraphCount = 0;
  let wordCountAccumulator = 0;
  let adsInsertedCount = 0;
  const insertedAds: InjectedAdSlot[] = [];

  const transformedParts: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === undefined) continue;

    transformedParts.push(part);

    if (part.toLowerCase() === "</p>") {
      totalParagraphCount++;

      const precedingParagraph = parts[i - 1] || "";
      wordCountAccumulator += countWordsInHtml(precedingParagraph);

      const canInject =
        adsInsertedCount < rule.maxAdsPerArticle &&
        wordCountAccumulator >= rule.minWordsBeforeFirstAd &&
        totalParagraphCount % rule.paragraphInterval === 0 &&
        !isExcludedParagraph(precedingParagraph, rule.excludedSelectors);

      if (canInject) {
        const slotData: InjectedAdSlot = {
          index: adsInsertedCount,
          adUnit,
          ruleId: rule.id,
          insertedAfterParagraph: totalParagraphCount,
        };

        insertedAds.push(slotData);
        transformedParts.push(renderTemplate(slotData));
        adsInsertedCount++;
      }
    }
  }

  return {
    content: transformedParts.join(""),
    insertedAds,
    totalWords: countWordsInHtml(html),
    totalParagraphs: totalParagraphCount,
  };
}

export type HtmlChunk =
  | { type: "html"; content: string }
  | { type: "ad"; adUnit: AdUnit; slotIndex: number; ruleId: string };

/**
 * Splits HTML content into chunks of React-renderable segments and Ad slots
 */
export function splitHtmlForAds({
  html,
  rule,
  adUnit,
}: {
  html: string;
  rule: PlacementRule;
  adUnit: AdUnit;
}): HtmlChunk[] {
  if (!html || !rule.enabled) {
    return [{ type: "html", content: html }];
  }

  const parts = html.split(/(<\/p>)/i);
  const chunks: HtmlChunk[] = [];
  let currentHtmlBuffer = "";
  let totalParagraphCount = 0;
  let wordCountAccumulator = 0;
  let adsInsertedCount = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === undefined) continue;

    currentHtmlBuffer += part;

    if (part.toLowerCase() === "</p>") {
      totalParagraphCount++;
      const precedingParagraph = parts[i - 1] || "";
      wordCountAccumulator += countWordsInHtml(precedingParagraph);

      const canInject =
        adsInsertedCount < rule.maxAdsPerArticle &&
        wordCountAccumulator >= rule.minWordsBeforeFirstAd &&
        totalParagraphCount % rule.paragraphInterval === 0 &&
        !isExcludedParagraph(precedingParagraph, rule.excludedSelectors);

      if (canInject) {
        chunks.push({ type: "html", content: currentHtmlBuffer });
        currentHtmlBuffer = "";

        chunks.push({
          type: "ad",
          adUnit,
          slotIndex: adsInsertedCount,
          ruleId: rule.id,
        });

        adsInsertedCount++;
      }
    }
  }

  if (currentHtmlBuffer) {
    chunks.push({ type: "html", content: currentHtmlBuffer });
  }

  return chunks;
}
