<script>
	import { createEventDispatcher } from 'svelte';
	import { participantsList, participantActions } from '$lib/stores/participantStore.js';

	export let title = '';
	export let subtitle = '';

	const dispatch = createEventDispatcher();
	const { selectById } = participantActions;

	$: participants = $participantsList || [];

	function getInitials(name) {
		if (!name) return '?';
		const clean = name.replace(/\s+/g, ' ').trim();
		const [first = '', last = ''] = clean.split(' ');
		return `${first[0] || ''}${last[0] || ''}`.toUpperCase() || '?';
	}

	function handleOpen(participant) {
		if (!participant?.id) return;
		selectById(participant.id);
		dispatch('openProfile', { id: participant.id });
	}

	function getLocationLabel(participant) {
		if (participant?.location && participant.location.trim()) {
			return participant.location.trim();
		}
		return 'Local não informado';
	}
</script>

<section class="participant-gallery">
	<div class="gallery-grid" role="list">
		{#each participants as participant (participant.id)}
			<button
				type="button"
				class="gallery-card"
				on:click={() => handleOpen(participant)}
				role="listitem"
				aria-label={`Abrir perfil de ${participant.name}`}
			>
				<span class="gallery-card__photo" aria-hidden="true">
					{#if participant.photo}
						<img src={participant.photo} alt="" loading="lazy" />
					{:else}
						<span class="initials">{getInitials(participant.name)}</span>
					{/if}
				</span>
				<span class="gallery-card__name">{participant.name}</span>
				<span class="gallery-card__location">{getLocationLabel(participant)}</span>
			</button>
		{/each}
	</div>
</section>

<style>
	.participant-gallery {
		display: flex;
		flex-direction: column;
		gap: clamp(1rem, 2.5vw, 1.8rem);
		width: 100%;
		padding-bottom: 40px;
	}

	.gallery-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: clamp(1rem, 2.4vw, 1.6rem);
		width: 100%;
		justify-items: center;
	}

	.gallery-card {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		padding: clamp(0.65rem, 1.4vw, 0.9rem);
		border-radius: 18px;
		background: rgba(248, 250, 252, 0.06);
		border: 1px solid rgba(248, 250, 252, 0.08);
		color: inherit;
		text-align: center;
		cursor: pointer;
		width: 100%;
		max-width: 150px;
		transition:
			transform 160ms ease,
			border-color 160ms ease,
			background 160ms ease;
	}

	.gallery-card:hover,
	.gallery-card:focus-visible {
		transform: translateY(-4px);
		background: rgba(248, 250, 252, 0.1);
		border-color: rgba(248, 250, 252, 0.3);
		outline: none;
	}

	.gallery-card__photo {
		width: 100%;
		border-radius: 12px !important;
		clip-path: none !important;
		mask-image: none !important;
		overflow: hidden;
		background: transparent !important;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.gallery-card__photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		border-radius: 12px !important;
	}

	.initials {
		font-size: 1.6rem;
		font-weight: 600;
		color: rgba(15, 23, 42, 0.75);
	}

	.gallery-card__name {
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.3;
		color: #f8fafc;
	}

	.gallery-card__location {
		font-size: 0.92rem;
		color: rgba(248, 250, 252, 0.75);
		line-height: 1.4;
	}

	@media (max-width: 768px) {
		.gallery-grid {
			grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
			gap: clamp(0.75rem, 4vw, 1.2rem);
		}

		.gallery-card {
			padding: 0.65rem;
			border-radius: 14px;
			max-width: 110px;
		}

		.gallery-card__photo {
			border-radius: 10px !important;
		}

		.gallery-card__photo img {
			border-radius: 10px !important;
		}

		.gallery-card__name {
			font-size: 0.95rem;
		}

		.gallery-card__location {
			font-size: 0.82rem;
		}
	}
</style>
