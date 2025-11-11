<!-- src/lib/components/builder/editors/SuperFlexEditor.svelte -->
<script>
	import { createEventDispatcher } from 'svelte';
	import DeviceToggle from '$lib/components/builder/controls/DeviceToggle.svelte';
	import ColorPicker from '$lib/components/builder/controls/ColorPicker.svelte';

	const dispatch = createEventDispatcher();

	export let data = {
		container: {
			height: { desktop: '100vh', mobile: '80vh' },
			backgroundColor: '#000000',
			backgroundImage: { desktop: '', mobile: '' },
			backgroundVideo: { desktop: '', mobile: '' },
			padding: { desktop: '2rem', mobile: '1rem' },
			display: 'flex',
			flexDirection: { desktop: 'row', mobile: 'column' },
			alignItems: { desktop: 'center', mobile: 'center' },
			justifyContent: { desktop: 'center', mobile: 'center' }
		},
		items: []
	};

	let activeTab = 'container';
	let selectedElement = null;
	let deviceMode = 'desktop';

	// Tipos de elementos disponíveis
	const elementTypes = [
		{ id: 'text', name: 'Texto', icon: '📝' },
		{ id: 'title', name: 'Título', icon: '📰' },
		{ id: 'subtitle', name: 'Subtítulo', icon: '🏷️' },
		{ id: 'intertitle', name: 'Intertítulo', icon: '📑' },
		{ id: 'image', name: 'Imagem', icon: '🖼️' },
		{ id: 'video', name: 'Vídeo', icon: '🎥' },
		{ id: 'flourish', name: 'Flourish', icon: '📊' },
		{ id: 'scrolly', name: 'Scrolly', icon: '📜' }
	];

	// Presets de layout
	const layoutPresets = [
		{
			id: 'hero-split',
			name: 'Hero Split',
			flexDirection: { desktop: 'row', mobile: 'column' },
			justifyContent: { desktop: 'space-between', mobile: 'center' }
		},
		{
			id: 'center-stack',
			name: 'Centro Empilhado',
			flexDirection: { desktop: 'column', mobile: 'column' },
			justifyContent: { desktop: 'center', mobile: 'center' }
		},
		{
			id: 'side-by-side',
			name: 'Lado a Lado',
			flexDirection: { desktop: 'row', mobile: 'column' },
			justifyContent: { desktop: 'center', mobile: 'center' }
		}
	];

	function updateParent() {
		dispatch('update');
	}

	function addElement(type) {
		const newElement = {
			id: Date.now(),
			type: type,
			content: getDefaultContent(type),
			position: { desktop: 'relative', mobile: 'relative' },
			styles: getDefaultStyles(type)
		};

		data.items = [...data.items, newElement];
		selectedElement = newElement.id;
		activeTab = 'elements';
		updateParent();
	}

	function removeElement(id) {
		data.items = data.items.filter((item) => item.id !== id);
		if (selectedElement === id) selectedElement = null;
		updateParent();
	}

	function getDefaultContent(type) {
		switch (type) {
			case 'title':
				return '<h1>Título Principal</h1>';
			case 'subtitle':
				return '<h2>Subtítulo</h2>';
			case 'intertitle':
				return '<h3>Intertítulo</h3>';
			case 'text':
				return '<p>Texto do parágrafo...</p>';
			case 'image':
				return {
					desktop: 'https://via.placeholder.com/400x300',
					mobile: 'https://via.placeholder.com/300x200'
				};
			case 'video':
				return { src: '', poster: '' };
			case 'flourish':
				return { embedId: '', height: '400px' };
			case 'scrolly':
				return { steps: [], height: '400vh' };
			default:
				return '<p>Novo elemento</p>';
		}
	}

	function getDefaultStyles(type) {
		const baseStyles = {
			margin: { desktop: '1rem', mobile: '0.5rem' },
			padding: { desktop: '1rem', mobile: '0.5rem' },
			color: '#ffffff',
			textAlign: { desktop: 'left', mobile: 'left' },
			zIndex: '1'
		};

		switch (type) {
			case 'title':
				return {
					...baseStyles,
					fontSize: { desktop: '3rem', mobile: '2rem' },
					fontWeight: { desktop: '700', mobile: '700' }
				};
			case 'subtitle':
				return {
					...baseStyles,
					fontSize: { desktop: '1.5rem', mobile: '1.2rem' },
					fontWeight: { desktop: '400', mobile: '400' }
				};
			case 'intertitle':
				return {
					...baseStyles,
					fontSize: { desktop: '2rem', mobile: '1.5rem' },
					fontWeight: { desktop: '600', mobile: '600' }
				};
			case 'image':
				return {
					...baseStyles,
					width: { desktop: '400px', mobile: '300px' },
					height: { desktop: 'auto', mobile: 'auto' },
					borderRadius: { desktop: '8px', mobile: '8px' }
				};
			default:
				return {
					...baseStyles,
					fontSize: { desktop: '1rem', mobile: '1rem' }
				};
		}
	}

	function applyLayoutPreset(preset) {
		data.container.flexDirection = preset.flexDirection;
		data.container.justifyContent = preset.justifyContent;
		updateParent();
	}

	function handleDeviceChange(event) {
		deviceMode = event.detail.value;
	}

	function handleColorChange(event) {
		data.container.backgroundColor = event.detail.value;
		updateParent();
	}

	// Encontrar elemento selecionado
	$: selectedElementData = data.items?.find((item) => item.id === selectedElement);
</script>

<div class="superflex-editor">
	<!-- Device Toggle Global -->
	<div class="editor-header">
		<DeviceToggle bind:value={deviceMode} on:change={handleDeviceChange} />
	</div>

	<!-- Main Tabs -->
	<div class="tabs">
		<button
			class="tab"
			class:active={activeTab === 'container'}
			on:click={() => (activeTab = 'container')}
		>
			📦 Container
		</button>
		<button
			class="tab"
			class:active={activeTab === 'elements'}
			on:click={() => (activeTab = 'elements')}
		>
			🧩 Elementos ({data.items?.length || 0})
		</button>
	</div>

	<div class="tab-content">
		{#if activeTab === 'container'}
			<!-- CONTAINER SETTINGS -->
			<div class="container-settings">
				<!-- Layout Presets -->
				<div class="section">
					<h3>🎨 Presets de Layout</h3>
					<div class="preset-buttons">
						{#each layoutPresets as preset}
							<button class="preset-btn" on:click={() => applyLayoutPreset(preset)}>
								{preset.name}
							</button>
						{/each}
					</div>
				</div>

				<!-- Background -->
				<div class="section">
					<ColorPicker
						bind:value={data.container.backgroundColor}
						label="Cor de Fundo"
						on:change={handleColorChange}
					/>

					<div class="field">
						<label>Imagem de Fundo ({deviceMode}):</label>
						<input
							type="url"
							bind:value={data.container.backgroundImage[deviceMode]}
							on:input={updateParent}
							placeholder="https://exemplo.com/imagem.jpg"
						/>
					</div>

					<div class="field">
						<label>Vídeo de Fundo ({deviceMode}):</label>
						<input
							type="url"
							bind:value={data.container.backgroundVideo[deviceMode]}
							on:input={updateParent}
							placeholder="https://exemplo.com/video.mp4"
						/>
					</div>
				</div>

				<!-- Dimensions -->
				<div class="section">
					<h3>📏 Dimensões</h3>

					<div class="field">
						<label>Altura ({deviceMode}):</label>
						<select bind:value={data.container.height[deviceMode]} on:change={updateParent}>
							<option value="100vh">Tela cheia (100vh)</option>
							<option value="80vh">80% da tela (80vh)</option>
							<option value="60vh">60% da tela (60vh)</option>
							<option value="500px">500px</option>
							<option value="300px">300px</option>
							<option value="auto">Automático</option>
						</select>
					</div>

					<div class="field">
						<label>Padding ({deviceMode}):</label>
						<select bind:value={data.container.padding[deviceMode]} on:change={updateParent}>
							<option value="0">Sem padding</option>
							<option value="1rem">Pequeno (1rem)</option>
							<option value="2rem">Médio (2rem)</option>
							<option value="3rem">Grande (3rem)</option>
							<option value="4rem">Extra grande (4rem)</option>
						</select>
					</div>
				</div>

				<!-- Layout -->
				<div class="section">
					<h3>📐 Layout</h3>

					<div class="field">
						<label>Direção ({deviceMode}):</label>
						<div class="button-group">
							<button
								class="layout-btn"
								class:active={data.container.flexDirection[deviceMode] === 'row'}
								on:click={() => {
									data.container.flexDirection[deviceMode] = 'row';
									updateParent();
								}}
							>
								➡️ Horizontal
							</button>
							<button
								class="layout-btn"
								class:active={data.container.flexDirection[deviceMode] === 'column'}
								on:click={() => {
									data.container.flexDirection[deviceMode] = 'column';
									updateParent();
								}}
							>
								⬇️ Vertical
							</button>
						</div>
					</div>

					<div class="field">
						<label>Alinhamento ({deviceMode}):</label>
						<select bind:value={data.container.alignItems[deviceMode]} on:change={updateParent}>
							<option value="flex-start">Início</option>
							<option value="center">Centro</option>
							<option value="flex-end">Fim</option>
							<option value="stretch">Esticar</option>
						</select>
					</div>

					<div class="field">
						<label>Justificação ({deviceMode}):</label>
						<select bind:value={data.container.justifyContent[deviceMode]} on:change={updateParent}>
							<option value="flex-start">Início</option>
							<option value="center">Centro</option>
							<option value="flex-end">Fim</option>
							<option value="space-between">Espaçado</option>
							<option value="space-around">Em volta</option>
						</select>
					</div>
				</div>
			</div>
		{:else if activeTab === 'elements'}
			<!-- ELEMENTS SETTINGS -->
			<div class="elements-settings">
				<!-- Add Element -->
				<div class="section">
					<h3>➕ Adicionar Elemento</h3>
					<div class="element-types">
						{#each elementTypes as type}
							<button class="add-element-btn" on:click={() => addElement(type.id)}>
								<span class="element-icon">{type.icon}</span>
								<span class="element-name">{type.name}</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- Elements List -->
				<div class="section">
					<h3>📋 Elementos</h3>
					<div class="elements-list">
						{#each data.items || [] as element}
							<div class="element-item" class:selected={selectedElement === element.id}>
								<div
									class="element-header"
									on:click={() =>
										(selectedElement = selectedElement === element.id ? null : element.id)}
								>
									<span class="element-info">
										{elementTypes.find((t) => t.id === element.type)?.icon || '📦'}
										{elementTypes.find((t) => t.id === element.type)?.name || element.type}
									</span>
									<div class="element-actions">
										<button
											class="remove-btn"
											on:click|stopPropagation={() => removeElement(element.id)}
										>
											❌
										</button>
									</div>
								</div>

								{#if selectedElement === element.id}
									<div class="element-editor">
										<!-- Content Editor -->
										<div class="subsection">
											<h4>📝 Conteúdo</h4>

											{#if element.type === 'text' || element.type === 'title' || element.type === 'subtitle' || element.type === 'intertitle'}
												<textarea
													bind:value={element.content}
													on:input={updateParent}
													rows="3"
													placeholder="Conteúdo HTML..."
												></textarea>
											{:else if element.type === 'image'}
												<div class="field">
													<label>Imagem Desktop:</label>
													<input
														type="url"
														bind:value={element.content.desktop}
														on:input={updateParent}
														placeholder="https://exemplo.com/imagem-desktop.jpg"
													/>
												</div>
												<div class="field">
													<label>Imagem Mobile:</label>
													<input
														type="url"
														bind:value={element.content.mobile}
														on:input={updateParent}
														placeholder="https://exemplo.com/imagem-mobile.jpg"
													/>
												</div>
											{:else if element.type === 'video'}
												<div class="field">
													<label>URL do Vídeo:</label>
													<input
														type="url"
														bind:value={element.content.src}
														on:input={updateParent}
														placeholder="https://exemplo.com/video.mp4"
													/>
												</div>
												<div class="field">
													<label>Poster (opcional):</label>
													<input
														type="url"
														bind:value={element.content.poster}
														on:input={updateParent}
														placeholder="https://exemplo.com/poster.jpg"
													/>
												</div>
											{:else if element.type === 'flourish'}
												<div class="field">
													<label>Flourish Embed ID:</label>
													<input
														type="text"
														bind:value={element.content.embedId}
														on:input={updateParent}
														placeholder="12345678"
													/>
												</div>
											{/if}
										</div>

										<!-- Style Editor -->
										<div class="subsection">
											<h4>🎨 Estilo ({deviceMode})</h4>

											{#if element.type !== 'image'}
												<!-- Text Styles -->
												<ColorPicker
													bind:value={element.styles.color}
													label="Cor do Texto"
													on:change={updateParent}
												/>

												<div class="field">
													<label>Tamanho da Fonte ({deviceMode}):</label>
													<select
														bind:value={element.styles.fontSize[deviceMode]}
														on:change={updateParent}
													>
														<option value="0.875rem">Pequeno (0.875rem)</option>
														<option value="1rem">Normal (1rem)</option>
														<option value="1.25rem">Médio (1.25rem)</option>
														<option value="1.5rem">Grande (1.5rem)</option>
														<option value="2rem">Extra Grande (2rem)</option>
														<option value="3rem">Título (3rem)</option>
														<option value="4rem">Mega (4rem)</option>
													</select>
												</div>

												<div class="field">
													<label>Peso da Fonte ({deviceMode}):</label>
													<select
														bind:value={element.styles.fontWeight[deviceMode]}
														on:change={updateParent}
													>
														<option value="300">Light (300)</option>
														<option value="400">Normal (400)</option>
														<option value="500">Medium (500)</option>
														<option value="600">Semibold (600)</option>
														<option value="700">Bold (700)</option>
														<option value="800">Extra Bold (800)</option>
													</select>
												</div>

												<div class="field">
													<label>Alinhamento de Texto ({deviceMode}):</label>
													<div class="button-group">
														<button
															class="align-btn"
															class:active={element.styles.textAlign[deviceMode] === 'left'}
															on:click={() => {
																element.styles.textAlign[deviceMode] = 'left';
																updateParent();
															}}
														>
															⬅️
														</button>
														<button
															class="align-btn"
															class:active={element.styles.textAlign[deviceMode] === 'center'}
															on:click={() => {
																element.styles.textAlign[deviceMode] = 'center';
																updateParent();
															}}
														>
															↔️
														</button>
														<button
															class="align-btn"
															class:active={element.styles.textAlign[deviceMode] === 'right'}
															on:click={() => {
																element.styles.textAlign[deviceMode] = 'right';
																updateParent();
															}}
														>
															➡️
														</button>
													</div>
												</div>
											{/if}

											<!-- Spacing -->
											<div class="field">
												<label>Margem ({deviceMode}):</label>
												<select
													bind:value={element.styles.margin[deviceMode]}
													on:change={updateParent}
												>
													<option value="0">Sem margem</option>
													<option value="0.5rem">Pequena (0.5rem)</option>
													<option value="1rem">Média (1rem)</option>
													<option value="2rem">Grande (2rem)</option>
													<option value="3rem">Extra grande (3rem)</option>
												</select>
											</div>

											<div class="field">
												<label>Padding ({deviceMode}):</label>
												<select
													bind:value={element.styles.padding[deviceMode]}
													on:change={updateParent}
												>
													<option value="0">Sem padding</option>
													<option value="0.5rem">Pequeno (0.5rem)</option>
													<option value="1rem">Médio (1rem)</option>
													<option value="2rem">Grande (2rem)</option>
													<option value="3rem">Extra grande (3rem)</option>
												</select>
											</div>

											<!-- Position -->
											<div class="field">
												<label>Posição ({deviceMode}):</label>
												<div class="button-group">
													<button
														class="position-btn"
														class:active={element.position[deviceMode] === 'relative'}
														on:click={() => {
															element.position[deviceMode] = 'relative';
															updateParent();
														}}
													>
														📍 Relativa
													</button>
													<button
														class="position-btn"
														class:active={element.position[deviceMode] === 'absolute'}
														on:click={() => {
															element.position[deviceMode] = 'absolute';
															updateParent();
														}}
													>
														🎯 Absoluta
													</button>
												</div>
											</div>

											{#if element.type === 'image'}
												<!-- Image specific styles -->
												<div class="field">
													<label>Largura ({deviceMode}):</label>
													<input
														type="text"
														bind:value={element.styles.width[deviceMode]}
														on:input={updateParent}
														placeholder="400px, 100%, auto"
													/>
												</div>

												<div class="field">
													<label>Altura ({deviceMode}):</label>
													<input
														type="text"
														bind:value={element.styles.height[deviceMode]}
														on:input={updateParent}
														placeholder="300px, auto"
													/>
												</div>

												<div class="field">
													<label>Border Radius ({deviceMode}):</label>
													<select
														bind:value={element.styles.borderRadius[deviceMode]}
														on:change={updateParent}
													>
														<option value="0">Sem arredondamento</option>
														<option value="4px">Pequeno (4px)</option>
														<option value="8px">Médio (8px)</option>
														<option value="12px">Grande (12px)</option>
														<option value="50%">Circular (50%)</option>
													</select>
												</div>
											{/if}
										</div>
									</div>
								{/if}
							</div>
						{/each}

						{#if !data.items || data.items.length === 0}
							<div class="empty-elements">
								<p>👆 Clique em um tipo de elemento acima para começar!</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.superflex-editor {
		background: white;
		border-radius: 8px;
		overflow: hidden;
		font-family: -apple-system, sans-serif;
		font-size: 14px;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.editor-header {
		padding: 1rem;
		border-bottom: 1px solid #e2e8f0;
		background: #f8fafc;
	}

	.tabs {
		display: flex;
		background: #f8fafc;
		border-bottom: 1px solid #e2e8f0;
	}

	.tab {
		padding: 1rem 1.5rem;
		border: none;
		background: transparent;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		font-weight: 500;
		transition: all 0.2s;
		font-size: 14px;
	}

	.tab.active {
		border-bottom-color: #3182ce;
		color: #3182ce;
		background: white;
	}

	.tab-content {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
	}

	.section {
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid #f1f5f9;
	}

	.section:last-child {
		border-bottom: none;
		margin-bottom: 0;
	}

	.section h3 {
		margin: 0 0 1rem 0;
		color: #2d3748;
		font-size: 16px;
		font-weight: 600;
	}

	.subsection {
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: #f8fafc;
		border-radius: 6px;
	}

	.subsection h4 {
		margin: 0 0 1rem 0;
		color: #2d3748;
		font-size: 14px;
		font-weight: 600;
	}

	.field {
		margin-bottom: 1rem;
	}

	.field label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #4a5568;
		font-size: 12px;
	}

	.field input,
	.field select,
	.field textarea {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #cbd5e0;
		border-radius: 4px;
		font-size: 14px;
	}

	.field textarea {
		min-height: 60px;
		resize: vertical;
		font-family: monospace;
	}

	.preset-buttons {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 0.5rem;
	}

	.preset-btn {
		padding: 0.5rem 1rem;
		border: 1px solid #cbd5e0;
		background: white;
		border-radius: 4px;
		cursor: pointer;
		font-size: 12px;
		font-weight: 500;
		transition: all 0.2s;
	}

	.preset-btn:hover {
		border-color: #3182ce;
		background: #ebf8ff;
	}

	.button-group {
		display: flex;
		gap: 0.25rem;
	}

	.layout-btn,
	.align-btn,
	.position-btn {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid #cbd5e0;
		background: white;
		border-radius: 4px;
		cursor: pointer;
		font-size: 11px;
		font-weight: 500;
		transition: all 0.2s;
	}

	.layout-btn.active,
	.align-btn.active,
	.position-btn.active {
		background: #3182ce;
		color: white;
		border-color: #3182ce;
	}

	.element-types {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		gap: 0.5rem;
	}

	.add-element-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.75rem 0.5rem;
		border: 2px dashed #cbd5e0;
		background: #f8fafc;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
		text-align: center;
	}

	.add-element-btn:hover {
		border-color: #3182ce;
		background: #ebf8ff;
		transform: translateY(-1px);
	}

	.element-icon {
		font-size: 18px;
	}

	.element-name {
		font-size: 11px;
		font-weight: 500;
		color: #4a5568;
	}

	.elements-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.element-item {
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		overflow: hidden;
		transition: all 0.2s;
	}

	.element-item.selected {
		border-color: #3182ce;
		box-shadow: 0 0 0 1px #3182ce;
	}

	.element-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: #f8fafc;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.element-header:hover {
		background: #f1f5f9;
	}

	.element-info {
		font-weight: 500;
		color: #2d3748;
		font-size: 13px;
	}

	.element-actions {
		display: flex;
		gap: 0.25rem;
	}

	.remove-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 4px;
		transition: background-color 0.2s;
	}

	.remove-btn:hover {
		background: #fed7d7;
	}

	.element-editor {
		padding: 1rem;
		background: white;
		border-top: 1px solid #e2e8f0;
	}

	.empty-elements {
		text-align: center;
		padding: 3rem;
		color: #718096;
		font-style: italic;
	}

	/* Scrollbar customization */
	.tab-content::-webkit-scrollbar {
		width: 6px;
	}

	.tab-content::-webkit-scrollbar-track {
		background: #f1f5f9;
	}

	.tab-content::-webkit-scrollbar-thumb {
		background: #cbd5e0;
		border-radius: 3px;
	}

	.tab-content::-webkit-scrollbar-thumb:hover {
		background: #a0aec0;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.element-types {
			grid-template-columns: repeat(2, 1fr);
		}

		.preset-buttons {
			grid-template-columns: 1fr;
		}
	}
</style>
