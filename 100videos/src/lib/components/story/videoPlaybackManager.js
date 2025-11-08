const registry = new Map();
let activeId = null;

function safePause(controls, context) {
	if (!controls || typeof controls.pause !== 'function') {
		return;
	}
	try {
		controls.pause(context);
	} catch (error) {
		console.warn('videoPlaybackManager: failed to pause video', error);
	}
}

export function registerVideo(id, controls) {
	if (!id) {
		throw new Error('videoPlaybackManager: registerVideo requires a valid id');
	}

	registry.set(id, controls || null);

	return () => unregisterVideo(id);
}

export function unregisterVideo(id) {
	if (!id) return;

	const wasActive = activeId === id;
	registry.delete(id);

	if (wasActive) {
		activeId = null;
	}
}

export function activateVideo(id, context) {
	if (!id) return;
	if (activeId === id) return;

	const previousId = activeId;
	activeId = id;

	if (previousId && previousId !== id) {
		const previousControls = registry.get(previousId);
		safePause(previousControls, { reason: 'another-video-activated', nextId: id, ...context });
	}
}

export function deactivateVideo(id) {
	if (activeId === id) {
		activeId = null;
	}
}

export function getActiveVideoId() {
	return activeId;
}
