<!-- FlourishScrollyEmbed.svelte - CORRIGIDO -->
<script>
	import { fade } from 'svelte/transition';

	export let src = '';
	export let index = 0;

	// Lógica para extrair tipo e ID do src
	$: type = src ? src.split('/')[0] : 'story';
	$: id = src ? src.split('/')[1] : '1';

	// ✅ CORREÇÃO: URL correta com template literals
	$: embedUrl = `https://flo.uri.sh/${type}/${id}/embed#slide-${index}`;

	$: {
		console.log('🎬 FlourishScrollyEmbed:', { src, type, id, index, embedUrl });
	}
</script>

{#if src}
	<div class="embed-container">
		{#key embedUrl}
			<div class="w-full flex items-center">
				<figure class="w-full" in:fade={{ duration: 400 }}>
					<iframe
						src={embedUrl}
						title="Interactive visual content"
						class="flourish-embed-iframe"
						frameborder="0"
						scrolling="no"
						style="width:100%;height:100%;"
						sandbox="allow-same-origin allow-forms allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
					/>
				</figure>
			</div>
		{/key}
	</div>
{:else}
	<div class="embed-fallback">
		<p>⚠️ FlourishScrollyEmbed: src não definido</p>
	</div>
{/if}

<style>
	.embed-container {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	figure,
	.w-full,
	.flex,
	.items-center {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.flourish-embed-iframe {
		border: none;
		width: 100%;
		height: 100%;
		min-height: 500px;
	}

	.embed-fallback {
		padding: 2rem;
		text-align: center;
		color: #6b7280;
		background: #f9fafb;
		border: 2px dashed #d1d5db;
		border-radius: 8px;
		margin: 1rem;
	}
</style>
