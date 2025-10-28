import Papa from 'papaparse';

const GOOGLE_SHEETS_ID_REGEX = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;

/**
 * Normaliza o header removendo acentos/caracteres especiais e usando snake_case.
 * Mantemos apenas letras, numeros e underscores.
 * @param {string} header
 * @returns {string}
 */
export function sanitizeHeader(header = '') {
	const base = String(header).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
	return base
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '') || 'coluna';
}

/**
	 * Extrai sheetId e gid de uma URL do Google Sheets.
	 * Aceita URLs dos modos visualizacao/edicao.
 * @param {string} url
 * @returns {{ sheetId: string | null, gid: string | null }}
 */
export function parseGoogleSheetUrl(url = '') {
	if (!url) {
		return { sheetId: null, gid: null };
	}

	const sheetMatch = url.match(GOOGLE_SHEETS_ID_REGEX);
	const sheetId = sheetMatch?.[1] ?? null;

	let gid = null;
	const gidMatch = url.match(/[?&#]gid=([0-9]+)/);
	if (gidMatch) {
		gid = gidMatch[1];
	}

	return { sheetId, gid };
}

/**
 * Monta a URL CSV do Google Sheets (endpoint gviz).
 * @param {{ sheetId: string, gid?: string, sheetName?: string, query?: string }} params
 * @returns {string}
 */
export function buildGoogleSheetCsvUrl({ sheetId, gid, sheetName, query } = {}) {
		if (!sheetId) {
			throw new Error('buildGoogleSheetCsvUrl: sheetId e obrigatorio.');
	}

	const url = new URL(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`);
	url.searchParams.set('tqx', 'out:csv');

	if (sheetName) {
		url.searchParams.set('sheet', sheetName);
	}

	if (gid) {
		url.searchParams.set('gid', gid);
	}

	if (query) {
		url.searchParams.set('tq', query);
	}

	return url.toString();
}

/**
 * Faz o fetch do Google Sheets e retorna linhas normalizadas.
 * @param {{
 * 	sheetUrl?: string,
 * 	sheetId?: string,
 * 	gid?: string,
 * 	sheetName?: string,
 * 	query?: string,
 * 	fetcher?: typeof fetch,
 * 	signal?: AbortSignal,
 * 	headers?: Record<string, string>
 * }} options
 * @returns {Promise<{ rows: Array<Record<string, string>>, meta: { sheetId: string, gid?: string, sheetName?: string, url: string, headerLookup: Record<string, string>, headerMap: Record<string, string> } }>}
 */
export async function fetchGoogleSheet(options = {}) {
	const {
		sheetUrl,
		sheetId: explicitSheetId,
		gid: explicitGid,
		sheetName,
		query,
		fetcher = fetch,
		signal,
		headers = {}
	} = options;

	let sheetId = explicitSheetId ?? null;
	let gid = explicitGid ?? null;
	let finalUrl = null;

	const isDirectCsvUrl = (candidate) => {
		if (!candidate) return false;
		const normalized = candidate.toLowerCase();
		return (
			normalized.includes('output=csv') ||
			normalized.includes('/gviz/tq') ||
			normalized.includes('/pub') ||
			normalized.includes('/export')
		);
	};

	if (sheetUrl && isDirectCsvUrl(sheetUrl)) {
		finalUrl = sheetUrl;
	}

	if (!finalUrl) {
		if (!sheetId && sheetUrl) {
			const parsed = parseGoogleSheetUrl(sheetUrl);
			sheetId = parsed.sheetId;
			gid = gid ?? parsed.gid;
		}

		if (!sheetId) {
			throw new Error('fetchGoogleSheet: sheetId ou sheetUrl precisam ser informados.');
		}

		finalUrl = buildGoogleSheetCsvUrl({ sheetId, gid, sheetName, query });
	}

	const url = finalUrl;
	const response = await fetcher(url, { signal, headers });

	if (!response.ok) {
		throw new Error(`Falha ao carregar Google Sheets (${response.status} ${response.statusText})`);
	}

	const csvText = await response.text();

	const headerLookup = {};
	const headerMap = {};

	const parseConfig = {
		header: true,
		skipEmptyLines: 'greedy',
		transformHeader(header) {
			const original = (header ?? '').trim();
			const sanitizedBase = sanitizeHeader(original);
			let candidate = sanitizedBase;
			let counter = 2;

			while (headerMap[candidate]) {
				candidate = `${sanitizedBase}_${counter++}`;
			}

			headerLookup[original] = candidate;
			headerMap[candidate] = original;
			return candidate;
		}
	};

	const { data, errors } = Papa.parse(csvText, parseConfig);

	if (errors?.length) {
		const sample = errors.slice(0, 2).map((err) => `${err.code ?? 'ERRO'}: ${err.message ?? ''}`);
			throw new Error(`Google Sheets retornou erros na conversao CSV: ${sample.join(' | ')}`);
	}

	// Limpa linhas totalmente vazias e remove espacos nas strings
	const rows = data
		.filter((row) => row && Object.values(row).some((value) => String(value ?? '').trim() !== ''))
		.map((row) => {
			const cleaned = {};
			for (const [key, value] of Object.entries(row)) {
				if (typeof value === 'string') {
					cleaned[key] = value.trim();
				} else {
					cleaned[key] = value;
				}
			}
			return cleaned;
		});

	return {
		rows,
		meta: {
			sheetId,
			gid: gid ?? undefined,
			sheetName,
			url,
			headerLookup,
			headerMap
		}
	};
}
