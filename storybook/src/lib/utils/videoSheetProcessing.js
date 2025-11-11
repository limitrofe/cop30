import { sanitizeHeader } from './googleSheets.js';

export function normalizeText(value) {
	if (value === undefined || value === null) return '';
	return String(value)
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();
}

export function normalizeValue(value) {
	return normalizeText(value);
}

export function isMeaningful(value) {
	return value !== undefined && value !== null && String(value).trim() !== '';
}

export function firstMeaningful(...values) {
	for (const value of values ?? []) {
		if (isMeaningful(value)) {
			return String(value).trim();
		}
	}
	return '';
}

export function createLabelLookup(map = {}) {
	const lookup = new Map();
	if (!map || typeof map !== 'object') return lookup;
	for (const [key, label] of Object.entries(map)) {
		const normalizedKey = normalizeValue(key);
		if (!normalizedKey) continue;
		lookup.set(normalizedKey, label);
	}
	return lookup;
}

export function flattenColumns(value) {
	const result = [];
	if (!value) return result;
	const stack = Array.isArray(value) ? value : [value];
	for (const item of stack) {
		if (Array.isArray(item)) {
			result.push(...flattenColumns(item));
		} else if (item) {
			result.push(item);
		}
	}
	return result;
}

export function dedupeList(list) {
	if (!Array.isArray(list)) return [];
	const seen = new Set();
	const output = [];
	for (const item of list) {
		const key = typeof item === 'string' ? item : JSON.stringify(item);
		if (seen.has(key)) continue;
		seen.add(key);
		output.push(item);
	}
	return output;
}

export function createColumnResolver(meta, rows) {
	const availableKeys = new Set();
	if (rows && rows.length) {
		for (const key of Object.keys(rows[0])) {
			availableKeys.add(key);
		}
	}
	const lookup = meta?.headerLookup ?? {};
	return (columnName) => {
		const name = typeof columnName === 'string' ? columnName.trim() : '';
		if (!name) return null;
		if (lookup[name]) return lookup[name];
		if (availableKeys.has(name)) return name;
		const sanitized = sanitizeHeader(name);
		if (availableKeys.has(sanitized)) return sanitized;
		return null;
	};
}

export function resolveColumnKey(resolver, candidate) {
	if (!resolver || !candidate) return null;
	if (Array.isArray(candidate)) {
		for (const option of candidate) {
			const resolved = resolveColumnKey(resolver, option);
			if (resolved) return resolved;
		}
		return null;
	}
	return resolver(candidate);
}

export function normalizeFilterColumn(entry) {
	if (!entry) return null;
	if (typeof entry === 'string' || Array.isArray(entry)) {
		return { column: entry };
	}
	if (typeof entry === 'object' && entry.column) {
		return { column: entry.column, labelMap: entry.labelMap ?? null };
	}
	return null;
}

export function firstString(value) {
	if (typeof value === 'string') return value;
	if (Array.isArray(value)) {
		return value.find((item) => typeof item === 'string') ?? '';
	}
	return '';
}

export function getLabel(value, map, fallback) {
	const normalized = normalizeValue(value);
	if (normalized && map.has(normalized)) {
		return map.get(normalized);
	}
	if (isMeaningful(value)) return value;
	return fallback ?? '';
}

export function getColumnValue(row, key) {
	if (!key) return null;
	return row?.[key] ?? null;
}

export function buildVideoFilters(row, resolvedColumnsList, fallbackLabelMap) {
	const filters = [];
	if (!resolvedColumnsList?.length) return filters;
	for (const column of resolvedColumnsList) {
		const value = getColumnValue(row, column.key);
		if (!isMeaningful(value)) continue;
		const normalized = normalizeValue(value);
		if (!normalized) continue;
		const label =
			column.valueMap?.get(normalized) ?? fallbackLabelMap.get(normalized) ?? String(value).trim();
		filters.push({
			id: `${column.key}::${normalized}`,
			label,
			value,
			normalized,
			columnKey: column.key,
			columnOriginal: column.original
		});
	}
	return filters;
}

export function parseDateFlexible(value) {
	if (!isMeaningful(value)) return null;
	const raw = String(value).trim();

	const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (isoMatch) {
		const [_, y, m, d] = isoMatch;
		const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
		return Number.isNaN(date.getTime()) ? null : date;
	}

	const brMatch = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
	if (brMatch) {
		let [_, d, m, y] = brMatch;
		if (y.length === 2) {
			y = `20${y}`;
		}
		const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
		return Number.isNaN(date.getTime()) ? null : date;
	}

	const parsed = new Date(raw);
	if (!Number.isNaN(parsed.getTime())) {
		return parsed;
	}

	return null;
}

export function normalizeDateToISO(value) {
	const date = parseDateFlexible(value);
	if (!date) return '';
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
		date.getUTCDate()
	).padStart(2, '0')}`;
}

export function formatDateForDisplay(value) {
	const date = parseDateFlexible(value);
	if (!date) return isMeaningful(value) ? String(value).trim() : '';
	return date.toLocaleDateString('pt-BR', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	});
}

export function buildSearchTokens(row, searchColumns, filters = [], linkValue, publishedAtRaw) {
	const tokens = new Set();
	for (const key of searchColumns ?? []) {
		const value = getColumnValue(row, key);
		const normalized = normalizeValue(value);
		if (normalized) tokens.add(normalized);
	}
	for (const filter of filters) {
		tokens.add(filter.normalized);
		tokens.add(normalizeValue(filter.label));
	}
	if (isMeaningful(linkValue)) {
		tokens.add(normalizeValue(linkValue));
	}
	if (isMeaningful(publishedAtRaw)) {
		tokens.add(normalizeValue(publishedAtRaw));
	}
	return Array.from(tokens);
}

export function createVideoRecord({
	row,
	index,
	resolvedColumns,
	resolvedFilterColumns,
	resolvedSearchColumns,
	sectionLabelLookup,
	filterLabelLookup,
	highlightValueSet,
	sectionsResolved
}) {
	const primaryId = getColumnValue(row, resolvedColumns.id);
	const desktopId = getColumnValue(row, resolvedColumns.desktopId);
	const mobileId = getColumnValue(row, resolvedColumns.mobileId);
	const chosenId = isMeaningful(primaryId)
		? primaryId
		: isMeaningful(desktopId)
			? desktopId
			: mobileId;

	if (!isMeaningful(chosenId)) {
		return null;
	}

	const title = getColumnValue(row, resolvedColumns.title) || `Video ${index + 1}`;
	const subtitle = getColumnValue(row, resolvedColumns.subtitle);
	const description = getColumnValue(row, resolvedColumns.description);
	const thumbnailValue = getColumnValue(row, resolvedColumns.thumbnail);
	const tagValue = getColumnValue(row, resolvedColumns.tag);
	const sectionValue = getColumnValue(row, resolvedColumns.section);
	const linkValue = getColumnValue(row, resolvedColumns.link);
	const publishedAtRaw = getColumnValue(row, resolvedColumns.publishedAt);

	const filters = buildVideoFilters(row, resolvedFilterColumns, filterLabelLookup);
	const filterIds = new Set(filters.map((filter) => filter.id));

	const sectionLabel = getLabel(sectionValue, sectionLabelLookup, sectionsResolved.fallbackLabel);
	const sectionNormalized = normalizeValue(sectionValue) || '__sem_categoria__';
	const sectionAnchor = sanitizeHeader(sectionLabel || sectionValue || `secao_${index + 1}`);

	const highlightReference =
		resolvedColumns.highlight && isMeaningful(getColumnValue(row, resolvedColumns.highlight))
			? getColumnValue(row, resolvedColumns.highlight)
			: sectionValue;
	const highlight = highlightValueSet.size
		? highlightValueSet.has(normalizeValue(highlightReference))
		: false;

	const searchTokens = buildSearchTokens(
		row,
		resolvedSearchColumns,
		filters,
		linkValue,
		publishedAtRaw
	);
	const publishedAtISO = normalizeDateToISO(publishedAtRaw);
	const publishedAtDisplay = formatDateForDisplay(publishedAtRaw);

	return {
		uuid: `${sanitizeHeader(chosenId)}_${index}`,
		index,
		globoId: String(chosenId).trim(),
		globoIdDesktop: isMeaningful(desktopId) ? String(desktopId).trim() : null,
		globoIdMobile: isMeaningful(mobileId) ? String(mobileId).trim() : null,
		title: String(title).trim(),
		subtitle: isMeaningful(subtitle) ? String(subtitle).trim() : '',
		description: isMeaningful(description) ? String(description).trim() : '',
		thumbnail: isMeaningful(thumbnailValue) ? String(thumbnailValue).trim() : '',
		tag: isMeaningful(tagValue) ? String(tagValue).trim() : '',
		link: isMeaningful(linkValue) ? String(linkValue).trim() : '',
		publishedAtRaw,
		publishedAtISO,
		publishedAtDisplay,
		filters,
		filterIds,
		section: {
			value: sectionValue,
			label: sectionLabel || sectionsResolved.fallbackLabel,
			normalized: sectionNormalized,
			anchor: sectionAnchor
		},
		highlight,
		searchTokens,
		row
	};
}

export function buildFilterOptions(videos, columns, config) {
	if (!videos?.length || !columns?.length) return [];
	const map = new Map();
	for (const video of videos) {
		for (const filter of video.filters) {
			if (!map.has(filter.id)) {
				map.set(filter.id, {
					id: filter.id,
					label: filter.label,
					value: filter.value,
					columnKey: filter.columnKey,
					columnOriginal: filter.columnOriginal,
					count: 0
				});
			}
			map.get(filter.id).count += 1;
		}
	}

	const options = Array.from(map.values()).sort((a, b) =>
		String(a.label).localeCompare(String(b.label), 'pt-BR', { sensitivity: 'base' })
	);

	if (config.includeAll === false) {
		return options;
	}

	const allOption = {
		id: 'all',
		label: config.allLabel ?? 'Tudo',
		value: null,
		columnKey: null,
		isAll: true,
		count: videos.length
	};

	return [allOption, ...options];
}

export function buildHighlightSection(videos, sectionsConfig, highlightValues, layoutResolved) {
	const highlightConfig = sectionsConfig?.highlight;
	if (!highlightConfig || !highlightValues.size) return null;

	const items = videos.filter((video) => video.highlight);
	if (!items.length) return null;

	const limit = highlightConfig.limit ?? layoutResolved.highlightLimit ?? items.length;
	const limited = items.slice(0, limit);

	return {
		label: highlightConfig.label ?? 'Destaque',
		anchor: sanitizeHeader(highlightConfig.anchor ?? highlightConfig.label ?? 'destaque'),
		videos: limited
	};
}

export function buildSections(videos, sectionsConfig) {
	if (!videos?.length) return [];
	const groups = new Map();
	for (const video of videos) {
		const key = video.section?.normalized ?? '__sem_categoria__';
		if (!groups.has(key)) {
			groups.set(key, {
				key,
				label: video.section?.label ?? sectionsConfig.fallbackLabel ?? 'Outros videos',
				anchor: video.section?.anchor ?? sanitizeHeader(`secao_${key}`),
				videos: []
			});
		}
		groups.get(key).videos.push(video);
	}

	const ordered = [];
	for (const entry of sectionsConfig.order ?? []) {
		const normalized = normalizeValue(entry);
		if (groups.has(normalized)) {
			ordered.push(groups.get(normalized));
			groups.delete(normalized);
		}
	}

	const remaining = Array.from(groups.values()).sort((a, b) =>
		String(a.label).localeCompare(String(b.label), 'pt-BR', { sensitivity: 'base' })
	);

	return [...ordered, ...remaining];
}

export function buildFeedSourceVideos({ highlightSection, regularSections, filteredVideos }) {
	const sequence = [];
	const seen = new Set();

	const pushVideo = (video) => {
		if (!video || seen.has(video.uuid)) return;
		seen.add(video.uuid);
		sequence.push(video);
	};

	if (highlightSection?.videos?.length) {
		for (const video of highlightSection.videos) {
			pushVideo(video);
		}
	}

	if (regularSections?.length) {
		for (const section of regularSections) {
			for (const video of section.videos) {
				pushVideo(video);
			}
		}
	} else if (filteredVideos?.length) {
		for (const video of filteredVideos) {
			pushVideo(video);
		}
	}

	return sequence;
}

export function buildShortzVideos({
	base = [],
	leadVideoId = null,
	seenSet = new Set(),
	seed = 0,
	lastLeadId = null,
	shuffle = true
} = {}) {
	if (!base.length) return [];

	const seen = [];
	const unseen = [];
	let leadVideo = null;

	for (const video of base) {
		if (!video?.uuid) continue;
		if (leadVideoId && video.uuid === leadVideoId) {
			leadVideo = video;
		} else if (seenSet.has(video.uuid)) {
			seen.push(video);
		} else {
			unseen.push(video);
		}
	}

	const random = shuffle ? createSeededRandom(seed || Date.now()) : null;

	const unseenOrdered = shuffle ? shuffleList(unseen, random ?? Math.random) : unseen;
	const seenOrdered = shuffle ? shuffleList(seen, random ?? Math.random) : seen;
	const output = [];

	if (leadVideo) {
		output.push(leadVideo);
	} else if (unseenOrdered.length === 0 && seenOrdered.length > 0) {
		moveFirstDifferent(seenOrdered, lastLeadId);
	}

	output.push(...unseenOrdered);
	output.push(...seenOrdered);

	if (!output.length && leadVideo) {
		output.push(leadVideo);
	}

	return output;
}

export function shuffleList(list = [], randomFn = Math.random) {
	if (!Array.isArray(list) || list.length <= 1) {
		return Array.isArray(list) ? [...list] : [];
	}
	const output = [...list];
	for (let index = output.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(randomFn() * (index + 1));
		const temp = output[index];
		output[index] = output[swapIndex];
		output[swapIndex] = temp;
	}
	return output;
}

export function moveFirstDifferent(list, forbiddenId) {
	if (!Array.isArray(list) || list.length <= 1) return;
	if (!forbiddenId) return;
	if (!list[0]?.uuid || list[0].uuid !== forbiddenId) return;
	for (let index = 1; index < list.length; index += 1) {
		const candidate = list[index];
		if (candidate?.uuid && candidate.uuid !== forbiddenId) {
			const first = list[0];
			list[0] = candidate;
			list[index] = first;
			return;
		}
	}
}

export function createSeededRandom(seedInput) {
	let seed = Number(seedInput) >>> 0;
	if (!seed) {
		seed = 0x517cc1b7;
	}
	return () => {
		seed = (seed + 0x6d2b79f5) | 0;
		let result = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result;
		return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
	};
}
