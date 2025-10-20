<script>
	export let title = '';
	export let subtitle = '';
	export let author = '';
	export let date = '';
	export let backgroundImage = '';
	export let backgroundImageMobile = '';
	export let backgroundVideo = '';
	export let backgroundVideoMobile = '';
	export let posterImage = '';
	export let posterImageMobile = '';

	export let overlay = true;
	export let overlayGradient = 'top-to-bottom';
	export let variant = 'default'; // 'default', 'minimal', 'hero'
	export let titleFontSizeDesktop = '';
	export let titleFontSizeMobile = '';
	export let titleLineHeightDesktop = '';
	export let titleLineHeightMobile = '';
	export let subtitleFontSizeDesktop = '';
	export let subtitleFontSizeMobile = '';
	export let subtitleLineHeightDesktop = '';
	export let subtitleLineHeightMobile = '';
	export let verticalAlign = 'top'; // top | center | bottom
	export let horizontalAlign = 'left'; // left | center | right
	export let titleColor = '';
	export let subtitleColor = '';
	export let metaColor = '';
	export let onMediaColor = '';
	export let titleShadow = false;
	export let subtitleShadow = false;
	export let metaShadow = false;

	// Verificações de mídia mais rigorosas
	$: hasDesktopMedia = !!(backgroundImage?.trim() || backgroundVideo?.trim());
	$: hasMobileMedia = !!(backgroundImageMobile?.trim() || backgroundVideoMobile?.trim());
	$: hasMedia = hasDesktopMedia || hasMobileMedia;

	const titleFallbackDesktop = 'var(--typography-h1-desktop-font-size, 4.5rem)';
	const titleFallbackMobile = 'var(--typography-h1-mobile-font-size, 3rem)';
	const titleLineFallbackDesktop = 'var(--typography-h1-desktop-line-height, 1.05)';
	const titleLineFallbackMobile = 'var(--typography-h1-mobile-line-height, 1.12)';
	const subtitleFallbackDesktop = 'var(--typography-lead-desktop-font-size, 1.5rem)';
	const subtitleFallbackMobile = 'var(--typography-lead-mobile-font-size, 1.3rem)';
	const subtitleLineFallbackDesktop = 'var(--typography-lead-desktop-line-height, 1.6)';
	const subtitleLineFallbackMobile = 'var(--typography-lead-mobile-line-height, 1.6)';
	const DEFAULT_TITLE_SHADOW = {
		enabled: false,
		offsetX: '0px',
		offsetY: '3px',
		blur: '18px',
		spread: '',
		color: 'rgba(15, 23, 42, 0.55)'
	};
	const DEFAULT_SUBTITLE_SHADOW = {
		enabled: false,
		offsetX: '0px',
		offsetY: '2px',
		blur: '12px',
		spread: '',
		color: 'rgba(15, 23, 42, 0.45)'
	};
	const DEFAULT_META_SHADOW = {
		enabled: false,
		offsetX: '0px',
		offsetY: '2px',
		blur: '10px',
		spread: '',
		color: 'rgba(15, 23, 42, 0.35)'
	};

	const OVERLAY_GRADIENTS = {
		'top-to-bottom': 'linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.25) 100%)',
		'bottom-to-top':
			'linear-gradient(0deg, rgba(15, 23, 42, 0.75) 0%, rgba(15, 23, 42, 0.35) 45%, rgba(15, 23, 42, 0) 100%)'
	};

	const NUMBER_PATTERN = /^-?\d+(?:\.\d+)?$/;

	const sanitizeShadowPart = (value, fallback = '', { expectLength = false } = {}) => {
		if (value === null || value === undefined) return fallback;
		let text = String(value).trim();
		if (!text) return fallback;
		if (expectLength) {
			if (NUMBER_PATTERN.test(text)) {
				text = `${text}px`;
			}
		}
		return text;
	};

	const normalizeShadowConfig = (input, defaults) => {
		if (!defaults) {
			return { enabled: false };
		}
		const base = {
			enabled: Boolean(defaults.enabled),
			offsetX: defaults.offsetX,
			offsetY: defaults.offsetY,
			blur: defaults.blur,
			spread: defaults.spread,
			color: defaults.color
		};

		if (typeof input === 'boolean') {
			return { ...base, enabled: input };
		}

		if (typeof input === 'string') {
			const trimmed = input.trim();
			if (!trimmed) {
				return { ...base, enabled: false };
			}
			return { ...base, enabled: true, value: trimmed };
		}

		if (input && typeof input === 'object') {
			const merged = {
				...base,
				...input
			};
			merged.enabled = input.enabled !== undefined ? Boolean(input.enabled) : true;
			return merged;
		}

		return { ...base, enabled: Boolean(input) };
	};

	const shadowToCss = (input, defaults) => {
		const config = normalizeShadowConfig(input, defaults);
		if (!config.enabled) {
			return 'none';
		}
		if (config.value) {
			return config.value;
		}
		const parts = [
			sanitizeShadowPart(config.offsetX, defaults.offsetX || '0px', { expectLength: true }),
			sanitizeShadowPart(config.offsetY, defaults.offsetY || '0px', { expectLength: true })
		];
		const blurPart = sanitizeShadowPart(
			config.blur,
			defaults.blur !== undefined ? defaults.blur : '',
			{ expectLength: Boolean(config.blur || defaults.blur) }
		);
		if (blurPart) {
			parts.push(blurPart);
		}
		const spreadPart = sanitizeShadowPart(config.spread, defaults.spread || '', {
			expectLength: Boolean(config.spread || defaults.spread)
		});
		if (spreadPart) {
			parts.push(spreadPart);
		}
		const colorPart = sanitizeShadowPart(config.color, defaults.color || 'rgba(0, 0, 0, 0.5)');
		parts.push(colorPart);
		return parts.filter((part) => part && part.length).join(' ');
	};

	$: computedTitleDesktop = titleFontSizeDesktop || titleFallbackDesktop;
	$: computedTitleMobile = titleFontSizeMobile || titleFallbackMobile;
	$: computedTitleLineDesktop = titleLineHeightDesktop || titleLineFallbackDesktop;
	$: computedTitleLineMobile = titleLineHeightMobile || titleLineFallbackMobile;
	$: computedSubtitleDesktop = subtitleFontSizeDesktop || subtitleFallbackDesktop;
	$: computedSubtitleMobile = subtitleFontSizeMobile || subtitleFallbackMobile;
	$: computedSubtitleLineDesktop = subtitleLineHeightDesktop || subtitleLineFallbackDesktop;
	$: computedSubtitleLineMobile = subtitleLineHeightMobile || subtitleLineFallbackMobile;

	const verticalOptions = ['top', 'center', 'bottom'];
	const horizontalOptions = ['left', 'center', 'right'];

	$: normalizedVerticalAlign = verticalOptions.includes((verticalAlign || '').toLowerCase())
		? (verticalAlign || '').toLowerCase()
		: 'top';
	$: normalizedHorizontalAlign = horizontalOptions.includes((horizontalAlign || '').toLowerCase())
		? (horizontalAlign || '').toLowerCase()
		: 'left';

	$: typographyStyle = [
		`--story-header-title-size-desktop:${computedTitleDesktop}`,
		`--story-header-title-size-mobile:${computedTitleMobile}`,
		`--story-header-title-line-desktop:${computedTitleLineDesktop}`,
		`--story-header-title-line-mobile:${computedTitleLineMobile}`,
		`--story-header-subtitle-size-desktop:${computedSubtitleDesktop}`,
		`--story-header-subtitle-size-mobile:${computedSubtitleMobile}`,
		`--story-header-subtitle-line-desktop:${computedSubtitleLineDesktop}`,
		`--story-header-subtitle-line-mobile:${computedSubtitleLineMobile}`
	].join('; ');

	$: colorStyle = [
		titleColor ? `--story-header-title-color:${titleColor}` : '',
		subtitleColor ? `--story-header-subtitle-color:${subtitleColor}` : '',
		metaColor ? `--story-header-meta-color:${metaColor}` : '',
		onMediaColor ? `--story-header-on-media-color:${onMediaColor}` : ''
	]
		.filter(Boolean)
		.join('; ');

	$: headerTitleShadow = shadowToCss(titleShadow, DEFAULT_TITLE_SHADOW);
	$: headerSubtitleShadow = shadowToCss(subtitleShadow, DEFAULT_SUBTITLE_SHADOW);
	$: headerMetaShadow = shadowToCss(metaShadow, DEFAULT_META_SHADOW);
	$: shadowStyle = [
		`--story-header-title-shadow:${headerTitleShadow}`,
		`--story-header-subtitle-shadow:${headerSubtitleShadow}`,
		`--story-header-meta-shadow:${headerMetaShadow}`
	].join('; ');

	$: combinedStyle = [typographyStyle, colorStyle, shadowStyle].filter(Boolean).join('; ');

	$: overlayGradientValue = (() => {
		if (!overlay) {
			return '';
		}
		if (typeof overlayGradient === 'string') {
			const trimmed = overlayGradient.trim();
			if (!trimmed) {
				return OVERLAY_GRADIENTS['top-to-bottom'];
			}
			const preset = trimmed.toLowerCase();
			if (OVERLAY_GRADIENTS[preset]) {
				return OVERLAY_GRADIENTS[preset];
			}
			return trimmed;
		}
		return OVERLAY_GRADIENTS['top-to-bottom'];
	})();

	$: overlayStyle = overlayGradientValue
		? `--story-header-overlay-gradient:${overlayGradientValue}`
		: '';

	function formatDate(dateStr) {
		if (!dateStr) return '';
		try {
			const [day, month, year] = dateStr.split('/');
			if (!day || !month || !year) return dateStr; // Retorna original se o formato for inesperado
			const dateObj = new Date(year, month - 1, day);
			return dateObj.toLocaleDateString('pt-BR', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				timeZone: 'UTC'
			});
		} catch (e) {
			return dateStr; // Retorna o texto original se houver erro
		}
	}
</script>

<header
	class="story-header story-header--{variant}"
	class:has-media={hasMedia}
	class:has-overlay={overlay && overlayGradientValue}
	class:story-header--valign-top={normalizedVerticalAlign === 'top'}
	class:story-header--valign-center={normalizedVerticalAlign === 'center'}
	class:story-header--valign-bottom={normalizedVerticalAlign === 'bottom'}
	class:story-header--halign-left={normalizedHorizontalAlign === 'left'}
	class:story-header--halign-center={normalizedHorizontalAlign === 'center'}
	class:story-header--halign-right={normalizedHorizontalAlign === 'right'}
>
	{#if hasMedia}
		<div class="story-header__media-container">
			{#if backgroundImageMobile?.trim()}
				<div
					class="story-header__background story-header__background--mobile"
					style="background-image: url({backgroundImageMobile})"
				></div>
			{/if}
			{#if backgroundVideoMobile?.trim()}
				<video
					class="story-header__video story-header__video--mobile"
					autoplay
					muted
					loop
					playsinline
					src={backgroundVideoMobile}
				></video>
			{/if}

			{#if backgroundImage?.trim()}
				<div
					class="story-header__background story-header__background--desktop"
					style="background-image: url({backgroundImage})"
				></div>
			{/if}
			{#if backgroundVideo?.trim()}
				<video
					class="story-header__video story-header__video--desktop"
					autoplay
					muted
					loop
					playsinline
					src={backgroundVideo}
				></video>
			{/if}
		</div>
	{/if}

	{#if overlay && overlayGradientValue}
		<div class="story-header__overlay" style={overlayStyle}></div>
	{/if}

	<div class="story-header__content" style={combinedStyle}>
		<div class="story-header__container">
			<h1>{@html title || ''}</h1>

			{#if subtitle}
				<p class="story-header__subtitle">{@html subtitle}</p>
			{/if}

			{#if author || date}
				<div class="story-header__meta">
					{#if author}
						<span class="story-header__author">Por {author}</span>
					{/if}
					{#if date}
						<time class="story-header__date">{formatDate(date)}</time>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</header>

<style>
	.story-header {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: flex-start;
		width: 100%;
		min-height: 100vh;
		padding: 4rem 2rem;
		background-color: inherit;
		color: var(--color-text, #f8fafc);
		text-align: left;
	}

	.story-header.has-media {
		min-height: 100vh;
		padding: 6rem 2rem;
	}

	.story-header.has-media .story-header__meta {
		color: var(--story-header-meta-color, var(--story-header-on-media-color, #f8fafc));
	}

	.story-header .story-header__container h1 {
		text-shadow: var(--story-header-title-shadow, none);
	}

	.story-header .story-header__subtitle {
		text-shadow: var(--story-header-subtitle-shadow, none);
	}

	.story-header--hero.has-media {
		min-height: 100vh;
	}

	.story-header--minimal {
		min-height: auto;
		padding: 2rem 0;
	}

	.story-header--minimal.has-media {
		min-height: 30vh;
	}

	.story-header--valign-top {
		justify-content: flex-start;
	}

	.story-header--valign-center {
		justify-content: center;
	}

	.story-header--valign-bottom {
		justify-content: flex-end;
	}

	.story-header--halign-left {
		align-items: flex-start;
		text-align: left;
	}

	.story-header--halign-center {
		align-items: center;
		text-align: center;
	}

	.story-header--halign-right {
		align-items: flex-end;
		text-align: right;
	}

	.story-header__media-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
	}

	.story-header__overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: var(
			--story-header-overlay-gradient,
			linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.25) 100%)
		);
		z-index: 2;
	}

	.story-header__background,
	.story-header__video {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-size: cover;
		background-position: center;
		object-fit: cover;
	}

	.story-header__background--desktop,
	.story-header__video--desktop {
		display: none;
	}

	.story-header__content {
		position: relative;
		z-index: 10;
		width: 100%;
	}

	.story-header__container {
		width: 100%;
		max-width: min(90vw, 1100px);
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.story-header--halign-left .story-header__container {
		align-items: flex-start;
		margin-left: 0;
		margin-right: auto;
	}

	.story-header--halign-center .story-header__container {
		align-items: center;
		margin-left: auto;
		margin-right: auto;
	}

	.story-header--halign-right .story-header__container {
		align-items: flex-end;
		margin-left: auto;
		margin-right: 0;
	}

	h1 {
		font-size: 3rem;
		font-weight: 900;
		color: var(--story-header-title-color, var(--color-text, #f8fafc));
		margin: 0;
		line-height: 1.1;
		width: 100%;
	}

	.story-header.has-media h1 {
		color: var(--story-header-title-color, var(--story-header-on-media-color, #f8fafc));
	}

	.story-header__subtitle {
		font-size: var(
			--story-header-subtitle-size-desktop,
			var(--typography-lead-desktop-font-size, 1.5rem)
		);
		color: var(--story-header-subtitle-color, var(--color-text, #f8fafc));
		font-weight: 600;
		margin: 0;
		line-height: var(
			--story-header-subtitle-line-desktop,
			var(--typography-lead-desktop-line-height, 1.6)
		);
		opacity: 0.9;
		max-width: 40rem;
	}

	.story-header--halign-center .story-header__subtitle,
	.story-header--halign-right .story-header__subtitle {
		max-width: none;
	}

	.story-header.has-media .story-header__subtitle {
		color: var(--story-header-subtitle-color, var(--story-header-on-media-color, #f8fafc));
	}

	.story-header__meta {
		display: flex;
		gap: 1rem;
		align-items: center;
		justify-content: flex-start;
		font-size: var(--typography-small-desktop-font-size, 0.9rem);
		color: var(--story-header-meta-color, var(--color-subtle-text, rgba(148, 157, 166, 0.9)));
		opacity: 0.85;
		text-shadow: var(--story-header-meta-shadow, none);
	}

	.story-header--halign-center .story-header__meta {
		justify-content: center;
	}

	.story-header--halign-right .story-header__meta {
		justify-content: flex-end;
	}

	.story-header__author {
		font-weight: 600;
	}

	@media (max-width: 768px) {
		.story-header {
			padding: 2.5rem 1.5rem;
		}

		.story-header.has-media {
			padding: 3rem 1.5rem;
		}

		h1 {
			font-size: var(--story-header-title-size-mobile, var(--typography-h1-mobile-font-size, 3rem));
			line-height: var(
				--story-header-title-line-mobile,
				var(--typography-h1-mobile-line-height, 1.12)
			);
		}

		.story-header__subtitle {
			font-size: var(
				--story-header-subtitle-size-mobile,
				var(--typography-lead-mobile-font-size, 1.3rem)
			);
			line-height: var(
				--story-header-subtitle-line-mobile,
				var(--typography-lead-mobile-line-height, 1.6)
			);
		}

		.story-header__meta {
			font-size: var(--typography-small-mobile-font-size, 0.8rem);
			flex-direction: column;
			gap: 0.5rem;
			text-align: inherit;
		}
	}

	@media (min-width: 769px) {
		.story-header {
			padding: 4rem 6rem;
		}

		.story-header.has-media {
			padding: 8rem 4rem;
		}

		.story-header__background--mobile,
		.story-header__video--mobile {
			display: none;
		}

		.story-header__background--desktop,
		.story-header__video--desktop {
			display: block;
		}

		h1 {
			font-size: var(
				--story-header-title-size-desktop,
				var(--typography-h1-desktop-font-size, 4.5rem)
			);
			line-height: var(
				--story-header-title-line-desktop,
				var(--typography-h1-desktop-line-height, 1.05)
			);
		}
	}
</style>
