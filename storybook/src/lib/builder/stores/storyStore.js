import { writable, derived } from 'svelte/store';
import {
	normalizeStory,
	createBlockInstance,
	setByPath,
	sanitizeStoryForExport
} from '../utils.js';

const createStoryStore = () => {
	const { subscribe, update, set } = writable(normalizeStory());

	return {
		subscribe,
		setStory: (data) => set(normalizeStory(data)),
		reset: () => set(normalizeStory()),
		addBlock: (type, position = null) => {
			const block = createBlockInstance(type);
			update((story) => {
				const paragraphs = [...story.paragraphs];
				if (position === null || position >= paragraphs.length) {
					paragraphs.push(block);
				} else {
					paragraphs.splice(position, 0, block);
				}
				return { ...story, paragraphs };
			});
			return block;
		},
		duplicateBlock: (id) => {
			let newBlock;
			update((story) => {
				const index = story.paragraphs.findIndex((paragraph) => paragraph.__id === id);
				if (index === -1) return story;
				const original = story.paragraphs[index];
				newBlock = createBlockInstance(original.type || original.kind || 'block');
				newBlock = { ...newBlock, ...structuredClone(original), __id: newBlock.__id };
				const paragraphs = [...story.paragraphs];
				paragraphs.splice(index + 1, 0, newBlock);
				return { ...story, paragraphs };
			});
			return newBlock;
		},
		removeBlock: (id) => {
			update((story) => ({
				...story,
				paragraphs: story.paragraphs.filter((paragraph) => paragraph.__id !== id)
			}));
		},
		moveBlock: (id, targetIndex) => {
			update((story) => {
				const paragraphs = [...story.paragraphs];
				const index = paragraphs.findIndex((paragraph) => paragraph.__id === id);
				if (index === -1) {
					return story;
				}
				const [block] = paragraphs.splice(index, 1);
				const normalizedIndex = Math.max(0, Math.min(targetIndex, paragraphs.length));
				paragraphs.splice(normalizedIndex, 0, block);
				return { ...story, paragraphs };
			});
		},
		updateBlockField: (id, path, value) => {
			update((story) => {
				const paragraphs = story.paragraphs.map((paragraph) => {
					if (paragraph.__id !== id) return paragraph;
					const updated = structuredClone(paragraph);
					setByPath(updated, path, value);
					return updated;
				});
				return { ...story, paragraphs };
			});
		},
		replaceBlock: (id, newData) => {
			update((story) => ({
				...story,
				paragraphs: story.paragraphs.map((paragraph) =>
					paragraph.__id === id ? { ...newData, __id: id } : paragraph
				)
			}));
		},
		updateMetadata: (path, value) => {
			update((story) => {
				const updated = structuredClone(story);
				setByPath(updated, path, value);
				return updated;
			});
		},
		export: () => {
			let snapshot;
			const unsubscribe = subscribe((value) => {
				snapshot = sanitizeStoryForExport(value);
			});
			unsubscribe();
			return snapshot;
		}
	};
};

export const storyStore = createStoryStore();
export const selectedBlockId = writable(null);

export const selectedBlock = derived(
	[storyStore, selectedBlockId],
	([$story, $selectedBlockId]) =>
		$story.paragraphs.find((paragraph) => paragraph.__id === $selectedBlockId) || null
);

export const storyParagraphs = derived(storyStore, ($story) => $story.paragraphs);
export const storyMetadata = derived(storyStore, ($story) => ({ ...$story }));
