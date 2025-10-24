<script>
	import { onDestroy, onMount } from 'svelte';
	import { hierarchy, treemap as d3Treemap } from 'd3-hierarchy';
	import { select } from 'd3-selection';
	import { format } from 'd3-format';
import {
	participantActions,
	participantsList,
	selectedEmergency,
	selectedParticipant,
	activeGrouping as activeGroupingStore
} from '$lib/stores/participantStore.js';
	import { buildEmergencyFocusTree } from '$lib/utils/participantsData.js';

	export let minHeight = 320;
	export let maxHeight = 520;
	export let paddingInner = 2;

	const CATEGORY_COLORS = new Map([
		['Transformação do modelo global de consumo', '#c55345'],
		['Transição energética', '#cb634c'],
		['Proteção de florestas', '#d98155'],
		['Proteção de recursos hídricos', '#dea56b'],
		['Educação ambiental', '#c7b48d'],
		['Proteção dos povos indígenas', '#9ab4a4']
	]);

	const defaultPalette = ['#c55345', '#cb634c', '#d98155', '#dea56b', '#c7b48d', '#9ab4a4'];

	const formatter = format('d');

	function getColorHex(category, fallbackKey) {
		const normalized = normalizeGroup(category);
		if (normalized && CATEGORY_COLORS.has(normalized)) return CATEGORY_COLORS.get(normalized);
		return defaultPalette[fallbackKey % defaultPalette.length];
	}

	function hexToRgb(hex) {
		const clean = hex.replace('#', '');
		if (clean.length !== 6) return { r: 0, g: 0, b: 0 };
		return {
			r: Number.parseInt(clean.slice(0, 2), 16),
			g: Number.parseInt(clean.slice(2, 4), 16),
			b: Number.parseInt(clean.slice(4, 6), 16)
		};
	}

	function getContrastingTextColor(hex) {
		const { r, g, b } = hexToRgb(hex);
		const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
		return luminance > 0.62 ? 'rgba(64, 58, 52, 0.88)' : '#f6f2ea';
	}

	let container;
	let svg;
	let width = 0;
	let height = 0;

let participantsData = [];
let activeGroup = null;
let focusedParticipant = null;
let groupingMode = 'participant';
let localSelection = null;

const { selectEmergencyGroup } = participantActions;

	const unsubscribeParticipants = participantsList.subscribe((value) => {
		participantsData = value || [];
		requestRender();
	});

	const unsubscribeGroup = selectedEmergency.subscribe((value) => {
		activeGroup = value;
		updateSelectionHighlight();
	});

	const unsubscribeParticipant = selectedParticipant.subscribe((value) => {
		focusedParticipant = value;
		updateSelectionHighlight();
	});

	const unsubscribeGrouping = activeGroupingStore.subscribe((value) => {
		groupingMode = value || 'participant';
		if (groupingMode !== 'emergency') {
			localSelection = null;
		}
		updateSelectionHighlight();
	});

	let resizeObserver;
	let needsRender = false;
	let tooltipEl;
	let intersectionObserver;

	function normalizeGroup(value) {
		if (value === undefined || value === null) return null;
		const trimmed = String(value).trim();
		return trimmed.length ? trimmed : null;
	}

function setLocalSelection(value) {
	const normalized = normalizeGroup(value);
	if (!normalized) {
		clearLocalSelection();
		return;
	}
	if (localSelection === normalized && groupingMode === 'emergency') {
		clearLocalSelection();
		return;
	}
	localSelection = normalized;
	selectEmergencyGroup(normalized);
	updateSelectionHighlight();
}

function clearLocalSelection() {
	if (localSelection === null) return;
	const shouldResetStore =
		groupingMode === 'emergency' && normalizeGroup(activeGroup) === localSelection;
	localSelection = null;
	updateSelectionHighlight();
	if (shouldResetStore) {
		selectEmergencyGroup(null);
	}
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
					height = Math.min(Math.max(width * 0.55, minHeight), maxHeight);
					requestRender();
				}
			}
		});
		resizeObserver.observe(container);
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
		if (!participantsData?.length || !width) {
			renderEmptyState();
			return;
		}

		height = Math.min(Math.max(width * 0.55, minHeight), maxHeight);

		const treeData = buildEmergencyFocusTree(participantsData);
		const root = hierarchy(treeData)
			.sum((d) => d.value || 0)
			.sort((a, b) => b.value - a.value);

	if (
		localSelection !== null &&
		!treeData.children?.some((node) => normalizeGroup(node.name) === localSelection)
	) {
		clearLocalSelection();
	}

		const layout = d3Treemap().size([width, height]).paddingInner(paddingInner).round(true);
		layout(root);

		if (!svg) {
			svg = select(container).append('svg').attr('class', 'treemap');
		}

		svg.on('click', () => {
			clearLocalSelection();
		});

		svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height);

		const nodes = svg.selectAll('g.cell').data(root.leaves(), (d) => d.data.name);

		const nodesEnter = nodes
			.enter()
			.append('g')
			.attr('class', 'cell')
			.attr('data-category', (d) => d.data.name);

	nodesEnter.append('rect').attr('rx', 0).attr('ry', 0);

		nodesEnter
			.append('foreignObject')
			.attr('class', 'label-wrapper')
			.append('xhtml:div')
			.attr('class', 'label');

		const nodesMerged = nodesEnter.merge(nodes);

		nodesMerged
			.attr('transform', (d) => `translate(${d.x0},${d.y0})`)
			.each(function (d, index) {
				const fillColor = getColorHex(d.data.name, index);
		const textColor = getContrastingTextColor(fillColor);
		const node = select(this);
		node
			.select('rect')
			.attr('width', Math.max(0, d.x1 - d.x0))
			.attr('height', Math.max(0, d.y1 - d.y0))
			.attr('fill', fillColor)
			.attr('rx', 0)
			.attr('ry', 0);

				const innerWidth = Math.max(0, d.x1 - d.x0);
				const innerHeight = Math.max(0, d.y1 - d.y0);

				node
					.select('.label-wrapper')
					.attr('width', innerWidth)
					.attr('height', innerHeight)
					.select('.label')
					.html(() => {
						const safeName = d.data.name.replace(/</g, '&lt;');
						return `<span class="label__title">${safeName}</span><span class="label__value">${formatter(
							d.value || 0
						)}</span>`;
					})
					.style('color', textColor)
					.classed('label--compact', Math.min(innerWidth, innerHeight) < 140);
			})
			.on('mouseenter', function (event, d) {
				select(this).classed('hovered', true);
				showTooltip(event, d);
			})
			.on('mousemove', function (event, d) {
				updateTooltipPosition(event, d);
			})
			.on('mouseleave', function () {
				select(this).classed('hovered', false);
				hideTooltip();
			})
			.on('click', (event, d) => {
				event.stopPropagation();
				const category = normalizeGroup(d.data.name);
				if (category) setLocalSelection(category);
			});

		nodes.exit().remove();

		updateSelectionHighlight();
	}

	function ensureTooltip() {
		if (tooltipEl) return tooltipEl;
		tooltipEl = document.createElement('div');
		tooltipEl.className = 'treemap-tooltip';
		container?.appendChild(tooltipEl);
		return tooltipEl;
	}

	function showTooltip(event, node) {
		const tooltip = ensureTooltip();
		const people = node.data.participants || [];
		tooltip.innerHTML = `
			<strong>${node.data.name}</strong>
			<span>${formatter(node.value || 0)} ${node.value === 1 ? 'participante' : 'participantes'}</span>
			${people.length ? `<em>${people.map((p) => p.name).join(', ')}</em>` : ''}
		`;
		tooltip.style.opacity = '1';
		updateTooltipPosition(event);
	}

	function updateTooltipPosition(event) {
		if (!tooltipEl) return;
		const bounds = container.getBoundingClientRect();
		const left = event.clientX - bounds.left + 12;
		const top = event.clientY - bounds.top + 12;
		tooltipEl.style.transform = `translate(${left}px, ${top}px)`;
	}

	function hideTooltip() {
		if (!tooltipEl) return;
		tooltipEl.style.opacity = '0';
	}

	function updateSelectionHighlight() {
		if (!svg) return;
	const participantHighlight =
		groupingMode === 'participant-focus'
			? normalizeGroup(focusedParticipant?.emergencyFocus)
			: null;
	const highlightGroup = participantHighlight || localSelection;
		svg.classed('has-selection', Boolean(highlightGroup));
		svg.selectAll('g.cell').classed('active', (d) => {
			const category = normalizeGroup(d.data.name);
			return highlightGroup && category === highlightGroup;
		});
	}

	function renderEmptyState() {
		if (svg) {
			svg.remove();
			svg = null;
		}
		if (!container) return;
		select(container).selectAll('.empty-state').remove();
	}

onMount(() => {
	setupResizeObserver();
	setupIntersectionObserver();
	requestRender();
});

onDestroy(() => {
	clearLocalSelection();
	resizeObserver?.disconnect();
	intersectionObserver?.disconnect();
	unsubscribeParticipants();
	unsubscribeGroup();
	unsubscribeParticipant();
		unsubscribeGrouping();
		hideTooltip();
		tooltipEl?.remove();
	});
</script>

<div class="treemap-container" bind:this={container}></div>

<style>
	.treemap-container {
		position: relative;
		width: 100%;
		padding: 0;
		background: transparent;
		border-radius: 0;
	}

	:global(svg.treemap) {
		display: block;
		width: 100%;
		height: auto;
		border-radius: 0;
		overflow: hidden;
	}

	:global(svg.treemap g.cell rect) {
		transition: opacity 160ms ease;
		stroke: none;
	}

	:global(svg.treemap.has-selection g.cell rect) {
		opacity: 0.3;
	}

	:global(svg.treemap.has-selection g.cell.active rect) {
		opacity: 1;
	}

	:global(svg.treemap g.cell .label-wrapper) {
		pointer-events: none;
	}

	:global(svg.treemap g.cell .label) {
		height: 100%;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: clamp(0.3rem, 1.2vw, 0.8rem);
		padding: clamp(0.6rem, 2.4vw, 1.6rem);
		text-align: center;
		color: inherit;
		font-family: 'Globotipo', 'Inter', system-ui, sans-serif;
		font-weight: 400;
		text-transform: none;
		box-sizing: border-box;
		transition: color 160ms ease;
	}

	:global(svg.treemap.has-selection g.cell:not(.active) .label) {
		color: rgba(15, 23, 42, 0.55);
	}

	:global(svg.treemap g.cell.active .label) {
		color: #0f172a;
	}

	:global(svg.treemap g.cell .label__title) {
		font-size: clamp(0.92rem, 1.6vw, 1.28rem);
		line-height: 1.25;
		font-weight: 400;
	}

	:global(svg.treemap g.cell .label__value) {
		font-size: clamp(1.05rem, 1.9vw, 1.6rem);
		font-weight: 600;
	}

	:global(svg.treemap g.cell .label.label--compact .label__title) {
		font-size: clamp(0.78rem, 1.4vw, 1.05rem);
	}

	:global(svg.treemap g.cell .label.label--compact .label__value) {
		font-size: clamp(0.95rem, 1.8vw, 1.35rem);
	}

		.treemap-tooltip {
			position: absolute;
			background: rgba(15, 23, 42, 0.88);
			color: #f8fafc;
			padding: 0.75rem 1rem;
			border-radius: 0;
			pointer-events: none;
			transition: opacity 120ms ease;
			opacity: 0;
			max-width: min(260px, 70vw);
			font-size: 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.treemap-tooltip strong {
		font-size: 0.95rem;
	}

	.treemap-tooltip em {
		font-style: normal;
		color: rgba(226, 232, 240, 0.85);
		font-size: 0.8rem;
	}

		.empty-state {
			width: 100%;
			min-height: 220px;
			border-radius: 0;
		border: 1px dashed rgba(148, 163, 184, 0.35);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.95rem;
		color: rgba(100, 116, 139, 0.8);
		background: rgba(248, 250, 252, 0.28);
	}
</style>
