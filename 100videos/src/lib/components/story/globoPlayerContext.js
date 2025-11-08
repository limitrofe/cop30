import { browser } from '$app/environment';
import { getContext, setContext, hasContext } from 'svelte';

const CONTEXT_KEY = Symbol.for('g1:globoplayer-loader');
let globalLoaderPromise = null;

async function loadScriptOnce() {
	if (!browser) {
		return null;
	}
	const module = await import('./globoPlayerScriptLoader.js');
	return module.ensureGloboPlayerScript();
}

export function getGlobalGloboPlayerLoader() {
	if (globalLoaderPromise) {
		return globalLoaderPromise;
	}
	globalLoaderPromise = loadScriptOnce();
	return globalLoaderPromise;
}

export function provideGloboPlayerLoader() {
	const loader = getGlobalGloboPlayerLoader();
	setContext(CONTEXT_KEY, loader);
	return loader;
}

export function useGloboPlayerLoader() {
	if (hasContext(CONTEXT_KEY)) {
		return getContext(CONTEXT_KEY);
	}
	return getGlobalGloboPlayerLoader();
}
