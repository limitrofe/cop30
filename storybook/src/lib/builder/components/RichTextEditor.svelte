<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { tick } from 'svelte';
	import { ColorPicker } from '$lib/components/builder/controls/index.js';

	export let value = '';
	export let placeholder = '';
	export let rows = 6;
	export let ariaLabelledby;

	const dispatch = createEventDispatcher();
	let editorEl;
	let isFocused = false;
	let sanitizedRows = 6;
	$: sanitizedRows = Math.max(Number(rows) || 0, 1);
	let isUnorderedListActive = false;
	let isOrderedListActive = false;
	let currentColor = '#000000';
	let colorPickerRef;
	let isColorPickerOpen = false;
	const exec = (command, arg = null) => {
		if (!editorEl) return;
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return;
		const range = selection.getRangeAt(0);
		if (range.collapsed && !['insertUnorderedList', 'insertOrderedList'].includes(command)) return;
		editorEl.focus();
		const before = editorEl.innerHTML;
		const commandIsList = ['insertUnorderedList', 'insertOrderedList'].includes(command);
		const listTag = command === 'insertOrderedList' ? 'ol' : 'ul';
		const rangeSnapshot = range.cloneRange();

		const runNative = () => document.execCommand(command, false, arg);

		let success = runNative();
		if (commandIsList && (!success || editorEl.innerHTML === before)) {
			// manual fallback
			const fragment = rangeSnapshot.extractContents();
			const list = document.createElement(listTag);

			const finalizeLi = (current) => {
				if (!current) return null;
				if (!current.hasChildNodes()) {
					current.appendChild(document.createElement('br'));
				}
				list.appendChild(current);
				return null;
			};

			let currentLi = null;
			const nodes = Array.from(fragment.childNodes);
			nodes.forEach((node) => {
				if (node.nodeName === 'BR') {
					currentLi = finalizeLi(currentLi);
					return;
				}

				if (!currentLi) {
					currentLi = document.createElement('li');
				}

				if (node.nodeName === 'P' || node.nodeName === 'DIV' || node.nodeName === 'LI') {
					while (node.firstChild) {
						currentLi.appendChild(node.firstChild);
					}
				} else {
					currentLi.appendChild(node);
				}
			});

			currentLi = finalizeLi(currentLi);

			if (!list.hasChildNodes()) {
				const li = document.createElement('li');
				li.appendChild(document.createElement('br'));
				list.appendChild(li);
			}

			rangeSnapshot.insertNode(list);

			// posiciona cursor no primeiro item
			const newRange = document.createRange();
			const firstLi = list.querySelector('li') || list;
			newRange.setStart(firstLi, 0);
			newRange.collapse(true);
			selection.removeAllRanges();
			selection.addRange(newRange);

			success = true;
		}

		if (!success && commandIsList) {
			try {
				document.execCommand('formatBlock', false, 'p');
				runNative();
				success = true;
			} catch (error) {
				success = false;
			}
		}

		emit();
		updateActiveListState();
	};

	const normalizeEditorMarkup = () => {
		if (!editorEl) return;
		replaceLegacyFontTags(editorEl);
	};

	const emit = () => {
		normalizeEditorMarkup();
		const html = (editorEl?.innerHTML || '').trim();
		dispatch('change', { value: html });
	};

	const insertLink = () => {
		const selection = document.getSelection();
		const current = selection?.toString();
		const url = prompt('Digite o URL do link:', current?.startsWith('http') ? current : 'https://');
		if (!url) {
			if (selection?.rangeCount) {
				exec('unlink');
			}
			return;
		}
		exec('createLink', url);
	};

	const applyColor = (color) => {
		editorEl?.focus();
		const safeColor = typeof color === 'string' ? color.trim() : '';
		if (!safeColor) {
			currentColor = '#000000';
			exec('removeFormat');
			return;
		}

		const cssColor = normalizeColorForCss(safeColor);
		if (!cssColor) {
			currentColor = '#000000';
			exec('removeFormat');
			return;
		}

		currentColor = cssColor;

		if (cssColor === 'rgba(0, 0, 0, 0)') {
			exec('removeFormat');
			normalizeEditorMarkup();
			return;
		}

		try {
			document.execCommand('styleWithCSS', false, true);
		} catch (error) {
			// ignored: browsers que não suportam styleWithCSS
		}

		exec('foreColor', cssColor);
		normalizeEditorMarkup();

		try {
			document.execCommand('styleWithCSS', false, false);
		} catch (error) {
			// ignored: apenas restaura estado original
		}
	};

	const HEX_BODY_PATTERN = /^[0-9a-f]{3,8}$/i;

	const normalizeColorForCss = (input) => {
		if (!input) return '';
		let candidate = String(input).trim();
		if (!candidate) return '';

		if (candidate.toLowerCase() === 'transparent') {
			return 'rgba(0, 0, 0, 0)';
		}

		if (/^rgba?\(/i.test(candidate)) {
			return candidate;
		}

		if (/^#[0-9a-f]+$/i.test(candidate)) {
			return hexToCss(candidate);
		}

		return candidate;
	};

	const expandHex = (body) => {
		if (!HEX_BODY_PATTERN.test(body)) {
			return null;
		}
		switch (body.length) {
			case 3:
				return body
					.split('')
					.map((char) => char.repeat(2))
					.join('');
			case 4: {
				const [r, g, b, a] = body.split('');
				return `${r.repeat(2)}${g.repeat(2)}${b.repeat(2)}${a.repeat(2)}`;
			}
			case 6:
			case 8:
				return body;
			default:
				return null;
		}
	};

	const hexToCss = (hex) => {
		const trimmed = hex.trim().toLowerCase();
		const body = trimmed.slice(1);
		const expanded = expandHex(body);
		if (!expanded) {
			return '';
		}
		if (expanded.length === 6) {
			return `#${expanded}`;
		}
		if (expanded.length === 8) {
			const r = parseInt(expanded.slice(0, 2), 16);
			const g = parseInt(expanded.slice(2, 4), 16);
			const b = parseInt(expanded.slice(4, 6), 16);
			const alphaRaw = parseInt(expanded.slice(6, 8), 16);
			if (alphaRaw >= 255) {
				return `#${expanded.slice(0, 6)}`;
			}
			if (alphaRaw <= 0) {
				return 'rgba(0, 0, 0, 0)';
			}
			const alpha = Math.round((alphaRaw / 255) * 1000) / 1000;
			return `rgba(${r}, ${g}, ${b}, ${formatAlpha(alpha)})`;
		}
		return '';
	};

	const formatAlpha = (alpha) => {
		const alphaStr = String(alpha);
		if (alphaStr.includes('.')) {
			return alphaStr.replace(/0+$/, '').replace(/\.$/, '');
		}
		return alphaStr;
	};

	const replaceLegacyFontTags = (root) => {
		const fonts = root?.querySelectorAll?.('font');
		if (!fonts || fonts.length === 0) return;
		fonts.forEach((fontEl) => {
			const colorAttr = fontEl.getAttribute('color') || '';
			const normalizedColor = normalizeColorForCss(colorAttr);
			const parent = fontEl.parentNode;
			if (!parent) return;
			if (!normalizedColor || normalizedColor === 'rgba(0, 0, 0, 0)') {
				while (fontEl.firstChild) {
					parent.insertBefore(fontEl.firstChild, fontEl);
				}
				fontEl.remove();
				return;
			}
			const span = document.createElement('span');
			span.setAttribute('style', `color: ${normalizedColor};`);
			while (fontEl.firstChild) {
				span.appendChild(fontEl.firstChild);
			}
			fontEl.replaceWith(span);
		});
	};

	const handleColorChange = (event) => {
		applyColor(event.detail.value);
	};

	const handleInput = () => {
		emit();
	};

	const handlePaste = (event) => {
		event.preventDefault();
		const text = event.clipboardData.getData('text/plain');
		document.execCommand('insertText', false, text);
		emit();
	};

	const handleKeydown = (event) => {
		if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
			event.preventDefault();
			insertLink();
		}
		if ((event.metaKey || event.ctrlKey) && ['b', 'i', 'u'].includes(event.key.toLowerCase())) {
			const selection = window.getSelection();
			if (!selection || selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) {
				event.preventDefault();
				return;
			}
		}
	};

	$: if (editorEl && !isFocused) {
		const current = editorEl.innerHTML;
		const next = value || '';
		if (current !== next) {
			editorEl.innerHTML = next;
			normalizeEditorMarkup();
		}
	}

	const updateActiveListState = () => {
		if (!editorEl) return;
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) {
			isOrderedListActive = false;
			isUnorderedListActive = false;
			return;
		}
		const anchor = selection.anchorNode;
		if (!anchor || !editorEl.contains(anchor)) {
			isOrderedListActive = false;
			isUnorderedListActive = false;
			return;
		}
		const element = anchor.nodeType === Node.ELEMENT_NODE ? anchor : anchor.parentElement;
		isOrderedListActive = Boolean(element?.closest('ol'));
		isUnorderedListActive = Boolean(element?.closest('ul'));
	};

	onMount(async () => {
		await tick();
		if (editorEl && value) {
			editorEl.innerHTML = value;
			normalizeEditorMarkup();
		}

		try {
			document.execCommand('defaultParagraphSeparator', false, 'p');
		} catch (error) {
			// ignore browsers without support
		}

		document.addEventListener('selectionchange', updateActiveListState);
		updateActiveListState();

		return () => {
			document.removeEventListener('selectionchange', updateActiveListState);
		};
	});
</script>

<div class="rt-wrapper">
	<div class="rt-toolbar" role="toolbar" aria-label="Ferramentas de formatação">
		<button
			type="button"
			on:mousedown|preventDefault
			on:click={() => exec('bold')}
			title="Negrito (Ctrl/Cmd + B)"><strong>B</strong></button
		>
		<button
			type="button"
			on:mousedown|preventDefault
			on:click={() => exec('italic')}
			title="Itálico (Ctrl/Cmd + I)"><em>I</em></button
		>
		<button
			type="button"
			on:mousedown|preventDefault
			on:click={() => exec('underline')}
			title="Sublinhado (Ctrl/Cmd + U)"><u>U</u></button
		>
		<button
			type="button"
			on:mousedown|preventDefault
			on:click={() => exec('strikeThrough')}
			title="Tachado">S</button
		>
		<span class="rt-divider" aria-hidden="true"></span>
		<button
			type="button"
			class:active={isUnorderedListActive}
			on:mousedown|preventDefault
			on:click={() => exec('insertUnorderedList')}
			title="Lista com marcadores">•≡</button
		>
		<button
			type="button"
			class:active={isOrderedListActive}
			on:mousedown|preventDefault
			on:click={() => exec('insertOrderedList')}
			title="Lista numerada">1.</button
		>
		<button type="button" on:mousedown|preventDefault on:click={insertLink} title="Inserir link"
			>🔗</button
		>
		<span class="rt-divider" aria-hidden="true"></span>
		<div class="rt-color" title="Cor do texto">
			<button
				type="button"
				class="rt-color-button"
				on:mousedown|preventDefault
				on:click={() => colorPickerRef?.open()}
				aria-haspopup="dialog"
				aria-expanded={isColorPickerOpen}
			>
				<span
					class="rt-color-swatch"
					style={`--swatch-color:${
						currentColor === 'transparent' ? 'rgba(0,0,0,0)' : currentColor || '#000000'
					}`}
				></span>
			</button>
			<ColorPicker
				class="rt-color-controller"
				label={null}
				value={currentColor}
				showPresets={false}
				showAlpha={true}
				allowClear={true}
				clearValue="transparent"
				bind:this={colorPickerRef}
				on:change={handleColorChange}
				on:save={(event) => applyColor(event.detail.value)}
				on:open={() => (isColorPickerOpen = true)}
				on:close={() => (isColorPickerOpen = false)}
			/>
		</div>
		<button
			type="button"
			on:mousedown|preventDefault
			on:click={() => exec('removeFormat')}
			title="Remover formatação">⟲</button
		>
	</div>

	<div
		class="rt-editor"
		class:empty={!value}
		contenteditable
		role="textbox"
		aria-multiline="true"
	aria-label={ariaLabelledby ? undefined : placeholder}
	aria-labelledby={ariaLabelledby}
		bind:this={editorEl}
		data-placeholder={placeholder}
		style={`min-height: calc(${sanitizedRows} * 1.4rem);`}
		on:input={handleInput}
		on:paste={handlePaste}
		on:keydown={handleKeydown}
		on:focus={() => {
			isFocused = true;
		}}
		on:blur={() => {
			isFocused = false;
			emit();
		}}
	></div>
</div>

<style>
	.rt-wrapper {
		display: flex;
		flex-direction: column;
		border: 1px solid #cbd5f5;
		border-radius: 10px;
		background: #fff;
		overflow: hidden;
		box-shadow: inset 0 1px 2px rgba(148, 163, 184, 0.12);
	}

	.rt-toolbar {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.45rem;
		background: #f1f5f9;
		border-bottom: 1px solid #cbd5f5;
		flex-wrap: wrap;
	}

	.rt-toolbar button {
		border: none;
		background: #fff;
		color: #1f2937;
		border-radius: 8px;
		padding: 0.32rem 0.55rem;
		font-size: 0.85rem;
		cursor: pointer;
		transition:
			background 0.2s ease,
			box-shadow 0.2s ease;
	}

	.rt-toolbar button:hover,
	.rt-toolbar button:focus {
		background: #e2e8f0;
		outline: none;
	}

	.rt-toolbar button.active {
		background: #1d4ed8;
		color: #fff;
		box-shadow: 0 0 0 2px rgba(30, 64, 175, 0.2);
	}

	.rt-divider {
		width: 1px;
		align-self: stretch;
		background: rgba(148, 163, 184, 0.4);
	}

	.rt-color {
		position: relative;
		display: flex;
		align-items: center;
	}

	.rt-color-button {
		border: none;
		background: #fff;
		border-radius: 6px;
		padding: 0.3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition:
			background 0.2s ease,
			box-shadow 0.2s ease;
	}

	.rt-color-button:hover,
	.rt-color-button:focus {
		background: #e2e8f0;
		outline: none;
	}

	.rt-color-swatch {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: 2px solid rgba(15, 23, 42, 0.15);
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
		background-clip: padding-box;
		position: relative;
		background-image:
			linear-gradient(var(--swatch-color, #000000), var(--swatch-color, #000000)),
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

	.rt-color-controller {
		position: absolute;
		left: -9999px;
		top: -9999px;
		height: 1px;
		width: 1px;
		overflow: hidden;
	}

	.rt-color-controller :global(.color-label),
	.rt-color-controller :global(.color-summary) {
		display: none !important;
	}

	.rt-editor {
		padding: 0.8rem 1rem;
		font-size: 0.95rem;
		line-height: 1.6;
		color: #0f172a;
		outline: none;
		word-break: break-word;
	}

	.rt-editor ul {
		padding-left: 1.4rem;
		list-style: disc;
		margin: 0.5rem 0;
	}

	.rt-editor ol {
		padding-left: 1.4rem;
		list-style: decimal;
		margin: 0.5rem 0;
	}

	.rt-editor.empty::before {
		content: attr(data-placeholder);
		color: #94a3b8;
		pointer-events: none;
		display: block;
	}
</style>
