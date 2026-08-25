import type {
  AdInjectionResult,
  AdUnit,
  InjectedAdSlot,
  PlacementRule,
} from "../types";

export interface InjectMarkdownAdsOptions {
  markdown: string;
  rule: PlacementRule;
  adUnit: AdUnit;
  customAdMarker?: (slot: InjectedAdSlot) => string;
}

export function countWordsInMarkdown(md: string): number {
  const clean = md.replace(/[#*_`~>[\]()]/g, " ").replace(/\s+/g, " ").trim();
  return clean ? clean.split(" ").length : 0;
}

/**
 * Injects ad markers into standard Markdown or MDX content
 */
export function injectMarkdownAds({
  markdown,
  rule,
  adUnit,
  customAdMarker,
}: InjectMarkdownAdsOptions): AdInjectionResult<string> {
  if (!markdown || !rule.enabled) {
    return {
      content: markdown,
      insertedAds: [],
      totalWords: countWordsInMarkdown(markdown),
      totalParagraphs: markdown.split(/\n\s*\n/).length,
    };
  }

  const defaultMarker = (slot: InjectedAdSlot) =>
    `\n\n<AdInjectSlot slot="${slot.adUnit.slot}" client="${slot.adUnit.client}" format="${slot.adUnit.format || "fluid"}" />\n\n`;

  const renderMarker = customAdMarker || defaultMarker;

  const rawBlocks = markdown.split(/\n\s*\n/);
  const transformedBlocks: string[] = [];
  const insertedAds: InjectedAdSlot[] = [];

  let paragraphIndex = 0;
  let wordCountAccumulator = 0;
  let adsInserted = 0;

  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i];
    if (block === undefined) continue;

    transformedBlocks.push(block);

    const isNonParagraph =
      block.startsWith("#") ||
      block.startsWith("```") ||
      block.startsWith(">") ||
      block.startsWith("- ") ||
      block.startsWith("1. ");

    if (!isNonParagraph && block.trim().length > 0) {
      paragraphIndex++;
      wordCountAccumulator += countWordsInMarkdown(block);

      const shouldInject =
        adsInserted < rule.maxAdsPerArticle &&
        wordCountAccumulator >= rule.minWordsBeforeFirstAd &&
        paragraphIndex % rule.paragraphInterval === 0 &&
        i < rawBlocks.length - 1;

      if (shouldInject) {
        const slotData: InjectedAdSlot = {
          index: adsInserted,
          adUnit,
          ruleId: rule.id,
          insertedAfterParagraph: paragraphIndex,
        };

        insertedAds.push(slotData);
        transformedBlocks.push(renderMarker(slotData).trim());
        adsInserted++;
      }
    }
  }

  return {
    content: transformedBlocks.join("\n\n"),
    insertedAds,
    totalWords: countWordsInMarkdown(markdown),
    totalParagraphs: paragraphIndex,
  };
}
