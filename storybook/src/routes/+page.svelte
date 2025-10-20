<script>
	import StoryRenderer from '$lib/components/StoryRenderer.svelte';
	import { buildTypographyCSS } from '$lib/builder/utils.js';

	export let data;

	let currentStory = data.story;
	let loading = !currentStory;

	$: appearance = currentStory?.appearance || {};
	$: share = currentStory?.share || {};
	$: seo = currentStory?.seo || {};
	$: backgroundDesktop =
		appearance.useGradient && appearance.gradient
			? appearance.gradient
			: (appearance.backgroundColor ?? '#0b0d17');
	$: backgroundMobile =
		appearance.useGradient && appearance.gradient
			? appearance.gradient
			: (appearance.backgroundColorMobile ?? appearance.backgroundColor ?? '#0b0d17');
	$: textColor = appearance.textColor || '#f8fafc';
	$: surfaceColor = appearance.surfaceColor || 'transparent';
	$: accentColor = appearance.accentColor || '#f97316';
	$: paddingDesktop = appearance.pagePadding?.desktop || '0';
	$: paddingMobile = appearance.pagePadding?.mobile || '0';
	$: typographyCSS = buildTypographyCSS(appearance.typography, '.story-page');

	$: if (data?.story && data.story !== currentStory) {
		currentStory = data.story;
		loading = false;
	}
</script>

<svelte:head>
	<title>{currentStory ? currentStory.title : 'Story sem título'}</title>
	{#if currentStory}
		<meta
			name="description"
			content={currentStory.description || currentStory.subtitle || currentStory.intro?.text || ''}
		/>
		<meta property="og:title" content={share.title || currentStory.title} />
		<meta
			property="og:description"
			content={share.description || currentStory.subtitle || currentStory.description || ''}
		/>
		<meta property="og:type" content={seo.ogType || 'article'} />
		{#if share.image}
			<meta property="og:image" content={share.image} />
		{/if}
		{#if share.imageSquare}
			<meta property="og:image:alt" content={share.title || currentStory.title} />
			<meta property="og:image:secure_url" content={share.imageSquare} />
		{/if}
		<meta name="twitter:card" content={share.image ? 'summary_large_image' : 'summary'} />
		<meta name="twitter:title" content={share.title || currentStory.title} />
		<meta
			name="twitter:description"
			content={share.description || currentStory.subtitle || currentStory.description || ''}
		/>
		{#if share.imageTwitter}
			<meta name="twitter:image" content={share.imageTwitter} />
		{:else if share.image}
			<meta name="twitter:image" content={share.image} />
		{/if}
		{#if share.imageGoogle}
			<meta name="googlebot-news" content="index,follow" />
			<meta name="thumbnail" content={share.imageGoogle} />
		{/if}
		{#if currentStory.author}
			<meta name="author" content={currentStory.author} />
		{/if}
		{#if seo.canonicalUrl}
			<link rel="canonical" href={seo.canonicalUrl} />
		{/if}
		{#if seo.keywords?.length}
			<meta name="keywords" content={seo.keywords.join(', ')} />
		{/if}
		{#if appearance?.accentColor}
			<meta name="theme-color" content={appearance.accentColor} />
		{/if}
		{@html `<style>${typographyCSS}</style>`}
		{#if appearance?.customCSS}
			{@html `<style>${appearance.customCSS}</style>`}
		{/if}
	{/if}
</svelte:head>

{#if loading}
	<div class="loading">
		<div class="spinner"></div>
		<p>Carregando...</p>
	</div>
{:else if currentStory}
	<div
		class="story-page"
		data-theme={appearance.colorScheme || 'default'}
		style={`--bg-desktop:${backgroundDesktop}; --bg-mobile:${backgroundMobile}; --page-padding-desktop:${paddingDesktop}; --page-padding-mobile:${paddingMobile}; --surface-color:${surfaceColor}; --accent-color:${accentColor}; color:${textColor};`}
	>
		<StoryRenderer storyData={currentStory} />
	</div>
{/if}

<style>
	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		color: var(--color-text);
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid var(--color-border, #f3f3f3);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.story-page {
		width: 100%;
		min-height: 100vh;
		background: var(--bg-desktop, transparent);
		padding: var(--page-padding-desktop);
		box-sizing: border-box;
		transition: background 0.3s ease;
	}

	@media (max-width: 768px) {
		.story-page {
			padding: var(--page-padding-mobile);
			background: var(--bg-mobile, transparent);
		}
	}
</style>
