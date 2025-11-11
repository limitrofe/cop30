const BASE_CLASS = 'story-section';

const sanitizeString = (value) => (typeof value === 'string' ? value.trim() : '');
const sanitizeUrl = (url) => sanitizeString(url);

export function getSectionStyling(paragraph = {}) {
	const section = paragraph?.section || {};
	const styles = [];
	const classNames = [BASE_CLASS, `${BASE_CLASS}--${(paragraph.type || 'block').toLowerCase()}`];

	const backgroundColor = sanitizeString(section.backgroundColor) || '';
	if (backgroundColor) {
		styles.push(`background:${backgroundColor}`);
		classNames.push(`${BASE_CLASS}--with-background`);
	}

	const textColor = sanitizeString(section.textColor) || '';
	if (textColor) {
		styles.push(`color:${textColor}`);
		styles.push(`--story-text-color:${textColor}`);
		classNames.push(`${BASE_CLASS}--with-text-color`);
	}

	if (section.paddingTop !== undefined && section.paddingTop !== '') {
		styles.push(`--story-section-padding-top:${sanitizeString(section.paddingTop)}`);
	}

	if (section.paddingBottom !== undefined && section.paddingBottom !== '') {
		styles.push(`--story-section-padding-bottom:${sanitizeString(section.paddingBottom)}`);
	}

	const baseContentWidth = sanitizeString(section.contentWidth);
	const contentWidthDesktop = sanitizeString(section.contentWidthDesktop) || baseContentWidth;
	const contentWidthMobile = sanitizeString(section.contentWidthMobile) || baseContentWidth;

	if (contentWidthDesktop) {
		styles.push(`--section-content-width-desktop:${contentWidthDesktop}`);
		styles.push(`--story-text-container-width-desktop:${contentWidthDesktop}`);
	}

	if (contentWidthMobile) {
		styles.push(`--section-content-width-mobile:${contentWidthMobile}`);
		styles.push(`--story-text-container-width-mobile:${contentWidthMobile}`);
	}

	const baseContentMaxWidth = sanitizeString(section.contentMaxWidth);
	const contentMaxWidthDesktop =
		sanitizeString(section.contentMaxWidthDesktop) || baseContentMaxWidth;
	const contentMaxWidthMobile =
		sanitizeString(section.contentMaxWidthMobile) || baseContentMaxWidth;

	if (contentMaxWidthDesktop) {
		styles.push(`--section-content-max-width-desktop:${contentMaxWidthDesktop}`);
		styles.push(`--story-text-container-max-width-desktop:${contentMaxWidthDesktop}`);
	}

	if (contentMaxWidthMobile) {
		styles.push(`--section-content-max-width-mobile:${contentMaxWidthMobile}`);
		styles.push(`--story-text-container-max-width-mobile:${contentMaxWidthMobile}`);
	}

	let backgroundSource = section.backgroundSource || 'color';
	if (!['color', 'image', 'video'].includes(backgroundSource)) {
		backgroundSource = 'color';
	}

	const imageDesktop = sanitizeUrl(section.backgroundImageDesktop) || '';
	const imageMobile = sanitizeUrl(section.backgroundImageMobile) || imageDesktop;
	const videoDesktop = sanitizeUrl(section.backgroundVideoDesktop) || '';
	const videoMobile = sanitizeUrl(section.backgroundVideoMobile) || videoDesktop;
	const videoPosterDesktop = sanitizeUrl(section.backgroundVideoPosterDesktop) || '';
	const videoPosterMobile = sanitizeUrl(section.backgroundVideoPosterMobile) || videoPosterDesktop;

	if (backgroundSource === 'image' && !imageDesktop && !imageMobile) {
		backgroundSource = 'color';
	}

	if (backgroundSource === 'video' && !videoDesktop && !videoMobile) {
		backgroundSource = imageDesktop || imageMobile ? 'image' : 'color';
	}

	const background = {
		source: backgroundSource,
		color: backgroundColor,
		imageDesktop,
		imageMobile,
		videoDesktop,
		videoMobile,
		videoPosterDesktop,
		videoPosterMobile
	};

	return {
		className: classNames.filter(Boolean).join(' '),
		style: styles.length ? styles.join(';') : undefined,
		background
	};
}
