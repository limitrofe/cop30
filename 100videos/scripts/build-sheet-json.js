#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import Papa from 'papaparse';
import { sanitizeHeader } from '../src/lib/utils/googleSheets.js';

const HELP_TEXT = `
Uso: node scripts/build-sheet-json.js --input <entrada.csv> --output <saida.json> [opcoes]

Opcoes:
  --input, -i        Caminho do CSV de origem (obrigatorio)
  --output, -o       Caminho do JSON principal (obrigatorio)
  --chunk-dir        Pasta onde os chunks serao salvos (opcional)
  --chunk-prefix     Prefixo dos arquivos de chunk. Padrao: chunk
  --chunk-size       Numero de linhas por chunk. Padrao: 0 (desativado)
  --chunk-public-base Caminho publico (ex: /data/meus-chunks) para os arquivos de chunk
  --force-skipdfp    Remove colunas skipdfp/skipDFP para usar flag implicita no runtime
  --pretty           Usa indentacao de 2 espacos ao salvar JSON (padrao)
  --minify           Forca JSON minificado (sobrescreve --pretty)
  --help, -h         Mostra esta ajuda
`.trim();

function parseArgs(argv) {
	const options = {
		chunkPrefix: 'chunk',
		chunkSize: 0,
		forceSkipDFP: false,
		pretty: true
	};

	const positional = [];

	for (let i = 0; i < argv.length; i++) {
		const token = argv[i];
		if (!token.startsWith('-')) {
			positional.push(token);
			continue;
		}

		const [flag, inlineValue] = token.split('=');
		const readValue = () => {
			if (inlineValue !== undefined) return inlineValue;
			if (i + 1 >= argv.length) return null;
			const next = argv[i + 1];
			if (next.startsWith('-')) return null;
			i += 1;
			return next;
		};

		switch (flag) {
			case '--input':
			case '-i':
				options.input = readValue();
				break;
			case '--output':
			case '-o':
				options.output = readValue();
				break;
			case '--chunk-dir':
				options.chunkDir = readValue();
				break;
			case '--chunk-prefix':
				options.chunkPrefix = readValue() ?? 'chunk';
				break;
			case '--chunk-size':
				options.chunkSize = Number(readValue() ?? '0');
				break;
			case '--chunk-public-base':
				options.chunkPublicBase = readValue();
				break;
			case '--force-skipdfp':
				options.forceSkipDFP = true;
				break;
			case '--minify':
				options.pretty = false;
				break;
			case '--pretty':
				options.pretty = true;
				break;
			case '--help':
			case '-h':
				options.help = true;
				break;
			default:
				console.warn(`⚠️  Flag desconhecida ignorada: ${flag}`);
				break;
		}
	}

	if (!options.input && positional.length) {
		options.input = positional.shift();
	}

	if (!options.output && positional.length) {
		options.output = positional.shift();
	}

	return options;
}

function isMeaningful(value) {
	if (value === undefined || value === null) return false;
	if (typeof value === 'string') {
		return value.trim().length > 0;
	}
	return true;
}

function normalizeHeaderKeys({ rows, headerLookup, headerMap, headerEntries }) {
	if (!rows.length || !headerEntries.length) return;
	const usedKeys = new Set();
	for (const row of rows) {
		for (const key of Object.keys(row)) {
			usedKeys.add(key);
		}
	}

	for (const entry of headerEntries) {
		const original = entry.original ?? '';
		const currentKey = entry.key;
		if (!original || !headerLookup[original]) continue;
		if (!headerMap[currentKey]) continue;
		const desiredKey = sanitizeHeader(original) || 'coluna';
		if (currentKey === desiredKey) continue;
		if (usedKeys.has(desiredKey)) continue;

		for (const row of rows) {
			if (Object.prototype.hasOwnProperty.call(row, currentKey)) {
				row[desiredKey] = row[currentKey];
				delete row[currentKey];
			}
		}

		usedKeys.delete(currentKey);
		usedKeys.add(desiredKey);

		headerLookup[original] = desiredKey;
		delete headerMap[currentKey];
		headerMap[desiredKey] = original;
	}
}

function pruneRow(row, { dropSkipDFP = false } = {}) {
	const cleaned = {};
	for (const [key, rawValue] of Object.entries(row)) {
		if (dropSkipDFP) {
			const normalized = sanitizeHeader(key);
			if (normalized === 'skipdfp') continue;
		}
		if (rawValue === undefined || rawValue === null) continue;
		if (typeof rawValue === 'string') {
			const trimmed = rawValue.trim();
			if (!trimmed) continue;
			cleaned[key] = trimmed;
		} else {
			cleaned[key] = rawValue;
		}
	}
	return cleaned;
}

function parseCsv(content, options = {}) {
	const headerLookup = {};
	const headerMap = {};
	const headerEntries = [];

	const { data, errors } = Papa.parse(content, {
		header: true,
		skipEmptyLines: 'greedy',
		transformHeader(header) {
			const original = (header ?? '').trim();
			const sanitizedBase = sanitizeHeader(original);
			let candidate = sanitizedBase || 'coluna';
			let counter = 2;
			while (headerMap[candidate]) {
				candidate = `${sanitizedBase || 'coluna'}_${counter++}`;
			}
			if (original) {
				headerLookup[original] = candidate;
			}
			headerMap[candidate] = original || candidate;
			headerEntries.push({
				original,
				key: candidate
			});
			return candidate;
		}
	});

	if (errors?.length) {
		const sample = errors
			.slice(0, 3)
			.map((err) => `${err.code ?? 'ERRO'}: ${err.message ?? ''}`)
			.join(' | ');
		throw new Error(`Falha ao converter CSV: ${sample}`);
	}

	const rows = data
		.filter((row) => {
			if (!row) return false;
			return Object.values(row).some((value) => isMeaningful(String(value ?? '')));
		})
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

	const columnUsage = new Map(Object.keys(headerMap).map((key) => [key, false]));

	for (const row of rows) {
		for (const [key, value] of Object.entries(row)) {
			if (columnUsage.has(key) && isMeaningful(value)) {
				columnUsage.set(key, true);
			}
		}
	}

	const emptyColumns = Array.from(columnUsage.entries())
		.filter(([, used]) => !used)
		.map(([key]) => key);

	if (emptyColumns.length) {
		for (const row of rows) {
			for (const column of emptyColumns) {
				delete row[column];
			}
		}

		for (const column of emptyColumns) {
			delete headerMap[column];
		}

		for (const [original, sanitized] of Object.entries(headerLookup)) {
			if (emptyColumns.includes(sanitized)) {
				delete headerLookup[original];
			}
		}
	}

	normalizeHeaderKeys({ rows, headerLookup, headerMap, headerEntries });

	const prunedRows = rows.map((row) => pruneRow(row, { dropSkipDFP: options.dropSkipDFP }));

	if (options.dropSkipDFP) {
		for (const [original, sanitized] of Object.entries({ ...headerLookup })) {
			if (sanitizeHeader(original) === 'skipdfp' || sanitized === 'skipdfp') {
				delete headerLookup[original];
			}
		}
		for (const key of Object.keys({ ...headerMap })) {
			if (sanitizeHeader(key) === 'skipdfp') {
				delete headerMap[key];
			}
		}
	}

	return { rows: prunedRows, headerLookup, headerMap };
}

async function writeJson(targetPath, data, pretty) {
	await mkdir(path.dirname(targetPath), { recursive: true });
	const serialized = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
	await writeFile(targetPath, serialized, 'utf-8');
}

function resolvePublicBase(chunkDir, explicitBase) {
	if (explicitBase) {
		const cleaned = explicitBase.trim().replace(/\/+$/, '');
		return cleaned || '/';
	}
	if (!chunkDir) return null;
	const staticRoot = path.resolve('static');
	const absoluteChunkDir = path.resolve(chunkDir);
	const relative = path.relative(staticRoot, absoluteChunkDir);
	if (relative.startsWith('..')) return null;
	const normalized = relative.split(path.sep).filter(Boolean).join('/');
	return `/${normalized}`;
}

function buildChunkingDescriptor({ chunkDir, chunkPrefix, chunkSize, totalChunks, chunkPublicBase }) {
	if (!totalChunks || totalChunks < 1) return null;
	const padLength = String(totalChunks).length;
	return {
		enabled: true,
		publicBase: chunkPublicBase ?? resolvePublicBase(chunkDir),
		prefix: chunkPrefix,
		separator: '-',
		extension: '.json',
		padLength,
		totalChunks,
		chunkSize,
		startChunk: 1
	};
}

function buildChunkFilename({ prefix = 'chunk', separator = '-', extension = '.json', padLength = 2 }, index) {
	const padded = String(index).padStart(Math.max(1, padLength), '0');
	const normalizedExtension = extension.startsWith('.') ? extension : `.${extension}`;
	const separatorValue = separator === undefined ? '-' : separator;
	const insert = separatorValue ? `${separatorValue}${padded}` : padded;
	return `${prefix}${insert}${normalizedExtension}`;
}

async function buildChunks(rows, meta, options) {
	const {
		chunkDir,
		chunkSize,
		chunkPrefix = 'chunk',
		pretty = true,
		chunkPublicBase = null
	} = options;
	if (!chunkDir || !chunkSize || chunkSize < 1) return { chunks: 0 };

	await mkdir(chunkDir, { recursive: true });

	const totalChunks = Math.ceil(rows.length / chunkSize);
	const chunkingDescriptor = buildChunkingDescriptor({
		chunkDir,
		chunkPrefix,
		chunkSize,
		totalChunks,
		chunkPublicBase
	});

	if (chunkingDescriptor && !chunkingDescriptor.publicBase) {
		console.warn(
			'⚠️  chunk-public-base não foi definido e o caminho não parece estar dentro de static/. ' +
				'O loader incremental não conseguirá resolver as URLs públicas dos chunks.'
		);
	}

	const tasks = [];
	for (let index = 0; index < totalChunks; index++) {
		const start = index * chunkSize;
		const end = Math.min(start + chunkSize, rows.length);
		const slice = rows.slice(start, end);
		const chunkNumber = index + 1;
		const chunkFile = buildChunkFilename(
			{
				prefix: chunkPrefix,
				separator: chunkingDescriptor?.separator ?? '-',
				extension: chunkingDescriptor?.extension ?? '.json',
				padLength: chunkingDescriptor?.padLength ?? String(totalChunks).length
			},
			chunkNumber
		);
		const chunkUrl =
			chunkingDescriptor?.publicBase && chunkFile
				? `${chunkingDescriptor.publicBase}/${chunkFile}`
				: null;
		const chunkMeta = {
			...meta,
			chunkIndex: index,
			chunkNumber,
			chunkSize,
			totalChunks,
			start,
			end,
			count: slice.length,
			chunkFile,
			chunkUrl,
			chunking: chunkingDescriptor
				? {
						...chunkingDescriptor,
						currentChunk: chunkNumber,
						nextChunk: chunkNumber + 1 <= totalChunks ? chunkNumber + 1 : null
					}
				: undefined
		};

		const chunkPath = path.join(chunkDir, chunkFile);
		tasks.push(writeJson(chunkPath, { rows: slice, meta: chunkMeta }, pretty));
	}

	await Promise.all(tasks);
	return { chunks: totalChunks, descriptor: chunkingDescriptor };
}

async function main() {
	const args = parseArgs(process.argv.slice(2));

	if (args.help) {
		console.log(HELP_TEXT);
		return;
	}

	if (!args.input || !args.output) {
		console.error('❌  Informe --input e --output.');
		console.log(HELP_TEXT);
		process.exitCode = 1;
		return;
	}

	try {
		const inputPath = path.resolve(args.input);
		const outputPath = path.resolve(args.output);
		const csvContent = await readFile(inputPath, 'utf-8');
		const { rows, headerLookup, headerMap } = parseCsv(csvContent, {
			dropSkipDFP: args.forceSkipDFP
		});

		if (!rows.length) {
			throw new Error('Nenhuma linha valida encontrada no CSV.');
		}

		const meta = {
			sourceFile: path.relative(process.cwd(), inputPath),
			generatedAt: new Date().toISOString(),
			headerLookup,
			headerMap,
			rowCount: rows.length
		};

		let chunkSummary = null;
		if (args.chunkDir && args.chunkSize > 0) {
			const chunkDir = path.resolve(args.chunkDir);
			const chunkPublicBase = resolvePublicBase(chunkDir, args.chunkPublicBase);
			chunkSummary = await buildChunks(rows, meta, {
				chunkDir,
				chunkSize: args.chunkSize,
				chunkPrefix: args.chunkPrefix,
				pretty: args.pretty,
				chunkPublicBase
			});
		}

		const metaWithChunking = {
			...meta,
			chunking: chunkSummary?.descriptor
				? { ...chunkSummary.descriptor, currentChunk: null }
				: undefined
		};

		await writeJson(outputPath, { rows, meta: metaWithChunking }, args.pretty);

		console.log(
			`✅  JSON gerado com ${rows.length} linhas em ${path.relative(process.cwd(), outputPath)}`
		);
		if (chunkSummary?.chunks) {
			console.log(
				`   ↳ ${chunkSummary.chunks} chunks salvos em ${path.relative(process.cwd(), path.resolve(args.chunkDir))}`
			);
		}
	} catch (error) {
		console.error('❌  Falha ao gerar JSON da planilha:', error);
		process.exitCode = 1;
	}
}

main();
