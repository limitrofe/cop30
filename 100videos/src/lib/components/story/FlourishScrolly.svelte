<!-- FlourishScrolly.svelte - CORRIGIDO -->
<script>
	import Scroller from './shared/Scroller.svelte';
	import FlourishScrollyEmbed from './shared/FlourishScrollyEmbed.svelte';
	import Step from './shared/Step.svelte';

	export let src = '';
	export let steps = [];
	export let flourishUrl = ''; // Alias para src
	export let flourishHeight = '500px';
	export let layout = 'split';
	export let activationMode = 'exit';
	export let activationLine = 0;
	export let exitLine = 0;

	// Resolver src
	$: actualSrc = src || flourishUrl;

	let currentStepIndex = 0;
	let previousStepIndex = 0;
	let stepOffset = 0;

	const DEFAULT_TRAVEL_DISTANCE = 'auto';
	const normalizeTravelDistance = (value) => {
		if (value == null) return DEFAULT_TRAVEL_DISTANCE;
		if (typeof value === 'string') {
			const trimmed = value.trim();
			return trimmed ? trimmed : DEFAULT_TRAVEL_DISTANCE;
		}
		return value;
	};

	const normalizeStep = (step = {}) => ({
		slide: typeof step.slide === 'number' ? step.slide : Number.parseInt(step.slide ?? 0, 10) || 0,
		title: step.title ?? '',
		text: step.text ?? '',
		position: step.position || 'right',
		backgroundColor: step.backgroundColor || '',
		textColor: step.textColor || '',
		accentColor: step.accentColor || '',
		borderColor: step.borderColor || '',
		padding: step.padding || '',
		maxWidth: step.maxWidth || '',
		maxWidthMobile: step.maxWidthMobile || '',
		variant: step.variant || '',
		slideFromBottom: step.slideFromBottom ?? true,
		travelDistance: normalizeTravelDistance(step.travelDistance),
		cardVisibility: step.cardVisibility || 'card'
	});

	$: normalizedSteps =
		Array.isArray(steps) && steps.length ? steps.map(normalizeStep) : [normalizeStep()];

	$: totalSteps = normalizedSteps.length - 1;

	// Preparar conteúdo dos steps
	$: stepContent = normalizedSteps.map((step) => {
		let content = '';
		if (step.title) content += `<h3>${step.title}</h3>`;
		if (step.text) content += `<div>${step.text}</div>`;
		return content;
	});

	// Calcular slide do Flourish baseado no step atual
	$: flourishSlideIndex = normalizedSteps[currentStepIndex]?.slide ?? 0;

	$: if (currentStepIndex !== previousStepIndex) {
		previousStepIndex = currentStepIndex;
	}

	$: {
		console.log('📜 FlourishScrolly:', {
			actualSrc,
			currentStepIndex,
			flourishSlideIndex,
			stepsLength: normalizedSteps.length
		});
	}

	const clampRatio = (value, fallback = 0) => {
		if (value === null || value === undefined || value === '') return fallback;
		const numeric = typeof value === 'string' ? parseFloat(value) : value;
		if (Number.isNaN(numeric)) return fallback;
		return Math.min(1, Math.max(0, numeric));
	};

	$: resolvedActivationMode =
		(activationMode || 'exit').toString().toLowerCase() === 'enter' ? 'enter' : 'exit';
	$: resolvedActivationLine = clampRatio(activationLine, 0);
	$: resolvedExitLine = clampRatio(exitLine, 0);
</script>

{#if actualSrc && normalizedSteps.length > 0}
	<div class="scrolly-wrapper">
		<Scroller
			top={0}
			bottom={1}
			threshold={0}
			activationRatio={resolvedActivationLine}
			exitRatio={resolvedExitLine}
			advanceMode={resolvedActivationMode}
			bind:index={currentStepIndex}
			bind:offset={stepOffset}
		>
			<div slot="background" class="flourish-background-fullscreen">
				<FlourishScrollyEmbed src={actualSrc} index={flourishSlideIndex} />
			</div>

			<div slot="foreground" class="steps-foreground">
				<section class="spacer-top"></section>

				{#each stepContent as stepText, i}
					<Step
						{stepText}
						{i}
						length={totalSteps}
						position={normalizedSteps[i]?.position || 'right'}
						variant={normalizedSteps[i]?.variant || ''}
						backgroundColor={normalizedSteps[i]?.backgroundColor || ''}
						textColor={normalizedSteps[i]?.textColor || ''}
						accentColor={normalizedSteps[i]?.accentColor || ''}
						borderColor={normalizedSteps[i]?.borderColor || ''}
						padding={normalizedSteps[i]?.padding || ''}
						maxWidth={normalizedSteps[i]?.maxWidth || ''}
						maxWidthMobile={normalizedSteps[i]?.maxWidthMobile || ''}
						slideFromBottom={normalizedSteps[i]?.slideFromBottom ?? true}
						travelDistance={normalizedSteps[i]?.travelDistance}
						progress={i === currentStepIndex ? stepOffset : i < currentStepIndex ? 1 : 0}
						cardVisibility={normalizedSteps[i]?.cardVisibility || 'card'}
						active={i === currentStepIndex}
					/>
				{/each}
			</div>
		</Scroller>
	</div>
{:else}
	<div class="scrolly-fallback">
		<div class="fallback-content">
			<span class="fallback-icon">📜</span>
			<h3>Flourish ScrollyTelling</h3>
			{#if !actualSrc}
				<p>Propriedade 'src' não definida.</p>
				<small>Exemplo: <code>src: story/3218812</code></small>
			{:else if normalizedSteps.length === 0}
				<p>Nenhum step definido.</p>
				<small>Adicione steps com title, text e slide.</small>
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

	.steps-foreground {
		position: relative;
		z-index: 10;
	}

	.spacer-top {
		height: 10vh;
	}

	/* Allow clicking through the foreground container */
	:global(.scroller-foreground) {
		pointer-events: none !important;
	}

	/* Re-enable pointer events for the steps themselves */
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

	.fallback-content small {
		color: #9ca3af;
		font-family: monospace;
		background: #f3f4f6;
		padding: 4px 8px;
		border-radius: 4px;
	}
</style>
