const DEFAULT_MOBILE_QUERY = '(max-width: 768px)';

let loadPromise = null;

async function importGsap() {
	if (!loadPromise) {
		loadPromise = (async () => {
			try {
				const coreModule = await import('gsap');
				const gsap = coreModule?.gsap || coreModule?.default || coreModule;
				if (!gsap) {
					console.warn('[gsapAnimator] Não foi possível carregar o GSAP.');
					return { gsap: null, ScrollTrigger: null };
				}

				let ScrollTrigger = null;
				try {
					const pluginModule = await import('gsap/ScrollTrigger');
					ScrollTrigger = pluginModule?.ScrollTrigger || pluginModule?.default || null;
					if (ScrollTrigger && !gsap.core.globals().ScrollTrigger) {
						gsap.registerPlugin(ScrollTrigger);
					}
				} catch (pluginError) {
					if (import.meta.env?.DEV) {
						console.warn('[gsapAnimator] ScrollTrigger não disponível:', pluginError);
					}
				}

				return { gsap, ScrollTrigger };
			} catch (error) {
				console.error('[gsapAnimator] Falha ao importar GSAP:', error);
				return { gsap: null, ScrollTrigger: null };
			}
		})();
	}
	return loadPromise;
}

function ensureArray(value) {
	if (!value) return [];
	if (Array.isArray(value)) return value;
	return [value];
}

function tryParse(value) {
	if (typeof value !== 'string') return value;
	const trimmed = value.trim();
	if (!trimmed) return undefined;
	try {
		return JSON.parse(trimmed);
	} catch (_error) {
		if (import.meta.env?.DEV) {
			console.warn('[gsapAnimator] Não foi possível fazer parse do JSON:', value);
		}
		return undefined;
	}
}

function resolveTargets(root, targets) {
	if (!targets) return [];

	const set = new Set();
	for (const target of ensureArray(targets)) {
		if (!target) continue;
		if (typeof target === 'string') {
			for (const element of root.querySelectorAll(target.trim())) {
				set.add(element);
			}
		} else if (target instanceof Element) {
			set.add(target);
		} else if (typeof target === 'function') {
			try {
				const result = target(root);
				for (const element of ensureArray(result)) {
					if (element instanceof Element) set.add(element);
				}
			} catch (error) {
				console.warn('[gsapAnimator] Função de target lançou erro:', error);
			}
		}
	}
	return Array.from(set);
}

function mergeConfigs(...configs) {
	const result = {};
	for (const config of configs) {
		if (!config || typeof config !== 'object') continue;
		for (const [key, value] of Object.entries(config)) {
			if (value === undefined) continue;
			if (
				value &&
				typeof value === 'object' &&
				!Array.isArray(value) &&
				typeof result[key] === 'object' &&
				!Array.isArray(result[key])
			) {
				result[key] = mergeConfigs(result[key], value);
			} else {
				result[key] = value;
			}
		}
	}
	return result;
}

function normalizeAnimationEntry(entry = {}) {
	if (typeof entry === 'string') {
		const parsed = tryParse(entry);
		if (parsed && typeof parsed === 'object') {
			return normalizeAnimationEntry(parsed);
		}
		return {};
	}

	const clones = JSON.parse(JSON.stringify(entry));
	clones.once = entry.once ?? false;
	clones.immediate = entry.immediate ?? false;
	const autoScrollValue = entry.autoScroll ?? entry.defer;
	clones.autoScroll = autoScrollValue !== undefined ? Boolean(autoScrollValue) : true;
	const autoScrollTriggerParsed = tryParse(entry.autoScrollTrigger);
	if (autoScrollTriggerParsed && typeof autoScrollTriggerParsed === 'object') {
		clones.autoScrollTrigger = autoScrollTriggerParsed;
	} else if (entry.autoScrollTrigger && typeof entry.autoScrollTrigger === 'object') {
		clones.autoScrollTrigger = JSON.parse(JSON.stringify(entry.autoScrollTrigger));
	}
	return clones;
}

function normalizeOptions(options = {}) {
	const parsed =
		typeof options === 'string'
			? tryParse(options) || {}
			: Array.isArray(options)
				? { animations: options }
				: { ...options };

	const animations = ensureArray(parsed.animations).map(normalizeAnimationEntry).filter(Boolean);
	const fallback = parsed.defaultAnimation
		? normalizeAnimationEntry(parsed.defaultAnimation)
		: null;

	return {
		enabled: parsed.enabled !== undefined ? Boolean(parsed.enabled) : true,
		animations,
		defaultAnimation: fallback,
		mobileQuery: parsed.mobileQuery || DEFAULT_MOBILE_QUERY,
		scope: parsed.scope,
		autoRefresh: parsed.autoRefresh ?? true,
		onReady: typeof parsed.onReady === 'function' ? parsed.onReady : null
	};
}

function resolveViewportConfig(entry, isMobile) {
	const base = entry || {};
	const viewportConfig = isMobile ? (base.mobile ?? {}) : (base.desktop ?? {});
	return mergeConfigs(base, viewportConfig);
}

function resolveScrollTrigger(config, root, ScrollTrigger) {
	if (!config || !ScrollTrigger) return null;

	const resolved = { ...config };

	if (config.trigger) {
		const triggerElement =
			typeof config.trigger === 'string' ? root.querySelector(config.trigger) : config.trigger;
		if (triggerElement instanceof Element) {
			resolved.trigger = triggerElement;
		} else {
			delete resolved.trigger;
		}
	}

	if (config.start === undefined && config.offset) {
		const offset = typeof config.offset === 'number' ? `${config.offset}px` : String(config.offset);
		resolved.start = `top ${offset}`;
	}

	return resolved;
}

function pickFirstElement(targets) {
	if (!targets) return null;
	if (targets instanceof Element) return targets;
	if (Array.isArray(targets)) {
		for (const item of targets) {
			if (item instanceof Element) return item;
		}
	}
	return null;
}

function createDefaultScrollTrigger({ targets, once, customConfig }) {
	const triggerElement = pickFirstElement(targets);
	if (!triggerElement) return null;
	const base = {
		trigger: triggerElement,
		start: 'top 85%',
		end: 'bottom 65%',
		toggleActions: once ? 'play none none none' : 'play none none reverse',
		once: once ?? true,
		invalidateOnRefresh: true
	};
	return mergeConfigs(base, customConfig || {});
}

function attachIntersectionPlayback({ animation, targets, once, config }) {
	if (!animation) return;
	if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
		animation.play?.();
		return;
	}
	const element = pickFirstElement(targets);
	if (!element) {
		animation.play?.();
		return;
	}
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					animation.play?.();
					if (once !== false) {
						observer.disconnect();
					}
					break;
				}
			}
		},
		{
			rootMargin: config?.rootMargin || '0px 0px -15%'
		}
	);
	observer.observe(element);
	const originalKill = animation.kill ? animation.kill.bind(animation) : null;
	animation.kill = (...args) => {
		observer.disconnect();
		if (originalKill) originalKill(...args);
	};
}

function applyAnimation({ gsap, ScrollTrigger, node, entry, isMobile }) {
	if (!gsap || !entry) return null;

	const resolved = resolveViewportConfig(entry, isMobile);
	const targets = resolveTargets(node, resolved.targets || resolved.selector);

	if (!targets.length && !resolved.timeline?.steps?.length) return null;

	const baseDuration = resolved.duration;
	const baseDelay = resolved.delay;
	const baseEase = resolved.ease;
	const baseStagger = resolved.stagger;
	const autoScrollEnabled = resolved.autoScroll !== false;
	const autoScrollConfig =
		resolved.autoScrollTrigger && typeof resolved.autoScrollTrigger === 'object'
			? resolved.autoScrollTrigger
			: null;
	const shouldDefer = autoScrollEnabled && !resolved.immediate;

	const maskConfig = resolved.mask && typeof resolved.mask === 'object' ? resolved.mask : null;
	const maskProperty = maskConfig?.property;
	const maskValue =
		typeof maskConfig?.value === 'string' && maskConfig.value.trim()
			? maskConfig.value.trim()
			: null;
	const maskAnimate = Boolean(maskConfig?.animate);
	let maskTargets = targets;
	if (maskConfig?.targets) {
		const resolvedMaskTargets = resolveTargets(node, maskConfig.targets);
		if (resolvedMaskTargets.length) {
			maskTargets = resolvedMaskTargets;
		}
	}
	const staticMasks = [];
	let timelineMaskStep = null;

	const queueStaticMask = () => {
		if (maskProperty && maskValue && maskTargets.length) {
			staticMasks.push({ targets: maskTargets, property: maskProperty, value: maskValue });
		}
	};

	const applyStaticMasks = () => {
		if (!staticMasks.length) return;
		for (const entry of staticMasks) {
			gsap.set(entry.targets, { [entry.property]: entry.value });
		}
	};

	if (resolved.timeline && Array.isArray(resolved.timeline.steps)) {
		const timelineOptions = mergeConfigs({ defaults: {} }, resolved.timeline.options || {}, {
			defaults: {
				duration: baseDuration,
				delay: baseDelay,
				ease: baseEase,
				stagger: baseStagger
			}
		});

		const userTimelineTrigger = resolved.scrollTrigger || resolved.timeline.scrollTrigger;
		if (userTimelineTrigger) {
			const triggerConfig = resolveScrollTrigger(userTimelineTrigger, node, ScrollTrigger);
			if (triggerConfig) {
				timelineOptions.scrollTrigger = triggerConfig;
			}
		}

		const timelineTargets = targets.length
			? targets
			: resolveTargets(node, resolved.timeline.targets);
		if (!timelineTargets.length) return null;

		if (maskProperty && maskValue && maskTargets.length) {
			if (maskAnimate) {
				const maskFrom =
					maskConfig?.from !== undefined
						? maskConfig.from
						: maskConfig?.to !== undefined
							? maskConfig.to
							: maskValue;
				const maskTo = maskConfig?.to !== undefined ? maskConfig.to : maskValue;
				const maskDuration = maskConfig?.duration ?? baseDuration ?? 0.6;
				const maskEase = maskConfig?.ease ?? baseEase ?? 'power3.out';
				const maskPosition = maskConfig?.position ?? '0';
				timelineMaskStep = {
					targets: maskTargets,
					property: maskProperty,
					from: maskFrom,
					to: maskTo,
					duration: maskDuration,
					ease: maskEase,
					position: maskPosition
				};
			} else {
				queueStaticMask();
			}
		}

		const shouldAttachAutoScroll =
			shouldDefer && !userTimelineTrigger && ScrollTrigger && timelineTargets.length;
		if (shouldAttachAutoScroll) {
			const autoTrigger = createDefaultScrollTrigger({
				targets: timelineTargets,
				once: resolved.once,
				customConfig: autoScrollConfig
			});
			if (autoTrigger) {
				timelineOptions.scrollTrigger = autoTrigger;
			}
		}

		const useObserver =
			shouldDefer && !ScrollTrigger && !userTimelineTrigger && timelineTargets.length;
		if (useObserver) {
			timelineOptions.paused = true;
		}

		const timeline = gsap.timeline(timelineOptions);
		for (const step of resolved.timeline.steps) {
			const stepTargets = resolveTargets(node, step.targets) || timelineTargets;
			if (!stepTargets.length) continue;
			const fromVars = mergeConfigs(resolved.from, step.from);
			const toVars = mergeConfigs(resolved.to, step.to);
			if (Object.keys(fromVars).length && Object.keys(toVars).length) {
				timeline.fromTo(stepTargets, fromVars, toVars, step.position);
			} else if (Object.keys(toVars).length) {
				timeline.to(stepTargets, toVars, step.position);
			} else if (Object.keys(fromVars).length) {
				timeline.from(stepTargets, fromVars, step.position);
			}
		}

		if (timelineMaskStep) {
			const { targets: maskEls, property, from, to, duration, ease, position } = timelineMaskStep;
			if (maskEls?.length && property && to !== undefined) {
				timeline.fromTo(
					maskEls,
					{ [property]: from ?? to },
					{ [property]: to, duration, ease },
					position ?? '0'
				);
			}
		}

		if (useObserver) {
			attachIntersectionPlayback({
				animation: timeline,
				targets: timelineTargets,
				once: resolved.once,
				config: autoScrollConfig
			});
		}

		applyStaticMasks();
		return timeline;
	}

	const fromVars = mergeConfigs(resolved.from);
	const rawToVars = mergeConfigs(resolved.to);
	const toVars = mergeConfigs(rawToVars, {
		duration: baseDuration,
		delay: baseDelay,
		ease: baseEase,
		stagger: baseStagger
	});
	const hasFromProps = Object.keys(fromVars).length > 0;
	const hasToProps = Object.keys(rawToVars).length > 0;

	if (maskProperty && maskValue && maskTargets.length) {
		if (maskAnimate) {
			const maskFrom =
				maskConfig?.from !== undefined
					? maskConfig.from
					: maskConfig?.to !== undefined
						? maskConfig.to
						: maskValue;
			const maskTo = maskConfig?.to !== undefined ? maskConfig.to : maskValue;
			if (fromVars[maskProperty] === undefined && maskFrom !== undefined) {
				fromVars[maskProperty] = maskFrom;
			}
			if (maskTo !== undefined) {
				toVars[maskProperty] = maskTo;
			}
		} else {
			queueStaticMask();
		}
	}

	if (!hasFromProps && !hasToProps) {
		applyStaticMasks();
		return null;
	}

	if (resolved.scrollTrigger) {
		const triggerConfig = resolveScrollTrigger(resolved.scrollTrigger, node, ScrollTrigger);
		if (triggerConfig) {
			toVars.scrollTrigger = triggerConfig;
			if (resolved.once) {
				triggerConfig.once = true;
			}
		}
	}

	const shouldAttachAutoScroll =
		shouldDefer && !resolved.scrollTrigger && ScrollTrigger && targets.length;
	if (shouldAttachAutoScroll) {
		const autoTrigger = createDefaultScrollTrigger({
			targets,
			once: resolved.once,
			customConfig: autoScrollConfig
		});
		if (autoTrigger) {
			toVars.scrollTrigger = autoTrigger;
		}
	}

	const useObserver = shouldDefer && !ScrollTrigger && !resolved.scrollTrigger && targets.length;
	if (useObserver) {
		if (toVars.paused === undefined) {
			toVars.paused = true;
		}
		if (hasFromProps && !hasToProps && fromVars.paused === undefined) {
			fromVars.paused = true;
		}
	}

	const usesScrollTrigger = Boolean(toVars.scrollTrigger);
	if (usesScrollTrigger && hasFromProps) {
		if (hasToProps) {
			if (toVars.immediateRender === undefined) {
				toVars.immediateRender = true;
			}
		} else if (fromVars.immediateRender === undefined) {
			fromVars.immediateRender = true;
		}
	}

	if (resolved.once && !resolved.scrollTrigger) {
		toVars.onComplete = () => {
			if (toVars.scrollTrigger?.kill) {
				toVars.scrollTrigger.kill();
			}
		};
	}

	let animationInstance;
	if (hasFromProps && hasToProps) {
		animationInstance = gsap.fromTo(targets, fromVars, toVars);
	} else if (hasFromProps) {
		animationInstance = gsap.from(targets, fromVars);
	} else {
		animationInstance = gsap.to(targets, toVars);
	}

	applyStaticMasks();

	if (useObserver && animationInstance) {
		attachIntersectionPlayback({
			animation: animationInstance,
			targets,
			once: resolved.once,
			config: autoScrollConfig
		});
	}

	return animationInstance;
}

function buildAnimations({ gsap, ScrollTrigger, node, options, isMobile }) {
	const animations = [];

	for (const entry of options.animations) {
		const instance = applyAnimation({ gsap, ScrollTrigger, node, entry, isMobile });
		if (instance) animations.push(instance);
	}

	if (!options.animations.length && options.defaultAnimation) {
		const instance = applyAnimation({
			gsap,
			ScrollTrigger,
			node,
			entry: options.defaultAnimation,
			isMobile
		});
		if (instance) animations.push(instance);
	}

	return animations;
}

function attachMediaListener(query, handler) {
	if (typeof window === 'undefined' || !query) return null;
	try {
		const mql = window.matchMedia(query);
		const listener = () => handler(mql.matches);
		if (typeof mql.addEventListener === 'function') {
			mql.addEventListener('change', listener);
		} else if (typeof mql.addListener === 'function') {
			mql.addListener(listener);
		}
		return {
			mql,
			detach: () => {
				if (typeof mql.removeEventListener === 'function') {
					mql.removeEventListener('change', listener);
				} else if (typeof mql.removeListener === 'function') {
					mql.removeListener(listener);
				}
			}
		};
	} catch (error) {
		console.warn('[gsapAnimator] Falha ao registrar mídia query:', error);
		return null;
	}
}

export function gsapAnimator(node, rawOptions = {}) {
	let options = normalizeOptions(rawOptions);
	let cleanupFns = [];
	let mediaHandle = null;
	let destroyed = false;

	async function setup(isMobileOverride) {
		cleanup();
		if (!options.enabled || destroyed) return;

		const { gsap, ScrollTrigger } = await importGsap();
		if (!gsap) return;

		const isMobile =
			typeof isMobileOverride === 'boolean'
				? isMobileOverride
				: (mediaHandle?.mql?.matches ?? false);

		const context = gsap.context(() => {
			const instances = buildAnimations({
				gsap,
				ScrollTrigger,
				node,
				options,
				isMobile
			});
			cleanupFns.push(() => {
				for (const instance of instances) {
					if (instance?.kill) instance.kill();
				}
			});
		}, node);

		cleanupFns.push(() => context.revert());

		if (options.onReady) {
			options.onReady({ gsap, ScrollTrigger });
		}

		if (ScrollTrigger) {
			ScrollTrigger.refresh();
		}
	}

	function cleanup() {
		while (cleanupFns.length) {
			try {
				const fn = cleanupFns.pop();
				if (typeof fn === 'function') fn();
			} catch (error) {
				console.warn('[gsapAnimator] Erro ao limpar animação:', error);
			}
		}
	}

	function handleMediaChange(isMobile) {
		if (!options.autoRefresh) return;
		setup(isMobile);
	}

	async function initialize() {
		if (mediaHandle) {
			mediaHandle.detach();
			mediaHandle = null;
		}

		if (typeof window !== 'undefined') {
			mediaHandle = attachMediaListener(options.mobileQuery, handleMediaChange);
		}

		await setup(mediaHandle?.mql?.matches);
	}

	initialize();

	return {
		update(newOptions) {
			options = normalizeOptions(newOptions);
			initialize();
		},
		destroy() {
			destroyed = true;
			if (mediaHandle) {
				mediaHandle.detach();
				mediaHandle = null;
			}
			cleanup();
		}
	};
}

export function createGsapAnimatorOptions(rawConfig = {}) {
	const options = normalizeOptions(rawConfig);
	return options;
}
