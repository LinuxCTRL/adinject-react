import type { AffiliateKeywordOptions, AffiliateKeywordRule } from "../types";

// Module-level memoization cache for HTML/Markdown autolinker
const autolinkCache = new Map<string, string>();

/**
 * Escapes regex special characters in a keyword string.
 */
function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Injects affiliate links into plain HTML content.
 * Guarantees that keywords inside existing <a> tags, headings, script/style, or code blocks are NOT touched.
 * Fully idempotent: marked with data-adinject-affiliate to prevent link stacking across re-renders.
 */
export function injectHtmlAffiliateKeywords(
	html: string,
	options: AffiliateKeywordOptions,
): string {
	if (!html || !options?.rules || options.rules.length === 0) {
		return html || "";
	}

	if (options.idempotencyKey && autolinkCache.has(options.idempotencyKey)) {
		return autolinkCache.get(options.idempotencyKey) as string;
	}

	let maxTotal = options.maxLinksTotal ?? 3;
	if (
		options.maxLinksPerThousandWords &&
		options.maxLinksPerThousandWords > 0
	) {
		const totalWordCount = html
			.replace(/<[^>]*>/g, " ")
			.trim()
			.split(/\s+/)
			.filter(Boolean).length;
		const densityCap = Math.max(
			1,
			Math.floor((totalWordCount / 1000) * options.maxLinksPerThousandWords),
		);
		maxTotal = Math.min(maxTotal, densityCap);
	}
	let totalInjected = 0;

	// Track replacement count per rule
	const ruleCounts = new Map<AffiliateKeywordRule, number>();
	for (const rule of options.rules) {
		ruleCounts.set(rule, 0);
	}

	// Split HTML into tags and text chunks
	const tagRegex = /<[^>]+>/g;
	const chunks: Array<{ text: string; isTag: boolean }> = [];
	let lastIndex = 0;
	let match = tagRegex.exec(html);

	while (match !== null) {
		if (match.index > lastIndex) {
			chunks.push({
				text: html.substring(lastIndex, match.index),
				isTag: false,
			});
		}
		chunks.push({
			text: match[0] ?? "",
			isTag: true,
		});
		lastIndex = tagRegex.lastIndex;
		match = tagRegex.exec(html);
	}

	if (lastIndex < html.length) {
		chunks.push({
			text: html.substring(lastIndex),
			isTag: false,
		});
	}

	// Tags inside which we should NEVER autolink
	const skipTagNames = new Set(
		(
			options.skipTags ?? [
				"a",
				"code",
				"pre",
				"h1",
				"h2",
				"h3",
				"h4",
				"h5",
				"h6",
				"button",
				"script",
				"style",
				"textarea",
				"select",
				"option",
			]
		).map((t) => t.toLowerCase()),
	);

	const tagStack: string[] = [];

	const processedChunks = chunks.map((chunk) => {
		if (chunk.isTag) {
			const tagContent = chunk.text.slice(1, -1).trim();
			const isClosing = tagContent.startsWith("/");
			const tagNameMatch = isClosing
				? tagContent.slice(1).match(/^[a-zA-Z0-9_-]+/)
				: tagContent.match(/^[a-zA-Z0-9_-]+/);

			const tagName = tagNameMatch?.[0]?.toLowerCase() ?? "";
			const isSelfClosing =
				chunk.text.endsWith("/>") ||
				["img", "br", "hr", "input", "meta", "link"].includes(tagName);

			if (isClosing) {
				const lastIdx = tagStack.lastIndexOf(tagName);
				if (lastIdx !== -1) {
					tagStack.splice(lastIdx, 1);
				}
			} else if (!isSelfClosing && tagName) {
				tagStack.push(tagName);
			}

			return chunk.text;
		}

		// Check if we are currently inside a forbidden tag
		const isInsideForbidden = tagStack.some((tag) => skipTagNames.has(tag));
		if (isInsideForbidden || totalInjected >= maxTotal) {
			return chunk.text;
		}

		let transformedText = chunk.text;

		for (const rule of options.rules) {
			if (totalInjected >= maxTotal) break;
			const currentRuleCount = ruleCounts.get(rule) || 0;
			const maxForRule = rule.maxReplacements ?? 1;
			if (currentRuleCount >= maxForRule) continue;

			const keywords = Array.isArray(rule.keyword)
				? rule.keyword
				: [rule.keyword];

			for (const kw of keywords) {
				if (!kw || totalInjected >= maxTotal) break;
				const currentCount = ruleCounts.get(rule) || 0;
				if (currentCount >= maxForRule) break;

				const flags = rule.caseSensitive ? "g" : "gi";
				// Non-capturing group so replace callback has clean arguments
				const regex = new RegExp(`\\b(?:${escapeRegex(kw)})\\b`, flags);

				transformedText = transformedText.replace(
					regex,
					(matchedStr: string) => {
						const count = ruleCounts.get(rule) || 0;
						if (count >= maxForRule || totalInjected >= maxTotal) {
							return matchedStr;
						}

						ruleCounts.set(rule, count + 1);
						totalInjected++;

						options.onKeywordMatched?.(matchedStr, rule.targetUrl);

						const rel =
							rule.rel || options.rel || "noopener noreferrer sponsored";
						const target = rule.target || options.target || "_blank";
						const className =
							rule.className ||
							options.linkClassName ||
							options.className ||
							"adinject-affiliate-link";
						const titleAttr = rule.title ? ` title="${rule.title}"` : "";

						return `<a href="${rule.targetUrl}" target="${target}" rel="${rel}" class="${className}" data-adinject-affiliate="1"${titleAttr}>${matchedStr}</a>`;
					},
				);
			}
		}

		return transformedText;
	});

	const result = processedChunks.join("");
	if (options.idempotencyKey) {
		autolinkCache.set(options.idempotencyKey, result);
	}
	return result;
}

/**
 * Injects affiliate links into Markdown content safely without corrupting code blocks or existing links.
 */
export function injectMarkdownAffiliateKeywords(
	markdown: string,
	options: AffiliateKeywordOptions,
): string {
	if (!markdown || !options?.rules || options.rules.length === 0) {
		return markdown || "";
	}

	if (options.idempotencyKey && autolinkCache.has(options.idempotencyKey)) {
		return autolinkCache.get(options.idempotencyKey) as string;
	}

	let maxTotal = options.maxLinksTotal ?? 3;
	if (
		options.maxLinksPerThousandWords &&
		options.maxLinksPerThousandWords > 0
	) {
		const totalWordCount = markdown
			.replace(/[#*`_~[\]()]/g, " ")
			.trim()
			.split(/\s+/)
			.filter(Boolean).length;
		const densityCap = Math.max(
			1,
			Math.floor((totalWordCount / 1000) * options.maxLinksPerThousandWords),
		);
		maxTotal = Math.min(maxTotal, densityCap);
	}
	let totalInjected = 0;

	const ruleCounts = new Map<AffiliateKeywordRule, number>();
	for (const rule of options.rules) {
		ruleCounts.set(rule, 0);
	}

	const lines = markdown.split("\n");
	let inCodeBlock = false;

	const processedLines = lines.map((line: string) => {
		if (line.trim().startsWith("```")) {
			inCodeBlock = !inCodeBlock;
			return line;
		}
		if (inCodeBlock) return line;

		// Skip Markdown headings (#, ##, etc.)
		if (/^#{1,6}\s+/.test(line)) return line;

		if (totalInjected >= maxTotal) return line;

		let transformedLine = line;

		for (const rule of options.rules) {
			if (totalInjected >= maxTotal) break;
			const currentRuleCount = ruleCounts.get(rule) || 0;
			const maxForRule = rule.maxReplacements ?? 1;
			if (currentRuleCount >= maxForRule) continue;

			const keywords = Array.isArray(rule.keyword)
				? rule.keyword
				: [rule.keyword];

			for (const kw of keywords) {
				if (!kw || totalInjected >= maxTotal) break;
				const currentCount = ruleCounts.get(rule) || 0;
				if (currentCount >= maxForRule) break;

				const flags = rule.caseSensitive ? "g" : "gi";
				// Non-capturing group for clean replace callback
				const regex = new RegExp(`\\b(?:${escapeRegex(kw)})\\b`, flags);

				transformedLine = transformedLine.replace(
					regex,
					(matchedStr: string, offset: number) => {
						const count = ruleCounts.get(rule) || 0;
						if (count >= maxForRule || totalInjected >= maxTotal) {
							return matchedStr;
						}

						// Check if preceded by unmatched '[' without closing ']' or inside '`'
						const prefix = transformedLine.slice(0, offset);
						const openBracketCount = (prefix.match(/\[/g) || []).length;
						const closeBracketCount = (prefix.match(/\]/g) || []).length;
						if (openBracketCount > closeBracketCount) return matchedStr;

						const backtickCount = (prefix.match(/`/g) || []).length;
						if (backtickCount % 2 !== 0) return matchedStr;

						ruleCounts.set(rule, count + 1);
						totalInjected++;

						options.onKeywordMatched?.(matchedStr, rule.targetUrl);

						const rel =
							rule.rel || options.rel || "noopener noreferrer sponsored";
						const target = rule.target || options.target || "_blank";
						const className =
							rule.className ||
							options.linkClassName ||
							options.className ||
							"adinject-affiliate-link";

						return `<a href="${rule.targetUrl}" target="${target}" rel="${rel}" class="${className}" data-adinject-affiliate="1">${matchedStr}</a>`;
					},
				);
			}
		}

		return transformedLine;
	});

	const result = processedLines.join("\n");
	if (options.idempotencyKey) {
		autolinkCache.set(options.idempotencyKey, result);
	}
	return result;
}

/**
 * Universal auto-linker that handles HTML or Markdown content.
 */
export function injectAffiliateKeywords(
	content: string,
	options: AffiliateKeywordOptions,
): string {
	if (!content) return "";
	const isHtml = /<[a-z][\s\S]*>/i.test(content);
	return isHtml
		? injectHtmlAffiliateKeywords(content, options)
		: injectMarkdownAffiliateKeywords(content, options);
}
