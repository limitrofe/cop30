<!-- src/lib/components/story/VideoPlayer.svelte -->
<script>
	import { onMount } from 'svelte';

	// Props principais
	export let src = '';
	export let srcMobile = '';
	export let poster = '';
	export let posterMobile = '';
	export let caption = '';
	export let credit = '';
	export let fullWidth = false;
	export let autoplay = true;
	export let controls = false;
	export let loop = false;
	export let showCaption = true;
	export let alignment = 'center';
	export let customWidthDesktop = '800px';
	export let customWidthMobile = '350px';
	export let aspectRatioDesktop = '16/9';
	export let aspectRatioMobile = '9/16';
	export let backgroundColor = '#1a1a1a';
	export let fullWidthBackground = false;

	let videoElement;
	let isPlaying = false;
	let currentTime = 0;
	let duration = 0;
	let mounted = false;
	let userHasInteracted = false;
	let isIOS = false;
	let isMobile = false;

	onMount(() => {
		mounted = true;

		// Detectar iOS e mobile
		const userAgent = navigator.userAgent;
		isIOS = /iPad|iPhone|iPod/.test(userAgent);
		isMobile =
			window.innerWidth <= 768 ||
			/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

		// Listener para primeira interação (crucial para iOS)
		const handleFirstInteraction = () => {
			userHasInteracted = true;
			document.removeEventListener('touchstart', handleFirstInteraction);
			document.removeEventListener('click', handleFirstInteraction);

			// Após interação, tenta autoplay se necessário
			if (autoplay && videoElement && !isPlaying) {
				setTimeout(() => attemptAutoplay(), 100);
			}
		};

		document.addEventListener('touchstart', handleFirstInteraction, { passive: true });
		document.addEventListener('click', handleFirstInteraction);

		// Listener para mudanças de tela
		const handleResize = () => {
			isMobile = window.innerWidth <= 768;
		};
		window.addEventListener('resize', handleResize);

		return () => {
			document.removeEventListener('touchstart', handleFirstInteraction);
			document.removeEventListener('click', handleFirstInteraction);
			window.removeEventListener('resize', handleResize);
		};
	});

	// Autoplay otimizado para iOS
	async function attemptAutoplay() {
		if (!videoElement || !mounted) return;

		try {
			// Configurações obrigatórias para iOS
			videoElement.muted = true;
			videoElement.playsInline = true;
			videoElement.defaultMuted = true;

			// Aguarda vídeo estar pronto
			if (videoElement.readyState < 3) {
				await new Promise((resolve) => {
					const handleReady = () => {
						videoElement.removeEventListener('canplay', handleReady);
						resolve();
					};
					videoElement.addEventListener('canplay', handleReady);
				});
			}

			// Tenta play
			const playPromise = videoElement.play();
			if (playPromise !== undefined) {
				await playPromise;
				isPlaying = true;
			}
		} catch (error) {
			// No iOS, falha de autoplay é esperada sem interação
			isPlaying = false;
		}
	}

	function togglePlay() {
		if (!videoElement) return;

		if (videoElement.paused) {
			// Configurações para iOS
			videoElement.muted = true;
			videoElement.playsInline = true;

			const playPromise = videoElement.play();
			if (playPromise !== undefined) {
				playPromise
					.then(() => {
						isPlaying = true;
					})
					.catch(() => {
						// Se falhar, força unmute e tenta novamente (iOS pode permitir)
						if (userHasInteracted) {
							videoElement.muted = false;
							videoElement
								.play()
								.then(() => {
									isPlaying = true;
								})
								.catch(() => {
									// Volta para muted se falhar
									videoElement.muted = true;
								});
						}
					});
			}
		} else {
			videoElement.pause();
			isPlaying = false;
		}
	}

	function handleTimeUpdate() {
		if (videoElement) {
			currentTime = videoElement.currentTime;
		}
	}

	function handleLoadedMetadata() {
		if (videoElement) {
			duration = videoElement.duration;

			// Tenta autoplay após metadata carregar
			if (autoplay) {
				// No iOS, aguarda um pouco mais
				const delay = isIOS ? 300 : 100;
				setTimeout(() => attemptAutoplay(), delay);
			}
		}
	}

	function handlePlay() {
		isPlaying = true;
	}

	function handlePause() {
		isPlaying = false;
	}

	// Computed values
	$: currentSrc = isMobile && srcMobile ? srcMobile : src;
	$: currentPoster = isMobile && posterMobile ? posterMobile : poster;
	$: currentWidth = isMobile ? customWidthMobile : customWidthDesktop;
	const fallbackAspectDesktop = '16/9';
	const fallbackAspectMobile = '9/16';

	$: normalizedAspectDesktop = (aspectRatioDesktop || '').trim();
	$: normalizedAspectMobile = (aspectRatioMobile || '').trim();
	$: currentAspectRatio = isMobile
		? normalizedAspectMobile || fallbackAspectMobile
		: normalizedAspectDesktop || fallbackAspectDesktop;

	// Estilos
	$: wrapperStyles = fullWidthBackground
		? `background-color: ${backgroundColor}; padding: 2rem 0;`
		: '';

	$: containerStyles = fullWidth
		? 'width: 100%; max-width: 100%; margin: 0;'
		: fullWidthBackground
			? `width: 100%; max-width: ${currentWidth}; margin: 0 auto;`
			: `width: 100%; max-width: ${currentWidth}; margin: 2rem auto; background-color: ${backgroundColor}; padding: 1rem; border-radius: 16px;`;

	$: containerAspectStyle = currentAspectRatio ? `aspect-ratio: ${currentAspectRatio};` : '';
	$: containerBackgroundStyle = fullWidthBackground
		? 'background-color: transparent;'
		: `background-color: ${backgroundColor};`;
	$: containerInlineStyle = `${containerAspectStyle} ${containerBackgroundStyle}`.trim();
</script>

<section
	class="video-player-wrapper"
	class:full-width-background={fullWidthBackground && !fullWidth}
	style={fullWidthBackground && !fullWidth ? wrapperStyles : ''}
>
	<figure class="video-player" class:full-width={fullWidth} style={containerStyles}>
		<div class="video-player__container" style={containerInlineStyle}>
			{#if mounted}
				<video
					bind:this={videoElement}
					src={currentSrc}
					poster={currentPoster}
					muted
					playsinline
					webkit-playsinline
					{controls}
					{loop}
					preload="metadata"
					on:timeupdate={handleTimeUpdate}
					on:loadedmetadata={handleLoadedMetadata}
					on:play={handlePlay}
					on:pause={handlePause}
					on:canplay={() => {
						if (autoplay) {
							attemptAutoplay();
						}
					}}
				>
					<source src={currentSrc} type="video/mp4" />
					Seu navegador não suporta vídeos HTML5.
				</video>
			{:else}
				<div class="video-placeholder" style="background-color: {backgroundColor};">
					<div class="loading">Carregando vídeo...</div>
				</div>
			{/if}

			<!-- Overlay de play sempre visível quando pausado -->
			{#if !controls && mounted}
				<div class="video-player__overlay" on:click={togglePlay}>
					{#if !isPlaying}
						<button class="video-player__play-overlay" aria-label="Reproduzir vídeo">
							<svg width="60" height="60" viewBox="0 0 60 60" fill="none">
								<circle cx="30" cy="30" r="30" fill="rgba(255, 255, 255, 0.9)" />
								<path d="M23 18L41 30L23 42V18Z" fill="#000" />
							</svg>
						</button>
					{/if}
				</div>
			{/if}
		</div>

		{#if showCaption && (caption || credit)}
			<figcaption class="video-player__caption">
				{#if caption}<p class="video-player__text">{@html caption}</p>{/if}
				{#if credit}<small class="video-player__credit">{@html credit}</small>{/if}
			</figcaption>
		{/if}
	</figure>
</section>

<style>
	.video-player-wrapper {
		width: 100%;
	}

	.video-player-wrapper.full-width-background {
		width: 100vw;
		margin-left: calc(-50vw + 50%);
	}

	.video-player {
		margin: 0;
		position: relative;
		box-sizing: border-box;
	}

	.video-player.full-width {
		width: 100% !important;
		max-width: 100% !important;
		margin: 0 !important;
		background-color: transparent !important;
		padding: 0 !important;
	}

	.video-player__container {
		position: relative;
		border-radius: 12px;
		overflow: hidden;
		width: 100%;
	}

	.full-width .video-player__container {
		border-radius: 0;
	}

	.video-player video {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.video-placeholder {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.loading {
		color: white;
		font-size: 1rem;
		opacity: 0.7;
	}

	.video-player__overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		background: transparent;
		transition: background-color 0.3s ease;
	}

	.video-player__overlay:hover {
		background: rgba(0, 0, 0, 0.1);
	}

	.video-player__play-overlay {
		background: none;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			transform 0.3s ease,
			opacity 0.3s ease;
		opacity: 0.9;
	}

	.video-player__play-overlay:hover {
		transform: scale(1.1);
		opacity: 1;
	}

	.video-player__caption {
		padding: 1rem 0.5rem;
		text-align: center;
	}

	.video-player__text {
		font-size: var(--font-size-50, 16px);
		line-height: 1.4;
		color: var(--color-secondary, #666);
		margin: 0 0 0.5rem 0;
		font-style: italic;
	}

	.video-player__credit {
		font-size: var(--font-size-40, 14px);
		color: var(--color-subtle-text, #999);
		font-weight: 500;
	}

	/* Mobile específico */
	@media (max-width: 768px) {
		.video-player {
			margin: 1rem 0;
		}

		.video-player:not(.full-width) {
			padding: 0.5rem;
		}

		.video-player__play-overlay svg {
			width: 50px;
			height: 50px;
		}

		/* iOS específico - botão de play mais visível */
		.video-player__play-overlay {
			opacity: 1;
			background: rgba(0, 0, 0, 0.3);
			border-radius: 50%;
			padding: 10px;
		}
	}

	/* Melhorias para touch devices */
	@media (hover: none) and (pointer: coarse) {
		.video-player__overlay {
			background: rgba(0, 0, 0, 0.05);
		}

		.video-player__play-overlay {
			opacity: 1;
			transform: scale(1.05);
		}
	}

	/* Otimizações para iOS específicas */
	@supports (-webkit-appearance: none) {
		.video-player video {
			-webkit-appearance: none;
		}
	}
</style>
