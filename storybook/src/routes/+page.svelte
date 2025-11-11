<script>
	import StoryRenderer from '$lib/components/StoryRenderer.svelte';
	import { buildTypographyCSS } from '$lib/builder/utils.js';
	import ParticipantSlider from '$lib/components/story/ParticipantSlider.svelte';
	import ParticipantModal from '$lib/components/story/ParticipantModal.svelte';
	import { onDestroy, onMount } from 'svelte';
	import { participantActions } from '$lib/stores/participantStore.js';

	export let data;

	let currentStory = data.story;
	let loading = !currentStory;
	$: participants = data?.participants ?? [];
	$: participantActions.setParticipants(participants);
	let showParticipantProfile = false;
	let sliderVisible = false;
	let sliderCollapsed = false;
	let sliderStopActive = false;
	let sliderStopElement = null;
	$: if (!participants?.length && showParticipantProfile) {
		showParticipantProfile = false;
	}
	$: if (!participants?.length && sliderCollapsed) {
		sliderCollapsed = false;
	}

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
		showParticipantProfile = false;
		sliderCollapsed = false;
		sliderStopActive = false;
		sliderStopElement = null;
		syncSliderVisibility();
	}

	function syncSliderVisibility() {
		if (typeof window === 'undefined') {
			sliderVisible = false;
			sliderStopActive = false;
			return;
		}
		const chartAnchor = document.querySelector('[data-participant-slider-anchor="chart"]');

		if (chartAnchor) {
			const anchorRect = chartAnchor.getBoundingClientRect();
			const anchorTop = anchorRect.top + window.scrollY;
			const viewportBottom = window.scrollY + window.innerHeight;
			const triggerOffset = 64;
			sliderVisible = viewportBottom >= anchorTop + triggerOffset;
		} else {
			const header = document.querySelector('.story-header');
			if (!header) {
				sliderVisible = window.scrollY > 0;
			} else {
				const headerRect = header.getBoundingClientRect();
				sliderVisible = headerRect.top <= -8;
			}
		}

		sliderStopElement = document.querySelector('[data-slider-stop="true"]');

		if (sliderStopElement) {
			const rect = sliderStopElement.getBoundingClientRect();
			const viewportBottom = window.innerHeight;
			const sliderBuffer = 180;
			sliderStopActive = rect.top <= viewportBottom - sliderBuffer;
		} else {
			sliderStopActive = false;
		}
	}

	function handleScroll() {
		syncSliderVisibility();
	}

	onMount(() => {
		if (typeof window === 'undefined') return;
		syncSliderVisibility();
		window.addEventListener('scroll', handleScroll, { passive: true });
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('scroll', handleScroll);
		}
		participantActions.reset();
	});

	function handleProfileOpen(event) {
		const participantId = event?.detail?.id;
		if (participantId) {
			participantActions.selectById(participantId);
		}
		showParticipantProfile = true;
	}

	function handleProfileClose() {
		showParticipantProfile = false;
		syncSliderVisibility();
	}

	function handleSliderCollapse() {
		sliderCollapsed = true;
	}

	function handleSliderExpand() {
		sliderCollapsed = false;
		syncSliderVisibility();
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
		class:has-fixed-slider={participants.length > 0}
		data-theme={appearance.colorScheme || 'default'}
		style={`--bg-desktop:${backgroundDesktop}; --bg-mobile:${backgroundMobile}; --page-padding-desktop:${paddingDesktop}; --page-padding-mobile:${paddingMobile}; --surface-color:${surfaceColor}; --accent-color:${accentColor}; color:${textColor};`}
	>
		<StoryRenderer storyData={currentStory} on:openProfile={handleProfileOpen} />
		{#if participants.length}
			<ParticipantModal open={showParticipantProfile} on:close={handleProfileClose} />
		{/if}
		{#if participants.length && sliderVisible && !sliderCollapsed && !sliderStopActive}
			<section class="participants-hub" data-slider-mode="fixed">
				<ParticipantSlider
					mode="fixed"
					position="bottom"
					maxWidth={1280}
					background="#374953"
					blur={true}
					reserveSpace={false}
					collapsible={true}
					on:openProfile={handleProfileOpen}
					on:collapse={handleSliderCollapse}
				/>
			</section>
		{/if}
		{#if participants.length && sliderCollapsed && sliderVisible && !sliderStopActive}
			<button
				type="button"
				class="participants-toggle"
				on:click={handleSliderExpand}
				aria-label="Reabrir lista de participantes"
			>
				<span class="participants-toggle__icon" aria-hidden="true">+</span>
				<span>Mostrar participantes</span>
			</button>
		{/if}
		{#if participants.length}
			<div
				class="page-bottom-spacer"
				class:page-bottom-spacer--active={sliderVisible && !sliderCollapsed && !sliderStopActive}
				aria-hidden="true"
			></div>
		{/if}
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

	.participants-hub {
		margin: 0 auto clamp(2.5rem, 5vw, 4rem);
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: clamp(1.75rem, 4vw, 3rem);
	}

	.page-bottom-spacer {
		height: 0;
		transition: height 0.2s ease;
	}

	.page-bottom-spacer--active {
		height: 180px;
	}

	.participants-toggle {
		position: fixed;
		right: clamp(1rem, 3vw, 2.5rem);
		bottom: calc(clamp(1rem, 3vw, 2.5rem) + env(safe-area-inset-bottom, 0px));
		z-index: 1100;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.7rem 1.2rem;
		border-radius: 999px;
		background: rgba(10, 12, 23, 0.92);
		color: #f8fafc;
		border: 1px solid rgba(148, 163, 184, 0.35);
		box-shadow: 0 14px 36px rgba(1, 6, 18, 0.45);
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			transform 160ms ease,
			box-shadow 160ms ease,
			border-color 160ms ease;
	}

	.participants-toggle__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.35rem;
		height: 1.35rem;
		border-radius: 999px;
		background: rgba(15, 23, 42, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.22);
		font-size: 1.1rem;
		line-height: 1;
	}

	.participants-toggle:hover {
		transform: translateY(-1px);
		border-color: rgba(255, 255, 255, 0.45);
		box-shadow: 0 18px 44px rgba(1, 6, 18, 0.55);
	}

	.participants-toggle:active {
		transform: translateY(0);
	}

	.participants-toggle:focus-visible {
		outline: 2px solid rgba(248, 250, 252, 0.85);
		outline-offset: 3px;
	}

	@media (max-width: 640px) {
		.participants-hub {
			gap: 2rem;
		}
		.page-bottom-spacer--active {
			height: 140px;
		}
		.participants-toggle {
			left: clamp(0.75rem, 4vw, 1.5rem);
			right: clamp(0.75rem, 4vw, 1.5rem);
			justify-content: center;
		}
	}
</style>
