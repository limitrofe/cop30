<!-- src/lib/components/story/Carousel.svelte -->
<script>
	import { onMount, tick } from 'svelte';
	import GloboPlayer from './GloboPlayer.svelte';

	export let items = [];
	export let autoplay = false;
	export let interval = 5000;
	export let showDots = true;
	export let showArrows = true;
	export let audioButtonBackground = 'rgba(0, 0, 0, 0.7)';
	export let audioButtonHoverBackground = 'rgba(0, 0, 0, 0.85)';
	export let audioButtonTextColor = '#fff';

	let currentIndex = 0;
	let carouselElement;
	let autoplayInterval;
	const videoElements = new Map();
	const globoPlayerControls = new Map();
	let audioEnabledStates = [];
	let itemsSignature = '';
	let isInViewport = false;
	let viewportObserver;

	$: {
		const currentStates = audioEnabledStates;
		const nextStates = items.map((_, index) => currentStates[index] ?? false);
		const hasChanged =
			nextStates.length !== currentStates.length ||
			nextStates.some((state, index) => state !== currentStates[index]);

		if (hasChanged) {
			audioEnabledStates = nextStates;
		}
	}

	onMount(() => {
		if (typeof IntersectionObserver !== 'undefined') {
			viewportObserver = new IntersectionObserver(
				(entries) => {
					const entry = entries[0];
					if (!entry) return;

					if (entry.isIntersecting) {
						isInViewport = true;
						tick().then(() => {
							if (!isInViewport) return;
							playActiveMedia(currentIndex);
							startAutoplay();
						});
					} else {
						isInViewport = false;
						stopAutoplay();
						pauseAllMedia();
					}
				},
				{ threshold: 0.25 }
			);

			if (carouselElement) {
				viewportObserver.observe(carouselElement);
			}
		} else {
			isInViewport = true;
			playActiveMedia(currentIndex);
			startAutoplay();
		}

		return () => {
			if (autoplayInterval) {
				clearInterval(autoplayInterval);
			}

			viewportObserver?.disconnect?.();
			viewportObserver = null;
			isInViewport = false;
			pauseAllMedia();
			videoElements.clear();
			globoPlayerControls.clear();
			audioEnabledStates = [];
		};
	});

	function startAutoplay() {
		if (!autoplay) return;
		if (!isInViewport) return;
		if (!items || items.length <= 1) return;
		if (autoplayInterval) return;

		autoplayInterval = setInterval(() => {
			next();
		}, interval);
	}

	function stopAutoplay() {
		if (autoplayInterval) {
			clearInterval(autoplayInterval);
			autoplayInterval = null;
		}
	}

	function next() {
		if (!items || items.length === 0) return;
		currentIndex = (currentIndex + 1) % items.length;
	}

	function prev() {
		if (!items || items.length === 0) return;
		currentIndex = (currentIndex - 1 + items.length) % items.length;
	}

	function goTo(index) {
		if (!items || items.length === 0) return;
		if (index < 0 || index >= items.length) return;
		currentIndex = index;
	}

	function updateAudioState(index, enabled) {
		const nextStates = [...audioEnabledStates];
		nextStates[index] = enabled;
		audioEnabledStates = nextStates;
	}

	function normalizeItemsSignature(list) {
		if (!list || !Array.isArray(list)) return '';
		return list
			.map((item, index) => {
				if (item && typeof item === 'object') {
					if (item.type === 'globo-player') {
						return `globo:${item.videoIdDesktop || ''}:${item.videoIdMobile || ''}:${
							item.videoId || ''
						}:${item.hasAds ? 'ads' : 'noads'}:${item.title || ''}`;
					}
					if (item.type === 'video') {
						return `video:${item.src || ''}:${item.srcMobile || ''}:${item.title || ''}`;
					}
					if (item.type === 'image') {
						return `image:${item.src || ''}:${item.srcMobile || ''}:${item.title || ''}`;
					}
					if (item.type === 'content') {
						return `content:${(item.content || '').slice(0, 32)}`;
					}
					return item.id || item.src || item.srcMobile || index;
				}
				return `${index}:${item}`;
			})
			.join('|');
	}

	function ensureActiveMediaPlayback(index) {
		if (index !== currentIndex) return;
		if (!isInViewport) return;

		tick().then(() => {
			if (!isInViewport) return;
			requestAnimationFrame(() => {
				if (!isInViewport) return;
				if (index === currentIndex) {
					playActiveMedia(index);
				}
			});
		});
	}

	function registerVideo(node, params) {
		if (!params) return;

		let { index } = params;
		videoElements.set(index, node);
		updateAudioState(index, false);
		ensureActiveMediaPlayback(index);

		return {
			update(newParams) {
				if (!newParams) return;
				const { index: newIndex } = newParams;
				if (newIndex === index) return;
				const wasEnabled = audioEnabledStates[index] ?? false;
				videoElements.delete(index);
				index = newIndex;
				videoElements.set(index, node);
				updateAudioState(index, wasEnabled);
				ensureActiveMediaPlayback(index);
			},
			destroy() {
				node.pause?.();
				node.currentTime = 0;
				videoElements.delete(index);
				updateAudioState(index, false);
			}
		};
	}

	function registerGloboPlayer(index, detail) {
		const controls = detail?.controls;
		const reason = detail?.reason;
		if (!controls) return;
		globoPlayerControls.set(index, controls);
		ensureActiveMediaPlayback(index);
	}

	function unregisterGloboPlayer(index) {
		const controls = globoPlayerControls.get(index);
		controls?.pause?.();
		controls?.setMuted?.(true);
		globoPlayerControls.delete(index);
		updateAudioState(index, false);
	}

	function pauseAllMedia() {
		videoElements.forEach((video, index) => {
			if (!video) return;
			video.pause();
			video.currentTime = 0;
			video.muted = true;
			video.autoplay = false;
			video.removeAttribute('autoplay');
			video.setAttribute('muted', '');
			updateAudioState(index, false);
		});

		globoPlayerControls.forEach((controls, index) => {
			if (!controls) return;
			controls.pause?.();
			controls.setMuted?.(true);
			updateAudioState(index, false);
		});
	}

	function pauseInactiveMedia(activeSlide) {
		videoElements.forEach((video, index) => {
			if (index !== activeSlide && video) {
				video.pause();
				video.currentTime = 0;
				video.muted = true;
				video.autoplay = false;
				video.removeAttribute('autoplay');
				video.setAttribute('muted', '');
				updateAudioState(index, false);
			}
		});

		globoPlayerControls.forEach((controls, index) => {
			if (index !== activeSlide && controls) {
				controls.pause?.();
				controls.setMuted?.(true);
				updateAudioState(index, false);
			}
		});
	}

	function playActiveMedia(activeSlide) {
		if (!isInViewport) return;
		const slide = items?.[activeSlide];
		if (!slide) return;

		if (slide.type === 'video') {
			const video = videoElements.get(activeSlide);
			if (!video) return;

			video.muted = true;
			video.autoplay = true;
			video.setAttribute('muted', '');
			video.setAttribute('autoplay', '');
			video.currentTime = 0;
			video.play?.().catch(() => {
				// Ignora erros de autoplay (ex.: bloqueio do navegador)
			});
			updateAudioState(activeSlide, false);
		} else if (slide.type === 'globo-player') {
			const controls = globoPlayerControls.get(activeSlide);
			if (!controls) return;

			controls.setMuted?.(true);
			controls.play?.();
			updateAudioState(activeSlide, false);
		}
	}

	function toggleAudio(index) {
		if (audioEnabledStates[index]) return;
		const item = items?.[index];
		if (!item) return;

		if (item.type === 'video') {
			const video = videoElements.get(index);
			if (!video) return;

			video.muted = false;
			video.removeAttribute('muted');
			video.volume = 1;
			video.play?.().catch(() => {});
			updateAudioState(index, true);
		} else if (item.type === 'globo-player') {
			const controls = globoPlayerControls.get(index);
			if (!controls) return;

			const mutedResult = controls.setMuted?.(false);
			if (mutedResult === false) return;
			controls.play?.();
			updateAudioState(index, true);
		}
	}

	$: audioButtonStyle = [
		audioButtonBackground ? `--carousel-audio-button-bg:${audioButtonBackground}` : '',
		audioButtonHoverBackground
			? `--carousel-audio-button-bg-hover:${audioButtonHoverBackground}`
			: '',
		audioButtonTextColor ? `--carousel-audio-button-color:${audioButtonTextColor}` : ''
	]
		.filter(Boolean)
		.join(';');

	$: {
		pauseInactiveMedia(currentIndex);
		playActiveMedia(currentIndex);
	}

	$: {
		const nextSignature = normalizeItemsSignature(items);
		if (nextSignature !== itemsSignature) {
			itemsSignature = nextSignature;
			currentIndex = 0;
		}

		if (items && currentIndex >= items.length) {
			currentIndex = 0;
		}
	}

	$: if (items) {
		const total = items.length;
		const toRemove = [];
		globoPlayerControls.forEach((_, index) => {
			if (index >= total || items[index]?.type !== 'globo-player') {
				toRemove.push(index);
			}
		});
		if (toRemove.length) {
			toRemove.forEach((idx) => unregisterGloboPlayer(idx));
		}
	}

	$: {
		if (!autoplay) {
			stopAutoplay();
		} else if (isInViewport) {
			startAutoplay();
		}
	}
</script>

<div
	class="carousel"
	role="region"
	aria-roledescription="carousel"
	aria-label="Galeria de slides"
	bind:this={carouselElement}
	on:mouseenter={stopAutoplay}
	on:mouseleave={() => autoplay && startAutoplay()}
>
	<div class="carousel-track" style="transform: translateX(-{currentIndex * 100}%)">
		{#each items as item, index}
			<div class="carousel-slide">
				{#if item.title}
					<header class="carousel-title">
						<h3>{item.title}</h3>
					</header>
				{/if}

				<div class="carousel-media">
					{#if item.type === 'image'}
						<picture>
							{#if item.srcMobile}
								<source srcset={item.srcMobile} media="(max-width: 768px)" />
							{/if}
							<img src={item.src} alt={item.alt || ''} loading="lazy" />
						</picture>
					{:else if item.type === 'video'}
						<div class="carousel-video-wrapper">
							<video controls playsinline use:registerVideo={{ index }}>
								{#if item.srcMobile}
									<source src={item.srcMobile} type="video/mp4" media="(max-width: 768px)" />
								{/if}
								{#if item.src}
									<source src={item.src} type="video/mp4" />
								{/if}
							</video>
							{#if !(audioEnabledStates[index] ?? false)}
								<button
									type="button"
									class="carousel-audio-button"
									on:click={() => toggleAudio(index)}
									aria-label="Ativar áudio do vídeo"
									style={audioButtonStyle}
								>
									Ativar áudio
								</button>
							{/if}
						</div>
					{:else if item.type === 'globo-player'}
						<div class="carousel-video-wrapper carousel-video-wrapper--globo">
							<GloboPlayer
								videoId={item.videoId || ''}
								videoIdDesktop={item.videoIdDesktop || ''}
								videoIdMobile={item.videoIdMobile || ''}
								autoPlay={item.autoPlay ?? true}
								autoplay={item.autoPlay ?? true}
								startMuted={item.startMuted ?? true}
								skipDFP={item.hasAds ? false : true}
								showCaption={false}
								containerBackgroundColor="transparent"
								widthDesktop="100%"
								widthMobile="100%"
								on:controls={(event) => registerGloboPlayer(index, event.detail)}
								on:destroyed={() => unregisterGloboPlayer(index)}
							/>
							{#if !(audioEnabledStates[index] ?? false)}
								<button
									type="button"
									class="carousel-audio-button"
									on:click={() => toggleAudio(index)}
									aria-label="Ativar áudio do vídeo"
									style={audioButtonStyle}
								>
									Ativar áudio
								</button>
							{/if}
						</div>
					{:else if item.type === 'content'}
						<div class="carousel-content">
							{@html item.content}
						</div>
					{/if}
				</div>

				{#if item.caption}
					<div class="carousel-caption">
						<p>{item.caption}</p>
						{#if item.credit}
							<small>{item.credit}</small>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>

	{#if showArrows && items.length > 1}
		<button
			type="button"
			class="carousel-arrow carousel-prev"
			on:click={prev}
			aria-label="Slide anterior"
		>
			<span class="sr-only">Anterior</span>
			<svg class="carousel-arrow__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
				<path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
			</svg>
		</button>
		<button
			type="button"
			class="carousel-arrow carousel-next"
			on:click={next}
			aria-label="Próximo slide"
		>
			<span class="sr-only">Próximo</span>
			<svg class="carousel-arrow__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
				<path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z" />
			</svg>
		</button>
	{/if}

	{#if showDots && items.length > 1}
		<div class="carousel-dots">
			{#each items as _, index}
				<button
					class="carousel-dot"
					class:active={currentIndex === index}
					on:click={() => goTo(index)}
					aria-label={`Ir para slide ${index + 1}`}
				></button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.carousel {
		position: relative;
		width: 100%;
		overflow: hidden;
		border-radius: 12px;
		background: var(--color-background);
	}

	.carousel-track {
		display: flex;
		transition: transform 0.5s ease;
		will-change: transform;
	}

	.carousel-slide {
		min-width: 100%;
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.carousel-title {
		padding: 1rem 1.5rem 0;
	}

	.carousel-title h3 {
		margin: 0;
		font-size: var(--font-size-60, 1.125rem);
		font-weight: 600;
		color: var(--carousel-title-color, var(--color-foreground, #0f172a));
	}

	.carousel-media {
		position: relative;
		display: flex;
		align-items: stretch;
		flex: 1 1 auto;
	}

	.carousel-media picture,
	.carousel-media .carousel-video-wrapper,
	.carousel-media .carousel-content {
		width: 100%;
	}

	.carousel-slide img,
	.carousel-slide video {
		width: 100%;
		height: auto;
		display: block;
	}

	.carousel-video-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.carousel-audio-button {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: var(--carousel-audio-button-bg, rgba(0, 0, 0, 0.7));
		color: var(--carousel-audio-button-color, #fff);
		border: none;
		border-radius: 999px;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: background 0.2s ease;
		z-index: 2;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.carousel-audio-button:hover,
	.carousel-audio-button:focus-visible {
		background: var(
			--carousel-audio-button-bg-hover,
			var(--carousel-audio-button-bg, rgba(0, 0, 0, 0.85))
		);
		outline: none;
	}

	.carousel-audio-button:focus-visible {
		box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.35);
	}

	.carousel-content {
		padding: 2rem;
		text-align: center;
		min-height: 300px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.carousel-caption {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
		color: white;
		padding: 2rem 1rem 1rem;
	}

	.carousel-caption p {
		margin: 0 0 0.5rem 0;
		font-size: var(--font-size-50);
	}

	.carousel-caption small {
		opacity: 0.8;
		font-size: var(--font-size-40);
	}

	.carousel-arrow {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(255, 255, 255, 0.9);
		border: none;
		border-radius: 50%;
		width: 50px;
		height: 50px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
		transition: all 0.3s ease;
		z-index: 10;
		color: var(--carousel-arrow-icon-color, #0f172a);
	}

	.carousel-arrow:hover {
		background: white;
		transform: translateY(-50%) scale(1.1);
	}

	.carousel-arrow__icon {
		width: 26px;
		height: 26px;
		fill: currentColor;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
	}

	.carousel-prev {
		left: 1rem;
	}

	.carousel-next {
		right: 1rem;
	}

	.carousel-dots {
		position: absolute;
		bottom: 1rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 0.5rem;
		z-index: 10;
	}

	.carousel-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: none;
		background: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.carousel-dot.active {
		background: white;
		transform: scale(1.2);
	}

	@media (max-width: 768px) {
		.carousel-arrow {
			width: 40px;
			height: 40px;
			font-size: 1.2rem;
		}

		.carousel-prev {
			left: 0.5rem;
		}

		.carousel-next {
			right: 0.5rem;
		}
	}
</style>
