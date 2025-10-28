<script>
	import { onMount, onDestroy, createEventDispatcher, tick } from 'svelte';
	import { browser } from '$app/environment';
	import GloboPlayer from './GloboPlayer.svelte';
	import { fetchGoogleSheet, sanitizeHeader } from '$lib/utils/googleSheets.js';

	const dispatch = createEventDispatcher();

	export let sheetUrl = '';
	export let sheetId = '';
	export let sheetName = '';
	export let gid = '';
	export let query = '';
	export let fetchOnMount = true;
	export let fetchHeaders = {};
	export let fetcher = null;
	export let initialData = null;

	export let filtersConfig = {};
	export let searchConfig = {};
	export let sectionsConfig = {};
	export let videoConfig = {};
	export let layoutConfig = {};

	export let emptyStateMessage = 'Nenhum video encontrado para os filtros selecionados.';
	export let loadingMessage = 'Carregando videos...';
	export let debug = false;

	let loading = !initialData;
	let error = null;
	let sheetRows = initialData?.rows ?? [];
	let sheetMeta = initialData?.meta ?? null;

	let hasMounted = false;
	let lastFetchKey = '';
	let abortController;

	let searchTerm = '';
	let activeSearchTerm = '';
	let activeSearchNormalized = '';
	let shouldApplySearch = false;
	let searchHasSubmitted = false;

	let filterMode = 'single';
	let filterMatchStrategy = 'OR';
	let filterOptions = [];
	let userTouchedFilters = false;
	let activeFilterId = null;
	let activeFilterIds = new Set();

	let videos = [];
	let filteredVideos = [];
	let highlightSection = null;
	let regularSections = [];

	let totalVideos = 0;
let totalVisible = 0;

let controlsStuck = false;
let sentinelElement;

let viewportWidth = 1280;
let isMobileFeed = false;
let mobileFeedContainer = null;
let lastMobileFeedContainer = null;
let feedObserver = null;
const feedItemElements = new Map();
let activeFeedId = null;
let feedVideos = [];
let resizeCleanup = null;
let mobileFeedStyles = '';
const feedPlayerControls = new Map();
let feedPlaybackVersion = 0;
let feedOverlayMode = 'none';
let feedOverlayVisible = false;
let feedInitialized = false;
let snapInProgress = false;
let snapTimeoutId;
let searchInputRef;
let mobileViewMode = 'feed';

const defaultFiltersConfig = {
		columns: [],
		includeAll: true,
		allLabel: 'Tudo',
		mode: 'single',
		match: 'OR',
		labelMap: {},
		defaultValue: null,
		includeCounts: false
	};

	const defaultSearchConfig = {
		columns: [],
		placeholder: 'Busque pelo tema ou titulo do video',
		minLength: 0,
		instant: false
	};

	const defaultSectionsConfig = {
		column: null,
		order: [],
		labelMap: {},
		fallbackLabel: 'Outros videos',
		highlight: null
	};

	const defaultHighlightConfig = {
		column: null,
		values: ['destaque', 'highlight', 'sim', 'true', '1'],
		label: 'Destaque',
		limit: 6,
		retainInSections: false,
		anchor: 'destaque'
	};

const defaultVideoConfig = {
	id: ['video_id', 'id'],
	mobileId: null,
	desktopId: null,
	title: ['titulo', 'title'],
	subtitle: ['subtitulo', 'subtitle'],
	description: ['descricao', 'description'],
	tag: ['tag', 'tema', 'category'],
	section: ['secao', 'categoria', 'bloco'],
	publishedAt: ['data', 'data_publicacao', 'data_de_publicacao'],
	link: ['link', 'url', 'links'],
	searchTokensExtra: []
};

const defaultLayoutConfig = {
	stickyOffset: 0,
	showCounts: false,
	highlightLimit: null,
	cardsPerRowMobile: 1,
	cardsPerRowTablet: 2,
	cardsPerRowDesktop: 4,
	cardGap: '1.25rem',
	enableMobileFeed: true,
	mobileDefaultView: 'feed',
	mobileFeedMaxWidth: 768,
	mobileFeedTitleColor: '#ffffff',
	mobileFeedMetaColor: 'rgba(255,255,255,0.78)',
	mobileFeedTagColor: '#111827',
	mobileFeedTagBackground: 'rgba(255,255,255,0.92)',
	mobileFeedOverlay: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(8,12,24,0.78) 62%, rgba(8,12,24,0.92) 100%)'
};

	$: filtersResolved = { ...defaultFiltersConfig, ...(filtersConfig || {}) };
	$: searchResolved = { ...defaultSearchConfig, ...(searchConfig || {}) };
$: sectionsResolved = {
	...defaultSectionsConfig,
	...(sectionsConfig || {})
};
$: sectionsResolved.highlight = sectionsResolved.highlight
	? { ...defaultHighlightConfig, ...sectionsResolved.highlight }
	: null;
$: videoResolved = { ...defaultVideoConfig, ...(videoConfig || {}) };
$: layoutResolved = { ...defaultLayoutConfig, ...(layoutConfig || {}) };
$: mobileFeedStyles = [
	`--mobile-feed-title:${layoutResolved.mobileFeedTitleColor ?? '#ffffff'}`,
	`--mobile-feed-meta:${layoutResolved.mobileFeedMetaColor ?? 'rgba(255,255,255,0.8)'}`,
	`--mobile-feed-tag-color:${layoutResolved.mobileFeedTagColor ?? '#111827'}`,
	`--mobile-feed-tag-background:${
		layoutResolved.mobileFeedTagBackground ?? 'rgba(255,255,255,0.92)'
	}`,
	`--mobile-feed-overlay:${layoutResolved.mobileFeedOverlay ?? 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(8,12,24,0.78) 62%, rgba(8,12,24,0.92) 100%)'}`
].join(';');
$: {
	if (layoutResolved.highlightLimit && sectionsResolved.highlight) {
		sectionsResolved.highlight.limit = layoutResolved.highlightLimit;
	}
}

$: if (!hasMounted) {
	mobileViewMode = layoutResolved.mobileDefaultView === 'grid' ? 'grid' : 'feed';
}

$: filterMode = filtersResolved.mode === 'multiple' ? 'multiple' : 'single';
$: filterMatchStrategy = filtersResolved.match === 'AND' ? 'AND' : 'OR';

	$: filterLabelLookup = createLabelLookup(filtersResolved.labelMap);
	$: sectionLabelLookup = createLabelLookup(sectionsResolved.labelMap);
	$: highlightValueSet =
		sectionsResolved.highlight && Array.isArray(sectionsResolved.highlight.values)
			? new Set(sectionsResolved.highlight.values.map(normalizeValue).filter(Boolean))
			: new Set();

	$: normalizedFilterColumns = (filtersResolved.columns ?? [])
		.map(normalizeFilterColumn)
		.filter(Boolean);

	$: searchColumnCandidates = dedupeList(
		flattenColumns([
			searchResolved.columns,
			videoResolved.title,
			videoResolved.subtitle,
			videoResolved.description,
			videoResolved.searchTokensExtra
		]).filter(Boolean)
	);

$: columnResolver = createColumnResolver(sheetMeta, sheetRows);

$: resolvedColumns = {
	id: resolveColumnKey(columnResolver, videoResolved.id),
	mobileId: resolveColumnKey(columnResolver, videoResolved.mobileId),
	desktopId: resolveColumnKey(columnResolver, videoResolved.desktopId),
	title: resolveColumnKey(columnResolver, videoResolved.title),
	subtitle: resolveColumnKey(columnResolver, videoResolved.subtitle),
	description: resolveColumnKey(columnResolver, videoResolved.description),
	tag: resolveColumnKey(columnResolver, videoResolved.tag),
	section: resolveColumnKey(columnResolver, videoResolved.section),
	publishedAt: resolveColumnKey(columnResolver, videoResolved.publishedAt),
	link: resolveColumnKey(columnResolver, videoResolved.link),
	highlight: sectionsResolved.highlight
		? resolveColumnKey(columnResolver, sectionsResolved.highlight.column ?? videoResolved.section)
		: null
};

	$: resolvedFilterColumns = normalizedFilterColumns
		.map((columnConfig) => {
			const key = resolveColumnKey(columnResolver, columnConfig.column);
			if (!key) return null;
			const valueMap = columnConfig.labelMap
				? createLabelLookup(columnConfig.labelMap)
				: filterLabelLookup;
			return {
				key,
				original: firstString(columnConfig.column),
				valueMap
			};
		})
		.filter(Boolean);

	$: resolvedSearchColumns = searchColumnCandidates
		.map((column) => resolveColumnKey(columnResolver, column))
		.filter(Boolean);

	$: videos = sheetRows.length
		? sheetRows
				.map((row, index) =>
					createVideoRecord({
						row,
						index,
						resolvedColumns,
						resolvedFilterColumns,
						resolvedSearchColumns,
						sectionLabelLookup,
						filterLabelLookup,
						highlightValueSet,
						sectionsResolved
					})
				)
				.filter(Boolean)
		: [];

$: totalVideos = videos.length;

$: filterOptions = buildFilterOptions(videos, resolvedFilterColumns, filtersResolved, filterMode);

$: reconcileFilterSelection();

	$: {
		const next = applyFilters(videos);
		filteredVideos = next;
		totalVisible = next.length;
	}

	$: highlightSection = buildHighlightSection(
		filteredVideos,
		sectionsResolved,
		highlightValueSet,
		layoutResolved
	);

	$: highlightIds = new Set(
		highlightSection ? highlightSection.videos.map((video) => video.uuid) : []
	);

	$: videosForSections =
		sectionsResolved.highlight && highlightSection && !sectionsResolved.highlight.retainInSections
			? filteredVideos.filter((video) => !highlightIds.has(video.uuid))
			: filteredVideos;

$: regularSections = buildSections(videosForSections, sectionsResolved);
$: feedVideos = buildFeedVideos({
	highlightSection,
	regularSections,
	filteredVideos,
	sectionsResolved
});

$: if (isMobileFeed) {
	const hasActive = feedVideos.some((video) => video.uuid === activeFeedId);
	if (!hasActive) {
		activeFeedId = feedVideos[0]?.uuid ?? null;
	}
} else if (activeFeedId) {
	activeFeedId = null;
}

$: activeSearchNormalized = normalizeValue(activeSearchTerm);
$: shouldApplySearch =
	searchResolved.instant || activeSearchNormalized.length >= (searchResolved.minLength ?? 0);

$: isMobileFeed =
	layoutResolved.enableMobileFeed !== false &&
	mobileViewMode === 'feed' &&
	viewportWidth <= (layoutResolved.mobileFeedMaxWidth ?? 768);

$: feedOverlayVisible = isMobileFeed && feedOverlayMode !== 'none';

$: if (!isMobileFeed && feedOverlayMode !== 'none') {
	feedOverlayMode = 'none';
}

$: if (feedOverlayVisible && feedOverlayMode === 'search') {
	tick().then(() => {
		if (feedOverlayVisible && feedOverlayMode === 'search') {
			searchInputRef?.focus();
		}
	});
}

$: if (isMobileFeed && feedVideos.length) {
	if (!feedInitialized) {
		feedInitialized = true;
		if (!activeFeedId && feedVideos.length) {
			activeFeedId = feedVideos[0].uuid;
		}
		queueMicrotask(() => {
			if (!feedOverlayVisible) {
				snapActiveFeedVideo({ behavior: 'instant', force: true });
			}
		});
	}
} else if (isMobileFeed && !feedVideos.length) {
	activeFeedId = null;
} else if (!isMobileFeed && feedInitialized) {
	feedInitialized = false;
}

$: if (isMobileFeed && feedInitialized && activeFeedId && !snapInProgress && !feedOverlayVisible) {
	queueMicrotask(() => {
		if (!snapInProgress && !feedOverlayVisible) {
			snapActiveFeedVideo({ behavior: 'smooth' });
		}
	});
}



$: if (isMobileFeed && feedVideos.length && activeFeedId) {
	const stillExists = feedVideos.some((video) => video.uuid === activeFeedId);
	if (!stillExists) {
		activeFeedId = feedVideos[0].uuid;
	}
}

$: {
	const playbackSignal = `${isMobileFeed ? 1 : 0}|${activeFeedId ?? ''}|${feedPlaybackVersion}|${feedOverlayMode}|${snapInProgress ? 1 : 0}`;
	void playbackSignal;
	updateFeedPlayback();
}

onMount(() => {
	hasMounted = true;

	if (browser) {
		const updateViewport = () => {
			viewportWidth = window.innerWidth || 0;
		};
		updateViewport();
		const resizeHandler = () => updateViewport();
		window.addEventListener('resize', resizeHandler, { passive: true });
		resizeCleanup = () => {
			window.removeEventListener('resize', resizeHandler);
			resizeCleanup = null;
		};
	}

	if (fetchOnMount) {
		lastFetchKey = computeFetchKey();
		loadSheet();
	}
	setupObserver();
});

onDestroy(() => {
	abortController?.abort();
	cleanupObserver();
	resizeCleanup?.();
	teardownFeedObserver();
	clearTimeout(snapTimeoutId);
	feedPlayerControls.forEach((controls) => {
		try {
			controls.pause?.();
			controls.setMuted?.(true);
		} catch (error) {
			console.warn('VideoSheetShowcase: falha ao encerrar player', error);
		}
	});
	feedPlayerControls.clear();
});

	$: if (hasMounted && fetchOnMount) {
		const currentKey = computeFetchKey();
		if (currentKey !== lastFetchKey) {
			lastFetchKey = currentKey;
			loadSheet();
		}
	}

	function computeFetchKey() {
		return JSON.stringify({ sheetUrl, sheetId, sheetName, gid, query });
	}

	async function loadSheet() {
		if (!browser) return;

		abortController?.abort();
		abortController = new AbortController();

		loading = true;
		error = null;

		try {
			const result = await fetchGoogleSheet({
				sheetUrl,
				sheetId,
				sheetName,
				gid,
				query,
				fetcher: fetcher ?? fetch,
				headers: fetchHeaders,
				signal: abortController.signal
			});

			sheetRows = result.rows ?? [];
			sheetMeta = result.meta ?? null;
			dispatch('loaded', { total: sheetRows.length, meta: result.meta });
		} catch (err) {
			if (err?.name === 'AbortError') return;
			error = err?.message || 'Nao foi possivel carregar os dados do Google Sheets.';
			dispatch('error', { error: err });
		} finally {
			loading = false;
		}
	}

	export async function refresh() {
		if (!browser) return;
		await loadSheet();
	}

	function normalizeText(value) {
		if (value === undefined || value === null) return '';
		return String(value)
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase()
			.trim();
	}

	function normalizeValue(value) {
		return normalizeText(value);
	}

	function isMeaningful(value) {
		return value !== undefined && value !== null && String(value).trim() !== '';
	}

	function createLabelLookup(map = {}) {
		const lookup = new Map();
		if (!map || typeof map !== 'object') return lookup;
		for (const [key, label] of Object.entries(map)) {
			const normalizedKey = normalizeValue(key);
			if (!normalizedKey) continue;
			lookup.set(normalizedKey, label);
		}
		return lookup;
	}

	function flattenColumns(value) {
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

	function dedupeList(list = []) {
		const seen = new Set();
		const result = [];
		for (const item of list) {
			const key = JSON.stringify(item);
			if (seen.has(key)) continue;
			seen.add(key);
			result.push(item);
		}
		return result;
	}

	function createColumnResolver(meta, rows) {
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

	function resolveColumnKey(resolver, candidate) {
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

	function normalizeFilterColumn(entry) {
		if (!entry) return null;
		if (typeof entry === 'string' || Array.isArray(entry)) {
			return { column: entry };
		}
		if (typeof entry === 'object' && entry.column) {
			return { column: entry.column, labelMap: entry.labelMap ?? null };
		}
		return null;
	}

	function firstString(value) {
		if (typeof value === 'string') return value;
		if (Array.isArray(value)) {
			return value.find((item) => typeof item === 'string') ?? '';
		}
		return '';
	}

	function getLabel(value, map, fallback) {
		const normalized = normalizeValue(value);
		if (normalized && map.has(normalized)) {
			return map.get(normalized);
		}
		if (isMeaningful(value)) return value;
		return fallback ?? '';
	}

	function getColumnValue(row, key) {
		if (!key) return null;
		return row?.[key] ?? null;
	}

	function buildVideoFilters(row, resolvedColumnsList, fallbackLabelMap) {
		const filters = [];
		if (!resolvedColumnsList?.length) return filters;
		for (const column of resolvedColumnsList) {
			const value = getColumnValue(row, column.key);
			if (!isMeaningful(value)) continue;
			const normalized = normalizeValue(value);
			if (!normalized) continue;
			const label =
				column.valueMap?.get(normalized) ??
				fallbackLabelMap.get(normalized) ??
				String(value).trim();
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

	function parseDateFlexible(value) {
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

	function normalizeDateToISO(value) {
		const date = parseDateFlexible(value);
		if (!date) return '';
		return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
			date.getUTCDate()
		).padStart(2, '0')}`;
	}

	function formatDateForDisplay(value) {
		const date = parseDateFlexible(value);
		if (!date) return isMeaningful(value) ? String(value).trim() : '';
		return date.toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	function buildSearchTokens(row, searchColumns, filters = [], linkValue, publishedAtRaw) {
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

	function createVideoRecord({
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

	function buildFilterOptions(videos, columns, config, mode) {
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

		let options = Array.from(map.values()).sort((a, b) =>
			String(a.label).localeCompare(String(b.label), 'pt-BR', { sensitivity: 'base' })
		);

		if (mode !== 'multiple' && config.includeAll !== false) {
			options = [
				{
					id: 'all',
					label: config.allLabel ?? 'Tudo',
					value: null,
					columnKey: null,
					isAll: true,
					count: videos.length
				},
				...options
			];
		}

		return options;
	}

	function reconcileFilterSelection() {
		const optionIds = new Set(filterOptions.map((option) => option.id));

		if (filterMode === 'single') {
			if (!optionIds.size) {
				activeFilterId = null;
				return;
			}

			if (!userTouchedFilters) {
				const preferred = filtersResolved.defaultValue;
				const fallbacks = [
					preferred && optionIds.has(preferred) ? preferred : null,
					filtersResolved.includeAll !== false && optionIds.has('all') ? 'all' : null,
					filterOptions.find((option) => !option.isAll)?.id ?? null
				].filter(Boolean);
				const target = fallbacks[0] ?? null;
				if (target && activeFilterId !== target) {
					activeFilterId = target;
				}
			} else if (activeFilterId && !optionIds.has(activeFilterId)) {
				const fallback =
					(filtersResolved.includeAll !== false && optionIds.has('all') && 'all') ||
					filterOptions[0]?.id ||
					null;
				activeFilterId = fallback;
			}
		} else {
			const next = new Set();
			for (const id of activeFilterIds) {
				if (optionIds.has(id)) {
					next.add(id);
				}
			}
			if (!userTouchedFilters && (!next.size || !optionIds.size)) {
				const defaults = Array.isArray(filtersResolved.defaultValue)
					? filtersResolved.defaultValue
					: filtersResolved.defaultValue
						? [filtersResolved.defaultValue]
						: [];
				for (const id of defaults) {
					if (optionIds.has(id)) {
						next.add(id);
					}
				}
			}
			activeFilterIds = next;
		}
	}

	function applyFilters(sourceVideos) {
		if (!sourceVideos?.length) return [];
		return sourceVideos.filter((video) => {
			if (!isFilterMatch(video)) return false;
			if (!isSearchMatch(video)) return false;
			return true;
		});
	}

	function isFilterMatch(video) {
		if (filterMode === 'single') {
			if (!activeFilterId || activeFilterId === 'all') return true;
			return video.filterIds.has(activeFilterId);
		}

		if (!activeFilterIds || activeFilterIds.size === 0) return true;
		if (filterMatchStrategy === 'AND') {
			for (const id of activeFilterIds) {
				if (!video.filterIds.has(id)) return false;
			}
			return true;
		}
		for (const id of activeFilterIds) {
			if (video.filterIds.has(id)) return true;
		}
		return false;
	}

	function isSearchMatch(video) {
		if (!shouldApplySearch || !activeSearchNormalized) return true;
		for (const token of video.searchTokens ?? []) {
			if (token && token.includes(activeSearchNormalized)) {
				return true;
			}
		}
		return false;
	}

	function buildHighlightSection(videos, sectionsConfig, highlightValues, layoutResolved) {
		const highlightConfig = sectionsConfig?.highlight;
		if (!highlightConfig || !highlightValues.size) return null;

		const items = videos.filter((video) => video.highlight);
		if (!items.length) return null;

		const limit =
			highlightConfig.limit ?? layoutResolved.highlightLimit ?? items.length;
		const limited = items.slice(0, limit);

		return {
			label: highlightConfig.label ?? 'Destaque',
			anchor: sanitizeHeader(highlightConfig.anchor ?? highlightConfig.label ?? 'destaque'),
			videos: limited
		};
	}

function buildSections(videos, sectionsConfig) {
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

function buildFeedVideos({ highlightSection, regularSections, filteredVideos }) {
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

function handleFilterClick(option) {
		if (!option) return;
		userTouchedFilters = true;
		if (filterMode === 'single') {
			activeFilterId = option.id;
		} else {
			if (option.isAll) {
				activeFilterIds = new Set();
				return;
			}
			const next = new Set(activeFilterIds);
			if (next.has(option.id)) {
				next.delete(option.id);
			} else {
				next.add(option.id);
			}
			activeFilterIds = next;
		}
	}

	function isFilterActive(option) {
		if (!option) return false;
		if (filterMode === 'single') {
			if (option.isAll) {
				return !activeFilterId || activeFilterId === 'all';
			}
			return activeFilterId === option.id;
		}
		return activeFilterIds.has(option.id);
	}

	function handleSearchInput(event) {
		searchTerm = event.currentTarget.value;
		if (searchResolved.instant) {
			activeSearchTerm = searchTerm;
			searchHasSubmitted = true;
		}
	}

	function handleSearchSubmit(event) {
		event?.preventDefault();
		activeSearchTerm = searchTerm;
		searchHasSubmitted = true;
	}

	function handleSearchClear() {
		searchTerm = '';
		activeSearchTerm = '';
		searchHasSubmitted = false;
	}

function setupObserver() {
	if (!browser || !sentinelElement) return;
	observer = new IntersectionObserver(
		(entries) => {
			const entry = entries[0];
				controlsStuck = entry?.intersectionRatio === 0;
			},
			{ threshold: [0], rootMargin: '-1px 0px 0px 0px' }
		);
		observer.observe(sentinelElement);
	}

function cleanupObserver() {
	observer?.disconnect();
}

function ensureFeedObserver() {
	if (!browser || !isMobileFeed || !mobileFeedContainer) return;
	if (!feedObserver) {
		feedObserver = new IntersectionObserver(handleFeedIntersection, {
			root: mobileFeedContainer,
			threshold: [0.35, 0.55, 0.75, 0.9]
		});
	}
	feedItemElements.forEach((node) => {
		try {
			feedObserver.observe(node);
		} catch (err) {
			console.warn('VideoSheetShowcase: falha ao observar item do feed', err);
		}
	});
}

function resetFeedObserver() {
	if (feedObserver) {
		try {
			feedObserver.disconnect();
		} catch (err) {
			console.warn('VideoSheetShowcase: falha ao desconectar observer do feed', err);
		}
		feedObserver = null;
	}
	if (isMobileFeed && mobileFeedContainer) {
		ensureFeedObserver();
	}
}

function teardownFeedObserver() {
	if (feedObserver) {
		try {
			feedObserver.disconnect();
		} catch (err) {
			console.warn('VideoSheetShowcase: falha ao encerrar observer do feed', err);
		}
		feedObserver = null;
	}
	activeFeedId = null;
}

function handleFeedIntersection(entries = []) {
	let bestEntry = null;
	let bestRatio = 0;

	for (const entry of entries) {
		const ratio = entry?.intersectionRatio ?? 0;
		if (ratio > bestRatio) {
			bestRatio = ratio;
			bestEntry = entry;
		}
	}

	if (!snapInProgress && !feedOverlayVisible && bestEntry?.target?.dataset?.videoId) {
		activeFeedId = bestEntry.target.dataset.videoId;
	}
}

function setMobileFeedContainer(node) {
	if (lastMobileFeedContainer === node) return;
	lastMobileFeedContainer = node || null;
	mobileFeedContainer = node || null;
	resetFeedObserver();
	if (mobileFeedContainer && isMobileFeed) {
		queueMicrotask(() => snapActiveFeedVideo({ behavior: 'instant', force: true }));
	}
}

$: if (browser) {
	setMobileFeedContainer(mobileFeedContainer);
}

function registerFeedItem(node, videoId) {
	if (!browser || !videoId) return;

	if (node) {
		node.dataset.videoId = videoId;
		feedItemElements.set(videoId, node);
		if (feedObserver) {
			try {
				feedObserver.observe(node);
			} catch (err) {
				console.warn('VideoSheetShowcase: não foi possível observar item', err);
			}
		} else {
			ensureFeedObserver();
		}
	} else {
		const existing = feedItemElements.get(videoId);
		if (existing) {
			try {
				feedObserver?.unobserve(existing);
			} catch (err) {
				console.warn('VideoSheetShowcase: falha ao remover observação', err);
			}
			feedItemElements.delete(videoId);
		}
	}
}

function feedItemObserver(node, videoId) {
	if (!browser) return {};
	registerFeedItem(node, videoId);
	return {
		update(nextVideoId) {
			if (nextVideoId !== videoId) {
				registerFeedItem(null, videoId);
				dropPlayerControls(videoId);
				videoId = nextVideoId;
				registerFeedItem(node, videoId);
			}
		},
		destroy() {
			registerFeedItem(null, videoId);
			dropPlayerControls(videoId);
		}
	};
}

function handlePlayerControls(videoId, controls) {
	if (!videoId || !controls) return;
	feedPlayerControls.set(videoId, controls);
	feedPlaybackVersion += 1;
	if (!isMobileFeed) {
		try {
			controls.pause?.();
			controls.setMuted?.(true);
		} catch (error) {
			console.warn('VideoSheetShowcase: falha ao pausar player fora do feed', error);
		}
	}
}

function dropPlayerControls(videoId) {
	if (!feedPlayerControls.has(videoId)) return;
	const controls = feedPlayerControls.get(videoId);
	feedPlayerControls.delete(videoId);
	feedPlaybackVersion += 1;
	try {
		controls?.pause?.();
		controls?.setMuted?.(true);
	} catch (error) {
		console.warn('VideoSheetShowcase: falha ao resetar player', error);
	}
}

function updateFeedPlayback() {
	if (!browser) return;
	if (!isMobileFeed || !feedVideos.length || feedOverlayVisible || snapInProgress) {
		feedPlayerControls.forEach((controls) => {
			try {
				controls.pause?.();
				controls.setMuted?.(true);
			} catch (error) {
				console.warn('VideoSheetShowcase: falha ao pausar player', error);
			}
		});
		return;
	}

	feedPlayerControls.forEach((controls, videoId) => {
		const isActive = videoId === activeFeedId;
		try {
			if (isActive) {
				controls.play?.();
			} else {
				controls.pause?.();
				controls.setMuted?.(true);
			}
		} catch (error) {
			console.warn('VideoSheetShowcase: falha ao atualizar player', error);
		}
	});

	const activeControls = activeFeedId ? feedPlayerControls.get(activeFeedId) : null;
	if (activeControls) {
		try {
			activeControls.play?.();
		} catch (error) {
			console.warn('VideoSheetShowcase: não foi possível iniciar reprodução do vídeo ativo', error);
		}
	}
}

function snapActiveFeedVideo({ behavior = 'smooth', force = false } = {}) {
	if (!browser || !isMobileFeed || !mobileFeedContainer) return;
	if (feedOverlayVisible) return;
	const targetId = activeFeedId ?? feedVideos[0]?.uuid;
	if (!targetId) return;
	const targetNode = feedItemElements.get(targetId);
	if (!targetNode) return;
	const targetTop = targetNode.offsetTop;
	const current = mobileFeedContainer.scrollTop ?? 0;
	const diff = Math.abs(current - targetTop);
	if (!force && diff < 2) return;
	snapInProgress = true;
	const scrollBehavior = behavior === 'instant' ? 'auto' : behavior;
	mobileFeedContainer.scrollTo({ top: targetTop, behavior: scrollBehavior });
	clearTimeout(snapTimeoutId);
	snapTimeoutId = setTimeout(() => {
		snapInProgress = false;
	}, scrollBehavior === 'auto' ? 0 : 420);
}

function closeFeedOverlay() {
	feedOverlayMode = 'none';
	if (isMobileFeed) {
		queueMicrotask(() => snapActiveFeedVideo({ behavior: 'smooth', force: true }));
	}
}

function toggleFeedOverlay(mode) {
	if (!isMobileFeed) return;
	feedOverlayMode = feedOverlayMode === mode ? 'none' : mode;
}

function setMobileViewMode(mode) {
	if (mode !== 'feed' && mode !== 'grid') return;
	if (mobileViewMode === mode) return;
	mobileViewMode = mode;
	feedOverlayMode = 'none';
	feedOverlayVisible = false;
	if (mode === 'feed') {
		feedInitialized = false;
		queueMicrotask(() => {
			if (isMobileFeed) {
				snapActiveFeedVideo({ behavior: 'instant', force: true });
			}
		});
	} else {
		activeFeedId = feedVideos[0]?.uuid ?? null;
		updateFeedPlayback();
	}
}

let observer;

const gridStyle = () =>
	`--card-gap:${layoutResolved.cardGap}; --cards-mobile:${layoutResolved.cardsPerRowMobile}; --cards-tablet:${layoutResolved.cardsPerRowTablet}; --cards-desktop:${layoutResolved.cardsPerRowDesktop};`;

$: hasSearch = resolvedSearchColumns.length > 0;
$: showControls = (filterOptions.length > 0 || hasSearch) && totalVideos > 0;
$: if (browser) {
	if (isMobileFeed) {
		ensureFeedObserver();
	} else {
		teardownFeedObserver();
	}
}
</script>

<div
	class="video-sheet-showcase"
	data-debug={debug ? 'true' : undefined}
	data-mode={isMobileFeed ? 'mobile-feed' : 'grid'}
	style={isMobileFeed ? mobileFeedStyles : undefined}
>
	<div bind:this={sentinelElement} class="controls__sentinel" aria-hidden="true"></div>

	{#if feedOverlayVisible}
		<button
			type="button"
			class="mobile-feed-overlay-backdrop"
			on:click={closeFeedOverlay}
			aria-label="Fechar filtros e busca"
		></button>
	{/if}

	{#if showControls}
		<div
			class="controls"
			class:controls--desktop-stuck={controlsStuck && !isMobileFeed}
			data-mobile={isMobileFeed ? 'true' : 'false'}
			data-overlay={feedOverlayVisible ? 'open' : 'closed'}
			style={`--controls-sticky-top:${layoutResolved.stickyOffset}px`}
		>
			{#if isMobileFeed}
				{#if feedOverlayVisible}
					<div class="controls__header">
						<h2>
							{feedOverlayMode === 'search' ? 'Buscar vídeos' : feedOverlayMode === 'filters' ? 'Filtrar vídeos' : 'Opções'}
						</h2>
						<button type="button" class="controls__close" on:click={closeFeedOverlay} aria-label="Fechar painel">
							Fechar
						</button>
					</div>

					{#if filterOptions.length}
						<div class="filter-carousel" role="tablist" aria-label="Filtros da narrativa">
							{#each filterOptions as option (option.id)}
								<button
									type="button"
									role="tab"
									class="filter-chip"
									class:filter-chip--active={isFilterActive(option)}
									on:click={() => handleFilterClick(option)}
									aria-pressed={isFilterActive(option)}
								>
									{option.label}
									{#if filtersResolved.includeCounts && option.count !== undefined}
										<span class="filter-chip__count">{option.count}</span>
									{/if}
								</button>
							{/each}
						</div>
					{/if}

					{#if hasSearch}
						<form class="search-bar" role="search" on:submit={handleSearchSubmit}>
							<input
								type="search"
								name="video-search"
								placeholder={searchResolved.placeholder}
								aria-label={searchResolved.placeholder}
								bind:value={searchTerm}
								on:input={handleSearchInput}
								bind:this={searchInputRef}
							/>
							<button type="submit">Buscar</button>
							{#if searchTerm}
								<button type="button" class="alt" on:click={handleSearchClear}>Limpar</button>
							{/if}
						</form>
					{/if}
				{/if}
		{:else}
			{#if filterOptions.length}
				<div class="filter-carousel" role="tablist" aria-label="Filtros da narrativa">
					{#each filterOptions as option (option.id)}
						<button
							type="button"
							role="tab"
							class="filter-chip"
							class:filter-chip--active={isFilterActive(option)}
							on:click={() => handleFilterClick(option)}
							aria-pressed={isFilterActive(option)}
						>
							{option.label}
							{#if filtersResolved.includeCounts && option.count !== undefined}
								<span class="filter-chip__count">{option.count}</span>
							{/if}
						</button>
					{/each}
				</div>
			{/if}

			{#if hasSearch}
				<form class="search-bar" role="search" on:submit={handleSearchSubmit}>
					<input
						type="search"
						name="video-search"
						placeholder={searchResolved.placeholder}
						aria-label={searchResolved.placeholder}
						bind:value={searchTerm}
						on:input={handleSearchInput}
					/>
					<button type="submit">Buscar</button>
					{#if searchTerm}
						<button type="button" class="alt" on:click={handleSearchClear}>Limpar</button>
					{/if}
				</form>
			{/if}

			<div class="controls-meta">
				{#if totalVisible === totalVideos}
					{totalVideos} {totalVideos === 1 ? 'video' : 'videos'} carregados
				{:else}
					Mostrando {totalVisible} de {totalVideos} videos
				{/if}
			</div>
		{/if}
		</div>
	{/if}

	{#if loading}
		<div class="status status--loading">{loadingMessage}</div>
{:else if error}
	<div class="status status--error">
		<p>{error}</p>
		<button type="button" on:click={loadSheet}>Tentar novamente</button>
	</div>
{:else}
	{#if isMobileFeed}
		{#if feedVideos.length}
			<div class="mobile-feed-shell">
				<div class="mobile-feed" bind:this={mobileFeedContainer} aria-live="polite" role="list">
					{#each feedVideos as video, index (video.uuid)}
					<article
						role="listitem"
						class="mobile-feed__item"
						class:mobile-feed__item--active={video.uuid === activeFeedId}
						use:feedItemObserver={video.uuid}
					>
					<div class="mobile-feed__player">
						<GloboPlayer
							videoId={video.globoId}
							videoIdDesktop={video.globoIdDesktop}
							videoIdMobile={video.globoIdMobile}
							autoPlay={false}
							startMuted={true}
							controls={true}
							aspectRatio="9 / 16"
							aspectRatioMobile="9 / 16"
							containerBackgroundColor="#0b0d17"
							preventBlackBars={true}
							on:controls={(event) => handlePlayerControls(video.uuid, event.detail?.controls)}
						/>
					</div>
					<div class="mobile-feed__overlay">
						<div class="mobile-feed__gradient"></div>
						<div class="mobile-feed__content">
							<div class="mobile-feed__top">
								{#if layoutResolved.showCounts}
									<span class="mobile-feed__counter">{index + 1}/{feedVideos.length}</span>
								{/if}
								{#if video.tag || video.section?.label}
									<span class="mobile-feed__tag">{video.tag || video.section?.label}</span>
								{/if}
							</div>
							<div class="mobile-feed__text">
								<h2>{video.title}</h2>
								{#if video.subtitle}
									<p>{video.subtitle}</p>
								{:else if video.description}
									<p>{video.description}</p>
								{/if}
							</div>
							<div class="mobile-feed__meta">
								{#if video.publishedAtDisplay}
									<span class="mobile-feed__date">{video.publishedAtDisplay}</span>
								{/if}
								{#if video.section?.label && video.section?.label !== video.tag}
									<span class="mobile-feed__section">{video.section.label}</span>
								{/if}
							</div>
							{#if video.link}
								<a
									class="mobile-feed__cta"
									href={video.link}
									target="_blank"
									rel="noopener noreferrer"
								>
									Saiba mais
								</a>
							{/if}
				</div>
				{#if mobileViewMode === 'feed' && (hasSearch || filterOptions.length)}
					<div class="mobile-feed-actions" class:mobile-feed-actions--hidden={feedOverlayVisible}>
						{#if hasSearch}
							<button
							type="button"
							class="mobile-feed-actions__button"
							class:mobile-feed-actions__button--active={feedOverlayMode === 'search'}
							on:click={() => toggleFeedOverlay('search')}
							aria-label="Buscar vídeos"
							aria-pressed={feedOverlayMode === 'search'}
						>
							<span>Buscar</span>
						</button>
						{/if}
						{#if filterOptions.length}
							<button
							type="button"
							class="mobile-feed-actions__button"
							class:mobile-feed-actions__button--active={feedOverlayMode === 'filters'}
							on:click={() => toggleFeedOverlay('filters')}
							aria-label="Abrir filtros"
							aria-pressed={feedOverlayMode === 'filters'}
						>
							<span>Filtros</span>
						</button>
						{/if}
					</div>
				{/if}
			</div>
				</article>
			{/each}
		</div>
	</div>
{:else}
			<div class="status status--empty">{emptyStateMessage}</div>
		{/if}
	{:else}
		{#if highlightSection}
			<section
				class="video-section video-section--highlight"
				id={highlightSection.anchor}
				style={gridStyle()}
				data-section-type="highlight"
			>
				<header>
					<h2>{highlightSection.label}</h2>
					{#if layoutResolved.showCounts}
						<span class="section-count">{highlightSection.videos.length}</span>
					{/if}
				</header>
				<div class="video-grid" data-mobile-grid={mobileViewMode === 'grid' ? 'true' : undefined}>
					{#each highlightSection.videos as video (video.uuid)}
						<article class="video-card">
							<div class="video-card__player">
								<GloboPlayer
									videoId={video.globoId}
									videoIdDesktop={video.globoIdDesktop}
							videoIdMobile={video.globoIdMobile}
							autoPlay={false}
							startMuted={true}
							controls={true}
							aspectRatio="9 / 16"
							aspectRatioMobile="9 / 16"
							containerBackgroundColor="#0b0d17"
							preventBlackBars={true}
						/>
							</div>
							<div class="video-card__meta">
								{#if video.tag}
									<span class="video-card__tag">{video.tag}</span>
								{/if}
								<h3 class="video-card__title">{video.title}</h3>
								{#if video.subtitle}
									<p class="video-card__subtitle">{video.subtitle}</p>
								{:else if video.description}
									<p class="video-card__subtitle">{video.description}</p>
								{/if}
							</div>
						</article>
					{/each}
				</div>
			</section>
		{/if}

		{#if regularSections.length}
			{#each regularSections as section (section.anchor)}
				<section class="video-section" id={section.anchor} style={gridStyle()}>
					<header>
						<h2>{section.label}</h2>
						{#if layoutResolved.showCounts}
							<span class="section-count">{section.videos.length}</span>
						{/if}
					</header>
					<div class="video-grid" data-mobile-grid={mobileViewMode === 'grid' ? 'true' : undefined}>
						{#each section.videos as video (video.uuid)}
							<article class="video-card">
								<div class="video-card__player">
									<GloboPlayer
										videoId={video.globoId}
										videoIdDesktop={video.globoIdDesktop}
										videoIdMobile={video.globoIdMobile}
										autoPlay={false}
										startMuted={true}
										controls={true}
										aspectRatio="9 / 16"
										aspectRatioMobile="9 / 16"
										containerBackgroundColor="#0b0d17"
										preventBlackBars={true}
									/>
								</div>
								<div class="video-card__meta">
									{#if video.tag}
										<span class="video-card__tag">{video.tag}</span>
									{/if}
									<h3 class="video-card__title">{video.title}</h3>
									{#if video.subtitle}
										<p class="video-card__subtitle">{video.subtitle}</p>
									{:else if video.description}
										<p class="video-card__subtitle">{video.description}</p>
									{/if}
								</div>
							</article>
						{/each}
					</div>
				</section>
			{/each}
		{:else}
			<div class="status status--empty">{emptyStateMessage}</div>
		{/if}
	{/if}
{/if}

{#if layoutResolved.enableMobileFeed !== false && viewportWidth <= (layoutResolved.mobileFeedMaxWidth ?? 768)}
	<div class="mobile-view-switch" class:mobile-view-switch--hidden={feedOverlayVisible}>
		<button
			type="button"
			class="mobile-view-switch__button"
			class:mobile-view-switch__button--active={mobileViewMode === 'feed'}
			on:click={() => setMobileViewMode('feed')}
			aria-pressed={mobileViewMode === 'feed'}
		>
			Feed
		</button>
		<button
			type="button"
			class="mobile-view-switch__button"
			class:mobile-view-switch__button--active={mobileViewMode === 'grid'}
			on:click={() => setMobileViewMode('grid')}
			aria-pressed={mobileViewMode === 'grid'}
		>
			Grade
		</button>
	</div>
{/if}

{#if debug}
	<pre class="debug-dump">
{JSON.stringify(
	{
		totalVideos,
		totalVisible,
		isMobileFeed,
		feedVideos: feedVideos.length,
		feedOverlayMode,
		activeFeedId,
		feedInitialized,
		mobileViewMode,
		activeFilterId,
		activeFilterIds: Array.from(activeFilterIds),
		activeSearchTerm,
		filterOptions,
		resolvedColumns
	},
	null,
	2
)}
		</pre>
	{/if}
</div>

<style>
	.video-sheet-showcase {
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
		position: relative;
	}

	.video-sheet-showcase[data-mode='mobile-feed'] {
		min-height: 100dvh;
		gap: 0;
		background: #000000;
		color: var(--mobile-feed-title, #ffffff);
		--mobile-feed-controls-offset: env(safe-area-inset-top, 0);
	}

	.video-sheet-showcase[data-mode='mobile-feed'] .controls__sentinel {
		display: none;
	}

	.controls[data-mobile='true'] {
		position: fixed;
		top: calc(env(safe-area-inset-top, 0) + 0.35rem);
		left: 0;
		right: 0;
		z-index: 40;
		opacity: 0;
		pointer-events: none;
		transform: translateY(-120%);
		transition: opacity 0.25s ease, transform 0.25s ease;
		--mobile-feed-controls-offset: calc(4.6rem + env(safe-area-inset-top, 0));
	}

	.controls[data-mobile='true'][data-overlay='open'] {
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		opacity: 1;
		pointer-events: auto;
		transform: none;
		z-index: 50;
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
		padding: calc(env(safe-area-inset-top, 0) + 1.75rem) 1.5rem calc(env(safe-area-inset-bottom, 0) + 2rem);
		background: rgba(6, 10, 21, 0.9);
		backdrop-filter: blur(24px);
		border: none;
		box-shadow: none;
		overflow-y: auto;
	}

	.controls__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		color: var(--mobile-feed-title, #ffffff);
	}

	.controls__header h2 {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 600;
	}

	.controls__close {
		border: none;
		background: rgba(255, 255, 255, 0.12);
		color: var(--mobile-feed-title, #ffffff);
		padding: 0.45rem 1.1rem;
		border-radius: 999px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		pointer-events: auto;
	}

	.controls__close:hover,
	.controls__close:focus-visible {
		background: rgba(255, 255, 255, 0.22);
		outline: none;
	}

	.controls[data-mobile='true'][data-overlay='open'] .search-bar {
		padding-inline: 0;
	}

	.controls[data-mobile='true'][data-overlay='open'] .search-bar input {
		background: rgba(255, 255, 255, 0.92);
	}

	.controls[data-mobile='true'][data-overlay='open'] .filter-carousel {
		margin-inline: 0;
		padding-inline: 0;
	}

	.mobile-feed-shell {
		position: relative;
		width: 100%;
		height: 100dvh;
		padding-top: var(--mobile-feed-controls-offset, 4.6rem);
		background: #000000;
	}

	.mobile-feed {
		height: calc(100dvh - var(--mobile-feed-controls-offset, 4.6rem));
		overflow-y: auto;
		scroll-snap-type: y mandatory;
		scroll-behavior: smooth;
		position: relative;
		-webkit-overflow-scrolling: touch;
	}

	.mobile-feed::-webkit-scrollbar {
		display: none;
	}

	.mobile-feed__item {
		position: relative;
		height: calc(100dvh - var(--mobile-feed-controls-offset, 4.6rem));
		scroll-snap-align: start;
		scroll-snap-stop: always;
		display: flex;
		flex-direction: column;
		justify-content: center;
		background: #000000;
		filter: brightness(0.92);
		transition: filter 0.25s ease;
	}

	.mobile-feed__item--active {
		filter: brightness(1);
	}

	.mobile-feed__player {
		position: relative;
		flex: 1;
		overflow: hidden;
	}

	.mobile-feed__player :global(.globoplayer-container),
	.mobile-feed__player :global(.globoplay-wrapper),
	.mobile-feed__player :global(iframe) {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.mobile-feed__overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.mobile-feed__gradient {
		position: absolute;
		inset: 0;
		background: var(
			--mobile-feed-overlay,
			linear-gradient(
				180deg,
				rgba(0, 0, 0, 0) 0%,
				rgba(8, 12, 24, 0.78) 62%,
				rgba(8, 12, 24, 0.92) 100%
			)
		);
	}

	.mobile-feed__content {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		gap: 0.85rem;
		padding: 0 1.25rem calc(1.8rem + env(safe-area-inset-bottom, 0));
		pointer-events: none;
	}

	.mobile-feed__top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		color: var(--mobile-feed-meta, rgba(255, 255, 255, 0.8));
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		pointer-events: none;
	}

	.mobile-feed__counter {
		font-weight: 600;
		background: rgba(15, 23, 42, 0.45);
		border-radius: 999px;
		padding: 0.35rem 0.75rem;
	}

	.mobile-feed__tag {
		display: inline-flex;
		align-items: center;
		padding: 0.4rem 0.9rem;
		border-radius: 999px;
		font-size: 0.8rem;
		font-weight: 600;
		background: var(--mobile-feed-tag-background, rgba(255, 255, 255, 0.92));
		color: var(--mobile-feed-tag-color, #111827);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.mobile-feed__text h2 {
		font-size: clamp(1.65rem, 4.6vw, 2.1rem);
		line-height: 1.22;
		font-weight: 700;
		color: var(--mobile-feed-title, #ffffff);
		margin: 0;
	}

	.mobile-feed__text p {
		margin: 0.45rem 0 0;
		font-size: 1rem;
		line-height: 1.5;
		color: var(--mobile-feed-meta, rgba(255, 255, 255, 0.78));
		max-width: 28rem;
	}

	.mobile-feed__meta {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		font-size: 0.9rem;
		color: var(--mobile-feed-meta, rgba(255, 255, 255, 0.78));
		flex-wrap: wrap;
	}

	.mobile-feed__date,
	.mobile-feed__section {
		background: rgba(15, 23, 42, 0.45);
		border-radius: 999px;
		padding: 0.35rem 0.9rem;
	}

	.mobile-feed__cta {
		align-self: flex-start;
		margin-top: 0.75rem;
		background: rgba(255, 255, 255, 0.92);
		color: #111827;
		padding: 0.65rem 1.35rem;
		border-radius: 999px;
		font-weight: 600;
		text-decoration: none;
		pointer-events: auto;
		box-shadow: 0 14px 28px rgba(15, 23, 42, 0.22);
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.mobile-feed__cta:hover,
	.mobile-feed__cta:focus-visible {
		transform: translateY(-2px);
		box-shadow: 0 18px 36px rgba(15, 23, 42, 0.28);
	}

	.mobile-feed-overlay-backdrop {
		position: fixed;
		inset: 0;
		border: none;
		padding: 0;
		margin: 0;
		background: rgba(4, 7, 16, 0.65);
		backdrop-filter: blur(12px);
		z-index: 40;
		cursor: pointer;
	}

	.mobile-feed-actions {
		position: fixed;
		right: 1.1rem;
		bottom: calc(1.4rem + env(safe-area-inset-bottom, 0));
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		z-index: 45;
		opacity: 1;
		transition: opacity 0.2s ease;
	}

	.mobile-feed-actions--hidden {
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.2s ease;
	}

	.mobile-feed-actions__button {
		border: none;
		padding: 0.65rem 1rem;
		border-radius: 999px;
		background: rgba(15, 23, 42, 0.72);
		color: #f8fafc;
		font-weight: 600;
		font-size: 0.85rem;
		letter-spacing: 0.02em;
		cursor: pointer;
		backdrop-filter: blur(12px);
		box-shadow: 0 12px 28px rgba(6, 9, 16, 0.35);
		transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
	}

	.mobile-feed-actions__button span {
		pointer-events: none;
	}

	.mobile-feed-actions__button:hover,
	.mobile-feed-actions__button:focus-visible {
		transform: translateY(-1px);
		box-shadow: 0 16px 32px rgba(6, 9, 16, 0.4);
		outline: none;
	}

	.mobile-feed-actions__button--active {
		background: rgba(239, 68, 68, 0.9);
	}

	.mobile-view-switch {
		position: fixed;
		left: 1.1rem;
		bottom: calc(1.4rem + env(safe-area-inset-bottom, 0));
		display: flex;
		gap: 0.5rem;
		z-index: 45;
	}

	.mobile-view-switch--hidden {
		opacity: 0;
		pointer-events: none;
	}

	.mobile-view-switch__button {
		border: none;
		padding: 0.6rem 1.1rem;
		border-radius: 999px;
		background: rgba(15, 23, 42, 0.62);
		color: #f8fafc;
		font-weight: 600;
		font-size: 0.85rem;
		letter-spacing: 0.02em;
		cursor: pointer;
		backdrop-filter: blur(10px);
		box-shadow: 0 12px 28px rgba(6, 9, 16, 0.3);
		transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
	}

	.mobile-view-switch__button--active {
		background: rgba(255, 255, 255, 0.92);
		color: #101828;
	}

	.mobile-view-switch__button:hover,
	.mobile-view-switch__button:focus-visible {
		transform: translateY(-1px);
		box-shadow: 0 16px 32px rgba(6, 9, 16, 0.35);
		outline: none;
	}

	.controls__sentinel {
		width: 100%;
		height: 1px;
	}

	.controls {
		position: sticky;
		top: var(--controls-sticky-top, 0px);
		z-index: 10;
		background: var(--controls-bg, rgba(255, 255, 255, 0.92));
		backdrop-filter: blur(12px);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem 0 1.25rem;
		border-bottom: 1px solid rgba(15, 23, 42, 0.08);
	}

	.controls--desktop-stuck {
		box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
	}

	.filter-carousel {
		display: flex;
		flex-wrap: nowrap;
		gap: 0.5rem;
		overflow-x: auto;
		padding-bottom: 0.25rem;
		margin: 0 -0.5rem;
		padding-inline: 0.5rem;
		scroll-snap-type: x proximity;
	}

	.filter-carousel::-webkit-scrollbar {
		height: 6px;
	}

	.filter-carousel::-webkit-scrollbar-thumb {
		background: rgba(15, 23, 42, 0.15);
		border-radius: 999px;
	}

	.filter-chip {
		scroll-snap-align: start;
		flex: 0 0 auto;
		border-radius: 999px;
		padding: 0.5rem 1.125rem;
		background: rgba(15, 23, 42, 0.06);
		color: rgba(15, 23, 42, 0.82);
		border: 1px solid transparent;
		font-size: 0.95rem;
		line-height: 1;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
	}

	.filter-chip:hover,
	.filter-chip:focus-visible {
		background: rgba(15, 23, 42, 0.12);
		outline: none;
	}

	.filter-chip--active {
		background: #0f172a;
		color: #ffffff;
		border-color: #0f172a;
	}

	.filter-chip__count {
		font-size: 0.75rem;
		font-weight: 600;
		margin-left: 0.5rem;
		opacity: 0.8;
	}

	.search-bar {
		display: flex;
		align-items: stretch;
		gap: 0.5rem;
		width: 100%;
		padding-inline: 0.5rem;
	}

	.search-bar input {
		flex: 1;
		min-height: 2.75rem;
		border-radius: 999px;
		border: 1px solid rgba(15, 23, 42, 0.15);
		padding: 0.5rem 1.125rem;
		font-size: 1rem;
		background: rgba(255, 255, 255, 0.97);
	}

	.search-bar input:focus {
		outline: 2px solid #ef4444;
		outline-offset: 2px;
	}

	.search-bar button {
		border-radius: 999px;
		padding: 0 1.5rem;
		background: #0f172a;
		color: #ffffff;
		border: none;
		font-weight: 600;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.search-bar button:hover {
		background: #111827;
	}

	.search-bar button.alt {
		background: rgba(15, 23, 42, 0.1);
		color: #0f172a;
	}

	.search-bar button.alt:hover {
		background: rgba(15, 23, 42, 0.18);
	}

	.controls-meta {
		font-size: 0.85rem;
		color: rgba(15, 23, 42, 0.6);
		padding-inline: 0.5rem;
	}

	.video-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.video-section header {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
	}

	.video-section h2 {
		font-size: clamp(1.3rem, 2vw, 1.6rem);
		font-weight: 700;
		color: #111827;
	}

	.video-section--highlight h2 {
		color: #b45309;
	}

	.section-count {
		font-size: 0.85rem;
		font-weight: 600;
		color: rgba(15, 23, 42, 0.6);
	}

	.video-grid {
		display: grid;
		gap: var(--card-gap, 1.25rem);
		grid-template-columns: repeat(var(--cards-mobile, 1), minmax(0, 1fr));
	}

	@media (max-width: 820px) {
		.video-grid[data-mobile-grid='true'] {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 0.75rem;
		}
	}

	@media (min-width: 640px) {
		.video-grid {
			grid-template-columns: repeat(var(--cards-tablet, 2), minmax(0, 1fr));
		}
	}

	@media (min-width: 960px) {
		.video-grid {
			grid-template-columns: repeat(var(--cards-desktop, 4), minmax(0, 1fr));
		}
	}

	.video-card {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		height: 100%;
	}

	.video-card__player {
		border-radius: 1rem;
		overflow: hidden;
		aspect-ratio: 9 / 16;
		background: #0b0d17;
		position: relative;
	}

	.video-card__player :global(.globoplayer-container),
	.video-card__player :global(.globoplay-wrapper),
	.video-card__player :global(iframe) {
		width: 100%;
		height: 100%;
	}

	.video-card__meta {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1;
	}

	.video-card__tag {
		align-self: flex-start;
		border-radius: 999px;
		padding: 0.25rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 600;
		background: rgba(15, 23, 42, 0.08);
		color: rgba(15, 23, 42, 0.78);
	}

	.video-card__title {
		font-size: 1rem;
		font-weight: 700;
		color: #111827;
		line-height: 1.35;
	}

	.video-card__subtitle {
		font-size: 0.9rem;
		color: rgba(15, 23, 42, 0.75);
		line-height: 1.45;
	}

	.status {
		padding: 2rem 0;
		text-align: center;
		color: rgba(15, 23, 42, 0.65);
		font-size: 0.95rem;
	}

	.status--error {
		color: #b91c1c;
	}

	.status button {
		margin-top: 1rem;
		border-radius: 999px;
		padding: 0.5rem 1.5rem;
		background: #0f172a;
		color: #ffffff;
		border: none;
		font-weight: 600;
		cursor: pointer;
	}

	.debug-dump {
		margin-top: 2rem;
		background: rgba(15, 23, 42, 0.05);
		padding: 1rem;
		border-radius: 0.75rem;
		font-size: 0.75rem;
		overflow-x: auto;
	}
</style>
