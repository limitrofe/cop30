<script>
	import { createEventDispatcher } from 'svelte';
	import RichTextEditor from '../RichTextEditor.svelte';

	export let value = [];

	const dispatch = createEventDispatcher();
	let items = [];
	let isUpdating = false;

	const buildDefaults = () => ({ text: '' });

	$: if (!isUpdating) {
		items =
			Array.isArray(value) && value.length
				? value.map((item) => ({ ...buildDefaults(), ...structuredClone(item) }))
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

	const removeItem = (index) => {
		const updated = items.filter((_, i) => i !== index);
		items = updated.length ? updated : [buildDefaults()];
		emit(items);
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

	const updateItem = (index, text) => {
		const updated = items.map((item, i) => (i === index ? { ...item, text } : item));
		items = updated;
		emit(updated);
	};
</script>

<div class="list-editor">
	{#each items as item, index}
		<article class="list-item-card">
			<header>
				<span>Item {index + 1}</span>
				<div class="actions">
					<button
						type="button"
						on:click={() => moveItem(index, -1)}
						disabled={index === 0}
						title="Mover para cima">↑</button
					>
					<button
						type="button"
						on:click={() => moveItem(index, +1)}
						disabled={index === items.length - 1}
						title="Mover para baixo">↓</button
					>
					<button type="button" class="danger" on:click={() => removeItem(index)} title="Remover"
						>✕</button
					>
				</div>
			</header>
			<RichTextEditor
				value={item.text || ''}
				rows={3}
				placeholder="Conteúdo do item"
				on:change={(event) => updateItem(index, event.detail.value)}
			/>
		</article>
	{/each}

	<button type="button" class="add-button" on:click={addItem}>Adicionar item</button>
</div>

<style>
	.list-editor {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.list-item-card {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		padding: 0.9rem 1rem;
		background: rgba(255, 255, 255, 0.95);
		box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.85rem;
		color: #475569;
	}

	.actions {
		display: flex;
		gap: 0.35rem;
	}

	.actions button {
		border: none;
		background: #e2e8f0;
		color: #1f2937;
		border-radius: 6px;
		padding: 0.25rem 0.45rem;
		cursor: pointer;
	}

	.actions button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.actions .danger {
		background: #fee2e2;
		color: #b91c1c;
	}

	textarea {
		border: 1px solid #cbd5f5;
		border-radius: 8px;
		padding: 0.6rem 0.75rem;
		font-size: 0.9rem;
		font-family: inherit;
	}

	textarea:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
	}

	.add-button {
		align-self: flex-start;
		border: none;
		background: #1d4ed8;
		color: #fff;
		border-radius: 999px;
		padding: 0.4rem 1.1rem;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.add-button:hover {
		background: #1e40af;
	}
</style>
