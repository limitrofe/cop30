<script>
	import { createEventDispatcher } from 'svelte';
	import RichTextEditor from '../RichTextEditor.svelte';
	import { ColorPicker } from '$lib/components/builder/controls/index.js';

	export let value = [];

	const dispatch = createEventDispatcher();
	let steps = [];
	let isUpdating = false;
	let collapsedStates = [];

	const buildDefaults = () => ({
		title: '',
		text: '',
		position: 'right',
		variant: 'default',
		backgroundColor: 'rgba(15, 23, 42, 0.82)',
		overlayColor: 'rgba(0, 0, 0, 0.35)',
		textColor: '#F9FAFB',
		accentColor: '#C4170C',
		borderColor: 'rgba(255, 255, 255, 0.12)',
		padding: '2rem',
		maxWidth: '460px',
		maxWidthMobile: '92%',
		cardVisibility: 'card',
		slideFromBottom: true,
		travelDistance: 'auto',
		image: '',
		imageMobile: '',
		video: '',
		videoMobile: '',
		alt: '',
		caption: '',
		backgroundTransition: 'fade',
		backgroundTransitionDuration: '600ms',
		backgroundTransitionEasing: 'cubic-bezier(0.4, 0, 0.2, 1)'
	});

	$: if (!isUpdating) {
		const nextSteps =
			Array.isArray(value) && value.length
				? value.map((step) => ({ ...buildDefaults(), ...structuredClone(step) }))
				: [buildDefaults()];
		const previousCollapsed = collapsedStates;
		steps = nextSteps;
		if (collapsedStates.length !== nextSteps.length) {
			collapsedStates = nextSteps.map((_, index) => previousCollapsed[index] ?? false);
		}
	}

	function emit(updated) {
		isUpdating = true;
		dispatch('change', { value: updated });
		Promise.resolve().then(() => {
			isUpdating = false;
		});
	}

	function addStep() {
		const updated = [...steps, buildDefaults()];
		steps = updated;
		collapsedStates = [...collapsedStates, false];
		emit(updated);
	}

	function duplicateStep(index) {
		const clone = { ...steps[index] };
		const updated = [...steps.slice(0, index + 1), { ...clone }, ...steps.slice(index + 1)];
		steps = updated;
		collapsedStates = [
			...collapsedStates.slice(0, index + 1),
			collapsedStates[index] ?? false,
			...collapsedStates.slice(index + 1)
		];
		emit(updated);
	}

	function removeStep(index) {
		if (steps.length === 1) {
			const updated = [buildDefaults()];
			steps = updated;
			collapsedStates = [false];
			emit(updated);
			return;
		}
		const updated = steps.filter((_, i) => i !== index);
		steps = updated;
		collapsedStates = collapsedStates.filter((_, i) => i !== index);
		emit(updated);
	}

	function moveStep(index, direction) {
		const target = index + direction;
		if (target < 0 || target >= steps.length) return;
		const updated = [...steps];
		const [item] = updated.splice(index, 1);
		updated.splice(target, 0, item);
		steps = updated;
		const collapsedClone = [...collapsedStates];
		const [state] = collapsedClone.splice(index, 1);
		collapsedClone.splice(target, 0, state ?? false);
		collapsedStates = collapsedClone;
		emit(updated);
	}

	function updateStep(index, key, value) {
		const updated = steps.map((step, i) => (i === index ? { ...step, [key]: value } : step));
		steps = updated;
		emit(updated);
	}

	function toggleCollapsed(index) {
		collapsedStates = collapsedStates.map((state, i) => (i === index ? !state : (state ?? false)));
	}

	const positions = [
		{ label: 'Direita', value: 'right' },
		{ label: 'Centro', value: 'center' },
		{ label: 'Esquerda', value: 'left' }
	];

	const variants = [
		{ label: 'Padrão', value: 'default' },
		{ label: 'Destaque', value: 'destaque' }
	];

	const cardVisibilityOptions = [
		{ label: 'Card visível', value: 'card' },
		{ label: 'Card transparente', value: 'transparent' },
		{ label: 'Sem card (apenas mídia)', value: 'hidden' }
	];

	const backgroundTransitionOptions = [
		{ label: 'Sem animação', value: 'none' },
		{ label: 'Fade in/out', value: 'fade' },
		{ label: 'Zoom in', value: 'zoom-in' },
		{ label: 'Zoom out', value: 'zoom-out' },
		{ label: 'Zoom in • Esquerda', value: 'zoom-in-left' },
		{ label: 'Zoom in • Direita', value: 'zoom-in-right' },
		{ label: 'Zoom in • Topo', value: 'zoom-in-up' },
		{ label: 'Zoom in • Base', value: 'zoom-in-down' }
	];
</script>

<div class="steps-editor">
	{#each steps as step, index}
		<article class="step-card" class:collapsed={collapsedStates[index]}>
			<header>
				<button
					type="button"
					class="toggle-collapse"
					aria-expanded={!collapsedStates[index]}
					aria-controls={`scrolly-step-fields-${index}`}
					on:click={() => toggleCollapsed(index)}
				>
					{collapsedStates[index] ? '▸' : '▾'}
				</button>
				<div class="summary">
					<strong>Step {index + 1}</strong>
					<span>{step.title || 'Sem título'}</span>
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

			<div class="fields" id={`scrolly-step-fields-${index}`} hidden={collapsedStates[index]}>
				<label>
					<span>Título</span>
					<input
						type="text"
						value={step.title}
						on:input={(event) => updateStep(index, 'title', event.currentTarget.value)}
					/>
				</label>

				<div class="field rich-text">
					<label id={`scrolly-step-text-label-${index}`}>Texto (HTML permitido)</label>
					<RichTextEditor
						value={step.text || ''}
						rows={4}
						placeholder="Conteúdo do step"
						ariaLabelledby={`scrolly-step-text-label-${index}`}
						on:change={(event) => updateStep(index, 'text', event.detail.value)}
					/>
				</div>

				<div class="grid">
					<label>
						<span>Posicionamento</span>
						<select
							value={step.position}
							on:change={(event) => updateStep(index, 'position', event.currentTarget.value)}
						>
							{#each positions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</label>

					<label>
						<span>Variante</span>
						<select
							value={step.variant}
							on:change={(event) => updateStep(index, 'variant', event.currentTarget.value)}
						>
							{#each variants as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</label>

					<label>
						<span>Card de texto</span>
						<select
							value={step.cardVisibility || 'card'}
							on:change={(event) => updateStep(index, 'cardVisibility', event.currentTarget.value)}
						>
							{#each cardVisibilityOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
						<small>Use “Sem card” para deixar apenas a mídia em destaque.</small>
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
							Padrão: <code>auto</code> (card cruza a viewport inteira). Para travar um valor
							específico, use <code>fixed:80vh</code> ou <code>fixed:480px</code>.
						</small>
					</label>
				</div>

				<div class="grid transitions">
					<label>
						<span>Transição da mídia</span>
						<select
							value={step.backgroundTransition || 'fade'}
							on:change={(event) =>
								updateStep(index, 'backgroundTransition', event.currentTarget.value)}
						>
							{#each backgroundTransitionOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</label>

					<label>
						<span>Duração da transição</span>
						<input
							type="text"
							value={step.backgroundTransitionDuration || '600ms'}
							placeholder="600ms"
							on:input={(event) =>
								updateStep(index, 'backgroundTransitionDuration', event.currentTarget.value)}
						/>
					</label>

					<label>
						<span>Easing da transição</span>
						<input
							type="text"
							value={step.backgroundTransitionEasing || 'cubic-bezier(0.4, 0, 0.2, 1)'}
							placeholder="ease-out"
							on:input={(event) =>
								updateStep(index, 'backgroundTransitionEasing', event.currentTarget.value)}
						/>
					</label>
				</div>

				<div class="grid colors">
					<label class="color-control">
						<span>Cor do card</span>
						<ColorPicker
							label={null}
							value={step.backgroundColor ?? ''}
							showPresets={false}
							showAlpha={true}
							allowClear={true}
							clearValue="transparent"
							on:change={(event) => updateStep(index, 'backgroundColor', event.detail.value)}
						/>
					</label>

					<label>
						<span>Overlay da mídia</span>
						<input
							type="text"
							value={step.overlayColor}
							placeholder="rgba(0,0,0,0.35)"
							on:input={(event) => updateStep(index, 'overlayColor', event.currentTarget.value)}
						/>
					</label>

					<label class="color-control">
						<span>Cor do texto</span>
						<ColorPicker
							label={null}
							value={step.textColor ?? ''}
							showPresets={false}
							showAlpha={true}
							allowClear={true}
							clearValue="transparent"
							on:change={(event) => updateStep(index, 'textColor', event.detail.value)}
						/>
					</label>

					<label class="color-control">
						<span>Cor de destaque</span>
						<ColorPicker
							label={null}
							value={step.accentColor ?? ''}
							showPresets={false}
							showAlpha={true}
							allowClear={true}
							clearValue="transparent"
							on:change={(event) => updateStep(index, 'accentColor', event.detail.value)}
						/>
					</label>

					<label class="color-control">
						<span>Cor da borda</span>
						<ColorPicker
							label={null}
							value={step.borderColor ?? ''}
							showPresets={false}
							showAlpha={true}
							allowClear={true}
							clearValue="transparent"
							on:change={(event) => updateStep(index, 'borderColor', event.detail.value)}
						/>
					</label>
				</div>

				<div class="grid">
					<label>
						<span>Imagem desktop</span>
						<input
							type="url"
							value={step.image}
							placeholder="https://..."
							on:input={(event) => updateStep(index, 'image', event.currentTarget.value)}
						/>
					</label>
					<label>
						<span>Imagem mobile</span>
						<input
							type="url"
							value={step.imageMobile}
							placeholder="https://..."
							on:input={(event) => updateStep(index, 'imageMobile', event.currentTarget.value)}
						/>
					</label>
				</div>

				<div class="grid">
					<label>
						<span>Vídeo desktop</span>
						<input
							type="url"
							value={step.video}
							placeholder="https://...mp4"
							on:input={(event) => updateStep(index, 'video', event.currentTarget.value)}
						/>
					</label>
					<label>
						<span>Vídeo mobile</span>
						<input
							type="url"
							value={step.videoMobile}
							placeholder="https://...mp4"
							on:input={(event) => updateStep(index, 'videoMobile', event.currentTarget.value)}
						/>
					</label>
				</div>

				<div class="grid">
					<label>
						<span>Alt da mídia</span>
						<input
							type="text"
							value={step.alt}
							on:input={(event) => updateStep(index, 'alt', event.currentTarget.value)}
						/>
					</label>
					<label>
						<span>Legenda</span>
						<input
							type="text"
							value={step.caption}
							on:input={(event) => updateStep(index, 'caption', event.currentTarget.value)}
						/>
					</label>
				</div>

				<div class="grid">
					<label>
						<span>Padding</span>
						<input
							type="text"
							value={step.padding}
							placeholder="2rem"
							on:input={(event) => updateStep(index, 'padding', event.currentTarget.value)}
						/>
					</label>
					<label>
						<span>Largura máxima (desktop)</span>
						<input
							type="text"
							value={step.maxWidth}
							placeholder="460px"
							on:input={(event) => updateStep(index, 'maxWidth', event.currentTarget.value)}
						/>
					</label>
					<label>
						<span>Largura máxima (mobile)</span>
						<input
							type="text"
							value={step.maxWidthMobile}
							placeholder="92%"
							on:input={(event) => updateStep(index, 'maxWidthMobile', event.currentTarget.value)}
						/>
					</label>
				</div>
			</div>
		</article>
	{/each}

	<button type="button" class="add-step" on:click={addStep}>Adicionar passo</button>
</div>

<style>
	.steps-editor {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.step-card {
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
		align-items: center;
		gap: 0.75rem;
	}

	.summary {
		flex: 1;
		min-width: 0;
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

	.toggle-collapse {
		border: 1px solid #cbd5f5;
		background: #fff;
		border-radius: 6px;
		padding: 0.25rem;
		cursor: pointer;
		font-size: 0.9rem;
		line-height: 1;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #0f172a;
	}

	.toggle-collapse:focus-visible {
		outline: 2px solid #2563eb;
		outline-offset: 2px;
	}

	.actions {
		display: inline-flex;
		gap: 0.35rem;
		margin-left: auto;
	}

	.actions button {
		border: 1px solid #cbd5f5;
		background: #fff;
		border-radius: 6px;
		padding: 0.25rem 0.5rem;
		cursor: pointer;
		font-size: 0.75rem;
	}

	.step-card.collapsed {
		padding-bottom: 0.75rem;
	}

	.step-card.collapsed .summary span {
		color: #475569;
		font-style: italic;
	}

	.step-card.collapsed .fields {
		display: none;
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

	label,
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.8rem;
		color: #334155;
	}

	.field.rich-text {
		gap: 0.5rem;
	}

	.field.rich-text > label {
		font-weight: 600;
		font-size: 0.8rem;
		color: #1e293b;
	}

	label.color-control > span {
		font-weight: 600;
		font-size: 0.8rem;
		color: #1e293b;
	}

	label.color-control :global(.color-picker) {
		width: 100%;
	}

	.toggle-field {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
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

	.grid.transitions {
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	}

	.grid.colors {
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	}

	.add-step {
		align-self: flex-start;
		border: 1px dashed #94a3b8;
		background: #f8fafc;
		border-radius: 10px;
		padding: 0.6rem 1rem;
		font-size: 0.85rem;
		cursor: pointer;
		color: #334155;
	}

	.add-step:hover {
		background: #e2e8f0;
	}
</style>
