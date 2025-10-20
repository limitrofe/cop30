<script>
	import { createEventDispatcher } from 'svelte';
	import RichTextEditor from '../RichTextEditor.svelte';
	import { ColorPicker } from '$lib/components/builder/controls/index.js';

	export let value = [];

	const dispatch = createEventDispatcher();
	let steps = [];
	let isUpdating = false;
	let lastSerialized = '';

	const clone = (input) => {
		if (typeof structuredClone === 'function') return structuredClone(input ?? {});
		if (input === undefined || input === null) return {};
		return JSON.parse(JSON.stringify(input));
	};

	const createId = () =>
		typeof crypto !== 'undefined' && crypto.randomUUID
			? crypto.randomUUID()
			: `flourish-step-${Math.random().toString(36).slice(2, 10)}`;

	const createDefaultStep = (overrides = {}) => ({
		id: overrides.id || createId(),
		slide: 0,
		title: '',
		text: '',
		position: overrides.position || 'right',
		backgroundColor: overrides.backgroundColor || '',
		textColor: overrides.textColor || '',
		slideFromBottom: overrides.slideFromBottom ?? true,
		travelDistance: overrides.travelDistance || 'auto',
		cardVisibility: overrides.cardVisibility || 'card',
		...clone(overrides)
	});

	function normalizeSteps(list) {
		return Array.isArray(list) && list.length
			? list.map((step) => createDefaultStep(step))
			: [createDefaultStep()];
	}

	$: if (!isUpdating) {
		const incoming = Array.isArray(value) ? value : [];
		const serialized = JSON.stringify(incoming);
		if (serialized !== lastSerialized) {
			steps = normalizeSteps(incoming);
			lastSerialized = serialized;
		}
	}

	function emit(updated) {
		isUpdating = true;
		const normalized = normalizeSteps(updated);
		steps = normalized;
		const serialized = JSON.stringify(normalized.map(({ id, ...rest }) => rest));
		lastSerialized = serialized;
		dispatch('change', { value: normalized.map(({ id, ...rest }) => rest) });
		Promise.resolve().then(() => {
			isUpdating = false;
		});
	}

	function addStep() {
		const updated = [
			...steps,
			createDefaultStep({ slide: steps.length ? steps[steps.length - 1].slide : 0 })
		];
		steps = updated;
		emit(updated);
	}

	function duplicateStep(index) {
		const { id: _ignored, ...rest } = steps[index];
		const clone = createDefaultStep(rest);
		const updated = [...steps.slice(0, index + 1), { ...clone }, ...steps.slice(index + 1)];
		steps = updated;
		emit(updated);
	}

	function removeStep(index) {
		const updated = steps.length > 1 ? steps.filter((_, i) => i !== index) : [createDefaultStep()];
		steps = updated;
		emit(updated);
	}

	function moveStep(index, direction) {
		const target = index + direction;
		if (target < 0 || target >= steps.length) return;
		const updated = [...steps];
		const [item] = updated.splice(index, 1);
		updated.splice(target, 0, item);
		steps = updated;
		emit(updated);
	}

	function updateStep(index, key, newValue) {
		const updated = steps.map((step, i) => (i === index ? { ...step, [key]: newValue } : step));
		steps = updated;
		emit(updated);
	}

	const cardVisibilityOptions = [
		{ label: 'Card visível', value: 'card' },
		{ label: 'Card transparente', value: 'transparent' },
		{ label: 'Sem card (apenas slide)', value: 'hidden' }
	];
</script>

<div class="scrolly-steps-editor">
	{#each steps as step, index (step.id)}
		<article class="step-card">
			<header>
				<div>
					<strong>Step {index + 1}</strong>
					<span>Slide {step.slide}</span>
				</div>
				<div class="actions">
					<button
						type="button"
						on:click={() => moveStep(index, -1)}
						title="Mover para cima"
						disabled={index === 0}>↑</button
					>
					<button
						type="button"
						on:click={() => moveStep(index, +1)}
						title="Mover para baixo"
						disabled={index === steps.length - 1}>↓</button
					>
					<button type="button" on:click={() => duplicateStep(index)} title="Duplicar">⧉</button>
					<button type="button" class="danger" on:click={() => removeStep(index)} title="Remover"
						>✕</button
					>
				</div>
			</header>

			<div class="fields">
				<div class="grid">
					<label>
						<span>Slide do Flourish</span>
						<input
							type="number"
							min="0"
							value={step.slide}
							on:input={(event) =>
								updateStep(index, 'slide', Number.parseInt(event.currentTarget.value, 10) || 0)}
						/>
						<small
							>Use o índice do slide (0 = primeiro). Pode repetir valores para múltiplos cards no
							mesmo slide.</small
						>
					</label>
					<label>
						<span>Posicionamento do card</span>
						<select
							value={step.position || 'right'}
							on:change={(event) => updateStep(index, 'position', event.currentTarget.value)}
						>
							<option value="left">Esquerda</option>
							<option value="center">Centro</option>
							<option value="right">Direita</option>
						</select>
					</label>

					<label>
						<span>Exibição do card</span>
						<select
							value={step.cardVisibility || 'card'}
							on:change={(event) => updateStep(index, 'cardVisibility', event.currentTarget.value)}
						>
							{#each cardVisibilityOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
						<small>Escolha “Sem card” para deixar só o slide visível.</small>
					</label>

					<label class="toggle-field">
						<span>Animar do rodapé ao topo</span>
						<input
							type="checkbox"
							checked={Boolean(step.slideFromBottom ?? true)}
							on:change={(event) =>
								updateStep(index, 'slideFromBottom', event.currentTarget.checked)}
						/>
					</label>

					<label>
						<span>Distância da animação</span>
						<input
							type="text"
							value={step.travelDistance || 'auto'}
							placeholder="ex: fixed:85vh"
							on:input={(event) => updateStep(index, 'travelDistance', event.currentTarget.value)}
						/>
						<small>
							Padrão: <code>auto</code>. Para definir um deslocamento fixo, use
							<code>fixed:80vh</code>, <code>fixed:500px</code> etc.
						</small>
					</label>
				</div>

				<label>
					<span>Título (opcional)</span>
					<input
						type="text"
						value={step.title}
						placeholder="Título exibido acima do texto"
						on:input={(event) => updateStep(index, 'title', event.currentTarget.value)}
					/>
				</label>

				<div class="field richtext">
					<span>Texto do step</span>
					<RichTextEditor
						value={step.text || ''}
						rows={4}
						placeholder="Conteúdo que aparece enquanto este step está ativo"
						on:change={(event) => updateStep(index, 'text', event.detail.value)}
					/>
				</div>

				<div class="grid colors">
					<label class="color-control">
						<span>Cor do fundo</span>
						<ColorPicker
							label={null}
							value={step.backgroundColor ?? ''}
							showPresets={false}
							showAlpha={true}
							allowClear={true}
							clearValue=""
							on:change={(event) => updateStep(index, 'backgroundColor', event.detail.value)}
						/>
						<small>Deixe vazio para usar o tema do projeto.</small>
					</label>

					<label class="color-control">
						<span>Cor do texto</span>
						<ColorPicker
							label={null}
							value={step.textColor ?? ''}
							showPresets={false}
							showAlpha={true}
							allowClear={true}
							clearValue=""
							on:change={(event) => updateStep(index, 'textColor', event.detail.value)}
						/>
						<small>Deixe vazio para herdar a cor padrão.</small>
					</label>
				</div>
			</div>
		</article>
	{/each}

	<button type="button" class="add-step" on:click={addStep}> + Adicionar step </button>
</div>

<style>
	.scrolly-steps-editor {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.step-card {
		border: 1px solid rgba(15, 23, 42, 0.08);
		border-radius: 14px;
		background: white;
		box-shadow: 0 18px 40px -24px rgba(15, 23, 42, 0.35);
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	header strong {
		display: block;
		font-size: 1rem;
		color: #0f172a;
	}

	header span {
		font-size: 0.8rem;
		color: #64748b;
	}

	.actions {
		display: inline-flex;
		gap: 0.4rem;
	}

	.actions button {
		border: none;
		background: #e2e8f0;
		color: #0f172a;
		padding: 0.35rem 0.55rem;
		border-radius: 8px;
		cursor: pointer;
	}

	.actions button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.actions .danger {
		background: #f87171;
		color: white;
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		font-size: 0.9rem;
	}

	label span {
		font-weight: 600;
		color: #1e293b;
	}

	.field.richtext {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		font-size: 0.9rem;
	}

	.field.richtext span {
		font-weight: 600;
		color: #1e293b;
	}

	label input[type='text'],
	label input[type='number'],
	label select {
		border: 1px solid rgba(148, 163, 184, 0.6);
		border-radius: 8px;
		padding: 0.45rem 0.5rem;
		font-size: 0.9rem;
		background: #ffffff;
	}

	label small {
		font-size: 0.75rem;
		color: #64748b;
	}

	.grid {
		display: grid;
		gap: 0.75rem;
	}

	.toggle-field {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.grid.colors {
		grid-template-columns: repeat(1, minmax(0, 1fr));
	}

	label.color-control {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	label.color-control > span {
		font-weight: 600;
		font-size: 0.85rem;
		color: #0f172a;
	}

	label.color-control :global(.color-picker) {
		width: 100%;
	}

	@media (min-width: 720px) {
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.grid.colors {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	.add-step {
		border: none;
		background: #1d4ed8;
		color: white;
		padding: 0.65rem 1rem;
		border-radius: 10px;
		cursor: pointer;
		align-self: flex-start;
		font-weight: 600;
		box-shadow: 0 15px 30px -20px rgba(29, 78, 216, 0.65);
	}

	.add-step:hover {
		background: #1e40af;
	}
</style>
