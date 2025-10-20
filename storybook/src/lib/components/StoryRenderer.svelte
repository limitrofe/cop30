<!-- StoryRenderer.svelte - COMPLETO com ResponsiveMediaLayout -->
<script>
	import { onMount } from 'svelte';
	import { gsapAnimator } from '$lib/utils/gsapAnimator.js';
	import { extractGsapOptions, stripGsapProps } from '$lib/utils/gsapConfig.js';
	// Importação dos componentes da história
	import Header from './story/Header.svelte';
	import StoryText from './story/StoryText.svelte';
	import SectionTitle from './story/SectionTitle.svelte';
	import { getSectionStyling } from './story/sectionStyle.js';
	import PhotoWithCaption from './story/PhotoWithCaption.svelte';
	import VideoPlayer from './story/VideoPlayer.svelte';
	import GloboPlayer from './story/GloboPlayer.svelte';
	import PhotoGallery from './story/PhotoGallery.svelte';
	import Carousel from './story/Carousel.svelte';
	import Parallax from './story/Parallax.svelte';
	import BeforeAfter from './story/BeforeAfter.svelte';
	import ScrollyTelling from './story/ScrollyTelling.svelte';
	// ✅ MUDANÇA: ScrollyFrames ao invés de VideoScrollytelling
	import ScrollyFrames from './story/ScrollyFrames.svelte';
	import FlourishEmbed from './story/FlourishEmbed.svelte';
	import FlourishScrolly from './story/FlourishScrolly.svelte';
	import FinalCredits from './FinalCredits.svelte';
	import AnchorPoint from './story/AnchorPoint.svelte';
	// 🎬 COMPONENTES DE APRESENTAÇÃO
	import CharacterPresentation from './story/CharacterPresentation.svelte';
	import Curiosidades from './story/Curiosidades.svelte';
	// 🆕 NOVO: Itens Recomendados
	import RecommendedItems from './story/RecommendedItems.svelte';
	// 🆕 NOVOS COMPONENTES DA TRAMA DO GOLPE
	import TimelineInteractive from './story/TimelineInteractive.svelte';
	import DocumentViewer from './story/DocumentViewer.svelte';
	import CrimeExplainer from './story/CrimeExplainer.svelte';
	// 🌪️ NOVO: Header Caótico
	import HeaderCaotico from './story/HeaderCaotico.svelte';
	import FlexibleLayout from './story/FlexibleLayout.svelte';
	import ContentGrid from './story/ContentGrid.svelte';
	// 🎨 NOVO: ResponsiveMediaLayout
	import ResponsiveMediaLayout from './story/ResponsiveMediaLayout.svelte';
	import MediaTextLayout from './story/MediaTextLayout.svelte';
	import FreeCanvas from './story/FreeCanvas.svelte';
	import GloboPlayerGridSlider from './story/GloboPlayerGridSlider.svelte';
	import ChartBar from './story/ChartBar.svelte';
	import ChartLine from './story/ChartLine.svelte';

	export let previewDevice = null;

	let device = 'desktop';
	const KEYHOLE_CLIP_CLOSED =
		'polygon(0% 0%, 0% 100%, 0% 100%, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 100%, 100% 100%, 100% 0%)';

	function determineDevice() {
		if (previewDevice && typeof previewDevice === 'string') return previewDevice;
		if (typeof window !== 'undefined') {
			return window.innerWidth <= 768 ? 'mobile' : 'desktop';
		}
		return 'desktop';
	}

	$: device = determineDevice();

	onMount(() => {
		if (typeof window === 'undefined' || previewDevice) return;
		const handleResize = () => {
			device = determineDevice();
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	export let storyData = {};
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

	/**
	 * Mapeia os tipos de parágrafo para os nomes dos componentes.
	 */
	function getComponentType(paragraph) {
		const type = paragraph.type?.toLowerCase();

		switch (type) {
			// Headers e títulos
			case 'header':
			case 'titulo-principal':
			case 'abre':
				return 'header';

			// 🌪️ NOVO: Header Caótico
			case 'header-caotico':
			case 'header-caótico':
			case 'caotico':
			case 'chaotic-header':
			case 'caos':
				return 'header-caotico';

			// Texto
			case 'texto':
			case 'paragrafo':
				return 'text';

			case 'intertitulo':
			case 'titulo':
				return 'section-title';

			case 'layout-flexivel':
			case 'flexible-layout':
			case 'layout-personalizado':
				return 'flexible-layout';

			case 'content-grid':
			case 'grid':
			case 'grid-layout':
			case 'layout-grid':
			case 'colunas':
				return 'content-grid';

			case 'media-text':
			case 'media_text':
			case 'media-copy':
			case 'media-text-layout':
			case 'duas-colunas':
			case 'media-columns':
				return 'media-text';

			// 🎨 NOVO: ResponsiveMediaLayout
			case 'responsive-media':
			case 'responsivemedia':
			case 'responsive-layout':
			case 'media-layout':
				return 'responsive-media';

			case 'free-canvas':
			case 'canvas-livre':
			case 'creative-canvas':
			case 'absolute-canvas':
			case 'super-flex':
			case 'superflex':
				return 'free-canvas';

			case 'frase':
			case 'citacao':
			case 'quote':
				return 'quote';

			// Mídia
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

			// 🆕 NOVO: Itens Recomendados
			case 'recomendados':
			case 'recommended':
			case 'recommended-items':
			case 'itens-recomendados':
			case 'relacionados':
			case 'conteudos-relacionados':
				return 'recommended-items';

			// Componentes interativos
			case 'parallax':
				return 'parallax';

			case 'beforeafter':
			case 'before-after':
			case 'antes-depois':
				return 'before-after';

			case 'scrolly':
			case 'scrollytelling':
				return 'scrolly';

			// ✅ SCROLLY FRAMES
			case 'scrollyframes':
			case 'scrolly-frames':
			case 'videoscrollytelling':
			case 'video-scrollytelling':
			case 'videoscrolly':
			case 'video-scrolly':
				return 'scrollyframes';

			// Visualizações
			case 'chart-bar':
			case 'bar-chart':
			case 'grafico-barra':
			case 'gráfico-barra':
			case 'grafico-coluna':
			case 'gráfico-coluna':
			case 'chart':
				return 'chart-bar';

			case 'chart-line':
			case 'line-chart':
			case 'linechart':
			case 'grafico-linha':
			case 'gráfico-linha':
			case 'serie-temporal':
			case 'série-temporal':
			case 'timeline-chart':
				return 'chart-line';

			case 'flourish':
				return 'flourish';

			case 'flourish-scrolly':
				return 'flourish-scrolly';

			// 🎬 APRESENTAÇÕES
			case 'personagens':
			case 'characters':
			case 'character-presentation':
				return 'character-presentation';

			case 'curiosidades':
			case 'trivia':
			case 'facts':
				return 'curiosidades';

			// 🆕 NOVOS COMPONENTES DA TRAMA DO GOLPE
			case 'timeline-interactive':
			case 'timeline':
			case 'cronologia':
			case 'cronologia-interativa':
				return 'timeline-interactive';

			case 'document-viewer':
			case 'documents':
			case 'docs':
			case 'visualizador-documentos':
				return 'document-viewer';

			case 'crime-explainer':
			case 'crimes':
			case 'explicador-crimes':
			case 'crimes-explicacao':
				return 'crime-explainer';

			// Navegação
			case 'anchor':
			case 'ancora':
				return 'anchor';

			// Fallback
			default:
				return 'text';
		}
	}

	/**
	 * Extrai propriedades de um parágrafo para um componente
	 */
	function getComponentProps(paragraph) {
		// Retorna todas as propriedades exceto 'type'
		const { type, ...props } = paragraph;
		return stripGsapProps(props);
	}

	/**
	 * Converte string para boolean
	 */
	function stringToBoolean(value, defaultValue = false) {
		if (typeof value === 'boolean') return value;
		if (typeof value === 'string') {
			return value.toLowerCase() === 'true' || value === '1';
		}
		return defaultValue;
	}

	function resolveValue(...values) {
		for (const value of values) {
			if (value !== undefined && value !== null && value !== '') {
				return value;
			}
		}
		return undefined;
	}

	function parseOptionalBoolean(value, defaultValue = undefined) {
		if (value === undefined || value === null || value === '') return defaultValue;
		if (typeof value === 'boolean') return value;
		if (typeof value === 'number') return value !== 0;
		if (typeof value === 'string') {
			const normalized = value.trim().toLowerCase();
			if (['true', '1', 'yes', 'sim'].includes(normalized)) return true;
			if (['false', '0', 'no', 'não', 'nao'].includes(normalized)) return false;
		}
		return Boolean(value);
	}

	function normalizeGloboPlayerProps(rawProps = {}) {
		const media = rawProps.media || {};
		const globo = rawProps.globoPlayer || {};
		const base = { ...(media.globoPlayer || {}), ...globo };

		const candidateMap = {
			videoId: [
				rawProps.videoId,
				rawProps.videoID,
				rawProps.globoVideoId,
				rawProps.mediaVideoId,
				media.videoId,
				globo.videoId
			],
			videoIdDesktop: [
				rawProps.videoIdDesktop,
				rawProps.globoVideoIdDesktop,
				media.videoIdDesktop,
				globo.videoIdDesktop
			],
			videoIdMobile: [
				rawProps.videoIdMobile,
				rawProps.globoVideoIdMobile,
				media.videoIdMobile,
				globo.videoIdMobile
			],
			widthDesktop: [rawProps.widthDesktop, media.widthDesktop, globo.widthDesktop],
			widthMobile: [rawProps.widthMobile, media.widthMobile, globo.widthMobile],
			aspectRatio: [rawProps.aspectRatio, media.aspectRatio, globo.aspectRatio],
			aspectRatioMobile: [
				rawProps.aspectRatioMobile,
				media.aspectRatioMobile,
				globo.aspectRatioMobile
			],
			containerBackgroundColor: [
				rawProps.containerBackgroundColor,
				media.containerBackgroundColor,
				globo.containerBackgroundColor
			],
			autoPlay: [rawProps.autoPlay, rawProps.autoplay, media.autoPlay, globo.autoPlay],
			startMuted: [rawProps.startMuted, media.startMuted, globo.startMuted],
			skipDFP: [rawProps.skipDFP, media.skipDFP, globo.skipDFP],
			controls: [rawProps.controls, media.controls, globo.controls],
			showCaption: [rawProps.showCaption, media.showCaption, globo.showCaption],
			caption: [rawProps.caption, media.caption, globo.caption],
			credit: [rawProps.credit, media.credit, globo.credit],
			fullWidth: [rawProps.fullWidth, media.fullWidth, globo.fullWidth],
			startTime: [rawProps.startTime, media.startTime, globo.startTime],
			resumeAt: [rawProps.resumeAt, media.resumeAt, globo.resumeAt],
			env: [rawProps.env, media.env, globo.env]
		};

		for (const [key, candidates] of Object.entries(candidateMap)) {
			const resolved = resolveValue(...candidates);
			if (resolved !== undefined) {
				base[key] = [
					'autoPlay',
					'autoplay',
					'startMuted',
					'skipDFP',
					'controls',
					'showCaption',
					'fullWidth'
				].includes(key)
					? parseOptionalBoolean(resolved, base[key])
					: resolved;
			}
		}

		return Object.fromEntries(Object.entries(base).filter(([, value]) => value !== undefined));
	}

	/**
	 * Processa lista de personagens/curiosidades para padronizar formato
	 */
	function processCharacters(characters) {
		if (!characters) return [];

		// Se for string JSON, faz parse
		if (typeof characters === 'string') {
			try {
				characters = JSON.parse(characters);
			} catch (e) {
				console.error('Erro ao fazer parse dos personagens:', e);
				return [];
			}
		}

		// Se for array, retorna processado
		if (Array.isArray(characters)) {
			return characters.map((char) => ({
				nome: char.nome || char.name || '',
				sobrenome: char.sobrenome || char.surname || '',
				foto: char.foto || char.photo || char.image || '',
				fotoMobile:
					char.fotoMobile || char.photoMobile || char.foto_mobile || char.photo_mobile || '',
				descricao: char.descricao || char.description || char.texto || '',
				frase: char.frase || char.quote || char.phrase || '', // ✅ CAMPO EXISTENTE
				autor: char.autor || char.author || '', // ✅ NOVO CAMPO
				profissao: char.profissao || char.profession || '' // ✅ NOVO CAMPO
			}));
		}

		return [];
	}

	/**
	 * 🆕 Processa lista de itens recomendados para padronizar formato
	 */
	function processRecommendedItems(items) {
		if (!items) return [];

		// Se for string JSON, faz parse
		if (typeof items === 'string') {
			try {
				items = JSON.parse(items);
			} catch (e) {
				console.error('Erro ao fazer parse dos itens recomendados:', e);
				return [];
			}
		}

		// Se for array, retorna processado
		if (Array.isArray(items)) {
			return items.map((item) => ({
				title: item.title || item.titulo || item.nome || '',
				subtitle: item.subtitle || item.subtitulo || '',
				description: item.description || item.descricao || '',
				image: item.image || item.imagem || item.img || item.foto || '',
				link: item.link || item.url || '',
				category: item.category || item.categoria || '',
				year: item.year || item.ano || '',
				rating: item.rating || item.avaliacao || item.nota || '',
				genre: item.genre || item.genero || '',
				duration: item.duration || item.duracao || '',
				badge: item.badge || item.selo || '',
				isNew: item.isNew || item.novo || item.new || false
			}));
		}

		return [];
	}

	/**
	 * 🌪️ NOVO: Processa lista de mídias para o header caótico
	 */
	function processChaoticMedias(medias) {
		if (!medias) return [];

		// Se for string JSON, faz parse
		if (typeof medias === 'string') {
			try {
				medias = JSON.parse(medias);
			} catch (e) {
				console.error('Erro ao fazer parse das mídias caóticas:', e);
				return [];
			}
		}

		// Se for array, retorna processado
		if (Array.isArray(medias)) {
			return medias.map((media) => ({
				type: media.type || 'image',
				src: media.src || media.url || '',
				rotation: media.rotation || Math.random() * 30 - 15,
				scale: media.scale || 0.8 + Math.random() * 0.4,
				x: media.x || Math.random() * 100,
				y: media.y || Math.random() * 100,
				zIndex: media.zIndex || Math.floor(Math.random() * 40)
			}));
		}

		return [];
	}

	/**
	 * 🎨 NOVO: Processa array de textos para ResponsiveMediaLayout
	 */
	function processTextos(textos) {
		if (!Array.isArray(textos)) return [];

		return textos.map((texto) => ({
			content: texto.content || texto.texto || '',
			fontFamily: texto.fontFamily || texto.familia || 'inherit',
			fontSize: {
				desktop: texto.fontSizeDesktop || texto.fontSize?.desktop || '2rem',
				mobile: texto.fontSizeMobile || texto.fontSize?.mobile || '1.5rem'
			},
			fontWeight: {
				desktop: texto.fontWeightDesktop || texto.fontWeight?.desktop || '400',
				mobile: texto.fontWeightMobile || texto.fontWeight?.mobile || '400'
			},
			lineHeight: {
				desktop: texto.lineHeightDesktop || texto.lineHeight?.desktop || '1.2',
				mobile: texto.lineHeightMobile || texto.lineHeight?.mobile || '1.3'
			},
			textAlign: {
				desktop: texto.textAlignDesktop || texto.textAlign?.desktop || 'left',
				mobile: texto.textAlignMobile || texto.textAlign?.mobile || 'left'
			},
			letterSpacing: {
				desktop: texto.letterSpacingDesktop || texto.letterSpacing?.desktop || '0px',
				mobile: texto.letterSpacingMobile || texto.letterSpacing?.mobile || '0px'
			},
			color: texto.color || texto.cor || '#ffffff',
			position: {
				desktop: {
					x: texto.xDesktop || texto.position?.desktop?.x || '0',
					y: texto.yDesktop || texto.position?.desktop?.y || '0',
					z: texto.zDesktop || texto.position?.desktop?.z || '1'
				},
				mobile: {
					x: texto.xMobile || texto.position?.mobile?.x || '0',
					y: texto.yMobile || texto.position?.mobile?.y || '0',
					z: texto.zMobile || texto.position?.mobile?.z || '1'
				}
			},
			transform: {
				desktop: texto.transformDesktop || texto.transform?.desktop || 'none',
				mobile: texto.transformMobile || texto.transform?.mobile || 'none'
			}
		}));
	}

	/**
	 * 🎨 NOVO: Processa array de imagens para ResponsiveMediaLayout
	 */
	function processImagens(imagens) {
		if (!Array.isArray(imagens)) return [];

		return imagens.map((imagem) => ({
			srcDesktop: imagem.srcDesktop || imagem.src || '',
			srcMobile: imagem.srcMobile || imagem.src || '',
			alt: imagem.alt || imagem.description || '',
			width: {
				desktop: imagem.widthDesktop || imagem.width?.desktop || 'auto',
				mobile: imagem.widthMobile || imagem.width?.mobile || 'auto'
			},
			height: {
				desktop: imagem.heightDesktop || imagem.height?.desktop || 'auto',
				mobile: imagem.heightMobile || imagem.height?.mobile || 'auto'
			},
			objectFit: {
				desktop: imagem.objectFitDesktop || imagem.objectFit?.desktop || 'cover',
				mobile: imagem.objectFitMobile || imagem.objectFit?.mobile || 'cover'
			},
			position: {
				desktop: {
					x: imagem.xDesktop || imagem.position?.desktop?.x || '0',
					y: imagem.yDesktop || imagem.position?.desktop?.y || '0',
					z: imagem.zDesktop || imagem.position?.desktop?.z || '1'
				},
				mobile: {
					x: imagem.xMobile || imagem.position?.mobile?.x || '0',
					y: imagem.yMobile || imagem.position?.mobile?.y || '0',
					z: imagem.zMobile || imagem.position?.mobile?.z || '1'
				}
			},
			transform: {
				desktop: imagem.transformDesktop || imagem.transform?.desktop || 'none',
				mobile: imagem.transformMobile || imagem.transform?.mobile || 'none'
			}
		}));
	}
</script>

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

<article class="story-content">
	<!-- Renderizar intro se existir -->
	{#if storyData.intro}
		<div class="section-content">
			<StoryText content={storyData.intro.text} variant="lead" />
		</div>
	{/if}

	<!-- Renderizar parágrafos -->
	{#if storyData.paragraphs}
		{#each storyData.paragraphs as paragraph}
			{@const componentType = getComponentType(paragraph)}
			{@const props = getComponentProps(paragraph)}
			{@const sectionStyling = getSectionStyling(paragraph)}
			{@const animationOptions = extractGsapOptions(paragraph, { componentType })}

			<section class={sectionStyling.className} style={sectionStyling.style}>
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
					<!-- Header -->
					{#if componentType === 'header'}
						<Header
							title={props.title}
							subtitle={props.subtitle}
							author={props.author}
							date={props.date}
							backgroundImage={props.backgroundImage}
							backgroundImageMobile={props.backgroundImageMobile}
							backgroundVideo={props.backgroundVideo}
							backgroundVideoMobile={props.backgroundVideoMobile}
							variant={props.variant || 'default'}
							overlay={stringToBoolean(props.overlay, true)}
							overlayGradient={props.overlayGradient}
							posterImage={props.poster}
							posterImageMobile={props.posterMobile}
							verticalAlign={(props.verticalAlign || props.valign || 'top').toLowerCase()}
							horizontalAlign={(props.horizontalAlign || props.align || 'left').toLowerCase()}
							titleFontSizeDesktop={props.titleFontSizeDesktop}
							titleFontSizeMobile={props.titleFontSizeMobile}
							titleLineHeightDesktop={props.titleLineHeightDesktop}
							titleLineHeightMobile={props.titleLineHeightMobile}
							subtitleFontSizeDesktop={props.subtitleFontSizeDesktop}
							subtitleFontSizeMobile={props.subtitleFontSizeMobile}
							subtitleLineHeightDesktop={props.subtitleLineHeightDesktop}
							subtitleLineHeightMobile={props.subtitleLineHeightMobile}
							titleColor={props.titleColor}
							subtitleColor={props.subtitleColor}
							metaColor={props.metaColor}
							onMediaColor={props.onMediaColor}
							titleShadow={props.titleShadow}
							subtitleShadow={props.subtitleShadow}
							metaShadow={props.metaShadow}
						/>
						<!-- 🌪️ Header Caótico -->
					{:else if componentType === 'header-caotico'}
						<HeaderCaotico
							title={props.title || 'HEADER CAÓTICO'}
							subtitle={props.subtitle || '40 mídias se movimentando dinamicamente'}
							titleColor={props.titleColor || '#232323'}
							medias={processChaoticMedias(props.medias || [])}
							useCustomBackground={stringToBoolean(props.useCustomBackground, false)}
							backgroundImage={props.backgroundImage || ''}
							backgroundImageMobile={props.backgroundImageMobile || ''}
							backgroundVideo={props.backgroundVideo || ''}
							backgroundVideoMobile={props.backgroundVideoMobile || ''}
							overlay={stringToBoolean(props.overlay, true)}
							overlayOpacity={parseFloat(props.overlayOpacity) || 0.5}
							totalDefaultMedias={parseInt(props.totalDefaultMedias) || 40}
							shuffleInterval={parseInt(props.shuffleInterval) || 3000}
							animationDelay={parseInt(props.animationDelay) || 300}
							mediaWidth={parseInt(props.mediaWidth) || 220}
							mediaHeight={parseInt(props.mediaHeight) || 165}
							mediaWidthMobile={parseInt(props.mediaWidthMobile) || 160}
							mediaHeightMobile={parseInt(props.mediaHeightMobile) || 120}
							mediaSizeVariation={parseFloat(props.mediaSizeVariation) || 0.4}
						/>

						<!-- Text -->
					{:else if componentType === 'text'}
						<div class="section-content">
							<StoryText
								content={props.text}
								variant={props.variant || 'body'}
								align={props.align}
								maxWidth={props.maxWidth}
								maxWidthDesktop={props.maxWidthDesktop}
								maxWidthMobile={props.maxWidthMobile}
								widthDesktop={props.widthDesktop}
								widthMobile={props.widthMobile}
								containerWidth={props.containerWidth}
								containerWidthDesktop={props.containerWidthDesktop}
								containerWidthMobile={props.containerWidthMobile}
								containerMaxWidth={props.containerMaxWidth}
								containerMaxWidthDesktop={props.containerMaxWidthDesktop}
								containerMaxWidthMobile={props.containerMaxWidthMobile}
								containerMinHeight={props.containerMinHeight}
								containerMinHeightDesktop={props.containerMinHeightDesktop}
								containerMinHeightMobile={props.containerMinHeightMobile}
								horizontalPosition={props.horizontalPosition}
								verticalPosition={props.verticalPosition}
								fontSizeDesktop={props.fontSizeDesktop}
								fontSizeMobile={props.fontSizeMobile}
								lineHeightDesktop={props.lineHeightDesktop}
								lineHeightMobile={props.lineHeightMobile}
								textColor={props.textColor || props.color}
							/>
						</div>

						<!-- Quote -->
					{:else if componentType === 'quote'}
						<div class="section-content">
							<StoryText
								content={props.text}
								variant="quote"
								author={props.author}
								role={props.role}
								maxWidth={props.maxWidth}
								maxWidthDesktop={props.maxWidthDesktop}
								maxWidthMobile={props.maxWidthMobile}
								widthDesktop={props.widthDesktop}
								widthMobile={props.widthMobile}
								containerWidth={props.containerWidth}
								containerWidthDesktop={props.containerWidthDesktop}
								containerWidthMobile={props.containerWidthMobile}
								containerMaxWidth={props.containerMaxWidth}
								containerMaxWidthDesktop={props.containerMaxWidthDesktop}
								containerMaxWidthMobile={props.containerMaxWidthMobile}
								containerMinHeight={props.containerMinHeight}
								containerMinHeightDesktop={props.containerMinHeightDesktop}
								containerMinHeightMobile={props.containerMinHeightMobile}
								horizontalPosition={props.horizontalPosition}
								verticalPosition={props.verticalPosition}
								fontSizeDesktop={props.fontSizeDesktop}
								fontSizeMobile={props.fontSizeMobile}
								lineHeightDesktop={props.lineHeightDesktop}
								lineHeightMobile={props.lineHeightMobile}
								textColor={props.textColor || props.color}
							/>
						</div>

						<!-- Section Title -->
					{:else if componentType === 'section-title'}
						<SectionTitle
							title={props.text}
							subtitle={props.subtitle}
							backgroundImage={props.backgroundImage}
							backgroundImageMobile={props.backgroundImageMobile}
							backgroundPosition={props.backgroundPosition || 'center'}
							backgroundPositionMobile={props.backgroundPositionMobile || 'center'}
							backgroundVideo={props.backgroundVideo}
							backgroundVideoMobile={props.backgroundVideoMobile}
							backgroundColor={props.backgroundColor}
							textColor={props.textColor}
							minimalAccentColor={props.minimalAccentColor}
							minimalAccentWidthDesktop={props.minimalAccentWidthDesktop}
							minimalAccentWidthMobile={props.minimalAccentWidthMobile}
							minimalAccentHeightDesktop={props.minimalAccentHeightDesktop}
							minimalAccentHeightMobile={props.minimalAccentHeightMobile}
							fontFamily={props.fontFamily || 'obviously'}
							variant={props.variant || 'default'}
							size={props.size || 'medium'}
							height={props.height}
							heightMobile={props.heightMobile}
							textPosition={props.textPosition || 'center'}
							textPositionMobile={props.textPositionMobile}
							textAlign={props.textAlign || 'center'}
							textAlignMobile={props.textAlignMobile}
							titleFontWeight={props.titleFontWeight}
							titleFontStyle={props.titleFontStyle}
							subtitleFontWeight={props.subtitleFontWeight}
							subtitleFontStyle={props.subtitleFontStyle}
							overlay={stringToBoolean(props.overlay, false)}
							titleShadow={props.titleShadow}
							subtitleShadow={props.subtitleShadow}
						/>

						<!-- Flexible Layout -->
					{:else if componentType === 'flexible-layout'}
						<FlexibleLayout
							text={props.text || ''}
							textAlign={props.textAlign || 'left'}
							textPosition={props.textPosition || 'left'}
							textColor={props.textColor || '#ffffff'}
							fontSize={props.fontSize || 'clamp(2rem, 5vw, 4rem)'}
							fontSizeMobile={props.fontSizeMobile || 'clamp(1.5rem, 8vw, 2.5rem)'}
							textZIndex={props.textZIndex || 2}
							image1Desktop={props.image1Desktop || ''}
							image1Mobile={props.image1Mobile || ''}
							image1Width={props.image1Width || '200px'}
							image1Height={props.image1Height || '20px'}
							image1WidthMobile={props.image1WidthMobile || '150px'}
							image1HeightMobile={props.image1HeightMobile || '15px'}
							image1X={props.image1X || '0px'}
							image1Y={props.image1Y || '0px'}
							image1XMobile={props.image1XMobile || '0px'}
							image1YMobile={props.image1YMobile || '0px'}
							image1ZIndex={props.image1ZIndex || 3}
							image2Desktop={props.image2Desktop || ''}
							image2Mobile={props.image2Mobile || ''}
							image2Width={props.image2Width || '400px'}
							image2Height={props.image2Height || '500px'}
							image2WidthMobile={props.image2WidthMobile || '300px'}
							image2HeightMobile={props.image2HeightMobile || '400px'}
							image2Position={props.image2Position || 'right'}
							image2X={props.image2X || '0px'}
							image2Y={props.image2Y || '0px'}
							image2XMobile={props.image2XMobile || '0px'}
							image2YMobile={props.image2YMobile || '0px'}
							image2ZIndex={props.image2ZIndex || 1}
							backgroundColor={props.backgroundColor ?? '#1a1a1a'}
							minHeight={props.minHeight || '80vh'}
							minHeightMobile={props.minHeightMobile || '70vh'}
							padding={props.padding || '2rem'}
							paddingMobile={props.paddingMobile || '1.5rem'}
						/>
					{:else if componentType === 'content-grid'}
						{@const gridItems = Array.isArray(props.items)
							? props.items
							: Array.isArray(props.columns)
								? props.columns
								: []}
						{@const gridColumnsDesktop =
							typeof props.columnsDesktop !== 'undefined'
								? props.columnsDesktop
								: typeof props.columns === 'number'
									? props.columns
									: (props.columnsCount ?? props.columnCount ?? 3)}
						<ContentGrid
							columnsDesktop={gridColumnsDesktop}
							gapDesktop={props.gapDesktop ?? '1.5rem'}
							gapMobile={props.gapMobile ?? '1rem'}
							backgroundColor={props.backgroundColor ?? ''}
							paddingDesktop={props.paddingDesktop ?? props.padding ?? '0'}
							paddingMobile={props.paddingMobile ?? props.padding ?? ''}
							borderRadius={props.borderRadius ?? '0'}
							itemBackground={props.itemBackground ?? ''}
							itemPadding={props.itemPadding ?? '0'}
							itemBorderRadius={props.itemBorderRadius ?? '0'}
							mobileBreakpoint={props.mobileBreakpoint ?? '768px'}
							items={gridItems}
						/>

						<!-- 🎨 NOVO: ResponsiveMediaLayout -->
					{:else if componentType === 'responsive-media'}
						<ResponsiveMediaLayout
							heightDesktop={props.heightDesktop || props.height || '100vh'}
							heightMobile={props.heightMobile || props.height || '100vh'}
							backgroundType={props.backgroundType || 'color'}
							backgroundColor={props.backgroundColor ?? '#000000'}
							backgroundImageDesktop={props.backgroundImageDesktop || props.backgroundImage || ''}
							backgroundImageMobile={props.backgroundImageMobile || props.backgroundImage || ''}
							backgroundPositionDesktop={props.backgroundPositionDesktop ||
								props.backgroundPosition ||
								'center center'}
							backgroundPositionMobile={props.backgroundPositionMobile ||
								props.backgroundPosition ||
								'center center'}
							backgroundSizeDesktop={props.backgroundSizeDesktop || props.backgroundSize || 'cover'}
							backgroundSizeMobile={props.backgroundSizeMobile || props.backgroundSize || 'cover'}
							backgroundVideoDesktop={props.backgroundVideoDesktop || props.backgroundVideo || ''}
							backgroundVideoMobile={props.backgroundVideoMobile || props.backgroundVideo || ''}
							textos={processTextos(props.textos || props.texts || [])}
							imagens={processImagens(props.imagens || props.images || [])}
						/>
					{:else if componentType === 'media-text'}
						{@const media = props.media || {}}
						{@const globoPlayerConfig = normalizeGloboPlayerProps(props)}
						<MediaTextLayout
							mediaType={resolveValue(props.mediaType, media.type, 'image')}
							mediaSrc={resolveValue(props.mediaSrc, media.src, media.url)}
							mediaSrcDesktop={resolveValue(
								props.mediaSrcDesktop,
								media.srcDesktop,
								media.desktop,
								media.src,
								media.url
							)}
							mediaSrcMobile={resolveValue(props.mediaSrcMobile, media.srcMobile, media.mobile)}
							mediaAlt={resolveValue(props.mediaAlt, media.alt, media.description, props.alt)}
							mediaPoster={resolveValue(props.mediaPoster, media.poster)}
							mediaAutoplay={parseOptionalBoolean(
								resolveValue(props.mediaAutoplay, media.autoplay),
								true
							)}
							mediaLoop={parseOptionalBoolean(resolveValue(props.mediaLoop, media.loop), true)}
							mediaMuted={parseOptionalBoolean(resolveValue(props.mediaMuted, media.muted), true)}
							mediaControls={parseOptionalBoolean(
								resolveValue(props.mediaControls, media.controls),
								false
							)}
							mediaPlaysInline={parseOptionalBoolean(
								resolveValue(props.mediaPlaysInline, media.playsInline),
								true
							)}
							mediaAspectRatio={resolveValue(
								props.mediaAspectRatio,
								media.aspectRatio,
								props.aspectRatio,
								'16 / 9'
							)}
							mediaBackground={resolveValue(props.mediaBackground, media.background, 'transparent')}
							mediaBorderRadius={resolveValue(
								props.mediaBorderRadius,
								media.borderRadius,
								props.borderRadius,
								'0.75rem'
							)}
							mediaHeightDesktop={resolveValue(
								props.mediaHeightDesktop,
								props.mediaHeight,
								media.heightDesktop,
								media.mediaHeightDesktop,
								''
							)}
							mediaHeightMobile={resolveValue(
								props.mediaHeightMobile,
								media.heightMobile,
								props.mediaHeight,
								''
							)}
							mediaPadding={resolveValue(props.mediaPadding, media.padding, '0')}
							mediaCaption={resolveValue(props.mediaCaption, props.caption, media.caption, '')}
							mediaCredit={resolveValue(props.mediaCredit, props.credit, media.credit, '')}
							mediaClass={props.mediaClass || ''}
							mediaOrderMobile={resolveValue(
								props.mediaOrderMobile,
								media.mediaOrderMobile,
								'auto'
							)}
							globoPlayer={globoPlayerConfig}
							pretitle={resolveValue(props.pretitle, props.overline, props.kicker, '')}
							title={props.title || media.title || ''}
							subtitle={props.subtitle || media.subtitle || ''}
							text={props.text || props.content || media.text || ''}
							blockquote={resolveValue(
								props.blockquote,
								props.quote,
								media.blockquote,
								media.quote,
								''
							)}
							blockquoteAuthor={resolveValue(
								props.blockquoteAuthor,
								props.quoteAuthor,
								media.blockquoteAuthor,
								media.quoteAuthor,
								''
							)}
							blockquoteRole={resolveValue(
								props.blockquoteRole,
								props.quoteRole,
								media.blockquoteRole,
								media.quoteRole,
								''
							)}
							textOrder={props.textOrder ||
								media.textOrder || ['pretitle', 'title', 'subtitle', 'text', 'blockquote']}
							textAlign={resolveValue(props.textAlign, media.textAlign, 'left')}
							textColor={resolveValue(props.textColor, media.textColor, undefined)}
							textSpacing={resolveValue(props.textSpacing, media.textSpacing, '1.25rem')}
							textMaxWidth={resolveValue(
								props.textMaxWidth,
								media.textMaxWidth,
								props.maxWidth,
								'560px'
							)}
							mediaPosition={resolveValue(
								props.mediaPosition,
								props.layout,
								media.position,
								'left'
							)}
							verticalAlign={resolveValue(
								props.verticalAlign,
								props.align,
								media.verticalAlign,
								'center'
							)}
							gapDesktop={resolveValue(props.gapDesktop, props.gap, media.gapDesktop, '2.5rem')}
							gapMobile={resolveValue(props.gapMobile, media.gapMobile, props.gap, '1.5rem')}
							backgroundColor={props.backgroundColor ?? media.backgroundColor ?? 'transparent'}
							paddingDesktop={resolveValue(
								props.paddingDesktop,
								props.padding,
								media.paddingDesktop,
								'3rem 0'
							)}
							paddingMobile={resolveValue(
								props.paddingMobile,
								media.paddingMobile,
								props.padding,
								'2rem 1rem'
							)}
							containerWidth={resolveValue(props.containerWidth, media.containerWidth, '100%')}
							containerMaxWidth={resolveValue(
								props.containerMaxWidth,
								props.maxWidth,
								media.containerMaxWidth,
								'1200px'
							)}
							mediaWidthDesktop={resolveValue(
								props.mediaWidthDesktop,
								props.mediaWidth,
								media.widthDesktop,
								media.mediaWidthDesktop,
								'minmax(0, 48%)'
							)}
							textWidthDesktop={resolveValue(
								props.textWidthDesktop,
								props.textWidth,
								media.textWidthDesktop,
								'minmax(0, 52%)'
							)}
							mediaWidthMobile={resolveValue(
								props.mediaWidthMobile,
								media.mediaWidthMobile,
								'100%'
							)}
							textWidthMobile={resolveValue(props.textWidthMobile, media.textWidthMobile, '100%')}
							fullWidthOnMobile={parseOptionalBoolean(
								resolveValue(props.fullWidthOnMobile, media.fullWidthOnMobile),
								false
							)}
							shadow={resolveValue(props.shadow, media.shadow, '')}
						/>
					{:else if componentType === 'free-canvas'}
						{@const backgroundColorDesktop =
							props.backgroundColorDesktop ?? props.backgroundColor ?? '#000000'}
						{@const backgroundColorMobile = props.backgroundColorMobile ?? backgroundColorDesktop}
						{@const backgroundImageDesktop =
							props.backgroundImageDesktop || props.backgroundImage || ''}
						{@const backgroundImageMobile = props.backgroundImageMobile || backgroundImageDesktop}
						{@const backgroundVideoDesktop =
							props.backgroundVideoDesktop || props.backgroundVideo || ''}
						{@const backgroundVideoMobile = props.backgroundVideoMobile || backgroundVideoDesktop}
						{@const backgroundVideoPosterDesktop =
							props.backgroundVideoPosterDesktop || props.videoPosterDesktop || ''}
						{@const backgroundVideoPosterMobile =
							props.backgroundVideoPosterMobile ||
							props.videoPosterMobile ||
							backgroundVideoPosterDesktop}
						{@const inferredBackgroundSource = props.backgroundSource
							? props.backgroundSource
							: backgroundVideoDesktop || backgroundVideoMobile
								? 'video'
								: backgroundImageDesktop || backgroundImageMobile
									? 'image'
									: 'color'}
						<FreeCanvas
							minHeightDesktop={Number(
								props.minHeightDesktop ?? props.heightDesktop ?? props.height ?? 400
							)}
							maxHeightDesktop={props.maxHeightDesktop ?? null}
							minHeightMobile={Number(
								props.minHeightMobile ?? props.heightMobile ?? props.height ?? 400
							)}
							maxHeightMobile={props.maxHeightMobile ?? null}
							baseWidthDesktop={Number(props.baseWidthDesktop ?? 1440)}
							baseWidthMobile={Number(props.baseWidthMobile ?? 375)}
							backgroundSource={inferredBackgroundSource}
							backgroundColor={backgroundColorDesktop}
							{backgroundColorDesktop}
							{backgroundColorMobile}
							{backgroundImageDesktop}
							{backgroundImageMobile}
							{backgroundVideoDesktop}
							{backgroundVideoMobile}
							{backgroundVideoPosterDesktop}
							{backgroundVideoPosterMobile}
							videoAutoplay={props.videoAutoplay ?? props.backgroundVideoAutoplay ?? true}
							videoLoop={props.videoLoop ?? true}
							videoMuted={props.videoMuted ?? true}
							items={props.items || props.elements || []}
							{device}
							typography={storyData.appearance?.typography || {}}
						/>
					{:else if componentType === 'photo'}
						<PhotoWithCaption
							src={props.src}
							srcMobile={props.srcMobile || props.src}
							alt={props.alt || ''}
							caption={props.caption || ''}
							credit={props.credit || ''}
							fullWidth={stringToBoolean(props.fullWidth, false)}
							widthDesktop={props.widthDesktop || props.width?.desktop || ''}
							widthMobile={props.widthMobile || props.width?.mobile || ''}
							alignDesktop={props.alignDesktop || props.alignmentDesktop || ''}
							alignMobile={props.alignMobile || props.alignmentMobile || ''}
							alignment={props.alignment}
							link={props.link}
							target={props.target || '_self'}
						/>
						<!-- Video - ATUALIZADO COM NOVAS PROPS -->
						<!-- Video - ATUALIZADO COM NOVAS PROPS -->
					{:else if componentType === 'video'}
						<VideoPlayer
							src={props.src}
							srcMobile={props.srcMobile || props.src}
							poster={props.poster}
							posterMobile={props.posterMobile || props.poster}
							caption={props.caption}
							credit={props.credit}
							fullWidth={stringToBoolean(props.fullWidth, false)}
							autoplay={stringToBoolean(props.autoplay, true)}
							controls={stringToBoolean(props.controls, false)}
							loop={stringToBoolean(props.loop, false)}
							showCaption={stringToBoolean(props.showCaption, true)}
							customWidth={props.customWidth || props.width || '800px'}
							customWidthDesktop={props.customWidthDesktop || ''}
							customWidthMobile={props.customWidthMobile || ''}
							aspectRatio={props.aspectRatio || '16/9'}
							aspectRatioMobile={props.aspectRatioMobile || '9/16'}
							backgroundColor={props.backgroundColor ??
								props.containerBackgroundColor ??
								'rgba(0, 0, 0, 0.05)'}
							alignment={props.alignment || 'center'}
							fullWidthBackground={stringToBoolean(props.fullWidthBackground, false)}
						/>

						<!-- Globo Player -->
					{:else if componentType === 'globo-player'}
						<GloboPlayer
							videoId={props.videoId}
							videosIDs={props.videosIDs}
							videoIdMobile={props.videoIdMobile}
							videoIdDesktop={props.videoIdDesktop}
							widthMobile={props.widthMobile}
							widthDesktop={props.widthDesktop}
							width={props.width}
							containerBackgroundColor={props.containerBackgroundColor}
							aspectRatio={props.aspectRatio}
							aspectRatioMobile={props.aspectRatioMobile}
							caption={props.caption}
							credit={props.credit}
							fullWidth={stringToBoolean(props.fullWidth, false)}
							autoplay={stringToBoolean(props.autoplay, false)}
							startMuted={stringToBoolean(props.startMuted, true)}
							skipDFP={stringToBoolean(props.skipDFP, false)}
							chromeless={stringToBoolean(props.chromeless, false)}
							showCaption={stringToBoolean(props.showCaption, true)}
							controls={stringToBoolean(props.controls, true)}
							autoPlay={stringToBoolean(props.autoPlay, false)}
							allowRestrictedContent={stringToBoolean(props.allowRestrictedContent, true)}
							allowLocation={stringToBoolean(props.allowLocation, true)}
							exitFullscreenOnEnd={stringToBoolean(props.exitFullscreenOnEnd, true)}
							isLiveContent={stringToBoolean(props.isLiveContent, false)}
							preventBlackBars={stringToBoolean(props.preventBlackBars, false)}
							includeResetStyle={stringToBoolean(props.includeResetStyle, true)}
							disasterRecoveryMode={stringToBoolean(props.disasterRecoveryMode, false)}
							env={props.env || 'production'}
							globoId={props.globoId}
							token={props.token}
							resumeAt={props.resumeAt}
							maxQualityLevel={props.maxQualityLevel}
							defaultSubtitle={props.defaultSubtitle}
							defaultAudio={props.defaultAudio}
							adAccountId={props.adAccountId}
							adCmsId={props.adCmsId}
							adUnit={props.adUnit}
							adCustomData={props.adCustomData}
							siteName={props.siteName}
							ga4={props.ga4}
						/>

						<!-- Gallery -->
					{:else if componentType === 'gallery'}
						<PhotoGallery
							images={props.images || []}
							layout={props.layout || 'grid'}
							columns={parseInt(props.columns) || 3}
							lightbox={stringToBoolean(props.lightbox, true)}
						/>

						<!-- Carousel -->
					{:else if componentType === 'carousel'}
						<Carousel
							items={props.items || []}
							autoplay={stringToBoolean(props.autoplay, false)}
							interval={parseInt(props.interval) || 3000}
							showDots={stringToBoolean(props.showDots, true)}
							showArrows={stringToBoolean(props.showArrows, true)}
						/>

						<!-- GloboPlay Grid Slider -->
					{:else if componentType === 'globoplayer-grid-slider'}
						<GloboPlayerGridSlider
							slides={props.slides || []}
							showArrows={stringToBoolean(props.showArrows, true)}
							showDots={stringToBoolean(props.showDots, true)}
							enableDrag={stringToBoolean(props.enableDrag, true)}
							gapDesktop={props.gapDesktop ?? '1.5rem'}
							gapMobile={props.gapMobile ?? '1rem'}
							paddingDesktop={props.paddingDesktop ?? '1.5rem 0'}
							paddingMobile={props.paddingMobile ?? '1rem 0'}
							backgroundColor={props.backgroundColor ?? ''}
							borderRadius={props.borderRadius ?? '0'}
							tabletBreakpoint={props.tabletBreakpoint ?? '1024px'}
							mobileBreakpoint={props.mobileBreakpoint ?? '768px'}
						/>

						<!-- 🆕 NOVO: Recommended Items -->
					{:else if componentType === 'recommended-items'}
						<RecommendedItems
							items={processRecommendedItems(props.items || props.itens)}
							title={props.title || props.titulo || 'conteúdos relacionados'}
							layout={props.layout || 'grid'}
							columns={parseInt(props.columns || props.colunas) || 5}
							showTitle={stringToBoolean(props.showTitle || props.mostrarTitulo, true)}
							backgroundColor={props.backgroundColor ?? props.corFundo ?? '#000000'}
							titleColor={props.titleColor || props.corTitulo || '#ff0000'}
							textColor={props.textColor || props.corTexto || '#ffffff'}
						/>

						<!-- Parallax -->
					{:else if componentType === 'parallax'}
						<Parallax
							image={props.image}
							imageMobile={props.imageMobile}
							height={props.height || '60vh'}
							speed={parseFloat(props.speed) || 0.5}
							overlay={stringToBoolean(props.overlay, true)}
							backgroundPosition={props.backgroundPosition}
							backgroundPositionMobile={props.backgroundPositionMobile}
							backgroundSize={props.backgroundSize}
							backgroundSizeMobile={props.backgroundSizeMobile}
							backgroundBaseColor={props.backgroundBaseColor}
							backgroundBaseImage={props.backgroundBaseImage}
							backgroundBaseImageMobile={props.backgroundBaseImageMobile}
							backgroundBasePosition={props.backgroundBasePosition}
							backgroundBasePositionMobile={props.backgroundBasePositionMobile}
							backgroundBaseSize={props.backgroundBaseSize}
							backgroundBaseSizeMobile={props.backgroundBaseSizeMobile}
							content={props.content || ''}
						/>

						<!-- Before/After -->
					{:else if componentType === 'before-after'}
						<BeforeAfter
							beforeImage={props.beforeImage}
							beforeImageMobile={props.beforeImageMobile}
							beforeCaption={props.beforeCaption}
							beforeCredit={props.beforeCredit}
							afterImage={props.afterImage}
							afterImageMobile={props.afterImageMobile}
							afterCaption={props.afterCaption}
							afterCredit={props.afterCredit}
							beforeLabel={props.beforeLabel || 'Antes'}
							afterLabel={props.afterLabel || 'Depois'}
							orientation={props.orientation || 'vertical'}
							width={props.width || props.largura || '100%'}
							widthMobile={props.widthMobile || props.larguraMobile}
							maxWidth={props.maxWidth || props.larguraMaxima}
							maxWidthMobile={props.maxWidthMobile || props.larguraMaximaMobile}
						/>

						<!-- ScrollyTelling -->
					{:else if componentType === 'scrolly'}
						<ScrollyTelling
							steps={props.steps || []}
							fullWidth={stringToBoolean(props.fullWidth, false)}
							activationMode={props.activationMode || props.advanceMode}
							activationLine={props.activationLine ??
								props.activationRatio ??
								props.activationPoint ??
								props.activationPosition}
							exitLine={props.exitLine ?? props.exitRatio ?? props.exitPoint ?? props.exitPosition}
						/>

						<!-- ✅ SCROLLY FRAMES - NOVO COMPONENTE -->
					{:else if componentType === 'scrollyframes'}
						<ScrollyFrames
							framePrefix={props.imagePrefix || ''}
							framePrefixMobile={props.imagePrefixMobile || ''}
							frameExtension={props.imageSuffix || '.jpg'}
							frameExtensionMobile={props.imageSuffixMobile || '.webp'}
							startFrame={parseInt(props.frameStart) || 1}
							endFrame={parseInt(props.frameStop) || 100}
							totalFrames={parseInt(props.frameStop) || 100}
							height={props.height || '400vh'}
							showProgress={stringToBoolean(props.showProgress, true)}
							showFrameCounter={stringToBoolean(props.showTime, false)}
							preloadRadius={parseInt(props.preloadFrames) || 8}
						/>

						<!-- 🎬 CHARACTER PRESENTATION - COMPONENTE DE PERSONAGENS -->
					{:else if componentType === 'character-presentation'}
						<CharacterPresentation
							personagens={processCharacters(props.personagens || props.characters || props.lista)}
							shapeColor={props.shapeColor || '#DC2626'}
							nameColor={props.nameColor || '#000'}
							textColor={props.textColor || '#fff'}
							backgroundColor={props.backgroundColor ?? '#000'}
							animationSpeed={props.animationSpeed || 'normal'}
							sectionHeight={props.sectionHeight || '100vh'}
							sectionHeightMobile={props.sectionHeightMobile || '100vh'}
						/>

						<!-- 🎯 CURIOSIDADES - NOVO COMPONENTE -->
					{:else if componentType === 'curiosidades'}
						<Curiosidades
							personagens={processCharacters(props.personagens || props.characters || props.lista)}
							shapeColor={props.shapeColor || '#b51207'}
							nameColor={props.nameColor || '#000000'}
							textColor={props.textColor || '#ffffff'}
							backgroundColor={props.backgroundColor ?? '#000000'}
							quoteColor={props.quoteColor || '#ffd700'}
						/>

						<!-- 🆕 TIMELINE INTERACTIVE -->
					{:else if componentType === 'timeline-interactive'}
						<TimelineInteractive
							events={props.events || []}
							theme={props.theme || 'dramatic'}
							autoAdvance={stringToBoolean(props.autoAdvance, false)}
							showProgress={stringToBoolean(props.showProgress, true)}
							height={props.height || '100vh'}
							fullWidth={stringToBoolean(props.fullWidth, false)}
							highlightCurrent={stringToBoolean(props.highlightCurrent, true)}
						/>

						<!-- 🆕 DOCUMENT VIEWER -->
					{:else if componentType === 'document-viewer'}
						<DocumentViewer
							documents={props.documents || []}
							classification={props.classification || 'CONFIDENCIAL'}
							theme={props.theme || 'investigative'}
							showWatermark={stringToBoolean(props.showWatermark, true)}
							highlightAreas={props.highlightAreas || []}
							allowDownload={stringToBoolean(props.allowDownload, false)}
							showThumbnails={stringToBoolean(props.showThumbnails, true)}
						/>

						<!-- 🆕 CRIME EXPLAINER -->
					{:else if componentType === 'crime-explainer'}
						<CrimeExplainer
							crimes={props.crimes || []}
							theme={props.theme || 'judicial'}
							interactive={stringToBoolean(props.interactive, true)}
							showPenalties={stringToBoolean(props.showPenalties, true)}
							layout={props.layout || 'cards'}
							autoAdvance={stringToBoolean(props.autoAdvance, false)}
						/>

						<!-- 📊 CHART BAR -->
					{:else if componentType === 'chart-bar'}
						<ChartBar
							title={props.title}
							titleTag={props.titleTag}
							titleColor={props.titleColor}
							description={props.description}
							descriptionColor={props.descriptionColor}
							notes={props.notes}
							noteColor={props.noteColor}
							footnote={props.footnote}
							footnoteColor={props.footnoteColor}
							sourceLabel={props.sourceLabel || props.source}
							sourceUrl={props.sourceUrl}
							sourceColor={props.sourceColor}
							csvData={props.csvData || props.csv || props.dataCsv || ''}
							csvUrl={props.csvUrl || props.dataUrl}
							sheetId={props.sheetId}
							sheetGid={props.sheetGid}
							autoRefreshMinutes={props.autoRefreshMinutes}
							labelKey={props.labelKey}
							valueKey={props.valueKey}
							data={props.data}
							barColor={props.barColor || props.color || '#0ea5e9'}
							highlightColor={props.highlightColor}
							highlights={props.highlights}
							dimOpacity={props.dimOpacity}
							annotations={props.annotations}
							annotationColor={props.annotationColor}
							tooltipEnabled={stringToBoolean(props.tooltipEnabled, true)}
							valueLabelsMode={props.valueLabelsMode}
							valueLabelColor={props.valueLabelColor}
							height={props.height ?? 400}
							showGrid={stringToBoolean(props.showGrid, true)}
							yTicks={props.yTicks ?? 4}
							margin={props.margin}
							enableTransitions={stringToBoolean(props.enableTransitions, true)}
							animationDuration={props.animationDuration}
							animationDelay={props.animationDelay}
						/>

						<!-- 📈 CHART LINE -->
					{:else if componentType === 'chart-line'}
						<ChartLine
							title={props.title}
							titleTag={props.titleTag}
							titleColor={props.titleColor}
							description={props.description}
							descriptionColor={props.descriptionColor}
							notes={props.notes}
							noteColor={props.noteColor}
							footnote={props.footnote}
							footnoteColor={props.footnoteColor}
							sourceLabel={props.sourceLabel || props.source}
							sourceUrl={props.sourceUrl}
							sourceColor={props.sourceColor}
							csvData={props.csvData || props.csv || ''}
							csvUrl={props.csvUrl || props.dataUrl}
							sheetId={props.sheetId}
							sheetGid={props.sheetGid}
							autoRefreshMinutes={props.autoRefreshMinutes}
							xKey={props.xKey || 'date'}
							yKey={props.yKey || 'value'}
							yLowKey={props.yLowKey || 'min'}
							yHighKey={props.yHighKey || 'max'}
							data={props.data}
							backgroundColor={props.backgroundColor}
							fontFamily={props.fontFamily}
							fontSize={props.fontSize}
							lineColor={props.lineColor || '#0ea5e9'}
							lineWidth={props.lineWidth}
							lineOpacity={props.lineOpacity}
							curveType={props.curveType}
							showArea={props.showArea}
							areaColor={props.areaColor}
							areaOpacity={props.areaOpacity}
							gradientStops={props.gradientStops}
							showGrid={props.showGrid}
							showXAxis={props.showXAxis}
							showYAxis={props.showYAxis}
							gridColor={props.gridColor}
							gridDashArray={props.gridDashArray}
							axisColor={props.axisColor}
							axisLineColor={props.axisLineColor}
							pointColor={props.pointColor}
							pointRadius={props.pointRadius}
							pointStroke={props.pointStroke}
							pointStrokeWidth={props.pointStrokeWidth}
							showPoints={props.showPoints}
							pointFocusRadius={props.pointFocusRadius}
							xAxisLabel={props.xAxisLabel}
							yAxisLabel={props.yAxisLabel}
							axisLabelColor={props.axisLabelColor}
							axisLabelFontSize={props.axisLabelFontSize}
							axisLabelOffset={props.axisLabelOffset}
							valueLabels={props.valueLabels}
							valueLabelColor={props.valueLabelColor}
							valueLabelAnchor={props.valueLabelAnchor}
							tooltipEnabled={props.tooltipEnabled}
							tooltipShowOriginalValue={props.tooltipShowOriginalValue}
							tooltipOffsetX={props.tooltipOffsetX}
							tooltipOffsetY={props.tooltipOffsetY}
							enableZoom={props.enableZoom}
							zoomMode={props.zoomMode}
							zoomScaleMin={props.zoomScaleMin}
							zoomScaleMax={props.zoomScaleMax}
							enableCrosshair={props.enableCrosshair}
							enableTransitions={props.enableTransitions}
							animationType={props.animationType}
							animationDuration={props.animationDuration}
							animationEasing={props.animationEasing}
							yDomainPadding={props.yDomainPadding}
							yNice={props.yNice}
							maxXTicks={props.maxXTicks}
							maxYTicks={props.maxYTicks}
							height={props.height ?? 360}
							margin={props.margin}
						/>

						<!-- Flourish Embed -->
					{:else if componentType === 'flourish'}
						<FlourishEmbed
							src={props.src}
							height={props.height && String(props.height).trim() ? props.height : 'auto'}
							width={props.width}
							maxWidth={props.maxWidth}
							heightMobile={props.heightMobile}
							widthMobile={props.widthMobile}
							maxWidthMobile={props.maxWidthMobile}
							caption={props.caption}
							credit={props.credit}
						/>

						<!-- Flourish Scrolly -->
					{:else if componentType === 'flourish-scrolly'}
						<FlourishScrolly
							src={props.src}
							steps={props.steps || []}
							activationMode={props.activationMode || props.advanceMode}
							activationLine={props.activationLine ??
								props.activationRatio ??
								props.activationPoint ??
								props.activationPosition}
							exitLine={props.exitLine ?? props.exitRatio ?? props.exitPoint ?? props.exitPosition}
						/>

						<!-- Anchor Point -->
					{:else if componentType === 'anchor'}
						<AnchorPoint id={props.id} />

						<!-- Fallback para tipos desconhecidos -->
					{:else}
						<div class="unknown-component">
							<p><strong>Componente desconhecido:</strong> {paragraph.type}</p>
							<pre>{JSON.stringify(paragraph, null, 2)}</pre>
						</div>
					{/if}
				</div>
			</section>
		{/each}
	{/if}

	<!-- Renderizar créditos finais se existir -->
	{#if storyData.credits && (storyData.credits.enabled ?? true)}
		<FinalCredits
			title={storyData.credits.title || 'Créditos'}
			groups={storyData.credits.groups || []}
			groupsText={storyData.credits.groupsText || ''}
			sections={storyData.credits.sections || []}
			authors={storyData.credits.authors || []}
			sources={storyData.credits.sources || []}
			additionalGraphics={storyData.credits.additionalGraphics || []}
			editedBy={storyData.credits.editedBy || []}
			notes={storyData.credits.notes || ''}
			backgroundColor={storyData.credits.backgroundColor || ''}
			textColor={storyData.credits.textColor || ''}
			titleColor={storyData.credits.titleColor || ''}
			borderColor={storyData.credits.borderColor || ''}
			backgroundImage={storyData.credits.backgroundImage || ''}
			backgroundImageMobile={storyData.credits.backgroundImageMobile || ''}
			backgroundVideo={storyData.credits.backgroundVideo || ''}
			backgroundVideoMobile={storyData.credits.backgroundVideoMobile || ''}
			backgroundPosition={storyData.credits.backgroundPosition || 'center center'}
			backgroundPositionMobile={storyData.credits.backgroundPositionMobile || ''}
			backgroundSize={storyData.credits.backgroundSize || 'cover'}
			backgroundSizeMobile={storyData.credits.backgroundSizeMobile || ''}
			overlay={storyData.credits.overlay ?? false}
			overlayColor={storyData.credits.overlayColor || 'rgba(0, 0, 0, 0.4)'}
			maxWidth={storyData.credits.maxWidth || '960px'}
			paddingDesktop={storyData.credits.paddingDesktop || '3rem 1.5rem'}
			paddingMobile={storyData.credits.paddingMobile || '2.5rem 1.25rem'}
			customClass={storyData.credits.customClass || ''}
		/>
	{/if}
</article>

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

	.story-content {
		max-width: none;
		width: 100%;
	}

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

	.story-section--with-text-color .section-content,
	.story-section--with-text-color .section-content :global(*) {
		color: inherit;
	}

	.section-content {
		width: var(--section-content-width-desktop, 100%);
		max-width: var(--section-content-max-width-desktop, 800px);
		min-height: var(--section-content-min-height-desktop, auto);
		margin: var(--section-content-margin-desktop, 0 auto);
		padding: var(--section-content-padding-desktop, 0 0rem);
		display: var(--section-content-display, block);
		flex-direction: var(--section-content-flex-direction, column);
		align-items: var(--section-content-align-items, stretch);
		justify-content: var(--section-content-justify-content, flex-start);
		gap: var(--section-content-gap, 0);
	}

	@media (max-width: 768px) {
		.section-content {
			width: var(--section-content-width-mobile, var(--section-content-width-desktop, 100%));
			max-width: var(
				--section-content-max-width-mobile,
				var(--section-content-max-width-desktop, 100%)
			);
			min-height: var(
				--section-content-min-height-mobile,
				var(--section-content-min-height-desktop, auto)
			);
			margin: var(--section-content-margin-mobile, var(--section-content-margin-desktop, 0 auto));
			padding: var(
				--section-content-padding-mobile,
				var(--section-content-padding-desktop, 0 0rem)
			);
			flex-direction: var(
				--section-content-flex-direction-mobile,
				var(--section-content-flex-direction, column)
			);
			align-items: var(
				--section-content-align-items-mobile,
				var(--section-content-align-items, stretch)
			);
			justify-content: var(
				--section-content-justify-content-mobile,
				var(--section-content-justify-content, flex-start)
			);
		}
	}

	.unknown-component {
		background: #f3f4f6;
		border: 2px dashed #9ca3af;
		padding: 2rem;
		margin: 2rem auto;
		max-width: 800px;
		border-radius: 8px;
	}

	.unknown-component pre {
		background: #ffffff;
		padding: 1rem;
		border-radius: 4px;
		overflow-x: auto;
		font-size: 0.875rem;
	}
</style>
