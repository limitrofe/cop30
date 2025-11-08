<script>
	import { createEventDispatcher } from 'svelte';
	import { storyStore } from '../stores/storyStore.js';
	import { loadStoryFromServer, saveStoryToServer, exportStoryFile } from '../story-service.js';

	export let mode = 'content';

	const dispatch = createEventDispatcher();

	let statusMessage = '';
	let statusType = 'idle';
	let fileInput;

	const setStatus = (message, type = 'info') => {
		statusMessage = message;
		statusType = type;
		if (message) {
			setTimeout(() => {
				statusMessage = '';
				statusType = 'idle';
			}, 4000);
		}
	};

	const handleNewStory = () => {
		if (confirm('Tem certeza? Isto limpará a história atual.')) {
			storyStore.reset();
			setStatus('História resetada.', 'info');
		}
	};

	const handleSave = async () => {
		try {
			const response = await saveStoryToServer();
			setStatus(response?.message || 'Arquivo story.json atualizado.', 'success');
		} catch (error) {
			console.error(error);
			setStatus(error.message || 'Não foi possível salvar o arquivo.', 'error');
		}
	};

	const handleExport = () => {
		exportStoryFile();
		setStatus('Download iniciado.', 'success');
	};

	const handleImportClick = () => {
		fileInput?.click();
	};

	const handleFileChange = async (event) => {
		const file = event.currentTarget.files?.[0];
		if (!file) return;
		try {
			const text = await file.text();
			const data = JSON.parse(text);
			storyStore.setStory(data);
			setStatus('História importada com sucesso.', 'success');
		} catch (error) {
			setStatus('JSON inválido. Revise o arquivo selecionado.', 'error');
		} finally {
			event.currentTarget.value = '';
		}
	};

	const handleReload = async () => {
		const data = await loadStoryFromServer();
		if (data) {
			setStatus('story.json carregado do disco.', 'success');
		} else {
			setStatus('Nenhum story.json encontrado ainda.', 'info');
		}
	};

	const changeMode = (nextMode) => {
		if (nextMode === mode) return;
		dispatch('changeMode', { mode: nextMode });
	};
</script>

<header class="toolbar">
	<div class="brand">
		<span class="spark">✨</span>
		<div>
			<strong>Story Builder</strong>
			<small>Um playground para narrativas épicas</small>
		</div>
	</div>

	<div class="mode-switch">
		<button class:active={mode === 'content'} on:click={() => changeMode('content')}>
			Construir
		</button>
		<button class:active={mode === 'preview'} on:click={() => changeMode('preview')}>
			Visualizar
		</button>
	</div>

	<div class="actions">
		<button class="ghost" on:click={handleNewStory} title="Limpar história"> Novo </button>
		<button class="ghost" on:click={handleReload} title="Carregar story.json salvo">
			Recarregar
		</button>
		<button class="primary" on:click={handleSave} title="Salvar story.json"> Salvar </button>
		<button class="ghost" on:click={handleExport} title="Exportar JSON"> Exportar </button>
		<button class="ghost" on:click={handleImportClick} title="Importar JSON"> Importar </button>
		<input
			type="file"
			accept="application/json"
			bind:this={fileInput}
			on:change={handleFileChange}
			hidden
		/>
	</div>

	{#if statusMessage}
		<div
			class="status"
			class:success={statusType === 'success'}
			class:error={statusType === 'error'}
		>
			{statusMessage}
		</div>
	{/if}
</header>

<style>
	.toolbar {
		position: sticky;
		top: 0;
		z-index: 10;
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 1.25rem;
		padding: 1rem 2rem;
		background: linear-gradient(
			120deg,
			rgba(30, 64, 175, 0.85) 0%,
			rgba(29, 78, 216, 0.8) 45%,
			rgba(14, 165, 233, 0.75) 100%
		);
		color: white;
		box-shadow: 0 18px 40px rgba(15, 23, 42, 0.25);
		backdrop-filter: blur(18px);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 0.9rem;
	}

	.spark {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 42px;
		height: 42px;
		border-radius: 14px;
		background: rgba(255, 255, 255, 0.2);
		font-size: 1.35rem;
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);
	}

	.brand strong {
		font-size: 1.05rem;
		letter-spacing: 0.02em;
	}

	.brand small {
		display: block;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.75);
	}

	.mode-switch {
		margin: 0 auto;
		background: rgba(15, 23, 42, 0.18);
		border-radius: 999px;
		padding: 0.25rem;
		display: inline-flex;
		gap: 0.35rem;
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
	}

	.mode-switch button {
		border: none;
		background: transparent;
		color: rgba(255, 255, 255, 0.75);
		font-weight: 600;
		padding: 0.45rem 1.15rem;
		border-radius: 999px;
		cursor: pointer;
		transition:
			background 0.2s ease,
			color 0.2s ease,
			transform 0.2s ease;
	}

	.mode-switch button.active {
		background: white;
		color: #1d4ed8;
		box-shadow: 0 12px 24px rgba(15, 23, 42, 0.35);
	}

	.mode-switch button:hover {
		transform: translateY(-1px);
	}

	.actions {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
	}

	button {
		border: none;
		border-radius: 999px;
		padding: 0.45rem 1.05rem;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			background 0.15s ease;
	}

	button:hover {
		transform: translateY(-1px);
		box-shadow: 0 12px 24px rgba(15, 23, 42, 0.25);
	}

	.ghost {
		background: rgba(255, 255, 255, 0.15);
		color: white;
	}

	.ghost:hover {
		background: rgba(255, 255, 255, 0.25);
	}

	.primary {
		background: white;
		color: #1d4ed8;
	}

	.primary:hover {
		background: #eff6ff;
		color: #1d4ed8;
	}

	.status {
		grid-column: 1 / -1;
		justify-self: center;
		margin-top: 0.4rem;
		font-size: 0.8rem;
		padding: 0.35rem 0.8rem;
		border-radius: 999px;
		background: rgba(15, 23, 42, 0.3);
		color: rgba(255, 255, 255, 0.9);
	}

	.status.success {
		background: rgba(34, 197, 94, 0.2);
		color: #bbf7d0;
	}

	.status.error {
		background: rgba(248, 113, 113, 0.2);
		color: #fecaca;
	}
</style>
