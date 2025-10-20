<!-- SectionWrapper.svelte -->
<script>
	export let id = '';
	export let backgroundImage = '';
	export let backgroundImageMobile = '';
	export let backgroundPosition = 'center';
	export let backgroundPositionMobile = 'center';
	export let overlay = false;
	export let height = '';
	export let heightMobile = '';
	export let padding = '4rem 0';
	export let paddingMobile = '3rem 0';
	export let children = []; // Array de componentes filhos

	// Verificar se realmente tem mídia
	$: hasMedia = !!(backgroundImage || backgroundImageMobile);

	// Styles dinâmicos
	$: desktopStyle = [
		height ? `min-height: ${height}` : '',
		padding ? `padding: ${padding}` : '',
		backgroundImage ? `background-image: url(${backgroundImage})` : '',
		backgroundImage && backgroundPosition ? `background-position: ${backgroundPosition}` : ''
	]
		.filter(Boolean)
		.join('; ');

	$: mobileStyle = [
		heightMobile ? `min-height: ${heightMobile}` : '',
		paddingMobile ? `padding: ${paddingMobile}` : '',
		backgroundImageMobile ? `background-image: url(${backgroundImageMobile})` : '',
		backgroundImageMobile && backgroundPositionMobile
			? `background-position: ${backgroundPositionMobile}`
			: ''
	]
		.filter(Boolean)
		.join('; ');

	// Debug para desenvolvimento
	$: if (import.meta.env.DEV) {
		console.log('🗂️ SectionWrapper Debug:', {
			id,
			hasMedia,
			backgroundImage,
			children: children?.length || 0,
			desktopStyle
		});
	}
</script>

<section class="section-wrapper" class:has-media={hasMedia} style={desktopStyle} {id}>
	{#if backgroundImage}
		<div
			class="section-wrapper__background section-wrapper__background--desktop"
			style="background-image: url({backgroundImage}); background-position: {backgroundPosition};"
		></div>
	{/if}

	{#if backgroundImageMobile}
		<div
			class="section-wrapper__background section-wrapper__background--mobile"
			style="background-image: url({backgroundImageMobile}); background-position: {backgroundPositionMobile};"
		></div>
	{/if}

	{#if overlay && hasMedia}
		<div class="section-wrapper__overlay"></div>
	{/if}

	<div class="section-wrapper__content">
		<slot />

		<!-- Renderizar componentes filhos se passados via prop -->
		{#if children && children.length > 0}
			{#each children as child}
				<!-- Aqui você renderizaria dinamicamente cada componente -->
				<!-- Por agora, só mostra o debug -->
				<div class="debug-child">
					<strong>Debug:</strong>
					{child.type} - {child.text?.substring(0, 50)}...
				</div>
			{/each}
		{/if}
	</div>
</section>

<style>
	.section-wrapper {
		position: relative;
		width: 100%;
		background-color: var(--color-background);
		margin: 0;
		padding: 1rem 0;
	}

	.section-wrapper.has-media {
		background-size: cover;
		background-repeat: no-repeat;
		background-attachment: fixed;
	}

	/* Background Elements */
	.section-wrapper__background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-size: cover;
		background-repeat: no-repeat;
		z-index: 1;
	}

	/* Desktop backgrounds - visíveis apenas no desktop */
	.section-wrapper__background--desktop {
		display: block;
	}

	/* Mobile backgrounds - ocultos no desktop */
	.section-wrapper__background--mobile {
		display: none;
	}

	.section-wrapper__overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		z-index: 2;
	}

	.section-wrapper__content {
		position: relative;
		z-index: 3;
		max-width: 800px;
		margin: 0 auto;
		padding: 0 0rem;
	}

	/* Quando tem background, o texto fica branco */
	.section-wrapper.has-media .section-wrapper__content {
		color: white;
	}

	.section-wrapper.has-media .section-wrapper__content :global(*) {
		color: white;
	}

	.debug-child {
		padding: 1rem;
		margin: 1rem 0;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		font-size: 0.9rem;
	}

	/* ========== MOBILE STYLES ========== */
	@media (max-width: 768px) {
		.section-wrapper {
			padding: 0rem 0;
		}

		/* Mobile backgrounds - visíveis apenas no mobile */
		.section-wrapper__background--mobile {
			display: block;
		}

		/* Desktop backgrounds - ocultos no mobile */
		.section-wrapper__background--desktop {
			display: none;
		}

		.section-wrapper__content {
			padding: 0 1.5rem;
		}

		/* Remove background-attachment fixed no mobile para melhor performance */
		.section-wrapper.has-media {
			background-attachment: scroll;
		}
	}
</style>
