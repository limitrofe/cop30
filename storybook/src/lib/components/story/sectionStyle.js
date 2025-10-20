const BASE_CLASS = 'story-section';

const sanitizeUrl = (url) => (typeof url === 'string' ? url.trim() : '');

export function getSectionStyling(paragraph = {}) {
	const section = paragraph?.section || {};
	const styles = [];
	const classNames = [BASE_CLASS, `${BASE_CLASS}--${(paragraph.type || 'block').toLowerCase()}`];

	const backgroundColor = section.backgroundColor?.trim() || '';
	if (backgroundColor) {
		styles.push(`background:${backgroundColor}`);
		classNames.push(`${BASE_CLASS}--with-background`);
	}

	const textColor = section.textColor?.trim() || '';
	if (textColor) {
		styles.push(`color:${textColor}`);
		styles.push(`--story-text-color:${textColor}`);
		classNames.push(`${BASE_CLASS}--with-text-color`);
	}

	if (section.paddingTop !== undefined && section.paddingTop !== '') {
		styles.push(`--story-section-padding-top:${section.paddingTop}`);
	}

	if (section.paddingBottom !== undefined && section.paddingBottom !== '') {
		styles.push(`--story-section-padding-bottom:${section.paddingBottom}`);
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
