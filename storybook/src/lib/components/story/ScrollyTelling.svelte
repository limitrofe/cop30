<script>
	import { onMount, tick } from 'svelte';
	import Scroller from './shared/Scroller.svelte';
	import Step from './shared/Step.svelte';
	import StepEnhanced from './shared/StepEnhanced.svelte';

	export let steps = [];
	export let fullWidth = false;
	export let hasHeaderBefore = false;
	export let threshold;
	export let stickyTopDesktop;
	export let stickyTopMobile;
	export let activationMode = 'exit';
	export let activationLine = 0;
	export let exitLine = 0;

	let currentStepIndex = 0;
	let isMobile = false;
	let scrollProgress = 0;
let previousMediaIndex = -1;
let disableAutoVideoControl = false;
	let containerElement;
	let resizeObserver;
	let viewportWidth = 0;
	let containerWidth = 0;

	const DEFAULT_DESKTOP_STICKY = 'min(0, 0px)';
	const DEFAULT_MOBILE_STICKY = '4vh';

	const DEFAULT_STEP = {
		title: '',
		text: '',
		position: 'right',
		variant: 'default',
		backgroundColor: 'rgba(15, 23, 42, 0.82)',
		overlayColor: 'rgba(0, 0, 0, 0.35)',
		textColor: '#F9FAFB',
		accentColor: '#C4170C',
		borderColor: 'rgba(255, 255, 255, 0.12)',
		padding: '2rem',
		maxWidth: '460px',
		maxWidthMobile: '92%',
		image: '',
		imageMobile: '',
		video: '',
		videoMobile: '',
		backgroundImage: '',
		backgroundImageMobile: '',
		backgroundVideo: '',
		backgroundVideoMobile: '',
		alt: '',
		caption: '',
		slideFromBottom: false,
		travelDistance: 'auto',
		cardVisibility: 'card',
		stickyTop: undefined,
		stickyTopMobile: undefined,
		textConfig: undefined,
		backgroundTransition: 'fade',
		backgroundTransitionDuration: '600ms',
		backgroundTransitionEasing: 'cubic-bezier(0.4, 0, 0.2, 1)'
	};

	const normalizeTravelDistance = (value) => {
		if (value == null) return DEFAULT_STEP.travelDistance;
		if (typeof value === 'string') {
			const trimmed = value.trim();
			return trimmed ? trimmed : DEFAULT_STEP.travelDistance;
		}
		return value;
	};

	const buildStep = (step = {}) => {
		const merged = { ...DEFAULT_STEP, ...step };
		return {
			...merged,
			slideFromBottom: false,
			travelDistance: normalizeTravelDistance(step.travelDistance)
		};
	};

	const sanitizeTransitionKey = (value) => {
		if (typeof value !== 'string') return DEFAULT_STEP.backgroundTransition;
		return value.trim().toLowerCase().replace(/\s+/g, '-');
	};

	const TRANSITION_PRESETS = {
		none: {
			inactive: 'scale(1) translate3d(0, 0, 0)',
			active: 'scale(1) translate3d(0, 0, 0)',
			origin: 'center center',
			transition: 'none'
		},
		fade: {
			inactive: 'scale(1) translate3d(0, 0, 0)',
			active: 'scale(1) translate3d(0, 0, 0)',
			origin: 'center center'
		},
		'zoom-in': {
			inactive: 'scale(1) translate3d(0, 0, 0)',
			active: 'scale(1.08) translate3d(0, 0, 0)',
			origin: 'center center'
		},
		'zoom-out': {
			inactive: 'scale(1.12) translate3d(0, 0, 0)',
			active: 'scale(1) translate3d(0, 0, 0)',
			origin: 'center center'
		},
		'zoom-in-left': {
			inactive: 'scale(1) translate3d(0, 0, 0)',
			active: 'scale(1.08) translate3d(-5%, 0, 0)',
			origin: 'center center'
		},
		'zoom-in-right': {
			inactive: 'scale(1) translate3d(0, 0, 0)',
			active: 'scale(1.08) translate3d(5%, 0, 0)',
			origin: 'center center'
		},
		'zoom-in-up': {
			inactive: 'scale(1) translate3d(0, 0, 0)',
			active: 'scale(1.08) translate3d(0, -5%, 0)',
			origin: 'center center'
		},
		'zoom-in-down': {
			inactive: 'scale(1) translate3d(0, 0, 0)',
			active: 'scale(1.08) translate3d(0, 5%, 0)',
			origin: 'center center'
		}
	};

	const DEFAULT_TRANSITION_PRESET = TRANSITION_PRESETS.fade;
	const DEFAULT_TRANSITION_DURATION = DEFAULT_STEP.backgroundTransitionDuration;
	const DEFAULT_TRANSITION_EASING = DEFAULT_STEP.backgroundTransitionEasing;

	$: normalizedSteps =
		Array.isArray(steps) && steps.length ? steps.map((step) => buildStep(step)) : [buildStep()];
	$: renderedSteps = normalizedSteps;

	$: baseStickyTopDesktop = stickyTopDesktop ?? (hasHeaderBefore ? DEFAULT_DESKTOP_STICKY : '0px');
	$: baseStickyTopMobile = stickyTopMobile ?? (hasHeaderBefore ? DEFAULT_MOBILE_STICKY : '0px');

	$: effectiveThreshold = typeof threshold === 'number' ? threshold : 0;
	const clampRatio = (value, fallback = 0) => {
		if (value === null || value === undefined || value === '') return fallback;
		const numeric = typeof value === 'string' ? parseFloat(value) : value;
		if (Number.isNaN(numeric)) return fallback;
		return Math.min(1, Math.max(0, numeric));
	};

	$: resolvedActivationMode =
		(activationMode || 'exit').toString().toLowerCase() === 'enter' ? 'enter' : 'exit';
	$: resolvedActivationLine = clampRatio(activationLine, 0);
	$: resolvedExitLine = clampRatio(exitLine, 0);

	function getStickyTop(step, mobile) {
		if (!step) return mobile ? baseStickyTopMobile : baseStickyTopDesktop;
		if (mobile) {
			return step.stickyTopMobile ?? step.stickyTop ?? baseStickyTopMobile;
		}
		return step.stickyTop ?? baseStickyTopDesktop;
	}

	const computeIsMobile = () => {
		const effectiveWidth = containerWidth || viewportWidth || 0;
		isMobile = effectiveWidth > 0 ? effectiveWidth <= 768 : false;
	};

	onMount(() => {
		if (typeof window !== 'undefined') {
			disableAutoVideoControl = window.location?.pathname?.includes('/builder');
			if (!disableAutoVideoControl) {
				window.addEventListener('pointerdown', handlePointerDown, true);
				window.addEventListener('pointerup', handlePointerUp, true);
			}
		}

		if (typeof ResizeObserver !== 'undefined') {
			resizeObserver = new ResizeObserver((entries) => {
				if (!entries?.length) return;
				const width = entries[0].contentRect?.width;
				if (width !== undefined) {
					containerWidth = width;
					computeIsMobile();
				}
			});
			if (containerElement) {
				resizeObserver.observe(containerElement);
			}
		} else {
			containerWidth = containerElement ? containerElement.clientWidth || 0 : 0;
		}

		computeIsMobile();

		return () => {
			if (typeof window !== 'undefined' && !disableAutoVideoControl) {
				window.removeEventListener('pointerdown', handlePointerDown, true);
				window.removeEventListener('pointerup', handlePointerUp, true);
			}

			if (resizeObserver) {
				resizeObserver.disconnect();
				resizeObserver = undefined;
			}
		};
	});

	$: if (containerElement) {
		if (resizeObserver) {
			resizeObserver.observe(containerElement);
		} else {
			const width = containerElement.clientWidth || 0;
			if (width !== containerWidth) {
				containerWidth = width;
			}
		}
	}
	$: computeIsMobile();

	$: activeMediaIndex = renderedSteps.length
		? Math.max(0, Math.min(currentStepIndex, renderedSteps.length - 1))
		: 0;

	function resolveMedia(step) {
		if (!step) {
			return { type: null, src: null };
		}

		if (isMobile) {
			if (step.videoMobile) return { type: 'video', src: step.videoMobile };
			if (step.imageMobile) return { type: 'image', src: step.imageMobile };
		}

		if (step.video) return { type: 'video', src: step.video };
		if (step.image) return { type: 'image', src: step.image };

		return { type: null, src: null };
	}

	$: mediaSources = renderedSteps.map((step) => {
		const media = resolveMedia(step);
		const transitionKey = sanitizeTransitionKey(
			step.backgroundTransition || DEFAULT_STEP.backgroundTransition
		);
		const preset = TRANSITION_PRESETS[transitionKey] || DEFAULT_TRANSITION_PRESET;
		const transitionDuration = step.backgroundTransitionDuration || DEFAULT_TRANSITION_DURATION;
		const transitionEasing = step.backgroundTransitionEasing || DEFAULT_TRANSITION_EASING;
		const backgroundMedia = isMobile
			? step.backgroundImageMobile || step.backgroundImage
			: step.backgroundImage || step.backgroundImageMobile;
		const backgroundVideoSource = isMobile
			? step.backgroundVideoMobile || step.backgroundVideo
			: step.backgroundVideo || step.backgroundVideoMobile;
		const styleParts = [
			`background:${step.backgroundColor ?? '#000'}`,
			backgroundMedia ? `background-image:url(${backgroundMedia})` : '',
			backgroundMedia ? 'background-size:cover' : '',
			backgroundMedia ? 'background-position:center center' : '',
			`--media-transform-inactive:${preset.inactive}`,
			`--media-transform-active:${preset.active}`,
			`--media-transform-origin:${preset.origin || 'center center'}`,
			`--media-transition-duration:${transitionDuration}`,
			`--media-transition-easing:${transitionEasing}`,
			preset.transition ? `--media-transition-enabled:${preset.transition}` : ''
		];
		return {
			...media,
			backgroundColor: step.backgroundColor,
			overlayColor: step.overlayColor,
			caption: step.caption,
			alt: step.alt || step.title || '',
			textColor: step.textColor,
			transitionKey: transitionKey || 'fade',
			transitionDuration,
			transitionEasing,
			backgroundMedia,
			backgroundVideoSource,
			style: styleParts.join(';')
		};
	});

	function hasAdvancedConfig(step) {
		return step?.textConfig?.elements && Array.isArray(step.textConfig.elements);
	}

	let stepOffset = 0;

const isFormElement = (element) => {
	if (!element) return false;
	let current = element;
	while (current) {
		if (current instanceof HTMLInputElement) return true;
		if (current instanceof HTMLTextAreaElement) return true;
		if (current instanceof HTMLSelectElement) return true;
		if (current instanceof HTMLButtonElement) return true;
		if (current.getAttribute?.('role') === 'textbox') return true;
		if (current.isContentEditable) return true;
		current = current.parentElement;
	}
	return false;
};

const getStepVideoElement = (index) => {
	if (disableAutoVideoControl) return null;
	if (index == null || index < 0) return null;
	return containerElement?.querySelector(
		`.media-wrapper[data-step-index="${index}"] video[data-step-video]`
	);
};

	let pointerDownOnForm = false;

const isFormElementActive = () => {
	if (typeof document === 'undefined') return false;
	return isFormElement(document.activeElement);
};

const handlePointerDown = (event) => {
	if (disableAutoVideoControl) return;
	pointerDownOnForm = isFormElement(event?.target);
};

const handlePointerUp = () => {
	if (disableAutoVideoControl) return;
	pointerDownOnForm = false;
};

	async function handleMediaIndexChange(previousIndex, nextIndex) {
		if (disableAutoVideoControl) return;
		if (pointerDownOnForm || isFormElementActive()) return;

		if (previousIndex !== undefined && previousIndex !== -1) {
			const previousMedia = mediaSources?.[previousIndex];
			if (previousMedia?.type === 'video') {
				const previousVideo = getStepVideoElement(previousIndex);
				if (previousVideo) {
					try {
						previousVideo.pause?.();
						previousVideo.currentTime = 0;
					} catch {
						// ignore reset errors
					}
				}
			}
		}

		await tick();

		if (nextIndex === undefined || nextIndex === -1) return;
		const nextMedia = mediaSources?.[nextIndex];
		if (nextMedia?.type !== 'video') return;

		const nextVideo = getStepVideoElement(nextIndex);
		if (!nextVideo) return;

		try {
			nextVideo.currentTime = 0;
			if (!pointerDownOnForm && !isFormElementActive()) {
				const playPromise = nextVideo.play?.();
				if (playPromise?.catch) {
					playPromise.catch(() => {});
				}
			}
		} catch {
			// ignore playback errors (autoplay restrictions, etc.)
		}
	}

	$: {
		if (activeMediaIndex !== previousMediaIndex) {
			if (disableAutoVideoControl || pointerDownOnForm || isFormElementActive()) {
				previousMediaIndex = activeMediaIndex;
			} else {
				const prev = previousMediaIndex;
				previousMediaIndex = activeMediaIndex;
				handleMediaIndexChange(prev, activeMediaIndex);
			}
		}
	}
</script>

<svelte:window bind:innerWidth={viewportWidth} />

<div class="scrolly-container" class:fullWidth bind:this={containerElement}>
	<Scroller
		top={0}
		bottom={1}
		threshold={effectiveThreshold}
		activationRatio={resolvedActivationLine}
		exitRatio={resolvedExitLine}
		advanceMode={resolvedActivationMode}
		bind:index={currentStepIndex}
		bind:progress={scrollProgress}
		bind:offset={stepOffset}
	>
		<div slot="background" class="background-container-fixed">
			{#each mediaSources as media, i}
				<div
					class={`media-wrapper transition-${media.transitionKey || 'fade'}`}
					class:active={i === activeMediaIndex}
					style={media.style}
					data-step-index={i}
					data-transition={media.transitionKey}
				>
					{#if media.backgroundVideoSource}
						<video
							class="media-background-video"
							src={media.backgroundVideoSource}
							autoplay
							muted
							loop
							playsinline
						></video>
					{/if}
					{#if media.type === 'image' && media.src}
						<img src={media.src} alt={media.alt} loading="lazy" />
					{:else if media.type === 'video' && media.src}
						{@key `${media.src}-${i}`}
							<video
								src={media.src}
								autoplay
								loop
								muted
								playsinline
								data-step-video
							></video>
					{/if}

					{#if media.overlayColor}
						<div class="media-overlay" style={`background:${media.overlayColor}`}></div>
					{/if}

					{#if media.caption}
						<div class="media-caption" style={`color:${media.textColor || '#f4f4f5'}`}>
							{@html media.caption}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<div slot="foreground" class="steps-foreground">
			<section class="spacer-top"></section>
			{#each renderedSteps as step, i}
				<div class="step-wrapper">
					<!-- 🆕 CONDICIONAL: Usa StepEnhanced se tem textConfig.elements, senão usa Step original -->
					{#if hasAdvancedConfig(step)}
						<StepEnhanced
							{step}
							{isMobile}
							stepIndex={i}
							totalSteps={renderedSteps.length - 1}
							active={i === currentStepIndex}
							defaultStickyTopDesktop={getStickyTop(step, false)}
							defaultStickyTopMobile={getStickyTop(step, true)}
							progress={i === currentStepIndex ? stepOffset : i < currentStepIndex ? 1 : 0}
							slideFromBottom={step.slideFromBottom ?? true}
							travelDistance={step.travelDistance}
						/>
					{:else}
						<!-- Mantém o comportamento original para compatibilidade COM POSITION -->
						<Step
							stepText={`<h3>${step.title || ''}</h3><div>${step.text || ''}</div>`}
							length={renderedSteps.length - 1}
							{i}
							position={step.position || 'right'}
							variant={step.variant || ''}
							active={i === currentStepIndex}
							stickyTop={isMobile ? getStickyTop(step, true) : getStickyTop(step, false)}
							backgroundColor={step.backgroundColor}
							textColor={step.textColor}
							accentColor={step.accentColor}
							borderColor={step.borderColor}
							padding={step.padding}
							maxWidth={step.maxWidth}
							maxWidthMobile={step.maxWidthMobile}
							slideFromBottom={step.slideFromBottom ?? true}
							travelDistance={step.travelDistance}
							progress={i === currentStepIndex ? stepOffset : i < currentStepIndex ? 1 : 0}
							cardVisibility={step.cardVisibility}
						/>
					{/if}
				</div>
			{/each}
			<section class="spacer-bottom"></section>
		</div>
	</Scroller>

	<div class="component-spacer"></div>
</div>

<style>
	.scrolly-container {
		position: relative;
	}

	.fullWidth {
		width: 100vw;
		margin-left: calc(-50vw + 50%);
	}

	.background-container-fixed {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100vh;
		height: 100dvh;
		background: #000;
		z-index: -1;
	}

	.media-wrapper {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		will-change: opacity, transform;
		transform: var(--media-transform-inactive, scale(1) translate3d(0, 0, 0));
		transform-origin: var(--media-transform-origin, center center);
		transition:
			var(
				--media-transition-enabled,
				opacity var(--media-transition-duration, 0.6s) var(--media-transition-easing, ease)
			),
			var(
				--media-transition-enabled,
				transform var(--media-transition-duration, 0.6s) var(--media-transition-easing, ease)
			);
		pointer-events: none;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		align-items: flex-end;
		padding: clamp(1.25rem, 5vw, 3rem);
	}

	.media-wrapper.active {
		opacity: 1;
		z-index: 1;
		transform: var(--media-transform-active, scale(1) translate3d(0, 0, 0));
	}

	.media-wrapper img,
	.media-wrapper video {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		z-index: 1;
	}

	.media-background-video {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		z-index: 0;
	}

	.media-wrapper video {
		background: #000;
	}

	.media-overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 2;
	}

	.media-caption {
		position: relative;
		z-index: 3;
		max-width: min(420px, 38vw);
		font-size: 0.85rem;
		line-height: 1.45;
		background: rgba(15, 23, 42, 0.55);
		color: inherit;
		padding: 0.75rem 1rem;
		border-radius: 10px;
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		box-shadow: 0 10px 35px rgba(15, 15, 15, 0.3);
	}

	.steps-foreground {
		position: relative;
		z-index: 10;
	}

	.spacer-top {
		height: var(--scrolly-spacer-top, 0vh);
	}
	.spacer-bottom {
		height: var(--scrolly-spacer-bottom, 60vh);
	}
	.component-spacer {
		height: var(--scrolly-component-spacer, 0vh);
		background: transparent;
		position: relative;
		z-index: 5;
	}

	:global(.scroller-foreground) {
		pointer-events: none;
	}
	:global(.scroller-foreground section) {
		pointer-events: auto;
	}

	@media (max-width: 768px) {
		.spacer-top {
			height: var(--scrolly-spacer-top-mobile, var(--scrolly-spacer-top, 0vh));
		}
		.spacer-bottom {
			height: var(--scrolly-spacer-bottom-mobile, var(--scrolly-spacer-bottom, 40vh));
		}
		.component-spacer {
			height: var(--scrolly-component-spacer-mobile, var(--scrolly-component-spacer, 15vh));
		}
		.media-wrapper {
			align-items: flex-start;
			padding: 1.25rem;
		}
		.media-caption {
			max-width: min(90%, 28rem);
			font-size: 0.75rem;
			line-height: 1.35;
		}
	}
</style>
