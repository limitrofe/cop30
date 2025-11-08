import Papa from 'papaparse';

/**
 * @typedef {Object} BarDatum
 * @property {string} label
 * @property {number} value
 */

export const DEFAULT_BAR_CHART_DATA = [
	{ label: 'Categoria A', value: 32 },
	{ label: 'Categoria B', value: 45 },
	{ label: 'Categoria C', value: 28 },
	{ label: 'Categoria D', value: 54 },
	{ label: 'Categoria E', value: 18 }
];

/**
 * Parse CSV/TSV text into data suitable for the bar chart.
 * Accepts headers `label` and `value` by default, falling back to the first two columns.
 * @param {string} input
 * @param {{ labelKey?: string, valueKey?: string }} [options]
 * @returns {{ data: BarDatum[], warnings: string[], errors: import('papaparse').ParseError[] }}
 */
export function parseBarChartCsv(input, { labelKey = 'label', valueKey = 'value' } = {}) {
	const trimmed = (input || '').trim();
	if (!trimmed) {
		return { data: [], warnings: [], errors: [] };
	}

	const headerResult = Papa.parse(trimmed, {
		header: true,
		skipEmptyLines: true,
		transformHeader: (header) => header.trim(),
		dynamicTyping: true
	});

	const hasRequiredHeaders =
		(headerResult.meta.fields || []).includes(labelKey) &&
		(headerResult.meta.fields || []).includes(valueKey);

	let structuredRows;
	if (hasRequiredHeaders) {
		structuredRows = headerResult.data;
	} else {
		const noHeaderResult = Papa.parse(trimmed, {
			header: false,
			skipEmptyLines: true,
			dynamicTyping: true
		});
		structuredRows = noHeaderResult.data.map((row) => {
			if (!Array.isArray(row)) return row;
			return {
				[labelKey]: row[0],
				[valueKey]: row[1]
			};
		});
		headerResult.errors.push(...noHeaderResult.errors);
	}

	const data = structuredRows
		.map((row) => {
			const label = row?.[labelKey];
			const rawValue = row?.[valueKey];
			const value = typeof rawValue === 'number' ? rawValue : Number(rawValue);

			if (typeof label !== 'string' && typeof label !== 'number') {
				return null;
			}

			if (!Number.isFinite(value)) {
				return null;
			}

			return {
				label: String(label).trim(),
				value
			};
		})
		.filter(Boolean);

	const warnings = [];

	if (!data.length) {
		warnings.push('Não foi possível encontrar colunas de rótulos e valores válidas.');
	}

	if (hasRequiredHeaders === false) {
		warnings.push(
			`Cabeçalhos "${labelKey}" e/ou "${valueKey}" não encontrados. Os dois primeiros campos foram usados.`
		);
	}

	return {
		data,
		warnings,
		errors: headerResult.errors
	};
}
