import Papa from 'papaparse';

/**
 * @typedef {Object} LineDatum
 * @property {string|number|Date} date
 * @property {number} value
 * @property {number|null} [min]
 * @property {number|null} [max]
 */

export const DEFAULT_LINE_CHART_DATA = [
	{ date: '1994-01-01', value: 23.4, min: 18.1, max: 28.6 },
	{ date: '1995-01-01', value: 24.1, min: 19.4, max: 29.8 },
	{ date: '1996-01-01', value: 25.6, min: 20.8, max: 31.2 },
	{ date: '1997-01-01', value: 26.2, min: 21.1, max: 32.5 },
	{ date: '1998-01-01', value: 27.4, min: 22.0, max: 33.7 },
	{ date: '1999-01-01', value: 26.8, min: 21.5, max: 32.9 },
	{ date: '2000-01-01', value: 27.9, min: 22.4, max: 34.3 },
	{ date: '2001-01-01', value: 28.5, min: 23.1, max: 35.1 },
	{ date: '2002-01-01', value: 29.4, min: 24.2, max: 36.2 },
	{ date: '2003-01-01', value: 29.9, min: 24.7, max: 36.9 },
	{ date: '2004-01-01', value: 30.4, min: 25.1, max: 37.6 },
	{ date: '2005-01-01', value: 30.9, min: 25.6, max: 38.2 },
	{ date: '2006-01-01', value: 31.3, min: 26.0, max: 38.9 },
	{ date: '2007-01-01', value: 31.8, min: 26.4, max: 39.5 },
	{ date: '2008-01-01', value: 32.1, min: 26.8, max: 39.9 },
	{ date: '2009-01-01', value: 32.7, min: 27.2, max: 40.4 },
	{ date: '2010-01-01', value: 33.2, min: 27.6, max: 41.0 },
	{ date: '2011-01-01', value: 33.8, min: 28.0, max: 41.7 },
	{ date: '2012-01-01', value: 34.1, min: 28.4, max: 42.2 },
	{ date: '2013-01-01', value: 34.6, min: 28.9, max: 42.9 },
	{ date: '2014-01-01', value: 35.2, min: 29.3, max: 43.6 },
	{ date: '2015-01-01', value: 35.8, min: 29.8, max: 44.2 },
	{ date: '2016-01-01', value: 36.4, min: 30.2, max: 44.8 },
	{ date: '2017-01-01', value: 36.9, min: 30.6, max: 45.3 },
	{ date: '2018-01-01', value: 37.2, min: 30.9, max: 45.8 },
	{ date: '2019-01-01', value: 37.6, min: 31.3, max: 46.2 },
	{ date: '2020-01-01', value: 38.1, min: 31.8, max: 46.8 },
	{ date: '2021-01-01', value: 38.5, min: 32.2, max: 47.3 },
	{ date: '2022-01-01', value: 39.2, min: 32.7, max: 47.9 },
	{ date: '2023-01-01', value: 39.8, min: 33.1, max: 48.5 }
];

/**
 * Parseia CSV em estrutura compatível com o LineChart.
 * Aceita colunas configuráveis com fallback para as quatro primeiras.
 * @param {string} input
 * @param {{ xKey?: string, yKey?: string, yLowKey?: string, yHighKey?: string }} [options]
 * @returns {{ data: Array<Record<string, any>>, warnings: string[], errors: import('papaparse').ParseError[] }}
 */
export function parseLineChartCsv(
	input,
	{ xKey = 'date', yKey = 'value', yLowKey = 'min', yHighKey = 'max' } = {}
) {
	const trimmed = (input || '').trim();
	if (!trimmed) {
		return { data: [], warnings: [], errors: [] };
	}

	const warnings = [];

	const parsedWithHeader = Papa.parse(trimmed, {
		header: true,
		skipEmptyLines: true,
		transformHeader: (header) => header.trim(),
		dynamicTyping: true
	});

	const hasRequiredHeaders = [xKey, yKey].every((key) =>
		(parsedWithHeader.meta.fields || []).includes(key)
	);

	let rows;
	if (hasRequiredHeaders) {
		rows = parsedWithHeader.data;
	} else {
		const parsedNoHeader = Papa.parse(trimmed, {
			header: false,
			skipEmptyLines: true,
			dynamicTyping: true
		});
		rows = parsedNoHeader.data.map((row) => {
			if (!Array.isArray(row)) return row;
			return {
				[xKey]: row[0],
				[yKey]: row[1],
				[yLowKey]: row[2],
				[yHighKey]: row[3]
			};
		});
		parsedWithHeader.errors.push(...parsedNoHeader.errors);
		warnings.push(
			`Cabeçalhos "${xKey}" e/ou "${yKey}" não encontrados. As quatro primeiras colunas foram usadas como fallback.`
		);
	}

	const data = rows
		.map((row) => {
			if (row == null || typeof row !== 'object') return null;
			const xValue = row[xKey];
			const yValueRaw = row[yKey];
			const yLowRaw = row[yLowKey];
			const yHighRaw = row[yHighKey];

			const value = typeof yValueRaw === 'number' ? yValueRaw : Number(yValueRaw);
			if (!Number.isFinite(value)) {
				return null;
			}

			const parsed = {
				[xKey]: xValue,
				[yKey]: value
			};

			const low = typeof yLowRaw === 'number' ? yLowRaw : Number(yLowRaw);
			if (Number.isFinite(low)) {
				parsed[yLowKey] = low;
			}

			const high = typeof yHighRaw === 'number' ? yHighRaw : Number(yHighRaw);
			if (Number.isFinite(high)) {
				parsed[yHighKey] = high;
			}

			return parsed;
		})
		.filter(Boolean);

	if (!data.length) {
		warnings.push('Não foi possível extrair valores numéricos válidos do CSV informado.');
	}

	return {
		data,
		warnings,
		errors: parsedWithHeader.errors
	};
}
