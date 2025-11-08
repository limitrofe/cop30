import { json } from '@sveltejs/kit';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const STORY_FILE = path.resolve('static/data/story.json');

export async function GET() {
	try {
		const contents = await readFile(STORY_FILE, 'utf-8');
		return json(JSON.parse(contents));
	} catch (error) {
		if (error.code === 'ENOENT') {
			return json({ message: 'Nenhum story.json salvo ainda.' }, { status: 404 });
		}
		console.error('Erro ao ler story.json', error);
		return json({ message: 'Falha ao ler story.json' }, { status: 500 });
	}
}

export async function POST({ request }) {
	try {
		const payload = await request.json();
		await mkdir(path.dirname(STORY_FILE), { recursive: true });
		await writeFile(STORY_FILE, JSON.stringify(payload, null, 2));

		return json({ message: 'story.json atualizado com sucesso.' });
	} catch (error) {
		console.error('Erro ao salvar story.json', error);
		return json({ message: 'Não foi possível escrever story.json.' }, { status: 500 });
	}
}
