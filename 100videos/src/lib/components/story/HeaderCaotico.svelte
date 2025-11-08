<script>
	import { onMount } from 'svelte';

	// Props customizáveis básicas
	export let title = 'HEADER CAÓTICO';
	export let subtitle = '40 mídias se movimentando dinamicamente';
	export let titleColor = '#232323';

	// 🆕 PROPS DE BACKGROUND PERSONALIZADO
	export let useCustomBackground = false; // Se true, usa background personalizado
	export let backgroundImage = ''; // Background desktop
	export let backgroundImageMobile = ''; // Background mobile
	export let backgroundVideo = ''; // Vídeo background desktop
	export let backgroundVideoMobile = ''; // Vídeo background mobile
	export let overlay = true; // Overlay escuro sobre o background
	export let overlayOpacity = 0.5; // Opacidade do overlay (0-1)

	// 🎪 PROPS DE MÍDIAS CAÓTICAS
	export let medias = []; // Array de mídias customizado (opcional)
	export let totalDefaultMedias = 40; // Quantas mídias padrão gerar se medias estiver vazio
	export let animationDelay = 300; // Delay entre animações de entrada

	// 🎨 PROPS DE TAMANHO DAS MÍDIAS
	export let mediaWidth = 220; // Largura das mídias em pixels
	export let mediaHeight = 165; // Altura das mídias em pixels
	export let mediaSizeVariation = 0.4; // Variação de tamanho (0.8 + random * variation)
	export let mediaWidthMobile = 300; // Largura mobile
	export let mediaHeightMobile = 120; // Altura mobile

	// 🎯 DETECÇÃO AUTOMÁTICA - LINK COMPLETO EM PRODUÇÃO
	let baseUrl = '';
	let mediasWithPosition = [];

	// Verificar se tem background personalizado
	$: hasCustomBackground =
		useCustomBackground &&
		(backgroundImage || backgroundImageMobile || backgroundVideo || backgroundVideoMobile);

	// Função para gerar a URL completa baseada no ambiente atual
	function getFullImageUrl(imagePath) {
		if (typeof window !== 'undefined') {
			const currentUrl = window.location.href;
			if (currentUrl.includes('s3.glbimg.com')) {
				const urlParts = currentUrl.split('/');
				const baseUrl = urlParts
					.slice(0, urlParts.indexOf('index.html') || urlParts.length)
					.join('/');
				return `${baseUrl}${imagePath}`;
			}
		}
		return imagePath;
	}

	// Array padrão de mídias baseado na prop totalDefaultMedias
	let defaultMedias = [];

	// Função para gerar mídias padrão
	function generateDefaultMedias() {
		const videoCount = Math.min(2, Math.floor(totalDefaultMedias * 0.1));
		const imageCount = totalDefaultMedias - videoCount;

		const isLocalhost =
			typeof window !== 'undefined' &&
			(window.location.hostname === 'localhost' ||
				window.location.hostname === '127.0.0.1' ||
				window.location.hostname.includes('127.0.0.1'));

		defaultMedias = [
			...Array.from({ length: videoCount }, (_, i) => ({
				type: 'video',
				src:
					i === 0
						? 'https://sample-videos.com/zip/10/mp4/SampleVideo_720x480_1mb.mp4'
						: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4'
			})),

			...Array.from({ length: imageCount }, (_, i) => ({
				type: 'image',
				src: isLocalhost
					? `https://picsum.photos/300/200?random=${i + 1}`
					: getFullImageUrl(`/img/header/header${(i % 42) + 1}.jpg`)
			}))
		];

		console.log(`🎪 HeaderCaotico gerou ${defaultMedias.length} mídias`);
	}

	$: sourceMedias = medias.length > 0 ? medias : defaultMedias;

	$: if (totalDefaultMedias) {
		generateDefaultMedias();
	}

	let loadedMedias = 0;

	// Função para gerar posições randômicas
	function generateRandomPosition() {
		return {
			left: 60, // NOVO: Fixo para que caia sempre no centro do eixo X
			top: Math.random() * 28,
			scale: Math.random() * mediaSizeVariation + (1 - mediaSizeVariation / 2),
			rotation: Math.random() * 30 - 15
		};
	}

	// Configurar posições iniciais
	function setupMediaPositions() {
		mediasWithPosition = sourceMedias.map((media, index) => ({
			...media,
			id: index,
			...generateRandomPosition(),
			loaded: false,
			zIndex: index + 1
		}));
	}

	// Controlar quando mídia carrega
	function handleMediaLoad(mediaId) {
		loadedMedias++;
		const mediaIndex = mediasWithPosition.findIndex((m) => m.id === mediaId);
		if (mediaIndex >= 0) {
			mediasWithPosition[mediaIndex].loaded = true;
			console.log(`✅ Mídia ${mediaId + 1} carregada`);
		}
	}

	onMount(() => {
		generateDefaultMedias();
		setupMediaPositions();
	});
</script>

<header class="chaotic-header" class:custom-background={hasCustomBackground}>
	{#if hasCustomBackground}
		<div class="background-container">
			{#if backgroundImageMobile}
				<div
					class="background-image mobile"
					style="background-image: url({backgroundImageMobile})"
				></div>
			{/if}
			{#if backgroundVideoMobile}
				<video
					class="background-video mobile"
					autoplay
					muted
					loop
					playsinline
					src={backgroundVideoMobile}
				>
					<track kind="captions" />
				</video>
			{/if}

			{#if backgroundImage}
				<div
					class="background-image desktop"
					style="background-image: url({backgroundImage})"
				></div>
			{/if}
			{#if backgroundVideo}
				<video
					class="background-video desktop"
					autoplay
					muted
					loop
					playsinline
					src={backgroundVideo}
				>
					<track kind="captions" />
				</video>
			{/if}

			{#if overlay}
				<div class="background-overlay" style="background: rgba(0, 0, 0, {overlayOpacity})"></div>
			{/if}
		</div>
	{/if}

	<div
		class="media-container"
		style="
    --media-width: {mediaWidth}px; 
    --media-height: {mediaHeight}px;
    --media-width-mobile: {mediaWidthMobile}px;
    --media-height-mobile: {mediaHeightMobile}px;
  "
	>
		{#each mediasWithPosition as media (media.id)}
			<div
				class="media-item"
				style="
          left: {media.left}%;
          top: {media.top}%;
          --scale: {media.scale};
          --rotation: {media.rotation}deg;
          z-index: {media.zIndex};
          animation-delay: {media.id * animationDelay}ms;
        "
			>
				{#if media.type === 'video'}
					<video
						src={media.src}
						class="media-element video-element"
						autoplay
						muted
						loop
						playsinline
						on:loadeddata={() => handleMediaLoad(media.id)}
					>
						<track kind="captions" />
					</video>
				{:else}
					<img
						src={media.src}
						alt="Mídia {media.id + 1}"
						class="media-element image-element"
						loading="eager"
						on:load={() => handleMediaLoad(media.id)}
						on:error={() => handleMediaLoad(media.id)}
					/>
				{/if}
			</div>
		{/each}
	</div>

	<div class="header-content">
		<h1 class="main-title" style="color: {titleColor}">{title}</h1>
		<p class="subtitle">{subtitle}</p>
	</div>
</header>

<style>
	.chaotic-header {
		position: relative;
		height: 100vh;
		width: 100%;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #fff;
	}

	.background-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
	}

	.background-image,
	.background-video {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		background-size: cover;
		background-position: center;
	}

	.background-image.desktop,
	.background-video.desktop {
		display: none;
	}

	.background-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 2;
	}

	@media (min-width: 769px) {
		.background-image.mobile,
		.background-video.mobile {
			display: none;
		}

		.background-image.desktop,
		.background-video.desktop {
			display: block;
		}
	}

	/* 🎪 ESTILOS DAS MÍDIAS CAÓTICAS (CAMADA 2) */
	.media-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 15;
	}

	.media-item {
		position: absolute;
		opacity: 0;
		transform-origin: center center;
		will-change: transform, opacity;
		pointer-events: none;
		animation: throw-in 1.5s cubic-bezier(0.4, 0.5, 0.35, 1.2) forwards;
	}

	/* Removido o seletor .media-item.loaded, que causava o bug */

	.media-element {
		width: auto;
		height: auto;
		max-height: 300px;
		max-width: 300px;
		object-fit: contain;
		/* border-radius: 8px; */
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.4),
			0 0 0 2px rgba(255, 255, 255, 0.1);
		filter: contrast(1.1) saturate(1.2);
	}

	.video-element {
		/* border: 2px solid rgba(255, 0, 0, 0.3); */
	}

	.image-element {
		/* border: 2px solid rgba(255, 255, 255, 0.2); */
	}

	/* 🆕 NOVA ANIMAÇÃO: Papel sendo jogado de cima para baixo */
	@keyframes throw-in {
		0% {
			opacity: 0;
			transform: translate(-50%, -50%) scale(4) rotate(var(--rotation, 5deg)) translateY(-200%);
		}
		50% {
			opacity: 1;
			transform: translate(-50%, -50%) scale(var(--scale, 2)) rotate(var(--rotation, 3deg))
				translateY(20%);
			filter: blur(10px);
		}
		100% {
			opacity: 1;
			transform: translate(-50%, -50%) scale(var(--scale, 1)) rotate(var(--rotation, 0deg))
				translateY(0);
			filter: blur(0);
		}
	}

	.header-content {
		position: relative;
		z-index: 10;
		text-align: center;
		color: white;
		left: 2%;
		top: 5%;
	}

	.custom-background .header-content {
		/* ... */
	}

	.main-title {
		font-size: 4rem;
		font-weight: 900;
		margin: 0 0 1rem 0;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		background-size: 400% 400%;
	}

	.subtitle {
		font-size: 1.2rem;
		margin: 0;
		opacity: 0.9;
		font-weight: 300;
		color: #666;
	}

	/* Responsividade com props customizáveis */
	@media (max-width: 768px) {
		.media-container {
			--media-width: var(--media-width-mobile, 160px);
			--media-height: var(--media-height-mobile, 120px);
		}

		.main-title {
			font-size: 2.5rem;
		}

		.subtitle {
			font-size: 1rem;
		}
	}

	@media (max-width: 480px) {
		.media-container {
			--media-width: calc(var(--media-width-mobile, 160px) * 0.75);
			--media-height: calc(var(--media-height-mobile, 120px) * 0.75);
		}

		.main-title {
			font-size: 3rem;
			text-align: left;
			padding: 0;
			margin: 0;
			line-height: 3rem;
			padding-left: 2%;
			font-weight: 1000;
			font-style: normal;
		}

		.subtitle {
			font-size: 1.5rem;
			text-align: left;
			padding-left: 2%;
			line-height: 1.5rem;
		}
	}

	/* Performance otimizada */
	.media-item {
		transform-origin: center center;
		backface-visibility: hidden;
		perspective: 1000px;
	}
</style>
