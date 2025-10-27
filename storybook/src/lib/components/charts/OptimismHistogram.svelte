<script>
	import { onDestroy, onMount } from 'svelte';
	import { scaleBand, scaleLinear } from 'd3-scale';
	import { select } from 'd3-selection';
	import { format } from 'd3-format';
import {
	participantActions,
	participantsList,
	selectedOptimismScore,
	activeGrouping as activeGroupingStore
} from '$lib/stores/participantStore.js';
	import { buildOptimismHistogram } from '$lib/utils/participantsData.js';

	export let minHeight = 320;
	export let margin = { top: 48, right: 32, bottom: 72, left: 32 };
	export let data = null;
	export let palette = null;

	const valueFormatter = format('d');

	const defaultPalette = [
		'#c85646',
		'#d46a4c',
		'#da7a4f',
		'#df8550',
		'#e59255',
		'#ebaa68',
		'#d3b782',
		'#c0b98c',
		'#adbba0',
		'#9ab6b1',
		'#88adb7'
	];

	const scheduleFrame =
		typeof globalThis !== 'undefined' && typeof globalThis.requestAnimationFrame === 'function'
			? globalThis.requestAnimationFrame.bind(globalThis)
			: (callback) => callback();

let container;
let svg;
let width = 0;
let height = 0;
let resizeObserver;
let histogram = [];
let activeOptimismScore = null;
let xAxisGroup;
let barsGroup;
let labelsGroup;
let localSelection = null;
let intersectionObserver;
let groupingMode = 'participant';
const { selectOptimismScore } = participantActions;

	const unsubscribeParticipants = participantsList.subscribe((participants) => {
		updateHistogram(participants);
	});

	const unsubscribeOptimism = selectedOptimismScore.subscribe((score) => {
		activeOptimismScore = Number.isFinite(score) ? score : null;
		updateHighlight();
	});

	const unsubscribeGrouping = activeGroupingStore.subscribe((value) => {
		groupingMode = value || 'participant';
		if (groupingMode !== 'optimism') {
			localSelection = null;
		}
		updateHighlight();
	});

	function setLocalSelection(value) {
		const numeric = Number(value);
		if (!Number.isFinite(numeric)) {
			clearLocalSelection();
			return;
		}
		if (localSelection === numeric && groupingMode === 'optimism') {
			clearLocalSelection();
			return;
		}
		localSelection = numeric;
		selectOptimismScore(numeric);
		updateHighlight();
	}

	function clearLocalSelection() {
		if (localSelection === null) return;
		const shouldResetStore =
			groupingMode === 'optimism' &&
			Number.isFinite(activeOptimismScore) &&
			Number(activeOptimismScore) === Number(localSelection);
		localSelection = null;
		updateHighlight();
		if (shouldResetStore) {
			selectOptimismScore(null);
		}
	}

	function setupResizeObserver() {
		if (!container) return;
		if (typeof ResizeObserver === 'undefined') {
			const rect = container.getBoundingClientRect();
			if (rect.width) {
				width = rect.width;
				update();
			}
			return;
		}

		resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const nextWidth = entry.contentBoxSize
					? (entry.contentBoxSize[0]?.inlineSize ?? entry.contentRect.width)
					: entry.contentRect.width;
				if (nextWidth && Math.round(nextWidth) !== Math.round(width)) {
					width = nextWidth;
					scheduleFrame(update);
				}
			}
		});
		resizeObserver.observe(container);

		const rect = container.getBoundingClientRect();
		if (rect.width) {
			width = rect.width;
			update();
		}
	}

	function setupIntersectionObserver() {
		if (!container || typeof IntersectionObserver === 'undefined') return;
		intersectionObserver = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.target !== container) continue;
					if (!entry.isIntersecting) {
						clearLocalSelection();
					}
				}
			},
			{ threshold: 0.01 }
		);
		intersectionObserver.observe(container);
	}

	function ensureSvg() {
		if (!svg) {
			svg = select(container).append('svg').attr('class', 'optimism-histogram');
			barsGroup = svg.append('g').attr('class', 'bars');
			labelsGroup = svg.append('g').attr('class', 'labels');
			xAxisGroup = svg.append('g').attr('class', 'x-axis');
			svg.append('text').attr('class', 'axis-label');
			svg.append('text').attr('class', 'footnote');
		}

		svg.on('click', () => {
			clearLocalSelection();
		});
	}

	function updateAxis(xScale, availableHeight, currentMargin) {
		const ticks = histogram.map((d) => d.scale);
		xAxisGroup
			.selectAll('text.tick')
			.data(ticks, (d) => d)
			.join('text')
			.attr('class', 'tick')
			.attr('text-anchor', 'middle')
			.attr('x', (d) => xScale(String(d)) + xScale.bandwidth() / 2)
			.attr('y', availableHeight + 24)
			.text((d) => d);

		xAxisGroup.attr('transform', `translate(${currentMargin.left}, ${currentMargin.top})`);
	}

	function getResponsiveMargin(availableWidth) {
		const current = { ...margin };
		const isCompact = availableWidth < 640;

		current.top = Math.min(current.top, isCompact ? 20 : 28);
		current.bottom = Math.max(current.bottom, isCompact ? 112 : 96);

		return current;
	}

	function updateHistogram(participants = []) {
		if (Array.isArray(data) && data.length) {
			histogram = data.map((count, index) => ({
				scale: index,
				count: Number(count) || 0
			}));
		} else {
			histogram = buildOptimismHistogram(participants);
		}
	if (
		localSelection !== null &&
		!histogram.some((bucket) => Number(bucket.scale) === Number(localSelection))
	) {
		clearLocalSelection();
	}
		update();
	}

	function update() {
		if (!container || !width) return;
		ensureSvg();
		const availableWidth = Math.max(0, width);
		const currentMargin = getResponsiveMargin(availableWidth);

		height = Math.max(minHeight, Math.round(availableWidth * 0.48));
		const chartWidth = Math.max(0, availableWidth - currentMargin.left - currentMargin.right);
		const chartHeight = Math.max(120, height - currentMargin.top - currentMargin.bottom);

		svg
			.attr('viewBox', `0 0 ${availableWidth} ${height}`)
			.attr('width', availableWidth)
			.attr('height', height);

		const domainValues = histogram.map((d) => String(d.scale));
		const xScale = scaleBand()
			.domain(domainValues)
			.range([0, chartWidth])
			.paddingInner(0.18)
			.paddingOuter(0.08);

		const maxCount = Math.max(1, ...histogram.map((d) => d.count));
		const yScale = scaleLinear().domain([0, maxCount]).range([chartHeight, 0]).nice();

		const colors = palette && palette.length ? palette : defaultPalette;

		barsGroup
			.attr('transform', `translate(${currentMargin.left}, ${currentMargin.top})`)
			.selectAll('rect.bar')
			.data(histogram, (d) => d.scale)
			.join('rect')
			.attr('class', 'bar')
			.attr('x', (d) => xScale(String(d.scale)) ?? 0)
			.attr('width', Math.max(10, xScale.bandwidth()))
			.attr('y', (d) => yScale(Math.max(0.08, d.count)))
			.attr('height', (d) => chartHeight - yScale(Math.max(0.08, d.count)))
			.attr('rx', 0)
			.attr('ry', 0)
			.attr('fill', (d) => colors[d.scale] ?? colors[colors.length - 1])
			.on('click', (event, d) => {
				event.stopPropagation();
				setLocalSelection(d.scale);
			});

		labelsGroup
			.attr('transform', `translate(${currentMargin.left}, ${currentMargin.top})`)
			.selectAll('text.value')
			.data(histogram, (d) => d.scale)
			.join('text')
			.attr('class', 'value')
			.attr('text-anchor', 'middle')
			.attr('x', (d) => (xScale(String(d.scale)) ?? 0) + xScale.bandwidth() / 2)
			.attr('y', (d) => yScale(Math.max(0.08, d.count)) - 10)
			.text((d) => (d.count > 0 ? valueFormatter(d.count) : ''));

		updateAxis(xScale, chartHeight, currentMargin);

		const isCompact = availableWidth < 640;
		const axisLabelOffset = isCompact
			? Math.max(36, currentMargin.bottom * 0.55)
			: Math.max(28, currentMargin.bottom * 0.4);
		const footnoteOffset = Math.max(12, axisLabelOffset - (isCompact ? 20 : 16));

		svg
			.select('text.axis-label')
			.attr('x', currentMargin.left + chartWidth / 2)
			.attr('y', height - axisLabelOffset)
			.attr('text-anchor', 'middle')
			.text('Nível de otimismo');

		svg
			.select('text.footnote')
			.attr('x', currentMargin.left + chartWidth)
			.attr('y', height - footnoteOffset)
			.attr('text-anchor', 'end')
			.text('Votos por categoria');

		updateHighlight();
	}

	$: if (Array.isArray(data)) {
		updateHistogram();
	}

function updateHighlight() {
	if (!barsGroup || !labelsGroup) return;
	const participantHighlight =
		groupingMode === 'participant-focus' && Number.isFinite(activeOptimismScore)
			? Number(activeOptimismScore)
			: null;
	const highlightScale = participantHighlight ?? localSelection;
	const shouldDim = highlightScale !== null;

	scheduleFrame(() => {
		if (!barsGroup || !labelsGroup) return;
		if (svg) {
			svg.classed('has-selection', shouldDim);
		}
		const bars = barsGroup.selectAll('rect.bar');
		if (!bars.size()) return;

		bars
			.classed('active', (d) => highlightScale !== null && Number(d.scale) === highlightScale)
			.classed(
				'dimmed',
				(d) => shouldDim && highlightScale !== null && Number(d.scale) !== highlightScale
			);

		labelsGroup
			.selectAll('text.value')
			.classed('active', (d) => highlightScale !== null && Number(d.scale) === highlightScale)
			.classed(
				'dimmed',
				(d) => shouldDim && highlightScale !== null && Number(d.scale) !== highlightScale
			);
	});
}

onMount(() => {
	setupResizeObserver();
	setupIntersectionObserver();
	updateHistogram();
});

onDestroy(() => {
	clearLocalSelection();
	resizeObserver?.disconnect();
	intersectionObserver?.disconnect();
	unsubscribeParticipants();
	unsubscribeOptimism();
	unsubscribeGrouping();
	});
</script>

<div class="histogram-container" bind:this={container}></div>

<style>
	.histogram-container {
		width: 100%;
		min-height: 280px;
		position: relative;
	}

	:global(svg.optimism-histogram) {
		display: block;
		width: 100%;
		height: auto;
	}

	:global(svg.optimism-histogram rect.bar) {
		filter: drop-shadow(0 12px 18px rgba(48, 55, 66, 0.16));
		stroke: transparent;
		stroke-width: 0;
		cursor: pointer;
		transition:
			opacity 160ms ease,
			filter 160ms ease,
			stroke 160ms ease,
			stroke-width 160ms ease;
	}

	:global(svg.optimism-histogram rect.bar.dimmed) {
		opacity: 0.25;
		filter: drop-shadow(0 6px 12px rgba(48, 55, 66, 0.12));
	}

	:global(svg.optimism-histogram rect.bar.active) {
		opacity: 1;
		stroke: transparent;
		stroke-width: 0;
		filter: drop-shadow(0 16px 26px rgba(48, 55, 66, 0.2));
	}

	:global(svg.optimism-histogram text) {
		font-family: 'Globotipo', 'Inter', system-ui, sans-serif;
		fill: rgba(47, 52, 63, 0.86);
	}

	:global(svg.optimism-histogram text.value) {
		font-size: 0.95rem;
		font-weight: 600;
		pointer-events: none;
	}

	:global(svg.optimism-histogram text.value.dimmed) {
		opacity: 0.25;
	}

	:global(svg.optimism-histogram text.value.active) {
		opacity: 1;
		fill: rgba(32, 39, 52, 0.92);
	}

	:global(svg.optimism-histogram .x-axis text.tick) {
		font-size: 0.9rem;
		font-weight: 500;
		fill: rgba(47, 52, 63, 0.78);
		pointer-events: none;
	}

	:global(svg.optimism-histogram text.axis-label) {
		font-size: 1.25rem;
		font-weight: 500;
		fill: rgba(47, 52, 63, 0.9);
		pointer-events: none;
	}

	:global(svg.optimism-histogram text.footnote) {
		font-size: 0.85rem;
		fill: rgba(47, 52, 63, 0.66);
		pointer-events: none;
	}
</style>
