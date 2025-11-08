<script>
	import { onMount, onDestroy, afterUpdate, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { fetchGoogleSheet } from '$lib/utils/googleSheets.js';

	export let sheetUrl = '';
	export let sheetId = '';
	export let gid = '';
	export let sheetName = '';
	export let query = '';
	export let fetchHeaders = {};
	export let fetcher = null;
	export let initialData = null;
	export let datasetUrl = '/data/cop30-final.json';

	export let themeField = 'tema';
	export let titleField = 'titulo';
	export let thumbField = 'thumb';
	export let videoIdField = 'id_video';
	export let orderField = 'numero_do_video';

	export let desktopMaxWidth = 300;
	export let mobileWidth = 100;
	export let gapDesktop = 16;
	export let gapMobile = 12;

	export let headingTag = 'h3';
	export let showThemeHeading = true;
	export let showTitleDesktop = true;
	export let emptyStateMessage = 'Nenhum vídeo disponível no momento.';
	export let loadingMessage = 'Carregando vídeos...';
	export let modalPrevLabel = 'Anterior';
	export let modalNextLabel = 'Próximo';
	export let modalCloseLabel = 'Fechar';
	export let searchPlaceholder = 'Busque por tema ou título';
	export let searchButtonLabel = 'Buscar';

	const VIDEO_ID_FALLBACK_KEYS = [
		'video_id',
		'id_video',
		'videos_ids',
		'videosids',
		'videoid',
		'id',
		'conteudo_id',
		'content_id',
		'globoplay_id'
	];
	const TITLE_FALLBACK_KEYS = ['titulo', 'título', 'title', 'headline', 'nome', 'descricao'];
	const THEME_FALLBACK_KEYS = ['tema', 'categoria', 'assunto', 'pilar'];
	const THUMB_FALLBACK_KEYS = [
		'thumb',
		'thumbnail',
		'thumb_url',
		'poster',
		'imagem',
		'image',
		'capa'
	];
	const ORDER_FALLBACK_KEYS = ['ordem', 'order', 'numero_do_video', 'indice', 'posicao'];

	const INITIAL_GROUPS_MOBILE = 1;
	const INITIAL_GROUPS_DESKTOP = 2;
	const GROUPS_PER_LOAD = 1;

	let loading = !initialData;
	let error = null;
	let sheetRows = initialData?.rows ?? [];
	let abortController = null;
	let mounted = false;

	let groupedVideos = [];
	let flatVideos = [];
	let renderedGroups = [];
	let nextGroupIndex = 0;
	let groupsSignature = '';

	let isMobileViewport = false;
	let viewportWidth = 1280;
	let resizeObserverCleanup = null;
	let sentinelElement;
	let sentinelObserver = null;

	let isModalOpen = false;
	let activeIndex = -1;
	let modalElement;
	let modalPlayerComponent = null;
	let bodyScrollLocked = false;
	let GloboPlayerComponent = null;
	let globoPlayerImporting = false;
	let globoPlayerImportError = null;
	let searchInput = '';
	let appliedQuery = '';
	let selectedTheme = 'all';
let filteredFlatVideos = [];
let visibleGroups = [];
let themeChips = [];
let groupsToRender = [];
	let filtersElement;
	let componentElement;
	let sectionElements = [];
	let scrollListenerCleanup = null;
	let scrollRaf = null;
	let isFiltersPinned = false;
	let filtersFixed = false;
	let filtersPlaceholderHeight = 0;
	let filtersFixedLeft = 0;
	let filtersFixedWidth = 0;
	let chipsElement;
	const chipRefs = new Map();
	let pendingChipScrollOptions = null;
	let lastScrollY = 0;
	let scrollDirection = 'down';

	const FALLBACK_THEME = 'Outros';
	const FILTERS_STICKY_OFFSET_DESKTOP = 0;
	const FILTERS_STICKY_OFFSET_MOBILE = 8;
	let filtersStickyOffset = FILTERS_STICKY_OFFSET_DESKTOP;

	const closeOnOverlay = (event) => {
		if (event.target === event.currentTarget) {
			closeModal();
		}
	};

	function pauseModalVideo() {
		modalPlayerComponent?.pause?.();
	}

	function registerChipRef(themeKey, node) {
		if (!themeKey) return;
		if (node) {
			chipRefs.set(themeKey, node);
		} else {
			chipRefs.delete(themeKey);
		}
	}

	function chipRef(node, themeKey) {
		if (themeKey) {
			registerChipRef(themeKey, node);
		}
		return {
			update(nextKey) {
				if (themeKey !== nextKey) {
					registerChipRef(themeKey, null);
					themeKey = nextKey;
					if (themeKey) {
						registerChipRef(themeKey, node);
					}
				}
			},
			destroy() {
				registerChipRef(themeKey, null);
			}
		};
	}

	function queueChipVisibility(options = {}) {
		if (!browser) return;
		pendingChipScrollOptions = {
			behavior: 'smooth',
			...options
		};
	}

	function clamp(value, min, max) {
		return Math.min(Math.max(value, min), max);
	}

	function scrollChipIntoView(themeKey, { behavior = 'smooth', direction = null } = {}) {
		if (!browser || !chipsElement || !themeKey) return;
		const chip = chipRefs.get(themeKey);
		if (!chip) return;
		const container = chipsElement;
		const padding = 12;
		const chipStart = chip.offsetLeft;
		const chipEnd = chipStart + chip.offsetWidth;
		const maxScroll = container.scrollWidth - container.clientWidth;
		if (maxScroll <= 0) return;
		const currentScroll = container.scrollLeft;
		let targetScroll = currentScroll;

		if (direction === 'down') {
			targetScroll = clamp(chipStart - padding, 0, maxScroll);
		} else if (direction === 'up') {
			targetScroll = clamp(chipEnd + padding - container.clientWidth, 0, maxScroll);
		} else if (chipStart < currentScroll + padding) {
			targetScroll = Math.max(chipStart - padding, 0);
		} else if (chipEnd > currentScroll + container.clientWidth - padding) {
			targetScroll = Math.min(chipEnd + padding - container.clientWidth, maxScroll);
		} else {
			return;
		}

		if (Math.abs(targetScroll - currentScroll) < 1) return;
		container.scrollTo({ left: targetScroll, behavior });
	}

	async function ensureGloboPlayer() {
		if (GloboPlayerComponent || globoPlayerImporting) {
			return GloboPlayerComponent;
		}
		globoPlayerImporting = true;
		globoPlayerImportError = null;
		try {
			const module = await import('./GloboPlayer.svelte');
			GloboPlayerComponent = module.default;
		} catch (error) {
			console.error('VideoThemeFeed: falha ao carregar o GloboPlayer dinamicamente.', error);
			globoPlayerImportError = 'Não foi possível carregar o player agora.';
		} finally {
			globoPlayerImporting = false;
		}
		return GloboPlayerComponent;
	}

	$: normalizedVideos = normalizeRows(sheetRows);
	$: filtersStickyOffset = isMobileViewport
		? FILTERS_STICKY_OFFSET_MOBILE
		: FILTERS_STICKY_OFFSET_DESKTOP;
	$: ({ groupedVideos, flatVideos } = groupVideos(normalizedVideos));
	$: {
		const normalizedSearch = (searchInput ?? '').trim();
		if (normalizedSearch !== appliedQuery) {
			appliedQuery = normalizedSearch;
		}
	}
	$: filteredFlatVideos = filterVideos(flatVideos, appliedQuery);
	$: visibleGroups = buildGroupsFromFlat(filteredFlatVideos);
	$: themeChips = buildThemeChips(
		appliedQuery ? visibleGroups : groupedVideos,
		appliedQuery ? filteredFlatVideos.length : flatVideos.length
	);
	$: if (selectedTheme !== 'all' && !themeChips.some((chip) => chip.key === selectedTheme)) {
		queueChipVisibility();
		selectedTheme = 'all';
	}
	$: groupsToRender = appliedQuery ? visibleGroups : renderedGroups;
	$: maybeResetRenderedGroups();
	$: activeVideo = filteredFlatVideos[activeIndex] ?? null;
	$: modalHasPrev = activeIndex > 0;
	$: modalHasNext = activeIndex >= 0 && activeIndex < filteredFlatVideos.length - 1;
	$: if (activeIndex >= filteredFlatVideos.length) {
		activeIndex = filteredFlatVideos.length ? filteredFlatVideos.length - 1 : -1;
	}
	$: if (!filteredFlatVideos.length && isModalOpen) {
		closeModal();
	}
	$: if (browser && pendingChipScrollOptions && selectedTheme) {
		scrollChipIntoView(selectedTheme, pendingChipScrollOptions);
		pendingChipScrollOptions = null;
	}

	onMount(() => {
		mounted = true;
		const hasInitialRows = sheetRows.length > 0;
		if (hasInitialRows) {
			maybeResetRenderedGroups();
		} else if (datasetUrl) {
			loadDataset(datasetUrl).then((loaded) => {
				if (!loaded && (sheetUrl || sheetId)) {
					loadSheet();
				}
			});
		} else if (sheetUrl || sheetId) {
			loadSheet();
		} else {
			loading = false;
		}

		if (browser) {
			window.addEventListener('keydown', handleGlobalKeydown);
			setupResizeListener();
			setupScrollTracking();
		}
		return () => {
			mounted = false;
			cleanupFetch();
			if (browser) {
				window.removeEventListener('keydown', handleGlobalKeydown);
				cleanupResizeListener();
				cleanupScrollTracking();
			}
		};
	});

	onDestroy(() => {
		releaseBodyScroll();
		sentinelObserver?.disconnect();
	});

	$: if (mounted) {
		watchForSheetChanges();
	}

	$: if (isModalOpen && modalElement) {
		tick().then(() => {
			modalElement?.focus();
		});
	}

	let lastSheetSignature = null;

	function watchForSheetChanges() {
		const signature = `${sheetUrl}|${sheetId}|${gid}|${sheetName}|${query}`;
		if (!lastSheetSignature) {
			lastSheetSignature = signature;
			return;
		}
		if (lastSheetSignature !== signature) {
			lastSheetSignature = signature;
			loadSheet();
		}
	}

	async function loadSheet() {
		if (!browser && !fetcher) {
			return;
		}

		if (!sheetUrl && !sheetId) {
			error = 'Informe sheetUrl ou sheetId para carregar vídeos.';
			return;
		}

		cleanupFetch();
		const controller = new AbortController();
		abortController = controller;
		loading = true;
		error = null;

		try {
			const { rows } = await fetchGoogleSheet({
				sheetUrl,
				sheetId,
				gid,
				sheetName,
				query,
				headers: fetchHeaders,
				fetcher: fetcher ?? fetch,
				signal: controller.signal
			});
			sheetRows = rows ?? [];
		} catch (err) {
			if (err?.name === 'AbortError') {
				return;
			}
			console.error('VideoThemeFeed: falha ao carregar planilha', err);
			error = err?.message ?? 'Não foi possível carregar os vídeos.';
		} finally {
			if (abortController === controller) {
				loading = false;
				abortController = null;
			}
		}
	}

	async function loadDataset(url) {
		if (!browser || !url) return false;
		loading = true;
		error = null;
		try {
			const response = await fetch(url, { cache: 'no-store' });
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
			let payload;
			if (contentType.includes('application/json') || url.endsWith('.json')) {
				payload = await response.json();
			} else {
				const text = await response.text();
				payload = { rows: parseCsvDataset(text) };
			}
			const rows = Array.isArray(payload?.rows)
				? payload.rows
				: Array.isArray(payload)
					? payload
					: Array.isArray(payload?.data)
						? payload.data
						: [];
			if (!rows.length) {
				throw new Error('Dataset vazio');
			}
			sheetRows = rows;
			return true;
		} catch (err) {
			console.error('VideoThemeFeed: falha ao carregar dataset local', err);
			error = err?.message ?? 'Não foi possível carregar os vídeos.';
			return false;
		} finally {
			loading = false;
		}
	}

	function maybeResetRenderedGroups() {
		const signatureParts = [
			appliedQuery,
			visibleGroups.map((group) => `${group.theme}:${group.videos.length}`).join('|')
		];
		const signature = signatureParts.join('::');
		if (!visibleGroups.length) {
			renderedGroups = [];
			nextGroupIndex = 0;
			groupsSignature = signature;
			return;
		}
		if (signature === groupsSignature && renderedGroups.length) {
			return;
		}
		groupsSignature = signature;
		resetRenderedGroups();
	}

	function resetRenderedGroups() {
		renderedGroups = [];
		nextGroupIndex = 0;
		appendNextGroups(getInitialGroupCount());
	}

	function appendNextGroups(count = 1) {
		if (!visibleGroups.length) return;
		const target = Math.min(visibleGroups.length, nextGroupIndex + count);
		if (target <= nextGroupIndex) return;
		const newGroups = visibleGroups.slice(nextGroupIndex, target);
		renderedGroups = [...renderedGroups, ...newGroups];
		nextGroupIndex = target;
		setupSentinelObserver();
	}

	function getInitialGroupCount() {
		return isMobileViewport ? INITIAL_GROUPS_MOBILE : INITIAL_GROUPS_DESKTOP;
	}

	function setupResizeListener() {
		if (!browser) return;
		const updateViewport = () => {
			const previous = isMobileViewport;
			viewportWidth = window.innerWidth || 1280;
			isMobileViewport = viewportWidth <= 768;
			if (previous !== isMobileViewport) {
				resetRenderedGroups();
			}
			syncThemeWithScroll();
		};
		updateViewport();
		window.addEventListener('resize', updateViewport);
		resizeObserverCleanup = () => window.removeEventListener('resize', updateViewport);
	}

	function cleanupResizeListener() {
		resizeObserverCleanup?.();
		resizeObserverCleanup = null;
	}

	function setupSentinelObserver() {
		if (!browser) return;
		sentinelObserver?.disconnect();
		if (!sentinelElement || nextGroupIndex >= visibleGroups.length) return;
		sentinelObserver = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (entry?.isIntersecting) {
					appendNextGroups(GROUPS_PER_LOAD);
				}
			},
			{
				rootMargin: '220px 0px'
			}
		);
		sentinelObserver.observe(sentinelElement);
	}

	$: if (sentinelElement) {
		setupSentinelObserver();
	}

	function cleanupFetch() {
		if (abortController) {
			abortController.abort();
			abortController = null;
		}
	}

	function normalizeRows(rows = []) {
		return rows.map((row, index) => normalizeRow(row, index)).filter(Boolean);
	}

	function normalizeRow(row, index) {
		if (!row || typeof row !== 'object') return null;

		const keyMap = buildRowKeyMap(row);

		const videoId = readValue(row, uniqueKeys(videoIdField, VIDEO_ID_FALLBACK_KEYS), keyMap);
		if (!videoId) return null;

		const title =
			readValue(row, uniqueKeys(titleField, TITLE_FALLBACK_KEYS), keyMap) || `Vídeo ${index + 1}`;
		const theme =
			readValue(row, uniqueKeys(themeField, THEME_FALLBACK_KEYS), keyMap) || FALLBACK_THEME;
		const thumbnail = readValue(row, uniqueKeys(thumbField, THUMB_FALLBACK_KEYS), keyMap);
		const rawOrder = readValue(row, uniqueKeys(orderField, ORDER_FALLBACK_KEYS), keyMap);
		const parsedOrder = Number(rawOrder);
		const order = Number.isFinite(parsedOrder) ? parsedOrder : Number.MAX_SAFE_INTEGER;

		return {
			uid: `${videoId}-${index}`,
			videoId,
			title,
			theme,
			thumbnail,
			order,
			rawIndex: index,
			row
		};
	}

	function uniqueKeys(primary, fallbacks) {
		const keys = [];
		if (primary) keys.push(primary);
		if (Array.isArray(fallbacks)) {
			for (const key of fallbacks) {
				if (key && !keys.includes(key)) {
					keys.push(key);
				}
			}
		}
		return keys;
	}

	function readValue(row, keys = [], keyMap = null) {
		for (const key of keys) {
			const actualKey = resolveRowKey(key, keyMap);
			const value = actualKey ? row?.[actualKey] : undefined;
			if (value !== undefined && value !== null && String(value).trim() !== '') {
				return typeof value === 'string' ? value.trim() : value;
			}
		}
		return '';
	}

	function resolveRowKey(key, keyMap) {
		if (!key) return null;
		const normalized = key.toLowerCase();
		const actual = keyMap?.get(normalized) ?? keyMap?.get(normalized.replace(/_\d+$/, '')) ?? key;
		return actual;
	}

	function buildRowKeyMap(row = {}) {
		const map = new Map();
		for (const originalKey of Object.keys(row)) {
			if (!originalKey) continue;
			const normalized = originalKey.toLowerCase();
			if (!map.has(normalized)) {
				map.set(normalized, originalKey);
			}
			const base = normalized.replace(/_\d+$/, '');
			if (base && !map.has(base)) {
				map.set(base, originalKey);
			}
		}
		return map;
	}

	function groupVideos(videos = []) {
		const map = new Map();
		for (const video of videos) {
			if (!map.has(video.theme)) {
				map.set(video.theme, []);
			}
			map.get(video.theme).push(video);
		}

		const grouped = [];
		map.forEach((themeVideos, theme) => {
			const sortedVideos = [...themeVideos].sort((a, b) => {
				if (a.order !== b.order) return a.order - b.order;
				return a.rawIndex - b.rawIndex;
			});
			grouped.push({ theme, videos: sortedVideos });
		});

		const flattened = grouped.flatMap((group) => group.videos);
		return { groupedVideos: grouped, flatVideos: flattened };
	}

	function buildGroupsFromFlat(videos = []) {
		const map = new Map();
		for (const video of videos) {
			if (!map.has(video.theme)) {
				map.set(video.theme, []);
			}
			map.get(video.theme).push(video);
		}
		const result = [];
		map.forEach((list, theme) => result.push({ theme, videos: list }));
		return result;
	}

	function sanitizeHeader(value = '') {
		return value
			.toString()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-zA-Z0-9]+/g, '_')
			.replace(/^_+|_+$/g, '')
			.toLowerCase();
	}

	function parseCsvDataset(text) {
		if (!text) return [];
		const lines = text
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter((line) => line.length);
		if (!lines.length) return [];
		const headers = parseCsvLine(lines.shift());
		return lines.map((line) => {
			const values = parseCsvLine(line);
			const entry = {};
			headers.forEach((header, index) => {
				if (!header) return;
				const rawKey = header.trim();
				const safeKey = sanitizeHeader(rawKey);
				const value = values[index] ?? '';
				entry[rawKey] = value;
				if (safeKey && safeKey !== rawKey) {
					entry[safeKey] = value;
				}
			});
			return entry;
		});
	}

	function parseCsvLine(line = '') {
		const result = [];
		let current = '';
		let inQuotes = false;
		for (let index = 0; index < line.length; index += 1) {
			const char = line[index];
			if (char === '"') {
				if (inQuotes && line[index + 1] === '"') {
					current += '"';
					index += 1;
				} else {
					inQuotes = !inQuotes;
				}
			} else if (char === ',' && !inQuotes) {
				result.push(current);
				current = '';
			} else {
				current += char;
			}
		}
		result.push(current);
		return result.map((value) => value.trim());
	}

	function filterVideos(list = [], query = '') {
		const normalizedQuery = query.trim().toLowerCase();
		return list.filter((video) => {
			if (!normalizedQuery) return true;
			const haystack = `${video.title} ${video.theme}`.toLowerCase();
			return haystack.includes(normalizedQuery);
		});
	}

	function buildThemeChips(groups = [], total = 0) {
		const chips = [{ key: 'all', label: 'Tudo', count: total }];
		for (const group of groups) {
			chips.push({ key: group.theme, label: group.theme, count: group.videos.length });
		}
		return chips;
	}

	function slugifyTheme(value = '') {
		return value
			.toString()
			.normalize('NFD')
			.replace(/[^a-zA-Z0-9\s-]/g, '')
			.trim()
			.replace(/\s+/g, '-')
			.toLowerCase();
	}

	function getThemeAnchor(theme = '') {
		return `video-theme-${slugifyTheme(theme || 'outros-temas')}`;
	}

	function openModal(video) {
		const index = filteredFlatVideos.findIndex((item) => item.uid === video.uid);
		if (index === -1) return;
		activeIndex = index;
		isModalOpen = true;
		lockBodyScroll();
		if (browser) {
			void ensureGloboPlayer();
		}
	}

	function closeModal() {
		pauseModalVideo();
		isModalOpen = false;
		activeIndex = -1;
		releaseBodyScroll();
	}

	function goPrev() {
		if (!modalHasPrev) return;
		pauseModalVideo();
		activeIndex -= 1;
	}

	function goNext() {
		if (!modalHasNext) return;
		pauseModalVideo();
		activeIndex += 1;
	}

	function handleGlobalKeydown(event) {
		if (!isModalOpen) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			closeModal();
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			goPrev();
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			goNext();
		}
	}

	function lockBodyScroll() {
		if (!browser || bodyScrollLocked) return;
		document.documentElement?.classList.add('video-theme-feed--modal-open');
		bodyScrollLocked = true;
	}

	function releaseBodyScroll() {
		if (!browser || !bodyScrollLocked) return;
		document.documentElement?.classList.remove('video-theme-feed--modal-open');
		bodyScrollLocked = false;
	}

	function applySearch() {
		appliedQuery = searchInput.trim();
	}

	function clearSearch() {
		if (!appliedQuery && !searchInput) return;
		searchInput = '';
		appliedQuery = '';
	}

	async function selectTheme(themeKey) {
		queueChipVisibility();
		if (selectedTheme !== themeKey) {
			selectedTheme = themeKey;
		}
		const appended = ensureThemeRendered(themeKey);
		if (appended) {
			await tick();
		}
		scrollToTheme(themeKey);
	}

	function ensureThemeRendered(themeKey) {
		if (!themeKey || themeKey === 'all' || !visibleGroups.length) {
			return false;
		}
		const targetIndex = visibleGroups.findIndex((group) => group.theme === themeKey);
		if (targetIndex === -1 || targetIndex < nextGroupIndex) {
			return false;
		}
		const groupsNeeded = targetIndex + 1 - nextGroupIndex;
		if (groupsNeeded <= 0) {
			return false;
		}
		appendNextGroups(groupsNeeded);
		return true;
	}

	function scrollToTheme(themeKey) {
		if (!browser) return;
		const offset = filtersStickyOffset + (filtersElement?.offsetHeight ?? 0) + 8;
		if (themeKey === 'all') {
			if (componentElement) {
				const rect = componentElement.getBoundingClientRect();
				const targetTop = Math.max(window.scrollY + rect.top - offset, 0);
				window.scrollTo({ top: targetTop, behavior: 'smooth' });
			} else {
				filtersElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
			return;
		}
		const anchorId = getThemeAnchor(themeKey);
		const target = document.getElementById(anchorId);
		if (target) {
			const rect = target.getBoundingClientRect();
			const targetTop = Math.max(window.scrollY + rect.top - offset, 0);
			window.scrollTo({ top: targetTop, behavior: 'smooth' });
		}
	}

	function setupScrollTracking() {
		if (!browser || scrollListenerCleanup) return;
		lastScrollY = window.scrollY || 0;
		const handleScroll = () => {
			if (scrollRaf) return;
			scrollRaf = window.requestAnimationFrame(() => {
				scrollRaf = null;
				const currentY = window.scrollY || 0;
				scrollDirection = currentY >= lastScrollY ? 'down' : 'up';
				lastScrollY = currentY;
				syncThemeWithScroll();
			});
		};
		window.addEventListener('scroll', handleScroll, { passive: true });
		scrollListenerCleanup = () => {
			window.removeEventListener('scroll', handleScroll);
			if (scrollRaf) {
				window.cancelAnimationFrame(scrollRaf);
				scrollRaf = null;
			}
		};
		syncThemeWithScroll();
	}

	function cleanupScrollTracking() {
		if (scrollListenerCleanup) {
			scrollListenerCleanup();
			scrollListenerCleanup = null;
		}
	}

	function syncThemeWithScroll() {
		if (!browser) return;
		const componentRect = componentElement?.getBoundingClientRect() ?? null;
		const filtersRect = filtersElement?.getBoundingClientRect() ?? null;
		updateFiltersFixedState(filtersRect, componentRect);
		if (!sectionElements.length) {
			if (selectedTheme !== 'all') {
				queueChipVisibility({ direction: scrollDirection });
				selectedTheme = 'all';
			}
		} else {
			const filtersHeight = filtersElement?.offsetHeight ?? 0;
			const anchorY = filtersStickyOffset + filtersHeight + 8;
			let currentTheme = 'all';
			for (const { theme, element } of sectionElements) {
				if (!element) continue;
				const rect = element.getBoundingClientRect();
				if (rect.bottom < anchorY) {
					currentTheme = theme;
					continue;
				}
				if (rect.top <= anchorY) {
					currentTheme = theme;
				}
				break;
			}
			if (currentTheme !== selectedTheme) {
				queueChipVisibility({ direction: scrollDirection });
				selectedTheme = currentTheme;
			}
		}

		if (filtersRect) {
			const pinnedNow = filtersRect.top <= filtersStickyOffset + 0.5 && filtersRect.bottom > 0;
			if (pinnedNow !== isFiltersPinned) {
				isFiltersPinned = pinnedNow;
			}
		} else if (isFiltersPinned) {
			isFiltersPinned = false;
		}
	}

	function updateFiltersFixedState(filtersRect, componentRect) {
		if (!filtersElement || !componentRect) {
			if (filtersFixed) {
				filtersFixed = false;
				filtersPlaceholderHeight = 0;
			}
			return;
		}
		const filtersHeight = filtersElement.offsetHeight || 0;
		if (!filtersHeight) {
			if (filtersFixed) {
				filtersFixed = false;
				filtersPlaceholderHeight = 0;
			}
			return;
		}
	const threshold = filtersStickyOffset;
		const shouldFix =
			componentRect.top <= threshold && componentRect.bottom - filtersHeight >= threshold;
		if (shouldFix) {
			const rect = filtersRect ?? filtersElement.getBoundingClientRect();
			filtersFixedLeft = rect.left;
			filtersFixedWidth = rect.width;
			filtersPlaceholderHeight = rect.height;
		} else {
			filtersPlaceholderHeight = 0;
		}
		if (filtersFixed !== shouldFix) {
			filtersFixed = shouldFix;
		}
	}

	function refreshSectionElements() {
		if (!browser) return;
		const nextRefs = renderedGroups
			.map((group) => {
				const element = document.getElementById(getThemeAnchor(group.theme));
				return element ? { theme: group.theme, element } : null;
			})
			.filter(Boolean);

		const changed =
			nextRefs.length !== sectionElements.length ||
			nextRefs.some((ref, index) => ref?.element !== sectionElements[index]?.element);
		if (changed) {
			sectionElements = nextRefs;
			syncThemeWithScroll();
		}
	}

	afterUpdate(() => {
		if (!browser) return;
		refreshSectionElements();
	});
</script>

{#if loading}
	<p class="video-feed__status video-feed__status--loading">{loadingMessage}</p>
{:else if error}
	<p class="video-feed__status video-feed__status--error">{error}</p>
{:else}
	<div class="video-theme-feed" bind:this={componentElement}>
		{#if filtersFixed}
			<div
				class="video-feed__filters-placeholder"
				style={`height:${filtersPlaceholderHeight}px;`}
				aria-hidden="true"
			></div>
		{/if}
		<section
			class="video-feed__filters"
			class:is-pinned={isFiltersPinned}
			class:is-fixed={filtersFixed}
			bind:this={filtersElement}
	style={`--video-feed-sticky-offset:${filtersStickyOffset}px;${filtersFixed ? `--video-feed-fixed-left:${filtersFixedLeft}px; --video-feed-fixed-width:${filtersFixedWidth}px;` : ''}`}
		>
			<form class="video-feed__search" on:submit|preventDefault={applySearch}>
				<input
					type="search"
					placeholder={searchPlaceholder}
					aria-label="Buscar vídeos"
					bind:value={searchInput}
				/>
				<div class="video-feed__search-actions">
					<button type="submit">{searchButtonLabel}</button>
					{#if appliedQuery}
						<button type="button" class="video-feed__search-clear" on:click={clearSearch}>
							Limpar
						</button>
					{/if}
				</div>
			</form>
		<div
			class="video-feed__chips"
			role="tablist"
			aria-label="Filtrar por tema"
			bind:this={chipsElement}
		>
			{#each themeChips as chip (chip.key)}
				<button
					type="button"
					class={`video-feed__chip ${chip.key === selectedTheme ? 'is-active' : ''}`.trim()}
					on:click={() => selectTheme(chip.key)}
					use:chipRef={chip.key}
					aria-pressed={chip.key === selectedTheme}
				>
						<span>{chip.label}</span>
						<small>{chip.count}</small>
					</button>
				{/each}
			</div>
		</section>

		{#if !filteredFlatVideos.length}
			<p class="video-feed__status video-feed__status--empty">{emptyStateMessage}</p>
		{:else}
			<div
				class="video-feed"
				style={`--desktop-card-max:${desktopMaxWidth}; --mobile-card-width:${mobileWidth}; --gap-desktop:${gapDesktop}; --gap-mobile:${gapMobile};`}
			>
				{#each groupsToRender as group (group.theme)}
					<section class="video-feed__section" id={getThemeAnchor(group.theme)}>
						{#if showThemeHeading}
							<svelte:element this={headingTag} class="video-feed__theme">
								{group.theme}
							</svelte:element>
						{/if}
						<div class="video-feed__grid">
							{#each group.videos as video (video.uid)}
								<button
									type="button"
									class="video-card"
									on:click={() => openModal(video)}
									aria-label={`Assistir ${video.title}`}
								>
									<div class="video-card__thumb">
										{#if video.thumbnail}
											<img
												src={video.thumbnail}
												alt={`Thumbnail do vídeo ${video.title}`}
												loading="lazy"
												decoding="async"
											/>
										{:else}
											<div class="video-card__thumb-fallback">Sem imagem</div>
										{/if}
									</div>
									{#if showTitleDesktop}
										<p class="video-card__title">{video.title}</p>
									{/if}
								</button>
							{/each}
						</div>
					</section>
				{/each}
				{#if !appliedQuery && nextGroupIndex < visibleGroups.length}
					<div class="video-feed__sentinel" bind:this={sentinelElement} aria-hidden="true">
						Carregando mais vídeos...
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

{#if isModalOpen && activeVideo}
	<div
		class="video-modal"
		role="dialog"
		aria-modal="true"
		aria-label={`Assistindo ${activeVideo.title}`}
		on:click={closeOnOverlay}
	>
		<div class="video-modal__panel" tabindex="-1" bind:this={modalElement}>
			<button
				type="button"
				class="video-modal__close"
				on:click={closeModal}
				aria-label={modalCloseLabel}
			>
				×
			</button>
			<button
				type="button"
				class="video-modal__nav video-modal__nav--prev"
				on:click={goPrev}
				disabled={!modalHasPrev}
				aria-label={modalPrevLabel}
			>
				<svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
					<path d="M15.5 4.5 8.5 12l7 7.5" />
				</svg>
			</button>
			<button
				type="button"
				class="video-modal__nav video-modal__nav--next"
				on:click={goNext}
				disabled={!modalHasNext}
				aria-label={modalNextLabel}
			>
				<svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
					<path d="m8.5 4.5 7 7.5-7 7.5" />
				</svg>
			</button>
			<div class="video-modal__grid">
				<section class="video-modal__media" aria-label="Reprodutor de vídeo">
					<div class="video-modal__player">
						{#if GloboPlayerComponent}
							{#key activeVideo.uid}
								<svelte:component
									this={GloboPlayerComponent}
									bind:this={modalPlayerComponent}
									videoId={activeVideo.videoId}
									autoPlay={true}
									startMuted={false}
									widthDesktop="100%"
									widthMobile="100%"
									aspectRatio="9 / 16"
									aspectRatioMobile="9 / 16"
									hideNativeAudioButton={false}
									skipDFP={true}
								/>
							{/key}
						{:else if globoPlayerImportError}
							<div class="video-modal__player-feedback video-modal__player-feedback--error">
								<p>{globoPlayerImportError}</p>
								<button type="button" on:click={() => void ensureGloboPlayer()}>
									Tentar novamente
								</button>
							</div>
						{:else}
							<div class="video-modal__player-feedback">
								<div class="spinner"></div>
								<p>Carregando player...</p>
							</div>
						{/if}
					</div>
				</section>
				<section class="video-modal__info">
					<div class="video-modal__meta">
						<div class="video-modal__counter">
							{activeIndex + 1}/{filteredFlatVideos.length}
						</div>
						{#if activeVideo.theme}
							<p class="video-modal__eyebrow">{activeVideo.theme}</p>
						{/if}
						<h3 class="video-modal__title">{activeVideo.title}</h3>
						{#if activeVideo.subtitle}
							<p class="video-modal__description">{activeVideo.subtitle}</p>
						{/if}
					</div>
					<div class="video-modal__info-footer">
						{#if activeVideo.link}
							<a
								class="video-modal__cta"
								href={activeVideo.link}
								target="_blank"
								rel="noopener noreferrer"
							>
								Ler reportagem completa
							</a>
						{/if}
						<div class="video-modal__info-nav">
							<button type="button" on:click={goPrev} disabled={!modalHasPrev}>
								{modalPrevLabel}
							</button>
							<button type="button" on:click={goNext} disabled={!modalHasNext}>
								{modalNextLabel}
							</button>
						</div>
					</div>
				</section>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(html.video-theme-feed--modal-open) {
		overflow: hidden;
	}

	:global(.story-section[data-component-type='video-theme-feed']) {
		overflow: visible;
	}

	.video-theme-feed {
		position: relative;
		display: flex;
		flex-direction: column;
	}

	.video-feed__filters-placeholder {
		width: 100%;
		margin-bottom: 2rem;
	}

	.video-feed__status {
		margin: 1rem 0;
		font-size: 0.95rem;
		color: #334155;
	}

	.video-feed__status--error {
		color: #b91c1c;
	}

	.video-feed__status--loading {
		color: #0f172a;
	}

	.video-feed__filters {
		background: rgba(252, 239, 220, 0.85);
		border-radius: 28px;
		padding: 0.85rem 1.5rem;
		margin-bottom: 1.25rem;
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.45),
			0 18px 50px rgba(15, 23, 42, 0.15);
		border: 1px solid rgba(255, 255, 255, 0.45);
		backdrop-filter: blur(18px) saturate(140%);
		-webkit-backdrop-filter: blur(18px) saturate(140%);
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		position: sticky;
		top: var(--video-feed-sticky-offset, 0);
		z-index: 5;
	}

	.video-feed__filters.is-pinned {
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.45),
			0 20px 55px rgba(15, 23, 42, 0.18);
	}

	.video-feed__filters.is-fixed {
		position: fixed;
		top: var(--video-feed-sticky-offset, 0);
		left: var(--video-feed-fixed-left, auto);
		width: var(--video-feed-fixed-width, auto);
		z-index: 30;
	}

	.video-feed__search {
		display: flex;
		flex-wrap: nowrap;
		gap: 0.5rem;
		justify-content: flex-start;
		align-items: stretch;
		width: 100%;
		min-height: 48px;
	}

	.video-feed__search input {
		flex: 1 1 320px;
		min-width: 0;
		border-radius: 999px;
		border: 1px solid rgba(78, 49, 29, 0.25);
		padding: 0.65rem 1.25rem;
		font-size: 0.95rem;
		background: rgba(255, 255, 255, 0.9);
		color: #2c1506;
		box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.video-feed__search input:focus {
		outline: none;
		border-color: rgba(198, 40, 40, 0.6);
		box-shadow: 0 0 0 3px rgba(198, 40, 40, 0.15);
	}

	.video-feed__search-actions {
		display: inline-flex;
		gap: 0.5rem;
		align-items: center;
		flex: 0 0 auto;
		min-height: 48px;
	}

	.video-feed__search button[type='submit'] {
		border: none;
		border-radius: 999px;
		background: linear-gradient(120deg, #1d2b32, #2e4b5a);
		color: #fff;
		font-weight: 600;
		padding: 0.65rem 1.5rem;
		cursor: pointer;
		white-space: nowrap;
		box-shadow: 0 12px 30px rgba(15, 23, 42, 0.2);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 48px;
	}

	.video-feed__search-clear {
		border: none;
		background: transparent;
		color: #c62828;
		font-weight: 600;
		cursor: pointer;
		text-decoration: underline;
		display: inline-flex;
		align-items: center;
		padding: 0 0.35rem;
	}

	.video-feed__chips {
		display: flex;
		flex-wrap: nowrap;
		gap: 0.65rem;
		justify-content: flex-start;
		width: 100%;
		overflow-x: auto;
		padding-bottom: 0.25rem;
		margin: 0 -0.5rem;
		padding-left: 0.5rem;
		scrollbar-width: none;
		-ms-overflow-style: none;
		scroll-snap-type: x proximity;
		overscroll-behavior-x: contain;
	}

	.video-feed__chips::-webkit-scrollbar {
		display: none;
	}

	.video-feed__chip {
		border: none;
		border-radius: 999px;
		padding: 0.55rem 0.95rem;
		background: rgba(255, 226, 169, 0.92);
		color: #7a3b00;
		font-weight: 600;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		cursor: pointer;
		box-shadow: 0 8px 18px rgba(122, 59, 0, 0.18);
		flex: 0 0 auto;
		white-space: nowrap;
		scroll-snap-align: start;
		user-select: none;
		transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease;
	}

	.video-feed__chip:hover {
		transform: translateY(-2px);
		background: rgba(255, 226, 169, 1);
		box-shadow: 0 12px 24px rgba(122, 59, 0, 0.22);
	}

	.video-feed__chip:focus-visible {
		transform: translateY(-2px);
		background: rgba(255, 226, 169, 1);
		box-shadow: 0 12px 24px rgba(122, 59, 0, 0.22);
		outline: 3px solid rgba(255, 255, 255, 0.9);
		outline-offset: 3px;
	}

	.video-feed__chip small {
		font-size: 0.7rem;
		background: rgba(255, 255, 255, 0.85);
		padding: 0.1rem 0.45rem;
		border-radius: 999px;
	}

	.video-feed__chip.is-active {
		background: #c62828;
		color: #fff;
		box-shadow: 0 12px 28px rgba(198, 40, 40, 0.35);
	}

	.video-feed__chip.is-active small {
		color: #ce463c;
		font-weight: 600;
	}

	.video-feed {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.video-feed__section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding-left: 20px;
	}

	.video-feed__theme {
		font-size: 1.5rem;
		font-weight: 900;
		color: #ce463c;
		margin: 0;
		padding-bottom: 12px;
	}

	.video-feed__grid {
		display: flex;
		flex-wrap: wrap;
		gap: calc(var(--gap-desktop) * 1px);
	}

	.video-feed__sentinel {
		width: 100%;
		text-align: center;
		padding: 1rem 0 2rem;
		color: rgba(15, 23, 42, 0.6);
		font-size: 0.9rem;
	}

	.video-card {
		all: unset;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: min(100%, calc(var(--desktop-card-max) * 1px));
		cursor: pointer;
		margin-bottom: 12px;
	}

	.video-card:focus-visible {
		outline: 3px solid #0ea5e9;
		outline-offset: 3px;
	}

	.video-card__thumb {
		width: 100%;
		aspect-ratio: 9 / 16;
		border-radius: 20px;
		overflow: hidden;
		background: #020617;
		box-shadow: 0 10px 25px rgba(15, 23, 42, 0.25);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.video-card__thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.video-card__thumb-fallback {
		color: #cbd5f5;
		font-size: 0.85rem;
	}

	.video-card__title {
		font-size: 0.95rem;
		font-weight: 700;
		color: #3d748f;
		margin: 0;
	}

	@media (max-width: 768px) {
		.video-feed__section {
			padding-left: 0;
			padding-right: 0;
		}

		.video-feed__theme {
			padding-left: 20px;
			padding-right: 20px;
		}

		.video-feed__filters {
			padding: 1rem;
			top: 0.5rem;
		}

		.video-feed__search-actions {
			justify-content: flex-end;
		}

		.video-feed__chips {
			justify-content: flex-start;
			flex-wrap: nowrap;
			overflow-x: auto;
			padding-bottom: 0.5rem;
			margin: 0 -0.25rem;
			scrollbar-width: none;
			-ms-overflow-style: none;
		}

		.video-feed__chips::-webkit-scrollbar {
			display: none;
		}

		.video-feed__chip {
			flex: 0 0 auto;
		}

		.video-feed__grid {
			display: grid;
			column-gap: calc(var(--gap-mobile) * 1px);
			row-gap: 0;
			grid-template-columns: repeat(auto-fit, minmax(calc(var(--mobile-card-width) * 1px), 1fr));
			width: 100vw;
			margin-left: calc(50% - 50vw);
			margin-right: calc(50% - 50vw);
		}

		.video-card {
			width: 100%;
			margin-bottom: 0;
		}

		.video-card__thumb,
		.video-card__thumb img {
			border-radius: 0;
		}

		.video-card__title {
			display: none;
		}
	}

	.video-modal {
		position: fixed;
		inset: 0;
		background: rgba(64, 64, 64, 0.85);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		z-index: 1000;
	}

	.video-modal__panel {
		position: relative;
		background: #404040;
		color: #f0e7d6;
		border-radius: 32px;
		padding: 2rem 2.75rem;
		width: min(1100px, calc(100% - 1rem));
		max-height: 92vh;
		display: flex;
		flex-direction: column;
		outline: none;
		box-shadow: 0 30px 120px rgba(2, 6, 23, 0.4);
	}

	.video-modal__close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		width: 42px;
		height: 42px;
		border-radius: 999px;
		border: none;
		background: rgba(15, 23, 42, 0.65);
		color: #fff;
		font-size: 1.35rem;
		line-height: 1;
		cursor: pointer;
		box-shadow: inset 0 0 0 2px rgba(248, 250, 252, 0.08);
		z-index: 10;
	}

	.video-modal__grid {
		display: flex;
		flex: 1 1 auto;
		gap: 2rem;
		align-items: stretch;
	}

	.video-modal__media {
		position: relative;
		flex: 0 0 48%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.video-modal__player {
		--player-max-height: min(calc(90vh - 6rem), 880px);
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.video-modal__player :global(.video-section-wrapper) {
		position: static;
		left: auto;
		transform: none;
		margin: 0 auto;
		width: min(100%, calc(var(--player-max-height) * 0.5625));
		max-height: var(--player-max-height);
	}

	.video-modal__player :global(.globo-player-container) {
		width: 100%;
		margin: 0;
	}

	.video-modal__player :global(.player-wrapper) {
		max-height: var(--player-max-height);
	}

	.video-modal__player-feedback {
		min-height: 320px;
		max-height: var(--player-max-height);
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 0.75rem;
		text-align: center;
		padding: 2rem;
		background: #020617;
		border-radius: 20px;
		color: #f8fafc;
	}

	.video-modal__player-feedback--error {
		color: #fecaca;
	}

	.video-modal__player-feedback button {
		border: none;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.15);
		color: #fff;
		padding: 0.6rem 1.25rem;
		cursor: pointer;
		font-weight: 600;
	}

	.video-modal__player-feedback button:hover {
		background: rgba(255, 255, 255, 0.25);
	}

	.video-modal__player-feedback .spinner {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		border: 4px solid rgba(255, 255, 255, 0.15);
		border-top-color: #fff;
		animation: spin 1s ease-in-out infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.video-modal__info {
		flex: 1 1 52%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 1.5rem;
		padding: 1rem 0;
		overflow-y: auto;
	}

	.video-modal__meta {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.video-modal__counter {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.25em;
		color: #f0e7d6;
	}

	.video-modal__eyebrow {
		text-transform: uppercase;
		font-size: 0.75rem;
		font-weight: 600;
		color: #f0e7d6;
		margin: 0;
		letter-spacing: 0.2em;
	}

	.video-modal__title {
		margin: 0;
		font-size: clamp(2rem, 3vw, 2.75rem);
		line-height: 1.2;
		font-weight: 1000;
		color: #f0e7d6;
	}

	.video-modal__description {
		margin: 0;
		font-size: 1rem;
		line-height: 1.6;
		color: rgba(248, 250, 252, 0.85);
	}

	.video-modal__info-footer {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.video-modal__cta {
		align-self: flex-start;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.65rem 1.5rem;
		border-radius: 999px;
		background: rgba(248, 250, 252, 0.12);
		color: #fff;
		text-decoration: none;
		font-weight: 600;
		transition: background 0.2s ease;
	}

	.video-modal__cta:hover {
		background: rgba(248, 250, 252, 0.2);
	}

	.video-modal__info-nav {
		display: flex;
		gap: 0.75rem;
	}

	.video-modal__info-nav button {
		flex: 1;
		padding: 0.85rem;
		border-radius: 999px;
		border: none;
		background: #f0e7d6;
		color: #404040;
		font-weight: 600;
		cursor: pointer;
	}

	.video-modal__info-nav button:disabled {
		background: rgba(240, 231, 214, 0.6);
		color: rgba(64, 64, 64, 0.6);
		cursor: not-allowed;
	}

	.video-modal__nav {
		position: absolute;
		top: 50%;
		--nav-translate-y: -50%;
		transform: translateY(var(--nav-translate-y));
		width: 48px;
		height: 48px;
		border-radius: 999px;
		border: none;
		background: rgba(15, 23, 42, 0.75);
		display: none;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		z-index: 15;
		transition: background 0.2s ease, transform 0.2s ease;
	}

	.video-modal__nav svg {
		width: 20px;
		height: 20px;
	}

	.video-modal__nav path {
		fill: none;
		stroke: #f0e7d6;
		stroke-width: 2.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.video-modal__nav:hover:not(:disabled) {
		background: rgba(15, 23, 42, 0.9);
		transform: translateY(var(--nav-translate-y)) scale(1.05);
	}

	.video-modal__nav:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.video-modal__nav--prev {
		left: -1.25rem;
	}

	.video-modal__nav--next {
		right: -1.25rem;
	}

	@media (max-width: 1024px) {
		.video-modal {
			padding: 1rem;
		}

		.video-modal__panel {
			padding: 1.5rem;
			width: calc(100% - 1rem);
		}

		.video-modal__nav--prev {
			left: -0.5rem;
		}

		.video-modal__nav--next {
			right: -0.5rem;
		}
	}

	@media (max-width: 768px) {
		.video-modal {
			padding: 0;
		}

		.video-modal__panel {
			width: 100%;
			height: 100%;
			max-height: 100vh;
			border-radius: 0;
			padding: 0;
			background: #404040;
		}

		.video-modal__close {
			top: 0.75rem;
			right: 0.75rem;
			background: rgba(15, 23, 42, 0.9);
			z-index: 20;
		}

		.video-modal__grid {
			flex-direction: column;
			height: 100%;
			gap: 0;
		}

		.video-modal__media {
			flex: 1 1 auto;
			padding: 1rem;
			align-items: stretch;
		}

		.video-modal__player {
			--player-max-height: calc(100vh - 5rem);
			width: 100%;
			height: 100%;
		}

		.video-modal__player :global(.video-section-wrapper) {
			width: 100%;
			max-height: var(--player-max-height);
		}

		.video-modal__player :global(.player-wrapper) {
			border-radius: 0;
		}

		.video-modal__player-feedback {
			border-radius: 0;
		}

		.video-modal__nav {
			display: flex;
			top: auto;
			bottom: 1.5rem;
			--nav-translate-y: 0;
		}

		.video-modal__nav--prev {
			left: 1.25rem;
		}

		.video-modal__nav--next {
			right: 1.25rem;
		}

		.video-modal__info {
			padding: 1.25rem;
			background: transparent;
		}

		.video-modal__info-nav {
			display: none;
		}
	}
</style>
