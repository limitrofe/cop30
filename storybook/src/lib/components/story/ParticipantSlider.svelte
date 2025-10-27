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
	export let background = 'rgba(10, 12, 23, 0.92)';
	export let blur = true;
	export let reserveSpace = true;
	export let collapsible = false;

	const FIXED_HEIGHT = 156;
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

function applyFilters(list = [], search = '', location = '', area = '') {
	if (!list.length) return list;
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
	$: locations = buildDistinctOptions(allParticipants, 'location');
	$: areas = buildDistinctOptions(allParticipants, 'area');
	$: names = buildDistinctNames(allParticipants);
	$: {
		if (locationFilter) {
			const normalized = normalizeGroup(locationFilter);
			const match = locations.find((item) => normalizeGroup(item) === normalized);
			if (!match) {
				locationFilter = locationFilter.trim();
			} else if (match !== locationFilter) {
				locationFilter = match;
			}
		}
	}
	$: {
		if (areaFilter) {
			const normalized = normalizeGroup(areaFilter);
			const match = areas.find((item) => normalizeGroup(item) === normalized);
			if (!match) {
				areaFilter = areaFilter.trim();
			} else if (match !== areaFilter) {
				areaFilter = match;
			}
		}
	}

	$: filteredParticipants = applyFilters(allParticipants, searchTerm, locationFilter, areaFilter);
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
				<div class="slider-actions">
					{#if isMobileViewport}
						<div class="action-buttons action-buttons--mobile">
							<button
								type="button"
								class="filter-toggle"
								on:click={toggleMobileFilters}
								aria-expanded={mobileFiltersOpen}
								aria-controls={FILTER_CONTROLS_ID}
							>
								{mobileFiltersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
							</button>
							<button
								type="button"
								class="slider-collapse"
								on:click={() => dispatch('collapse')}
							>
								Ocultar participantes
							</button>
						</div>
					{/if}
					<div
						class="filter-controls"
						role="group"
						aria-label="Filtrar participantes"
						id={FILTER_CONTROLS_ID}
						class:filter-controls--collapsed={isMobileViewport && !mobileFiltersOpen}
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
							/>
							</label>
						</div>
					{#if !isMobileViewport}
						<button
							type="button"
							class="slider-collapse"
							on:click={() => dispatch('collapse')}
						>
							Ocultar participantes
						</button>
					{/if}
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
											class="more-button"
											type="button"
											on:click={() => handleMore(participant)}
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
		padding: clamp(0.8rem, 2vw, 1.2rem) clamp(1rem, 4vw, 1.75rem);
		border-radius: 28px;
		background: var(--slider-bg, rgba(10, 12, 23, 0.92));
		border: 1px solid rgba(148, 163, 184, 0.18);
		box-shadow: 0 28px 60px rgba(1, 5, 15, 0.4);
		color: #f8fafc;
	}

	.slider-content {
		width: min(var(--slider-max-width, 1200px), 100%);
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.slider-actions {
		display: flex;
		align-items: center;
		gap: clamp(0.6rem, 1.5vw, 1.2rem);
		flex-wrap: wrap;
		padding-bottom: 0.25rem;
	}

	.filter-controls {
		display: flex;
		align-items: center;
		gap: clamp(0.5rem, 1.5vw, 1rem);
		flex-wrap: wrap;
		flex: 1;
	}

	.filter-controls--collapsed {
		display: none;
	}

	.filter-toggle {
		display: none;
	}

	.filter {
		position: relative;
		width: clamp(180px, 22vw, 260px);
	}

	.filter input {
		width: 100%;
		padding: 0.55rem 0.9rem;
		border-radius: 999px;
		background: rgba(15, 23, 42, 0.35);
		border: 1px solid rgba(148, 163, 184, 0.28);
		color: inherit;
		font-size: 0.9rem;
		transition:
			border-color 160ms ease,
			background 160ms ease,
			box-shadow 160ms ease;
	}

	@media (min-width: 769px) {
		.filter-controls--collapsed {
			display: flex;
		}
	}

	.filter input::placeholder {
		color: rgba(148, 163, 184, 0.75);
	}

	.filter input:focus-visible {
		outline: none;
		border-color: rgba(148, 163, 184, 0.5);
		background: rgba(15, 23, 42, 0.55);
		box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.25);
	}

	.slider-collapse {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.55rem 1rem;
		border-radius: 999px;
		background: rgba(15, 23, 42, 0.45);
		border: 1px solid rgba(255, 255, 255, 0.14);
		color: inherit;
		font-size: 0.95rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			background 160ms ease,
			transform 160ms ease,
			border-color 160ms ease;
	}

	.slider-collapse:hover {
		background: rgba(15, 23, 42, 0.6);
		border-color: rgba(255, 255, 255, 0.3);
		transform: translateY(-1px);
	}

	.slider-collapse:active {
		transform: translateY(0);
	}

	.slider-collapse:focus-visible {
		outline: 2px solid rgba(248, 250, 252, 0.85);
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
		min-height: 120px;
		border-radius: 20px;
		background: rgba(15, 23, 42, 0.35);
		border: 1px dashed rgba(148, 163, 184, 0.35);
		padding: 2rem;
		text-align: center;
		color: rgba(248, 250, 252, 0.75);
	}

	.slider-empty p {
		margin: 0;
		font-size: 0.95rem;
	}

	@media (max-width: 768px) {
		.slider-content {
			gap: 0.5rem;
		}

		.slider-actions {
			flex-direction: column;
			align-items: stretch;
			gap: 0.5rem;
			padding-bottom: 0;
		}

		.action-buttons {
			width: 100%;
		}

		.action-buttons {
			display: flex;
			align-items: center;
			gap: 0.4rem;
			width: 100%;
		}

		.action-buttons--mobile .filter-toggle,
		.action-buttons--mobile .slider-collapse {
			flex: 1 1 0;
			min-width: 0;
			font-size: 0.8rem;
			padding: 0.45rem 0.7rem;
		}

		.action-buttons--mobile .slider-collapse {
			justify-content: center;
		}

		.filter-toggle {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 100%;
			padding: 0.45rem 0.9rem;
			border-radius: 999px;
			border: 1px solid rgba(148, 163, 184, 0.35);
			background: rgba(15, 23, 42, 0.5);
			color: inherit;
			font-size: 0.85rem;
			font-weight: 500;
			cursor: pointer;
			transition:
				background 160ms ease,
				border-color 160ms ease;
		}

		.filter-toggle[aria-expanded='true'] {
			background: rgba(15, 23, 42, 0.65);
			border-color: rgba(148, 163, 184, 0.5);
		}

		.filter-toggle:focus-visible {
			outline: 2px solid rgba(148, 163, 184, 0.4);
			outline-offset: 2px;
		}

		.filter-controls {
			width: 100%;
			justify-content: flex-start;
			gap: 0.45rem;
		}

		.filter {
			width: 100%;
		}

		.filter input {
			padding: 0.45rem 0.8rem;
			font-size: 0.85rem;
		}

		.slider-collapse {
			width: auto;
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
		width: clamp(40px, 6vw, 52px);
		height: clamp(40px, 6vw, 52px);
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.18);
		background: rgba(15, 23, 42, 0.35);
		color: inherit;
		font-size: 1.75rem;
		cursor: pointer;
		transition:
			background 180ms ease,
			transform 180ms ease;
	}

	.nav:hover {
		background: rgba(249, 115, 22, 0.25);
		transform: scale(1.05);
	}

	.stories-list {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: minmax(86px, 1fr);
		gap: clamp(0.5rem, 1.4vw, 0.9rem);
		overflow-x: auto;
		padding: 0.1rem 0.25rem;
		scroll-snap-type: x mandatory;
	}

	.stories-list::-webkit-scrollbar {
		height: 6px;
	}

	.stories-list::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.15);
		border-radius: 999px;
	}

	.story-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(0.15rem, 0.6vw, 0.35rem);
		padding: 0;
		scroll-snap-align: center;
	}

	.story-trigger {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(0.35rem, 1vw, 0.5rem);
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
		transform: translateY(-4px);
	}

	.story-trigger:focus-visible {
		outline: 2px solid rgba(148, 163, 184, 0.6);
		outline-offset: 3px;
	}

	.slider-shell--group-active .story-item.same-group .story-trigger {
		opacity: 0.7;
	}

	.slider-shell--group-active .story-item.same-group .story-trigger .label {
		color: rgba(248, 250, 252, 0.85);
	}

	.slider-shell--group-active .story-item.same-group .ring {
		background: linear-gradient(135deg, #f97316, #38bdf8);
		padding: 3px;
	}

	.slider-shell--group-active .story-item.dimmed .story-trigger {
		opacity: 0.2;
	}

	.slider-shell--group-active .story-item.dimmed .label {
		color: rgba(248, 250, 252, 0.35);
	}

	.slider-shell--group-active .story-item.dimmed {
		filter: grayscale(1);
	}

	.slider-shell--group-active .story-item.dimmed .ring,
	.slider-shell--group-active .story-item.dimmed img,
	.slider-shell--group-active .story-item.dimmed .initials {
		filter: grayscale(1);
	}

	.slider-shell--group-active .story-item.dimmed .more-button {
		opacity: 0.35;
	}

	.slider-shell--group-active .story-item.active .ring {
		box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.4);
	}

	.slider-shell--participant-focus .story-item.active .ring {
		background: rgba(197, 83, 69, 0.2);
		box-shadow: 0 0 0 4px rgb(197, 83, 69);
	}

	.slider-shell--participant-focus .story-item.active img,
	.slider-shell--participant-focus .story-item.active .initials {
		border-color: rgb(197, 83, 69);
		filter: grayscale(0);
	}

	.slider-shell--participant-focus .story-item:not(.active) .ring {
		background: rgba(148, 163, 184, 0.08);
		box-shadow: none;
	}

	.slider-shell--participant-focus .story-item:not(.active) img,
	.slider-shell--participant-focus .story-item:not(.active) .initials {
		border-color: transparent;
		filter: grayscale(1);
	}

	.slider-shell--participant-focus .story-item:not(.active) .more-button {
		background: rgba(15, 23, 42, 0.6);
		border-color: rgba(148, 163, 184, 0.28);
		color: rgba(148, 163, 184, 0.65);
	}

	.ring {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 72px;
		height: 72px;
		padding: 2px;
		border-radius: 50%;
		background: rgba(148, 163, 184, 0.12);
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
		background: rgba(15, 23, 42, 0.9);
		border: 3px solid rgba(15, 23, 42, 0.9);
		transition:
			filter 180ms ease,
			border-color 180ms ease;
	}

	.initials {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 1.35rem;
		color: rgba(248, 250, 252, 0.82);
	}

	.label {
		font-size: 0.85rem;
		text-align: center;
		line-height: 1.2;
		color: rgba(248, 250, 252, 0.75);
	}

	.story-item.active .story-trigger .label {
		color: #f8fafc;
		font-weight: 600;
	}

	.more-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		margin-top: clamp(0.35rem, 0.8vw, 0.55rem);
		border-radius: 50%;
		border: 1px solid rgba(148, 163, 184, 0.45);
		background: rgba(15, 23, 42, 0.75);
		color: rgba(248, 250, 252, 0.92);
		font-size: 1.05rem;
		line-height: 1;
		cursor: pointer;
		transition:
			background 160ms ease,
			transform 160ms ease,
			border-color 160ms ease;
	}

	.more-button:hover {
		background: rgba(197, 83, 69, 0.28);
		border-color: rgba(197, 83, 69, 0.65);
		transform: translateY(-1px);
	}

	.more-button:focus-visible {
		outline: 2px solid rgba(197, 83, 69, 0.8);
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
			grid-auto-columns: minmax(68px, 1fr);
			gap: 0.55rem;
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
		}

		.story-trigger {
			gap: 0.3rem;
		}

		.ring {
			width: 60px;
			height: 60px;
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

		.more-button {
			width: 28px;
			height: 28px;
			margin-top: 0.4rem;
			font-size: 1rem;
		}
	}
</style>
