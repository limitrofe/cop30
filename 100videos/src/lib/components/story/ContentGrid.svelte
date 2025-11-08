<script>
	import GloboPlayer from './GloboPlayer.svelte';
	import ContentGridBlockList from './ContentGridBlockList.svelte';

	export let items = [];
	export let columnsDesktop = 3;
	export let gapDesktop = '1.5rem';
	export let gapMobile = '1rem';
	export let backgroundColor = '';
	export let paddingDesktop = '0';
	export let paddingMobile = '0';
	export let borderRadius = '0';
	export let itemBackground = '';
	export let itemPadding = '0';
	export let itemBorderRadius = '0';
	export let mobileBreakpoint = '768px';

	const clampColumns = (value) => {
		const parsed = Number(value);
		if (Number.isNaN(parsed)) return 1;
		return Math.min(Math.max(parsed, 1), 6);
	};

	const clampSpan = (value, fallback = 1) => {
		const parsed = Number(value);
		if (Number.isNaN(parsed)) return clampColumns(fallback);
		return Math.min(Math.max(parsed, 1), 6);
	};

	const ensureBlocks = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

	const normalizeMediaType = (value) => {
		const raw = (value || '').toString().toLowerCase();
		if (raw === 'video' || raw === 'embed' || raw === 'iframe') return 'video';
		if (raw === 'globo' || raw === 'globoplay' || raw === 'globoplayer') return 'globoplayer';
		return 'image';
	};

	const normalizeType = (value) => {
		const raw = (value || '').toString().toLowerCase().trim();
		switch (raw) {
			case 'imagem':
			case 'image':
				return 'image';
			case 'video':
			case 'video':
				return 'video';
			case 'intertitulo':
			case 'intertitle':
				return 'intertitle';
			case 'frase':
			case 'quote':
			case 'phrase':
				return 'frase';
			case 'globo-player':
			case 'globoplayer':
				return 'globoplayer';
			case 'texto':
			case 'text':
			default:
				return raw || 'text';
		}
	};

	const buildAlignmentClass = (item) => {
		const align = (item?.align || item?.alignment || '').toString().toLowerCase();
		if (!align) return '';
		if (align === 'start' || align === 'left') return 'align-start';
		if (align === 'center' || align === 'centre') return 'align-center';
		if (align === 'end' || align === 'right') return 'align-end';
		return '';
	};

	$: safeColumns = clampColumns(columnsDesktop);
	$: tabletColumns = Math.min(safeColumns, 3);
	$: safeItems = Array.isArray(items) ? items : [];
</script>

<section
	class="content-grid"
	style="
		--columns-desktop: {safeColumns};
		--gap-desktop: {gapDesktop};
		--gap-mobile: {gapMobile};
		--padding-desktop: {paddingDesktop};
		--padding-mobile: {paddingMobile || paddingDesktop};
		--background-color: {backgroundColor || 'transparent'};
		--border-radius: {borderRadius};
		--item-background: {itemBackground || 'transparent'};
		--item-padding: {itemPadding};
		--item-radius: {itemBorderRadius};
		--mobile-breakpoint: {mobileBreakpoint};
		--columns-tablet: {tabletColumns};
	"
>
	{#if safeItems.length === 0}
		<div class="grid-empty-state">
			<p>Nenhum item configurado ainda.</p>
		</div>
	{:else}
		{#each safeItems as rawItem, index}
			{@const type = normalizeType(rawItem?.type)}
			{@const typeClass = `grid-item--${type}`}
			{@const alignmentClass = buildAlignmentClass(rawItem)}
			{@const spanDesktop = clampSpan(rawItem?.spanDesktop ?? rawItem?.span ?? 1)}
			{@const spanTablet = clampSpan(rawItem?.spanTablet ?? rawItem?.span ?? spanDesktop)}
			{@const spanMobile = clampSpan(rawItem?.spanMobile ?? 1)}
			{@const blocks = ensureBlocks(rawItem?.blocks)}
			<article
				class={`grid-item ${typeClass} ${alignmentClass}`.trim()}
				data-grid-index={index}
				style={`--span-desktop:${spanDesktop};--span-tablet:${spanTablet};--span-mobile:${spanMobile};`}
			>
				{#if rawItem?.pretitle}
					<p class="pretitle">{rawItem.pretitle}</p>
				{/if}

				{#if rawItem?.title && type !== 'intertitle'}
					<h3 class="item-title">{rawItem.title}</h3>
				{/if}

				{#if rawItem?.subtitle}
					<p class="item-subtitle">{rawItem.subtitle}</p>
				{/if}

				{#if type === 'intertitle'}
					<h3 class={`intertitle ${alignmentClass}`.trim()}>
						{rawItem?.title || rawItem?.text || rawItem?.content || ''}
					</h3>
				{:else if type === 'image'}
					{@const image = rawItem?.image || rawItem}
					<figure class="media-block">
						{#if image?.desktop || image?.mobile}
							<picture>
								{#if image?.mobile}
									<source media={`(max-width: ${mobileBreakpoint})`} srcset={image.mobile} />
								{/if}
								{#if image?.desktop}
									<source media={`(min-width: ${mobileBreakpoint})`} srcset={image.desktop} />
								{/if}
								<img
									src={image?.desktop || image?.mobile || ''}
									alt={image?.alt || rawItem?.alt || ''}
									loading="lazy"
								/>
							</picture>
						{:else}
							<div class="media-placeholder">Adicione uma imagem para esta coluna</div>
						{/if}
						{#if image?.caption || image?.credit}
							<figcaption class="media-caption">
								{#if image?.caption}
									<div class="caption">{@html image.caption}</div>
								{/if}
								{#if image?.credit}
									<span class="credit">{image.credit}</span>
								{/if}
							</figcaption>
						{/if}
					</figure>
				{:else if type === 'video'}
					{@const video = rawItem?.video || rawItem}
					<div class="media-block">
						{#if video?.embedHtml}
							<div class="video-embed" aria-label={video?.alt || 'Video incorporado'}>
								{@html video.embedHtml}
							</div>
						{:else if video?.src}
							<video
								src={video.src}
								poster={video?.poster}
								controls={video?.controls ?? true}
								autoplay={video?.autoplay ?? false}
								loop={video?.loop ?? false}
								muted={video?.muted ?? video?.autoplay ?? false}
								playsinline
							></video>
						{:else}
							<div class="media-placeholder">Adicione um video ou embed para esta coluna</div>
						{/if}
						{#if video?.caption || video?.credit}
							<figcaption class="media-caption">
								{#if video?.caption}
									<div class="caption">{@html video.caption}</div>
								{/if}
								{#if video?.credit}
									<span class="credit">{video.credit}</span>
								{/if}
							</figcaption>
						{/if}
					</div>
				{:else if type === 'frase'}
					<blockquote class="quote-block">
						{#if rawItem?.text || rawItem?.quote}
							<p class="quote-text">{@html rawItem.text ?? rawItem.quote}</p>
						{/if}
						{#if rawItem?.author}
							<footer class="quote-author">{rawItem.author}</footer>
						{/if}
					</blockquote>
				{:else if type === 'globoplayer'}
					{@const player = rawItem?.globo || rawItem}
					<div class="media-block">
						{#if player?.videoIdDesktop || player?.videoIdMobile || player?.videoId}
							<GloboPlayer
								videoIdDesktop={player?.videoIdDesktop || player?.videoId || ''}
								videoIdMobile={player?.videoIdMobile || player?.videoId || ''}
								autoPlay={player?.autoPlay ?? false}
								startMuted={player?.startMuted ?? true}
								showCaption={player?.showCaption ?? Boolean(player?.caption || player?.credit)}
								caption={player?.caption || rawItem?.caption || ''}
								credit={player?.credit || rawItem?.credit || ''}
								aspectRatio={player?.aspectRatio || '16 / 9'}
								aspectRatioMobile={player?.aspectRatioMobile || player?.aspectRatio || '9 / 16'}
								containerBackgroundColor={player?.backgroundColor || 'transparent'}
								widthDesktop={player?.widthDesktop || '100%'}
								widthMobile={player?.widthMobile || '100%'}
							/>
						{:else}
							<div class="media-placeholder">Informe os IDs do GloboPlay para esta coluna</div>
						{/if}
					</div>
				{:else if type === 'card'}
					{@const layout = (rawItem?.layout || 'media-left').toLowerCase()}
					{@const mediaType = normalizeMediaType(rawItem?.mediaType)}
					{@const cardBlocks = ensureBlocks(rawItem?.blocks)}
					<div class={`card card--${layout}`}>
						{#if layout === 'media-left' || layout === 'media-top'}
							{#if mediaType === 'image'}
								{@const image = rawItem?.mediaImage || rawItem?.image || {}}
								<div class="card-media">
									{#if image?.desktop || image?.mobile}
										<picture>
											{#if image?.mobile}
												<source media={`(max-width: ${mobileBreakpoint})`} srcset={image.mobile} />
											{/if}
											{#if image?.desktop}
												<source media={`(min-width: ${mobileBreakpoint})`} srcset={image.desktop} />
											{/if}
											<img
												src={image?.desktop || image?.mobile || ''}
												alt={image?.alt || rawItem?.alt || ''}
												loading="lazy"
											/>
										</picture>
									{:else}
										<div class="media-placeholder">Adicione uma imagem para esta coluna</div>
									{/if}
									{#if image?.caption || image?.credit}
										<figcaption class="media-caption">
											{#if image?.caption}
												<div class="caption">{@html image.caption}</div>
											{/if}
											{#if image?.credit}
												<span class="credit">{image.credit}</span>
											{/if}
										</figcaption>
									{/if}
								</div>
							{:else if mediaType === 'video'}
								{@const video = rawItem?.mediaVideo || rawItem?.video || {}}
								<div class="card-media">
									{#if video?.embedHtml}
										<div class="video-embed" aria-label={video?.alt || 'Video incorporado'}>
											{@html video.embedHtml}
										</div>
									{:else if video?.src}
										<video
											src={video.src}
											poster={video?.poster}
											controls={video?.controls ?? true}
											autoplay={video?.autoplay ?? false}
											loop={video?.loop ?? false}
											muted={video?.muted ?? video?.autoplay ?? false}
											playsinline
										></video>
									{:else}
										<div class="media-placeholder">Adicione um video ou embed para esta coluna</div>
									{/if}
									{#if video?.caption || video?.credit}
										<figcaption class="media-caption">
											{#if video?.caption}
												<div class="caption">{@html video.caption}</div>
											{/if}
											{#if video?.credit}
												<span class="credit">{video.credit}</span>
											{/if}
										</figcaption>
									{/if}
								</div>
							{:else if mediaType === 'globoplayer'}
								{@const player = rawItem?.mediaGlobo || rawItem?.globo || {}}
								<div class="card-media">
									{#if player?.videoIdDesktop || player?.videoIdMobile || player?.videoId}
										<GloboPlayer
											videoIdDesktop={player?.videoIdDesktop || player?.videoId || ''}
											videoIdMobile={player?.videoIdMobile || player?.videoId || ''}
											autoPlay={player?.autoPlay ?? false}
											startMuted={player?.startMuted ?? true}
											showCaption={player?.showCaption ??
												Boolean(player?.caption || player?.credit)}
											caption={player?.caption || ''}
											credit={player?.credit || ''}
											aspectRatio={player?.aspectRatio || '16 / 9'}
											aspectRatioMobile={player?.aspectRatioMobile ||
												player?.aspectRatio ||
												'9 / 16'}
											containerBackgroundColor={player?.backgroundColor || 'transparent'}
											widthDesktop={player?.widthDesktop || '100%'}
											widthMobile={player?.widthMobile || '100%'}
										/>
									{:else}
										<div class="media-placeholder">
											Informe os IDs do GloboPlay para esta coluna
										</div>
									{/if}
								</div>
							{/if}
						{/if}
						<div class="card-body">
							{#if rawItem?.pretitle}
								<p class="pretitle">{rawItem.pretitle}</p>
							{/if}
							{#if rawItem?.title}
								<h3 class="item-title">{rawItem.title}</h3>
							{/if}
							{#if rawItem?.subtitle}
								<p class="item-subtitle">{rawItem.subtitle}</p>
							{/if}
							{#if rawItem?.text}
								<div class="rich-text">{@html rawItem.text}</div>
							{/if}
							{#if rawItem?.author}
								<footer class="quote-author">{rawItem.author}</footer>
							{/if}
							{#if cardBlocks.length}
								<ContentGridBlockList blocks={cardBlocks} {mobileBreakpoint} />
							{/if}
						</div>
						{#if (layout === 'media-right' || layout === 'media-bottom') && (mediaType === 'image' || mediaType === 'video' || mediaType === 'globoplayer')}
							{#if mediaType === 'image'}
								{@const image = rawItem?.mediaImage || rawItem?.image || {}}
								<div class="card-media">
									{#if image?.desktop || image?.mobile}
										<picture>
											{#if image?.mobile}
												<source media={`(max-width: ${mobileBreakpoint})`} srcset={image.mobile} />
											{/if}
											{#if image?.desktop}
												<source media={`(min-width: ${mobileBreakpoint})`} srcset={image.desktop} />
											{/if}
											<img
												src={image?.desktop || image?.mobile || ''}
												alt={image?.alt || rawItem?.alt || ''}
												loading="lazy"
											/>
										</picture>
									{:else}
										<div class="media-placeholder">Adicione uma imagem para esta coluna</div>
									{/if}
									{#if image?.caption || image?.credit}
										<figcaption class="media-caption">
											{#if image?.caption}
												<div class="caption">{@html image.caption}</div>
											{/if}
											{#if image?.credit}
												<span class="credit">{image.credit}</span>
											{/if}
										</figcaption>
									{/if}
								</div>
							{:else if mediaType === 'video'}
								{@const video = rawItem?.mediaVideo || rawItem?.video || {}}
								<div class="card-media">
									{#if video?.embedHtml}
										<div class="video-embed" aria-label={video?.alt || 'Video incorporado'}>
											{@html video.embedHtml}
										</div>
									{:else if video?.src}
										<video
											src={video.src}
											poster={video?.poster}
											controls={video?.controls ?? true}
											autoplay={video?.autoplay ?? false}
											loop={video?.loop ?? false}
											muted={video?.muted ?? video?.autoplay ?? false}
											playsinline
										></video>
									{:else}
										<div class="media-placeholder">Adicione um video ou embed para esta coluna</div>
									{/if}
									{#if video?.caption || video?.credit}
										<figcaption class="media-caption">
											{#if video?.caption}
												<div class="caption">{@html video.caption}</div>
											{/if}
											{#if video?.credit}
												<span class="credit">{video.credit}</span>
											{/if}
										</figcaption>
									{/if}
								</div>
							{:else if mediaType === 'globoplayer'}
								{@const player = rawItem?.mediaGlobo || rawItem?.globo || {}}
								<div class="card-media">
									{#if player?.videoIdDesktop || player?.videoIdMobile || player?.videoId}
										<GloboPlayer
											videoIdDesktop={player?.videoIdDesktop || player?.videoId || ''}
											videoIdMobile={player?.videoIdMobile || player?.videoId || ''}
											autoPlay={player?.autoPlay ?? false}
											startMuted={player?.startMuted ?? true}
											showCaption={player?.showCaption ??
												Boolean(player?.caption || player?.credit)}
											caption={player?.caption || ''}
											credit={player?.credit || ''}
											aspectRatio={player?.aspectRatio || '16 / 9'}
											aspectRatioMobile={player?.aspectRatioMobile ||
												player?.aspectRatio ||
												'9 / 16'}
											containerBackgroundColor={player?.backgroundColor || 'transparent'}
											widthDesktop={player?.widthDesktop || '100%'}
											widthMobile={player?.widthMobile || '100%'}
										/>
									{:else}
										<div class="media-placeholder">
											Informe os IDs do GloboPlay para esta coluna
										</div>
									{/if}
								</div>
							{/if}
						{/if}
					</div>
				{:else if rawItem?.text}
					<div
						class="rich-text"
						class:align-center={alignmentClass === 'align-center'}
						class:align-end={alignmentClass === 'align-end'}
					>
						{@html rawItem.text}
					</div>
				{:else if rawItem?.content}
					<div
						class="rich-text"
						class:align-center={alignmentClass === 'align-center'}
						class:align-end={alignmentClass === 'align-end'}
					>
						{@html rawItem.content}
					</div>
				{:else}
					<p class="placeholder">Configure o conteudo desta coluna.</p>
				{/if}

				{#if blocks.length && type !== 'card'}
					<ContentGridBlockList {blocks} {mobileBreakpoint} />
				{/if}

				{#if rawItem?.callout}
					<p class="callout">{rawItem.callout}</p>
				{/if}
			</article>
		{/each}
	{/if}
</section>

<style>
	.content-grid {
		display: grid;
		grid-template-columns: repeat(var(--columns-desktop, 3), minmax(0, 1fr));
		gap: var(--gap-desktop, 1.5rem);
		background: var(--background-color, transparent);
		border-radius: var(--border-radius, 0);
		padding: var(--padding-desktop, 0);
	}

	@media (max-width: 1024px) {
		.content-grid {
			grid-template-columns: repeat(var(--columns-tablet, 3), minmax(0, 1fr));
		}
	}

	@media (max-width: 768px) {
		.content-grid {
			grid-template-columns: 1fr;
			gap: var(--gap-mobile, 1rem);
			padding: var(--padding-mobile, var(--padding-desktop, 0));
		}
	}

	.grid-item {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		gap: 0.75rem;
		background: var(--item-background, transparent);
		padding: var(--item-padding, 0);
		border-radius: var(--item-radius, 0);
		color: inherit;
		grid-column: span var(--span-desktop, 1);
	}

	.grid-item.align-center {
		text-align: center;
		align-items: center;
	}

	.grid-item.align-end {
		text-align: right;
		align-items: flex-end;
	}

	@media (max-width: 1024px) {
		.grid-item {
			grid-column: span var(--span-tablet, 1);
		}
	}

	@media (max-width: 768px) {
		.grid-item {
			grid-column: span var(--span-mobile, 1);
		}
	}

	.grid-item.align-start {
		text-align: left;
		align-items: flex-start;
	}

	.grid-item .item-title {
		font-size: clamp(1.4rem, 2vw, 1.8rem);
		line-height: 1.2;
		margin: 0;
	}

	.grid-item .pretitle {
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 0.75rem;
		margin: 0;
		color: rgba(15, 23, 42, 0.7);
	}

	.grid-item .item-subtitle {
		font-size: 0.95rem;
		margin: 0;
		color: rgba(15, 23, 42, 0.75);
	}

	.intertitle {
		font-size: clamp(1.6rem, 2.5vw, 2.4rem);
		line-height: 1.2;
		margin: 0;
	}

	.media-block {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.media-block picture,
	.media-block video,
	.media-block :global(.wm-player-container),
	.media-block :global(.player-container) {
		width: 100%;
	}

	.media-block img,
	.media-block video {
		display: block;
		width: 100%;
		height: auto;
		border-radius: inherit;
	}

	.media-caption {
		font-size: 0.85rem;
		line-height: 1.4;
		color: rgba(15, 23, 42, 0.7);
	}

	.media-caption .credit {
		display: block;
		font-size: 0.75rem;
		margin-top: 0.3rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.media-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 160px;
		border: 1px dashed rgba(148, 163, 184, 0.6);
		border-radius: 0.75rem;
		font-size: 0.85rem;
		text-align: center;
		padding: 1rem;
		color: rgba(71, 85, 105, 0.85);
		background: rgba(148, 163, 184, 0.08);
	}

	.rich-text {
		font-size: clamp(1rem, 1.3vw, 1.1rem);
		line-height: 1.6;
	}

	.card {
		display: grid;
		gap: clamp(1rem, 2vw, 2rem);
		align-items: center;
		grid-template-columns: minmax(0, 1fr);
	}

	.card-media {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.card-media picture,
	.card-media video,
	.card-media :global(.wm-player-container) {
		width: 100%;
	}

	.card-media img,
	.card-media video {
		display: block;
		width: 100%;
		height: auto;
		border-radius: inherit;
	}

	.card-body {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.card--media-left,
	.card--media-right {
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		align-items: stretch;
	}

	.card--media-left .card-media,
	.card--media-right .card-media {
		align-self: stretch;
	}

	@media (max-width: 768px) {
		.card {
			grid-template-columns: 1fr;
		}
	}

	.nested-blocks {
		display: flex;
		flex-direction: column;
		gap: clamp(0.75rem, 1.5vw, 1.5rem);
	}

	.quote-block {
		position: relative;
		padding: 1.5rem;
		border-left: 4px solid currentColor;
		background: rgba(15, 23, 42, 0.03);
		border-radius: 0.75rem;
	}

	.quote-text {
		font-size: clamp(1.3rem, 2vw, 1.7rem);
		line-height: 1.5;
		margin: 0;
		font-weight: 500;
	}

	.quote-author {
		margin-top: 0.75rem;
		font-size: 0.85rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: rgba(15, 23, 42, 0.6);
	}

	.video-embed {
		position: relative;
		width: 100%;
	}

	.video-embed :global(iframe) {
		width: 100%;
		height: 100%;
		border: 0;
	}

	.placeholder {
		margin: 0;
		font-size: 0.9rem;
		color: rgba(15, 23, 42, 0.6);
		font-style: italic;
	}

	.callout {
		margin-top: auto;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: rgba(15, 23, 42, 0.5);
	}

	.grid-empty-state {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 220px;
		background: rgba(148, 163, 184, 0.08);
		border: 1px dashed rgba(148, 163, 184, 0.6);
		border-radius: 12px;
		color: rgba(71, 85, 105, 0.9);
		font-size: 0.95rem;
	}
</style>
