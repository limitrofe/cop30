// src/lib/stores/storyStore.js
import { writable, derived } from 'svelte/store';

// Store principal das stories
export const stories = writable([]);
export const currentStory = writable(null);
export const isLoading = writable(false);
export const error = writable(null);

// Store de configurações globais
export const storyConfig = writable({
	theme: 'default',
	readingProgress: true,
	autoSave: true,
	analytics: true
});

// Store derivada para metadados da story atual
export const currentStoryMeta = derived(currentStory, ($currentStory) => {
	if (!$currentStory) return null;

	return {
		totalComponents: $currentStory.paragraphs?.length || 0,
		estimatedReadTime: calculateReadTime($currentStory),
		hasVideo: hasComponentType($currentStory, [
			'video',
			'globoplayer',
			'globoplayer-carousel',
			'globoplay-carousel',
			'globoplayer-grid-slider',
			'globoplay-grid-slider'
		]),
		hasInteractive: hasComponentType($currentStory, ['before-after', 'scrolly', 'parallax']),
		wordCount: calculateWordCount($currentStory)
	};
});

// Funções auxiliares
function calculateReadTime(story) {
	const wordsPerMinute = 200;
	const words = calculateWordCount(story);
	return Math.ceil(words / wordsPerMinute);
}

function calculateWordCount(story) {
	let words = 0;

	// Título e subtítulo
	if (story.title) words += story.title.split(' ').length;
	if (story.subtitle) words += story.subtitle.split(' ').length;
	if (story.intro?.text) words += story.intro.text.split(' ').length;

	// Parágrafos
	story.paragraphs?.forEach((p) => {
		if (p.text) {
			const cleanText = p.text.replace(/<[^>]*>/g, '');
			words += cleanText.split(' ').length;
		}
	});

	return words;
}

function hasComponentType(story, types) {
	return story.paragraphs?.some((p) => types.includes(p.type?.toLowerCase())) || false;
}

// Actions do store
export const storyActions = {
	async loadStory(slug) {
		isLoading.set(true);
		error.set(null);

		try {
			const response = await fetch(`/data/${slug}.json`);
			if (!response.ok) throw new Error('Story não encontrada');

			const data = await response.json();
			currentStory.set(data);

			// Adiciona à lista se ainda não estiver
			stories.update((list) => {
				const exists = list.find((s) => s.slug === data.slug);
				if (!exists) {
					return [
						...list,
						{
							slug: data.slug,
							title: data.title,
							author: data.author,
							date: data.date,
							theme: data.theme
						}
					];
				}
				return list;
			});
		} catch (err) {
			error.set(err.message);
		} finally {
			isLoading.set(false);
		}
	},

	async loadStoriesList() {
		try {
			// Aqui você pode implementar um endpoint que lista todas as stories
			// ou manter uma lista manual
			const storyList = [
				{ slug: 'showcase-completo-do-sistema-de-storytelling-visua', title: 'Showcase Completo' }
				// Adicione outras stories aqui
			];
			stories.set(storyList);
		} catch (err) {
			error.set('Erro ao carregar lista de stories');
		}
	},

	setTheme(theme) {
		storyConfig.update((config) => ({ ...config, theme }));
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('story-theme', theme);
	},

	toggleReadingProgress() {
		storyConfig.update((config) => ({
			...config,
			readingProgress: !config.readingProgress
		}));
	}
};
