import { zoom, zoomIdentity } from 'd3-zoom';
import { select } from 'd3-selection';

/**
 * @typedef {'x' | 'y' | 'xy'} ZoomMode
 */

/**
 * @typedef {Object} ZoomManagerOptions
 * @property {SVGSVGElement} svg
 * @property {() => number} getWidth
 * @property {() => number} getHeight
 * @property {() => import('d3-scale').ScaleLinear<any, any>} createOriginalXScale
 * @property {() => import('d3-scale').ScaleLinear<any, any>} [createOriginalYScale]
 * @property {(payload: { transform: import('d3-zoom').ZoomTransform, xScale: any, yScale: any }) => void} onTransform
 * @property {{ min?: number, max?: number }} [scaleExtent]
 * @property {[[number, number], [number, number]]} [translateExtent]
 * @property {ZoomMode} [mode]
 */

/**
 * Lightweight helper around d3-zoom to keep SVG zoom wiring consistent across charts.
 * The consumer is responsible for reacting to the `onTransform` callback (e.g. recomputing
 * geometries or applying transforms).
 *
 * @param {ZoomManagerOptions} options
 */
export function createZoomManager(options) {
	const {
		svg,
		getWidth,
		getHeight,
		createOriginalXScale,
		createOriginalYScale,
		onTransform,
		scaleExtent = { min: 1, max: 16 },
		translateExtent,
		mode = 'x'
	} = options;

	if (!svg || typeof onTransform !== 'function') {
		return {
			destroy: () => {},
			reset: () => {}
		};
	}

	let currentTransform = zoomIdentity;
	let originalXScale = createOriginalXScale();
	let originalYScale = createOriginalYScale?.();

	const svgSelection = select(svg);

	const computeTranslateExtent = () => {
		const width = getWidth();
		const height = getHeight();
		if (translateExtent && Array.isArray(translateExtent[0]) && Array.isArray(translateExtent[1])) {
			return translateExtent;
		}
		return [
			[0, 0],
			[width, height]
		];
	};

	const zoomBehavior = zoom()
		.scaleExtent([scaleExtent.min ?? 1, scaleExtent.max ?? 16])
		.translateExtent(computeTranslateExtent())
		.filter((event) => {
			if (event.type === 'wheel' || event.type === 'touchmove' || event.type === 'pinch')
				return true;
			if (event.type === 'dblclick') return true;
			if (event.type === 'mousedown' || event.type === 'pointerdown') {
				if (mode === 'x') {
					return event.button === 0 && !event.shiftKey;
				}
				if (mode === 'y') {
					return event.button === 0;
				}
				return event.button === 0;
			}
			return false;
		})
		.on('zoom', (event) => {
			const transform =
				mode === 'y'
					? zoomIdentity.scale(event.transform.k).translate(0, event.transform.y)
					: event.transform;
			currentTransform = transform;
			const nextX = currentTransform.rescaleX(originalXScale);
			const nextY = originalYScale ? currentTransform.rescaleY(originalYScale) : undefined;
			onTransform({ transform: currentTransform, xScale: nextX, yScale: nextY });
		});

	svgSelection.call(zoomBehavior);
	svgSelection.style('cursor', mode === 'x' ? 'ew-resize' : mode === 'y' ? 'ns-resize' : 'grab');

	return {
		/** @returns {import('d3-zoom').ZoomTransform} */
		getTransform() {
			return currentTransform;
		},
		reset(duration = 250) {
			const transition = svgSelection.transition().duration(duration);
			transition.call(zoomBehavior.transform, zoomIdentity);
			currentTransform = zoomIdentity;
			const nextX = currentTransform.rescaleX(originalXScale);
			const nextY = originalYScale ? currentTransform.rescaleY(originalYScale) : undefined;
			onTransform({ transform: currentTransform, xScale: nextX, yScale: nextY });
		},
		updateScales() {
			originalXScale = createOriginalXScale();
			originalYScale = createOriginalYScale?.();
			const nextX = currentTransform.rescaleX(originalXScale);
			const nextY = originalYScale ? currentTransform.rescaleY(originalYScale) : undefined;
			onTransform({ transform: currentTransform, xScale: nextX, yScale: nextY });
		},
		updateExtent() {
			zoomBehavior.translateExtent(computeTranslateExtent());
		},
		destroy() {
			svgSelection.on('.zoom', null);
			svgSelection.style('cursor', null);
		}
	};
}
