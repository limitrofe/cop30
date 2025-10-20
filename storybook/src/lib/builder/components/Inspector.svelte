<script>
	import { get } from 'svelte/store';
	import FieldEditor from './FieldEditor.svelte';
	import AnimationsEditor from './AnimationsEditor.svelte';
	import { storyStore, selectedBlock, selectedBlockId } from '../stores/storyStore.js';
	import { metadataFields, creditsFields } from '../story-defaults.js';
	import { getComponentDefinition } from '../component-registry.js';
	import { getByPath, removeInternalFields } from '../utils.js';

	let activeSection = 'project';
	let rawJson = '';
	let jsonError = '';
	let lastSelectedBlockId = null;

	const clone = (value) => {
		try {
			return structuredClone(value);
		} catch (error) {
			return JSON.parse(JSON.stringify(value));
		}
	};

	$: block = $selectedBlock;
	$: definition = block ? getComponentDefinition(block.type) : null;
	$: if (block) {
		rawJson = JSON.stringify(removeInternalFields(block), null, 2);
		if (block.__id !== lastSelectedBlockId) {
			activeSection = 'block';
			lastSelectedBlockId = block.__id;
		}
	} else {
		rawJson = '';
		lastSelectedBlockId = null;
		if (activeSection !== 'project') {
			activeSection = 'project';
		}
	}

	const handleMetadataChange = (path, event) => {
		storyStore.updateMetadata(path, event.detail.value);
	};

	const handleBlockFieldChange = (path, event) => {
		const blockId = get(selectedBlockId);
		if (!blockId) return;
		storyStore.updateBlockField(blockId, path, event.detail.value);
	};

	const gsapDisabledTypes = new Set(['chart-bar', 'chart-line', 'chart']);
	const isGsapSupported = (block) =>
		block && !gsapDisabledTypes.has((block.type || '').toLowerCase());

	const handleBlockJsonBlur = () => {
		const blockId = get(selectedBlockId);
		if (!blockId) return;

		try {
			const parsed = JSON.parse(rawJson);
			jsonError = '';
			storyStore.replaceBlock(blockId, { ...parsed, type: parsed.type || block.type });
		} catch (error) {
			jsonError = error.message;
		}
	};

	const blockHasAdvancedFields = (definition) => Boolean(definition?.fields?.length);

	const sectionAppearanceFields = [
		{
			path: 'section.backgroundSource',
			label: 'Tipo de fundo',
			type: 'select',
			options: [
				{ label: 'Cor sólida', value: 'color' },
				{ label: 'Imagem', value: 'image' },
				{ label: 'Vídeo', value: 'video' }
			],
			defaultValue: 'color'
		},
		{ path: 'section.backgroundColor', label: 'Cor de fundo da seção', type: 'color' },
		{ path: 'section.backgroundImageDesktop', label: 'Imagem desktop (URL)', type: 'url' },
		{ path: 'section.backgroundImageMobile', label: 'Imagem mobile (URL)', type: 'url' },
		{ path: 'section.backgroundVideoDesktop', label: 'Vídeo desktop (URL)', type: 'url' },
		{ path: 'section.backgroundVideoMobile', label: 'Vídeo mobile (URL)', type: 'url' },
		{
			path: 'section.backgroundVideoPosterDesktop',
			label: 'Poster vídeo desktop (URL)',
			type: 'url'
		},
		{
			path: 'section.backgroundVideoPosterMobile',
			label: 'Poster vídeo mobile (URL)',
			type: 'url'
		},
		{ path: 'section.textColor', label: 'Cor do texto da seção', type: 'color' },
		{
			path: 'section.paddingTop',
			label: 'Padding superior',
			type: 'text',
			placeholder: 'ex: 3rem'
		},
		{
			path: 'section.paddingBottom',
			label: 'Padding inferior',
			type: 'text',
			placeholder: 'ex: 3rem'
		}
	];
</script>

<div class="inspector">
	<div class="peek">
		<button
			class:active={activeSection === 'project'}
			type="button"
			on:click={() => (activeSection = 'project')}
		>
			Projeto
		</button>
		<button
			class:active={activeSection === 'block'}
			class:disabled={!block}
			type="button"
			on:click={() => block && (activeSection = 'block')}
			disabled={!block}
		>
			Bloco
		</button>
	</div>

	<div class="pane-container">
		{#if activeSection === 'project'}
			<section class="pane pane--project" aria-label="Informações do projeto">
				<header class="pane-head">
					<div>
						<h3>Projeto</h3>
						<p>Ajustes globais para título, SEO e compartilhamento.</p>
					</div>
				</header>

				<div class="fields card">
					{#each metadataFields as field}
						<FieldEditor
							{field}
							value={getByPath($storyStore, field.path)}
							on:change={(event) => handleMetadataChange(field.path, event)}
						/>
					{/each}
				</div>

				<div class="fields card">
					<h4>Créditos</h4>
					{#each creditsFields as field}
						<FieldEditor
							{field}
							value={getByPath($storyStore, field.path)}
							on:change={(event) => handleMetadataChange(field.path, event)}
						/>
					{/each}
				</div>
			</section>
		{:else}
			<section
				class="pane pane--block"
				aria-live="polite"
				aria-label="Configurações do bloco selecionado"
			>
				{#if block && definition}
					<header class="pane-head">
						<div class="badge">
							<span class="icon">{definition.icon}</span>
							<div>
								<strong>{definition.label}</strong>
								<small>ID {block.__id}</small>
							</div>
						</div>
						<button class="ghost" type="button" on:click={() => selectedBlockId.set(null)}>
							limpar seleção
						</button>
					</header>

					{#if block.type === 'free-canvas'}
						<div class="info-card">
							<h4>Free Canvas</h4>
							<p>
								Use o editor visual para arrastar e editar os elementos. O JSON abaixo é apenas para
								ajustes avançados.
							</p>
						</div>
					{/if}
					{#if block.type === 'flourish-scrolly'}
						<div class="info-card">
							<h4>Flourish Scrolly</h4>
							<p>
								Configure a URL do story e gerencie os passos utilizando o formulário de steps logo
								abaixo.
							</p>
						</div>
					{/if}

					{#if blockHasAdvancedFields(definition)}
						<div class="fields card">
							{#each definition.fields as field}
								<FieldEditor
									{field}
									value={getByPath(block, field.path)}
									on:change={(event) => handleBlockFieldChange(field.path, event)}
								/>
							{/each}
						</div>
					{:else}
						<div class="info-card">
							<h4>Sem campos configuráveis</h4>
							<p>
								Este bloco não possui campos extras além dos exibidos no editor principal. Clique em
								“Avançado” para editar o JSON bruto.
							</p>
						</div>
					{/if}

					<div class="fields card">
						<h4>Aparência da seção</h4>
						{#each sectionAppearanceFields as field}
							<FieldEditor
								{field}
								value={getByPath(block, field.path)}
								on:change={(event) => handleBlockFieldChange(field.path, event)}
							/>
						{/each}
					</div>

					{#if isGsapSupported(block)}
						<div class="fields card card--gsap">
							<div class="card-headline">
								<h4>Animações (GSAP)</h4>
								<p>
									Defina como elementos deste bloco entram na tela com presets ou JSON avançado.
									Seletores são relativos à própria seção.
								</p>
							</div>
							<AnimationsEditor
								value={block.gsap}
								on:change={(event) =>
									storyStore.updateBlockField(block.__id, 'gsap', event.detail.value)}
							/>
						</div>
					{/if}

					<details class="advanced" open>
						<summary>JSON completo do bloco</summary>
						<textarea
							bind:value={rawJson}
							on:blur={handleBlockJsonBlur}
							class:error={jsonError}
							aria-invalid={Boolean(jsonError)}
							aria-describedby={jsonError ? 'json-error' : undefined}
						></textarea>
						{#if jsonError}
							<p id="json-error" class="error">{jsonError}</p>
						{/if}
					</details>
				{:else}
					<div class="empty">
						<h4>Selecione um bloco</h4>
						<p>Escolha um item no painel central para editar suas configurações.</p>
					</div>
				{/if}
			</section>
		{/if}
	</div>
</div>

<style>
	.inspector {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem 1.75rem 2rem;
		min-height: 0;
		height: 100%;
		box-sizing: border-box;
		overflow: hidden;
	}

	.peek {
		display: inline-flex;
		gap: 0.5rem;
		background: rgba(226, 232, 240, 0.6);
		padding: 0.3rem;
		border-radius: 999px;
		align-self: center;
	}

	.peek button {
		border: none;
		background: transparent;
		color: #475569;
		font-weight: 600;
		padding: 0.45rem 1rem;
		border-radius: 999px;
		cursor: pointer;
		transition:
			background 0.2s ease,
			color 0.2s ease;
	}

	.peek button.active {
		background: #1d4ed8;
		color: white;
		box-shadow: 0 10px 22px rgba(37, 99, 235, 0.25);
	}

	.peek button.disabled,
	.peek button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.pane-container {
		flex: 1;
		min-height: 0;
		display: flex;
	}

	.pane {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		width: 100%;
	}

	.pane--project {
		background: rgba(255, 255, 255, 0.85);
		border-radius: 18px;
		padding: 1.25rem;
		box-shadow: 0 16px 32px rgba(148, 163, 184, 0.18);
		border: 1px solid rgba(226, 232, 240, 0.6);
		overflow-y: auto;
	}

	.pane--block {
		overflow-y: auto;
		padding-right: 0.5rem;
	}

	.pane-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.pane-head h3 {
		margin: 0;
		font-size: 1rem;
		color: #0f172a;
	}

	.pane-head p {
		margin: 0;
		color: #64748b;
		font-size: 0.85rem;
	}

	.badge {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 14px;
		background: rgba(255, 255, 255, 0.7);
		box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.25);
	}

	.badge .icon {
		font-size: 1.5rem;
	}

	.badge strong {
		display: block;
		font-size: 0.95rem;
		color: #0f172a;
	}

	.badge small {
		color: #94a3b8;
		font-size: 0.75rem;
	}

	.ghost {
		border: none;
		background: transparent;
		color: #64748b;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.card {
		background: rgba(255, 255, 255, 0.9);
		border-radius: 16px;
		padding: 1rem;
		box-shadow: 0 12px 28px rgba(148, 163, 184, 0.18);
		border: 1px solid rgba(226, 232, 240, 0.6);
	}

	.card h4 {
		margin: 0 0 0.5rem;
		font-size: 0.85rem;
		color: #334155;
	}

	.card-headline {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-bottom: 0.5rem;
	}

	.card-headline h4 {
		margin: 0;
	}

	.card-headline p {
		margin: 0;
		color: #64748b;
		font-size: 0.75rem;
		line-height: 1.4;
	}

	.card--gsap {
		gap: 0.75rem;
	}

	.info-card {
		background: rgba(255, 255, 255, 0.6);
		border-radius: 14px;
		padding: 1rem;
		color: #475569;
		font-size: 0.85rem;
		border: 1px dashed rgba(148, 163, 184, 0.5);
	}

	.info-card h4 {
		margin: 0 0 0.35rem;
		font-size: 0.9rem;
		color: #1f2937;
	}

	.advanced {
		border-top: 1px solid #e2e8f0;
		padding-top: 1rem;
	}

	.advanced summary {
		cursor: pointer;
		font-weight: 600;
		color: #1d4ed8;
	}

	textarea {
		width: 100%;
		border-radius: 8px;
		border: 1px solid #cbd5f5;
		padding: 0.75rem;
		font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
		font-size: 0.85rem;
		background: rgba(255, 255, 255, 0.85);
	}

	textarea:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
	}

	textarea.error {
		border-color: #dc2626;
	}

	.error {
		display: block;
		margin-top: 0.5rem;
		color: #dc2626;
		font-size: 0.75rem;
	}

	.empty {
		background: rgba(255, 255, 255, 0.7);
		border-radius: 16px;
		padding: 2rem 1.5rem;
		text-align: center;
		color: #475569;
	}

	.empty h4 {
		margin: 0 0 0.5rem;
		color: #1f2937;
	}

	.empty p {
		margin: 0;
		font-size: 0.9rem;
		color: #64748b;
	}
</style>
