<!-- FlourishEmbed.svelte - CORRIGIDO -->
<script>
	import { afterUpdate, onMount } from 'svelte';
	import { loadFlourishScript, waitForFlourish } from '$lib/utils/flourish.js';

	export let src = '';
	export let url = ''; // Alias para src
	export let height = 'auto';
	export let width = '100%';
	export let maxWidth = '800px';
	export let heightMobile = 'auto';
	export let widthMobile = '100%';
	export let maxWidthMobile = '100%';
	export let caption = '';
	export let credit = '';

	// Resolver src (pode vir como 'src' ou 'url')
	$: actualSrc = src || url;

	let lastRenderedKey = '';

	const DEFAULT_HEIGHT = '600px';

	$: normalizedWidth = (() => {
		if (width == null) return '100%';
		const value = String(width).trim();
		return value === '' ? '100%' : value;
	})();

	$: normalizedMaxWidth = (() => {
		if (maxWidth == null) return '800px';
		const value = String(maxWidth).trim();
		return value === '' ? '800px' : value;
	})();

	$: normalizedWidthMobile = (() => {
		if (widthMobile == null) return '100%';
		const value = String(widthMobile).trim();
		return value === '' ? '100%' : value;
	})();

	$: normalizedMaxWidthMobile = (() => {
		if (maxWidthMobile == null) return '100%';
		const value = String(maxWidthMobile).trim();
		return value === '' ? '100%' : value;
	})();

	$: normalizedHeight = (() => {
		if (height == null) return 'auto';
		const value = String(height).trim();
		return value === '' ? 'auto' : value;
	})();

	$: normalizedHeightMobile = (() => {
		if (heightMobile == null) return 'auto';
		const value = String(heightMobile).trim();
		return value === '' ? 'auto' : value;
	})();

	$: isDeclaredAuto = ['auto', 'automatic'].includes(normalizedHeight.toLowerCase());
	$: treatAsAuto =
		isDeclaredAuto ||
		(normalizedHeight.toLowerCase() === DEFAULT_HEIGHT &&
			normalizedWidth === '100%' &&
			normalizedMaxWidth === '800px');
	$: dataHeight = treatAsAuto ? undefined : normalizedHeight;

	$: isDeclaredAutoMobile = ['auto', 'automatic'].includes(normalizedHeightMobile.toLowerCase());
	$: treatAsAutoMobile = isDeclaredAutoMobile;

	$: containerStyle = [
		normalizedWidth ? `--flourish-width: ${normalizedWidth}` : '',
		normalizedMaxWidth ? `--flourish-max-width: ${normalizedMaxWidth}` : '',
		treatAsAuto ? '' : `--flourish-min-height: ${normalizedHeight}`,
		normalizedWidthMobile ? `--flourish-width-mobile: ${normalizedWidthMobile}` : '',
		normalizedMaxWidthMobile ? `--flourish-max-width-mobile: ${normalizedMaxWidthMobile}` : '',
		treatAsAutoMobile ? '' : `--flourish-min-height-mobile: ${normalizedHeightMobile}`
	]
		.filter(Boolean)
		.join('; ');

	function buildRenderKey() {
		return [
			actualSrc,
			treatAsAuto ? 'auto' : normalizedHeight,
			normalizedWidth,
			normalizedMaxWidth,
			treatAsAutoMobile ? 'auto' : normalizedHeightMobile,
			normalizedWidthMobile,
			normalizedMaxWidthMobile
		].join('::');
	}

	async function hydrateFlourish() {
		if (!actualSrc) return;

		const renderKey = buildRenderKey();
		if (renderKey === lastRenderedKey) return;

		try {
			console.log('🔄 Carregando script Flourish...');
			await loadFlourishScript();
			await waitForFlourish();
			window.Flourish?.Live?.renderAll();
			console.log('✅ Flourish renderizado');
			lastRenderedKey = renderKey;
		} catch (error) {
			console.error('❌ Erro ao carregar Flourish:', error);
		}
	}

	onMount(hydrateFlourish);

	afterUpdate(() => {
		hydrateFlourish();
	});
</script>

{#if actualSrc}
	<div class="flourish-embed-container" style={containerStyle}>
		<div class="flourish-embed" data-src={actualSrc} data-height={dataHeight}>
			<a href={`https://public.flourish.studio/${actualSrc}`} target="_blank">
				Ver esta visualização de dados no Flourish
			</a>
		</div>

		<!-- Caption/Credit -->
		{#if caption || credit}
			<div class="media-caption">
				{#if caption}
					<div class="caption-text">{@html caption}</div>
				{/if}
				{#if credit}
					<div class="caption-credit">{@html credit}</div>
				{/if}
			</div>
		{/if}
	</div>
{:else}
	<div class="flourish-fallback">
		<div class="fallback-content">
			<span class="fallback-icon">⚠️</span>
			<h3>Componente Flourish</h3>
			<p>A propriedade 'src' não foi definida no Google Docs.</p>
			<small>Exemplo: <code>src: visualisation/24092168</code></small>
		</div>
	</div>
{/if}

<style>
	.flourish-embed-container {
		width: var(--flourish-width, 100%);
		max-width: var(--flourish-max-width, 800px);
		margin: 2rem auto;
		min-height: var(--flourish-min-height, 0);
		background-color: var(--color-highlight-bg, #f9fafb);
		border-radius: 8px;
		overflow: hidden;
	}

	.flourish-embed {
		width: 100%;
		min-height: var(--flourish-min-height, 0);
	}

	@media (max-width: 768px) {
		.flourish-embed-container {
			width: var(--flourish-width-mobile, var(--flourish-width, 100%));
			max-width: var(--flourish-max-width-mobile, var(--flourish-max-width, 100%));
			min-height: var(--flourish-min-height-mobile, var(--flourish-min-height, 0));
		}

		.flourish-embed {
			min-height: var(--flourish-min-height-mobile, var(--flourish-min-height, 0));
		}
	}

	.flourish-embed :global(a) {
		position: absolute;
		left: -10000px;
		top: auto;
		width: 1px;
		height: 1px;
		overflow: hidden;
	}

	.flourish-fallback {
		padding: 2rem;
		margin: 2rem auto;
		max-width: 600px;
		border: 2px dashed #d1d5db;
		background: #f9fafb;
		border-radius: 8px;
		text-align: center;
	}

	.fallback-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
	}

	.fallback-icon {
		font-size: 2rem;
	}

	.fallback-content h3 {
		margin: 0;
		color: #374151;
	}

	.fallback-content p {
		margin: 0;
		color: #6b7280;
	}

	.fallback-content small {
		color: #9ca3af;
		font-family: monospace;
		background: #f3f4f6;
		padding: 4px 8px;
		border-radius: 4px;
	}

	.media-caption {
		padding: 0.75rem 1rem;
		background: rgba(0, 0, 0, 0.02);
		border-left: 3px solid #e5e7eb;
		margin-top: 0.5rem;
		border-radius: 0 4px 4px 0;
	}

	.caption-text {
		font-size: 0.9rem;
		color: #374151;
		line-height: 1.5;
		margin-bottom: 0.25rem;
	}

	.caption-credit {
		font-size: 0.8rem;
		color: #6b7280;
		font-style: italic;
	}
</style>
