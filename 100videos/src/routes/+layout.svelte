<script>
	// Carrega os estilos globais e as variáveis de cores padrão (tokens).
	import '../app.css';
	import '$lib/styles/tokens.css';
	import '$lib/styles/themes.css'; // Mantemos para ter acesso às variáveis do tema padrão.
</script>

<slot />

<style>
	/* Aplica as cores do tema padrão (:root) para todo o site */
	:global(html) {
		background-color: #fff4e6;
	}

	:global(body) {
		background-color: #fff4e6;
		color: var(--color-text);
		font-family:
			'Globotipo',
			-apple-system,
			sans-serif;
		margin: 0;
		min-height: 100vh;
	}
</style>
