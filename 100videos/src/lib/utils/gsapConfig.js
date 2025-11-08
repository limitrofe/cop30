import { createGsapAnimatorOptions } from '$lib/utils/gsapAnimator.js';

export const GSAP_PROP_KEYS = new Set([
	'gsap',
	'gsapConfig',
	'gsapOptions',
	'gsapSettings',
	'gsapAnimations',
	'animations',
	'animation',
	'animationOptions',
	'animationConfig',
	'animationsConfig',
	'defaultAnimation',
	'gsapDefaultAnimation',
	'gsapMobileQuery',
	'gsapAutoRefresh',
	'gsapEnabled',
	'enableGsap'
]);

function isPlainObject(value) {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

function tryParseJson(value) {
	if (value === null || value === undefined) return undefined;
	if (typeof value !== 'string') return value;
	const trimmed = value.trim();
	if (!trimmed) return undefined;
	try {
		return JSON.parse(trimmed);
	} catch (error) {
		if (import.meta.env?.DEV) {
			console.warn('[gsapConfig] Falha ao converter JSON:', value, error);
		}
		return undefined;
	}
}

function coerceBoolean(value, fallback = undefined) {
	if (value === undefined || value === null || value === '') return fallback;
	if (typeof value === 'boolean') return value;
	if (typeof value === 'number') return value !== 0;
	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();
		if (['true', '1', 'yes', 'sim'].includes(normalized)) return true;
		if (['false', '0', 'no', 'não', 'nao'].includes(normalized)) return false;
	}
	return fallback !== undefined ? fallback : Boolean(value);
}

export function extractGsapOptions(source = {}, { componentType } = {}) {
	const config = {};
	const animations = [];

	const objectKeys = [
		'gsapConfig',
		'gsapOptions',
		'gsapSettings',
		'gsap',
		'animationOptions',
		'animationConfig',
		'animationsConfig'
	];

	for (const key of objectKeys) {
		const resolved = tryParseJson(source[key]);
		if (isPlainObject(resolved)) {
			Object.assign(config, resolved);
		}
	}

	const arrayKeys = ['gsapAnimations', 'animations', 'animation'];
	for (const key of arrayKeys) {
		const resolved = tryParseJson(source[key]);
		if (Array.isArray(resolved)) {
			animations.push(...resolved);
		}
	}

	if (Array.isArray(config.animations)) {
		animations.push(...config.animations);
	}
	if (animations.length) {
		config.animations = animations;
	}

	const defaultCandidates = [
		source.defaultAnimation,
		source.gsapDefaultAnimation,
		config.defaultAnimation
	];
	for (const candidate of defaultCandidates) {
		const resolved = tryParseJson(candidate);
		if (resolved !== undefined) {
			config.defaultAnimation = resolved;
			break;
		}
	}

	if (source.gsapMobileQuery) {
		config.mobileQuery = source.gsapMobileQuery;
	}

	const autoRefresh = coerceBoolean(source.gsapAutoRefresh, undefined);
	if (autoRefresh !== undefined) {
		config.autoRefresh = autoRefresh;
	}

	const enabled = coerceBoolean(
		source.enableGsap !== undefined ? source.enableGsap : source.gsapEnabled,
		undefined
	);
	if (enabled !== undefined) {
		config.enabled = enabled;
	}

	const preventForCharts = componentType && ['chart-bar', 'chart-line'].includes(componentType);
	if (preventForCharts) {
		config.enabled = false;
	}

	const hasAnimations = Array.isArray(config.animations) && config.animations.length > 0;
	const hasDefault = config.defaultAnimation && typeof config.defaultAnimation === 'object';

	if (!hasAnimations && !hasDefault && config.enabled === undefined) {
		config.enabled = false;
	}

	return createGsapAnimatorOptions(config);
}

export function stripGsapProps(props = {}) {
	const filtered = {};
	for (const [key, value] of Object.entries(props)) {
		if (GSAP_PROP_KEYS.has(key)) continue;
		filtered[key] = value;
	}
	return filtered;
}
