<script>
	import { createEventDispatcher } from 'svelte';
	import { get } from 'svelte/store';
	import FreeCanvasEditor from './editors/FreeCanvasEditor.svelte';
	import RichTextEditor from './RichTextEditor.svelte';
	import ScrollyStepsEditor from './editors/ScrollyStepsEditor.svelte';
	import GalleryItemsEditor from './editors/GalleryItemsEditor.svelte';
	import StoryRenderer from '$lib/components/StoryRenderer.svelte';
	import { storyParagraphs, storyStore, selectedBlockId } from '../stores/storyStore.js';
	import { getComponentDefinition } from '../component-registry.js';
	import { sanitizeStoryForExport, buildTypographyCSS } from '../utils.js';

	export let mode = 'content';

	const dispatch = createEventDispatcher();
	const paragraphs = storyParagraphs;

	let activeView = mode;
	let previewDevice = 'desktop';
	let drafts = {};
	let collapsedBlocks = {};
	let lastSelectedId = null;
	const DRAFTABLE_TYPES = new Set(['free-canvas']);

	$: exportedStory = sanitizeStoryForExport($storyStore);
	$: appearance = exportedStory.appearance || {};
	$: previewBackground =
		appearance.useGradient && appearance.gradient
			? appearance.gradient
			: previewDevice === 'mobile'
				? (appearance.backgroundColorMobile ?? appearance.backgroundColor ?? '#0b0d17')
				: (appearance.backgroundColor ?? '#0b0d17');
	$: previewTextColor = appearance.textColor || '#f8fafc';
	$: previewPadding =
		previewDevice === 'mobile'
			? appearance.pagePadding?.mobile || '0'
			: appearance.pagePadding?.desktop || '0';
	$: typographyCSS = buildTypographyCSS(appearance.typography, '.preview-frame');

	const selectBlock = (id) => {
		selectedBlockId.set(id);
		if (collapsedBlocks[id]) {
			collapsedBlocks = { ...collapsedBlocks, [id]: false };
		}
	};

	$: activeView = mode;

	const changeMode = (nextMode) => {
		if (nextMode === activeView) return;
		dispatch('modeChange', { mode: nextMode });
	};

	const handlePaletteDrop = (event, insertIndex = null) => {
		if (activeView !== 'content') return;
		event.preventDefault();
		const componentType = event.dataTransfer.getData('application/x-builder-component');
		const blockId = event.dataTransfer.getData('application/x-builder-block');

		if (componentType) {
			const block = storyStore.addBlock(componentType, insertIndex);
			if (block) {
				selectedBlockId.set(block.__id);
			}
			return;
		}

		if (blockId) {
			const targetIndex = insertIndex ?? get(paragraphs).length;
			storyStore.moveBlock(blockId, targetIndex > 0 ? targetIndex : 0);
			selectedBlockId.set(blockId);
		}
	};

	const handleDragOver = (event) => {
		if (activeView !== 'content') return;
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
	};

	const handleBlockDragStart = (event, block) => {
		event.dataTransfer.setData('application/x-builder-block', block.__id);
		event.dataTransfer.effectAllowed = 'move';
	};

	const removeBlock = (id) => {
		storyStore.removeBlock(id);
		const current = get(selectedBlockId);
		if (current === id) {
			selectedBlockId.set(null);
		}
	};

	const duplicateBlock = (id) => {
		const block = storyStore.duplicateBlock(id);
		if (block) {
			selectedBlockId.set(block.__id);
		}
	};

	const moveUp = (index) => {
		if (index <= 0) return;
		const block = get(paragraphs)[index];
		storyStore.moveBlock(block.__id, index - 1);
	};

	const moveDown = (index) => {
		const blocks = get(paragraphs);
		if (index >= blocks.length - 1) return;
		const block = blocks[index];
		storyStore.moveBlock(block.__id, index + 1);
	};

	const renderSummary = (block) => {
		if (block.type === 'texto' || block.type === 'citacao') {
			return block.text?.replace(/<[^>]+>/g, '').slice(0, 120) || 'Clique para editar o conteúdo';
		}
		if (block.title) return block.title;
		if (block.caption) return block.caption?.replace(/<[^>]+>/g, '');
		if (block.subtitle) return block.subtitle;
		return 'Sem conteúdo configurado ainda';
	};

	const safeClone = (value) => {
		try {
			if (typeof structuredClone === 'function') {
				return structuredClone(value);
			}
		} catch (error) {
			// fallback abaixo
		}
		return JSON.parse(JSON.stringify(value));
	};

	const ensureDraftForBlock = (block) => {
		if (!DRAFTABLE_TYPES.has(block.type)) return;
		if (!drafts[block.__id]) {
			drafts = {
				...drafts,
				[block.__id]: safeClone(block)
			};
		}
	};

	const pruneDrafts = () => {
		const currentIds = new Set($paragraphs.map((block) => block.__id));
		const updated = { ...drafts };
		let changed = false;
		for (const id in drafts) {
			if (!currentIds.has(id)) {
				delete updated[id];
				changed = true;
			}
		}
		if (changed) {
			drafts = updated;
		}
	};

	$: {
		pruneDrafts();
		$paragraphs.forEach((block) => ensureDraftForBlock(block));
	}

	const commitDraft = (block, nextData = null) => {
		if (!DRAFTABLE_TYPES.has(block.type)) return;
		const draft = nextData ?? drafts[block.__id];
		if (!draft) return;

		const payload = safeClone(draft);
		delete payload.__id;

		storyStore.replaceBlock(block.__id, { ...payload, type: block.type });
	};

	const handleFreeCanvasUpdate = (block, detail) => {
		const updated = detail ? safeClone(detail) : safeClone(drafts[block.__id] || {});
		if (!updated) return;

		drafts = {
			...drafts,
			[block.__id]: updated
		};

		commitDraft(block, updated);
	};

	const updateBlockFieldValue = (block, path, value) => {
		storyStore.updateBlockField(block.__id, path, value);
	};

	const ensureCollapsedState = (blocks) => {
		if (!Array.isArray(blocks)) return;
		const ids = new Set(blocks.map((block) => block.__id));
		let changed = false;
		const next = { ...collapsedBlocks };

		for (const block of blocks) {
			if (!(block.__id in next)) {
				next[block.__id] = true;
				changed = true;
			}
		}

		for (const id in next) {
			if (!ids.has(id)) {
				delete next[id];
				changed = true;
			}
		}

		if (changed) {
			collapsedBlocks = next;
		}
	};

	$: ensureCollapsedState($paragraphs);

	$: {
		const activeId = $selectedBlockId;
		if (activeId && activeId !== lastSelectedId && (collapsedBlocks[activeId] ?? true)) {
			collapsedBlocks = { ...collapsedBlocks, [activeId]: false };
		}
		lastSelectedId = activeId;
	}

	const toggleBlockCollapse = (id) => {
		const next = !(collapsedBlocks[id] ?? true);
		collapsedBlocks = { ...collapsedBlocks, [id]: next };
		if (!next) {
			selectedBlockId.set(id);
		}
	};
</script>

<div
	class="canvas"
	role="list"
	aria-label="Editor de blocos da matéria"
	on:dragover|preventDefault={handleDragOver}
	on:drop={handlePaletteDrop}
>
	<div class="canvas-toolbar">
		<div class="mode-toggle">
			<button class:active={activeView === 'content'} on:click={() => changeMode('content')}>
				Conteúdo
			</button>
			<button class:active={activeView === 'preview'} on:click={() => changeMode('preview')}>
				Preview
			</button>
		</div>

		{#if activeView === 'preview'}
			<div class="device-toggle">
				<button
					class:active={previewDevice === 'desktop'}
					on:click={() => (previewDevice = 'desktop')}
				>
					Desktop
				</button>
				<button
					class:active={previewDevice === 'mobile'}
					on:click={() => (previewDevice = 'mobile')}
				>
					Mobile
				</button>
			</div>
		{/if}
	</div>

	{#if activeView === 'content'}
		{#if $paragraphs.length === 0}
			<div class="empty-state">
				<p>Arraste um componente da coluna esquerda para começar sua história.</p>
			</div>
		{/if}

		{#each $paragraphs as block, index (block.__id)}
			<div
				class="dropzone"
				role="presentation"
				on:dragover|preventDefault={handleDragOver}
				on:drop={(event) => handlePaletteDrop(event, index)}
			></div>

			{@const definition = getComponentDefinition(block.type)}
			{@const bodyId = `block-body-${index}`}

			<article
				class="block-card"
				class:collapsed={collapsedBlocks[block.__id] ?? true}
				class:selected={$selectedBlockId === block.__id}
				draggable
				role="listitem"
				aria-label={`Bloco ${definition?.label || block.type}`}
				data-type={block.type}
				on:dragstart={(event) => handleBlockDragStart(event, block)}
				on:drop|stopPropagation={(event) => handlePaletteDrop(event, index + 1)}
				on:dragover|preventDefault={handleDragOver}
			>
				<header class="block-head">
					<button
						type="button"
						class="collapse-toggle"
						title={(collapsedBlocks[block.__id] ?? true) ? 'Expandir bloco' : 'Recolher bloco'}
						aria-label={(collapsedBlocks[block.__id] ?? true) ? 'Expandir bloco' : 'Recolher bloco'}
						aria-expanded={!(collapsedBlocks[block.__id] ?? true)}
						aria-controls={bodyId}
						on:click|stopPropagation={() => toggleBlockCollapse(block.__id)}
					>
						{(collapsedBlocks[block.__id] ?? true) ? '▸' : '▾'}
					</button>
					<div
						class="block-meta"
						role="button"
						tabindex="0"
						on:click={() => selectBlock(block.__id)}
						on:keydown={(event) => {
							if (event.key === 'Enter' || event.key === ' ') {
								event.preventDefault();
								selectBlock(block.__id);
							}
						}}
					>
						<span class="glyph">{definition?.icon || '✨'}</span>
						<div>
							<strong>{definition?.label || block.type}</strong>
							<small>#{index + 1} · {block.type}</small>
							{#if collapsedBlocks[block.__id] ?? true}
								<p class="block-summary">{renderSummary(block)}</p>
							{/if}
						</div>
					</div>
					<div class="block-actions" aria-label="Ações do bloco">
						<button
							type="button"
							on:click|stopPropagation={() => moveUp(index)}
							title="Mover para cima">↑</button
						>
						<button
							type="button"
							on:click|stopPropagation={() => moveDown(index)}
							title="Mover para baixo">↓</button
						>
						<button
							type="button"
							on:click|stopPropagation={() => duplicateBlock(block.__id)}
							title="Duplicar">⧉</button
						>
						<button
							type="button"
							class="danger"
							on:click|stopPropagation={() => removeBlock(block.__id)}
							title="Remover">✕</button
						>
					</div>
				</header>

				<div class="block-body" id={bodyId} hidden={collapsedBlocks[block.__id] ?? true}>
					{#if block.type === 'free-canvas'}
						{#if drafts[block.__id]}
							<FreeCanvasEditor
								data={drafts[block.__id]}
								on:update={(event) => handleFreeCanvasUpdate(block, event.detail)}
							/>
						{:else}
							<p class="loading">Carregando editor...</p>
						{/if}
					{:else if block.type === 'header'}
						<div class="inline-editor">
							<div class="inline-richtext">
								<span class="inline-label">Título (HTML)</span>
								<RichTextEditor
									value={block.title || ''}
									rows={4}
									placeholder="Digite o título principal"
									on:change={(event) => updateBlockFieldValue(block, 'title', event.detail.value)}
								/>
							</div>
							<div class="inline-richtext">
								<span class="inline-label">Linha fina / subtítulo</span>
								<RichTextEditor
									value={block.subtitle || ''}
									rows={3}
									placeholder="Explique em uma linha o contexto do título"
									on:change={(event) =>
										updateBlockFieldValue(block, 'subtitle', event.detail.value)}
								/>
							</div>
							<div class="inline-grid">
								<label>
									Autor(a)
									<input
										type="text"
										value={block.author || ''}
										placeholder="Quem assina a matéria"
										on:input={(event) =>
											updateBlockFieldValue(block, 'author', event.currentTarget.value)}
									/>
								</label>
								<label>
									Data
									<input
										type="text"
										value={block.date || ''}
										placeholder="ex: 18/09/2025"
										on:input={(event) =>
											updateBlockFieldValue(block, 'date', event.currentTarget.value)}
									/>
								</label>
							</div>
							<div class="inline-grid">
								<label>
									Cor autor/data
									<input
										type="text"
										value={block.metaColor || ''}
										placeholder="#ffffff"
										on:input={(event) =>
											updateBlockFieldValue(block, 'metaColor', event.currentTarget.value)}
									/>
								</label>
								<label>
									Cor texto sobre mídia
									<input
										type="text"
										value={block.onMediaColor || ''}
										placeholder="#ffffff"
										on:input={(event) =>
											updateBlockFieldValue(block, 'onMediaColor', event.currentTarget.value)}
									/>
								</label>
							</div>
						</div>
					{:else if block.type === 'galeria'}
						<div class="inline-editor">
							<GalleryItemsEditor
								value={block.images || []}
								on:change={(event) => updateBlockFieldValue(block, 'images', event.detail.value)}
							/>
						</div>
					{:else if block.type === 'scrolly'}
						<div class="inline-editor scrolly-block">
							<div class="scrolly-summary">
								<h3>Steps do scrollytelling</h3>
								<p>{block.steps?.length || 0} passo(s) configurado(s)</p>
							</div>
							<ScrollyStepsEditor
								value={block.steps || []}
								on:change={(event) => updateBlockFieldValue(block, 'steps', event.detail.value)}
							/>
						</div>
					{:else if block.type === 'intertitulo'}
						<div class="inline-editor">
							<div class="inline-richtext">
								<span class="inline-label">Intertítulo (HTML)</span>
								<RichTextEditor
									value={block.text || ''}
									rows={4}
									placeholder="Escreva o intertítulo"
									on:change={(event) => updateBlockFieldValue(block, 'text', event.detail.value)}
								/>
							</div>
							<div class="inline-grid">
								<label>
									Linha fina
									<RichTextEditor
										value={block.subtitle || ''}
										rows={3}
										placeholder="Complemento opcional"
										on:change={(event) =>
											updateBlockFieldValue(block, 'subtitle', event.detail.value)}
									/>
								</label>
								<label>
									Alinhamento
									<select
										value={block.align || 'center'}
										on:change={(event) => updateBlockFieldValue(block, 'align', event.target.value)}
									>
										<option value="left">Esquerda</option>
										<option value="center">Centro</option>
										<option value="right">Direita</option>
									</select>
								</label>
							</div>
						</div>
					{:else if block.type === 'texto'}
						<div class="inline-editor">
							<div class="inline-richtext">
								<span class="inline-label">Conteúdo (HTML)</span>
								<RichTextEditor
									value={block.text || ''}
									rows={8}
									placeholder="Digite o texto do parágrafo"
									on:change={(event) => updateBlockFieldValue(block, 'text', event.detail.value)}
								/>
							</div>

							<div class="inline-grid">
								<label>
									Estilo
									<select
										value={block.variant}
										on:change={(event) =>
											updateBlockFieldValue(block, 'variant', event.target.value)}
									>
										<option value="body">Corpo</option>
										<option value="lead">Lead</option>
										<option value="quote">Citação</option>
									</select>
								</label>
								<label>
									Alinhamento
									<select
										value={block.align}
										on:change={(event) => updateBlockFieldValue(block, 'align', event.target.value)}
									>
										<option value="left">Esquerda</option>
										<option value="center">Centro</option>
										<option value="right">Direita</option>
										<option value="justify">Justificado</option>
									</select>
								</label>
								<label>
									Largura máxima
									<input
										type="text"
										value={block.maxWidth}
										placeholder="720px"
										on:input={(event) =>
											updateBlockFieldValue(block, 'maxWidth', event.target.value)}
									/>
								</label>
							</div>
						</div>
					{:else if block.type === 'citacao'}
						<div class="inline-editor">
							<div class="inline-richtext">
								<span class="inline-label">Texto da citação (HTML)</span>
								<RichTextEditor
									value={block.text || ''}
									rows={6}
									placeholder="Digite o texto da citação"
									on:change={(event) => updateBlockFieldValue(block, 'text', event.detail.value)}
								/>
							</div>
							<div class="inline-grid">
								<label>
									Autor(a)
									<input
										type="text"
										value={block.author}
										on:input={(event) => updateBlockFieldValue(block, 'author', event.target.value)}
									/>
								</label>
								<label>
									Cargo/Função
									<input
										type="text"
										value={block.role}
										on:input={(event) => updateBlockFieldValue(block, 'role', event.target.value)}
									/>
								</label>
							</div>
						</div>
					{:else if block.type === 'foto'}
						<div class="inline-editor">
							<div class="inline-grid">
								<label>
									Imagem desktop
									<input
										type="url"
										value={block.src}
										on:input={(event) => updateBlockFieldValue(block, 'src', event.target.value)}
										placeholder="https://..."
									/>
								</label>
								<label>
									Imagem mobile
									<input
										type="url"
										value={block.srcMobile}
										on:input={(event) =>
											updateBlockFieldValue(block, 'srcMobile', event.target.value)}
										placeholder="https://..."
									/>
								</label>
							</div>
							<label>
								Texto alternativo
								<input
									type="text"
									value={block.alt}
									on:input={(event) => updateBlockFieldValue(block, 'alt', event.target.value)}
								/>
							</label>
							<div class="inline-richtext">
								<span class="inline-label">Legenda (HTML)</span>
								<RichTextEditor
									value={block.caption || ''}
									rows={4}
									placeholder="Escreva a legenda da imagem"
									on:change={(event) => updateBlockFieldValue(block, 'caption', event.detail.value)}
								/>
							</div>
							<label class="toggle">
								<input
									type="checkbox"
									checked={block.fullWidth}
									on:change={(event) =>
										updateBlockFieldValue(block, 'fullWidth', event.target.checked)}
								/>
								Ocupar largura total
							</label>
						</div>
					{:else if block.type === 'video'}
						<div class="inline-editor">
							<div class="video-grid">
								<label>
									Vídeo desktop (mp4)
									<input
										type="url"
										value={block.src}
										on:input={(event) => updateBlockFieldValue(block, 'src', event.target.value)}
										placeholder="https://..."
									/>
								</label>
								<label>
									Poster desktop
									<input
										type="url"
										value={block.poster}
										on:input={(event) => updateBlockFieldValue(block, 'poster', event.target.value)}
										placeholder="https://..."
									/>
								</label>
								<label>
									Vídeo mobile (mp4)
									<input
										type="url"
										value={block.srcMobile}
										on:input={(event) =>
											updateBlockFieldValue(block, 'srcMobile', event.target.value)}
										placeholder="https://..."
									/>
								</label>
								<label>
									Poster mobile
									<input
										type="url"
										value={block.posterMobile}
										on:input={(event) =>
											updateBlockFieldValue(block, 'posterMobile', event.target.value)}
										placeholder="https://..."
									/>
								</label>
							</div>
							<div class="video-grid">
								<label>
									Largura desktop
									<input
										type="text"
										value={block.customWidthDesktop || ''}
										placeholder="960px"
										on:input={(event) =>
											updateBlockFieldValue(block, 'customWidthDesktop', event.target.value)}
									/>
								</label>
								<label>
									Proporção desktop
									<input
										type="text"
										value={block.aspectRatioDesktop || ''}
										placeholder="16/9"
										on:input={(event) =>
											updateBlockFieldValue(block, 'aspectRatioDesktop', event.target.value)}
									/>
								</label>
								<label>
									Largura mobile
									<input
										type="text"
										value={block.customWidthMobile || ''}
										placeholder="360px"
										on:input={(event) =>
											updateBlockFieldValue(block, 'customWidthMobile', event.target.value)}
									/>
								</label>
								<label>
									Proporção mobile
									<input
										type="text"
										value={block.aspectRatioMobile || ''}
										placeholder="9/16"
										on:input={(event) =>
											updateBlockFieldValue(block, 'aspectRatioMobile', event.target.value)}
									/>
								</label>
							</div>
							<div class="inline-richtext">
								<span class="inline-label">Legenda (HTML)</span>
								<RichTextEditor
									value={block.caption || ''}
									rows={4}
									placeholder="Descreva o vídeo"
									on:change={(event) => updateBlockFieldValue(block, 'caption', event.detail.value)}
								/>
							</div>
							<label>
								<span>Crédito</span>
								<input
									type="text"
									value={block.credit || ''}
									placeholder="Ex: Autor / Agência"
									on:input={(event) => updateBlockFieldValue(block, 'credit', event.target.value)}
								/>
							</label>
							<div class="inline-toggle-row">
								<label class="pill-toggle">
									<input
										type="checkbox"
										checked={block.autoplay}
										on:change={(event) =>
											updateBlockFieldValue(block, 'autoplay', event.target.checked)}
									/>
									Autoplay
								</label>
								<label class="pill-toggle">
									<input
										type="checkbox"
										checked={block.controls}
										on:change={(event) =>
											updateBlockFieldValue(block, 'controls', event.target.checked)}
									/>
									Controles
								</label>
								<label class="pill-toggle">
									<input
										type="checkbox"
										checked={block.loop}
										on:change={(event) =>
											updateBlockFieldValue(block, 'loop', event.target.checked)}
									/>
									Loop
								</label>
								<label class="pill-toggle">
									<input
										type="checkbox"
										checked={block.showCaption}
										on:change={(event) =>
											updateBlockFieldValue(block, 'showCaption', event.target.checked)}
									/>
									Mostrar legenda
								</label>
							</div>
						</div>
					{:else}
						<div class="placeholder">
							<p>{renderSummary(block)}</p>
							<button type="button" on:click={() => selectBlock(block.__id)}
								>Abrir ajustes avançados →</button
							>
						</div>
					{/if}
				</div>
			</article>
		{/each}

		<div
			class="dropzone"
			role="presentation"
			on:dragover|preventDefault={handleDragOver}
			on:drop={(event) => handlePaletteDrop(event, $paragraphs.length)}
		></div>
	{:else}
		<div class={`preview-surface ${previewDevice}`}>
			<div
				class="preview-frame"
				data-theme={appearance.colorScheme || 'default'}
				style={`background:${previewBackground}; color:${previewTextColor}; padding:${previewPadding}; --surface-color:${appearance.surfaceColor || 'transparent'}; --accent-color:${appearance.accentColor || '#f97316'};`}
			>
				{#if typographyCSS}
					{@html `<style>${typographyCSS}</style>`}
				{/if}
				<StoryRenderer storyData={exportedStory} {previewDevice} />
			</div>
		</div>
	{/if}
</div>

<style>
	.canvas {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1.5rem;
		gap: 1rem;
		overflow-y: auto;
		min-height: 0;
		background: radial-gradient(circle at top, #eef2ff 0%, #f8fafc 60%);
	}

	.canvas-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: rgba(255, 255, 255, 0.9);
		padding: 0.5rem 0.75rem;
		border-radius: 999px;
		box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
		position: sticky;
		top: 0;
		z-index: 5;
		backdrop-filter: blur(12px);
	}

	.mode-toggle,
	.device-toggle {
		display: inline-flex;
		gap: 0.5rem;
		background: #e2e8f0;
		padding: 0.25rem;
		border-radius: 999px;
	}

	.mode-toggle button,
	.device-toggle button {
		border: none;
		background: transparent;
		color: #1e293b;
		font-weight: 600;
		font-size: 0.85rem;
		padding: 0.35rem 0.7rem;
		border-radius: 999px;
		cursor: pointer;
		transition:
			background 0.2s,
			color 0.2s;
	}

	.mode-toggle button.active,
	.device-toggle button.active {
		background: #1d4ed8;
		color: white;
		box-shadow: 0 6px 18px rgba(37, 99, 235, 0.25);
	}

	.dropzone {
		height: 12px;
		border-radius: 999px;
		margin: 0.5rem 0;
		border: 2px dashed transparent;
		transition:
			border 0.2s ease,
			background 0.2s ease;
	}

	.dropzone:hover,
	.dropzone:focus,
	.dropzone:focus-visible {
		border-color: #bfdbfe;
		background: rgba(191, 219, 254, 0.25);
	}

	.block-card {
		position: relative;
		background: rgba(255, 255, 255, 0.95);
		border: 1px solid rgba(226, 232, 240, 0.6);
		border-radius: 18px;
		padding: 1.25rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		box-shadow: 0 20px 40px -25px rgba(15, 23, 42, 0.45);
		transition:
			transform 0.18s ease,
			box-shadow 0.18s ease,
			border 0.18s ease;
	}

	.block-card:hover {
		transform: translateY(-2px) scale(1.002);
		box-shadow: 0 24px 64px -28px rgba(15, 23, 42, 0.5);
	}

	.block-card.selected {
		border-color: #2563eb;
		box-shadow: 0 28px 68px -28px rgba(37, 99, 235, 0.45);
	}

	.block-head {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.collapse-toggle {
		border: 1px solid #dbe2f3;
		background: #ffffff;
		border-radius: 8px;
		padding: 0.3rem;
		cursor: pointer;
		font-size: 0.85rem;
		line-height: 1;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #1f2937;
		transition:
			background 0.15s ease,
			border-color 0.15s ease;
	}

	.collapse-toggle:hover {
		background: #f1f5f9;
	}

	.collapse-toggle:focus-visible {
		outline: 2px solid #2563eb;
		outline-offset: 2px;
	}

	.block-meta {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		flex: 1;
		min-width: 0;
	}

	.block-meta:hover {
		opacity: 0.85;
	}

	.glyph {
		font-size: 1.8rem;
	}

	.block-meta strong {
		font-size: 1.05rem;
		color: #0f172a;
	}

	.block-meta small {
		color: #64748b;
		font-size: 0.78rem;
		display: block;
	}

	.block-summary {
		margin: 0.15rem 0 0;
		color: #475569;
		font-size: 0.78rem;
		max-width: 42ch;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.block-actions {
		display: inline-flex;
		gap: 0.4rem;
	}

	.block-actions button {
		border: none;
		background: #e2e8f0;
		color: #1f2937;
		font-size: 0.75rem;
		padding: 0.35rem 0.5rem;
		border-radius: 8px;
		cursor: pointer;
		transition:
			background 0.15s ease,
			transform 0.15s ease;
	}

	.block-actions button:hover {
		background: #cbd5f5;
		transform: translateY(-2px);
	}

	.block-actions .danger {
		background: #fee2e2;
		color: #b91c1c;
	}

	.block-body {
		border-radius: 14px;
		background: #f8fafc;
		padding: 1rem;
		border: 1px solid rgba(226, 232, 240, 0.7);
	}

	.block-card.collapsed {
		padding-bottom: 0.85rem;
	}

	.block-card.collapsed .block-body {
		display: none;
	}

	.inline-editor {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.inline-richtext {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.inline-richtext .inline-label {
		font-weight: 600;
		color: #1f2937;
		font-size: 0.82rem;
	}

	.video-dimensions {
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	}

	.video-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 0.7rem;
	}

	.scrolly-block {
		gap: 1.25rem;
	}

	.scrolly-summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		background: rgba(226, 232, 240, 0.4);
		border: 1px solid rgba(148, 163, 184, 0.35);
		border-radius: 12px;
		padding: 0.75rem 1rem;
	}

	.scrolly-summary h3 {
		margin: 0;
		font-size: 0.95rem;
		color: #0f172a;
	}

	.scrolly-summary p {
		margin: 0;
		font-size: 0.82rem;
		color: #475569;
	}

	.inline-editor label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-weight: 600;
		color: #1f2937;
		font-size: 0.85rem;
	}

	.inline-editor textarea,
	.inline-editor input,
	.inline-editor select {
		border: 1px solid #cbd5f5;
		border-radius: 10px;
		padding: 0.6rem 0.75rem;
		font-family: inherit;
		font-size: 0.88rem;
		background: white;
	}

	.inline-editor textarea:focus,
	.inline-editor input:focus,
	.inline-editor select:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
	}

	.inline-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 0.75rem;
	}

	.inline-toggle-row {
		display: flex;
		flex-wrap: wrap;
		gap: 1.2rem;
		margin-top: 0.75rem;
	}

	.pill-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: #475569;
	}

	.pill-toggle input[type='checkbox'] {
		appearance: none;
		width: 34px;
		height: 20px;
		border-radius: 999px;
		background: #e2e8f0;
		border: 1px solid #cbd5f5;
		position: relative;
		cursor: pointer;
		transition:
			background 0.2s ease,
			border-color 0.2s ease;
	}

	.pill-toggle input[type='checkbox']::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 12px;
		height: 12px;
		border-radius: 3px;
		border-right: 3px solid transparent;
		border-bottom: 3px solid transparent;
		transition: border-color 0.2s ease;
	}

	.pill-toggle input[type='checkbox']:checked {
		background: #2563eb;
		border-color: #1d4ed8;
	}

	.pill-toggle input[type='checkbox']:checked::after {
		border-color: #fff;
		transform: translate(-40%, -45%) rotate(45deg);
	}

	.pill-toggle input[type='checkbox']:focus-visible {
		outline: 3px solid rgba(37, 99, 235, 0.35);
		outline-offset: 2px;
	}

	.placeholder {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.placeholder p {
		margin: 0;
		color: #475569;
		font-size: 0.9rem;
	}

	.placeholder button {
		border: none;
		background: #1d4ed8;
		color: #ffffff;
		border-radius: 999px;
		padding: 0.35rem 0.85rem;
		font-size: 0.8rem;
		cursor: pointer;
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		border: 2px dashed #cbd5f5;
		border-radius: 16px;
		color: #64748b;
		background: rgba(255, 255, 255, 0.7);
	}

	.loading {
		text-align: center;
		color: #475569;
	}

	.preview-surface {
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding: 2rem 0;
	}

	.preview-frame {
		background: #0b0d17;
		color: #f8fafc;
		width: min(860px, 100%);
		border-radius: 18px;
		overflow: hidden;
		box-shadow: 0 24px 80px rgba(15, 23, 42, 0.35);
	}

	.preview-surface.mobile .preview-frame {
		width: min(420px, 100%);
		border-radius: 32px;
	}
</style>
