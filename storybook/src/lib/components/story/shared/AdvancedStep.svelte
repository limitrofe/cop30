<script>
	export let stepText;
	export let active = false; // Este step está ativo?
	export let offset = 0; // Qual o progresso de rolagem neste step (0 a 1)?

	// Estilos reativos baseados no progresso da rolagem
	$: style = active
		? `opacity: ${offset}; transform: translateY(${(1 - offset) * 30}px);`
		: 'opacity: 0.2; transform: translateY(30px);'; // Estilo para steps inativos
</script>

<section class="step-container">
	<div class="step-content" {style}>
		{@html stepText}
	</div>
</section>

<style>
	.step-container {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		min-height: 100vh;
		padding: 2rem 5vw;
	}

	.step-content {
		background-color: rgba(var(--color-background-rgb), 0.9);
		backdrop-filter: blur(8px);
		color: var(--color-text);
		padding: 2rem;
		border: 1px solid var(--color-border);
		border-radius: 12px;
		max-width: 450px;
		width: 100%;
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
		/* A transição suaviza a mudança entre os estados ativo/inativo */
		transition:
			opacity 0.4s,
			transform 0.4s;
	}

	/* ... o restante do CSS do Step.svelte pode ser copiado aqui ... */
	@media (max-width: 768px) {
		.step-container {
			justify-content: center;
		}
	}
</style>
