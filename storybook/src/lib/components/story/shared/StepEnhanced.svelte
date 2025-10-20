<!-- src/lib/components/story/shared/StepEnhanced.svelte -->
<script>
	import { onDestroy, onMount } from 'svelte';

	const DYNAMIC_TOKENS = new Set(['auto', 'dynamic', 'viewport', 'full', '45vh', 'default']);
	const FALLBACK_DYNAMIC_TRAVEL = '80vh';

	export let step;
	export let isMobile;
	export let stepIndex;
	export let totalSteps;
	export let active = false;
	export let defaultStickyTopDesktop = 'min( 0px)';
	export let defaultStickyTopMobile = '12vh';
	export let progress = null;
export let slideFromBottom = false;
	export let travelDistance = 'auto';

	let stepContentElement;
	let resizeObserver;
	let dynamicTravelDistance = null;

	const parsePx = (value) => {
		if (!value) return 0;
		const parsed = parseFloat(value);
		return Number.isNaN(parsed) ? 0 : parsed;
	};

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

	const getViewportHeight = () => (typeof window !== 'undefined' ? window.innerHeight || 0 : 0);

	const computeDynamicTravel = () => {
		if (!stepContentElement || !shouldUseDynamicTravel) return;

		const viewportHeight = getViewportHeight();
		const rect = stepContentElement.getBoundingClientRect();
		const styles = getComputedStyle(stepContentElement);
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
			if (stepContentElement) {
				resizeObserver.observe(stepContentElement);
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

	// Configurações padrão do step
	$: textConfig = step.textConfig || {};

	// Visibilidade do card
	$: cardVisibility = textConfig.cardVisibility || step.cardVisibility || 'card';
	$: isTransparentCard = cardVisibility === 'transparent';
	$: isHiddenCard = cardVisibility === 'hidden';

	// Motion desativado: mantém o card estático sem animação
	const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
	$: effectiveSlideFromBottom = false;
	$: shouldUseDynamicTravel = false;
	$: resolvedTravelDistance = '0px';
	$: stepProgress = progress != null ? clamp(progress) : active ? 1 : 0;

	// Offset sticky respeitando overrides por device
	$: stickyTop = isMobile
		? (textConfig.stickyTopMobile ??
			textConfig.stickyTop ??
			step?.stickyTopMobile ??
			step?.stickyTop ??
			defaultStickyTopMobile)
		: (textConfig.stickyTop ?? step?.stickyTop ?? defaultStickyTopDesktop);

	// Posicionamento
	$: position = isMobile
		? textConfig.positionMobile || textConfig.position || 'center'
		: textConfig.position || 'right';

	// Estilos do container
	$: baseContainerStyles = {
		backgroundColor: isTransparentCard
			? 'transparent'
			: (textConfig.backgroundColor ?? 'rgba(var(--color-background-rgb), 0.9)'),
		borderRadius: textConfig.borderRadius || '12px',
		padding: textConfig.padding || '2rem',
		maxWidth: isMobile ? textConfig.maxWidthMobile || '90%' : textConfig.maxWidth || '450px',
		backdropFilter: isTransparentCard ? 'none' : textConfig.backdropFilter || 'blur(8px)',
		border: isTransparentCard ? 'none' : textConfig.border || '1px solid var(--color-border)',
		boxShadow: isTransparentCard ? 'none' : textConfig.boxShadow || '0 8px 30px rgba(0,0,0,0.15)',
		position: textConfig.positioning || 'sticky',
		top: stickyTop,
		pointerEvents: isHiddenCard ? 'none' : 'auto',
		...textConfig.customStyles
	};

	$: containerStyles = {
		...baseContainerStyles,
		'--step-travel': resolvedTravelDistance
	};

	// Função para renderizar elementos tipográficos
	function renderElement(element) {
		const styles = {
			color: isMobile
				? element.colorMobile || element.color || '#ffffff'
				: element.color || '#ffffff',
			fontSize: isMobile
				? element.fontSizeMobile || element.fontSize || '1rem'
				: element.fontSize || '1rem',
			fontWeight: element.fontWeight || 'normal',
			lineHeight: element.lineHeight || '1.6',
			marginBottom: element.marginBottom || '0',
			marginTop: element.marginTop || '0',
			fontStyle: element.fontStyle || 'normal',
			textAlign: element.textAlign || 'left',
			letterSpacing: element.letterSpacing || 'normal',
			textTransform: element.textTransform || 'none',
			textDecoration: element.textDecoration || 'none',
			borderLeft: element.borderLeft || 'none',
			paddingLeft: element.paddingLeft || '0',
			paddingRight: element.paddingRight || '0',
			opacity: element.opacity || '1',
			...element.customStyles
		};

		return {
			tag: element.type || 'p',
			content: element.content || '',
			styles
		};
	}

	// Elementos do step - usa textConfig.elements ou fallback para title/text simples
	$: elements = textConfig.elements || [
		...(step.title
			? [
					{
						type: 'h3',
						content: step.title,
						color: 'var(--color-primary)',
						fontSize: 'var(--font-size-90)',
						fontWeight: '700',
						marginBottom: '1rem',
						lineHeight: '1.2'
					}
				]
			: []),
		...(step.text
			? [
					{
						type: 'div',
						content: step.text,
						fontSize: 'var(--font-size-60)',
						lineHeight: '1.6'
					}
				]
			: [])
	];

	// Função para converter estilos para string CSS
	function stylesToString(styles) {
		return Object.entries(styles)
			.map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
			.join('; ');
	}
</script>

<section
	class="step-container position-{position}"
	class:last-section={stepIndex === totalSteps}
	class:active
	class:hidden-card={isHiddenCard}
>
	{#if !isHiddenCard}
		<div
			class="step-content"
			bind:this={stepContentElement}
			class:transparent-card={isTransparentCard}
			data-step-content
			style={stylesToString(containerStyles)}
		>
			{#each elements as element}
				{@const renderedElement = renderElement(element)}
				{#if renderedElement.tag === 'h1'}
					<h1 style={stylesToString(renderedElement.styles)}>{@html renderedElement.content}</h1>
				{:else if renderedElement.tag === 'h2'}
					<h2 style={stylesToString(renderedElement.styles)}>{@html renderedElement.content}</h2>
				{:else if renderedElement.tag === 'h3'}
					<h3 style={stylesToString(renderedElement.styles)}>{@html renderedElement.content}</h3>
				{:else if renderedElement.tag === 'h4'}
					<h4 style={stylesToString(renderedElement.styles)}>{@html renderedElement.content}</h4>
				{:else if renderedElement.tag === 'h5'}
					<h5 style={stylesToString(renderedElement.styles)}>{@html renderedElement.content}</h5>
				{:else if renderedElement.tag === 'h6'}
					<h6 style={stylesToString(renderedElement.styles)}>{@html renderedElement.content}</h6>
				{:else if renderedElement.tag === 'blockquote'}
					<blockquote style={stylesToString(renderedElement.styles)}>
						{@html renderedElement.content}
					</blockquote>
				{:else if renderedElement.tag === 'p'}
					<p style={stylesToString(renderedElement.styles)}>{@html renderedElement.content}</p>
				{:else if renderedElement.tag === 'div'}
					<div style={stylesToString(renderedElement.styles)}>{@html renderedElement.content}</div>
				{:else if renderedElement.tag === 'span'}
					<span style={stylesToString(renderedElement.styles)}>{@html renderedElement.content}</span
					>
				{:else if renderedElement.tag === 'small'}
					<small style={stylesToString(renderedElement.styles)}
						>{@html renderedElement.content}</small
					>
				{:else if renderedElement.tag === 'strong'}
					<strong style={stylesToString(renderedElement.styles)}
						>{@html renderedElement.content}</strong
					>
				{:else if renderedElement.tag === 'em'}
					<em style={stylesToString(renderedElement.styles)}>{@html renderedElement.content}</em>
				{:else}
					<!-- Fallback para tags customizadas -->
					<div style={stylesToString(renderedElement.styles)}>{@html renderedElement.content}</div>
				{/if}
			{/each}
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

	/* Posicionamentos Desktop */
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
		width: 100%;
		/* Backdrop filter já aplicado via style inline */
		transform: none;
		will-change: auto;
	}

	.step-content.transparent-card {
		background: transparent;
		box-shadow: none;
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
			justify-content: center; /* Mobile sempre centralizado por padrão */
			min-height: var(--step-container-min-height-mobile, calc(100vh + var(--step-travel, 80vh)));
			padding-top: var(--step-container-padding-top-mobile, 0);
			padding-bottom: var(
				--step-container-padding-bottom-mobile,
				calc(var(--step-travel, 80vh) + 15vh)
			);
		}

		/* Posicionamentos Mobile específicos */
		.step-container[class*='position-']:not(.mobile-position-override) {
			justify-content: center;
		}

		.step-content {
			max-width: 95%;
			will-change: transform;
		}
	}

	.step-container.hidden-card {
		padding-bottom: var(
			--step-container-padding-bottom-hidden,
			calc(var(--step-travel, 80vh) + 10vh)
		);
		pointer-events: none;
	}

	/* Estilos globais para elementos tipográficos */
	:global(.step-content h1) {
		margin: 0;
	}

	:global(.step-content h2) {
		margin: 0;
	}

	:global(.step-content h3) {
		margin: 0;
	}

	:global(.step-content h4) {
		margin: 0;
	}

	:global(.step-content h5) {
		margin: 0;
	}

	:global(.step-content h6) {
		margin: 0;
	}

	:global(.step-content p) {
		margin: 0;
	}

	:global(.step-content blockquote) {
		margin: 0;
		font-style: italic;
	}

	:global(.step-content div) {
		margin: 0;
	}
</style>
