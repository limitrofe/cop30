<script>
	import { createEventDispatcher, onDestroy, tick } from 'svelte';
	import ParticipantProfile from '$lib/components/story/ParticipantProfile.svelte';
	import { selectedParticipant } from '$lib/stores/participantStore.js';

	export let open = false;

	const dispatch = createEventDispatcher();

	let closeButton;
	let bodyOverflowBackup;
	let lastFocusedElement;

	$: currentParticipant = $selectedParticipant;
	$: participantName =
		currentParticipant?.name?.split(',')?.[0]?.trim() || currentParticipant?.name?.trim() || '';

	$: if (open) {
		openModal();
	} else {
		closeModal();
	}

	async function openModal() {
		if (typeof document !== 'undefined') {
			lastFocusedElement = document.activeElement;
			if (bodyOverflowBackup === undefined) {
				bodyOverflowBackup = document.body.style.overflow;
			}
			document.body.style.overflow = 'hidden';
		}

		await tick();
		closeButton?.focus({ preventScroll: true });
	}

	function closeModal() {
		if (typeof document !== 'undefined' && bodyOverflowBackup !== undefined) {
			document.body.style.overflow = bodyOverflowBackup;
			bodyOverflowBackup = undefined;
		}

		if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
			lastFocusedElement.focus();
		}

		lastFocusedElement = null;
	}

	function handleClose() {
		dispatch('close');
	}

	function handleBackdropClick(event) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}

	function handleKeydown(event) {
		if (!open) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			handleClose();
		}
	}

	onDestroy(() => {
		closeModal();
	});
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open && currentParticipant}
	<div class="modal-backdrop" role="presentation" on:click={handleBackdropClick}>
		<div
			class="modal-dialog"
			role="dialog"
			aria-modal="true"
			aria-label={participantName ? `Perfil de ${participantName}` : 'Perfil do participante'}
		>
			<button
				class="close-button"
				type="button"
				aria-label="Fechar perfil"
				on:click={handleClose}
				bind:this={closeButton}
			>
				<span aria-hidden="true">×</span>
			</button>

			<ParticipantProfile />
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 1600;
		background: rgba(2, 6, 23, 0.72);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: clamp(1.5rem, 4vw, 3rem);
		backdrop-filter: blur(10px);
	}

	.modal-dialog {
		position: relative;
		width: min(960px, calc(100vw - 2rem));
		max-height: calc(100vh - 2rem);
		overflow-y: auto;
		border-radius: 28px;
		background: rgba(15, 23, 42, 0.94);
		box-shadow: 0 40px 90px rgba(2, 6, 23, 0.6);
		padding: clamp(1rem, 2vw, 1.5rem);
	}

	.close-button {
		position: absolute;
		top: clamp(0.75rem, 1.8vw, 1.25rem);
		right: clamp(0.75rem, 1.8vw, 1.25rem);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 999px;
		border: 1px solid rgba(148, 163, 184, 0.35);
		background: rgba(15, 23, 42, 0.75);
		color: rgba(248, 250, 252, 0.92);
		cursor: pointer;
		font-size: 1.5rem;
		line-height: 1;
		transition:
			background 160ms ease,
			transform 160ms ease,
			border-color 160ms ease;
	}

	.close-button:hover {
		background: rgba(197, 83, 69, 0.2);
		border-color: rgba(197, 83, 69, 0.6);
		transform: scale(1.05);
	}

	.close-button:focus-visible {
		outline: 2px solid rgba(197, 83, 69, 0.85);
		outline-offset: 2px;
	}

	.close-button span {
		display: block;
		transform: translateY(-1px);
	}

	@media (max-width: 768px) {
		.modal-dialog {
			width: 100%;
			height: calc(100vh - 1.5rem);
			max-height: none;
			padding: clamp(0.75rem, 4vw, 1.25rem);
		}
	}
</style>
