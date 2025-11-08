<script>
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { fetchGoogleSheet, sanitizeHeader } from '$lib/utils/googleSheets.js';

	// Props mantidos para compatibilidade com o Storybook atual
	export let sheetUrl = '';
	export let sheetId = '';
	export let sheetName = '';
	export let gid = '';
	export let query = '';
	export let fetchOnMount = true;
	export let fetchHeaders = {};
	export let fetcher = null;
	export let initialData = null;
	export let layoutConfig = {};
	export let videoConfig = {};
	export let sectionsConfig = {};
	export let datasetUrl = '/data/cop30-final.json';
	export let emptyStateMessage = 'Nenhum vídeo disponível no momento.';
	export let loadingMessage = 'Carregando vídeos...';
	export let debug = false;

	let loading = !initialData;
	let error = null;
	let videos = [];
	let sections = [];
	let selectedVideo = null;
	let overlayVisible = false;
	let headingTitle = '';
let headingSubtitle = '';
let bodyScrollLocked = false;
let lastInitialPayload = null;
let resolvedDatasetUrl = datasetUrl;
let GloboPlayerComponent = null;
let globoPlayerImporting = false;
let globoPlayerImportError = null;

	const COLUMN_ALIASES = {
		title: ['title', 'titulo', 'nome'],
		subtitle: ['subtitle', 'subtitulo', 'descricao', 'description'],
		theme: ['tema', 'theme', 'assunto', 'section'],
		thumbnail: ['thumb', 'thumbnail', 'capa', 'image'],
		globoId: ['globoid', 'videoid', 'id_video', 'idVideo'],
		globoIdDesktop: ['globoiddesktop', 'videoiddesktop'],
		globoIdMobile: ['globoidmobile', 'videoidmobile'],
		link: ['link', 'links_relacionados', 'cta'],
		publishedAt: ['data', 'publishedat', 'published_at'],
		tag: ['tag', 'tema_curto']
	};

	const BODY_LOCK_CLASS = 'video-sheet-showcase--lock-scroll';

	$: resolvedDatasetUrl = videoConfig?.datasetUrl ?? datasetUrl ?? '';

	onMount(() => {
		if (initialData?.rows?.length) {
			applySheetData(initialData);
			return;
		}

		if (resolvedDatasetUrl) {
			loadDataset(resolvedDatasetUrl).then((loaded) => {
				if (!loaded && fetchOnMount) {
					loadSheet();
				}
			});
		} else if (fetchOnMount) {
			loadSheet();
		}
	});

	onDestroy(() => {
		unlockScroll();
	});

	$: if (initialData && initialData !== lastInitialPayload) {
		lastInitialPayload = initialData;
		applySheetData(initialData);
	}

	async function loadSheet() {
		if (!sheetUrl && !sheetId) {
			loading = false;
			return;
		}
		loading = true;
		error = null;
		try {
			const requestConfig = {
				sheetUrl,
				sheetId,
				sheetName,
				gid,
				query,
				headers: fetchHeaders
			};
			if (typeof fetcher === 'function') {
				requestConfig.fetcher = fetcher;
			}
			const response = await fetchGoogleSheet(requestConfig);
			applySheetData(response);
		} catch (err) {
			error = 'Não foi possível carregar os vídeos agora.';
			console.error('VideoSheetShowcase: falha ao carregar planilha', err);
		} finally {
			loading = false;
		}
	}

	async function loadDataset(url) {
		if (!browser || !url) {
			return false;
		}
		loading = true;
		error = null;
		try {
			const response = await fetch(url, { cache: 'no-store' });
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
			let payload;
			if (contentType.includes('application/json') || url.endsWith('.json')) {
				payload = await response.json();
			} else {
				const text = await response.text();
				payload = { rows: parseCsvDataset(text) };
			}
			const rows = Array.isArray(payload?.rows)
				? payload.rows
				: Array.isArray(payload)
					? payload
					: Array.isArray(payload?.data)
						? payload.data
						: [];
			if (!rows.length) {
				throw new Error('Dataset vazio');
			}
			applySheetData({ rows, meta: payload?.meta || payload?.info || null });
			return true;
		} catch (err) {
			error = 'Não foi possível carregar os vídeos locais.';
			console.error('VideoSheetShowcase: falha ao carregar dataset local', err);
			return false;
		} finally {
			loading = false;
		}
	}

function applySheetData(data) {
		const rows = Array.isArray(data?.rows) ? data.rows : [];
		videos = normalizeRows(rows);
		sections = buildSections(videos);
		const metaTitle = data?.meta?.title || layoutConfig?.headingTitle || sectionsConfig?.title;
		setHeadline(metaTitle, data?.meta?.subtitle);
	}

	function setHeadline(title, subtitle) {
		headingTitle = title?.trim?.() || 'Vídeos em destaque';
		headingSubtitle = subtitle?.trim?.() || layoutConfig?.headingSubtitle || '';
	}

	function normalizeRows(rows = []) {
		return rows
			.map((raw, index) => {
				const lookup = createLookup(raw);
				const uuid = raw?.uuid || raw?.id || lookup.get('uuid') || lookup.get('id') || `video-${index}`;
				const title = pickValue(lookup, COLUMN_ALIASES.title) || `Vídeo ${index + 1}`;
				const subtitle = pickValue(lookup, COLUMN_ALIASES.subtitle);
				const theme = pickValue(lookup, COLUMN_ALIASES.theme) || 'Outros temas';
				const thumbnail = pickValue(lookup, COLUMN_ALIASES.thumbnail);
				const globoId = pickValue(lookup, COLUMN_ALIASES.globoId);
				const globoIdDesktop = pickValue(lookup, COLUMN_ALIASES.globoIdDesktop) || globoId;
				const globoIdMobile = pickValue(lookup, COLUMN_ALIASES.globoIdMobile) || globoId;
				const link = pickValue(lookup, COLUMN_ALIASES.link);
				const tag = pickValue(lookup, COLUMN_ALIASES.tag);
				const publishedAt = pickValue(lookup, COLUMN_ALIASES.publishedAt);

				if (!globoId) return null;

				return {
					uuid,
					title,
					subtitle,
					theme,
					thumbnail,
					globoId,
					globoIdDesktop,
					globoIdMobile,
					link,
					tag,
					publishedAt
				};
			})
			.filter(Boolean);
	}

	function createLookup(row = {}) {
		const lookup = new Map();
		for (const [key, value] of Object.entries(row)) {
			if (!key) continue;
			const safeKey = sanitizeHeader(key);
			lookup.set(key, value);
			lookup.set(key.toLowerCase(), value);
			lookup.set(safeKey, value);
		}
		return lookup;
	}

	function pickValue(lookup, aliases = []) {
		for (const alias of aliases) {
			const value = lookup.get(alias);
			if (value !== undefined && value !== null && String(value).trim() !== '') {
				return typeof value === 'string' ? value.trim() : value;
			}
		}
		return '';
	}

	function buildSections(list = []) {
		const groups = new Map();
		for (const video of list) {
			const key = video.theme || 'Outros temas';
			if (!groups.has(key)) {
				groups.set(key, []);
			}
			groups.get(key).push(video);
		}
		return Array.from(groups.entries()).map(([label, items]) => ({
			label,
			anchor: slugify(label),
			videos: items
		}));
	}

	function slugify(value = '') {
		return value
			.toString()
			.normalize('NFD')
			.replace(/[^a-zA-Z0-9\s-]/g, '')
			.trim()
			.replace(/\s+/g, '-')
			.toLowerCase();
	}

	function openVideo(video) {
		selectedVideo = video;
		overlayVisible = true;
		lockScroll();
		if (browser) {
			void ensureGloboPlayer();
		}
	}

	function closeOverlay() {
		overlayVisible = false;
		selectedVideo = null;
		unlockScroll();
	}

	function lockScroll() {
		if (!browser || bodyScrollLocked) return;
		document.body.classList.add(BODY_LOCK_CLASS);
		bodyScrollLocked = true;
	}

	function unlockScroll() {
		if (!browser || !bodyScrollLocked) return;
		document.body.classList.remove(BODY_LOCK_CLASS);
		bodyScrollLocked = false;
	}

	function parseCsvDataset(text) {
		if (!text) return [];
		const lines = text
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter((line) => line.length);
		if (!lines.length) return [];
		const headers = parseCsvLine(lines.shift());
		return lines.map((line) => {
			const values = parseCsvLine(line);
			const entry = {};
			headers.forEach((header, index) => {
				if (!header) return;
				const rawKey = header.trim();
				const safeKey = sanitizeHeader(rawKey);
				const value = values[index] ?? '';
				entry[rawKey] = value;
				if (safeKey && safeKey !== rawKey) {
					entry[safeKey] = value;
				}
			});
			return entry;
		});
	}

	function parseCsvLine(line = '') {
		const result = [];
		let current = '';
		let inQuotes = false;
		for (let index = 0; index < line.length; index += 1) {
			const char = line[index];
			if (char === '"') {
				if (inQuotes && line[index + 1] === '"') {
					current += '"';
					index += 1;
				} else {
					inQuotes = !inQuotes;
				}
			} else if (char === ',' && !inQuotes) {
				result.push(current);
				current = '';
			} else {
				current += char;
			}
		}
		result.push(current);
		return result.map((value) => value.trim());
	}

	async function ensureGloboPlayer() {
		if (GloboPlayerComponent || globoPlayerImporting) {
			return GloboPlayerComponent;
		}
		globoPlayerImporting = true;
		globoPlayerImportError = null;
		try {
			const module = await import('./GloboPlayer.svelte');
			GloboPlayerComponent = module.default;
		} catch (error) {
			console.error('VideoSheetShowcase: falha ao carregar GloboPlayer dinamicamente', error);
			globoPlayerImportError = 'Não foi possível carregar o player agora.';
		} finally {
			globoPlayerImporting = false;
		}
		return GloboPlayerComponent;
	}
</script>

<div class="video-sheet-showcase" data-debug={debug ? 'true' : undefined}>
	<header class="video-sheet-showcase__heading">
		<h1>{headingTitle}</h1>
		{#if headingSubtitle}
			<p>{headingSubtitle}</p>
		{/if}
	</header>

	{#if loading}
		<div class="status status--loading">{loadingMessage}</div>
	{:else if error}
		<div class="status status--error">
			<p>{error}</p>
			<button type="button" on:click={loadSheet}>Tentar novamente</button>
		</div>
	{:else if !sections.length}
		<div class="status status--empty">{emptyStateMessage}</div>
	{:else}
		{#each sections as section (section.anchor)}
			<section id={section.anchor} class="video-section">
				<header>
					<h2>{section.label}</h2>
					<span class="section-count">{section.videos.length}</span>
				</header>
				<div class="video-grid">
					{#each section.videos as video (video.uuid)}
						<article class="video-card">
							<button type="button" class="video-card__media" on:click={() => openVideo(video)}>
								{#if video.thumbnail}
									<img src={video.thumbnail} alt={video.title} loading="lazy" />
								{:else}
									<div class="video-card__placeholder">
										<span>{video.title}</span>
									</div>
								{/if}
							</button>
							<div class="video-card__meta">
								{#if video.tag}
									<span class="video-card__tag">{video.tag}</span>
								{/if}
								<h3>{video.title}</h3>
								{#if video.subtitle}
									<p>{video.subtitle}</p>
								{/if}
								{#if video.publishedAt}
									<small>{video.publishedAt}</small>
								{/if}
								{#if video.link}
									<a href={video.link} target="_blank" rel="noopener noreferrer">Saiba mais</a>
								{/if}
							</div>
						</article>
					{/each}
				</div>
			</section>
		{/each}
	{/if}
</div>

{#if overlayVisible && selectedVideo}
	<div class="overlay" role="dialog" aria-modal="true" aria-label={selectedVideo.title}>
		<div class="overlay__surface" on:click|stopPropagation>
			<button type="button" class="overlay__close" on:click={closeOverlay} aria-label="Fechar vídeo">×</button>
			<div class="overlay__player">
				{#if GloboPlayerComponent}
					<svelte:component
						this={GloboPlayerComponent}
						videoId={selectedVideo.globoId}
						videoIdDesktop={selectedVideo.globoIdDesktop}
						videoIdMobile={selectedVideo.globoIdMobile}
						autoPlay={true}
						startMuted={false}
						controls={true}
						aspectRatio="16 / 9"
					/>
				{:else if globoPlayerImportError}
					<div class="overlay__player-feedback overlay__player-feedback--error">
						<p>{globoPlayerImportError}</p>
						<button type="button" on:click={() => void ensureGloboPlayer()}>Tentar novamente</button>
					</div>
				{:else}
					<div class="overlay__player-feedback">
						<div class="spinner"></div>
						<p>Carregando player...</p>
					</div>
				{/if}
			</div>
			<div class="overlay__meta">
				<h2>{selectedVideo.title}</h2>
				{#if selectedVideo.subtitle}
					<p>{selectedVideo.subtitle}</p>
				{/if}
				{#if selectedVideo.link}
					<a href={selectedVideo.link} target="_blank" rel="noopener noreferrer">Ler reportagem completa</a>
				{/if}
			</div>
		</div>
		<button type="button" class="overlay__backdrop" on:click={closeOverlay} aria-label="Fechar vídeo"></button>
	</div>
{/if}

{#if debug}
	<pre class="debug">
{JSON.stringify({
		loading,
		error,
		videos: videos.length,
		sections: sections.length,
		selectedVideo: selectedVideo?.uuid ?? null
	}, null, 2)}
	</pre>
{/if}

<style>
	:global(body.video-sheet-showcase--lock-scroll) {
		overflow: hidden;
	}

	.video-sheet-showcase {
		--gap: clamp(1rem, 2vw, 2rem);
		--card-radius: 1.25rem;
		--card-bg: rgba(255, 255, 255, 0.85);
		display: flex;
		flex-direction: column;
		gap: var(--gap);
		padding: clamp(1.5rem, 4vw, 3rem);
	}

	.video-sheet-showcase__heading {
		text-align: center;
		margin-bottom: 1rem;
	}

	.video-sheet-showcase__heading h1 {
		font-size: clamp(2rem, 4vw, 3rem);
		margin: 0;
	}

	.video-sheet-showcase__heading p {
		margin: 0.35rem 0 0;
		color: rgba(15, 23, 42, 0.72);
	}

	.status {
		text-align: center;
		padding: 2rem;
		border-radius: var(--card-radius);
		background: var(--card-bg);
	}

	.video-section {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.video-section > header {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
	}

	.video-section h2 {
		margin: 0;
		font-size: clamp(1.6rem, 3vw, 2.2rem);
	}

	.section-count {
		font-size: 0.95rem;
		color: rgba(15, 23, 42, 0.6);
	}

	.video-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: clamp(1rem, 2vw, 1.5rem);
	}

	.video-card {
		background: var(--card-bg);
		border-radius: var(--card-radius);
		box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.video-card__media {
		border: none;
		padding: 0;
		margin: 0;
		background: transparent;
		cursor: pointer;
	}

	.video-card__media img {
		width: 100%;
		display: block;
		height: clamp(180px, 28vw, 240px);
		object-fit: cover;
	}

	.video-card__placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: clamp(180px, 28vw, 240px);
		background: rgba(15, 23, 42, 0.08);
		color: rgba(15, 23, 42, 0.7);
		padding: 1rem;
		text-align: center;
	}

	.video-card__meta {
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.video-card__meta h3 {
		margin: 0;
		font-size: 1.1rem;
	}

	.video-card__meta p {
		margin: 0;
		color: rgba(15, 23, 42, 0.7);
		font-size: 0.95rem;
	}

	.video-card__meta small {
		color: rgba(15, 23, 42, 0.5);
	}

	.video-card__meta a {
		margin-top: 0.5rem;
		font-weight: 600;
	}

	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
	}

	.overlay__backdrop {
		position: absolute;
		inset: 0;
		background: rgba(6, 11, 25, 0.75);
		border: none;
	}

	.overlay__surface {
		position: relative;
		width: min(960px, 92vw);
		max-height: 92vh;
		background: #05070f;
		border-radius: 1.5rem;
		padding: clamp(1rem, 3vw, 1.75rem);
		color: #fff;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		z-index: 1;
	}

	.overlay__close {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: rgba(255, 255, 255, 0.15);
		border: none;
		width: 32px;
		height: 32px;
		border-radius: 999px;
		color: #fff;
		font-size: 1.2rem;
		cursor: pointer;
	}

	.overlay__player {
		border-radius: 1rem;
		overflow: hidden;
		background: #000;
	}

	.overlay__player-feedback {
		min-height: 320px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		text-align: center;
		padding: 2rem;
		color: #e2e8f0;
	}

	.overlay__player-feedback--error {
		color: #fecaca;
	}

	.overlay__player-feedback button {
		border: none;
		border-radius: 999px;
		padding: 0.5rem 1.25rem;
		background: rgba(255, 255, 255, 0.15);
		color: #fff;
		font-weight: 600;
		cursor: pointer;
	}

	.overlay__player-feedback .spinner {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		border: 4px solid rgba(255, 255, 255, 0.2);
		border-top-color: #fff;
		animation: spin 1s ease-in-out infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.overlay__meta h2 {
		margin: 0 0 0.5rem;
	}

	.overlay__meta p {
		margin: 0;
		color: rgba(255, 255, 255, 0.75);
	}

	@media (max-width: 640px) {
		.video-section > header {
			flex-direction: column;
			align-items: flex-start;
		}

		.overlay__surface {
			padding-top: 2.5rem;
		}

		.overlay__close {
			top: 0.75rem;
			right: 0.75rem;
		}
	}

	.debug {
		margin-top: 2rem;
		background: #0f172a;
		color: #f8fafc;
		padding: 1rem;
		border-radius: 1rem;
		font-size: 0.85rem;
		overflow: auto;
	}
</style>
