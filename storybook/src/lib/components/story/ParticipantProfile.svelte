<script>
	import { participantActions, selectedParticipant } from '$lib/stores/participantStore.js';

	const { selectNext, selectPrevious } = participantActions;

	function parseNameBlock(value = '') {
		if (!value) return { name: '', role: '' };

		const normalized = String(value).replace(/\s+/g, ' ').trim();
		if (!normalized) return { name: '', role: '' };

		const commaSegments = normalized
			.split(',')
			.map((segment) => segment.trim())
			.filter(Boolean);

		if (commaSegments.length > 1) {
			return {
				name: commaSegments[0],
				role: commaSegments.slice(1).join(', ')
			};
		}

		const separators = [' – ', ' — ', ' - ', ' —', ' –', '/', '|'];
		for (const separator of separators) {
			const index = normalized.indexOf(separator);
			if (index > 0) {
				return {
					name: normalized.slice(0, index).trim(),
					role: normalized.slice(index + separator.length).trim()
				};
			}
		}

		return { name: normalized, role: '' };
	}

	function getFirstName(name = '') {
		return name.split(/\s+/)[0] || '';
	}

	function hasContent(value) {
		return value !== null && value !== undefined && String(value).trim().length > 0;
	}

	function deriveArea(participant, nameBlock) {
		if (hasContent(participant?.area)) {
			return String(participant.area).trim();
		}

		if (hasContent(nameBlock.role)) {
			return nameBlock.role.trim();
		}

		const rawSource =
			participant?.raw?.nome_e_area_de_atuacao_ou_pesquisa ||
			participant?.raw?.Nome ||
			participant?.name;

		if (hasContent(rawSource)) {
			const parsed = parseNameBlock(rawSource);
			if (hasContent(parsed.role)) {
				return parsed.role.trim();
			}
		}

		return '';
	}

	let participant = null;
	let nameBlock = { name: '', role: '' };
	let area = '';
	let primaryDescriptor = '';
	let secondaryRole = '';

	$: participant = $selectedParticipant;
	$: nameBlock = parseNameBlock(participant?.name || '');
	$: area = deriveArea(participant, nameBlock);
	$: primaryDescriptor = area || nameBlock.role;
	$: secondaryRole =
		area && hasContent(nameBlock.role) && nameBlock.role !== area ? nameBlock.role : '';
</script>

{#if participant}
	<div class="profile-card">
		<div class="profile-header">
			<div class="photo">
				{#if participant.photo}
					<img src={participant.photo} alt={`Foto de ${nameBlock.name}`} loading="lazy" />
				{:else}
					<div class="placeholder" aria-hidden="true">
						<span>{getFirstName(nameBlock.name).slice(0, 1).toUpperCase()}</span>
					</div>
				{/if}
			</div>
			<header class="identity">
				<p class="eyebrow">Participante destacado</p>
				<h2>{nameBlock.name}</h2>
				{#if hasContent(primaryDescriptor)}
					<p class="role">{primaryDescriptor}</p>
				{/if}
				{#if hasContent(secondaryRole)}
					<p class="role role--secondary">{secondaryRole}</p>
				{/if}
			</header>
			<div class="profile-nav" aria-hidden="false">
				<button type="button" on:click={selectPrevious} aria-label="Participante anterior">‹</button>
				<button type="button" on:click={selectNext} aria-label="Próximo participante">›</button>
			</div>
			</div>

			<div class="chips">
				{#if participant.area}
					<span class="chip">
						<small>Área</small>
						<strong>{participant.area}</strong>
					</span>
				{/if}
				{#if participant.location}
					<span class="chip">
						<small>Localização</small>
						<strong>{participant.location}</strong>
					</span>
				{/if}
				{#if hasContent(participant.stillTime)}
					<span class="chip highlight">
						<small>Ainda dá tempo?</small>
						<strong>{participant.stillTime}</strong>
					</span>
				{/if}
			</div>

			{#if participant.emergencyFocus || participant.challenge2050}
				<div class="insights">
					{#if participant.emergencyFocus}
						<div>
							<h3>Botão de emergência</h3>
							<p>{participant.emergencyFocus}</p>
						</div>
					{/if}
					{#if participant.challenge2050}
						<div>
							<h3>Maior desafio até 2050</h3>
							<p>{participant.challenge2050}</p>
						</div>
					{/if}
				</div>
			{/if}

			{#if hasContent(participant.optimismScore)}
				<div class="optimism">
					<div class="optimism-header">
						<h3>Nível de otimismo</h3>
						<span>{participant.optimismScore}</span>
					</div>
					<div class="optimism-bar">
						<div
							class="optimism-fill"
							style={`width:${
								Math.max(0, Math.min(Number(participant.optimismScore) || 0, 10)) * 10
							}%;`}
						></div>
					</div>
					<p class="optimism-caption">0 = mais pessimista &middot; 10 = mais otimista</p>
				</div>
			{/if}

			{#if hasContent(participant.optimismReason)}
				<blockquote>
					<span class="legend">Por que pensa assim</span>
					<p>{participant.optimismReason}</p>
				</blockquote>
			{/if}
	</div>
{/if}

<style>
.profile-card {
		display: flex;
		flex-direction: column;
		gap: clamp(1.25rem, 3vw, 2.25rem);
		padding: clamp(1.5rem, 3vw, 2.5rem);
		border-radius: 24px;
		background: rgba(15, 23, 42, 0.6);
		box-shadow: 0 24px 60px rgba(2, 6, 23, 0.5);
		color: #f8fafc;
	}

	.profile-header {
		display: flex;
		align-items: center;
		gap: clamp(1rem, 3vw, 2rem);
	}

	.photo {
		flex-shrink: 0;
		position: relative;
		width: 86px;
		height: 86px;
		border-radius: 999px;
		background: rgba(148, 163, 184, 0.18);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 3px;
		box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.9);
	}

	.photo img,
	.placeholder {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
		background: rgba(15, 23, 42, 0.92);
		border: 3px solid rgba(15, 23, 42, 0.92);
	}

	.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		font-weight: 600;
		color: rgba(248, 250, 252, 0.85);
	}

	.profile-nav {
		margin-left: auto;
		display: inline-flex;
		gap: 0.65rem;
	}

	.profile-nav button {
		width: 40px;
		height: 40px;
		border-radius: 999px;
		border: 1px solid rgba(248, 250, 252, 0.35);
		background: rgba(15, 23, 42, 0.7);
		color: inherit;
		font-size: 1.4rem;
		cursor: pointer;
		transition:
			transform 180ms ease,
			background 180ms ease;
	}

	.profile-nav button:hover {
		transform: scale(1.06);
		background: rgba(197, 83, 69, 0.25);
	}

	.identity {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
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

	header .role + .role {
		margin-top: 0.25rem;
	}

	header .role--secondary {
		font-size: 0.95rem;
		color: rgba(203, 213, 225, 0.6);
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
		.profile-header {
			flex-wrap: wrap;
			gap: 1.25rem;
		}

		.profile-nav {
			margin-left: 0;
		}
	}

	@media (max-width: 640px) {
		.profile-card {
			padding: 1.25rem;
			border-radius: 20px;
		}

		.profile-header {
			flex-direction: column;
			align-items: center;
			text-align: center;
		}

		.profile-nav {
			width: 100%;
			justify-content: center;
			margin-top: 0.5rem;
		}

		header h2 {
			font-size: 1.75rem;
		}
	}
</style>
