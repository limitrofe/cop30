<script>
	import { selectedParticipant } from '$lib/stores/participantStore.js';

	export let field = '';
	export let title = undefined;
	export let variant = 'text';
	export let description = undefined;
	export let fallback = 'Selecione uma pessoa para ver a resposta.';

	const defaultTitles = {
		emergencyFocus: 'Se tivesse um botão de emergência, acionaria em:',
		challenge2050: 'Maior desafio até 2050, na visão de quem está na linha de frente:',
		stillTime: 'Eles acreditam que ainda dá tempo?',
		optimismScore: 'Nível de otimismo em relação aos países desenvolvidos (0-10)',
		optimismReason: 'Por que pensa assim',
		extraMessage: 'Recado para os leitores'
	};

	const defaultVariants = {
		stillTime: 'badge',
		optimismScore: 'score',
		optimismReason: 'quote',
		extraMessage: 'quote'
	};

	function normalize(value) {
		if (value === undefined || value === null) return '';
		if (typeof value === 'string') return value.trim();
		return value;
	}

	$: participant = $selectedParticipant;
	const normalizeString = (value) => {
		if (value === null || value === undefined) return undefined;
		return String(value).trim();
	};

	$: providedTitle = normalizeString(title);
	$: providedDescription = normalizeString(description);
	$: resolvedTitle =
		providedTitle !== undefined ? providedTitle : (field && defaultTitles[field]) || '';
	$: resolvedVariant = variant || (field && defaultVariants[field]) || 'text';
	$: rawValue = participant ? normalize(participant[field]) : '';
	$: displayValue =
		rawValue && typeof rawValue === 'string' ? rawValue.replace(/\s+$/g, '').trim() : rawValue;

	$: isEmpty =
		!participant ||
		!displayValue ||
		(typeof displayValue === 'string' && displayValue.length === 0);

	$: optimismScore = (() => {
		if (!participant) return null;
		const score = Number(participant.optimismScore);
		return Number.isFinite(score) ? Math.max(0, Math.min(score, 10)) : null;
	})();
</script>

<div class="participant-highlight" data-variant={resolvedVariant}>
	{#if resolvedTitle}
		<h3>{resolvedTitle}</h3>
	{/if}

	{#if providedDescription}
		<p class="description">{providedDescription}</p>
	{/if}

	{#if !participant}
		<div class="empty">
			<p>{fallback}</p>
		</div>
	{:else if isEmpty && resolvedVariant !== 'score'}
		<div class="empty">
			<p>Não há resposta para este tópico.</p>
		</div>
	{:else if resolvedVariant === 'badge'}
		<div class="badge">{displayValue}</div>
	{:else if resolvedVariant === 'quote'}
		<blockquote>
			<p>{displayValue}</p>
			<cite>{participant.name}</cite>
		</blockquote>
	{:else if resolvedVariant === 'score'}
		<div class="score-card">
			<div class="score-head">
				<strong>{optimismScore !== null ? optimismScore : 'Sem nota'}</strong>
				<span>0 = pessimista · 10 = otimista</span>
			</div>
			<div class="score-bar">
				<div
					class="score-fill"
					style={`width:${optimismScore !== null ? optimismScore * 10 : 0}%;`}
				></div>
			</div>
			{#if participant.optimismReason}
				<p class="score-quote">{participant.optimismReason}</p>
			{/if}
		</div>
	{:else}
		<p class="answer">{displayValue}</p>
	{/if}
</div>

<style>
	.participant-highlight {
		display: flex;
		flex-direction: column;
		gap: clamp(0.6rem, 2vw, 1rem);
		padding: clamp(1.25rem, 2.8vw, 1.9rem);
		border-radius: 16px;
		border: 1px solid rgba(15, 23, 42, 0.06);
		background: rgba(15, 23, 42, 0.04);
		color: rgba(45, 35, 27, 0.96);
		box-shadow: none;
	}

	h3 {
		margin: 0;
		font-size: clamp(1.4rem, 3.2vw, 2rem);
		line-height: 1.15;
		font-weight: 500;
	}

	.description {
		margin: 0;
		font-size: clamp(0.92rem, 1.8vw, 1.05rem);
		color: rgba(45, 35, 27, 0.74);
	}

	.answer {
		margin: 0;
		font-size: clamp(1.05rem, 2.4vw, 1.2rem);
		line-height: 1.55;
		white-space: pre-line;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.65rem 1.3rem;
		border-radius: 999px;
		background: rgba(249, 115, 22, 0.12);
		color: #b7511b;
		font-weight: 600;
		font-size: 0.95rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	blockquote {
		margin: 0;
		padding: 1rem 1.2rem;
		border-left: 4px solid rgba(190, 120, 64, 0.8);
		border-radius: 12px;
		background: rgba(15, 23, 42, 0.05);
	}

	blockquote p {
		margin: 0;
		font-size: 1.05rem;
		line-height: 1.55;
		white-space: pre-line;
		color: rgba(45, 35, 27, 0.9);
	}

	blockquote cite {
		display: block;
		margin-top: 0.5rem;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: rgba(45, 35, 27, 0.55);
	}

	.score-card {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.15rem 1.3rem;
		border-radius: 14px;
		background: rgba(15, 23, 42, 0.05);
		border: 1px solid rgba(15, 23, 42, 0.08);
	}

	.score-head {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
	}

	.score-head strong {
		font-size: clamp(1.6rem, 3vw, 2.2rem);
		font-weight: 600;
		color: #b7511b;
	}

	.score-head span {
		font-size: 0.8rem;
		color: rgba(45, 35, 27, 0.6);
	}

	.score-bar {
		position: relative;
		height: 10px;
		border-radius: 999px;
		background: rgba(45, 35, 27, 0.12);
		overflow: hidden;
	}

	.score-fill {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		background: linear-gradient(90deg, #d4623e, #b2b98f);
		transition: width 200ms ease;
	}

	.score-quote {
		margin: 0;
		font-size: 0.95rem;
		line-height: 1.45;
		color: rgba(45, 35, 27, 0.75);
		white-space: pre-line;
	}

	.empty {
		padding: 0.9rem 1rem;
		border-radius: 12px;
		background: rgba(15, 23, 42, 0.05);
		border: 1px dashed rgba(15, 23, 42, 0.14);
	}

	.empty p {
		margin: 0;
		font-size: 0.95rem;
		color: rgba(45, 35, 27, 0.65);
	}

	@media (max-width: 640px) {
		.participant-highlight {
			padding: clamp(1rem, 5vw, 1.25rem);
			border-radius: 14px;
		}
	}
</style>
