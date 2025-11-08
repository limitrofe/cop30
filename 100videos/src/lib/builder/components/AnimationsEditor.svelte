<script>
	import { createEventDispatcher } from 'svelte';
	import JsonEditorField from './JsonEditorField.svelte';
	import { GSAP_PRESET_LIBRARY, GSAP_PRESET_CATEGORIES } from '$lib/utils/gsapPresets.js';

	const dispatch = createEventDispatcher();

	export let value = undefined;
	export let disabled = false;

	const PRESETS = [
		{ value: 'custom', label: 'Personalizado' },
		{ value: 'fade', label: 'Fade in' },
		{ value: 'fade-up', label: 'Fade in · subir' },
		{ value: 'fade-up-lg', label: 'Fade in · subir (forte)' },
		{ value: 'fade-down', label: 'Fade in · descer' },
		{ value: 'fade-left', label: 'Fade in · esquerda' },
		{ value: 'fade-right', label: 'Fade in · direita' },
		{ value: 'fade-right-lg', label: 'Fade in · direita (forte)' },
		{ value: 'scale-in', label: 'Scale in' },
		{ value: 'zoom-out', label: 'Zoom out' },
		{ value: 'blur-up', label: 'Blur → nítido' },
		{ value: 'tilt-in', label: 'Tilt 3D' },
		{ value: 'flip-x', label: 'Flip eixo X' },
		{ value: 'flip-y', label: 'Flip eixo Y' },
		{ value: 'skew-up', label: 'Skew up' },
		{ value: 'mask-right', label: 'Mask reveal →' },
		{ value: 'mask-up', label: 'Mask reveal ↑' },
		{ value: 'slide-rotate', label: 'Slide + rotate' }
	];

	const defaultConfig = () => ({
		enabled: false,
		autoRefresh: true,
		mobileQuery: '(max-width: 768px)',
		animations: []
	});

	const presetCategories = GSAP_PRESET_CATEGORIES;
	let activePresetCategory = presetCategories[0] ?? 'Todos';
	let presetSearch = '';
	let libraryOpen = false;

	const MASK_PROPERTIES = [
		{ value: 'clipPath', label: 'clip-path' },
		{ value: 'mask', label: 'mask' },
		{ value: 'maskImage', label: 'mask-image' },
		{ value: 'maskBorder', label: 'mask-border' },
		{ value: 'webkitMaskImage', label: '-webkit-mask-image' }
	];

	const defaultAnimation = (index = 0) => ({
		id: `anim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		label: `Animação ${index + 1}`,
		targets: '.story-section__inner > *',
		once: true,
		immediate: false,
		autoScroll: true,
		duration: 0.6,
		delay: 0,
		ease: 'power3.out',
		stagger: '',
		preset: 'fade-up',
		mobilePreset: 'fade-up',
		mobileOverride: false,
		from: presetConfig('fade-up').from,
		to: presetConfig('fade-up').to,
		mobile: undefined,
		scrollTrigger: undefined
	});

	function clone(value) {
		if (value === undefined || value === null) return value;
		try {
			return structuredClone(value);
		} catch (error) {
			return JSON.parse(JSON.stringify(value));
		}
	}

	function presetConfig(preset) {
		switch (preset) {
			case 'fade':
				return {
					from: { autoAlpha: 0 },
					to: { autoAlpha: 1 }
				};
			case 'fade-up':
				return {
					from: { autoAlpha: 0, y: 40 },
					to: { autoAlpha: 1, y: 0 }
				};
			case 'fade-up-lg':
				return {
					from: { autoAlpha: 0, y: 80 },
					to: { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out' }
				};
			case 'fade-down':
				return {
					from: { autoAlpha: 0, y: -40 },
					to: { autoAlpha: 1, y: 0 }
				};
			case 'fade-left':
				return {
					from: { autoAlpha: 0, x: -40 },
					to: { autoAlpha: 1, x: 0 }
				};
			case 'fade-right':
				return {
					from: { autoAlpha: 0, x: 40 },
					to: { autoAlpha: 1, x: 0 }
				};
			case 'fade-right-lg':
				return {
					from: { autoAlpha: 0, x: 90 },
					to: { autoAlpha: 1, x: 0, duration: 0.8, ease: 'expo.out' }
				};
			case 'scale-in':
				return {
					from: { autoAlpha: 0, scale: 0.85 },
					to: { autoAlpha: 1, scale: 1, ease: 'power3.out' }
				};
			case 'zoom-out':
				return {
					from: { autoAlpha: 0.6, scale: 1.15 },
					to: { autoAlpha: 1, scale: 1, ease: 'power2.out' }
				};
			case 'blur-up':
				return {
					from: { autoAlpha: 0, y: 30, filter: 'blur(16px)' },
					to: { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'expo.out' }
				};
			case 'tilt-in':
				return {
					from: {
						autoAlpha: 0,
						y: 50,
						rotationX: -35,
						transformPerspective: 900
					},
					to: {
						autoAlpha: 1,
						y: 0,
						rotationX: 0,
						duration: 0.8,
						ease: 'power3.out'
					}
				};
			case 'flip-x':
				return {
					from: {
						autoAlpha: 0,
						rotationX: 90,
						transformPerspective: 800
					},
					to: {
						autoAlpha: 1,
						rotationX: 0,
						duration: 0.8,
						ease: 'power4.out'
					}
				};
			case 'flip-y':
				return {
					from: {
						autoAlpha: 0,
						rotationY: -90,
						transformPerspective: 800
					},
					to: {
						autoAlpha: 1,
						rotationY: 0,
						duration: 0.8,
						ease: 'power4.out'
					}
				};
			case 'skew-up':
				return {
					from: { autoAlpha: 0, y: 60, skewY: 6 },
					to: { autoAlpha: 1, y: 0, skewY: 0, duration: 0.75, ease: 'power3.out' }
				};
			case 'mask-right':
				return {
					from: { autoAlpha: 1, clipPath: 'inset(0% 100% 0% 0%)' },
					to: { autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75, ease: 'power3.out' }
				};
			case 'mask-up':
				return {
					from: { autoAlpha: 1, clipPath: 'inset(100% 0% 0% 0%)' },
					to: { autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75, ease: 'power3.out' }
				};
			case 'slide-rotate':
				return {
					from: { autoAlpha: 0, y: 100, rotate: -6 },
					to: { autoAlpha: 1, y: 0, rotate: 0, duration: 0.85, ease: 'expo.out' }
				};
			default:
				return { from: {}, to: {} };
		}
	}

	function detectPreset(scope) {
		if (!scope || typeof scope !== 'object') return 'custom';
		const source = scope.from || scope.initial || {};
		const target = scope.to || scope.final || {};
		const alpha = source.autoAlpha ?? source.opacity ?? source.alpha;
		const deltaY = source.y ?? source.translateY;
		const deltaX = source.x ?? source.translateX;
		const scale = source.scale ?? source.scaleX;
		const rotationX = source.rotationX ?? source.rotateX;
		const rotationY = source.rotationY ?? source.rotateY;
		const clipPath = source.clipPath ?? '';
		const filter = source.filter ?? '';

		if (alpha === 0 && (deltaY === 40 || deltaY === '40' || deltaY === '40px')) {
			return 'fade-up';
		}
		if (alpha === 0 && (deltaY === 80 || deltaY === '80' || deltaY === '80px')) {
			return 'fade-up-lg';
		}
		if (alpha === 0 && (deltaY === -40 || deltaY === '-40' || deltaY === '-40px')) {
			return 'fade-down';
		}
		if (alpha === 0 && (deltaX === -40 || deltaX === '-40' || deltaX === '-40px')) {
			return 'fade-left';
		}
		if (alpha === 0 && (deltaX === 40 || deltaX === '40' || deltaX === '40px')) {
			return 'fade-right';
		}
		if (alpha === 0 && (deltaX === 90 || deltaX === '90' || deltaX === '90px')) {
			return 'fade-right-lg';
		}
		if (alpha === 0 && (scale === 0.85 || scale === '0.85')) {
			return 'scale-in';
		}
		if (alpha === 0.6 && (scale === 1.15 || scale === '1.15')) {
			return 'zoom-out';
		}
		if (rotationX === -35 || rotationX === '-35') {
			return 'tilt-in';
		}
		if (rotationX === 90 || rotationX === '90') {
			return 'flip-x';
		}
		if (rotationY === -90 || rotationY === '-90') {
			return 'flip-y';
		}
		if (clipPath && /\b100% 0% 0% 0%\b/.test(clipPath)) {
			return 'mask-up';
		}
		if (clipPath && /\b0% 100% 0% 0%\b/.test(clipPath)) {
			return 'mask-right';
		}
		if (filter && filter.includes('blur')) {
			return 'blur-up';
		}
		if (alpha === 0) {
			return 'fade';
		}
		return 'custom';
	}

	function normalizeTargets(targets) {
		if (!targets) return '';
		if (Array.isArray(targets)) {
			return targets.join(', ');
		}
		return String(targets);
	}

	function normalizeAnimation(animation, index = 0) {
		const hasTimeline = animation?.timeline && typeof animation.timeline === 'object';
		const preset = hasTimeline ? 'custom' : (animation?.preset ?? detectPreset(animation));
		const mobileOverride = Boolean(animation?.mobileOverride) || Boolean(animation?.mobile);
		const mobilePreset =
			animation?.mobilePreset ||
			(mobileOverride ? detectPreset(animation?.mobile) : (animation?.preset ?? 'custom'));
		const autoScroll = animation?.autoScroll === undefined ? true : Boolean(animation.autoScroll);
		const autoScrollTrigger = clone(animation?.autoScrollTrigger);
		const mask =
			animation?.mask && typeof animation.mask === 'object' ? clone(animation.mask) : undefined;

		return {
			id: animation?.id ?? `anim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			label: animation?.label ?? `Animação ${index + 1}`,
			targets: normalizeTargets(animation?.targets),
			once: animation?.once ?? false,
			immediate: animation?.immediate ?? false,
			duration: animation?.duration ?? animation?.to?.duration ?? 0.6,
			delay: animation?.delay ?? animation?.to?.delay ?? 0,
			ease: animation?.ease ?? animation?.to?.ease ?? 'power3.out',
			stagger: animation?.stagger ?? animation?.to?.stagger ?? '',
			preset,
			mobilePreset,
			mobileOverride,
			from: clone(animation?.from) ?? {},
			to: clone(animation?.to) ?? {},
			mobile: clone(animation?.mobile),
			scrollTrigger: clone(animation?.scrollTrigger),
			desktop: clone(animation?.desktop),
			timeline: clone(animation?.timeline),
			autoScroll,
			autoScrollTrigger,
			mask
		};
	}

	function normalizeConfig(rawValue) {
		const base = defaultConfig();
		if (rawValue && typeof rawValue === 'object') {
			base.enabled = Boolean(rawValue.enabled);
			base.autoRefresh =
				rawValue.autoRefresh === undefined ? base.autoRefresh : Boolean(rawValue.autoRefresh);
			base.mobileQuery = rawValue.mobileQuery || base.mobileQuery;
			if (Array.isArray(rawValue.animations)) {
				base.animations = rawValue.animations.map((item, index) => normalizeAnimation(item, index));
			}
		}
		return base;
	}

	let localConfig = normalizeConfig(value);
	let locked = false;
	let libraryWasOpenedAutomatically = false;

	$: if (!locked) {
		localConfig = normalizeConfig(value);
	}

	$: filteredAdvancedPresets = GSAP_PRESET_LIBRARY.filter((preset) => {
		const categoryOk =
			activePresetCategory === 'Todos' ||
			preset.category === activePresetCategory ||
			!preset.category;
		if (!categoryOk) return false;
		const term = presetSearch.trim().toLowerCase();
		if (!term) return true;
		const haystack = `${preset.label} ${preset.description || ''} ${
			preset.recommendation || ''
		}`.toLowerCase();
		return haystack.includes(term);
	});

	$: if (!libraryWasOpenedAutomatically && !localConfig.animations.length) {
		libraryOpen = true;
		libraryWasOpenedAutomatically = true;
	}

	function ensureMaskObject(animation) {
		if (!animation.mask || typeof animation.mask !== 'object') {
			animation.mask = {
				property: 'clipPath',
				value: '',
				animate: false
			};
		}
		return animation.mask;
	}

	function setMaskField(id, field, rawValue) {
		updateAnimation(id, (animation) => {
			if (
				field === 'property' &&
				(rawValue === 'none' || rawValue === '' || rawValue === undefined)
			) {
				delete animation.mask;
				return animation;
			}

			const mask = ensureMaskObject(animation);

			switch (field) {
				case 'property':
					mask.property = rawValue;
					break;
				case 'value':
					mask.value = typeof rawValue === 'string' ? rawValue : '';
					break;
				case 'targets':
					mask.targets = typeof rawValue === 'string' ? rawValue : undefined;
					break;
				case 'animate':
					mask.animate = Boolean(rawValue);
					if (!mask.animate) {
						delete mask.from;
						delete mask.to;
						delete mask.duration;
						delete mask.ease;
						delete mask.position;
					}
					break;
				case 'from':
				case 'to':
				case 'ease':
				case 'position':
					mask[field] = typeof rawValue === 'string' ? rawValue : undefined;
					break;
				case 'duration': {
					const numeric = Number(rawValue);
					mask.duration = Number.isFinite(numeric) ? numeric : undefined;
					break;
				}
			}

			if (!mask.property || !mask.value) {
				delete animation.mask;
			}

			return animation;
		});
	}

	function toNumber(value) {
		if (value === '' || value === null || value === undefined) return undefined;
		const numeric = Number(value);
		return Number.isFinite(numeric) ? numeric : undefined;
	}

	function toNumberOrString(value) {
		if (value === '' || value === null || value === undefined) return undefined;
		if (typeof value === 'number') return value;
		const trimmed = String(value).trim();
		if (trimmed === '') return undefined;
		const numeric = Number(trimmed);
		if (Number.isFinite(numeric)) return numeric;
		return trimmed;
	}

	function cleanObject(obj) {
		if (!obj || typeof obj !== 'object') return undefined;
		const entries = Object.entries(obj).filter(
			([, val]) => !(val === '' || val === null || val === undefined)
		);
		if (!entries.length) return undefined;
		const cleaned = {};
		for (const [key, val] of entries) {
			cleaned[key] = val;
		}
		return cleaned;
	}

	function formatTargetsForOutput(targets) {
		if (!targets) return undefined;
		if (Array.isArray(targets)) {
			const filtered = targets.map((item) => String(item).trim()).filter(Boolean);
			if (!filtered.length) return undefined;
			return filtered;
		}
		const parts = String(targets)
			.split(/[,;\n]+/)
			.map((item) => item.trim())
			.filter(Boolean);
		if (!parts.length) return undefined;
		return parts.length === 1 ? parts[0] : parts;
	}

	function cleanTimeline(timeline) {
		if (!timeline || typeof timeline !== 'object') return undefined;
		const cleaned = {};

		const targets = formatTargetsForOutput(timeline.targets);
		if (targets) cleaned.targets = targets;

		if (timeline.options && typeof timeline.options === 'object') {
			const options = clone(timeline.options);
			if (options && Object.keys(options).length) {
				cleaned.options = options;
			}
		}

		const steps = Array.isArray(timeline.steps)
			? timeline.steps
					.map((step) => {
						if (!step || typeof step !== 'object') return null;
						const stepTargets = formatTargetsForOutput(step.targets);
						const from = cleanObject(step.from);
						const to = cleanObject(step.to);
						const stepOutput = {};
						if (step.label) stepOutput.label = step.label;
						if (stepTargets) stepOutput.targets = stepTargets;
						if (from) stepOutput.from = from;
						if (to) stepOutput.to = to;
						if (step.position !== undefined) stepOutput.position = step.position;
						return Object.keys(stepOutput).length ? stepOutput : null;
					})
					.filter(Boolean)
			: [];
		if (steps.length) cleaned.steps = steps;

		const scroller = cleanObject(timeline.scrollTrigger);
		if (scroller) cleaned.scrollTrigger = scroller;

		return Object.keys(cleaned).length ? cleaned : undefined;
	}

	function sanitizeAnimation(animation) {
		const output = {
			id: animation.id,
			label: animation.label?.trim() || undefined,
			targets: formatTargetsForOutput(animation.targets),
			once: animation.once === undefined ? true : Boolean(animation.once),
			immediate: Boolean(animation.immediate),
			duration: toNumber(animation.duration),
			delay: toNumber(animation.delay),
			ease: animation.ease?.trim() || undefined,
			stagger: toNumberOrString(animation.stagger),
			preset: animation.preset,
			mobilePreset: animation.mobilePreset,
			mobileOverride: Boolean(animation.mobileOverride),
			from: cleanObject(animation.from),
			to: cleanObject(animation.to),
			scrollTrigger: cleanObject(animation.scrollTrigger),
			desktop: cleanObject(animation.desktop),
			timeline: cleanTimeline(animation.timeline)
		};

		const mobile = animation.mobileOverride ? cleanObject(animation.mobile) : undefined;
		if (mobile) {
			output.mobile = mobile;
		}

		if (animation.autoScroll === false) {
			output.autoScroll = false;
		}

		const autoScrollTrigger = cleanObject(animation.autoScrollTrigger);
		if (autoScrollTrigger) {
			output.autoScrollTrigger = autoScrollTrigger;
		}

		if (animation.mask && typeof animation.mask === 'object') {
			const property = animation.mask.property;
			const value =
				typeof animation.mask.value === 'string' ? animation.mask.value.trim() : undefined;
			if (property && value) {
				const maskOutput = {
					property,
					value,
					animate: Boolean(animation.mask.animate)
				};
				const targets =
					typeof animation.mask.targets === 'string' ? animation.mask.targets.trim() : '';
				if (targets) maskOutput.targets = targets;
				if (animation.mask.animate) {
					const fromValue =
						typeof animation.mask.from === 'string' ? animation.mask.from : undefined;
					const toValue = typeof animation.mask.to === 'string' ? animation.mask.to : undefined;
					if (fromValue) maskOutput.from = fromValue;
					if (toValue) maskOutput.to = toValue;
					const durationValue = Number(animation.mask.duration);
					if (Number.isFinite(durationValue)) maskOutput.duration = durationValue;
					const easeValue =
						typeof animation.mask.ease === 'string' ? animation.mask.ease.trim() : undefined;
					if (easeValue) maskOutput.ease = easeValue;
					const positionValue =
						typeof animation.mask.position === 'string'
							? animation.mask.position.trim()
							: undefined;
					if (positionValue) maskOutput.position = positionValue;
				}
				output.mask = maskOutput;
			}
		}

		Object.keys(output).forEach((key) => {
			if (output[key] === undefined) {
				delete output[key];
			}
		});

		return output;
	}

	function sanitizeConfig(config) {
		const sanitized = {
			enabled: Boolean(config.enabled),
			autoRefresh: config.autoRefresh === undefined ? true : Boolean(config.autoRefresh),
			mobileQuery: config.mobileQuery || '(max-width: 768px)',
			animations: config.animations.map(sanitizeAnimation)
		};

		if (!sanitized.animations.length) {
			sanitized.animations = [];
		}

		return sanitized;
	}

	function emit(nextConfig) {
		const cloned = clone(nextConfig);
		localConfig = cloned;
		const sanitized = sanitizeConfig(cloned);
		locked = true;
		dispatch('change', { value: sanitized });
		Promise.resolve().then(() => {
			locked = false;
		});
	}

	function setConfigField(key, value) {
		const next = { ...localConfig, [key]: value };
		emit(next);
	}

	function updateAnimation(id, updater) {
		const animations = localConfig.animations.map((animation) => {
			if (animation.id !== id) return animation;
			const draft = clone(animation) || {};
			const updated = updater(draft) || draft;
			return updated;
		});
		emit({ ...localConfig, animations });
	}

	function removeAnimation(id) {
		const animations = localConfig.animations.filter((animation) => animation.id !== id);
		emit({ ...localConfig, animations });
	}

	function addAnimation() {
		const animations = [...localConfig.animations, defaultAnimation(localConfig.animations.length)];
		emit({ ...localConfig, enabled: true, animations });
	}

	function duplicateAnimation(id) {
		const index = localConfig.animations.findIndex((animation) => animation.id === id);
		if (index === -1) return;
		const cloneAnimation = clone(localConfig.animations[index]);
		const duplicated = {
			...cloneAnimation,
			id: `anim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			label: `${cloneAnimation.label || `Animação ${index + 1}`} (cópia)`
		};
		const animations = [...localConfig.animations];
		animations.splice(index + 1, 0, duplicated);
		emit({ ...localConfig, animations });
	}

	function moveAnimation(id, direction) {
		const index = localConfig.animations.findIndex((animation) => animation.id === id);
		if (index === -1) return;
		const target = index + direction;
		if (target < 0 || target >= localConfig.animations.length) return;
		const animations = [...localConfig.animations];
		const [item] = animations.splice(index, 1);
		animations.splice(target, 0, item);
		emit({ ...localConfig, animations });
	}

	function setAnimationField(id, field, rawValue) {
		updateAnimation(id, (animation) => {
			if (field === 'duration' || field === 'delay') {
				const numeric = rawValue === '' ? '' : Number(rawValue);
				animation[field] =
					rawValue === '' ? '' : Number.isFinite(numeric) ? numeric : animation[field];
			} else if (field === 'stagger') {
				if (rawValue === '') {
					animation.stagger = '';
				} else {
					const numeric = Number(rawValue);
					animation.stagger = Number.isFinite(numeric) ? numeric : rawValue;
				}
			} else if (field === 'once' || field === 'immediate' || field === 'mobileOverride') {
				animation[field] = Boolean(rawValue);
				if (field === 'mobileOverride' && !animation[field]) {
					animation.mobile = undefined;
					animation.mobilePreset = animation.preset;
				}
			} else if (field === 'preset') {
				animation.preset = rawValue;
				const presetValues = presetConfig(rawValue);
				if (presetValues.from && Object.keys(presetValues.from).length) {
					animation.from = presetValues.from;
				}
				if (presetValues.to && Object.keys(presetValues.to).length) {
					const { ease, duration, delay, stagger, ...rest } = presetValues.to;
					animation.to = rest;
					if (ease && !animation.ease) animation.ease = ease;
					if (duration && !animation.duration) animation.duration = duration;
					if (delay && !animation.delay) animation.delay = delay;
					if (stagger && !animation.stagger) animation.stagger = stagger;
				}
			} else if (field === 'mobilePreset') {
				animation.mobilePreset = rawValue;
				const presetValues = presetConfig(rawValue);
				animation.mobile = {
					...(animation.mobile || {}),
					...presetValues
				};
				animation.mobileOverride = true;
			} else {
				animation[field] = rawValue;
			}
			return animation;
		});
	}

	function setAnimationJsonField(id, field, value) {
		updateAnimation(id, (animation) => {
			if (field === 'mobile') {
				animation.mobile = value;
				animation.mobileOverride = Boolean(value);
				animation.mobilePreset = animation.mobile
					? detectPreset(animation.mobile)
					: animation.preset;
			} else {
				animation[field] = value;
				const scope = {
					from: field === 'from' ? value : animation.from,
					to: field === 'to' ? value : animation.to
				};
				animation.preset = detectPreset(scope);
			}
			return animation;
		});
	}

	function setAnimationMobileField(id, targetField, value) {
		updateAnimation(id, (animation) => {
			const nextMobile = { ...(animation.mobile || {}) };
			if (value === undefined) {
				delete nextMobile[targetField];
			} else {
				nextMobile[targetField] = value;
			}
			if (Object.keys(nextMobile).length === 0) {
				animation.mobile = undefined;
				animation.mobileOverride = false;
				animation.mobilePreset = animation.preset;
			} else {
				animation.mobile = nextMobile;
				animation.mobileOverride = true;
				animation.mobilePreset = detectPreset(animation.mobile);
			}
			return animation;
		});
	}

	function applyAdvancedPreset(preset) {
		if (!preset || !preset.config) return;
		const animations = Array.isArray(preset.config.animations)
			? preset.config.animations.map((animation, index) =>
					normalizeAnimation(
						{
							...animation,
							label: animation.label || `${preset.label} #${index + 1}`
						},
						localConfig.animations.length + index
					)
				)
			: [];

		const next = {
			...localConfig,
			enabled: preset.config.enabled === undefined ? true : Boolean(preset.config.enabled),
			autoRefresh:
				preset.config.autoRefresh === undefined
					? localConfig.autoRefresh
					: Boolean(preset.config.autoRefresh),
			mobileQuery: preset.config.mobileQuery || localConfig.mobileQuery,
			animations: [...localConfig.animations, ...animations]
		};

		emit(next);
		if (animations.length) {
			libraryOpen = false;
		}
	}
</script>

<div class="gsap-editor" class:disabled>
	<div class="gsap-header">
		<div class="toggle">
			<label class="toggle-field">
				<input
					type="checkbox"
					checked={localConfig.enabled}
					{disabled}
					on:change={(event) => setConfigField('enabled', event.currentTarget.checked)}
				/>
				<div class="toggle-copy">
					<span class="toggle-title">Ativar animações GSAP para este bloco</span>
					<span class="toggle-note"
						>Selecione os elementos dentro da seção e defina como entram na tela usando presets ou
						configurações personalizadas.</span
					>
				</div>
			</label>
		</div>

		<div class="gsap-options">
			<label class="input-field">
				<span>Breakpoint mobile</span>
				<input
					type="text"
					placeholder="(max-width: 768px)"
					value={localConfig.mobileQuery}
					{disabled}
					on:input={(event) => setConfigField('mobileQuery', event.currentTarget.value)}
				/>
			</label>
			<label class="toggle-field toggle-field--compact">
				<input
					type="checkbox"
					checked={localConfig.autoRefresh}
					{disabled}
					on:change={(event) => setConfigField('autoRefresh', event.currentTarget.checked)}
				/>
				<div class="toggle-copy">
					<span class="toggle-title">Reaplicar quando viewport mudar</span>
					<span class="toggle-note"
						>Executa novamente ao alternar entre desktop e mobile (ex.: ao testar no preview).</span
					>
				</div>
			</label>
		</div>
	</div>

	<div class="preset-library">
		<details class="preset-library__panel" bind:open={libraryOpen}>
			<summary>
				<span>Biblioteca de presets avançados</span>
				<small>Hero, parallax, 3D, timelines e mais.</small>
			</summary>
			<div class="preset-library__controls">
				<div class="preset-library__chips">
					{#each presetCategories as category}
						<button
							type="button"
							class:active={activePresetCategory === category}
							on:click={() => (activePresetCategory = category)}
						>
							{category}
						</button>
					{/each}
				</div>
				<input
					type="search"
					placeholder="Buscar efeitos..."
					bind:value={presetSearch}
					class="preset-library__search"
				/>
			</div>
			<div class="preset-library__grid">
				{#each filteredAdvancedPresets as preset}
					<article class="preset-card">
						<header>
							<span class="preset-card__category">{preset.category || 'Outros'}</span>
							<h4>{preset.label}</h4>
						</header>
						<p>{preset.description}</p>
						{#if preset.recommendation}
							<p class="preset-card__recommendation">{preset.recommendation}</p>
						{/if}
						<div class="preset-card__actions">
							<button type="button" on:click={() => applyAdvancedPreset(preset)} {disabled}>
								Aplicar preset
							</button>
						</div>
					</article>
				{:else}
					<p class="preset-library__empty">Nenhum preset encontrado para este filtro.</p>
				{/each}
			</div>
		</details>
	</div>

	{#if !localConfig.animations.length}
		<div class="empty">
			<p>
				Nenhuma animação configurada ainda. Clique em “Adicionar animação” para começar e selecione
				os elementos que devem animar.
			</p>
		</div>
	{/if}

	{#each localConfig.animations as animation, index (animation.id)}
		<article class="animation-card">
			<header>
				<div class="summary">
					<label>
						<span>Nome interno</span>
						<input
							type="text"
							value={animation.label}
							placeholder={`Animação ${index + 1}`}
							on:input={(event) =>
								setAnimationField(animation.id, 'label', event.currentTarget.value)}
						/>
					</label>
					<label>
						<span>Targets (CSS, `.classe`, `[data-id]`)</span>
						<input
							type="text"
							value={animation.targets}
							placeholder=".story-section__inner h2"
							on:input={(event) =>
								setAnimationField(animation.id, 'targets', event.currentTarget.value)}
						/>
					</label>
				</div>

				<div class="actions">
					<button
						type="button"
						title="Mover para cima"
						on:click={() => moveAnimation(animation.id, -1)}
					>
						↑
					</button>
					<button
						type="button"
						title="Mover para baixo"
						on:click={() => moveAnimation(animation.id, 1)}
					>
						↓
					</button>
					<button type="button" title="Duplicar" on:click={() => duplicateAnimation(animation.id)}>
						⧉
					</button>
					<button
						type="button"
						class="danger"
						title="Remover"
						on:click={() => removeAnimation(animation.id)}
					>
						✕
					</button>
				</div>
			</header>

			<section class="controls">
				<div class="row presets">
					<label>
						<span>Preset desktop</span>
						<select
							value={animation.preset}
							on:change={(event) =>
								setAnimationField(animation.id, 'preset', event.currentTarget.value)}
						>
							{#each PRESETS as preset}
								<option value={preset.value}>{preset.label}</option>
							{/each}
						</select>
					</label>

					<label class="inline-checkbox">
						<input
							type="checkbox"
							checked={animation.mobileOverride}
							on:change={(event) =>
								setAnimationField(animation.id, 'mobileOverride', event.currentTarget.checked)}
						/>
						<span>Customizar mobile</span>
					</label>

					{#if animation.mobileOverride}
						<label>
							<span>Preset mobile</span>
							<select
								value={animation.mobilePreset}
								on:change={(event) =>
									setAnimationField(animation.id, 'mobilePreset', event.currentTarget.value)}
							>
								{#each PRESETS as preset}
									<option value={preset.value}>{preset.label}</option>
								{/each}
							</select>
						</label>
					{/if}
				</div>

				<div class="row timing">
					<label>
						<span>Duração (s)</span>
						<input
							type="number"
							step="0.05"
							min="0"
							value={animation.duration ?? ''}
							on:input={(event) =>
								setAnimationField(animation.id, 'duration', event.currentTarget.value)}
						/>
					</label>
					<label>
						<span>Delay (s)</span>
						<input
							type="number"
							step="0.05"
							min="0"
							value={animation.delay ?? ''}
							on:input={(event) =>
								setAnimationField(animation.id, 'delay', event.currentTarget.value)}
						/>
					</label>
					<label>
						<span>Ease</span>
						<input
							type="text"
							value={animation.ease ?? ''}
							placeholder="power3.out"
							on:input={(event) =>
								setAnimationField(animation.id, 'ease', event.currentTarget.value)}
						/>
					</label>
					<label>
						<span>Stagger</span>
						<input
							type="text"
							value={animation.stagger ?? ''}
							placeholder="0.08"
							on:input={(event) =>
								setAnimationField(animation.id, 'stagger', event.currentTarget.value)}
						/>
					</label>
				</div>

				<div class="row toggles">
					<label class="inline-checkbox">
						<input
							type="checkbox"
							checked={animation.once}
							on:change={(event) =>
								setAnimationField(animation.id, 'once', event.currentTarget.checked)}
						/>
						<span>Executar apenas uma vez</span>
					</label>
					<label class="inline-checkbox">
						<input
							type="checkbox"
							checked={animation.immediate}
							on:change={(event) =>
								setAnimationField(animation.id, 'immediate', event.currentTarget.checked)}
						/>
						<span>Iniciar sem esperar scroll</span>
					</label>
				</div>

				<div class="mask-card">
					<div class="mask-card__header">
						<h5>Máscara (SVG)</h5>
						<p>
							Defina um `clip-path` ou `mask` para aplicar no elemento. Use links
							`url(#idDaMascara)` ou SVG inline hospedado.
						</p>
					</div>
					<div class="mask-card__grid">
						<label>
							<span>Aplicar em</span>
							<select
								value={animation.mask?.property ?? 'none'}
								on:change={(event) =>
									setMaskField(animation.id, 'property', event.currentTarget.value)}
							>
								<option value="none">Sem máscara</option>
								{#each MASK_PROPERTIES as option}
									<option value={option.value} selected={animation.mask?.property === option.value}>
										{option.label}
									</option>
								{/each}
							</select>
						</label>
						{#if animation.mask?.property}
							<label>
								<span>Valor (ex.: url(#maskId) ou SVG)</span>
								<input
									type="text"
									value={animation.mask?.value ?? ''}
									placeholder="url(#maskId)"
									on:input={(event) =>
										setMaskField(animation.id, 'value', event.currentTarget.value)}
								/>
							</label>
							<label>
								<span>Alvo específico (opcional)</span>
								<input
									type="text"
									value={animation.mask?.targets ?? ''}
									placeholder=".classe, [data-mask]"
									on:input={(event) =>
										setMaskField(animation.id, 'targets', event.currentTarget.value)}
								/>
							</label>
							<label class="inline-checkbox mask-card__animate">
								<input
									type="checkbox"
									checked={animation.mask?.animate ?? false}
									on:change={(event) =>
										setMaskField(animation.id, 'animate', event.currentTarget.checked)}
								/>
								<span>Animar mascara entre dois valores</span>
							</label>
							{#if animation.mask?.animate}
								<label>
									<span>Valor inicial</span>
									<input
										type="text"
										value={animation.mask?.from ?? ''}
										placeholder="url(#maskStart)"
										on:input={(event) =>
											setMaskField(animation.id, 'from', event.currentTarget.value)}
									/>
								</label>
								<label>
									<span>Valor final</span>
									<input
										type="text"
										value={animation.mask?.to ?? ''}
										placeholder="url(#maskEnd)"
										on:input={(event) =>
											setMaskField(animation.id, 'to', event.currentTarget.value)}
									/>
								</label>
								<label>
									<span>Duração (s)</span>
									<input
										type="number"
										step="0.05"
										min="0"
										value={animation.mask?.duration ?? ''}
										on:input={(event) =>
											setMaskField(animation.id, 'duration', event.currentTarget.value)}
									/>
								</label>
								<label>
									<span>Ease</span>
									<input
										type="text"
										value={animation.mask?.ease ?? ''}
										placeholder="power3.out"
										on:input={(event) =>
											setMaskField(animation.id, 'ease', event.currentTarget.value)}
									/>
								</label>
								<label>
									<span>Posição na timeline (opcional)</span>
									<input
										type="text"
										value={animation.mask?.position ?? ''}
										placeholder="0, &quot;label&quot;, &quot;+=0.2&quot;..."
										on:input={(event) =>
											setMaskField(animation.id, 'position', event.currentTarget.value)}
									/>
								</label>
							{/if}
						{/if}
					</div>
				</div>

				<details class="advanced">
					<summary>Avançado (JSON)</summary>
					<JsonEditorField
						label="Estado inicial (from)"
						value={animation.from}
						on:change={(event) => setAnimationJsonField(animation.id, 'from', event.detail.value)}
						help="Valores típicos: &#123;&quot;autoAlpha&quot;:0,&quot;y&quot;:40&#125;"
					/>
					<JsonEditorField
						label="Estado final (to)"
						value={animation.to}
						on:change={(event) => setAnimationJsonField(animation.id, 'to', event.detail.value)}
						help="Valores típicos: &#123;&quot;autoAlpha&quot;:1,&quot;y&quot;:0&#125;"
					/>
					<JsonEditorField
						label="ScrollTrigger"
						value={animation.scrollTrigger}
						on:change={(event) =>
							setAnimationJsonField(animation.id, 'scrollTrigger', event.detail.value)}
						help="Ex: &#123;&quot;start&quot;:&quot;top 80%&quot;,&quot;toggleActions&quot;:&quot;play none none reverse&quot;&#125;"
					/>
					{#if animation.mobileOverride}
						<JsonEditorField
							label="Mobile · Estado inicial"
							value={animation.mobile?.from}
							on:change={(event) =>
								setAnimationMobileField(animation.id, 'from', event.detail.value)}
						/>
						<JsonEditorField
							label="Mobile · Estado final"
							value={animation.mobile?.to}
							on:change={(event) => setAnimationMobileField(animation.id, 'to', event.detail.value)}
						/>
					{/if}
				</details>
			</section>
		</article>
	{/each}

	<div class="footer">
		<button type="button" class="add" on:click={addAnimation} {disabled}>
			Adicionar animação
		</button>
		{#if localConfig.enabled}
			<small class="status">
				💡 As animações são aplicadas quando o bloco entra na viewport. Use seletores específicos
				para evitar conflitos.
			</small>
		{:else}
			<small class="status muted">
				As configurações estão salvas, mas só serão executadas quando “Ativar animações GSAP”
				estiver ligado.
			</small>
		{/if}
	</div>
</div>

<style>
	.gsap-editor {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.gsap-editor.disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	.gsap-header {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.toggle {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.toggle-field {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.65rem 0.75rem;
		border-radius: 12px;
		border: 1px solid rgba(148, 163, 184, 0.25);
		background: rgba(248, 250, 252, 0.85);
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
		color: #0f172a;
		transition:
			border-color 0.2s ease,
			box-shadow 0.2s ease;
		cursor: pointer;
	}

	.toggle-field:hover {
		border-color: rgba(37, 99, 235, 0.45);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.8),
			0 10px 18px rgba(37, 99, 235, 0.1);
	}

	.toggle-field input[type='checkbox'] {
		width: 18px;
		height: 18px;
		margin-top: 0.2rem;
		flex-shrink: 0;
	}

	.toggle-copy {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		line-height: 1.45;
	}

	.toggle-title {
		font-weight: 600;
		color: #0f172a;
		font-size: 0.85rem;
	}

	.toggle-note {
		color: #64748b;
		font-size: 0.75rem;
	}

	.toggle-field--compact {
		padding: 0.6rem 0.65rem;
	}

	.gsap-options {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.preset-library {
		margin: 0.75rem 0 1rem;
	}

	.preset-library__panel {
		border: 1px solid rgba(148, 163, 184, 0.3);
		border-radius: 14px;
		background: rgba(248, 250, 252, 0.9);
		display: block;
		overflow: hidden;
		box-shadow: 0 14px 32px rgba(15, 23, 42, 0.12);
	}

	.preset-library__panel > summary {
		list-style: none;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.85rem 1rem;
		font-weight: 600;
		color: #0f172a;
	}

	.preset-library__panel > summary::-webkit-details-marker {
		display: none;
	}

	.preset-library__panel[open] > summary {
		border-bottom: 1px solid rgba(148, 163, 184, 0.25);
	}

	.preset-library__panel > summary small {
		font-weight: 400;
		font-size: 0.75rem;
		color: #64748b;
	}

	.preset-library__controls {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.75rem 1rem 0.4rem;
	}

	.preset-library__chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.preset-library__chips button {
		border: 1px solid rgba(148, 163, 184, 0.4);
		background: white;
		color: #1f2937;
		padding: 0.4rem 0.75rem;
		border-radius: 999px;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.preset-library__chips button.active {
		background: linear-gradient(135deg, #2563eb, #3b82f6);
		border-color: rgba(37, 99, 235, 0.7);
		color: white;
		box-shadow: 0 10px 20px rgba(37, 99, 235, 0.2);
	}

	.preset-library__search {
		width: 100%;
		padding: 0.55rem 0.75rem;
		border-radius: 10px;
		border: 1px solid rgba(148, 163, 184, 0.35);
		background: white;
		font-size: 0.82rem;
	}

	.preset-library__search:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow:
			0 0 0 1px rgba(37, 99, 235, 0.3),
			0 10px 20px rgba(37, 99, 235, 0.15);
	}

	.preset-library__grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.85rem;
		padding: 0 1rem 1rem;
	}

	.preset-card {
		background: white;
		border-radius: 14px;
		border: 1px solid rgba(148, 163, 184, 0.25);
		padding: 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		box-shadow: 0 12px 26px rgba(15, 23, 42, 0.12);
	}

	.preset-card header {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.preset-card__category {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #2563eb;
		font-weight: 700;
	}

	.preset-card h4 {
		margin: 0;
		font-size: 0.95rem;
		color: #0f172a;
	}

	.preset-card p {
		margin: 0;
		font-size: 0.78rem;
		color: #475569;
		line-height: 1.45;
	}

	.preset-card__recommendation {
		color: #1d4ed8;
		font-size: 0.75rem;
	}

	.preset-card__actions {
		display: flex;
		justify-content: flex-start;
		margin-top: 0.35rem;
	}

	.preset-card__actions button {
		border: none;
		background: linear-gradient(135deg, #1d4ed8, #3b82f6);
		color: white;
		font-weight: 600;
		padding: 0.45rem 0.9rem;
		border-radius: 999px;
		cursor: pointer;
		box-shadow: 0 12px 20px rgba(37, 99, 235, 0.2);
	}

	.preset-card__actions button[disabled] {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.mask-card {
		border: 1px solid rgba(148, 163, 184, 0.25);
		border-radius: 14px;
		padding: 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		background: rgba(248, 250, 252, 0.9);
		box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
	}

	.mask-card__header h5 {
		margin: 0;
		font-size: 0.9rem;
		color: #0f172a;
	}

	.mask-card__header p {
		margin: 0.2rem 0 0;
		font-size: 0.75rem;
		color: #64748b;
		line-height: 1.4;
	}

	.mask-card__grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.75rem;
	}

	.mask-card__grid label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.mask-card__grid input,
	.mask-card__grid select {
		width: 100%;
		padding: 0.5rem 0.7rem;
		border-radius: 8px;
		border: 1px solid rgba(148, 163, 184, 0.35);
		background: white;
		font-size: 0.82rem;
	}

	.mask-card__grid input:focus,
	.mask-card__grid select:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow:
			0 0 0 1px rgba(37, 99, 235, 0.3),
			0 10px 20px rgba(37, 99, 235, 0.12);
	}

	.mask-card__animate {
		grid-column: 1 / -1;
	}

	.mask-card__animate span {
		font-size: 0.8rem;
	}

	.mask-card__animate input {
		width: 16px;
		height: 16px;
		margin-top: 0.2rem;
	}

	.preset-library__empty {
		grid-column: 1 / -1;
		margin: 0;
		padding: 0.5rem 0;
		text-align: center;
		color: #64748b;
		font-size: 0.8rem;
	}

	.input-field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	label span {
		font-weight: 600;
		font-size: 0.8rem;
		color: #0f172a;
	}

	input[type='text'],
	input[type='number'],
	select {
		width: 100%;
		padding: 0.55rem 0.7rem;
		border-radius: 8px;
		border: 1px solid rgba(148, 163, 184, 0.35);
		background: rgba(248, 250, 252, 0.85);
		color: #0f172a;
		font-size: 0.82rem;
	}

	input[type='text']:focus,
	input[type='number']:focus,
	select:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow:
			0 0 0 1px rgba(37, 99, 235, 0.3),
			0 10px 20px rgba(37, 99, 235, 0.12);
		background: white;
	}

	.empty {
		padding: 1rem;
		border: 1px dashed rgba(148, 163, 184, 0.6);
		border-radius: 14px;
		color: #475569;
		background: rgba(248, 250, 252, 0.6);
		font-size: 0.85rem;
	}

	.animation-card {
		border-radius: 18px;
		border: 1px solid rgba(148, 163, 184, 0.25);
		background: rgba(255, 255, 255, 0.92);
		box-shadow: 0 14px 28px rgba(15, 23, 42, 0.12);
		padding: 1rem 1.1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.animation-card header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.animation-card .summary {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 0.75rem;
		flex: 1;
	}

	.animation-card .summary label {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.animation-card .actions {
		display: inline-flex;
		gap: 0.35rem;
	}

	.animation-card .actions button {
		width: 28px;
		height: 28px;
		border-radius: 8px;
		border: 1px solid rgba(148, 163, 184, 0.35);
		background: white;
		color: #0f172a;
		cursor: pointer;
		font-size: 0.8rem;
		transition: background 0.2s ease;
	}

	.animation-card .actions button:hover {
		background: rgba(37, 99, 235, 0.15);
	}

	.animation-card .actions button.danger {
		border-color: rgba(239, 68, 68, 0.4);
		color: #b91c1c;
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
	}

	.row label {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		min-width: 160px;
	}

	.row.timing label {
		min-width: 130px;
	}

	.inline-checkbox {
		display: flex;
		align-items: flex-start;
		gap: 0.45rem;
		padding-top: 1.1rem;
		font-size: 0.8rem;
	}

	.inline-checkbox input {
		width: 16px;
		height: 16px;
		margin-top: 0.2rem;
	}

	.inline-checkbox span {
		line-height: 1.4;
	}

	details.advanced {
		border-top: 1px dashed rgba(148, 163, 184, 0.4);
		padding-top: 0.75rem;
	}

	details.advanced summary {
		cursor: pointer;
		font-weight: 600;
		color: #2563eb;
	}

	details.advanced summary:hover {
		text-decoration: underline;
	}

	.footer {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.add {
		align-self: flex-start;
		border: none;
		background: linear-gradient(135deg, #2563eb, #3b82f6);
		color: white;
		padding: 0.55rem 1.1rem;
		border-radius: 999px;
		font-weight: 600;
		cursor: pointer;
		box-shadow: 0 12px 24px rgba(37, 99, 235, 0.25);
	}

	.add:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.status {
		font-size: 0.75rem;
		color: #1d4ed8;
	}

	.status.muted {
		color: #64748b;
	}
</style>
