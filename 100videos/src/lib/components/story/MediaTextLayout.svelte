<script>
	import GloboPlayer from './GloboPlayer.svelte';

	// Media configuration
	export let mediaType = 'image'; // image | video | globo-player
	export let mediaSrc = '';
	export let mediaSrcDesktop = '';
	export let mediaSrcMobile = '';
	export let mediaAlt = '';
	export let mediaPoster = '';
	export let mediaAutoplay = true;
	export let mediaLoop = true;
	export let mediaMuted = true;
	export let mediaControls = false;
	export let mediaPlaysInline = true;
	export let mediaAspectRatio = '16 / 9';
	export let mediaBackground = 'transparent';
	export let mediaBorderRadius = '0.75rem';
	export let mediaHeightDesktop = '';
	export let mediaHeightMobile = '';
	export let mediaPadding = '0';
	export let mediaCaption = '';
	export let mediaCredit = '';
	export let mediaClass = '';
	export let mediaOrderMobile = 'auto'; // auto | media-first | text-first

	// Globo Player specific configuration
	export let globoPlayer = {};

	// Text content
	export let pretitle = '';
	export let title = '';
	export let subtitle = '';
	export let text = '';
	export let blockquote = '';
	export let blockquoteAuthor = '';
	export let blockquoteRole = '';
	export let textOrder = ['pretitle', 'title', 'subtitle', 'text', 'blockquote'];
	export let textAlign = 'left';
	export let textColor = 'inherit';
	export let textSpacing = '1.25rem';
	export let textMaxWidth = '560px';

	// Layout
	export let mediaPosition = 'left'; // left | right
	export let verticalAlign = 'center'; // top | center | bottom | stretch
	export let gapDesktop = '2.5rem';
	export let gapMobile = '1.5rem';
	export let backgroundColor = 'transparent';
	export let paddingDesktop = '3rem 0';
	export let paddingMobile = '2rem 1rem';
	export let containerWidth = '100%';
	export let containerMaxWidth = '1200px';
	export let mediaWidthDesktop = 'minmax(0, 48%)';
	export let textWidthDesktop = 'minmax(0, 52%)';
	export let mediaWidthMobile = '100%';
	export let textWidthMobile = '100%';
	export let fullWidthOnMobile = false;
	export let shadow = '';

	// Utility: convert textOrder to array
	const DEFAULT_ORDER = ['pretitle', 'title', 'subtitle', 'text', 'blockquote'];
	$: normalizedOrder = Array.isArray(textOrder)
		? textOrder
		: typeof textOrder === 'string'
			? textOrder
					.split(',')
					.map((item) => item.trim().toLowerCase())
					.filter(Boolean)
			: DEFAULT_ORDER;

	// Map of available blocks
	$: blockMap = {
		pretitle,
		title,
		subtitle,
		text,
		blockquote
	};

	// Compose stack respecting requested order and including remaining defined blocks
	$: orderedBlocks = [
		...normalizedOrder.filter((key) => blockMap[key]),
		...DEFAULT_ORDER.filter((key) => !normalizedOrder.includes(key) && blockMap[key])
	].filter((key, index, self) => self.indexOf(key) === index && blockMap[key]);

	// Layout helpers
	let mediaIsRight;
	$: mediaIsRight = mediaPosition === 'right';
	$: mediaSideClass = mediaIsRight ? 'media-text--media-right' : 'media-text--media-left';
	$: alignClass = `media-text--align-${verticalAlign}`;
	$: textAlignClass = `media-text__text--${textAlign}`;
	$: resolvedAspectDesktop = mediaHeightDesktop ? 'auto' : mediaAspectRatio;
	$: resolvedAspectMobile = mediaHeightMobile || mediaHeightDesktop ? 'auto' : mediaAspectRatio;
	$: computedMediaOrderMobile =
		mediaOrderMobile === 'media-first'
			? 1
			: mediaOrderMobile === 'text-first'
				? 2
				: mediaIsRight
					? 2
					: 1;
	$: computedTextOrderMobile =
		mediaOrderMobile === 'media-first'
			? 2
			: mediaOrderMobile === 'text-first'
				? 1
				: mediaIsRight
					? 1
					: 2;

	$: containerStyle = `
		--media-text-bg: ${backgroundColor};
		--media-text-gap-desktop: ${gapDesktop};
		--media-text-gap-mobile: ${gapMobile};
		--media-text-padding-desktop: ${paddingDesktop};
		--media-text-padding-mobile: ${paddingMobile};
		--media-text-width: ${containerWidth};
		--media-text-max-width: ${containerMaxWidth};
		--media-text-media-width-desktop: ${mediaWidthDesktop};
		--media-text-text-width-desktop: ${textWidthDesktop};
		--media-text-media-width-mobile: ${mediaWidthMobile};
		--media-text-text-width-mobile: ${textWidthMobile};
		--media-text-text-max-width: ${textMaxWidth};
		--media-text-text-color: ${textColor};
		--media-text-text-spacing: ${textSpacing};
		--media-text-media-aspect: ${resolvedAspectDesktop};
		--media-text-media-aspect-mobile: ${resolvedAspectMobile};
		--media-text-media-background: ${mediaBackground};
		--media-text-media-radius: ${mediaBorderRadius};
		--media-text-media-padding: ${mediaPadding};
		--media-text-media-height-desktop: ${mediaHeightDesktop || 'auto'};
		--media-text-media-height-mobile: ${mediaHeightMobile || mediaHeightDesktop || 'auto'};
		--media-text-shadow: ${shadow || 'none'};
		--media-text-order-media-desktop: ${mediaIsRight ? 2 : 1};
		--media-text-order-text-desktop: ${mediaIsRight ? 1 : 2};
		--media-text-order-media-mobile: ${computedMediaOrderMobile};
		--media-text-order-text-mobile: ${computedTextOrderMobile};
	`;

	// Determine effective media sources
	$: effectiveImageDesktop = mediaSrcDesktop || mediaSrc;
	$: effectiveImageMobile = mediaSrcMobile || effectiveImageDesktop;

	// Flags for safe rendering
	$: isImage = mediaType === 'image' || mediaType === 'gif';
	$: isVideo = mediaType === 'video' || mediaType === 'mp4';
	$: isGloboPlayer = mediaType === 'globo-player' || mediaType === 'globoplayer';

	$: showCaption = Boolean(mediaCaption || mediaCredit);

	const DEFAULT_GLOBO_PROPS = {
		widthDesktop: '100%',
		widthMobile: '100%',
		containerBackgroundColor: 'transparent',
		aspectRatio: '16 / 9',
		aspectRatioMobile: '16 / 9',
		startMuted: true,
		controls: true,
		showCaption: false
	};

	$: globoProps = { ...DEFAULT_GLOBO_PROPS, ...globoPlayer };
</script>

<section class={`media-text ${mediaSideClass} ${alignClass}`} style={containerStyle}>
	<div class="media-text__inner" class:media-text__inner--full-mobile={fullWidthOnMobile}>
		{#if isImage}
			<div class={`media-text__media ${mediaClass}`}>
				<picture>
					{#if effectiveImageMobile && effectiveImageMobile !== effectiveImageDesktop}
						<source srcset={effectiveImageMobile} media="(max-width: 768px)" />
					{/if}
					{#if effectiveImageDesktop}
						<img src={effectiveImageDesktop} alt={mediaAlt} loading="lazy" />
					{:else}
						<div class="media-text__media-placeholder">Adicione uma imagem</div>
					{/if}
				</picture>

				{#if showCaption}
					<figcaption class="media-text__caption">
						{#if mediaCaption}
							<span class="media-text__caption-text">{@html mediaCaption}</span>
						{/if}
						{#if mediaCredit}
							<span class="media-text__caption-credit">{mediaCredit}</span>
						{/if}
					</figcaption>
				{/if}
			</div>
		{:else if isVideo}
			<div class={`media-text__media ${mediaClass}`}>
				<video
					poster={mediaPoster}
					autoplay={mediaAutoplay}
					loop={mediaLoop}
					muted={mediaMuted}
					playsinline={mediaPlaysInline}
					controls={mediaControls}
				>
					{#if mediaSrcMobile}
						<source src={mediaSrcMobile} media="(max-width: 768px)" type="video/mp4" />
					{/if}
					{#if mediaSrcDesktop || mediaSrc}
						<source src={mediaSrcDesktop || mediaSrc} type="video/mp4" />
					{/if}
					Seu navegador não suporta o elemento de vídeo.
				</video>

				{#if showCaption}
					<figcaption class="media-text__caption">
						{#if mediaCaption}
							<span class="media-text__caption-text">{@html mediaCaption}</span>
						{/if}
						{#if mediaCredit}
							<span class="media-text__caption-credit">{mediaCredit}</span>
						{/if}
					</figcaption>
				{/if}
			</div>
		{:else if isGloboPlayer}
			<div class={`media-text__media ${mediaClass}`}>
				<GloboPlayer {...globoProps} />

				{#if showCaption}
					<figcaption class="media-text__caption">
						{#if mediaCaption}
							<span class="media-text__caption-text">{@html mediaCaption}</span>
						{/if}
						{#if mediaCredit}
							<span class="media-text__caption-credit">{mediaCredit}</span>
						{/if}
					</figcaption>
				{/if}
			</div>
		{:else}
			<div class={`media-text__media ${mediaClass}`}>
				<div class="media-text__media-placeholder">Configure um tipo de mídia suportado.</div>
			</div>
		{/if}

		<div class={`media-text__text ${textAlignClass}`}>
			{#if orderedBlocks.length === 0}
				<div class="media-text__text-placeholder">Adicione conteúdo textual para este bloco.</div>
			{:else}
				<div class="media-text__stack">
					{#each orderedBlocks as block}
						{#if block === 'pretitle'}
							<p class="media-text__pretitle">{@html pretitle}</p>
						{:else if block === 'title'}
							<h2 class="media-text__title">{@html title}</h2>
						{:else if block === 'subtitle'}
							<p class="media-text__subtitle">{@html subtitle}</p>
						{:else if block === 'text'}
							<div class="media-text__body">{@html text}</div>
						{:else if block === 'blockquote'}
							<figure class="media-text__blockquote">
								<blockquote>{@html blockquote}</blockquote>
								{#if blockquoteAuthor || blockquoteRole}
									<figcaption>
										{#if blockquoteAuthor}
											<span class="media-text__quote-author">{blockquoteAuthor}</span>
										{/if}
										{#if blockquoteRole}
											<span class="media-text__quote-role">{blockquoteRole}</span>
										{/if}
									</figcaption>
								{/if}
							</figure>
						{/if}
					{/each}
				</div>
			{/if}
		</div>
	</div>
</section>

<style>
	.media-text {
		background: var(--media-text-bg);
		padding: var(--media-text-padding-desktop);
		display: flex;
		justify-content: center;
	}

	.media-text__inner {
		display: flex;
		align-items: center;
		gap: var(--media-text-gap-desktop);
		width: var(--media-text-width);
		max-width: var(--media-text-max-width);
		flex-wrap: nowrap;
	}

	.media-text--media-right .media-text__inner {
		flex-direction: row-reverse;
	}

	.media-text--align-top .media-text__inner {
		align-items: flex-start;
	}

	.media-text--align-center .media-text__inner {
		align-items: center;
	}

	.media-text--align-bottom .media-text__inner {
		align-items: flex-end;
	}

	.media-text--align-stretch .media-text__inner {
		align-items: stretch;
	}

	.media-text__media {
		flex: 0 1 var(--media-text-media-width-desktop);
		display: flex;
		flex-direction: column;
		position: relative;
		background: var(--media-text-media-background);
		border-radius: var(--media-text-media-radius);
		padding: var(--media-text-media-padding);
		overflow: hidden;
		box-shadow: var(--media-text-shadow);
		order: var(--media-text-order-media-desktop);
	}

	.media-text__media picture,
	.media-text__media img,
	.media-text__media video,
	.media-text__media :global(.globo-player-embed) {
		width: 100%;
		height: var(--media-text-media-height-desktop);
		max-height: var(--media-text-media-height-desktop);
		display: block;
		border-radius: calc(var(--media-text-media-radius) - var(--media-text-media-padding));
		object-fit: cover;
		aspect-ratio: var(--media-text-media-aspect);
	}

	.media-text__media video {
		background: inherit;
	}

	.media-text__media-placeholder {
		display: grid;
		place-items: center;
		width: 100%;
		min-height: 200px;
		padding: 2rem;
		background: rgba(148, 163, 184, 0.15);
		color: #64748b;
		font-size: 0.95rem;
		text-align: center;
		border-radius: calc(var(--media-text-media-radius) - var(--media-text-media-padding));
	}

	.media-text__caption {
		margin-top: 0.75rem;
		font-size: 0.85rem;
		line-height: 1.4;
		color: rgba(148, 163, 184, 0.9);
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.media-text__caption-credit {
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 0.75rem;
		color: rgba(148, 163, 184, 0.8);
	}

	.media-text__text {
		color: var(--media-text-text-color);
		flex: 0 1 var(--media-text-text-width-desktop);
		max-width: var(--media-text-text-max-width);
		order: var(--media-text-order-text-desktop);
	}

	.media-text__text-placeholder {
		font-size: 0.95rem;
		line-height: 1.6;
		color: rgba(148, 163, 184, 0.9);
		border: 1px dashed rgba(148, 163, 184, 0.4);
		padding: 1.25rem;
		border-radius: 0.75rem;
		text-align: center;
	}

	.media-text__stack > * + * {
		margin-top: var(--media-text-text-spacing);
	}

	.media-text__pretitle {
		font-size: 0.9rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: rgba(148, 163, 184, 0.95);
	}

	.media-text__title {
		font-family: var(--typography-h2-desktop-font-family, 'Globotipo', sans-serif);
		font-size: clamp(2rem, 3vw, 3rem);
		line-height: 1.1;
		margin: 0;
	}

	.media-text__subtitle {
		font-size: clamp(1.2rem, 2vw, 1.5rem);
		line-height: 1.4;
		margin: 0;
		color: rgba(203, 213, 225, 0.95);
	}

	.media-text__body {
		font-size: 1.05rem;
		line-height: 1.7;
	}

	.media-text__body :global(p) {
		margin: 0 0 1rem;
	}

	.media-text__body :global(p:last-child) {
		margin-bottom: 0;
	}

	.media-text__blockquote {
		margin: 0;
		padding: 1.5rem;
		border-left: 4px solid rgba(148, 163, 184, 0.4);
		background: rgba(15, 23, 42, 0.25);
		border-radius: 0.75rem;
	}

	.media-text__blockquote blockquote {
		margin: 0;
		font-size: clamp(1.4rem, 2.5vw, 1.8rem);
		line-height: 1.4;
		font-style: italic;
	}

	.media-text__quote-author {
		display: block;
		margin-top: 1rem;
		font-weight: 600;
	}

	.media-text__quote-role {
		display: block;
		font-size: 0.85rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: rgba(148, 163, 184, 0.75);
		margin-top: 0.25rem;
	}

	.media-text__text--center {
		text-align: center;
	}

	.media-text__text--right {
		text-align: right;
	}

	@media (max-width: 1024px) {
		.media-text__inner {
			gap: calc(var(--media-text-gap-desktop) * 0.75);
		}
	}

	@media (max-width: 768px) {
		.media-text {
			padding: var(--media-text-padding-mobile);
		}

		.media-text__inner {
			flex-direction: column;
			align-items: stretch;
			gap: var(--media-text-gap-mobile);
			flex-wrap: wrap;
		}

		.media-text__media {
			order: var(--media-text-order-media-mobile);
			flex-basis: var(--media-text-media-width-mobile);
			width: var(--media-text-media-width-mobile);
		}

		.media-text__text {
			order: var(--media-text-order-text-mobile);
			flex-basis: var(--media-text-text-width-mobile);
			max-width: 100%;
			width: var(--media-text-text-width-mobile);
		}

		.media-text__media picture,
		.media-text__media img,
		.media-text__media video,
		.media-text__media :global(.globo-player-embed) {
			height: var(--media-text-media-height-mobile);
			max-height: var(--media-text-media-height-mobile);
			aspect-ratio: var(--media-text-media-aspect-mobile);
		}

		.media-text__inner--full-mobile .media-text__media,
		.media-text__inner--full-mobile .media-text__text {
			width: 100vw;
			margin-left: calc(50% - 50vw);
			margin-right: calc(50% - 50vw);
		}

		.media-text__caption {
			padding: 0 1rem;
		}
	}
</style>
