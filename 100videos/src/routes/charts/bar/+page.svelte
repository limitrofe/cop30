<script>
	import { onMount } from 'svelte';
	import { backOut, cubicInOut, cubicOut, linear } from 'svelte/easing';
	import Papa from 'papaparse';
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import { DEFAULT_BAR_CHART_DATA, parseBarChartCsv } from '$lib/utils/chartData.js';

	const DEFAULT_COLUMNS = ['label', 'value'];
	const DEFAULT_ANNOTATIONS = `[
  {"label":"Categoria B","text":"Campanha recente elevou as vendas","offsetY":-28},
  {"label":"Categoria D","text":"Meta de 2024 superada","offsetY":-32}
]`;
	const LABEL_MODE_VALUES = ['hover', 'always', 'never'];
	const ANIMATION_TYPES = [
		{ value: 'flip', label: 'Transição de layout (Flip)' },
		{ value: 'fade', label: 'Fade suave' },
		{ value: 'scale', label: 'Escala vertical' },
		{ value: 'none', label: 'Nenhuma animação' }
	];
	const EASING_OPTIONS = {
		cubicOut: {
			label: 'Cubic Out',
			fn: cubicOut,
			css: 'cubic-bezier(0.22, 1, 0.36, 1)'
		},
		cubicInOut: {
			label: 'Cubic In-Out',
			fn: cubicInOut,
			css: 'cubic-bezier(0.65, 0, 0.35, 1)'
		},
		backOut: {
			label: 'Back Out',
			fn: backOut,
			css: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
		},
		linear: {
			label: 'Linear',
			fn: linear,
			css: 'linear'
		}
	};
	const EASING_ENTRIES = Object.entries(EASING_OPTIONS);

	let chartData = [...DEFAULT_BAR_CHART_DATA];
	let csvText = '';
	let modalOpen = false;
	let previewData = [...DEFAULT_BAR_CHART_DATA];
	let parseWarnings = [];
	let parseErrors = [];

	let barColor = '#0ea5e9';
	let highlightColor = '#f97316';
	let dimOpacity = 0.35;
	let valueLabelsMode = 'hover';
	let valueLabelColor = '#0f172a';
	let valueLabelStrokeEnabled = false;
	let valueLabelStrokeColor = '#ffffff';
	let valueLabelStrokeWidth = 2;
	let valueDivisorInput = '1';
	let valueUnit = '';

	let tooltipEnabled = true;
	let wheelZoomEnabled = false;
	let brushEnabled = false;
	let transitionsEnabled = true;
	let animationType = 'flip';
	let animationDuration = 450;
	let animationDelay = 30;
	let animationEasingKey = 'cubicOut';
	let tooltipShowOriginalValue = true;

	let highlightsInput = 'Categoria B';
	let annotationsText = DEFAULT_ANNOTATIONS;
	let annotationsError = '';

	let titleTag = 'h3';
	let titleColor = '';
	let descriptionColor = '';
	let noteColor = '';
	let annotationColor = '';
	let notesInput = 'Dados preliminares sujeitos a revisão.';
	let sourceLabel = 'Instituto Exemplo';
	let sourceUrl = '';
	let sourceColor = '';
	let footnote = 'Base de respondentes: 1.254 entrevistas.';
	let footnoteColor = '';

	let csvUrlInput = '';
	let externalLoading = false;
	let externalError = '';

	const modalDescriptionId = 'bar-chart-modal-description';
	$: animationDurationNumber = Math.max(0, Number(animationDuration) || 0);
	$: animationDelayNumber = Math.max(0, Number(animationDelay) || 0);
	$: currentEasing = EASING_OPTIONS[animationEasingKey] ?? EASING_OPTIONS.cubicOut;
	$: animationEasingFn = currentEasing.fn;
	$: animationEasingCss = currentEasing.css;
	$: valueLabelStroke = valueLabelStrokeEnabled ? valueLabelStrokeColor : 'none';
	$: valueLabelStrokeWidthValue = valueLabelStrokeEnabled
		? Math.max(0, Number(valueLabelStrokeWidth) || 0)
		: 0;
	$: valueDivisorNumber = (() => {
		const parsed = Number(valueDivisorInput);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
	})();

	onMount(() => {
		csvText = toCsv(chartData);
		updatePreview();
	});

	$: highlights = highlightsInput
		? highlightsInput
				.split(/[,;\r?\n]/)
				.map((item) => item.trim())
				.filter(Boolean)
		: [];

	$: if (!LABEL_MODE_VALUES.includes(valueLabelsMode)) {
		valueLabelsMode = 'hover';
	}
	$: dimOpacityValue = (() => {
		const numeric = Number(dimOpacity);
		if (Number.isFinite(numeric)) {
			return Math.min(1, Math.max(0, numeric));
		}
		return 0.35;
	})();

	function toCsv(data) {
		return Papa.unparse({
			fields: DEFAULT_COLUMNS,
			data: data.map((item) => DEFAULT_COLUMNS.map((column) => item[column]))
		});
	}

	function handleOpenModal() {
		csvText = toCsv(chartData);
		updatePreview();
		modalOpen = true;
	}

	function handleCloseModal() {
		modalOpen = false;
	}

	function handleKeydown(event) {
		if (event.key === 'Escape') {
			modalOpen = false;
		}
	}

	function updatePreview() {
		const result = parseBarChartCsv(csvText);
		parseWarnings = result.warnings;
		parseErrors = result.errors;
		previewData = result.data;
	}

	function applyData() {
		updatePreview();
		if (parseErrors.length === 0) {
			chartData = [...previewData];
			modalOpen = false;
		}
	}

	function loadSample(type) {
		let sample;
		if (type === 'crescimento') {
			sample = [
				{ label: 'Q1', value: 24 },
				{ label: 'Q2', value: 32 },
				{ label: 'Q3', value: 41 },
				{ label: 'Q4', value: 56 }
			];
			highlightsInput = 'Q4';
			annotationsText = `[
  {"label":"Q4","text":"Trimestre com maior crescimento","offsetY":-30}
]`;
		} else if (type === 'comparativo') {
			sample = [
				{ label: 'Produto A', value: 68 },
				{ label: 'Produto B', value: 51 },
				{ label: 'Produto C', value: 83 },
				{ label: 'Produto D', value: 44 }
			];
			highlightsInput = 'Produto C';
			annotationsText = `[
  {"label":"Produto C","text":"Lançamento premium","offsetY":-30}
]`;
		} else {
			sample = [...DEFAULT_BAR_CHART_DATA];
			highlightsInput = 'Categoria B';
			annotationsText = DEFAULT_ANNOTATIONS;
		}
		csvText = toCsv(sample);
		const result = parseBarChartCsv(csvText);
		parseWarnings = result.warnings;
		parseErrors = result.errors;
		previewData = result.data;
		if (result.errors.length === 0) {
			chartData = [...result.data];
		}
	}

	async function importCsvFromUrl() {
		const url = csvUrlInput.trim();
		if (!url) return;
		externalLoading = true;
		externalError = '';
		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`Erro ${response.status}`);
			}
			const text = await response.text();
			csvText = text;
			updatePreview();
			if (parseErrors.length === 0) {
				chartData = [...previewData];
				modalOpen = false;
			}
		} catch (error) {
			externalError =
				error.message || 'Não foi possível carregar o CSV externo. Verifique o link informado.';
		} finally {
			externalLoading = false;
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="page">
	<section class="page__left">
		<BarChart
			title="Vendas por categoria"
			{titleTag}
			{titleColor}
			description="Atualize os dados via CSV para testar o gráfico em tempo real."
			{descriptionColor}
			data={chartData}
			notes={notesInput}
			{noteColor}
			{sourceLabel}
			{sourceUrl}
			{sourceColor}
			{footnote}
			{footnoteColor}
			{barColor}
			{highlightColor}
			{highlights}
			dimOpacity={dimOpacityValue}
			annotations={annotationsText}
			{annotationColor}
			valueDivisor={valueDivisorNumber}
			{valueUnit}
			showTooltips={tooltipEnabled}
			{tooltipShowOriginalValue}
			enableWheelZoom={wheelZoomEnabled}
			enableBrush={brushEnabled}
			{valueLabelsMode}
			{valueLabelColor}
			{valueLabelStroke}
			valueLabelStrokeWidth={valueLabelStrokeWidthValue}
			enableTransitions={transitionsEnabled}
			{animationType}
			animationDuration={animationDurationNumber}
			animationDelay={animationDelayNumber}
			animationEasing={animationEasingFn}
			{animationEasingCss}
			height={400}
			showGrid={true}
			yTicks={4}
		/>
	</section>
	<section class="page__right">
		<div class="panel">
			<h1>Gráfico de barras</h1>
			<p>
				Utilize o botão abaixo para colar ou editar dados em CSV. O gráfico renderiza
				instantaneamente a partir dos novos valores.
			</p>
			<button class="primary-button" type="button" on:click={handleOpenModal}>Editar dados</button>
			<div class="panel__samples">
				<p>Exemplos rápidos:</p>
				<div class="panel__samples-actions">
					<button type="button" on:click={() => loadSample('default')}>Categorias</button>
					<button type="button" on:click={() => loadSample('crescimento')}>Trimestres</button>
					<button type="button" on:click={() => loadSample('comparativo')}>Produtos</button>
				</div>
			</div>

			<div class="panel__group">
				<h2>Fonte de dados</h2>
				<label class="panel__label" for="csv-url">URL CSV ou Google Sheets</label>
				<div class="panel__inline">
					<input
						id="csv-url"
						type="url"
						placeholder="https://docs.google.com/.../export?format=csv"
						bind:value={csvUrlInput}
					/>
					<button
						class="secondary-button"
						type="button"
						on:click={importCsvFromUrl}
						disabled={!csvUrlInput || externalLoading}
					>
						{externalLoading ? 'Carregando…' : 'Importar'}
					</button>
				</div>
				{#if externalError}
					<p class="panel__hint panel__hint--error">{externalError}</p>
				{/if}
			</div>

			<div class="panel__group">
				<h2>Estilo</h2>
				<div class="panel__grid">
					<label class="panel__label">
						<span>Cor das barras</span>
						<input type="color" bind:value={barColor} />
					</label>
					<label class="panel__label">
						<span>Cor dos destaques</span>
						<input type="color" bind:value={highlightColor} />
					</label>
					<label class="panel__label">
						<span>Cor dos valores</span>
						<input type="color" bind:value={valueLabelColor} />
					</label>
					<label class="panel__label">
						<span>Cor das notas</span>
						<input type="color" bind:value={noteColor} />
					</label>
					<label class="panel__label">
						<span>Cor das anotações</span>
						<input type="color" bind:value={annotationColor} />
					</label>
					<label class="panel__label">
						<span>Cor da fonte</span>
						<input type="color" bind:value={sourceColor} />
					</label>
					<label class="panel__label">
						<span>Cor do rodapé</span>
						<input type="color" bind:value={footnoteColor} />
					</label>
					<label class="panel__label">
						<span>Cor do título</span>
						<input type="color" bind:value={titleColor} />
					</label>
					<label class="panel__label">
						<span>Cor da descrição</span>
						<input type="color" bind:value={descriptionColor} />
					</label>
				</div>
				<label class="panel__checkbox">
					<input type="checkbox" bind:checked={valueLabelStrokeEnabled} />
					<span>Adicionar contorno aos valores</span>
				</label>
				{#if valueLabelStrokeEnabled}
					<div class="panel__inline">
						<label class="panel__label">
							<span>Cor do contorno</span>
							<input type="color" bind:value={valueLabelStrokeColor} />
						</label>
						<label class="panel__label">
							<span>Largura (px)</span>
							<input type="number" min="0" step="1" bind:value={valueLabelStrokeWidth} />
						</label>
					</div>
				{/if}
				<div class="panel__inline">
					<label class="panel__label">
						<span>Divisor dos valores</span>
						<input
							type="number"
							min="1"
							step="1"
							list="bar-chart-divisor-presets"
							bind:value={valueDivisorInput}
						/>
						<datalist id="bar-chart-divisor-presets">
							<option value="1">Sem escala</option>
							<option value="10">Dividir por 10</option>
							<option value="100">Dividir por 100</option>
							<option value="1000">Dividir por 1.000</option>
							<option value="1000000">Dividir por 1.000.000</option>
						</datalist>
					</label>
					<label class="panel__label">
						<span>Sufixo / unidade</span>
						<input type="text" placeholder="mil, milhões, R$" bind:value={valueUnit} />
					</label>
				</div>
				<label class="panel__label">
					<span>Opacidade dos itens não destacados ({Math.round(dimOpacityValue * 100)}%)</span>
					<input type="range" min="0" max="1" step="0.05" bind:value={dimOpacity} />
				</label>
				<label class="panel__label">
					<span>Itens destacados</span>
					<input type="text" placeholder="Categoria B, Categoria E" bind:value={highlightsInput} />
				</label>
				<div class="panel__inline">
					<label class="panel__label">
						<span>Nível do título</span>
						<select bind:value={titleTag}>
							<option value="h2">H2</option>
							<option value="h3">H3</option>
							<option value="h4">H4</option>
						</select>
					</label>
					<label class="panel__label">
						<span>Labels dos valores</span>
						<select bind:value={valueLabelsMode}>
							<option value="hover">Somente ao interagir</option>
							<option value="always">Sempre visíveis</option>
							<option value="never">Ocultar valores</option>
						</select>
					</label>
				</div>
			</div>

			<div class="panel__group">
				<h2>Animação e interação</h2>
				<label class="panel__checkbox">
					<input type="checkbox" bind:checked={tooltipEnabled} />
					<span>Mostrar tooltip ao passar o mouse ou tocar</span>
				</label>
				{#if tooltipEnabled}
					<label class="panel__checkbox panel__checkbox--nested">
						<input type="checkbox" bind:checked={tooltipShowOriginalValue} />
						<span>Mostrar valor original no tooltip</span>
					</label>
				{/if}
				<label class="panel__checkbox">
					<input type="checkbox" bind:checked={wheelZoomEnabled} />
					<span>Ativar zoom com a roda do mouse</span>
				</label>
				<label class="panel__checkbox">
					<input type="checkbox" bind:checked={brushEnabled} />
					<span>Permitir seleção por arrasto (brush)</span>
				</label>
				<label class="panel__checkbox">
					<input type="checkbox" bind:checked={transitionsEnabled} />
					<span>Ativar animações</span>
				</label>
				{#if transitionsEnabled}
					<label class="panel__label">
						<span>Tipo de animação</span>
						<select bind:value={animationType}>
							{#each ANIMATION_TYPES as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</label>
					<div class="panel__inline">
						<label class="panel__label">
							<span>Duração (ms)</span>
							<input type="number" min="0" step="10" bind:value={animationDuration} />
						</label>
						<label class="panel__label">
							<span>Atraso (ms)</span>
							<input type="number" min="0" step="10" bind:value={animationDelay} />
						</label>
					</div>
					<label class="panel__label">
						<span>Curva de easing</span>
						<select bind:value={animationEasingKey}>
							{#each EASING_ENTRIES as [key, option]}
								<option value={key}>{option.label}</option>
							{/each}
						</select>
					</label>
				{/if}
			</div>

			<div class="panel__group">
				<h2>Conteúdo adicional</h2>
				<label class="panel__label">
					<span>Notas (uma por linha)</span>
					<textarea rows="3" bind:value={notesInput}></textarea>
				</label>
				<label class="panel__label">
					<span>Fonte</span>
					<input type="text" placeholder="Instituto Exemplo" bind:value={sourceLabel} />
				</label>
				<label class="panel__label">
					<span>Link da fonte</span>
					<input type="url" placeholder="https://..." bind:value={sourceUrl} />
				</label>
				<label class="panel__label">
					<span>Rodapé</span>
					<textarea rows="2" bind:value={footnote}></textarea>
				</label>
			</div>

			<div class="panel__group">
				<h2>Anotações no gráfico</h2>
				<label class="panel__label">
					<span>JSON das anotações</span>
					<textarea rows="6" bind:value={annotationsText}></textarea>
				</label>
				{#if annotationsError}
					<p class="panel__hint panel__hint--error">{annotationsError}</p>
				{/if}
				<p class="panel__hint">
					Cada anotação deve conter <code>label</code> e <code>text</code>. Opcionalmente use
					<code>offsetX</code>, <code>offsetY</code> ou <code>color</code>.
				</p>
			</div>
		</div>
	</section>
</div>

{#if modalOpen}
	<div class="chart-modal-backdrop" role="presentation">
		<div
			class="chart-modal"
			role="dialog"
			aria-modal="true"
			aria-labelledby="bar-chart-modal-title"
			aria-describedby={modalDescriptionId}
			on:click|stopPropagation
		>
			<header class="chart-modal__header">
				<h2 id="bar-chart-modal-title">Dados do gráfico</h2>
				<button
					class="chart-modal__close"
					type="button"
					aria-label=" Fechar"
					on:click={handleCloseModal}
				>
					✕
				</button>
			</header>
			<p id={modalDescriptionId}>
				Utilize o formato CSV com as colunas <code>label</code> e <code>value</code>. Você pode
				colar dados diretamente de uma planilha ou inserir manualmente.
			</p>
			<textarea
				class="chart-modal__textarea"
				rows="12"
				bind:value={csvText}
				on:input={updatePreview}
				sPELLcheck="false"
			></textarea>
			{#if parseWarnings.length}
				<ul class="chart-modal__messages chart-modal__messages--warning">
					{#each parseWarnings as warning}
						<li>{warning}</li>
					{/each}
				</ul>
			{/if}
			{#if parseErrors.length}
				<ul class="chart-modal__messages chart-modal__messages--error">
					{#each parseErrors as error}
						<li>
							Linha {error.row + 1}: {error.message}
						</li>
					{/each}
				</ul>
			{/if}

			<div class="chart-modal__preview">
				<h3>Prévia ({previewData.length} linhas)</h3>
				{#if previewData.length}
					<table>
						<thead>
							<tr>
								<th>Label</th>
								<th>Valor</th>
							</tr>
						</thead>
						<tbody>
							{#each previewData as row}
								<tr>
									<td>{row.label}</td>
									<td>{row.value}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{:else}
					<p class="empty-state">Nenhum dado pronto para visualização.</p>
				{/if}
			</div>

			<footer class="chart-modal__footer">
				<button type="button" on:click={handleCloseModal}>Cancelar</button>
				<button class="primary-button" type="button" on:click={applyData}>Aplicar dados</button>
			</footer>
		</div>
	</div>
{/if}

<style>
	:global(body) {
		background-color: #f8fafc;
	}

	.page {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 2rem;
		padding: 2.5rem 5vw;
		box-sizing: border-box;
	}

	.page__left,
	.page__right {
		min-width: 0;
	}

	.panel {
		background: #ffffff;
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 18px 60px rgba(15, 23, 42, 0.06);
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.panel h1 {
		margin: 0;
		font-size: 1.6rem;
		color: #0f172a;
	}

	.panel p {
		margin: 0;
		color: #475569;
		line-height: 1.5;
	}

	.primary-button {
		appearance: none;
		border: none;
		background: linear-gradient(135deg, #0ea5e9, #6366f1);
		color: #ffffff;
		padding: 0.75rem 1.5rem;
		border-radius: 999px;
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
		box-shadow: 0 12px 30px rgba(14, 165, 233, 0.35);
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.primary-button:hover {
		transform: translateY(-1px);
		box-shadow: 0 16px 38px rgba(99, 102, 241, 0.35);
	}

	.primary-button:focus-visible {
		outline: 3px solid rgba(14, 165, 233, 0.5);
		outline-offset: 2px;
	}

	.panel__samples {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.panel__samples-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.panel__samples-actions button {
		padding: 0.5rem 1rem;
		border-radius: 999px;
		border: 1px solid rgba(148, 163, 184, 0.3);
		background: transparent;
		color: #0f172a;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.panel__samples-actions button:hover {
		background: rgba(14, 165, 233, 0.12);
		border-color: rgba(14, 165, 233, 0.3);
	}

	.panel__group {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.1rem 1.25rem;
		border-radius: 1rem;
		background: rgba(248, 250, 252, 0.8);
		border: 1px solid rgba(226, 232, 240, 0.6);
	}

	.panel__group h2 {
		margin: 0;
		font-size: 0.9rem;
		font-weight: 600;
		color: #0f172a;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.panel__label {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		font-size: 0.8rem;
		color: #475569;
	}

	.panel__label input[type='text'],
	.panel__label input[type='url'],
	.panel__label input[type='number'],
	.panel__label select,
	.panel__label textarea {
		width: 100%;
		padding: 0.55rem 0.65rem;
		border-radius: 0.75rem;
		border: 1px solid rgba(203, 213, 225, 0.9);
		background: #ffffff;
		font-size: 0.85rem;
		color: #0f172a;
		box-sizing: border-box;
	}

	.panel__label input[type='color'] {
		width: 100%;
		height: 38px;
		border-radius: 0.65rem;
		border: 1px solid rgba(203, 213, 225, 0.8);
		background: #ffffff;
		padding: 0;
	}

	.panel__label input[type='range'] {
		width: 100%;
	}

	.panel__inline {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.panel__inline input[type='url'] {
		flex: 1 1 220px;
	}

	.panel__grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 0.8rem;
	}

	.secondary-button {
		padding: 0.55rem 1.2rem;
		border-radius: 999px;
		border: 1px solid rgba(148, 163, 184, 0.45);
		background: #ffffff;
		font-size: 0.85rem;
		font-weight: 500;
		color: #1f2937;
		cursor: pointer;
		transition:
			transform 0.15s ease,
			border-color 0.15s ease;
	}

	.secondary-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.secondary-button:not(:disabled):hover {
		transform: translateY(-1px);
		border-color: rgba(59, 130, 246, 0.45);
	}

	.panel__checkbox {
		display: flex;
		gap: 0.6rem;
		align-items: center;
		font-size: 0.85rem;
		color: #475569;
	}

	.panel__checkbox input {
		width: 16px;
		height: 16px;
		accent-color: #0ea5e9;
	}

	.panel__hint {
		margin: 0;
		font-size: 0.75rem;
		color: #475569;
		line-height: 1.4;
	}

	.panel__hint--error {
		color: #b91c1c;
	}

	.panel__hint code {
		background: rgba(148, 163, 184, 0.15);
		padding: 0.1rem 0.3rem;
		border-radius: 0.4rem;
	}

	.chart-modal-backdrop {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(15, 23, 42, 0.5);
		padding: 1.5rem;
		box-sizing: border-box;
		z-index: 50;
	}

	.chart-modal {
		position: relative;
		width: min(720px, 100%);
		max-height: 90vh;
		background: #ffffff;
		border-radius: 1rem;
		box-shadow: 0 30px 70px rgba(15, 23, 42, 0.25);
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 2rem;
		overflow: auto;
	}

	.chart-modal__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.chart-modal__header h2 {
		margin: 0;
		font-size: 1.4rem;
		color: #0f172a;
	}

	.chart-modal__close {
		border: none;
		background: none;
		font-size: 1.25rem;
		cursor: pointer;
		color: #475569;
	}

	.chart-modal__textarea {
		width: 100%;
		font-family:
			'Fira Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
			'Courier New', monospace;
		font-size: 0.9rem;
		padding: 0.75rem;
		border-radius: 0.75rem;
		border: 1px solid rgba(148, 163, 184, 0.4);
		min-height: 180px;
		resize: vertical;
		box-sizing: border-box;
		color: #0f172a;
		background: rgba(248, 250, 252, 0.8);
	}

	.chart-modal__messages {
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		font-size: 0.85rem;
		line-height: 1.4;
		margin: 0;
		list-style: disc inside;
	}

	.chart-modal__messages--warning {
		background: rgba(245, 158, 11, 0.12);
		color: #92400e;
	}

	.chart-modal__messages--error {
		background: rgba(248, 113, 113, 0.18);
		color: #991b1b;
	}

	.chart-modal__preview {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.chart-modal__preview table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	.chart-modal__preview th,
	.chart-modal__preview td {
		text-align: left;
		padding: 0.55rem 0.75rem;
		border-bottom: 1px solid rgba(203, 213, 225, 0.75);
		white-space: nowrap;
	}

	.chart-modal__preview tbody tr:last-child td {
		border-bottom: none;
	}

	.chart-modal__footer {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
	}

	.chart-modal__footer button {
		padding: 0.6rem 1.25rem;
		border-radius: 0.75rem;
		border: 1px solid rgba(148, 163, 184, 0.35);
		background: rgba(248, 250, 252, 0.8);
		color: #0f172a;
		cursor: pointer;
	}

	.empty-state {
		margin: 0;
		color: #475569;
	}

	@media (max-width: 1024px) {
		.page {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.page {
			padding: 1.5rem 1.25rem;
		}

		.panel {
			padding: 1.5rem;
		}

		.chart-modal {
			padding: 1.5rem;
		}

		.panel__inline {
			flex-direction: column;
			align-items: stretch;
		}

		.panel__inline input[type='url'] {
			width: 100%;
		}

		.panel__grid {
			grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		}
	}
</style>
