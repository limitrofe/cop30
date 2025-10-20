<script>
	import { onDestroy, onMount } from 'svelte';
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import { DEFAULT_BAR_CHART_DATA, parseBarChartCsv } from '$lib/utils/chartData.js';

	const DEFAULT_HEIGHT = 360;

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
	export let labelKey = 'label';
	export let valueKey = 'value';

	export let data = DEFAULT_BAR_CHART_DATA;
	export let barColor = '#0ea5e9';
	export let highlightColor = '#facc15';
	export let highlights = [];
	export let dimOpacity = 0.35;
	export let annotations = [];
	export let annotationColor = '';
	export let tooltipEnabled = true;
	export let tooltipShowOriginalValue = true;
	export let valueLabelsMode = 'hover';
	export let valueLabelColor = '';
	export let valueLabelStroke = '';
	export let valueLabelStrokeWidth = 0;
	export let valueDivisor = 1;
	export let valueUnit = '';
	export let enableWheelZoom = false;
	export let wheelZoomIntensity = 0.25;
	export let enableBrush = false;

	export let height = DEFAULT_HEIGHT;
	export let showGrid = true;
	export let yTicks = 4;
	export let margin = { top: 32, right: 24, bottom: 56, left: 72 };
	export let enableTransitions = true;
	export let animationDuration = 450;
	export let animationDelay = 30;

	$: valueLabelStrokeSafe = valueLabelStroke?.trim() ? valueLabelStroke.trim() : 'none';
	$: valueLabelStrokeWidthSafe = Number(valueLabelStrokeWidth) || 0;
	$: valueDivisorSafe = Number(valueDivisor) || 1;
	$: wheelZoomIntensitySafe = Number(wheelZoomIntensity) || 0.25;

	const parseDefaults = { data: [], warnings: [], errors: [] };

	let csvResult = parseDefaults;
	let externalText = '';
	let externalError = '';
	let externalLoading = false;
	let mounted = false;
	let refreshTimer;
	let lastFetchedAt = null;
	let lastRemoteUrl = '';

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
			console.error('ChartBar: erro ao buscar CSV remoto', error);
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
		? parseBarChartCsv(activeCsvText, { labelKey, valueKey })
		: parseDefaults;

	$: chartData = csvResult.data.length ? csvResult.data : data;
	$: hasErrors = csvResult.errors?.length > 0 || Boolean(externalError);
	$: warnings = [...(csvResult.warnings || [])];
</script>

<section class="chart-bar-block">
	{#if externalLoading}
		<div class="chart-bar-block__alert chart-bar-block__alert--info">
			<p>{externalStatusMessage()}</p>
		</div>
	{/if}

	{#if externalError}
		<div class="chart-bar-block__alert chart-bar-block__alert--error">
			<p>{externalError}</p>
		</div>
	{:else if hasErrors}
		<div class="chart-bar-block__alert chart-bar-block__alert--error">
			<p>
				Não foi possível processar alguns dados do CSV. Revise o conteúdo informado e tente
				novamente.
			</p>
		</div>
	{:else if warnings.length}
		<div class="chart-bar-block__alert chart-bar-block__alert--warning">
			<p>{warnings[0]}</p>
		</div>
	{:else if lastFetchedAt}
		<div class="chart-bar-block__alert chart-bar-block__alert--info">
			<p>{externalStatusMessage()}</p>
		</div>
	{/if}

	<BarChart
		{title}
		{titleTag}
		{titleColor}
		{description}
		{descriptionColor}
		data={chartData}
		{notes}
		{noteColor}
		{footnote}
		{footnoteColor}
		{sourceLabel}
		{sourceUrl}
		{sourceColor}
		{annotations}
		{annotationColor}
		{highlights}
		{highlightColor}
		{dimOpacity}
		{barColor}
		{tooltipEnabled}
		{tooltipShowOriginalValue}
		{valueLabelsMode}
		{valueLabelColor}
		valueLabelStroke={valueLabelStrokeSafe}
		valueLabelStrokeWidth={valueLabelStrokeWidthSafe}
		valueDivisor={valueDivisorSafe}
		{valueUnit}
		{height}
		{showGrid}
		{yTicks}
		{margin}
		{enableTransitions}
		{animationDuration}
		{animationDelay}
		{enableWheelZoom}
		wheelZoomIntensity={wheelZoomIntensitySafe}
		{enableBrush}
	/>
</section>

<style>
	.chart-bar-block {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
	}

	.chart-bar-block__alert {
		border-radius: 0.75rem;
		padding: 0.85rem 1.1rem;
		font-size: 0.9rem;
		line-height: 1.5;
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.chart-bar-block__alert--error {
		background: rgba(239, 68, 68, 0.12);
		color: #7f1d1d;
		border: 1px solid rgba(220, 38, 38, 0.35);
	}

	.chart-bar-block__alert--warning {
		background: rgba(245, 158, 11, 0.12);
		color: #92400e;
		border: 1px solid rgba(217, 119, 6, 0.35);
	}

	.chart-bar-block__alert--info {
		background: rgba(59, 130, 246, 0.12);
		color: #1d4ed8;
		border: 1px solid rgba(59, 130, 246, 0.25);
		font-size: 0.85rem;
	}
</style>
