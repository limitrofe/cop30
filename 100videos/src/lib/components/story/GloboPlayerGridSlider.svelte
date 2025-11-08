<!-- src/lib/components/story/GloboPlayerGridSlider.svelte -->
<script>
	import { onMount } from 'svelte';
	import GloboPlayer from './GloboPlayer.svelte';

	export let slides = [];
	export let showArrows = true;
	export let showDots = true;
	export let enableDrag = true;
	export let gapDesktop = '1.5rem';
	export let gapMobile = '1rem';
	export let paddingDesktop = '1.5rem 0';
	export let paddingMobile = '1rem 0';
	export let backgroundColor = '';
	export let borderRadius = '0';
	export let tabletBreakpoint = '1024px';
	export let mobileBreakpoint = '768px';

	const MAX_SPAN = 12;

	const normalizeAspect = (value, fallback) => {
		const raw = typeof value === 'string' ? value.trim() : '';
		if (!raw) return fallback;
		const compact = raw.replace(/\s+/g, '').toLowerCase();
		if (compact === '16/9') return '16 / 9';
		if (compact === '9/16') return '9 / 16';
		return fallback;
	};

	const clampSpan = (value, fallback = 12) => {
		const parsed = Number(value);
		if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
		return Math.min(Math.max(Math.round(parsed), 1), MAX_SPAN);
	};

	const parseSpan = (raw) => {
		const parsed = Number(raw);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
	};

	const cloneVideo = (video) => {
		const { __defaultSpanDesktop, __defaultSpanTablet, __defaultSpanMobile, ...rest } = video;
		return rest;
	};

	function assignAutomaticSpans(videos) {
		const count = videos.length;
		if (count <= 1) {
			return videos.map(cloneVideo);
		}

		const allDesktopDefault = videos.every((video) => video.__defaultSpanDesktop);
		const allTabletDefault = videos.every((video) => video.__defaultSpanTablet);
		const allMobileDefault = videos.every((video) => video.__defaultSpanMobile);

		const baseDesktop = Math.max(1, Math.floor(MAX_SPAN / Math.min(count, MAX_SPAN)));
		const baseTablet =
			count === 1
				? MAX_SPAN
				: count === 2
					? 6
					: Math.max(3, Math.floor(MAX_SPAN / Math.min(count, 3)));

		return videos.map((video) => {
			const next = { ...video };
			if (allDesktopDefault) {
				next.spanDesktop = clampSpan(baseDesktop, MAX_SPAN);
			}
			if (allTabletDefault) {
				next.spanTablet = clampSpan(baseTablet, MAX_SPAN);
			}
			if (allMobileDefault) {
				next.spanMobile = MAX_SPAN;
			}
			return cloneVideo(next);
		});
	}

	const sanitizeId = (value) => (typeof value === 'string' ? value.trim() : '');
	const deepClone = (value) => {
		if (!value || typeof value !== 'object') return {};
		if (typeof structuredClone === 'function') {
			try {
				return structuredClone(value);
			} catch (error) {
				console.warn('GloboPlayerGridSlider: structuredClone falhou, fallback para JSON.', error);
			}
		}
		try {
			return JSON.parse(JSON.stringify(value));
		} catch (error) {
			console.warn('GloboPlayerGridSlider: JSON clone falhou, fallback para spread.', error);
			return Array.isArray(value) ? [...value] : { ...value };
		}
	};

	function normalizeVideo(raw, videoIndex, slideIndex) {
		if (!raw || typeof raw !== 'object') return null;
		const copy = deepClone(raw);
		const videoIdDesktop = sanitizeId(copy.videoIdDesktop);
		const videoIdMobile = sanitizeId(copy.videoIdMobile);
		const fallbackId = sanitizeId(copy.videoId);
		if (!videoIdDesktop && !videoIdMobile && !fallbackId) return null;

		const aspect = normalizeAspect(copy.aspectRatio, '16 / 9');
		const aspectMobile = normalizeAspect(copy.aspectRatioMobile, aspect);

		const rawSpan = parseSpan(copy.span);
		const rawSpanDesktop = parseSpan(copy.spanDesktop);
		const rawSpanTablet = parseSpan(copy.spanTablet);
		const rawSpanMobile = parseSpan(copy.spanMobile);

		const spanDesktop = clampSpan(rawSpanDesktop ?? rawSpan ?? MAX_SPAN, MAX_SPAN);
		const spanTablet = clampSpan(rawSpanTablet ?? rawSpan ?? spanDesktop, MAX_SPAN);
		const spanMobile = clampSpan(rawSpanMobile ?? spanTablet ?? MAX_SPAN, MAX_SPAN);

		const containerBackgroundColor =
			typeof copy.backgroundColor === 'string'
				? copy.backgroundColor
				: typeof copy.containerBackgroundColor === 'string'
					? copy.containerBackgroundColor
					: 'transparent';

		const identifier =
			copy.__internalId ||
			copy.id ||
			copy.uid ||
			`${slideIndex}-${videoIndex}-${videoIdDesktop || videoIdMobile || fallbackId || 'video'}`;

		return {
			id: identifier,
			title: typeof copy.title === 'string' ? copy.title.trim() : '',
			caption: typeof copy.caption === 'string' ? copy.caption : '',
			credit: typeof copy.credit === 'string' ? copy.credit : '',
			autoPlay: Boolean(copy.autoPlay ?? copy.autoplay),
			startMuted: copy.startMuted !== false,
			showCaption: copy.showCaption !== false,
			videoIdDesktop,
			videoIdMobile,
			videoId: fallbackId,
			aspectRatio: aspect,
			aspectRatioMobile: aspectMobile,
			containerBackgroundColor,
			spanDesktop,
			spanTablet,
			spanMobile,
			__defaultSpanDesktop: rawSpanDesktop === null && rawSpan === null,
			__defaultSpanTablet: rawSpanTablet === null && rawSpan === null,
			__defaultSpanMobile: rawSpanMobile === null
		};
	}

	function normalizeSlide(raw, slideIndex) {
		if (!raw || typeof raw !== 'object') return { title: '', description: '', videos: [] };
		const copy = deepClone(raw);
		const list = Array.isArray(copy.videos)
			? copy.videos
			: Array.isArray(copy.items)
				? copy.items
				: [];

		const normalizedVideos = list
			.map((item, videoIndex) => normalizeVideo(item, videoIndex, slideIndex))
			.filter(Boolean);

		const finalVideos = assignAutomaticSpans(normalizedVideos);

		return {
			title: typeof copy.title === 'string' ? copy.title.trim() : '',
			description: typeof copy.description === 'string' ? copy.description.trim() : '',
			backgroundColor:
				typeof copy.backgroundColor === 'string'
					? copy.backgroundColor
					: typeof copy.containerBackgroundColor === 'string'
						? copy.containerBackgroundColor
						: null,
			gapDesktop: typeof copy.gapDesktop === 'string' ? copy.gapDesktop : null,
			gapMobile: typeof copy.gapMobile === 'string' ? copy.gapMobile : null,
			paddingDesktop: typeof copy.paddingDesktop === 'string' ? copy.paddingDesktop : null,
			paddingMobile: typeof copy.paddingMobile === 'string' ? copy.paddingMobile : null,
			videos: finalVideos
		};
	}

	$: safeSlides = Array.isArray(slides)
		? slides
				.map((slide, index) => normalizeSlide(slide, index))
				.filter((slide) => slide.videos.length > 0)
		: [];

	let activeIndex = 0;
	let viewport;
	let pointerId = null;
	let pointerDown = false;
	let dragStartX = 0;
	let scrollStartX = 0;
	let dragged = false;
	let reduceMotion = false;
	let scrollRaf = null;

	$: slideCount = safeSlides.length;
	$: activeIndex = slideCount === 0 ? 0 : Math.min(activeIndex, slideCount - 1);
	$: disablePrev = activeIndex <= 0;
	$: disableNext = activeIndex >= slideCount - 1;

	onMount(() => {
		if (typeof window === 'undefined') return undefined;
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		const updatePreference = () => {
			reduceMotion = mediaQuery.matches;
		};
		updatePreference();
		mediaQuery.addEventListener('change', updatePreference);
		return () => {
			mediaQuery.removeEventListener('change', updatePreference);
			if (scrollRaf) {
				cancelAnimationFrame(scrollRaf);
			}
		};
	});

	function handleScroll() {
		if (!viewport || slideCount === 0) return;
		if (scrollRaf) cancelAnimationFrame(scrollRaf);
		scrollRaf = requestAnimationFrame(() => {
			const width = viewport.offsetWidth || 1;
			const index = Math.round(viewport.scrollLeft / width);
			const clamped = Math.min(Math.max(index, 0), slideCount - 1);
			if (clamped !== activeIndex) {
				activeIndex = clamped;
			}
		});
	}

	function goTo(index) {
		if (!viewport || slideCount === 0) return;
		const width = viewport.offsetWidth || 0;
		const target = Math.min(Math.max(index, 0), slideCount - 1);
		viewport.scrollTo({
			left: width * target,
			behavior: reduceMotion ? 'auto' : 'smooth'
		});
	}

	function next() {
		if (disableNext) return;
		goTo(activeIndex + 1);
	}

	function prev() {
		if (disablePrev) return;
		goTo(activeIndex - 1);
	}

	function onPointerDown(event) {
		if (!enableDrag || !viewport) return;
		pointerDown = true;
		pointerId = event.pointerId;
		dragStartX = event.clientX;
		scrollStartX = viewport.scrollLeft;
		dragged = false;
		viewport.classList.add('is-dragging');
		try {
			viewport.setPointerCapture(pointerId);
		} catch (error) {
			console.warn('GloboPlayerGridSlider: falha ao capturar pointer.', error);
		}
	}

	function onPointerMove(event) {
		if (!pointerDown || !viewport) return;
		const deltaX = event.clientX - dragStartX;
		if (!dragged && Math.abs(deltaX) > 4) {
			dragged = true;
		}
		viewport.scrollLeft = scrollStartX - deltaX;
	}

	function endPointer(event) {
		if (!pointerDown || !viewport) return;
		pointerDown = false;
		viewport.classList.remove('is-dragging');
		if (pointerId !== null) {
			try {
				viewport.releasePointerCapture(pointerId);
			} catch (error) {
				console.warn('GloboPlayerGridSlider: falha ao liberar pointer.', error);
			}
		}
		pointerId = null;
		if (dragged) {
			event.preventDefault();
			dragged = false;
		}
		handleScroll();
	}
</script>

<svelte:window on:resize={handleScroll} />

<div
	class="grid-slider"
	style={`--slider-background:${backgroundColor || 'transparent'};--border-radius:${borderRadius};--tablet-breakpoint:${tabletBreakpoint};--mobile-breakpoint:${mobileBreakpoint};`}
>
	{#if slideCount === 0}
		<div class="grid-slider__empty">
			<p>Configure ao menos um slide com vídeos do GloboPlay.</p>
		</div>
	{:else}
		<div
			class={`grid-slider__viewport ${enableDrag ? 'is-draggable' : ''}`.trim()}
			bind:this={viewport}
			on:scroll={handleScroll}
			on:pointerdown={onPointerDown}
			on:pointermove={onPointerMove}
			on:pointerup={endPointer}
			on:pointerleave={endPointer}
			on:pointercancel={endPointer}
		>
			<div class="grid-slider__track">
				{#each safeSlides as slide, slideIndex}
					{@const slideBackground = slide.backgroundColor ?? backgroundColor ?? 'transparent'}
					{@const slideGapDesktop = slide.gapDesktop ?? gapDesktop}
					{@const slideGapMobile = slide.gapMobile ?? gapMobile}
					{@const slidePaddingDesktop = slide.paddingDesktop ?? paddingDesktop}
					{@const slidePaddingMobile = slide.paddingMobile ?? paddingMobile}
					<section
						class="grid-slider__slide"
						style={`--slide-background:${slideBackground};--slide-gap-desktop:${slideGapDesktop};--slide-gap-mobile:${slideGapMobile};--slide-padding-desktop:${slidePaddingDesktop};--slide-padding-mobile:${slidePaddingMobile};`}
						aria-roledescription="slide"
						aria-label={`Slide ${slideIndex + 1} de ${slideCount}`}
					>
						{#if slide.title || slide.description}
							<header class="grid-slider__slide-header">
								{#if slide.title}
									<h3>{slide.title}</h3>
								{/if}
								{#if slide.description}
									<p>{slide.description}</p>
								{/if}
							</header>
						{/if}
						<div class="grid-slider__grid">
							{#each slide.videos as video, videoIndex (video.id || `${slideIndex}-${videoIndex}`)}
								<article
									class="grid-slider__item"
									style={`--span-desktop:${video.spanDesktop};--span-tablet:${video.spanTablet};--span-mobile:${video.spanMobile};`}
								>
									{#if video.title}
										<h4 class="grid-slider__video-title">{video.title}</h4>
									{/if}
									<div
										class="grid-slider__player"
										style={`--player-background:${video.containerBackgroundColor};`}
									>
										<GloboPlayer
											videoId={video.videoId}
											videoIdDesktop={video.videoIdDesktop}
											videoIdMobile={video.videoIdMobile}
											containerBackgroundColor={video.containerBackgroundColor}
											aspectRatio={video.aspectRatio}
											aspectRatioMobile={video.aspectRatioMobile}
											autoPlay={video.autoPlay}
											startMuted={video.startMuted}
											showCaption={video.showCaption}
											caption={video.caption}
											credit={video.credit}
											widthDesktop="100%"
											widthMobile="100%"
										/>
									</div>
								</article>
							{/each}
						</div>
					</section>
				{/each}
			</div>
		</div>

		{#if showArrows && slideCount > 1}
			<div class="grid-slider__arrows">
				<button
					type="button"
					class="grid-slider__arrow"
					on:click={prev}
					disabled={disablePrev}
					aria-label="Slide anterior"
				>
					<span aria-hidden="true">‹</span>
				</button>
				<button
					type="button"
					class="grid-slider__arrow"
					on:click={next}
					disabled={disableNext}
					aria-label="Próximo slide"
				>
					<span aria-hidden="true">›</span>
				</button>
			</div>
		{/if}

		{#if showDots && slideCount > 1}
			<div class="grid-slider__dots">
				{#each safeSlides as _, index}
					<button
						type="button"
						class={index === activeIndex ? 'is-active' : ''}
						on:click={() => goTo(index)}
						aria-label={`Ir para o slide ${index + 1}`}
						aria-pressed={index === activeIndex}
					></button>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.grid-slider {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		width: 100%;
		background: var(--slider-background, transparent);
		border-radius: var(--border-radius, 0);
	}

	.grid-slider__viewport {
		overflow-x: auto;
		overflow-y: hidden;
		scroll-snap-type: x mandatory;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
		cursor: grab;
		border-radius: inherit;
	}

	.grid-slider__viewport::-webkit-scrollbar {
		display: none;
	}

	.grid-slider__viewport.is-draggable.is-dragging {
		scroll-snap-type: none;
		cursor: grabbing;
	}

	.grid-slider__viewport.is-dragging * {
		pointer-events: none;
	}

	.grid-slider__track {
		display: flex;
		width: 100%;
	}

	.grid-slider__slide {
		flex: 0 0 100%;
		scroll-snap-align: start;
		box-sizing: border-box;
		padding: var(--slide-padding-desktop, 1.5rem 0);
		background: var(--slide-background, transparent);
		border-radius: inherit;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.grid-slider__slide-header h3 {
		margin: 0;
		font-size: clamp(1.1rem, 2.5vw, 1.6rem);
	}

	.grid-slider__slide-header p {
		margin: 0.35rem 0 0;
		color: rgba(15, 23, 42, 0.75);
		font-size: 0.95rem;
		line-height: 1.5;
	}

	.grid-slider__grid {
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		gap: var(--slide-gap-desktop, 1.5rem);
		align-items: stretch;
	}

	.grid-slider__item {
		grid-column: span var(--span-desktop, 12);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.grid-slider__video-title {
		margin: 0;
		font-size: clamp(1rem, 2vw, 1.25rem);
		font-weight: 600;
		color: #0f172a;
	}

	.grid-slider__player {
		position: relative;
		width: 100%;
		background: var(--player-background, transparent);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
	}

	.grid-slider__player :global(.globoplayer-container) {
		border-radius: inherit;
	}

	.grid-slider__arrows {
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		pointer-events: none;
		transform: translateY(-50%);
		padding: 0 0.5rem;
	}

	.grid-slider__arrow {
		pointer-events: auto;
		width: 44px;
		height: 44px;
		border-radius: 999px;
		border: none;
		background: rgba(15, 23, 42, 0.65);
		color: #fff;
		font-size: 1.75rem;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.grid-slider__arrow:hover:not(:disabled) {
		background: rgba(15, 23, 42, 0.8);
	}

	.grid-slider__arrow:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.grid-slider__dots {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
	}

	.grid-slider__dots button {
		width: 10px;
		height: 10px;
		border-radius: 999px;
		border: none;
		background: rgba(15, 23, 42, 0.25);
		cursor: pointer;
		transition:
			transform 0.2s ease,
			background 0.2s ease;
	}

	.grid-slider__dots button.is-active {
		background: rgba(15, 23, 42, 0.85);
		transform: scale(1.15);
	}

	.grid-slider__dots button:focus-visible {
		outline: 2px solid #2563eb;
		outline-offset: 2px;
	}

	.grid-slider__empty {
		padding: 2rem;
		border: 1px dashed rgba(100, 116, 139, 0.45);
		border-radius: 12px;
		text-align: center;
		color: #475569;
		font-size: 0.95rem;
	}

	@media (max-width: var(--tablet-breakpoint, 1024px)) {
		.grid-slider__slide {
			padding: var(--slide-padding-mobile, 1rem 0);
		}

		.grid-slider__grid {
			gap: var(--slide-gap-mobile, 1rem);
		}

		.grid-slider__item {
			grid-column: span var(--span-tablet, 12);
		}
	}

	@media (max-width: var(--mobile-breakpoint, 768px)) {
		.grid-slider__item {
			grid-column: span var(--span-mobile, 12);
		}

		.grid-slider__player {
			box-shadow: 0 8px 18px rgba(15, 23, 42, 0.16);
		}

		.grid-slider__arrows {
			display: none;
		}
	}
</style>
