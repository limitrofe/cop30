#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import Papa from 'papaparse';
import { fileURLToPath } from 'url';
import { sanitizeHeader } from '../src/lib/utils/googleSheets.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv) {
	const args = {};
	for (let index = 0; index < argv.length; index += 1) {
		const key = argv[index];
		if (!key.startsWith('--')) continue;
		const value = argv[index + 1];
		if (value && !value.startsWith('--')) {
			args[key.slice(2)] = value;
			index += 1;
		} else {
			args[key.slice(2)] = true;
		}
	}
	return args;
}

function buildHeaderTransform() {
	const headerLookup = {};
	const headerMap = {};
	return {
		headerLookup,
		headerMap,
		transformHeader(header) {
			const original = String(header ?? '').trim();
			if (headerLookup[original]) {
				return headerLookup[original];
			}
			const sanitizedBase = sanitizeHeader(original);
			let candidate = sanitizedBase;
			let suffix = 2;

			while (headerMap[candidate]) {
				candidate = `${sanitizedBase}_${suffix++}`;
			}

			headerLookup[original] = candidate;
			headerMap[candidate] = original;
			return candidate;
		}
	};
}

async function buildJson({ input, output, sheetName, sheetId, gid, sourceUrl }) {
	if (!input) {
		throw new Error('build-sheet-json: --input é obrigatório');
	}
	if (!output) {
		throw new Error('build-sheet-json: --output é obrigatório');
	}

	const resolvedInput = path.resolve(__dirname, '..', input);
	const resolvedOutput = path.resolve(__dirname, '..', output);

	const csvText = await fs.readFile(resolvedInput, 'utf8');

	const { headerLookup, headerMap, transformHeader } = buildHeaderTransform();

	const { data, errors } = Papa.parse(csvText, {
		header: true,
		skipEmptyLines: 'greedy',
		transformHeader
	});

	if (errors?.length) {
		const sample = errors
			.slice(0, 2)
			.map((err) => `${err.code ?? 'ERRO'}: ${err.message ?? ''}`)
			.join(' | ');
		throw new Error(`Falha ao converter CSV: ${sample}`);
	}

	const rows = data
		.filter((row) => row && Object.values(row).some((value) => String(value ?? '').trim() !== ''))
		.map((row) => {
			const cleaned = {};
			for (const [key, value] of Object.entries(row)) {
				if (key === 'coluna' && (value === '' || value === undefined || value === null)) {
					continue;
				}
				if (typeof value === 'string') {
					const trimmed = value.trim();
					if (key === 'coluna' && !trimmed) continue;
					cleaned[key] = trimmed;
				} else {
					cleaned[key] = value;
				}
			}
			return cleaned;
		});

	const payload = {
		rows,
		meta: {
			sheetId: sheetId || null,
			gid: gid || undefined,
			sheetName: sheetName || undefined,
			url: sourceUrl || undefined,
			headerLookup,
			headerMap
		}
	};

	await fs.mkdir(path.dirname(resolvedOutput), { recursive: true });
	await fs.writeFile(resolvedOutput, JSON.stringify(payload, null, 2));
	console.log(`build-sheet-json: ${rows.length} linhas salvas em ${output}`);
}

const args = parseArgs(process.argv.slice(2));

if (args.help || args.h) {
	console.log(
		'Uso: node scripts/build-sheet-json.js --input <csv> --output <json> [--sheetName Nome] [--sheetId id] [--gid gid] [--sourceUrl url]'
	);
	process.exit(0);
}

try {
	await buildJson(args);
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
}
