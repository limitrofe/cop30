import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Papa from 'papaparse';

const STORY_PATH = path.resolve('static/data/story.json');
const FALLBACK_PATHS = [
	path.resolve('static/data/bolsonaro-condenado.json'),
	path.resolve('static/data/o-julgamento.json')
];
const PARTICIPANTS_CSV_PATH = path.resolve('static/data/dados_cop_30.csv');
const OPTIMISM_PARTICIPANTS_CSV_PATH = path.resolve('static/data/otimismo-participantes.csv');

export const prerender = true;

function normalizeHeader(header = '', index = 0) {
	const clean = header
		.replace(/[\uFEFF]/g, '')
		.trim()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[\[\]\?]/g, '')
		.replace(/[^a-zA-Z0-9\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '_');

	return clean || `col_${index}`;
}

function normalizeValue(value) {
	if (value === undefined || value === null) return '';
	if (typeof value !== 'string') return value;
	return value.replace(/\s+$/g, '').trim();
}

function parseNumber(value) {
	if (value === undefined || value === null || value === '') return null;
	if (typeof value === 'number') return Number.isFinite(value) ? value : null;
	const cleaned = String(value).replace(',', '.').trim();
	const parsed = Number(cleaned);
	return Number.isFinite(parsed) ? parsed : null;
}

function normalizeNameKey(value) {
	if (!value) return null;
	const base = String(value)
		.split('(')[0]
		.split('/')[0]
		.split('|')[0]
		.split('–')[0]
		.split('—')[0]
		.split(' - ')[0]
		.trim();

	const segments = base
		.split(',')
		.map((segment) => segment.trim())
		.filter(Boolean);
	const primary = segments.length ? segments[0] : base;

	const cleaned = primary
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-zA-Z0-9\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase();

	if (!cleaned) return null;

	const tokens = cleaned
		.split(' ')
		.filter(Boolean)
		.filter((token) => token.length > 1);

	if (!tokens.length) return cleaned;

	const unique = [];
	for (const token of tokens) {
		if (!unique.includes(token)) unique.push(token);
	}

	return unique.join(' ');
}

const OPTIMISM_ALIAS_ENTRIES = [
	['Physics', 'Marcia Barboza'],
	['Atmospheric Science', 'Brian Soden'],
	['Earth System Sciences', 'Marina Hirota'],
	['Navegação polar', 'Tamara Klink'],
	[
		'Meu nome é Cacique Raoni Metuktire. Sou uma liderança do povo Mebêngôkre (Kayapó)',
		'Cacique Raoni Metuktire'
	],
	['Jose A. Marengo. Climatology', 'Jose Marengo'],
	[
		'Regina R. Rodrigues (Pesquisadora e Professora de Oceanografia e Clima da UFSC',
		'Regina R. Rodrigues'
	],
	['William William Laurance.  Tropical ecology and environment.', 'William Laurance'],
	['Maria Fernanda Lemos. Adaptação Urbana para a Mudança Climática', 'Maria Fernanda Lemos'],
	['Jose A. Marengo. Climatology, disaster risk reduction', 'Jose Marengo'],
	[
		'Eduardo S Brondizio, Environmental Anthropology, common pool resources, human-environment interactions',
		'Eduardo Brondizio'
	],
	['Marcus Jorge Bottino. Meteorologia', 'Marcus Jorge Bottino'],
	['William Magnusson Ecologia', 'William Magnusson'],
	['Alok Peres Petrillo, produtor musical e DJ', 'Alok']
];

async function loadOptimismOverrides() {
	try {
		const csv = await readFile(OPTIMISM_PARTICIPANTS_CSV_PATH, 'utf-8');
		const parsed = Papa.parse(csv, {
			header: true,
			skipEmptyLines: true,
			delimiter: ','
		});

		const overrides = new Map();

		for (const row of parsed.data) {
			const rawName = normalizeValue(row?.Participante ?? row?.participante);
			const score = parseNumber(row?.Otimismo ?? row?.otimismo);
			if (!rawName || !Number.isFinite(score)) continue;
			const key = normalizeNameKey(rawName);
			if (!key) continue;
			overrides.set(key, {
				key,
				name: rawName,
				score
			});
		}

		return overrides;
	} catch (error) {
		if (error.code !== 'ENOENT') {
			console.error('Falha ao carregar dados de otimismo dos participantes:', error);
		}
		return new Map();
	}
}

function buildOptimismAliasMap(overrides) {
	const entries = OPTIMISM_ALIAS_ENTRIES.map(([source, target]) => {
		const sourceKey = normalizeNameKey(source);
		const targetKey = normalizeNameKey(target);
		if (!sourceKey || !targetKey) return null;
		if (!overrides.has(targetKey)) return null;
		return [sourceKey, targetKey];
	}).filter(Boolean);

	return new Map(entries);
}

function resolveOptimismOverride(rawName, overrides, aliasMap) {
	const key = normalizeNameKey(rawName);
	if (!key) return null;
	if (overrides.has(key)) {
		return overrides.get(key);
	}
	const aliasTarget = aliasMap.get(key);
	if (aliasTarget && overrides.has(aliasTarget)) {
		return overrides.get(aliasTarget);
	}
	return null;
}

async function loadParticipants() {
	try {
		const csv = await readFile(PARTICIPANTS_CSV_PATH, 'utf-8');
		const optimismOverrides = await loadOptimismOverrides();
		const optimismAliasMap = buildOptimismAliasMap(optimismOverrides);

		const parsed = Papa.parse(csv, {
			header: true,
			skipEmptyLines: true,
			delimiter: ';',
			transformHeader: (header, index) => normalizeHeader(header, index)
		});
		const usedOptimismKeys = new Set();

		return parsed.data
			.filter((row) => row?.nome_e_area_de_atuacao_ou_pesquisa)
			.map((row, index) => {
				const get = (key) => normalizeValue(row?.[key]);
				const rawName = get('nome_e_area_de_atuacao_ou_pesquisa');
				const override = resolveOptimismOverride(rawName, optimismOverrides, optimismAliasMap);
				const overrideScore = override ? override.score : null;
				const overrideName = override ? override.name : null;
				const overrideKey = override ? override.key : null;

				let assignedScore = Number.isFinite(overrideScore)
					? overrideScore
					: parseNumber(
							get(
								'em_uma_escala_de_0_a_10_qual_e_o_seu_nivel_de_otimismo_em_relacao_ao_compromisso_dos_paises_mais_desenvolvidos_com_acoes_para_mitigar_o_aquecimento_global'
							)
						);

				if (overrideKey) {
					if (usedOptimismKeys.has(overrideKey)) {
						return null;
					} else {
						usedOptimismKeys.add(overrideKey);
					}
				}

				if (!Number.isFinite(assignedScore)) {
					assignedScore = null;
				}

				return {
					id: `participant-${index}`,
					name: overrideName || rawName,
					location: get('localizacao'),
					area: get('area_de_atuacao'),
					photo: get('fotos_tratadas') || get('link_de_foto'),
					emergencyFocus: get(
						'se_voce_pudesse_apertar_um_botao_de_emergencia_para_o_planeta_em_qual_area_ele_deveria_agir'
					),
					challenge2050: get(
						'na_sua_opiniao_qual_sera_o_maior_desafio_ambiental_para_o_planeta_em_2050'
					),
					stillTime: get(
						'voce_acha_que_ainda_ha_tempo_para_reverter_os_piores_impactos_da_crise_climatica'
					),
					optimismScore: assignedScore,
					optimismReason: get(
						'neste_campo_explique_por_que_voce_se_sente_mais_ou_menos_otimista_em_relacao_a_essa_questao'
					),
					extraMessage: get(
						'ha_algo_que_voce_gostaria_de_acrescentar_as_suas_respostas_como_uma_mensagem_para_os_nossos_leitores'
					),
					email: get('endereco_de_e_mail'),
					timestamp: get('carimbo_de_data_hora'),
					raw: row
				};
			})
			.filter(Boolean);
	} catch (error) {
		if (error.code !== 'ENOENT') {
			console.error('Falha ao carregar dados dos participantes:', error);
		}
		return [];
	}
}

async function loadStory() {
	const candidates = [STORY_PATH, ...FALLBACK_PATHS];

	for (const candidate of candidates) {
		try {
			const file = await readFile(candidate, 'utf-8');
			const story = JSON.parse(file);
			return { story, source: candidate };
		} catch (error) {
			if (error.code !== 'ENOENT') {
				console.error(`Falha ao ler ${candidate}:`, error);
			}
		}
	}

	return { story: null, source: null };
}

function isVideoSheetParagraph(paragraph) {
	if (!paragraph || typeof paragraph.type !== 'string') return false;
	return paragraph.type.toLowerCase().includes('video-sheet');
}

async function hydrateInitialData(story) {
	if (!story?.paragraphs) return;
	await Promise.all(
		story.paragraphs.map(async (paragraph) => {
			if (!isVideoSheetParagraph(paragraph)) return;
			if (paragraph.initialData) return;
			const sheetUrl = paragraph.sheetUrl || paragraph.sheetURL;
			if (!sheetUrl || /^https?:/i.test(sheetUrl)) return;
			const relative = sheetUrl.replace(/^\//, '');
			const candidate = path.resolve('static', relative);
			try {
				const file = await readFile(candidate, 'utf-8');
				paragraph.initialData = JSON.parse(file);
			} catch (error) {
				if (error.code !== 'ENOENT') {
					console.warn(`Falha ao carregar initialData para ${sheetUrl}:`, error);
				}
			}
		})
	);
}

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	const { story, source } = await loadStory();
	const wantsParticipants = story ? story?.features?.participants !== false : false;
	const participants = wantsParticipants ? await loadParticipants() : [];
	if (story) {
		await hydrateInitialData(story);
	}

	return {
		story,
		source,
		participants
	};
}
