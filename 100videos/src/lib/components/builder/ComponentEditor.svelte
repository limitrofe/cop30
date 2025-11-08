<!-- src/lib/components/builder/ComponentEditor.svelte -->
<script>
	import { createEventDispatcher, onMount } from 'svelte';

	const dispatch = createEventDispatcher();

	export let component = null;

	let EditorComponent = null;
	let loading = false;

	// Mapa de editores disponíveis
	const editorMap = {
		'free-canvas': () => import('./editors/FreeCanvasEditor.svelte'),
		header: () => import('./editors/HeaderEditor.svelte'),
		text: () => import('./editors/TextEditor.svelte'),
		photo: () => import('./editors/PhotoEditor.svelte'),
		video: () => import('./editors/VideoEditor.svelte'),
		carousel: () => import('./editors/CarouselEditor.svelte'),
		gallery: () => import('./editors/GalleryEditor.svelte'),
		scrolly: () => import('./editors/ScrollyEditor.svelte'),
		scrollyframes: () => import('./editors/ScrollyFramesEditor.svelte'),
		'before-after': () => import('./editors/BeforeAfterEditor.svelte'),
		parallax: () => import('./editors/ParallaxEditor.svelte'),
		flourish: () => import('./editors/FlourishEditor.svelte'),
		character: () => import('./editors/CharacterEditor.svelte'),
		timeline: () => import('./editors/TimelineEditor.svelte'),
		document: () => import('./editors/DocumentEditor.svelte')
	};

	// Carregar editor específico quando componente muda
	$: if (component?.type) {
		loadEditor(component.type);
	}

	async function loadEditor(type) {
		loading = true;
		EditorComponent = null;

		try {
			const editorLoader = editorMap[type];

			if (editorLoader) {
				const module = await editorLoader();
				EditorComponent = module.default;
			} else {
				// Fallback para editor genérico
				const module = await import('./editors/GenericEditor.svelte');
				EditorComponent = module.default;
			}
		} catch (error) {
			console.warn(`Editor para ${type} não encontrado:`, error);
			// Fallback para editor simples
			const module = await import('./editors/SimpleEditor.svelte');
			EditorComponent = module.default;
		} finally {
			loading = false;
		}
	}

	function handleUpdate(event) {
		dispatch('update', event.detail);
	}
</script>

<div class="component-editor">
	{#if !component}
		<div class="no-component">
			<div class="placeholder">
				<div class="placeholder-icon">🎯</div>
				<h3>Selecione um Componente</h3>
				<p>Clique em um componente da sidebar para começar a editar.</p>
			</div>
		</div>
	{:else if loading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Carregando editor para {component.type}...</p>
		</div>
	{:else if EditorComponent}
		<div class="editor-container">
			<div class="editor-header">
				<div class="component-info">
					<h3>
						<span class="component-icon">
							{#if component.type === 'super-flex'}🎨
							{:else if component.type === 'header'}📰
							{:else if component.type === 'text'}📝
							{:else if component.type === 'photo'}🖼️
							{:else if component.type === 'video'}🎥
							{:else if component.type === 'carousel'}🎠
							{:else if component.type === 'gallery'}🖼️
							{:else if component.type === 'scrolly'}📜
							{:else if component.type === 'scrollyframes'}🎬
							{:else if component.type === 'before-after'}🔄
							{:else if component.type === 'parallax'}🌄
							{:else if component.type === 'flourish'}📊
							{:else if component.type === 'flourish-scrolly'}🌀
							{:else if component.type === 'character'}👤
							{:else if component.type === 'timeline'}⏰
							{:else if component.type === 'document'}📄
							{:else}📦{/if}
						</span>
						Editor: {component.type}
					</h3>
				</div>
			</div>

			<div class="editor-content">
				<svelte:component
					this={EditorComponent}
					bind:data={component.props}
					componentType={component.type}
					on:update={handleUpdate}
				/>
			</div>
		</div>
	{:else}
		<div class="error">
			<div class="error-icon">⚠️</div>
			<h3>Erro ao carregar editor</h3>
			<p>Editor para "{component.type}" não está disponível.</p>
			<button class="retry-btn" on:click={() => loadEditor(component.type)}>
				🔄 Tentar novamente
			</button>
		</div>
	{/if}
</div>

<style>
	.component-editor {
		height: 100%;
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.no-component,
	.loading,
	.error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 400px;
		text-align: center;
		color: #718096;
	}

	.placeholder-icon,
	.error-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.placeholder h3,
	.error h3 {
		margin: 0 0 0.5rem 0;
		color: #2d3748;
	}

	.placeholder p,
	.error p {
		margin: 0;
		font-size: 0.875rem;
	}

	.loading {
		gap: 1rem;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f3f3;
		border-top-color: #3182ce;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.editor-container {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.editor-header {
		padding: 1rem;
		border-bottom: 1px solid #e2e8f0;
		background: #f8fafc;
	}

	.component-info h3 {
		margin: 0;
		color: #2d3748;
		font-size: 1rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.component-icon {
		font-size: 1.25rem;
	}

	.editor-content {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
	}

	.retry-btn {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: #3182ce;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		transition: background-color 0.2s;
	}

	.retry-btn:hover {
		background: #2c5282;
	}

	/* Scrollbar customization */
	.editor-content::-webkit-scrollbar {
		width: 6px;
	}

	.editor-content::-webkit-scrollbar-track {
		background: #f1f5f9;
	}

	.editor-content::-webkit-scrollbar-thumb {
		background: #cbd5e0;
		border-radius: 3px;
	}

	.editor-content::-webkit-scrollbar-thumb:hover {
		background: #a0aec0;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.editor-header {
			padding: 0.75rem;
		}

		.editor-content {
			padding: 0.75rem;
		}

		.component-info h3 {
			font-size: 0.875rem;
		}
	}
</style>
