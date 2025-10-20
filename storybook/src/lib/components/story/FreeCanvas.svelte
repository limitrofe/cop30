<script>
	import { afterUpdate, onDestroy, onMount } from 'svelte';
	import GloboPlayer from './GloboPlayer.svelte';
	export let minHeightDesktop = 400;
	export let maxHeightDesktop = null;
	export let minHeightMobile = 400;
	export let maxHeightMobile = null;
	export let baseWidthDesktop = 1440;
	export let baseWidthMobile = 375;
	export let backgroundSource = 'color';
	export let backgroundColor = '#000000';
	export let backgroundColorDesktop = '#000000';
	export let backgroundColorMobile = '#000000';
	export let backgroundImageDesktop = '';
	export let backgroundImageMobile = '';
	export let backgroundVideoDesktop = '';
	export let backgroundVideoMobile = '';
	export let backgroundVideoPosterDesktop = '';
	export let backgroundVideoPosterMobile = '';
	export let videoAutoplay = true;
	export let videoLoop = true;
	export let videoMuted = true;
	export let items = [];
	export let device = 'desktop';
	export let typography = {};

	const MOBILE_BASE_WIDTH = 350;

	let isMobile;
	$: isMobile = device === 'mobile';

	let viewportRef;
	let contentRef;
	let resizeObserver;
	const observedElements = new Set();
	let hasHorizontalScroll = false;
	let hasVerticalScroll = false;
	let horizontalThumbSize = 100;
	let verticalThumbSize = 100;
	let horizontalThumbOffset = 0;
	let verticalThumbOffset = 0;
	let isInteracting = false;
	let hideIndicatorsTimeout;
	let browserWidth = 0;
	let isSimulatedMobile = false;
	let simulatedScale = 1;
	let simulatedWidthPx = 0;
	let simulatedHeightPx = 0;
	let mobileScale = 1;
	let scaledViewportWidth = 0;
	let scaledViewportHeight = 0;
	let isScaledMobile = false;
	let mobileTargetWidth = 0;

	function getFrame(item) {
		return isMobile ? item.mobile : item.desktop;
	}

	function toVw(value, baseWidth) {
		if (!baseWidth || baseWidth <= 0) return '0px';
		return `${(value / baseWidth) * 100}vw`;
	}

	function selectValue(primary, fallback) {
		if (primary !== undefined && primary !== null && primary !== '') return primary;
		return fallback ?? '';
	}

	function getTypographyConfig(tag) {
		if (!tag || !typography || typeof typography !== 'object') return null;
		if (tag === 'blockquote') return typography.blockquote || null;
		if (tag === 'p') return typography.body || null;
		return typography[tag] || null;
	}

	function getTextContainerStyle(item, tag) {
		const styles = item.textStyles || {};
		const align = isMobile
			? styles.textAlignMobile || styles.textAlign || 'left'
			: styles.textAlign || 'left';
		const declarations = [
			'width:100%',
			'height:100%',
			'display:flex',
			`text-align:${align}`,
			`align-items:${styles.verticalAlign || 'flex-start'}`,
			`justify-content:${styles.horizontalAlign || 'flex-start'}`
		];

		const config = getTypographyConfig(tag || 'p');
		if (config?.background) declarations.push(`background:${config.background}`);
		if (config?.borderColor) {
			const width = config.borderWidth || '1px';
			declarations.push(`border:${width} solid ${config.borderColor}`);
		}

		return `${declarations.join(';')};`;
	}

	function getTextContentStyle(item, tag) {
		const styles = item.textStyles || {};
		const config = getTypographyConfig(tag || 'p');
		const declarations = ['margin:0'];

		const fontFamily = selectValue(styles.fontFamily, config?.fontFamily);
		const fontWeight = selectValue(styles.fontWeight, config?.fontWeight);
		const fontStyle = selectValue(styles.fontStyle, config?.fontStyle);
		const textTransform = selectValue(styles.textTransform, config?.textTransform);
		const textDecoration = selectValue(styles.textDecoration, config?.textDecoration);
		const textShadow = selectValue(styles.textShadow, config?.textShadow);
		const letterSpacing = selectValue(styles.letterSpacing, config?.letterSpacing);
		const color = selectValue(styles.color, config?.color);

		if (fontFamily) declarations.push(`font-family:${fontFamily}`);
		if (fontWeight) declarations.push(`font-weight:${fontWeight}`);
		if (fontStyle) declarations.push(`font-style:${fontStyle}`);
		if (textTransform) declarations.push(`text-transform:${textTransform}`);
		if (letterSpacing) declarations.push(`letter-spacing:${letterSpacing}`);
		if (color) declarations.push(`color:${color}`);
		if (textDecoration) declarations.push(`text-decoration:${textDecoration}`);
		if (textShadow) declarations.push(`text-shadow:${textShadow}`);

		const desktop = config?.desktop || {};
		const mobile = config?.mobile || {};

		const fontSize = isMobile
			? selectValue(
					styles.fontSizeMobile,
					selectValue(styles.fontSize, selectValue(mobile.fontSize, desktop.fontSize))
				)
			: selectValue(styles.fontSize, selectValue(desktop.fontSize, mobile.fontSize));
		const lineHeight = isMobile
			? selectValue(
					styles.lineHeightMobile,
					selectValue(styles.lineHeight, selectValue(mobile.lineHeight, desktop.lineHeight))
				)
			: selectValue(styles.lineHeight, selectValue(desktop.lineHeight, mobile.lineHeight));

		if (fontSize) declarations.push(`font-size:${fontSize}`);
		if (lineHeight) declarations.push(`line-height:${lineHeight}`);

		if (config?.accentColor) declarations.push(`--free-canvas-accent:${config.accentColor}`);

		return `${declarations.join(';')};`;
	}

	const allowedTypographyTags = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote']);

	function getTypographyTag(item) {
		const raw = item.textStyles?.typography;
		if (typeof raw !== 'string') return null;
		const tag = raw.trim().toLowerCase();
		return allowedTypographyTags.has(tag) ? tag : null;
	}

	function hasHtml(content) {
		if (!content) return false;
		return /<\/?[a-z][^>]*>/i.test(content);
	}

	function getMediaSource(item) {
		if (!item) return '';
		const source = isMobile ? item.srcMobile || item.src : item.src;
		return sanitizeUrl(source);
	}

	function getMediaPoster(item) {
		if (!item) return '';
		const poster = isMobile ? item.posterMobile || item.poster : item.poster;
		return sanitizeUrl(poster);
	}

	function sanitizeUrl(url) {
		return typeof url === 'string' ? url.trim() : '';
	}

	function getPlaybackFlag(item, field, fallback = true) {
		if (!item || !(field in item)) return fallback;
		const value = item[field];
		return value === undefined || value === null ? fallback : Boolean(value);
	}

	function hasValidGloboId(item) {
		return Boolean((item?.videoId || item?.videoIdDesktop || item?.videoIdMobile || '').trim());
	}

	function isRenderableItem(item, frame) {
		if (!item || typeof item !== 'object') return false;
		if (!frame) return false;
		if (item.hidden || item.isHidden) return false;
		if (item.visible === false) return false;
		if (item.enabled === false) return false;
		if (item.deleted || item.isDeleted) return false;
		if (item.status && `${item.status}`.toLowerCase() === 'deleted') return false;
		if (item.type === 'globo-player' && !hasValidGloboId(item)) return false;
		return true;
	}

	function createItemKey(item, index) {
		if (item?.id && typeof item.id === 'string') {
			const trimmed = item.id.trim();
			if (trimmed.length > 0) return trimmed;
		}
		return `item-${index}`;
	}

	let normalizedBackgroundSource;
	$: normalizedBackgroundSource = ['image', 'video'].includes(backgroundSource)
		? backgroundSource
		: backgroundVideoDesktop || backgroundVideoMobile
			? 'video'
			: backgroundImageDesktop || backgroundImageMobile
				? 'image'
				: 'color';

	function getBackgroundColorValue(device) {
		const fallback = backgroundColor ?? '#000000';
		const desktop = backgroundColorDesktop ?? fallback;
		const mobile = backgroundColorMobile ?? desktop;
		return device === 'mobile' ? mobile : desktop;
	}

	function getBackgroundImageValue(device) {
		const desktop = sanitizeUrl(backgroundImageDesktop);
		const mobile = sanitizeUrl(backgroundImageMobile) || desktop;
		return device === 'mobile' ? mobile : desktop;
	}

	function getBackgroundVideoValue(device) {
		const desktop = sanitizeUrl(backgroundVideoDesktop);
		const mobile = sanitizeUrl(backgroundVideoMobile) || desktop;
		return device === 'mobile' ? mobile : desktop;
	}

	function getBackgroundPosterValue(device) {
		const desktop = sanitizeUrl(backgroundVideoPosterDesktop);
		const mobile = sanitizeUrl(backgroundVideoPosterMobile) || desktop;
		return device === 'mobile' ? mobile : desktop;
	}

	function getContainerStyle() {
		const deviceLabel = isMobile ? 'mobile' : 'desktop';
		const color = getBackgroundColorValue(deviceLabel) ?? '#000000';
		const baseWidthValue = isMobile ? baseWidthMobile : baseWidthDesktop;
		const widthPx = simulatedWidthPx || Math.max(effectiveBaseWidth || 0, baseWidthValue || 0);
		const declarations = ['position:relative', 'overflow:hidden', `background-color:${color}`];
		if (isSimulatedMobile) {
			declarations.push(`width:${widthPx}px`);
			declarations.push(`height:${simulatedHeightPx}px`);
			declarations.push('margin-left:auto');
			declarations.push('margin-right:auto');
		} else {
			declarations.push('width:100vw');
			if (isScaledMobile) {
				const scaledHeight = scaledViewportHeight || cssHeightPx * Math.min(mobileScale || 1, 1);
				const heightValue =
					scaledHeight && Number.isFinite(scaledHeight) && scaledHeight > 0
						? `${scaledHeight}px`
						: cssHeight;
				declarations.push(`height:${heightValue}`);
			} else {
				declarations.push(`height:${cssHeight}`);
			}
			declarations.push('margin-left:calc(50% - 50vw)');
			declarations.push('margin-right:calc(50% - 50vw)');
		}
		if (normalizedBackgroundSource === 'image') {
			const image = getBackgroundImageValue(deviceLabel);
			if (image) {
				const safe = image.replace(/"/g, '\\"');
				declarations.push(`background-image:url("${safe}")`);
				declarations.push('background-size:cover');
				declarations.push('background-position:center');
				declarations.push('background-repeat:no-repeat');
			} else {
				declarations.push('background-image:none');
			}
		} else {
			declarations.push('background-image:none');
		}
		return declarations.join(';');
	}

	function getContentStyle() {
		const baseWidth = isMobile ? baseWidthMobile : baseWidthDesktop;
		if (isSimulatedMobile) {
			const width = simulatedWidthPx || baseWidth || effectiveBaseWidth || 0;
			const height = simulatedHeightPx || cssHeightPx;
			return `width:${width}px;height:${height}px;position:relative;overflow:hidden;`;
		}
		if (isScaledMobile) {
			const width = (baseWidth && baseWidth > 0 ? baseWidth : effectiveBaseWidth) || 1;
			const height = cssHeightPx;
			const declarations = [
				`width:${width}px`,
				`height:${height}px`,
				'position:relative',
				'overflow:hidden',
				`transform:scale(${mobileScale})`,
				'transform-origin:top center'
			];
			return declarations.join(';');
		}
		const widthRatio = baseWidth > 0 ? effectiveBaseWidth / baseWidth : 1;
		const widthValue = `${Math.max(widthRatio, 1) * 100}vw`;
		return `width:${widthValue};height:${cssHeight};position:relative;`;
	}

	function getScaleWrapperStyle() {
		if (!isScaledMobile) {
			return 'width:100%;height:100%;position:relative;';
		}
		const fallbackWidth = scaledViewportWidth || mobileTargetWidth || MOBILE_BASE_WIDTH;
		const width = Math.max(fallbackWidth, 1);
		const height = scaledViewportHeight || cssHeightPx * mobileScale;
		const declarations = [
			`width:${width}px`,
			`height:${height}px`,
			'margin-left:auto',
			'margin-right:auto',
			'position:relative'
		];
		return declarations.join(';');
	}

	$: shouldRenderBackgroundVideo =
		normalizedBackgroundSource === 'video' &&
		Boolean(getBackgroundVideoValue(isMobile ? 'mobile' : 'desktop'));

	let effectiveBaseWidth = baseWidthDesktop;
	let baseHeight = 0;
	let cssHeight = '0px';
	let cssHeightPx = 0;
	let renderableItems = [];

	$: {
		const deviceLabel = isMobile ? 'mobile' : 'desktop';
		const source = Array.isArray(items) ? items : [];
		renderableItems = source
			.map((item, index) => {
				const frame = deviceLabel === 'mobile' ? item?.mobile : item?.desktop;
				return isRenderableItem(item, frame)
					? {
							item,
							frame,
							key: createItemKey(item, index)
						}
					: null;
			})
			.filter(Boolean);
	}

	$: isSimulatedMobile = isMobile && browserWidth > 768;
	$: isScaledMobile = isMobile && !isSimulatedMobile;

	$: {
		const frames = renderableItems.map(({ frame }) => frame);
		const contentWidth = frames.length
			? Math.max(...frames.map((frame) => (frame.x || 0) + (frame.width || 0)))
			: 0;
		const baseWidth = isMobile ? baseWidthMobile : baseWidthDesktop;
		if (isMobile) {
			const fallbackWidth = contentWidth || baseWidth || 1;
			effectiveBaseWidth = baseWidth && baseWidth > 0 ? baseWidth : fallbackWidth;
		} else {
			effectiveBaseWidth = Math.max(baseWidth || 0, contentWidth);
		}

		const minHeight = isMobile ? minHeightMobile : minHeightDesktop;
		const maxHeight = isMobile ? maxHeightMobile : maxHeightDesktop;
		const contentHeight = frames.length
			? Math.max(...frames.map((frame) => (frame.y || 0) + (frame.height || 0)))
			: 0;
		baseHeight = Math.max(contentHeight, minHeight || 0);
		if (typeof maxHeight === 'number' && Number.isFinite(maxHeight) && maxHeight > 0) {
			baseHeight = Math.min(baseHeight, maxHeight);
		}
		cssHeight = toVw(baseHeight, effectiveBaseWidth || baseWidth || 1);
		cssHeightPx = baseHeight;
		if (isSimulatedMobile) {
			const widthForSimulation =
				baseWidth && baseWidth > 0 ? baseWidth : effectiveBaseWidth || baseWidth || 1;
			simulatedScale = effectiveBaseWidth > 0 ? widthForSimulation / effectiveBaseWidth : 1;
			simulatedWidthPx = widthForSimulation;
			simulatedHeightPx = baseHeight * simulatedScale;
		} else {
			simulatedScale = 1;
			simulatedWidthPx = 0;
			simulatedHeightPx = 0;
		}
		if (isScaledMobile) {
			const base = Math.max(
				baseWidthMobile || effectiveBaseWidth || baseWidth || MOBILE_BASE_WIDTH,
				1
			);
			const availableWidth = browserWidth > 0 ? browserWidth : MOBILE_BASE_WIDTH;
			mobileTargetWidth = Math.min(MOBILE_BASE_WIDTH, Math.max(availableWidth, 1));
			mobileScale = Math.min(1, mobileTargetWidth / base);
			scaledViewportWidth = base * mobileScale;
			scaledViewportHeight = baseHeight * mobileScale;
		} else {
			mobileScale = 1;
			scaledViewportWidth = 0;
			scaledViewportHeight = 0;
			mobileTargetWidth = 0;
		}
	}

	function getStyle(item, frame = null) {
		const targetFrame = frame || getFrame(item);
		if (!targetFrame) return '';
		const {
			x = 0,
			y = 0,
			width = 200,
			height = 100,
			z = 1,
			opacity = 1,
			rotation = 0
		} = targetFrame;
		const overflow = item.type === 'text' ? 'visible' : 'hidden';
		if (isSimulatedMobile) {
			const left = x * simulatedScale;
			const top = y * simulatedScale;
			const w = width * simulatedScale;
			const h = height * simulatedScale;
			return `
		position:absolute;
		left:${left}px;
		top:${top}px;
		width:${w}px;
		height:${h}px;
		z-index:${z};
		opacity:${opacity};
		overflow:${overflow};
		transform:rotate(${rotation}deg);
		transform-origin:top left;
	`;
		}
		if (isScaledMobile) {
			return `
		position:absolute;
		left:${x}px;
		top:${y}px;
		width:${width}px;
		height:${height}px;
		z-index:${z};
		opacity:${opacity};
		overflow:${overflow};
		transform:rotate(${rotation}deg);
		transform-origin:top left;
	`;
		}
		const baseWidth = effectiveBaseWidth || (isMobile ? baseWidthMobile : baseWidthDesktop) || 1;
		return `
		position:absolute;
		left:${toVw(x, baseWidth)};
		top:${toVw(y, baseWidth)};
		width:${toVw(width, baseWidth)};
		height:${toVw(height, baseWidth)};
		z-index:${z};
		opacity:${opacity};
		overflow:${overflow};
		transform:rotate(${rotation}deg);
		transform-origin:top left;
	`;
	}

	function updateScrollMetrics() {
		if (!viewportRef) return;
		if (isSimulatedMobile || isScaledMobile) {
			hasHorizontalScroll = false;
			horizontalThumbSize = 100;
			horizontalThumbOffset = 0;
		}
		const { scrollWidth, clientWidth, scrollLeft, scrollHeight, clientHeight, scrollTop } =
			viewportRef;
		const horizontalRange = Math.max(scrollWidth - clientWidth, 0);
		const verticalRange = Math.max(scrollHeight - clientHeight, 0);
		hasHorizontalScroll = !isSimulatedMobile && !isScaledMobile && horizontalRange > 1;
		hasVerticalScroll = verticalRange > 1;

		if (hasHorizontalScroll) {
			const ratio = clientWidth / scrollWidth || 0;
			horizontalThumbSize = Math.max(ratio * 100, 8);
			const maxOffset = Math.max(100 - horizontalThumbSize, 0);
			horizontalThumbOffset =
				horizontalRange === 0 ? 0 : (scrollLeft / horizontalRange) * maxOffset;
		} else {
			horizontalThumbSize = 100;
			horizontalThumbOffset = 0;
		}

		if (hasVerticalScroll) {
			const ratio = clientHeight / scrollHeight || 0;
			verticalThumbSize = Math.max(ratio * 100, 8);
			const maxOffset = Math.max(100 - verticalThumbSize, 0);
			verticalThumbOffset = verticalRange === 0 ? 0 : (scrollTop / verticalRange) * maxOffset;
		} else {
			verticalThumbSize = 100;
			verticalThumbOffset = 0;
		}
	}

	function scheduleIndicatorHide(delay = 1400) {
		clearTimeout(hideIndicatorsTimeout);
		if (delay === 0) {
			isInteracting = false;
			return;
		}
		hideIndicatorsTimeout = setTimeout(() => {
			isInteracting = false;
		}, delay);
	}

	function handleScroll() {
		isInteracting = true;
		updateScrollMetrics();
		scheduleIndicatorHide();
	}

	onMount(() => {
		const updateBrowserWidth = () => {
			if (typeof window !== 'undefined') {
				browserWidth = window.innerWidth || 0;
			}
		};
		isInteracting = true;
		updateBrowserWidth();
		updateScrollMetrics();
		scheduleIndicatorHide(2000);
		const handleResize = () => {
			updateBrowserWidth();
			updateScrollMetrics();
		};
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', handleResize);
		}
		if (typeof ResizeObserver === 'function') {
			resizeObserver = new ResizeObserver(() => updateScrollMetrics());
			if (viewportRef && !observedElements.has(viewportRef)) {
				resizeObserver.observe(viewportRef);
				observedElements.add(viewportRef);
			}
			if (contentRef && !observedElements.has(contentRef)) {
				resizeObserver.observe(contentRef);
				observedElements.add(contentRef);
			}
		}
		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener('resize', handleResize);
			}
		};
	});

	$: if (resizeObserver && viewportRef && !observedElements.has(viewportRef)) {
		resizeObserver.observe(viewportRef);
		observedElements.add(viewportRef);
	}

	$: if (resizeObserver && contentRef && !observedElements.has(contentRef)) {
		resizeObserver.observe(contentRef);
		observedElements.add(contentRef);
	}

	afterUpdate(() => {
		updateScrollMetrics();
	});

	onDestroy(() => {
		if (resizeObserver) resizeObserver.disconnect();
		observedElements.clear();
		clearTimeout(hideIndicatorsTimeout);
	});
</script>

<div class="free-canvas" style={getContainerStyle()}>
	<div
		class="free-canvas__viewport"
		class:simulated-mobile={isSimulatedMobile}
		class:scaled-mobile={isScaledMobile}
		bind:this={viewportRef}
		on:scroll={handleScroll}
	>
		<div class="free-canvas__scale-wrapper" style={getScaleWrapperStyle()}>
			<div class="free-canvas__content" bind:this={contentRef} style={getContentStyle()}>
				{#if shouldRenderBackgroundVideo}
					<video
						class="free-canvas__background-video"
						src={getBackgroundVideoValue(isMobile ? 'mobile' : 'desktop')}
						poster={getBackgroundPosterValue(isMobile ? 'mobile' : 'desktop')}
						autoplay={videoAutoplay}
						loop={videoLoop}
						muted={videoMuted ?? true}
						playsinline
						preload="auto"
					></video>
				{/if}
				{#each renderableItems as renderable (renderable.key)}
					{@const item = renderable.item}
					<div class="canvas-item" style={getStyle(item, renderable.frame)}>
						{#if item.type === 'text'}
							{@const tag = getTypographyTag(item)}
							{@const contentHasHtml = hasHtml(item.content)}
							{@const textStyle = getTextContentStyle(item, tag)}
							<div class="text" style={getTextContainerStyle(item, tag)}>
								{#if contentHasHtml}
									<div
										class={`text-content ${tag ? `typography-${tag}` : ''}`.trim()}
										style={textStyle}
									>
										{@html item.content || ''}
									</div>
								{:else}
									<svelte:element
										this={tag || 'p'}
										class={`text-content ${tag ? `typography-${tag}` : ''}`.trim()}
										style={textStyle}
									>
										{@html item.content || ''}
									</svelte:element>
								{/if}
							</div>
						{:else if item.type === 'image'}
							{#if getMediaSource(item)}
								<img
									src={getMediaSource(item)}
									alt={item.alt || ''}
									style="width:100%;height:100%;object-fit:${item.objectFit || 'cover'};"
								/>
							{/if}
						{:else if item.type === 'video'}
							{@const videoSrc = getMediaSource(item)}
							{#if videoSrc}
								<video
									src={videoSrc}
									poster={getMediaPoster(item)}
									autoplay={getPlaybackFlag(item, 'autoplay', true)}
									loop={getPlaybackFlag(item, 'loop', true)}
									muted={getPlaybackFlag(item, 'muted', true)}
									playsinline
									style="width:100%;height:100%;object-fit:${item.objectFit || 'cover'};"
								></video>
							{/if}
						{:else if item.type === 'globo-player'}
							<GloboPlayer
								videoId={item.videoId || ''}
								videoIdDesktop={item.videoIdDesktop || ''}
								videoIdMobile={item.videoIdMobile || ''}
								autoPlay={item.autoplay ?? false}
								autoplay={item.autoplay ?? false}
								startMuted={item.muted ?? true}
								skipDFP={item.skipDFP ?? false}
								loop={item.loop ?? false}
								containerBackgroundColor="transparent"
								widthDesktop="100%"
								widthMobile="100%"
							/>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>
	<div
		class={`free-canvas__indicator free-canvas__indicator--horizontal ${
			hasHorizontalScroll ? 'visible' : ''
		} ${isInteracting && hasHorizontalScroll ? 'active' : ''}`.trim()}
	>
		<div
			class="free-canvas__indicator-thumb"
			style={`width:${horizontalThumbSize}%;transform:translateX(${horizontalThumbOffset}%);`}
		></div>
	</div>
	<div
		class={`free-canvas__indicator free-canvas__indicator--vertical ${
			hasVerticalScroll ? 'visible' : ''
		} ${isInteracting && hasVerticalScroll ? 'active' : ''}`.trim()}
	>
		<div
			class="free-canvas__indicator-thumb"
			style={`height:${verticalThumbSize}%;transform:translateY(${verticalThumbOffset}%);`}
		></div>
	</div>
</div>

<style>
	.free-canvas {
		position: relative;
	}

	.free-canvas__viewport {
		width: 100%;
		height: 100%;
		overflow: auto;
		scrollbar-width: thin;
		-webkit-overflow-scrolling: touch;
	}

	.free-canvas__viewport.simulated-mobile {
		overflow-x: hidden;
	}

	.free-canvas__viewport.scaled-mobile {
		display: flex;
		justify-content: center;
		align-items: flex-start;
	}

	.free-canvas__scale-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.free-canvas__viewport::-webkit-scrollbar {
		height: 8px;
		width: 8px;
	}

	.free-canvas__viewport::-webkit-scrollbar-track {
		background: rgba(148, 163, 184, 0.15);
		border-radius: 9999px;
	}

	.free-canvas__viewport::-webkit-scrollbar-thumb {
		background: rgba(250, 250, 250, 0.35);
		border-radius: 9999px;
	}

	.free-canvas__viewport::-webkit-scrollbar-thumb:hover {
		background: rgba(250, 250, 250, 0.5);
	}

	.free-canvas__content {
		position: relative;
	}

	.canvas-item {
		position: absolute;
		z-index: 1;
	}

	.free-canvas__background-video {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		pointer-events: none;
		z-index: 0;
	}

	.free-canvas__indicator {
		position: absolute;
		pointer-events: none;
		transition: opacity 200ms ease;
		opacity: 0;
	}

	.free-canvas__indicator.visible {
		opacity: 0.35;
	}

	.free-canvas__indicator.active {
		opacity: 0.9;
	}

	.free-canvas__indicator--horizontal {
		left: 16px;
		right: 16px;
		bottom: 8px;
		height: 6px;
		border-radius: 9999px;
		background: rgba(148, 163, 184, 0.25);
		display: flex;
		align-items: center;
	}

	.free-canvas__indicator--vertical {
		top: 16px;
		bottom: 16px;
		right: 8px;
		width: 6px;
		border-radius: 9999px;
		background: rgba(148, 163, 184, 0.25);
		display: flex;
		justify-content: center;
	}

	.free-canvas__indicator-thumb {
		background: rgba(250, 250, 250, 0.6);
		border-radius: 9999px;
		box-shadow: 0 0 8px rgba(15, 23, 42, 0.35);
		transform-origin: top left;
	}

	.free-canvas__indicator--horizontal .free-canvas__indicator-thumb {
		height: 100%;
	}

	.free-canvas__indicator--vertical .free-canvas__indicator-thumb {
		width: 100%;
	}

	.text {
		width: 100%;
		height: 100%;
		box-sizing: border-box;
	}

	.text-content {
		width: 100%;
		margin: 0;
	}

	.text-content :global(*) {
		margin: 0;
	}

	img,
	video {
		display: block;
	}
</style>
