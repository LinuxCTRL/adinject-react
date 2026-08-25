import type {
  AdInjectionResult,
  AdUnit,
  InjectedAdSlot,
  PlacementRule,
} from "../types";

export interface PortableTextBlock {
  _type: string;
  _key: string;
  children?: Array<{ _type: string; text: string }>;
  style?: string;
  [key: string]: unknown;
}

export interface InjectedAdBlock extends PortableTextBlock {
  _type: "adinject.adSlot";
  _key: string;
  adUnit: AdUnit;
  slotIndex: number;
  ruleId: string;
}

export interface InjectPortableTextAdsOptions {
  blocks: PortableTextBlock[];
  rule: PlacementRule;
  adUnit: AdUnit;
}

function countWordsInBlock(block: PortableTextBlock): number {
  if (!block.children || !Array.isArray(block.children)) return 0;
  return block.children
    .map((c) => c.text || "")
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * Injects Portable Text Ad custom blocks into Sanity Portable Text AST arrays
 */
export function injectPortableTextAds({
  blocks,
  rule,
  adUnit,
}: InjectPortableTextAdsOptions): AdInjectionResult<
  (PortableTextBlock | InjectedAdBlock)[]
> {
  if (!blocks || !Array.isArray(blocks) || !rule.enabled) {
    return {
      content: blocks || [],
      insertedAds: [],
      totalWords: 0,
      totalParagraphs: 0,
    };
  }

  const result: (PortableTextBlock | InjectedAdBlock)[] = [];
  const insertedAds: InjectedAdSlot[] = [];

  let paragraphIndex = 0;
  let wordCountAccumulator = 0;
  let adsInserted = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block) continue;

    result.push(block);

    const isNormalParagraph =
      block._type === "block" && (!block.style || block.style === "normal");

    if (isNormalParagraph) {
      paragraphIndex++;
      wordCountAccumulator += countWordsInBlock(block);

      const shouldInject =
        adsInserted < rule.maxAdsPerArticle &&
        wordCountAccumulator >= rule.minWordsBeforeFirstAd &&
        paragraphIndex % rule.paragraphInterval === 0 &&
        i < blocks.length - 1;

      if (shouldInject) {
        const slotData: InjectedAdSlot = {
          index: adsInserted,
          adUnit,
          ruleId: rule.id,
          insertedAfterParagraph: paragraphIndex,
        };

        insertedAds.push(slotData);

        const adBlock: InjectedAdBlock = {
          _type: "adinject.adSlot",
          _key: `ad_slot_${rule.id}_${adsInserted}_${Date.now()}`,
          adUnit,
          slotIndex: adsInserted,
          ruleId: rule.id,
        };

        result.push(adBlock);
        adsInserted++;
      }
    }
  }

  return {
    content: result,
    insertedAds,
    totalWords: wordCountAccumulator,
    totalParagraphs: paragraphIndex,
  };
}
