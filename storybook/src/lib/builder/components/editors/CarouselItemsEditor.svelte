<script>
	import { createEventDispatcher } from 'svelte';
	import RichTextEditor from '../RichTextEditor.svelte';

	export let value = [];

	const dispatch = createEventDispatcher();
	let items = [];
	let isUpdating = false;

	const buildDefaults = () => ({
		type: 'image',
		src: '',
		srcMobile: '',
		alt: '',
		title: '',
		caption: '',
		credit: '',
		content: '',
		videoId: '',
		videoIdDesktop: '',
		videoIdMobile: '',
		hasAds: false
	});

	$: if (!isUpdating) {
		items =
			Array.isArray(value) && value.length
				? value.map((item) => ({ ...buildDefaults(), ...structuredClone(item) }))
				: [buildDefaults()];
	}

	function emit(updated) {
		isUpdating = true;
		dispatch('change', { value: updated });
		Promise.resolve().then(() => {
			isUpdating = false;
		});
	}

	function addItem() {
		const updated = [...items, buildDefaults()];
		items = updated;
		emit(updated);
	}

	function duplicateItem(index) {
		const clone = { ...items[index] };
		const updated = [...items.slice(0, index + 1), { ...clone }, ...items.slice(index + 1)];
		items = updated;
		emit(updated);
	}

	function removeItem(index) {
		if (items.length === 1) {
			const updated = [buildDefaults()];
			items = updated;
			emit(updated);
			return;
		}
		const updated = items.filter((_, i) => i !== index);
		items = updated;
		emit(updated);
	}

	function moveItem(index, direction) {
		const target = index + direction;
		if (target < 0 || target >= items.length) return;
		const updated = [...items];
		const [item] = updated.splice(index, 1);
		updated.splice(target, 0, item);
		items = updated;
		emit(updated);
	}

	function updateItem(index, key, value) {
		const updated = items.map((item, i) => (i === index ? { ...item, [key]: value } : item));
		items = updated;
		emit(updated);
	}

	const typeOptions = [
		{ label: 'Imagem', value: 'image' },
		{ label: 'Vídeo', value: 'video' },
		{ label: 'Globo Player', value: 'globo-player' },
		{ label: 'Conteúdo HTML', value: 'content' }
	];
</script>

<div class="items-editor">
	{#each items as item, index}
		<article class="item-card">
			<header>
				<div>
					<strong>Slide {index + 1}</strong>
					<span>{item.title || item.caption || item.alt || item.type}</span>
				</div>
				<div class="actions">
					<button
						type="button"
						on:click={() => moveItem(index, -1)}
						title="Mover para cima"
						disabled={index === 0}>↑</button
					>
					<button
						type="button"
						on:click={() => moveItem(index, +1)}
						title="Mover para baixo"
						disabled={index === items.length - 1}>↓</button
					>
					<button type="button" on:click={() => duplicateItem(index)} title="Duplicar">⧉</button>
					<button type="button" class="danger" on:click={() => removeItem(index)} title="Remover"
						>✕</button
					>
				</div>
			</header>

			<div class="fields">
				<div class="grid">
					<label>
						<span>Tipo de slide</span>
						<select
							value={item.type}
							on:change={(event) => updateItem(index, 'type', event.currentTarget.value)}
						>
							{#each typeOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</label>
					<label>
						<span>Título (opcional)</span>
						<input
							type="text"
							value={item.title}
							placeholder="Título exibido acima do slide"
							on:input={(event) => updateItem(index, 'title', event.currentTarget.value)}
						/>
					</label>
				</div>

				{#if item.type === 'image'}
					<div class="grid">
						<label>
							<span>Imagem desktop</span>
							<input
								type="url"
								value={item.src}
								placeholder="https://..."
								on:input={(event) => updateItem(index, 'src', event.currentTarget.value)}
							/>
						</label>
						<label>
							<span>Imagem mobile</span>
							<input
								type="url"
								value={item.srcMobile}
								placeholder="https://..."
								on:input={(event) => updateItem(index, 'srcMobile', event.currentTarget.value)}
							/>
						</label>
					</div>
					<label>
						<span>Texto alternativo</span>
						<input
							type="text"
							value={item.alt}
							on:input={(event) => updateItem(index, 'alt', event.currentTarget.value)}
						/>
					</label>
				{:else if item.type === 'video'}
					<div class="grid">
						<label>
							<span>Vídeo desktop</span>
							<input
								type="url"
								value={item.src}
								placeholder="https://...mp4"
								on:input={(event) => updateItem(index, 'src', event.currentTarget.value)}
							/>
						</label>
						<label>
							<span>Vídeo mobile</span>
							<input
								type="url"
								value={item.srcMobile}
								placeholder="https://...mp4"
								on:input={(event) => updateItem(index, 'srcMobile', event.currentTarget.value)}
							/>
						</label>
					</div>
				{:else if item.type === 'globo-player'}
					<div class="grid">
						<label>
							<span>ID do vídeo (desktop)</span>
							<input
								type="text"
								value={item.videoIdDesktop}
								placeholder="Ex.: 1234567"
								on:input={(event) => updateItem(index, 'videoIdDesktop', event.currentTarget.value)}
							/>
						</label>
						<label>
							<span>ID do vídeo (mobile)</span>
							<input
								type="text"
								value={item.videoIdMobile}
								placeholder="Ex.: 1234567"
								on:input={(event) => updateItem(index, 'videoIdMobile', event.currentTarget.value)}
							/>
						</label>
					</div>
					<label>
						<span>ID fallback (opcional)</span>
						<input
							type="text"
							value={item.videoId}
							placeholder="Usado se desktop/mobile não forem informados"
							on:input={(event) => updateItem(index, 'videoId', event.currentTarget.value)}
						/>
					</label>
					<label class="checkbox-field">
						<input
							type="checkbox"
							checked={item.hasAds ?? false}
							on:change={(event) => updateItem(index, 'hasAds', event.currentTarget.checked)}
						/>
						<span>Exibir publicidade no player</span>
					</label>
				{:else}
					<label>
						<span>Conteúdo HTML</span>
						<RichTextEditor
							value={item.content || ''}
							rows={4}
							placeholder="Conteúdo do slide"
							on:change={(event) => updateItem(index, 'content', event.detail.value)}
						/>
					</label>
				{/if}

				<label>
					<span>Legenda</span>
					<input
						type="text"
						value={item.caption}
						on:input={(event) => updateItem(index, 'caption', event.currentTarget.value)}
					/>
				</label>

				<label>
					<span>Crédito</span>
					<input
						type="text"
						value={item.credit}
						on:input={(event) => updateItem(index, 'credit', event.currentTarget.value)}
					/>
				</label>
			</div>
		</article>
	{/each}

	<button type="button" class="add-item" on:click={addItem}>Adicionar slide</button>
</div>

<style>
	.items-editor {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.item-card {
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		padding: 1rem 1.25rem;
		background: #fff;
		box-shadow: 0 4px 16px rgba(15, 23, 42, 0.07);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	header strong {
		display: block;
		font-size: 0.95rem;
		color: #0f172a;
	}

	header span {
		display: block;
		font-size: 0.8rem;
		color: #6b7280;
	}

	.actions {
		display: inline-flex;
		gap: 0.35rem;
	}

	.actions button {
		border: 1px solid #cbd5f5;
		background: #fff;
		border-radius: 6px;
		padding: 0.25rem 0.5rem;
		cursor: pointer;
		font-size: 0.75rem;
	}

	.actions button:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.actions button.danger {
		border-color: #fecaca;
		color: #b91c1c;
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.8rem;
		color: #334155;
	}

	label.checkbox-field {
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
	}

	label.checkbox-field input[type='checkbox'] {
		flex-shrink: 0;
		width: 1rem;
		height: 1rem;
		border: 1px solid #cbd5f5;
		border-radius: 4px;
		background: #fff;
		appearance: none;
		display: grid;
		place-items: center;
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	label.checkbox-field input[type='checkbox']::after {
		content: '';
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 2px;
		background: #2563eb;
		transform: scale(0);
		transition: transform 0.1s ease;
	}

	label.checkbox-field input[type='checkbox']:checked::after {
		transform: scale(1);
	}

	label.checkbox-field input[type='checkbox']:focus-visible {
		outline: 2px solid #2563eb;
		outline-offset: 2px;
	}

	input[type='text'],
	input[type='url'],
	textarea,
	select {
		border: 1px solid #cbd5f5;
		border-radius: 8px;
		padding: 0.45rem 0.6rem;
		font-size: 0.85rem;
	}

	textarea {
		resize: vertical;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.75rem;
	}

	.add-item {
		align-self: flex-start;
		border: 1px dashed #94a3b8;
		background: #f8fafc;
		border-radius: 10px;
		padding: 0.6rem 1rem;
		font-size: 0.85rem;
		cursor: pointer;
		color: #334155;
	}

	.add-item:hover {
		background: #e2e8f0;
	}
</style>
