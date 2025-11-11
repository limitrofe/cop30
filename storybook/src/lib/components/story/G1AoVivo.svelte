<!-- src/lib/components/story/G1AoVivo.svelte -->
<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { fetchGoogleSheet } from '$lib/utils/googleSheets.js';
	import GloboPlayer from './GloboPlayer.svelte';

	const DEFAULT_REFRESH_MINUTES = 30;

	const TRUTHY_VALUES = new Set(['1', 'true', 'yes', 'sim', 'y', 's', 'on']);
	const FALSY_VALUES = new Set(['0', 'false', 'no', 'nao', 'não', 'n', 'off']);

	export let sheetUrl = '';
	// Mantido por compatibilidade com stories antigos; atualização agora ocorre ao fim da playlist.
	export let refreshIntervalMinutes = DEFAULT_REFRESH_MINUTES;
	export let autoPlay = true;
	export let initialMuted = false;
	export let backgroundColor = '#000000';
	export let widthDesktop = '100%';
	export let widthMobile = '100%';
	export let aspectRatio = '16 / 9';
	export let aspectRatioMobile = '9 / 16';
	export let showCaption = false;
	export let restartOnRefresh = true;
	export let hideNativeAudioButton = false;
	export let title = '';
	export let description = '';
	export let showHeader = false;
	export let showNowPlaying = false;
export let showMeta = false;
export let bannerText = '';
export let bannerDescription = '';
export let bannerBackgroundColor = 'rgba(15, 23, 42, 0.85)';
export let bannerTextColor = '#ffffff';
export let bannerFontSize = '1rem';
export let bannerFontWeight = '600';
export let bannerDescriptionColor = 'rgba(255, 255, 255, 0.85)';
export let bannerDescriptionFontSize = '0.9rem';
export let bannerDescriptionFontWeight = '400';
export let bannerHeight = 'auto';
export let bannerVisibilityMode = 'fixed';
export let bannerDisplayDuration = 4000;
export let bannerBorderColor = 'rgba(255, 255, 255, 0.35)';
	export let intervalMediaType = 'none';
	export let intervalImageUrl = '';
	export let intervalVideoUrl = '';
	export let intervalDurationMs = 4000;
	export let intervalCaption = '';
	export let backgroundMediaType = 'none';
	export let backgroundImage = '';
	export let backgroundVideo = '';
	export let backgroundVideoPoster = '';

	let videos = [];
	let currentIndex = 0;
	let loading = false;
	let errorMessage = '';
	let lastUpdatedAt = null;
	let audioUnlocked = !initialMuted;
	let pendingAutoPlay = autoPlay;
	let fetchController = null;
	let playerControls = null;
	let lastAppliedMute = null;
	let lastAudioUnlocked = audioUnlocked;
	let mounted = false;
	let lastSheetUrl = null;
	let playerErrorMessage = '';
	let lastInitialMuted = initialMuted;
	let lastAutoPlayProp = autoPlay;
let bannerTimer = null;
let bannerCycleVideoKey = null;
let isBannerVisible = false;
let normalizedBannerMode = 'fixed';
let trimmedBannerText = '';
let trimmedBannerDescription = '';
let currentBannerText = '';
let currentBannerDescription = '';
let hasBannerContent = false;
let normalizedBackgroundType = 'none';
	let verticalAspectRatio = 9 / 16;
	const posterAspectCache = new Map();
	let posterAspectRatio = null;
	let posterLoadToken = 0;
	let aspectRatioFromProps = null;
	let verticalWidthExpression = '100%';
	let intervalTimer = null;
	let pendingIntervalIndex = null;
	let isIntervalActive = false;
	let intervalVideoElement;

	const VIDEO_DESKTOP_KEYS = [
		'video_id_desktop',
		'videoid_desktop',
		'id_desktop',
		'desktop_id',
		'desktop'
	];
	const VIDEO_MOBILE_KEYS = [
		'video_id_mobile',
		'videoid_mobile',
		'id_mobile',
		'mobile_id',
		'mobile'
	];
	const VIDEO_GENERIC_KEYS = [
		'video_id',
		'videoid',
		'videoid_2',
		'videoid2',
		'id_video',
		'video',
		'globoplay_id',
		'wm_id',
		'conteudo_id',
		'content_id'
	];
	const CAPTION_KEYS = ['caption', 'legenda', 'descricao_legenda'];
	const CREDIT_KEYS = ['credit', 'credito', 'crédito', 'autor'];
	const TITLE_KEYS = ['title', 'titulo', 'título', 'headline', 'nome'];
	const SKIP_DFP_KEYS = ['skip_dfp', 'sem_anuncio', 'sem_anúncio', 'sem_ads', 'no_ads'];
	const AUTOPLAY_KEYS = ['autoplay', 'auto_play', 'play_automatico', 'play_automático'];
	const START_MUTED_KEYS = ['start_muted', 'muted', 'muted_start', 'com_som'];
const CARTELA_TEXT_KEYS = [
	'texto_cartela',
	'textocartela',
	'texto_cartela_2',
	'textocartela_2',
	'texto_cartela2',
	'textocartela2',
	'texocartela'
];
const CARTELA_DESCRIPTION_KEYS = [
	'descricao',
	'descrição',
	'descricao_cartela',
	'descricaocartela',
	'description',
	'desc'
];
	const ASPECT_RATIO_KEYS = ['aspect_ratio', 'ratio', 'proporcao', 'proporcao_desktop'];
	const ASPECT_RATIO_MOBILE_KEYS = ['aspect_ratio_mobile', 'ratio_mobile', 'proporcao_mobile'];
	const WIDTH_DESKTOP_KEYS = ['width_desktop', 'largura_desktop'];
	const WIDTH_MOBILE_KEYS = ['width_mobile', 'largura_mobile'];
	const POSTER_KEYS = ['poster', 'poster_url', 'thumbnail', 'capa'];
	const POSTER_ALT_KEYS = ['poster_alt', 'poster_alt_text', 'poster_texto_alternativo'];
	const BACKGROUND_COLOR_KEYS = ['background_color', 'cor_de_fundo', 'fundo'];
	const HIDE_AUDIO_KEYS = ['hide_audio_button', 'esconder_botao_audio', 'hide_native_audio'];
	const KEY_KEYS = ['chave', 'key', 'slug', 'playlist_id', 'playlist_item_id', 'uid'];

	$: hasPlaylist = videos.length > 0;
	$: currentVideo = hasPlaylist ? videos[currentIndex] : null;
	$: computedBackground = currentVideo?.backgroundColor ?? backgroundColor;
	$: computedWidthDesktop = currentVideo?.widthDesktop ?? widthDesktop;
	$: computedWidthMobile = currentVideo?.widthMobile ?? widthMobile;
	$: computedAspectRatio = currentVideo?.aspectRatio ?? aspectRatio;
	$: computedAspectRatioMobile = currentVideo?.aspectRatioMobile ?? aspectRatioMobile;
	$: computedStartMuted = audioUnlocked ? false : (currentVideo?.startMuted ?? initialMuted);
	$: computedSkipDFP = currentVideo?.skipDFP ?? true;
	$: computedAutoPlay = currentVideo?.autoPlay ?? autoPlay;
	$: computedHideAudioButton = currentVideo?.hideNativeAudioButton ?? hideNativeAudioButton;
	$: lastUpdatedLabel = formatTimestamp(lastUpdatedAt);
	$: nowPlayingTitle = currentVideo?.title || '';
	$: resolvedCaption = showCaption ? currentVideo?.caption : '';
	$: resolvedCredit = showCaption ? currentVideo?.credit : '';
	$: trimmedBannerText = (bannerText || '').trim();
	$: trimmedBannerDescription = (bannerDescription || '').trim();
	$: normalizedBannerMode =
		(bannerVisibilityMode || '').toLowerCase() === 'per-video' ? 'per-video' : 'fixed';
	$: currentBannerText =
		(currentVideo?.bannerText && String(currentVideo.bannerText).trim()) || trimmedBannerText;
	$: currentBannerDescription =
		(currentVideo?.bannerDescription && String(currentVideo.bannerDescription).trim()) ||
		trimmedBannerDescription;
	$: hasBannerContent = Boolean(currentBannerText || currentBannerDescription);
	$: normalizedBackgroundType = (() => {
		const type = (backgroundMediaType || '').toLowerCase();
		if (type === 'image' && backgroundImage?.trim()) return 'image';
		if (type === 'video' && backgroundVideo?.trim()) return 'video';
		return 'none';
	})();
	$: aspectRatioFromProps = deriveAspectRatioFromProps();
	$: {
		if (!currentVideo || aspectRatioFromProps) {
			cancelPosterMeasurement();
			posterAspectRatio = null;
		} else if (currentVideo?.poster) {
			requestPosterAspect(currentVideo.poster);
		} else {
			cancelPosterMeasurement();
			posterAspectRatio = null;
		}
	}
	$: currentAspectRatio =
		aspectRatioFromProps ??
		posterAspectRatio ??
		parseAspectRatioValue(aspectRatio) ??
		parseAspectRatioValue(aspectRatioMobile) ??
		16 / 9;
	$: isVerticalVideo = currentAspectRatio < 1;
	$: verticalAspectRatio = isVerticalVideo ? currentAspectRatio : 16 / 9;
	$: verticalWidthExpression = isVerticalVideo
		? `min(calc(100vh * ${verticalAspectRatio}), 90vw)`
		: '100%';
	$: intervalMediaKind = (() => {
		const type = (intervalMediaType || '').toLowerCase();
		if (type === 'image' && intervalImageUrl?.trim()) return 'image';
		if (type === 'video' && intervalVideoUrl?.trim()) return 'video';
		return 'none';
	})();
	$: normalizedIntervalDuration = Math.max(500, Number(intervalDurationMs) || 4000);

	$: if (intervalMediaKind === 'none' && isIntervalActive) {
		cancelInterval();
	}

	$: if (normalizedBannerMode !== 'per-video') {
		isBannerVisible = hasBannerContent;
		if (!isBannerVisible) {
			clearBannerTimer();
			bannerCycleVideoKey = null;
		}
	} else if (!hasBannerContent) {
		isBannerVisible = false;
		clearBannerTimer();
		bannerCycleVideoKey = null;
	} else if (currentVideo) {
		const key = currentVideo._key ?? `index-${currentIndex}`;
		if (key && key !== bannerCycleVideoKey) {
			triggerBannerCycle(true);
		}
	}

	$: if (playerControls) {
		applyGlobalAudioPreference();
	}

	$: if (audioUnlocked !== lastAudioUnlocked) {
		lastAudioUnlocked = audioUnlocked;
		if (playerControls) {
			applyGlobalAudioPreference({ force: true, forcePlay: audioUnlocked });
		}
	}

	onMount(() => {
		mounted = true;
		lastSheetUrl = sheetUrl;

		if (sheetUrl) {
			refreshPlaylist();
		} else {
			errorMessage = 'Informe o link do Google Sheets para iniciar a playlist.';
		}

		return () => {
			mounted = false;
			fetchController?.abort();
			clearBannerTimer();
			cancelInterval();
			cancelPosterMeasurement();
		};
	});

	$: if (mounted && sheetUrl !== lastSheetUrl) {
		lastSheetUrl = sheetUrl;
		if (sheetUrl) {
			refreshPlaylist({ reason: 'url-change' });
		} else {
			clearPlaylist();
			errorMessage = 'Informe o link do Google Sheets para iniciar a playlist.';
		}
	}

	$: if (mounted && initialMuted !== lastInitialMuted) {
		lastInitialMuted = initialMuted;
		if (!audioUnlocked) {
			audioUnlocked = !initialMuted;
		}
	}

	$: if (mounted && autoPlay !== lastAutoPlayProp) {
		lastAutoPlayProp = autoPlay;
		pendingAutoPlay = videos[currentIndex]?.autoPlay ?? autoPlay;
	}


	function clearPlaylist() {
		videos = [];
		currentIndex = 0;
		pendingAutoPlay = autoPlay;
		playerControls = null;
		lastAppliedMute = null;
		playerErrorMessage = '';
		cancelInterval();
	}

	function goToIndex(nextIndex) {
		cancelInterval();
		if (!videos.length) return;
		const normalizedIndex = ((nextIndex % videos.length) + videos.length) % videos.length;
		currentIndex = normalizedIndex;
		pendingAutoPlay = videos[normalizedIndex]?.autoPlay ?? autoPlay;
		playerErrorMessage = '';
	}

	async function refreshPlaylist({ silent = false, reason = 'manual', forceRestart = false } = {}) {
		if (!browser) return false;
		if (!sheetUrl) return false;

		if (!silent) {
			loading = true;
		}

		errorMessage = '';
		const controller = new AbortController();
		fetchController?.abort();
		fetchController = controller;

		try {
			const { rows } = await fetchGoogleSheet({ sheetUrl, signal: controller.signal });
			const parsed = normalizeRows(rows);

			if (!parsed.length) {
				throw new Error('Nenhum vídeo válido encontrado na planilha.');
			}

			videos = parsed;
			lastUpdatedAt = new Date();
			if (forceRestart || restartOnRefresh || currentIndex >= parsed.length) {
				goToIndex(0);
			} else {
				goToIndex(currentIndex);
			}
			errorMessage = '';
			return true;
		} catch (err) {
			if (controller.signal.aborted) {
				return false;
			}
			const message =
				err?.message ?? 'Erro ao carregar a planilha do Google Sheets para o G1 Ao Vivo.';
			errorMessage = message;
			if (!videos.length) {
				clearPlaylist();
			}
			return false;
		} finally {
			if (!silent) {
				loading = false;
			}
			if (fetchController === controller) {
				fetchController = null;
			}
		}
	}

	function handleControls(event) {
		const { controls, reason } = event?.detail ?? {};
		playerControls = controls || null;
		lastAppliedMute = null;
		if (playerControls) {
			applyGlobalAudioPreference({ force: true, forcePlay: audioUnlocked });
		}
		if (normalizedBannerMode === 'per-video' && hasBannerContent && currentVideo) {
			triggerBannerCycle(true);
		}
		if (pendingAutoPlay && (reason === 'ready' || reason === 'created')) {
			const maybePlay = controls?.play?.();
			pendingAutoPlay = false;
			if (maybePlay?.catch instanceof Function) {
				maybePlay.catch(() => {
					/* swallow autoplay rejections */
				});
			}
		}
	}

	async function handleEnded() {
		if (!videos.length) return;
		const nextIndex = currentIndex + 1;
		const completedCycle = nextIndex >= videos.length;
		if (completedCycle) {
			const refreshed = await refreshPlaylist({
				silent: true,
				reason: 'end-of-playlist',
				forceRestart: true
			});
			if (!refreshed) {
				goToIndex(0);
			}
			restartCurrentVideoLoop();
			return;
		}
		if (!startIntervalBetweenVideos(nextIndex)) {
			goToIndex(nextIndex);
		}
	}

	function restartCurrentVideoLoop() {
		const shouldAutoPlay = pendingAutoPlay;
		const player = playerControls?.getPlayer?.();
		try {
			player?.seek?.(0);
		} catch (error) {
			console.warn('G1AoVivo: falha ao reiniciar player após ciclo completo', error);
		}
		if (shouldAutoPlay) {
			const maybe = playerControls?.play?.();
			if (maybe?.catch instanceof Function) {
				maybe.catch(() => {
					/* autoplay rejection ao tentar reiniciar ciclo */
				});
			}
		}
	}

	function handlePlay() {
		pendingAutoPlay = false;
	}

	function handleAudioUnlock() {
		audioUnlocked = true;
	}

	function handleAudioLock() {
		audioUnlocked = false;
		if (playerControls) {
			applyGlobalAudioPreference({ force: true });
		}
	}

	function handlePlayerError(event) {
		const detail = event?.detail;
		if (detail?.message) {
			playerErrorMessage = detail.message;
		}
	}

	function tryResumePlayback() {
		if (!playerControls) return;
		try {
			const maybe = playerControls.play?.();
			if (maybe?.catch instanceof Function) {
				maybe.catch(() => {});
			}
		} catch (error) {
			console.warn('G1AoVivo: falha ao retomar reprodução após liberar áudio', error);
		}
	}

	function applyGlobalAudioPreference({ force = false, forcePlay = false } = {}) {
		if (!playerControls) return;
		const shouldMute = !audioUnlocked;
		const needsUpdate = force || lastAppliedMute !== shouldMute;
		if (needsUpdate) {
			try {
				playerControls.setMuted?.(shouldMute);
				lastAppliedMute = shouldMute;
			} catch (error) {
				console.warn('G1AoVivo: falha ao sincronizar estado de áudio', error);
			}
		}
		if (!shouldMute && (forcePlay || needsUpdate)) {
			tryResumePlayback();
		}
	}

	function clearBannerTimer() {
		if (bannerTimer) {
			clearTimeout(bannerTimer);
			bannerTimer = null;
		}
	}

	function triggerBannerCycle(force = false) {
		if (normalizedBannerMode !== 'per-video' || !hasBannerContent || !currentVideo) {
			return;
		}
		const key = currentVideo._key ?? `index-${currentIndex}`;
		if (!force && key === bannerCycleVideoKey) {
			return;
		}
		bannerCycleVideoKey = key;
		clearBannerTimer();
		isBannerVisible = true;
		const duration = Math.max(500, Number(bannerDisplayDuration) || 4000);
		bannerTimer = setTimeout(() => {
			isBannerVisible = false;
		}, duration);
	}

	function startIntervalBetweenVideos(nextIndex) {
		if (intervalMediaKind === 'none' || videos.length <= 1) {
			return false;
		}
		isIntervalActive = true;
		pendingIntervalIndex = nextIndex;
		if (intervalMediaKind === 'image') {
			const duration = normalizedIntervalDuration;
			clearIntervalTimer();
			intervalTimer = setTimeout(finishInterval, duration);
		} else if (intervalMediaKind === 'video') {
			clearIntervalTimer();
			// autoplay will be triggered via on:loadeddata
		}
		return true;
	}

	function finishInterval() {
		clearIntervalTimer();
		if (!isIntervalActive) return;
		isIntervalActive = false;
		const targetIndex = pendingIntervalIndex;
		pendingIntervalIndex = null;
		if (typeof targetIndex === 'number') {
			goToIndex(targetIndex);
		}
	}

	function cancelInterval() {
		clearIntervalTimer();
		isIntervalActive = false;
		pendingIntervalIndex = null;
	}

	function clearIntervalTimer() {
		if (intervalTimer) {
			clearTimeout(intervalTimer);
			intervalTimer = null;
		}
	}

	function handleIntervalVideoLoaded() {
		try {
			intervalVideoElement?.play?.();
		} catch (error) {
			console.warn('G1AoVivo: falha ao iniciar vídeo de intervalo', error);
		}
	}

	function handleIntervalVideoError() {
		console.warn('G1AoVivo: erro ao reproduzir vídeo de intervalo');
		setTimeout(finishInterval, 500);
	}

	function requestPosterAspect(url) {
		if (!browser || !url) return;
		if (posterAspectCache.has(url)) {
			posterAspectRatio = posterAspectCache.get(url);
			return;
		}
		const token = ++posterLoadToken;
		const img = new Image();
		img.onload = () => {
			if (token !== posterLoadToken) return;
			if (img.naturalWidth > 0 && img.naturalHeight > 0) {
				const ratio = img.naturalWidth / img.naturalHeight;
				posterAspectCache.set(url, ratio);
				posterAspectRatio = ratio;
			} else {
				posterAspectRatio = null;
			}
		};
		img.onerror = () => {
			if (token !== posterLoadToken) return;
			posterAspectRatio = null;
		};
		img.src = url;
	}

	function cancelPosterMeasurement() {
		posterLoadToken += 1;
	}

	function deriveAspectRatioFromProps() {
		const sources = [
			currentVideo?.aspectRatio,
			currentVideo?.aspectRatioMobile,
			currentVideo?.aspectRatioDesktop
		];
		for (const candidate of sources) {
			const parsed = parseAspectRatioValue(candidate);
			if (parsed) return parsed;
		}
		return null;
	}

	function parseAspectRatioValue(value) {
		if (value === undefined || value === null) return null;
		if (typeof value === 'number') {
			if (Number.isFinite(value) && value > 0) return value;
			return null;
		}
		const raw = String(value).trim();
		if (!raw) return null;
		const normalized = raw.replace(',', '.');
		if (normalized.includes('/')) {
			const [widthPart, heightPart] = normalized.split('/');
			const width = Number(widthPart.trim());
			const height = Number(heightPart.trim());
			if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
				return width / height;
			}
		}
		const numeric = Number(normalized);
		if (Number.isFinite(numeric) && numeric > 0) {
			return numeric;
		}
		return null;
	}

	function normalizeRows(rows = []) {
		if (!Array.isArray(rows)) {
			return [];
		}
		return rows.map((row, index) => normalizeRow(row, index)).filter(Boolean);
	}

	function normalizeRow(row, index) {
		if (!row || typeof row !== 'object') {
			return null;
		}

		const lookup = buildLookup(row);
		const getValue = (keys) => pickValue(lookup, keys);

		const videoIdDesktop = getValue(VIDEO_DESKTOP_KEYS);
		const videoIdMobile = getValue(VIDEO_MOBILE_KEYS);
		const fallbackId = getValue(VIDEO_GENERIC_KEYS);

		if (!videoIdDesktop && !videoIdMobile && !fallbackId) {
			return null;
		}

		const caption = getValue(CAPTION_KEYS) ?? '';
		const credit = getValue(CREDIT_KEYS) ?? '';
		const title = getValue(TITLE_KEYS) ?? `Vídeo ${index + 1}`;
		const skipDFP = parseMaybeBoolean(getValue(SKIP_DFP_KEYS), true);
		const rowAutoPlay = parseMaybeBoolean(getValue(AUTOPLAY_KEYS), undefined);
		const rowStartMuted = parseMaybeBoolean(getValue(START_MUTED_KEYS), false);
	const { text: rowBannerText, description: rowBannerDescription } = deriveCartelaCopy(
		row,
		getValue
	);
		const rowAspectRatio = getValue(ASPECT_RATIO_KEYS) ?? undefined;
		const rowAspectRatioMobile = getValue(ASPECT_RATIO_MOBILE_KEYS) ?? undefined;
		const rowWidthDesktop = getValue(WIDTH_DESKTOP_KEYS) ?? undefined;
		const rowWidthMobile = getValue(WIDTH_MOBILE_KEYS) ?? undefined;
		const rowPoster = getValue(POSTER_KEYS) ?? undefined;
		const rowPosterAlt = getValue(POSTER_ALT_KEYS) ?? undefined;
		const rowBackground = getValue(BACKGROUND_COLOR_KEYS) ?? undefined;
		const rowHideAudio = parseMaybeBoolean(getValue(HIDE_AUDIO_KEYS), undefined);

		const key =
			getValue(KEY_KEYS) ?? videoIdDesktop ?? videoIdMobile ?? fallbackId ?? `video-${index}`;

		return {
			_key: key,
			title,
			caption,
			credit,
			videoIdDesktop: videoIdDesktop ?? '',
			videoIdMobile: videoIdMobile ?? '',
			videoId: fallbackId ?? '',
			autoPlay: rowAutoPlay,
			startMuted: rowStartMuted ?? false,
			skipDFP,
			aspectRatio: rowAspectRatio,
			aspectRatioMobile: rowAspectRatioMobile,
			widthDesktop: rowWidthDesktop,
			widthMobile: rowWidthMobile,
			poster: rowPoster,
			posterAlt: rowPosterAlt,
			backgroundColor: rowBackground,
			hideNativeAudioButton: rowHideAudio,
			bannerText: rowBannerText,
			bannerDescription: rowBannerDescription
		};
	}

	function buildLookup(row) {
	const lookup = {};
	for (const [rawKey, value] of Object.entries(row)) {
		const key = String(rawKey ?? '').trim();
		if (!key) continue;
		const normalized = key
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase();
		const normalizedWithUnderscore = normalized.replace(/[^a-z0-9]+/g, '_');
		const normalizedCompact = normalized.replace(/[^a-z0-9]+/g, '');
		const normalizedNoSuffix = normalizedWithUnderscore.replace(/_[0-9]+$/, '');
		const compactNoSuffix = normalizedCompact.replace(/_[0-9]+$/, '');
		const variants = new Set([
			key,
			normalized,
			normalizedWithUnderscore,
			normalizedCompact,
			normalizedNoSuffix,
			normalizedNoSuffix.replace(/[^a-z0-9]+/g, '_'),
			compactNoSuffix
		]);
		for (const variant of variants) {
			const safeVariant = variant?.trim();
			if (safeVariant) {
				lookup[safeVariant] = value;
			}
		}
	}
	return lookup;
}


function pickValue(lookup, candidates = []) {
	for (const candidate of candidates) {
		if (!candidate) continue;
		const normalized = String(candidate)
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase();
		const variants = [
			candidate,
			normalized,
			normalized.replace(/[^a-z0-9]+/g, '_'),
			normalized.replace(/[^a-z0-9]+/g, '')
		];
		for (const key of variants) {
			if (!key) continue;
			if (Object.prototype.hasOwnProperty.call(lookup, key)) {
				const value = lookup[key];
				if (value === undefined || value === null) continue;
				if (typeof value === 'string') {
					const trimmed = value.trim();
					if (trimmed) {
						return trimmed;
					}
				} else if (typeof value === 'number') {
					if (!Number.isNaN(value)) {
						return String(value);
					}
				} else if (typeof value === 'boolean') {
					return value;
				}
			}
		}
	}
	return null;
}

function takeFirstNonEmpty(values = []) {
	for (const value of values) {
		if (value === undefined || value === null) continue;
		if (typeof value === 'string') {
			const trimmed = value.trim();
			if (trimmed) return trimmed;
		} else if (typeof value === 'number' && !Number.isNaN(value)) {
			return String(value);
		}
	}
	return '';
}

function deriveCartelaCopy(row, getValue) {
	const safeGet = typeof getValue === 'function' ? getValue : () => undefined;
	const cartelaText = takeFirstNonEmpty([
		safeGet(CARTELA_TEXT_KEYS),
		row?.textocartela,
		row?.texto_cartela,
		row?.texto_cartela_2,
		row?.bannertext,
		row?.banner_text
	]);
	const cartelaDescription = takeFirstNonEmpty([
		safeGet(CARTELA_DESCRIPTION_KEYS),
		row?.descricao,
		row?.descricao_cartela,
		row?.description,
		row?.desc
	]);
	return {
		text: cartelaText,
		description: cartelaDescription
	};
}

	function parseMaybeBoolean(value, fallback = undefined) {
		if (value === undefined || value === null || value === '') {
			return fallback;
		}
		if (typeof value === 'boolean') {
			return value;
		}
		const normalized = String(value).trim().toLowerCase();
		if (TRUTHY_VALUES.has(normalized)) return true;
		if (FALSY_VALUES.has(normalized)) return false;
		return fallback;
	}

	function formatTimestamp(date) {
		if (!(date instanceof Date)) return '';
		try {
			return new Intl.DateTimeFormat('pt-BR', {
				hour: '2-digit',
				minute: '2-digit'
			}).format(date);
		} catch (error) {
			return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
		}
	}
</script>

<section class="g1aovivo" style={`--g1aovivo-bg:${backgroundColor};`}>
	<div class="g1aovivo__inner">
		{#if showHeader && (title || description)}
			<header class="g1aovivo__header">
				{#if title}
					<h2 class="g1aovivo__title">{title}</h2>
				{/if}
				{#if description}
					<p class="g1aovivo__description">{@html description}</p>
				{/if}
			</header>
		{/if}

		{#if showNowPlaying && nowPlayingTitle}
			<div class="g1aovivo__now-playing">
				<span class="g1aovivo__now-playing-label">Agora:</span>
				<span class="g1aovivo__now-playing-title">{nowPlayingTitle}</span>
			</div>
		{/if}

		<div class="g1aovivo__player" class:g1aovivo__player--vertical={isVerticalVideo}>
			{#if isVerticalVideo}
				{#if normalizedBackgroundType === 'image'}
					<div
						class="g1aovivo__player-bg g1aovivo__player-bg--image"
						style={`background-image:url("${backgroundImage}")`}
					></div>
				{:else if normalizedBackgroundType === 'video'}
					<video
						class="g1aovivo__player-bg g1aovivo__player-bg--video"
						src={backgroundVideo}
						poster={backgroundVideoPoster}
						muted
						loop
						autoplay
						playsinline
					/>
				{/if}
				<div
					class="g1aovivo__player-inner g1aovivo__player-inner--vertical"
					style={`--vertical-aspect:${verticalAspectRatio};`}
				>
					{#if hasBannerContent && isBannerVisible}
						<div
							class="g1aovivo__banner"
							style={`--banner-bg:${bannerBackgroundColor}; --banner-color:${bannerTextColor}; --banner-font-size:${bannerFontSize}; --banner-font-weight:${bannerFontWeight}; --banner-border:${bannerBorderColor}; --banner-min-height:${bannerHeight}; --banner-description-color:${bannerDescriptionColor}; --banner-description-font-size:${bannerDescriptionFontSize}; --banner-description-font-weight:${bannerDescriptionFontWeight};`}
						>
							<div class="g1aovivo__banner-content">
								{#if currentBannerText}
									<span class="g1aovivo__banner-title">{currentBannerText}</span>
								{/if}
								{#if currentBannerDescription}
									<span class="g1aovivo__banner-description">{currentBannerDescription}</span>
								{/if}
							</div>
						</div>
					{/if}
					{#if isIntervalActive && intervalMediaKind !== 'none'}
						<div class="g1aovivo__interval">
							{#if intervalMediaKind === 'image'}
								<img
									src={intervalImageUrl}
									alt={intervalCaption || 'Intervalo'}
									class="g1aovivo__interval-media"
								/>
								{#if intervalCaption}
									<p class="g1aovivo__interval-caption">{intervalCaption}</p>
								{/if}
							{:else}
								<video
									class="g1aovivo__interval-media"
									src={intervalVideoUrl}
									playsinline
									muted
									autoplay
									bind:this={intervalVideoElement}
									on:loadeddata={handleIntervalVideoLoaded}
									on:ended={finishInterval}
									on:error={handleIntervalVideoError}
								/>
								{#if intervalCaption}
									<p class="g1aovivo__interval-caption">{intervalCaption}</p>
								{/if}
							{/if}
						</div>
					{/if}
					{#if currentVideo}
						<div
							class="g1aovivo__player-shell"
							class:g1aovivo__player-shell--vertical={isVerticalVideo}
							style={`--vertical-width:${verticalWidthExpression};`}
						>
							<GloboPlayer
								videoIdDesktop={currentVideo.videoIdDesktop}
								videoIdMobile={currentVideo.videoIdMobile}
								videoId={currentVideo.videoId}
								containerBackgroundColor={computedBackground}
								widthDesktop={computedWidthDesktop}
								widthMobile={computedWidthMobile}
								aspectRatio={computedAspectRatio}
								aspectRatioMobile={computedAspectRatioMobile}
								autoPlay={computedAutoPlay}
								autoplay={computedAutoPlay}
								startMuted={computedStartMuted}
								skipDFP={computedSkipDFP}
								{showCaption}
								caption={resolvedCaption}
								credit={resolvedCredit}
								hideNativeAudioButton={computedHideAudioButton}
								poster={currentVideo.poster}
								posterAlt={currentVideo.posterAlt}
								on:controls={handleControls}
								on:ended={handleEnded}
								on:play={handlePlay}
								on:audiounlock={handleAudioUnlock}
								on:audiolock={handleAudioLock}
								on:error={handlePlayerError}
							/>
						</div>
					{:else}
						<div
							class="g1aovivo__state"
							class:g1aovivo__state--loading={loading}
							class:g1aovivo__state--error={Boolean(errorMessage)}
						>
							{#if loading}
								<p>Carregando playlist do G1 Ao Vivo…</p>
							{:else if errorMessage}
								<p>{errorMessage}</p>
							{:else}
								<p>Nenhum vídeo disponível na planilha.</p>
							{/if}
						</div>
					{/if}
				</div>
			{:else}
				{#if hasBannerContent && isBannerVisible}
					<div
						class="g1aovivo__banner"
						style={`--banner-bg:${bannerBackgroundColor}; --banner-color:${bannerTextColor}; --banner-font-size:${bannerFontSize}; --banner-font-weight:${bannerFontWeight}; --banner-border:${bannerBorderColor}; --banner-min-height:${bannerHeight}; --banner-description-color:${bannerDescriptionColor}; --banner-description-font-size:${bannerDescriptionFontSize}; --banner-description-font-weight:${bannerDescriptionFontWeight};`}
					>
						<div class="g1aovivo__banner-content">
							{#if currentBannerText}
								<span class="g1aovivo__banner-title">{currentBannerText}</span>
							{/if}
							{#if currentBannerDescription}
								<span class="g1aovivo__banner-description">{currentBannerDescription}</span>
							{/if}
						</div>
					</div>
				{/if}
				{#if isIntervalActive && intervalMediaKind !== 'none'}
					<div class="g1aovivo__interval">
						{#if intervalMediaKind === 'image'}
							<img
								src={intervalImageUrl}
								alt={intervalCaption || 'Intervalo'}
								class="g1aovivo__interval-media"
							/>
							{#if intervalCaption}
								<p class="g1aovivo__interval-caption">{intervalCaption}</p>
							{/if}
						{:else}
							<video
								class="g1aovivo__interval-media"
								src={intervalVideoUrl}
								playsinline
								muted
								autoplay
								bind:this={intervalVideoElement}
								on:loadeddata={handleIntervalVideoLoaded}
								on:ended={finishInterval}
								on:error={handleIntervalVideoError}
							/>
							{#if intervalCaption}
								<p class="g1aovivo__interval-caption">{intervalCaption}</p>
							{/if}
						{/if}
					</div>
				{/if}
				{#if currentVideo}
					<div class="g1aovivo__player-shell">
						<GloboPlayer
							videoIdDesktop={currentVideo.videoIdDesktop}
							videoIdMobile={currentVideo.videoIdMobile}
							videoId={currentVideo.videoId}
							containerBackgroundColor={computedBackground}
							widthDesktop={computedWidthDesktop}
							widthMobile={computedWidthMobile}
							aspectRatio={computedAspectRatio}
							aspectRatioMobile={computedAspectRatioMobile}
							autoPlay={computedAutoPlay}
							autoplay={computedAutoPlay}
							startMuted={computedStartMuted}
							skipDFP={computedSkipDFP}
							{showCaption}
							caption={resolvedCaption}
							credit={resolvedCredit}
							hideNativeAudioButton={computedHideAudioButton}
							poster={currentVideo.poster}
							posterAlt={currentVideo.posterAlt}
							on:controls={handleControls}
							on:ended={handleEnded}
							on:play={handlePlay}
							on:audiounlock={handleAudioUnlock}
							on:audiolock={handleAudioLock}
							on:error={handlePlayerError}
						/>
					</div>
				{:else}
					<div
						class="g1aovivo__state"
						class:g1aovivo__state--loading={loading}
						class:g1aovivo__state--error={Boolean(errorMessage)}
					>
						{#if loading}
							<p>Carregando playlist do G1 Ao Vivo…</p>
						{:else if errorMessage}
							<p>{errorMessage}</p>
						{:else}
							<p>Nenhum vídeo disponível na planilha.</p>
						{/if}
					</div>
				{/if}
			{/if}
		</div>

		{#if loading && currentVideo}
			<div class="g1aovivo__loading-indicator">Atualizando lista de vídeos…</div>
		{/if}

		{#if playerErrorMessage}
			<div class="g1aovivo__alert g1aovivo__alert--player">
				⚠️ {playerErrorMessage}
			</div>
		{/if}

		{#if errorMessage && !currentVideo}
			<div class="g1aovivo__alert g1aovivo__alert--error">
				⚠️ {errorMessage}
			</div>
		{/if}

		{#if showMeta && lastUpdatedLabel}
			<div class="g1aovivo__meta">
				Lista atualizada às {lastUpdatedLabel} — nova checagem acontece ao fim de cada playlist.
			</div>
		{/if}
	</div>
</section>

<style>
	.g1aovivo {
		padding: 0;
		background: var(--g1aovivo-bg, transparent);
	}

	.g1aovivo__inner {
		display: flex;
		flex-direction: column;
		gap: 0;
		min-height: 100vh;
	}

	.g1aovivo__header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.g1aovivo__title {
		font-size: clamp(1.5rem, 2vw + 1rem, 2.25rem);
		line-height: 1.2;
		margin: 0;
		color: #0f172a;
	}

	.g1aovivo__description {
		margin: 0;
		color: #334155;
		font-size: 1rem;
		line-height: 1.5;
	}

	.g1aovivo__now-playing {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		align-self: flex-start;
		padding: 0.25rem 0.75rem;
		border-radius: 999px;
		background: rgba(15, 23, 42, 0.08);
		color: #0f172a;
		font-size: 0.9rem;
		font-weight: 600;
	}

	.g1aovivo__now-playing-label {
		text-transform: uppercase;
		font-size: 0.75rem;
		letter-spacing: 0.04em;
		color: #2563eb;
	}

	.g1aovivo__player {
		position: relative;
		flex: 1;
		min-height: 100vh;
		overflow: hidden;
		background: #000;
	}

	.g1aovivo__player-bg {
		position: absolute;
		inset: 0;
		z-index: 1;
		object-fit: cover;
		width: 100%;
		height: 100%;
		filter: brightness(0.35) blur(18px);
		transform: scale(1.08);
	}

	.g1aovivo__player-bg--image {
		background-size: cover;
		background-position: center;
	}

	.g1aovivo__player-inner {
		position: relative;
		z-index: 2;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: clamp(1rem, 3vw, 3rem);
	}

	.g1aovivo__player-inner--vertical {
		padding: clamp(1.5rem, 4vw, 4rem);
	}

	.g1aovivo__interval {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100vh;
		background: #000;
		color: #fff;
		z-index: 1100;
		overflow: hidden;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding: clamp(1.25rem, 4vw, 3rem);
		text-align: center;
	}

	@supports (height: 100dvh) {
		.g1aovivo__interval {
			height: 100dvh;
		}
	}

	.g1aovivo__interval-media {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		display: block;
	}

	.g1aovivo__interval-caption {
		position: relative;
		z-index: 1;
		margin: 0;
		padding: 1rem 1.5rem;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(6px);
		font-size: clamp(1rem, 1.5vw, 1.35rem);
		font-weight: 500;
		max-width: min(90vw, 960px);
		color: #fff;
	}

	.g1aovivo__player-shell {
		width: 100%;
	}

	.g1aovivo__player-shell--vertical {
		width: var(--vertical-width, 90vw);
		max-width: var(--vertical-width, 90vw);
		margin: 0 auto;
	}

	.g1aovivo__banner {
		position: absolute;
		bottom: 10%;
		left: 3%;
		right: auto;
		background: var(--banner-bg, rgba(15, 23, 42, 0.85));
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 5;
		padding: 16px;
		text-align: left;
		border: 1px solid var(--banner-border, rgba(255, 255, 255, 0.35));
		max-width: min(400px, 80vw);
		width: auto;
		min-height: var(--banner-min-height, auto);
		border-radius: 12px;
		box-shadow: 0 15px 30px rgba(0, 0, 0, 0.35);
	}

	.g1aovivo__banner-content {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		color: var(--banner-color, #fff);
		line-height: 1.3;
	}

	.g1aovivo__banner-title {
		font-size: var(--banner-font-size, 1rem);
		font-weight: var(--banner-font-weight, 600);
	}

	.g1aovivo__banner-description {
		color: var(--banner-description-color, rgba(255, 255, 255, 0.85));
		font-size: var(--banner-description-font-size, 0.9rem);
		font-weight: var(--banner-description-font-weight, 400);
	}

	:global(.g1aovivo__player-inner .video-section-wrapper) {
		width: min(100%, 1400px);
		max-width: 100%;
		padding: 0;
	}

	:global(.g1aovivo__player-inner .globo-player-container) {
		width: 100%;
		margin: 0 auto;
	}

	:global(.g1aovivo__player-inner .player-wrapper) {
		width: 100%;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 30px 50px rgba(0, 0, 0, 0.45);
	}

	:global(.g1aovivo__player-inner--vertical .globo-player-container) {
		width: min(calc(100vh * var(--vertical-aspect, 0.5625)), 90vw) !important;
		max-width: 100%;
	}

	:global(.g1aovivo__player-inner--vertical .player-wrapper) {
		width: 100%;
		height: 100vh;
		max-height: 100vh;
		aspect-ratio: var(--vertical-aspect, 9 / 16) !important;
	}

	@supports (height: 100dvh) {
		:global(.g1aovivo__player-inner--vertical .player-wrapper) {
			height: 100dvh;
			max-height: 100dvh;
		}
	}

	:global(.g1aovivo__player:not(.g1aovivo__player--vertical) .video-section-wrapper) {
		width: 100vw;
		max-width: none;
		padding: 0;
	}

	:global(.g1aovivo__player:not(.g1aovivo__player--vertical) .globo-player-container) {
		width: 100vw !important;
		max-width: none;
		margin: 0;
	}

	:global(.g1aovivo__player:not(.g1aovivo__player--vertical) .player-wrapper) {
		width: 100%;
		height: 100vh;
		min-height: 100vh;
		aspect-ratio: auto !important;
		border-radius: 0;
	}

	@supports (height: 100dvh) {
		:global(.g1aovivo__player:not(.g1aovivo__player--vertical) .player-wrapper) {
			height: 100dvh;
			min-height: 100dvh;
		}
	}

	.g1aovivo__state {
		padding: 2rem;
		border: 1px dashed rgba(148, 163, 184, 0.6);
		border-radius: 12px;
		text-align: center;
		color: #475569;
		background: rgba(15, 23, 42, 0.02);
		font-size: 0.95rem;
	}

	.g1aovivo__state--loading {
		border-style: solid;
		border-color: rgba(59, 130, 246, 0.4);
		background: rgba(191, 219, 254, 0.2);
		color: #1d4ed8;
	}

	.g1aovivo__state--error {
		border-style: solid;
		border-color: rgba(248, 113, 113, 0.55);
		background: rgba(254, 226, 226, 0.45);
		color: #7f1d1d;
	}

	.g1aovivo__loading-indicator {
		font-size: 0.85rem;
		color: #1e293b;
		opacity: 0.8;
	}

	.g1aovivo__alert {
		padding: 0.75rem 1rem;
		border-radius: 10px;
		font-size: 0.9rem;
	}

	.g1aovivo__alert--player {
		background: rgba(254, 249, 195, 0.4);
		color: #78350f;
	}

	.g1aovivo__alert--error {
		background: rgba(254, 226, 226, 0.4);
		color: #7f1d1d;
	}

	.g1aovivo__meta {
		font-size: 0.8rem;
		color: #475569;
	}

	@media (min-width: 1024px) {
		.g1aovivo__inner {
			gap: 1.25rem;
		}

		.g1aovivo__description {
			font-size: 1.05rem;
		}
	}
</style>
