<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let label = '';
	export let value = undefined;
	export let placeholder = '';
	export let minRows = 4;
	export let help = '';
	export let disabled = false;

	let text = '';
	let error = '';
	let isEditing = false;

	const toJson = (input) => {
		if (input === undefined || input === null) return '';
		try {
			return JSON.stringify(input, null, 2);
		} catch (err) {
			console.warn('[JsonEditorField] Falha ao serializar valor atual.', err);
			return '';
		}
	};

	$: if (!isEditing) {
		text = toJson(value);
	}

	function handleFocus() {
		isEditing = true;
		error = '';
	}

	function handleBlur() {
		isEditing = false;
		const trimmed = text.trim();

		if (!trimmed) {
			error = '';
			dispatch('change', { value: undefined });
			return;
		}

		try {
			const parsed = JSON.parse(trimmed);
			error = '';
			dispatch('change', { value: parsed });
		} catch (err) {
			error = err.message;
		}
	}
</script>

<div class="json-field">
	<label>
		<span>{label}</span>
	</label>
	<textarea
		bind:value={text}
		rows={minRows}
		{placeholder}
		class:error={Boolean(error)}
		aria-invalid={Boolean(error)}
		{disabled}
		on:focus={handleFocus}
		on:blur={handleBlur}
	></textarea>
	{#if help}
		<small class="help">{help}</small>
	{/if}
	{#if error}
		<small class="error">JSON inválido: {error}</small>
	{/if}
</div>

<style>
	.json-field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin-top: 0.75rem;
	}

	label span {
		font-weight: 600;
		font-size: 0.8rem;
		color: #0f172a;
	}

	textarea {
		width: 100%;
		resize: vertical;
		min-height: 120px;
		padding: 0.6rem 0.7rem;
		font-size: 0.82rem;
		line-height: 1.4;
		border-radius: 10px;
		border: 1px solid rgba(148, 163, 184, 0.35);
		font-family: 'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace;
		background: rgba(248, 250, 252, 0.8);
		color: #0f172a;
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.3);
	}

	textarea:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow:
			0 0 0 1px #2563eb,
			0 8px 18px rgba(37, 99, 235, 0.15);
		background: #ffffff;
	}

	textarea.error {
		border-color: #f87171;
		background: rgba(254, 226, 226, 0.4);
	}

	.help {
		color: #64748b;
		font-size: 0.7rem;
	}

	.error {
		color: #dc2626;
		font-size: 0.72rem;
	}
</style>
