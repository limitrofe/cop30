// src/lib/utils/storyRenderer.js
/**
 * Renderiza componentes de história baseado em dados do ArchieML
 */
export function parseStoryComponents(paragraphs) {
	if (!paragraphs || !Array.isArray(paragraphs)) {
		return [];
	}

	return paragraphs.map((paragraph, index) => {
		const component = { id: `component-${index}` };
		const type = paragraph.type?.toLowerCase().trim();

		switch (type) {
			case 'header':
			case 'titulo-principal':
			case 'tituloprincipal':
			case 'abre':
				component.type = 'header';
				component.title = paragraph.title;
				component.subtitle = paragraph.subtitle;
				component.author = paragraph.author;
				component.publishDate = paragraph.publishDate || paragraph.date;
				component.backgroundImage = paragraph.backgroundImage;
				component.backgroundImageMobile = paragraph.backgroundImageMobile;
				component.backgroundVideo = paragraph.backgroundVideo;
				component.backgroundVideoMobile = paragraph.backgroundVideoMobile;
				component.overlay = paragraph.overlay;
				component.variant = paragraph.variant;
				component.verticalAlign = paragraph.verticalAlign || paragraph.valign || 'top';
				component.horizontalAlign = paragraph.horizontalAlign || paragraph.align || 'left';
				break;

			case 'texto':
			case 'paragrafo':
				component.type = 'text';
				component.variant = paragraph.variant || 'body';
				component.content = paragraph.text;
				break;

			case 'frase':
			case 'citacao':
			case 'quote':
				component.type = 'text';
				component.variant = 'quote';
				component.content = paragraph.text;
				component.author = paragraph.author;
				component.role = paragraph.role;
				break;

			case 'titulo':
			case 'intertitulo':
				component.type = 'section-title';
				component.title = paragraph.text;
				component.subtitle = paragraph.subtitle;
				component.backgroundImage = paragraph.backgroundImage;
				component.backgroundImageMobile = paragraph.backgroundImageMobile;
				component.backgroundColor = paragraph.backgroundColor; // ✅ NOVO
				component.textColor = paragraph.textColor; // ✅ NOVO
				component.fontFamily = paragraph.fontFamily || 'obviously'; // ✅ NOVO
				component.variant = paragraph.variant || 'default';
				component.size = paragraph.size || 'medium';
				component.overlay = paragraph.overlay;
				break;

			case 'layout-flexivel':
			case 'flexible-layout':
			case 'layout-personalizado':
				component.type = 'flexible-layout';

				// TEXTO
				component.text = paragraph.text || '';
				component.textAlign = paragraph.textAlign || 'left';
				component.textPosition = paragraph.textPosition || 'left';
				component.textColor = paragraph.textColor || '#ffffff';
				component.fontSize = paragraph.fontSize || 'clamp(2rem, 5vw, 4rem)';
				component.fontSizeMobile = paragraph.fontSizeMobile || 'clamp(1.5rem, 8vw, 2.5rem)';
				component.textZIndex = paragraph.textZIndex || 2;

				// IMAGEM 1 - Grifo/Destaque
				component.image1Desktop = paragraph.image1Desktop || '';
				component.image1Mobile = paragraph.image1Mobile || '';
				component.image1Width = paragraph.image1Width || '200px';
				component.image1Height = paragraph.image1Height || '20px';
				component.image1WidthMobile = paragraph.image1WidthMobile || '150px';
				component.image1HeightMobile = paragraph.image1HeightMobile || '15px';
				component.image1X = paragraph.image1X || '0px';
				component.image1Y = paragraph.image1Y || '0px';
				component.image1XMobile = paragraph.image1XMobile || '0px';
				component.image1YMobile = paragraph.image1YMobile || '0px';
				component.image1ZIndex = paragraph.image1ZIndex || 3;

				// IMAGEM 2 - Principal
				component.image2Desktop = paragraph.image2Desktop || '';
				component.image2Mobile = paragraph.image2Mobile || '';
				component.image2Width = paragraph.image2Width || '400px';
				component.image2Height = paragraph.image2Height || '500px';
				component.image2WidthMobile = paragraph.image2WidthMobile || '300px';
				component.image2HeightMobile = paragraph.image2HeightMobile || '400px';
				component.image2Position = paragraph.image2Position || 'right';
				component.image2X = paragraph.image2X || '0px';
				component.image2Y = paragraph.image2Y || '0px';
				component.image2XMobile = paragraph.image2XMobile || '0px';
				component.image2YMobile = paragraph.image2YMobile || '0px';
				component.image2ZIndex = paragraph.image2ZIndex || 1;

				// LAYOUT
				component.backgroundColor = paragraph.backgroundColor ?? '#1a1a1a';
				component.minHeight = paragraph.minHeight || '80vh';
				component.minHeightMobile = paragraph.minHeightMobile || '70vh';
				component.padding = paragraph.padding || '2rem';
				component.paddingMobile = paragraph.paddingMobile || '1.5rem';
				break;

			// 🎨 NOVO: ResponsiveMediaLayout
			case 'responsive-media':
			case 'responsivemedia':
			case 'responsive-layout':
			case 'media-layout':
				component.type = 'responsive-media';
				component.heightDesktop = paragraph.heightDesktop || paragraph.height || '100vh';
				component.heightMobile = paragraph.heightMobile || paragraph.height || '100vh';
				component.backgroundType = paragraph.backgroundType || 'color';
				component.backgroundColor = paragraph.backgroundColor ?? '#000000';
				component.backgroundImageDesktop =
					paragraph.backgroundImageDesktop || paragraph.backgroundImage || '';
				component.backgroundImageMobile =
					paragraph.backgroundImageMobile || paragraph.backgroundImage || '';
				component.backgroundPositionDesktop =
					paragraph.backgroundPositionDesktop || paragraph.backgroundPosition || 'center center';
				component.backgroundPositionMobile =
					paragraph.backgroundPositionMobile || paragraph.backgroundPosition || 'center center';
				component.backgroundSizeDesktop =
					paragraph.backgroundSizeDesktop || paragraph.backgroundSize || 'cover';
				component.backgroundSizeMobile =
					paragraph.backgroundSizeMobile || paragraph.backgroundSize || 'cover';
				component.backgroundVideoDesktop =
					paragraph.backgroundVideoDesktop || paragraph.backgroundVideo || '';
				component.backgroundVideoMobile =
					paragraph.backgroundVideoMobile || paragraph.backgroundVideo || '';
				component.textos = paragraph.textos || paragraph.texts || [];
				component.imagens = paragraph.imagens || paragraph.images || [];
				component.maxWidthDesktop = paragraph.maxWidthDesktop;
				component.maxWidthMobile = paragraph.maxWidthMobile;
				component.widthDesktop = paragraph.widthDesktop;
				component.widthMobile = paragraph.widthMobile;
				component.containerWidth = paragraph.containerWidth;
				component.containerWidthDesktop = paragraph.containerWidthDesktop;
				component.containerWidthMobile = paragraph.containerWidthMobile;
				component.containerMaxWidth = paragraph.containerMaxWidth;
				component.containerMaxWidthDesktop = paragraph.containerMaxWidthDesktop;
				component.containerMaxWidthMobile = paragraph.containerMaxWidthMobile;
				component.containerMinHeight = paragraph.containerMinHeight;
				component.containerMinHeightDesktop = paragraph.containerMinHeightDesktop;
				component.containerMinHeightMobile = paragraph.containerMinHeightMobile;
				component.horizontalPosition = paragraph.horizontalPosition;
				component.verticalPosition = paragraph.verticalPosition;
				component.whiteSpaceDesktop = paragraph.whiteSpaceDesktop;
				component.whiteSpaceMobile = paragraph.whiteSpaceMobile;
				break;

			case 'media-text':
			case 'media_text':
			case 'media-copy':
			case 'media-text-layout':
			case 'duas-colunas':
			case 'media-columns':
				component.type = 'media-text';

				// Media definitions
				const media = paragraph.media || {};
				component.mediaType = paragraph.mediaType || media.type || 'image';
				component.mediaSrc = paragraph.mediaSrc || media.src || media.url || '';
				component.mediaSrcDesktop =
					paragraph.mediaSrcDesktop || media.srcDesktop || media.desktop || component.mediaSrc;
				component.mediaSrcMobile =
					paragraph.mediaSrcMobile || media.srcMobile || media.mobile || component.mediaSrcDesktop;
				component.mediaAlt = paragraph.mediaAlt || media.alt || media.description || '';
				component.mediaPoster = paragraph.mediaPoster || media.poster || '';
				component.mediaAutoplay =
					paragraph.mediaAutoplay ??
					media.autoplay ??
					media.autoPlay ??
					component.mediaType === 'video';
				component.mediaLoop = paragraph.mediaLoop ?? media.loop ?? true;
				component.mediaMuted = paragraph.mediaMuted ?? media.muted ?? true;
				component.mediaControls = paragraph.mediaControls ?? media.controls ?? false;
				component.mediaPlaysInline = paragraph.mediaPlaysInline ?? media.playsInline ?? true;
				component.mediaAspectRatio =
					paragraph.mediaAspectRatio || media.aspectRatio || paragraph.aspectRatio || '16 / 9';
				component.mediaBackground =
					paragraph.mediaBackground ||
					media.background ||
					paragraph.backgroundColor ||
					'transparent';
				component.mediaBorderRadius =
					paragraph.mediaBorderRadius || media.borderRadius || paragraph.borderRadius || '0.75rem';
				component.mediaHeightDesktop =
					paragraph.mediaHeightDesktop ||
					paragraph.mediaHeight ||
					media.heightDesktop ||
					media.mediaHeightDesktop ||
					'';
				component.mediaHeightMobile =
					paragraph.mediaHeightMobile ||
					media.heightMobile ||
					paragraph.mediaHeight ||
					media.mediaHeightMobile ||
					'';
				component.mediaOrderMobile = paragraph.mediaOrderMobile || media.mediaOrderMobile || 'auto';
				component.mediaPadding = paragraph.mediaPadding || media.padding || '0';
				component.mediaCaption = paragraph.mediaCaption || paragraph.caption || media.caption || '';
				component.mediaCredit = paragraph.mediaCredit || paragraph.credit || media.credit || '';
				component.mediaClass = paragraph.mediaClass || '';

				component.media = {
					type: component.mediaType,
					src: component.mediaSrc,
					srcDesktop: component.mediaSrcDesktop,
					srcMobile: component.mediaSrcMobile,
					alt: component.mediaAlt,
					poster: component.mediaPoster,
					autoplay: component.mediaAutoplay,
					loop: component.mediaLoop,
					muted: component.mediaMuted,
					controls: component.mediaControls,
					playsInline: component.mediaPlaysInline,
					aspectRatio: component.mediaAspectRatio,
					background: component.mediaBackground,
					borderRadius: component.mediaBorderRadius,
					heightDesktop: component.mediaHeightDesktop,
					heightMobile: component.mediaHeightMobile,
					mediaOrderMobile: component.mediaOrderMobile,
					padding: component.mediaPadding,
					caption: component.mediaCaption,
					credit: component.mediaCredit
				};

				const globoPlayer = paragraph.globoPlayer ||
					media.globoPlayer || {
						videoId: paragraph.videoId || paragraph.globoVideoId,
						videoIdDesktop: paragraph.videoIdDesktop || paragraph.globoVideoIdDesktop,
						videoIdMobile: paragraph.videoIdMobile || paragraph.globoVideoIdMobile
					};

				component.globoPlayer = globoPlayer;

				// Textual content
				component.pretitle = paragraph.pretitle || paragraph.overline || paragraph.kicker || '';
				component.title = paragraph.title || media.title || '';
				component.subtitle = paragraph.subtitle || media.subtitle || '';
				component.text = paragraph.text || paragraph.content || media.text || '';
				component.blockquote =
					paragraph.blockquote || paragraph.quote || media.blockquote || media.quote || '';
				component.blockquoteAuthor =
					paragraph.blockquoteAuthor ||
					paragraph.quoteAuthor ||
					media.blockquoteAuthor ||
					media.quoteAuthor ||
					'';
				component.blockquoteRole =
					paragraph.blockquoteRole ||
					paragraph.quoteRole ||
					media.blockquoteRole ||
					media.quoteRole ||
					'';
				component.textOrder = paragraph.textOrder ||
					media.textOrder || ['pretitle', 'title', 'subtitle', 'text', 'blockquote'];
				component.textAlign = paragraph.textAlign || media.textAlign || 'left';
				component.textColor = paragraph.textColor || media.textColor || '';
				component.textSpacing = paragraph.textSpacing || media.textSpacing || '1.25rem';
				component.textMaxWidth =
					paragraph.textMaxWidth || media.textMaxWidth || paragraph.maxWidth || '560px';

				// Layout
				component.mediaPosition =
					paragraph.mediaPosition || paragraph.layout || media.position || 'left';
				component.verticalAlign =
					paragraph.verticalAlign || paragraph.align || media.verticalAlign || 'center';
				component.gapDesktop =
					paragraph.gapDesktop || paragraph.gap || media.gapDesktop || '2.5rem';
				component.gapMobile = paragraph.gapMobile || media.gapMobile || paragraph.gap || '1.5rem';
				component.backgroundColor =
					paragraph.backgroundColor ||
					media.backgroundColor ||
					paragraph.sectionBackground ||
					'transparent';
				component.paddingDesktop =
					paragraph.paddingDesktop || paragraph.padding || media.paddingDesktop || '3rem 0';
				component.paddingMobile =
					paragraph.paddingMobile || media.paddingMobile || paragraph.padding || '2rem 1rem';
				component.containerWidth = paragraph.containerWidth || media.containerWidth || '100%';
				component.containerMaxWidth =
					paragraph.containerMaxWidth || paragraph.maxWidth || media.containerMaxWidth || '1200px';
				component.mediaWidthDesktop =
					paragraph.mediaWidthDesktop ||
					paragraph.mediaWidth ||
					media.widthDesktop ||
					media.mediaWidthDesktop ||
					'minmax(0, 48%)';
				component.textWidthDesktop =
					paragraph.textWidthDesktop ||
					paragraph.textWidth ||
					media.textWidthDesktop ||
					'minmax(0, 52%)';
				component.mediaWidthMobile =
					paragraph.mediaWidthMobile || media.mediaWidthMobile || paragraph.mediaWidth || '100%';
				component.textWidthMobile =
					paragraph.textWidthMobile || media.textWidthMobile || paragraph.textWidth || '100%';
				component.fullWidthOnMobile =
					paragraph.fullWidthOnMobile ?? media.fullWidthOnMobile ?? false;
				component.shadow = paragraph.shadow || media.shadow || '';
				break;

			case 'free-canvas':
			case 'canvas-livre':
				component.type = 'free-canvas';
				component.widthDesktop = Number(paragraph.widthDesktop) || 1200;
				component.heightDesktop = Number(paragraph.heightDesktop) || 600;
				component.widthMobile = Number(paragraph.widthMobile) || 375;
				component.heightMobile = Number(paragraph.heightMobile) || 600;
				component.backgroundColor = paragraph.backgroundColor ?? '#000000';
				component.items = paragraph.items || paragraph.elements || [];
				break;

			case 'foto':
			case 'imagem':
				component.type = 'photo';
				component.src = paragraph.src || paragraph.url;
				component.alt = paragraph.alt;
				component.caption = paragraph.caption;
				component.credit = paragraph.credit;
				component.fullWidth = paragraph.fullWidth;
				component.alignment = paragraph.alignment || 'center';
				break;

			case 'video':
			case 'mp4':
				component.type = 'video';
				component.src = paragraph.src;
				component.poster = paragraph.poster;
				component.fullWidth = paragraph.fullWidth;
				component.autoplay = paragraph.autoplay;
				component.controls = paragraph.controls !== false;
				component.loop = paragraph.loop;
				component.showCaption = paragraph.showCaption !== false;
				component.caption = paragraph.caption;
				component.credit = paragraph.credit;
				break;

			case 'globovideo':
			case 'globo-video':
			case 'globoplayer':
			case 'globo-player':
			case 'globo':
				component.type = 'globo-player';
				component.videoId = paragraph.videoId;
				component.videosIDs = paragraph.videosIDs;
				component.fullWidth = paragraph.fullWidth;
				component.autoplay = paragraph.autoplay;
				component.startMuted = paragraph.startMuted;
				component.skipDFP = paragraph.skipDFP;
				component.chromeless = paragraph.chromeless;
				component.showCaption = paragraph.showCaption !== false;
				component.caption = paragraph.caption;
				component.credit = paragraph.credit;
				break;

			case 'galeria':
			case 'gallery':
				component.type = 'gallery';
				component.images = paragraph.images || [];
				component.layout = paragraph.layout || 'grid';
				component.columns = paragraph.columns || 3;
				component.lightbox = paragraph.lightbox;
				break;

			case 'globoplayer-carousel':
			case 'globoplay-carousel':
			case 'globoplayer-carrossel':
			case 'globoplay-carrossel':
			case 'globo-carousel':
			case 'globo-carrossel':
			case 'carrossel-globoplay':
			case 'carousel-globoplay':
				component.type = 'globoplayer-carousel';
				component.videos = paragraph.videos || paragraph.items || [];
				component.autoplay = paragraph.autoplay !== false;
				component.interval = paragraph.interval || 6000;
				component.showDots = paragraph.showDots !== false;
				component.showArrows = paragraph.showArrows !== false;
				component.audioButtonBackground = paragraph.audioButtonBackground;
				component.audioButtonHoverBackground = paragraph.audioButtonHoverBackground;
				component.audioButtonTextColor = paragraph.audioButtonTextColor;
				component.fallbackTitlePrefix =
					paragraph.fallbackTitlePrefix || paragraph.fallbackTituloPrefixo;
				break;

			case 'globoplayer-grid-slider':
			case 'globoplay-grid-slider':
			case 'globoplayer-grid':
			case 'globoplay-grid':
			case 'grade-globoplay':
			case 'grid-globoplay':
				component.type = 'globoplayer-grid-slider';
				component.slides = paragraph.slides || [];
				component.showArrows = paragraph.showArrows !== false;
				component.showDots = paragraph.showDots !== false;
				component.enableDrag = paragraph.enableDrag !== false;
				component.gapDesktop = paragraph.gapDesktop;
				component.gapMobile = paragraph.gapMobile;
				component.paddingDesktop = paragraph.paddingDesktop;
				component.paddingMobile = paragraph.paddingMobile;
				component.backgroundColor = paragraph.backgroundColor;
				component.borderRadius = paragraph.borderRadius;
				component.tabletBreakpoint = paragraph.tabletBreakpoint;
				component.mobileBreakpoint = paragraph.mobileBreakpoint;
				break;

			case 'carrossel':
			case 'carousel':
				component.type = 'carousel';
				component.items = paragraph.items || [];
				component.autoplay = paragraph.autoplay;
				component.interval = paragraph.interval;
				component.showDots = paragraph.showDots;
				component.showArrows = paragraph.showArrows;
				break;

			// 🆕 NOVO: Itens Recomendados
			case 'recomendados':
			case 'recommended':
			case 'recommended-items':
			case 'itens-recomendados':
			case 'relacionados':
			case 'conteudos-relacionados':
				component.type = 'recommended-items';
				component.items = processRecommendedItems(paragraph.items || paragraph.itens || []);
				component.title = paragraph.title || paragraph.titulo || 'conteúdos relacionados';
				component.layout = paragraph.layout || 'grid';
				component.columns = parseInt(paragraph.columns || paragraph.colunas) || 5;
				component.showTitle = paragraph.showTitle !== false && paragraph.mostrarTitulo !== false;
				component.backgroundColor = paragraph.backgroundColor ?? paragraph.corFundo ?? '#000000';
				component.titleColor = paragraph.titleColor || paragraph.corTitulo || '#ff0000';
				component.textColor = paragraph.textColor || paragraph.corTexto || '#ffffff';
				break;

			case 'parallax':
				component.type = 'parallax';
				component.image = paragraph.image;
				component.imageMobile = paragraph.imageMobile; // ✅ NOVO CAMPO
				component.content = paragraph.content;
				component.height = paragraph.height || '80vh';
				component.speed = paragraph.speed || 0.5;
				component.overlay = paragraph.overlay;
				component.backgroundPosition = paragraph.backgroundPosition;
				component.backgroundPositionMobile = paragraph.backgroundPositionMobile;
				component.backgroundSize = paragraph.backgroundSize;
				component.backgroundSizeMobile = paragraph.backgroundSizeMobile;
				component.backgroundBaseColor = paragraph.backgroundBaseColor;
				component.backgroundBaseImage = paragraph.backgroundBaseImage;
				component.backgroundBaseImageMobile = paragraph.backgroundBaseImageMobile;
				component.backgroundBasePosition = paragraph.backgroundBasePosition;
				component.backgroundBasePositionMobile = paragraph.backgroundBasePositionMobile;
				component.backgroundBaseSize = paragraph.backgroundBaseSize;
				component.backgroundBaseSizeMobile = paragraph.backgroundBaseSizeMobile;
				break;

			case 'antes-depois':
			case 'before-after':
				component.type = 'before-after';
				component.beforeImage = paragraph.beforeImage;
				component.beforeImageMobile = paragraph.beforeImageMobile || paragraph.beforeImage;
				component.beforeCaption = paragraph.beforeCaption;
				component.beforeCredit = paragraph.beforeCredit;
				component.afterImage = paragraph.afterImage;
				component.afterImageMobile = paragraph.afterImageMobile || paragraph.afterImage;
				component.afterCaption = paragraph.afterCaption;
				component.afterCredit = paragraph.afterCredit;
				component.beforeLabel = paragraph.beforeLabel || 'Antes';
				component.afterLabel = paragraph.afterLabel || 'Depois';
				component.orientation = paragraph.orientation || 'vertical';
				component.width = paragraph.width || paragraph.largura || '100%';
				component.widthMobile = paragraph.widthMobile || paragraph.larguraMobile;
				component.maxWidth = paragraph.maxWidth || paragraph.larguraMaxima;
				component.maxWidthMobile = paragraph.maxWidthMobile || paragraph.larguraMaximaMobile;
				break;

			case 'scrollytelling':
			case 'scrolly':
				component.type = 'scrolly';
				component.steps = paragraph.steps || [];
				component.fullWidth = paragraph.fullWidth;
				break;

			// VideoScrollytelling NOVO - ScrollyFrames
			case 'videoscrollytelling':
			case 'video-scrollytelling':
			case 'videoscrolly':
			case 'video-scrolly':
				component.type = 'video-scrolly-new';

				// URLs dos frames
				component.imagePrefix = paragraph.imagePrefix || '';
				component.imagePrefixMobile = paragraph.imagePrefixMobile || paragraph.imagePrefix || '';
				component.imageSuffix = paragraph.imageSuffix || '.jpg';
				component.imageSuffixMobile = paragraph.imageSuffixMobile || '.webp';

				// Configurações de frames
				component.totalFrames = parseInt(paragraph.totalFrames) || 100;
				component.frameStart = parseInt(paragraph.frameStart) || 1;
				component.frameStop = parseInt(paragraph.frameStop) || component.totalFrames;

				// Configurações de vídeo (fallback/legacy)
				component.videoSrc = paragraph.videoSrc || paragraph.src;
				component.videoSrcMobile = paragraph.videoSrcMobile || paragraph.srcMobile;
				component.frameStartSeconds = parseFloat(paragraph.frameStartSeconds) || 0;
				component.frameStopSeconds = parseFloat(paragraph.frameStopSeconds) || 10;

				// Configurações de performance
				component.preloadFrames = parseInt(paragraph.preloadFrames) || 10;
				component.maxMemoryMB = parseInt(paragraph.maxMemoryMB) || 50;
				component.scrollSmoothness = parseFloat(paragraph.scrollSmoothness) || 0.05;
				component.frameRate = parseInt(paragraph.frameRate) || 30;

				// Configurações de UI
				component.height = paragraph.height || '100vh';
				component.showProgress = paragraph.showProgress !== false;
				component.showTime = paragraph.showTime !== false;
				component.showFrameCounter = paragraph.showFrameCounter || false;
				component.showControls = paragraph.showControls || false;

				// Configurações avançadas
				component.smoothTransition = paragraph.smoothTransition !== false;
				component.lazyLoading = paragraph.lazyLoading !== false;
				component.bufferSize = parseInt(paragraph.bufferSize) || 20;
				component.fallbackFrames = paragraph.fallbackFrames || [];
				component.posterImage = paragraph.posterImage;

				// Steps para scrollytelling
				component.steps = paragraph.steps || [];

				// Layout
				component.fullWidth = paragraph.fullWidth !== false;
				component.variant = paragraph.variant || 'default';
				break;

			// 🎬 APRESENTAÇÃO DE PERSONAGENS (existente)
			case 'personagens':
			case 'characters':
			case 'character-presentation':
			case 'apresentacao-personagens':
				component.type = 'character-presentation';
				component.personagens =
					paragraph.personagens || paragraph.characters || paragraph.lista || [];
				component.shapeColor = paragraph.shapeColor || '#DC2626';
				component.nameColor = paragraph.nameColor || '#000';
				component.textColor = paragraph.textColor || '#fff';
				component.backgroundColor = paragraph.backgroundColor ?? '#000';
				component.animationSpeed = paragraph.animationSpeed || 'normal';
				component.sectionHeight = paragraph.sectionHeight || '100vh';
				component.sectionHeightMobile = paragraph.sectionHeightMobile || '100vh';
				break;

			// 🎯 CURIOSIDADES - NOVO COMPONENTE ADICIONADO
			case 'curiosidades':
			case 'trivia':
			case 'facts':
			case 'apresentacao-curiosidades':
				component.type = 'curiosidades';
				component.personagens =
					paragraph.personagens || paragraph.characters || paragraph.lista || [];
				component.shapeColor = paragraph.shapeColor || '#b51207';
				component.nameColor = paragraph.nameColor || '#000000';
				component.textColor = paragraph.textColor || '#ffffff';
				component.backgroundColor = paragraph.backgroundColor ?? '#000000';
				component.quoteColor = paragraph.quoteColor || '#ffd700';
				break;

			case 'flourish':
			case 'grafico':
			case 'mapa':
				component.type = 'flourish';
				component.src = paragraph.src;
				component.height = paragraph.height || 'auto';
				component.heightMobile = paragraph.heightMobile || 'auto';
				component.width = paragraph.width || '100%';
				component.widthMobile = paragraph.widthMobile || '100%';
				component.maxWidth = paragraph.maxWidth || '800px';
				component.maxWidthMobile = paragraph.maxWidthMobile || '100%';
				component.caption = paragraph.caption;
				component.credit = paragraph.credit;
				break;

			case 'flourish-scrolly':
				component.type = 'flourish-scrolly';
				component.src = paragraph.src;
				component.steps = paragraph.steps || [];
				break;

			case 'ancora':
			case 'anchor':
				component.type = 'anchor';
				component.anchorId = paragraph.id || paragraph.name || `anchor-${index}`;
				component.id = component.anchorId;
				break;

			default:
				component.type = 'text';
				component.variant = paragraph.variant || 'body';
				component.content = paragraph.text;
				break;
		}

		return component;
	});
}

/**
 * Detecta se um componente é um VideoScrollytelling
 */
export function isVideoScrollyComponent(paragraph) {
	if (!paragraph || !paragraph.type) return false;

	const type = paragraph.type.toLowerCase().trim();

	return ['videoscrollytelling', 'video-scrollytelling', 'videoscrolly', 'video-scrolly'].includes(
		type
	);
}

/**
 * 🎯 NOVO: Detecta se um componente é de Curiosidades
 */
export function isCuriosidadesComponent(paragraph) {
	if (!paragraph || !paragraph.type) return false;

	const type = paragraph.type.toLowerCase().trim();

	return ['curiosidades', 'trivia', 'facts', 'apresentacao-curiosidades'].includes(type);
}

/**
 * 🎬 NOVO: Detecta se um componente é de Apresentação de Personagens
 */
export function isCharacterPresentationComponent(paragraph) {
	if (!paragraph || !paragraph.type) return false;

	const type = paragraph.type.toLowerCase().trim();

	return [
		'personagens',
		'characters',
		'character-presentation',
		'apresentacao-personagens'
	].includes(type);
}

/**
 * 🆕 NOVO: Detecta se um componente é de Itens Recomendados
 */
export function isRecommendedItemsComponent(paragraph) {
	if (!paragraph || !paragraph.type) return false;

	const type = paragraph.type.toLowerCase().trim();

	return [
		'recomendados',
		'recommended',
		'recommended-items',
		'itens-recomendados',
		'relacionados',
		'conteudos-relacionados'
	].includes(type);
}

/**
 * 🎨 NOVO: Detecta se um componente é ResponsiveMediaLayout
 */
export function isResponsiveMediaComponent(paragraph) {
	if (!paragraph || !paragraph.type) return false;

	const type = paragraph.type.toLowerCase().trim();

	return ['responsive-media', 'responsivemedia', 'responsive-layout', 'media-layout'].includes(
		type
	);
}

/**
 * Valida se um componente VideoScrolly tem configuração completa
 */
export function validateVideoScrollyComponent(component) {
	const errors = [];
	const warnings = [];

	// Verificar URLs dos frames
	if (!component.imagePrefix) {
		errors.push('imagePrefix é obrigatório');
	}

	if (!component.imagePrefixMobile && !component.imagePrefix) {
		warnings.push('imagePrefixMobile não definido, usando imagePrefix');
	}

	// Verificar totalFrames
	if (!component.totalFrames || component.totalFrames < 1) {
		errors.push('totalFrames deve ser maior que 0');
	}

	// Verificar frameStart/Stop
	if (component.frameStart < 1) {
		warnings.push('frameStart deve ser >= 1');
	}

	if (component.frameStop > component.totalFrames) {
		warnings.push('frameStop maior que totalFrames');
	}

	// Verificar extensões
	if (!component.imageSuffix) {
		warnings.push('imageSuffix não definido, usando .jpg');
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings
	};
}

/**
 * 🎯 NOVO: Valida se um componente de Curiosidades tem configuração completa
 */
export function validateCuriosidadesComponent(component) {
	const errors = [];
	const warnings = [];

	// Verificar se tem lista de curiosidades
	if (!component.personagens || !Array.isArray(component.personagens)) {
		errors.push('Lista de curiosidades é obrigatória');
	} else if (component.personagens.length === 0) {
		errors.push('Lista de curiosidades está vazia');
	} else {
		// Verificar cada curiosidade
		component.personagens.forEach((curiosidade, index) => {
			if (!curiosidade.nome && !curiosidade.name) {
				errors.push(`Curiosidade ${index + 1}: nome é obrigatório`);
			}

			if (
				!curiosidade.descricao &&
				!curiosidade.description &&
				!curiosidade.frase &&
				!curiosidade.quote &&
				!curiosidade.phrase
			) {
				warnings.push(`Curiosidade ${index + 1}: sem descrição nem frase`);
			}
		});
	}

	// Verificar cores (opcional, mas deve ser formato válido se fornecido)
	const colorFields = ['shapeColor', 'nameColor', 'textColor', 'backgroundColor', 'quoteColor'];
	colorFields.forEach((field) => {
		if (component[field] && !component[field].match(/^#[0-9A-Fa-f]{6}$/)) {
			warnings.push(`${field} deve estar no formato #RRGGBB`);
		}
	});

	return {
		isValid: errors.length === 0,
		errors,
		warnings
	};
}

/**
 * 🎬 NOVO: Valida se um componente de Personagens tem configuração completa
 */
export function validateCharacterPresentationComponent(component) {
	const errors = [];
	const warnings = [];

	// Verificar se tem lista de personagens
	if (!component.personagens || !Array.isArray(component.personagens)) {
		errors.push('Lista de personagens é obrigatória');
	} else if (component.personagens.length === 0) {
		errors.push('Lista de personagens está vazia');
	} else {
		// Verificar cada personagem
		component.personagens.forEach((personagem, index) => {
			if (!personagem.nome && !personagem.name) {
				errors.push(`Personagem ${index + 1}: nome é obrigatório`);
			}

			if (!personagem.descricao && !personagem.description) {
				warnings.push(`Personagem ${index + 1}: sem descrição`);
			}

			if (!personagem.foto && !personagem.photo && !personagem.image) {
				warnings.push(`Personagem ${index + 1}: sem foto`);
			}
		});
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings
	};
}

/**
 * 🆕 NOVO: Valida se um componente de Itens Recomendados tem configuração completa
 */
export function validateRecommendedItemsComponent(component) {
	const errors = [];
	const warnings = [];

	// Verificar se tem lista de itens
	if (!component.items || !Array.isArray(component.items)) {
		errors.push('Lista de itens é obrigatória');
	} else if (component.items.length === 0) {
		errors.push('Lista de itens está vazia');
	} else {
		// Verificar cada item
		component.items.forEach((item, index) => {
			if (!item.title) {
				errors.push(`Item ${index + 1}: título é obrigatório`);
			}

			if (!item.image) {
				errors.push(`Item ${index + 1}: imagem é obrigatória`);
			}

			if (!item.link && !item.url) {
				warnings.push(`Item ${index + 1}: sem link para navegação`);
			}
		});
	}

	// Verificar layout
	if (component.layout && !['grid', 'carousel'].includes(component.layout)) {
		warnings.push('Layout deve ser "grid" ou "carousel"');
	}

	// Verificar colunas para layout grid
	if (component.layout === 'grid' && (component.columns < 1 || component.columns > 6)) {
		warnings.push('Número de colunas deve estar entre 1 e 6');
	}

	// Verificar cores (opcional, mas deve ser formato válido se fornecido)
	const colorFields = ['backgroundColor', 'titleColor', 'textColor'];
	colorFields.forEach((field) => {
		if (component[field] && !component[field].match(/^#[0-9A-Fa-f]{6}$/)) {
			warnings.push(`${field} deve estar no formato #RRGGBB`);
		}
	});

	return {
		isValid: errors.length === 0,
		errors,
		warnings
	};
}

/**
 * 🎨 NOVO: Valida se um componente ResponsiveMediaLayout tem configuração completa
 */
export function validateResponsiveMediaComponent(component) {
	const errors = [];
	const warnings = [];

	// Verificar se tem conteúdo
	if (
		(!component.textos || component.textos.length === 0) &&
		(!component.imagens || component.imagens.length === 0)
	) {
		errors.push('Componente não tem textos nem imagens');
	}

	// Verificar textos
	if (component.textos && component.textos.length > 0) {
		component.textos.forEach((texto, index) => {
			if (!texto.content && !texto.texto) {
				errors.push(`Texto ${index + 1}: conteúdo vazio`);
			}
			if (!texto.position?.desktop?.x && !texto.xDesktop) {
				warnings.push(`Texto ${index + 1}: posição X não definida para desktop`);
			}
			if (!texto.position?.mobile?.x && !texto.xMobile) {
				warnings.push(`Texto ${index + 1}: posição X não definida para mobile`);
			}
		});
	}

	// Verificar imagens
	if (component.imagens && component.imagens.length > 0) {
		component.imagens.forEach((imagem, index) => {
			if (!imagem.srcDesktop && !imagem.src) {
				errors.push(`Imagem ${index + 1}: sem src para desktop`);
			}
			if (!imagem.srcMobile && !imagem.src) {
				warnings.push(`Imagem ${index + 1}: sem src específico para mobile`);
			}
		});
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings
	};
}

/**
 * Gera configuração padrão para VideoScrolly
 */
export function generateVideoScrollyDefaults(baseConfig = {}) {
	return {
		type: 'video-scrolly-new',
		imagePrefix: baseConfig.imagePrefix || '',
		imagePrefixMobile: baseConfig.imagePrefixMobile || baseConfig.imagePrefix || '',
		imageSuffix: baseConfig.imageSuffix || '.jpg',
		imageSuffixMobile: baseConfig.imageSuffixMobile || '.webp',
		totalFrames: parseInt(baseConfig.totalFrames) || 100,
		frameStart: parseInt(baseConfig.frameStart) || 1,
		frameStop: parseInt(baseConfig.frameStop) || parseInt(baseConfig.totalFrames) || 100,
		height: baseConfig.height || '100vh',
		showProgress: baseConfig.showProgress !== false,
		showTime: baseConfig.showTime !== false,
		showFrameCounter: baseConfig.showFrameCounter || false,
		preloadFrames: parseInt(baseConfig.preloadFrames) || 10,
		maxMemoryMB: parseInt(baseConfig.maxMemoryMB) || 50,
		scrollSmoothness: parseFloat(baseConfig.scrollSmoothness) || 0.05,
		smoothTransition: baseConfig.smoothTransition !== false,
		lazyLoading: baseConfig.lazyLoading !== false,
		fullWidth: baseConfig.fullWidth !== false,
		...baseConfig
	};
}

/**
 * 🎯 NOVO: Gera configuração padrão para Curiosidades
 */
export function generateCuriosidadesDefaults(baseConfig = {}) {
	return {
		type: 'curiosidades',
		personagens: baseConfig.personagens || baseConfig.characters || baseConfig.lista || [],
		shapeColor: baseConfig.shapeColor || '#b51207',
		nameColor: baseConfig.nameColor || '#000000',
		textColor: baseConfig.textColor || '#ffffff',
		backgroundColor: baseConfig.backgroundColor ?? '#000000',
		quoteColor: baseConfig.quoteColor || '#ffd700',
		...baseConfig
	};
}

/**
 * 🎬 NOVO: Gera configuração padrão para Apresentação de Personagens
 */
export function generateCharacterPresentationDefaults(baseConfig = {}) {
	return {
		type: 'character-presentation',
		personagens: baseConfig.personagens || baseConfig.characters || baseConfig.lista || [],
		shapeColor: baseConfig.shapeColor || '#DC2626',
		nameColor: baseConfig.nameColor || '#000',
		textColor: baseConfig.textColor || '#fff',
		backgroundColor: baseConfig.backgroundColor ?? '#000',
		animationSpeed: baseConfig.animationSpeed || 'normal',
		sectionHeight: baseConfig.sectionHeight || '100vh',
		sectionHeightMobile: baseConfig.sectionHeightMobile || '100vh',
		...baseConfig
	};
}

/**
 * 🆕 NOVO: Gera configuração padrão para Itens Recomendados
 */
export function generateRecommendedItemsDefaults(baseConfig = {}) {
	return {
		type: 'recommended-items',
		items: baseConfig.items || baseConfig.itens || [],
		title: baseConfig.title || baseConfig.titulo || 'conteúdos relacionados',
		layout: baseConfig.layout || 'grid',
		columns: parseInt(baseConfig.columns || baseConfig.colunas) || 5,
		showTitle: baseConfig.showTitle !== false && baseConfig.mostrarTitulo !== false,
		backgroundColor: baseConfig.backgroundColor ?? baseConfig.corFundo ?? '#000000',
		titleColor: baseConfig.titleColor || baseConfig.corTitulo || '#ff0000',
		textColor: baseConfig.textColor || baseConfig.corTexto || '#ffffff',
		...baseConfig
	};
}

/**
 * 🎨 NOVO: Gera configuração padrão para ResponsiveMediaLayout
 */
export function generateResponsiveMediaDefaults(baseConfig = {}) {
	return {
		type: 'responsive-media',
		heightDesktop: baseConfig.heightDesktop || baseConfig.height || '100vh',
		heightMobile: baseConfig.heightMobile || baseConfig.height || '100vh',
		backgroundType: baseConfig.backgroundType || 'color',
		backgroundColor: baseConfig.backgroundColor ?? '#000000',
		backgroundImageDesktop: baseConfig.backgroundImageDesktop || baseConfig.backgroundImage || '',
		backgroundImageMobile: baseConfig.backgroundImageMobile || baseConfig.backgroundImage || '',
		backgroundPositionDesktop:
			baseConfig.backgroundPositionDesktop || baseConfig.backgroundPosition || 'center center',
		backgroundPositionMobile:
			baseConfig.backgroundPositionMobile || baseConfig.backgroundPosition || 'center center',
		backgroundSizeDesktop: baseConfig.backgroundSizeDesktop || baseConfig.backgroundSize || 'cover',
		backgroundSizeMobile: baseConfig.backgroundSizeMobile || baseConfig.backgroundSize || 'cover',
		backgroundVideoDesktop: baseConfig.backgroundVideoDesktop || baseConfig.backgroundVideo || '',
		backgroundVideoMobile: baseConfig.backgroundVideoMobile || baseConfig.backgroundVideo || '',
		textos: baseConfig.textos || baseConfig.texts || [],
		imagens: baseConfig.imagens || baseConfig.images || [],
		...baseConfig
	};
}

/**
 * Converte string para boolean de forma inteligente
 */
export function parseBoolean(value, defaultValue = false) {
	if (typeof value === 'boolean') return value;
	if (typeof value === 'string') {
		const lower = value.toLowerCase().trim();
		return lower === 'true' || lower === '1' || lower === 'yes' || lower === 'sim';
	}
	if (typeof value === 'number') {
		return value !== 0;
	}
	return defaultValue;
}

/**
 * Converte string para número de forma segura
 */
export function parseNumber(value, defaultValue = 0) {
	const num = parseFloat(value);
	return isNaN(num) ? defaultValue : num;
}

/**
 * Converte string para inteiro de forma segura
 */
export function parseInteger(value, defaultValue = 0) {
	const num = parseInt(value);
	return isNaN(num) ? defaultValue : num;
}

/**
 * Limpa e normaliza texto
 */
export function cleanText(text) {
	if (!text) return '';

	return text
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/p>/gi, '\n')
		.replace(/<p[^>]*>/gi, '')
		.replace(/<[^>]*>/g, '')
		.replace(/\n\s*\n/g, '\n\n')
		.trim();
}

/**
 * Gera ID único para componente
 */
export function generateComponentId(type, index) {
	return `${type}-${index}-${Date.now()}`;
}

/**
 * 🎯 NOVO: Processa dados de personagens/curiosidades para padronizar formato
 */
export function processCharactersData(characters) {
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
			descricao: char.descricao || char.description || char.texto || '',
			frase: char.frase || char.quote || char.phrase || '' // ✅ NOVO CAMPO
		}));
	}

	return [];
}

/**
 * 🆕 NOVO: Processa dados de itens recomendados para padronizar formato
 */
export function processRecommendedItems(items) {
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
		return items
			.map((item) => {
				// Se o item for uma string, tenta fazer parse do JSON
				if (typeof item === 'string') {
					try {
						item = JSON.parse(item);
					} catch {
						return null;
					}
				}

				// Se não for objeto, retorna null
				if (!item || typeof item !== 'object') return null;

				return {
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
				};
			})
			.filter(Boolean); // Remove itens nulos
	}

	return [];
}

/**
 * Processa dados de um documento completo
 */
export function processStoryData(rawData) {
	if (!rawData) return null;

	const processed = {
		title: rawData.title || '',
		subtitle: rawData.subtitle || rawData.intro || '',
		author: rawData.author || '',
		publishDate: rawData.publishDate || rawData.date || '',
		backgroundImage: rawData.backgroundImage || '',
		backgroundImageMobile: rawData.backgroundImageMobile || '',
		credits: rawData.credits || '',
		paragraphs: []
	};

	// Processar parágrafos
	if (rawData.paragraphs && Array.isArray(rawData.paragraphs)) {
		processed.paragraphs = parseStoryComponents(rawData.paragraphs);
	}

	return processed;
}

/**
 * Debug: Logs informações sobre componentes VideoScrolly
 */
export function debugVideoScrollyComponents(paragraphs) {
	if (!paragraphs || !Array.isArray(paragraphs)) return;

	const videoScrollyComponents = paragraphs.filter((p) => isVideoScrollyComponent(p));

	if (videoScrollyComponents.length === 0) {
		console.log('🎬 Nenhum componente VideoScrolly encontrado');
		return;
	}

	console.log(`🎬 ${videoScrollyComponents.length} componente(s) VideoScrolly encontrado(s):`);

	videoScrollyComponents.forEach((comp, index) => {
		const validation = validateVideoScrollyComponent(comp);
		const status = validation.isValid ? '✅' : '⚠️';

		console.log(`  ${status} Componente ${index + 1}:`);
		console.log(`     Tipo: ${comp.type}`);
		console.log(`     Frames: ${comp.totalFrames || 'N/A'}`);
		console.log(`     Desktop: ${comp.imagePrefix ? '✅' : '❌'}`);
		console.log(`     Mobile: ${comp.imagePrefixMobile ? '✅' : '❌'}`);

		if (validation.errors.length > 0) {
			console.log(`     ❌ Erros: ${validation.errors.join(', ')}`);
		}

		if (validation.warnings.length > 0) {
			console.log(`     ⚠️ Avisos: ${validation.warnings.join(', ')}`);
		}
	});
}

/**
 * 🎯 NOVO: Debug para componentes de Curiosidades
 */
export function debugCuriosidadesComponents(paragraphs) {
	if (!paragraphs || !Array.isArray(paragraphs)) return;

	const curiosidadesComponents = paragraphs.filter((p) => isCuriosidadesComponent(p));

	if (curiosidadesComponents.length === 0) {
		console.log('🎯 Nenhum componente de Curiosidades encontrado');
		return;
	}

	console.log(`🎯 ${curiosidadesComponents.length} componente(s) de Curiosidades encontrado(s):`);

	curiosidadesComponents.forEach((comp, index) => {
		const validation = validateCuriosidadesComponent(comp);
		const status = validation.isValid ? '✅' : '⚠️';
		const charCount = comp.personagens?.length || 0;

		console.log(`  ${status} Componente ${index + 1}:`);
		console.log(`     Tipo: ${comp.type}`);
		console.log(`     Curiosidades: ${charCount}`);
		console.log(`     ShapeColor: ${comp.shapeColor}`);
		console.log(`     QuoteColor: ${comp.quoteColor}`);

		if (charCount > 0) {
			comp.personagens.forEach((curiosidade, charIndex) => {
				const temFrase = !!(curiosidade.frase || curiosidade.quote || curiosidade.phrase);
				const temFoto = !!(curiosidade.foto || curiosidade.photo || curiosidade.image);
				console.log(
					`     Curiosidade ${charIndex + 1}: "${curiosidade.nome || curiosidade.name}" | Foto: ${temFoto ? '✅' : '❌'} | Frase: ${temFrase ? '✅' : '❌'}`
				);
			});
		}

		if (validation.errors.length > 0) {
			console.log(`     ❌ Erros: ${validation.errors.join(', ')}`);
		}

		if (validation.warnings.length > 0) {
			console.log(`     ⚠️ Avisos: ${validation.warnings.join(', ')}`);
		}
	});
}

/**
 * 🎬 NOVO: Debug para componentes de Apresentação de Personagens
 */
export function debugCharacterPresentationComponents(paragraphs) {
	if (!paragraphs || !Array.isArray(paragraphs)) return;

	const characterComponents = paragraphs.filter((p) => isCharacterPresentationComponent(p));

	if (characterComponents.length === 0) {
		console.log('🎬 Nenhum componente de Apresentação de Personagens encontrado');
		return;
	}

	console.log(
		`🎬 ${characterComponents.length} componente(s) de Apresentação de Personagens encontrado(s):`
	);

	characterComponents.forEach((comp, index) => {
		const validation = validateCharacterPresentationComponent(comp);
		const status = validation.isValid ? '✅' : '⚠️';
		const charCount = comp.personagens?.length || 0;

		console.log(`  ${status} Componente ${index + 1}:`);
		console.log(`     Tipo: ${comp.type}`);
		console.log(`     Personagens: ${charCount}`);
		console.log(`     ShapeColor: ${comp.shapeColor}`);

		if (charCount > 0) {
			comp.personagens.forEach((personagem, charIndex) => {
				const temFoto = !!(personagem.foto || personagem.photo || personagem.image);
				const temDescricao = !!(personagem.descricao || personagem.description);
				console.log(
					`     Personagem ${charIndex + 1}: "${personagem.nome || personagem.name}" | Foto: ${temFoto ? '✅' : '❌'} | Descrição: ${temDescricao ? '✅' : '❌'}`
				);
			});
		}

		if (validation.errors.length > 0) {
			console.log(`     ❌ Erros: ${validation.errors.join(', ')}`);
		}

		if (validation.warnings.length > 0) {
			console.log(`     ⚠️ Avisos: ${validation.warnings.join(', ')}`);
		}
	});
}

/**
 * 🆕 NOVO: Debug para componentes de Itens Recomendados
 */
export function debugRecommendedItemsComponents(paragraphs) {
	if (!paragraphs || !Array.isArray(paragraphs)) return;

	const recommendedComponents = paragraphs.filter((p) => isRecommendedItemsComponent(p));

	if (recommendedComponents.length === 0) {
		console.log('🎯 Nenhum componente de Itens Recomendados encontrado');
		return;
	}

	console.log(
		`🎯 ${recommendedComponents.length} componente(s) de Itens Recomendados encontrado(s):`
	);

	recommendedComponents.forEach((comp, index) => {
		const validation = validateRecommendedItemsComponent(comp);
		const status = validation.isValid ? '✅' : '⚠️';
		const itemsCount = comp.items?.length || 0;

		console.log(`  ${status} Componente ${index + 1}:`);
		console.log(`     Tipo: ${comp.type}`);
		console.log(`     Items: ${itemsCount}`);
		console.log(`     Layout: ${comp.layout}`);
		console.log(`     Columns: ${comp.columns}`);
		console.log(`     Title: "${comp.title}"`);
		console.log(`     Colors: BG=${comp.backgroundColor} | Title=${comp.titleColor}`);

		if (itemsCount > 0) {
			comp.items.forEach((item, itemIndex) => {
				const temImagem = !!item.image;
				const temLink = !!item.link;
				const category = item.category || '';
				const isNew = item.isNew || false;
				console.log(
					`     Item ${itemIndex + 1}: "${item.title}" | Image: ${temImagem ? '✅' : '❌'} | Link: ${temLink ? '✅' : '❌'} | Category: ${category} | New: ${isNew}`
				);
			});
		}

		if (validation.errors.length > 0) {
			console.log(`     ❌ Erros: ${validation.errors.join(', ')}`);
		}

		if (validation.warnings.length > 0) {
			console.log(`     ⚠️ Avisos: ${validation.warnings.join(', ')}`);
		}
	});
}

/**
 * 🎨 NOVO: Debug para componentes ResponsiveMediaLayout
 */
export function debugResponsiveMediaComponents(paragraphs) {
	if (!paragraphs || !Array.isArray(paragraphs)) return;

	const responsiveMediaComponents = paragraphs.filter((p) => isResponsiveMediaComponent(p));

	if (responsiveMediaComponents.length === 0) {
		console.log('🎨 Nenhum componente ResponsiveMediaLayout encontrado');
		return;
	}

	console.log(
		`🎨 ${responsiveMediaComponents.length} componente(s) ResponsiveMediaLayout encontrado(s):`
	);

	responsiveMediaComponents.forEach((comp, index) => {
		const validation = validateResponsiveMediaComponent(comp);
		const status = validation.isValid ? '✅' : '⚠️';
		const textosCount = comp.textos?.length || 0;
		const imagensCount = comp.imagens?.length || 0;

		console.log(`  ${status} Componente ${index + 1}:`);
		console.log(`     Tipo: ${comp.type}`);
		console.log(`     Textos: ${textosCount}`);
		console.log(`     Imagens: ${imagensCount}`);
		console.log(`     Background: ${comp.backgroundType}`);
		console.log(`     Height: ${comp.heightDesktop}/${comp.heightMobile}`);

		if (textosCount > 0) {
			comp.textos.forEach((texto, textoIndex) => {
				const content = (texto.content || texto.texto || '').substring(0, 30);
				const hasPosition = !!(texto.xDesktop || texto.position?.desktop?.x);
				const fontFamily = texto.fontFamily || texto.familia || 'inherit';
				const fontSize = texto.fontSizeDesktop || texto.fontSize?.desktop || '2rem';
				console.log(
					`     Texto ${textoIndex + 1}: "${content}..." | Font: ${fontFamily}/${fontSize} | HasPosition: ${hasPosition}`
				);
			});
		}

		if (imagensCount > 0) {
			comp.imagens.forEach((imagem, imagemIndex) => {
				const hasSrcDesktop = !!(imagem.srcDesktop || imagem.src);
				const hasSrcMobile = !!imagem.srcMobile;
				const hasPosition = !!(imagem.xDesktop || imagem.position?.desktop?.x);
				const width = imagem.widthDesktop || imagem.width?.desktop || 'auto';
				console.log(
					`     Imagem ${imagemIndex + 1}: Desktop: ${hasSrcDesktop} | Mobile: ${hasSrcMobile} | Width: ${width} | HasPosition: ${hasPosition}`
				);
			});
		}

		if (validation.errors.length > 0) {
			console.log(`     ❌ Erros: ${validation.errors.join(', ')}`);
		}

		if (validation.warnings.length > 0) {
			console.log(`     ⚠️ Avisos: ${validation.warnings.join(', ')}`);
		}
	});
}

/**
 * 🎯 NOVO: Debug unificado para todos os componentes de apresentação
 */
export function debugPresentationComponents(paragraphs) {
	debugCharacterPresentationComponents(paragraphs);
	debugCuriosidadesComponents(paragraphs);
	debugRecommendedItemsComponents(paragraphs);
	debugResponsiveMediaComponents(paragraphs);
}

export default {
	parseStoryComponents,
	isVideoScrollyComponent,
	isCuriosidadesComponent,
	isCharacterPresentationComponent,
	isRecommendedItemsComponent,
	isResponsiveMediaComponent,
	validateVideoScrollyComponent,
	validateCuriosidadesComponent,
	validateCharacterPresentationComponent,
	validateRecommendedItemsComponent,
	validateResponsiveMediaComponent,
	generateVideoScrollyDefaults,
	generateCuriosidadesDefaults,
	generateCharacterPresentationDefaults,
	generateRecommendedItemsDefaults,
	generateResponsiveMediaDefaults,
	parseBoolean,
	parseNumber,
	parseInteger,
	cleanText,
	generateComponentId,
	processCharactersData,
	processRecommendedItems,
	processStoryData,
	debugVideoScrollyComponents,
	debugCuriosidadesComponents,
	debugCharacterPresentationComponents,
	debugRecommendedItemsComponents,
	debugResponsiveMediaComponents,
	debugPresentationComponents
};
