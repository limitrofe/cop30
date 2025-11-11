<script>
	import { createEventDispatcher } from 'svelte';

	export let step = 1;
	export let total = 3;
export let steps = [];

	const dispatch = createEventDispatcher();

	const defaultSteps = [
		{
			title: 'Filtre pelos gráficos',
			description:
				'Clique nos blocos dos gráficos acima para trazer primeiro quem respondeu daquele jeito. Clique novamente no mesmo bloco para voltar ao estado original.'
		},
		{
			title: 'Foque em uma pessoa',
			description:
				'Selecione um participante na barra para ver todas as respostas dele em destaque. Clique novamente para desfazer o foco e comparar com os demais.'
		},
		{
			title: 'Abra a ficha completa',
			description:
				'Use o botão “+” ao lado da foto para abrir o modal com todas as respostas e informações daquela pessoa.'
		}
	];

	$: tutorialSteps = steps?.length ? steps : defaultSteps;
	$: currentStep = tutorialSteps[Math.max(0, Math.min(step - 1, tutorialSteps.length - 1))] || {};

	function handleSkip() {
		dispatch('skip');
	}

	function handleNext() {
		dispatch('next');
	}
</script>

<div class="slider-tutorial" role="dialog" aria-live="polite" aria-label="Como usar a barra de participantes">
	<div class={`tutorial-card tutorial-card--step-${step}`}>
		<span class="tutorial-card__badge">Dica {step}/{total}</span>
		<h4>{currentStep.title}</h4>
		<p>{currentStep.description}</p>
		<div class="tutorial-card__actions">
			<button type="button" class="tutorial-card__skip" on:click={handleSkip}>Pular</button>
			<button type="button" class="tutorial-card__next" on:click={handleNext}>
				{step === total ? 'Entendi' : 'Continuar'}
			</button>
		</div>
	</div>
</div>

<style>
	.slider-tutorial {
		position: fixed;
		inset: 0;
		pointer-events: auto;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: clamp(1rem, 3vw, 2rem);
		padding-bottom: clamp(4rem, 8vw, 6rem);
		z-index: 4000;
		background: rgba(4, 7, 15, 0.82);
	}

	.tutorial-card {
		max-width: min(360px, 92vw);
		background: rgba(5, 12, 21, 0.92);
		color: #f8fafc;
		border-radius: 18px;
		padding: 1.1rem 1.3rem;
		box-shadow: 0 20px 45px rgba(4, 10, 20, 0.55);
		pointer-events: auto;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		border: 1px solid rgba(248, 250, 252, 0.2);
	}

	.tutorial-card__badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		padding: 0.15rem 0.6rem;
		border-radius: 999px;
		background: rgba(248, 250, 252, 0.2);
		color: rgba(248, 250, 252, 0.9);
	}

	h4 {
		margin: 0;
		font-size: 1.15rem;
		line-height: 1.3;
	}

	p {
		margin: 0;
		font-size: 0.95rem;
		line-height: 1.4;
		color: rgba(248, 250, 252, 0.85);
	}

	.tutorial-card__actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	button {
		border: none;
		cursor: pointer;
		font: inherit;
		padding: 0.55rem 1rem;
		border-radius: 999px;
		transition:
			background 160ms ease,
			color 160ms ease,
			border-color 160ms ease;
	}

	.tutorial-card__skip {
		background: transparent;
		color: rgba(248, 250, 252, 0.75);
		border: 1px solid rgba(248, 250, 252, 0.3);
	}

	.tutorial-card__skip:hover,
	.tutorial-card__skip:focus-visible {
		color: #f8fafc;
		border-color: rgba(248, 250, 252, 0.6);
	}

	.tutorial-card__next {
		background: #f97316;
		color: #0b0d17;
		font-weight: 600;
		min-width: 120px;
	}

	.tutorial-card__next:hover,
	.tutorial-card__next:focus-visible {
		background: #fb8f40;
	}

	@media (max-width: 767px) {
		.tutorial-card {
			width: 100%;
		}
	}
</style>
