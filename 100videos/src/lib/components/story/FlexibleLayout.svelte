<script>
	export let text = '';
	export let textPosition = 'center';
	export let textAlign = 'center';
	export let backgroundColor = '#000000';
	export let textColor = '#ffffff';
	export let fontSize = '3rem';
	export let fontSizeMobile = '2rem';
	export let minHeight = '100vh';
	export let minHeightMobile = '100vh';
	export let padding = '2rem';
	export let paddingMobile = '1rem';
	export let textZIndex = '10';

	// Imagem 1 (grifo/destaque)
	export let image1Desktop = '';
	export let image1Mobile = '';
	export let image1Width = '300px';
	export let image1Height = 'auto';
	export let image1WidthMobile = '200px';
	export let image1HeightMobile = 'auto';
	export let image1X = '50%';
	export let image1Y = '50%';
	export let image1XMobile = '50%';
	export let image1YMobile = '50%';
	export let image1ZIndex = '5';

	// Imagem 2 (principal/fundo)
	export let image2Desktop = '';
	export let image2Mobile = '';
	export let image2Width = '500px';
	export let image2Height = 'auto';
	export let image2WidthMobile = '300px';
	export let image2HeightMobile = 'auto';
	export let image2X = '20%';
	export let image2Y = '20%';
	export let image2XMobile = '10%';
	export let image2YMobile = '10%';
	export let image2ZIndex = '1';
	export let image2Position = 'left';

	// Lógica para processar o texto
	$: lines = text.split('<br>').map((line) => line.trim());

	// ✅ RESOLVER IMAGENS COM MÚLTIPLOS FALLBACKS
	$: finalImage1Mobile = image1Mobile || image1Desktop || '';
	$: finalImage2Mobile = image2Mobile || image2Desktop || '';

	// ✅ GARANTIR QUE SEMPRE TEMOS UM SRC VÁLIDO
	$: safeSrcImage1 = finalImage1Mobile || image1Desktop || '';
	$: safeSrcImage2 = finalImage2Mobile || image2Desktop || '';

	// Classes para posicionamento
	$: textPositionClass = `text-position-${textPosition}`;
	$: textAlignClass = `text-align-${textAlign}`;
	$: image2PositionClass = `image2-position-${image2Position}`;

	// ✅ FUNÇÃO PARA DETECTAR SE É MOBILE
	function isMobileDevice() {
		if (typeof window === 'undefined') return false;
		return window.innerWidth <= 768;
	}

	// ✅ FUNÇÃO PARA ESCOLHER A MELHOR IMAGEM
	function getBestImageSrc(desktopSrc, mobileSrc) {
		if (!desktopSrc && !mobileSrc) return '';

		// Se estamos no mobile e existe versão mobile, use mobile
		if (isMobileDevice() && mobileSrc) {
			return mobileSrc;
		}

		// Senão, use desktop como fallback
		return desktopSrc || mobileSrc || '';
	}
</script>

<section
	class="flexible-layout"
	style="
    --bg-color: {backgroundColor};
    --min-height: {minHeight};
    --min-height-mobile: {minHeightMobile};
    --padding: {padding};
    --padding-mobile: {paddingMobile};
    --text-color: {textColor};
    --font-size: {fontSize};
    --font-size-mobile: {fontSizeMobile};
    --text-z-index: {textZIndex};
    --image1-width: {image1Width};
    --image1-height: {image1Height};
    --image1-width-mobile: {image1WidthMobile};
    --image1-height-mobile: {image1HeightMobile};
    --image1-x: {image1X};
    --image1-y: {image1Y};
    --image1-x-mobile: {image1XMobile};
    --image1-y-mobile: {image1YMobile};
    --image1-z-index: {image1ZIndex};
    --image2-width: {image2Width};
    --image2-height: {image2Height};
    --image2-width-mobile: {image2WidthMobile};
    --image2-height-mobile: {image2HeightMobile};
    --image2-x: {image2X};
    --image2-y: {image2Y};
    --image2-x-mobile: {image2XMobile};
    --image2-y-mobile: {image2YMobile};
    --image2-z-index: {image2ZIndex};
  "
>
	<!-- ✅ IMAGEM 2 - Principal (fica atrás) -->
	{#if image2Desktop || image2Mobile}
		<div class="image2-container {image2PositionClass}">
			<picture class="image2">
				<!-- ✅ SEMPRE RENDERIZAR SOURCE MOBILE SE EXISTIR -->
				{#if finalImage2Mobile}
					<source media="(max-width: 768px)" srcset={finalImage2Mobile} />
				{/if}

				<!-- ✅ SOURCE DESKTOP -->
				{#if image2Desktop}
					<source media="(min-width: 769px)" srcset={image2Desktop} />
				{/if}

				<!-- ✅ IMG COM MELHOR FALLBACK -->
				<img
					src={safeSrcImage2}
					alt="Imagem principal"
					loading="lazy"
					style="border: 0;"
					on:error={(e) => {
						console.error('❌ Erro ao carregar imagem principal:', e.target.src);
						console.log('🔍 Tentando fallback...');

						// ✅ FALLBACK INTELIGENTE
						if (e.target.src === finalImage2Mobile && image2Desktop) {
							console.log('📱➡️🖥️ Mudando de mobile para desktop');
							e.target.src = image2Desktop;
						} else if (e.target.src === image2Desktop && finalImage2Mobile) {
							console.log('🖥️➡️📱 Mudando de desktop para mobile');
							e.target.src = finalImage2Mobile;
						} else {
							console.log('❌ Nenhum fallback disponível, ocultando imagem');
							e.target.style.display = 'none';
						}
					}}
					on:load={(e) => {
						console.log('✅ Imagem principal carregada:', e.target.src);
					}}
				/>
			</picture>
		</div>
	{/if}

	<!-- TEXTO -->
	<div class="text-container {textPositionClass} {textAlignClass}">
		<div class="text-wrapper">
			<h2 class="title">
				{#each lines as line, i}
					<span class="line">
						{@html line}
					</span>
					{#if i < lines.length - 1}<br />{/if}
				{/each}
			</h2>
		</div>
	</div>

	<!-- ✅ IMAGEM 1 - Grifo/Destaque (fica na frente) -->
	{#if image1Desktop || image1Mobile}
		<div class="image1-container">
			<picture class="image1">
				<!-- ✅ SEMPRE RENDERIZAR SOURCE MOBILE SE EXISTIR -->
				{#if finalImage1Mobile}
					<source media="(max-width: 768px)" srcset={finalImage1Mobile} />
				{/if}

				<!-- ✅ SOURCE DESKTOP -->
				{#if image1Desktop}
					<source media="(min-width: 769px)" srcset={image1Desktop} />
				{/if}

				<!-- ✅ IMG COM MELHOR FALLBACK -->
				<img
					src={safeSrcImage1}
					alt="Destaque decorativo"
					loading="lazy"
					on:error={(e) => {
						console.error('❌ Erro ao carregar grifo:', e.target.src);
						console.log('🔍 Tentando fallback...');

						// ✅ FALLBACK INTELIGENTE
						if (e.target.src === finalImage1Mobile && image1Desktop) {
							console.log('📱➡️🖥️ Mudando de mobile para desktop');
							e.target.src = image1Desktop;
						} else if (e.target.src === image1Desktop && finalImage1Mobile) {
							console.log('🖥️➡️📱 Mudando de desktop para mobile');
							e.target.src = finalImage1Mobile;
						} else {
							console.log('❌ Nenhum fallback disponível, ocultando grifo');
							e.target.style.display = 'none';
						}
					}}
					on:load={(e) => {
						console.log('✅ Grifo carregado:', e.target.src);
					}}
				/>
			</picture>
		</div>
	{/if}
</section>

<style>
	.flexible-layout {
		position: relative;
		width: 100%;
		min-height: var(--min-height);
		background-color: var(--bg-color);
		padding: var(--padding);
		box-sizing: border-box;
		overflow: hidden;
	}

	/* ===== RESPONSIVE ===== */
	@media (max-width: 768px) {
		.flexible-layout {
			min-height: var(--min-height-mobile);
			padding: var(--padding-mobile);
		}
	}

	/* ===== IMAGEM 2 (PRINCIPAL/FUNDO) ===== */
	.image2-container {
		position: absolute;
		width: var(--image2-width);
		height: var(--image2-height);
		left: var(--image2-x);
		top: var(--image2-y);
		z-index: var(--image2-z-index);
		transform: translate(-50%, -50%);
	}

	.image2-container.image2-position-left {
		left: var(--image2-x);
		transform: translate(0, -50%);
	}

	.image2-container.image2-position-right {
		right: var(--image2-x);
		left: auto;
		transform: translate(0, -50%);
	}

	.image2-container.image2-position-center {
		left: 50%;
		transform: translate(-50%, -50%);
	}

	@media (max-width: 768px) {
		.image2-container {
			width: var(--image2-width-mobile);
			height: var(--image2-height-mobile);
			left: var(--image2-x-mobile);
			top: var(--image2-y-mobile);
		}
	}

	.image2 {
		width: 100%;
		height: 100%;
	}

	.image2 img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border: 0;
	}

	/* ===== IMAGEM 1 (GRIFO/DESTAQUE) ===== */
	.image1-container {
		position: absolute;
		width: var(--image1-width);
		height: var(--image1-height);
		left: var(--image1-x);
		top: var(--image1-y);
		z-index: var(--image1-z-index);
		transform: translate(-50%, -50%);
	}

	@media (max-width: 768px) {
		.image1-container {
			width: var(--image1-width-mobile);
			height: var(--image1-height-mobile);
			left: var(--image1-x-mobile);
			top: var(--image1-y-mobile);
		}
	}

	.image1 {
		width: 100%;
		height: 100%;
	}

	.image1 img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		border: 0;
	}

	/* ===== TEXTO ===== */
	.text-container {
		position: absolute;
		z-index: var(--text-z-index);
		color: var(--text-color);
	}

	.text-position-center {
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 80%;
	}

	.text-position-top {
		top: 10%;
		left: 50%;
		transform: translate(-50%, 0);
		width: 80%;
	}

	.text-position-bottom {
		bottom: 10%;
		left: 50%;
		transform: translate(-50%, 0);
		width: 80%;
	}

	.text-position-left {
		top: 50%;
		left: 10%;
		transform: translate(0, -50%);
		width: 40%;
	}

	.text-position-right {
		top: 50%;
		right: 10%;
		transform: translate(0, -50%);
		width: 40%;
	}

	.text-align-center {
		text-align: center;
	}
	.text-align-left {
		text-align: left;
	}
	.text-align-right {
		text-align: right;
	}

	.title {
		font-size: var(--font-size);
		margin: 0;
		line-height: 1.2;
	}

	@media (max-width: 768px) {
		.title {
			font-size: var(--font-size-mobile);
		}
	}

	.line {
		display: inline-block;
	}
</style>
