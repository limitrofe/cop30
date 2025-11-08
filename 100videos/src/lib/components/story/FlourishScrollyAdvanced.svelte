<!-- FlourishScrollyAdvanced.svelte - CORRIGIDO -->
<script>
	import Scroller from './shared/Scroller.svelte';
	import FlourishScrollyEmbed from './shared/FlourishScrollyEmbed.svelte';
	import AdvancedStep from './shared/AdvancedStep.svelte';

	export let src = '';
	export let steps = [];

	let currentStepIndex = 0;
	let offset = 0;

	// Estilos reativos para o container do background
	$: backgroundStyle = `
    transition: transform 0.4s, opacity 0.4s;
    transform: scale(${1 + offset * 0.1});
    opacity: ${0.7 + offset * 0.3};
  `;

	$: stepContent = steps.map((step) => {
		let content = '';
		if (step.title) content += `<h3>${step.title}</h3>`;
		if (step.text) content += `<div>${step.text}</div>`;
		return content;
	});

	$: flourishSlideIndex =
		steps[currentStepIndex]?.slide !== undefined ? steps[currentStepIndex].slide : 0;
</script>

{#if src && steps.length > 0}
	<div class="scrolly-wrapper">
		<Scroller top={0.2} bottom={0.8} threshold={0.5} bind:index={currentStepIndex} bind:offset>
			<div slot="background" class="flourish-background-fullscreen">
				<div style={backgroundStyle}>
					<FlourishScrollyEmbed {src} index={flourishSlideIndex} />
				</div>
			</div>

			<div slot="foreground" class="steps-foreground">
				<section class="spacer-top"></section>

				{#each stepContent as stepText, i}
					<AdvancedStep {stepText} active={i === currentStepIndex} {offset} />
				{/each}
			</div>
		</Scroller>
	</div>
{:else}
	<div class="scrolly-fallback">
		<div class="fallback-content">
			<span class="fallback-icon">📜</span>
			<h3>Flourish ScrollyTelling Advanced</h3>
			{#if !src}
				<p>Propriedade 'src' não definida.</p>
			{:else if steps.length === 0}
				<p>Nenhum step definido.</p>
			{/if}
		</div>
	</div>
{/if}

<style>
	.scrolly-wrapper {
		position: relative;
	}

	.flourish-background-fullscreen {
		width: 100%;
		height: 100vh;
	}

	.flourish-background-fullscreen > div {
		width: 100%;
		height: 100%;
	}

	.steps-foreground {
		position: relative;
		z-index: 10;
	}

	.spacer-top {
		height: 30vh;
	}

	:global(.scroller-foreground) {
		pointer-events: none !important;
	}

	:global(.scroller-foreground section) {
		pointer-events: auto;
	}

	.scrolly-fallback {
		padding: 3rem 2rem;
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
		font-size: 3rem;
	}

	.fallback-content h3 {
		margin: 0;
		color: #374151;
	}

	.fallback-content p {
		margin: 0;
		color: #6b7280;
	}
</style>
