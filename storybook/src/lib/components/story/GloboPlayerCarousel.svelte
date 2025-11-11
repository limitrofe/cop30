<!-- src/lib/components/story/GloboPlayerCarousel.svelte -->
<script>
	import Carousel from './Carousel.svelte';

	const MIN_VIDEOS = 2;
	const MAX_VIDEOS = 10;

	export let videos = [];
	export let autoplay = true; // gira slides automaticamente
	export let interval = 6000;
	export let showDots = true;
	export let showArrows = true;
	export let audioButtonBackground = 'rgba(0, 0, 0, 0.7)';
	export let audioButtonHoverBackground = 'rgba(0, 0, 0, 0.85)';
	export let audioButtonTextColor = '#fff';
	export let fallbackTitlePrefix = 'Vídeo';

	const hasValidId = (video) =>
		Boolean(
			video?.videoIdDesktop?.toString().trim() ||
				video?.videoIdMobile?.toString().trim() ||
				video?.videoId?.toString().trim()
		);

	function normalizeVideo(video, index) {
		const safeTitle = video?.title?.toString().trim();
		return {
			type: 'globo-player',
			title: safeTitle || `${fallbackTitlePrefix} ${index + 1}`,
			caption: video?.caption?.toString() ?? '',
			credit: video?.credit?.toString() ?? '',
			videoIdDesktop: video?.videoIdDesktop?.toString().trim() || '',
			videoIdMobile: video?.videoIdMobile?.toString().trim() || '',
			videoId: video?.videoId?.toString().trim() || '',
			hasAds: Boolean(video?.hasAds)
		};
	}

	$: cleanedVideos = Array.isArray(videos) ? videos.filter(hasValidId) : [];
	$: items = cleanedVideos.slice(0, MAX_VIDEOS).map(normalizeVideo);
	$: hasEnoughVideos = items.length >= MIN_VIDEOS;
	$: ignoredVideos = Math.max(0, cleanedVideos.length - items.length);
	$: invalidVideos = Array.isArray(videos) ? videos.length - cleanedVideos.length : 0;
	$: slideAutoplay = autoplay && hasEnoughVideos;
</script>

{#if !hasEnoughVideos}
	<div class="globoplayer-carousel__warning">
		{#if items.length === 0}
			<p>Configure pelo menos dois vídeos com IDs válidos para exibir o carrossel.</p>
		{:else}
			<p>Adicione mais {MIN_VIDEOS - items.length} vídeo(s) para ativar a rotação automática.</p>
		{/if}
	</div>
{/if}

{#if invalidVideos > 0}
	<div class="globoplayer-carousel__warning globoplayer-carousel__warning--alert">
		<p>{invalidVideos} vídeo(s) foram ignorados por não terem IDs válidos.</p>
	</div>
{/if}

{#if ignoredVideos > 0}
	<div class="globoplayer-carousel__warning globoplayer-carousel__warning--info">
		<p>{ignoredVideos} vídeo(s) extra foram ignorados (limite de {MAX_VIDEOS}).</p>
	</div>
{/if}

{#if items.length}
	<Carousel
		{items}
		autoplay={slideAutoplay}
		{interval}
		showDots={showDots && items.length > 1}
		showArrows={showArrows && items.length > 1}
		{audioButtonBackground}
		{audioButtonHoverBackground}
		{audioButtonTextColor}
	/>
{:else}
	<div class="globoplayer-carousel__empty">
		<p>Sem vídeos GloboPlay configurados.</p>
	</div>
{/if}

<style>
	.globoplayer-carousel__warning {
		margin-bottom: 1rem;
		padding: 0.75rem 1rem;
		border-radius: 10px;
		background: rgba(253, 230, 138, 0.25);
		color: #854d0e;
		font-size: 0.85rem;
	}

	.globoplayer-carousel__warning--info {
		background: rgba(190, 227, 248, 0.35);
		color: #0c4a6e;
	}

	.globoplayer-carousel__warning--alert {
		background: rgba(248, 180, 180, 0.35);
		color: #7f1d1d;
	}

	.globoplayer-carousel__empty {
		padding: 2rem;
		border: 1px dashed rgba(148, 163, 184, 0.6);
		border-radius: 12px;
		text-align: center;
		color: #475569;
		font-size: 0.9rem;
	}
</style>
