<!-- src/lib/components/builder/controls/ColorPicker.svelte -->
<script>
	import { createEventDispatcher, onDestroy } from 'svelte';
	import { tick } from 'svelte';

	const dispatch = createEventDispatcher();

	export let value = '';
	export let label = 'Cor';
	export let showPresets = true;
	export let showInput = true;
	export let showAlpha = true;
	export let allowClear = true;
	export let alphaLabel = 'Transparência';
	export let clearLabel = 'Limpar';
	export let clearValue = 'transparent';
	export let presets = [
		'#000000',
		'#ffffff',
		'#f3f4f6',
		'#374151',
		'#ef4444',
		'#f97316',
		'#eab308',
		'#22c55e',
		'#06b6d4',
		'#3b82f6',
		'#6366f1',
		'#8b5cf6',
		'#ec4899',
		'#f43f5e',
		'#84cc16',
		'#10b981'
	];

	const DEFAULT_BASE = '#000000';
	const HEX_BODY_PATTERN = /^[0-9a-f]{1,8}$/i;

	let draftText = '';
	let isEditingText = false;
	let isDialogOpen = false;
	let triggerButton;
	let dialogEl;
	let previousFocus = null;
	let previousBodyOverflow = '';

	$: resolvedClearValue = normalizeClearValue(clearValue);
	$: parsed = deriveState(value);
	$: swatchValue = parsed.swatch;
	$: alphaPercent = parsed.alphaPercent;
	$: isTransparent = parsed.isTransparent;
	$: normalizedValue = parsed.normalized;
	$: baseHex = parsed.baseHex;
	$: {
		if (!isEditingText) {
			draftText = parsed.text;
		}
	}

	function emit(nextValue) {
		const normalized = nextValue ?? '';
		value = normalized;
		dispatch('change', { value: normalized });
	}

	function lockBodyScroll() {
		if (typeof document === 'undefined') return;
		previousBodyOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
	}

	function unlockBodyScroll() {
		if (typeof document === 'undefined') return;
		document.body.style.overflow = previousBodyOverflow || '';
	}

	onDestroy(() => {
		unlockBodyScroll();
	});

	async function openDialog() {
		if (isDialogOpen) return;
		previousFocus = typeof document !== 'undefined' ? document.activeElement : null;
		isDialogOpen = true;
		lockBodyScroll();
		dispatch('open');
		await tick();
		dialogEl?.focus();
	}

	function closeDialog() {
		if (!isDialogOpen) return;
		isDialogOpen = false;
		unlockBodyScroll();
		isEditingText = false;
		draftText = parsed.text;
		const target =
			triggerButton && triggerButton.offsetParent !== null ? triggerButton : previousFocus;
		if (target && typeof target.focus === 'function') {
			target.focus();
		}
		dispatch('close');
	}

	function handleDialogKeydown(event) {
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
		}
	}

	function handleBaseInput(event) {
		const inputValue = event.currentTarget.value;
		const nextBase = normalizeBaseHex(inputValue, baseHex);
		const next = composeColor(nextBase, alphaPercent, resolvedClearValue);
		emit(next);
	}

	function handleTextInput(event) {
		const raw = event.currentTarget.value;
		draftText = raw;

		if (!raw.trim()) {
			emit('');
			return;
		}

		const normalized = tryNormalizeColor(raw, {
			baseHex,
			alphaPercent,
			clearFallback: resolvedClearValue
		});

		if (normalized !== null) {
			emit(normalized);
		}
	}

	function handleTextFocus() {
		isEditingText = true;
	}

	function handleTextBlur() {
		isEditingText = false;
		draftText = parsed.text;
	}

	function handleAlphaRange(event) {
		const nextPercent = clampNumber(Number(event.currentTarget.value), 0, 100);
		const next = composeColor(baseHex, nextPercent, resolvedClearValue);
		emit(next);
	}

	function handleAlphaNumber(event) {
		const nextPercent = clampNumber(Number(event.currentTarget.value || 0), 0, 100);
		const next = composeColor(baseHex, nextPercent, resolvedClearValue);
		emit(next);
	}

	function handleClear() {
		emit(resolvedClearValue);
		if (!isDialogOpen) {
			draftText = '';
		}
	}

	function selectPreset(color) {
		const nextBase = normalizeBaseHex(color, baseHex);
		const next = composeColor(nextBase, alphaPercent, resolvedClearValue);
		emit(next);
	}

	function handleSave() {
		dispatch('save', { value });
		closeDialog();
	}

	function handleCancel() {
		closeDialog();
	}

	function portal(node) {
		if (typeof document === 'undefined') {
			return {};
		}
		const target = document.body;
		target.appendChild(node);
		return {
			destroy() {
				if (node.parentNode) {
					node.parentNode.removeChild(node);
				}
			}
		};
	}

	export function open() {
		openDialog();
	}

	export function close() {
		closeDialog();
	}

	function deriveState(rawValue) {
		let input = rawValue;
		if (input === null || input === undefined) {
			input = '';
		}
		if (typeof input !== 'string') {
			input = String(input);
		}

		const trimmed = input.trim();

		if (!trimmed) {
			return {
				normalized: '',
				text: '',
				baseHex: DEFAULT_BASE,
				alphaPercent: 0,
				swatch: DEFAULT_BASE,
				isTransparent: resolvedClearValue === '' || resolvedClearValue === 'transparent'
			};
		}

		if (trimmed.toLowerCase() === 'transparent') {
			return {
				normalized: resolvedClearValue,
				text: resolvedClearValue,
				baseHex: DEFAULT_BASE,
				alphaPercent: 0,
				swatch: DEFAULT_BASE,
				isTransparent: true
			};
		}

		const parsedRgba = parseRgba(trimmed);
		if (parsedRgba) {
			const { baseHex: rgbBase, alphaPercent: rgbaPercent } = parsedRgba;
			const normalized =
				rgbaPercent <= 0
					? resolvedClearValue
					: rgbaPercent >= 100
						? rgbBase
						: parsedRgba.normalized;

			return {
				normalized,
				text: normalized,
				baseHex: rgbBase,
				alphaPercent: clampNumber(rgbaPercent, 0, 100),
				swatch: rgbBase,
				isTransparent: rgbaPercent <= 0
			};
		}

		const normalizedHex = normalizeHex(trimmed);
		if (normalizedHex) {
			const hexBody = normalizedHex.slice(1);
			const hasAlpha = hexBody.length === 8;
			const base = `#${hexBody.slice(0, 6)}`;
			let alpha = 100;
			let normalized = normalizedHex;

			if (hasAlpha) {
				const alphaHex = hexBody.slice(6, 8);
				alpha = Math.round((parseInt(alphaHex, 16) / 255) * 100);
				if (alpha >= 100) {
					normalized = base;
					alpha = 100;
				} else if (alpha <= 0) {
					normalized = resolvedClearValue;
					alpha = 0;
				}
			}

			return {
				normalized,
				text: normalized,
				baseHex: base,
				alphaPercent: alpha,
				swatch: base,
				isTransparent: alpha === 0
			};
		}

		return {
			normalized: trimmed,
			text: trimmed,
			baseHex: DEFAULT_BASE,
			alphaPercent: 100,
			swatch: DEFAULT_BASE,
			isTransparent: false
		};
	}

	function normalizeHex(input) {
		if (typeof input !== 'string') return null;
		let candidate = input.trim().toLowerCase();
		if (!candidate) return null;
		if (!candidate.startsWith('#')) {
			candidate = `#${candidate}`;
		}

		const body = candidate.slice(1);
		if (!HEX_BODY_PATTERN.test(body)) {
			return null;
		}

		if (body.length === 3) {
			return `#${body
				.split('')
				.map((char) => char.repeat(2))
				.join('')}`;
		}

		if (body.length === 4) {
			const [r, g, b, a] = body.split('');
			return `#${r.repeat(2)}${g.repeat(2)}${b.repeat(2)}${a.repeat(2)}`;
		}

		if (body.length === 6 || body.length === 8) {
			return `#${body}`;
		}

		return null;
	}

	function normalizeBaseHex(input, fallback) {
		const normalized = normalizeHex(input);
		if (!normalized) return fallback || DEFAULT_BASE;
		return `#${normalized.slice(1, 7)}`;
	}

	function parseRgba(input) {
		const match = input.match(
			/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([0-9]*\.?[0-9]+))?\s*\)$/i
		);
		if (!match) return null;

		const r = clampNumber(Number(match[1]), 0, 255);
		const g = clampNumber(Number(match[2]), 0, 255);
		const b = clampNumber(Number(match[3]), 0, 255);
		const alphaComponent = match[4] === undefined ? 1 : clampAlpha(Number(match[4]));

		const base = rgbToHex(r, g, b);
		const percent = Math.round(alphaComponent * 100);
		const normalized =
			percent <= 0
				? resolvedClearValue
				: percent >= 100
					? base
					: `${base}${alphaToHex(alphaComponent)}`;

		return {
			normalized,
			baseHex: base,
			alphaPercent: percent
		};
	}

	function tryNormalizeColor(raw, context) {
		const trimmed = raw.trim();
		if (!trimmed) return '';

		if (trimmed.toLowerCase() === 'transparent') {
			return resolvedClearValue;
		}

		const normalizedHex = normalizeHex(trimmed);
		if (normalizedHex) {
			const body = normalizedHex.slice(1);
			const base = `#${body.slice(0, 6)}`;
			if (body.length === 8) {
				const alphaHex = body.slice(6, 8);
				const alphaValue = Math.round((parseInt(alphaHex, 16) / 255) * 100);
				if (alphaValue >= 100) {
					return base;
				}
				if (alphaValue <= 0) {
					return resolvedClearValue;
				}
				return `#${body}`;
			}

			if (context.alphaPercent !== undefined && context.alphaPercent !== 100) {
				return composeColor(base, context.alphaPercent, resolvedClearValue);
			}
			return base;
		}

		const rgba = parseRgba(trimmed);
		if (rgba) {
			return rgba.normalized;
		}

		return null;
	}

	function normalizeClearValue(input) {
		if (input === null || input === undefined) {
			return 'transparent';
		}

		const raw = String(input).trim();
		if (!raw) {
			return '';
		}

		if (raw.toLowerCase() === 'transparent') {
			return 'transparent';
		}

		const normalizedHex = normalizeHex(raw);
		if (normalizedHex) {
			return normalizedHex;
		}

		const rgba = parseRgba(raw);
		if (rgba) {
			return rgba.normalized;
		}

		return 'transparent';
	}

	function composeColor(base, percent, clearFallback) {
		const clamped = clampNumber(percent, 0, 100);
		if (clamped <= 0) {
			return clearFallback;
		}
		if (clamped >= 100) {
			return base;
		}
		const alphaHex = Math.round((clamped / 100) * 255)
			.toString(16)
			.padStart(2, '0');
		return `${base}${alphaHex}`;
	}

	function clampNumber(value, min, max) {
		if (!Number.isFinite(value)) return min;
		return Math.max(min, Math.min(max, value));
	}

	function clampAlpha(value) {
		if (!Number.isFinite(value)) return 1;
		if (value > 1) {
			return Math.min(value / 100, 1);
		}
		return Math.max(0, Math.min(1, value));
	}

	function rgbToHex(r, g, b) {
		return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
	}

	function componentToHex(value) {
		return clampNumber(Math.round(value), 0, 255).toString(16).padStart(2, '0');
	}

	function alphaToHex(alpha) {
		return clampNumber(Math.round(alpha * 255), 0, 255)
			.toString(16)
			.padStart(2, '0');
	}
</script>

<div class="color-picker">
	{#if label}
		<label class="color-label">{label}:</label>
	{/if}

	<div class="color-summary">
		<button
			type="button"
			class="color-trigger"
			on:click={openDialog}
			on:keydown={(event) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					openDialog();
				}
			}}
			bind:this={triggerButton}
			aria-haspopup="dialog"
			aria-expanded={isDialogOpen}
		>
			<span
				class="summary-swatch"
				style={`--swatch:${isTransparent || alphaPercent === 0 ? 'rgba(0,0,0,0)' : swatchValue}`}
			></span>
		</button>
		{#if showInput}
			<span class="summary-value">{draftText || '—'}</span>
		{/if}
		{#if allowClear}
			<button
				type="button"
				class="clear-inline"
				on:click={handleClear}
				title={clearLabel}
				aria-label={clearLabel}
			>
				<span aria-hidden="true">✕</span>
			</button>
		{/if}
	</div>
</div>

{#if isDialogOpen}
	<div class="color-dialog-backdrop" use:portal>
		<div
			class="color-dialog"
			role="dialog"
			aria-modal="true"
			aria-label={label || 'Selecionar cor'}
			tabindex="-1"
			on:click|stopPropagation
			on:mousedown|stopPropagation
			on:pointerdown|stopPropagation
			on:keydown={handleDialogKeydown}
			bind:this={dialogEl}
		>
			<header class="color-dialog__header">
				<h2>{label || 'Selecionar cor'}</h2>
			</header>
			<div class="color-dialog__content">
				<div class="color-controls">
					<div class="color-input-group">
						<div
							class="color-swatch-wrapper"
							data-transparent={alphaPercent === 0 || isTransparent}
						>
							<span class="checkerboard" aria-hidden="true"></span>
							<input
								type="color"
								value={swatchValue}
								on:input={handleBaseInput}
								class="color-swatch"
								title="Selecionar cor"
							/>
						</div>

						{#if showInput}
							<label class="color-text-wrapper">
								<span class="color-text-label">Cor (HEX)</span>
								<input
									type="text"
									class="color-text"
									value={draftText}
									on:input={handleTextInput}
									on:focus={handleTextFocus}
									on:blur={handleTextBlur}
									placeholder="#000000"
									spellcheck="false"
									autocomplete="off"
								/>
							</label>
						{/if}

						{#if allowClear}
							<button type="button" class="clear-button" on:click={handleClear} title={clearLabel}>
								{clearLabel}
							</button>
						{/if}
					</div>

					{#if showAlpha}
						<div class="alpha-control">
							<label>{alphaLabel}</label>
							<div class="alpha-inputs">
								<input
									type="range"
									min="0"
									max="100"
									value={alphaPercent}
									on:input={handleAlphaRange}
								/>
								<div class="alpha-number">
									<input
										type="number"
										min="0"
										max="100"
										value={alphaPercent}
										on:input={handleAlphaNumber}
									/>
									<span>%</span>
								</div>
							</div>
						</div>
					{/if}

					{#if showPresets && presets.length > 0}
						<div class="color-presets">
							{#each presets as preset}
								<button
									type="button"
									class="color-preset"
									class:active={normalizedValue &&
										normalizedValue.toLowerCase().startsWith(preset.toLowerCase())}
									style={`background-color: ${preset}`}
									on:click={() => selectPreset(preset)}
									title={preset}
								>
									{#if normalizedValue && normalizedValue
											.toLowerCase()
											.startsWith(preset.toLowerCase())}
										<span class="check-mark">✓</span>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
			<footer class="color-dialog__footer">
				<button type="button" class="dialog-save" on:click={handleSave}>Salvar</button>
				<button type="button" class="dialog-cancel" on:click={handleCancel}>Fechar</button>
			</footer>
		</div>
	</div>
{/if}

<style>
	.color-picker {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.color-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		margin: 0;
	}

	.color-summary {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}

	.color-trigger {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		border: 1px solid #d1d5db;
		background: #ffffff;
		border-radius: 50%;
		cursor: pointer;
		transition:
			border-color 0.2s ease,
			box-shadow 0.2s ease,
			transform 0.2s ease;
	}

	.color-trigger:hover,
	.color-trigger:focus {
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
		outline: none;
		transform: translateY(-1px);
	}

	.summary-swatch {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: 2px solid rgba(148, 163, 184, 0.4);
		background-image:
			linear-gradient(var(--swatch, #000000), var(--swatch, #000000)),
			linear-gradient(
				45deg,
				rgba(148, 163, 184, 0.35) 25%,
				transparent 25%,
				transparent 75%,
				rgba(148, 163, 184, 0.35) 75%
			),
			linear-gradient(
				45deg,
				rgba(148, 163, 184, 0.35) 25%,
				transparent 25%,
				transparent 75%,
				rgba(148, 163, 184, 0.35) 75%
			);
		background-size:
			100% 100%,
			8px 8px,
			8px 8px;
		background-position:
			0 0,
			0 0,
			4px 4px;
	}

	.summary-value {
		font-family: monospace;
		font-size: 0.75rem;
		color: #475569;
	}

	.clear-inline {
		border: none;
		background: transparent;
		color: #94a3b8;
		border-radius: 50%;
		width: 28px;
		height: 28px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition:
			color 0.2s ease,
			background-color 0.2s ease;
	}

	.clear-inline:hover,
	.clear-inline:focus {
		background: rgba(148, 163, 184, 0.15);
		color: #334155;
		outline: none;
	}

	.color-controls {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.color-input-group {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.color-text-wrapper {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.75rem;
		color: #475569;
	}

	.color-text-label {
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.color-swatch-wrapper {
		position: relative;
		width: 44px;
		height: 44px;
		border-radius: 8px;
		overflow: hidden;
	}

	.color-swatch-wrapper .checkerboard {
		position: absolute;
		inset: 0;
		background-repeat: repeat;
		background-size: 8px 8px;
		background-position:
			0 0,
			4px 4px;
		background-image:
			linear-gradient(
				45deg,
				rgba(0, 0, 0, 0.1) 25%,
				transparent 25%,
				transparent 75%,
				rgba(0, 0, 0, 0.1) 75%
			),
			linear-gradient(
				45deg,
				rgba(0, 0, 0, 0.1) 25%,
				transparent 25%,
				transparent 75%,
				rgba(0, 0, 0, 0.1) 75%
			);
		pointer-events: none;
	}

	.color-swatch {
		position: relative;
		width: 100%;
		height: 100%;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		background: none;
		padding: 0;
	}

	.color-swatch:hover {
		border-color: #3b82f6;
		transform: scale(1.05);
	}

	.color-swatch:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.color-text {
		flex: none;
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		font-family: monospace;
		background: white;
		transition: border-color 0.2s ease;
	}

	.color-text:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.clear-button {
		border: 1px solid #d1d5db;
		background: #f9fafb;
		color: #374151;
		border-radius: 6px;
		padding: 0.55rem 0.85rem;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			background-color 0.2s ease,
			border-color 0.2s ease;
	}

	.clear-button:hover {
		background: #f3f4f6;
		border-color: #9ca3af;
	}

	.clear-button:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
	}

	.alpha-control {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.alpha-control label {
		font-size: 0.75rem;
		color: #475569;
	}

	.alpha-inputs {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.alpha-inputs input[type='range'] {
		flex: 1;
	}

	.alpha-number {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		padding: 0.25rem 0.5rem;
		background: white;
	}

	.alpha-number input[type='number'] {
		width: 3.5rem;
		border: none;
		font-size: 0.75rem;
		text-align: right;
		outline: none;
		font-family: inherit;
	}

	.alpha-number span {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.color-presets {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
		gap: 0.5rem;
		max-width: 100%;
	}

	.color-preset {
		position: relative;
		width: 32px;
		height: 32px;
		border: 2px solid #e5e7eb;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		color: white;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
	}

	.color-preset:hover {
		transform: scale(1.1);
		border-color: #6b7280;
		z-index: 1;
	}

	.color-preset.active {
		border-color: #3b82f6;
		border-width: 3px;
		transform: scale(1.05);
	}

	.check-mark {
		font-weight: bold;
		font-size: 0.625rem;
	}

	.color-preset[style*='#ffffff'],
	.color-preset[style*='#f3f4f6'] {
		color: #374151;
		text-shadow: none;
	}

	@media (max-width: 640px) {
		.color-presets {
			grid-template-columns: repeat(8, 1fr);
		}
	}

	.color-dialog-backdrop {
		position: fixed;
		inset: 0;
		z-index: 9099999999;
		width: 100vw;
		height: 100vh;
		background: rgba(15, 23, 42, 0.55);
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(3px);
		padding: 2rem;
	}

	.color-dialog {
		background: #ffffff;
		color: #0f172a;
		border-radius: 16px;
		box-shadow: 0 25px 55px rgba(15, 23, 42, 0.35);
		width: min(540px, 92vw);
		max-height: 92vh;
		display: flex;
		flex-direction: column;
		outline: none;
	}

	.color-dialog__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.1rem 1.5rem 0.75rem 1.5rem;
		border-bottom: 1px solid rgba(148, 163, 184, 0.3);
	}

	.color-dialog__header h2 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.color-dialog__content {
		padding: 1.25rem 1.5rem;
		overflow-y: auto;
		flex: 1;
	}

	.color-dialog__footer {
		display: flex;
		justify-content: flex-end;
		padding: 0.85rem 1.5rem 1.3rem;
		border-top: 1px solid rgba(148, 163, 184, 0.3);
		gap: 0.5rem;
	}

	.dialog-cancel {
		border: 1px solid #d1d5db;
		background: #ffffff;
		color: #1f2937;
		border-radius: 8px;
		padding: 0.45rem 0.9rem;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			border-color 0.2s ease,
			background-color 0.2s ease;
	}

	.dialog-save {
		border: none;
		background: #2563eb;
		color: white;
		border-radius: 8px;
		padding: 0.45rem 1rem;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			background-color 0.2s ease,
			box-shadow 0.2s ease;
	}

	.dialog-save:hover,
	.dialog-save:focus {
		background: #1d4ed8;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
		outline: none;
	}

	.dialog-cancel:hover,
	.dialog-cancel:focus {
		border-color: #3b82f6;
		background: rgba(59, 130, 246, 0.08);
		outline: none;
	}
</style>
