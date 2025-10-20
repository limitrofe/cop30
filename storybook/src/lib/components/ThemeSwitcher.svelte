<script>
	import { storyConfig, storyActions } from '$lib/stores/storyStores.js';

	// ✅ LISTA ATUALIZADA COM OS SEUS 20 TEMAS
	const themes = [
		{ id: 'default', name: 'Padrão (Claro)' },
		{ id: 'dark', name: 'Padrão (Escuro)' },
		{ id: 'mundo-claro', name: 'Mundo (Claro)' },
		{ id: 'mundo-escuro', name: 'Mundo (Escuro)' },
		{ id: 'natureza', name: 'Natureza (Verde)' },
		{ id: 'lavanda', name: 'Lavanda (Roxo)' },
		{ id: 'sepia', name: 'Sépia (Oliva)' },
		{ id: 'pop-art', name: 'Pop Art' },
		{ id: 'alto-contraste', name: 'Alto Contraste' },
		{ id: 'coral', name: 'Coral (Laranja)' },
		{ id: 'brisa-clara', name: 'Brisa Clara' },
		{ id: 'brisa-escura', name: 'Brisa Escura' },
		{ id: 'nevoa', name: 'Névoa' },
		{ id: 'vinho-nobre', name: 'Vinho Nobre' },
		{ id: 'aurora', name: 'Aurora' },
		{ id: 'grafite', name: 'Grafite' },
		{ id: 'acqua', name: 'Acqua' },
		{ id: 'dourado', name: 'Dourado' },
		{ id: 'vermelho-profundo', name: 'Vermelho Profundo' },
		{ id: 'neon-sutil', name: 'Neon Sutil' },
		{ id: 'dias-perfeitos', name: 'Dias Perfeitos' }
	];
</script>

<div class="theme-switcher">
	<label for="theme-select">Tema:</label>
	<select
		id="theme-select"
		bind:value={$storyConfig.theme}
		on:change={(e) => storyActions.setTheme(e.currentTarget.value)}
	>
		{#each themes as theme}
			<option value={theme.id}>{theme.name}</option>
		{/each}
	</select>
</div>

<style>
	.theme-switcher {
		padding: 1rem;
		text-align: center;
		background-color: var(--color-highlight-bg);
		border-radius: 8px;
	}
	label {
		margin-right: 0.5rem;
		color: var(--color-subtle-text);
	}
	select {
		padding: 0.5rem;
		border: 1px solid var(--color-border);
		background-color: var(--color-background);
		color: var(--color-text);
		border-radius: 4px;
		cursor: pointer;
	}
</style>
