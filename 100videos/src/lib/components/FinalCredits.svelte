<script>
	export let title = 'Créditos';
	export let groups = [];
	export let groupsText = '';
	export let sections = [];
	export let authors = [];
	export let sources = [];
	export let additionalGraphics = [];
	export let editedBy = [];
	export let notes = '';

	export let backgroundColor = '';
	export let textColor = '';
	export let titleColor = '';
	export let borderColor = '';
	export let backgroundImage = '';
	export let backgroundImageMobile = '';
	export let backgroundVideo = '';
	export let backgroundVideoMobile = '';
	export let backgroundPosition = 'center center';
	export let backgroundPositionMobile = '';
	export let backgroundSize = 'cover';
	export let backgroundSizeMobile = '';
	export let overlay = false;
	export let overlayColor = 'rgba(0, 0, 0, 0.4)';
	export let maxWidth = '960px';
	export let paddingDesktop = '3rem 1.5rem';
	export let paddingMobile = '2.5rem 1.25rem';
	export let customClass = '';

	const toArray = (value) => {
		if (!value) return [];
		if (Array.isArray(value)) return value.filter(Boolean);
		if (typeof value === 'string')
			return value
				.split(/\r?\n/)
				.map((item) => item.trim())
				.filter(Boolean);
		return [];
	};

	function formatLegacyEntry(entry) {
		if (!entry) return '';
		if (typeof entry === 'string') return entry.trim();

		if (typeof entry === 'object') {
			const name = entry.name || entry.title || entry.primary || entry.label || entry.text || '';
			const role = entry.role || entry.secondary || entry.subtitle || '';
			const detail = entry.detail || entry.description || entry.note || '';
			return [name, role, detail]
				.map((part) => (typeof part === 'string' ? part.trim() : ''))
				.filter(Boolean)
				.join(' – ');
		}

		return '';
	}

	function parseGroupsText(text) {
		if (!text || typeof text !== 'string') return [];

		return text
			.split(/\r?\n\s*\r?\n/)
			.map((block) => block.trim())
			.filter(Boolean)
			.map((block, index) => {
				const lines = block
					.split(/\r?\n/)
					.map((line) => line.trim())
					.filter(Boolean);

				if (lines.length === 0) return null;

				const [firstLine, ...restLines] = lines;
				const separatorIndex = firstLine.indexOf(':');
				let groupTitle = '';
				let remainder = '';

				if (separatorIndex !== -1) {
					groupTitle = firstLine.slice(0, separatorIndex).trim();
					remainder = firstLine.slice(separatorIndex + 1).trim();
				} else {
					groupTitle = firstLine.trim();
				}

				const names = [remainder, ...restLines].filter(Boolean).join('\n');

				return {
					id: `text-group-${index}`,
					title: groupTitle,
					names
				};
			})
			.filter((group) => group && (group.title || group.names));
	}

	function normalizeGroup(group, index, namespace) {
		if (!group) return null;

		if (typeof group === 'string') {
			return {
				id: `${namespace}-group-${index}`,
				title: '',
				names: group.trim()
			};
		}

		if (typeof group === 'object') {
			const title = group.title || group.name || group.label || '';
			const namesValue = Array.isArray(group.names)
				? group.names.map(formatLegacyEntry).filter(Boolean).join('\n')
				: group.names || group.text || '';

			const itemsValue = Array.isArray(group.items)
				? group.items.map(formatLegacyEntry).filter(Boolean).join('\n')
				: '';

			const names = [namesValue, itemsValue]
				.map((value) => (typeof value === 'string' ? value.trim() : ''))
				.filter(Boolean)
				.join('\n');

			const description = typeof group.description === 'string' ? group.description.trim() : '';

			const finalNames = names || description;

			if (!title && !finalNames) return null;

			return {
				id: group.id || `${namespace}-group-${index}`,
				title: title,
				names: finalNames
			};
		}

		return null;
	}

	function normalizeSections(sectionList) {
		if (!Array.isArray(sectionList)) return [];

		return sectionList
			.map((section, index) => normalizeGroup(section, index, 'section'))
			.filter(Boolean);
	}

	function buildLegacyGroups() {
		const legacyEntries = [
			{ title: 'Autores', data: authors },
			{ title: 'Fontes', data: sources },
			{ title: 'Contribuições gráficas adicionais', data: additionalGraphics },
			{ title: 'Edição', data: editedBy }
		];

		const groupsFromLegacy = legacyEntries
			.map(({ title, data }, index) => {
				const entries = toArray(data).map(formatLegacyEntry).filter(Boolean);
				if (!entries.length) return null;

				return {
					id: `legacy-group-${index}`,
					title,
					names: entries.join('\n')
				};
			})
			.filter(Boolean);

		if (typeof notes === 'string' && notes.trim()) {
			groupsFromLegacy.push({
				id: 'legacy-notes',
				title: 'Notas',
				names: notes.trim()
			});
		}

		return groupsFromLegacy;
	}

	function normalizeExplicitGroups(groupList) {
		if (!Array.isArray(groupList)) return [];

		return groupList
			.map((group, index) => normalizeGroup(group, index, 'explicit'))
			.filter(Boolean);
	}

	function safeDecode(source) {
		if (typeof source !== 'string' || !source.trim()) return '';
		try {
			return decodeURIComponent(source);
		} catch (error) {
			return source;
		}
	}

	let normalizedGroups = [];
	let backgroundImageDesktop = '';
	let backgroundImageMobileDecoded = '';
	let backgroundVideoDesktop = '';
	let backgroundVideoMobileDecoded = '';
	let hasDesktopMedia = false;
	let hasMobileMedia = false;
	let hasAnyMedia = false;
	let styleTokens = '';

	$: normalizedGroups = (() => {
		const explicit = normalizeExplicitGroups(groups);
		if (explicit.length) return explicit;

		const fromText = parseGroupsText(groupsText);
		if (fromText.length) return fromText;

		const fromSections = normalizeSections(sections);
		if (fromSections.length) return fromSections;

		return buildLegacyGroups();
	})();

	$: backgroundImageDesktop = safeDecode(backgroundImage);
	$: backgroundImageMobileDecoded = safeDecode(backgroundImageMobile);
	$: backgroundVideoDesktop = safeDecode(backgroundVideo);
	$: backgroundVideoMobileDecoded = safeDecode(backgroundVideoMobile);

	$: hasDesktopMedia = Boolean(backgroundImageDesktop || backgroundVideoDesktop);
	$: hasMobileMedia = Boolean(backgroundImageMobileDecoded || backgroundVideoMobileDecoded);
	$: hasAnyMedia = hasDesktopMedia || hasMobileMedia;

	$: styleTokens = [
		backgroundColor ? `--credits-bg:${backgroundColor}` : '',
		textColor ? `--credits-text:${textColor}` : '',
		titleColor ? `--credits-title:${titleColor}` : '',
		borderColor ? `--credits-border:${borderColor}` : '',
		maxWidth ? `--credits-max-width:${maxWidth}` : '',
		paddingDesktop ? `--credits-padding-desktop:${paddingDesktop}` : '',
		paddingMobile ? `--credits-padding-mobile:${paddingMobile}` : ''
	]
		.filter(Boolean)
		.join('; ');
</script>

{#if normalizedGroups.length === 0}
	<!-- Nada para exibir, então não renderizamos o componente -->
{:else}
	<footer
		class={`final-credits ${hasAnyMedia ? 'final-credits--has-media' : ''} ${customClass}`}
		aria-labelledby="credits-heading"
		style={styleTokens}
	>
		{#if hasDesktopMedia}
			{#if backgroundImageDesktop}
				<div
					class="final-credits__background final-credits__background--desktop"
					style={`background-image:url(${backgroundImageDesktop});background-position:${backgroundPosition};background-size:${backgroundSize};`}
				></div>
			{/if}
			{#if backgroundVideoDesktop}
				<video
					class="final-credits__video final-credits__video--desktop"
					autoplay
					loop
					muted
					playsinline
				>
					<source src={backgroundVideoDesktop} type="video/mp4" />
				</video>
			{/if}
		{/if}

		{#if hasMobileMedia}
			{#if backgroundImageMobileDecoded}
				<div
					class="final-credits__background final-credits__background--mobile"
					style={`background-image:url(${backgroundImageMobileDecoded});background-position:${backgroundPositionMobile || backgroundPosition};background-size:${backgroundSizeMobile || backgroundSize};`}
				></div>
			{/if}
			{#if backgroundVideoMobileDecoded}
				<video
					class="final-credits__video final-credits__video--mobile"
					autoplay
					loop
					muted
					playsinline
				>
					<source src={backgroundVideoMobileDecoded} type="video/mp4" />
				</video>
			{/if}
		{/if}

		{#if overlay && overlayColor}
			<div class="final-credits__overlay" style={`background:${overlayColor}`}></div>
		{/if}

		<div class="final-credits__content">
			<div class="final-credits__inner">
				{#if title}
					<h2 id="credits-heading" class="final-credits__title">{title}</h2>
				{/if}

				{#each normalizedGroups as group}
					<section class="credits-group" data-id={group.id}>
						{#if group.title}
							<h3 class="credits-group__title">{group.title}</h3>
						{/if}
						{#if group.names}
							<p class="credits-group__names">{group.names}</p>
						{/if}
					</section>
				{/each}
			</div>
		</div>
	</footer>
{/if}

<style>
	.final-credits {
		--credits-bg: #f8fafc;
		--credits-text: #0f172a;
		--credits-title: #0f172a;
		--credits-border: rgba(148, 163, 184, 0.4);
		--credits-max-width: 960px;
		--credits-padding-desktop: 3rem 1.5rem;
		--credits-padding-mobile: 2.5rem 1.25rem;
		position: relative;
		overflow: hidden;
		background-color: var(--credits-bg);
		color: var(--credits-text);
		border-top: 1px solid var(--credits-border);
	}

	.final-credits__background,
	.final-credits__video,
	.final-credits__overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 1;
	}

	.final-credits__background {
		background-repeat: no-repeat;
		background-size: cover;
		background-position: center;
	}

	.final-credits__video {
		object-fit: cover;
	}

	.final-credits__overlay {
		z-index: 2;
		mix-blend-mode: normal;
	}

	.final-credits__content {
		position: relative;
		z-index: 3;
		padding: var(--credits-padding-desktop);
	}

	.final-credits__inner {
		max-width: var(--credits-max-width);
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
	}

	.final-credits__title {
		margin: 0;
		font-size: clamp(1.75rem, 3vw, 2.5rem);
		font-weight: 700;
		letter-spacing: -0.01em;
		color: var(--credits-title);
	}

	.credits-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.credits-group__title {
		margin: 0;
		font-size: clamp(1.15rem, 2.5vw, 1.6rem);
		font-weight: 600;
		color: var(--credits-title);
	}

	.credits-group__names {
		margin: 0;
		font-size: clamp(1rem, 2.2vw, 1.15rem);
		line-height: 1.6;
		white-space: pre-line;
	}

	@media (prefers-color-scheme: dark) {
		.final-credits {
			--credits-bg: rgba(15, 23, 42, 0.6);
			--credits-text: #e2e8f0;
			--credits-title: #e2e8f0;
			--credits-border: rgba(148, 163, 184, 0.25);
		}
	}

	.final-credits__video,
	.final-credits__background {
		display: none;
	}

	.final-credits__background--desktop,
	.final-credits__video--desktop {
		display: block;
	}

	@media (max-width: 768px) {
		.final-credits__content {
			padding: var(--credits-padding-mobile);
		}

		.final-credits__inner {
			gap: 1.5rem;
		}

		.final-credits__background--desktop,
		.final-credits__video--desktop {
			display: none;
		}

		.final-credits__background--mobile,
		.final-credits__video--mobile {
			display: block;
		}
	}
</style>
