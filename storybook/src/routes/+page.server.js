import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Papa from 'papaparse';

const STORY_PATH = path.resolve('static/data/story.json');
const FALLBACK_PATHS = [
	path.resolve('static/data/bolsonaro-condenado.json'),
	path.resolve('static/data/o-julgamento.json')
];
const PARTICIPANTS_CSV_PATH = path.resolve('static/data/dados_cop_30.csv');

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

async function loadParticipants() {
	try {
		const csv = await readFile(PARTICIPANTS_CSV_PATH, 'utf-8');
		const parsed = Papa.parse(csv, {
			header: true,
			skipEmptyLines: true,
			delimiter: ';',
			transformHeader: (header, index) => normalizeHeader(header, index)
		});

		return parsed.data
			.filter((row) => row?.nome_e_area_de_atuacao_ou_pesquisa)
			.map((row, index) => {
				const get = (key) => normalizeValue(row?.[key]);

				return {
					id: `participant-${index}`,
					name: get('nome_e_area_de_atuacao_ou_pesquisa'),
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
					optimismScore: parseNumber(
						get(
							'em_uma_escala_de_0_a_10_qual_e_o_seu_nivel_de_otimismo_em_relacao_ao_compromisso_dos_paises_mais_desenvolvidos_com_acoes_para_mitigar_o_aquecimento_global'
						)
					),
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
			});
	} catch (error) {
		if (error.code !== 'ENOENT') {
			console.error('Falha ao carregar dados dos participantes:', error);
		}
		return [];
	}
}

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	const participants = await loadParticipants();
	const candidates = [STORY_PATH, ...FALLBACK_PATHS];

	for (const candidate of candidates) {
		try {
			const file = await readFile(candidate, 'utf-8');
			const story = JSON.parse(file);
			return {
				story,
				source: candidate,
				participants
			};
		} catch (error) {
			if (error.code !== 'ENOENT') {
				console.error(`Falha ao ler ${candidate}:`, error);
			}
		}
	}

	return {
		story: null,
		source: null,
		participants
	};
}
