<script>
	import { createEventDispatcher, tick } from 'svelte';
	import RichTextEditor from '../RichTextEditor.svelte';

	export let value = [];

	const dispatch = createEventDispatcher();
	let columns = [];
	let isUpdating = false;
	let lastSyncedSnapshot = JSON.stringify(value ?? []);

	const createId = () => `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

	const typeOptions = [
		{ value: 'text', label: 'Texto' },
		{ value: 'image', label: 'Imagem' },
		{ value: 'video', label: 'Video' },
		{ value: 'intertitle', label: 'Intertitulo' },
		{ value: 'frase', label: 'Frase' },
		{ value: 'globoplayer', label: 'GloboPlay' },
		{ value: 'card', label: 'Card (mídia + texto)' }
	];

	const alignOptions = [
		{ value: 'start', label: 'Esquerda' },
		{ value: 'center', label: 'Centro' },
		{ value: 'end', label: 'Direita' }
	];

	const blockTypeOptions = [
		{ value: 'text', label: 'Texto' },
		{ value: 'image', label: 'Imagem' },
		{ value: 'video', label: 'Video' },
		{ value: 'intertitle', label: 'Intertitulo' },
		{ value: 'quote', label: 'Frase' },
		{ value: 'globoplayer', label: 'GloboPlay' }
	];

	const canonicalType = (raw) => {
		switch ((raw || '').toString().toLowerCase()) {
			case 'imagem':
			case 'image':
				return 'image';
			case 'video':
			case 'video':
				return 'video';
			case 'intertitle':
			case 'intertitulo':
				return 'intertitle';
			case 'phrase':
			case 'quote':
			case 'frase':
				return 'frase';
			case 'globo-player':
			case 'globoplayer':
				return 'globoplayer';
			case 'card':
			case 'cards':
				return 'card';
			case 'text':
			case 'texto':
			default:
				return 'text';
		}
	};

	const canonicalBlockType = (raw) => {
		switch ((raw || '').toString().toLowerCase()) {
			case 'intertitle':
			case 'intertitulo':
				return 'intertitle';
			case 'quote':
			case 'frase':
				return 'quote';
			case 'image':
			case 'imagem':
				return 'image';
			case 'video':
			case 'embed':
			case 'iframe':
				return 'video';
			case 'globo-player':
			case 'globoplayer':
			case 'globoplay':
				return 'globoplayer';
			default:
				return 'text';
		}
	};

	const newImage = () => ({ desktop: '', mobile: '', alt: '', caption: '', credit: '' });
	const newVideo = () => ({
		src: '',
		poster: '',
		embedHtml: '',
		autoplay: false,
		muted: true,
		controls: true,
		loop: false,
		caption: '',
		credit: ''
	});
	const newGlobo = () => ({
		videoIdDesktop: '',
		videoIdMobile: '',
		videoId: '',
		caption: '',
		credit: '',
		autoPlay: false,
		startMuted: true,
		showCaption: true,
		aspectRatio: '16 / 9',
		aspectRatioMobile: '9 / 16',
		backgroundColor: '',
		widthDesktop: '100%',
		widthMobile: '100%'
	});

	const clampSpan = (value, fallback = 1) => {
		const parsed = Number(value);
		if (Number.isNaN(parsed)) return fallback;
		return Math.min(Math.max(parsed, 1), 6);
	};

	const newBlock = (type = 'text') => {
		const canonical = canonicalBlockType(type);
		switch (canonical) {
			case 'image':
				return { __internalId: createId(), type: 'image', image: newImage() };
			case 'video':
				return { __internalId: createId(), type: 'video', video: newVideo() };
			case 'intertitle':
				return { __internalId: createId(), type: 'intertitle', title: 'Intertitulo' };
			case 'quote':
				return {
					__internalId: createId(),
					type: 'quote',
					text: '<p>Frase ou citacao.</p>',
					author: ''
				};
			case 'globoplayer':
				return { __internalId: createId(), type: 'globoplayer', globo: newGlobo() };
			default:
				return { __internalId: createId(), type: 'text', text: '<p>Bloco adicional de texto.</p>' };
		}
	};

	const normalizeBlock = (block) => {
		const canonical = canonicalBlockType(block?.type);
		const base = newBlock(canonical);
		const clone = structuredClone(block || {});
		return {
			...base,
			...clone,
			type: canonical,
			__internalId: clone.__internalId || base.__internalId,
			image: canonical === 'image' ? { ...base.image, ...(clone.image || {}) } : undefined,
			video: canonical === 'video' ? { ...base.video, ...(clone.video || {}) } : undefined,
			globo: canonical === 'globoplayer' ? { ...base.globo, ...(clone.globo || {}) } : undefined
		};
	};

	const buildDefaults = (type = 'text') => {
		const canonical = canonicalType(type);
		const baseText =
			canonical === 'text'
				? '<p>Insira o conteudo da coluna.</p>'
				: canonical === 'frase'
					? '<p>Frase de destaque para chamar atencao.</p>'
					: '';

		return {
			__internalId: createId(),
			type: canonical,
			pretitle: '',
			title: canonical === 'intertitle' ? 'Intertitulo' : '',
			subtitle: '',
			text: baseText,
			author: '',
			callout: '',
			align: canonical === 'intertitle' ? 'center' : 'start',
			image: newImage(),
			video: newVideo(),
			globo: newGlobo(),
			mediaType: 'image',
			mediaImage: newImage(),
			mediaVideo: newVideo(),
			mediaGlobo: newGlobo(),
			layout: canonical === 'card' ? 'media-left' : 'media-top',
			spanDesktop: 1,
			spanTablet: 1,
			spanMobile: 1,
			blocks: []
		};
	};

	const normalizeColumn = (item) => {
		const type = canonicalType(item?.type);
		const base = buildDefaults(type);
		const clone = structuredClone(item || {});
		return {
			...base,
			...clone,
			type,
			__internalId: clone.__internalId || base.__internalId,
			image: { ...base.image, ...(clone.image || {}) },
			video: { ...base.video, ...(clone.video || {}) },
			globo: { ...base.globo, ...(clone.globo || {}) },
			mediaType: clone.mediaType || base.mediaType,
			mediaImage: { ...base.mediaImage, ...(clone.mediaImage || {}) },
			mediaVideo: { ...base.mediaVideo, ...(clone.mediaVideo || {}) },
			mediaGlobo: { ...base.mediaGlobo, ...(clone.mediaGlobo || {}) },
			layout: clone.layout || base.layout,
			spanDesktop: clampSpan(clone.spanDesktop ?? base.spanDesktop, base.spanDesktop),
			spanTablet: clampSpan(
				clone.spanTablet ?? clone.spanDesktop ?? base.spanTablet,
				base.spanTablet
			),
			spanMobile: clampSpan(clone.spanMobile ?? base.spanMobile, base.spanMobile),
			blocks: Array.isArray(clone.blocks) ? clone.blocks.map((block) => normalizeBlock(block)) : []
		};
	};

	$: if (!isUpdating) {
		const incomingSnapshot = JSON.stringify(value ?? []);
		if (incomingSnapshot !== lastSyncedSnapshot) {
			const source = Array.isArray(value) && value.length ? value : [buildDefaults()];
			const previous = columns || [];
			const next = source.map((item, index) => {
				const normalized = normalizeColumn(item);
				const previousColumn = previous[index];
				if (previousColumn?.__internalId) {
					normalized.__internalId = previousColumn.__internalId;
				} else if (!normalized.__internalId) {
					normalized.__internalId = createId();
				}

				const previousBlocks = previousColumn?.blocks || [];
				normalized.blocks = (normalized.blocks || []).map((block, blockIndex) => {
					const normalizedBlock = normalizeBlock(block);
					const previousBlock = previousBlocks[blockIndex];
					if (previousBlock?.__internalId) {
						normalizedBlock.__internalId = previousBlock.__internalId;
					} else if (!normalizedBlock.__internalId) {
						normalizedBlock.__internalId = createId();
					}
					return normalizedBlock;
				});
				return normalized;
			});
			columns = next;
			lastSyncedSnapshot = incomingSnapshot;
		}
	}

	const sanitizeBlocks = (blocks) =>
		(blocks || []).map((block) => {
			const clone = structuredClone(block);
			if (clone.__internalId) delete clone.__internalId;
			if (clone.image?.__internalId) delete clone.image.__internalId;
			if (clone.video?.__internalId) delete clone.video.__internalId;
			if (clone.globo?.__internalId) delete clone.globo.__internalId;
			return clone;
		});

	const sanitizeColumn = (column) => {
		const clone = structuredClone(column);
		if (clone.__internalId) delete clone.__internalId;
		clone.blocks = sanitizeBlocks(clone.blocks);
		return clone;
	};

	const emit = (updated) => {
		isUpdating = true;
		const payload = updated.map((item) => sanitizeColumn(item));
		dispatch('change', { value: payload });
		lastSyncedSnapshot = JSON.stringify(payload ?? []);
		tick().then(() => {
			isUpdating = false;
		});
	};

	const addColumn = (type = 'text') => {
		const updated = [...columns, buildDefaults(type)];
		columns = updated;
		emit(updated);
	};

	const duplicateColumn = (index) => {
		const base = structuredClone(columns[index]);
		const clone = normalizeColumn(base);
		clone.__internalId = createId();
		clone.blocks = (clone.blocks || []).map((block) => ({
			...block,
			__internalId: createId()
		}));
		const updated = [...columns.slice(0, index + 1), clone, ...columns.slice(index + 1)];
		columns = updated;
		emit(updated);
	};

	const removeColumn = (index) => {
		if (columns.length === 1) {
			const fallback = [buildDefaults('text')];
			columns = fallback;
			emit(fallback);
			return;
		}

		const updated = columns.filter((_, i) => i !== index);
		columns = updated;
		emit(updated);
	};

	const moveColumn = (index, direction) => {
		const target = index + direction;
		if (target < 0 || target >= columns.length) return;
		const updated = [...columns];
		const [item] = updated.splice(index, 1);
		updated.splice(target, 0, item);
		columns = updated;
		emit(updated);
	};

	const updateColumn = (index, patch) => {
		const updated = columns.map((item, i) => (i === index ? { ...item, ...patch } : item));
		columns = updated;
		emit(updated);
	};

	const updateImage = (index, key, value) => {
		const updated = columns.map((item, i) => {
			if (i !== index) return item;
			return { ...item, image: { ...item.image, [key]: value } };
		});
		columns = updated;
		emit(updated);
	};

	const updateVideo = (index, key, value) => {
		const updated = columns.map((item, i) => {
			if (i !== index) return item;
			return { ...item, video: { ...item.video, [key]: value } };
		});
		columns = updated;
		emit(updated);
	};

	const updateGlobo = (index, key, value) => {
		const updated = columns.map((item, i) => {
			if (i !== index) return item;
			return { ...item, globo: { ...item.globo, [key]: value } };
		});
		columns = updated;
		emit(updated);
	};

	const updateMediaImage = (index, key, value) => {
		const updated = columns.map((item, i) => {
			if (i !== index) return item;
			return { ...item, mediaImage: { ...item.mediaImage, [key]: value } };
		});
		columns = updated;
		emit(updated);
	};

	const updateMediaVideo = (index, key, value) => {
		const updated = columns.map((item, i) => {
			if (i !== index) return item;
			return { ...item, mediaVideo: { ...item.mediaVideo, [key]: value } };
		});
		columns = updated;
		emit(updated);
	};

	const updateMediaGlobo = (index, key, value) => {
		const updated = columns.map((item, i) => {
			if (i !== index) return item;
			return { ...item, mediaGlobo: { ...item.mediaGlobo, [key]: value } };
		});
		columns = updated;
		emit(updated);
	};

	const updateBlocks = (index, blocksUpdater) => {
		const updated = columns.map((item, i) => {
			if (i !== index) return item;
			return { ...item, blocks: blocksUpdater(item.blocks || []) };
		});
		columns = updated;
		emit(updated);
	};

	const addBlock = (index, type = 'text') => {
		updateBlocks(index, (blocks) => [...blocks, newBlock(type)]);
	};

	const duplicateBlock = (index, blockIndex) => {
		updateBlocks(index, (blocks) => {
			const base = structuredClone(blocks[blockIndex]);
			const clone = normalizeBlock(base);
			clone.__internalId = createId();
			return [...blocks.slice(0, blockIndex + 1), clone, ...blocks.slice(blockIndex + 1)];
		});
	};

	const removeBlock = (index, blockIndex) => {
		updateBlocks(index, (blocks) => blocks.filter((_, i) => i !== blockIndex));
	};

	const moveBlock = (index, blockIndex, direction) => {
		updateBlocks(index, (blocks) => {
			const target = blockIndex + direction;
			if (target < 0 || target >= blocks.length) return blocks;
			const updated = [...blocks];
			const [item] = updated.splice(blockIndex, 1);
			updated.splice(target, 0, item);
			return updated;
		});
	};

	const updateBlock = (index, blockIndex, patch) => {
		updateBlocks(index, (blocks) =>
			blocks.map((block, i) => (i === blockIndex ? { ...block, ...patch } : block))
		);
	};

	const updateBlockImage = (index, blockIndex, key, value) => {
		updateBlocks(index, (blocks) =>
			blocks.map((block, i) => {
				if (i !== blockIndex) return block;
				const image = block.image || newImage();
				return { ...block, image: { ...image, [key]: value } };
			})
		);
	};

	const updateBlockVideo = (index, blockIndex, key, value) => {
		updateBlocks(index, (blocks) =>
			blocks.map((block, i) => {
				if (i !== blockIndex) return block;
				const video = block.video || newVideo();
				return { ...block, video: { ...video, [key]: value } };
			})
		);
	};

	const updateBlockGlobo = (index, blockIndex, key, value) => {
		updateBlocks(index, (blocks) =>
			blocks.map((block, i) => {
				if (i !== blockIndex) return block;
				const globo = block.globo || newGlobo();
				return { ...block, globo: { ...globo, [key]: value } };
			})
		);
	};

	const changeBlockType = (index, blockIndex, nextType) => {
		updateBlocks(index, (blocks) =>
			blocks.map((block, i) => {
				if (i !== blockIndex) return block;
				const fresh = newBlock(nextType);
				return normalizeBlock({
					...fresh,
					...block,
					type: nextType,
					__internalId: block.__internalId
				});
			})
		);
	};

	const handleTypeChange = (index, nextType) => {
		const canonical = canonicalType(nextType);
		const base = buildDefaults(canonical);
		const merged = {
			...columns[index],
			...base,
			type: canonical,
			image: { ...columns[index].image, ...base.image },
			video: { ...columns[index].video, ...base.video },
			globo: { ...columns[index].globo, ...base.globo }
		};
		const updated = columns.map((item, i) => (i === index ? merged : item));
		columns = updated;
		emit(updated);
	};
</script>

<div class="grid-items-editor">
	{#each columns as column, index (column.__internalId)}
		<article class="grid-column-card">
			<header>
				<div class="title">
					<strong>Coluna {index + 1}</strong>
					<select
						on:change={(event) => handleTypeChange(index, event.currentTarget.value)}
						value={column.type}
					>
						{#each typeOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>
				<div class="actions">
					<button
						type="button"
						on:click={() => moveColumn(index, -1)}
						disabled={index === 0}
						title="Mover para cima">↑</button
					>
					<button
						type="button"
						on:click={() => moveColumn(index, +1)}
						disabled={index === columns.length - 1}
						title="Mover para baixo">↓</button
					>
					<button type="button" on:click={() => duplicateColumn(index)} title="Duplicar">⧉</button>
					<button type="button" class="danger" on:click={() => removeColumn(index)} title="Remover"
						>✕</button
					>
				</div>
			</header>

			<section class="fields">
				<div class="field-group">
					<label>
						<span>Pretitulo</span>
						<input
							type="text"
							value={column.pretitle || ''}
							on:input={(event) => updateColumn(index, { pretitle: event.currentTarget.value })}
						/>
					</label>
					<label>
						<span>Titulo</span>
						<input
							type="text"
							value={column.title || ''}
							on:input={(event) => updateColumn(index, { title: event.currentTarget.value })}
						/>
					</label>
					<label>
						<span>Subtitulo</span>
						<input
							type="text"
							value={column.subtitle || ''}
							on:input={(event) => updateColumn(index, { subtitle: event.currentTarget.value })}
						/>
					</label>
				</div>

				<div class="field-group three-columns">
					<label>
						<span>Span desktop</span>
						<input
							type="number"
							min="1"
							max="6"
							value={column.spanDesktop ?? 1}
							on:input={(event) =>
								updateColumn(index, { spanDesktop: clampSpan(event.currentTarget.value, 1) })}
						/>
					</label>
					<label>
						<span>Span tablet</span>
						<input
							type="number"
							min="1"
							max="6"
							value={column.spanTablet ?? column.spanDesktop ?? 1}
							on:input={(event) =>
								updateColumn(index, {
									spanTablet: clampSpan(event.currentTarget.value, column.spanDesktop ?? 1)
								})}
						/>
					</label>
					<label>
						<span>Span mobile</span>
						<input
							type="number"
							min="1"
							max="6"
							value={column.spanMobile ?? 1}
							on:input={(event) =>
								updateColumn(index, { spanMobile: clampSpan(event.currentTarget.value, 1) })}
						/>
					</label>
				</div>

				{#if column.type === 'text' || column.type === 'frase' || column.type === 'intertitle'}
					<div class="field-group">
						<label>
							<span>Alinhamento</span>
							<select
								on:change={(event) => updateColumn(index, { align: event.currentTarget.value })}
								value={column.align || 'start'}
							>
								{#each alignOptions as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
						</label>
					</div>
				{/if}

				{#if column.type === 'text'}
					<div class="richtext-field">
						<span>Texto</span>
						<RichTextEditor
							value={column.text || ''}
							on:change={(event) => updateColumn(index, { text: event.detail.value })}
						/>
					</div>
				{:else if column.type === 'frase'}
					<div class="richtext-field">
						<span>Frase</span>
						<RichTextEditor
							value={column.text || ''}
							on:change={(event) => updateColumn(index, { text: event.detail.value })}
						/>
					</div>
					<label>
						<span>Autor(a)</span>
						<input
							type="text"
							value={column.author || ''}
							on:input={(event) => updateColumn(index, { author: event.currentTarget.value })}
						/>
					</label>
				{:else if column.type === 'intertitle'}
					<label>
						<span>Intertitulo</span>
						<input
							type="text"
							value={column.title || ''}
							on:input={(event) => updateColumn(index, { title: event.currentTarget.value })}
						/>
					</label>
				{:else if column.type === 'card'}
					<div class="field-group two-columns">
						<label>
							<span>Layout</span>
							<select
								value={column.layout || 'media-left'}
								on:change={(event) => updateColumn(index, { layout: event.currentTarget.value })}
							>
								<option value="media-left">Midia esquerda</option>
								<option value="media-right">Midia direita</option>
								<option value="media-top">Midia acima</option>
								<option value="media-bottom">Midia abaixo</option>
							</select>
						</label>
						<label>
							<span>Tipo de midia</span>
							<select
								value={column.mediaType || 'image'}
								on:change={(event) => updateColumn(index, { mediaType: event.currentTarget.value })}
							>
								<option value="image">Imagem</option>
								<option value="video">Video</option>
								<option value="globoplayer">GloboPlay</option>
							</select>
						</label>
					</div>
					<div class="field-group">
						<label>
							<span>Alinhamento</span>
							<select
								value={column.align || 'start'}
								on:change={(event) => updateColumn(index, { align: event.currentTarget.value })}
							>
								{#each alignOptions as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
						</label>
					</div>
					<div class="richtext-field">
						<span>Texto</span>
						<RichTextEditor
							value={column.text || ''}
							on:change={(event) => updateColumn(index, { text: event.detail.value })}
						/>
					</div>
					<label>
						<span>Autor (opcional)</span>
						<input
							type="text"
							value={column.author || ''}
							on:input={(event) => updateColumn(index, { author: event.currentTarget.value })}
						/>
					</label>
					{#if (column.mediaType || 'image') === 'image'}
						<div class="field-group two-columns">
							<label>
								<span>Imagem desktop</span>
								<input
									type="url"
									placeholder="https://..."
									value={column.mediaImage.desktop || ''}
									on:input={(event) =>
										updateMediaImage(index, 'desktop', event.currentTarget.value)}
								/>
							</label>
							<label>
								<span>Imagem mobile</span>
								<input
									type="url"
									placeholder="https://..."
									value={column.mediaImage.mobile || ''}
									on:input={(event) => updateMediaImage(index, 'mobile', event.currentTarget.value)}
								/>
							</label>
						</div>
						<div class="field-group">
							<label>
								<span>Alt</span>
								<input
									type="text"
									value={column.mediaImage.alt || ''}
									on:input={(event) => updateMediaImage(index, 'alt', event.currentTarget.value)}
								/>
							</label>
						</div>
						<label>
							<span>Legenda</span>
							<textarea
								rows="2"
								value={column.mediaImage.caption || ''}
								on:input={(event) => updateMediaImage(index, 'caption', event.currentTarget.value)}
							></textarea>
						</label>
						<label>
							<span>Credito</span>
							<input
								type="text"
								value={column.mediaImage.credit || ''}
								on:input={(event) => updateMediaImage(index, 'credit', event.currentTarget.value)}
							/>
						</label>
					{:else if (column.mediaType || 'image') === 'video'}
						<div class="field-group two-columns">
							<label>
								<span>URL do video</span>
								<input
									type="url"
									value={column.mediaVideo.src || ''}
									on:input={(event) => updateMediaVideo(index, 'src', event.currentTarget.value)}
								/>
							</label>
							<label>
								<span>Poster</span>
								<input
									type="url"
									value={column.mediaVideo.poster || ''}
									on:input={(event) => updateMediaVideo(index, 'poster', event.currentTarget.value)}
								/>
							</label>
						</div>
						<label>
							<span>Embed HTML (opcional)</span>
							<textarea
								rows="3"
								value={column.mediaVideo.embedHtml || ''}
								on:input={(event) =>
									updateMediaVideo(index, 'embedHtml', event.currentTarget.value)}
							></textarea>
						</label>
						<div class="field-group four-columns">
							<label class="inline">
								<input
									type="checkbox"
									checked={column.mediaVideo.autoplay}
									on:change={(event) =>
										updateMediaVideo(index, 'autoplay', event.currentTarget.checked)}
								/>
								<span>Autoplay</span>
							</label>
							<label class="inline">
								<input
									type="checkbox"
									checked={column.mediaVideo.muted}
									on:change={(event) =>
										updateMediaVideo(index, 'muted', event.currentTarget.checked)}
								/>
								<span>Mutado</span>
							</label>
							<label class="inline">
								<input
									type="checkbox"
									checked={column.mediaVideo.controls}
									on:change={(event) =>
										updateMediaVideo(index, 'controls', event.currentTarget.checked)}
								/>
								<span>Controles</span>
							</label>
							<label class="inline">
								<input
									type="checkbox"
									checked={column.mediaVideo.loop}
									on:change={(event) =>
										updateMediaVideo(index, 'loop', event.currentTarget.checked)}
								/>
								<span>Loop</span>
							</label>
						</div>
						<label>
							<span>Legenda</span>
							<textarea
								rows="2"
								value={column.mediaVideo.caption || ''}
								on:input={(event) => updateMediaVideo(index, 'caption', event.currentTarget.value)}
							></textarea>
						</label>
						<label>
							<span>Credito</span>
							<input
								type="text"
								value={column.mediaVideo.credit || ''}
								on:input={(event) => updateMediaVideo(index, 'credit', event.currentTarget.value)}
							/>
						</label>
					{:else}
						<div class="field-group two-columns">
							<label>
								<span>Video ID desktop</span>
								<input
									type="text"
									value={column.mediaGlobo.videoIdDesktop || ''}
									on:input={(event) =>
										updateMediaGlobo(index, 'videoIdDesktop', event.currentTarget.value)}
								/>
							</label>
							<label>
								<span>Video ID mobile</span>
								<input
									type="text"
									value={column.mediaGlobo.videoIdMobile || ''}
									on:input={(event) =>
										updateMediaGlobo(index, 'videoIdMobile', event.currentTarget.value)}
								/>
							</label>
						</div>
						<label>
							<span>ID fallback</span>
							<input
								type="text"
								value={column.mediaGlobo.videoId || ''}
								on:input={(event) => updateMediaGlobo(index, 'videoId', event.currentTarget.value)}
							/>
						</label>
						<div class="field-group two-columns">
							<label>
								<span>Aspect ratio desktop</span>
								<input
									type="text"
									value={column.mediaGlobo.aspectRatio || '16 / 9'}
									on:input={(event) =>
										updateMediaGlobo(index, 'aspectRatio', event.currentTarget.value)}
								/>
							</label>
							<label>
								<span>Aspect ratio mobile</span>
								<input
									type="text"
									value={column.mediaGlobo.aspectRatioMobile || '9 / 16'}
									on:input={(event) =>
										updateMediaGlobo(index, 'aspectRatioMobile', event.currentTarget.value)}
								/>
							</label>
						</div>
						<div class="field-group two-columns">
							<label>
								<span>Largura desktop</span>
								<input
									type="text"
									value={column.mediaGlobo.widthDesktop || '100%'}
									on:input={(event) =>
										updateMediaGlobo(index, 'widthDesktop', event.currentTarget.value)}
								/>
							</label>
							<label>
								<span>Largura mobile</span>
								<input
									type="text"
									value={column.mediaGlobo.widthMobile || '100%'}
									on:input={(event) =>
										updateMediaGlobo(index, 'widthMobile', event.currentTarget.value)}
								/>
							</label>
						</div>
						<label>
							<span>Cor de fundo</span>
							<input
								type="text"
								value={column.mediaGlobo.backgroundColor || ''}
								on:input={(event) =>
									updateMediaGlobo(index, 'backgroundColor', event.currentTarget.value)}
							/>
						</label>
						<div class="field-group three-columns">
							<label class="inline">
								<input
									type="checkbox"
									checked={column.mediaGlobo.autoPlay}
									on:change={(event) =>
										updateMediaGlobo(index, 'autoPlay', event.currentTarget.checked)}
								/>
								<span>Autoplay</span>
							</label>
							<label class="inline">
								<input
									type="checkbox"
									checked={column.mediaGlobo.startMuted}
									on:change={(event) =>
										updateMediaGlobo(index, 'startMuted', event.currentTarget.checked)}
								/>
								<span>Comecar sem som</span>
							</label>
							<label class="inline">
								<input
									type="checkbox"
									checked={column.mediaGlobo.showCaption}
									on:change={(event) =>
										updateMediaGlobo(index, 'showCaption', event.currentTarget.checked)}
								/>
								<span>Mostrar legenda</span>
							</label>
						</div>
						<label>
							<span>Legenda</span>
							<textarea
								rows="2"
								value={column.mediaGlobo.caption || ''}
								on:input={(event) => updateMediaGlobo(index, 'caption', event.currentTarget.value)}
							></textarea>
						</label>
						<label>
							<span>Credito</span>
							<input
								type="text"
								value={column.mediaGlobo.credit || ''}
								on:input={(event) => updateMediaGlobo(index, 'credit', event.currentTarget.value)}
							/>
						</label>
					{/if}
				{:else if column.type === 'image'}
					<div class="field-group two-columns">
						<label>
							<span>Imagem desktop</span>
							<input
								type="url"
								placeholder="https://..."
								value={column.image.desktop || ''}
								on:input={(event) => updateImage(index, 'desktop', event.currentTarget.value)}
							/>
						</label>
						<label>
							<span>Imagem mobile</span>
							<input
								type="url"
								placeholder="https://..."
								value={column.image.mobile || ''}
								on:input={(event) => updateImage(index, 'mobile', event.currentTarget.value)}
							/>
						</label>
					</div>
					<div class="field-group">
						<label>
							<span>Texto alternativo</span>
							<input
								type="text"
								value={column.image.alt || ''}
								on:input={(event) => updateImage(index, 'alt', event.currentTarget.value)}
							/>
						</label>
					</div>
					<label>
						<span>Legenda</span>
						<textarea
							rows="2"
							value={column.image.caption || ''}
							on:input={(event) => updateImage(index, 'caption', event.currentTarget.value)}
						></textarea>
					</label>
					<label>
						<span>Credito</span>
						<input
							type="text"
							value={column.image.credit || ''}
							on:input={(event) => updateImage(index, 'credit', event.currentTarget.value)}
						/>
					</label>
				{:else if column.type === 'video'}
					<div class="field-group two-columns">
						<label>
							<span>URL do video</span>
							<input
								type="url"
								value={column.video.src || ''}
								placeholder="https://..."
								on:input={(event) => updateVideo(index, 'src', event.currentTarget.value)}
							/>
						</label>
						<label>
							<span>Poster</span>
							<input
								type="url"
								value={column.video.poster || ''}
								placeholder="https://..."
								on:input={(event) => updateVideo(index, 'poster', event.currentTarget.value)}
							/>
						</label>
					</div>
					<label>
						<span>Embed HTML (opcional)</span>
						<textarea
							rows="3"
							value={column.video.embedHtml || ''}
							on:input={(event) => updateVideo(index, 'embedHtml', event.currentTarget.value)}
						></textarea>
					</label>
					<div class="field-group four-columns">
						<label class="inline">
							<input
								type="checkbox"
								checked={column.video.autoplay}
								on:change={(event) => updateVideo(index, 'autoplay', event.currentTarget.checked)}
							/>
							<span>Autoplay</span>
						</label>
						<label class="inline">
							<input
								type="checkbox"
								checked={column.video.muted}
								on:change={(event) => updateVideo(index, 'muted', event.currentTarget.checked)}
							/>
							<span>Mutado</span>
						</label>
						<label class="inline">
							<input
								type="checkbox"
								checked={column.video.controls}
								on:change={(event) => updateVideo(index, 'controls', event.currentTarget.checked)}
							/>
							<span>Controles</span>
						</label>
						<label class="inline">
							<input
								type="checkbox"
								checked={column.video.loop}
								on:change={(event) => updateVideo(index, 'loop', event.currentTarget.checked)}
							/>
							<span>Loop</span>
						</label>
					</div>
					<label>
						<span>Legenda</span>
						<textarea
							rows="2"
							value={column.video.caption || ''}
							on:input={(event) => updateVideo(index, 'caption', event.currentTarget.value)}
						></textarea>
					</label>
					<label>
						<span>Credito</span>
						<input
							type="text"
							value={column.video.credit || ''}
							on:input={(event) => updateVideo(index, 'credit', event.currentTarget.value)}
						/>
					</label>
				{:else if column.type === 'globoplayer'}
					<div class="field-group two-columns">
						<label>
							<span>Video ID desktop</span>
							<input
								type="text"
								value={column.globo.videoIdDesktop || ''}
								on:input={(event) =>
									updateGlobo(index, 'videoIdDesktop', event.currentTarget.value)}
							/>
						</label>
						<label>
							<span>Video ID mobile</span>
							<input
								type="text"
								value={column.globo.videoIdMobile || ''}
								on:input={(event) => updateGlobo(index, 'videoIdMobile', event.currentTarget.value)}
							/>
						</label>
					</div>
					<label>
						<span>ID fallback (opcional)</span>
						<input
							type="text"
							value={column.globo.videoId || ''}
							on:input={(event) => updateGlobo(index, 'videoId', event.currentTarget.value)}
						/>
					</label>
					<div class="field-group two-columns">
						<label>
							<span>Aspect ratio desktop</span>
							<input
								type="text"
								value={column.globo.aspectRatio || '16 / 9'}
								on:input={(event) => updateGlobo(index, 'aspectRatio', event.currentTarget.value)}
							/>
						</label>
						<label>
							<span>Aspect ratio mobile</span>
							<input
								type="text"
								value={column.globo.aspectRatioMobile || '9 / 16'}
								on:input={(event) =>
									updateGlobo(index, 'aspectRatioMobile', event.currentTarget.value)}
							/>
						</label>
					</div>
					<div class="field-group two-columns">
						<label>
							<span>Largura desktop</span>
							<input
								type="text"
								value={column.globo.widthDesktop || '100%'}
								on:input={(event) => updateGlobo(index, 'widthDesktop', event.currentTarget.value)}
							/>
						</label>
						<label>
							<span>Largura mobile</span>
							<input
								type="text"
								value={column.globo.widthMobile || '100%'}
								on:input={(event) => updateGlobo(index, 'widthMobile', event.currentTarget.value)}
							/>
						</label>
					</div>
					<label>
						<span>Cor de fundo</span>
						<input
							type="text"
							value={column.globo.backgroundColor || ''}
							on:input={(event) => updateGlobo(index, 'backgroundColor', event.currentTarget.value)}
						/>
					</label>
					<div class="field-group three-columns">
						<label class="inline">
							<input
								type="checkbox"
								checked={column.globo.autoPlay}
								on:change={(event) => updateGlobo(index, 'autoPlay', event.currentTarget.checked)}
							/>
							<span>Autoplay</span>
						</label>
						<label class="inline">
							<input
								type="checkbox"
								checked={column.globo.startMuted}
								on:change={(event) => updateGlobo(index, 'startMuted', event.currentTarget.checked)}
							/>
							<span>Comecar sem som</span>
						</label>
						<label class="inline">
							<input
								type="checkbox"
								checked={column.globo.showCaption}
								on:change={(event) =>
									updateGlobo(index, 'showCaption', event.currentTarget.checked)}
							/>
							<span>Mostrar legenda</span>
						</label>
					</div>
					<label>
						<span>Legenda</span>
						<textarea
							rows="2"
							value={column.globo.caption || ''}
							on:input={(event) => updateGlobo(index, 'caption', event.currentTarget.value)}
						></textarea>
					</label>
					<label>
						<span>Credito</span>
						<input
							type="text"
							value={column.globo.credit || ''}
							on:input={(event) => updateGlobo(index, 'credit', event.currentTarget.value)}
						/>
					</label>
				{/if}

				<div class="blocks-editor">
					<header>
						<strong>Blocos adicionais</strong>
						<span>Monte sequencias dentro da coluna (opcional)</span>
					</header>
					{#if (column.blocks || []).length === 0}
						<p class="blocks-empty">Nenhum bloco adicionado.</p>
					{/if}
					{#each column.blocks || [] as block, blockIndex (block.__internalId)}
						{@const blockType = canonicalBlockType(block.type)}
						<article class="block-card">
							<header>
								<div class="block-title">
									<span>Bloco {blockIndex + 1}</span>
									<select
										value={blockType}
										on:change={(event) =>
											changeBlockType(index, blockIndex, event.currentTarget.value)}
									>
										{#each blockTypeOptions as option}
											<option value={option.value}>{option.label}</option>
										{/each}
									</select>
								</div>
								<div class="actions">
									<button
										type="button"
										on:click={() => moveBlock(index, blockIndex, -1)}
										disabled={blockIndex === 0}
										title="Mover para cima">↑</button
									>
									<button
										type="button"
										on:click={() => moveBlock(index, blockIndex, +1)}
										disabled={blockIndex === (column.blocks?.length || 0) - 1}
										title="Mover para baixo">↓</button
									>
									<button
										type="button"
										on:click={() => duplicateBlock(index, blockIndex)}
										title="Duplicar">⧉</button
									>
									<button
										type="button"
										class="danger"
										on:click={() => removeBlock(index, blockIndex)}
										title="Remover">✕</button
									>
								</div>
							</header>

							{#if blockType === 'text'}
								<RichTextEditor
									value={block.text || ''}
									on:change={(event) =>
										updateBlock(index, blockIndex, { text: event.detail.value })}
								/>
							{:else if blockType === 'intertitle'}
								<label>
									<span>Titulo</span>
									<input
										type="text"
										value={block.title || ''}
										on:input={(event) =>
											updateBlock(index, blockIndex, { title: event.currentTarget.value })}
									/>
								</label>
							{:else if blockType === 'quote'}
								<RichTextEditor
									value={block.text || ''}
									on:change={(event) =>
										updateBlock(index, blockIndex, { text: event.detail.value })}
								/>
								<label>
									<span>Autor</span>
									<input
										type="text"
										value={block.author || ''}
										on:input={(event) =>
											updateBlock(index, blockIndex, { author: event.currentTarget.value })}
									/>
								</label>
							{:else if blockType === 'image'}
								<div class="field-group two-columns">
									<label>
										<span>Imagem desktop</span>
										<input
											type="url"
											placeholder="https://..."
											value={block.image?.desktop || ''}
											on:input={(event) =>
												updateBlockImage(index, blockIndex, 'desktop', event.currentTarget.value)}
										/>
									</label>
									<label>
										<span>Imagem mobile</span>
										<input
											type="url"
											placeholder="https://..."
											value={block.image?.mobile || ''}
											on:input={(event) =>
												updateBlockImage(index, blockIndex, 'mobile', event.currentTarget.value)}
										/>
									</label>
								</div>
								<label>
									<span>Alt</span>
									<input
										type="text"
										value={block.image?.alt || ''}
										on:input={(event) =>
											updateBlockImage(index, blockIndex, 'alt', event.currentTarget.value)}
									/>
								</label>
								<label>
									<span>Legenda</span>
									<textarea
										rows="2"
										value={block.image?.caption || ''}
										on:input={(event) =>
											updateBlockImage(index, blockIndex, 'caption', event.currentTarget.value)}
									></textarea>
								</label>
								<label>
									<span>Credito</span>
									<input
										type="text"
										value={block.image?.credit || ''}
										on:input={(event) =>
											updateBlockImage(index, blockIndex, 'credit', event.currentTarget.value)}
									/>
								</label>
							{:else if blockType === 'video'}
								<div class="field-group two-columns">
									<label>
										<span>URL do video</span>
										<input
											type="url"
											value={block.video?.src || ''}
											on:input={(event) =>
												updateBlockVideo(index, blockIndex, 'src', event.currentTarget.value)}
										/>
									</label>
									<label>
										<span>Poster</span>
										<input
											type="url"
											value={block.video?.poster || ''}
											on:input={(event) =>
												updateBlockVideo(index, blockIndex, 'poster', event.currentTarget.value)}
										/>
									</label>
								</div>
								<label>
									<span>Embed HTML</span>
									<textarea
										rows="3"
										value={block.video?.embedHtml || ''}
										on:input={(event) =>
											updateBlockVideo(index, blockIndex, 'embedHtml', event.currentTarget.value)}
									></textarea>
								</label>
								<div class="field-group four-columns">
									<label class="inline">
										<input
											type="checkbox"
											checked={block.video?.autoplay}
											on:change={(event) =>
												updateBlockVideo(
													index,
													blockIndex,
													'autoplay',
													event.currentTarget.checked
												)}
										/>
										<span>Autoplay</span>
									</label>
									<label class="inline">
										<input
											type="checkbox"
											checked={block.video?.muted}
											on:change={(event) =>
												updateBlockVideo(index, blockIndex, 'muted', event.currentTarget.checked)}
										/>
										<span>Mutado</span>
									</label>
									<label class="inline">
										<input
											type="checkbox"
											checked={block.video?.controls ?? true}
											on:change={(event) =>
												updateBlockVideo(
													index,
													blockIndex,
													'controls',
													event.currentTarget.checked
												)}
										/>
										<span>Controles</span>
									</label>
									<label class="inline">
										<input
											type="checkbox"
											checked={block.video?.loop}
											on:change={(event) =>
												updateBlockVideo(index, blockIndex, 'loop', event.currentTarget.checked)}
										/>
										<span>Loop</span>
									</label>
								</div>
								<label>
									<span>Legenda</span>
									<textarea
										rows="2"
										value={block.video?.caption || ''}
										on:input={(event) =>
											updateBlockVideo(index, blockIndex, 'caption', event.currentTarget.value)}
									></textarea>
								</label>
								<label>
									<span>Credito</span>
									<input
										type="text"
										value={block.video?.credit || ''}
										on:input={(event) =>
											updateBlockVideo(index, blockIndex, 'credit', event.currentTarget.value)}
									/>
								</label>
							{:else if blockType === 'globoplayer'}
								<div class="field-group two-columns">
									<label>
										<span>Video ID desktop</span>
										<input
											type="text"
											value={block.globo?.videoIdDesktop || ''}
											on:input={(event) =>
												updateBlockGlobo(
													index,
													blockIndex,
													'videoIdDesktop',
													event.currentTarget.value
												)}
										/>
									</label>
									<label>
										<span>Video ID mobile</span>
										<input
											type="text"
											value={block.globo?.videoIdMobile || ''}
											on:input={(event) =>
												updateBlockGlobo(
													index,
													blockIndex,
													'videoIdMobile',
													event.currentTarget.value
												)}
										/>
									</label>
								</div>
								<label>
									<span>ID fallback</span>
									<input
										type="text"
										value={block.globo?.videoId || ''}
										on:input={(event) =>
											updateBlockGlobo(index, blockIndex, 'videoId', event.currentTarget.value)}
									/>
								</label>
								<label>
									<span>Legenda</span>
									<textarea
										rows="2"
										value={block.globo?.caption || ''}
										on:input={(event) =>
											updateBlockGlobo(index, blockIndex, 'caption', event.currentTarget.value)}
									></textarea>
								</label>
								<label>
									<span>Credito</span>
									<input
										type="text"
										value={block.globo?.credit || ''}
										on:input={(event) =>
											updateBlockGlobo(index, blockIndex, 'credit', event.currentTarget.value)}
									/>
								</label>
							{/if}
						</article>
					{/each}

					<div class="add-blocks">
						<span>Adicionar bloco:</span>
						{#each blockTypeOptions as option}
							<button type="button" on:click={() => addBlock(index, option.value)}
								>{option.label}</button
							>
						{/each}
					</div>
				</div>

				<label>
					<span>Callout (opcional)</span>
					<input
						type="text"
						value={column.callout || ''}
						on:input={(event) => updateColumn(index, { callout: event.currentTarget.value })}
					/>
				</label>
			</section>
		</article>
	{/each}

	<button type="button" class="add-button" on:click={() => addColumn('text')}>
		Adicionar coluna
	</button>
</div>

<style>
	.grid-items-editor {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.grid-column-card {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		padding: 1rem;
		border: 1px solid #d0d8e6;
		border-radius: 12px;
		background: #ffffff;
		box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	header .title {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		font-size: 0.9rem;
	}

	header .title select {
		border: 1px solid #cbd5f5;
		border-radius: 6px;
		padding: 0.2rem 0.5rem;
		font-size: 0.85rem;
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
		font-size: 0.85rem;
	}

	.actions button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.actions .danger {
		background: #fee2e2;
		color: #b91c1c;
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.blocks-editor {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.75rem;
		border: 1px dashed #cbd5f5;
		border-radius: 10px;
		background: #f8fafc;
	}

	.blocks-editor > header {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		font-size: 0.8rem;
		color: #1e293b;
	}

	.blocks-empty {
		font-size: 0.75rem;
		color: #64748b;
		font-style: italic;
	}

	.block-card {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		padding: 0.75rem;
		border: 1px solid #d0d8e6;
		border-radius: 10px;
		background: #ffffff;
	}

	.block-card header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
	}

	.block-card .block-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem;
		color: #1f2937;
	}

	.block-card select {
		border: 1px solid #cbd5f5;
		border-radius: 6px;
		padding: 0.2rem 0.4rem;
		font-size: 0.75rem;
	}

	.add-blocks {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		align-items: center;
		font-size: 0.75rem;
		color: #1f2937;
	}

	.add-blocks button {
		border: none;
		background: #e0e7ff;
		color: #1e3a8a;
		border-radius: 999px;
		padding: 0.35rem 0.8rem;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.add-blocks button:hover {
		background: #c7d2fe;
	}

	.field-group {
		display: grid;
		gap: 0.6rem;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	}

	.field-group.two-columns {
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	}

	.field-group.three-columns {
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	}

	.field-group.four-columns {
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.8rem;
		color: #1e293b;
	}

	label.inline {
		flex-direction: row;
		align-items: center;
		gap: 0.4rem;
	}

	input,
	select,
	textarea {
		border: 1px solid #cbd5f5;
		border-radius: 8px;
		padding: 0.45rem 0.55rem;
		font-size: 0.85rem;
		font-family: inherit;
	}

	textarea {
		min-height: 70px;
	}

	.richtext-field {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.add-button {
		align-self: flex-start;
		border: none;
		background: #1d4ed8;
		color: #fff;
		border-radius: 999px;
		padding: 0.45rem 1.2rem;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.add-button:hover {
		background: #1e40af;
	}
</style>
