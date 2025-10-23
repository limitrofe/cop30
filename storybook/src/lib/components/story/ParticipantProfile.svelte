<script>
	import { participantActions, selectedParticipant } from '$lib/stores/participantStore.js';

	const { selectNext, selectPrevious } = participantActions;

	function parseNameBlock(value = '') {
		if (!value) return { name: '', role: '' };
		const segments = value.split(',');
		const name = segments.shift()?.trim() ?? '';
		const role = segments.join(',').trim();
		return { name, role };
	}

	function getFirstName(name = '') {
		return name.split(/\s+/)[0] || '';
	}

	function hasContent(value) {
		return value !== null && value !== undefined && String(value).trim().length > 0;
	}
</script>

{#if $selectedParticipant}
	{@const nameBlock = parseNameBlock($selectedParticipant.name)}
	<div class="profile-card">
		<div class="media">
			{#if $selectedParticipant.photo}
				<img src={$selectedParticipant.photo} alt={`Foto de ${nameBlock.name}`} loading="lazy" />
			{:else}
				<div class="placeholder" aria-hidden="true">
					<span>{getFirstName(nameBlock.name).slice(0, 1).toUpperCase()}</span>
				</div>
			{/if}
			<div class="media-nav">
				<button type="button" on:click={selectPrevious} aria-label="Participante anterior">‹</button
				>
				<button type="button" on:click={selectNext} aria-label="Próximo participante">›</button>
			</div>
		</div>

		<div class="profile-body">
			<header>
				<p class="eyebrow">Participante destacado</p>
				<h2>{nameBlock.name}</h2>
				{#if nameBlock.role}
					<p class="role">{nameBlock.role}</p>
				{:else if $selectedParticipant.area}
					<p class="role">{$selectedParticipant.area}</p>
				{/if}
			</header>

			<div class="chips">
				{#if $selectedParticipant.area}
					<span class="chip">
						<small>Área</small>
						<strong>{$selectedParticipant.area}</strong>
					</span>
				{/if}
				{#if $selectedParticipant.location}
					<span class="chip">
						<small>Localização</small>
						<strong>{$selectedParticipant.location}</strong>
					</span>
				{/if}
				{#if hasContent($selectedParticipant.stillTime)}
					<span class="chip highlight">
						<small>Ainda dá tempo?</small>
						<strong>{$selectedParticipant.stillTime}</strong>
					</span>
				{/if}
			</div>

			{#if $selectedParticipant.emergencyFocus || $selectedParticipant.challenge2050}
				<div class="insights">
					{#if $selectedParticipant.emergencyFocus}
						<div>
							<h3>Botão de emergência</h3>
							<p>{$selectedParticipant.emergencyFocus}</p>
						</div>
					{/if}
					{#if $selectedParticipant.challenge2050}
						<div>
							<h3>Maior desafio até 2050</h3>
							<p>{$selectedParticipant.challenge2050}</p>
						</div>
					{/if}
				</div>
			{/if}

			{#if hasContent($selectedParticipant.optimismScore)}
				<div class="optimism">
					<div class="optimism-header">
						<h3>Nível de otimismo</h3>
						<span>{$selectedParticipant.optimismScore}</span>
					</div>
					<div class="optimism-bar">
						<div
							class="optimism-fill"
							style={`width:${
								Math.max(0, Math.min(Number($selectedParticipant.optimismScore) || 0, 10)) * 10
							}%;`}
						></div>
					</div>
					<p class="optimism-caption">0 = mais pessimista &middot; 10 = mais otimista</p>
				</div>
			{/if}

			{#if hasContent($selectedParticipant.optimismReason)}
				<blockquote>
					<span class="legend">Por que pensa assim</span>
					<p>{$selectedParticipant.optimismReason}</p>
				</blockquote>
			{/if}
		</div>
	</div>
{/if}

<style>
	.profile-card {
		display: grid;
		grid-template-columns: minmax(220px, 280px) 1fr;
		gap: clamp(1.5rem, 3vw, 2.5rem);
		padding: clamp(1.5rem, 3vw, 2.5rem);
		border-radius: 24px;
		background: rgba(15, 23, 42, 0.6);
		box-shadow: 0 24px 60px rgba(2, 6, 23, 0.5);
		color: #f8fafc;
	}

	.media {
		position: relative;
		border-radius: 22px;
		overflow: hidden;
		min-height: 260px;
		background: rgba(15, 23, 42, 0.75);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		font-size: 4rem;
		font-weight: 600;
		color: rgba(248, 250, 252, 0.85);
	}

	.media-nav {
		position: absolute;
		bottom: 1rem;
		left: 50%;
		transform: translateX(-50%);
		display: inline-flex;
		gap: 0.75rem;
	}

	.media-nav button {
		width: 42px;
		height: 42px;
		border-radius: 999px;
		border: 1px solid rgba(248, 250, 252, 0.45);
		background: rgba(15, 23, 42, 0.75);
		color: inherit;
		font-size: 1.5rem;
		cursor: pointer;
		transition:
			transform 180ms ease,
			background 180ms ease;
	}

	.media-nav button:hover {
		transform: scale(1.08);
		background: rgba(249, 115, 22, 0.35);
	}

	header .eyebrow {
		text-transform: uppercase;
		font-size: 0.75rem;
		letter-spacing: 0.18em;
		color: rgba(148, 163, 184, 0.8);
		margin: 0 0 0.75rem;
	}

	header h2 {
		margin: 0;
		font-size: clamp(2rem, 3.2vw, 2.8rem);
		line-height: 1.1;
	}

	header .role {
		margin-top: 0.5rem;
		font-size: 1.05rem;
		color: rgba(203, 213, 225, 0.85);
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin: 1.25rem 0;
	}

	.chip {
		display: inline-flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.2rem;
		padding: 0.6rem 1rem;
		border-radius: 14px;
		background: rgba(15, 23, 42, 0.6);
		border: 1px solid rgba(148, 163, 184, 0.3);
		min-width: 120px;
	}

	.chip small {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: rgba(148, 163, 184, 0.8);
	}

	.chip strong {
		font-size: 0.95rem;
		color: inherit;
	}

	.chip.highlight {
		border-color: rgba(249, 115, 22, 0.6);
		background: rgba(249, 115, 22, 0.1);
		color: #f97316;
	}

	.insights {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		margin-bottom: 1.5rem;
	}

	.insights h3 {
		margin: 0 0 0.4rem;
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: rgba(226, 232, 240, 0.75);
	}

	.insights p {
		margin: 0;
		font-size: 1rem;
		line-height: 1.5;
		color: rgba(248, 250, 252, 0.9);
	}

	.optimism {
		margin-bottom: 1.5rem;
		padding: 1rem 1.2rem;
		border-radius: 16px;
		background: rgba(15, 23, 42, 0.55);
		border: 1px solid rgba(56, 189, 248, 0.4);
	}

	.optimism-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.6rem;
	}

	.optimism-header h3 {
		margin: 0;
		font-size: 0.95rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: rgba(226, 232, 240, 0.75);
	}

	.optimism-header span {
		font-size: 1.5rem;
		font-weight: 600;
		color: #38bdf8;
	}

	.optimism-bar {
		position: relative;
		height: 10px;
		border-radius: 999px;
		background: rgba(148, 163, 184, 0.25);
		overflow: hidden;
	}

	.optimism-fill {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		background: linear-gradient(90deg, #f97316, #38bdf8);
		transition: width 220ms ease;
	}

	.optimism-caption {
		margin: 0.45rem 0 0;
		font-size: 0.8rem;
		color: rgba(148, 163, 184, 0.8);
	}

	blockquote {
		margin: 0;
		padding: 1.2rem 1.4rem;
		border-left: 4px solid rgba(249, 115, 22, 0.9);
		border-radius: 14px;
		background: rgba(15, 23, 42, 0.6);
	}

	blockquote .legend {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: rgba(148, 163, 184, 0.85);
		display: block;
		margin-bottom: 0.5rem;
	}

	blockquote p {
		margin: 0;
		font-size: 1rem;
		line-height: 1.6;
		color: rgba(248, 250, 252, 0.92);
		white-space: pre-line;
	}

	@media (max-width: 1024px) {
		.profile-card {
			grid-template-columns: 1fr;
		}

		.media {
			max-height: 360px;
		}

		.media-nav {
			position: absolute;
			top: 0.75rem;
			left: 0.75rem;
			transform: none;
		}
	}

	@media (max-width: 640px) {
		.profile-card {
			padding: 1.25rem;
			border-radius: 20px;
		}

		header h2 {
			font-size: 1.75rem;
		}
	}
</style>
