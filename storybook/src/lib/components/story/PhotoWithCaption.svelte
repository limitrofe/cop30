<script>
	export let src = '';
	export let srcMobile = '';
	export let alt = '';
	export let caption = '';
	export let credit = '';
	export let fullWidth = false;
	export let link = ''; // Nova prop para o link
	export let target = '_self'; // Nova prop para o target do link

	const DEFAULT_WIDTH_DESKTOP = 'min(100%, 800px)';
	const DEFAULT_WIDTH_MOBILE = '100%';

	export let widthDesktop = DEFAULT_WIDTH_DESKTOP;
	export let widthMobile = DEFAULT_WIDTH_MOBILE;

	// Mantém compatibilidade com versões antigas que usavam apenas `alignment`
	export let alignment = undefined;
	export let alignDesktop = undefined;
	export let alignMobile = undefined;

	const VALID_ALIGNMENTS = ['left', 'center', 'right'];

	function normalizeAlignment(value, fallback = 'center') {
		if (typeof value !== 'string') {
			return fallback;
		}
		const normalized = value.trim().toLowerCase();
		return VALID_ALIGNMENTS.includes(normalized) ? normalized : fallback;
	}

	function normalizeWidth(value, fallback) {
		if (typeof value !== 'string') {
			if (value === 0) {
				return '0';
			}
			return fallback;
		}
		const trimmed = value.trim();
		return trimmed || fallback;
	}

	$: normalizedWidthMobile = normalizeWidth(widthMobile, DEFAULT_WIDTH_MOBILE);

	$: computedWidthMobile = fullWidth ? '100%' : normalizedWidthMobile;

	$: desktopFallback =
		normalizedWidthMobile === DEFAULT_WIDTH_MOBILE ? DEFAULT_WIDTH_DESKTOP : normalizedWidthMobile;

	$: computedWidthDesktop = fullWidth ? '100%' : normalizeWidth(widthDesktop, desktopFallback);

	$: computedAlignMobile = normalizeAlignment(alignMobile ?? alignment, 'center');

	$: computedAlignDesktop = normalizeAlignment(alignDesktop ?? alignment, computedAlignMobile);

	$: computedRel = target === '_blank' ? 'noopener noreferrer' : undefined;
</script>

<figure
	class="photo-with-caption"
	class:full-width={fullWidth}
	style="--photo-width-mobile: {computedWidthMobile}; --photo-width-desktop: {computedWidthDesktop};"
	data-align-mobile={computedAlignMobile}
	data-align-desktop={computedAlignDesktop}
>
	<div class="photo-with-caption__image">
		{#if link}
			<a href={link} {target} rel={computedRel} class="photo-link">
				{#if srcMobile}
					<!-- Versão responsiva com picture -->
					<picture>
						<source media="(max-width: 768px)" srcset={srcMobile} />
						<source media="(min-width: 769px)" srcset={src} />
						<img {src} {alt} loading="lazy" />
					</picture>
				{:else}
					<!-- Versão simples -->
					<img {src} {alt} loading="lazy" />
				{/if}
			</a>
		{:else if srcMobile}
			<!-- Versão responsiva sem link -->
			<picture>
				<source media="(max-width: 768px)" srcset={srcMobile} />
				<source media="(min-width: 769px)" srcset={src} />
				<img {src} {alt} loading="lazy" />
			</picture>
		{:else}
			<!-- Versão simples sem link -->
			<img {src} {alt} loading="lazy" />
		{/if}
	</div>
	{#if caption || credit}
		<figcaption class="photo-with-caption__caption">
			{#if caption}<p class="photo-with-caption__text">{@html caption}</p>{/if}
			{#if credit}<small class="photo-with-caption__credit">{@html credit}</small>{/if}
		</figcaption>
	{/if}
</figure>

<style>
	.photo-with-caption {
		margin: 2rem auto;
		width: var(--photo-width-mobile, 100%);
		max-width: 100%;
	}

	.photo-with-caption[data-align-mobile='left'] {
		margin-left: 0;
		margin-right: auto;
	}

	.photo-with-caption[data-align-mobile='right'] {
		margin-left: auto;
		margin-right: 0;
	}

	.photo-with-caption.full-width {
		width: 100% !important;
		max-width: none;
		margin-left: 0;
		margin-right: 0;
	}

	@media (min-width: 769px) {
		.photo-with-caption {
			width: var(--photo-width-desktop, var(--photo-width-mobile, 100%));
		}

		.photo-with-caption[data-align-desktop='left'] {
			margin-left: 0;
			margin-right: auto;
		}

		.photo-with-caption[data-align-desktop='right'] {
			margin-left: auto;
			margin-right: 0;
		}
	}

	.photo-with-caption__image {
		position: relative;
		border-radius: 8px;
		overflow: hidden;
	}

	.photo-with-caption img {
		width: 100%;
		height: auto;
		display: block;
	}

	/* Estilos para o link */
	.photo-link {
		display: block;
		transition:
			transform 0.2s ease,
			opacity 0.2s ease;
	}

	.photo-link:hover {
		transform: scale(1.02);
		opacity: 0.95;
	}

	.photo-link:focus {
		outline: 2px solid var(--color-primary, #007bff);
		outline-offset: 2px;
	}

	.photo-with-caption__caption {
		padding: 1rem 0.5rem;
		text-align: center;
	}

	.photo-with-caption__text {
		font-size: var(--font-size-50);
		line-height: 1.4;
		color: var(--color-secondary);
		margin: 0 0 0.5rem 0;
		font-style: italic;
	}

	.photo-with-caption__credit {
		font-size: var(--font-size-40);
		color: var(--color-subtle-text);
		font-weight: 500;
	}
</style>
