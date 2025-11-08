<!-- src/lib/components/story/CrimeExplainer.svelte -->
<script>
	import { onMount } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';

	// Props do componente
	export let crimes = [];
	export let showPenalties = true;
	export let interactive = true;
	export let theme = 'judicial'; // 'judicial', 'investigative', 'educational'
	export let layout = 'cards'; // 'cards', 'list', 'timeline'
	export let showProgress = true;
	export let autoAdvance = false;

	// Estado interno
	let selectedCrimeIndex = 0;
	let showDetails = false;
	let animationStep = 0;
	let progressPercent = 0;

	// Configurações de tema
	const themes = {
		judicial: {
			bg: '#1a1a1a',
			primary: '#dc2626',
			secondary: '#fbbf24',
			accent: '#059669',
			text: '#ffffff',
			card: 'rgba(220, 38, 38, 0.1)',
			border: '#dc2626'
		},
		investigative: {
			bg: '#0f172a',
			primary: '#ef4444',
			secondary: '#f59e0b',
			accent: '#10b981',
			text: '#f8fafc',
			card: 'rgba(239, 68, 68, 0.1)',
			border: '#ef4444'
		},
		educational: {
			bg: '#111827',
			primary: '#3b82f6',
			secondary: '#8b5cf6',
			accent: '#06b6d4',
			text: '#f9fafb',
			card: 'rgba(59, 130, 246, 0.1)',
			border: '#3b82f6'
		}
	};

	// Níveis de gravidade
	const severityLevels = {
		baixa: { color: '#10b981', icon: '🟢', label: 'Baixa Gravidade' },
		media: { color: '#f59e0b', icon: '🟡', label: 'Média Gravidade' },
		alta: { color: '#dc2626', icon: '🔴', label: 'Alta Gravidade' },
		critica: { color: '#7c2d12', icon: '🚨', label: 'Gravidade Crítica' }
	};

	$: currentTheme = themes[theme] || themes.judicial;
	$: selectedCrime = crimes[selectedCrimeIndex] || {};
	$: maxPenalty = selectedCrime.penaltyMax || 0;
	$: minPenalty = selectedCrime.penaltyMin || 0;

	// Funções de navegação
	function selectCrime(index) {
		selectedCrimeIndex = index;
		showDetails = true;
		updateProgress();
	}

	function nextCrime() {
		if (selectedCrimeIndex < crimes.length - 1) {
			selectCrime(selectedCrimeIndex + 1);
		}
	}

	function prevCrime() {
		if (selectedCrimeIndex > 0) {
			selectCrime(selectedCrimeIndex - 1);
		}
	}

	function updateProgress() {
		progressPercent = crimes.length > 0 ? ((selectedCrimeIndex + 1) / crimes.length) * 100 : 0;
	}

	// Função para calcular a gravidade visual
	function calculateSeverityWidth(crime) {
		if (!crime.penaltyMax) return 0;
		// Assumindo pena máxima de 20 anos como 100%
		return Math.min((crime.penaltyMax / 20) * 100, 100);
	}

	// Função para formatar pena
	function formatPenalty(years) {
		if (years < 1) {
			return `${Math.round(years * 12)} meses`;
		}
		return `${years} ${years === 1 ? 'ano' : 'anos'}`;
	}

	// Função para determinar severidade
	function getSeverity(crime) {
		if (crime.penaltyMax >= 12) return severityLevels.critica;
		if (crime.penaltyMax >= 8) return severityLevels.alta;
		if (crime.penaltyMax >= 4) return severityLevels.media;
		return severityLevels.baixa;
	}

	// Lifecycle
	onMount(() => {
		updateProgress();
		if (autoAdvance) {
			const interval = setInterval(() => {
				if (selectedCrimeIndex < crimes.length - 1) {
					nextCrime();
				} else {
					clearInterval(interval);
				}
			}, 5000);
		}
	});
</script>

<div
	class="crime-explainer"
	class:layout-cards={layout === 'cards'}
	class:layout-list={layout === 'list'}
	class:layout-timeline={layout === 'timeline'}
	style="--bg: {currentTheme.bg}; --primary: {currentTheme.primary}; --secondary: {currentTheme.secondary}; --accent: {currentTheme.accent}; --text: {currentTheme.text}; --card: {currentTheme.card}; --border: {currentTheme.border}"
>
	<!-- Header -->
	<div class="explainer-header">
		<h2 class="section-title">Os 5 Crimes pelos quais Bolsonaro Responde</h2>

		{#if showProgress}
			<div class="progress-indicator">
				<div class="progress-bar">
					<div class="progress-fill" style="width: {progressPercent}%"></div>
				</div>
				<span class="progress-text">{selectedCrimeIndex + 1} de {crimes.length}</span>
			</div>
		{/if}
	</div>

	<!-- Layout Cards -->
	{#if layout === 'cards'}
		<div class="crimes-grid">
			{#each crimes as crime, index}
				<div
					class="crime-card"
					class:selected={index === selectedCrimeIndex}
					class:interactive
					on:click={() => (interactive ? selectCrime(index) : null)}
					role={interactive ? 'button' : 'article'}
					tabindex={interactive ? 0 : -1}
					in:fly={{ y: 50, duration: 500, delay: index * 100 }}
				>
					<!-- Indicador de gravidade -->
					<div class="severity-indicator">
						<div
							class="severity-bar"
							style="width: {calculateSeverityWidth(crime)}%; background: {getSeverity(crime)
								.color}"
						></div>
						<span class="severity-icon">{getSeverity(crime).icon}</span>
					</div>

					<!-- Conteúdo do card -->
					<div class="card-content">
						<h3 class="crime-title">{crime.name}</h3>

						<div class="crime-meta">
							<div class="legal-base">
								<strong>Base Legal:</strong>
								{crime.legalBase}
							</div>

							{#if showPenalties}
								<div class="penalty-range">
									<strong>Pena:</strong>
									{formatPenalty(crime.penaltyMin)} a {formatPenalty(crime.penaltyMax)}
									{#if crime.hasAggravants}
										<span class="aggravants"
											>(até {formatPenalty(crime.penaltyMaxWithAggravants)} com agravantes)</span
										>
									{/if}
								</div>
							{/if}
						</div>

						<div class="crime-definition">
							<p>{crime.definition}</p>
						</div>

						{#if interactive}
							<div class="card-action">
								<span class="action-text">Clique para ver detalhes</span>
								<span class="action-arrow">→</span>
							</div>
						{/if}
					</div>

					<!-- Status de julgamento -->
					{#if crime.canBeArrested !== undefined}
						<div class="arrest-status">
							{crime.canBeArrested ? '🔒 Pode ser preso' : '⚠️ Prisão em análise'}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Detalhes do crime selecionado -->
	{#if showDetails && selectedCrime}
		<div class="crime-details" in:fade={{ duration: 300 }}>
			<div class="details-header">
				<h3 class="details-title">{selectedCrime.name}</h3>
				<button
					class="close-details"
					on:click={() => (showDetails = false)}
					title="Fechar detalhes"
				>
					✕
				</button>
			</div>

			<div class="details-content">
				<!-- Descrição completa -->
				<div class="details-section">
					<h4>Definição Legal</h4>
					<p class="definition-text">{selectedCrime.fullDefinition || selectedCrime.definition}</p>
				</div>

				<!-- Acusação específica -->
				{#if selectedCrime.accusation}
					<div class="details-section">
						<h4>Acusação da PGR</h4>
						<div class="accusation-text">
							{@html selectedCrime.accusation}
						</div>
					</div>
				{/if}

				<!-- Evidências -->
				{#if selectedCrime.evidence && selectedCrime.evidence.length > 0}
					<div class="details-section">
						<h4>Evidências Apresentadas</h4>
						<ul class="evidence-list">
							{#each selectedCrime.evidence as evidence}
								<li class="evidence-item">
									<span class="evidence-type">{evidence.type}:</span>
									<span class="evidence-description">{evidence.description}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				<!-- Análise de pena -->
				{#if showPenalties}
					<div class="details-section penalty-analysis">
						<h4>Análise de Pena</h4>

						<div class="penalty-breakdown">
							<div class="penalty-base">
								<strong>Pena Base:</strong>
								{formatPenalty(selectedCrime.penaltyMin)} a {formatPenalty(
									selectedCrime.penaltyMax
								)}
							</div>

							{#if selectedCrime.aggravants && selectedCrime.aggravants.length > 0}
								<div class="aggravants-section">
									<strong>Possíveis Agravantes:</strong>
									<ul class="aggravants-list">
										{#each selectedCrime.aggravants as aggravant}
											<li>{aggravant}</li>
										{/each}
									</ul>
									<div class="max-penalty">
										<strong>Pena Máxima com Agravantes:</strong>
										{formatPenalty(selectedCrime.penaltyMaxWithAggravants)}
									</div>
								</div>
							{/if}
						</div>

						<!-- Visualização da gravidade -->
						<div class="severity-visualization">
							<div class="severity-scale">
								<div class="scale-bar">
									<div
										class="scale-fill"
										style="width: {calculateSeverityWidth(
											selectedCrime
										)}%; background: {getSeverity(selectedCrime).color}"
									></div>
								</div>
								<div class="scale-labels">
									<span>0 anos</span>
									<span>20+ anos</span>
								</div>
							</div>
							<div class="severity-label">
								{getSeverity(selectedCrime).icon}
								{getSeverity(selectedCrime).label}
							</div>
						</div>
					</div>
				{/if}

				<!-- Precedentes legais -->
				{#if selectedCrime.precedents && selectedCrime.precedents.length > 0}
					<div class="details-section">
						<h4>Precedentes</h4>
						<ul class="precedents-list">
							{#each selectedCrime.precedents as precedent}
								<li class="precedent-item">
									<strong>{precedent.case}:</strong>
									{precedent.outcome}
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>

			<!-- Navegação entre crimes -->
			<div class="details-navigation">
				<button class="nav-btn prev-btn" on:click={prevCrime} disabled={selectedCrimeIndex === 0}>
					← Crime Anterior
				</button>

				<div class="crime-indicator">
					{#each crimes as _, index}
						<div
							class="indicator-dot"
							class:active={index === selectedCrimeIndex}
							on:click={() => selectCrime(index)}
							role="button"
							tabindex="0"
						></div>
					{/each}
				</div>

				<button
					class="nav-btn next-btn"
					on:click={nextCrime}
					disabled={selectedCrimeIndex === crimes.length - 1}
				>
					Próximo Crime →
				</button>
			</div>
		</div>
	{/if}

	<!-- Resumo geral -->
	<div class="crimes-summary">
		<div class="summary-stats">
			<div class="stat-item">
				<span class="stat-number">{crimes.length}</span>
				<span class="stat-label">Crimes</span>
			</div>

			{#if crimes.length > 0}
				<div class="stat-item">
					<span class="stat-number">
						{formatPenalty(
							Math.max(...crimes.map((c) => c.penaltyMaxWithAggravants || c.penaltyMax))
						)}
					</span>
					<span class="stat-label">Pena Máxima</span>
				</div>

				<div class="stat-item">
					<span class="stat-number">
						{crimes.filter((c) => c.canBeArrested).length}
					</span>
					<span class="stat-label">Podem Gerar Prisão</span>
				</div>
			{/if}
		</div>

		<div class="summary-note">
			<p class="note-text">
				<strong>Importante:</strong> As penas podem ser aplicadas de forma cumulativa, podendo resultar
				em condenação total superior à pena máxima individual de cada crime.
			</p>
		</div>
	</div>
</div>

<!-- Atalhos de teclado -->
<svelte:window
	on:keydown={(e) => {
		if (interactive) {
			if (e.key === 'ArrowLeft') prevCrime();
			if (e.key === 'ArrowRight') nextCrime();
			if (e.key === 'Escape') showDetails = false;
			if (e.key >= '1' && e.key <= '9') {
				const index = parseInt(e.key) - 1;
				if (index < crimes.length) selectCrime(index);
			}
		}
	}}
/>

<style>
	.crime-explainer {
		width: 100%;
		background: var(--bg);
		color: var(--text);
		padding: 2rem;
		font-family:
			'Inter',
			-apple-system,
			BlinkMacSystemFont,
			sans-serif;
	}

	/* Header */
	.explainer-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.section-title {
		font-size: 2.5rem;
		font-weight: bold;
		color: var(--primary);
		margin-bottom: 1rem;
		line-height: 1.2;
	}

	.progress-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-top: 1rem;
	}

	.progress-bar {
		width: 200px;
		height: 6px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--primary), var(--accent));
		transition: width 0.5s ease;
	}

	.progress-text {
		font-size: 0.9rem;
		color: var(--secondary);
		font-weight: 500;
	}

	/* Grid de crimes */
	.crimes-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.crime-card {
		background: var(--card);
		border: 2px solid transparent;
		border-radius: 1rem;
		padding: 1.5rem;
		position: relative;
		transition: all 0.3s ease;
		overflow: hidden;
	}

	.crime-card.interactive {
		cursor: pointer;
	}

	.crime-card.interactive:hover {
		border-color: var(--border);
		transform: translateY(-5px);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
	}

	.crime-card.selected {
		border-color: var(--primary);
		box-shadow: 0 0 20px rgba(220, 38, 38, 0.5);
	}

	/* Indicador de gravidade */
	.severity-indicator {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 6px;
		background: rgba(255, 255, 255, 0.1);
		display: flex;
		align-items: center;
	}

	.severity-bar {
		height: 100%;
		transition: width 0.8s ease;
	}

	.severity-icon {
		position: absolute;
		right: 1rem;
		top: 1rem;
		font-size: 1.2rem;
	}

	/* Conteúdo do card */
	.card-content {
		margin-top: 1rem;
	}

	.crime-title {
		font-size: 1.3rem;
		font-weight: bold;
		margin-bottom: 1rem;
		color: var(--primary);
		line-height: 1.3;
	}

	.crime-meta {
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}

	.legal-base,
	.penalty-range {
		margin-bottom: 0.5rem;
		line-height: 1.4;
	}

	.aggravants {
		color: var(--secondary);
		font-style: italic;
	}

	.crime-definition {
		margin-bottom: 1rem;
	}

	.crime-definition p {
		line-height: 1.5;
		color: rgba(255, 255, 255, 0.9);
	}

	.card-action {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--accent);
		font-size: 0.9rem;
		margin-top: 1rem;
	}

	.action-arrow {
		transition: transform 0.3s ease;
	}

	.crime-card:hover .action-arrow {
		transform: translateX(5px);
	}

	.arrest-status {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
		background: rgba(0, 0, 0, 0.8);
		padding: 0.5rem;
		border-radius: 0.5rem;
		font-size: 0.8rem;
		border: 1px solid var(--border);
	}

	/* Detalhes do crime */
	.crime-details {
		background: rgba(0, 0, 0, 0.8);
		border: 1px solid var(--border);
		border-radius: 1rem;
		padding: 2rem;
		margin-bottom: 2rem;
		backdrop-filter: blur(10px);
	}

	.details-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		padding-bottom: 1rem;
	}

	.details-title {
		font-size: 2rem;
		font-weight: bold;
		color: var(--primary);
		margin: 0;
	}

	.close-details {
		background: none;
		border: 1px solid var(--border);
		color: var(--text);
		padding: 0.5rem;
		border-radius: 0.5rem;
		cursor: pointer;
		font-size: 1.2rem;
		transition: all 0.3s ease;
	}

	.close-details:hover {
		background: var(--primary);
	}

	.details-content {
		display: grid;
		gap: 2rem;
	}

	.details-section h4 {
		color: var(--accent);
		font-size: 1.2rem;
		margin-bottom: 1rem;
		font-weight: 600;
	}

	.definition-text,
	.accusation-text {
		font-size: 1.1rem;
		line-height: 1.6;
	}

	.accusation-text :global(strong) {
		color: var(--primary);
	}

	/* Listas */
	.evidence-list,
	.aggravants-list,
	.precedents-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.evidence-item,
	.precedent-item {
		margin-bottom: 0.8rem;
		padding: 0.8rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 0.5rem;
		border-left: 3px solid var(--accent);
	}

	.evidence-type {
		color: var(--secondary);
		font-weight: 600;
	}

	/* Análise de pena */
	.penalty-analysis {
		background: rgba(220, 38, 38, 0.1);
		padding: 1.5rem;
		border-radius: 0.8rem;
		border: 1px solid var(--primary);
	}

	.penalty-breakdown {
		margin-bottom: 1.5rem;
	}

	.penalty-base,
	.max-penalty {
		margin-bottom: 1rem;
		font-size: 1.1rem;
	}

	.aggravants-section {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.2);
	}

	.aggravants-list {
		margin: 0.5rem 0;
	}

	.aggravants-list li {
		margin-bottom: 0.3rem;
		padding-left: 1rem;
		position: relative;
	}

	.aggravants-list li::before {
		content: '•';
		color: var(--secondary);
		position: absolute;
		left: 0;
	}

	/* Visualização de gravidade */
	.severity-visualization {
		margin-top: 1.5rem;
	}

	.severity-scale {
		margin-bottom: 0.5rem;
	}

	.scale-bar {
		width: 100%;
		height: 10px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 5px;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}

	.scale-fill {
		height: 100%;
		transition: width 0.8s ease;
	}

	.scale-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.severity-label {
		text-align: center;
		font-weight: 600;
		font-size: 1.1rem;
	}

	/* Navegação */
	.details-navigation {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.nav-btn {
		background: var(--card);
		border: 1px solid var(--border);
		color: var(--text);
		padding: 0.8rem 1.5rem;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 0.9rem;
	}

	.nav-btn:hover:not(:disabled) {
		background: var(--primary);
		transform: scale(1.05);
	}

	.nav-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.crime-indicator {
		display: flex;
		gap: 0.5rem;
	}

	.indicator-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.indicator-dot.active {
		background: var(--primary);
		transform: scale(1.3);
	}

	/* Resumo */
	.crimes-summary {
		background: rgba(0, 0, 0, 0.5);
		border-radius: 1rem;
		padding: 2rem;
		text-align: center;
	}

	.summary-stats {
		display: flex;
		justify-content: center;
		gap: 3rem;
		margin-bottom: 2rem;
	}

	.stat-item {
		text-align: center;
	}

	.stat-number {
		display: block;
		font-size: 2.5rem;
		font-weight: bold;
		color: var(--primary);
		line-height: 1;
	}

	.stat-label {
		display: block;
		font-size: 0.9rem;
		color: var(--secondary);
		margin-top: 0.5rem;
	}

	.summary-note {
		background: rgba(245, 158, 11, 0.1);
		border: 1px solid #f59e0b;
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.note-text {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.5;
	}

	/* Responsivo */
	@media (max-width: 768px) {
		.crime-explainer {
			padding: 1rem;
		}

		.section-title {
			font-size: 2rem;
		}

		.crimes-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.crime-card {
			padding: 1rem;
		}

		.details-header {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}

		.details-navigation {
			flex-direction: column;
			gap: 1rem;
		}

		.summary-stats {
			flex-direction: column;
			gap: 1rem;
		}

		.stat-number {
			font-size: 2rem;
		}
	}
</style>
