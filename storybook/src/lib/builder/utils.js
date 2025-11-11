import { storyDefaults } from './story-defaults.js';
import { getComponentDefinition } from './component-registry.js';

let blockCounter = 0;

const SECTION_DEFAULTS = {
	backgroundSource: 'color',
	backgroundColor: '',
	backgroundImageDesktop: '',
	backgroundImageMobile: '',
	backgroundVideoDesktop: '',
	backgroundVideoMobile: '',
	backgroundVideoPosterDesktop: '',
	backgroundVideoPosterMobile: '',
	textColor: '',
	paddingTop: '',
	paddingBottom: ''
};

export function ensureSectionDefaults(section = {}) {
	const merged = {
		...SECTION_DEFAULTS,
		...(section || {})
	};

	if (!['color', 'image', 'video'].includes(merged.backgroundSource)) {
		merged.backgroundSource = 'color';
	}

	return merged;
}

const TITLE_SHADOW_DEFAULT = {
	enabled: false,
	offsetX: '0px',
	offsetY: '3px',
	blur: '18px',
	spread: '',
	color: 'rgba(15, 23, 42, 0.55)'
};

const SUBTITLE_SHADOW_DEFAULT = {
	enabled: false,
	offsetX: '0px',
	offsetY: '2px',
	blur: '12px',
	spread: '',
	color: 'rgba(15, 23, 42, 0.45)'
};

function normalizeShadowValue(value, defaults) {
	const base = {
		enabled: Boolean(defaults?.enabled),
		offsetX: defaults?.offsetX ?? '0px',
		offsetY: defaults?.offsetY ?? '0px',
		blur: defaults?.blur ?? '',
		spread: defaults?.spread ?? '',
		color: defaults?.color ?? 'rgba(0, 0, 0, 0.5)'
	};

	if (value === null || value === undefined) {
		return { ...base, enabled: false };
	}

	if (typeof value === 'boolean') {
		return { ...base, enabled: value };
	}

	if (typeof value === 'string') {
		const trimmed = value.trim();
		if (!trimmed) {
			return { ...base, enabled: false };
		}
		return { ...base, enabled: true, value: trimmed };
	}

	if (value && typeof value === 'object') {
		const merged = {
			...base,
			...value
		};
		merged.enabled = value.enabled !== undefined ? Boolean(value.enabled) : true;
		return merged;
	}

	return { ...base, enabled: Boolean(value) };
}

function ensureBlockShadows(block) {
	if (!block || typeof block !== 'object') return block;
	if ('titleShadow' in block) {
		block.titleShadow = normalizeShadowValue(block.titleShadow, TITLE_SHADOW_DEFAULT);
	}
	if ('subtitleShadow' in block) {
		block.subtitleShadow = normalizeShadowValue(block.subtitleShadow, SUBTITLE_SHADOW_DEFAULT);
	}
	if ('metaShadow' in block) {
		block.metaShadow = normalizeShadowValue(block.metaShadow, {
			enabled: false,
			offsetX: '0px',
			offsetY: '2px',
			blur: '10px',
			spread: '',
			color: 'rgba(15, 23, 42, 0.35)'
		});
	}
	return block;
}

function applyBlockDefaults(block) {
	if (!block || typeof block !== 'object') return block;
	const type = block.type || block.kind;
	if (!type) return block;
	const definition = getComponentDefinition(type);
	if (!definition?.defaultData) return block;

	const { section: _section, ...defaults } = structuredClone(definition.defaultData);

	for (const [key, value] of Object.entries(defaults)) {
		if (block[key] === undefined) {
			block[key] = value;
		}
	}

	return block;
}

function mergeTypography(defaultValue = {}, incoming = {}) {
	const result = {};
	const keys = new Set([...Object.keys(defaultValue || {}), ...Object.keys(incoming || {})]);

	for (const key of keys) {
		const base = defaultValue?.[key] || {};
		const override = incoming?.[key] || {};
		result[key] = {
			...base,
			...override,
			desktop: {
				...(base.desktop || {}),
				...(override.desktop || {})
			},
			mobile: {
				...(base.mobile || {}),
				...(override.mobile || {})
			}
		};
	}

	return result;
}

function ensureMediaVariants(paragraph = {}) {
	if (!paragraph || typeof paragraph !== 'object') return paragraph;
	const clone = { ...paragraph };
	const type = (clone.type || '').toLowerCase();

	const ensure = (obj, target, source) => {
		if (!obj) return;
		if (!obj[target] && obj[source]) {
			obj[target] = obj[source];
		}
	};

	const ensurePair = (obj, a, b) => {
		ensure(obj, a, b);
		ensure(obj, b, a);
	};

	if (type === 'absolute-canvas' || type === 'super-flex' || type === 'superflex') {
		clone.type = 'free-canvas';
		type = 'free-canvas';
	}

	switch (type) {
		case 'header':
			ensurePair(clone, 'backgroundImageMobile', 'backgroundImage');
			ensurePair(clone, 'backgroundVideoMobile', 'backgroundVideo');
			ensurePair(clone, 'posterMobile', 'poster');
			ensurePair(clone, 'posterImageMobile', 'posterImage');
			break;
		case 'header-caotico':
			ensurePair(clone, 'backgroundImageMobile', 'backgroundImage');
			ensurePair(clone, 'backgroundVideoMobile', 'backgroundVideo');
			break;
		case 'foto':
		case 'imagem':
		case 'photo':
			ensurePair(clone, 'srcMobile', 'src');
			break;
		case 'video':
			ensurePair(clone, 'srcMobile', 'src');
			ensurePair(clone, 'posterMobile', 'poster');
			break;
		case 'globovideo':
		case 'globo-video':
		case 'globoplayer':
		case 'globo-player':
		case 'globo':
			ensurePair(clone, 'videoIdMobile', 'videoIdDesktop');
			if (!clone.videoId && clone.videoIdDesktop) clone.videoId = clone.videoIdDesktop;
			if (!clone.videoId && clone.videoIdMobile) clone.videoId = clone.videoIdMobile;
			break;
		case 'parallax':
			ensurePair(clone, 'imageMobile', 'image');
			break;
		case 'scrollyframes':
		case 'videoscrollytelling':
			ensurePair(clone, 'imagePrefixMobile', 'imagePrefix');
			ensurePair(clone, 'imageSuffixMobile', 'imageSuffix');
			break;
		case 'antes-depois':
		case 'before-after':
			ensurePair(clone, 'beforeImageMobile', 'beforeImage');
			ensurePair(clone, 'afterImageMobile', 'afterImage');
			break;
		case 'scrolly': {
			if (Array.isArray(clone.steps)) {
				clone.steps = clone.steps.map((step) => {
					if (!step || typeof step !== 'object') return step;
					const stepClone = { ...step };
					ensurePair(stepClone, 'imageMobile', 'image');
					ensurePair(stepClone, 'videoMobile', 'video');
					return stepClone;
				});
			}
			break;
		}
		case 'flexible-layout':
			ensurePair(clone, 'image1Mobile', 'image1Desktop');
			ensurePair(clone, 'image2Mobile', 'image2Desktop');
			break;
		case 'responsive-media':
			ensurePair(clone, 'backgroundImageMobile', 'backgroundImageDesktop');
			ensurePair(clone, 'backgroundVideoMobile', 'backgroundVideoDesktop');
			break;
		case 'galeria':
		case 'gallery':
			if (Array.isArray(clone.images)) {
				clone.images = clone.images.map((item) => {
					if (!item || typeof item !== 'object') return item;
					const next = { ...item };
					ensurePair(next, 'srcMobile', 'src');
					return next;
				});
			}
			break;
		case 'carousel':
			if (Array.isArray(clone.items)) {
				clone.items = clone.items.map((item) => {
					if (!item || typeof item !== 'object') return item;
					const next = { ...item };
					ensurePair(next, 'srcMobile', 'src');
					return next;
				});
			}
			break;
		case 'free-canvas': {
			clone.minHeightDesktop =
				Number(clone.minHeightDesktop ?? clone.heightDesktop ?? clone.height ?? 400) || 0;
			clone.maxHeightDesktop =
				clone.maxHeightDesktop === null || clone.maxHeightDesktop === undefined
					? null
					: Number(clone.maxHeightDesktop);
			if (!Number.isFinite(clone.maxHeightDesktop)) clone.maxHeightDesktop = null;
			clone.minHeightMobile =
				Number(clone.minHeightMobile ?? clone.heightMobile ?? clone.height ?? 400) || 0;
			clone.maxHeightMobile =
				clone.maxHeightMobile === null || clone.maxHeightMobile === undefined
					? null
					: Number(clone.maxHeightMobile);
			if (!Number.isFinite(clone.maxHeightMobile)) clone.maxHeightMobile = null;
			clone.baseWidthDesktop = Number(clone.baseWidthDesktop) || 1440;
			clone.baseWidthMobile = Number(clone.baseWidthMobile) || 375;
			clone.backgroundSource = ['image', 'video'].includes(clone.backgroundSource)
				? clone.backgroundSource
				: 'color';
			const legacyColor = clone.backgroundColor ?? '#000000';
			clone.backgroundColorDesktop = clone.backgroundColorDesktop ?? legacyColor;
			clone.backgroundColorMobile = clone.backgroundColorMobile ?? clone.backgroundColorDesktop;
			clone.backgroundColor = clone.backgroundColorDesktop;
			clone.backgroundImageDesktop = clone.backgroundImageDesktop || '';
			clone.backgroundImageMobile = clone.backgroundImageMobile || '';
			clone.backgroundVideoDesktop = clone.backgroundVideoDesktop || '';
			clone.backgroundVideoMobile = clone.backgroundVideoMobile || '';
			clone.backgroundVideoPosterDesktop = clone.backgroundVideoPosterDesktop || '';
			clone.backgroundVideoPosterMobile = clone.backgroundVideoPosterMobile || '';
			clone.videoAutoplay = clone.videoAutoplay === undefined ? true : Boolean(clone.videoAutoplay);
			clone.videoLoop = clone.videoLoop === undefined ? true : Boolean(clone.videoLoop);
			clone.videoMuted = clone.videoMuted === undefined ? true : Boolean(clone.videoMuted);

			delete clone.widthDesktop;
			delete clone.widthMobile;
			delete clone.heightDesktop;
			delete clone.heightMobile;

			if (!Array.isArray(clone.items)) {
				clone.items = [];
				break;
			}
			clone.items = clone.items
				.map((item) => {
					if (!item || typeof item !== 'object') return null;
					const desktop = item.desktop && typeof item.desktop === 'object' ? item.desktop : {};
					const mobile = item.mobile && typeof item.mobile === 'object' ? item.mobile : {};
					const type = item.type || 'text';
					const baseAutoHeight = type === 'text';
					const normalizeId = (value) =>
						value === undefined || value === null ? '' : String(value).trim();
					return {
						id: item.id || `free-${Date.now()}`,
						type,
						content: item.content || '',
						src: item.src || '',
						srcMobile: item.srcMobile || '',
						alt: item.alt || '',
						poster: item.poster || '',
						posterMobile: item.posterMobile || '',
						autoplay: item.autoplay === undefined ? type === 'video' : Boolean(item.autoplay),
						loop: item.loop === undefined ? type === 'video' : Boolean(item.loop),
						muted: item.muted === undefined ? true : Boolean(item.muted),
						skipDFP: item.skipDFP === undefined ? false : Boolean(item.skipDFP),
						videoId: normalizeId(item.videoId),
						videoIdDesktop: normalizeId(item.videoIdDesktop),
						videoIdMobile: normalizeId(item.videoIdMobile),
						objectFit: item.objectFit || 'cover',
						autoHeight: item.autoHeight === undefined ? baseAutoHeight : Boolean(item.autoHeight),
						textStyles: { ...(item.textStyles || {}) },
						desktop: {
							x: Number(desktop.x) || 0,
							y: Number(desktop.y) || 0,
							width: Number(desktop.width) || 200,
							height: Number(desktop.height) || 120,
							z: Number(desktop.z) || 1,
							opacity: desktop.opacity === undefined ? 1 : Number(desktop.opacity)
						},
						mobile: {
							x: Number(mobile.x) || 0,
							y: Number(mobile.y) || 0,
							width: Number(mobile.width) || 200,
							height: Number(mobile.height) || 120,
							z: Number(mobile.z) || 1,
							opacity: mobile.opacity === undefined ? 1 : Number(mobile.opacity)
						}
					};
				})
				.filter(Boolean);
			break;
		}
	}

	return clone;
}

export function createBlockInstance(type) {
	const definition = getComponentDefinition(type);
	const baseData = definition?.defaultData ? structuredClone(definition.defaultData) : { type };
	const { section, ...rest } = baseData;

	return {
		__id: `${type}-${Date.now()}-${blockCounter++}`,
		...rest,
		section: ensureSectionDefaults(section)
	};
}

export function cloneStory(value = {}) {
	return structuredClone({
		...storyDefaults,
		...value,
		share: {
			...storyDefaults.share,
			...(value?.share || {})
		},
		seo: {
			...storyDefaults.seo,
			...(value?.seo || {})
		},
		appearance: {
			...storyDefaults.appearance,
			...(value?.appearance || {}),
			pagePadding: {
				...storyDefaults.appearance.pagePadding,
				...(value?.appearance?.pagePadding || {})
			},
			typography: mergeTypography(
				storyDefaults.appearance.typography,
				value?.appearance?.typography
			)
		},
		analytics: {
			...storyDefaults.analytics,
			...(value?.analytics || {})
		},
		intro: {
			...storyDefaults.intro,
			...(value?.intro || {})
		},
		credits: {
			...storyDefaults.credits,
			...(value?.credits || {}),
			sources: Array.isArray(value?.credits?.sources)
				? structuredClone(value.credits.sources)
				: [...storyDefaults.credits.sources],
			authors: Array.isArray(value?.credits?.authors)
				? structuredClone(value.credits.authors)
				: [...storyDefaults.credits.authors],
			editedBy: Array.isArray(value?.credits?.editedBy)
				? structuredClone(value.credits.editedBy)
				: [...storyDefaults.credits.editedBy],
			additionalGraphics: Array.isArray(value?.credits?.additionalGraphics)
				? structuredClone(value.credits.additionalGraphics)
				: [...storyDefaults.credits.additionalGraphics],
			sections: Array.isArray(value?.credits?.sections)
				? structuredClone(value.credits.sections)
				: [...storyDefaults.credits.sections]
		},
		paragraphs: []
	});
}

export function normalizeStory(value = {}) {
	const story = cloneStory(value);

	const paragraphs = Array.isArray(value?.paragraphs) ? value.paragraphs : [];
	story.paragraphs = paragraphs.map((paragraph) => ({
		__id: paragraph.__id || `${paragraph.type || 'block'}-${Date.now()}-${blockCounter++}`,
		...(() => {
			const clone = ensureBlockShadows(structuredClone(paragraph));
			const withDefaults = applyBlockDefaults(clone);
			const { section: blockSection, ...rest } = withDefaults || {};
			return {
				...rest,
				section: ensureSectionDefaults(paragraph?.section ?? blockSection)
			};
		})()
	}));

	return story;
}

export function getByPath(target, path) {
	if (!path) return target;
	return path.split('.').reduce((acc, segment) => {
		if (acc && typeof acc === 'object') {
			return acc[segment];
		}
		return undefined;
	}, target);
}

export function setByPath(target, path, value) {
	const segments = path.split('.');
	const last = segments.pop();
	let current = target;

	for (const segment of segments) {
		if (!current[segment] || typeof current[segment] !== 'object') {
			current[segment] = {};
		}
		current = current[segment];
	}

	current[last] = value;
}

export function removeInternalFields(data) {
	if (Array.isArray(data)) {
		return data.map((item) => removeInternalFields(item));
	}

	if (data && typeof data === 'object') {
		const result = {};
		for (const [key, value] of Object.entries(data)) {
			if (key === '__id') continue;
			result[key] = removeInternalFields(value);
		}
		return result;
	}

	return data;
}

export function sanitizeStoryForExport(data) {
	const sanitized = removeInternalFields(data);
	if (!Array.isArray(sanitized.paragraphs)) {
		sanitized.paragraphs = [];
	} else {
		sanitized.paragraphs = sanitized.paragraphs
			.map((paragraph) => ensureBlockShadows(paragraph))
			.map(ensureMediaVariants);
	}
	return sanitized;
}

export function parseJsonField(value, fallback) {
	if (value === '' || value === undefined || value === null) {
		return fallback;
	}
	if (typeof value !== 'string') {
		return value;
	}
	try {
		return JSON.parse(value);
	} catch (error) {
		return fallback;
	}
}

function buildHeadingCSS(selector, config = {}) {
	if (!config) return '';
	const baseRules = [];
	const mobileRules = [];

	if (config.fontFamily) baseRules.push(`font-family: ${config.fontFamily};`);
	if (config.fontWeight) baseRules.push(`font-weight: ${config.fontWeight};`);
	if (config.textTransform) baseRules.push(`text-transform: ${config.textTransform};`);
	if (config.color) baseRules.push(`color: ${config.color};`);
	if (config.desktop?.fontSize) baseRules.push(`font-size: ${config.desktop.fontSize};`);
	if (config.desktop?.lineHeight) baseRules.push(`line-height: ${config.desktop.lineHeight};`);
	if (config.desktop?.letterSpacing)
		baseRules.push(`letter-spacing: ${config.desktop.letterSpacing};`);

	if (config.mobile?.fontSize) mobileRules.push(`font-size: ${config.mobile.fontSize};`);
	if (config.mobile?.lineHeight) mobileRules.push(`line-height: ${config.mobile.lineHeight};`);
	if (config.mobile?.letterSpacing)
		mobileRules.push(`letter-spacing: ${config.mobile.letterSpacing};`);
	if (config.mobile?.color) mobileRules.push(`color: ${config.mobile.color};`);

	let css = '';
	if (baseRules.length) {
		css += `${selector} { ${baseRules.join(' ')} }\n`;
	}
	if (mobileRules.length) {
		css += `@media (max-width: 768px) { ${selector} { ${mobileRules.join(' ')} } }\n`;
	}
	return css;
}

function buildBlockquoteCSS(scope, config = {}) {
	if (!config) return '';
	const scopePrefix = scope && scope.length ? `${scope} ` : '';
	const textSelector = `${scopePrefix}:global(.quote-text)`;
	const containerSelector = `${scopePrefix}:global(.quote-container)`;
	const authorSelector = `${scopePrefix}:global(.quote-attribution .author-name)`;
	const lineSelector = `${scopePrefix}:global(.attribution-line)`;

	const baseTextRules = [];
	const mobileTextRules = [];

	if (config.fontFamily) baseTextRules.push(`font-family: ${config.fontFamily};`);
	if (config.color) baseTextRules.push(`color: ${config.color};`);
	if (config.desktop?.fontSize) baseTextRules.push(`font-size: ${config.desktop.fontSize};`);
	if (config.desktop?.lineHeight) baseTextRules.push(`line-height: ${config.desktop.lineHeight};`);

	if (config.mobile?.fontSize) mobileTextRules.push(`font-size: ${config.mobile.fontSize};`);
	if (config.mobile?.lineHeight) mobileTextRules.push(`line-height: ${config.mobile.lineHeight};`);
	if (config.mobile?.color) mobileTextRules.push(`color: ${config.mobile.color};`);

	const containerRules = [];
	if (config.background) containerRules.push(`background: ${config.background};`);
	if (config.borderColor) containerRules.push(`border-color: ${config.borderColor};`);

	let css = '';
	if (baseTextRules.length) {
		css += `${textSelector} { ${baseTextRules.join(' ')} }\n`;
	}
	if (mobileTextRules.length) {
		css += `@media (max-width: 768px) { ${textSelector} { ${mobileTextRules.join(' ')} } }\n`;
	}
	if (containerRules.length) {
		css += `${containerSelector} { ${containerRules.join(' ')} }\n`;
	}
	if (config.accentColor) {
		css += `${authorSelector} { color: ${config.accentColor}; }\n`;
		css += `${lineSelector} { background: linear-gradient(90deg, ${config.accentColor}, transparent); }\n`;
	}
	return css;
}

function buildVariantCSS(selector, config = {}) {
	if (!config) return '';
	const baseRules = [];
	const mobileRules = [];

	if (config.fontFamily) baseRules.push(`font-family: ${config.fontFamily};`);
	if (config.fontWeight) baseRules.push(`font-weight: ${config.fontWeight};`);
	if (config.fontStyle) baseRules.push(`font-style: ${config.fontStyle};`);
	if (config.textTransform) baseRules.push(`text-transform: ${config.textTransform};`);
	if (config.letterSpacing) baseRules.push(`letter-spacing: ${config.letterSpacing};`);
	if (config.color) baseRules.push(`color: ${config.color};`);
	if (config.desktop?.fontSize) baseRules.push(`font-size: ${config.desktop.fontSize};`);
	if (config.desktop?.lineHeight) baseRules.push(`line-height: ${config.desktop.lineHeight};`);
	if (config.desktop?.letterSpacing)
		baseRules.push(`letter-spacing: ${config.desktop.letterSpacing};`);

	if (config.mobile?.fontSize) mobileRules.push(`font-size: ${config.mobile.fontSize};`);
	if (config.mobile?.lineHeight) mobileRules.push(`line-height: ${config.mobile.lineHeight};`);
	if (config.mobile?.letterSpacing)
		mobileRules.push(`letter-spacing: ${config.mobile.letterSpacing};`);
	if (config.mobile?.color) mobileRules.push(`color: ${config.mobile.color};`);

	let css = '';
	if (baseRules.length) {
		css += `${selector} { ${baseRules.join(' ')} }\n`;
	}
	if (mobileRules.length) {
		css += `@media (max-width: 768px) { ${selector} { ${mobileRules.join(' ')} } }\n`;
	}
	return css;
}

export function buildTypographyCSS(typography = {}, scope = '.story-page') {
	if (!typography || typeof typography !== 'object') return '';
	const effectiveScope = scope && scope.trim().length ? scope.trim() : '';
	const selectorFor = (tag) =>
		effectiveScope ? `${effectiveScope} :global(${tag})` : `:global(${tag})`;

	const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
	let css = '';

	for (const tag of headings) {
		const config = typography[tag];
		if (!config) continue;
		css += buildHeadingCSS(selectorFor(tag), config);
	}

	if (typography.blockquote) {
		css += buildBlockquoteCSS(effectiveScope || '', typography.blockquote);
	}

	if (typography.body) {
		const selector = effectiveScope
			? `${effectiveScope} :global(p), ${effectiveScope} :global(.story-text--body .story-text__content)`
			: `:global(p), :global(.story-text--body .story-text__content)`;
		css += buildVariantCSS(selector, typography.body);
	}

	if (typography.lead) {
		const selector = effectiveScope
			? `${effectiveScope} :global(.story-text--lead .story-text__content)`
			: `:global(.story-text--lead .story-text__content)`;
		css += buildVariantCSS(selector, typography.lead);
	}

	if (typography.small) {
		const selector = effectiveScope
			? `${effectiveScope} :global(.text-small), ${effectiveScope} :global(small)`
			: `:global(.text-small), :global(small)`;
		css += buildVariantCSS(selector, typography.small);
	}

	if (typography.caption) {
		const selector = effectiveScope
			? `${effectiveScope} :global(figcaption), ${effectiveScope} :global(.caption)`
			: `:global(figcaption), :global(.caption)`;
		css += buildVariantCSS(selector, typography.caption);
	}

	if (typography.annotation) {
		const selector = effectiveScope
			? `${effectiveScope} :global(.annotation), ${effectiveScope} :global(.note)`
			: `:global(.annotation), :global(.note)`;
		css += buildVariantCSS(selector, typography.annotation);
	}

	return css.trim();
}
