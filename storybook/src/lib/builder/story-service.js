import { storyStore } from './stores/storyStore.js';

export async function loadStoryFromServer() {
	try {
		const response = await fetch('/api/story');
		if (!response.ok) {
			return null;
		}
		const data = await response.json();
		storyStore.setStory(data);
		return data;
	} catch (error) {
		console.warn('Não foi possível carregar o story.json atual.', error);
		return null;
	}
}

export async function saveStoryToServer() {
	const payload = storyStore.export();
	const response = await fetch('/api/story', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload, null, 2)
	});

	if (!response.ok) {
		const message = await response.text();
		throw new Error(message || 'Falha ao salvar arquivo');
	}

	return response.json();
}

export function exportStoryFile() {
	const payload = storyStore.export();
	const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = `story-${payload.slug || 'builder'}.json`;
	anchor.click();
	URL.revokeObjectURL(url);
}
