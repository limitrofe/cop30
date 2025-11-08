<script>
	import GloboPlayer from './GloboPlayer.svelte';

	export let blocks = [];
	export let mobileBreakpoint = '768px';

	const normalizeBlockType = (value) => {
		const raw = (value || '').toString().toLowerCase().trim();
		switch (raw) {
			case 'intertitle':
			case 'intertitulo':
				return 'intertitle';
			case 'quote':
			case 'frase':
				return 'quote';
			case 'image':
			case 'imagem':
				return 'image';
			case 'video':
			case 'embed':
			case 'iframe':
				return 'video';
			case 'globo-player':
			case 'globoplayer':
			case 'globoplay':
				return 'globoplayer';
			default:
				return raw || 'text';
		}
	};

	const safeBlocks = Array.isArray(blocks) ? blocks.filter(Boolean) : [];
</script>

{#if safeBlocks.length}
	<div class="nested-blocks">
		{#each safeBlocks as block, blockIndex}
			{@const blockType = normalizeBlockType(block?.type)}

			{#if blockType === 'text'}
				<div class="rich-text">{@html block?.text || ''}</div>
			{:else if blockType === 'intertitle'}
				<h4 class="intertitle">{block?.title || block?.text || ''}</h4>
			{:else if blockType === 'quote'}
				<blockquote class="quote-block">
					{#if block?.text}
						<p class="quote-text">{@html block.text}</p>
					{/if}
					{#if block?.author}
						<footer class="quote-author">{block.author}</footer>
					{/if}
				</blockquote>
			{:else if blockType === 'image'}
				{@const imageBlock = block?.image || block}
				<figure class="media-block">
					{#if imageBlock?.desktop || imageBlock?.mobile}
						<picture>
							{#if imageBlock?.mobile}
								<source media={`(max-width: ${mobileBreakpoint})`} srcset={imageBlock.mobile} />
							{/if}
							{#if imageBlock?.desktop}
								<source media={`(min-width: ${mobileBreakpoint})`} srcset={imageBlock.desktop} />
							{/if}
							<img
								src={imageBlock?.desktop || imageBlock?.mobile || ''}
								alt={imageBlock?.alt || ''}
								loading="lazy"
							/>
						</picture>
					{:else}
						<div class="media-placeholder">Adicione uma imagem</div>
					{/if}
					{#if imageBlock?.caption || imageBlock?.credit}
						<figcaption class="media-caption">
							{#if imageBlock?.caption}
								<div class="caption">{@html imageBlock.caption}</div>
							{/if}
							{#if imageBlock?.credit}
								<span class="credit">{imageBlock.credit}</span>
							{/if}
						</figcaption>
					{/if}
				</figure>
			{:else if blockType === 'video'}
				{@const videoBlock = block?.video || block}
				<div class="media-block">
					{#if videoBlock?.embedHtml}
						<div class="video-embed" aria-label={videoBlock?.alt || 'Video incorporado'}>
							{@html videoBlock.embedHtml}
						</div>
					{:else if videoBlock?.src}
						<video
							src={videoBlock.src}
							poster={videoBlock?.poster}
							controls={videoBlock?.controls ?? true}
							autoplay={videoBlock?.autoplay ?? false}
							loop={videoBlock?.loop ?? false}
							muted={videoBlock?.muted ?? videoBlock?.autoplay ?? false}
							playsinline
						></video>
					{:else}
						<div class="media-placeholder">Adicione um video</div>
					{/if}
					{#if videoBlock?.caption || videoBlock?.credit}
						<figcaption class="media-caption">
							{#if videoBlock?.caption}
								<div class="caption">{@html videoBlock.caption}</div>
							{/if}
							{#if videoBlock?.credit}
								<span class="credit">{videoBlock.credit}</span>
							{/if}
						</figcaption>
					{/if}
				</div>
			{:else if blockType === 'globoplayer'}
				{@const playerBlock = block?.globo || block}
				<div class="media-block">
					{#if playerBlock?.videoIdDesktop || playerBlock?.videoIdMobile || playerBlock?.videoId}
						<GloboPlayer
							videoIdDesktop={playerBlock?.videoIdDesktop || playerBlock?.videoId || ''}
							videoIdMobile={playerBlock?.videoIdMobile || playerBlock?.videoId || ''}
							autoPlay={playerBlock?.autoPlay ?? false}
							startMuted={playerBlock?.startMuted ?? true}
							showCaption={playerBlock?.showCaption ??
								Boolean(playerBlock?.caption || playerBlock?.credit)}
							caption={playerBlock?.caption || ''}
							credit={playerBlock?.credit || ''}
							aspectRatio={playerBlock?.aspectRatio || '16 / 9'}
							aspectRatioMobile={playerBlock?.aspectRatioMobile ||
								playerBlock?.aspectRatio ||
								'9 / 16'}
							containerBackgroundColor={playerBlock?.backgroundColor || 'transparent'}
							widthDesktop={playerBlock?.widthDesktop || '100%'}
							widthMobile={playerBlock?.widthMobile || '100%'}
						/>
					{:else}
						<div class="media-placeholder">Informe os IDs do GloboPlay</div>
					{/if}
				</div>
			{/if}
		{/each}
	</div>
{/if}
