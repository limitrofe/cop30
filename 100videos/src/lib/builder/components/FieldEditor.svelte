<script>
	import { createEventDispatcher } from 'svelte';
	import ScrollyStepsEditor from './editors/ScrollyStepsEditor.svelte';
	import GalleryItemsEditor from './editors/GalleryItemsEditor.svelte';
	import CarouselItemsEditor from './editors/CarouselItemsEditor.svelte';
	import GloboPlayerSlidesEditor from './editors/GloboPlayerSlidesEditor.svelte';
	import GloboPlayerGridSliderEditor from './editors/GloboPlayerGridSliderEditor.svelte';
	import ContentGridItemsEditor from './editors/ContentGridItemsEditor.svelte';
	import ListItemsEditor from './editors/ListItemsEditor.svelte';
	import RichTextEditor from './RichTextEditor.svelte';
	import FlourishScrollyStepsEditor from './editors/FlourishScrollyStepsEditor.svelte';
	import { ColorPicker } from '$lib/components/builder/controls/index.js';

	export let field;
	export let value;

	const dispatch = createEventDispatcher();
	let jsonText = field.type === 'json' && value ? JSON.stringify(value, null, 2) : '';
	let jsonError = '';
	let isEditingJson = false;

	const isEmpty = (val) => val === undefined || val === null || val === '';

	const handleInput = (event) => {
		const inputValue = event.currentTarget.value;

		switch (field.type) {
			case 'number': {
				const parsed = inputValue === '' ? '' : Number(inputValue);
				dispatch('change', { value: Number.isNaN(parsed) ? null : parsed });
				break;
			}
			case 'boolean': {
				dispatch('change', { value: event.currentTarget.checked });
				break;
			}
			default: {
				dispatch('change', { value: inputValue });
			}
		}
	};

	const handleSelect = (event) => {
		dispatch('change', { value: event.currentTarget.value });
	};

	const handleJsonBlur = () => {
		isEditingJson = false;
		try {
			if (!jsonText?.trim()) {
				jsonError = '';
				dispatch('change', { value: field.emptyValue ?? [] });
				return;
			}
			const parsed = JSON.parse(jsonText);
			jsonError = '';
			dispatch('change', { value: parsed });
		} catch (error) {
			const relaxed = tryRelaxedParse(jsonText, field);
			if (relaxed.success) {
				jsonError = '';
				jsonText = relaxed.serialized;
				dispatch('change', { value: relaxed.value });
			} else {
				jsonError = 'JSON inválido: ' + error.message;
			}
		}
	};

	const handleJsonFocus = () => {
		isEditingJson = true;
	};

	$: if (field.type === 'json' && !isEditingJson) {
		jsonText = value ? JSON.stringify(value, null, 2) : '';
	}

	$: if (field.type === 'select' && isEmpty(value) && field.options?.length) {
		const fallback = field.defaultValue ?? field.options[0]?.value;
		if (!isEmpty(fallback) && fallback !== value) {
			dispatch('change', { value: fallback });
		}
	}

	function tryRelaxedParse(text, field) {
		const trimmed = text.trim();
		if (!trimmed) {
			return {
				success: true,
				value: field.emptyValue ?? [],
				serialized: JSON.stringify(field.emptyValue ?? [], null, 2)
			};
		}

		const lines = trimmed
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter(Boolean);
		if (!lines.length) {
			return {
				success: true,
				value: field.emptyValue ?? [],
				serialized: JSON.stringify(field.emptyValue ?? [], null, 2)
			};
		}

		const path = field.path || '';

		if (path.endsWith('credits.sections')) {
			const sections = lines.map((line, index) => {
				const [rawTitle, ...restParts] = line.split(':');
				const title = (rawTitle || '').trim();
				const remainder = restParts.join(':').trim();
				const people = remainder
					? remainder
							.split(/,|;|\•/)
							.map((item) => item.trim())
							.filter(Boolean)
					: [];

				return {
					title: title || `Seção ${index + 1}`,
					items: people.length ? people : title ? [] : [line]
				};
			});

			return {
				success: true,
				value: sections,
				serialized: JSON.stringify(sections, null, 2)
			};
		}

		if (path.startsWith('credits.') && path !== 'credits.sections') {
			const list = lines.map((line) => {
				const [rawName, ...restParts] = line.split(':');
				const name = (rawName || '').trim();
				const remainder = restParts.join(':').trim();

				if (name && remainder) {
					return { name, role: remainder };
				}

				return line;
			});

			return {
				success: true,
				value: list,
				serialized: JSON.stringify(list, null, 2)
			};
		}

		return { success: false };
	}
</script>

{#if field.type === 'richtext'}
	<div class="field-editor">
		<div class="richtext-field">
			<span class="field-label">{field.label}</span>
			<RichTextEditor
				value={value ?? ''}
				placeholder={field.placeholder}
				rows={field.rows || 6}
				on:change={(event) => dispatch('change', { value: event.detail.value })}
			/>
		</div>
		{#if field.description}
			<small class="description">{field.description}</small>
		{/if}
	</div>
{:else}
	<div class="field-editor">
		{#if field.type === 'color'}
			{#if field?.presets}
				<ColorPicker
					label={field.label}
					value={value ?? ''}
					showPresets={field.showPresets ?? Boolean(field.presets)}
					showInput={field.showInput ?? true}
					showAlpha={field.showAlpha ?? true}
					allowClear={field.allowClear ?? true}
					clearValue={field.clearValue ?? 'transparent'}
					presets={field.presets}
					on:change={(event) => dispatch('change', { value: event.detail.value })}
				/>
			{:else}
				<ColorPicker
					label={field.label}
					value={value ?? ''}
					showPresets={field.showPresets ?? Boolean(field.presets)}
					showInput={field.showInput ?? true}
					showAlpha={field.showAlpha ?? true}
					allowClear={field.allowClear ?? true}
					clearValue={field.clearValue ?? 'transparent'}
					on:change={(event) => dispatch('change', { value: event.detail.value })}
				/>
			{/if}
		{:else if field.type === 'content-grid-items'}
			{#if field.label}
				<span class="field-label">{field.label}</span>
			{/if}
			<ContentGridItemsEditor
				value={value ?? []}
				on:change={(event) => dispatch('change', { value: event.detail.value })}
			/>
		{:else}
			<label>
				<span>{field.label}</span>
				{#if field.type === 'text' || field.type === 'url'}
					<input
						type={field.type === 'url' ? 'url' : 'text'}
						value={value ?? ''}
						placeholder={field.placeholder}
						required={field.required}
						on:input={handleInput}
					/>
				{:else if field.type === 'number'}
					<input
						type="number"
						value={value ?? ''}
						min={field.min}
						max={field.max}
						step={field.step}
						placeholder={field.placeholder}
						required={field.required}
						on:input={handleInput}
					/>
				{:else if field.type === 'textarea'}
					<textarea
						rows={field.rows || 3}
						placeholder={field.placeholder}
						value={value ?? ''}
						required={field.required}
						on:input={handleInput}
					></textarea>
				{:else if field.type === 'select'}
					<select
						on:change={handleSelect}
						value={isEmpty(value) ? (field.defaultValue ?? field.options?.[0]?.value ?? '') : value}
						required={field.required}
					>
						{#each field.options || [] as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				{:else if field.type === 'boolean'}
					<div class="boolean-field">
						<input type="checkbox" checked={Boolean(value)} on:change={handleInput} />
						{#if field.helpText}
							<span>{field.helpText}</span>
						{/if}
					</div>
				{:else if field.type === 'scrolly-steps'}
					<ScrollyStepsEditor
						value={value ?? []}
						on:change={(event) => dispatch('change', { value: event.detail.value })}
					/>
				{:else if field.type === 'list-items'}
					<ListItemsEditor
						value={value ?? []}
						on:change={(event) => dispatch('change', { value: event.detail.value })}
					/>
				{:else if field.type === 'gallery-items'}
					<GalleryItemsEditor
						value={value ?? []}
						on:change={(event) => dispatch('change', { value: event.detail.value })}
					/>
				{:else if field.type === 'carousel-items'}
					<CarouselItemsEditor
						value={value ?? []}
						on:change={(event) => dispatch('change', { value: event.detail.value })}
					/>
				{:else if field.type === 'globoplayer-slides'}
					<GloboPlayerSlidesEditor
						value={value ?? []}
						on:change={(event) => dispatch('change', { value: event.detail.value })}
					/>
				{:else if field.type === 'globoplayer-grid-slides'}
					<GloboPlayerGridSliderEditor
						value={value ?? []}
						on:change={(event) => dispatch('change', { value: event.detail.value })}
					/>
				{:else if field.type === 'flourish-scrolly-steps'}
					<FlourishScrollyStepsEditor
						value={value ?? []}
						on:change={(event) => dispatch('change', { value: event.detail.value })}
					/>
				{:else if field.type === 'json'}
					<textarea
						class:invalid={jsonError}
						rows={field.rows || 6}
						bind:value={jsonText}
						placeholder={field.placeholder}
						on:focus={handleJsonFocus}
						on:blur={handleJsonBlur}
					></textarea>
					{#if jsonError}
						<small class="error">{jsonError}</small>
					{/if}
				{/if}
			</label>
		{/if}
		{#if field.description}
			<small class="description">{field.description}</small>
		{/if}
	</div>
{/if}

<style>
	.field-editor {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.richtext-field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		color: #1e293b;
		font-size: 0.75rem;
	}

	.richtext-field .field-label,
	.field-editor > .field-label {
		font-weight: 600;
		font-size: 0.75rem;
		color: #1e293b;
	}

	label {
		display: flex;
		flex-direction: column;
		font-size: 0.75rem;
		gap: 0.35rem;
		color: #1e293b;
	}

	input,
	textarea,
	select {
		border: 1px solid #cbd5f5;
		border-radius: 8px;
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		background: #fff;
		transition: border-color 0.2s ease;
	}

	input:focus,
	textarea:focus,
	select:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	textarea.richtext {
		font-family: 'Inter', system-ui, sans-serif;
	}

	.boolean-field {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.boolean-field input[type='checkbox'] {
		width: 16px;
		height: 16px;
	}

	.description {
		color: #64748b;
		font-size: 0.7rem;
	}

	.error {
		color: #dc2626;
		font-size: 0.7rem;
	}

	.invalid {
		border-color: #dc2626;
	}
</style>
