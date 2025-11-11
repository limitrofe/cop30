<script>
	import { onDestroy, onMount } from 'svelte';
	import { extent, bisector, min, max } from 'd3-array';
	import { axisBottom, axisLeft } from 'd3-axis';
	import {
		line as shapeLine,
		area as shapeArea,
		curveLinear,
		curveMonotoneX,
		curveBasis,
		curveStep
	} from 'd3-shape';
	import { scaleLinear, scalePoint, scaleTime } from 'd3-scale';
	import { pointer, select } from 'd3-selection';
	import { zoomIdentity } from 'd3-zoom';
	import { createZoomManager } from '$lib/d3/zoomManager.js';
	import ChartFooter from './ChartFooter.svelte';
	import ChartHeader from './ChartHeader.svelte';

	const compactNumberFormatter = new Intl.NumberFormat(undefined, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
		notation: 'standard'
	});

	const preciseNumberFormatter = new Intl.NumberFormat(undefined, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 4,
		notation: 'standard'
	});

	const defaultDateFormatter = new Intl.DateTimeFormat(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});

	const formatNumeric = (value, formatter, fallback = '0') => {
		const numericValue = Number(value);
		return Number.isFinite(numericValue) ? formatter.format(numericValue) : fallback;
	};

	const toDisplayText = (value, fallback = '') => {
		if (value === null || value === undefined) return fallback;
		if (value instanceof Date) return defaultDateFormatter.format(value);
		if (typeof value === 'string') return value;
		if (typeof value === 'number' && Number.isFinite(value))
			return formatNumeric(value, compactNumberFormatter, fallback);
		return String(value);
	};

	const defaultValueFormatter = (value) => formatNumeric(value, compactNumberFormatter);
	const defaultOriginalValueFormatter = (value) => formatNumeric(value, preciseNumberFormatter);

	const defaultTooltipFormatter = (point, context = {}) => {
		const labelText = context.labelText ?? toDisplayText(point?.label ?? point?.x, 'Valor');
		const valueText =
			context.formattedValue ??
			defaultValueFormatter(context.scaledValue ?? point?.value ?? point?.y);
		const extra =
			context.showOriginal && context.originalValueText
				? `Valor real: ${context.originalValueText}`
				: undefined;
		return {
			label: labelText,
			value: valueText,
			extra
		};
	};

	const curveMap = {
		linear: curveLinear,
		monotone: curveMonotoneX,
		basis: curveBasis,
		step: curveStep
	};

	const clamp = (value, minValue, maxValue) => Math.min(Math.max(value, minValue), maxValue);

	const toNumber = (value, fallback = null) => {
		if (value === null || value === undefined || value === '') return fallback;
		const parsed = value instanceof Date ? value.getTime() : Number(value);
		return Number.isFinite(parsed) ? parsed : fallback;
	};

	const anchorWhitelist = new Set(['start', 'middle', 'end']);

	// --- PROPS ---
	/** @type {Array<Record<string, any>>} */
	export let data = [];
	export let xKey = 'x';
	export let yKey = 'y';
	export let yLowKey = 'yMin';
	export let yHighKey = 'yMax';
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
	export let height = 360;
	export let margin = { top: 40, right: 32, bottom: 64, left: 80 };

	// Styling & Appearance
	export let backgroundColor = '';
	export let fontFamily = 'inherit';
	export let fontSize = '0.85rem';
	export let lineColor = '#0ea5e9';
	export let lineWidth = 2.5;
	export let lineOpacity = 0.95;
	export let curveType = 'monotone'; // 'linear' | 'monotone' | 'basis' | 'step'
	export let showArea = true;
	export let areaColor = 'rgba(14, 165, 233, 0.18)';
	export let areaOpacity = 1;
	export let gradientStops = [];
	export let showGrid = true;
	export let showXAxis = true;
	export let showYAxis = true;
	export let gridColor = 'rgba(148, 163, 184, 0.25)';
	export let gridDashArray = '3,3';
	export let axisColor = 'var(--chart-axis, #475569)';
	export let axisLineColor = 'rgba(100, 116, 139, 0.5)';
	export let pointColor = '#0f172a';
	export let pointRadius = 3.5;
	export let pointStroke = '#fff';
	export let pointStrokeWidth = 1.5;
	export let showPoints = false;
	export let pointFocusRadius = 5.5;

	// Labels
	export let xAxisLabel = '';
	export let yAxisLabel = '';
	export let axisLabelColor = '';
	export let axisLabelFontSize = '0.78rem';
	export let axisLabelOffset = { x: 36, y: 42 };
	export let valueLabels = false;
	export let valueLabelColor = '';
	export let valueLabelAnchor = 'middle';

	// Formatting callbacks
	export let valueFormatter = (value, datum) => defaultValueFormatter(value ?? datum?.[yKey]);
	export let originalValueFormatter = (value) => defaultOriginalValueFormatter(value);
	export let xTickFormatter = (value) => toDisplayText(value);
	export let yTickFormatter = (value) => defaultValueFormatter(value);
	export let tooltipFormatter = (point, context) => defaultTooltipFormatter(point, context);
	export let tooltipShowOriginalValue = true;
	export let tooltipOffset = { x: 0, y: -16 };
	export let showTooltips = true;

	// Zoom & Interaction
	export let enableZoom = true;
	export let zoomMode = 'x'; // 'x' | 'y' | 'xy'
	export let zoomScaleExtent = { min: 1, max: 32 };
	export let enableCrosshair = true;

	// Animation
	export let enableTransitions = true;
	export let animationType = 'draw'; // 'draw' | 'fade' | 'none'
	export let animationDuration = 600;
	export let animationEasing = 'cubic-bezier(0.22, 1, 0.36, 1)';

	// Performance
	export let yDomainPadding = 0.08;
	export let yNice = true;
	export let maxXTicks = 8;
	export let maxYTicks = 6;

	// --- STATE ---
	let host;
	let svgNode;
	let xAxisNode;
	let yAxisNode;
	let resizeObserver;
	let prefersReducedMotion = false;
	let width = 0;
	let zoomManager;
	let zoomTransform = zoomIdentity;
	let zoomedXScale = null;
	let processedData = [];
	let linePathData = '';
	let areaPathData = '';
	let currentXScale = null;
	let currentYScale = null;
	let xScaleType = 'ordinal';
	let xDomain = [];
	let dataFingerprint = '';
	let lastAnimatedFingerprint = '';
	let hoveredPoint = null;
	let tooltipState = { visible: false, x: 0, y: 0, point: null };
	let yTicks = [];
	let suppressNextAnimation = false;

	const componentId = `line-chart-${Math.random().toString(36).slice(2, 9)}`;

	const bisectNumeric = bisector((d) => d.xNumeric);

	// --- LIFECYCLE ---
	onMount(() => {
		prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		if (host) {
			resizeObserver = new ResizeObserver((entries) => {
				if (!entries.length) return;
				suppressNextAnimation = true;
				width = entries[0].contentRect.width;
				requestAnimationFrame(() => {
					updateZoomExtent();
				});
			});
			resizeObserver.observe(host);
		}

		if (enableZoom && svgNode) {
			zoomManager = createZoomManager({
				svg: svgNode,
				getWidth: () => Math.max(0, innerWidth),
				getHeight: () => Math.max(0, innerHeight),
				createOriginalXScale: () => buildBaseXScale(),
				createOriginalYScale: () => buildYScale(),
				mode: zoomMode,
				scaleExtent: zoomScaleExtent,
				onTransform: ({ transform, xScale }) => {
					zoomTransform = transform;
					zoomedXScale = xScale;
					suppressNextAnimation = true;
				}
			});
		}

		return () => {
			resizeObserver?.disconnect();
			zoomManager?.destroy();
		};
	});

	onDestroy(() => {
		resizeObserver?.disconnect();
		zoomManager?.destroy();
	});

	// --- DERIVED DIMENSIONS ---
	$: computedMargin = {
		top: toNumber(margin?.top, 40),
		right: toNumber(margin?.right, 32),
		bottom: toNumber(margin?.bottom, 64),
		left: toNumber(margin?.left, 80)
	};

	$: innerWidth = Math.max(0, width - computedMargin.left - computedMargin.right);
	$: innerHeight = Math.max(0, height - computedMargin.top - computedMargin.bottom);

	$: axisOffsetX = toNumber(axisLabelOffset?.x, 36) ?? 36;
	$: axisOffsetY = toNumber(axisLabelOffset?.y, 42) ?? 42;

	// --- DATA NORMALIZATION ---
	$: normalizedData = Array.isArray(data) ? data : [];

	$: parsedData = normalizedData.map((item, index) => {
		const rawX = item?.[xKey];
		const parsedX = parseXValue(rawX);
		const yValue = toNumber(item?.[yKey], null);
		const yLow = toNumber(item?.[yLowKey], null);
		const yHigh = toNumber(item?.[yHighKey], null);
		return {
			original: item,
			index,
			rawX,
			parsedX,
			yValue,
			yLow,
			yHigh
		};
	});

	$: xScaleType = inferXScaleType(parsedData);
	$: xDomain = resolveXDomain(parsedData, xScaleType);
	$: processedData = buildProcessedSeries(parsedData, xScaleType, xDomain);
	$: hasData = processedData.length > 1 && innerWidth > 0 && innerHeight > 0;

	$: yDomain = resolveYDomain(processedData, yDomainPadding);
	$: baseXScale = buildBaseXScale();
	$: baseYScale = buildYScale();
	$: currentXScale = enableZoom && zoomedXScale ? zoomedXScale : baseXScale;
	$: currentYScale = baseYScale;

	$: {
		const allowAnimation = !suppressNextAnimation;
		updateVisualization(allowAnimation);
		suppressNextAnimation = false;
	}

	$: tooltipState = showTooltips ? tooltipState : { visible: false, x: 0, y: 0, point: null };

	// --- HELPERS ---
	function parseXValue(value) {
		if (value instanceof Date) return value;
		if (typeof value === 'number' && Number.isFinite(value)) return value;
		if (typeof value === 'string') {
			const trimmed = value.trim();
			if (!trimmed) return null;
			const numeric = Number(trimmed);
			if (Number.isFinite(numeric)) return numeric;
			const date = new Date(trimmed);
			if (!Number.isNaN(date.getTime())) return date;
			return trimmed;
		}
		return value ?? null;
	}

	function inferXScaleType(entries) {
		if (!entries.length) return 'ordinal';
		const allDates = entries.every((entry) => entry.parsedX instanceof Date);
		if (allDates) return 'time';
		const allNumbers = entries.every((entry) => typeof entry.parsedX === 'number');
		if (allNumbers) return 'linear';
		return 'ordinal';
	}

	function resolveXDomain(entries, type) {
		if (!entries.length) return [];
		if (type === 'time') {
			const values = entries.map((entry) => entry.parsedX).filter((value) => value instanceof Date);
			const domain = extent(values);
			if (!domain || !domain[0] || !domain[1]) {
				const now = new Date();
				return [now, new Date(now.getTime() + 24 * 60 * 60 * 1000)];
			}
			if (domain[0].getTime() === domain[1].getTime()) {
				const base = domain[0].getTime();
				return [new Date(base - 12 * 60 * 60 * 1000), new Date(base + 12 * 60 * 60 * 1000)];
			}
			return domain;
		}
		if (type === 'linear') {
			const values = entries
				.map((entry) => entry.parsedX)
				.filter((value) => typeof value === 'number');
			const domain = extent(values);
			if (!domain || !Number.isFinite(domain[0]) || !Number.isFinite(domain[1])) {
				return [0, 1];
			}
			if (domain[0] === domain[1]) {
				const base = domain[0];
				const offset = Math.abs(base || 1) * 0.05;
				return [base - offset, base + offset];
			}
			return domain;
		}
		const categories = new Set();
		for (const entry of entries) {
			if (entry.parsedX === null || entry.parsedX === undefined || entry.parsedX === '')
				categories.add(String(entry.index));
			else categories.add(String(entry.parsedX));
		}
		return Array.from(categories);
	}

	function buildProcessedSeries(entries, type, domain) {
		const result = [];
		for (const entry of entries) {
			if (!Number.isFinite(entry.yValue)) continue;
			let xValue;
			let xNumeric;
			let labelText;
			if (type === 'time') {
				xValue = entry.parsedX instanceof Date ? entry.parsedX : new Date(entry.parsedX ?? 0);
				xNumeric = xValue instanceof Date ? xValue.getTime() : toNumber(xValue, entry.index);
				labelText = entry.rawX ?? xValue;
			} else if (type === 'linear') {
				xValue = typeof entry.parsedX === 'number' ? entry.parsedX : entry.index;
				xNumeric = Number(xValue);
				labelText = entry.rawX ?? xValue;
			} else {
				const fallback = String(entry.index);
				const ordinalValue =
					entry.parsedX === null || entry.parsedX === undefined || entry.parsedX === ''
						? fallback
						: String(entry.parsedX);
				xValue = ordinalValue;
				xNumeric = entry.index;
				labelText = ordinalValue;
			}

			const yLow = Number.isFinite(entry.yLow) ? entry.yLow : null;
			const yHigh = Number.isFinite(entry.yHigh) ? entry.yHigh : null;

			result.push({
				index: entry.index,
				xValue,
				xNumeric,
				label: labelText,
				yValue: entry.yValue,
				yLow,
				yHigh,
				original: entry.original
			});
		}
		if (type === 'ordinal') {
			return result.sort((a, b) => {
				const domainIndexA = domain.indexOf(a.xValue);
				const domainIndexB = domain.indexOf(b.xValue);
				return domainIndexA - domainIndexB;
			});
		}
		return result.sort((a, b) => a.xNumeric - b.xNumeric);
	}

	function resolveYDomain(entries, paddingRatio) {
		if (!entries.length) return [0, 1];
		const lows = entries.map((entry) => (Number.isFinite(entry.yLow) ? entry.yLow : entry.yValue));
		const highs = entries.map((entry) =>
			Number.isFinite(entry.yHigh) ? entry.yHigh : entry.yValue
		);
		const minValue = min(lows) ?? 0;
		const maxValue = max(highs) ?? 1;
		if (minValue === maxValue) {
			const offset = Math.abs(minValue || 1) * 0.05;
			return [minValue - offset, maxValue + offset];
		}
		const delta = Math.abs(maxValue - minValue);
		const padding = delta * (Number.isFinite(paddingRatio) ? paddingRatio : 0.08);
		return [minValue - padding, maxValue + padding];
	}

	function buildBaseXScale() {
		if (!hasData || innerWidth <= 0) return null;
		if (xScaleType === 'time') {
			return scaleTime().domain(xDomain).range([0, innerWidth]);
		}
		if (xScaleType === 'linear') {
			return scaleLinear().domain(xDomain).range([0, innerWidth]);
		}
		return scalePoint().domain(xDomain).range([0, innerWidth]).padding(0.5);
	}

	function buildYScale() {
		if (!hasData || innerHeight <= 0) return null;
		const scale = scaleLinear().domain(yDomain).range([innerHeight, 0]);
		return yNice ? scale.nice() : scale;
	}

	function resolveCurve(type) {
		const normalized = String(type ?? '').toLowerCase();
		return curveMap[normalized] ?? curveMap.monotone;
	}

	function getValueForTooltip(point) {
		if (!point) return null;
		const scaledValue = point.yValue;
		const originalValueText = tooltipShowOriginalValue
			? originalValueFormatter(point.original?.[yKey] ?? point.yValue)
			: undefined;
		return tooltipFormatter(point, {
			scaledValue,
			labelText: toDisplayText(point.label),
			formattedValue: valueFormatter(point.yValue, point.original),
			showOriginal: tooltipShowOriginalValue,
			originalValueText
		});
	}

	function updateZoomExtent() {
		if (!zoomManager) return;
		zoomManager.updateExtent();
		zoomManager.updateScales();
	}

	function updateAxes() {
		if (!hasData || !currentXScale || !currentYScale) return;
		if (showXAxis && xAxisNode) {
			const xTicksCount =
				typeof maxXTicks === 'number' && maxXTicks > 0
					? maxXTicks
					: Math.max(3, Math.floor(innerWidth / 120));
			const axis = axisBottom(currentXScale).ticks(xTicksCount).tickFormat(xTickFormatter);
			select(xAxisNode).call(axis);
			select(xAxisNode).selectAll('text').style('fill', axisColor).style('font-size', fontSize);
			select(xAxisNode).selectAll('line').style('stroke', axisLineColor);
			select(xAxisNode).selectAll('path').style('stroke', axisLineColor);
		}
		if (showYAxis && yAxisNode) {
			const yTicksCount =
				typeof maxYTicks === 'number' && maxYTicks > 0
					? maxYTicks
					: Math.max(4, Math.floor(innerHeight / 80));
			const axis = axisLeft(currentYScale).ticks(yTicksCount).tickFormat(yTickFormatter);
			select(yAxisNode).call(axis);
			select(yAxisNode).selectAll('text').style('fill', axisColor).style('font-size', fontSize);
			select(yAxisNode).selectAll('line').style('stroke', axisLineColor);
			select(yAxisNode).selectAll('path').style('stroke', axisLineColor);
			yTicks = currentYScale.ticks ? currentYScale.ticks(yTicksCount) : currentYScale.domain();
		}
	}

	function buildPaths() {
		if (!hasData || !currentXScale || !currentYScale) {
			linePathData = '';
			areaPathData = '';
			return;
		}
		const definedPoints = processedData.filter((point) => Number.isFinite(point.yValue));
		const lineGenerator = shapeLine()
			.x((point) => currentXScale(point.xValue))
			.y((point) => currentYScale(point.yValue))
			.curve(resolveCurve(curveType));

		const areaGenerator = shapeArea()
			.x((point) => currentXScale(point.xValue))
			.y0((point) => currentYScale(Number.isFinite(point.yLow) ? point.yLow : point.yValue))
			.y1((point) => currentYScale(Number.isFinite(point.yHigh) ? point.yHigh : point.yValue))
			.curve(resolveCurve(curveType));

		linePathData = definedPoints.length > 1 ? (lineGenerator(definedPoints) ?? '') : '';
		areaPathData = showArea && definedPoints.length > 1 ? (areaGenerator(definedPoints) ?? '') : '';
	}

	function fingerprintData() {
		if (!processedData.length) return '';
		return processedData
			.slice(0, 1024)
			.map((point) => `${point.xNumeric}:${point.yValue}`)
			.join('|');
	}

	function maybeAnimate(lineElement, areaElement) {
		if (!enableTransitions || prefersReducedMotion) return;
		if (!lineElement || !linePathData) return;
		if (animationType === 'none') return;
		if (dataFingerprint === lastAnimatedFingerprint) return;
		const duration = clamp(Number(animationDuration) || 0, 0, 5000);
		if (animationType === 'draw') {
			const length = lineElement.getTotalLength?.() ?? 0;
			if (length > 0) {
				lineElement.style.transition = 'none';
				lineElement.style.strokeDasharray = `${length} ${length}`;
				lineElement.style.strokeDashoffset = String(length);
				// Force reflow
				lineElement.getBoundingClientRect();
				lineElement.style.transition = `stroke-dashoffset ${duration}ms ${animationEasing}`;
				lineElement.style.strokeDashoffset = '0';
				lineElement.style.opacity = '1';
				const handleTransitionEnd = () => {
					lineElement.style.transition = '';
					lineElement.style.strokeDasharray = '';
					lineElement.style.strokeDashoffset = '';
					lineElement.removeEventListener('transitionend', handleTransitionEnd);
				};
				lineElement.addEventListener('transitionend', handleTransitionEnd);
			}
			if (areaElement && areaPathData) {
				areaElement.style.opacity = '0';
				areaElement.style.transition = `opacity ${duration}ms ${animationEasing}`;
				requestAnimationFrame(() => {
					areaElement.style.opacity = '1';
				});
				const clearArea = () => {
					areaElement.style.transition = '';
					areaElement.removeEventListener('transitionend', clearArea);
				};
				areaElement.addEventListener('transitionend', clearArea);
			}
		} else if (animationType === 'fade') {
			lineElement.style.opacity = '0';
			lineElement.style.transition = `opacity ${duration}ms ${animationEasing}`;
			requestAnimationFrame(() => {
				lineElement.style.opacity = '1';
			});
			const clearLine = () => {
				lineElement.style.transition = '';
				lineElement.removeEventListener('transitionend', clearLine);
			};
			lineElement.addEventListener('transitionend', clearLine);
			if (areaElement && areaPathData) {
				areaElement.style.opacity = '0';
				areaElement.style.transition = `opacity ${duration}ms ${animationEasing}`;
				requestAnimationFrame(() => {
					areaElement.style.opacity = '1';
				});
				const clearAreaFade = () => {
					areaElement.style.transition = '';
					areaElement.removeEventListener('transitionend', clearAreaFade);
				};
				areaElement.addEventListener('transitionend', clearAreaFade);
			}
		}
		lastAnimatedFingerprint = dataFingerprint;
	}

	function updateVisualization(animate = true) {
		buildPaths();
		updateAxes();
		dataFingerprint = fingerprintData();
		if (animate && svgNode) {
			const lineElement = svgNode.querySelector('.line-chart__path');
			const areaElement = svgNode.querySelector('.line-chart__area');
			maybeAnimate(lineElement, areaElement);
		}
	}

	function findNearestPoint(event) {
		if (!hasData || !currentXScale) return null;
		const svgPoint = pointer(event, svgNode);
		const xPosition = clamp(svgPoint[0] - computedMargin.left, 0, innerWidth);
		if (xScaleType === 'ordinal') {
			let best = null;
			let minDistance = Infinity;
			for (const point of processedData) {
				const pos = currentXScale(point.xValue);
				if (!Number.isFinite(pos)) continue;
				const distance = Math.abs(pos - xPosition);
				if (distance < minDistance) {
					minDistance = distance;
					best = point;
				}
			}
			return best ?? null;
		}
		if (typeof currentXScale.invert !== 'function') {
			return null;
		}
		const inverted = currentXScale.invert(xPosition);
		const numericValue =
			xScaleType === 'time'
				? inverted instanceof Date
					? inverted.getTime()
					: Number(inverted)
				: Number(inverted);
		if (!Number.isFinite(numericValue)) return null;
		const index = bisectNumeric.center(processedData, numericValue);
		return processedData[clamp(index, 0, processedData.length - 1)];
	}

	function handlePointerMove(event) {
		if (!showTooltips) return;
		const nearest = findNearestPoint(event);
		if (!nearest) {
			handlePointerLeave();
			return;
		}
		hoveredPoint = nearest;
		const containerRect = host?.getBoundingClientRect();
		if (!containerRect) return;
		const clientX = event.clientX;
		const clientY = event.clientY;
		const x = clientX - containerRect.left + tooltipOffset.x;
		const y = clientY - containerRect.top + tooltipOffset.y;
		tooltipState = {
			visible: true,
			x,
			y,
			point: nearest
		};
	}

	function handlePointerLeave() {
		hoveredPoint = null;
		tooltipState = { visible: false, x: 0, y: 0, point: null };
	}

	function getValueLabel(point) {
		return valueFormatter(point.yValue, point.original);
	}

	$: hoveredX = hoveredPoint && currentXScale ? currentXScale(hoveredPoint.xValue) : null;
	$: hoveredY = hoveredPoint && currentYScale ? currentYScale(hoveredPoint.yValue) : null;
	$: tooltipContent = getValueForTooltip(hoveredPoint);
	$: resolvedValueLabelAnchor = anchorWhitelist.has(valueLabelAnchor) ? valueLabelAnchor : 'middle';
</script>

<figure
	class="line-chart"
	data-component-id={componentId}
	style={`background:${backgroundColor || 'transparent'}; font-family:${fontFamily}; font-size:${fontSize}; --chart-axis-label-size:${axisLabelFontSize};`}
>
	<ChartHeader
		{title}
		{titleTag}
		{titleColor}
		{description}
		{descriptionColor}
		{notes}
		{noteColor}
	/>

	<div
		class="line-chart__container"
		style={`height:${height}px;`}
		bind:this={host}
		on:pointermove={handlePointerMove}
		on:pointerenter={handlePointerMove}
		on:pointerleave={handlePointerLeave}
	>
		{#if hasData}
			<svg
				bind:this={svgNode}
				width="100%"
				{height}
				role="img"
				aria-label={title ? `${title} - gráfico de linha` : 'Gráfico de linha'}
			>
				<defs>
					{#if gradientStops.length}
						<linearGradient
							id={`${componentId}-line-gradient`}
							gradientUnits="userSpaceOnUse"
							x1="0"
							x2="0"
							y1="0"
							y2={innerHeight}
						>
							{#each gradientStops as stop, index}
								<stop
									offset={stop.offset ??
										`${(index / Math.max(1, gradientStops.length - 1)) * 100}%`}
									stop-color={stop.color ?? lineColor}
									stop-opacity={stop.opacity ?? 1}
								/>
							{/each}
						</linearGradient>
					{/if}
				</defs>

				<g transform={`translate(${computedMargin.left},${computedMargin.top})`}>
					{#if showGrid && yTicks.length}
						<g class="line-chart__grid">
							{#each yTicks as tick}
								<line
									x1="0"
									x2={innerWidth}
									y1={currentYScale(tick)}
									y2={currentYScale(tick)}
									style={`stroke:${gridColor}; stroke-dasharray:${gridDashArray};`}
								/>
							{/each}
						</g>
					{/if}

					{#if areaPathData}
						<path
							class="line-chart__area"
							d={areaPathData}
							fill={gradientStops.length ? `url(#${componentId}-line-gradient)` : areaColor}
							fill-opacity={areaOpacity}
						/>
					{/if}

					{#if linePathData}
						<path
							class="line-chart__path"
							d={linePathData}
							fill="none"
							stroke={gradientStops.length ? `url(#${componentId}-line-gradient)` : lineColor}
							stroke-width={lineWidth}
							stroke-opacity={lineOpacity}
						/>
					{/if}

					{#if showPoints}
						{#each processedData as point (point.index)}
							<circle
								class="line-chart__point"
								cx={currentXScale(point.xValue)}
								cy={currentYScale(point.yValue)}
								r={hoveredPoint?.index === point.index ? pointFocusRadius : pointRadius}
								fill={pointColor}
								stroke={pointStroke}
								stroke-width={pointStrokeWidth}
							/>
						{/each}
					{/if}

					{#if valueLabels}
						{#each processedData as point (point.index)}
							<text
								class="line-chart__value-label"
								x={currentXScale(point.xValue)}
								y={currentYScale(point.yValue) - 8}
								text-anchor={resolvedValueLabelAnchor}
								fill={valueLabelColor || pointColor}
							>
								{getValueLabel(point)}
							</text>
						{/each}
					{/if}

					{#if showXAxis}
						<g
							bind:this={xAxisNode}
							class="line-chart__axis line-chart__axis--x"
							transform={`translate(0, ${innerHeight})`}
						/>
					{/if}

					{#if showYAxis}
						<g bind:this={yAxisNode} class="line-chart__axis line-chart__axis--y" />
					{/if}

					{#if xAxisLabel}
						<text
							class="line-chart__axis-label line-chart__axis-label--x"
							x={innerWidth / 2}
							y={innerHeight + axisOffsetY}
							fill={axisLabelColor || axisColor}
						>
							{xAxisLabel}
						</text>
					{/if}

					{#if yAxisLabel}
						<text
							class="line-chart__axis-label line-chart__axis-label--y"
							x={-axisOffsetX}
							y={innerHeight / 2}
							fill={axisLabelColor || axisColor}
							transform="rotate(-90)"
						>
							{yAxisLabel}
						</text>
					{/if}

					{#if enableCrosshair && hoveredPoint && hoveredX !== null}
						<g class="line-chart__crosshair">
							<line
								x1={hoveredX}
								x2={hoveredX}
								y1="0"
								y2={innerHeight}
								stroke={lineColor}
								stroke-opacity="0.35"
								stroke-width="1"
								stroke-dasharray="4,4"
							/>
							{#if hoveredY !== null}
								<circle
									cx={hoveredX}
									cy={hoveredY}
									r={pointFocusRadius + 1.5}
									fill="#fff"
									stroke={lineColor}
									stroke-width="2"
								/>
							{/if}
						</g>
					{/if}
				</g>
			</svg>

			{#if showTooltips && tooltipState.visible && tooltipState.point && tooltipContent}
				<div
					class="line-chart__tooltip"
					style={`left:${tooltipState.x}px; top:${tooltipState.y}px;`}
				>
					<span class="line-chart__tooltip-label">{tooltipContent.label}</span>
					<span class="line-chart__tooltip-value">{tooltipContent.value}</span>
					{#if tooltipContent.extra}
						<span class="line-chart__tooltip-extra">{tooltipContent.extra}</span>
					{/if}
				</div>
			{/if}
		{:else}
			<div class="line-chart__empty">
				<p>Não há dados suficientes para exibir o gráfico.</p>
			</div>
		{/if}
	</div>

	<ChartFooter {sourceLabel} {sourceUrl} {sourceColor} {footnote} {footnoteColor} />
</figure>

<style>
	:global(:where(.line-chart *)) {
		font-family: inherit;
	}

	.line-chart {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		width: 100%;
		color: var(--chart-foreground, #0f172a);
	}

	.line-chart__container {
		position: relative;
		width: 100%;
		min-height: 280px;
	}

	.line-chart__grid line {
		stroke-linecap: round;
	}

	.line-chart__path {
		pointer-events: none;
	}

	.line-chart__area {
		pointer-events: none;
	}

	.line-chart__point {
		transition:
			r 140ms ease,
			fill 160ms ease,
			stroke 160ms ease;
	}

	.line-chart__axis text {
		fill: var(--chart-axis, #475569);
	}

	.line-chart__axis path,
	.line-chart__axis line {
		stroke: var(--chart-axis-line, rgba(100, 116, 139, 0.45));
	}

	.line-chart__axis-label {
		font-weight: 500;
		text-transform: none;
		font-size: var(--chart-axis-label-size, 0.78rem);
	}

	.line-chart__axis-label--x {
		text-anchor: middle;
	}

	.line-chart__axis-label--y {
		text-anchor: middle;
	}

	.line-chart__tooltip {
		position: absolute;
		z-index: 40;
		min-width: 140px;
		max-width: 240px;
		padding: 0.6rem 0.75rem;
		border-radius: 0.75rem;
		background: var(--chart-tooltip-bg, rgba(15, 23, 42, 0.92));
		color: var(--chart-tooltip-fg, #f8fafc);
		font-size: 0.78rem;
		line-height: 1.45;
		transform: translate(-50%, calc(-100% - 12px));
		pointer-events: none;
		box-shadow: 0 14px 28px rgba(15, 23, 42, 0.22);
	}

	.line-chart__tooltip::after {
		content: '';
		position: absolute;
		width: 12px;
		height: 12px;
		left: 50%;
		top: 100%;
		transform: translate(-50%, -6px) rotate(45deg);
		background: inherit;
		box-shadow: inherit;
	}

	.line-chart__tooltip-label {
		display: block;
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	.line-chart__tooltip-value {
		display: block;
		font-weight: 500;
	}

	.line-chart__tooltip-extra {
		display: block;
		margin-top: 0.35rem;
		font-size: 0.72rem;
		opacity: 0.85;
	}

	.line-chart__crosshair line {
		pointer-events: none;
	}

	.line-chart__crosshair circle {
		pointer-events: none;
	}

	.line-chart__value-label {
		font-size: 0.72rem;
		font-weight: 600;
		paint-order: stroke;
		stroke: #fff;
		stroke-width: 2px;
	}

	.line-chart__empty {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		color: var(--chart-muted, #64748b);
		font-size: 0.9rem;
		text-align: center;
		padding: 1rem;
	}

	@media (max-width: 640px) {
		.line-chart__container {
			min-height: 220px;
		}

		.line-chart__tooltip {
			min-width: 120px;
			max-width: 200px;
		}
	}
</style>
