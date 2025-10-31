<script>
	import { onDestroy, onMount } from 'svelte';
	import { scaleLinear } from 'd3-scale';
	import { select } from 'd3-selection';
	import { format } from 'd3-format';
import {
	participantActions,
	participantsList,
	selectedOptimismScore,
	activeGrouping as activeGroupingStore
} from '$lib/stores/participantStore.js';
	import { buildOptimismHistogram } from '$lib/utils/participantsData.js';

	export let minHeight = 260;
	export let barPadding = 20;
	export let barInnerPadding = 0.22;
	export let margin = { top: 52, right: 72, bottom: 48, left: 60 };
	export let data = null;
	export let palette = null;

	const formatter = format('d');
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

let participantsData = [];
let activeScore = null;
let groupingMode = 'participant';
let barsData = [];
let localSelection = null;
const { selectOptimismScore } = participantActions;

	const unsubscribeParticipants = participantsList.subscribe((value) => {
		participantsData = value || [];
		updateBarsData();
	});

	const unsubscribeScore = selectedOptimismScore.subscribe((value) => {
		activeScore = Number.isFinite(value) ? value : null;
		updateSelectionHighlight();
	});

	const unsubscribeGrouping = activeGroupingStore.subscribe((value) => {
		groupingMode = value || 'participant';
		if (groupingMode !== 'optimism') {
			localSelection = null;
		}
		updateSelectionHighlight();
	});

	let resizeObserver;
	let needsRender = false;
	let intersectionObserver;

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
	updateSelectionHighlight();
}

function clearLocalSelection() {
	if (localSelection === null) return;
	const shouldResetStore =
		groupingMode === 'optimism' &&
		Number.isFinite(activeScore) &&
		Number(activeScore) === Number(localSelection);
	localSelection = null;
	updateSelectionHighlight();
	if (shouldResetStore) {
		selectOptimismScore(null);
	}
}

	function updateBarsData() {
		if (participantsData?.length) {
			barsData = buildOptimismHistogram(participantsData).map((item) => ({
				name: String(item.scale),
				value: item.count
			}));
		} else if (Array.isArray(data) && data.length) {
			barsData = data.map((count, index) => ({
				name: String(index),
				value: Number(count) || 0
			}));
		} else {
			barsData = [];
		}
	if (
		localSelection !== null &&
		!barsData.some((item) => Number(item.name) === Number(localSelection))
	) {
		clearLocalSelection();
	}
		requestRender();
	}

	function requestRender() {
		if (!container) return;
		needsRender = true;
		queueMicrotask(() => {
			if (!needsRender) return;
			needsRender = false;
			render();
		});
	}

	function setupResizeObserver() {
		if (!container) return;
		resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const nextWidth = entry.contentBoxSize
					? (entry.contentBoxSize[0]?.inlineSize ?? entry.contentRect.width)
					: entry.contentRect.width;
				if (!nextWidth) continue;
				if (Math.round(nextWidth) !== Math.round(width)) {
					width = nextWidth;
					height = Math.max(minHeight, container.clientHeight || minHeight);
					requestRender();
				}
			}
		});
		resizeObserver.observe(container);

		const rect = container.getBoundingClientRect();
		if (rect.width) {
			width = rect.width;
			height = Math.max(minHeight, container.clientHeight || minHeight);
			requestRender();
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

	function render() {
		select(container).selectAll('.empty-state').remove();

		if (!barsData.length || !width) {
			renderEmptyState();
			return;
		}

		const labelHeight = 20;
		const innerGap = Math.max(4, barPadding * 0.18);
		const baseBarHeight = Math.max(24, barPadding);
		const blockHeight = labelHeight + innerGap + baseBarHeight + innerGap;
		const chartHeight = barsData.length * blockHeight;
		height = Math.max(minHeight, chartHeight) + margin.top + margin.bottom;

		if (!svg) {
			svg = select(container).append('svg').attr('class', 'challenge-bars');
		}

		svg.on('click', () => {
			clearLocalSelection();
		});

		svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height);
		container.style.minHeight = `${height}px`;

		const chartWidth = Math.max(0, width - margin.left - margin.right);
		const maxValue = Math.max(1, ...barsData.map((d) => d.value));
		const xScale = scaleLinear().domain([0, maxValue]).range([0, chartWidth]).nice();

		const colors =
			Array.isArray(palette) && palette.length
				? palette
				: defaultPalette.slice(0, Math.max(defaultPalette.length, barsData.length));

		const bars = svg.selectAll('g.bar').data(barsData, (d) => d.name);

		const barsEnter = bars.enter().append('g').attr('class', 'bar');
		barsEnter.append('rect');
		barsEnter.append('text').attr('class', 'bar__label');
		barsEnter.append('text').attr('class', 'bar__value');

		const barsMerged = barsEnter.merge(bars);

		barsMerged
			.attr('transform', (d, index) => {
				const yOffset = margin.top + index * blockHeight;
				return `translate(${margin.left}, ${yOffset})`;
			})
			.each(function (d, index) {
				const group = select(this);
				const barWidth = d.value > 0 ? Math.max(12, xScale(d.value)) : 0;
				const barHeight = baseBarHeight;
				const fillColor = colors[index % colors.length];

				group
					.select('rect')
					.attr('width', barWidth)
					.attr('height', barHeight)
					.attr('y', labelHeight + innerGap)
					.attr('fill', fillColor)
					.attr('rx', 8)
					.attr('ry', 8);

				group
					.select('.bar__label')
					.attr('x', 0)
					.attr('y', 0)
					.attr('text-anchor', 'start')
					.attr('dy', '0')
					.text(d.name);

				group
					.select('.bar__value')
					.attr('x', barWidth + 12)
					.attr('y', labelHeight + innerGap + barHeight / 2)
					.attr('dy', '0.35em')
					.text(formatter(d.value));
			})
			.on('click', (event, d) => {
				event.stopPropagation();
				setLocalSelection(d.name);
			})
			.on('mouseenter', function () {
				select(this).classed('hovered', true);
			})
			.on('mouseleave', function () {
				select(this).classed('hovered', false);
			});

		bars.exit().remove();

		updateSelectionHighlight();
	}

	function updateSelectionHighlight() {
		if (!svg) return;
		const participantHighlight =
			groupingMode === 'participant-focus' && Number.isFinite(activeScore)
				? Number(activeScore)
				: null;
		const highlightValue = participantHighlight ?? localSelection;
		const shouldDim = highlightValue !== null;

		scheduleFrame(() => {
			if (!svg) return;
			svg.classed('has-selection', shouldDim);
			const bars = svg.selectAll('g.bar');
			bars.classed('active', (d) => {
				const numeric = Number(d.name);
				return shouldDim && Number.isFinite(numeric) && numeric === highlightValue;
			});
			bars.classed('dimmed', (d) => {
				const numeric = Number(d.name);
				return shouldDim && (!Number.isFinite(numeric) || numeric !== highlightValue);
			});
		});
	}

	function renderEmptyState() {
		if (svg) {
			svg.remove();
			svg = null;
		}
		if (!container) return;
		const empty = select(container).selectAll('.empty-state').data([true]);
		const emptyEnter = empty
			.enter()
			.append('div')
			.attr('class', 'empty-state')
			.text('Nenhum dado disponível');
		emptyEnter.merge(empty);
		empty.exit().remove();
	}

	onMount(() => {
		setupResizeObserver();
		setupIntersectionObserver();
		updateBarsData();
	});

	onDestroy(() => {
		clearLocalSelection();
		resizeObserver?.disconnect();
		intersectionObserver?.disconnect();
		unsubscribeParticipants();
		unsubscribeScore();
		unsubscribeGrouping();
	});
</script>

<div
	class="bars-container"
	bind:this={container}
	data-participant-slider-anchor="chart"
></div>

<style>
	.bars-container {
		position: relative;
		width: 100%;
		min-height: 280px;
	}

	:global(svg.challenge-bars) {
		display: block;
		width: 100%;
		height: auto;
	}

	:global(svg.challenge-bars g.bar rect) {
		transition:
			opacity 160ms ease,
			transform 160ms ease;
		filter: drop-shadow(0 14px 26px rgba(47, 52, 63, 0.14));
	}

	:global(svg.challenge-bars.has-selection g.bar rect) {
		opacity: 0.2;
	}

	:global(svg.challenge-bars.has-selection g.bar.active rect) {
		opacity: 1;
	}

	:global(svg.challenge-bars g.bar:hover rect) {
		filter: drop-shadow(0 18px 32px rgba(47, 52, 63, 0.2));
	}

	:global(svg.challenge-bars g.bar text.bar__label) {
		font-size: clamp(0.9rem, 1.8vw, 1.12rem);
		font-weight: 500;
		text-anchor: start;
		dominant-baseline: text-before-edge;
		fill: rgba(47, 52, 63, 0.86);
	}

	:global(svg.challenge-bars g.bar text.bar__value) {
		font-size: clamp(0.95rem, 1.9vw, 1.2rem);
		font-weight: 600;
		text-anchor: start;
		dominant-baseline: middle;
		fill: rgba(47, 52, 63, 0.86);
	}

	:global(svg.challenge-bars.has-selection g.bar.dimmed text) {
		fill: rgba(71, 85, 105, 0.55);
	}

	.empty-state {
		width: 100%;
		min-height: 200px;
		border-radius: 16px;
		border: 1px dashed rgba(148, 163, 184, 0.35);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.95rem;
		color: rgba(100, 116, 139, 0.8);
		background: rgba(248, 250, 252, 0.28);
	}
</style>
