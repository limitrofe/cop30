<!-- src/lib/components/EnhancedStoryRenderer.svelte -->
<script>
	import { onMount } from 'svelte';

	// Importar componentes existentes
	import StoryHeader from './StoryHeader.svelte';
	import StoryText from './StoryText.svelte';
	import SectionTitle from './story/SectionTitle.svelte';
	import PhotoWithCaption from './story/PhotoWithCaption.svelte';
	import VideoPlayer from './story/VideoPlayer.svelte';
	import GloboPlayer from './story/GloboPlayer.svelte';
	import GloboPlayerGridSlider from './story/GloboPlayerGridSlider.svelte';
	import { getSectionStyling } from './story/sectionStyle.js';
	import { gsapAnimator } from '$lib/utils/gsapAnimator.js';
	import { extractGsapOptions } from '$lib/utils/gsapConfig.js';

	// Importar novos componentes (com fallback)
	let ReadingProgress;
	// let SocialShare;

	export let storyData = {};
	export let enableAnalytics = true;
	// export let enableSharing = false;
	export let enableReadingProgress = true;
	export let enableThemeSwitcher = true;
	export let autoOptimize = true;

	const KEYHOLE_CLIP_CLOSED =
		'polygon(0% 0%, 0% 100%, 0% 100%, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 100%, 100% 100%, 100% 0%)';

	let mounted = false;
	let progress = 0;
	let scrollY = 0;
	let innerHeight = 0;

	$: keyholeSettings = storyData?.overlays?.keyhole || {};
	$: keyholeEnabled = Boolean(keyholeSettings.enabled);
	$: keyholeColor = keyholeSettings.color || '#fdcb6e';
	$: keyholeZIndex =
		keyholeSettings.zIndex !== undefined && keyholeSettings.zIndex !== null
			? keyholeSettings.zIndex
			: 120;
	$: keyholeArrowEnabled = keyholeSettings.arrowEnabled !== false;
	$: keyholeArrowTop = keyholeSettings.arrowTop || '75vh';
	$: keyholeArrowColor = keyholeSettings.arrowColor || '#2d3436';
	$: keyholeArrowAnimate = keyholeSettings.arrowAnimation !== false;

	// Função para mapear tipos (igual ao StoryRenderer original)
	function getComponentType(paragraph) {
		const type = paragraph.type?.toLowerCase();

		switch (type) {
			case 'header':
			case 'titulo-principal':
				return 'header';
			case 'texto':
			case 'paragrafo':
				return 'text';
			case 'intertitulo':
			case 'titulo':
				return 'section-title';
			case 'frase':
			case 'citacao':
			case 'quote':
				return 'quote';
			case 'foto':
			case 'imagem':
				return 'photo';
			case 'video':
			case 'mp4':
				return 'video';
			case 'globovideo':
			case 'globo-video':
			case 'globoplayer':
			case 'globo-player':
			case 'globo':
				return 'globo-player';
			case 'galeria':
			case 'gallery':
				return 'gallery';
			case 'carousel':
			case 'carrossel':
				return 'carousel';
			case 'globoplayer-carousel':
			case 'globoplay-carousel':
			case 'globoplayer-carrossel':
			case 'globoplay-carrossel':
			case 'globo-carousel':
			case 'globo-carrossel':
			case 'carrossel-globoplay':
			case 'carousel-globoplay':
				return 'globoplayer-carousel';
			case 'globoplayer-grid-slider':
			case 'globoplay-grid-slider':
			case 'globoplayer-grid':
			case 'globoplay-grid':
			case 'grade-globoplay':
			case 'grid-globoplay':
				return 'globoplayer-grid-slider';
			default:
				return 'text';
		}
	}

	// Calcular tempo de leitura estimado
	function calculateReadTime(story) {
		const wordsPerMinute = 200;
		let words = 0;

		if (story.title) words += story.title.split(' ').length;
		if (story.subtitle) words += story.subtitle.split(' ').length;
		if (story.intro?.text) words += story.intro.text.split(' ').length;

		story.paragraphs?.forEach((p) => {
			if (p.text) {
				const cleanText = p.text.replace(/<[^>]*>/g, '');
				words += cleanText.split(' ').length;
			}
		});

		return Math.ceil(words / wordsPerMinute);
	}

	// Calcular progresso de leitura
	function updateProgress() {
		if (innerHeight === 0) return;
		const documentHeight = document.documentElement.scrollHeight - innerHeight;
		if (documentHeight > 0) {
			progress = Math.min(100, (scrollY / documentHeight) * 100);
		}
	}

	// Analytics simplificado
	function trackEvent(eventName, data = {}) {
		if (enableAnalytics) {
			console.log(`📊 Analytics: ${eventName}`, data);

			// Integração com Google Analytics se disponível
			if (typeof gtag !== 'undefined') {
				gtag('event', eventName, data);
			}
		}
	}

	// Função de compartilhamento simplificada
	async function shareStory() {
		const shareData = {
			title: storyData.title,
			text: storyData.subtitle || storyData.intro?.text,
			url: window.location.href
		};

		if (navigator.share) {
			try {
				await navigator.share(shareData);
				trackEvent('story_shared', { method: 'native' });
			} catch (err) {
				console.log('Compartilhamento cancelado');
			}
		} else {
			// Fallback para copiar link
			try {
				await navigator.clipboard.writeText(window.location.href);
				alert('Link copiado para a área de transferência!');
				trackEvent('story_shared', { method: 'clipboard' });
			} catch (err) {
				console.error('Erro ao copiar link:', err);
			}
		}
	}

	onMount(async () => {
		mounted = true;

		// Track story start
		trackEvent('story_start', {
			title: storyData.title,
			readTime: calculateReadTime(storyData)
		});

		// Tentar carregar componentes avançados
		try {
			const readingProgressModule = await import('./ReadingProgress.svelte');
			ReadingProgress = readingProgressModule.default;
		} catch (err) {
			console.log('ReadingProgress não disponível:', err.message);
		}

		// try {
		//   const socialShareModule = await import('./SocialShare.svelte');
		//   SocialShare = socialShareModule.default;
		// } catch (err) {
		//   console.log('SocialShare não disponível:', err.message);
		// }
	});

	// Reativo
	$: if (mounted) updateProgress();
</script>

<svelte:window bind:scrollY bind:innerHeight />

<svelte:head>
	<title>{storyData.title || 'Sistema de Jornalismo'}</title>
	{#if storyData.subtitle}
		<meta name="description" content={storyData.subtitle} />
	{/if}

	<!-- Open Graph -->
	<meta property="og:title" content={storyData.title || 'Sistema de Jornalismo'} />
	{#if storyData.subtitle}
		<meta property="og:description" content={storyData.subtitle} />
	{/if}
	<meta property="og:type" content="article" />
</svelte:head>

{#if keyholeEnabled}
	<span
		class="keyhole"
		aria-hidden="true"
		style={`--keyhole-bg:${keyholeColor}; --keyhole-z:${keyholeZIndex}; --keyhole-clip:${KEYHOLE_CLIP_CLOSED};`}
	></span>
	{#if keyholeArrowEnabled}
		<span
			class:arrow--animate={keyholeArrowAnimate}
			class="arrow"
			aria-hidden="true"
			style={`--keyhole-arrow-top:${keyholeArrowTop}; --keyhole-arrow-color:${keyholeArrowColor}; --keyhole-z:${keyholeZIndex};`}
		>
			<svg
				width="32"
				height="32"
				viewBox="-5 -5 30 30"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M0 10H20L10 0M20 10L10 20"
					stroke-width="4"
					stroke-linecap="square"
					stroke-linejoin="round"
				/>
			</svg>
		</span>
	{/if}
{/if}

<!-- Barra de progresso simples -->
{#if enableReadingProgress && progress > 5}
	<div class="reading-progress-bar">
		<div class="progress-fill" style="width: {progress}%"></div>
		<div class="progress-info">
			<span>{Math.round(progress)}% lida</span>
			<span>{calculateReadTime(storyData)} min</span>
		</div>
	</div>
{/if}

<!-- Botão de compartilhamento flutuante -->
<!-- {#if enableSharing}
  <button class="share-button" on:click={shareStory} title="Compartilhar história">
    📤 Compartilhar
  </button>
{/if} -->

<!-- Conteúdo principal -->
<main class="enhanced-story" data-theme={storyData.theme}>
	<!-- Informações da story -->
	{#if mounted}
		<div class="story-meta">
			<div class="meta-info">
				<span class="reading-time">📖 {calculateReadTime(storyData)} min de leitura</span>
				{#if storyData.author}
					<span class="author">✍️ {storyData.author}</span>
				{/if}
				{#if storyData.theme}
					<span class="theme">🎨 {storyData.theme}</span>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Header se tiver title -->
	{#if storyData.title}
		<StoryHeader
			title={storyData.title}
			subtitle={storyData.subtitle}
			author={storyData.author}
			date={storyData.date}
			backgroundImage={storyData.backgroundImage}
			backgroundImageMobile={storyData.backgroundImageMobile}
			backgroundVideo={storyData.backgroundVideo}
			backgroundVideoMobile={storyData.backgroundVideoMobile}
			overlay={storyData.overlay ?? true}
			overlayGradient={storyData.overlayGradient}
			verticalAlign={storyData.verticalAlign || storyData.valign || 'center'}
			horizontalAlign={storyData.horizontalAlign || storyData.align || 'center'}
		/>
	{/if}

	<!-- Intro se existir -->
	{#if storyData.intro && storyData.intro.text}
		<StoryText content={storyData.intro.text} variant="lead" maxWidth="800px" />
	{/if}

	<!-- Renderização dos parágrafos -->
	{#if storyData.paragraphs}
		{#each storyData.paragraphs as paragraph, index}
			{@const componentType = getComponentType(paragraph)}
			{@const sectionStyling = getSectionStyling(paragraph)}
			{@const animationOptions = extractGsapOptions(paragraph, { componentType })}

			<section
				class={sectionStyling.className}
				style={sectionStyling.style}
				data-component-type={componentType}
				data-index={index}
			>
				{#if sectionStyling.background.source === 'image'}
					<picture class="story-section__background story-section__background--image">
						{#if sectionStyling.background.imageMobile}
							<source srcset={sectionStyling.background.imageMobile} media="(max-width: 768px)" />
						{/if}
						{#if sectionStyling.background.imageDesktop}
							<img src={sectionStyling.background.imageDesktop} alt="" aria-hidden="true" />
						{/if}
					</picture>
				{/if}

				{#if sectionStyling.background.source === 'video'}
					<video
						class="story-section__background story-section__background--video"
						autoplay
						muted
						loop
						playsinline
						preload="auto"
						poster={sectionStyling.background.videoPosterMobile ||
							sectionStyling.background.videoPosterDesktop ||
							''}
					>
						{#if sectionStyling.background.videoMobile}
							<source
								src={sectionStyling.background.videoMobile}
								type="video/mp4"
								media="(max-width: 768px)"
							/>
						{/if}
						{#if sectionStyling.background.videoDesktop}
							<source src={sectionStyling.background.videoDesktop} type="video/mp4" />
						{/if}
					</video>
				{/if}

				<div class="story-section__inner" use:gsapAnimator={animationOptions}>
					<div class="story-component">
						{#if componentType === 'text'}
							<StoryText
								content={paragraph.text}
								variant={paragraph.variant || 'body'}
								align={paragraph.align || 'left'}
								maxWidth={paragraph.maxWidth}
								maxWidthDesktop={paragraph.maxWidthDesktop}
								maxWidthMobile={paragraph.maxWidthMobile}
								widthDesktop={paragraph.widthDesktop}
								widthMobile={paragraph.widthMobile}
								containerWidth={paragraph.containerWidth}
								containerWidthDesktop={paragraph.containerWidthDesktop}
								containerWidthMobile={paragraph.containerWidthMobile}
								containerMaxWidth={paragraph.containerMaxWidth}
								containerMaxWidthDesktop={paragraph.containerMaxWidthDesktop}
								containerMaxWidthMobile={paragraph.containerMaxWidthMobile}
								containerMinHeight={paragraph.containerMinHeight}
								containerMinHeightDesktop={paragraph.containerMinHeightDesktop}
								containerMinHeightMobile={paragraph.containerMinHeightMobile}
								horizontalPosition={paragraph.horizontalPosition}
								verticalPosition={paragraph.verticalPosition}
								fontSizeDesktop={paragraph.fontSizeDesktop}
								fontSizeMobile={paragraph.fontSizeMobile}
								lineHeightDesktop={paragraph.lineHeightDesktop}
								lineHeightMobile={paragraph.lineHeightMobile}
								textColor={paragraph.textColor || paragraph.color}
							/>
						{:else if componentType === 'quote'}
							<StoryText
								content={paragraph.text}
								variant="quote"
								author={paragraph.author}
								role={paragraph.role}
								align={paragraph.align || 'left'}
								maxWidth={paragraph.maxWidth}
								maxWidthDesktop={paragraph.maxWidthDesktop}
								maxWidthMobile={paragraph.maxWidthMobile}
								widthDesktop={paragraph.widthDesktop}
								widthMobile={paragraph.widthMobile}
								containerWidth={paragraph.containerWidth}
								containerWidthDesktop={paragraph.containerWidthDesktop}
								containerWidthMobile={paragraph.containerWidthMobile}
								containerMaxWidth={paragraph.containerMaxWidth}
								containerMaxWidthDesktop={paragraph.containerMaxWidthDesktop}
								containerMaxWidthMobile={paragraph.containerMaxWidthMobile}
								containerMinHeight={paragraph.containerMinHeight}
								containerMinHeightDesktop={paragraph.containerMinHeightDesktop}
								containerMinHeightMobile={paragraph.containerMinHeightMobile}
								horizontalPosition={paragraph.horizontalPosition}
								verticalPosition={paragraph.verticalPosition}
								fontSizeDesktop={paragraph.fontSizeDesktop}
								fontSizeMobile={paragraph.fontSizeMobile}
								lineHeightDesktop={paragraph.lineHeightDesktop}
								lineHeightMobile={paragraph.lineHeightMobile}
								textColor={paragraph.textColor || paragraph.color}
							/>
						{:else if componentType === 'section-title'}
							<SectionTitle
								title={paragraph.text}
								subtitle={paragraph.subtitle}
								backgroundImage={paragraph.backgroundImage}
								backgroundImageMobile={paragraph.backgroundImageMobile}
								variant={paragraph.variant || 'default'}
								size={paragraph.size || 'medium'}
								height={paragraph.height}
								textPosition={paragraph.textPosition || 'center'}
								textAlign={paragraph.textAlign || 'center'}
								titleFontWeight={paragraph.titleFontWeight}
								titleFontStyle={paragraph.titleFontStyle}
								subtitleFontWeight={paragraph.subtitleFontWeight}
								subtitleFontStyle={paragraph.subtitleFontStyle}
								overlay={paragraph.overlay !== 'false'}
								minimalAccentColor={paragraph.minimalAccentColor}
								minimalAccentWidthDesktop={paragraph.minimalAccentWidthDesktop}
								minimalAccentWidthMobile={paragraph.minimalAccentWidthMobile}
								minimalAccentHeightDesktop={paragraph.minimalAccentHeightDesktop}
								minimalAccentHeightMobile={paragraph.minimalAccentHeightMobile}
							/>
						{:else if componentType === 'photo'}
							<PhotoWithCaption
								src={paragraph.src || paragraph.url || paragraph.image}
								srcMobile={paragraph.srcMobile || paragraph.src}
								alt={paragraph.alt || paragraph.text}
								caption={paragraph.caption || paragraph.legenda}
								credit={paragraph.credit || paragraph.credito}
								fullWidth={paragraph.fullWidth === 'true'}
								widthDesktop={paragraph.widthDesktop || paragraph.width?.desktop || ''}
								widthMobile={paragraph.widthMobile || paragraph.width?.mobile || ''}
								alignDesktop={paragraph.alignDesktop || paragraph.alignmentDesktop || ''}
								alignMobile={paragraph.alignMobile || paragraph.alignmentMobile || ''}
								alignment={paragraph.alignment}
								link={paragraph.link}
								target={paragraph.target || '_self'}
							/>
						{:else if componentType === 'video'}
							<VideoPlayer
								src={paragraph.src || paragraph.url}
								poster={paragraph.poster}
								caption={paragraph.caption}
								credit={paragraph.credit}
								fullWidth={paragraph.fullWidth === 'true'}
								autoplay={paragraph.autoplay === 'true'}
								controls={paragraph.controls !== 'false'}
							/>
						{:else if componentType === 'globo-player'}
							<GloboPlayer
								videosIDs={paragraph.videoId || paragraph.videosIDs || paragraph.id}
								width={paragraph.width || '100%'}
								height={parseInt(paragraph.height) || 450}
								autoPlay={paragraph.autoplay === 'true'}
								startMuted={paragraph.startMuted !== 'false'}
							/>
						{:else if componentType === 'globoplayer-grid-slider'}
							<GloboPlayerGridSlider
								slides={paragraph.slides || []}
								showArrows={paragraph.showArrows !== 'false' && paragraph.showArrows !== false}
								showDots={paragraph.showDots !== 'false' && paragraph.showDots !== false}
								enableDrag={paragraph.enableDrag !== 'false' && paragraph.enableDrag !== false}
								gapDesktop={paragraph.gapDesktop || '1.5rem'}
								gapMobile={paragraph.gapMobile || '1rem'}
								paddingDesktop={paragraph.paddingDesktop || '1.5rem 0'}
								paddingMobile={paragraph.paddingMobile || '1rem 0'}
								backgroundColor={paragraph.backgroundColor || ''}
								borderRadius={paragraph.borderRadius || '0'}
								tabletBreakpoint={paragraph.tabletBreakpoint || '1024px'}
								mobileBreakpoint={paragraph.mobileBreakpoint || '768px'}
							/>
						{/if}
					</div>
				</div>
			</section>
		{/each}
	{/if}

	<!-- Footer -->
	<footer class="story-footer">
		<div class="footer-content">
			{#if storyData.author}
				<p class="author-credit">Por <strong>{storyData.author}</strong></p>
			{/if}
			{#if storyData.date}
				<p class="publish-date">
					Publicado em {new Date(storyData.date).toLocaleDateString('pt-BR')}
				</p>
			{/if}
		</div>

		<!-- {#if enableSharing}
      <div class="footer-share">
        <button on:click={shareStory} class="share-btn">
          📤 Compartilhar esta história
        </button>
      </div>
    {/if} -->
	</footer>
</main>

<!-- Debug info (apenas em dev) -->
{#if import.meta.env.DEV}
	<div class="debug-info">
		<details>
			<summary>🔧 Debug Info</summary>
			<p>Progresso: {Math.round(progress)}%</p>
			<p>Scroll: {scrollY}px</p>
			<p>Componentes: {storyData.paragraphs?.length || 0}</p>
			<p>Tempo estimado: {calculateReadTime(storyData)} min</p>
		</details>
	</div>
{/if}

<style>
	:global(.keyhole) {
		position: fixed;
		inset: 0;
		pointer-events: none;
		clip-path: var(
			--keyhole-clip,
			polygon(
				0% 0%,
				0% 100%,
				0% 100%,
				0% 0%,
				100% 0%,
				100% 100%,
				0% 100%,
				0% 100%,
				100% 100%,
				100% 0%
			)
		);
		background: var(--keyhole-bg, #fdcb6e);
		z-index: var(--keyhole-z, 120);
		transition: none;
	}

	:global(.arrow) {
		position: fixed;
		left: 50%;
		top: var(--keyhole-arrow-top, 75vh);
		transform: translate(-50%, -50%);
		pointer-events: none;
		color: var(--keyhole-arrow-color, #2d3436);
		z-index: calc(var(--keyhole-z, 120) + 1);
	}

	:global(.arrow svg) {
		display: block;
		width: 2rem;
		height: auto;
		stroke: currentColor;
		transform: rotate(90deg);
	}

	:global(.arrow--animate) {
		animation: keyhole-arrow-float 1s ease-in-out infinite alternate;
	}

	@keyframes keyhole-arrow-float {
		from {
			transform: translate(-50%, -50%);
		}
		to {
			transform: translate(-50%, 50%);
		}
	}

	.enhanced-story {
		background: var(--color-background);
		color: var(--color-text);
		min-height: 100vh;
	}

	/* Reading Progress Bar */
	.reading-progress-bar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: var(--color-border);
		z-index: 1000;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--color-primary), #ff8a65);
		transition: width 0.2s ease;
	}

	.progress-info {
		position: absolute;
		top: 4px;
		right: 1rem;
		background: var(--color-background);
		padding: 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 0 0 8px 8px;
		font-size: var(--font-size-40);
		display: flex;
		gap: 1rem;
		color: var(--color-secondary);
	}

	/* Share Button */
	.share-button {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		background: var(--color-primary);
		color: white;
		border: none;
		padding: 1rem;
		border-radius: 50px;
		cursor: pointer;
		font-size: var(--font-size-50);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		transition: all 0.3s ease;
		z-index: 999;
	}

	.share-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
	}

	/* Story Meta */
	.story-meta {
		max-width: 800px;
		margin: 1rem auto;
		padding: 0 2rem;
	}

	.meta-info {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		padding: 1rem;
		background: var(--color-highlight-bg);
		border-radius: 8px;
		font-size: var(--font-size-50);
		color: var(--color-secondary);
	}

	/* Story Components */
	.story-section {
		position: relative;
		width: 100%;
		overflow: hidden;
	}

	.story-section__background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
		pointer-events: none;
	}

	.story-section__background--image {
		display: block;
	}

	.story-section__background--image img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.story-section__background--video {
		object-fit: cover;
	}

	.story-section__inner {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		width: 100%;
		padding-top: var(--story-section-padding-top, 0);
		padding-bottom: var(--story-section-padding-bottom, 0);
		gap: var(--story-section-gap, 0);
	}

	.story-section--with-text-color .story-component,
	.story-section--with-text-color .story-component :global(*) {
		color: inherit;
	}

	.story-component {
		margin: 0;
	}

	/* Footer */
	.story-footer {
		max-width: 800px;
		margin: 3rem auto;
		padding: 2rem;
		border-top: 2px solid var(--color-border);
		text-align: center;
	}

	.footer-content {
		margin-bottom: 2rem;
	}

	.author-credit {
		font-size: var(--font-size-60);
		margin: 0 0 0.5rem 0;
	}

	.publish-date {
		font-size: var(--font-size-50);
		color: var(--color-secondary);
		margin: 0;
	}

	.share-btn {
		background: var(--color-primary);
		color: white;
		border: none;
		padding: 1rem 2rem;
		border-radius: 25px;
		cursor: pointer;
		font-size: var(--font-size-60);
		transition: all 0.3s ease;
	}

	.share-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	/* Debug Info */
	.debug-info {
		position: fixed;
		bottom: 1rem;
		left: 1rem;
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 1rem;
		border-radius: 8px;
		font-size: 12px;
		font-family: monospace;
		z-index: 1000;
	}

	/* Mobile */
	@media (max-width: 768px) {
		.progress-info {
			display: none;
		}

		.share-button {
			bottom: 1rem;
			right: 1rem;
			padding: 0.75rem;
			font-size: var(--font-size-45);
		}

		.story-meta {
			padding: 0 1rem;
		}

		.meta-info {
			flex-direction: column;
			gap: 0.5rem;
		}

		.story-footer {
			padding: 1rem;
		}
	}
</style>
