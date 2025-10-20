<script>
	import { onDestroy, onMount } from 'svelte';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import { DEFAULT_LINE_CHART_DATA, parseLineChartCsv } from '$lib/utils/lineChartData.js';

	const DEFAULT_HEIGHT = 360;
	const parseDefaults = { data: [], warnings: [], errors: [] };

	export let title = '';
	export let titleTag = 'h3';
	export let titleColor = '';
	export let description = '';
	export let descriptionColor = '';
	export let notes = [];
	export let noteColor = '';
	export let footnote = '';
	export let footnoteColor = '';
	export let sourceLabel = '';
	export let sourceUrl = '';
	export let sourceColor = '';

	export let csvData = '';
	export let csvUrl = '';
	export let sheetId = '';
	export let sheetGid = '';
	export let autoRefreshMinutes = 0;

	export let xKey = 'date';
	export let yKey = 'value';
	export let yLowKey = 'min';
	export let yHighKey = 'max';

	export let data = DEFAULT_LINE_CHART_DATA;
	export let backgroundColor = '';
	export let fontFamily = 'inherit';
	export let fontSize = '0.85rem';
	export let lineColor = '#0ea5e9';
	export let lineWidth = 2.5;
	export let lineOpacity = 0.95;
	export let curveType = 'monotone';
	export let showArea = true;
	export let areaColor = 'rgba(14, 165, 233, 0.18)';
	export let areaOpacity = 1;
	export let gradientStops = [];
	export let showGrid = true;
	export let showXAxis = true;
	export let showYAxis = true;
	export let gridColor = 'rgba(148, 163, 184, 0.25)';
	export let gridDashArray = '3,3';
	export let axisColor = '';
	export let axisLineColor = '';
	export let pointColor = '#0f172a';
	export let pointRadius = 3.5;
	export let pointStroke = '#ffffff';
	export let pointStrokeWidth = 1.5;
	export let showPoints = false;
	export let pointFocusRadius = 5.5;

	export let xAxisLabel = '';
	export let yAxisLabel = '';
	export let axisLabelColor = '';
	export let axisLabelFontSize = '0.78rem';
	export let axisLabelOffset = { x: 36, y: 42 };
	export let valueLabels = false;
	export let valueLabelColor = '';
	export let valueLabelAnchor = 'middle';

	export let tooltipEnabled = true;
	export let tooltipShowOriginalValue = true;
	export let tooltipOffsetX = 0;
	export let tooltipOffsetY = -16;

	export let enableZoom = true;
	export let zoomMode = 'x';
	export let zoomScaleMin = 1;
	export let zoomScaleMax = 32;
	export let enableCrosshair = true;

	export let enableTransitions = true;
	export let animationType = 'draw';
	export let animationDuration = 600;
	export let animationEasing = 'cubic-bezier(0.22, 1, 0.36, 1)';

	export let yDomainPadding = 0.08;
	export let yNice = true;
	export let maxXTicks = 8;
	export let maxYTicks = 6;

	export let height = DEFAULT_HEIGHT;
	export let margin = { top: 40, right: 32, bottom: 64, left: 80 };

	let csvResult = parseDefaults;
	let externalText = '';
	let externalError = '';
	let externalLoading = false;
	let mounted = false;
	let refreshTimer;
	let lastFetchedAt = null;
	let lastRemoteUrl = '';

	const axisAnchorWhitelist = new Set(['start', 'middle', 'end']);
	const zoomModeWhitelist = new Set(['x', 'y', 'xy']);
	const curveWhitelist = new Set(['linear', 'monotone', 'basis', 'step']);
	const animationWhitelist = new Set(['draw', 'fade', 'none']);

	function buildSheetCsvUrl(id, gid) {
		if (!id) return '';
		const params = new URLSearchParams({ format: 'csv' });
		if (gid) params.set('gid', gid);
		return `https://docs.google.com/spreadsheets/d/${id}/export?${params.toString()}`;
	}

	async function fetchExternalCsv(url) {
		if (!url || typeof window === 'undefined') return;
		externalLoading = true;
		externalError = '';
		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`Falha ao carregar CSV (${response.status})`);
			}
			const text = await response.text();
			externalText = text;
			lastFetchedAt = new Date();
		} catch (error) {
			console.error('ChartLine: erro ao buscar CSV remoto', error);
			externalError = error.message || 'Não foi possível carregar os dados externos.';
			externalText = '';
		} finally {
			externalLoading = false;
		}
	}

	function scheduleAutoRefresh(interval, url) {
		clearRefreshTimer();
		if (!interval || !url) return;
		refreshTimer = setInterval(() => {
			fetchExternalCsv(url);
		}, interval);
	}

	function clearRefreshTimer() {
		if (refreshTimer) {
			clearInterval(refreshTimer);
			refreshTimer = undefined;
		}
	}

	const externalStatusMessage = () => {
		if (externalLoading) return 'Carregando dados externos…';
		if (externalError) return externalError;
		if (lastFetchedAt) {
			return `Dados atualizados em ${lastFetchedAt.toLocaleString()}`;
		}
		return '';
	};

	function parseNumberLike(value, fallback) {
		if (value === null || value === undefined || value === '') return fallback;
		const numeric = Number(value);
		return Number.isFinite(numeric) ? numeric : fallback;
	}

	function normalizeMargin(value) {
		if (!value) {
			return { top: 40, right: 32, bottom: 64, left: 80 };
		}
		if (typeof value === 'string') {
			try {
				const parsed = JSON.parse(value);
				if (parsed && typeof parsed === 'object') return normalizeMargin(parsed);
			} catch (error) {
				return { top: 40, right: 32, bottom: 64, left: 80 };
			}
		}
		return {
			top: parseNumberLike(value.top, 40),
			right: parseNumberLike(value.right, 32),
			bottom: parseNumberLike(value.bottom, 64),
			left: parseNumberLike(value.left, 80)
		};
	}

	function normalizeOffset(value, fallback = { x: 36, y: 42 }) {
		if (!value) return fallback;
		if (typeof value === 'string') {
			try {
				const parsed = JSON.parse(value);
				if (parsed && typeof parsed === 'object') return normalizeOffset(parsed, fallback);
			} catch (error) {
				return fallback;
			}
		}
		return {
			x: parseNumberLike(value.x, fallback.x),
			y: parseNumberLike(value.y, fallback.y)
		};
	}

	function normalizeGradientStops(value) {
		if (!value) return [];
		if (Array.isArray(value)) {
			return value
				.map((stop) => normalizeGradientStops(stop))
				.filter((stop) => stop && typeof stop === 'object' && stop.color);
		}
		if (typeof value === 'string') {
			const trimmed = value.trim();
			if (!trimmed) return [];
			try {
				const parsed = JSON.parse(trimmed);
				return normalizeGradientStops(parsed);
			} catch (error) {
				return [];
			}
		}
		if (value && typeof value === 'object') {
			const offset =
				typeof value.offset === 'string' ? value.offset : parseNumberLike(value.offset, null);
			const color = value.color || value.stopColor || value['stop-color'];
			if (!color) return null;
			const opacity = parseNumberLike(
				value.opacity ?? value.stopOpacity ?? value['stop-opacity'],
				undefined
			);
			const result = { color };
			if (offset !== null && offset !== undefined) {
				result.offset = typeof offset === 'number' ? `${offset * 100}%` : offset;
			}
			if (opacity !== undefined) {
				result.opacity = opacity;
			}
			return result;
		}
		return [];
	}

	function normalizeBoolean(value, fallback = false) {
		if (value === null || value === undefined) return fallback;
		if (typeof value === 'boolean') return value;
		if (typeof value === 'string') {
			const normalized = value.trim().toLowerCase();
			if (['true', '1', 'yes', 'sim'].includes(normalized)) return true;
			if (['false', '0', 'no', 'não', 'nao'].includes(normalized)) return false;
		}
		return fallback;
	}

	function normalizeStringArray(value) {
		if (!value) return [];
		if (Array.isArray(value)) return value;
		if (typeof value === 'string') {
			const trimmed = value.trim();
			if (!trimmed) return [];
			try {
				const parsed = JSON.parse(trimmed);
				if (Array.isArray(parsed)) return parsed;
			} catch (error) {
				return trimmed
					.split(/[\r?\n,]/)
					.map((item) => item.trim())
					.filter(Boolean);
			}
		}
		return [];
	}

	$: manualCsv = typeof csvData === 'string' ? csvData.trim() : '';
	$: remoteCsvUrl = csvUrl?.trim() || buildSheetCsvUrl(sheetId?.trim(), sheetGid?.trim());
	$: autoRefreshInterval = Number(autoRefreshMinutes) > 0 ? Number(autoRefreshMinutes) * 60_000 : 0;

	onMount(() => {
		mounted = true;
		if (remoteCsvUrl) {
			lastRemoteUrl = remoteCsvUrl;
			fetchExternalCsv(remoteCsvUrl);
			if (autoRefreshInterval) {
				scheduleAutoRefresh(autoRefreshInterval, remoteCsvUrl);
			}
		}
	});

	onDestroy(() => {
		clearRefreshTimer();
	});

	$: if (mounted) {
		if (remoteCsvUrl !== lastRemoteUrl) {
			lastRemoteUrl = remoteCsvUrl;
			if (remoteCsvUrl) {
				fetchExternalCsv(remoteCsvUrl);
			} else {
				externalText = '';
				externalError = '';
				lastFetchedAt = null;
			}
		}
	}

	$: if (mounted) {
		if (remoteCsvUrl && autoRefreshInterval) {
			scheduleAutoRefresh(autoRefreshInterval, remoteCsvUrl);
		} else {
			clearRefreshTimer();
		}
	}

	$: activeCsvText = (externalText && externalText.trim()) || manualCsv || '';
	$: csvResult = activeCsvText
		? parseLineChartCsv(activeCsvText, { xKey, yKey, yLowKey, yHighKey })
		: parseDefaults;

	$: chartData = csvResult.data.length ? csvResult.data : data;
	$: hasErrors = csvResult.errors?.length > 0 || Boolean(externalError);
	$: warnings = [...(csvResult.warnings || [])];

	$: marginSafe = normalizeMargin(margin);
	$: axisOffsetSafe = normalizeOffset(axisLabelOffset);
	$: gradientStopsSafe = normalizeGradientStops(gradientStops);
	$: showAreaSafe = normalizeBoolean(showArea, true);
	$: notesArray = normalizeStringArray(notes);
	$: valueLabelsEnabled = normalizeBoolean(valueLabels, false);
	$: tooltipEnabledSafe = normalizeBoolean(tooltipEnabled, true);
	$: tooltipOriginalSafe = normalizeBoolean(tooltipShowOriginalValue, true);
	$: showGridSafe = normalizeBoolean(showGrid, true);
	$: showXAxisSafe = normalizeBoolean(showXAxis, true);
	$: showYAxisSafe = normalizeBoolean(showYAxis, true);
	$: showPointsSafe = normalizeBoolean(showPoints, false);
	$: enableZoomSafe = normalizeBoolean(enableZoom, true);
	$: enableCrosshairSafe = normalizeBoolean(enableCrosshair, true);
	$: enableTransitionsSafe = normalizeBoolean(enableTransitions, true);
	$: yNiceSafe = normalizeBoolean(yNice, true);

	$: zoomModeSafe = zoomModeWhitelist.has(String(zoomMode).toLowerCase())
		? String(zoomMode).toLowerCase()
		: 'x';
	$: curveTypeSafe = curveWhitelist.has(String(curveType).toLowerCase())
		? String(curveType).toLowerCase()
		: 'monotone';
	$: animationTypeSafe = animationWhitelist.has(String(animationType).toLowerCase())
		? String(animationType).toLowerCase()
		: 'draw';
	$: valueLabelAnchorSafe = axisAnchorWhitelist.has(String(valueLabelAnchor).toLowerCase())
		? String(valueLabelAnchor).toLowerCase()
		: 'middle';

	$: zoomScaleExtent = {
		min: Math.max(1, parseNumberLike(zoomScaleMin, 1)),
		max: Math.max(Math.max(1, parseNumberLike(zoomScaleMin, 1)), parseNumberLike(zoomScaleMax, 32))
	};

	$: tooltipOffsetSafe = {
		x: parseNumberLike(tooltipOffsetX, 0),
		y: parseNumberLike(tooltipOffsetY, -16)
	};

	$: heightSafe = parseNumberLike(height, DEFAULT_HEIGHT);
	$: lineWidthSafe = parseNumberLike(lineWidth, 2.5);
	$: lineOpacitySafe = parseNumberLike(lineOpacity, 0.95);
	$: areaOpacitySafe = parseNumberLike(areaOpacity, 1);
	$: pointRadiusSafe = parseNumberLike(pointRadius, 3.5);
	$: pointStrokeWidthSafe = parseNumberLike(pointStrokeWidth, 1.5);
	$: pointFocusRadiusSafe = parseNumberLike(pointFocusRadius, 5.5);
	$: axisLabelFontSizeSafe = axisLabelFontSize || '0.78rem';
	$: animationDurationSafe = Math.max(0, parseNumberLike(animationDuration, 600));
	$: yPaddingSafe = parseNumberLike(yDomainPadding, 0.08);
	$: maxXTicksSafe = parseNumberLike(maxXTicks, 8);
	$: maxYTicksSafe = parseNumberLike(maxYTicks, 6);
</script>

<section class="chart-line-block">
	{#if externalLoading}
		<div class="chart-line-block__alert chart-line-block__alert--info">
			<p>{externalStatusMessage()}</p>
		</div>
	{/if}

	{#if externalError}
		<div class="chart-line-block__alert chart-line-block__alert--error">
			<p>{externalError}</p>
		</div>
	{:else if hasErrors}
		<div class="chart-line-block__alert chart-line-block__alert--error">
			<p>
				Não foi possível processar alguns dados do CSV. Revise o conteúdo informado e tente
				novamente.
			</p>
		</div>
	{:else if warnings.length}
		<div class="chart-line-block__alert chart-line-block__alert--warning">
			<p>{warnings[0]}</p>
		</div>
	{:else if lastFetchedAt}
		<div class="chart-line-block__alert chart-line-block__alert--info">
			<p>{externalStatusMessage()}</p>
		</div>
	{/if}

	<LineChart
		{title}
		{titleTag}
		{titleColor}
		{description}
		{descriptionColor}
		notes={notesArray}
		{noteColor}
		{footnote}
		{footnoteColor}
		{sourceLabel}
		{sourceUrl}
		{sourceColor}
		data={chartData}
		{xKey}
		{yKey}
		{yLowKey}
		{yHighKey}
		{backgroundColor}
		{fontFamily}
		{fontSize}
		{lineColor}
		lineWidth={lineWidthSafe}
		lineOpacity={lineOpacitySafe}
		curveType={curveTypeSafe}
		showArea={showAreaSafe}
		{areaColor}
		areaOpacity={areaOpacitySafe}
		gradientStops={gradientStopsSafe}
		showGrid={showGridSafe}
		showXAxis={showXAxisSafe}
		showYAxis={showYAxisSafe}
		{gridColor}
		{gridDashArray}
		{axisColor}
		{axisLineColor}
		{pointColor}
		pointRadius={pointRadiusSafe}
		{pointStroke}
		pointStrokeWidth={pointStrokeWidthSafe}
		showPoints={showPointsSafe}
		pointFocusRadius={pointFocusRadiusSafe}
		{xAxisLabel}
		{yAxisLabel}
		{axisLabelColor}
		axisLabelFontSize={axisLabelFontSizeSafe}
		axisLabelOffset={axisOffsetSafe}
		valueLabels={valueLabelsEnabled}
		{valueLabelColor}
		valueLabelAnchor={valueLabelAnchorSafe}
		showTooltips={tooltipEnabledSafe}
		tooltipShowOriginalValue={tooltipOriginalSafe}
		tooltipOffset={tooltipOffsetSafe}
		enableZoom={enableZoomSafe}
		zoomMode={zoomModeSafe}
		{zoomScaleExtent}
		enableCrosshair={enableCrosshairSafe}
		enableTransitions={enableTransitionsSafe}
		animationType={animationTypeSafe}
		animationDuration={animationDurationSafe}
		{animationEasing}
		yDomainPadding={yPaddingSafe}
		yNice={yNiceSafe}
		maxXTicks={maxXTicksSafe}
		maxYTicks={maxYTicksSafe}
		height={heightSafe}
		margin={marginSafe}
	/>
</section>

<style>
	.chart-line-block {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.chart-line-block__alert {
		padding: 0.85rem 1rem;
		border-radius: 0.75rem;
		font-size: 0.85rem;
		line-height: 1.4;
	}

	.chart-line-block__alert--info {
		background: rgba(14, 165, 233, 0.1);
		border: 1px solid rgba(14, 165, 233, 0.25);
		color: #0369a1;
	}

	.chart-line-block__alert--warning {
		background: rgba(250, 204, 21, 0.1);
		border: 1px solid rgba(250, 204, 21, 0.25);
		color: #92400e;
	}

	.chart-line-block__alert--error {
		background: rgba(239, 68, 68, 0.12);
		border: 1px solid rgba(239, 68, 68, 0.28);
		color: #b91c1c;
	}
</style>
