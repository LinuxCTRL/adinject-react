import type {
	AdInjectionResult,
	AdUnit,
	InjectedAdSlot,
	PlacementRule,
} from "../types";

export interface PortableTextSpan {
	_type: string;
	text: string;
	_key?: string;
	marks?: string[];
	[key: string]: unknown;
}

export interface PortableTextBlock {
	_type: string;
	_key: string;
	children?: Array<PortableTextSpan>;
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

	// Idempotency guard: Strip previously injected ad blocks to avoid duplicates on re-renders
	const cleanBlocks = blocks.filter((b) => b && b._type !== "adinject.adSlot");

	const result: (PortableTextBlock | InjectedAdBlock)[] = [];
	const insertedAds: InjectedAdSlot[] = [];

	let paragraphIndex = 0;
	let wordCountAccumulator = 0;
	let adsInserted = 0;

	for (let i = 0; i < cleanBlocks.length; i++) {
		const block = cleanBlocks[i];
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

export interface InjectedAffiliateBlock extends PortableTextBlock {
	_type: "adinject.affiliateCard" | "adinject.equipmentBox";
	_key: string;
	data: Record<string, unknown>;
}

/**
 * Injects a standalone affiliate product card or equipment box after a specific paragraph in Sanity Portable Text
 */
export function injectPortableTextAffiliate<T extends Record<string, unknown>>({
	blocks,
	type,
	data,
	afterParagraph = 2,
}: {
	blocks: PortableTextBlock[];
	type: "adinject.affiliateCard" | "adinject.equipmentBox";
	data: T;
	afterParagraph?: number;
}): (PortableTextBlock | InjectedAffiliateBlock)[] {
	if (!blocks || !Array.isArray(blocks)) return [];

	const result: (PortableTextBlock | InjectedAffiliateBlock)[] = [];
	let paragraphIndex = 0;
	let injected = false;

	for (let i = 0; i < blocks.length; i++) {
		const block = blocks[i];
		if (!block) continue;

		result.push(block);

		const isNormalParagraph =
			block._type === "block" && (!block.style || block.style === "normal");

		if (isNormalParagraph) {
			paragraphIndex++;

			if (paragraphIndex === afterParagraph && !injected) {
				const affiliateBlock: InjectedAffiliateBlock = {
					_type: type,
					_key: `affiliate_${Date.now()}_${i}`,
					data,
				};
				result.push(affiliateBlock);
				injected = true;
			}
		}
	}

	// If not enough paragraphs, append at the end
	if (!injected && result.length > 0) {
		result.push({
			_type: type,
			_key: `affiliate_${Date.now()}_end`,
			data,
		});
	}

	return result;
}
