<!-- src/lib/components/ReadingProgress.svelte -->
<script>
	import { onMount, onDestroy } from 'svelte';
	import { currentStoryMeta, storyConfig } from '$lib/stores/storyStore.js';

	export let showEstimate = true;
	export let showPercentage = true;
	export let position = 'bottom'; // 'top', 'bottom'

	let progress = 0;
	let scrollY = 0;
	let innerHeight = 0;
	let documentHeight = 0;
	let isVisible = false;

	function updateProgress() {
		const scrollableHeight = documentHeight - innerHeight;
		if (scrollableHeight > 0) {
			progress = Math.min(100, (scrollY / scrollableHeight) * 100);
			isVisible = progress > 5; // Só mostra após 5% da página
		}
	}

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function scrollToNext() {
		const nextSection = document.querySelector('[data-component-index]');
		if (nextSection) {
			nextSection.scrollIntoView({ behavior: 'smooth' });
		}
	}

	onMount(() => {
		const updateDocumentHeight = () => {
			documentHeight = document.documentElement.scrollHeight;
			updateProgress();
		};

		// Initial calculation
		updateDocumentHeight();

		// Update on resize
		window.addEventListener('resize', updateDocumentHeight);

		return () => {
			window.removeEventListener('resize', updateDocumentHeight);
		};
	});

	// Reactive statements
	$: if (scrollY !== undefined) updateProgress();
</script>

<svelte:window bind:scrollY bind:innerHeight />

{#if $storyConfig.readingProgress && isVisible}
	<div class="reading-progress reading-progress--{position}" class:visible={isVisible}>
		<!-- Barra de progresso -->
		<div class="reading-progress__bar">
			<div class="reading-progress__fill" style="width: {progress}%"></div>
		</div>

		<!-- Informações da story -->
		<div class="reading-progress__info">
			<div class="reading-progress__meta">
				{#if showPercentage}
					<span class="reading-progress__percentage">
						{Math.round(progress)}%
					</span>
				{/if}

				{#if showEstimate && $currentStoryMeta}
					<span class="reading-progress__time">
						{$currentStoryMeta.estimatedReadTime} min de leitura
					</span>
				{/if}
			</div>

			<!-- Controles de navegação -->
			<div class="reading-progress__controls">
				<button class="reading-progress__button" on:click={scrollToTop} title="Voltar ao topo">
					↑
				</button>

				<button class="reading-progress__button" on:click={scrollToNext} title="Próxima seção">
					↓
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.reading-progress {
		position: fixed;
		left: 0;
		right: 0;
		z-index: 1000;
		background: var(--color-background);
		border: 1px solid var(--color-border);
		backdrop-filter: blur(10px);
		background: rgba(var(--color-background-rgb, 255, 255, 255), 0.95);
		transition: all 0.3s ease;
		transform: translateY(-100%);
	}

	.reading-progress--top {
		top: 0;
		border-bottom: 1px solid var(--color-border);
	}

	.reading-progress--bottom {
		bottom: 0;
		border-top: 1px solid var(--color-border);
		transform: translateY(100%);
	}

	.reading-progress.visible {
		transform: translateY(0);
	}

	.reading-progress__bar {
		height: 3px;
		background: var(--color-border);
		position: relative;
		overflow: hidden;
	}

	.reading-progress__fill {
		height: 100%;
		background: linear-gradient(90deg, var(--color-primary), #ff8a65);
		transition: width 0.1s ease;
		position: relative;
	}

	.reading-progress__fill::after {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		width: 4px;
		height: 100%;
		background: white;
		box-shadow: 0 0 6px rgba(0, 0, 0, 0.3);
	}

	.reading-progress__info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 1rem;
	}

	.reading-progress__meta {
		display: flex;
		gap: 1rem;
		align-items: center;
		font-size: var(--font-size-40);
		color: var(--color-secondary);
	}

	.reading-progress__percentage {
		font-weight: 600;
		color: var(--color-primary);
		min-width: 35px;
	}

	.reading-progress__time {
		opacity: 0.8;
	}

	.reading-progress__controls {
		display: flex;
		gap: 0.5rem;
	}

	.reading-progress__button {
		width: 32px;
		height: 32px;
		border: 1px solid var(--color-border);
		background: var(--color-background);
		color: var(--color-secondary);
		border-radius: 6px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		transition: all 0.2s ease;
	}

	.reading-progress__button:hover {
		background: var(--color-highlight-bg);
		color: var(--color-primary);
		transform: translateY(-1px);
	}

	/* Animação de entrada */
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-100%);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.reading-progress.visible {
		animation: slideIn 0.3s ease-out;
	}

	/* Mobile */
	@media (max-width: 768px) {
		.reading-progress__info {
			padding: 0.4rem 0.75rem;
		}

		.reading-progress__meta {
			font-size: var(--font-size-30);
			gap: 0.75rem;
		}

		.reading-progress__button {
			width: 28px;
			height: 28px;
			font-size: 12px;
		}

		.reading-progress__time {
			display: none; /* Oculta no mobile para economizar espaço */
		}
	}

	/* Tema escuro */
	@media (prefers-color-scheme: dark) {
		.reading-progress {
			background: rgba(26, 26, 26, 0.95);
		}
	}

	/* Estados especiais */
	.reading-progress--minimal {
		padding: 0;
	}

	.reading-progress--minimal .reading-progress__info {
		display: none;
	}

	.reading-progress--minimal .reading-progress__bar {
		height: 2px;
	}
</style>
