#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
	defaultFiltersConfig,
	defaultSearchConfig,
	defaultSectionsConfig,
	defaultHighlightConfig,
	defaultVideoConfig
} from '../src/lib/utils/videoSheetConfig.js';
import {
	normalizeValue,
	createColumnResolver,
	resolveColumnKey,
	normalizeFilterColumn,
	firstString,
	createLabelLookup,
	flattenColumns,
	dedupeList,
	createVideoRecord,
	buildFilterOptions
} from '../src/lib/utils/videoSheetProcessing.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_INPUT = 'static/data/cop30-final.json';
const DEFAULT_CHUNK_DIR = 'static/data/cop30-chunks';
const DEFAULT_PATTERN = 'cop30-chunk-{{index:02d}}.json';
const DEFAULT_STORY_PATH = 'static/data/story.json';

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

function formatPattern(pattern, index) {
	const padMatch = pattern.match(/\{\{\s*index(?::0?(\d+))?[a-z]*\s*\}\}/i);
	if (!padMatch) {
		return pattern.replace(/\{\{\s*index\s*\}\}/gi, String(index));
	}
	const pad = padMatch[1] ? Number(padMatch[1]) : 0;
	const token = pad ? String(index).padStart(pad, '0') : String(index);
	return pattern.replace(/\{\{\s*index(?::0?\d+)?[a-z]*\s*\}\}/gi, token);
}

async function loadJson(relativePath) {
	const resolved = path.resolve(__dirname, '..', relativePath);
	const content = await fs.readFile(resolved, 'utf-8');
	return JSON.parse(content);
}

function resolveParagraph(story, indexOverride) {
	const paragraphs = Array.isArray(story?.paragraphs) ? story.paragraphs : [];
	if (indexOverride !== undefined) {
		const parsed = Number(indexOverride);
		if (Number.isInteger(parsed) && paragraphs[parsed]) {
			return { paragraph: paragraphs[parsed], index: parsed };
		}
	}
	const targetIndex = paragraphs.findIndex(
		(item) => typeof item?.type === 'string' && item.type.toLowerCase().includes('video-sheet')
	);
	return targetIndex === -1
		? { paragraph: null, index: -1 }
		: { paragraph: paragraphs[targetIndex], index: targetIndex };
}

function normalizeHighlightConfig(config) {
	if (!config) return null;
	return { ...defaultHighlightConfig, ...config };
}

function normalizeSectionsConfig(config) {
	const merged = { ...defaultSectionsConfig, ...(config || {}) };
	merged.highlight = config?.highlight ? normalizeHighlightConfig(config.highlight) : null;
	return merged;
}

function normalizeFiltersConfig(config) {
	return { ...defaultFiltersConfig, ...(config || {}) };
}

function normalizeVideoConfig(config) {
	return { ...defaultVideoConfig, ...(config || {}) };
}

function normalizeSearchConfig(config) {
	return { ...defaultSearchConfig, ...(config || {}) };
}

function buildResolvedColumns(columnResolver, videoConfig, sectionsConfig) {
	return {
		id: resolveColumnKey(columnResolver, videoConfig.id),
		mobileId: resolveColumnKey(columnResolver, videoConfig.mobileId),
		desktopId: resolveColumnKey(columnResolver, videoConfig.desktopId),
		title: resolveColumnKey(columnResolver, videoConfig.title),
		subtitle: resolveColumnKey(columnResolver, videoConfig.subtitle),
		description: resolveColumnKey(columnResolver, videoConfig.description),
		thumbnail: resolveColumnKey(columnResolver, videoConfig.thumbnail),
		tag: resolveColumnKey(columnResolver, videoConfig.tag),
		section: resolveColumnKey(columnResolver, videoConfig.section),
		publishedAt: resolveColumnKey(columnResolver, videoConfig.publishedAt),
		link: resolveColumnKey(columnResolver, videoConfig.link),
		highlight: sectionsConfig.highlight
			? resolveColumnKey(columnResolver, sectionsConfig.highlight.column ?? videoConfig.section)
			: null
	};
}

function buildResolvedFilterColumns(columnResolver, filtersConfig, filterLabelLookup) {
	return (filtersConfig.columns ?? [])
		.map(normalizeFilterColumn)
		.filter(Boolean)
		.map((columnConfig) => {
			const key = resolveColumnKey(columnResolver, columnConfig.column);
			if (!key) return null;
			const valueMap = columnConfig.labelMap
				? createLabelLookup(columnConfig.labelMap)
				: filterLabelLookup;
			return {
				key,
				original: firstString(columnConfig.column),
				valueMap
			};
		})
		.filter(Boolean);
}

function buildResolvedSearchColumns(columnResolver, searchConfig, videoConfig) {
	const candidates = dedupeList(
		flattenColumns([
			searchConfig.columns,
			videoConfig.title,
			videoConfig.subtitle,
			videoConfig.description,
			videoConfig.searchTokensExtra
		]).filter(Boolean)
	);
	return candidates.map((column) => resolveColumnKey(columnResolver, column)).filter(Boolean);
}

function serializeVideoRecord(video) {
	if (!video || typeof video !== 'object') return video;
	const filterIds = Array.isArray(video.filterIds)
		? [...video.filterIds]
		: Array.from(video.filterIds ?? []);
	return {
		...video,
		filterIds
	};
}

async function removeExistingChunks(dir) {
	try {
		const files = await fs.readdir(dir, { withFileTypes: true });
		await Promise.all(
			files
				.filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
				.map((entry) => fs.unlink(path.join(dir, entry.name)))
		);
	} catch (error) {
		if (error.code !== 'ENOENT') {
			throw error;
		}
	}
}

async function writeChunkFile(dir, filename, payload) {
	await fs.mkdir(dir, { recursive: true });
	const resolved = path.join(dir, filename);
	await fs.writeFile(resolved, JSON.stringify(payload, null, 2));
	return resolved;
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	if (args.help || args.h) {
		console.log(
			[
				'Usage: node scripts/preprocess-video-sheet.js [options]',
				'',
				'Options:',
				`  --input <path>         Input JSON (default: ${DEFAULT_INPUT})`,
				`  --story <path>         Story JSON path (default: ${DEFAULT_STORY_PATH})`,
				`  --chunkDir <path>      Chunk output directory (default: ${DEFAULT_CHUNK_DIR})`,
				`  --pattern <pattern>    Chunk filename pattern (default: ${DEFAULT_PATTERN})`,
				'                         Use {{index}} or {{index:02d}} placeholders.',
				'  --chunkSize <number>   Items per chunk (default: 5)',
				'  --paragraph <index>    Paragraph index (default: first video-sheet)',
				''
			].join('\n')
		);
		return;
	}

	const inputPath = args.input || DEFAULT_INPUT;
	const chunkDir = args.chunkDir || DEFAULT_CHUNK_DIR;
	const pattern = args.pattern || DEFAULT_PATTERN;
	const storyPath = args.story || DEFAULT_STORY_PATH;
	const chunkSize = Math.max(1, Number(args.chunkSize) || 5);

	const [sheetData, storyData] = await Promise.all([loadJson(inputPath), loadJson(storyPath)]);
	const { paragraph } = resolveParagraph(storyData, args.paragraph);
	if (!paragraph) {
		console.warn(
			'preprocess-video-sheet: could not find a video-sheet paragraph in story.json — skipping generation.'
		);
		return;
	}

	const filtersConfig = normalizeFiltersConfig(paragraph.filtersConfig || {});
	const searchConfig = normalizeSearchConfig(paragraph.searchConfig || {});
	const sectionsConfig = normalizeSectionsConfig(paragraph.sectionsConfig || {});
	const videoConfig = normalizeVideoConfig(paragraph.videoConfig || {});

	const rows = Array.isArray(sheetData?.rows) ? sheetData.rows : [];
	if (!rows.length) {
		throw new Error('preprocess-video-sheet: input JSON has no rows to process.');
	}

	const meta = sheetData?.meta ?? {};
	const columnResolver = createColumnResolver(meta, rows);
	const filterLabelLookup = createLabelLookup(filtersConfig.labelMap);
	const sectionLabelLookup = createLabelLookup(sectionsConfig.labelMap);
	const highlightValueSet =
		sectionsConfig.highlight && Array.isArray(sectionsConfig.highlight.values)
			? new Set(
					sectionsConfig.highlight.values.map((value) => normalizeValue(value)).filter(Boolean)
				)
			: new Set();

	const resolvedColumns = buildResolvedColumns(columnResolver, videoConfig, sectionsConfig);
	const resolvedFilterColumns = buildResolvedFilterColumns(
		columnResolver,
		filtersConfig,
		filterLabelLookup
	);
	const resolvedSearchColumns = buildResolvedSearchColumns(
		columnResolver,
		searchConfig,
		videoConfig
	);

	const videos = rows
		.map((row, index) =>
			createVideoRecord({
				row,
				index,
				resolvedColumns,
				resolvedFilterColumns,
				resolvedSearchColumns,
				sectionLabelLookup,
				filterLabelLookup,
				highlightValueSet,
				sectionsResolved: sectionsConfig
			})
		)
		.filter(Boolean);

	const filterOptions = buildFilterOptions(videos, resolvedFilterColumns, filtersConfig);

	const totalVideos = videos.length;
	const totalChunks = Math.ceil(totalVideos / chunkSize);
	const chunkMetaBase = {
		...meta,
		chunkSize,
		chunkTotal: totalChunks,
		totalRows: rows.length
	};

	const chunkOutputDir = path.resolve(__dirname, '..', chunkDir);
	await removeExistingChunks(chunkOutputDir);

	for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
		const start = chunkIndex * chunkSize;
		const end = start + chunkSize;
		const chunkRows = rows.slice(start, end);
		const chunkVideos = videos.slice(start, end);
		const serializedVideos = chunkVideos.map(serializeVideoRecord);
		const filename = formatPattern(pattern, chunkIndex + 1);
		const payload = {
			rows: chunkRows,
			meta: { ...chunkMetaBase, chunkIndex: chunkIndex + 1 },
			precomputed: {
				videos: serializedVideos
			}
		};
		if (chunkIndex === 0) {
			payload.precomputed.filterOptions = filterOptions;
			payload.precomputed.summary = {
				totalVideos,
				chunkSize,
				chunkTotal: totalChunks,
				generatedAt: new Date().toISOString()
			};
		}
		await writeChunkFile(chunkOutputDir, filename, payload);
	}

	console.log(
		`preprocess-video-sheet: generated ${totalChunks} chunk(s) with ${chunkSize} items each (total ${totalVideos}).`
	);
}

try {
	await main();
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
}
