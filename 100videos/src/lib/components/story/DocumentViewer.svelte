<!-- src/lib/components/story/DocumentViewer.svelte -->
<script>
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';

	// Props do componente
	export let documents = [];
	export let showWatermark = true;
	export let highlightAreas = [];
	export let allowDownload = false;
	export let classification = 'CONFIDENCIAL'; // 'PÚBLICO', 'RESERVADO', 'CONFIDENCIAL', 'SECRETO'
	export let theme = 'investigative'; // 'investigative', 'legal', 'journalistic'
	export let autoAdvance = false;
	export let showThumbnails = true;

	// Estado interno
	let currentDocIndex = 0;
	let zoomLevel = 1;
	let panX = 0;
	let panY = 0;
	let isDragging = false;
	let isFullscreen = false;
	let showAnnotations = true;
	let dragStart = { x: 0, y: 0 };
	let containerElement;
	let imageElement;

	// Configurações por tema
	const themes = {
		investigative: {
			bg: '#0f0f0f',
			accent: '#dc2626',
			text: '#ffffff',
			overlay: 'rgba(220, 38, 38, 0.8)',
			watermark: '#dc2626'
		},
		legal: {
			bg: '#1e1e1e',
			accent: '#059669',
			text: '#f9fafb',
			overlay: 'rgba(5, 150, 105, 0.8)',
			watermark: '#059669'
		},
		journalistic: {
			bg: '#111827',
			accent: '#f59e0b',
			text: '#f9fafb',
			overlay: 'rgba(245, 158, 11, 0.8)',
			watermark: '#f59e0b'
		}
	};

	// Classificações de segurança
	const classifications = {
		PÚBLICO: { color: '#10b981', icon: '🔓' },
		RESERVADO: { color: '#f59e0b', icon: '⚠️' },
		CONFIDENCIAL: { color: '#dc2626', icon: '🔒' },
		SECRETO: { color: '#7c2d12', icon: '🚫' }
	};

	$: currentTheme = themes[theme] || themes.investigative;
	$: currentDoc = documents[currentDocIndex] || {};
	$: currentClassification = classifications[classification] || classifications['CONFIDENCIAL'];
	$: currentHighlights = highlightAreas.filter((area) => area.documentIndex === currentDocIndex);

	// Funções de navegação
	function nextDocument() {
		if (currentDocIndex < documents.length - 1) {
			currentDocIndex++;
			resetView();
		}
	}

	function prevDocument() {
		if (currentDocIndex > 0) {
			currentDocIndex--;
			resetView();
		}
	}

	function goToDocument(index) {
		if (index >= 0 && index < documents.length) {
			currentDocIndex = index;
			resetView();
		}
	}

	// Funções de zoom e pan
	function zoomIn() {
		zoomLevel = Math.min(zoomLevel * 1.5, 5);
	}

	function zoomOut() {
		zoomLevel = Math.max(zoomLevel / 1.5, 0.5);
	}

	function resetView() {
		zoomLevel = 1;
		panX = 0;
		panY = 0;
	}

	function handleWheel(event) {
		event.preventDefault();
		const delta = event.deltaY;
		if (delta < 0) {
			zoomIn();
		} else {
			zoomOut();
		}
	}

	// Funções de arrastar
	function startDrag(event) {
		if (zoomLevel > 1) {
			isDragging = true;
			dragStart = {
				x: event.clientX - panX,
				y: event.clientY - panY
			};
		}
	}

	function handleDrag(event) {
		if (isDragging && zoomLevel > 1) {
			panX = event.clientX - dragStart.x;
			panY = event.clientY - dragStart.y;
		}
	}

	function stopDrag() {
		isDragging = false;
	}

	// Função para alternar tela cheia
	function toggleFullscreen() {
		if (!isFullscreen) {
			containerElement.requestFullscreen?.();
		} else {
			document.exitFullscreen?.();
		}
	}

	function handleFullscreenChange() {
		isFullscreen = document.fullscreenElement === containerElement;
	}

	// Função para download
	function downloadDocument() {
		if (allowDownload && currentDoc.downloadUrl) {
			const link = document.createElement('a');
			link.href = currentDoc.downloadUrl;
			link.download = currentDoc.filename || `documento_${currentDocIndex + 1}.pdf`;
			link.click();
		}
	}

	// Formatação de data
	function formatDate(dateString) {
		if (!dateString) return 'Data não informada';
		return new Date(dateString).toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: 'long',
			year: 'numeric'
		});
	}

	// Lifecycle
	onMount(() => {
		document.addEventListener('fullscreenchange', handleFullscreenChange);
	});

	onDestroy(() => {
		document.removeEventListener('fullscreenchange', handleFullscreenChange);
	});
</script>

<div
	class="document-viewer"
	class:fullscreen={isFullscreen}
	style="--bg: {currentTheme.bg}; --accent: {currentTheme.accent}; --text: {currentTheme.text}; --overlay: {currentTheme.overlay}; --watermark: {currentTheme.watermark}"
	bind:this={containerElement}
>
	<!-- Header com controles -->
	<div class="viewer-header">
		<div class="doc-info">
			<div class="classification-badge" style="background: {currentClassification.color}">
				<span class="classification-icon">{currentClassification.icon}</span>
				<span class="classification-text">{classification}</span>
			</div>

			<div class="doc-meta">
				<h3 class="doc-title">{currentDoc.title || 'Documento sem título'}</h3>
				<div class="doc-details">
					<span class="doc-date">{formatDate(currentDoc.date)}</span>
					{#if currentDoc.source}
						<span class="doc-source">• {currentDoc.source}</span>
					{/if}
				</div>
			</div>
		</div>

		<div class="viewer-controls">
			<!-- Controles de navegação -->
			<div class="nav-controls">
				<button
					class="control-btn"
					on:click={prevDocument}
					disabled={currentDocIndex === 0}
					title="Documento anterior"
				>
					⬅️
				</button>

				<span class="doc-counter">
					{currentDocIndex + 1} / {documents.length}
				</span>

				<button
					class="control-btn"
					on:click={nextDocument}
					disabled={currentDocIndex === documents.length - 1}
					title="Próximo documento"
				>
					➡️
				</button>
			</div>

			<!-- Controles de zoom -->
			<div class="zoom-controls">
				<button class="control-btn" on:click={zoomOut} title="Diminuir zoom">🔍➖</button>
				<span class="zoom-level">{Math.round(zoomLevel * 100)}%</span>
				<button class="control-btn" on:click={zoomIn} title="Aumentar zoom">🔍➕</button>
				<button class="control-btn" on:click={resetView} title="Resetar visualização">🎯</button>
			</div>

			<!-- Controles adicionais -->
			<div class="extra-controls">
				<button
					class="control-btn"
					on:click={() => (showAnnotations = !showAnnotations)}
					class:active={showAnnotations}
					title="Mostrar/ocultar anotações"
				>
					📝
				</button>

				<button class="control-btn" on:click={toggleFullscreen} title="Tela cheia"> 🔳 </button>

				{#if allowDownload}
					<button
						class="control-btn download-btn"
						on:click={downloadDocument}
						title="Baixar documento"
					>
						💾
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Thumbnails (se habilitado) -->
	{#if showThumbnails && documents.length > 1}
		<div class="thumbnails-strip">
			{#each documents as doc, index}
				<div
					class="thumbnail"
					class:active={index === currentDocIndex}
					on:click={() => goToDocument(index)}
					role="button"
					tabindex="0"
					title={doc.title}
				>
					<img src={doc.thumbnail || doc.image} alt={doc.title} loading="lazy" />
					<div class="thumbnail-label">{index + 1}</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Área principal do documento -->
	<div class="document-area">
		{#if currentDoc.image}
			<div
				class="document-container"
				on:wheel={handleWheel}
				on:mousedown={startDrag}
				on:mousemove={handleDrag}
				on:mouseup={stopDrag}
				on:mouseleave={stopDrag}
				style="cursor: {zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'}"
			>
				<div
					class="document-wrapper"
					style="transform: scale({zoomLevel}) translate({panX}px, {panY}px)"
				>
					<img
						bind:this={imageElement}
						src={currentDoc.image}
						alt={currentDoc.title}
						class="document-image"
						loading="lazy"
					/>

					<!-- Watermark -->
					{#if showWatermark}
						<div class="watermark">
							<div class="watermark-text">
								{classification} • NÃO DIVULGAR
							</div>
						</div>
					{/if}

					<!-- Áreas destacadas -->
					{#if showAnnotations}
						{#each currentHighlights as highlight, index}
							<div
								class="highlight-area"
								style="left: {highlight.x}%; top: {highlight.y}%; width: {highlight.width}%; height: {highlight.height}%"
								in:scale={{ duration: 300, delay: index * 100 }}
							>
								<div class="highlight-overlay"></div>
								{#if highlight.label}
									<div class="highlight-label">
										<span class="highlight-number">{index + 1}</span>
										<span class="highlight-text">{highlight.label}</span>
									</div>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			</div>
		{:else}
			<div class="no-document">
				<div class="no-doc-icon">📄</div>
				<p>Documento não disponível</p>
			</div>
		{/if}
	</div>

	<!-- Painel de informações do documento -->
	<div class="document-info-panel">
		{#if currentDoc.description}
			<div class="doc-description">
				<h4>Descrição</h4>
				<p>{@html currentDoc.description}</p>
			</div>
		{/if}

		{#if currentDoc.relevance}
			<div class="doc-relevance">
				<h4>Relevância</h4>
				<p>{@html currentDoc.relevance}</p>
			</div>
		{/if}

		{#if currentDoc.tags && currentDoc.tags.length > 0}
			<div class="doc-tags">
				<h4>Tags</h4>
				<div class="tags-list">
					{#each currentDoc.tags as tag}
						<span class="tag">{tag}</span>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Legenda de anotações -->
	{#if showAnnotations && currentHighlights.length > 0}
		<div class="annotations-legend" in:fly={{ y: 50, duration: 300 }}>
			<h4>Pontos de Destaque</h4>
			<ul class="legend-list">
				{#each currentHighlights as highlight, index}
					<li class="legend-item">
						<span class="legend-number">{index + 1}</span>
						<span class="legend-text">{highlight.label}</span>
						{#if highlight.description}
							<p class="legend-description">{highlight.description}</p>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<!-- Atalhos de teclado -->
<svelte:window
	on:keydown={(e) => {
		if (e.key === 'ArrowLeft') prevDocument();
		if (e.key === 'ArrowRight') nextDocument();
		if (e.key === '+' || e.key === '=') {
			e.preventDefault();
			zoomIn();
		}
		if (e.key === '-') {
			e.preventDefault();
			zoomOut();
		}
		if (e.key === '0') {
			e.preventDefault();
			resetView();
		}
		if (e.key === 'f' || e.key === 'F11') {
			e.preventDefault();
			toggleFullscreen();
		}
		if (e.key === 'a') {
			e.preventDefault();
			showAnnotations = !showAnnotations;
		}
	}}
/>

<style>
	.document-viewer {
		width: 100%;
		height: 100vh;
		background: var(--bg);
		color: var(--text);
		display: flex;
		flex-direction: column;
		position: relative;
		overflow: hidden;
		font-family:
			'Inter',
			-apple-system,
			BlinkMacSystemFont,
			sans-serif;
	}

	.fullscreen {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 9999;
	}

	/* Header */
	.viewer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		flex-shrink: 0;
	}

	.doc-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.classification-badge {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 2rem;
		font-weight: 600;
		font-size: 0.9rem;
		color: white;
	}

	.doc-meta {
		max-width: 400px;
	}

	.doc-title {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 600;
		line-height: 1.3;
	}

	.doc-details {
		margin-top: 0.25rem;
		font-size: 0.9rem;
		opacity: 0.8;
	}

	.viewer-controls {
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	.nav-controls,
	.zoom-controls,
	.extra-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.control-btn {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: var(--text);
		padding: 0.5rem;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 0.9rem;
		min-width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.control-btn:hover:not(:disabled) {
		background: var(--accent);
		transform: scale(1.05);
	}

	.control-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.control-btn.active {
		background: var(--accent);
	}

	.download-btn {
		background: var(--accent);
	}

	.doc-counter,
	.zoom-level {
		font-size: 0.9rem;
		font-weight: 500;
		padding: 0 0.5rem;
	}

	/* Thumbnails */
	.thumbnails-strip {
		display: flex;
		gap: 0.5rem;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.5);
		overflow-x: auto;
		flex-shrink: 0;
	}

	.thumbnail {
		position: relative;
		width: 80px;
		height: 100px;
		border-radius: 0.5rem;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.3s ease;
		border: 2px solid transparent;
		flex-shrink: 0;
	}

	.thumbnail:hover {
		transform: scale(1.05);
	}

	.thumbnail.active {
		border-color: var(--accent);
		box-shadow: 0 0 10px var(--accent);
	}

	.thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.thumbnail-label {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: rgba(0, 0, 0, 0.8);
		color: white;
		text-align: center;
		font-size: 0.8rem;
		padding: 0.25rem;
	}

	/* Área do documento */
	.document-area {
		flex: 1;
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.document-container {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	.document-wrapper {
		position: relative;
		transition: transform 0.3s ease;
	}

	.document-image {
		max-width: 90%;
		max-height: 90%;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
		border-radius: 0.5rem;
		user-select: none;
	}

	.watermark {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1;
	}

	.watermark-text {
		transform: rotate(-45deg);
		font-size: 3rem;
		font-weight: bold;
		color: var(--watermark);
		opacity: 0.1;
		white-space: nowrap;
	}

	/* Highlights */
	.highlight-area {
		position: absolute;
		border: 2px solid var(--accent);
		background: var(--overlay);
		border-radius: 0.25rem;
		cursor: pointer;
		z-index: 2;
	}

	.highlight-overlay {
		position: absolute;
		inset: 0;
		background: var(--accent);
		opacity: 0.2;
		border-radius: 0.25rem;
	}

	.highlight-label {
		position: absolute;
		top: -2rem;
		left: 0;
		background: var(--accent);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.8rem;
		white-space: nowrap;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
	}

	.highlight-number {
		font-weight: bold;
		margin-right: 0.5rem;
	}

	/* Painel de informações */
	.document-info-panel {
		padding: 1rem;
		background: rgba(0, 0, 0, 0.8);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		max-height: 200px;
		overflow-y: auto;
		flex-shrink: 0;
	}

	.doc-description,
	.doc-relevance,
	.doc-tags {
		margin-bottom: 1rem;
	}

	.document-info-panel h4 {
		margin: 0 0 0.5rem 0;
		color: var(--accent);
		font-size: 0.9rem;
		font-weight: 600;
	}

	.document-info-panel p {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.4;
	}

	.tags-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag {
		background: var(--accent);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.8rem;
	}

	/* Legenda de anotações */
	.annotations-legend {
		position: absolute;
		right: 1rem;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(0, 0, 0, 0.9);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		padding: 1rem;
		max-width: 300px;
		max-height: 60vh;
		overflow-y: auto;
	}

	.annotations-legend h4 {
		margin: 0 0 1rem 0;
		color: var(--accent);
		font-size: 1rem;
	}

	.legend-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.legend-item {
		margin-bottom: 1rem;
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.legend-number {
		background: var(--accent);
		color: white;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8rem;
		font-weight: bold;
		flex-shrink: 0;
	}

	.legend-text {
		font-weight: 500;
	}

	.legend-description {
		margin: 0.25rem 0 0 0;
		font-size: 0.8rem;
		opacity: 0.8;
		line-height: 1.3;
	}

	.no-document {
		text-align: center;
		opacity: 0.5;
	}

	.no-doc-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	/* Responsivo */
	@media (max-width: 768px) {
		.viewer-header {
			flex-direction: column;
			gap: 1rem;
			padding: 0.5rem;
		}

		.viewer-controls {
			justify-content: center;
			flex-wrap: wrap;
			gap: 1rem;
		}

		.doc-meta {
			max-width: none;
			text-align: center;
		}

		.thumbnails-strip {
			justify-content: center;
		}

		.annotations-legend {
			position: fixed;
			bottom: 1rem;
			right: 1rem;
			left: 1rem;
			top: auto;
			transform: none;
			max-height: 40vh;
		}

		.watermark-text {
			font-size: 2rem;
		}
	}
</style>
