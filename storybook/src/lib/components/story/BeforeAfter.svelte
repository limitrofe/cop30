<!-- src/lib/components/story/BeforeAfter.svelte -->
<script>
	import { onMount } from 'svelte';

	export let beforeImage = '';
	export let beforeImageMobile = '';
	export let beforeCaption = '';
	export let beforeCredit = '';
	export let afterImage = '';
	export let afterImageMobile = '';
	export let afterCaption = '';
	export let afterCredit = '';
	export let beforeLabel = 'Antes';
	export let afterLabel = 'Depois';
	export let orientation = 'vertical'; // 'vertical' or 'horizontal'

	export let width = '100%';
	export let maxWidth = '';
	export let widthMobile = '';
	export let maxWidthMobile = '';

	$: containerStyle = [
		width ? `--before-after-width: ${width}` : '',
		maxWidth ? `--before-after-max-width: ${maxWidth}` : '',
		widthMobile ? `--before-after-width-mobile: ${widthMobile}` : '',
		maxWidthMobile ? `--before-after-max-width-mobile: ${maxWidthMobile}` : ''
	]
		.filter(Boolean)
		.join('; ');

	let containerElement;
	let sliderPosition = 50;
	let isDragging = false;

	$: clampedSlider = Math.max(0, Math.min(100, sliderPosition));
	$: beforeClipStyle =
		orientation === 'vertical'
			? `clip-path: inset(0 ${100 - clampedSlider}% 0 0)`
			: `clip-path: inset(0 0 ${100 - clampedSlider}% 0)`;
	$: afterClipStyle =
		orientation === 'vertical'
			? `clip-path: inset(0 0 0 ${clampedSlider}%)`
			: `clip-path: inset(${clampedSlider}% 0 0 0)`;
	$: sliderStyle =
		orientation === 'vertical' ? `left: ${clampedSlider}%` : `top: ${clampedSlider}%`;

	onMount(() => {
		const handleMouseMove = (e) => {
			if (!isDragging || !containerElement) return;
			updateSliderPosition(e);
		};

		const handleMouseUp = () => {
			isDragging = false;
		};

		const handleTouchMove = (e) => {
			if (!isDragging || !containerElement) return;
			e.preventDefault();
			updateSliderPosition(e.touches[0]);
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
		document.addEventListener('touchmove', handleTouchMove, { passive: false });
		document.addEventListener('touchend', handleMouseUp);

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
			document.removeEventListener('touchmove', handleTouchMove);
			document.removeEventListener('touchend', handleMouseUp);
		};
	});

	function updateSliderPosition(event) {
		if (!containerElement) return;

		const rect = containerElement.getBoundingClientRect();

		if (orientation === 'vertical') {
			const x = event.clientX - rect.left;
			sliderPosition = Math.max(0, Math.min(100, (x / rect.width) * 100));
		} else {
			const y = event.clientY - rect.top;
			sliderPosition = Math.max(0, Math.min(100, (y / rect.height) * 100));
		}
	}

	function handleSliderStart(event) {
		isDragging = true;
		updateSliderPosition(event.type === 'touchstart' ? event.touches[0] : event);
	}

	function handleKey(event) {
		const step = event.shiftKey ? 5 : 2;
		if (orientation === 'vertical') {
			if (event.key === 'ArrowLeft') {
				sliderPosition = Math.max(0, sliderPosition - step);
			} else if (event.key === 'ArrowRight') {
				sliderPosition = Math.min(100, sliderPosition + step);
			} else {
				return;
			}
		} else {
			if (event.key === 'ArrowUp') {
				sliderPosition = Math.max(0, sliderPosition - step);
			} else if (event.key === 'ArrowDown') {
				sliderPosition = Math.min(100, sliderPosition + step);
			} else {
				return;
			}
		}
		event.preventDefault();
	}
</script>

<div
	class="before-after before-after--{orientation}"
	bind:this={containerElement}
	style={containerStyle}
>
	<!-- Before Image -->
	<div class="before-after__before">
		<div class="before-after__media before-after__media--before" style={beforeClipStyle}>
			<picture>
				{#if beforeImageMobile || beforeImage}
					<source srcset={beforeImageMobile || beforeImage} media="(max-width: 768px)" />
				{/if}
				<img src={beforeImage || beforeImageMobile} alt={beforeLabel} loading="lazy" />
			</picture>
			<div class="before-after__label before-after__label--before">
				{beforeLabel}
			</div>
		</div>
		{#if beforeCaption || beforeCredit}
			<div class="before-after__caption">
				{#if beforeCaption}<p>{@html beforeCaption}</p>{/if}
				{#if beforeCredit}<small>{@html beforeCredit}</small>{/if}
			</div>
		{/if}
	</div>

	<!-- After Image -->
	<div class="before-after__after">
		<div class="before-after__media before-after__media--after" style={afterClipStyle}>
			<picture>
				{#if afterImageMobile || afterImage}
					<source srcset={afterImageMobile || afterImage} media="(max-width: 768px)" />
				{/if}
				<img src={afterImage || afterImageMobile} alt={afterLabel} loading="lazy" />
			</picture>
			<div class="before-after__label before-after__label--after">
				{afterLabel}
			</div>
		</div>
		{#if afterCaption || afterCredit}
			<div class="before-after__caption">
				{#if afterCaption}<p>{@html afterCaption}</p>{/if}
				{#if afterCredit}<small>{@html afterCredit}</small>{/if}
			</div>
		{/if}
	</div>

	<!-- Slider -->
	<div
		class="before-after__slider"
		style={sliderStyle}
		on:mousedown={handleSliderStart}
		on:touchstart={handleSliderStart}
		role="slider"
		tabindex="0"
		aria-valuemin="0"
		aria-valuemax="100"
		aria-valuenow={Math.round(clampedSlider)}
		aria-label="Comparador antes e depois"
		on:keydown={handleKey}
	>
		<div class="before-after__handle">
			{#if orientation === 'vertical'}
				<span>‹›</span>
			{:else}
				<span>⇅</span>
			{/if}
		</div>
	</div>
</div>

<style>
	.before-after {
		position: relative;
		width: var(--before-after-width, 100%);
		max-width: var(--before-after-max-width, none);
		margin: 2rem auto;
		border-radius: 12px;
		overflow: hidden;
		user-select: none;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
	}

	.before-after__before,
	.before-after__after {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.before-after__after {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 2;
	}

	.before-after__before {
		z-index: 1;
	}

	.before-after__media {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.before-after img {
		width: 100%;
		height: auto;
		display: block;
	}

	.before-after__label {
		position: absolute;
		top: 1rem;
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: var(--font-size-40);
		font-weight: 600;
		z-index: 10;
	}

	.before-after__label--before {
		left: 1rem;
	}

	.before-after__label--after {
		right: 1rem;
	}

	.before-after__slider {
		position: absolute;
		z-index: 20;
		cursor: pointer;
	}

	.before-after__caption {
		position: absolute;
		bottom: 1rem;
		left: 1rem;
		background: rgba(0, 0, 0, 0.6);
		color: #f1f5f9;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		max-width: 320px;
		font-size: var(--font-size-40);
	}

	.before-after__caption p {
		margin: 0 0 0.35rem 0;
	}

	.before-after__caption small {
		display: block;
		opacity: 0.8;
		font-size: var(--font-size-30);
	}

	.before-after--vertical .before-after__slider {
		top: 0;
		height: 100%;
		width: 4px;
		background: white;
		transform: translateX(-50%);
		cursor: ew-resize;
	}

	.before-after--horizontal .before-after__slider {
		left: 0;
		width: 100%;
		height: 4px;
		background: white;
		transform: translateY(-50%);
		cursor: ns-resize;
	}

	.before-after__handle {
		position: absolute;
		background: white;
		border: 2px solid var(--color-primary);
		border-radius: 50%;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		color: var(--color-primary);
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
		transition: transform 0.2s ease;
	}

	.before-after--vertical .before-after__handle {
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.before-after--horizontal .before-after__handle {
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.before-after__handle:hover {
		transform: translate(-50%, -50%) scale(1.1);
	}

	@media (max-width: 768px) {
		.before-after {
			width: var(--before-after-width-mobile, var(--before-after-width, 100%));
			max-width: var(--before-after-max-width-mobile, var(--before-after-max-width, none));
		}

		.before-after__handle {
			width: 35px;
			height: 35px;
			font-size: 0.9rem;
		}
	}
</style>
