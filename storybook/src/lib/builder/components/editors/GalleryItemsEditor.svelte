<script>
	import { createEventDispatcher } from 'svelte';

	export let value = [];

	const dispatch = createEventDispatcher();
	let items = [];
	let isUpdating = false;

	const buildDefaults = () => ({
		src: '',
		srcMobile: '',
		alt: '',
		caption: '',
		captionDesktop: '',
		captionMobile: '',
		credit: '',
		creditDesktop: '',
		creditMobile: ''
	});

	$: if (!isUpdating) {
		items =
			Array.isArray(value) && value.length
				? value.map((item) => {
						const base = buildDefaults();
						const clone = structuredClone(item || {});
						return {
							...base,
							...clone,
							caption: clone.caption ?? clone.captionDesktop ?? '',
							captionDesktop: clone.captionDesktop ?? clone.caption ?? '',
							captionMobile: clone.captionMobile ?? clone.caption ?? '',
							credit: clone.credit ?? clone.creditDesktop ?? '',
							creditDesktop: clone.creditDesktop ?? clone.credit ?? '',
							creditMobile: clone.creditMobile ?? clone.credit ?? ''
						};
					})
				: [buildDefaults()];
	}

	const emit = (updated) => {
		isUpdating = true;
		dispatch('change', { value: updated });
		Promise.resolve().then(() => {
			isUpdating = false;
		});
	};

	const addItem = () => {
		const updated = [...items, buildDefaults()];
		items = updated;
		emit(updated);
	};

	const duplicateItem = (index) => {
		const clone = structuredClone(items[index]);
		const updated = [...items.slice(0, index + 1), clone, ...items.slice(index + 1)];
		items = updated;
		emit(updated);
	};

	const removeItem = (index) => {
		if (items.length === 1) {
			const updated = [buildDefaults()];
			items = updated;
			emit(updated);
			return;
		}
		const updated = items.filter((_, i) => i !== index);
		items = updated;
		emit(updated);
	};

	const moveItem = (index, direction) => {
		const target = index + direction;
		if (target < 0 || target >= items.length) return;
		const updated = [...items];
		const [item] = updated.splice(index, 1);
		updated.splice(target, 0, item);
		items = updated;
		emit(updated);
	};

	const updateItem = (index, key, value) => {
		const updated = items.map((item, i) => {
			if (i !== index) return item;
			const next = { ...item };
			switch (key) {
				case 'caption':
					next.caption = value;
					next.captionDesktop = value;
					break;
				case 'captionMobile':
					next.captionMobile = value;
					break;
				case 'credit':
					next.credit = value;
					next.creditDesktop = value;
					break;
				case 'creditMobile':
					next.creditMobile = value;
					break;
				default:
					next[key] = value;
			}
			return next;
		});
		items = updated;
		emit(updated);
	};
</script>

<div class="items-editor">
	{#each items as item, index}
		<article class="photo-card">
			<header>
				<strong>Foto {index + 1}</strong>
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

			<div class="photo-section">
				<div class="photo-row">
					<span class="photo-tag">Desk</span>
					<div class="photo-fields">
						<label>
							<span>Imagem</span>
							<input
								type="url"
								value={item.src}
								placeholder="https://..."
								on:input={(event) => updateItem(index, 'src', event.currentTarget.value)}
							/>
						</label>
						<label>
							<span>Legenda</span>
							<input
								type="text"
								value={item.caption}
								placeholder="Legenda"
								on:input={(event) => updateItem(index, 'caption', event.currentTarget.value)}
							/>
						</label>
						<label>
							<span>Crédito</span>
							<input
								type="text"
								value={item.credit}
								placeholder="Crédito"
								on:input={(event) => updateItem(index, 'credit', event.currentTarget.value)}
							/>
						</label>
					</div>
				</div>

				<div class="photo-row">
					<span class="photo-tag">Mobile</span>
					<div class="photo-fields">
						<label>
							<span>Imagem</span>
							<input
								type="url"
								value={item.srcMobile}
								placeholder="https://..."
								on:input={(event) => updateItem(index, 'srcMobile', event.currentTarget.value)}
							/>
						</label>
						<label>
							<span>Legenda</span>
							<input
								type="text"
								value={item.captionMobile}
								placeholder="Legenda mobile"
								on:input={(event) => updateItem(index, 'captionMobile', event.currentTarget.value)}
							/>
						</label>
						<label>
							<span>Crédito</span>
							<input
								type="text"
								value={item.creditMobile}
								placeholder="Crédito mobile"
								on:input={(event) => updateItem(index, 'creditMobile', event.currentTarget.value)}
							/>
						</label>
					</div>
				</div>
			</div>

			<label class="alt-field">
				<span>Texto alternativo</span>
				<input
					type="text"
					value={item.alt}
					placeholder="Descrição para acessibilidade"
					on:input={(event) => updateItem(index, 'alt', event.currentTarget.value)}
				/>
			</label>
		</article>
	{/each}

	<button type="button" class="add-item" on:click={addItem}>Adicionar mais fotos</button>
</div>

<style>
	.items-editor {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.photo-card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		border: 1px solid rgba(226, 232, 240, 0.7);
		border-radius: 14px;
		padding: 1rem 1.25rem;
		background: rgba(255, 255, 255, 0.95);
		box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	header strong {
		font-size: 0.95rem;
		color: #0f172a;
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

	.photo-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.photo-row {
		display: grid;
		grid-template-columns: 70px 1fr;
		gap: 0.75rem;
		align-items: start;
	}

	.photo-tag {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.35rem 0.5rem;
		background: #e2e8f0;
		color: #1f2937;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.photo-fields {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 0.6rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.8rem;
		color: #334155;
	}

	input[type='text'],
	input[type='url'] {
		border: 1px solid #cbd5f5;
		border-radius: 8px;
		padding: 0.45rem 0.6rem;
		font-size: 0.85rem;
		background: #fff;
	}

	.alt-field {
		margin-top: 0.5rem;
	}

	.alt-field input {
		width: 100%;
	}

	.add-item {
		align-self: flex-start;
		border: none;
		background: #1d4ed8;
		color: #fff;
		border-radius: 999px;
		padding: 0.45rem 1.4rem;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.add-item:hover {
		background: #1e40af;
	}
</style>
