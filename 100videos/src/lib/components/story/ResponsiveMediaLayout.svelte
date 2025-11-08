<script>
	export let textos = [];
	export let imagens = [];
	export let backgroundType = 'color';
	export let backgroundColor = '#000000';
	export let backgroundImageDesktop = '';
	export let backgroundImageMobile = '';
	export let backgroundVideoDesktop = '';
	export let backgroundVideoMobile = '';
	export let heightDesktop = '100vh';
	export let heightMobile = '100vh';

	// ✅ FUNÇÃO PARA OBTER VALOR RESPONSIVO
	function getResponsiveValue(value, device = 'desktop') {
		if (!value) return '';
		if (typeof value === 'string') return value;
		if (typeof value === 'object') {
			return value[device] || value.desktop || '';
		}
		return '';
	}

	// ✅ FUNÇÃO PARA RESOLVER SRC DE IMAGEM COM FALLBACKS
	function getImageSrc(imagem, preferMobile = false) {
		const desktop = imagem.srcDesktop || imagem.src || '';
		const mobile = imagem.srcMobile || '';

		if (preferMobile && mobile) return mobile;
		return desktop || mobile || '';
	}

	// ✅ FUNÇÃO PARA ESCOLHER MELHOR IMAGEM BASEADA NA TELA
	function getBestImageSrc(desktop, mobile) {
		if (typeof window === 'undefined') return desktop || mobile || '';

		const isMobile = window.innerWidth <= 768;

		if (isMobile && mobile) return mobile;
		return desktop || mobile || '';
	}

	// ✅ STYLES PARA CONTAINER
	$: containerStyle = `
    --bg-color: ${backgroundColor};
    --bg-image-desktop: ${backgroundImageDesktop ? `url(${backgroundImageDesktop})` : 'none'};
    --bg-image-mobile: ${backgroundImageMobile ? `url(${backgroundImageMobile})` : 'none'};
    --height-desktop: ${heightDesktop};
    --height-mobile: ${heightMobile};
    ${getTextsStyles()}
    ${getImagesStyles()}
  `;

	// ✅ GERAR ESTILOS PARA TEXTOS
	function getTextsStyles() {
		return textos
			.map((texto, index) => {
				const desktop = {
					fontSize:
						getResponsiveValue(texto.fontSize, 'desktop') ||
						getResponsiveValue(texto.fontSizeDesktop) ||
						'2rem',
					fontWeight:
						getResponsiveValue(texto.fontWeight, 'desktop') ||
						getResponsiveValue(texto.fontWeightDesktop) ||
						'normal',
					lineHeight:
						getResponsiveValue(texto.lineHeight, 'desktop') ||
						getResponsiveValue(texto.lineHeightDesktop) ||
						'1.4',
					textAlign:
						getResponsiveValue(texto.textAlign, 'desktop') ||
						getResponsiveValue(texto.textAlignDesktop) ||
						'left',
					letterSpacing:
						getResponsiveValue(texto.letterSpacing, 'desktop') ||
						getResponsiveValue(texto.letterSpacingDesktop) ||
						'0px',
					left: getResponsiveValue(texto.position, 'desktop')?.x || texto.xDesktop || '0',
					top: getResponsiveValue(texto.position, 'desktop')?.y || texto.yDesktop || '0',
					zIndex: getResponsiveValue(texto.position, 'desktop')?.z || texto.zDesktop || '1',
					transform:
						getResponsiveValue(texto.transform, 'desktop') || texto.transformDesktop || 'none',
					width: getResponsiveValue(texto.width, 'desktop') || texto.widthDesktop || 'auto',
					maxWidth:
						getResponsiveValue(texto.maxWidth, 'desktop') || texto.maxWidthDesktop || 'none',
					minWidth: getResponsiveValue(texto.minWidth, 'desktop') || texto.minWidthDesktop || '0'
				};

				const mobile = {
					fontSize:
						getResponsiveValue(texto.fontSize, 'mobile') ||
						getResponsiveValue(texto.fontSizeMobile) ||
						desktop.fontSize,
					fontWeight:
						getResponsiveValue(texto.fontWeight, 'mobile') ||
						getResponsiveValue(texto.fontWeightMobile) ||
						desktop.fontWeight,
					lineHeight:
						getResponsiveValue(texto.lineHeight, 'mobile') ||
						getResponsiveValue(texto.lineHeightMobile) ||
						desktop.lineHeight,
					textAlign:
						getResponsiveValue(texto.textAlign, 'mobile') ||
						getResponsiveValue(texto.textAlignMobile) ||
						desktop.textAlign,
					letterSpacing:
						getResponsiveValue(texto.letterSpacing, 'mobile') ||
						getResponsiveValue(texto.letterSpacingMobile) ||
						desktop.letterSpacing,
					left: getResponsiveValue(texto.position, 'mobile')?.x || texto.xMobile || desktop.left,
					top: getResponsiveValue(texto.position, 'mobile')?.y || texto.yMobile || desktop.top,
					zIndex:
						getResponsiveValue(texto.position, 'mobile')?.z || texto.zMobile || desktop.zIndex,
					transform:
						getResponsiveValue(texto.transform, 'mobile') ||
						texto.transformMobile ||
						desktop.transform,
					width: getResponsiveValue(texto.width, 'mobile') || texto.widthMobile || desktop.width,
					maxWidth:
						getResponsiveValue(texto.maxWidth, 'mobile') ||
						texto.maxWidthMobile ||
						desktop.maxWidth,
					minWidth:
						getResponsiveValue(texto.minWidth, 'mobile') || texto.minWidthMobile || desktop.minWidth
				};

				return `
        --text-${index}-font-size-desktop: ${desktop.fontSize};
        --text-${index}-font-weight-desktop: ${desktop.fontWeight};
        --text-${index}-line-height-desktop: ${desktop.lineHeight};
        --text-${index}-text-align-desktop: ${desktop.textAlign};
        --text-${index}-letter-spacing-desktop: ${desktop.letterSpacing};
        --text-${index}-left-desktop: ${desktop.left};
        --text-${index}-top-desktop: ${desktop.top};
        --text-${index}-z-index-desktop: ${desktop.zIndex};
        --text-${index}-transform-desktop: ${desktop.transform};
        --text-${index}-width-desktop: ${desktop.width};
        --text-${index}-max-width-desktop: ${desktop.maxWidth};
        --text-${index}-min-width-desktop: ${desktop.minWidth};
        
        --text-${index}-font-size-mobile: ${mobile.fontSize};
        --text-${index}-font-weight-mobile: ${mobile.fontWeight};
        --text-${index}-line-height-mobile: ${mobile.lineHeight};
        --text-${index}-text-align-mobile: ${mobile.textAlign};
        --text-${index}-letter-spacing-mobile: ${mobile.letterSpacing};
        --text-${index}-left-mobile: ${mobile.left};
        --text-${index}-top-mobile: ${mobile.top};
        --text-${index}-z-index-mobile: ${mobile.zIndex};
        --text-${index}-transform-mobile: ${mobile.transform};
        --text-${index}-width-mobile: ${mobile.width};
        --text-${index}-max-width-mobile: ${mobile.maxWidth};
        --text-${index}-min-width-mobile: ${mobile.minWidth};
      `;
			})
			.join('');
	}

	// ✅ GERAR ESTILOS PARA IMAGENS
	function getImagesStyles() {
		return imagens
			.map((imagem, index) => {
				const desktop = {
					width: getResponsiveValue(imagem.width, 'desktop') || imagem.widthDesktop || 'auto',
					height: getResponsiveValue(imagem.height, 'desktop') || imagem.heightDesktop || 'auto',
					objectFit:
						getResponsiveValue(imagem.objectFit, 'desktop') || imagem.objectFitDesktop || 'cover',
					left: getResponsiveValue(imagem.position, 'desktop')?.x || imagem.xDesktop || '0',
					top: getResponsiveValue(imagem.position, 'desktop')?.y || imagem.yDesktop || '0',
					zIndex: getResponsiveValue(imagem.position, 'desktop')?.z || imagem.zDesktop || '1',
					transform:
						getResponsiveValue(imagem.transform, 'desktop') || imagem.transformDesktop || 'none'
				};

				const mobile = {
					width: getResponsiveValue(imagem.width, 'mobile') || imagem.widthMobile || desktop.width,
					height:
						getResponsiveValue(imagem.height, 'mobile') || imagem.heightMobile || desktop.height,
					objectFit:
						getResponsiveValue(imagem.objectFit, 'mobile') ||
						imagem.objectFitMobile ||
						desktop.objectFit,
					left: getResponsiveValue(imagem.position, 'mobile')?.x || imagem.xMobile || desktop.left,
					top: getResponsiveValue(imagem.position, 'mobile')?.y || imagem.yMobile || desktop.top,
					zIndex:
						getResponsiveValue(imagem.position, 'mobile')?.z || imagem.zMobile || desktop.zIndex,
					transform:
						getResponsiveValue(imagem.transform, 'mobile') ||
						imagem.transformMobile ||
						desktop.transform
				};

				return `
        --img-${index}-width-desktop: ${desktop.width};
        --img-${index}-height-desktop: ${desktop.height};
        --img-${index}-object-fit-desktop: ${desktop.objectFit};
        --img-${index}-left-desktop: ${desktop.left};
        --img-${index}-top-desktop: ${desktop.top};
        --img-${index}-z-index-desktop: ${desktop.zIndex};
        --img-${index}-transform-desktop: ${desktop.transform};
        
        --img-${index}-width-mobile: ${mobile.width};
        --img-${index}-height-mobile: ${mobile.height};
        --img-${index}-object-fit-mobile: ${mobile.objectFit};
        --img-${index}-left-mobile: ${mobile.left};
        --img-${index}-top-mobile: ${mobile.top};
        --img-${index}-z-index-mobile: ${mobile.zIndex};
        --img-${index}-transform-mobile: ${mobile.transform};
      `;
			})
			.join('');
	}
</script>

<section
	class="responsive-layout"
	style={containerStyle}
	class:bg-image={backgroundType === 'image'}
>
	<!-- ✅ BACKGROUND VIDEO CORRIGIDO -->
	{#if backgroundType === 'video' && (backgroundVideoDesktop || backgroundVideoMobile)}
		<div class="background-video">
			<video autoplay loop muted playsinline class="video-element">
				<!-- ✅ SEMPRE RENDERIZAR SOURCE MOBILE SE EXISTIR -->
				{#if backgroundVideoMobile}
					<source src={backgroundVideoMobile} type="video/mp4" media="(max-width: 768px)" />
				{/if}

				<!-- ✅ SOURCE DESKTOP -->
				{#if backgroundVideoDesktop}
					<source src={backgroundVideoDesktop} type="video/mp4" media="(min-width: 769px)" />
				{/if}

				<!-- ✅ FALLBACK COM MELHOR SRC -->
				<source
					src={getBestImageSrc(backgroundVideoDesktop, backgroundVideoMobile)}
					type="video/mp4"
				/>
			</video>
		</div>
	{/if}

	<!-- ✅ TEXTOS -->
	{#each textos as texto, index}
		<div
			class="text-element text-{index}"
			style="
        color: {texto.color || texto.cor || '#ffffff'};
        font-family: {texto.fontFamily || texto.familia || 'inherit'};
      "
		>
			{@html texto.content || texto.texto || ''}
		</div>
	{/each}

	<!-- ✅ IMAGENS CORRIGIDAS -->
	{#each imagens as imagem, index}
		{#if imagem.srcDesktop || imagem.srcMobile || imagem.src}
			<div class="image-element image-{index}">
				<picture>
					<!-- ✅ SEMPRE RENDERIZAR SOURCE MOBILE SE EXISTIR -->
					{#if imagem.srcMobile}
						<source media="(max-width: 768px)" srcset={imagem.srcMobile} />
					{/if}

					<!-- ✅ SOURCE DESKTOP -->
					{#if imagem.srcDesktop || imagem.src}
						<source media="(min-width: 769px)" srcset={imagem.srcDesktop || imagem.src} />
					{/if}

					<!-- ✅ IMG COM MELHOR FALLBACK -->
					<img
						src={getBestImageSrc(imagem.srcDesktop || imagem.src, imagem.srcMobile)}
						alt={imagem.alt || imagem.description || ''}
						class="responsive-image"
						loading="lazy"
						on:error={(e) => {
							console.error(`❌ Erro ao carregar imagem ${index}:`, e.target.src);
							console.log('🔍 Tentando fallback...');

							// ✅ FALLBACK INTELIGENTE
							const desktop = imagem.srcDesktop || imagem.src;
							const mobile = imagem.srcMobile;

							if (e.target.src === mobile && desktop) {
								console.log(`📱➡️🖥️ Imagem ${index}: Mudando de mobile para desktop`);
								e.target.src = desktop;
							} else if (e.target.src === desktop && mobile) {
								console.log(`🖥️➡️📱 Imagem ${index}: Mudando de desktop para mobile`);
								e.target.src = mobile;
							} else {
								console.log(`❌ Imagem ${index}: Nenhum fallback disponível, ocultando`);
								e.target.style.display = 'none';
							}
						}}
						on:load={(e) => {
							console.log(`✅ Imagem ${index} carregada:`, e.target.src);
						}}
					/>
				</picture>
			</div>
		{/if}
	{/each}
</section>

<style>
	/* ===== CONTAINER PRINCIPAL ===== */
	.responsive-layout {
		position: relative;
		width: 100%;
		height: var(--height-desktop);
		background-color: var(--bg-color);
		overflow: hidden;
	}

	/* ✅ BACKGROUND IMAGE RESPONSIVO */
	.responsive-layout.bg-image {
		background-image: var(--bg-image-desktop);
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}

	@media (max-width: 768px) {
		.responsive-layout {
			height: var(--height-mobile);
		}

		.responsive-layout.bg-image {
			background-image: var(--bg-image-mobile);
		}
	}

	/* ===== BACKGROUND VIDEO ===== */
	.background-video {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
	}

	.video-element {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* ===== TEXTOS ===== */
	.text-element {
		position: absolute;
	}

	/* ✅ ESTILOS DINÂMICOS PARA TEXTOS - DESKTOP */
	@media (min-width: 769px) {
		.text-0 {
			font-size: var(--text-0-font-size-desktop);
			font-weight: var(--text-0-font-weight-desktop);
			line-height: var(--text-0-line-height-desktop);
			text-align: var(--text-0-text-align-desktop);
			letter-spacing: var(--text-0-letter-spacing-desktop);
			left: var(--text-0-left-desktop);
			top: var(--text-0-top-desktop);
			z-index: var(--text-0-z-index-desktop);
			transform: var(--text-0-transform-desktop);
			width: var(--text-0-width-desktop);
			max-width: var(--text-0-max-width-desktop);
			min-width: var(--text-0-min-width-desktop);
			word-wrap: break-word;
			overflow-wrap: break-word;
			box-sizing: border-box;
		}

		.text-1 {
			font-size: var(--text-1-font-size-desktop);
			font-weight: var(--text-1-font-weight-desktop);
			line-height: var(--text-1-line-height-desktop);
			text-align: var(--text-1-text-align-desktop);
			letter-spacing: var(--text-1-letter-spacing-desktop);
			left: var(--text-1-left-desktop);
			top: var(--text-1-top-desktop);
			z-index: var(--text-1-z-index-desktop);
			transform: var(--text-1-transform-desktop);
			width: var(--text-1-width-desktop);
			max-width: var(--text-1-max-width-desktop);
			min-width: var(--text-1-min-width-desktop);
			word-wrap: break-word;
			overflow-wrap: break-word;
			box-sizing: border-box;
		}

		.text-2 {
			font-size: var(--text-2-font-size-desktop);
			font-weight: var(--text-2-font-weight-desktop);
			line-height: var(--text-2-line-height-desktop);
			text-align: var(--text-2-text-align-desktop);
			letter-spacing: var(--text-2-letter-spacing-desktop);
			left: var(--text-2-left-desktop);
			top: var(--text-2-top-desktop);
			z-index: var(--text-2-z-index-desktop);
			transform: var(--text-2-transform-desktop);
			width: var(--text-2-width-desktop);
			max-width: var(--text-2-max-width-desktop);
			min-width: var(--text-2-min-width-desktop);
			word-wrap: break-word;
			overflow-wrap: break-word;
			box-sizing: border-box;
		}

		.text-3 {
			font-size: var(--text-3-font-size-desktop);
			font-weight: var(--text-3-font-weight-desktop);
			line-height: var(--text-3-line-height-desktop);
			text-align: var(--text-3-text-align-desktop);
			letter-spacing: var(--text-3-letter-spacing-desktop);
			left: var(--text-3-left-desktop);
			top: var(--text-3-top-desktop);
			z-index: var(--text-3-z-index-desktop);
			transform: var(--text-3-transform-desktop);
			width: var(--text-3-width-desktop);
			max-width: var(--text-3-max-width-desktop);
			min-width: var(--text-3-min-width-desktop);
			word-wrap: break-word;
			overflow-wrap: break-word;
			box-sizing: border-box;
		}

		.text-4 {
			font-size: var(--text-4-font-size-desktop);
			font-weight: var(--text-4-font-weight-desktop);
			line-height: var(--text-4-line-height-desktop);
			text-align: var(--text-4-text-align-desktop);
			letter-spacing: var(--text-4-letter-spacing-desktop);
			left: var(--text-4-left-desktop);
			top: var(--text-4-top-desktop);
			z-index: var(--text-4-z-index-desktop);
			transform: var(--text-4-transform-desktop);
			width: var(--text-4-width-desktop);
			max-width: var(--text-4-max-width-desktop);
			min-width: var(--text-4-min-width-desktop);
			word-wrap: break-word;
			overflow-wrap: break-word;
			box-sizing: border-box;
		}
	}

	/* ✅ ESTILOS DINÂMICOS PARA TEXTOS - MOBILE */
	@media (max-width: 768px) {
		.text-0 {
			font-size: var(--text-0-font-size-mobile);
			font-weight: var(--text-0-font-weight-mobile);
			line-height: var(--text-0-line-height-mobile);
			text-align: var(--text-0-text-align-mobile);
			letter-spacing: var(--text-0-letter-spacing-mobile);
			left: var(--text-0-left-mobile);
			top: var(--text-0-top-mobile);
			z-index: var(--text-0-z-index-mobile);
			transform: var(--text-0-transform-mobile);
			width: var(--text-0-width-mobile);
			max-width: var(--text-0-max-width-mobile);
			min-width: var(--text-0-min-width-mobile);
			word-wrap: break-word;
			overflow-wrap: break-word;
			box-sizing: border-box;
		}

		.text-1 {
			font-size: var(--text-1-font-size-mobile);
			font-weight: var(--text-1-font-weight-mobile);
			line-height: var(--text-1-line-height-mobile);
			text-align: var(--text-1-text-align-mobile);
			letter-spacing: var(--text-1-letter-spacing-mobile);
			left: var(--text-1-left-mobile);
			top: var(--text-1-top-mobile);
			z-index: var(--text-1-z-index-mobile);
			transform: var(--text-1-transform-mobile);
			width: var(--text-1-width-mobile);
			max-width: var(--text-1-max-width-mobile);
			min-width: var(--text-1-min-width-mobile);
			word-wrap: break-word;
			overflow-wrap: break-word;
			box-sizing: border-box;
		}

		.text-2 {
			font-size: var(--text-2-font-size-mobile);
			font-weight: var(--text-2-font-weight-mobile);
			line-height: var(--text-2-line-height-mobile);
			text-align: var(--text-2-text-align-mobile);
			letter-spacing: var(--text-2-letter-spacing-mobile);
			left: var(--text-2-left-mobile);
			top: var(--text-2-top-mobile);
			z-index: var(--text-2-z-index-mobile);
			transform: var(--text-2-transform-mobile);
			width: var(--text-2-width-mobile);
			max-width: var(--text-2-max-width-mobile);
			min-width: var(--text-2-min-width-mobile);
			word-wrap: break-word;
			overflow-wrap: break-word;
			box-sizing: border-box;
		}

		.text-3 {
			font-size: var(--text-3-font-size-mobile);
			font-weight: var(--text-3-font-weight-mobile);
			line-height: var(--text-3-line-height-mobile);
			text-align: var(--text-3-text-align-mobile);
			letter-spacing: var(--text-3-letter-spacing-mobile);
			left: var(--text-3-left-mobile);
			top: var(--text-3-top-mobile);
			z-index: var(--text-3-z-index-mobile);
			transform: var(--text-3-transform-mobile);
			width: var(--text-3-width-mobile);
			max-width: var(--text-3-max-width-mobile);
			min-width: var(--text-3-min-width-mobile);
			word-wrap: break-word;
			overflow-wrap: break-word;
			box-sizing: border-box;
		}

		.text-4 {
			font-size: var(--text-4-font-size-mobile);
			font-weight: var(--text-4-font-weight-mobile);
			line-height: var(--text-4-line-height-mobile);
			text-align: var(--text-4-text-align-mobile);
			letter-spacing: var(--text-4-letter-spacing-mobile);
			left: var(--text-4-left-mobile);
			top: var(--text-4-top-mobile);
			z-index: var(--text-4-z-index-mobile);
			transform: var(--text-4-transform-mobile);
			width: var(--text-4-width-mobile);
			max-width: var(--text-4-max-width-mobile);
			min-width: var(--text-4-min-width-mobile);
			word-wrap: break-word;
			overflow-wrap: break-word;
			box-sizing: border-box;
		}
	}

	/* ===== IMAGENS ===== */
	.image-element {
		position: absolute;
	}

	.responsive-image {
		display: block;
		max-width: none; /* Permite ultrapassar limites do container */
		border: 0;
	}

	/* ✅ ESTILOS DINÂMICOS PARA IMAGENS - DESKTOP */
	@media (min-width: 769px) {
		.image-0 {
			width: var(--img-0-width-desktop);
			height: var(--img-0-height-desktop);
			left: var(--img-0-left-desktop);
			top: var(--img-0-top-desktop);
			z-index: var(--img-0-z-index-desktop);
			transform: var(--img-0-transform-desktop);
		}

		.image-0 .responsive-image {
			object-fit: var(--img-0-object-fit-desktop);
			width: 100%;
			height: 100%;
		}

		.image-1 {
			width: var(--img-1-width-desktop);
			height: var(--img-1-height-desktop);
			left: var(--img-1-left-desktop);
			top: var(--img-1-top-desktop);
			z-index: var(--img-1-z-index-desktop);
			transform: var(--img-1-transform-desktop);
		}

		.image-1 .responsive-image {
			object-fit: var(--img-1-object-fit-desktop);
			width: 100%;
			height: 100%;
		}

		.image-2 {
			width: var(--img-2-width-desktop);
			height: var(--img-2-height-desktop);
			left: var(--img-2-left-desktop);
			top: var(--img-2-top-desktop);
			z-index: var(--img-2-z-index-desktop);
			transform: var(--img-2-transform-desktop);
		}

		.image-2 .responsive-image {
			object-fit: var(--img-2-object-fit-desktop);
			width: 100%;
			height: 100%;
		}

		.image-3 {
			width: var(--img-3-width-desktop);
			height: var(--img-3-height-desktop);
			left: var(--img-3-left-desktop);
			top: var(--img-3-top-desktop);
			z-index: var(--img-3-z-index-desktop);
			transform: var(--img-3-transform-desktop);
		}

		.image-3 .responsive-image {
			object-fit: var(--img-3-object-fit-desktop);
			width: 100%;
			height: 100%;
		}

		.image-4 {
			width: var(--img-4-width-desktop);
			height: var(--img-4-height-desktop);
			left: var(--img-4-left-desktop);
			top: var(--img-4-top-desktop);
			z-index: var(--img-4-z-index-desktop);
			transform: var(--img-4-transform-desktop);
		}

		.image-4 .responsive-image {
			object-fit: var(--img-4-object-fit-desktop);
			width: 100%;
			height: 100%;
		}
	}

	/* ✅ ESTILOS DINÂMICOS PARA IMAGENS - MOBILE */
	@media (max-width: 768px) {
		.image-0 {
			width: var(--img-0-width-mobile);
			height: var(--img-0-height-mobile);
			left: var(--img-0-left-mobile);
			top: var(--img-0-top-mobile);
			z-index: var(--img-0-z-index-mobile);
			transform: var(--img-0-transform-mobile);
		}

		.image-0 .responsive-image {
			object-fit: var(--img-0-object-fit-mobile);
			width: 100%;
			height: 100%;
		}

		.image-1 {
			width: var(--img-1-width-mobile);
			height: var(--img-1-height-mobile);
			left: var(--img-1-left-mobile);
			top: var(--img-1-top-mobile);
			z-index: var(--img-1-z-index-mobile);
			transform: var(--img-1-transform-mobile);
		}

		.image-1 .responsive-image {
			object-fit: var(--img-1-object-fit-mobile);
			width: 100%;
			height: 100%;
		}

		.image-2 {
			width: var(--img-2-width-mobile);
			height: var(--img-2-height-mobile);
			left: var(--img-2-left-mobile);
			top: var(--img-2-top-mobile);
			z-index: var(--img-2-z-index-mobile);
			transform: var(--img-2-transform-mobile);
		}

		.image-2 .responsive-image {
			object-fit: var(--img-2-object-fit-mobile);
			width: 100%;
			height: 100%;
		}

		.image-3 {
			width: var(--img-3-width-mobile);
			height: var(--img-3-height-mobile);
			left: var(--img-3-left-mobile);
			top: var(--img-3-top-mobile);
			z-index: var(--img-3-z-index-mobile);
			transform: var(--img-3-transform-mobile);
		}

		.image-3 .responsive-image {
			object-fit: var(--img-3-object-fit-mobile);
			width: 100%;
			height: 100%;
		}

		.image-4 {
			width: var(--img-4-width-mobile);
			height: var(--img-4-height-mobile);
			left: var(--img-4-left-mobile);
			top: var(--img-4-top-mobile);
			z-index: var(--img-4-z-index-mobile);
			transform: var(--img-4-transform-mobile);
		}

		.image-4 .responsive-image {
			object-fit: var(--img-4-object-fit-mobile);
			width: 100%;
			height: 100%;
		}
	}
</style>
