import { readFile } from 'node:fs/promises';
import path from 'node:path';

const STORY_PATH = path.resolve('static/data/story.json');
const FALLBACK_PATHS = [
	path.resolve('static/data/bolsonaro-condenado.json'),
	path.resolve('static/data/o-julgamento.json')
];

export const prerender = true;

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	const candidates = [STORY_PATH, ...FALLBACK_PATHS];

	for (const candidate of candidates) {
		try {
			const file = await readFile(candidate, 'utf-8');
			const story = JSON.parse(file);
			return {
				story,
				source: candidate
			};
		} catch (error) {
			if (error.code !== 'ENOENT') {
				console.error(`Falha ao ler ${candidate}:`, error);
			}
		}
	}

	return {
		story: null,
		source: null
	};
}
