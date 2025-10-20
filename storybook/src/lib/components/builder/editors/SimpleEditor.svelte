<!-- src/lib/components/builder/editors/SimpleEditor.svelte -->
<script>
	import { createEventDispatcher } from 'svelte';
	import { ColorPicker } from '$lib/components/builder/controls/index.js';

	const dispatch = createEventDispatcher();

	export let data = {};
	export let componentType = 'unknown';

	function updateParent() {
		dispatch('update');
	}

	function getFieldType(key, value) {
		if (key.includes('color') || key.includes('Color')) return 'color';
		if (key.includes('url') || key.includes('src') || key.includes('href')) return 'url';
		if (typeof value === 'boolean') return 'checkbox';
		if (typeof value === 'number') return 'number';
		if (typeof value === 'string' && value.length > 50) return 'textarea';
		return 'text';
	}

	function getFieldLabel(key) {
		return key
			.replace(/([A-Z])/g, ' $1')
			.replace(/^./, (str) => str.toUpperCase())
			.trim();
	}
</script>

<div class="simple-editor">
	<div class="editor-header">
		<h3>⚙️ Editor Básico: {componentType}</h3>
		<p class="editor-note">Editor específico não disponível. Usando editor genérico.</p>
	</div>

	<div class="editor-content">
		{#if Object.keys(data).length === 0}
			<div class="empty-data">
				<p>🔧 Nenhuma propriedade configurável encontrada.</p>
			</div>
		{:else}
			<div class="fields-list">
				{#each Object.entries(data) as [key, value]}
					{@const fieldType = getFieldType(key, value)}
					<div class="field">
						{#if fieldType !== 'color'}
							<label for={key}>{getFieldLabel(key)}:</label>
						{/if}

						{#if fieldType === 'checkbox'}
							<input
								id={key}
								type="checkbox"
								bind:checked={data[key]}
								on:change={updateParent}
								class="checkbox-input"
							/>
						{:else if fieldType === 'color'}
							<div class="color-field">
								<ColorPicker
									label={getFieldLabel(key)}
									bind:value={data[key]}
									showPresets={false}
									showAlpha={true}
									allowClear={true}
									clearValue="transparent"
									on:change={updateParent}
								/>
							</div>
						{:else if fieldType === 'textarea'}
							<textarea
								id={key}
								bind:value={data[key]}
								on:input={updateParent}
								rows="4"
								placeholder="Conteúdo..."
							></textarea>
						{:else if getFieldType(key, value) === 'number'}
							<input
								id={key}
								type="number"
								bind:value={data[key]}
								on:input={updateParent}
								step="any"
							/>
						{:else if getFieldType(key, value) === 'url'}
							<input
								id={key}
								type="url"
								bind:value={data[key]}
								on:input={updateParent}
								placeholder="https://exemplo.com"
							/>
						{:else}
							<input
								id={key}
								type="text"
								bind:value={data[key]}
								on:input={updateParent}
								placeholder="Valor..."
							/>
						{/if}
					</div>
				{/each}
			</div>

			<!-- JSON Debug -->
			<details class="json-debug">
				<summary>🔍 Debug JSON</summary>
				<pre>{JSON.stringify(data, null, 2)}</pre>
			</details>
		{/if}
	</div>
</div>

<style>
	.simple-editor {
		background: white;
		border-radius: 8px;
		overflow: hidden;
	}

	.editor-header {
		padding: 1rem;
		background: #fef3c7;
		border-bottom: 1px solid #f59e0b;
	}

	.editor-header h3 {
		margin: 0 0 0.5rem 0;
		color: #92400e;
		font-size: 14px;
		font-weight: 600;
	}

	.editor-note {
		margin: 0;
		color: #92400e;
		font-size: 12px;
		font-style: italic;
	}

	.editor-content {
		padding: 1rem;
	}

	.empty-data {
		text-align: center;
		padding: 2rem;
		color: #6b7280;
	}

	.fields-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.field label {
		font-weight: 500;
		color: #374151;
		font-size: 13px;
	}

	.field input,
	.field textarea {
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		font-size: 14px;
	}

	.field textarea {
		min-height: 80px;
		resize: vertical;
		font-family: monospace;
	}

	.checkbox-input {
		width: auto !important;
		margin: 0;
	}

	.color-field :global(.color-picker) {
		width: 100%;
	}

	.json-debug {
		margin-top: 2rem;
		border-top: 1px solid #e5e7eb;
		padding-top: 1rem;
	}

	.json-debug summary {
		cursor: pointer;
		padding: 0.5rem;
		background: #f3f4f6;
		border-radius: 4px;
		font-weight: 500;
		font-size: 13px;
		color: #374151;
	}

	.json-debug pre {
		background: #1f2937;
		color: #e5e7eb;
		padding: 1rem;
		border-radius: 4px;
		overflow-x: auto;
		font-size: 11px;
		margin-top: 0.5rem;
		max-height: 300px;
		overflow-y: auto;
	}
</style>
