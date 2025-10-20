<!-- src/lib/components/story/StoryText.svelte -->
<script>
	import { onDestroy, onMount } from 'svelte';

	export let content = '';
	export let variant = 'body'; // 'body', 'lead', 'quote'
	export let align = 'left'; // 'left', 'center', 'right', 'justify'
	export let maxWidth = '700px';
	export let maxWidthDesktop = '';
	export let maxWidthMobile = '';
	export let widthDesktop = '';
	export let widthMobile = '';
	export let author = '';
	export let role = '';
	export let fontSizeDesktop = '';
	export let fontSizeMobile = '';
	export let lineHeightDesktop = '';
	export let lineHeightMobile = '';
	export let textColor = '';
	export let containerWidth = '';
	export let containerWidthDesktop = '';
	export let containerWidthMobile = '';
	export let containerMaxWidth = '';
	export let containerMaxWidthDesktop = '';
	export let containerMaxWidthMobile = '';
	export let containerMinHeight = '';
	export let containerMinHeightDesktop = '';
	export let containerMinHeightMobile = '';
	export let horizontalPosition = 'center'; // 'left' | 'center' | 'right'
	export let verticalPosition = 'top'; // 'top' | 'center' | 'bottom'

	const FALLBACKS = {
		body: { sizeDesktop: '1.1rem', sizeMobile: '1rem', lineDesktop: '1.8', lineMobile: '1.7' },
		lead: { sizeDesktop: '1.5rem', sizeMobile: '1.3rem', lineDesktop: '1.6', lineMobile: '1.6' },
		blockquote: {
			sizeDesktop: '2rem',
			sizeMobile: '1.6rem',
			lineDesktop: '1.4',
			lineMobile: '1.45'
		}
	};

	const variantMap = {
		body: 'body',
		lead: 'lead',
		quote: 'blockquote'
	};

	const horizontalAlignMap = {
		left: 'flex-start',
		center: 'center',
		right: 'flex-end'
	};

	const containerMarginMap = {
		left: '0 auto 0 0',
		center: '0 auto',
		right: '0 0 0 auto'
	};

	const blockMarginMap = {
		left: '2rem 0 2rem 0',
		center: '2rem auto',
		right: '2rem 0 2rem auto'
	};

	const verticalAlignMap = {
		top: 'flex-start',
		center: 'center',
		bottom: 'flex-end'
	};

	let positionerElement;
	let sectionContentElement;
	const originalSectionValues = new Map();
	const appliedSectionVars = new Set();
	const SECTION_CONTAINER_CLASS = 'story-text-container';

	function setSectionVar(name, value) {
		if (!sectionContentElement) return;
		const normalized = typeof value === 'string' ? value.trim() : '';

		if (normalized) {
			if (!originalSectionValues.has(name)) {
				const current = sectionContentElement.style.getPropertyValue(name);
				originalSectionValues.set(name, current ? current.trim() : null);
			}

			sectionContentElement.style.setProperty(name, normalized);
			appliedSectionVars.add(name);
		} else if (appliedSectionVars.has(name)) {
			const original = originalSectionValues.get(name);
			if (original) sectionContentElement.style.setProperty(name, original);
			else sectionContentElement.style.removeProperty(name);
			appliedSectionVars.delete(name);
			originalSectionValues.delete(name);
		}
	}

	function applyContainerStyles() {
		if (!sectionContentElement) return;

		const widthDesktopValue = containerWidthDesktop || containerWidth || '100%';
		const widthMobileValue = containerWidthMobile || containerWidth || '100%';
		const maxWidthDesktopValue = containerMaxWidthDesktop || containerMaxWidth || 'none';
		const maxWidthMobileValue = containerMaxWidthMobile || containerMaxWidth || 'none';
		const minHeightDesktopValue = containerMinHeightDesktop || containerMinHeight || 'auto';
		const minHeightMobileValue = containerMinHeightMobile || containerMinHeight || 'auto';
		const marginDesktopValue = containerMarginMap[horizontalPosition] || '0 auto';
		const marginMobileValue = containerMarginMap[horizontalPosition] || '0 auto';
		const alignItemsValue = horizontalAlignMap[horizontalPosition] || 'center';
		const justifyContentValue = verticalAlignMap[verticalPosition] || 'flex-start';

		setSectionVar('--story-text-container-width-desktop', widthDesktopValue);
		setSectionVar('--story-text-container-width-mobile', widthMobileValue);
		setSectionVar('--story-text-container-max-width-desktop', maxWidthDesktopValue);
		setSectionVar('--story-text-container-max-width-mobile', maxWidthMobileValue);
		setSectionVar('--story-text-container-min-height-desktop', minHeightDesktopValue);
		setSectionVar('--story-text-container-min-height-mobile', minHeightMobileValue);

		setSectionVar('--section-content-width-desktop', widthDesktopValue);
		setSectionVar('--section-content-width-mobile', widthMobileValue);
		setSectionVar('--section-content-max-width-desktop', maxWidthDesktopValue);
		setSectionVar('--section-content-max-width-mobile', maxWidthMobileValue);
		setSectionVar('--section-content-min-height-desktop', minHeightDesktopValue);
		setSectionVar('--section-content-min-height-mobile', minHeightMobileValue);
		setSectionVar('--section-content-margin-desktop', marginDesktopValue);
		setSectionVar('--section-content-margin-mobile', marginMobileValue);
		setSectionVar('--section-content-display', 'flex');
		setSectionVar('--section-content-flex-direction', 'column');
		setSectionVar('--section-content-flex-direction-mobile', 'column');
		setSectionVar('--section-content-align-items', alignItemsValue);
		setSectionVar('--section-content-align-items-mobile', alignItemsValue);
		setSectionVar('--section-content-justify-content', justifyContentValue);
		setSectionVar('--section-content-justify-content-mobile', justifyContentValue);
	}

	function attachSectionContext() {
		if (!positionerElement) return;
		const parent = positionerElement.parentElement;
		if (parent && parent !== sectionContentElement) {
			restoreSectionStyles();
			sectionContentElement = parent;
		}

		if (sectionContentElement) {
			sectionContentElement.classList.add(SECTION_CONTAINER_CLASS);
		}
	}

	function restoreSectionStyles() {
		if (!sectionContentElement) return;

		appliedSectionVars.forEach((name) => {
			const original = originalSectionValues.get(name);
			if (original) sectionContentElement.style.setProperty(name, original);
			else sectionContentElement.style.removeProperty(name);
		});

		appliedSectionVars.clear();
		originalSectionValues.clear();
		sectionContentElement.classList.remove(SECTION_CONTAINER_CLASS);
		sectionContentElement = null;
	}

	onMount(() => {
		attachSectionContext();
		applyContainerStyles();
	});

	onDestroy(() => {
		restoreSectionStyles();
	});

	$: if (positionerElement) {
		attachSectionContext();
	}

	$: if (sectionContentElement) {
		containerWidth;
		containerWidthDesktop;
		containerWidthMobile;
		containerMaxWidth;
		containerMaxWidthDesktop;
		containerMaxWidthMobile;
		containerMinHeight;
		containerMinHeightDesktop;
		containerMinHeightMobile;
		horizontalPosition;
		verticalPosition;
		applyContainerStyles();
	}

	$: variantKey = variantMap[variant] || 'body';
	$: fallback = FALLBACKS[variantKey] || FALLBACKS.body;
	$: computedFontSizeDesktop =
		fontSizeDesktop || `var(--typography-${variantKey}-desktop-font-size, ${fallback.sizeDesktop})`;
	$: computedFontSizeMobile =
		fontSizeMobile || `var(--typography-${variantKey}-mobile-font-size, ${fallback.sizeMobile})`;
	$: computedLineHeightDesktop =
		lineHeightDesktop ||
		`var(--typography-${variantKey}-desktop-line-height, ${fallback.lineDesktop})`;
	$: computedLineHeightMobile =
		lineHeightMobile ||
		`var(--typography-${variantKey}-mobile-line-height, ${fallback.lineMobile})`;
	$: contentStyle = [
		`--story-text-font-size-desktop:${computedFontSizeDesktop}`,
		`--story-text-line-height-desktop:${computedLineHeightDesktop}`,
		`--story-text-font-size-mobile:${computedFontSizeMobile}`,
		`--story-text-line-height-mobile:${computedLineHeightMobile}`,
		textColor ? `--story-text-color:${textColor}` : ''
	]
		.filter(Boolean)
		.join('; ');
	$: wrapperStyle = [
		`text-align:${align}`,
		maxWidth ? `--story-text-wrapper-max-width-desktop:${maxWidth}` : '',
		maxWidthDesktop ? `--story-text-wrapper-max-width-desktop:${maxWidthDesktop}` : '',
		maxWidthMobile ? `--story-text-wrapper-max-width-mobile:${maxWidthMobile}` : '',
		widthDesktop ? `--story-text-wrapper-width-desktop:${widthDesktop}` : '',
		widthMobile ? `--story-text-wrapper-width-mobile:${widthMobile}` : '',
		`--story-text-wrapper-margin-desktop:${blockMarginMap[horizontalPosition] || '2rem auto'}`,
		`--story-text-wrapper-margin-mobile:${blockMarginMap[horizontalPosition] || '2rem auto'}`
	]
		.filter(Boolean)
		.join('; ');
	$: positionerStyle = [
		`--story-text-horizontal-align:${horizontalAlignMap[horizontalPosition] || 'center'}`,
		`--story-text-vertical-align:${verticalAlignMap[verticalPosition] || 'flex-start'}`,
		`--story-text-container-margin-desktop:${containerMarginMap[horizontalPosition] || '0 auto'}`,
		`--story-text-container-margin-mobile:${containerMarginMap[horizontalPosition] || '0 auto'}`
	]
		.filter(Boolean)
		.join('; ');
</script>

<div class="story-text-positioner" bind:this={positionerElement} style={positionerStyle}>
	<div class="story-text story-text--{variant}" style={wrapperStyle}>
		<div class="story-text__content text-variant-{variant}" style={contentStyle}>
			{#if variant === 'quote'}
				<div class="quote-container">
					<blockquote class="modern-quote">
						<div class="quote-text">
							{@html content}
						</div>

						{#if author}
							<footer class="quote-attribution">
								<div class="attribution-line"></div>
								<div class="attribution-content">
									<cite class="author-name">{author}</cite>
									{#if role}
										<span class="author-role">{role}</span>
									{/if}
								</div>
							</footer>
						{/if}
					</blockquote>
				</div>
			{:else}
				{@html content}
			{/if}
		</div>
	</div>
</div>

<style>
	:global(.story-text-container) {
		--story-text-container-width-desktop: 100%;
		--story-text-container-width-mobile: 100%;
		--story-text-container-max-width-desktop: 100%;
		--story-text-container-max-width-mobile: 100%;
		--story-text-container-min-height-desktop: auto;
		--story-text-container-min-height-mobile: auto;
	}

	:global(.story-text-container) {
		width: var(--story-text-container-width-desktop);
		max-width: var(--story-text-container-max-width-desktop);
		min-height: var(--story-text-container-min-height-desktop);
		margin: var(--section-content-margin-desktop, 0 auto);
		display: var(--section-content-display, block);
		flex-direction: var(--section-content-flex-direction, column);
		align-items: var(--section-content-align-items, stretch);
		justify-content: var(--section-content-justify-content, flex-start);
	}

	.story-text-positioner {
		display: flex;
		flex-direction: column;
		justify-content: var(--story-text-vertical-align, flex-start);
		align-items: var(--story-text-horizontal-align, center);
		width: var(--story-text-container-width-desktop, 100%);
		max-width: var(--story-text-container-max-width-desktop, 100%);
		min-height: var(--story-text-container-min-height-desktop, auto);
		margin: var(--story-text-container-margin-desktop, 0 auto);
	}

	.story-text {
		margin: var(--story-text-wrapper-margin-desktop, 2rem auto);
		padding: 0 1rem;
		color: var(--story-text-color, var(--color-text));
		width: var(--story-text-wrapper-width-desktop, auto);
		max-width: var(--story-text-wrapper-max-width-desktop, 700px);
	}

	.story-text__content {
		width: 100%;
		font-size: var(
			--story-text-font-size-desktop,
			var(--typography-body-desktop-font-size, 1.1rem)
		);
		line-height: var(
			--story-text-line-height-desktop,
			var(--typography-body-desktop-line-height, 1.8)
		);
		color: var(--story-text-color, var(--color-text));
	}

	.story-text--lead .story-text__content {
		color: var(--story-text-color, var(--typography-lead-color, var(--color-secondary)));
	}

	@media (max-width: 768px) {
		:global(.story-text-container) {
			width: var(--story-text-container-width-mobile, 100%);
			max-width: var(--story-text-container-max-width-mobile, 100%);
			min-height: var(--story-text-container-min-height-mobile, auto);
			margin: var(--section-content-margin-mobile, var(--section-content-margin-desktop, 0 auto));
		}

		.story-text-positioner {
			width: var(--story-text-container-width-mobile, 100%);
			max-width: var(--story-text-container-max-width-mobile, 100%);
			min-height: var(--story-text-container-min-height-mobile, auto);
			margin: var(--story-text-container-margin-mobile, 0 auto);
		}

		.story-text {
			margin: var(
				--story-text-wrapper-margin-mobile,
				var(--story-text-wrapper-margin-desktop, 2rem auto)
			);
			width: var(--story-text-wrapper-width-mobile, var(--story-text-wrapper-width-desktop, auto));
			max-width: var(
				--story-text-wrapper-max-width-mobile,
				var(--story-text-wrapper-max-width-desktop, 700px)
			);
		}

		.story-text__content {
			font-size: var(--story-text-font-size-mobile, var(--typography-body-mobile-font-size, 1rem));
			line-height: var(
				--story-text-line-height-mobile,
				var(--typography-body-mobile-line-height, 1.7)
			);
		}
	}

	/* Variant: Quote */
	.story-text--quote {
		margin: 3rem auto;
	}

	.story-text--quote .story-text__content {
		font-size: var(
			--story-text-font-size-desktop,
			var(--typography-blockquote-desktop-font-size, 2rem)
		);
		line-height: var(
			--story-text-line-height-desktop,
			var(--typography-blockquote-desktop-line-height, 1.4)
		);
		color: var(--story-text-color, var(--typography-blockquote-color, var(--color-text)));
	}

	@media (max-width: 768px) {
		.story-text--quote .story-text__content {
			font-size: var(
				--story-text-font-size-mobile,
				var(--typography-blockquote-mobile-font-size, 1.6rem)
			);
			line-height: var(
				--story-text-line-height-mobile,
				var(--typography-blockquote-mobile-line-height, 1.45)
			);
		}
	}

	.quote-container {
		position: relative;
		background: var(--typography-blockquote-background, var(--color-highlight-bg));
		border-radius: 24px;
		padding: 2.5rem;
		border: 1px solid var(--typography-blockquote-border-color, var(--color-border));
		transition: all 0.3s ease;
	}

	.quote-container:hover {
		transform: translateY(-2px);
	}

	.quote-text {
		margin: 0;
		font-style: normal;
	}

	.quote-attribution {
		margin-top: 2rem;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.attribution-line {
		width: 40px;
		height: 2px;
		background: linear-gradient(
			90deg,
			var(--typography-blockquote-accent-color, var(--color-primary)),
			transparent
		);
		border-radius: 1px;
	}

	.author-name {
		font-style: normal;
		font-weight: 700;
		font-size: var(--typography-small-desktop-font-size, 0.95rem);
		color: var(--typography-blockquote-accent-color, var(--color-primary));
		display: block;
		margin-bottom: 0.25rem;
	}

	.author-role {
		font-size: var(--typography-small-desktop-font-size, 0.9rem);
		color: var(--story-text-color, var(--color-secondary));
		font-weight: 500;
		opacity: 0.8;
	}

	@media (max-width: 768px) {
		.quote-container {
			padding: 2rem 1.5rem;
			border-radius: 20px;
		}

		.author-name {
			font-size: var(--typography-small-mobile-font-size, 0.85rem);
		}

		.author-role {
			font-size: var(--typography-small-mobile-font-size, 0.82rem);
		}
	}

	.story-text :global(p) {
		margin: 1.5rem 0;
	}

	.story-text :global(strong) {
		font-weight: 700;
		color: var(--story-text-color, var(--color-primary));
	}

	.story-text :global(em) {
		color: var(--story-text-color, var(--color-accent));
		font-style: italic;
	}

	.story-text :global(a) {
		color: var(--story-text-color, var(--color-primary));
		text-decoration: none;
		border-bottom: 1px solid currentColor;
		transition: all 0.3s ease;
	}

	.story-text :global(a:hover) {
		opacity: 0.8;
		transform: translateY(-1px);
	}

	.story-text :global(ul),
	.story-text :global(ol) {
		margin: 1.5rem 0;
		padding-left: 1.5rem;
	}

	.story-text :global(ul) {
		list-style: disc inside;
	}

	.story-text :global(ol) {
		list-style: decimal inside;
	}

	.story-text :global(li) {
		margin: 0.5rem 0;
	}
</style>
