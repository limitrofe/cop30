<script context="module">
	const handlers = [];
	let manager;
	if (typeof window !== 'undefined') {
		const run_all = () => handlers.forEach((fn) => fn());
		window.addEventListener('scroll', run_all);
		window.addEventListener('resize', run_all);
	}

	if (typeof IntersectionObserver !== 'undefined') {
		const map = new Map();
		const observer = new IntersectionObserver(
			(entries, observer) => {
				entries.forEach((entry) => {
					const update = map.get(entry.target);
					const index = handlers.indexOf(update);

					if (entry.isIntersecting) {
						if (index === -1) handlers.push(update);
					} else {
						update();

						if (index !== -1) handlers.splice(index, 1);
					}
				});
			},
			{
				rootMargin: '100px 0px'
			}
		);
		manager = {
			add: ({ outer, update }) => {
				const { top, bottom } = outer.getBoundingClientRect();
				if (top < window.innerHeight && bottom > 0) handlers.push(update);

				map.set(outer, update);
				observer.observe(outer);
			},

			remove: ({ outer, update }) => {
				const index = handlers.indexOf(update);
				if (index !== -1) handlers.splice(index, 1);

				map.delete(outer);
				observer.unobserve(outer);
			}
		};
	} else {
		manager = {
			add: ({ update }) => {
				handlers.push(update);
			},

			remove: ({ update }) => {
				const index = handlers.indexOf(update);
				if (index !== -1) handlers.splice(index, 1);
			}
		};
	}
</script>

<script>
	import { onMount } from 'svelte';

	// config
	export let top = 0;
	export let bottom = 1;
	export let threshold = 0.1;
	export let query = 'section';
	export let parallax = false;
	export let activationRatio = 0;
	export let exitRatio = 0;
	export let advanceMode = 'enter'; // 'enter' | 'exit'
	// bindings
	export let index = 0;
	export let count = 0;
	export let offset = 0;
	export let progress = 0;
	export let visible = false;

	let outer;
	let foreground;
	let background;
	let left;
	let sections;
	let sectionContents = [];
	let wh = 0;
	let fixed;
	let offset_top = 0;
	let width = 1;
	let height;
	let inverted;
	$: top_px = Math.round(top * wh);
	$: bottom_px = Math.round(bottom * wh);
	$: threshold_px = Math.round(threshold * wh);
	$: (top, bottom, threshold, parallax, activationRatio, exitRatio, advanceMode, update());

	$: style = `
        position: ${fixed ? 'fixed' : 'absolute'};
        top: 0;
        transform: translate(0, ${offset_top}px);
        z-index: ${inverted ? 3 : 1};
    `;

	$: widthStyle = fixed ? `width:${width}px;` : '';
	onMount(() => {
		sections = foreground.querySelectorAll(query);
		sectionContents = Array.from(sections).map((section) =>
			section.querySelector('[data-step-content]')
		);
		count = sections.length;

		update();

		const scroller = { outer, update };

		manager.add(scroller);
		return () => manager.remove(scroller);
	});
	function update() {
		if (!foreground) return;
		if (!sections || !sections.length) return;
		if (sectionContents.length !== sections.length) {
			sectionContents = Array.from(sections).map((section) =>
				section.querySelector('[data-step-content]')
			);
		}

		const normalizeRatio = (value, fallback = 0) => {
			if (value === null || value === undefined) return fallback;
			const numeric = typeof value === 'string' ? parseFloat(value) : value;
			if (Number.isNaN(numeric)) return fallback;
			return Math.min(1, Math.max(0, numeric));
		};

		const activationRatioValue = normalizeRatio(activationRatio, 0);

		const getRects = (idx) => {
			const section = sections?.[idx];
			if (!section) return null;
			const containerRect = section.getBoundingClientRect();
			const contentEl = sectionContents[idx];
			const contentRect = contentEl ? contentEl.getBoundingClientRect() : containerRect;
			return { containerRect, contentRect };
		};

		const bcr = outer.getBoundingClientRect();
		left = bcr.left;
		width = bcr.right - left;
		const fg = foreground.getBoundingClientRect();
		const bg = background.getBoundingClientRect();
		visible = fg.top < wh && fg.bottom > 0;
		const foreground_height = fg.bottom - fg.top;
		const background_height = bg.bottom - bg.top;

		const available_space = bottom_px - top_px;
		const progressDenominator = foreground_height - available_space;
		let normalizedProgress = 0;

		if (progressDenominator > 0) {
			normalizedProgress = (top_px - fg.top) / progressDenominator;
		} else if (foreground_height) {
			normalizedProgress = fg.top <= top_px ? 1 : 0;
		}

		normalizedProgress = Math.max(0, Math.min(1, normalizedProgress));
		progress = normalizedProgress * 100;

		if (normalizedProgress <= 0) {
			offset_top = 0;
			fixed = false;
		} else if (normalizedProgress >= 1) {
			offset_top = parallax
				? foreground_height - background_height
				: foreground_height - available_space;
			fixed = false;
		} else {
			offset_top = parallax
				? Math.round(top_px - normalizedProgress * (background_height - available_space))
				: top_px;
			fixed = true;
		}

		if (!sections.length) return;

		const available_space_safe = Math.max(0, bottom_px - top_px);
		const activationLineRaw = top_px + threshold_px + activationRatioValue * available_space_safe;
		const activationLine = Math.round(Math.min(bottom_px, Math.max(top_px, activationLineRaw)));

		const normalizedIndex = Math.max(0, Math.min(index, sections.length - 1));
		const previousIndex = normalizedIndex;
		let candidateIndex = previousIndex;
		let candidateRects = getRects(previousIndex);
		if (!candidateRects) {
			candidateIndex = 0;
			candidateRects = getRects(0);
		}

		for (let i = 0; i < sections.length; i++) {
			const rects = getRects(i);
			if (!rects) continue;
			if (i > normalizedIndex) {
				const nextRect = rects.contentRect || rects.containerRect;
				if (candidateRects) {
					const currentTop =
						candidateRects.contentRect?.top ?? candidateRects.containerRect?.top ?? 0;
					const nextTop = nextRect?.top ?? 0;
					if (Math.abs(nextTop - activationLine) < Math.abs(currentTop - activationLine)) {
						candidateIndex = i;
						candidateRects = rects;
					}
				}
			} else {
				const targetRect = rects.contentRect || rects.containerRect;
				if (targetRect.top <= activationLine) {
					candidateIndex = i;
					candidateRects = rects;
				}
			}
		}

		const viewportHeight = wh || (typeof window !== 'undefined' ? window.innerHeight || 0 : 0);

		let nextIndex = candidateIndex;

		const currentRects = getRects(normalizedIndex);
		const currentContentRect = currentRects?.contentRect || currentRects?.containerRect || null;
		const currentContainerRect = currentRects?.containerRect || currentRects?.contentRect || null;
		let rectForOffset = candidateRects?.containerRect || candidateRects?.contentRect || null;

		if (!rectForOffset) {
			rectForOffset = currentContentRect;
		}

		const contentStillVisible =
			currentContentRect &&
			viewportHeight > 0 &&
			currentContentRect.bottom > 0 &&
			currentContentRect.top < viewportHeight;

		const isCandidateAhead = candidateIndex >= normalizedIndex;
		if (advanceMode === 'exit' && contentStillVisible && isCandidateAhead) {
			nextIndex = normalizedIndex;
			rectForOffset = currentContainerRect || rectForOffset;
		}

		index = nextIndex;

		if (rectForOffset) {
			const height = rectForOffset.height || 1;
			const progressRaw = (activationLine - rectForOffset.top) / height;
			offset = Math.max(0, Math.min(1, progressRaw));
		}
	}
</script>

<svelte:window bind:innerHeight={wh} />

<div bind:this={outer} class="scroller-outer">
	<div class="background-container" style="{style}{widthStyle}">
		<div bind:this={background} class="scroller-background">
			<slot name="background" />
		</div>
	</div>

	<div bind:this={foreground} class="scroller-foreground">
		<slot name="foreground" />
	</div>
</div>

<style>
	.scroller-outer {
		display: block;
		position: relative;
	}
	.scroller-background {
		display: block;
		position: relative;
		width: 100%;
	}
	.scroller-foreground {
		display: block;
		position: relative;
		z-index: 2;
		pointer-events: none;
	}
	.scroller-foreground::after {
		content: ' ';
		display: block;
		clear: both;
	}
	.background-container {
		display: block;
		position: absolute;
		width: 100%;
		max-width: 100%;
		will-change: transform;
	}
</style>
