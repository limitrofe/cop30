<script>
	import { onDestroy, onMount } from 'svelte';

	const DYNAMIC_TOKENS = new Set(['auto', 'dynamic', 'viewport', 'full', '45vh', 'default']);
	const FALLBACK_DYNAMIC_TRAVEL = '80vh';

	export let stepText;
	export let i;
	export let length;
	export let position = 'right';
	export let variant = '';
	export let active = false;
	export let backgroundColor = '';
	export let textColor = '';
	export let accentColor = '';
	export let borderColor = '';
	export let padding = '';
	export let maxWidth = '';
	export let maxWidthMobile = '';
	export let stickyTop = '';
	export let cardVisibility = 'card'; // card | transparent | hidden
	export let progress = null;
export let slideFromBottom = false;
	export let travelDistance = 'auto';

	let stepContent;
	let resizeObserver;
	let dynamicTravelDistance = null;

	const parsePx = (value) => {
		if (!value) return 0;
		const parsed = parseFloat(value);
		return Number.isNaN(parsed) ? 0 : parsed;
	};

	const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

const resolveFixedTravel = (value) => {
	if (typeof value !== 'string') return value;
	const trimmed = value.trim();
	if (!trimmed) return FALLBACK_DYNAMIC_TRAVEL;

		if (trimmed.startsWith('fixed:')) {
			const extracted = trimmed.slice(6).trim();
			return extracted || FALLBACK_DYNAMIC_TRAVEL;
		}

		if (trimmed.startsWith('fixed(') && trimmed.endsWith(')')) {
			const extracted = trimmed.slice(6, -1).trim();
			return extracted || FALLBACK_DYNAMIC_TRAVEL;
		}

	return value;
};

const ensureFullOpacity = (value) => {
	if (typeof value !== 'string') return value;
	const trimmed = value.trim();
	const rgbaMatch = trimmed.match(/^rgba\(\s*([^)]+)\)$/i);
	if (!rgbaMatch) return trimmed;
	const channels = rgbaMatch[1]
		.split(',')
		.map((channel) => channel.trim())
		.filter(Boolean);
	if (channels.length < 3) return trimmed;
	const [r, g, b] = channels;
	return `rgba(${r}, ${g}, ${b}, 1)`;
};

	$: normalizedTravel =
		typeof travelDistance === 'string' ? travelDistance.trim().toLowerCase() : travelDistance;
	$: shouldUseDynamicTravel =
		slideFromBottom && (!travelDistance || DYNAMIC_TOKENS.has(normalizedTravel));

	const getViewportHeight = () => (typeof window !== 'undefined' ? window.innerHeight || 0 : 0);

	const computeDynamicTravel = () => {
		if (!stepContent || !shouldUseDynamicTravel) return;

		const viewportHeight = getViewportHeight();
		const rect = stepContent.getBoundingClientRect();
		const styles = getComputedStyle(stepContent);
		const stickyTopPx = parsePx(styles.top);
		const safetyGap = viewportHeight >= 768 ? 48 : 32;
		const availableAboveSticky = Math.max(0, viewportHeight - stickyTopPx);
		const overflow = Math.max(0, rect.height - availableAboveSticky);
		const travelPx = Math.max(availableAboveSticky + overflow + safetyGap, availableAboveSticky);
		dynamicTravelDistance = `${travelPx}px`;
	};

	const handleResize = () => computeDynamicTravel();

	onMount(() => {
		if (typeof ResizeObserver !== 'undefined') {
			resizeObserver = new ResizeObserver(() => computeDynamicTravel());
			if (stepContent) {
				resizeObserver.observe(stepContent);
			}
		}

		if (typeof window !== 'undefined') {
			window.addEventListener('resize', handleResize);
		}
		computeDynamicTravel();
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', handleResize);
		}
		if (resizeObserver) {
			resizeObserver.disconnect();
			resizeObserver = null;
		}
	});

	$: if (shouldUseDynamicTravel) {
		computeDynamicTravel();
	}

	$: isTransparentCard = cardVisibility === 'transparent';
	$: isHiddenCard = cardVisibility === 'hidden';
	$: effectiveTravelDistance = slideFromBottom
		? shouldUseDynamicTravel
			? dynamicTravelDistance || FALLBACK_DYNAMIC_TRAVEL
			: resolveFixedTravel(travelDistance) || FALLBACK_DYNAMIC_TRAVEL
		: '0px';
	$: computedProgress = progress != null ? clamp(progress) : active ? 1 : 0;
	$: resolvedBackgroundColor =
		typeof backgroundColor === 'string' && backgroundColor.trim()
			? ensureFullOpacity(backgroundColor)
			: backgroundColor;
	$: styleVars = [
		resolvedBackgroundColor ? `--step-bg-color:${resolvedBackgroundColor}` : '',
		textColor ? `--step-text-color:${textColor}` : '',
		accentColor ? `--step-heading-color:${accentColor}` : '',
		accentColor ? `--step-accent-color:${accentColor}` : '',
		borderColor ? `--step-border-color:${borderColor}` : '',
		padding ? `--step-padding:${padding}` : '',
		maxWidth ? `--step-max-width:${maxWidth}` : '',
		maxWidthMobile ? `--step-max-width-mobile:${maxWidthMobile}` : '',
		stickyTop ? `--step-sticky-top:${stickyTop}` : '',
		`--step-travel:${effectiveTravelDistance}`,
		slideFromBottom ? `--step-progress:${computedProgress}` : '',
		slideFromBottom
			? `--step-transform:translateY(calc((1 - var(--step-progress, 1)) * var(--step-travel, 0px)))`
			: ''
	]
		.filter(Boolean)
		.join(';');
</script>

<section
	class="step-container position-{position}"
	class:last-section={i === length}
	class:active
	class:transparent-card={isTransparentCard}
	class:hidden-card={isHiddenCard}
>
	{#if !isHiddenCard}
		<div
			class="step-content"
			bind:this={stepContent}
			class:destaque={variant === 'destaque'}
			class:transparent-card={isTransparentCard}
			data-step-content
			style={styleVars}
		>
			{@html stepText}
		</div>
	{/if}
</section>

<style>
	.step-container {
		display: flex;
		align-items: center;
		min-height: var(--step-container-min-height, calc(100vh + var(--step-travel, 80vh)));
		padding: 0 5vw;
		padding-top: var(--step-container-padding-top, 0);
		padding-bottom: var(--step-container-padding-bottom, calc(var(--step-travel, 80vh) + 15vh));
		pointer-events: auto;
		visibility: visible;
	}

	.step-container.hidden-card {
		pointer-events: none;
	}
	/* NOVO: Posicionamentos baseados na classe */
	.position-left {
		justify-content: flex-start;
	}

	.position-center {
		justify-content: center;
	}

	.position-right {
		justify-content: flex-end;
	}

	.step-content {
		background-color: var(--step-bg-color, rgba(var(--color-background-rgb), 0.9));
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		color: var(--step-text-color, var(--color-text));
		padding: var(--step-padding, 2rem);
		border: 1px solid var(--step-border-color, var(--color-border));
		border-radius: 12px;
		max-width: var(--step-max-width, 450px);
		width: 100%;
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
		position: sticky;
		top: var(--step-sticky-top, min(0vh, 0px));
		transform: none;
		will-change: auto;
	}

	.step-content.transparent-card {
		/* background-color: transparent !important; */
		border: none;
		box-shadow: none;
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
	}

	:global(.step-content h3) {
		font-size: var(--font-size-90);
		font-weight: 700;
		margin: 0 0 1rem 0;
		color: var(--step-heading-color, var(--color-primary));
		line-height: 1.2;
	}

	:global(.step-content div) {
		font-size: var(--font-size-60);
		line-height: 1.6;
	}

	.last-section {
		margin-bottom: 0;
		min-height: 0;
		padding-bottom: var(
			--step-container-padding-bottom-last,
			calc(var(--step-travel, 80vh) + 25vh)
		);
	}

	@media (max-width: 768px) {
		.step-container {
			justify-content: center !important; /* Mobile sempre centralizado */
			min-height: var(--step-container-min-height-mobile, calc(100vh + var(--step-travel, 80vh)));
			padding-top: var(--step-container-padding-top-mobile, 0);
			padding-bottom: var(
				--step-container-padding-bottom-mobile,
				calc(var(--step-travel, 80vh) + 15vh)
			);
		}

		.step-content {
			max-width: var(--step-max-width-mobile, 90%);
			top: var(--step-sticky-top, 12vh);
			will-change: transform;
		}

		.step-container.hidden-card {
			padding-bottom: var(
				--step-container-padding-bottom-hidden,
				calc(var(--step-travel, 80vh) + 10vh)
			);
		}
	}
	/* Cole no final do <style> em Step.svelte */

	.step-content.destaque {
		background-color: var(--step-bg-color, rgba(255, 255, 255, 0.9));
		border-left: var(--step-destaque-border-width, 5px) solid
			var(
				--step-destaque-border-color,
				var(--step-accent-color, var(--step-border-color, var(--color-primary, #c4170c)))
			);
		color: var(--step-text-color, #1a1a1a);
		backdrop-filter: var(--step-destaque-backdrop-filter, blur(4px));
		-webkit-backdrop-filter: var(--step-destaque-backdrop-filter, blur(4px));
	}

	/* Como o conteúdo vem via {@html}, usamos :global() para estilizar 
  as tags que estão dentro do .step-content.destaque 
*/
	:global(.step-content.destaque h3) {
		color: var(--step-heading-color, var(--step-text-color, #1a1a1a));
		font-size: 1.1rem;
		font-weight: 600;
	}

	:global(.step-content.destaque div),
	:global(.step-content.destaque blockquote) {
		font-family: 'globotipo', sans-serif; /* Fonte diferente para dar um ar de citação */
		font-size: 1.5rem; /* Fonte um pouco maior */
		line-height: 1.5;
		font-style: italic;
		color: var(--step-text-color, #333);
		border: none;
		padding: 0;
		margin: 0;
	}
</style>
