<script>
	/**
	 * @prop {string} id - O nome único para a âncora (será o ID do elemento).
	 */
	export let id = '';
</script>

{#if id}
	<div {id} aria-hidden="true"></div>
{/if}

<style>
	div {
		/* Opcional: A âncora pode ter um pequeno espaçamento vertical
       para garantir que o título linkado não fique colado no topo da tela. */
		position: relative;
		top: -80px; /* Ajuste este valor conforme a altura do seu header/menu fixo */
		visibility: hidden;
	}
</style>
