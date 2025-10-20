<script>
	import { onDestroy, onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import { cubicOut } from 'svelte/easing';
	import { max } from 'd3-array';
	import { scaleBand, scaleLinear } from 'd3-scale';
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

	const formatNumeric = (value, formatter, fallback = '0') => {
		const numericValue = Number(value);
		return Number.isFinite(numericValue) ? formatter.format(numericValue) : fallback;
	};

	const toDisplayText = (value, fallback = '') => {
		if (value === null || value === undefined) return fallback;
		if (typeof value === 'string') return value;
		if (typeof value === 'number' && Number.isFinite(value))
			return formatNumeric(value, compactNumberFormatter, fallback);
		return String(value);
	};

	const defaultValueFormatter = (value) => formatNumeric(value, compactNumberFormatter);
	const defaultOriginalValueFormatter = (value) => formatNumeric(value, preciseNumberFormatter);

	const defaultTooltipFormatter = (item, context = {}) => {
		const formattedValueText =
			toDisplayText(context.formattedValue) ||
			defaultValueFormatter(context.scaledValue ?? item.value);
		const valueText = formattedValueText.trim();
		const extraText =
			context.showOriginal && context.originalValueText
				? `Valor real: ${context.originalValueText}`
				: undefined;
		return {
			label: item.label,
			value: valueText,
			extra: extraText
		};
	};

	// --- PROPS ---
	/** @type {import('$lib/utils/chartData.js').BarDatum[]} */
	export let data = [];
	export let height = 360;
	export let margin = { top: 32, right: 24, bottom: 56, left: 72 };

	// Content Props
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

	// Style & Interaction Props
	export let barColor = '#0ea5e9';
	export let highlightColor = '#facc15';
	export let highlights = [];
	export let dimOpacity = 0.35;
	export let barRadius = 6;
	export let showGrid = true;
	export let annotations = [];
	export let annotationColor = '';
	export let yTicks = 4;
	export let valueFormatter = (value) => defaultValueFormatter(value);
	export let valueLabelsMode = 'hover'; // 'hover' | 'always' | 'never'
	export let valueLabelColor = '';
	export let valueLabelStroke = 'none';
	export let valueLabelStrokeWidth = 0;
	export let valueDivisor = 1;
	export let valueUnit = '';
	export let originalValueFormatter = (value) => defaultOriginalValueFormatter(value);
	export let showTooltips = true;
	export let tooltipOffset = { x: 0, y: -16 };
	export let tooltipFormatter = (item, context) => defaultTooltipFormatter(item, context);
	export let tooltipShowOriginalValue = true;
	export let enableWheelZoom = false;
	export let wheelZoomIntensity = 0.25;
	export let enableBrush = false;

	// Animation Props
	export let enableTransitions = true;
	export let animationType = 'flip'; // 'flip' | 'fade' | 'scale' | 'none'
	export let animationDuration = 450;
	export let animationDelay = 30;
	export let animationEasing = cubicOut;
	export let animationEasingCss = 'cubic-bezier(0.22, 1, 0.36, 1)';

	// --- STATE ---
	let host;
	let width = 0;
	let resizeObserver;
	let prefersReducedMotion = false;
	let hoveredLabel = null;
	let tooltipState = { visible: false, x: 0, y: 0, item: null };
	let brushSelection = null;
	let brushOverlay = null;
	let isBrushing = false;
	let brushStartBaseX = 0;
	let svgNode;
	let zoomManager;
	let zoomTransform = zoomIdentity;
	let resolvedData = [];
	let chartData = [];
	let activeSelectionLabels = null;
	let scaledData = [];
	let barGeometries = [];

	const componentId = `bar-chart-${Math.random().toString(36).slice(2, 10)}`;

	// --- UTILITY FUNCTIONS ---
	const toNumber = (value, fallback) => {
		if (value === null || value === undefined || value === '') return fallback;
		const parsed = typeof value === 'string' ? Number.parseFloat(value) : value;
		return Number.isFinite(parsed) ? parsed : fallback;
	};

	function normalizeHighlights(value) {
		return (Array.isArray(value) ? value : [value]).map(String);
	}

	function normalizeAnnotations(value) {
		if (!value) return [];
		if (Array.isArray(value)) return value;
		if (typeof value === 'string') {
			const trimmed = value.trim();
			if (!trimmed) return [];
			try {
				const parsed = JSON.parse(trimmed);
				if (Array.isArray(parsed)) return parsed;
				if (parsed && typeof parsed === 'object') return [parsed];
			} catch (error) {
				return trimmed
					.split(/\r?\n/)
					.map((line) => line.trim())
					.filter(Boolean)
					.map((entry) => {
						const [label, ...rest] = entry.split('::');
						return { label: label?.trim(), text: rest.join('::').trim() };
					})
					.filter((ann) => ann.label && ann.text);
			}
		}
		return [];
	}

	const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
	const normalizeAnimationType = (type) => {
		const value = String(type ?? '').toLowerCase();
		return ['flip', 'fade', 'scale', 'none'].includes(value) ? value : 'flip';
	};

	// --- REACTIVE COMPUTATIONS ---
	$: resolvedData = Array.isArray(data) ? data : [];
	$: activeSelectionLabels = brushSelection ? [...brushSelection] : null;
	$: chartData = activeSelectionLabels
		? resolvedData.filter((item) => activeSelectionLabels.includes(item.label))
		: resolvedData;
	$: hasBaseData = resolvedData.length > 0;
	$: hasData = chartData.length > 0;
	$: valueDivisorNumber = Math.max(1, toNumber(valueDivisor, 1)) || 1;
	$: valueUnitText = typeof valueUnit === 'string' ? valueUnit.trim() : '';
	$: scaledData = chartData.map((item) => {
		const numericValue = Number(item?.value);
		const scaledValue = Number.isFinite(numericValue) ? numericValue / valueDivisorNumber : 0;
		return { ...item, scaledValue };
	});
	$: maxScaledValue = max(scaledData, (d) => d.scaledValue) ?? 0;
	$: if (!enableBrush && brushSelection) {
		brushSelection = null;
		brushOverlay = null;
	}

	$: computedMargin = {
		top: toNumber(margin?.top, 32),
		right: toNumber(margin?.right, 24),
		bottom: toNumber(margin?.bottom, 56),
		left: toNumber(margin?.left, 72)
	};

	$: normalizedHighlights = normalizeHighlights(highlights);
	$: highlightSet = new Set(normalizedHighlights);
	$: normalizedAnnotations = normalizeAnnotations(annotations);
	$: annotationMap = new Map(
		normalizedAnnotations.filter((ann) => ann?.label && ann?.text).map((ann) => [ann.label, ann])
	);
	$: labelMode = ['hover', 'always', 'never'].includes(String(valueLabelsMode || '').toLowerCase())
		? valueLabelsMode
		: 'hover';
	$: normalizedAnimation = normalizeAnimationType(animationType);
	$: valueLabelStrokeColor =
		typeof valueLabelStroke === 'string' && valueLabelStroke.trim()
			? valueLabelStroke.trim()
			: 'none';
	$: valueLabelStrokeWidthPx =
		valueLabelStrokeColor === 'none' ? 0 : Math.max(0, Number(valueLabelStrokeWidth) || 0);

	$: allCategories = scaledData?.map((d) => d.label) ?? [];
	$: safeWidth = Math.max(width, 200);
	$: innerWidth = Math.max(safeWidth - computedMargin.left - computedMargin.right, 0);
	$: innerHeight = Math.max(height - computedMargin.top - computedMargin.bottom, 0);
	$: if (hoveredLabel && !chartData.some((d) => d.label === hoveredLabel)) {
		hoveredLabel = null;
	}
	$: if ((!showTooltips || !hasData) && tooltipState.visible) {
		tooltipState = { visible: false, x: 0, y: 0, item: null };
	}

	// --- SCALES ---
	$: xScale = scaleBand()
		.domain(allCategories)
		.range([computedMargin.left, computedMargin.left + innerWidth])
		.paddingInner(allCategories.length > 100 ? 0.1 : 0.2)
		.paddingOuter(0.1);

	$: yScale = scaleLinear()
		.domain([0, maxScaledValue > 0 ? maxScaledValue * 1.1 : 1])
		.nice(yTicks)
		.range([computedMargin.top + innerHeight, computedMargin.top]);

	$: yAxisTicks = yScale.ticks(yTicks);

	// --- GEOMETRIES ---
	$: barGeometries = scaledData.map((item) => {
		const x = xScale(item.label) ?? 0;
		const numericalScaledValue = Number.isFinite(item.scaledValue) ? item.scaledValue : 0;
		const y = yScale(numericalScaledValue);
		const bandwidth = xScale.bandwidth();
		return {
			label: item.label,
			scaledValue: numericalScaledValue,
			originalValue: item.value,
			x,
			y,
			width: bandwidth,
			height: computedMargin.top + innerHeight - y,
			centerX: x + bandwidth / 2
		};
	});

	$: barGeometryMap = new Map(barGeometries.map((geo) => [geo.label, geo]));
	$: barSeries = chartData
		.map((item) => {
			const geo = barGeometryMap.get(item.label);
			if (!geo) return null;
			return {
				item,
				geo,
				scaledValue: geo.scaledValue
			};
		})
		.filter(Boolean);
	$: zoomScaleExtentMax = (() => {
		const numeric = Number(wheelZoomIntensity);
		if (!Number.isFinite(numeric) || numeric <= 0) return 8;
		return Math.max(2, 1 + numeric * 12);
	})();
	$: zoomShouldBeEnabled =
		enableWheelZoom && svgNode && hasData && innerWidth > 0 && innerHeight > 0;
	$: {
		if (zoomShouldBeEnabled) {
			const createLinearXScale = () =>
				scaleLinear()
					.domain([computedMargin.left, computedMargin.left + innerWidth])
					.range([computedMargin.left, computedMargin.left + innerWidth]);
			const translateExtent = [
				[computedMargin.left, computedMargin.top],
				[computedMargin.left + innerWidth, computedMargin.top + innerHeight]
			];
			if (!zoomManager) {
				zoomManager = createZoomManager({
					svg: svgNode,
					getWidth: () => safeWidth,
					getHeight: () => height,
					createOriginalXScale: createLinearXScale,
					onTransform: ({ transform }) => {
						zoomTransform = transform;
					},
					scaleExtent: { min: 1, max: zoomScaleExtentMax },
					translateExtent,
					mode: 'x'
				});
				zoomTransform = zoomManager.getTransform?.() ?? zoomIdentity;
			} else {
				zoomManager.updateScales();
				zoomManager.updateExtent();
			}
		} else if (zoomManager) {
			zoomManager.destroy();
			zoomManager = null;
			zoomTransform = zoomIdentity;
		}
	}

	$: zoomTransformString = zoomTransform
		? `translate(${zoomTransform.x},0) scale(${zoomTransform.k},1)`
		: undefined;

	$: annotationOverlays = normalizedAnnotations
		.map((annotation) => {
			const geo = barGeometryMap.get(annotation.label);
			if (!geo) return null;
			const offsetX = toNumber(annotation.offsetX, 0);
			const offsetY = toNumber(annotation.offsetY, -18);
			const drawCenterX = zoomTransform ? zoomTransform.applyX(geo.centerX) : geo.centerX;
			return {
				...annotation,
				x: drawCenterX + offsetX,
				y: geo.y + offsetY,
				color: annotation.color || annotationColor || '#0f172a'
			};
		})
		.filter(Boolean);

	$: animationDurationMs = Math.max(0, Number(animationDuration) || 0);
	$: animationDelayMs = Math.max(0, Number(animationDelay) || 0);
	$: animationEasingCurve =
		typeof animationEasingCss === 'string' && animationEasingCss.trim()
			? animationEasingCss.trim()
			: 'cubic-bezier(0.22, 1, 0.36, 1)';
	$: svgViewBox = `0 0 ${safeWidth} ${height}`;
	$: descriptionId = description ? `${componentId}-description` : undefined;
	$: transitionsEnabled = enableTransitions && !prefersReducedMotion;
	$: useFlipAnimation = transitionsEnabled && normalizedAnimation === 'flip';
	$: useFadeAnimation = transitionsEnabled && normalizedAnimation === 'fade';
	$: useScaleAnimation = transitionsEnabled && normalizedAnimation === 'scale';
	$: barAnimationClass =
		normalizedAnimation === 'fade'
			? 'bar-chart__bar-group--fade'
			: normalizedAnimation === 'scale'
				? 'bar-chart__bar-group--scale'
				: '';

	// --- LIFECYCLE ---
	onMount(() => {
		const cleanups = [];
		if (typeof ResizeObserver !== 'undefined') {
			resizeObserver = new ResizeObserver((entries) => {
				width = entries[0]?.contentRect.width ?? 0;
			});
			if (host) {
				resizeObserver.observe(host);
				width = host.clientWidth;
			}
			cleanups.push(() => resizeObserver?.disconnect());
		} else {
			width = host?.clientWidth ?? 0;
		}

		if (typeof window !== 'undefined') {
			const media = window.matchMedia('(prefers-reduced-motion: reduce)');
			prefersReducedMotion = media.matches;
			const handleChange = (event) => (prefersReducedMotion = event.matches);
			media.addEventListener('change', handleChange);
			cleanups.push(() => media.removeEventListener('change', handleChange));
		}

		return () => cleanups.forEach((c) => c?.());
	});

	// --- EVENT HANDLERS & HELPERS ---
	function getBarFill(item) {
		const annotation = annotationMap.get(item.label);
		if (annotation?.color) return annotation.color;
		if (highlightSet.size) {
			return highlightSet.has(item.label) ? highlightColor : barColor;
		}
		return barColor;
	}

	function getBarOpacity(item) {
		if (highlightSet.size && !highlightSet.has(item.label)) return dimOpacity;
		if (hoveredLabel && hoveredLabel !== item.label && labelMode === 'hover') return 0.6;
		return 1;
	}

	function shouldShowValueLabel(label) {
		if (labelMode === 'never') return false;
		if (labelMode === 'always') return true;
		return hoveredLabel === label;
	}

	function getValueLabelPosition(item) {
		const geo = barGeometryMap.get(item.label);
		if (!geo) return { x: 0, y: 0 };
		return { x: geo.centerX, y: Math.max(geo.y - 8, 12) };
	}

	function formatDisplayValue(value, item, { includeUnit = true } = {}) {
		const context = {
			value,
			item,
			divisor: valueDivisorNumber,
			unit: valueUnitText
		};
		let result;
		if (typeof valueFormatter === 'function') {
			result = valueFormatter(value, context);
		}
		let text = toDisplayText(result);
		if (!text) {
			text = defaultValueFormatter(value);
		}
		text = text.trim();
		if (includeUnit && valueUnitText) {
			const lowerText = text.toLowerCase();
			const lowerUnit = valueUnitText.toLowerCase();
			return lowerText.includes(lowerUnit) ? text : `${text} ${valueUnitText}`.trim();
		}
		return text;
	}

	function formatOriginalValue(value, item) {
		const context = {
			value,
			item,
			divisor: valueDivisorNumber,
			unit: valueUnitText
		};
		let result;
		if (typeof originalValueFormatter === 'function') {
			result = originalValueFormatter(value, context);
		}
		const text = toDisplayText(result);
		return text || defaultOriginalValueFormatter(value);
	}

	function getTooltipContent(item) {
		if (!item) return null;
		const geo = barGeometryMap.get(item.label);
		const scaledValue =
			geo && Number.isFinite(geo.scaledValue)
				? geo.scaledValue
				: Number.isFinite(Number(item.value))
					? Number(item.value) / valueDivisorNumber
					: 0;
		const formattedValue = formatDisplayValue(scaledValue, item);
		const originalValueText = formatOriginalValue(item.value, item);
		const context = {
			item,
			scaledValue,
			originalValue: item.value,
			formattedValue,
			originalValueText,
			unitText: valueUnitText,
			divisor: valueDivisorNumber,
			showOriginal: tooltipShowOriginalValue && valueDivisorNumber !== 1
		};

		let customContent;
		if (typeof tooltipFormatter === 'function') {
			customContent = tooltipFormatter(item, context);
		}

		if (customContent && typeof customContent === 'object') {
			const resolvedValue =
				toDisplayText(customContent.value) || formattedValue || defaultValueFormatter(scaledValue);
			return {
				label: customContent.label ?? item.label,
				value: resolvedValue,
				extra:
					customContent.extra ??
					(context.showOriginal && context.originalValueText
						? `Valor real: ${context.originalValueText}`
						: undefined)
			};
		}

		if (customContent !== undefined) {
			const resolvedValue =
				toDisplayText(customContent) || formattedValue || defaultValueFormatter(scaledValue);
			return {
				label: item.label,
				value: resolvedValue
			};
		}

		return defaultTooltipFormatter(item, context);
	}

	function updateTooltip(event, item) {
		if (!showTooltips || !host) return;
		const rect = host.getBoundingClientRect();
		const offsetX = toNumber(tooltipOffset?.x, 0);
		const offsetY = toNumber(tooltipOffset?.y, -16);
		const rawX = event.clientX - rect.left + offsetX;
		const rawY = event.clientY - rect.top + offsetY;
		const localX = clamp(rawX, 12, rect.width - 12);
		const localY = clamp(rawY, 12, rect.height - 12);
		tooltipState = {
			visible: true,
			x: localX,
			y: localY,
			item
		};
	}

	function hideTooltip() {
		if (!tooltipState.visible) return;
		tooltipState = { visible: false, x: 0, y: 0, item: null };
	}

	function handlePointerEnter(event, item) {
		hoveredLabel = item.label;
		updateTooltip(event, item);
	}

	function handlePointerMove(event, item) {
		if (hoveredLabel !== item.label) {
			hoveredLabel = item.label;
		}
		updateTooltip(event, item);
	}

	function handlePointerLeave() {
		hoveredLabel = null;
		hideTooltip();
	}

	function clientXToSvgX(clientX) {
		if (!svgNode || !safeWidth) return clientX;
		const rect = svgNode.getBoundingClientRect();
		if (rect.width === 0) return clientX;
		const relative = clamp(clientX - rect.left, 0, rect.width);
		return (relative / rect.width) * safeWidth;
	}

	function baseXToSvgX(baseX) {
		return zoomTransform ? zoomTransform.applyX(baseX) : baseX;
	}

	function svgXToBaseX(svgX) {
		return zoomTransform ? zoomTransform.invertX(svgX) : svgX;
	}

	function clientYToSvgY(clientY) {
		if (!svgNode || !height) return clientY;
		const rect = svgNode.getBoundingClientRect();
		if (rect.height === 0) return clientY;
		const relative = clamp(clientY - rect.top, 0, rect.height);
		return (relative / rect.height) * height;
	}

	function svgXToClientX(svgX) {
		if (!svgNode || !safeWidth) return svgX;
		const rect = svgNode.getBoundingClientRect();
		if (rect.width === 0) return svgX;
		const ratio = svgX / safeWidth;
		return rect.left + ratio * rect.width;
	}

	function baseXToClientX(baseX) {
		const svgX = baseXToSvgX(baseX);
		return svgXToClientX(svgX);
	}

	function handleContainerPointerDown(event) {
		if (!enableBrush || event.button !== 0 || innerWidth <= 0 || innerHeight <= 0) return;
		if (!host || !svgNode || typeof window === 'undefined') return;
		if (enableWheelZoom && !event.shiftKey) return; // allow brush while zoom is enabled with Shift

		const svgY = clientYToSvgY(event.clientY);
		const chartTop = computedMargin.top;
		const chartBottom = computedMargin.top + innerHeight;

		if (svgY < chartTop || svgY > chartBottom) return;

		const chartLeft = computedMargin.left;
		const chartRight = chartLeft + innerWidth;
		const pointerSvgX = clientXToSvgX(event.clientX);
		const startBaseX = clamp(svgXToBaseX(pointerSvgX), chartLeft, chartRight);
		const containerRect = host.getBoundingClientRect();
		const startClientX = baseXToClientX(startBaseX) - containerRect.left;

		isBrushing = true;
		brushStartBaseX = startBaseX;
		brushOverlay = {
			left: startClientX,
			width: 0
		};
		hideTooltip();
		event.stopPropagation();

		window.addEventListener('pointermove', handleBrushPointerMove);
		window.addEventListener('pointerup', handleBrushPointerUp);
		window.addEventListener('pointercancel', handleBrushPointerCancel);
		event.preventDefault();
	}

	function handleBrushPointerMove(event) {
		if (!isBrushing || !host || !svgNode) return;
		const chartLeft = computedMargin.left;
		const chartRight = chartLeft + innerWidth;
		const containerRect = host.getBoundingClientRect();
		const currentSvgX = clamp(clientXToSvgX(event.clientX), chartLeft, chartRight);
		const currentBaseX = clamp(svgXToBaseX(currentSvgX), chartLeft, chartRight);
		const startClientX = baseXToClientX(brushStartBaseX) - containerRect.left;
		const currentClientX = baseXToClientX(currentBaseX) - containerRect.left;
		const left = Math.min(startClientX, currentClientX);
		const width = Math.abs(currentClientX - startClientX);
		brushOverlay = {
			left,
			width
		};
	}

	function handleBrushPointerUp(event) {
		if (!isBrushing) return;
		cleanupBrushListeners();
		isBrushing = false;

		const chartLeft = computedMargin.left;
		const chartRight = chartLeft + innerWidth;
		const startBaseX = clamp(brushStartBaseX, chartLeft, chartRight);
		const endBaseX = clamp(svgXToBaseX(clientXToSvgX(event.clientX)), chartLeft, chartRight);
		const x0 = Math.min(startBaseX, endBaseX);
		const x1 = Math.max(startBaseX, endBaseX);

		if (Math.abs(x1 - x0) < 4) {
			brushSelection = null;
			brushOverlay = null;
			return;
		}

		const selected = chartData
			.filter((item) => {
				const geo = barGeometryMap.get(item.label);
				if (!geo) return false;
				const cx = geo.centerX;
				return cx >= x0 && cx <= x1;
			})
			.map((item) => item.label);

		const uniqueSelection = Array.from(new Set(selected));

		if (!uniqueSelection.length || uniqueSelection.length >= resolvedData.length) {
			brushSelection = null;
		} else {
			brushSelection = uniqueSelection;
		}

		brushOverlay = null;
	}

	function handleBrushPointerCancel() {
		if (!isBrushing) return;
		cleanupBrushListeners();
		isBrushing = false;
		brushOverlay = null;
	}

	function cleanupBrushListeners() {
		if (typeof window === 'undefined') return;
		window.removeEventListener('pointermove', handleBrushPointerMove);
		window.removeEventListener('pointerup', handleBrushPointerUp);
		window.removeEventListener('pointercancel', handleBrushPointerCancel);
	}

	function resetZoomInteractions() {
		brushSelection = null;
		brushOverlay = null;
		zoomManager?.reset?.();
	}

	onDestroy(() => {
		cleanupBrushListeners();
		zoomManager?.destroy?.();
	});
</script>

<figure class="bar-chart">
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
		class="bar-chart__container"
		class:bar-chart__container--brushable={enableBrush}
		bind:this={host}
		on:pointerdown={handleContainerPointerDown}
		on:dblclick={resetZoomInteractions}
	>
		{#if width === 0}
			<div class="bar-chart__skeleton" style="height: {height}px">Carregando…</div>
		{:else if !hasBaseData}
			<div class="bar-chart__empty" style="height: {height}px">
				Inclua dados para visualizar o gráfico.
			</div>
		{:else if !hasData}
			<div class="bar-chart__empty" style="height: {height}px">
				Amplie ou redefina o zoom para visualizar o gráfico.
			</div>
		{:else}
			<svg
				class="bar-chart__svg"
				bind:this={svgNode}
				role="img"
				aria-labelledby={title ? undefined : descriptionId}
				aria-describedby={title ? descriptionId : undefined}
				preserveAspectRatio="xMidYMid meet"
				viewBox={svgViewBox}
				style="touch-action: none;"
			>
				<g class="bar-chart__focus">
					{#if showGrid}
						<g class="bar-chart__grid" transform={zoomTransformString}>
							{#each yAxisTicks as tick}
								<line
									x1={computedMargin.left}
									x2={computedMargin.left + innerWidth}
									y1={yScale(tick)}
									y2={yScale(tick)}
								/>
							{/each}
						</g>
					{/if}

					<g class="bar-chart__axis bar-chart__axis--y">
						{#each yAxisTicks as tick}
							<g transform={`translate(${computedMargin.left - 10},${yScale(tick)})`}>
								<text text-anchor="end" alignment-baseline="middle">
									{formatDisplayValue(tick, null)}
								</text>
							</g>
						{/each}
						<line
							x1={computedMargin.left}
							x2={computedMargin.left}
							y1={computedMargin.top}
							y2={computedMargin.top + innerHeight}
						/>
					</g>

					<g class="bar-chart__axis bar-chart__axis--x">
						<g transform={zoomTransformString}>
							<line
								x1={computedMargin.left}
								x2={computedMargin.left + innerWidth}
								y1={computedMargin.top + innerHeight}
								y2={computedMargin.top + innerHeight}
							/>
							{#each barSeries as series}
								<g
									transform={`translate(${series.geo.centerX},${computedMargin.top + innerHeight})`}
								>
									<text text-anchor="middle" dy="1.4em">
										{series.item.label}
									</text>
								</g>
							{/each}
						</g>
					</g>

					<g class="bar-chart__series" transform={zoomTransformString}>
						{#each barSeries as series (series.item.label)}
							<g
								class="bar-chart__bar-group"
								class:bar-chart__bar-group--fade={useFadeAnimation}
								class:bar-chart__bar-group--scale={useScaleAnimation}
								style={`--chart-animation-duration:${animationDurationMs}ms; --chart-animation-delay:${animationDelayMs}ms; --chart-animation-easing:${animationEasingCurve};`}
								animate:flip={useFlipAnimation &&
									!zoomShouldBeEnabled && {
										duration: animationDurationMs,
										delay: animationDelayMs,
										easing: animationEasing
									}}
							>
								<rect
									class:bar-chart__bar--animated={transitionsEnabled}
									class:bar-chart__bar--highlight={highlightSet.has(series.item.label)}
									class="bar-chart__bar"
									x={series.geo.x}
									y={series.geo.y}
									rx={barRadius}
									width={series.geo.width}
									height={series.geo.height}
									fill={getBarFill(series.item)}
									opacity={getBarOpacity(series.item)}
									style={`--chart-animation-duration:${animationDurationMs}ms; --chart-animation-delay:${animationDelayMs}ms; --chart-animation-easing:${animationEasingCurve};`}
									on:pointerenter={(event) => handlePointerEnter(event, series.item)}
									on:pointermove={(event) => handlePointerMove(event, series.item)}
									on:pointerleave={handlePointerLeave}
								/>

								{#if shouldShowValueLabel(series.item.label)}
									{@const pos = getValueLabelPosition(series.item)}
									<text
										class="bar-chart__value-label"
										x={pos.x}
										y={pos.y}
										text-anchor="middle"
										fill={valueLabelColor || 'var(--chart-foreground, #0f172a)'}
										style={`--value-label-stroke:${valueLabelStrokeColor}; --value-label-stroke-width:${valueLabelStrokeWidthPx}px;`}
									>
										{formatDisplayValue(series.geo?.scaledValue ?? series.item.value, series.item)}
									</text>
								{/if}
							</g>
						{/each}
					</g>
				</g>
			</svg>

			{#if enableBrush && brushOverlay && brushOverlay.width > 0}
				<div
					class="bar-chart__brush-overlay"
					style={`left:${brushOverlay.left}px; width:${brushOverlay.width}px;`}
				/>
			{/if}

			{#if showTooltips && tooltipState.visible && tooltipState.item}
				{@const tooltipContent = getTooltipContent(tooltipState.item)}
				{#if tooltipContent}
					<div
						class="bar-chart__tooltip"
						style={`left:${tooltipState.x}px; top:${tooltipState.y}px;`}
					>
						<span class="bar-chart__tooltip-label">{tooltipContent.label}</span>
						<span class="bar-chart__tooltip-value">{tooltipContent.value}</span>
						{#if tooltipContent.extra}
							<span class="bar-chart__tooltip-extra">{tooltipContent.extra}</span>
						{/if}
					</div>
				{/if}
			{/if}

			{#if annotationOverlays.length}
				<div class="bar-chart__annotations">
					{#each annotationOverlays as annotation (annotation.label)}
						<div
							class="bar-chart__annotation"
							style={`--color:${annotation.color}; transform: translate(${annotation.x}px, ${annotation.y}px);`}
						>
							<span>{annotation.text}</span>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>

	<ChartFooter {sourceLabel} {sourceUrl} {sourceColor} {footnote} {footnoteColor} />
</figure>

<style>
	:global(:where(.bar-chart *)) {
		font-family: inherit;
	}

	.bar-chart {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		width: 100%;
		color: var(--chart-foreground, #0f172a);
		position: relative;
	}

	.bar-chart__container {
		position: relative;
		width: 100%;
		min-height: 260px;
	}

	.bar-chart__container--brushable {
		cursor: crosshair;
	}

	.bar-chart__tooltip {
		position: absolute;
		z-index: 40;
		top: 0;
		left: 0;
		min-width: 140px;
		max-width: 220px;
		padding: 0.5rem 0.75rem;
		border-radius: 0.75rem;
		background: var(--chart-tooltip-bg, rgba(15, 23, 42, 0.92));
		color: var(--chart-tooltip-fg, #f8fafc);
		font-size: 0.78rem;
		line-height: 1.4;
		transform: translate(-50%, calc(-100% - 12px));
		pointer-events: none;
		box-shadow: 0 12px 24px rgba(15, 23, 42, 0.25);
	}

	.bar-chart__tooltip-label {
		display: block;
		font-weight: 600;
		margin-bottom: 0.15rem;
	}

	.bar-chart__tooltip-value {
		display: block;
		font-weight: 500;
	}

	.bar-chart__tooltip-extra {
		display: block;
		margin-top: 0.25rem;
		font-size: 0.7rem;
		color: rgba(248, 250, 252, 0.78);
	}

	.bar-chart__brush-overlay {
		position: absolute;
		top: 0;
		height: 100%;
		background: rgba(14, 165, 233, 0.12);
		border: 1px solid rgba(14, 165, 233, 0.35);
		border-radius: 0.5rem;
		pointer-events: none;
		z-index: 15;
	}

	.bar-chart__skeleton,
	.bar-chart__empty {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 240px;
		padding: 1.5rem;
		background: var(--chart-surface, rgba(248, 250, 252, 0.65));
		border: 1px dashed var(--chart-border, rgba(148, 163, 184, 0.45));
		color: var(--chart-muted, #64748b);
		font-size: 0.95rem;
		border-radius: 0.9rem;
		backdrop-filter: blur(2px);
	}

	.bar-chart__svg {
		width: 100%;
		height: auto;
		display: block;
		overflow: visible;
	}

	.bar-chart__grid line {
		stroke: var(--chart-grid, rgba(148, 163, 184, 0.22));
		stroke-dasharray: 2 6;
	}

	.bar-chart__axis text {
		font-size: 0.82rem;
		fill: var(--chart-axis, #475569);
	}

	.bar-chart__axis line {
		stroke: var(--chart-axis-line, rgba(100, 116, 139, 0.5));
	}

	.bar-chart__bar-group {
		transform-origin: center bottom;
	}

	.bar-chart__bar {
		cursor: pointer;
		transition:
			transform 160ms ease,
			opacity 180ms ease,
			fill 220ms ease;
	}

	.bar-chart__bar--animated {
		transform-origin: center bottom;
		animation: bar-chart-rise var(--chart-animation-duration, 420ms)
			var(--chart-animation-easing, cubic-bezier(0.22, 1, 0.36, 1)) both;
		animation-delay: var(--chart-animation-delay, 30ms);
	}

	.bar-chart__bar-group--fade .bar-chart__bar {
		animation: bar-chart-fade var(--chart-animation-duration, 360ms)
			var(--chart-animation-easing, cubic-bezier(0.22, 1, 0.36, 1)) both;
		animation-delay: var(--chart-animation-delay, 0ms);
	}

	.bar-chart__bar-group--scale .bar-chart__bar {
		animation: bar-chart-scale var(--chart-animation-duration, 420ms)
			var(--chart-animation-easing, cubic-bezier(0.22, 1, 0.36, 1)) both;
		animation-delay: var(--chart-animation-delay, 0ms);
		transform-origin: center bottom;
	}

	.bar-chart__bar:focus-visible {
		outline: 3px solid rgba(99, 102, 241, 0.55);
		outline-offset: 1px;
	}

	.bar-chart__bar:hover {
		transform: translateY(-4px);
	}

	@keyframes bar-chart-rise {
		from {
			transform: scaleY(0.05);
		}
		to {
			transform: scaleY(1);
		}
	}

	@keyframes bar-chart-fade {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes bar-chart-scale {
		from {
			transform: scaleY(0.65);
			opacity: 0.3;
		}
		to {
			transform: scaleY(1);
			opacity: 1;
		}
	}

	.bar-chart__value-label {
		font-size: 0.78rem;
		font-weight: 600;
		paint-order: stroke;
		stroke: var(--value-label-stroke, none);
		stroke-width: var(--value-label-stroke-width, 0px);
		pointer-events: none;
	}

	.bar-chart__annotations {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		overflow: hidden;
		z-index: 30;
	}

	.bar-chart__annotation {
		position: absolute;
		min-width: 120px;
		max-width: 220px;
		background: rgba(255, 255, 255, 0.92);
		border-radius: 0.75rem;
		border: 1px solid rgba(226, 232, 240, 0.8);
		padding: 0.45rem 0.55rem;
		font-size: 0.75rem;
		line-height: 1.4;
		color: var(--color, #0f172a);
		transform: translate(-50%, -100%);
		box-shadow: 0 14px 24px rgba(15, 23, 42, 0.12);
		backdrop-filter: blur(4px);
	}

	.bar-chart__annotation::after {
		content: '';
		position: absolute;
		width: 10px;
		height: 10px;
		border: 1px solid rgba(226, 232, 240, 0.8);
		background: inherit;
		left: 50%;
		bottom: -6px;
		transform: translateX(-50%) rotate(45deg);
		box-shadow: inherit;
	}

	@media (max-width: 640px) {
		.bar-chart__axis text {
			font-size: 0.72rem;
		}
		.bar-chart__annotation {
			min-width: 110px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.bar-chart__bar {
			transition: none !important;
			animation-duration: 0s !important;
		}
	}
</style>
