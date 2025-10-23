<script>
	import { tick } from 'svelte';
	import {
		participantActions,
		participantsList,
		selectedParticipant,
		selectedEmergency,
		selectedStillTime,
		activeGrouping as activeGroupingMode
	} from '$lib/stores/participantStore.js';

	const { selectById, selectNext, selectPrevious } = participantActions;

	export let mode = 'sticky'; // 'static' | 'sticky' | 'fixed'
	export let position = 'bottom'; // 'top' | 'bottom'
	export let maxWidth = 1280;
	export let background = 'rgba(10, 12, 23, 0.92)';
	export let blur = true;
	export let reserveSpace = true;
	export let showActiveCategory = true;

	const FIXED_HEIGHT = 156;

	let scroller;
	let lastGroup = null;

	function normalizeGroup(value) {
		if (value === undefined || value === null) return null;
		const trimmed = String(value).trim();
		return trimmed.length ? trimmed : null;
	}

	function getParticipantGroup(participant, field = 'emergencyFocus') {
		return normalizeGroup(participant?.[field]);
	}

	function reorderParticipants(list = [], group, field = 'emergencyFocus') {
		const normalizedGroup = normalizeGroup(group);
		if (!normalizedGroup) return list;

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

	$: groupingMode = $activeGroupingMode;
	$: activeEmergency = normalizeGroup($selectedEmergency);
	$: activeStillTime = normalizeGroup($selectedStillTime);
	$: currentGrouping =
		groupingMode === 'stillTime' && activeStillTime
			? { field: 'stillTime', value: activeStillTime }
			: activeEmergency
				? { field: 'emergencyFocus', value: activeEmergency }
				: null;
	$: roster = reorderParticipants(
		$participantsList || [],
		currentGrouping?.value,
		currentGrouping?.field
	);
	$: activeId = $selectedParticipant?.id || null;
	$: groupValue = currentGrouping?.value || null;
	$: groupField = currentGrouping?.field || 'emergencyFocus';
	$: activeMetaLabel =
		currentGrouping?.field === 'stillTime' ? 'Ainda há tempo:' : 'Botão de emergência:';
	$: activeMetaValue =
		currentGrouping?.field === 'stillTime'
			? groupValue || ''
			: groupValue || $selectedParticipant?.emergencyFocus || '';
	$: shellStyle = `--slider-max-width:${maxWidth}px; --slider-bg:${background}; --slider-fixed-height:${FIXED_HEIGHT}px;`;
	$: if (scroller && groupValue !== lastGroup) {
		lastGroup = groupValue;
		scroller.scrollTo({ left: 0, behavior: 'auto' });
	}

	function handleSelect(id) {
		if (!id) return;
		selectById(id);
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

	$: ensureActiveVisible();

	function handleNext() {
		selectNext();
	}

	function handlePrevious() {
		selectPrevious();
	}
</script>

{#if roster.length}
	<div
		class={`slider-shell slider-shell--${mode} slider-shell--${position} ${blur ? 'slider-shell--blur' : ''}`}
		class:slider-shell--group-active={Boolean(groupValue)}
		style={shellStyle}
	>
		<div class="slider-content">
			<div class="stories-slider">
				<button class="nav prev" aria-label="Participante anterior" on:click={handlePrevious}>
					<span aria-hidden="true">‹</span>
				</button>

				<div class="stories-list" bind:this={scroller}>
					{#each roster as participant (participant.id)}
						<button
							class="story-item"
							class:active={participant.id === activeId}
							class:same-group={groupValue &&
								getParticipantGroup(participant, groupField) === groupValue}
							class:dimmed={groupValue &&
								getParticipantGroup(participant, groupField) !== groupValue}
							type="button"
							data-participant-id={participant.id}
							on:click={() => handleSelect(participant.id)}
						>
							<span class="ring">
								{#if participant.photo}
									<img src={participant.photo} alt={`Foto de ${participant.name}`} loading="lazy" />
								{:else}
									<span class="initials">{getInitials(participant.name)}</span>
								{/if}
							</span>
							<span class="label">{getDisplayName(participant.name)}</span>
						</button>
					{/each}
				</div>

				<button class="nav next" aria-label="Próximo participante" on:click={handleNext}>
					<span aria-hidden="true">›</span>
				</button>
			</div>

			{#if showActiveCategory && activeMetaValue}
				<div class="active-meta">
					<span class="active-label">{activeMetaLabel}</span>
					<span class="active-value">{activeMetaValue}</span>
				</div>
			{/if}
		</div>
	</div>
{/if}

{#if mode === 'fixed' && reserveSpace}
	<div class="slider-spacer" style={`height:${FIXED_HEIGHT + 20}px`}></div>
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
	}

	.slider-shell--fixed .slider-content {
		width: min(var(--slider-max-width, 1280px), calc(100% - clamp(2rem, 5vw, 5rem)));
	}

	.slider-shell--fixed.slider-shell--top {
		top: clamp(0.75rem, 3vw, 1.5rem);
	}

	.slider-shell--fixed.slider-shell--bottom {
		bottom: clamp(0.75rem, 3vw, 1.5rem);
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
		gap: 0.5rem;
		padding: 0.25rem;
		background: transparent;
		border: none;
		color: inherit;
		cursor: pointer;
		scroll-snap-align: center;
		transition:
			transform 180ms ease,
			opacity 180ms ease;
	}

	.story-item:hover {
		transform: translateY(-4px);
	}

	.slider-shell--group-active .story-item.same-group {
		opacity: 0.7;
	}

	.slider-shell--group-active .story-item.same-group .label {
		color: rgba(248, 250, 252, 0.85);
	}

	.slider-shell--group-active .story-item.same-group .ring {
		background: linear-gradient(135deg, #f97316, #38bdf8);
		padding: 3px;
	}

	.slider-shell--group-active .story-item.dimmed {
		opacity: 0.2;
		filter: grayscale(1);
	}

	.slider-shell--group-active .story-item.dimmed .label {
		color: rgba(248, 250, 252, 0.35);
	}

	.slider-shell--group-active .story-item.dimmed .ring {
		filter: grayscale(1);
	}

	.slider-shell--group-active .story-item.active .ring {
		box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.4);
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

	.story-item.active .label {
		color: #f8fafc;
		font-weight: 600;
	}

	.active-meta {
		display: flex;
		justify-content: center;
		align-items: baseline;
		gap: 0.35rem;
		font-size: 0.9rem;
		color: rgba(226, 232, 240, 0.8);
	}

	.active-meta .active-value {
		font-weight: 600;
		color: #f8fafc;
	}

	@media (max-width: 768px) {
		.stories-slider {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}

		.nav {
			display: none;
		}

		.stories-list {
			justify-content: flex-start;
		}

		.slider-shell--fixed {
			width: calc(100% - 1.5rem);
		}
	}
</style>
