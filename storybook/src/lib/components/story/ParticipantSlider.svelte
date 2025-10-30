<script>
	import { tick, createEventDispatcher, onMount } from 'svelte';
	import {
		participantActions,
		participantsList,
		selectedParticipant,
		selectedEmergency,
		selectedChallenge,
		selectedStillTime,
		selectedOptimismScore,
		activeGrouping as activeGroupingMode
	} from '$lib/stores/participantStore.js';

	const { selectById } = participantActions;
	const dispatch = createEventDispatcher();

	export let mode = 'sticky'; // 'static' | 'sticky' | 'fixed'
	export let position = 'bottom'; // 'top' | 'bottom'
	export let maxWidth = 1280;
export let background = '#0c1d27';
export let blur = true;
export let reserveSpace = true;
export let collapsible = false;

const FIXED_HEIGHT = 128;
	const MOBILE_BREAKPOINT = 768;
	const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT}px)`;
	const FILTER_CONTROLS_ID = 'participant-slider-filters';

	let scroller;
	let lastGroup = null;
let searchTerm = '';
let locationFilter = '';
let areaFilter = '';
let locations = [];
let areas = [];
let names = [];
let matchedParticipant = null;
let locationLocked = false;
let areaLocked = false;
let normalizedLocationFilter = null;
let normalizedAreaFilter = null;
let participantsForLocationOptions = [];
let participantsForAreaOptions = [];
let participantsForNameOptions = [];
let isMobileViewport = false;
let mobileFiltersOpen = true;

	onMount(() => {
		if (typeof window === 'undefined') return;

		const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);

		function applyViewportState(matches) {
			const wasMobile = isMobileViewport;
			isMobileViewport = matches;
			if (!matches) {
				mobileFiltersOpen = true;
			} else if (!wasMobile && matches) {
				mobileFiltersOpen = false;
			}
		}

		applyViewportState(mediaQuery.matches);

		const handleChange = (event) => applyViewportState(event.matches);
		mediaQuery.addEventListener('change', handleChange);

		return () => {
			mediaQuery.removeEventListener('change', handleChange);
		};
	});

	function toggleMobileFilters() {
		mobileFiltersOpen = !mobileFiltersOpen;
	}

function normalizeGroup(value) {
	if (value === undefined || value === null) return null;
	const normalized = String(value)
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();
	return normalized.length ? normalized : null;
}

	function normalizeScore(value) {
		const numeric = Number(value);
		return Number.isFinite(numeric) ? numeric : null;
	}

	function getParticipantGroup(participant, field = 'emergencyFocus') {
		if (field === 'optimismScore') {
			return normalizeScore(participant?.optimismScore);
		}
		return normalizeGroup(participant?.[field]);
	}

	function reorderParticipants(list = [], group, field = 'emergencyFocus') {
		const normalizedGroup = normalizeGroup(group);
		if (normalizedGroup === null) return list;

		const matches = [];
		const others = [];

		for (const participant of list) {
			const participantGroup = getParticipantGroup(participant, field);
			if (participantGroup === normalizedGroup) {
				matches.push(participant);
			} else {
				others.push(participant);
			}
		}

		return [...matches, ...others];
	}

	function reorderByOptimism(list = [], score) {
		const normalizedScore = normalizeScore(score);
		if (!Number.isFinite(normalizedScore)) return list;

		const matches = [];
		const others = [];

		for (const participant of list) {
			const participantScore = normalizeScore(participant?.optimismScore);
			if (participantScore === normalizedScore) {
				matches.push(participant);
			} else {
				others.push(participant);
			}
		}

		return [...matches, ...others];
	}

	function isSameGroup(participant, value, field) {
		if (field === 'optimismScore') {
			const participantScore = normalizeScore(participant?.optimismScore);
			const normalizedValue = normalizeScore(value);
			return (
				participantScore !== null &&
				normalizedValue !== null &&
				participantScore === normalizedValue
			);
		}
		return normalizeGroup(participant?.[field]) === normalizeGroup(value);
	}

	function normalizeText(value) {
		return String(value || '')
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase()
			.trim();
	}

function buildDistinctOptions(list = [], field) {
	const map = new Map();
	for (const participant of list) {
		const raw = participant?.[field];
		if (raw === undefined || raw === null) continue;
		const normalized = normalizeGroup(raw);
		if (!normalized || map.has(normalized)) continue;
		map.set(normalized, String(raw).trim());
	}
	return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
}

function buildDistinctNames(list = []) {
	const items = [];
	const seen = new Set();
	for (const participant of list) {
		if (!participant?.name) continue;
		const trimmed = participant.name.trim();
		if (!trimmed) continue;
		const key = normalizeText(trimmed);
		if (seen.has(key)) continue;
		seen.add(key);
		items.push(trimmed);
	}
	return items.sort((a, b) => a.localeCompare(b));
}

function findParticipantByName(list = [], name = '') {
	const normalized = normalizeText(name);
	if (!normalized) return null;
	return (
		list.find((participant) => normalizeText(participant?.name) === normalized) || null
	);
}

function applyFilters(
	list = [],
	{ search = '', location = '', area = '', selected = null } = {}
) {
	if (!list.length) return list;
	if (selected?.id) {
		return list.filter((participant) => participant.id === selected.id);
	}
	const searchNormalized = normalizeText(search);
	const locationNormalized = normalizeGroup(location);
	const areaNormalized = normalizeGroup(area);

	return list.filter((participant) => {
		if (searchNormalized) {
			const nameMatch = normalizeText(participant?.name).includes(searchNormalized);
			if (!nameMatch) return false;
		}
		if (locationNormalized) {
			if (normalizeGroup(participant?.location) !== locationNormalized) {
				return false;
			}
		}
		if (areaNormalized) {
			if (normalizeGroup(participant?.area) !== areaNormalized) {
				return false;
			}
		}
		return true;
	});
}

	$: groupingMode = $activeGroupingMode;
	$: activeEmergency = normalizeGroup($selectedEmergency);
	$: activeChallenge = normalizeGroup($selectedChallenge);
	$: activeStillTime = normalizeGroup($selectedStillTime);
	$: activeOptimism = normalizeScore($selectedOptimismScore);
	$: currentGrouping = (() => {
		switch (groupingMode) {
			case 'stillTime':
				return activeStillTime
					? { field: 'stillTime', value: activeStillTime, type: 'stillTime' }
					: null;
			case 'challenge':
				return activeChallenge
					? { field: 'challenge2050', value: activeChallenge, type: 'challenge' }
					: null;
			case 'optimism':
				return activeOptimism !== null
					? { field: 'optimismScore', value: activeOptimism, type: 'optimism' }
					: null;
			case 'participant-focus':
				return null;
			case 'emergency':
				return activeEmergency
					? { field: 'emergencyFocus', value: activeEmergency, type: 'emergency' }
					: null;
			default:
				return activeEmergency
					? { field: 'emergencyFocus', value: activeEmergency, type: 'emergency' }
					: null;
		}
	})();
	$: allParticipants = $participantsList || [];
	$: normalizedLocationFilter = normalizeGroup(locationFilter);
	$: normalizedAreaFilter = normalizeGroup(areaFilter);
	$: participantsForLocationOptions =
		normalizedAreaFilter
			? allParticipants.filter(
					(participant) => normalizeGroup(participant?.area) === normalizedAreaFilter
				)
			: allParticipants;
	$: participantsForAreaOptions =
		normalizedLocationFilter
			? allParticipants.filter(
					(participant) => normalizeGroup(participant?.location) === normalizedLocationFilter
				)
			: allParticipants;
	$: participantsForNameOptions = allParticipants.filter((participant) => {
		if (
			normalizedLocationFilter &&
			normalizeGroup(participant?.location) !== normalizedLocationFilter
		) {
			return false;
		}
		if (normalizedAreaFilter && normalizeGroup(participant?.area) !== normalizedAreaFilter) {
			return false;
		}
		return true;
	});
	$: locations = buildDistinctOptions(participantsForLocationOptions, 'location');
	$: areas = buildDistinctOptions(participantsForAreaOptions, 'area');
	$: names = buildDistinctNames(participantsForNameOptions);
	$: matchedParticipant = findParticipantByName(allParticipants, searchTerm);
	$: locationLocked = Boolean(matchedParticipant);
	$: areaLocked = Boolean(matchedParticipant);
	$: {
		if (matchedParticipant) {
			const locationValue =
				matchedParticipant.location === undefined || matchedParticipant.location === null
					? ''
					: String(matchedParticipant.location).trim();
			const areaValue =
				matchedParticipant.area === undefined || matchedParticipant.area === null
					? ''
					: String(matchedParticipant.area).trim();
			if (locationValue !== locationFilter) {
				locationFilter = locationValue;
			}
			if (areaValue !== areaFilter) {
				areaFilter = areaValue;
			}
		}
	}
	$: filteredParticipants = applyFilters(allParticipants, {
		search: searchTerm,
		location: locationFilter,
		area: areaFilter,
		selected: matchedParticipant
	});
	$: roster =
		currentGrouping?.type === 'optimism'
			? reorderByOptimism(filteredParticipants || [], currentGrouping?.value)
			: reorderParticipants(
					filteredParticipants || [],
					currentGrouping?.value,
					currentGrouping?.field
				);
	$: activeId = $selectedParticipant?.id || null;
	$: groupValue = currentGrouping ? currentGrouping.value : null;
	$: groupField = currentGrouping?.field || 'emergencyFocus';
	$: hasGroup =
		currentGrouping?.type === 'optimism'
			? Number.isFinite(currentGrouping?.value)
			: Boolean(currentGrouping?.value);
	$: shellStyle = `--slider-max-width:${maxWidth}px; --slider-bg:${background}; --slider-fixed-height:${FIXED_HEIGHT}px;`;
	$: if (scroller && currentGrouping?.value !== lastGroup) {
		lastGroup = currentGrouping?.value;
		scroller.scrollTo({ left: 0, behavior: 'auto' });
	}
	$: {
		if (
			filteredParticipants.length &&
			activeId &&
			!filteredParticipants.some((participant) => participant.id === activeId)
		) {
			handleSelect(filteredParticipants[0]?.id);
		}
	}

	function handleSelect(id) {
		if (!id) return;
		selectById(id);
	}

	function handleMore(participant) {
		if (!participant?.id) return;
		handleSelect(participant.id);
		dispatch('openProfile', { id: participant.id });
	}

	function getInitials(name) {
		if (!name) return '?';
		const clean = name.replace(/\s+/g, ' ').trim().split(',').shift();
		const parts = clean ? clean.split(' ') : [];
		if (!parts.length) return '?';
		const first = parts[0]?.[0] || '';
		const second = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '';
		return `${first}${second}`.toUpperCase();
	}

	function getDisplayName(name) {
		if (!name) return '';
		const [rawName] = name.split(',');
		const trimmed = rawName.trim();
		const parts = trimmed.split(/\s+/);
		if (parts.length <= 1) return trimmed;
		const first = parts[0];
		const lastInitial = parts[parts.length - 1][0];
		return `${first} ${lastInitial.toUpperCase()}.`;
	}

	async function ensureActiveVisible() {
		if (!scroller || !activeId) return;
		await tick();
		const activeEl = scroller.querySelector(`[data-participant-id="${activeId}"]`);
		if (!activeEl) return;

		const { left: containerLeft, right: containerRight } = scroller.getBoundingClientRect();
		const { left, right } = activeEl.getBoundingClientRect();

		if (left < containerLeft + 16) {
			scroller.scrollBy({ left: left - containerLeft - 16, behavior: 'smooth' });
		} else if (right > containerRight - 16) {
			scroller.scrollBy({ left: right - containerRight + 16, behavior: 'smooth' });
		}
	}

	$: {
		if (groupingMode === 'participant-focus') {
			ensureActiveVisible();
		}
	}

	function scrollSlider(direction = 1) {
		if (!scroller) return;
		const delta = Math.max(scroller.clientWidth * 0.6, 240);
		scroller.scrollBy({ left: delta * direction, behavior: 'smooth' });
	}

	function handleNext() {
		scrollSlider(1);
	}

	function handlePrevious() {
		scrollSlider(-1);
	}
</script>

	{#if allParticipants.length}
		<div
			class={`slider-shell slider-shell--${mode} slider-shell--${position} ${blur ? 'slider-shell--blur' : ''}`}
			class:slider-shell--group-active={hasGroup}
			class:slider-shell--participant-focus={groupingMode === 'participant-focus'}
			style={shellStyle}
		>
		<div class="slider-content">
			{#if collapsible}
				<div class="slider-header">
					<div class="slider-header__filters">
						{#if isMobileViewport}
							<button
								type="button"
								class="filter-toggle"
								on:click={toggleMobileFilters}
								aria-expanded={mobileFiltersOpen}
								aria-controls={FILTER_CONTROLS_ID}
							>
								Filtros
							</button>
						{/if}
						<div
							class="filter-pill"
							role="group"
							aria-label="Filtrar participantes"
							id={FILTER_CONTROLS_ID}
							class:filter-pill--collapsed={isMobileViewport && !mobileFiltersOpen}
							aria-hidden={isMobileViewport && !mobileFiltersOpen}
						>
							<label class="filter">
								<span class="sr-only">Buscar por nome</span>
								<input
									type="search"
									placeholder="Buscar por nome"
									bind:value={searchTerm}
									list="participant-names"
									aria-label="Buscar por nome"
								/>
							</label>
							<label class="filter">
								<span class="sr-only">Filtrar por localização</span>
								<input
									type="text"
									placeholder="Localização"
									bind:value={locationFilter}
									list="participant-locations"
									aria-label="Filtrar por localização"
									disabled={locationLocked}
									aria-disabled={locationLocked}
								/>
							</label>
							<label class="filter">
								<span class="sr-only">Filtrar por área de atuação</span>
								<input
									type="text"
									placeholder="Área de atuação"
									bind:value={areaFilter}
									list="participant-areas"
									aria-label="Filtrar por área de atuação"
									disabled={areaLocked}
									aria-disabled={areaLocked}
								/>
							</label>
						</div>
					</div>
					<button type="button" class="slider-collapse" on:click={() => dispatch('collapse')}>
						Ocultar
					</button>
				</div>
			{/if}
					{#if filteredParticipants.length}
						<div class="stories-slider">
							<button class="nav prev" aria-label="Participante anterior" on:click={handlePrevious}>
								<span aria-hidden="true">‹</span>
							</button>

							<div class="stories-list" bind:this={scroller}>
								{#each roster as participant (participant.id)}
									<div
										class="story-item"
										class:active={participant.id === activeId}
										class:same-group={hasGroup && isSameGroup(participant, groupValue, groupField)}
										class:dimmed={hasGroup && !isSameGroup(participant, groupValue, groupField)}
										data-participant-id={participant.id}
									>
										<button
											class="story-trigger"
											type="button"
											on:click={() => handleSelect(participant.id)}
										>
											<span class="ring">
												{#if participant.photo}
													<img
														src={participant.photo}
														alt={`Foto de ${participant.name}`}
														loading="lazy"
													/>
												{:else}
													<span class="initials">{getInitials(participant.name)}</span>
												{/if}
											</span>
											<span class="label">{getDisplayName(participant.name)}</span>
										</button>
										<button
											class="story-more"
											type="button"
											on:click|stopPropagation={() => handleMore(participant)}
											aria-label={`Abrir perfil de ${getDisplayName(participant.name)}`}
										>
											<span aria-hidden="true">+</span>
										</button>
									</div>
								{/each}
							</div>

							<button class="nav next" aria-label="Próximo participante" on:click={handleNext}>
								<span aria-hidden="true">›</span>
							</button>
						</div>
					{:else}
						<div class="slider-empty">
							<p>Nenhum participante encontrado. Ajuste os filtros.</p>
						</div>
					{/if}
			</div>
		</div>
	{/if}

{#if mode === 'fixed' && reserveSpace}
	<div class="slider-spacer" style={`height:${FIXED_HEIGHT + 20}px`}></div>
{/if}

{#if collapsible}
	<datalist id="participant-locations">
		{#each locations as location}
			<option value={location} />
		{/each}
	</datalist>
	<datalist id="participant-areas">
		{#each areas as item}
			<option value={item} />
		{/each}
	</datalist>
	<datalist id="participant-names">
		{#each names as nameOption}
			<option value={nameOption} />
		{/each}
	</datalist>
{/if}

<style>
	.slider-spacer {
		width: 100%;
	}

	.slider-shell {
		width: 100%;
		margin: 0 auto;
		padding: clamp(0.55rem, 1.8vw, 0.9rem) clamp(0.8rem, 3vw, 1.6rem);
		border-radius: 20px;
		background: var(--slider-bg, #0f1f2b);
		border: 1px solid rgba(244, 232, 210, 0.18);
		box-shadow: 0 24px 48px rgba(5, 12, 21, 0.42);
		color: #f8fafc;
	}

	.slider-content {
		width: min(var(--slider-max-width, 1200px), 100%);
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: clamp(0.45rem, 1.2vw, 0.7rem);
	}

	.slider-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: clamp(0.6rem, 1.8vw, 1.2rem);
	}

	.slider-header__filters {
		display: flex;
		align-items: center;
		gap: clamp(0.5rem, 1.6vw, 0.9rem);
		flex: 1;
		min-width: 0;
	}

	.filter-toggle {
		display: none;
		align-items: center;
		justify-content: center;
		padding: 0.45rem 0.75rem;
		border-radius: 999px;
		border: 1px solid rgba(244, 232, 210, 0.25);
		background: rgba(9, 26, 34, 0.5);
		color: inherit;
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			background 160ms ease,
			border-color 160ms ease;
	}

	.filter-toggle[aria-expanded='true'] {
		background: rgba(9, 26, 34, 0.7);
		border-color: rgba(244, 232, 210, 0.4);
	}

	.filter-toggle:focus-visible {
		outline: 2px solid rgba(244, 232, 210, 0.45);
		outline-offset: 2px;
	}

	.filter-pill {
		display: flex;
		align-items: center;
		gap: clamp(0.4rem, 1.2vw, 0.75rem);
		padding: 0.45rem clamp(0.6rem, 1.5vw, 0.9rem);
		border-radius: 999px;
		background: transparent;
		border: 1px solid rgba(244, 232, 210, 0.12);
		flex: 1;
		min-width: 0;
	}

	.filter-pill--collapsed {
		display: none !important;
	}

	.filter {
		position: relative;
		flex: 1;
		min-width: 0;
	}

	.filter input {
		width: 100%;
		padding: 0.4rem 0.75rem;
		border-radius: 999px;
		background: rgba(6, 18, 27, 0.18);
		border: 1px solid rgba(141, 168, 182, 0.24);
		color: inherit;
		font-size: 0.82rem;
		transition:
			border-color 160ms ease,
			background 160ms ease,
			box-shadow 160ms ease;
	}

	.filter input::placeholder {
		color: rgba(200, 212, 220, 0.7);
	}

	.filter input:focus-visible {
		outline: none;
		border-color: rgba(244, 232, 210, 0.4);
		background: rgba(9, 26, 34, 0.4);
		box-shadow: 0 0 0 2px rgba(244, 232, 210, 0.16);
	}

	.slider-collapse {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		white-space: nowrap;
		padding: 0.45rem 0.9rem;
		border-radius: 999px;
		background: rgba(9, 26, 34, 0.45);
		border: 1px solid rgba(244, 232, 210, 0.18);
		color: inherit;
		font-size: 0.82rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			background 160ms ease,
			transform 160ms ease,
			border-color 160ms ease;
	}

	.slider-collapse:hover {
		background: rgba(9, 26, 34, 0.62);
		border-color: rgba(244, 232, 210, 0.35);
		transform: translateY(-1px);
	}

	.slider-collapse:active {
		transform: translateY(0);
	}

	.slider-collapse:focus-visible {
		outline: 2px solid rgba(244, 232, 210, 0.35);
		outline-offset: 2px;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.slider-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 108px;
		border-radius: 18px;
		background: rgba(9, 26, 34, 0.4);
		border: 1px dashed rgba(244, 232, 210, 0.28);
		padding: 1.6rem;
		text-align: center;
		color: rgba(248, 250, 252, 0.75);
	}

	.slider-empty p {
		margin: 0;
		font-size: 0.92rem;
	}

	@media (max-width: 768px) {
		.slider-content {
			gap: 0.4rem;
		}

	.slider-header {
		display: grid;
		grid-template-columns: 1fr auto;
		grid-template-areas:
			'filters_toggle collapse'
			'filters filters';
		gap: 0.4rem;
		align-items: center;
	}

	.slider-header__filters {
		display: contents;
	}

	.filter-toggle {
		display: inline-flex;
		grid-area: filters_toggle;
		width: auto;
		justify-content: center;
	}

	.slider-collapse {
		grid-area: collapse;
		width: auto;
		justify-content: center;
	}

	.filter-pill {
		grid-area: filters;
		width: 100%;
	}

	.filter {
		width: 100%;
	}

	.filter input {
		padding: 0.42rem 0.7rem;
		font-size: 0.85rem;
	}

	.filter-pill {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.45rem;
		padding: 0.55rem clamp(0.6rem, 4vw, 1rem);
		border-radius: 18px;
	}

	.filter {
		width: 100%;
	}

	.filter input {
		width: 100%;
	}
	}


	.slider-shell--blur {
		backdrop-filter: blur(14px);
	}

	.slider-shell--sticky {
		position: sticky;
		z-index: 50;
	}

	.slider-shell--sticky.slider-shell--top {
		top: clamp(0.75rem, 3vw, 1.5rem);
	}

	.slider-shell--sticky.slider-shell--bottom {
		bottom: clamp(0.75rem, 3vw, 1.5rem);
	}

	.slider-shell--fixed {
		position: fixed;
		left: 0;
		right: 0;
		transform: none;
		width: 100%;
		z-index: 1200;
		margin: 0;
		border-radius: 0;
	}

	.slider-shell--fixed .slider-content {
		width: 100%;
		max-width: none;
	}

	.slider-shell--fixed.slider-shell--top {
		top: clamp(0.75rem, 3vw, 1.5rem);
	}

	.slider-shell--fixed.slider-shell--bottom {
		bottom: 0;
	}

	.stories-slider {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: clamp(0.35rem, 1vw, 0.75rem);
		width: 100%;
	}

	.nav {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: clamp(32px, 4.5vw, 40px);
		height: clamp(32px, 4.5vw, 40px);
		border-radius: 50%;
		border: 1px solid rgba(244, 232, 210, 0.26);
		background: rgba(9, 26, 34, 0.48);
		color: inherit;
		font-size: 1.35rem;
		cursor: pointer;
		transition:
			background 160ms ease,
			transform 160ms ease,
			border-color 160ms ease;
	}

	.nav:hover {
		background: rgba(210, 75, 63, 0.28);
		border-color: rgba(210, 75, 63, 0.6);
		transform: translateY(-1px);
	}

	.stories-list {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: minmax(80px, max-content);
		gap: clamp(0.18rem, 0.8vw, 0.4rem);
		overflow-x: auto;
		padding: 0.1rem 0.25rem;
		scroll-snap-type: x mandatory;
	}

	.stories-list::-webkit-scrollbar {
		height: 6px;
	}

	.stories-list::-webkit-scrollbar-thumb {
		background: rgba(244, 232, 210, 0.25);
		border-radius: 999px;
	}

	.story-item {
		--ring-size: 64px;
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(0.2rem, 0.7vw, 0.4rem);
		padding: 0.1rem 0.2rem;
		margin-right: clamp(0.28rem, 1.4vw, 0.55rem);
		scroll-snap-align: center;
	}

	.story-trigger {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(0.3rem, 0.9vw, 0.45rem);
		padding: 0;
		background: transparent;
		border: none;
		color: inherit;
		cursor: pointer;
		transition:
			transform 180ms ease,
			opacity 180ms ease;
	}

	.story-trigger:hover {
		transform: translateY(-3px);
	}

	.story-trigger:focus-visible {
		outline: 2px solid rgba(244, 232, 210, 0.45);
		outline-offset: 3px;
	}

	.slider-shell--group-active .story-item.same-group .story-trigger {
		opacity: 0.78;
	}

	.slider-shell--group-active .story-item.same-group .story-trigger .label {
		color: rgba(248, 250, 252, 0.88);
	}

	.slider-shell--group-active .story-item.same-group .ring {
		background: linear-gradient(135deg, #f29b54, #2a6b7a);
		padding: 3px;
	}

	.slider-shell--group-active .story-item.dimmed .story-trigger {
		opacity: 0.22;
	}

	.slider-shell--group-active .story-item.dimmed .label {
		color: rgba(248, 250, 252, 0.32);
	}

	.slider-shell--group-active .story-item.dimmed {
		filter: grayscale(1);
	}

	.slider-shell--group-active .story-item.dimmed .ring,
	.slider-shell--group-active .story-item.dimmed img,
	.slider-shell--group-active .story-item.dimmed .initials {
		filter: grayscale(1);
	}

	.slider-shell--group-active .story-item.dimmed .story-more {
		opacity: 0.35;
	}

	.slider-shell--group-active .story-item.active .ring {
		box-shadow: 0 0 0 3px rgba(240, 200, 97, 0.45);
	}

	.slider-shell--participant-focus .story-item.active .ring {
		background: rgba(210, 75, 63, 0.26);
		box-shadow: 0 0 0 3px rgba(210, 75, 63, 0.85);
	}

	.slider-shell--participant-focus .story-item.active img,
	.slider-shell--participant-focus .story-item.active .initials {
		border-color: rgba(210, 75, 63, 0.85);
		filter: grayscale(0);
	}

	.slider-shell--participant-focus .story-item:not(.active) .ring {
		background: rgba(141, 168, 182, 0.12);
		box-shadow: none;
	}

	.slider-shell--participant-focus .story-item:not(.active) img,
	.slider-shell--participant-focus .story-item:not(.active) .initials {
		border-color: transparent;
		filter: grayscale(1);
	}

	.slider-shell--participant-focus .story-item:not(.active) .story-more {
		background: rgba(9, 26, 34, 0.6);
		border-color: rgba(141, 168, 182, 0.28);
		color: rgba(200, 212, 220, 0.7);
	}

	.ring {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--ring-size);
		height: var(--ring-size);
		padding: 2px;
		border-radius: 50%;
		background: rgba(141, 168, 182, 0.16);
		transition:
			background 220ms ease,
			box-shadow 220ms ease;
	}

	.ring img,
	.initials {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
		background: rgba(9, 26, 34, 0.9);
		border: 3px solid rgba(9, 26, 34, 0.9);
		transition:
			filter 180ms ease,
			border-color 180ms ease;
	}

	.initials {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 1.1rem;
		color: rgba(248, 250, 252, 0.82);
	}

	.label {
		font-size: 0.78rem;
		text-align: center;
		line-height: 1.2;
		color: rgba(248, 250, 252, 0.72);
	}

	.story-item.active .story-trigger .label {
		color: #f8fafc;
		font-weight: 600;
	}

	.story-more {
		position: absolute;
		top: calc(var(--ring-size) / 2);
		left: 50%;
		transform: translate(calc(var(--ring-size) / 2 - 8px), -50%);
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: 1px solid rgba(244, 232, 210, 0.3);
		background: rgba(9, 26, 34, 0.72);
		color: rgba(248, 250, 252, 0.9);
		font-size: 1rem;
		line-height: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		z-index: 2;
		transition:
			background 160ms ease,
			transform 160ms ease,
			border-color 160ms ease,
			box-shadow 160ms ease;
	}

	.story-more:hover {
		background: rgba(210, 75, 63, 0.32);
		border-color: rgba(210, 75, 63, 0.65);
		transform: translate(calc(var(--ring-size) / 2 - 8px), -50%) scale(1.06);
	}

	.story-more:focus-visible {
		outline: 2px solid rgba(210, 75, 63, 0.85);
		outline-offset: 2px;
	}

	@media (max-width: 768px) {
		.stories-slider {
			grid-template-columns: 1fr;
			gap: 0.6rem;
		}

		.nav {
			display: none;
		}

		.stories-list {
			justify-content: flex-start;
			grid-auto-columns: minmax(74px, max-content);
			gap: 0.4rem;
			padding: 0 0.15rem;
		}

		.slider-shell {
			border-radius: 0;
			margin: 0;
			padding: 0.6rem 0.85rem;
			box-shadow: 0 16px 35px rgba(1, 5, 15, 0.35);
		}

		.slider-shell--fixed {
			width: 100%;
			left: 0;
			right: 0;
		}

		.slider-shell--fixed.slider-shell--bottom {
			bottom: 0;
		}

		.story-item {
			gap: 0.25rem;
			--ring-size: 60px;
			margin-right: clamp(0.32rem, 4.5vw, 0.65rem);
		}

		.story-trigger {
			gap: 0.3rem;
		}

		.story-more {
			width: 26px;
			height: 26px;
		}

		.ring {
			padding: 1.5px;
		}

		.ring img,
		.initials {
			border-width: 2px;
		}

		.initials {
			font-size: 1.1rem;
		}

		.label {
			font-size: 0.78rem;
		}

	}
</style>
