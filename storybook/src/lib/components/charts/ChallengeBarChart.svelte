<script>
	import { onDestroy, onMount } from 'svelte';
	import { scaleLinear, scaleOrdinal } from 'd3-scale';
	import { select } from 'd3-selection';
	import { format } from 'd3-format';
import {
	participantActions,
	participantsList,
	selectedChallenge,
	selectedParticipant,
	activeGrouping as activeGroupingStore
} from '$lib/stores/participantStore.js';
	import { buildChallengeTree } from '$lib/utils/participantsData.js';

	export let minHeight = 260;
	export let barPadding = 20;
	export let barInnerPadding = 0.22;
	export let margin = { top: 52, right: 72, bottom: 48, left: 60 };

	const palette = ['#c84f3d', '#de6b3f', '#e78443', '#eeb058', '#ceb47b', '#88b8a3'];
	const formatter = format('d');
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
	let groupingMode = 'participant';
	let focusedParticipant = null;
	let localSelection = null;

	const { selectChallengeGroup } = participantActions;

	const unsubscribeParticipants = participantsList.subscribe((value) => {
		participantsData = value || [];
		requestRender();
	});

	const unsubscribeChallenge = selectedChallenge.subscribe((value) => {
		activeChallenge = value;
		updateSelectionHighlight();
	});

	const unsubscribeGrouping = activeGroupingStore.subscribe((value) => {
		groupingMode = value || 'participant';
		if (groupingMode !== 'challenge') {
			localSelection = null;
		}
		updateSelectionHighlight();
	});

	const unsubscribeFocusedParticipant = selectedParticipant.subscribe((value) => {
		focusedParticipant = value;
		updateSelectionHighlight();
	});

	let resizeObserver;
	let needsRender = false;
	let intersectionObserver;

	function normalizeCategory(value) {
		if (value === undefined || value === null) return null;
		const trimmed = String(value).trim();
		return trimmed.length ? trimmed : null;
	}

	function setLocalSelection(category) {
		const normalized = normalizeCategory(category);
		if (!normalized) {
			clearLocalSelection();
			return;
		}
		if (localSelection === normalized && groupingMode === 'challenge') {
			clearLocalSelection();
			return;
		}
		localSelection = normalized;
		selectChallengeGroup(normalized);
		updateSelectionHighlight();
	}

	function clearLocalSelection() {
		if (localSelection === null) return;
		const shouldResetStore =
			groupingMode === 'challenge' && normalizeCategory(activeChallenge) === localSelection;
		localSelection = null;
		updateSelectionHighlight();
		if (shouldResetStore) {
			selectChallengeGroup(null);
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

		if (
			localSelection !== null &&
			!data.some((item) => normalizeCategory(item.name) === localSelection)
		) {
			clearLocalSelection();
		}

		const baseMargin = {
			top: typeof margin?.top === 'number' ? margin.top : 52,
			right: typeof margin?.right === 'number' ? margin.right : 72,
			bottom: typeof margin?.bottom === 'number' ? margin.bottom : 48,
			left: typeof margin?.left === 'number' ? margin.left : 60
		};
		const useMobileLayout = (() => {
			if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
				return width <= 640;
			}
			return window.matchMedia('(max-width: 640px)').matches;
		})();
		const valueGap = 4;
		const sanitizedValues = data.map((d) => (typeof d.value === 'number' ? d.value : 0));
		const maxValue = Math.max(...sanitizedValues, 0);
		const formattedMaxValue = formatter(maxValue);
		const maxValueCharacters = formattedMaxValue.length || 1;
		const estimatedDigitWidth = useMobileLayout ? 9 : 10;
		const valueLabelSpace =
			valueGap + maxValueCharacters * estimatedDigitWidth + (useMobileLayout ? 6 : 10);
		const effectiveMargin = useMobileLayout
			? {
					...baseMargin,
					left: 12,
					right: valueLabelSpace
				}
			: {
					...baseMargin,
					right: Math.max(baseMargin.right, valueLabelSpace)
				};

		const labelHeight = 20;
		const innerGap = 4;
		const baseBarHeight = 24;
		const blockHeight = labelHeight + innerGap + baseBarHeight + innerGap;
		const chartHeight = data.length * blockHeight;
		height = Math.max(minHeight, chartHeight) + effectiveMargin.top + effectiveMargin.bottom;

		if (!svg) {
			svg = select(container).append('svg').attr('class', 'challenge-bars');
		}

		svg.on('click', (event) => {
			event?.stopPropagation();
			clearLocalSelection();
		});

		svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height);
		container.style.minHeight = `${height}px`;

		const chartWidth = Math.max(0, width - effectiveMargin.left - effectiveMargin.right);

		const xScale = scaleLinear().domain([0, maxValue]).range([0, chartWidth]).nice();

		svg.selectAll('g.axis').remove();

		const categories = data.map((d) => d.name);
		const colorScale = scaleOrdinal()
			.domain(categories)
			.range(
				categories.map(
					(name, index) => labelStyles.get(name)?.fill || palette[index % palette.length]
				)
			);

		const bars = svg.selectAll('g.bar').data(data, (d) => d.name);

		const barsEnter = bars.enter().append('g').attr('class', 'bar');

		barsEnter.append('rect');
		barsEnter.append('text').attr('class', 'bar__label');
		barsEnter.append('text').attr('class', 'bar__value');

		const barsMerged = barsEnter.merge(bars);

		barsMerged
			.attr('transform', (d, index) => {
				const yOffset = effectiveMargin.top + index * blockHeight;
				return `translate(${effectiveMargin.left}, ${yOffset})`;
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
					.attr('rx', 0)
					.attr('ry', 0);

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
					.attr('x', barWidth + valueGap)
					.attr('y', labelHeight + innerGap + barHeight / 2)
					.attr('dy', '0')
					.attr('fill', labelInfo?.text || '#3c332a')
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
			groupingMode === 'participant-focus'
				? normalizeCategory(focusedParticipant?.challenge2050)
				: null;
		const highlightCategory = participantHighlight || localSelection;
		svg.classed('has-selection', Boolean(highlightCategory));
		svg.selectAll('g.bar').classed('active', (d) => {
			const category = normalizeCategory(d.name);
			return highlightCategory && category === highlightCategory;
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
		requestRender();
	});

	onDestroy(() => {
		clearLocalSelection();
		resizeObserver?.disconnect();
		intersectionObserver?.disconnect();
		unsubscribeParticipants();
		unsubscribeChallenge();
		unsubscribeGrouping();
		unsubscribeFocusedParticipant();
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
		border-radius: 0;
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
