<script>
	import { createEventDispatcher } from 'svelte';

	export let value = [];

	const dispatch = createEventDispatcher();
	const MIN_ITEMS = 2;
	const MAX_ITEMS = 10;

	const buildDefaults = () => ({
		title: '',
		videoIdDesktop: '',
		videoIdMobile: '',
		videoId: '',
		caption: '',
		credit: '',
		hasAds: false
	});

	let items = [];
	let isUpdating = false;

	function ensureMinimum(list) {
		const safe = [...list];
		while (safe.length < MIN_ITEMS) {
			safe.push(buildDefaults());
		}
		return safe;
	}

	$: if (!isUpdating) {
		const incoming = Array.isArray(value)
			? value.map((item) => ({ ...buildDefaults(), ...structuredClone(item) }))
			: [];
		items = ensureMinimum(incoming).slice(0, MAX_ITEMS);
	}

	function emit(updated) {
		isUpdating = true;
		dispatch('change', { value: updated });
		Promise.resolve().then(() => {
			isUpdating = false;
		});
	}

	function addItem() {
		if (items.length >= MAX_ITEMS) return;
		const updated = [...items, buildDefaults()];
		items = updated;
		emit(updated);
	}

	function duplicateItem(index) {
		if (items.length >= MAX_ITEMS) return;
		const clone = { ...items[index] };
		const updated = [...items];
		updated.splice(index + 1, 0, clone);
		items = updated.slice(0, MAX_ITEMS);
		emit(items);
	}

	function removeItem(index) {
		if (items.length <= MIN_ITEMS) return;
		const updated = items.filter((_, i) => i !== index);
		items = ensureMinimum(updated);
		emit(items);
	}

	function moveItem(index, direction) {
		const target = index + direction;
		if (target < 0 || target >= items.length) return;
		const updated = [...items];
		const [entry] = updated.splice(index, 1);
		updated.splice(target, 0, entry);
		items = updated;
		emit(updated);
	}

	function updateItem(index, key, val) {
		const updated = items.map((item, i) => (i === index ? { ...item, [key]: val } : item));
		items = updated;
		emit(updated);
	}

	const remainingSlots = () => Math.max(0, MAX_ITEMS - items.length);
</script>

<div class="slides-editor">
	{#each items as item, index}
		<article class="slide-card">
			<header>
				<div>
					<strong>Vídeo {index + 1}</strong>
					<span
						>{item.title || item.videoIdDesktop || item.videoIdMobile || 'Sem identificação'}</span
					>
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
					<button
						type="button"
						on:click={() => duplicateItem(index)}
						title="Duplicar"
						disabled={items.length >= MAX_ITEMS}>⧉</button
					>
					<button
						type="button"
						class="danger"
						on:click={() => removeItem(index)}
						title="Remover"
						disabled={items.length <= MIN_ITEMS}>✕</button
					>
				</div>
			</header>

			<div class="fields">
				<label>
					<span>Título do vídeo</span>
					<input
						type="text"
						value={item.title}
						placeholder="Ex.: Highlights do episódio"
						on:input={(event) => updateItem(index, 'title', event.currentTarget.value)}
					/>
				</label>

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

				<label>
					<span>Legenda</span>
					<input
						type="text"
						value={item.caption}
						placeholder="Legenda opcional exibida sobre o vídeo"
						on:input={(event) => updateItem(index, 'caption', event.currentTarget.value)}
					/>
				</label>

				<label>
					<span>Crédito</span>
					<input
						type="text"
						value={item.credit}
						placeholder="Crédito do vídeo"
						on:input={(event) => updateItem(index, 'credit', event.currentTarget.value)}
					/>
				</label>

				<label class="checkbox-field">
					<input
						type="checkbox"
						checked={item.hasAds}
						on:change={(event) => updateItem(index, 'hasAds', event.currentTarget.checked)}
					/>
					<span>Permitir publicidade (DFP) no player</span>
				</label>
			</div>
		</article>
	{/each}

	<button type="button" class="add-item" on:click={addItem} disabled={items.length >= MAX_ITEMS}>
		Adicionar vídeo
		{#if items.length >= MAX_ITEMS}
			<span>(limite atingido)</span>
		{:else}
			<span>(restam {remainingSlots()} vagas)</span>
		{/if}
	</button>
</div>

<style>
	.slides-editor {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.slide-card {
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
	textarea {
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
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.add-item:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.add-item span {
		font-size: 0.75rem;
		color: #64748b;
	}
</style>
