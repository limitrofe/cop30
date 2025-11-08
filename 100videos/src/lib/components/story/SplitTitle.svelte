<script>
	export let text = '';
	export let imageDesktop = '';
	export let imageMobile = '';
	export let linesToUnderline = [];
	export let underlineDesktop = '';
	export let underlineMobile = '';
	export let underlineWidthDesktop = '100px';
	export let underlineHeightDesktop = '20px';
	export let underlineWidthMobile = '80px';
	export let underlineHeightMobile = '15px';

	// ✅ RESOLVER IMAGENS COM MÚLTIPLOS FALLBACKS
	$: finalImageDesktop = imageDesktop || imageMobile || '';
	$: finalImageMobile = imageMobile || imageDesktop || '';
	$: finalUnderlineDesktop = underlineDesktop || underlineMobile || '';
	$: finalUnderlineMobile = underlineMobile || underlineDesktop || '';

	// ✅ GARANTIR QUE SEMPRE TEMOS UM SRC VÁLIDO
	$: safeSrcImage = finalImageMobile || finalImageDesktop || '';
	$: safeSrcUnderline = finalUnderlineMobile || finalUnderlineDesktop || '';

	// ✅ FUNÇÃO PARA ESCOLHER A MELHOR IMAGEM
	function getBestImageSrc(desktopSrc, mobileSrc) {
		if (!desktopSrc && !mobileSrc) return '';

		if (typeof window !== 'undefined' && window.innerWidth <= 768 && mobileSrc) {
			return mobileSrc;
		}

		return desktopSrc || mobileSrc || '';
	}

	// Processar texto em linhas
	$: lines = text
		.split('<br>')
		.map((line) => line.trim())
		.filter((line) => line.length > 0);
</script>

<!-- Container principal -->
<section class="split-title">
	<!-- ✅ IMAGEM DE FUNDO CORRIGIDA -->
	{#if imageDesktop || imageMobile}
		<div class="background-image">
			<picture>
				<!-- ✅ SEMPRE RENDERIZAR SOURCE MOBILE SE EXISTIR -->
				{#if finalImageMobile}
					<source media="(max-width: 768px)" srcset={finalImageMobile} />
				{/if}

				<!-- ✅ SOURCE DESKTOP -->
				{#if finalImageDesktop}
					<source media="(min-width: 769px)" srcset={finalImageDesktop} />
				{/if}

				<!-- ✅ IMG COM MELHOR FALLBACK -->
				<img
					src={safeSrcImage}
					alt="Imagem de destaque"
					on:error={(e) => {
						console.error('❌ Erro ao carregar imagem de fundo:', e.target.src);
						console.log('🔍 Tentando fallback...');

						// ✅ FALLBACK INTELIGENTE
						if (e.target.src === finalImageMobile && finalImageDesktop) {
							console.log('📱➡️🖥️ Mudando de mobile para desktop');
							e.target.src = finalImageDesktop;
						} else if (e.target.src === finalImageDesktop && finalImageMobile) {
							console.log('🖥️➡️📱 Mudando de desktop para mobile');
							e.target.src = finalImageMobile;
						} else {
							console.log('❌ Nenhum fallback disponível, ocultando imagem');
							e.target.style.display = 'none';
						}
					}}
					on:load={(e) => {
						console.log('✅ Imagem de fundo carregada:', e.target.src);
					}}
				/>
			</picture>
		</div>
	{/if}

	<!-- Texto por cima da imagem -->
	<div class="text-overlay">
		<div class="text-wrapper">
			<h2 class="title">
				{#if text && text.trim()}
					{#each lines as line, i}
						{@const lineNumber = i + 1}
						{@const shouldUnderline = linesToUnderline.includes(lineNumber)}

						<span class="line-container" class:has-underline={shouldUnderline}>
							{@html line}

							<!-- ✅ GRIFO DECORATIVO CORRIGIDO -->
							{#if shouldUnderline && (underlineDesktop || underlineMobile)}
								<picture class="underline-image">
									<!-- ✅ SEMPRE RENDERIZAR SOURCE MOBILE SE EXISTIR -->
									{#if finalUnderlineMobile}
										<source media="(max-width: 768px)" srcset={finalUnderlineMobile} />
									{/if}

									<!-- ✅ SOURCE DESKTOP -->
									{#if finalUnderlineDesktop}
										<source media="(min-width: 769px)" srcset={finalUnderlineDesktop} />
									{/if}

									<!-- ✅ IMG COM MELHOR FALLBACK -->
									<img
										src={safeSrcUnderline}
										alt="Grifo decorativo"
										style="
                      --w-desktop: {underlineWidthDesktop};
                      --h-desktop: {underlineHeightDesktop};
                      --w-mobile: {underlineWidthMobile};
                      --h-mobile: {underlineHeightMobile};
                    "
										on:error={(e) => {
											console.error('❌ Erro ao carregar grifo:', e.target.src);
											console.log('🔍 Tentando fallback...');

											// ✅ FALLBACK INTELIGENTE
											if (e.target.src === finalUnderlineMobile && finalUnderlineDesktop) {
												console.log('📱➡️🖥️ Grifo: Mudando de mobile para desktop');
												e.target.src = finalUnderlineDesktop;
											} else if (e.target.src === finalUnderlineDesktop && finalUnderlineMobile) {
												console.log('🖥️➡️📱 Grifo: Mudando de desktop para mobile');
												e.target.src = finalUnderlineMobile;
											} else {
												console.log('❌ Nenhum fallback disponível para grifo, ocultando');
												e.target.style.display = 'none';
											}
										}}
										on:load={(e) => {
											console.log('✅ Grifo carregado:', e.target.src);
										}}
									/>
								</picture>
							{/if}
						</span>

						{#if i < lines.length - 1}<br />{/if}
					{/each}
				{/if}
			</h2>
		</div>
	</div>
</section>

<style>
	.split-title {
		position: relative;
		width: 100%;
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	/* ===== IMAGEM DE FUNDO ===== */
	.background-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
	}

	.background-image picture {
		width: 100%;
		height: 100%;
	}

	.background-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border: 0;
	}

	/* ===== OVERLAY DE TEXTO ===== */
	.text-overlay {
		position: relative;
		z-index: 10;
		width: 100%;
		max-width: 1200px;
		padding: 2rem;
		box-sizing: border-box;
	}

	.text-wrapper {
		text-align: center;
	}

	.title {
		font-size: 4rem;
		font-weight: bold;
		color: #ffffff;
		margin: 0;
		line-height: 1.2;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
	}

	@media (max-width: 768px) {
		.title {
			font-size: 2.5rem;
		}

		.text-overlay {
			padding: 1rem;
		}
	}

	@media (max-width: 480px) {
		.title {
			font-size: 2rem;
		}
	}

	/* ===== LINHAS DE TEXTO ===== */
	.line-container {
		position: relative;
		display: inline-block;
	}

	.line-container.has-underline {
		position: relative;
	}

	/* ===== GRIFO DECORATIVO ===== */
	.underline-image {
		position: absolute;
		bottom: -10px;
		left: 50%;
		transform: translateX(-50%);
		z-index: -1;
		pointer-events: none;
	}

	.underline-image img {
		width: var(--w-desktop);
		height: var(--h-desktop);
		object-fit: contain;
		border: 0;
	}

	@media (max-width: 768px) {
		.underline-image img {
			width: var(--w-mobile);
			height: var(--h-mobile);
		}

		.underline-image {
			bottom: -5px;
		}
	}

	/* ===== ACESSIBILIDADE ===== */
	@media (prefers-reduced-motion: reduce) {
		.background-image img,
		.underline-image img {
			animation: none;
		}
	}

	/* ===== PERFORMANCE ===== */
	.background-image img,
	.underline-image img {
		will-change: auto;
	}
</style>
