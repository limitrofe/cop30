<script>
	import { onDestroy, onMount } from 'svelte';
	import { format } from 'd3-format';
	import { hierarchy, pack } from 'd3-hierarchy';
	import { scaleOrdinal } from 'd3-scale';
	import { select } from 'd3-selection';
	import {
		participantActions,
		participantsList,
		selectedParticipant,
		selectedStillTime
	} from '$lib/stores/participantStore.js';
	import { buildStillTimeTree } from '$lib/utils/participantsData.js';

	const formatter = format('d');
	const { selectStillTimeGroup } = participantActions;

	export let minHeight = 260;
	export let bubblePadding = 12;
	export let margin = { top: 24, right: 24, bottom: 40, left: 24 };

	const preferredColors = new Map([
		['Sim, mas apenas se houver ação imediata', '#bfc19f'],
		['Sim, estou otimista', '#b8d5cb'],
		['Talvez, mas não estou otimista', '#e8a15f'],
		['Não', '#d35a4d']
	]);
	const fallbackPalette = ['#c5cdb0', '#a4c6bd', '#f4af71', '#ea735d', '#d87a7a'];

	function toNumber(value, fallback) {
		const numeric = Number(value);
		return Number.isFinite(numeric) ? numeric : fallback;
	}

	$: resolvedMargin = {
		top: toNumber(margin?.top, 24),
		right: toNumber(margin?.right, 24),
		bottom: toNumber(margin?.bottom, 40),
		left: toNumber(margin?.left, 24)
	};

	let container;
	let svg;
	let width = 0;
	let height = 0;
	let participantsData = [];
	let activeStillTime = null;
	let participantStillTime = null;
	let resizeObserver;
	let needsRender = false;
	let legendEntries = [];
	let currentGroup = null;

	const unsubscribeParticipants = participantsList.subscribe((value) => {
		participantsData = value || [];
		requestRender();
	});

	const unsubscribeStillTime = selectedStillTime.subscribe((value) => {
		activeStillTime = normalizeCategory(value);
		updateSelectionHighlight();
	});

	const unsubscribeSelectedParticipant = selectedParticipant.subscribe((value) => {
		participantStillTime = normalizeCategory(value?.stillTime);
		updateSelectionHighlight();
	});

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
					requestRender();
				}
			}
		});
		resizeObserver.observe(container);

		const rect = container.getBoundingClientRect();
		if (rect.width) {
			width = rect.width;
			requestRender();
		}
	}

	function buildLines(label = '') {
		const words = String(label).split(/\s+/).filter(Boolean);
		const lines = [];
		let current = '';

		for (const word of words) {
			const next = current ? `${current} ${word}` : word;
			if (next.length > 22 && current) {
				lines.push(current);
				current = word;
			} else {
				current = next;
			}
		}

		if (current) {
			lines.push(current);
		}

		return lines.length ? lines : [''];
	}

	function getColorScale(categories) {
		const scale = scaleOrdinal()
			.domain(categories)
			.range(
				categories.map(
					(category, index) =>
						preferredColors.get(category) ?? fallbackPalette[index % fallbackPalette.length]
				)
			);
		return scale;
	}

	function updateSelectionHighlight() {
		const normalized = activeStillTime ?? participantStillTime;
		currentGroup = normalized;
		if (!svg) return;
		svg.classed('has-selection', Boolean(normalized));
		svg
			.selectAll('g.bubble')
			.classed('active', (d) => normalizeCategory(d.data.name) === normalized)
			.classed('dimmed', (d) => normalized && normalizeCategory(d.data.name) !== normalized);
	}

	function render() {
		if (!container) return;
		const rootSelection = select(container);
		rootSelection.selectAll('.empty-state').remove();

		if (!participantsData?.length || !width) {
			renderEmptyState();
			return;
		}

		const tree = buildStillTimeTree(participantsData);
		const data = tree.children;
		if (!data.length) {
			renderEmptyState();
			return;
		}

		const categories = data.map((d) => d.name);
		const colorScale = getColorScale(categories);

		legendEntries = categories.map((category) => ({
			name: category,
			color: colorScale(category)
		}));

		const availableWidth = Math.max(160, width - resolvedMargin.left - resolvedMargin.right);
		const chartDiameter = Math.max(140, availableWidth * 0.6);
		const chartOffsetX = resolvedMargin.left + Math.max(0, (availableWidth - chartDiameter) / 2);
		const chartOffsetY = resolvedMargin.top;
		height = Math.max(minHeight, chartDiameter + resolvedMargin.top + resolvedMargin.bottom);

		if (!svg) {
			svg = rootSelection.append('svg').attr('class', 'still-time-bubbles');
			svg.on('click', () => selectStillTimeGroup(null));
		}

		svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height);
		container.style.minHeight = `${height}px`;

		const layout = pack().size([chartDiameter, chartDiameter]).padding(bubblePadding);

		const packed = layout(
			hierarchy(tree)
				.sum((d) => Math.max(1, d.value || 0))
				.sort((a, b) => (b.value || 0) - (a.value || 0))
		).leaves();

		const bubbles = svg.selectAll('g.bubble').data(packed, (d) => d.data.name);

		const bubblesEnter = bubbles
			.enter()
			.append('g')
			.attr('class', 'bubble')
			.attr('tabindex', 0)
			.attr('role', 'button')
			.attr('aria-pressed', 'false')
			.on('click', (event, d) => {
				event.stopPropagation();
				selectStillTimeGroup(d.data.name);
			})
			.on('keydown', (event, d) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					selectStillTimeGroup(d.data.name);
				}
			});

		bubblesEnter.append('circle');
		bubblesEnter.append('text').attr('class', 'bubble__label');
		bubblesEnter.append('text').attr('class', 'bubble__value');
		bubblesEnter.append('title');

		const bubblesMerged = bubblesEnter.merge(bubbles);

		bubblesMerged
			.attr(
				'transform',
				(d) => `translate(${chartOffsetX + d.x}, ${chartOffsetY + d.y})`
			)
			.each(function (d) {
				const group = select(this);
				const radius = Math.max(24, d.r);
				const labelLines = buildLines(d.data.name);
				const lineHeight = 20;
				const valueSpacing = 28;
				let labelScale = Math.max(0.58, Math.min(1, radius / 110));
				let valueScale = Math.max(0.58, Math.min(1, radius / 95));
				let scaledLineHeight = lineHeight * labelScale;
				let scaledValueSpacing = valueSpacing * valueScale;
				let totalLabelHeight = labelLines.length * scaledLineHeight;
				let contentHeight = totalLabelHeight + scaledValueSpacing;
				const availableHeight = radius * 1.75;
				if (contentHeight > availableHeight) {
					const factor = Math.max(0.45, availableHeight / contentHeight);
					labelScale *= factor;
					valueScale *= factor;
					scaledLineHeight = lineHeight * labelScale;
					scaledValueSpacing = valueSpacing * valueScale;
					totalLabelHeight = labelLines.length * scaledLineHeight;
					contentHeight = totalLabelHeight + scaledValueSpacing;
				}
				group.select('circle').attr('r', radius).attr('fill', colorScale(d.data.name));

				const label = group
					.select('.bubble__label')
					.attr('text-anchor', 'middle')
					.attr('fill', 'rgba(47, 52, 63, 0.92)')
					.style('font-size', `${16 * labelScale}px`);

				const tspans = label
					.selectAll('tspan')
					.data(labelLines, (line, index) => `${index}-${line}`);
				tspans.exit().remove();
				tspans
					.enter()
					.append('tspan')
					.merge(tspans)
					.attr('x', 0)
					.attr('dy', (line, index) => (index === 0 ? '0' : `${scaledLineHeight}px`))
					.text((line) => line);

				const valueText = group
					.select('.bubble__value')
					.attr('text-anchor', 'middle')
					.attr('fill', 'rgba(47, 52, 63, 0.92)')
					.text(formatter(d.data.value))
					.style('font-size', `${22 * valueScale}px`);

				const labelBox = label.node()?.getBBox() ?? { width: 0, height: 0 };
				const valueBox = valueText.node()?.getBBox() ?? { width: 0, height: 0 };
				const spacing = Math.max(8, 14 * valueScale);
				const totalHeight = labelBox.height + valueBox.height + spacing;
				const maxWidth = Math.max(labelBox.width, valueBox.width);
				const fitsInside = totalHeight <= radius * 1.85 && maxWidth <= radius * 1.85;
				const preferLeft = d.x0 + radius > width / 2;
				const offsetOutside = radius + 24;

				if (fitsInside) {
					const labelY = -valueBox.height / 2 - spacing / 2;
					const valueY = labelBox.height / 2 + spacing / 2;
					label
						.attr('text-anchor', 'middle')
						.attr('x', 0)
						.attr('y', labelY)
						.classed('outside', false);
					valueText
						.attr('text-anchor', 'middle')
						.attr('x', 0)
						.attr('y', valueY)
						.classed('outside', false);
				} else {
					const anchor = preferLeft ? 'end' : 'start';
					const xPos = (preferLeft ? -1 : 1) * offsetOutside;
					const baseY = -(labelBox.height + spacing + valueBox.height) / 2;
					label
						.attr('text-anchor', anchor)
						.attr('x', xPos)
						.attr('y', baseY + labelBox.height)
						.classed('outside', true);
					valueText
						.attr('text-anchor', anchor)
						.attr('x', xPos)
						.attr('y', baseY + labelBox.height + spacing + valueBox.height / 2)
						.classed('outside', true);
				}

				group.select('title').text(`${d.data.name}: ${formatter(d.data.value)} participante(s)`);
			})
			.attr('aria-pressed', (d) =>
				normalizeCategory(d.data.name) === currentGroup ? 'true' : 'false'
			);

		bubbles.exit().remove();

		updateSelectionHighlight();
	}

	function renderEmptyState() {
		if (!container) return;
		legendEntries = [];
		if (svg) {
			svg.remove();
			svg = null;
		}

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
		unsubscribeStillTime();
		unsubscribeSelectedParticipant();
	});
</script>

<div class="still-time-chart">
	{#if legendEntries.length}
		<div class="legend">
			{#each legendEntries as entry}
				<span
					class="legend__item"
					class:active={currentGroup === normalizeCategory(entry.name)}
					style={`--legend-color:${entry.color};`}
				>
					<span class="legend__swatch" aria-hidden="true"></span>
					<span class="legend__label">{entry.name}</span>
				</span>
			{/each}
		</div>
	{/if}
	<div class="chart-surface" bind:this={container}></div>
</div>

<style>
	.still-time-chart {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: clamp(0.4rem, 1.6vw, 0.75rem);
		align-items: center;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 0.45rem 0.85rem;
		text-align: center;
		margin: 0 auto -0.15rem;
		color: rgba(47, 52, 63, 0.72);
	}

	.legend__item {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		font-size: clamp(0.85rem, 1.4vw, 1rem);
		line-height: 1.2;
		color: inherit;
		transition: color 160ms ease;
	}

	.legend__item.active {
		color: rgba(47, 52, 63, 0.92);
	}

	.legend__swatch {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--legend-color, #8fa2ae);
		box-shadow: inset 0 0 0 1px rgba(47, 52, 63, 0.12);
	}

	.chart-surface {
		width: 100%;
		min-height: 220px;
		position: relative;
	}

	:global(svg.still-time-bubbles) {
		display: block;
		width: 100%;
		height: auto;
	}

	:global(svg.still-time-bubbles g.bubble) {
		cursor: pointer;
		transition: transform 160ms ease;
	}

	:global(svg.still-time-bubbles g.bubble circle) {
		filter: drop-shadow(0 14px 26px rgba(47, 52, 63, 0.14));
		transition:
			opacity 160ms ease,
			filter 160ms ease,
			transform 160ms ease;
	}

	:global(svg.still-time-bubbles.has-selection g.bubble.dimmed circle) {
		opacity: 0.3;
		filter: drop-shadow(0 10px 18px rgba(47, 52, 63, 0.1));
	}

	:global(svg.still-time-bubbles g.bubble.active circle),
	:global(svg.still-time-bubbles g.bubble:hover circle) {
		filter: drop-shadow(0 18px 32px rgba(47, 52, 63, 0.18));
	}

	:global(svg.still-time-bubbles g.bubble text) {
		font-family: 'Globotipo', 'Inter', system-ui, sans-serif;
		pointer-events: none;
	}

	:global(svg.still-time-bubbles g.bubble text.bubble__label) {
		font-size: clamp(0.92rem, 2.1vw, 1.12rem);
		font-weight: 500;
		line-height: 1.2;
	}

	:global(svg.still-time-bubbles g.bubble text.bubble__label.outside),
	:global(svg.still-time-bubbles g.bubble text.bubble__value.outside) {
		paint-order: stroke fill;
		stroke: rgba(240, 244, 248, 0.85);
		stroke-width: 3px;
		stroke-linejoin: round;
	}
	:global(svg.still-time-bubbles g.bubble text.bubble__value) {
		font-size: clamp(1.05rem, 2.6vw, 1.65rem);
		font-weight: 600;
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
