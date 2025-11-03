<script>
	import { onMount, onDestroy, createEventDispatcher, tick } from 'svelte';
	import { browser } from '$app/environment';
	import GloboPlayer from './GloboPlayer.svelte';
	import { fetchGoogleSheet, sanitizeHeader } from '$lib/utils/googleSheets.js';

	const dispatch = createEventDispatcher();
	const MobileView = {
		SHORTZ: 'shortz',
		FEED: 'feed'
	};
	const SHORTZ_SEEN_STORAGE_KEY = 'video-sheet-showcase:shortz-seen';
	const SHORTZ_LAST_LEAD_STORAGE_KEY = 'video-sheet-showcase:last-shortz-lead';

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

	let searchStyleVars = '';
	let controlsInlineStyle = '';
	let showCountsEnabled = false;
	let shouldMuteInitially = true;
	let shouldAutoMute = true;
	let pageTitle = '';
	let headingTitle = '';
	let headingSubtitle = '';
	let showHeadingBlock = false;
	let fallbackTitle = '';
	let desktopTitleResolved = '';
	let mobileTitleResolved = '';
	let desktopSubtitleResolved = '';
	let mobileSubtitleResolved = '';
	let mobileChromeStyle = '';
	let layoutControlsStartMuted = true;
	let layoutControlsAutoMute = true;
	let desktopTopbarColorResolved = '';
	let desktopTopbarBackgroundResolved = '';

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
	let searchTermNormalized = '';
	let searchSuggestions = [];
	let filterShortcutOptions = [];

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
	let filteredVideosOrdered = [];
	let filteredVideosShuffleKey = '';
	let defaultShuffleActive = false;
	let filtersIdle = true;
	let searchActive = false;
	let searchSuggestionsVisible = false;
	let searchSuggestionsHideTimeoutId = null;
	let searchFieldFocused = false;
	let shouldAutoFocusSearch = true;

	let totalVideos = 0;
	let totalVisible = 0;

	let controlsStuck = false;
	let sentinelElement;
	let rootElement;
	let controlsElement;
	let controlsFixed = false;
	let controlsBounds = null;
	let controlsPlaceholderHeight = 1;
	let controlsPlaceholderStyle = 'height:1px';
	let controlsFloatingVisible = false;
	let controlsRevealActive = false;
	let controlsRevealSentinelElement;
	let revealObserver = null;
	let revealObservedElement = null;
	let controlsFloatingStateToken = 0;

	let viewportObserver;

	let viewportWidth = 1280;
	let isMobileFeed = false;
	let isMobileFeedGrid = false;
	let isMobileViewport = false;
	let mobileChromeVisible = false;
	let topbarVisible = false;
	let mobileFeedContainer = null;
	let lastMobileFeedContainer = null;
	let feedObserver = null;
	const feedItemElements = new Map();
	let activeFeedId = null;
	let feedLeadVideoId = null;
	let feedOrderToken = 0;
	let feedAdsDisabled = false;
	let headerInViewport = false;
let creditsInViewport = false;
let mobileChromeSuppressed = false;
let headerObserver = null;
let headerObserverTarget = null;
let creditsObserver = null;
let creditsObserverTarget = null;
let creditsObserverRetryId = null;
let creditsObserverRetryCount = 0;
let hideControlsForCredits = false;
	let feedVideosBase = [];
	let feedVideos = [];
	let feedVideosKey = null;
	let resizeCleanup = null;
	let overlayKeydownCleanup = null;
	let mobileFeedStyles = '';
	const feedPlayerControls = new Map();
	let feedPlaybackVersion = 0;
	let feedOverlayMode = 'none';
	let feedOverlayVisible = false;
	let feedInitialized = false;
	let snapInProgress = false;
	let snapTimeoutId;
	let searchInputRef;
	let mobileViewMode = MobileView.SHORTZ;
	let videoMetaVisibleMobile = true;
let feedMetaHidden = new Set();
let feedMetaTimerId = null;
let feedMetaTimerVideoId = null;
let lastFeedMetaActiveId = null;
let feedMetaHoldActive = false;
let feedMetaHoldVideoId = null;
let feedMetaHoldEndHandler = null;
	let feedIndexLookup = new Map();
	let mobileFeedLocked = false;
	let mobileFeedLockTimerId = null;
	let shortzSeenIds = new Set();
	let shortzSeenHydrated = false;
	let shortzSeenInitial = new Set();
	let hideControlsForMobileFeed = false;
	let feedPosterVisible = new Map();
	let shortzLastLeadId = null;
	let shortzLastLeadPersistedId = null;
	let shortzLeadAvoidId = null;
	let lastActiveFeedId = null;
	let feedPlayerWindow = new Set();
	const FEED_PLAYER_BUFFER = 1;
	const feedAdSlots = new Set();
	const desktopPlayerControls = new Map();
	const desktopVideoElements = new Map();
	let desktopVisibilityObserver = null;
	let desktopObserverActive = false;
	let autoScrollTriggered = false;
	let desktopOverlayVideoId = null;
	let desktopOverlayVideos = [];
	let desktopOverlayIndex = -1;
	let desktopOverlayVideo = null;
	let desktopOverlayElement;
	let desktopOverlayPinnedVideoId = null;
	let desktopOverlayShuffleSeed = 0;
	let desktopOverlayShuffleKey = '';
	let desktopOverlayScrollTop = 0;
	let desktopOverlayControls = null;
	let desktopOverlaySkipDFP = false;
	let desktopOverlayPendingAutoplay = false;
	let desktopOverlayTransitionLock = false;
	let desktopOverlayTransitionToken = 0;
	const DESKTOP_SKIP_PATTERN = [false];
	let desktopPlaybackCount = 0;
	const desktopAdDecisions = new Map();
	const desktopStartedPlaybacks = new Set();
	const BODY_SCROLL_LOCK_CLASS = 'video-sheet-showcase--lock-scroll';
	const DESKTOP_CARD_SCALE = 0.85;
const FEED_META_HIDE_DELAY = 5000;
const AD_CYCLE_LENGTH = 4;
const CREDITS_OBSERVER_MAX_RETRIES = 20;
	const AD_SCROLL_LOCK_DURATION = 5000;
	const DESKTOP_TOPBAR_OFFSET = 'calc(48px + env(safe-area-inset-top, 0px))';
	const MOBILE_INTRO_DURATION = 15;
	const SEARCH_SUGGESTION_MIN_LENGTH = 3;
	const SEARCH_SUGGESTION_LIMIT = 3;

	let showMobileIntro = false;
	let mobileIntroActive = false;
	let mobileIntroDismissed = false;
	let mobileIntroCountdown = MOBILE_INTRO_DURATION;
	let mobileIntroProgress = 1;
	let mobileIntroTimerId = null;
	let mobileIntroAutoAdvanceId = null;
	let mobileIntroReleaseScrollId = null;
	let mobileIntroIgnoreScroll = false;
	let mobileIntroEnabled = true;
	let mobileIntroTitleText = '';
	let mobileIntroSubtitleText = '';
	let mobileIntroIndicatorText = '';
	let mobileIntroSkipLabel = '';
	let mobileIntroCountdownLabel = '';
	let mobileIntroBackground = '';
	let desktopIntroTitleText = '';
	let desktopIntroSubtitleText = '';
	let hasDesktopIntro = false;

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
		instant: false,
		submitLabel: 'Buscar',
		clearLabel: 'Limpar',
		showClearButton: true,
		suggestionLimit: 6,
		containerPadding: '0.5rem',
		containerPaddingDesktop: null,
		inputBackground: 'transparent',
		inputColor: '#111827',
		inputPlaceholderColor: 'rgba(17,24,39,0.45)',
		inputBorderColor: 'rgba(17,24,39,0.15)',
		inputFocusBorderColor: '#111827',
		inputFocusOutline: '#111827',
		buttonBackground: '#111827',
		buttonColor: '#ffffff',
		buttonHoverBackground: '#0f172a',
		buttonBorderColor: 'transparent',
		buttonHoverBorderColor: 'transparent',
		clearButtonBackground: 'rgba(17,24,39,0.05)',
		clearButtonColor: '#111827',
		clearButtonHoverBackground: 'rgba(17,24,39,0.12)',
		clearButtonBorderColor: 'transparent',
		clearButtonHoverBorderColor: 'transparent'
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
		thumbnail: ['poster', 'poster_mobile', 'posterMobile', 'thumb', 'thumbnail', 'imagem', 'image'],
		tag: ['tag', 'tema', 'category'],
		section: ['secao', 'categoria', 'bloco'],
		publishedAt: ['data', 'data_publicacao', 'data_de_publicacao'],
		link: ['link', 'url', 'links'],
		searchTokensExtra: []
	};

	const defaultLayoutConfig = {
		stickyOffset: 'var(--sheet-controls-sticky-offset, 0px)',
		showCounts: false,
		highlightLimit: null,
		cardsPerRowMobile: 1,
		cardsPerRowTablet: 2,
		cardsPerRowDesktop: 4,
		backgroundColor: '#fdf4ed',
		mobileTopbarTitle: '',
		desktopTitle: '',
		desktopSubtitle: '',
		mobileTitle: '',
		mobileSubtitle: '',
		subtitle: '',
		desktopTopbarBackground: '#ffffff',
		desktopTopbarColor: '#111827',
		containerMaxWidthDesktop: 'none',
		containerPaddingMobile: '1rem',
		containerPaddingDesktop: '1rem',
		mobileChromeBackground:
			'linear-gradient(180deg, rgba(17,24,39,0.45) 0%, rgba(17,24,39,0.32) 55%, rgba(17,24,39,0.18) 100%)',
		mobileChromeTextColor: null,
		mobileChromeActiveColor: null,
		mobileBottomBarBackground:
			'linear-gradient(180deg, rgba(6,8,18,0.08) 0%, rgba(6,8,18,0.95) 100%)',
		mobileBottomBarButtonBackground: 'rgba(254, 247, 234, 0.92)',
		mobileBottomBarButtonColor: 'rgba(12, 18, 36, 0.78)',
		mobileBottomBarButtonBorderColor: 'rgba(255, 255, 255, 0.08)',
		mobileBottomBarButtonActiveBackground: 'rgba(255, 250, 241, 0.98)',
		mobileBottomBarButtonActiveColor: '#060a15',
		mobileBottomBarShortzBackground: 'rgba(226, 66, 46, 0.08)',
		mobileBottomBarShortzColor: 'rgba(252, 243, 234, 0.95)',
		mobileBottomBarShortzBorderColor: 'rgba(255, 255, 255, 0.16)',
		mobileBottomBarShortzActiveBackground: '#e34832',
		mobileBottomBarShortzActiveColor: '#ffffff',
		cardGap: '12px',
		cardMinWidthDesktop: '240px',
		cardMaxWidthDesktop: '320px',
		enableMobileFeed: true,
		mobileDefaultView: 'shortz',
		showVideoMeta: true,
		mobileFeedMaxWidth: 768,
		mobileFeedTitleColor: '#ffffff',
		mobileFeedMetaColor: 'rgba(255,255,255,0.78)',
		mobileFeedTagColor: '#111827',
		mobileFeedTagBackground: 'rgba(255,255,255,0.92)',
		mobileFeedOverlay:
			'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(8,12,24,0.78) 62%, rgba(8,12,24,0.92) 100%)',
		mobileFeedControlsOffset: '0px',
		mobileIntroEnabled: true,
		mobileIntroTitle: '',
		mobileIntroSubtitle: '',
		mobileIntroIndicatorLabel: '',
		mobileIntroCountdownLabel: '',
		mobileIntroSkipLabel: '',
		mobileIntroBackground: 'linear-gradient(180deg, rgba(8,12,24,0.9) 0%, rgba(8,12,24,0.55) 100%)',
		desktopIntroTitle: '',
		desktopIntroSubtitle: '',
		headingEyebrowDesktop: '',
		headingEyebrowMobile: '',
		headingEyebrowColor: '#c2410c',
		headingDividerColor: 'rgba(194, 65, 12, 0.28)',
		headingAlignmentDesktop: 'center',
		headingAlignmentMobile: 'left',
		searchMaxWidthDesktop: '100%',
		controlsHeadingColorDesktop: '#b91c1c',
		controlsHeadingSubtitleDesktop: 'rgba(15, 23, 42, 0.65)',
		controlsBackground: 'var(--sheet-background, #fdf4ed)',
		controlsBorderColor: 'transparent',
		controlsShadow: 'none',
		controlsBackdrop: 'none',
		controlsFloatingOffset: null,
		controlsStartMuted: true,
		controlsAutoMute: true,
		sectionTitleColor: '#111827',
		sectionTitleHighlightColor: '#b45309',
		sectionTitleFontSizeMobile: null,
		sectionTitleFontSizeDesktop: null,
		sectionCountColor: 'rgba(15, 23, 42, 0.6)',
		filterChipBackground: 'rgba(15, 23, 42, 0.06)',
		filterChipColor: 'rgba(15, 23, 42, 0.82)',
		filterChipBorderColor: 'transparent',
		filterChipHoverBackground: 'rgba(15, 23, 42, 0.12)',
		filterChipHoverBorderColor: null,
		filterChipActiveBackground: '#0f172a',
		filterChipActiveColor: '#ffffff',
		filterChipActiveBorderColor: '#0f172a',
		filterChipFontSizeMobile: null,
		filterChipFontSizeDesktop: null,
		filterChipCountColor: null,
		videoTitleColor: '#111827',
		videoTitleFontSizeMobile: null,
		videoTitleFontSizeDesktop: null,
		videoTitleFontSizeMobileGrid: null,
		videoSubtitleColor: 'rgba(15, 23, 42, 0.75)',
		videoSubtitleFontSizeMobile: null,
		videoSubtitleFontSizeDesktop: null,
		videoTagBackground: 'rgba(15, 23, 42, 0.08)',
		videoTagColor: 'rgba(15, 23, 42, 0.78)',
		videoTagFontSizeMobile: null,
		videoTagFontSizeDesktop: null,
		desktopOverlayVariant: 'glass',
		desktopOverlayBackdrop:
			'radial-gradient(circle at top left, rgba(80, 132, 247, 0.24), transparent 55%), radial-gradient(circle at bottom right, rgba(236, 72, 153, 0.18), transparent 50%), rgba(5,9,18,0.78)',
		desktopOverlayBackdropBlur: '28px',
		desktopOverlaySurface: 'rgba(12, 18, 36, 0.55)',
		desktopOverlaySurfaceImage: '',
		desktopOverlaySurfaceImageSize: 'cover',
		desktopOverlaySurfaceImagePosition: 'center',
		desktopOverlaySurfaceImageRepeat: 'no-repeat',
		desktopOverlaySurfaceImageBlendMode: 'normal',
		desktopOverlaySurfaceBlur: '22px',
		desktopOverlaySurfaceBorder: 'rgba(255, 255, 255, 0.18)',
		desktopOverlaySurfaceShadow: '0 32px 80px rgba(5, 8, 25, 0.65)',
		desktopOverlayAccent:
			'linear-gradient(135deg, rgba(236, 72, 153, 0.32) 0%, rgba(59, 130, 246, 0.32) 35%, rgba(45, 212, 191, 0.25) 100%)',
		desktopOverlayPlayerBackground: 'rgba(5, 9, 18, 0.88)',
		desktopOverlayMetaAlign: 'center',
		desktopOverlayPlayerPadding: '0rem',
		desktopOverlayCardBackground:
			'linear-gradient(145deg, rgba(9, 14, 26, 0.95) 0%, rgba(17, 25, 46, 0.82) 100%)',
		desktopOverlayCardShadow: '0 32px 64px rgba(5, 9, 18, 0.58)',
		desktopOverlayCardPadding: '1.85rem',
		desktopOverlayCardRadius: '1.8rem',
		desktopOverlayCardMediaPadding: '1.1rem',
		desktopOverlayCardWidth: 'min(560px, 92vw)'
	};

	$: filtersResolved = { ...defaultFiltersConfig, ...(filtersConfig || {}) };
	$: searchResolved = { ...defaultSearchConfig, ...(searchConfig || {}) };
	$: layoutResolved = { ...defaultLayoutConfig, ...(layoutConfig || {}) };
	$: desktopOverlaySurfaceImageValue = formatBackgroundImageValue(
		layoutResolved.desktopOverlaySurfaceImage
	);
	$: desktopOverlaySurfaceHasImage = !!desktopOverlaySurfaceImageValue;
	$: desktopOverlaySurfaceInlineStyle = [
		desktopOverlaySurfaceImageValue
			? `--desktop-overlay-surface-image:${desktopOverlaySurfaceImageValue}`
			: null,
		isMeaningful(layoutResolved.desktopOverlaySurfaceImageSize)
			? `--desktop-overlay-surface-image-size:${layoutResolved.desktopOverlaySurfaceImageSize}`
			: null,
		isMeaningful(layoutResolved.desktopOverlaySurfaceImagePosition)
			? `--desktop-overlay-surface-image-position:${layoutResolved.desktopOverlaySurfaceImagePosition}`
			: null,
		isMeaningful(layoutResolved.desktopOverlaySurfaceImageRepeat)
			? `--desktop-overlay-surface-image-repeat:${layoutResolved.desktopOverlaySurfaceImageRepeat}`
			: null,
		isMeaningful(layoutResolved.desktopOverlaySurfaceImageBlendMode)
			? `--desktop-overlay-surface-image-blend:${layoutResolved.desktopOverlaySurfaceImageBlendMode}`
			: null
	]
		.filter(Boolean)
		.join(';');
	$: controlsInlineStyle = buildControlsInlineStyle(layoutResolved, {
		fixed: controlsFixed && !isMobileFeed,
		bounds: controlsBounds,
		zIndex: 30,
		mode: 'bottom'
	});
	$: controlsPlaceholderStyle =
		controlsFixed && !isMobileFeed
			? `height:${Math.max(1, controlsPlaceholderHeight)}px`
			: 'height:1px';
	$: showHeadingDesktop = showHeadingBlock && (!controlsStuck || isMobileViewport);
	$: shouldShowFloatingControls =
		controlsRevealActive && !isMobileViewport && !isMobileFeed && showControls;
	$: if (browser) {
		setControlsFloatingState(shouldShowFloatingControls);
	}
	$: if (browser && controlsRevealSentinelElement && !revealObserver) {
		setupRevealObserver();
	}
	$: if (browser && !controlsRevealSentinelElement && revealObserver) {
		teardownRevealObserver();
	}
	$: showCountsEnabled = resolveBoolean(layoutResolved.showCounts, false);
	$: shouldMuteInitially = resolveBoolean(layoutResolved.controlsStartMuted, true);
	$: shouldAutoMute = resolveBoolean(layoutResolved.controlsAutoMute, true);
	$: searchStyleVars = buildSearchStyleVars(searchResolved);

	$: sectionsResolved = {
		...defaultSectionsConfig,
		...(sectionsConfig || {})
	};
	$: sectionsResolved.highlight = sectionsResolved.highlight
		? { ...defaultHighlightConfig, ...sectionsResolved.highlight }
		: null;
	$: videoResolved = { ...defaultVideoConfig, ...(videoConfig || {}) };
	$: mobileFeedStyles = [
		`--mobile-feed-title:${layoutResolved.mobileFeedTitleColor ?? '#ffffff'}`,
		`--mobile-feed-meta:${layoutResolved.mobileFeedMetaColor ?? 'rgba(255,255,255,0.8)'}`,
		`--mobile-feed-tag-color:${layoutResolved.mobileFeedTagColor ?? '#111827'}`,
		`--mobile-feed-tag-background:${
			layoutResolved.mobileFeedTagBackground ?? 'rgba(255,255,255,0.92)'
		}`,
		`--mobile-feed-overlay:${layoutResolved.mobileFeedOverlay ?? 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(8,12,24,0.78) 62%, rgba(8,12,24,0.92) 100%)'}`
	].join(';');
	$: headingEyebrowDesktopResolved = firstMeaningful(
		layoutResolved.headingEyebrowDesktop,
		layoutResolved.mobileTopbarTitle,
		''
	);
	$: headingEyebrowMobileResolved = firstMeaningful(
		layoutResolved.headingEyebrowMobile,
		layoutResolved.headingEyebrowDesktop
	);
	$: headingEyebrow = isMobileViewport
		? headingEyebrowMobileResolved
		: headingEyebrowDesktopResolved;
	$: showHeadingEyebrow = isMeaningful(headingEyebrow);
	$: headingAlignmentDesktop = firstMeaningful(layoutResolved.headingAlignmentDesktop, 'center');
	$: headingAlignmentMobile = firstMeaningful(layoutResolved.headingAlignmentMobile, 'left');
	$: headingAlignment = isMobileViewport ? headingAlignmentMobile : headingAlignmentDesktop;
	$: desktopOverlayVariantRaw = firstMeaningful(layoutResolved.desktopOverlayVariant, 'glass');
	$: desktopOverlayVariantNormalized = (() => {
		const value = (desktopOverlayVariantRaw || '').toLowerCase();
		return value === 'card' || value === 'glass' ? value : 'glass';
	})();
	$: desktopOverlayVariant = desktopOverlayVariantNormalized;
	$: desktopOverlayMetaAlignRaw = firstMeaningful(layoutResolved.desktopOverlayMetaAlign, 'center');
	$: desktopOverlayMetaJustify =
		(desktopOverlayMetaAlignRaw || '').toLowerCase() === 'top'
			? 'flex-start'
			: (desktopOverlayMetaAlignRaw || '').toLowerCase() === 'bottom'
				? 'flex-end'
				: 'center';
	$: layoutStyleVars = [
		isMeaningful(layoutResolved.backgroundColor)
			? `--sheet-background:${layoutResolved.backgroundColor}`
			: null,
		isMeaningful(layoutResolved.containerMaxWidthDesktop)
			? `--sheet-container-max:${layoutResolved.containerMaxWidthDesktop}`
			: null,
		isMeaningful(layoutResolved.containerPaddingMobile)
			? `--sheet-container-padding-mobile:${layoutResolved.containerPaddingMobile}`
			: null,
		isMeaningful(layoutResolved.containerPaddingDesktop)
			? `--sheet-container-padding-desktop:${layoutResolved.containerPaddingDesktop}`
			: null,
		isMeaningful(layoutResolved.controlsHeadingColorDesktop)
			? `--controls-heading-desktop:${layoutResolved.controlsHeadingColorDesktop}`
			: null,
		isMeaningful(layoutResolved.controlsHeadingSubtitleDesktop)
			? `--controls-heading-desktop-subtitle:${layoutResolved.controlsHeadingSubtitleDesktop}`
			: null,
		isMeaningful(layoutResolved.headingEyebrowColor)
			? `--controls-heading-eyebrow:${layoutResolved.headingEyebrowColor}`
			: null,
		isMeaningful(layoutResolved.headingDividerColor)
			? `--controls-heading-divider:${layoutResolved.headingDividerColor}`
			: null,
		isMeaningful(layoutResolved.searchMaxWidthDesktop)
			? `--controls-search-max-width:${layoutResolved.searchMaxWidthDesktop}`
			: null,
		isMeaningful(layoutResolved.filterChipBackground)
			? `--filter-chip-background:${layoutResolved.filterChipBackground}`
			: null,
		isMeaningful(layoutResolved.filterChipColor)
			? `--filter-chip-color:${layoutResolved.filterChipColor}`
			: null,
		isMeaningful(layoutResolved.filterChipBorderColor)
			? `--filter-chip-border-color:${layoutResolved.filterChipBorderColor}`
			: null,
		isMeaningful(layoutResolved.filterChipHoverBackground)
			? `--filter-chip-hover-background:${layoutResolved.filterChipHoverBackground}`
			: null,
		isMeaningful(layoutResolved.filterChipHoverBorderColor)
			? `--filter-chip-hover-border-color:${layoutResolved.filterChipHoverBorderColor}`
			: null,
		isMeaningful(layoutResolved.filterChipActiveBackground)
			? `--filter-chip-active-background:${layoutResolved.filterChipActiveBackground}`
			: null,
		isMeaningful(layoutResolved.filterChipActiveColor)
			? `--filter-chip-active-color:${layoutResolved.filterChipActiveColor}`
			: null,
		isMeaningful(layoutResolved.filterChipActiveBorderColor)
			? `--filter-chip-active-border-color:${layoutResolved.filterChipActiveBorderColor}`
			: null,
		isMeaningful(layoutResolved.filterChipCountColor)
			? `--filter-chip-count-color:${layoutResolved.filterChipCountColor}`
			: null,
		isMeaningful(layoutResolved.sectionTitleColor)
			? `--section-title-color:${layoutResolved.sectionTitleColor}`
			: null,
		isMeaningful(layoutResolved.sectionTitleHighlightColor)
			? `--section-title-highlight-color:${layoutResolved.sectionTitleHighlightColor}`
			: null,
		isMeaningful(layoutResolved.videoTitleColor)
			? `--video-title-color:${layoutResolved.videoTitleColor}`
			: null,
		isMeaningful(layoutResolved.videoSubtitleColor)
			? `--video-subtitle-color:${layoutResolved.videoSubtitleColor}`
			: null,
		isMeaningful(layoutResolved.videoTagBackground)
			? `--video-tag-background:${layoutResolved.videoTagBackground}`
			: null,
		isMeaningful(layoutResolved.videoTagColor)
			? `--video-tag-color:${layoutResolved.videoTagColor}`
			: null,
		isMeaningful(layoutResolved.desktopOverlayBackdrop)
			? `--desktop-overlay-backdrop:${layoutResolved.desktopOverlayBackdrop}`
			: null,
		isMeaningful(layoutResolved.desktopOverlayBackdropBlur)
			? `--desktop-overlay-backdrop-blur:${layoutResolved.desktopOverlayBackdropBlur}`
			: null,
		isMeaningful(layoutResolved.desktopOverlaySurface)
			? `--desktop-overlay-surface:${layoutResolved.desktopOverlaySurface}`
			: null,
		desktopOverlaySurfaceImageValue
			? `--desktop-overlay-surface-image:${desktopOverlaySurfaceImageValue}`
			: null,
		isMeaningful(layoutResolved.desktopOverlaySurfaceImageSize)
			? `--desktop-overlay-surface-image-size:${layoutResolved.desktopOverlaySurfaceImageSize}`
			: null,
		isMeaningful(layoutResolved.desktopOverlaySurfaceImagePosition)
			? `--desktop-overlay-surface-image-position:${layoutResolved.desktopOverlaySurfaceImagePosition}`
			: null,
		isMeaningful(layoutResolved.desktopOverlaySurfaceImageRepeat)
			? `--desktop-overlay-surface-image-repeat:${layoutResolved.desktopOverlaySurfaceImageRepeat}`
			: null,
		isMeaningful(layoutResolved.desktopOverlaySurfaceImageBlendMode)
			? `--desktop-overlay-surface-image-blend:${layoutResolved.desktopOverlaySurfaceImageBlendMode}`
			: null,
		isMeaningful(layoutResolved.desktopOverlaySurfaceBlur)
			? `--desktop-overlay-surface-blur:${layoutResolved.desktopOverlaySurfaceBlur}`
			: null,
		isMeaningful(layoutResolved.desktopOverlaySurfaceBorder)
			? `--desktop-overlay-surface-border:${layoutResolved.desktopOverlaySurfaceBorder}`
			: null,
		isMeaningful(layoutResolved.desktopOverlaySurfaceShadow)
			? `--desktop-overlay-surface-shadow:${layoutResolved.desktopOverlaySurfaceShadow}`
			: null,
		isMeaningful(layoutResolved.desktopOverlayAccent)
			? `--desktop-overlay-accent:${layoutResolved.desktopOverlayAccent}`
			: null,
		isMeaningful(layoutResolved.desktopOverlayPlayerPadding)
			? `--desktop-overlay-player-padding:${layoutResolved.desktopOverlayPlayerPadding}`
			: null,
		isMeaningful(layoutResolved.desktopOverlayPlayerBackground)
			? `--desktop-overlay-player-background:${layoutResolved.desktopOverlayPlayerBackground}`
			: null,
		isMeaningful(layoutResolved.desktopOverlayCardBackground)
			? `--desktop-overlay-card-bg:${layoutResolved.desktopOverlayCardBackground}`
			: null,
		isMeaningful(layoutResolved.desktopOverlayCardShadow)
			? `--desktop-overlay-card-shadow:${layoutResolved.desktopOverlayCardShadow}`
			: null,
		isMeaningful(layoutResolved.desktopOverlayCardPadding)
			? `--desktop-overlay-card-padding:${layoutResolved.desktopOverlayCardPadding}`
			: null,
		isMeaningful(layoutResolved.desktopOverlayCardRadius)
			? `--desktop-overlay-card-radius:${layoutResolved.desktopOverlayCardRadius}`
			: null,
		isMeaningful(layoutResolved.desktopOverlayCardMediaPadding)
			? `--desktop-overlay-card-media-padding:${layoutResolved.desktopOverlayCardMediaPadding}`
			: null,
		isMeaningful(layoutResolved.desktopOverlayCardWidth)
			? `--desktop-overlay-card-width:${layoutResolved.desktopOverlayCardWidth}`
			: null,
		`--desktop-overlay-meta-justify:${desktopOverlayMetaJustify}`
	]
		.filter(Boolean)
		.join(';');
	$: showcaseStyles =
		[isMobileFeed ? mobileFeedStyles : null, layoutStyleVars].filter(Boolean).join(';') ||
		undefined;
	$: fallbackTitle = firstMeaningful(
		layoutResolved.desktopTitle,
		layoutResolved.mobileTitle,
		layoutResolved.mobileTopbarTitle,
		layoutResolved.desktopIntroTitle,
		layoutResolved.mobileIntroTitle,
		'Vídeos'
	);
	$: desktopTitleResolved = firstMeaningful(layoutResolved.desktopTitle, fallbackTitle);
	$: mobileTitleResolved = firstMeaningful(layoutResolved.mobileTitle, fallbackTitle);
	$: headingTitle = isMobileViewport ? mobileTitleResolved : desktopTitleResolved;
	$: desktopSubtitleResolved = firstMeaningful(
		layoutResolved.desktopSubtitle,
		layoutResolved.subtitle
	);
	$: mobileSubtitleResolved = firstMeaningful(
		layoutResolved.mobileSubtitle,
		layoutResolved.subtitle
	);
	$: headingSubtitle = isMobileViewport ? '' : desktopSubtitleResolved;
	$: showHeadingBlock = isMeaningful(headingTitle) || isMeaningful(headingSubtitle);
	$: pageTitle = headingTitle;
	$: desktopTopbarColorResolved = firstMeaningful(
		layoutResolved.desktopTopbarColor,
		layoutResolved.sectionTitleColor,
		'#111827'
	);
	$: desktopTopbarBackgroundResolved = firstMeaningful(
		layoutResolved.desktopTopbarBackground,
		'#ffffff'
	);
	$: mobileChromeStyle = [
		isMeaningful(layoutResolved.mobileChromeBackground)
			? `--mobile-chrome-bg:${layoutResolved.mobileChromeBackground}`
			: null,
		isMeaningful(layoutResolved.mobileChromeTextColor)
			? `--mobile-chrome-text:${layoutResolved.mobileChromeTextColor}`
			: null,
		isMeaningful(layoutResolved.mobileChromeActiveColor)
			? `--mobile-chrome-active:${layoutResolved.mobileChromeActiveColor}`
			: null,
		isMeaningful(layoutResolved.mobileBottomBarBackground)
			? `--mobile-bottom-bar-bg:${layoutResolved.mobileBottomBarBackground}`
			: null,
		isMeaningful(layoutResolved.mobileBottomBarButtonBackground)
			? `--mobile-bottom-button-bg:${layoutResolved.mobileBottomBarButtonBackground}`
			: null,
		isMeaningful(layoutResolved.mobileBottomBarButtonColor)
			? `--mobile-bottom-button-color:${layoutResolved.mobileBottomBarButtonColor}`
			: null,
		isMeaningful(layoutResolved.mobileBottomBarButtonBorderColor)
			? `--mobile-bottom-button-border:${layoutResolved.mobileBottomBarButtonBorderColor}`
			: null,
		isMeaningful(layoutResolved.mobileBottomBarShortzBackground)
			? `--mobile-bottom-shortz-bg:${layoutResolved.mobileBottomBarShortzBackground}`
			: null,
		isMeaningful(layoutResolved.mobileBottomBarShortzColor)
			? `--mobile-bottom-shortz-color:${layoutResolved.mobileBottomBarShortzColor}`
			: null,
		isMeaningful(layoutResolved.mobileBottomBarShortzBorderColor)
			? `--mobile-bottom-shortz-border:${layoutResolved.mobileBottomBarShortzBorderColor}`
			: null,
		isMeaningful(layoutResolved.mobileBottomBarButtonActiveBackground)
			? `--mobile-bottom-button-active-bg:${layoutResolved.mobileBottomBarButtonActiveBackground}`
			: null,
		isMeaningful(layoutResolved.mobileBottomBarButtonActiveColor)
			? `--mobile-bottom-button-active-color:${layoutResolved.mobileBottomBarButtonActiveColor}`
			: null,
		isMeaningful(layoutResolved.mobileBottomBarShortzActiveBackground)
			? `--mobile-bottom-shortz-active-bg:${layoutResolved.mobileBottomBarShortzActiveBackground}`
			: null,
		isMeaningful(layoutResolved.mobileBottomBarShortzActiveColor)
			? `--mobile-bottom-shortz-active-color:${layoutResolved.mobileBottomBarShortzActiveColor}`
			: null,
		`--desktop-topbar-bg:${desktopTopbarBackgroundResolved}`,
		`--desktop-topbar-color:${desktopTopbarColorResolved}`
	]
		.filter(Boolean)
		.join(';');
	$: {
		if (layoutResolved.highlightLimit && sectionsResolved.highlight) {
			sectionsResolved.highlight.limit = layoutResolved.highlightLimit;
		}
	}

	$: if (!hasMounted) {
		const initialView = resolveMobileViewMode(layoutResolved.mobileDefaultView);
		mobileViewMode = initialView;
		if (initialView === MobileView.SHORTZ && !feedOrderToken) {
			feedOrderToken = nextShortzSeed();
		}
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
		thumbnail: resolveColumnKey(columnResolver, videoResolved.thumbnail),
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

	$: filterOptions = buildFilterOptions(videos, resolvedFilterColumns, filtersResolved);

	$: reconcileFilterSelection();

	$: filteredVideos = applyFilters(videos, {
		filterMode,
		activeFilterId,
		activeFilterIds,
		filterMatchStrategy,
		shouldApplySearch,
		activeSearchNormalized
	});

	$: searchTermNormalized = normalizeValue(searchTerm);

	$: if (!searchResolved.instant) {
		const activationThreshold = Math.max(
			searchResolved?.minLength ?? 0,
			SEARCH_SUGGESTION_MIN_LENGTH
		);
		if (searchTermNormalized.length >= activationThreshold) {
			if (activeSearchTerm !== searchTerm) {
				activeSearchTerm = searchTerm;
			}
			if (!searchHasSubmitted) {
				searchHasSubmitted = true;
			}
		} else if (
			searchHasSubmitted &&
			activeSearchTerm &&
			searchTermNormalized.length < activationThreshold
		) {
			activeSearchTerm = '';
			searchHasSubmitted = false;
		}
	}

	$: activeSearchNormalized = normalizeValue(activeSearchTerm);
	$: shouldApplySearch =
		searchResolved.instant || activeSearchNormalized.length >= (searchResolved.minLength ?? 0);
	$: searchActive = Boolean(
		(searchTermNormalized && searchTermNormalized.length > 0) ||
			(activeSearchNormalized && activeSearchNormalized.length > 0)
	);

	$: searchSuggestions = buildSearchSuggestions({
		videos,
		termNormalized: searchTermNormalized,
		termOriginal: searchTerm,
		limit: Math.max(
			1,
			Math.min(searchResolved?.suggestionLimit ?? SEARCH_SUGGESTION_LIMIT, SEARCH_SUGGESTION_LIMIT)
		),
		filterMode,
		activeFilterId,
		activeFilterIds,
		filterMatchStrategy
	});

	$: totalVisible = filteredVideos.length;
	$: filtersIdle =
		filterMode === 'single'
			? !activeFilterId || activeFilterId === 'all'
			: !activeFilterIds || activeFilterIds.size === 0;
	$: defaultShuffleActive = filtersIdle && !searchActive;
	$: {
		// Shuffle the default listing until the user interacts with filters or search.
		if (!filteredVideos?.length) {
			filteredVideosOrdered = filteredVideos;
			filteredVideosShuffleKey = '';
		} else if (!defaultShuffleActive) {
			filteredVideosOrdered = filteredVideos;
			filteredVideosShuffleKey = '';
		} else {
			const nextKey = filteredVideos.map((video) => video.uuid).join('|');
			if (nextKey && nextKey !== filteredVideosShuffleKey) {
				filteredVideosOrdered = shuffleList(filteredVideos);
				filteredVideosShuffleKey = nextKey;
			} else if (!filteredVideosOrdered?.length) {
				filteredVideosOrdered = shuffleList(filteredVideos);
				filteredVideosShuffleKey = nextKey;
			}
		}
	}

	$: highlightSection = buildHighlightSection(
		filteredVideosOrdered,
		sectionsResolved,
		highlightValueSet,
		layoutResolved
	);

	$: highlightIds = new Set(
		highlightSection ? highlightSection.videos.map((video) => video.uuid) : []
	);

	$: videosForSections =
		sectionsResolved.highlight && highlightSection && !sectionsResolved.highlight.retainInSections
			? filteredVideosOrdered.filter((video) => !highlightIds.has(video.uuid))
			: filteredVideosOrdered;

	$: regularSections = buildSections(videosForSections, sectionsResolved);
	$: feedVideosBase = buildFeedSourceVideos({
		highlightSection,
		regularSections,
		filteredVideos: filteredVideosOrdered,
		sectionsResolved
	});
	$: {
		const nextFeedVideos = buildShortzVideos({
			base: feedVideosBase,
			leadVideoId: feedLeadVideoId,
			seenSet: shortzSeenInitial,
			seed: feedOrderToken,
			lastLeadId: shortzLeadAvoidId
		});
		feedVideos = nextFeedVideos;
		feedIndexLookup = new Map(nextFeedVideos.map((video, index) => [video.uuid, index]));
		if (feedLeadVideoId && nextFeedVideos.length && nextFeedVideos[0]?.uuid === feedLeadVideoId) {
			feedLeadVideoId = null;
		}
	}
	$: {
		if (isMobileFeed && feedVideos.length) {
			const candidateActive = activeFeedId ?? feedVideos[0]?.uuid ?? null;
			feedPlayerWindow = buildFeedPlayerWindow({
				videos: feedVideos,
				activeId: candidateActive,
				buffer: FEED_PLAYER_BUFFER
			});
		} else {
			feedPlayerWindow = new Set();
		}
	}
	$: if (isMobileFeed) {
	feedPlayerControls.forEach((_, videoId) => {
		if (videoId === activeFeedId) return;
		if (!feedPlayerWindow.has(videoId)) {
			dropPlayerControls(videoId);
		}
	});
	}
	$: {
		const base = Array.isArray(feedVideosBase) ? [...feedVideosBase] : [];
		if (!base.length) {
			desktopOverlayVideos = [];
			desktopOverlayShuffleKey = '';
			if (desktopOverlayPinnedVideoId !== null) {
				desktopOverlayPinnedVideoId = null;
			}
			if (desktopOverlayShuffleSeed !== 0) {
				desktopOverlayShuffleSeed = 0;
			}
		} else if (!defaultShuffleActive) {
			desktopOverlayVideos = base;
			desktopOverlayShuffleKey = '';
			if (desktopOverlayPinnedVideoId !== null) {
				desktopOverlayPinnedVideoId = null;
			}
			if (desktopOverlayShuffleSeed !== 0) {
				desktopOverlayShuffleSeed = 0;
			}
		} else {
			const pinnedId = desktopOverlayPinnedVideoId ?? '';
			const keyParts = [
				pinnedId,
				String(desktopOverlayShuffleSeed ?? 0),
				...base.map((video) => video.uuid ?? '')
			];
			const nextKey = keyParts.join('|');
			if (nextKey && nextKey !== desktopOverlayShuffleKey) {
				const pinnedVideo = pinnedId
					? (base.find((video) => video.uuid === pinnedId) ?? null)
					: null;
				const remaining = pinnedVideo
					? base.filter((video) => video.uuid !== pinnedVideo.uuid)
					: base;
				const random = createSeededRandom(desktopOverlayShuffleSeed || Date.now());
				const shuffled = shuffleList(remaining, random);
				desktopOverlayVideos = pinnedVideo ? [pinnedVideo, ...shuffled] : shuffled;
				desktopOverlayShuffleKey = nextKey;
			} else if (!desktopOverlayVideos?.length) {
				desktopOverlayVideos = base;
			}
		}
	}

	$: {
		if (!desktopOverlayVideoId) {
			desktopOverlayIndex = -1;
			desktopOverlayVideo = null;
		} else {
			const nextIndex = desktopOverlayVideos.findIndex(
				(video) => video.uuid === desktopOverlayVideoId
			);
			if (nextIndex === -1) {
				closeDesktopOverlay({ restoreScroll: false });
			} else {
				desktopOverlayIndex = nextIndex;
				desktopOverlayVideo = desktopOverlayVideos[nextIndex];
			}
		}
	}

	$: if (desktopOverlayVideoId && (isMobileViewport || isMobileFeed)) {
		closeDesktopOverlay({ restoreScroll: false });
	}

	$: if (isMobileFeed) {
		const hasActive = feedVideos.some((video) => video.uuid === activeFeedId);
		if (!hasActive) {
			activeFeedId = feedVideos[0]?.uuid ?? null;
		}
	} else if (activeFeedId) {
		activeFeedId = null;
	}

	$: if (!searchSuggestions.length) {
		clearSearchSuggestionsHideTimeout();
		if (searchSuggestionsVisible) {
			searchSuggestionsVisible = false;
		}
	} else if (searchFieldFocused && !searchSuggestionsVisible) {
		openSearchSuggestions();
	}

	$: isMobileFeed =
		layoutResolved.enableMobileFeed !== false &&
		mobileViewMode === MobileView.SHORTZ &&
		viewportWidth <= (layoutResolved.mobileFeedMaxWidth ?? 768);
	$: isMobileViewport = viewportWidth <= (layoutResolved.mobileFeedMaxWidth ?? 768);
	$: isMobileFeedGrid = isMobileViewport && mobileViewMode === MobileView.FEED;

	$: feedOverlayVisible = isMobileViewport && feedOverlayMode !== 'none';
	$: hideControlsForMobileFeed = isMobileFeedGrid && !feedOverlayVisible;
	$: shouldAutoFocusSearch = !isMobileViewport;

	$: if (!isMobileViewport && feedOverlayMode !== 'none') {
		feedOverlayMode = 'none';
	}

	$: if (isMobileFeed) {
		const nextPosterMap = new Map(feedPosterVisible);
		let posterMapChanged = false;
		for (const video of feedVideos) {
			if (!nextPosterMap.has(video.uuid)) {
				nextPosterMap.set(video.uuid, true);
				posterMapChanged = true;
			}
		}
		for (const key of Array.from(nextPosterMap.keys())) {
			if (!feedIndexLookup.has(key)) {
				nextPosterMap.delete(key);
				posterMapChanged = true;
			}
		}
		if (posterMapChanged) {
			feedPosterVisible = nextPosterMap;
		}
	} else if (feedPosterVisible.size) {
		feedPosterVisible = new Map();
	}

	$: if (
		feedOverlayVisible &&
		feedOverlayMode === 'search-filters' &&
		hasSearch &&
		shouldAutoFocusSearch
	) {
		tick().then(() => {
			if (feedOverlayVisible && feedOverlayMode === 'search-filters' && shouldAutoFocusSearch) {
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

	$: if (
		isMobileFeed &&
		feedInitialized &&
		activeFeedId &&
		!snapInProgress &&
		!feedOverlayVisible
	) {
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

	$: if (isMobileFeed && activeFeedId) {
		markShortzVideoSeen(activeFeedId);
	}

	$: if (browser && isMobileFeed && feedVideos.length) {
		const leadId = feedVideos[0]?.uuid ?? null;
		if (leadId && leadId !== shortzLastLeadPersistedId) {
			shortzLastLeadId = leadId;
			shortzLastLeadPersistedId = leadId;
			persistShortzLead(leadId);
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
			hydrateShortzSeen();
			const updateViewport = () => {
				viewportWidth = window.innerWidth || 0;
			};
			updateViewport();
			const resizeHandler = () => {
				updateViewport();
				if (controlsFixed && !isMobileFeed) {
					refreshControlsBounds();
				}
			};
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
		tick().then(() => {
			setupRevealObserver();
			setupCreditsObserver();
		});
	});

	onDestroy(() => {
		abortController?.abort();
		teardownRevealObserver();
		teardownCreditsObserver();
		resizeCleanup?.();
		teardownFeedObserver();
		clearFeedMetaTimer();
		cleanupFeedMetaHoldListeners();
		clearSearchSuggestionsHideTimeout();
		clearTimeout(snapTimeoutId);
		feedPlayerControls.forEach((controls) => {
			try {
				controls.pause?.();
				if (shouldAutoMute) {
					controls.setMuted?.(true);
				}
			} catch (error) {
				console.warn('VideoSheetShowcase: falha ao encerrar player', error);
			}
		});
		closeDesktopOverlay({ restoreScroll: false });
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

	function firstMeaningful(...values) {
		for (const value of values ?? []) {
			if (isMeaningful(value)) {
				return String(value).trim();
			}
		}
		return '';
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

	function buildSearchStyleVars(config = {}) {
		const entries = {
			'--search-container-padding': config.containerPadding,
			'--search-container-padding-desktop': config.containerPaddingDesktop,
			'--search-input-background': config.inputBackground,
			'--search-input-color': config.inputColor,
			'--search-input-placeholder-color': config.inputPlaceholderColor,
			'--search-input-border-color': config.inputBorderColor,
			'--search-input-focus-border-color': config.inputFocusBorderColor,
			'--search-input-focus-outline': config.inputFocusOutline,
			'--search-button-background': config.buttonBackground,
			'--search-button-color': config.buttonColor,
			'--search-button-hover-background': config.buttonHoverBackground,
			'--search-button-border-color': config.buttonBorderColor,
			'--search-button-hover-border-color': config.buttonHoverBorderColor,
			'--search-clear-button-background': config.clearButtonBackground,
			'--search-clear-button-color': config.clearButtonColor,
			'--search-clear-button-hover-background': config.clearButtonHoverBackground,
			'--search-clear-button-border-color': config.clearButtonBorderColor,
			'--search-clear-button-hover-border-color': config.clearButtonHoverBorderColor
		};

		return Object.entries(entries)
			.filter(([, value]) => value !== undefined && value !== null && value !== '')
			.map(([key, value]) => `${key}:${value}`)
			.join(';');
	}

	function formatCssLength(value, fallback = '0px') {
		if (typeof value === 'number' && Number.isFinite(value)) {
			return `${value}px`;
		}
		if (typeof value === 'string') {
			const trimmed = value.trim();
			if (!trimmed) return fallback;
			const numeric = Number(trimmed);
			if (!Number.isNaN(numeric)) {
				return `${numeric}px`;
			}
			return trimmed;
		}
		return fallback;
	}

	function formatBackgroundImageValue(value) {
		if (!isMeaningful(value)) return '';
		const trimmed = String(value).trim();
		if (!trimmed) return '';
		if (/^(?:url|var|linear-gradient|radial-gradient|conic-gradient)\(/i.test(trimmed)) {
			return trimmed;
		}
		const escaped = trimmed.replace(/(["\\])/g, '\\$1');
		return `url("${escaped}")`;
	}

	function measureControlsBounds(node) {
		if (!browser || !node) return null;
		const rect = node.getBoundingClientRect();
		return {
			width: rect?.width ?? 0,
			height: rect?.height ?? 0,
			left: rect?.left ?? 0
		};
	}

	function refreshControlsBounds() {
		const bounds = measureControlsBounds(controlsElement);
		if (!bounds) return;
		controlsBounds = bounds;
		controlsPlaceholderHeight = Math.max(1, Math.round(bounds.height || 0));
	}

	function buildControlsInlineStyle(config = {}, options = {}) {
		const stickyTop = formatCssLength(config.stickyOffset, '0px');
		const floatingOffset =
			config?.controlsFloatingOffset !== undefined &&
			config?.controlsFloatingOffset !== null &&
			config?.controlsFloatingOffset !== ''
				? formatCssLength(config.controlsFloatingOffset, '0px')
				: null;
		const floatingOffsetValue = floatingOffset ?? 'clamp(1.5rem, 4vh, 3rem)';
		const entries = {
			'--controls-sticky-top': stickyTop,
			'--controls-floating-offset': floatingOffsetValue,
			'--controls-bg': config.controlsBackground,
			'--controls-border-color': config.controlsBorderColor,
			'--controls-shadow': config.controlsShadow,
			'--controls-backdrop': config.controlsBackdrop
		};

		if (options?.fixed && options?.bounds && options?.bounds?.width) {
			const mode = options?.mode === 'bottom' ? 'bottom' : 'top';
			entries.position = 'fixed';
			entries.left = `${Math.round(options.bounds.left)}px`;
			entries.width = `${Math.round(options.bounds.width)}px`;
			entries.right = 'auto';
			entries.margin = '0';
			entries['z-index'] = options.zIndex ?? 20;
			if (mode === 'bottom') {
				entries.bottom = floatingOffsetValue;
				entries.top = 'auto';
			} else {
				entries.top = stickyTop;
				entries.bottom = 'auto';
			}
		}

		return Object.entries(entries)
			.filter(([, value]) => value !== undefined && value !== null && value !== '')
			.map(([key, value]) => `${key}:${value}`)
			.join(';');
	}

	function resolveBoolean(value, fallback = false) {
		if (value === undefined || value === null || value === '') return fallback;
		if (typeof value === 'boolean') return value;
		if (typeof value === 'number') return value !== 0;
		const normalized = String(value).trim().toLowerCase();
		if (['false', '0', 'no', 'off', 'nao', 'não'].includes(normalized)) return false;
		if (['true', '1', 'yes', 'on', 'sim'].includes(normalized)) return true;
		return fallback;
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

	function buildFilterOptions(videos, columns, config) {
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

	function normalizeDefaultFilterId(value, config) {
		if (value === undefined || value === null) return null;
		if (typeof value === 'object' && value.id) {
			return normalizeDefaultFilterId(value.id, config);
		}
		if (typeof value === 'string') {
			const normalized = normalizeValue(value);
			if (!normalized) return null;
			if (normalized === 'all') return 'all';
			const allLabelNormalized = normalizeValue(config?.allLabel ?? 'Tudo');
			if (allLabelNormalized && normalized === allLabelNormalized) {
				return 'all';
			}
			return value;
		}
		return value;
	}

	function reconcileFilterSelection() {
		const optionIds = new Set(filterOptions.map((option) => option.id));

		if (filterMode === 'single') {
			if (!optionIds.size) {
				activeFilterId = null;
				return;
			}

			if (!userTouchedFilters) {
				const preferredRaw = filtersResolved.defaultValue;
				const preferred = normalizeDefaultFilterId(preferredRaw, filtersResolved);
				const fallbacks = [
					preferred && optionIds.has(preferred) ? preferred : null,
					filtersResolved.includeAll !== false && optionIds.has('all') ? 'all' : null,
					filterOptions.find((option) => !option.isAll)?.id ?? null
				].filter(Boolean);
				const target = fallbacks[0] ?? null;
				if (target && activeFilterId !== target) {
					activeFilterId = target;
				} else if (!target && !activeFilterId && optionIds.has('all')) {
					activeFilterId = 'all';
				}
			} else if (activeFilterId && !optionIds.has(activeFilterId)) {
				const fallback =
					(filtersResolved.includeAll !== false && optionIds.has('all') && 'all') ||
					filterOptions.find((option) => !option.isAll)?.id ||
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
				const normalizedDefaults = defaults
					.map((value) => normalizeDefaultFilterId(value, filtersResolved))
					.filter(Boolean);

				if (normalizedDefaults.includes('all') && optionIds.has('all')) {
					next.clear();
				} else {
					for (const id of normalizedDefaults) {
						if (id !== 'all' && optionIds.has(id)) {
							next.add(id);
						}
					}
				}
			}
			activeFilterIds = next;
		}
	}

	function applyFilters(
		sourceVideos,
		{
			filterMode,
			activeFilterId,
			activeFilterIds,
			filterMatchStrategy,
			shouldApplySearch,
			activeSearchNormalized
		} = {}
	) {
		if (!sourceVideos?.length) return [];
		return sourceVideos.filter((video) => {
			if (
				!isFilterMatch(video, {
					filterMode,
					activeFilterId,
					activeFilterIds,
					filterMatchStrategy
				})
			) {
				return false;
			}
			if (!isSearchMatch(video, { shouldApplySearch, activeSearchNormalized })) {
				return false;
			}
			return true;
		});
	}

	function isFilterMatch(
		video,
		{ filterMode, activeFilterId, activeFilterIds, filterMatchStrategy } = {}
	) {
		if (filterMode === 'single') {
			if (!activeFilterId || activeFilterId === 'all') return true;
			return video.filterIds.has(activeFilterId);
		}

		const ids =
			activeFilterIds && typeof activeFilterIds.has === 'function'
				? activeFilterIds
				: new Set(activeFilterIds ?? []);

		if (!ids || ids.size === 0) return true;
		if (filterMatchStrategy === 'AND') {
			for (const id of ids) {
				if (!video.filterIds.has(id)) return false;
			}
			return true;
		}
		for (const id of ids) {
			if (video.filterIds.has(id)) return true;
		}
		return false;
	}

	function isSearchMatch(video, { shouldApplySearch, activeSearchNormalized } = {}) {
		if (!shouldApplySearch || !activeSearchNormalized) return true;
		for (const token of video.searchTokens ?? []) {
			if (token && token.includes(activeSearchNormalized)) {
				return true;
			}
		}
		return false;
	}

	function buildSearchSuggestions({
		videos = [],
		termNormalized,
		termOriginal = '',
		limit = SEARCH_SUGGESTION_LIMIT,
		filterMode,
		activeFilterId,
		activeFilterIds,
		filterMatchStrategy
	} = {}) {
		if (!termNormalized || termNormalized.length < SEARCH_SUGGESTION_MIN_LENGTH) return [];
		if (!videos?.length) return [];

		const suggestions = [];
		const seen = new Set();

		for (const video of videos) {
			if (!video) continue;
			if (
				!isFilterMatch(video, {
					filterMode,
					activeFilterId,
					activeFilterIds,
					filterMatchStrategy
				})
			) {
				continue;
			}

			const candidates = dedupeList(
				[video.title, video.subtitle, video.description, video.tag, video.section?.label]
					.filter(isMeaningful)
					.map((value) => String(value).trim())
			);

			let labelMatch = '';

			for (const label of candidates) {
				const normalizedLabel = normalizeValue(label);
				if (normalizedLabel && normalizedLabel.includes(termNormalized)) {
					labelMatch = label;
					break;
				}
			}

			if (!labelMatch) {
				const tokenMatch = (video.searchTokens ?? []).some(
					(token) => token && token.includes(termNormalized)
				);
				if (!tokenMatch) continue;
				labelMatch =
					firstMeaningful(
						video.title,
						video.subtitle,
						video.description,
						video.tag,
						video.section?.label
					) || String(termOriginal || termNormalized).trim();
			}

			const normalizedKey = normalizeValue(labelMatch);
			if (!normalizedKey || seen.has(normalizedKey)) continue;

			seen.add(normalizedKey);
			suggestions.push({
				id: `${video.uuid}-${normalizedKey}`,
				label: labelMatch,
				value: labelMatch,
				videoUuid: video.uuid
			});

			if (suggestions.length >= limit) {
				break;
			}
		}

		return suggestions;
	}

	function buildHighlightSection(videos, sectionsConfig, highlightValues, layoutResolved) {
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

	function buildFeedSourceVideos({ highlightSection, regularSections, filteredVideos }) {
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

	function buildFeedPlayerWindow({ videos = [], activeId = null, buffer = 1 }) {
		if (!Array.isArray(videos) || !videos.length) return new Set();
		const activeIndex = activeId ? videos.findIndex((video) => video.uuid === activeId) : 0;
		if (activeIndex === -1) {
			const fallback = videos[0]?.uuid ? new Set([videos[0].uuid]) : new Set();
			return fallback;
		}
		const windowSet = new Set();
		const start = Math.max(0, activeIndex - buffer);
		const end = Math.min(videos.length - 1, activeIndex + buffer);
		for (let index = start; index <= end; index += 1) {
			const video = videos[index];
			if (video?.uuid) {
				windowSet.add(video.uuid);
			}
		}
		return windowSet;
	}

	function buildShortzVideos({
		base = [],
		leadVideoId = null,
		seenSet = new Set(),
		seed = 0,
		lastLeadId = null
	}) {
		if (!base?.length) return [];

		const activeSeenSet = seenSet instanceof Set ? seenSet : new Set();
		const random = createSeededRandom(seed);

		const unseen = [];
		const seen = [];
		let leadVideo = null;

		for (const video of base) {
			if (!video?.uuid) continue;
			if (leadVideoId && video.uuid === leadVideoId) {
				leadVideo = video;
				continue;
			}
			if (activeSeenSet.has(video.uuid)) {
				seen.push(video);
			} else {
				unseen.push(video);
			}
		}

		const output = [];

		if (leadVideo) {
			output.push(leadVideo);
		}

		const unseenShuffled = shuffleList(unseen, random);
		if (!leadVideo) {
			moveFirstDifferent(unseenShuffled, lastLeadId);
		}

		const seenShuffled = shuffleList(seen, random);
		if (!leadVideo && unseenShuffled.length === 0) {
			moveFirstDifferent(seenShuffled, lastLeadId);
		}

		output.push(...unseenShuffled);
		output.push(...seenShuffled);

		if (!output.length && leadVideo) {
			output.push(leadVideo);
		}

		return output;
	}

	function shuffleList(list = [], randomFn = Math.random) {
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

	function moveFirstDifferent(list, forbiddenId) {
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

	function createSeededRandom(seedInput) {
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

	function nextShortzSeed() {
		if (typeof crypto !== 'undefined' && crypto?.getRandomValues) {
			const buffer = new Uint32Array(1);
			crypto.getRandomValues(buffer);
			const nextValue = buffer[0] >>> 0;
			if (nextValue) {
				return nextValue;
			}
		}
		const fallback = Math.floor(Math.random() * 0xffffffff) >>> 0;
		return fallback || 0x8e3779b9;
	}

	function resolveMobileViewMode(value) {
		const normalized = normalizeValue(value);
		if (normalized === 'grid' || normalized === 'desktop') {
			return MobileView.FEED;
		}
		if (normalized === 'feed' || normalized === 'shortz') {
			return MobileView.SHORTZ;
		}
		return MobileView.SHORTZ;
	}

	function persistShortzSeen(nextSet) {
		if (!browser) return;
		try {
			const payload = JSON.stringify(Array.from(nextSet ?? []));
			localStorage.setItem(SHORTZ_SEEN_STORAGE_KEY, payload);
		} catch (error) {
			console.warn('VideoSheetShowcase: falha ao salvar histórico de shortz', error);
		}
	}

	function persistShortzLead(leadId) {
		if (!browser) return;
		try {
			if (leadId && typeof leadId === 'string') {
				localStorage.setItem(SHORTZ_LAST_LEAD_STORAGE_KEY, leadId);
			} else {
				localStorage.removeItem(SHORTZ_LAST_LEAD_STORAGE_KEY);
			}
		} catch (error) {
			console.warn('VideoSheetShowcase: falha ao salvar último shortz exibido', error);
		}
	}

	function hydrateShortzSeen() {
		if (!browser) {
			shortzSeenHydrated = true;
			return;
		}
		let nextSet = new Set(shortzSeenIds);
		try {
			const stored = localStorage.getItem(SHORTZ_SEEN_STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				const ids = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.ids) ? parsed.ids : [];
				for (const id of ids) {
					if (typeof id === 'string' && id.trim()) {
						nextSet.add(id);
					}
				}
			}
		} catch (error) {
			console.warn('VideoSheetShowcase: falha ao carregar histórico de shortz', error);
		}
		let hydratedLeadId = null;
		try {
			const storedLead = localStorage.getItem(SHORTZ_LAST_LEAD_STORAGE_KEY);
			if (typeof storedLead === 'string' && storedLead.trim()) {
				hydratedLeadId = storedLead;
			}
		} catch (error) {
			console.warn('VideoSheetShowcase: falha ao carregar último shortz exibido', error);
		}
		shortzLastLeadId = hydratedLeadId;
		shortzLastLeadPersistedId = hydratedLeadId;
		shortzLeadAvoidId = hydratedLeadId;
		shortzSeenIds = nextSet;
		shortzSeenInitial = new Set(nextSet);
		shortzSeenHydrated = true;
		feedOrderToken = nextShortzSeed();
	}

	function markShortzVideoSeen(videoId) {
		if (!videoId) return;
		if (shortzSeenIds.has(videoId)) return;
		const nextSet = new Set(shortzSeenIds);
		nextSet.add(videoId);
		shortzSeenIds = nextSet;
		if (shortzSeenHydrated) {
			persistShortzSeen(nextSet);
		}
	}

	function handleFilterClick(option) {
		if (!option) return;
		userTouchedFilters = true;
		if (filterMode === 'single') {
			activeFilterId = option.id;
		} else {
			if (option.isAll) {
				activeFilterIds = new Set();
				revealMobileResults({ type: 'filter' });
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
		revealMobileResults({ type: 'filter' });
	}

	function isFilterActive(option) {
		if (!option) return false;
		if (filterMode === 'single') {
			if (option.isAll) {
				return !activeFilterId || activeFilterId === 'all';
			}
			return activeFilterId === option.id;
		}
		if (option.isAll) {
			return !activeFilterIds || activeFilterIds.size === 0;
		}
		return activeFilterIds.has(option.id);
	}

	function clearSearchSuggestionsHideTimeout() {
		if (searchSuggestionsHideTimeoutId) {
			clearTimeout(searchSuggestionsHideTimeoutId);
			searchSuggestionsHideTimeoutId = null;
		}
	}

	function openSearchSuggestions() {
		clearSearchSuggestionsHideTimeout();
		if (searchSuggestions.length) {
			searchSuggestionsVisible = true;
		}
	}

	function closeSearchSuggestionsImmediate() {
		clearSearchSuggestionsHideTimeout();
		searchSuggestionsVisible = false;
		searchFieldFocused = false;
	}

	function scheduleSearchSuggestionsClose(delay = 120) {
		clearSearchSuggestionsHideTimeout();
		searchSuggestionsHideTimeoutId = setTimeout(
			() => {
				searchSuggestionsVisible = false;
				searchSuggestionsHideTimeoutId = null;
			},
			Math.max(0, delay)
		);
	}

	function handleSearchFocus() {
		searchFieldFocused = true;
		openSearchSuggestions();
	}

	function handleSearchBlur() {
		searchFieldFocused = false;
		scheduleSearchSuggestionsClose();
	}

	function handleSearchInput(event) {
		searchFieldFocused = true;
		searchTerm = event.currentTarget.value;
		if (searchResolved.instant) {
			activeSearchTerm = searchTerm;
			searchHasSubmitted = true;
			revealMobileResults({ type: 'search' });
		}
		openSearchSuggestions();
	}

	function handleSearchSubmit(event) {
		event?.preventDefault();
		activeSearchTerm = searchTerm;
		searchHasSubmitted = true;
		revealMobileResults({ type: 'search' });
		closeSearchSuggestionsImmediate();
	}

	function handleSearchClear() {
		searchTerm = '';
		activeSearchTerm = '';
		searchHasSubmitted = false;
		closeSearchSuggestionsImmediate();
	}

	function handleSuggestionSelect(suggestion) {
		if (!suggestion) return;
		const nextValue = suggestion.value ?? suggestion.label ?? '';
		if (!nextValue) return;
		searchTerm = nextValue;
		activeSearchTerm = nextValue;
		searchHasSubmitted = true;
		revealMobileResults({ type: 'search' });
		closeSearchSuggestionsImmediate();
	}

	async function setControlsFloatingState(shouldFloat) {
		if (!browser) return;
		if (!controlsElement) {
			if (!shouldFloat) {
				controlsFloatingVisible = false;
				controlsStuck = false;
				controlsFixed = false;
				controlsBounds = null;
				controlsPlaceholderHeight = 1;
			}
			return;
		}

		const token = ++controlsFloatingStateToken;

		if (shouldFloat) {
			if (controlsFixed && controlsFloatingVisible && controlsStuck) return;
			controlsStuck = true;
			controlsFloatingVisible = false;
			await tick();
			if (token !== controlsFloatingStateToken) return;
			refreshControlsBounds();
			if (!controlsBounds || !controlsBounds.width) {
				await tick();
				if (token !== controlsFloatingStateToken) return;
				refreshControlsBounds();
			}
			const nextHeight = Math.max(1, Math.round(controlsBounds?.height || 0));
			if (nextHeight !== controlsPlaceholderHeight) {
				controlsPlaceholderHeight = nextHeight;
			}
			controlsFixed = true;
			await tick();
			if (token !== controlsFloatingStateToken) return;
			controlsFloatingVisible = true;
			tick().then(() => {
				if (controlsFixed && !isMobileFeed) {
					refreshControlsBounds();
				}
			});
		} else {
			if (!controlsFixed && !controlsStuck && !controlsFloatingVisible) return;
			controlsFloatingVisible = false;
			controlsStuck = false;
			await tick();
			if (token !== controlsFloatingStateToken) return;
			controlsFixed = false;
			controlsBounds = null;
			controlsPlaceholderHeight = 1;
		}
	}

	function handleCreditsIntersection(entries = []) {
		let visible = false;
		for (const entry of entries ?? []) {
			if (entry?.isIntersecting && entry.intersectionRatio > 0) {
				visible = true;
				break;
			}
		}
		creditsInViewport = visible;
	}

	function findCreditsElement() {
		if (!browser) return null;
		if (creditsObserverTarget && document.contains(creditsObserverTarget)) {
			return creditsObserverTarget;
		}
		const selectors = [
			'[data-story-section="creditos"]',
			'[data-story-section="credits"]',
			'.final-credits',
			'footer.final-credits'
		];
		for (const selector of selectors) {
			const node = document.querySelector(selector);
			if (node) {
				return node;
			}
		}
		return null;
	}

	function setupCreditsObserver() {
		if (!browser) return;
		if (!creditsObserver) {
			try {
				creditsObserver = new IntersectionObserver(handleCreditsIntersection, {
					root: null,
					threshold: [0, 0.15],
					rootMargin: '0px 0px -35% 0px'
				});
			} catch (error) {
				console.warn('VideoSheetShowcase: falha ao criar observer de créditos', error);
				return;
			}
		}

		const target = findCreditsElement();
		if (!target) {
			if (
				creditsObserverRetryCount < CREDITS_OBSERVER_MAX_RETRIES &&
				!creditsObserverRetryId
			) {
				creditsObserverRetryId = setTimeout(() => {
					creditsObserverRetryId = null;
					creditsObserverRetryCount += 1;
					setupCreditsObserver();
				}, 500);
			}
			return;
		}

		creditsObserverRetryCount = 0;

		if (creditsObserverRetryId) {
			clearTimeout(creditsObserverRetryId);
			creditsObserverRetryId = null;
		}

		if (creditsObserverTarget === target) return;

		if (creditsObserverTarget) {
			try {
				creditsObserver.unobserve(creditsObserverTarget);
			} catch (error) {
				console.warn('VideoSheetShowcase: falha ao atualizar observer de créditos', error);
			}
		}

		try {
			creditsObserver.observe(target);
			creditsObserverTarget = target;
		} catch (error) {
			console.warn('VideoSheetShowcase: falha ao observar créditos', error);
		}
	}

	function teardownCreditsObserver() {
		if (creditsObserverRetryId) {
			clearTimeout(creditsObserverRetryId);
			creditsObserverRetryId = null;
		}
		if (creditsObserver) {
			try {
				creditsObserver.disconnect();
			} catch (error) {
				console.warn('VideoSheetShowcase: falha ao desconectar observer de créditos', error);
			}
		}
		creditsObserver = null;
		creditsObserverTarget = null;
		creditsObserverRetryCount = 0;
		creditsInViewport = false;
	}

	function setupRevealObserver() {
		if (!browser || !controlsRevealSentinelElement) return;
		if (!revealObserver) {
			revealObserver = new IntersectionObserver(
				(entries) => {
					const entry = entries[0];
					const isVisible = entry?.isIntersecting ?? false;
					controlsRevealActive = !isVisible;
				},
				{ threshold: [0], rootMargin: '-10% 0px 0px 0px' }
			);
		}
		if (revealObservedElement === controlsRevealSentinelElement) return;
		if (revealObservedElement) {
			try {
				revealObserver.unobserve(revealObservedElement);
			} catch (error) {
				console.warn('VideoSheetShowcase: falha ao atualizar observer de retomada', error);
			}
		}
		revealObserver.observe(controlsRevealSentinelElement);
		revealObservedElement = controlsRevealSentinelElement;
	}

	function teardownRevealObserver() {
		if (!revealObserver) return;
		try {
			revealObserver.disconnect();
		} catch (error) {
			console.warn('VideoSheetShowcase: falha ao desconectar observer de retomada', error);
		}
		revealObserver = null;
		revealObservedElement = null;
		controlsRevealActive = false;
	}

	function ensureFeedObserver() {
		if (!browser || !isMobileFeed || !mobileFeedContainer) return;
		if (!feedObserver) {
			feedObserver = new IntersectionObserver(handleFeedIntersection, {
				root: mobileFeedContainer,
				rootMargin: '35% 0px 35% 0px',
				threshold: [0.15, 0.5, 0.85]
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
		setFeedPosterState(videoId, true);
		return {
			update(nextVideoId) {
				if (nextVideoId !== videoId) {
					registerFeedItem(null, videoId);
					dropPlayerControls(videoId);
					videoId = nextVideoId;
					registerFeedItem(node, videoId);
					setFeedPosterState(videoId, true);
				}
			},
			destroy() {
				registerFeedItem(null, videoId);
				dropPlayerControls(videoId);
			}
		};
	}

	function setFeedPosterState(videoId, visible) {
		if (!videoId) return;
		const current = feedPosterVisible.get(videoId);
		if (current === visible) return;
		const next = new Map(feedPosterVisible);
		next.set(videoId, visible);
		feedPosterVisible = next;
	}

	function isFeedPosterVisible(videoId) {
		return feedPosterVisible.get(videoId) ?? true;
	}

	function shouldRenderFeedPlayer(videoId) {
		if (!isMobileFeed) return true;
		return feedPlayerWindow.has(videoId);
	}

	function shouldEagerInitFeedPlayer(videoId) {
	if (!isMobileFeed) return false;
	if (!videoId) return false;
	if (videoId === activeFeedId) return true;
	return feedPlayerWindow.has(videoId);
	}

	function isFeedMetaHidden(videoId) {
	return feedMetaHidden.has(videoId);
	}

	function showFeedMeta(videoId) {
	if (!videoId) return;
	if (!feedMetaHidden.has(videoId)) return;
	const next = new Set(feedMetaHidden);
	next.delete(videoId);
	feedMetaHidden = next;
	}

	function clearFeedMetaTimer() {
	if (feedMetaTimerId) {
		clearTimeout(feedMetaTimerId);
		feedMetaTimerId = null;
	}
	feedMetaTimerVideoId = null;
	}

	function scheduleFeedMetaHide(videoId) {
	if (!videoId) return;
	clearFeedMetaTimer();
	feedMetaTimerVideoId = videoId;
	feedMetaTimerId = setTimeout(() => {
		const next = new Set(feedMetaHidden);
		next.add(videoId);
		feedMetaHidden = next;
		feedMetaTimerId = null;
		feedMetaTimerVideoId = videoId;
	}, FEED_META_HIDE_DELAY);
	}

	function cleanupFeedMetaHoldListeners() {
	if (feedMetaHoldEndHandler) {
		window.removeEventListener('pointerup', feedMetaHoldEndHandler);
		window.removeEventListener('pointercancel', feedMetaHoldEndHandler);
		feedMetaHoldEndHandler = null;
	}
	}

function handleFeedMetaHoldStart(videoId, event) {
if (!isMobileFeed || !videoId) return;
const pointerType = event?.pointerType;
if (pointerType && pointerType !== 'touch' && pointerType !== 'pen') {
	return;
}
	if (event?.isPrimary === false) {
		return;
	}
if (feedMetaHoldActive && feedMetaHoldVideoId === videoId) {
	return;
}
feedMetaHoldActive = true;
feedMetaHoldVideoId = videoId;
	showFeedMeta(videoId);
	clearFeedMetaTimer();
	cleanupFeedMetaHoldListeners();
	const endHandler = () => {
		cleanupFeedMetaHoldListeners();
		handleFeedMetaHoldEnd(videoId);
	};
	feedMetaHoldEndHandler = endHandler;
	window.addEventListener('pointerup', endHandler, { once: true });
	window.addEventListener('pointercancel', endHandler, { once: true });
	}

	function handleFeedMetaHoldEnd(videoId) {
	if (!isMobileFeed || !videoId) return;
	feedMetaHoldActive = false;
	feedMetaHoldVideoId = null;
	clearFeedMetaTimer();
	const next = new Set(feedMetaHidden);
	next.add(videoId);
	feedMetaHidden = next;
	feedMetaTimerVideoId = videoId;
	}

	$: {
	if (!isMobileFeed) {
		if (feedMetaHidden.size) {
			feedMetaHidden = new Set();
		}
		clearFeedMetaTimer();
		cleanupFeedMetaHoldListeners();
		feedMetaHoldActive = false;
		feedMetaHoldVideoId = null;
		lastFeedMetaActiveId = null;
	} else {
		const activeId = activeFeedId ?? feedVideos[0]?.uuid ?? null;
		if (!activeId) {
			clearFeedMetaTimer();
			cleanupFeedMetaHoldListeners();
			feedMetaHoldActive = false;
			feedMetaHoldVideoId = null;
			lastFeedMetaActiveId = null;
		} else if (lastFeedMetaActiveId !== activeId) {
			showFeedMeta(activeId);
			if (!feedMetaHoldActive || feedMetaHoldVideoId !== activeId) {
				scheduleFeedMetaHide(activeId);
			} else {
				clearFeedMetaTimer();
			}
			lastFeedMetaActiveId = activeId;
		} else if (feedMetaHoldActive && feedMetaHoldVideoId === activeId) {
			showFeedMeta(activeId);
			clearFeedMetaTimer();
		}
	}
	}

	function handlePlayerControls(videoId, controls) {
		if (!videoId || !controls) return;
		feedPlayerControls.set(videoId, controls);
		if (!isMobileFeed) {
			desktopPlayerControls.set(videoId, controls);
			try {
				controls.pause?.();
				if (shouldAutoMute) {
					controls.setMuted?.(true);
				}
			} catch (error) {
				console.warn('VideoSheetShowcase: falha ao preparar player fora do feed', error);
			}
		}
		const isActive = videoId === activeFeedId;
		if (isMobileFeed) {
			if (!isActive) {
				try {
					controls.pause?.();
					if (shouldAutoMute) {
						controls.setMuted?.(true);
					}
				} catch (error) {
					console.warn('VideoSheetShowcase: falha ao pausar player não ativo', error);
				}
			}
		}
		feedPlaybackVersion += 1;
	}

	function dropPlayerControls(videoId) {
		const controls = feedPlayerControls.get(videoId) || desktopPlayerControls.get(videoId);
		feedPlayerControls.delete(videoId);
		desktopPlayerControls.delete(videoId);
		feedPlaybackVersion += 1;
		setFeedPosterState(videoId, true);
		if (!controls) return;
		try {
			controls.pause?.();
			if (shouldAutoMute) {
				controls.setMuted?.(true);
			}
		} catch (error) {
			console.warn('VideoSheetShowcase: falha ao resetar player', error);
		}
	}

	function updateFeedPlayback() {
		if (!browser) return;
		const shouldPauseAll =
			!isMobileFeed || !feedVideos.length || feedOverlayVisible || snapInProgress;
		if (shouldPauseAll) {
			feedPlayerControls.forEach((controls, videoId) => {
				try {
					controls.pause?.();
					if (shouldAutoMute) {
						controls.setMuted?.(true);
					}
				} catch (error) {
					console.warn('VideoSheetShowcase: falha ao pausar player', error);
				}
				setFeedPosterState(videoId, true);
			});
			lastActiveFeedId = null;
			return;
		}

		const nextActiveId = activeFeedId ?? feedVideos[0]?.uuid ?? null;
		if (!nextActiveId) {
			feedPlayerControls.forEach((controls, videoId) => {
				try {
					controls.pause?.();
					if (shouldAutoMute) {
						controls.setMuted?.(true);
					}
				} catch (error) {
					console.warn('VideoSheetShowcase: falha ao pausar player', error);
				}
				setFeedPosterState(videoId, true);
			});
			lastActiveFeedId = null;
			return;
		}

		if (lastActiveFeedId && lastActiveFeedId !== nextActiveId) {
			const previousControls = feedPlayerControls.get(lastActiveFeedId);
			if (previousControls) {
				try {
					previousControls.pause?.();
					if (shouldAutoMute) {
						previousControls.setMuted?.(true);
					}
				} catch (error) {
					console.warn('VideoSheetShowcase: falha ao pausar player anterior', error);
				}
			}
			setFeedPosterState(lastActiveFeedId, true);
		}

		const nextControls = feedPlayerControls.get(nextActiveId);
		if (nextControls) {
			try {
				nextControls.play?.();
				if (shouldAutoMute) {
					nextControls.setMuted?.(false);
				}
				setFeedPosterState(nextActiveId, false);
			} catch (error) {
				console.warn(
					'VideoSheetShowcase: não foi possível iniciar reprodução do vídeo ativo',
					error
				);
			}
		} else {
			setFeedPosterState(nextActiveId, true);
		}

		feedPlayerControls.forEach((controls, videoId) => {
			if (videoId === nextActiveId || videoId === lastActiveFeedId) return;
			if (!feedPlayerWindow.has(videoId)) {
				return;
			}
			try {
				controls.pause?.();
				if (shouldAutoMute) {
					controls.setMuted?.(true);
				}
			} catch (error) {
				console.warn('VideoSheetShowcase: falha ao pausar player secundário', error);
			} finally {
				setFeedPosterState(videoId, true);
			}
		});

		lastActiveFeedId = nextActiveId;
	}

	function pauseDesktopInlinePlayers() {
		desktopPlayerControls.forEach((controls) => {
			try {
				controls.pause?.();
				if (shouldAutoMute) {
					controls.setMuted?.(true);
				}
			} catch (error) {
				console.warn('VideoSheetShowcase: falha ao pausar player do grid', error);
			}
		});
	}

	function setupOverlayKeydown() {
		if (!browser) return;
		overlayKeydownCleanup?.();
		const handleKeydown = (event) => {
			if (!desktopOverlayVideoId) return;
			if (event.defaultPrevented) return;
			if (event.key === 'Escape') {
				event.preventDefault();
				closeDesktopOverlay();
			} else if (event.key === 'ArrowRight') {
				event.preventDefault();
				showNextDesktopOverlay();
			} else if (event.key === 'ArrowLeft') {
				event.preventDefault();
				showPreviousDesktopOverlay();
			}
		};
		window.addEventListener('keydown', handleKeydown);
		overlayKeydownCleanup = () => {
			window.removeEventListener('keydown', handleKeydown);
			overlayKeydownCleanup = null;
		};
	}

	function activateDesktopOverlayAt(index, { autoplay = false } = {}) {
		const videos = desktopOverlayVideos ?? [];
		if (!videos.length) return -1;
		if (desktopOverlayTransitionLock) {
			return desktopOverlayIndex;
		}
		const total = videos.length;
		let normalizedIndex = Number.isInteger(index) ? index : 0;
		if (normalizedIndex < 0) {
			normalizedIndex = ((normalizedIndex % total) + total) % total;
		} else {
			normalizedIndex = normalizedIndex % total;
		}

		const target = videos[normalizedIndex];
		if (!target) return -1;

		desktopOverlayTransitionLock = true;
		const transitionToken = ++desktopOverlayTransitionToken;
		const releaseTransitionLock = () => {
			if (transitionToken === desktopOverlayTransitionToken) {
				desktopOverlayTransitionLock = false;
			}
		};

		try {
			const sameVideo = desktopOverlayVideoId === target.uuid;
			desktopOverlayPendingAutoplay = autoplay;

			if (autoplay) {
				desktopOverlaySkipDFP =
					DESKTOP_SKIP_PATTERN[desktopPlaybackCount % DESKTOP_SKIP_PATTERN.length];
				desktopPlaybackCount += 1;
			}

			if (!sameVideo) {
				try {
					desktopOverlayControls?.pause?.();
					if (shouldAutoMute) {
						desktopOverlayControls?.setMuted?.(true);
					}
				} catch (error) {
					console.warn('VideoSheetShowcase: falha ao pausar player do overlay', error);
				}
				desktopOverlayControls = null;
				desktopOverlayVideoId = target.uuid;
			} else if (autoplay && desktopOverlayControls) {
				try {
					desktopOverlayControls.play?.();
					desktopOverlayControls.setMuted?.(false);
				} catch (error) {
					console.warn('VideoSheetShowcase: falha ao iniciar vídeo do overlay', error);
				} finally {
					desktopOverlayPendingAutoplay = false;
				}
			}

			tick()
				.then(() => {
					desktopOverlayElement?.focus?.();
					releaseTransitionLock();
				})
				.catch(() => {
					releaseTransitionLock();
				});

			return normalizedIndex;
		} catch (error) {
			releaseTransitionLock();
			throw error;
		}
	}

	function openShortzWithLead(videoId) {
		if (!videoId) return;
		feedLeadVideoId = videoId;
		const ensureSnap = () => {
			tick().then(() => {
				if (mobileViewMode !== MobileView.SHORTZ) return;
				scrollShowcaseToTop({ behavior: 'auto' });
				activeFeedId = videoId;
				snapActiveFeedVideo({ behavior: 'instant', force: true });
			});
		};
		if (mobileViewMode === MobileView.SHORTZ) {
			shortzSeenInitial = new Set(shortzSeenIds);
			shortzLeadAvoidId = shortzLastLeadId;
			feedOrderToken = nextShortzSeed();
			feedInitialized = false;
			queueMicrotask(ensureSnap);
		} else {
			setMobileViewMode(MobileView.SHORTZ);
			ensureSnap();
		}
	}

	function scrollShowcaseToTop({ behavior = 'auto' } = {}) {
		if (!browser) return;
		const normalizedBehavior = behavior === 'smooth' ? 'smooth' : 'auto';
		const target = rootElement ?? controlsElement ?? null;
		try {
			if (target) {
				const top = target.getBoundingClientRect().top + window.scrollY;
				window.scrollTo({ top, behavior: normalizedBehavior });
			} else {
				window.scrollTo({ top: 0, behavior: normalizedBehavior });
			}
		} catch (error) {
			try {
				if (target?.scrollIntoView) {
					target.scrollIntoView({ behavior: normalizedBehavior, block: 'start' });
				} else {
					window.scrollTo({ top: 0, behavior: normalizedBehavior });
				}
			} catch (fallbackError) {
				window.scrollTo({ top: 0 });
			}
		}
	}

	function handleVideoCardClick(videoId) {
		if (!videoId) return;
		if (isMobileViewport) {
			openShortzWithLead(videoId);
			return;
		}
		openDesktopOverlay(videoId);
	}

	function resolveFilterOptionForVideo(video) {
		if (!video || !filterOptions?.length) return null;
		const ids =
			video.filterIds instanceof Set
				? video.filterIds
				: new Set(Array.isArray(video.filterIds) ? video.filterIds : []);
		if (ids.size) {
			for (const option of filterOptions) {
				if (option?.isAll) continue;
				if (ids.has(option.id)) {
					return option;
				}
			}
		}
		if (Array.isArray(video.filters)) {
			for (const filter of video.filters) {
				if (!filter?.id) continue;
				const option = filterOptions.find((candidate) => candidate.id === filter.id);
				if (option && !option.isAll) {
					return option;
				}
			}
		}
		const normalizedTag = normalizeValue(video.tag);
		if (normalizedTag) {
			const option = filterOptions.find(
				(candidate) => !candidate.isAll && normalizeValue(candidate.label) === normalizedTag
			);
			if (option) {
				return option;
			}
		}
		return null;
	}

	function clearSearchStateForFilterJump() {
		if (!searchTerm && !activeSearchTerm && !searchHasSubmitted) return;
		searchTerm = '';
		activeSearchTerm = '';
		searchHasSubmitted = false;
	}

	function applyFilterOption(option) {
		if (!option || !filterOptions?.length) return false;
		const exists = filterOptions.some((candidate) => candidate.id === option.id);
		if (!exists) return false;
		userTouchedFilters = true;
		if (filterMode === 'single') {
			activeFilterId = option.id;
		} else {
			activeFilterId = null;
			const next = new Set();
			if (!option.isAll) {
				next.add(option.id);
			}
			activeFilterIds = next;
		}
		revealMobileResults({ type: 'filter' });
		return true;
	}

	async function handleVideoLabelFilter(video) {
		const option = resolveFilterOptionForVideo(video);
		if (!option) return;
		clearSearchStateForFilterJump();
		const applied = applyFilterOption(option);
		if (!applied) return;
		const overlayWasOpen = !!desktopOverlayVideoId;
		if (overlayWasOpen) {
			closeDesktopOverlay({ restoreScroll: false });
		}
		if (isMobileViewport) {
			setMobileViewMode(MobileView.FEED);
		}
		await tick();
		if (browser) {
			try {
				if (controlsElement) {
					controlsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
				} else {
					window.scrollTo({ top: 0, behavior: 'smooth' });
				}
			} catch (error) {
				try {
					window.scrollTo({ top: 0, behavior: 'smooth' });
				} catch (scrollError) {
					// ignore fallback failures
				}
			}
		}
	}

	async function openDesktopOverlay(videoId) {
		if (!videoId) return;
		if (isMobileViewport || isMobileFeed) return;
		if (desktopOverlayTransitionLock) return;
		const baseVideos = feedVideosBase ?? [];
		if (!baseVideos.length) return;

		if (defaultShuffleActive) {
			desktopOverlayPinnedVideoId = videoId;
			desktopOverlayShuffleSeed = Math.floor(Math.random() * 0xffffffff);
			desktopOverlayShuffleKey = '';
			await tick();
		}

		const videos = desktopOverlayVideos ?? [];
		if (!videos.length) return;
		const targetIndex = videos.findIndex((video) => video.uuid === videoId);
		if (targetIndex === -1) return;

		pauseDesktopInlinePlayers();

		if (browser) {
			desktopOverlayScrollTop = window.scrollY ?? 0;
			document.body.classList.add(BODY_SCROLL_LOCK_CLASS);
		}

		setupOverlayKeydown();
		activateDesktopOverlayAt(targetIndex, { autoplay: true });
	}

	function closeDesktopOverlay({ restoreScroll = true } = {}) {
		const hadVideo = !!desktopOverlayVideoId;
		desktopOverlayPendingAutoplay = false;
		desktopOverlayTransitionToken += 1;
		desktopOverlayTransitionLock = false;
		overlayKeydownCleanup?.();
		overlayKeydownCleanup = null;

		try {
			desktopOverlayControls?.pause?.();
			if (shouldAutoMute) {
				desktopOverlayControls?.setMuted?.(true);
			}
		} catch (error) {
			console.warn('VideoSheetShowcase: falha ao pausar player do overlay', error);
		}
		desktopOverlayControls = null;
		desktopOverlayVideoId = null;
		if (desktopOverlayPinnedVideoId !== null) {
			desktopOverlayPinnedVideoId = null;
		}
		if (desktopOverlayShuffleSeed !== 0) {
			desktopOverlayShuffleSeed = 0;
		}

		if (browser) {
			document.body.classList.remove(BODY_SCROLL_LOCK_CLASS);
			if (restoreScroll && hadVideo) {
				const targetTop = typeof desktopOverlayScrollTop === 'number' ? desktopOverlayScrollTop : 0;
				window.scrollTo({ top: targetTop, behavior: 'auto' });
			}
		}
	}

	function showNextDesktopOverlay() {
		if (!desktopOverlayVideos?.length || desktopOverlayTransitionLock) return;
		const nextIndex = desktopOverlayIndex >= 0 ? desktopOverlayIndex + 1 : 0;
		activateDesktopOverlayAt(nextIndex, { autoplay: true });
	}

	function showPreviousDesktopOverlay() {
		if (!desktopOverlayVideos?.length || desktopOverlayTransitionLock) return;
		const prevIndex =
			desktopOverlayIndex >= 0 ? desktopOverlayIndex - 1 : (desktopOverlayVideos.length || 1) - 1;
		activateDesktopOverlayAt(prevIndex, { autoplay: true });
	}

	function handleDesktopOverlayControls(event) {
		const controls = event?.detail?.controls ?? null;
		if (!controls) {
			desktopOverlayControls = null;
			return;
		}
		desktopOverlayControls = controls;
		try {
			controls.setMuted?.(false);
		} catch (error) {
			console.warn('VideoSheetShowcase: falha ao ativar áudio no overlay', error);
		}
		if (desktopOverlayPendingAutoplay) {
			try {
				controls.play?.();
				controls.setMuted?.(false);
			} catch (error) {
				console.warn('VideoSheetShowcase: falha ao iniciar vídeo do overlay', error);
			} finally {
				desktopOverlayPendingAutoplay = false;
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
		requestAnimationFrame(() => {
			mobileFeedContainer.scrollTo({ top: targetTop, behavior: scrollBehavior });
		});
		clearTimeout(snapTimeoutId);
		snapTimeoutId = setTimeout(
			() => {
				snapInProgress = false;
			},
			scrollBehavior === 'auto' ? 0 : 420
		);
	}

	function closeFeedOverlay() {
		feedOverlayMode = 'none';
		closeSearchSuggestionsImmediate();
		searchFieldFocused = false;
		if (isMobileFeed) {
			queueMicrotask(() => snapActiveFeedVideo({ behavior: 'smooth', force: true }));
		}
	}

	function revealMobileResults({ type } = {}) {
		if (!isMobileViewport) return;

		if (type === 'search') {
			const normalizedTerm = normalizeValue(activeSearchTerm || searchTerm);
			const minLength = Math.max(searchResolved?.minLength ?? 0, 1);
			if (!normalizedTerm || normalizedTerm.length < minLength) {
				return;
			}
		}

		setMobileViewMode(MobileView.FEED);
	}

	const normalizeOverlayMode = (mode) => {
		if (mode === 'filters' || mode === 'search' || mode === 'search-filters') {
			return 'search-filters';
		}
		return mode;
	};

	function toggleOverlay(mode, options = {}) {
		const normalizedMode = normalizeOverlayMode(mode);
		const targetMode = feedOverlayMode === normalizedMode ? 'none' : normalizedMode;

		if (!isMobileViewport) {
			feedOverlayMode = targetMode;
			return;
		}

		if (targetMode === 'none') {
			feedOverlayMode = 'none';
			return;
		}

		const preserveView = options?.preserveView;

		if (!preserveView && mobileViewMode !== MobileView.SHORTZ) {
			setMobileViewMode(MobileView.SHORTZ);
			tick().then(() => {
				if (mobileViewMode === MobileView.SHORTZ) {
					feedOverlayMode = targetMode;
				}
			});
			return;
		}

		if (!preserveView && !isMobileFeed) {
			queueMicrotask(() => {
				if (mobileViewMode === MobileView.SHORTZ) {
					feedOverlayMode = targetMode;
				}
			});
			return;
		}

		feedOverlayMode = targetMode;
	}

	function handleSearchFiltersToggle(preserveView = mobileViewMode === MobileView.FEED) {
		if (!hasSearch && !filterOptions.length) return;
		toggleOverlay('search-filters', { preserveView });
	}

	function setMobileViewMode(mode) {
		if (mode !== MobileView.SHORTZ && mode !== MobileView.FEED) return;
		feedOverlayMode = 'none';
		feedOverlayVisible = false;
		if (mobileViewMode === mode) return;
		mobileViewMode = mode;
		if (mode === MobileView.SHORTZ) {
			shortzSeenInitial = new Set(shortzSeenIds);
			shortzLeadAvoidId = shortzLastLeadId;
			feedOrderToken = nextShortzSeed();
			feedInitialized = false;
			queueMicrotask(() => {
				if (isMobileFeed) {
					snapActiveFeedVideo({ behavior: 'instant', force: true });
				}
			});
		} else {
			activeFeedId = null;
			updateFeedPlayback();
		}
	}

	const gridStyle = () =>
		`--card-gap:${layoutResolved.cardGap}; --cards-mobile:${layoutResolved.cardsPerRowMobile}; --cards-tablet:${layoutResolved.cardsPerRowTablet}; --cards-desktop:${layoutResolved.cardsPerRowDesktop}; --card-desktop-min:${layoutResolved.cardMinWidthDesktop}; --card-desktop-max:${layoutResolved.cardMaxWidthDesktop};`;

	$: hasSearch = resolvedSearchColumns.length > 0;
	$: showControls = (filterOptions.length > 0 || hasSearch) && totalVideos > 0;
	$: hideControlsForCredits = !isMobileViewport && creditsInViewport && controlsFixed;
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
	style={showcaseStyles}
	bind:this={rootElement}
>
	<div
		bind:this={sentinelElement}
		class="controls__sentinel"
		aria-hidden="true"
		style={controlsPlaceholderStyle}
	></div>

	{#if isMobileViewport && pageTitle}
		<header
			class="video-sheet-topbar"
			data-context={isMobileViewport ? 'mobile' : 'desktop'}
			style={mobileChromeStyle || undefined}
		>
			<div class="video-sheet-topbar__inner">
				<h1>{pageTitle}</h1>
			</div>
		</header>
	{/if}

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
			class:controls--desktop-stuck={controlsStuck && !isMobileViewport}
			class:controls--floating={controlsFixed && !isMobileViewport}
			class:controls--floating-visible={controlsFloatingVisible && !isMobileViewport}
			class:controls--hidden-for-credits={hideControlsForCredits}
			data-mobile={isMobileViewport ? 'true' : 'false'}
			data-mobile-view={isMobileViewport ? mobileViewMode : 'desktop'}
			data-overlay={feedOverlayVisible ? 'open' : 'closed'}
			aria-hidden={hideControlsForCredits ? 'true' : undefined}
			bind:this={controlsElement}
			style={controlsInlineStyle}
		>
			{#if isMobileViewport}
				{#if feedOverlayVisible}
					<div class="controls__header">
						<h2>Buscar e filtrar vídeos</h2>
						<button
							type="button"
							class="controls__close"
							on:click={closeFeedOverlay}
							aria-label="Fechar painel"
						>
							Fechar
						</button>
					</div>

					<div class="controls__modal">
						{#if showHeadingEyebrow}
							<span class="controls__modal-eyebrow">{headingEyebrow}</span>
						{/if}

						{#if hasSearch}
							<div class="search-wrapper controls__modal-search">
								<form
									class="search-bar"
									role="search"
									on:submit={handleSearchSubmit}
									style={searchStyleVars}
								>
									<input
										type="search"
										name="video-search"
										placeholder={searchResolved.placeholder}
										aria-label={searchResolved.placeholder}
										bind:value={searchTerm}
										on:input={handleSearchInput}
										on:focus={handleSearchFocus}
										on:blur={handleSearchBlur}
										bind:this={searchInputRef}
									/>
									<button type="submit">{searchResolved.submitLabel}</button>
									{#if searchTerm && searchResolved.showClearButton !== false}
										<button type="button" class="alt" on:click={handleSearchClear}>
											{searchResolved.clearLabel}
										</button>
									{/if}
								</form>
								{#if searchSuggestionsVisible && searchSuggestions.length}
									<ul class="search-suggestions" role="listbox" aria-label="Sugestões de busca">
										{#each searchSuggestions as suggestion (suggestion.id)}
											<li role="presentation">
												<button
													type="button"
													role="option"
													class="search-suggestions__item"
													on:mousedown|preventDefault
													on:click={() => handleSuggestionSelect(suggestion)}
												>
													{suggestion.label}
												</button>
											</li>
										{/each}
									</ul>
								{/if}
							</div>
						{/if}

						{#if filterOptions.length}
							<div class="controls__modal-section">
								<p class="controls__modal-section-title">Temas:</p>
								<div
									class="filter-carousel filter-carousel--modal"
									role="tablist"
									aria-label="Filtros da narrativa"
								>
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
							</div>
						{/if}
					</div>
				{/if}
			{:else if !hideControlsForMobileFeed}
				<div class="controls__inner">
					{#if showHeadingDesktop}
						<div
							class="controls-heading"
							data-context={isMobileViewport ? 'mobile' : 'desktop'}
							data-align={headingAlignment}
						>
							{#if showHeadingEyebrow}
								<span class="controls-heading__eyebrow">{headingEyebrow}</span>
							{/if}
							{#if headingTitle}
								<h2>{headingTitle}</h2>
								<span class="controls-heading__divider" aria-hidden="true"></span>
							{/if}
							{#if headingSubtitle}
								<p>{headingSubtitle}</p>
							{/if}
						</div>
					{/if}

					{#if hasSearch}
						<div class="search-wrapper">
							<form
								class="search-bar"
								role="search"
								on:submit={handleSearchSubmit}
								style={searchStyleVars}
							>
								<input
									type="search"
									name="video-search"
									placeholder={searchResolved.placeholder}
									aria-label={searchResolved.placeholder}
									bind:value={searchTerm}
									on:input={handleSearchInput}
									on:focus={handleSearchFocus}
									on:blur={handleSearchBlur}
								/>
								<button type="submit">{searchResolved.submitLabel}</button>
								{#if searchTerm && searchResolved.showClearButton !== false}
									<button type="button" class="alt" on:click={handleSearchClear}
										>{searchResolved.clearLabel}</button
									>
								{/if}
							</form>
							{#if searchSuggestionsVisible && searchSuggestions.length}
								<ul class="search-suggestions" role="listbox" aria-label="Sugestões de busca">
									{#each searchSuggestions as suggestion (suggestion.id)}
										<li role="presentation">
											<button
												type="button"
												role="option"
												class="search-suggestions__item"
												on:mousedown|preventDefault
												on:click={() => handleSuggestionSelect(suggestion)}
											>
												{suggestion.label}
											</button>
										</li>
									{/each}
								</ul>
							{/if}
						</div>
					{/if}

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
				</div>
			{/if}
		</div>
	{/if}
	<div
		class="controls-reveal-sentinel"
		aria-hidden="true"
		bind:this={controlsRevealSentinelElement}
	></div>
	{#if loading}
		<div class="status status--loading">{loadingMessage}</div>
	{:else if error}
		<div class="status status--error">
			<p>{error}</p>
			<button type="button" on:click={loadSheet}>Tentar novamente</button>
		</div>
	{:else if isMobileFeed}
		{#if feedVideos.length}
			<div class="mobile-feed-shell">
				<div class="mobile-feed" bind:this={mobileFeedContainer} aria-live="polite" role="list">
					{#each feedVideos as video, index (video.uuid)}
						<article
							role="listitem"
							class="mobile-feed__item"
							class:mobile-feed__item--active={video.uuid === activeFeedId}
							use:feedItemObserver={video.uuid}
							on:pointerdown={(event) => handleFeedMetaHoldStart(video.uuid, event)}
						>
							<div
								class="mobile-feed__player"
								style={video.thumbnail
									? `--mobile-feed-thumb:url(${JSON.stringify(video.thumbnail)})`
									: undefined}
							>
								{#if video.thumbnail}
									<img
										src={video.thumbnail}
										alt={video.title}
										loading="lazy"
										class="mobile-feed__poster"
										class:mobile-feed__poster--hidden={!isFeedPosterVisible(video.uuid)}
										aria-hidden={!isFeedPosterVisible(video.uuid)}
									/>
								{/if}
								{#if shouldRenderFeedPlayer(video.uuid)}
									<GloboPlayer
										videoId={video.globoId}
										videoIdDesktop={video.globoIdDesktop}
										videoIdMobile={video.globoIdMobile}
										autoPlay={false}
										poster={video.thumbnail || undefined}
										posterAlt={video.title}
										startMuted={shouldMuteInitially}
										controls={true}
										aspectRatio="9 / 16"
										aspectRatioMobile="9 / 16"
										containerBackgroundColor="#0b0d17"
										preventBlackBars={true}
										eagerInit={shouldEagerInitFeedPlayer(video.uuid)}
										on:controls={(event) =>
											handlePlayerControls(video.uuid, event.detail?.controls)}
										on:ready={() => setFeedPosterState(video.uuid, false)}
										on:error={() => setFeedPosterState(video.uuid, true)}
										on:destroyed={() => setFeedPosterState(video.uuid, true)}
									/>
								{:else}
									<div class="mobile-feed__player-placeholder" aria-hidden="true"></div>
								{/if}
							</div>
						<div class="mobile-feed__overlay">
							<div class="mobile-feed__gradient"></div>
							<div class="mobile-feed__content">
								<div
									class="mobile-feed__top"
									class:mobile-feed__meta-hidden={isFeedMetaHidden(video.uuid)}
									aria-hidden={isFeedMetaHidden(video.uuid) ? 'true' : undefined}
								>
							{#if showCountsEnabled}
								<span class="mobile-feed__counter">{index + 1}/{feedVideos.length}</span>
							{/if}
									{#if video.tag || video.section?.label}
										<span class="mobile-feed__tag">{video.tag || video.section?.label}</span>
									{/if}
								</div>
							<div
								class="mobile-feed__text"
								class:mobile-feed__meta-hidden={isFeedMetaHidden(video.uuid)}
								aria-hidden={isFeedMetaHidden(video.uuid) ? 'true' : undefined}
							>
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
							</div>
						</article>
					{/each}
				</div>
			</div>
		{:else}
			<div class="status status--empty">{emptyStateMessage}</div>
		{/if}
	{:else if isMobileFeedGrid}
		{#if feedVideosBase.length}
			<div class="mobile-feed-grid" aria-live="polite" role="list">
				{#each feedVideosBase as video (video.uuid)}
					<div class="mobile-feed-grid__item" role="listitem">
						<button
							type="button"
							class="mobile-feed-grid__button"
							on:click={() => handleVideoCardClick(video.uuid)}
							aria-label={`Abrir ${video.title} no shortz`}
						>
							{#if video.thumbnail}
								<img
									src={video.thumbnail}
									alt={video.title}
									loading="lazy"
									class="mobile-feed-grid__thumb"
								/>
							{:else}
								<span class="mobile-feed-grid__fallback">{video.title}</span>
							{/if}
						</button>
					</div>
				{/each}
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
				<div class="video-section__inner">
					<header>
						<h2>{highlightSection.label}</h2>
						{#if showCountsEnabled}
							<span class="section-count">{highlightSection.videos.length}</span>
						{/if}
					</header>
					<div
						class="video-grid"
						data-mobile-grid={mobileViewMode === MobileView.FEED ? 'true' : undefined}
					>
						{#each highlightSection.videos as video (video.uuid)}
							<article class="video-card">
								<div class="video-card__player">
									<GloboPlayer
										videoId={video.globoId}
										videoIdDesktop={video.globoIdDesktop}
										videoIdMobile={video.globoIdMobile}
										autoPlay={false}
										startMuted={shouldMuteInitially}
										controls={true}
										aspectRatio="9 / 16"
										aspectRatioMobile="9 / 16"
										containerBackgroundColor="#0b0d17"
										preventBlackBars={true}
									/>
									<button
										type="button"
										class="video-card__overlay-trigger"
										on:click={() => handleVideoCardClick(video.uuid)}
										aria-label={`Assistir ${video.title}`}
									></button>
								</div>
								<div class="video-card__meta">
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
				</div>
			</section>
		{/if}

		{#if regularSections.length}
			{#each regularSections as section (section.anchor)}
				<section class="video-section" id={section.anchor} style={gridStyle()}>
					<div class="video-section__inner">
						<header>
							<h2>{section.label}</h2>
							{#if showCountsEnabled}
								<span class="section-count">{section.videos.length}</span>
							{/if}
						</header>
						<div
							class="video-grid"
							data-mobile-grid={mobileViewMode === MobileView.FEED ? 'true' : undefined}
						>
							{#each section.videos as video (video.uuid)}
								<article class="video-card">
									<div class="video-card__player">
										<GloboPlayer
											videoId={video.globoId}
											videoIdDesktop={video.globoIdDesktop}
											videoIdMobile={video.globoIdMobile}
											autoPlay={false}
											startMuted={shouldMuteInitially}
											controls={true}
											aspectRatio="9 / 16"
											aspectRatioMobile="9 / 16"
											containerBackgroundColor="#0b0d17"
											preventBlackBars={true}
										/>
										<button
											type="button"
											class="video-card__overlay-trigger"
											on:click={() => handleVideoCardClick(video.uuid)}
											aria-label={`Assistir ${video.title}`}
										></button>
									</div>
									<div class="video-card__meta">
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
					</div>
				</section>
			{/each}
		{:else}
			<div class="status status--empty">{emptyStateMessage}</div>
		{/if}
	{/if}

	{#if layoutResolved.enableMobileFeed !== false && isMobileViewport}
		<nav
			class="mobile-bottom-bar"
			aria-label="Controles de visualização e filtros"
			class:mobile-bottom-bar--hidden={feedOverlayVisible}
			style={mobileChromeStyle || undefined}
		>
			<button
				type="button"
				class="mobile-bottom-bar__button mobile-bottom-bar__button--shortz"
				class:mobile-bottom-bar__button--active={mobileViewMode === MobileView.SHORTZ}
				class:mobile-bottom-bar__button--active-shortz={mobileViewMode === MobileView.SHORTZ}
				on:click={() => setMobileViewMode(MobileView.SHORTZ)}
				aria-pressed={mobileViewMode === MobileView.SHORTZ}
				aria-label="Ver vídeos em shortz (lista infinita)"
			>
				shortz
			</button>
			<button
				type="button"
				class="mobile-bottom-bar__button mobile-bottom-bar__button--feed"
				class:mobile-bottom-bar__button--active={mobileViewMode === MobileView.FEED &&
					feedOverlayMode === 'none'}
				class:mobile-bottom-bar__button--active-feed={mobileViewMode === MobileView.FEED &&
					feedOverlayMode === 'none'}
				on:click={() => setMobileViewMode(MobileView.FEED)}
				aria-pressed={mobileViewMode === MobileView.FEED && feedOverlayMode === 'none'}
				aria-label="Ver vídeos em grade"
			>
				feed
			</button>
			{#if hasSearch || filterOptions.length}
				<button
					type="button"
					class="mobile-bottom-bar__button mobile-bottom-bar__button--search"
					class:mobile-bottom-bar__button--active={feedOverlayMode === 'search-filters'}
					class:mobile-bottom-bar__button--active-search={feedOverlayMode === 'search-filters'}
					on:click={() => handleSearchFiltersToggle(mobileViewMode === MobileView.FEED)}
					aria-pressed={feedOverlayMode === 'search-filters'}
					aria-label="Abrir busca e filtros de vídeos"
				>
					busca
				</button>
			{/if}
		</nav>
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

{#if desktopOverlayVideo && !isMobileViewport}
	<div
		class="desktop-overlay"
		data-variant={desktopOverlayVariant}
		on:click={() => closeDesktopOverlay()}
	>
		<div
			class="desktop-overlay__surface"
			data-has-image={desktopOverlaySurfaceHasImage ? 'true' : 'false'}
			style={desktopOverlaySurfaceInlineStyle}
			role="dialog"
			aria-modal="true"
			aria-labelledby={`desktop-overlay-title-${desktopOverlayVideo.uuid}`}
			bind:this={desktopOverlayElement}
			tabindex="-1"
			on:click|stopPropagation
		>
			<div class="desktop-overlay__grid" data-variant={desktopOverlayVariant}>
				<div class="desktop-overlay__col desktop-overlay__col--left">
					{#if desktopOverlayVideos.length > 1}
						<button
							type="button"
							class="desktop-overlay__nav desktop-overlay__nav--prev"
							on:click|stopPropagation={showPreviousDesktopOverlay}
							aria-label="Ver vídeo anterior"
						>
							<svg viewBox="0 0 24 24" aria-hidden="true">
								<path
									d="M15 5L8 12L15 19"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</button>
					{/if}
				</div>

				<div class="desktop-overlay__col desktop-overlay__col--video">
					<div class="desktop-overlay__player">
						<div class="desktop-overlay__player-inner">
							{#key desktopOverlayVideo.uuid}
								<GloboPlayer
									videoId={desktopOverlayVideo.globoId}
									videoIdDesktop={desktopOverlayVideo.globoIdDesktop}
									videoIdMobile={desktopOverlayVideo.globoIdMobile}
									autoPlay={true}
									startMuted={false}
									controls={true}
									aspectRatio="9 / 16"
									aspectRatioMobile="9 / 16"
									containerBackgroundColor="#0b0d17"
									preventBlackBars={true}
									skipDFP={desktopOverlaySkipDFP}
									on:controls={handleDesktopOverlayControls}
								/>
							{/key}
						</div>
					</div>
				</div>

				<div class="desktop-overlay__col desktop-overlay__col--meta">
					<div class="desktop-overlay__meta">
						{#if desktopOverlayVideos.length > 1 && desktopOverlayIndex >= 0}
							<span class="desktop-overlay__counter">
								{desktopOverlayIndex + 1}/{desktopOverlayVideos.length}
							</span>
						{/if}

						{#if desktopOverlayVideo.tag || desktopOverlayVideo.section?.label}
							<button
								type="button"
								class="desktop-overlay__tag"
								on:click|stopPropagation={() => handleVideoLabelFilter(desktopOverlayVideo)}
								aria-label={`Ver vídeos do tema ${desktopOverlayVideo.tag || desktopOverlayVideo.section?.label}`}
							>
								{desktopOverlayVideo.tag || desktopOverlayVideo.section?.label}
							</button>
						{/if}

						<h2 id={`desktop-overlay-title-${desktopOverlayVideo.uuid}`}>
							{desktopOverlayVideo.title}
						</h2>

						{#if desktopOverlayVideo.subtitle}
							<p>{desktopOverlayVideo.subtitle}</p>
						{:else if desktopOverlayVideo.description}
							<p>{desktopOverlayVideo.description}</p>
						{/if}

						{#if desktopOverlayVideo.publishedAtDisplay || (desktopOverlayVideo.section?.label && desktopOverlayVideo.section?.label !== desktopOverlayVideo.tag)}
							<div class="desktop-overlay__details">
								{#if desktopOverlayVideo.publishedAtDisplay}
									<span>{desktopOverlayVideo.publishedAtDisplay}</span>
								{/if}
								{#if desktopOverlayVideo.section?.label && desktopOverlayVideo.section?.label !== desktopOverlayVideo.tag}
									<span>{desktopOverlayVideo.section.label}</span>
								{/if}
							</div>
						{/if}

						{#if desktopOverlayVideo.link}
							<a
								class="desktop-overlay__cta"
								href={desktopOverlayVideo.link}
								target="_blank"
								rel="noopener noreferrer"
							>
								Saiba mais
							</a>
						{/if}
					</div>
				</div>

				<div class="desktop-overlay__col desktop-overlay__col--right">
					<button
						type="button"
						class="desktop-overlay__close"
						on:click|stopPropagation={() => closeDesktopOverlay()}
						aria-label="Fechar vídeo"
					>
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path
								d="M6 6L18 18M18 6L6 18"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>

					{#if desktopOverlayVideos.length > 1}
						<button
							type="button"
							class="desktop-overlay__nav desktop-overlay__nav--next"
							on:click|stopPropagation={showNextDesktopOverlay}
							aria-label="Ver próximo vídeo"
						>
							<svg viewBox="0 0 24 24" aria-hidden="true">
								<path
									d="M9 5L16 12L9 19"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.video-sheet-showcase {
		--filter-carousel-horizontal-padding: 0;
		--mobile-bottom-bar-height: 0;
		--mobile-topbar-height: calc(48px + env(safe-area-inset-top, 0));
		display: flex;
		flex-direction: column;
		gap: 2.25rem;
		position: relative;
		background: var(--sheet-background, #fdf4ed);
		padding: 2.5rem var(--sheet-container-padding-mobile, 1rem) 3.5rem;
	}

	.video-sheet-showcase[data-mode='mobile-feed'] {
		min-height: 100dvh;
		gap: 0;
		background: #000000;
		color: var(--mobile-feed-title, #ffffff);
		--mobile-feed-controls-offset: env(safe-area-inset-top, 0);
		padding: 0 0 var(--mobile-bottom-bar-height, 0) 0;
	}

	:global(body.video-sheet-showcase--lock-scroll) {
		overflow: hidden;
	}

	@media (max-width: 767px) {
		.video-sheet-showcase {
			--mobile-bottom-bar-height: calc(6rem + env(safe-area-inset-bottom, 0));
			padding-top: calc(
				var(--mobile-topbar-height, calc(48px + env(safe-area-inset-top, 0))) + 1rem
			);
			padding-right: var(--sheet-container-padding-mobile, 1rem);
			padding-bottom: calc(2.75rem + var(--mobile-bottom-bar-height, 0));
			padding-left: var(--sheet-container-padding-mobile, 1rem);
			gap: 1.85rem;
		}
	}

	@media (min-width: 768px) {
		.video-sheet-showcase {
			padding-inline: var(
				--sheet-container-padding-desktop,
				var(--sheet-container-padding-mobile, 1rem)
			);
		}
	}

	.video-sheet-showcase[data-mode='mobile-feed'] .controls__sentinel {
		display: none;
	}

	.video-sheet-topbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 60;
		pointer-events: none;
	}

	.video-sheet-topbar__inner {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: var(--mobile-topbar-height, calc(48px + env(safe-area-inset-top, 0)));
		padding: env(safe-area-inset-top, 0) 1.25rem 0;
		background: var(
			--mobile-chrome-bg,
			linear-gradient(180deg, rgba(10, 12, 20, 0.85) 0%, rgba(10, 12, 20, 0.05) 100%)
		);
		color: var(--mobile-chrome-text, rgba(246, 234, 210, 0.92));
		backdrop-filter: blur(22px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.12);
		pointer-events: auto;
	}

	.video-sheet-topbar h1 {
		margin: 0;
		font-size: clamp(1rem, 4.2vw, 1.25rem);
		font-weight: 700;
		letter-spacing: 0.02em;
		text-transform: none;
		text-align: center;
		line-height: 1.2;
		max-height: 48px;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.mobile-bottom-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		width: 100%;
		display: flex;
		align-items: stretch;
		justify-content: space-between;
		flex-wrap: nowrap;
		gap: 0.55rem;
		padding: 0.55rem 0.85rem calc(env(safe-area-inset-bottom, 0) + 0.85rem);
		background: var(
			--mobile-bottom-bar-bg,
			linear-gradient(180deg, rgba(6, 8, 18, 0.08) 0%, rgba(6, 8, 18, 0.95) 100%)
		);
		color: var(--mobile-chrome-text, rgba(246, 234, 210, 0.92));
		backdrop-filter: blur(20px);
		box-shadow: 0 -22px 48px rgba(5, 8, 16, 0.55);
		z-index: 60;
		opacity: 1;
		transform: translateY(0);
		transition:
			opacity 0.25s ease,
			transform 0.25s ease;
	}

	.mobile-bottom-bar--hidden {
		opacity: 0;
		transform: translateY(calc(100% + 24px));
		pointer-events: none;
	}

	.mobile-bottom-bar__button {
		flex: 1 1 0;
		min-width: 0;
		padding: 0.65rem 0.6rem;
		border-radius: 999px;
		border: 1px solid var(--mobile-bottom-button-border, rgba(255, 255, 255, 0.08));
		background: var(--mobile-bottom-button-bg, rgba(254, 247, 234, 0.92));
		color: var(--mobile-bottom-button-color, rgba(12, 18, 36, 0.78));
		font-size: 0.72rem;
		line-height: 1.1;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: none;
		text-align: center;
		white-space: nowrap;
		cursor: pointer;
		box-shadow: 0 16px 32px rgba(12, 16, 28, 0.28);
		transition:
			background 0.22s ease,
			color 0.22s ease,
			border-color 0.22s ease,
			transform 0.22s ease,
			box-shadow 0.22s ease,
			filter 0.22s ease;
	}

	.mobile-bottom-bar__button:hover,
	.mobile-bottom-bar__button:focus-visible {
		outline: none;
		transform: translateY(-2px);
		filter: brightness(1.05);
	}

	.mobile-bottom-bar__button--shortz {
		background: var(--mobile-bottom-shortz-bg, rgba(226, 66, 46, 0.08));
		color: var(--mobile-bottom-shortz-color, rgba(252, 243, 234, 0.95));
		border-color: var(--mobile-bottom-shortz-border, rgba(255, 255, 255, 0.16));
	}

	.mobile-bottom-bar__button--feed,
	.mobile-bottom-bar__button--filters,
	.mobile-bottom-bar__button--search {
		color: rgba(12, 18, 36, 0.82);
	}

	.mobile-bottom-bar__button--active {
		transform: translateY(-3px);
		box-shadow: 0 18px 40px rgba(2, 6, 14, 0.48);
	}

	.mobile-bottom-bar__button--active-shortz {
		background: var(--mobile-bottom-shortz-active-bg, #e34832);
		color: var(--mobile-bottom-shortz-active-color, #ffffff);
		border-color: rgba(255, 255, 255, 0.32);
	}

	.mobile-bottom-bar__button--active-feed,
	.mobile-bottom-bar__button--active-filters,
	.mobile-bottom-bar__button--active-search {
		background: var(--mobile-bottom-button-active-bg, rgba(255, 250, 241, 0.98));
		color: var(--mobile-bottom-button-active-color, #060a15);
		border-color: rgba(255, 255, 255, 0.52);
	}

	@media (min-width: 768px) {
		.video-sheet-topbar {
			position: sticky;
			top: var(--controls-sticky-top, 0px);
		}

		.video-sheet-topbar__inner {
			height: auto;
			padding: 2.25rem 0 1.5rem;
			background: var(--desktop-topbar-bg, #ffffff);
			backdrop-filter: none;
			border-bottom: 1px solid rgba(15, 23, 42, 0.08);
			color: var(--desktop-topbar-color, #111827);
			box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
		}

		.video-sheet-topbar h1 {
			max-height: none;
			display: block;
			font-size: clamp(2rem, 3vw, 2.8rem);
			letter-spacing: 0.02em;
			line-height: 1.1;
		}
	}

	.controls[data-mobile='true'] {
		--mobile-feed-controls-offset: var(
			--mobile-topbar-height,
			calc(48px + env(safe-area-inset-top, 0))
		);
	}

	.controls[data-mobile='true'][data-mobile-view='feed'] {
		position: fixed;
		top: calc(env(safe-area-inset-top, 0) + 0.35rem);
		left: 0;
		right: 0;
		z-index: 40;
		opacity: 0;
		pointer-events: none;
		transform: translateY(-120%);
		transition:
			opacity 0.25s ease,
			transform 0.25s ease;
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
		padding: calc(env(safe-area-inset-top, 0) + 1.5rem) 0
			calc(env(safe-area-inset-bottom, 0) + 2rem);
		background: rgba(6, 10, 21, 0.9);
		backdrop-filter: blur(24px);
		border: none;
		box-shadow: none;
		height: 100vh;
		height: 100dvh;
		min-height: 100vh;
		min-height: 100dvh;
		overflow: hidden;
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

	.controls__modal {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 0 1rem 2rem;
		flex: 1;
		overflow-y: auto;
		min-height: 0;
	}

	.controls__modal-eyebrow {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: rgba(255, 255, 255, 0.68);
	}

	.controls__modal-search {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.controls__modal-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		flex: 1;
		min-height: 0;
	}

	.controls__modal-section-title {
		margin: 0;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--mobile-feed-title, #ffffff);
	}

	.filter-carousel.filter-carousel--modal {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
		padding: 0;
		overflow-y: auto;
		flex: 1;
		min-height: 0;
		overflow-x: hidden;
	}

	.filter-carousel.filter-carousel--modal .filter-chip {
		width: 100%;
		flex: initial;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		border-radius: 8px;
		padding: 0.75rem 1rem;
		gap: 0.25rem;
		min-height: 4.25rem;
	}

	.filter-carousel.filter-carousel--modal .filter-chip__count {
		margin-left: 0;
	}

	.mobile-feed-shell {
		position: relative;
		width: 100%;
		height: 100dvh;
		padding-top: var(--mobile-feed-controls-offset, calc(48px + env(safe-area-inset-top, 0)));
		padding-bottom: var(--mobile-bottom-bar-height, 0);
		background: #000000;
	}

	.mobile-feed {
		height: calc(
			100dvh - var(--mobile-feed-controls-offset, calc(48px + env(safe-area-inset-top, 0))) -
				var(--mobile-bottom-bar-height, 0)
		);
		overflow-y: auto;
		scroll-snap-type: y mandatory;
		position: relative;
		-webkit-overflow-scrolling: touch;
		will-change: transform;
	}

	.mobile-feed::-webkit-scrollbar {
		display: none;
	}

	.mobile-feed__item {
		position: relative;
		height: calc(
			100dvh - var(--mobile-feed-controls-offset, calc(48px + env(safe-area-inset-top, 0))) -
				var(--mobile-bottom-bar-height, 0)
		);
		scroll-snap-align: start;
		scroll-snap-stop: always;
		display: flex;
		flex-direction: column;
		justify-content: center;
		background: #000000;
		opacity: 0.88;
		transition: opacity 0.25s ease;
	}

	.mobile-feed__item--active {
		opacity: 1;
	}

	.mobile-feed__player {
		position: relative;
		flex: 1;
		overflow: hidden;
		background-color: #0b0d17;
		background-image: var(--mobile-feed-thumb, none);
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}

	.mobile-feed__player-placeholder {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.mobile-feed__top,
	.mobile-feed__text {
		transition: opacity 0.35s ease, transform 0.35s ease;
		will-change: opacity, transform;
	}

	.mobile-feed__meta-hidden {
		opacity: 0;
		transform: translateY(14px);
		pointer-events: none;
	}

	.mobile-feed__poster {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		pointer-events: none;
		transition:
			opacity 0.3s ease,
			visibility 0.3s ease;
		z-index: 2;
	}

	.mobile-feed__poster--hidden {
		opacity: 0;
		visibility: hidden;
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
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.mobile-feed__cta:hover,
	.mobile-feed__cta:focus-visible {
		transform: translateY(-2px);
		box-shadow: 0 18px 36px rgba(15, 23, 42, 0.28);
	}

	.mobile-feed-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1px;
		padding: calc(var(--mobile-feed-controls-offset, 4.6rem) + 0.5rem) 0
			calc(var(--mobile-bottom-bar-height, 0) + 0.75rem);
		width: 100vw;
		margin-left: calc(50% - 50vw);
		margin-right: calc(50% - 50vw);
	}

	.mobile-feed-grid__item {
		position: relative;
	}

	.mobile-feed-grid__button {
		position: relative;
		display: block;
		width: 100%;
		padding: 0;
		border: none;
		background: #0b0d17;
		border-radius: 0;
		overflow: hidden;
		aspect-ratio: 9 / 16;
		cursor: pointer;
	}

	.mobile-feed-grid__button:focus-visible {
		outline: 2px solid rgba(227, 72, 50, 0.8);
		outline-offset: 2px;
	}

	.mobile-feed-grid__thumb {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.mobile-feed-grid__fallback {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem;
		text-align: center;
		font-size: 0.75rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.86);
		background: linear-gradient(180deg, rgba(8, 12, 24, 0.84) 0%, rgba(8, 12, 24, 0.92) 100%);
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

	.controls__sentinel {
		width: 100%;
		height: 1px;
		flex-shrink: 0;
		pointer-events: none;
	}

	.controls-reveal-sentinel {
		width: 100%;
		height: 1px;
		pointer-events: none;
	}

	.controls {
		position: relative;
		z-index: 10;
		background: var(--controls-bg, rgba(255, 255, 255, 0.92));
		backdrop-filter: blur(12px);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem 0 1.25rem;
		border-bottom: 1px solid rgba(15, 23, 42, 0.08);
		transition:
			opacity 0.3s ease,
			transform 0.3s ease,
			box-shadow 0.3s ease;
	}

	.controls--hidden-for-credits {
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
		transition:
			opacity 0.18s ease,
			visibility 0s linear 0.18s;
	}

	.controls--floating.controls--hidden-for-credits {
		box-shadow: none;
		animation: none;
	}

	.controls__inner {
		width: 100%;
		max-width: var(--sheet-container-max, 100%);
		margin: 0;
		padding-inline: 0;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		align-items: stretch;
	}

	.controls--desktop-stuck {
		box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
	}

	@keyframes controls-floating-in {
		0% {
			opacity: 0;
			transform: translateY(40px) scale(0.94);
			box-shadow: 0 16px 36px rgba(15, 23, 42, 0.12);
		}
		55% {
			opacity: 1;
			transform: translateY(-8px) scale(1.04);
			box-shadow: 0 42px 62px rgba(15, 23, 42, 0.22);
		}
		75% {
			transform: translateY(4px) scale(0.99);
			box-shadow: 0 28px 48px rgba(15, 23, 42, 0.18);
		}
		100% {
			opacity: 1;
			transform: translateY(0) scale(1);
			box-shadow: 0 32px 52px rgba(15, 23, 42, 0.18);
		}
	}

	.controls--floating {
		position: fixed;
		top: auto;
		bottom: var(--controls-floating-offset, clamp(1.5rem, 4vh, 3rem));
		border-bottom: none;
		border-radius: 1.25rem;
		box-shadow: 0 32px 52px rgba(15, 23, 42, 0.18);
		opacity: 0;
		transform: translateY(28px);
		pointer-events: none;
		padding: clamp(1.1rem, 3vw, 1.6rem) clamp(1.5rem, 4vw, 2.4rem);
		backdrop-filter: blur(18px);
		-webkit-backdrop-filter: blur(18px);
		will-change: transform, opacity, box-shadow;
	}

	.controls--floating-visible {
		opacity: 1;
		transform: translateY(0);
		pointer-events: auto;
		animation: controls-floating-in 0.58s cubic-bezier(0.18, 0.88, 0.24, 1.12);
	}

	.controls--floating-visible.controls--hidden-for-credits {
		opacity: 0;
		pointer-events: none;
		animation: none;
	}

	.controls--floating .controls-heading,
	.controls--floating .controls-meta {
		display: none;
	}

	.controls--floating .controls__inner {
		gap: 0.75rem;
	}

	.controls--floating .search-wrapper {
		margin: 0;
		width: 100%;
	}

	.controls--floating .filter-carousel {
		margin: 0;
	}

	.controls--floating .search-bar {
		width: 100%;
	}

	.controls--floating .search-suggestions {
		max-height: min(40vh, 16rem);
	}

	@media (min-width: 768px) {
		.controls {
			padding: 1.75rem 0 2.5rem;
		}

		.controls.controls--floating {
			padding: clamp(1.2rem, 2.5vw, 1.65rem) clamp(1.75rem, 4vw, 2.75rem);
		}

		.controls__inner {
			gap: 1.75rem;
		}
	}

	.controls-heading {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		align-items: center;
		text-align: center;
		margin: 0 auto;
		max-width: min(64rem, 100%);
		padding: 0;
	}

	.controls-heading[data-align='left'] {
		align-items: flex-start;
		text-align: left;
		margin-left: 0;
		margin-right: 0;
	}

	.controls-heading__eyebrow {
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(
			--controls-heading-eyebrow,
			var(--controls-heading-desktop, var(--desktop-topbar-color, #111827))
		);
	}

	.controls-heading h2 {
		margin: 0;
		font-size: clamp(1.8rem, 3.4vw, 2.8rem);
		font-weight: 700;
		line-height: 1.12;
		color: var(--controls-heading-desktop, var(--desktop-topbar-color, #111827));
		text-transform: none;
	}

	.controls-heading__divider {
		display: block;
		width: min(120px, 100%);
		height: 2px;
		border-radius: 999px;
		background: var(--controls-heading-divider, rgba(17, 24, 39, 0.12));
		align-self: center;
	}

	.controls-heading p {
		margin: 0;
		font-size: clamp(1rem, 1.85vw, 1.2rem);
		line-height: 1.55;
		color: var(--controls-heading-desktop-subtitle, rgba(15, 23, 42, 0.65));
		max-width: 48rem;
	}

	.controls-heading[data-context='mobile'] {
		align-items: flex-start;
		text-align: left;
		margin-left: 0;
		margin-right: 0;
	}

	.controls-heading[data-align='left'] .controls-heading__divider,
	.controls-heading[data-context='mobile'] .controls-heading__divider {
		align-self: flex-start;
	}

	.controls-heading[data-context='mobile'] .controls-heading__divider {
		display: none;
	}

	.controls-heading[data-context='mobile'] h2 {
		color: var(--controls-heading-mobile, var(--mobile-feed-title, #ffffff));
	}

	.controls-heading[data-context='mobile'] p {
		color: var(--controls-heading-mobile-subtitle, rgba(255, 255, 255, 0.85));
	}

	.controls-heading + .filter-carousel,
	.controls-heading + .search-bar {
		margin-top: 0;
	}

	.filter-carousel {
		display: flex;
		flex-wrap: nowrap;
		gap: 0.5rem;
		overflow-x: auto;
		padding-bottom: 0.25rem;
		margin: 0;
		padding-inline: var(--filter-carousel-horizontal-padding, 0);
		width: 100%;
		scroll-snap-type: x proximity;
		-webkit-overflow-scrolling: touch;
	}

	.filter-carousel::-webkit-scrollbar {
		height: 6px;
	}

	.filter-carousel::-webkit-scrollbar-thumb {
		background: rgba(15, 23, 42, 0.15);
		border-radius: 999px;
	}

	@media (min-width: 768px) {
		.filter-carousel {
			justify-content: flex-start;
			overflow-x: auto;
			scrollbar-width: thin;
		}
	}

	.filter-chip {
		scroll-snap-align: start;
		flex: 0 0 auto;
		border-radius: 999px;
		padding: 0.5rem 1.125rem;
		background: var(--filter-chip-background, rgba(15, 23, 42, 0.06));
		color: var(--filter-chip-color, rgba(15, 23, 42, 0.82));
		border: 1px solid var(--filter-chip-border-color, transparent);
		font-size: 0.95rem;
		line-height: 1;
		font-weight: 500;
		cursor: pointer;
		transition:
			background 0.2s ease,
			color 0.2s ease,
			border-color 0.2s ease;
	}

	.filter-chip:hover,
	.filter-chip:focus-visible {
		background: var(--filter-chip-hover-background, rgba(15, 23, 42, 0.12));
		border-color: var(
			--filter-chip-hover-border-color,
			var(--filter-chip-border-color, transparent)
		);
		outline: none;
	}

	.filter-chip--active {
		background: var(--filter-chip-active-background, #0f172a);
		color: var(--filter-chip-active-color, #ffffff);
		border-color: var(--filter-chip-active-border-color, #0f172a);
	}

	.filter-chip__count {
		font-size: 0.75rem;
		font-weight: 600;
		margin-left: 0.5rem;
		color: var(--filter-chip-count-color, rgba(15, 23, 42, 0.6));
	}

	.search-bar {
		display: flex;
		align-items: stretch;
		gap: 0.5rem;
		width: 100%;
		padding-inline: var(--search-container-padding, 0.5rem);
	}

	.controls__inner .search-bar {
		width: 100%;
		max-width: var(--controls-search-max-width, 100%);
		margin: 0;
		align-self: stretch;
	}

	@media (min-width: 768px) {
		.search-bar {
			padding-inline: var(
				--search-container-padding-desktop,
				var(--search-container-padding, 0.5rem)
			);
		}
	}

	.search-bar input {
		flex: 1;
		min-height: 2.75rem;
		border-radius: 999px;
		border: 1px solid var(--search-input-border-color, rgba(15, 23, 42, 0.15));
		padding: 0.5rem 1.125rem;
		font-size: 1rem;
		background: var(--search-input-background, rgba(255, 255, 255, 0.97));
		color: var(--search-input-color, #111827);
	}

	.search-bar input::placeholder {
		color: var(--search-input-placeholder-color, rgba(17, 24, 39, 0.45));
	}

	.search-bar input:focus {
		outline: 2px solid var(--search-input-focus-outline, #ef4444);
		outline-offset: 2px;
		border-color: var(
			--search-input-focus-border-color,
			var(--search-input-border-color, rgba(15, 23, 42, 0.15))
		);
	}

	.search-bar button {
		border-radius: 999px;
		padding: 0 1.5rem;
		background: var(--search-button-background, #0f172a);
		color: var(--search-button-color, #ffffff);
		border: 1px solid var(--search-button-border-color, transparent);
		font-weight: 600;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition:
			background 0.2s ease,
			border-color 0.2s ease,
			color 0.2s ease;
	}

	.search-bar button:hover,
	.search-bar button:focus-visible {
		background: var(--search-button-hover-background, #111827);
		border-color: var(
			--search-button-hover-border-color,
			var(--search-button-border-color, transparent)
		);
		outline: none;
	}

	.search-bar button.alt {
		background: var(--search-clear-button-background, rgba(15, 23, 42, 0.1));
		color: var(--search-clear-button-color, #0f172a);
		border: 1px solid var(--search-clear-button-border-color, transparent);
	}

	.search-bar button.alt:hover,
	.search-bar button.alt:focus-visible {
		background: var(--search-clear-button-hover-background, rgba(15, 23, 42, 0.18));
		border-color: var(
			--search-clear-button-hover-border-color,
			var(--search-clear-button-border-color, transparent)
		);
		outline: none;
	}

	.search-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.search-suggestions {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin: 0;
		padding: 0.5rem 0.35rem;
		border-radius: 0.85rem;
		background: rgba(15, 23, 42, 0.04);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.18),
			0 12px 24px rgba(15, 23, 42, 0.08);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		max-height: 14rem;
		overflow-y: auto;
	}

	.search-suggestions__item {
		width: 100%;
		text-align: left;
		padding: 0.6rem 0.9rem;
		border-radius: 0.65rem;
		background: rgba(255, 255, 255, 0.92);
		border: 1px solid rgba(15, 23, 42, 0.08);
		color: rgba(15, 23, 42, 0.85);
		font-size: 0.95rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			background 0.2s ease,
			border-color 0.2s ease,
			transform 0.2s ease;
	}

	.search-suggestions__item:hover,
	.search-suggestions__item:focus-visible {
		background: rgba(15, 23, 42, 0.12);
		border-color: rgba(15, 23, 42, 0.18);
		transform: translateX(4px);
		outline: none;
	}

	.controls-meta {
		font-size: 0.85rem;
		color: rgba(15, 23, 42, 0.6);
		padding-inline: 0;
		text-align: left;
		margin: 0;
	}

	.controls__inner .controls-meta {
		padding-inline: 0;
	}

	.video-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 0;
	}

	.video-section__inner {
		width: 100%;
		max-width: var(--sheet-container-max, 100%);
		margin: 0;
		padding-inline: 0;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	@media (min-width: 768px) {
		.video-section__inner {
			padding-inline: 0;
		}
	}

	.video-section header {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
	}

	.video-section h2 {
		font-size: clamp(1.3rem, 2vw, 1.6rem);
		font-weight: 700;
		color: var(--section-title-color, #111827);
	}

	.video-section--highlight h2 {
		color: var(--section-title-highlight-color, #b45309);
	}

	.section-count {
		font-size: 0.85rem;
		font-weight: 600;
		color: rgba(15, 23, 42, 0.6);
	}

	.video-grid {
		display: grid;
		gap: var(--card-gap, 12px);
		grid-template-columns: repeat(var(--cards-mobile, 1), minmax(0, 1fr));
		justify-content: stretch;
		align-items: stretch;
	}

	@media (max-width: 820px) {
		.video-grid[data-mobile-grid='true'] {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 0;
		}

		.video-grid[data-mobile-grid='true'] .video-card {
			gap: 0;
		}

		.video-grid[data-mobile-grid='true'] .video-card__player {
			border-radius: 0;
		}

		.video-grid[data-mobile-grid='true'] .video-card__meta {
			padding: 0.65rem 0.75rem 0.85rem;
		}
	}

	@media (min-width: 640px) {
		.video-grid {
			grid-template-columns: repeat(var(--cards-tablet, 2), minmax(0, 1fr));
		}
	}

	@media (min-width: 960px) {
		.video-grid {
			grid-template-columns: repeat(
				auto-fit,
				minmax(var(--card-desktop-min, 240px), var(--card-desktop-max, 320px))
			);
			justify-content: flex-start;
		}

		.video-card__player {
			max-height: none;
		}
	}

	.video-card {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		height: 100%;
		width: 100%;
	}

	.video-card__player {
		border-radius: 1rem;
		overflow: hidden;
		aspect-ratio: 9 / 16;
		background: #0b0d17;
		position: relative;
		width: 100%;
		max-height: 60vh;
		margin: 0;
		display: flex;
		align-items: stretch;
		justify-content: center;
	}

	.video-card__overlay-trigger {
		display: none;
	}

	@media (min-width: 769px) {
		.video-card__overlay-trigger {
			position: absolute;
			inset: 0;
			display: block;
			background: transparent;
			border: none;
			padding: 0;
			margin: 0;
			cursor: pointer;
			transition:
				outline 0.2s ease,
				transform 0.2s ease;
		}

		.video-card__overlay-trigger::before {
			content: '';
			position: absolute;
			inset: 0;
			background: linear-gradient(180deg, rgba(8, 12, 24, 0.45) 0%, rgba(8, 12, 24, 0.2) 100%);
			opacity: 0;
			transform: scale(1);
			transition:
				opacity 0.2s ease,
				transform 0.2s ease;
		}

		.video-card__overlay-trigger:hover::before,
		.video-card__overlay-trigger:focus-visible::before {
			opacity: 1;
			transform: scale(1.02);
		}

		.video-card__overlay-trigger:focus-visible {
			outline: 2px solid rgba(255, 255, 255, 0.85);
			outline-offset: 0;
		}
	}

	.video-card__player::before {
		display: none;
	}

	.video-card__player :global(.globoplayer-container),
	.video-card__player :global(.globoplay-wrapper),
	.video-card__player :global(iframe) {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.video-card__player :global(button[aria-label='Ativar som']),
	.mobile-feed__player :global(button[aria-label='Ativar som']) {
		display: none !important;
	}

	.video-card__meta {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1;
		width: 100%;
	}

	@media (max-width: 959px) {
		.video-card__player {
			margin: 0 auto;
		}
	}

	.video-card__title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--video-title-color, #111827);
		line-height: 1.35;
	}

	.video-card__subtitle {
		font-size: 0.9rem;
		color: var(--video-subtitle-color, rgba(15, 23, 42, 0.75));
		line-height: 1.45;
	}

	.desktop-overlay {
		position: fixed;
		inset: 0;
		z-index: 90;
		display: flex;
		align-items: center;
		justify-content: center;
		--desktop-overlay-padding-block: clamp(1.5rem, 5vh, 3rem);
		--desktop-overlay-padding-inline: clamp(3.5rem, 9vw, 5.5rem);
		padding: var(--desktop-overlay-padding-block) var(--desktop-overlay-padding-inline);
		background: var(--desktop-overlay-backdrop, rgba(5, 9, 18, 0.78));
		backdrop-filter: blur(var(--desktop-overlay-backdrop-blur, 28px));
		-webkit-backdrop-filter: blur(var(--desktop-overlay-backdrop-blur, 28px));
		overflow-y: auto;
	}

	.desktop-overlay__surface {
		position: relative;
		--desktop-overlay-viewport-height: min(
			calc(100vh - var(--desktop-overlay-padding-block, clamp(1.5rem, 5vh, 3rem)) * 2),
			1100px
		);
		width: min(1200px, 96vw);
		max-height: var(--desktop-overlay-viewport-height);
		min-height: min(var(--desktop-overlay-viewport-height), 720px);
		padding: clamp(1.5rem, 4vw, 2.6rem);
		border-radius: 1.75rem;
		background: var(--desktop-overlay-surface, rgba(12, 18, 36, 0.55));
		background-image: var(--desktop-overlay-surface-image, none);
		background-size: var(--desktop-overlay-surface-image-size, cover);
		background-position: var(--desktop-overlay-surface-image-position, center);
		background-repeat: var(--desktop-overlay-surface-image-repeat, no-repeat);
		background-blend-mode: var(--desktop-overlay-surface-image-blend, normal);
		border: 1px solid var(--desktop-overlay-surface-border, rgba(255, 255, 255, 0.18));
		box-shadow: var(--desktop-overlay-surface-shadow, 0 32px 80px rgba(5, 8, 25, 0.65));
		backdrop-filter: blur(var(--desktop-overlay-surface-blur, 22px));
		-webkit-backdrop-filter: blur(var(--desktop-overlay-surface-blur, 22px));
		overflow: hidden;
	}

	.desktop-overlay__grid {
		display: grid;
		grid-template-columns: auto minmax(0, clamp(380px, 48vw, 620px)) minmax(
				0,
				clamp(260px, 30vw, 420px)
			) auto;
		align-items: stretch;
		gap: clamp(1.5rem, 4vw, 3rem);
		height: 100%;
		width: 100%;
	}

	.desktop-overlay__col {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
	}

	.desktop-overlay__col--left,
	.desktop-overlay__col--right {
		min-width: clamp(2.75rem, 5vw, 3.75rem);
		position: relative;
	}

	.desktop-overlay__col--right {
		align-items: flex-end;
		gap: clamp(1.25rem, 3vh, 2rem);
	}

	.desktop-overlay__col--left {
		padding-right: clamp(0.5rem, 2vw, 1.25rem);
	}

	.desktop-overlay__col--right {
		padding-left: clamp(0.5rem, 2vw, 1.25rem);
	}

	.desktop-overlay__col--left .desktop-overlay__nav,
	.desktop-overlay__col--right .desktop-overlay__nav {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
	}

	.desktop-overlay__col--left .desktop-overlay__nav {
		left: clamp(0.65rem, 2vw, 1.25rem);
	}

	.desktop-overlay__col--right .desktop-overlay__nav {
		right: clamp(0.65rem, 2vw, 1.25rem);
	}

	.desktop-overlay__col--video,
	.desktop-overlay__col--meta {
		align-items: stretch;
	}

	.desktop-overlay__player {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1 1 auto;
		min-height: 0;
		height: 100%;
		max-height: min(var(--desktop-overlay-viewport-height, 96vh), 100%);
		--desktop-overlay-player-padding: clamp(0.5rem, 1.8vh, 1.35rem);
		padding: var(--desktop-overlay-player-padding, 0);
		border-radius: var(--desktop-overlay-player-radius, 1.5rem);
		background: var(--desktop-overlay-player-background, rgba(5, 9, 18, 0.88));
		box-shadow: var(--desktop-overlay-player-shadow, 0 24px 46px rgba(12, 18, 36, 0.42));
	}

	.desktop-overlay__player-inner {
		position: relative;
		height: min(var(--desktop-overlay-viewport-height, 96vh), 100%);
		max-height: min(var(--desktop-overlay-viewport-height, 96vh), 100%);
		width: min(100%, calc(var(--desktop-overlay-viewport-height, 96vh) * 9 / 16));
		aspect-ratio: 9 / 16;
		border-radius: calc(
			var(--desktop-overlay-player-radius, 1.5rem) - var(--desktop-overlay-player-padding, 0)
		);
		overflow: hidden;
		background: #050b16;
	}

	.desktop-overlay__player-inner::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(5, 9, 18, 0.25) 100%);
		opacity: 0.4;
		pointer-events: none;
	}

	.desktop-overlay__player-inner :global(.globoplayer-container),
	.desktop-overlay__player-inner :global(.globoplay-wrapper),
	.desktop-overlay__player-inner :global(iframe) {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.desktop-overlay__player-inner :global(button[aria-label='Ativar som']) {
		display: none !important;
	}

	.desktop-overlay__meta {
		display: flex;
		flex-direction: column;
		justify-content: var(--desktop-overlay-meta-justify, center);
		gap: clamp(0.85rem, 2.4vw, 1.5rem);
		color: rgba(248, 250, 252, 0.9);
	}

	.desktop-overlay__meta h2 {
		margin: 0;
		font-size: clamp(1.45rem, 2.6vw, 2.1rem);
		font-weight: 700;
		line-height: 1.32;
		color: rgba(248, 250, 252, 0.98);
	}

	.desktop-overlay__meta p {
		margin: 0;
		font-size: clamp(0.95rem, 1.4vw, 1.05rem);
		line-height: 1.6;
		color: rgba(226, 232, 240, 0.9);
		max-width: 36ch;
	}

	.desktop-overlay__counter {
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.18em;
		color: rgba(248, 250, 252, 0.72);
	}

	.desktop-overlay__details {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.45rem;
		font-size: 0.85rem;
		color: rgba(226, 232, 240, 0.78);
	}

	.desktop-overlay__details span {
		display: inline-flex;
		align-items: center;
	}

	.desktop-overlay__details span + span::before {
		content: '';
		display: inline-block;
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: rgba(248, 250, 252, 0.45);
		margin-inline: 0.45rem;
		transform: translateY(-1px);
	}

	.desktop-overlay__tag {
		align-self: flex-start;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		padding: 0.35rem 1.1rem;
		border-radius: 999px;
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		border: none;
		appearance: none;
		-webkit-appearance: none;
		cursor: pointer;
		outline: none;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.08));
		color: rgba(248, 250, 252, 0.9);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.25),
			0 8px 18px rgba(15, 23, 42, 0.35);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		transition:
			transform 0.25s ease,
			box-shadow 0.25s ease,
			opacity 0.25s ease;
	}

	.desktop-overlay__tag:hover,
	.desktop-overlay__tag:focus-visible {
		transform: translateY(-1px);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.35),
			0 12px 28px rgba(15, 23, 42, 0.42);
	}

	.desktop-overlay__tag:focus-visible {
		outline: 2px solid rgba(255, 255, 255, 0.65);
		outline-offset: 3px;
	}

	.desktop-overlay__cta {
		align-self: flex-start;
		margin-top: 0.25rem;
		padding: 0.65rem 1.45rem;
		border-radius: 999px;
		background: var(
			--desktop-overlay-accent,
			linear-gradient(135deg, rgba(236, 72, 153, 0.85), rgba(59, 130, 246, 0.85))
		);
		color: #050b16;
		text-decoration: none;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		font-size: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.25);
		box-shadow: 0 18px 42px rgba(59, 130, 246, 0.3);
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease,
			opacity 0.2s ease;
	}

	.desktop-overlay__cta:hover,
	.desktop-overlay__cta:focus-visible {
		transform: translateY(-2px) scale(1.01);
		box-shadow: 0 24px 52px rgba(59, 130, 246, 0.38);
		outline: none;
	}

	.desktop-overlay__close {
		width: clamp(2.5rem, 4.5vw, 3rem);
		height: clamp(2.5rem, 4.5vw, 3rem);
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.28);
		background: rgba(255, 255, 255, 0.16);
		color: rgba(248, 250, 252, 0.95);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		box-shadow: 0 12px 28px rgba(15, 23, 42, 0.35);
		transition:
			background 0.2s ease,
			transform 0.2s ease,
			box-shadow 0.2s ease;
		margin-bottom: auto;
	}

	.desktop-overlay__close:hover,
	.desktop-overlay__close:focus-visible {
		background: rgba(255, 255, 255, 0.26);
		transform: scale(1.05);
		box-shadow: 0 16px 34px rgba(15, 23, 42, 0.42);
		outline: none;
	}

	.desktop-overlay__close svg {
		width: 1.3rem;
		height: 1.3rem;
		pointer-events: none;
	}

	.desktop-overlay__nav {
		display: flex;
		align-items: center;
		justify-content: center;
		width: clamp(2.75rem, 5.5vw, 3.5rem);
		height: clamp(2.75rem, 5.5vw, 3.5rem);
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.24);
		background: rgba(255, 255, 255, 0.16);
		color: rgba(248, 250, 252, 0.92);
		cursor: pointer;
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		box-shadow: 0 14px 30px rgba(15, 23, 42, 0.38);
		transform-origin: center;
		transition:
			background 0.2s ease,
			box-shadow 0.2s ease,
			transform 0.2s ease;
	}

	.desktop-overlay__nav:hover,
	.desktop-overlay__nav:focus-visible {
		background: rgba(255, 255, 255, 0.26);
		transform: translateY(-50%) scale(1.04);
		box-shadow: 0 20px 42px rgba(15, 23, 42, 0.45);
		outline: none;
	}

	.desktop-overlay__nav svg {
		width: 1.45rem;
		height: 1.45rem;
		pointer-events: none;
	}

	.desktop-overlay[data-variant='glass'] .desktop-overlay__surface::before {
		content: '';
		position: absolute;
		inset: -40%;
		background: var(
			--desktop-overlay-accent,
			linear-gradient(
				135deg,
				rgba(236, 72, 153, 0.32) 0%,
				rgba(59, 130, 246, 0.32) 35%,
				rgba(45, 212, 191, 0.25) 100%
			)
		);
		filter: blur(70px);
		opacity: 0.65;
		pointer-events: none;
	}

	.desktop-overlay[data-variant='glass'] .desktop-overlay__surface::after {
		content: '';
		position: absolute;
		inset: 0;
		background:
			radial-gradient(circle at 20% -10%, rgba(255, 255, 255, 0.35), transparent 55%),
			radial-gradient(circle at 80% 120%, rgba(148, 163, 255, 0.22), transparent 40%);
		opacity: 0.4;
		pointer-events: none;
	}

	.desktop-overlay[data-variant='glass'] .desktop-overlay__surface[data-has-image='true']::before,
	.desktop-overlay[data-variant='glass'] .desktop-overlay__surface[data-has-image='true']::after {
		content: none;
	}

	.desktop-overlay[data-variant='glass'] .desktop-overlay__grid {
		grid-template-columns: auto minmax(0, clamp(360px, 40vw, 520px)) minmax(
				0,
				clamp(260px, 30vw, 440px)
			) auto;
	}

	.desktop-overlay[data-variant='glass'] .desktop-overlay__meta {
		align-items: flex-start;
		max-height: calc(90vh - clamp(3.5rem, 8vw, 5rem));
		overflow-y: auto;
		padding-right: 0.4rem;
		scrollbar-gutter: stable;
	}

	.desktop-overlay[data-variant='glass'] .desktop-overlay__meta::-webkit-scrollbar {
		width: 6px;
	}

	.desktop-overlay[data-variant='glass'] .desktop-overlay__meta::-webkit-scrollbar-thumb {
		background: rgba(248, 250, 252, 0.35);
		border-radius: 999px;
	}

	.desktop-overlay[data-variant='card'] .desktop-overlay__surface {
		width: var(--desktop-overlay-card-width, min(960px, 94vw));
		min-height: min(var(--desktop-overlay-viewport-height, 96vh), 720px);
		padding: var(--desktop-overlay-card-padding, 1.85rem);
		border-radius: var(--desktop-overlay-card-radius, 1.8rem);
		background: var(
			--desktop-overlay-card-bg,
			linear-gradient(145deg, rgba(9, 14, 26, 0.95) 0%, rgba(17, 25, 46, 0.82) 100%)
		);
		box-shadow: var(--desktop-overlay-card-shadow, 0 32px 64px rgba(5, 9, 18, 0.58));
		border: none;
	}

	.desktop-overlay[data-variant='card'] .desktop-overlay__surface::before,
	.desktop-overlay[data-variant='card'] .desktop-overlay__surface::after {
		content: none;
	}

	.desktop-overlay[data-variant='card'] .desktop-overlay__grid {
		grid-template-columns:
			auto minmax(
				0,
				max(clamp(320px, 40vw, 560px), calc(var(--desktop-overlay-viewport-height, 96vh) * 9 / 16))
			)
			minmax(0, clamp(260px, 32vw, 360px)) auto;
		align-items: stretch;
		gap: clamp(1.25rem, 4vw, 2.25rem);
	}

	.desktop-overlay[data-variant='card'] .desktop-overlay__player {
		--desktop-overlay-player-padding: var(--desktop-overlay-card-media-padding, 1.1rem);
		padding: var(--desktop-overlay-player-padding, 0);
		border-radius: calc(var(--desktop-overlay-card-radius, 1.8rem) - 0.6rem);
		background: var(--desktop-overlay-player-background, rgba(5, 9, 18, 0.92));
		box-shadow: 0 26px 48px rgba(5, 9, 18, 0.45);
	}

	.desktop-overlay[data-variant='card'] .desktop-overlay__player-inner {
		border-radius: calc(var(--desktop-overlay-card-radius, 1.8rem) - 1.2rem);
	}

	.desktop-overlay[data-variant='card'] .desktop-overlay__meta {
		align-items: center;
		justify-content: center;
		text-align: center;
	}

	.desktop-overlay[data-variant='card'] .desktop-overlay__meta p {
		max-width: 32ch;
		margin-inline: auto;
	}

	.desktop-overlay[data-variant='card'] .desktop-overlay__tag,
	.desktop-overlay[data-variant='card'] .desktop-overlay__cta {
		align-self: center;
	}

	.desktop-overlay[data-variant='card'] .desktop-overlay__cta {
		box-shadow: 0 18px 42px rgba(59, 130, 246, 0.26);
	}

	.desktop-overlay[data-variant='card'] .desktop-overlay__col--right {
		align-items: flex-end;
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

	.video-sheet-topbar[data-context='mobile'] .video-sheet-topbar__inner {
		justify-content: center;
		padding: calc(env(safe-area-inset-top, 0) + 0.6rem) 1rem 0.6rem;
		background: transparent;
		border-bottom: none;
	}

	.video-sheet-topbar[data-context='mobile'] h1 {
		font-size: 1.1rem;
		font-weight: 600;
		text-transform: none;
		letter-spacing: 0.01em;
	}
</style>
