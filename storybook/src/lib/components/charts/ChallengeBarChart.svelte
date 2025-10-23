<script>
	import { onDestroy, onMount } from 'svelte';
import { scaleLinear, scaleOrdinal } from 'd3-scale';
	import { select } from 'd3-selection';
	import { format } from 'd3-format';
	import {
		participantActions,
		participantsList,
		selectedChallenge
	} from '$lib/stores/participantStore.js';
	import { buildChallengeTree } from '$lib/utils/participantsData.js';

	export let minHeight = 260;
	export let barPadding = 20;
	export let barInnerPadding = 0.22;
	export let margin = { top: 52, right: 72, bottom: 48, left: 60 };

	const palette = ['#c84f3d', '#de6b3f', '#e78443', '#eeb058', '#ceb47b', '#88b8a3'];
	const formatter = format('d');
	const { selectChallengeGroup } = participantActions;
	const labelStyles = new Map([
		['Eventos extremos', { text: '#4c3b2f', fill: '#c94f3b' }],
		['Escassez de água', { text: '#4c3b2f', fill: '#d66a3f' }],
		['Calor extremo', { text: '#4c3b2f', fill: '#df8a4d' }],
		['Desmatamento e perda de biodiversidade', { text: '#4c3b2f', fill: '#e5a85b' }],
		['Refugiados climáticos', { text: '#4c3b2f', fill: '#ccb176' }],
		['Crise alimentar', { text: '#4c3b2f', fill: '#99b79e' }]
	]);

	let container;
	let svg;
	let width = 0;
	let height = 0;

	let participantsData = [];
	let activeChallenge = null;

	const unsubscribeParticipants = participantsList.subscribe((value) => {
		participantsData = value || [];
		requestRender();
	});

	const unsubscribeChallenge = selectedChallenge.subscribe((value) => {
		activeChallenge = value;
		updateSelectionHighlight();
	});

	let resizeObserver;
	let needsRender = false;

	function normalizeCategory(value) {
		if (value === undefined || value === null) return null;
		const trimmed = String(value).trim();
		return trimmed.length ? trimmed : null;
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

	function render() {
		select(container).selectAll('.empty-state').remove();

		if (!participantsData?.length || !width) {
			renderEmptyState();
			return;
		}

		const challengeTree = buildChallengeTree(participantsData);
		const data = challengeTree.children;
		if (!data.length) {
			renderEmptyState();
			return;
		}

		const labelHeight = 20;
		const innerGap = 4;
		const baseBarHeight = 24;
		const blockHeight = labelHeight + innerGap + baseBarHeight + innerGap;
		const chartHeight = data.length * blockHeight;
		height = Math.max(minHeight, chartHeight) + margin.top + margin.bottom;

		if (!svg) {
			svg = select(container).append('svg').attr('class', 'challenge-bars');
		}

		svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height);
		container.style.minHeight = `${height}px`;

		const chartWidth = Math.max(0, width - margin.left - margin.right);

		const xScale = scaleLinear()
			.domain([0, Math.max(...data.map((d) => d.value))])
			.range([0, chartWidth])
			.nice();

		svg.selectAll('g.axis').remove();

		const categories = data.map((d) => d.name);
		const colorScale = scaleOrdinal()
			.domain(categories)
			.range(
				categories.map(
					(name, index) => labelStyles.get(name)?.fill || palette[index % palette.length]
				)
			);

		svg.classed('has-selection', Boolean(normalizeCategory(activeChallenge)));

		const bars = svg.selectAll('g.bar').data(data, (d) => d.name);

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
		.each(function (d) {
			const group = select(this);
			const barWidth = xScale(d.value);
			const barHeight = baseBarHeight;
			const labelInfo = labelStyles.get(d.name);

			group
				.select('rect')
				.attr('width', barWidth)
				.attr('height', barHeight)
				.attr('y', labelHeight + innerGap)
				.attr('fill', labelInfo?.fill || colorScale(d.name))
				.attr('rx', 8)
				.attr('ry', 8);

			group
				.select('.bar__label')
				.attr('x', 0)
				.attr('y', 0)
				.attr('text-anchor', 'start')
				.attr('dy', '0')
				.attr('fill', labelInfo?.text || '#3c332a')
				.text(d.name);

			group
				.select('.bar__value')
				.attr('x', barWidth + 24)
				.attr('y', labelHeight + innerGap + barHeight / 2)
				.attr('dy', '0.35em')
				.attr('fill', labelInfo?.text || '#3c332a')
				.text(formatter(d.value));
		})
			.on('click', (event, d) => {
				event.stopPropagation();
				selectChallengeGroup(d.name);
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
		const current = normalizeCategory(activeChallenge);
		svg.classed('has-selection', Boolean(current));
		svg.selectAll('g.bar').classed('active', (d) => {
			const category = normalizeCategory(d.name);
			return current && category === current;
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
		requestRender();
	});

	onDestroy(() => {
		resizeObserver?.disconnect();
		unsubscribeParticipants();
		unsubscribeChallenge();
	});
</script>

<div class="bars-container" bind:this={container}></div>

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
		border-radius: 8px;
	}

	:global(svg.challenge-bars.has-selection g.bar rect) {
		opacity: 0.2;
	}

	:global(svg.challenge-bars.has-selection g.bar.active rect) {
		opacity: 1;
	}

	:global(svg.challenge-bars g.bar.hovered rect) {
		filter: brightness(1.05);
	}

	:global(svg.challenge-bars g.bar text.bar__label) {
		font-size: clamp(0.9rem, 1.8vw, 1.12rem);
		font-weight: 500;
		text-anchor: start;
		dominant-baseline: text-before-edge;
	}

	:global(svg.challenge-bars g.bar text.bar__value) {
		font-size: clamp(0.95rem, 1.9vw, 1.2rem);
		font-weight: 600;
		text-anchor: start;
		dominant-baseline: middle;
	}

	:global(svg.challenge-bars.has-selection g.bar:not(.active) text) {
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
