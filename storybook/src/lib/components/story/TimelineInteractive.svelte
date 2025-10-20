<!-- src/lib/components/story/TimelineInteractive.svelte -->
<script>
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	// Props do componente
	export let events = [];
	export let highlightCurrent = true;
	export let autoAdvance = false;
	export let theme = 'dark'; // 'dark', 'light', 'dramatic'
	export let showProgress = true;
	export let height = '100vh';
	export let fullWidth = false;

	// Estado interno
	let currentEventIndex = 0;
	let isPlaying = false;
	let timelineElement;
	let progressPercent = 0;
	let autoTimer;

	// Configurações de tema
	const themes = {
		dark: {
			bg: '#0a0a0a',
			primary: '#dc2626',
			secondary: '#fbbf24',
			text: '#ffffff',
			accent: '#059669'
		},
		light: {
			bg: '#ffffff',
			primary: '#dc2626',
			secondary: '#f59e0b',
			text: '#1f2937',
			accent: '#047857'
		},
		dramatic: {
			bg: 'linear-gradient(135deg, #1a1a1a 0%, #2d1b1b 100%)',
			primary: '#ef4444',
			secondary: '#fbbf24',
			text: '#f9fafb',
			accent: '#10b981'
		}
	};

	$: currentTheme = themes[theme] || themes.dark;
	$: currentEvent = events[currentEventIndex] || {};
	$: progressPercent = events.length > 0 ? ((currentEventIndex + 1) / events.length) * 100 : 0;

	// Funções de controle
	function goToEvent(index) {
		if (index >= 0 && index < events.length) {
			currentEventIndex = index;
			updateProgress();
		}
	}

	function nextEvent() {
		if (currentEventIndex < events.length - 1) {
			goToEvent(currentEventIndex + 1);
		}
	}

	function prevEvent() {
		if (currentEventIndex > 0) {
			goToEvent(currentEventIndex - 1);
		}
	}

	function play() {
		isPlaying = true;
		if (autoAdvance) {
			autoTimer = setInterval(() => {
				if (currentEventIndex < events.length - 1) {
					nextEvent();
				} else {
					pause();
				}
			}, 4000);
		}
	}

	function pause() {
		isPlaying = false;
		if (autoTimer) {
			clearInterval(autoTimer);
			autoTimer = null;
		}
	}

	function togglePlay() {
		isPlaying ? pause() : play();
	}

	function updateProgress() {
		// Atualizar barra de progresso visual
		if (timelineElement) {
			const progressBar = timelineElement.querySelector('.timeline-progress-fill');
			if (progressBar) {
				progressBar.style.width = `${progressPercent}%`;
			}
		}
	}

	// Formatação de data
	function formatDate(dateString) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: 'long',
			year: 'numeric'
		});
	}

	// Lifecycle
	onMount(() => {
		updateProgress();
	});

	onDestroy(() => {
		if (autoTimer) {
			clearInterval(autoTimer);
		}
	});
</script>

<div
	class="timeline-container"
	class:full-width={fullWidth}
	style="--height: {height}; --bg: {currentTheme.bg}; --primary: {currentTheme.primary}; --secondary: {currentTheme.secondary}; --text: {currentTheme.text}; --accent: {currentTheme.accent}"
	bind:this={timelineElement}
>
	<!-- Header com controles -->
	<div class="timeline-header">
		<h2 class="timeline-title">Cronologia dos Eventos</h2>

		<div class="timeline-controls">
			<button
				class="control-btn"
				on:click={prevEvent}
				disabled={currentEventIndex === 0}
				title="Evento anterior"
			>
				⏮️
			</button>

			<button
				class="control-btn play-btn"
				on:click={togglePlay}
				title={isPlaying ? 'Pausar' : 'Reproduzir'}
			>
				{isPlaying ? '⏸️' : '▶️'}
			</button>

			<button
				class="control-btn"
				on:click={nextEvent}
				disabled={currentEventIndex === events.length - 1}
				title="Próximo evento"
			>
				⏭️
			</button>
		</div>
	</div>

	<!-- Barra de progresso -->
	{#if showProgress}
		<div class="timeline-progress">
			<div class="timeline-progress-track">
				<div class="timeline-progress-fill" style="width: {progressPercent}%"></div>
			</div>
			<span class="progress-text">
				{currentEventIndex + 1} de {events.length}
			</span>
		</div>
	{/if}

	<!-- Timeline visual -->
	<div class="timeline-visual">
		<!-- Linha principal -->
		<div class="timeline-line"></div>

		<!-- Eventos -->
		<div class="timeline-events">
			{#each events as event, index}
				<div
					class="timeline-event"
					class:active={index === currentEventIndex}
					class:completed={index < currentEventIndex}
					style="left: {(index / (events.length - 1)) * 100}%"
					on:click={() => goToEvent(index)}
					role="button"
					tabindex="0"
					title={event.title}
				>
					<div class="event-marker">
						<div class="event-dot"></div>
						{#if index <= currentEventIndex}
							<div class="event-pulse"></div>
						{/if}
					</div>

					<div class="event-label">
						<div class="event-date">{formatDate(event.date)}</div>
						<div class="event-title">{event.title}</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Conteúdo do evento atual -->
	<div class="timeline-content">
		{#if currentEvent}
			<div class="event-content" in:fly={{ y: 50, duration: 500 }}>
				<!-- Data destacada -->
				<div class="content-date">
					{formatDate(currentEvent.date)}
				</div>

				<!-- Título principal -->
				<h3 class="content-title">
					{currentEvent.title}
				</h3>

				<!-- Descrição -->
				{#if currentEvent.description}
					<div class="content-description">
						{@html currentEvent.description}
					</div>
				{/if}

				<!-- Mídia (se houver) -->
				{#if currentEvent.image}
					<div class="content-media">
						<img src={currentEvent.image} alt={currentEvent.title} loading="lazy" />
						{#if currentEvent.imageCaption}
							<figcaption>{currentEvent.imageCaption}</figcaption>
						{/if}
					</div>
				{/if}

				{#if currentEvent.video}
					<div class="content-media">
						<video src={currentEvent.video} controls poster={currentEvent.videoPoster}>
							Seu navegador não suporta vídeos.
						</video>
						{#if currentEvent.videoCaption}
							<figcaption>{currentEvent.videoCaption}</figcaption>
						{/if}
					</div>
				{/if}

				<!-- Tags/categorias -->
				{#if currentEvent.tags && currentEvent.tags.length > 0}
					<div class="content-tags">
						{#each currentEvent.tags as tag}
							<span class="tag">{tag}</span>
						{/each}
					</div>
				{/if}

				<!-- Importância/gravidade -->
				{#if currentEvent.severity}
					<div class="content-severity severity-{currentEvent.severity}">
						<span class="severity-label">
							{currentEvent.severity === 'high'
								? '🔴 Alta Gravidade'
								: currentEvent.severity === 'medium'
									? '🟡 Média Gravidade'
									: '🟢 Baixa Gravidade'}
						</span>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Navegação por setas do teclado -->
	<div class="keyboard-hint">Use ← → para navegar</div>
</div>

<svelte:window
	on:keydown={(e) => {
		if (e.key === 'ArrowLeft') prevEvent();
		if (e.key === 'ArrowRight') nextEvent();
		if (e.key === ' ') {
			e.preventDefault();
			togglePlay();
		}
	}}
/>

<style>
	.timeline-container {
		width: 100%;
		height: var(--height);
		background: var(--bg);
		color: var(--text);
		padding: 2rem;
		display: flex;
		flex-direction: column;
		position: relative;
		overflow: hidden;
	}

	.full-width {
		width: 100vw;
		margin-left: calc(-50vw + 50%);
	}

	/* Header */
	.timeline-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.timeline-title {
		font-size: 2rem;
		font-weight: bold;
		margin: 0;
		color: var(--primary);
	}

	.timeline-controls {
		display: flex;
		gap: 0.5rem;
	}

	.control-btn {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid var(--primary);
		color: var(--text);
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 1.2rem;
	}

	.control-btn:hover:not(:disabled) {
		background: var(--primary);
		transform: scale(1.05);
	}

	.control-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.play-btn {
		background: var(--primary);
	}

	/* Progresso */
	.timeline-progress {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.timeline-progress-track {
		flex: 1;
		height: 6px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 3px;
		overflow: hidden;
	}

	.timeline-progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--primary), var(--accent));
		transition: width 0.5s ease;
		border-radius: 3px;
	}

	.progress-text {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--secondary);
	}

	/* Timeline visual */
	.timeline-visual {
		position: relative;
		height: 100px;
		margin-bottom: 2rem;
	}

	.timeline-line {
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(90deg, var(--primary), var(--accent));
		border-radius: 2px;
		transform: translateY(-50%);
	}

	.timeline-events {
		position: relative;
		height: 100%;
	}

	.timeline-event {
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%);
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.event-marker {
		position: relative;
		width: 20px;
		height: 20px;
	}

	.event-dot {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: var(--text);
		border: 3px solid var(--primary);
		transition: all 0.3s ease;
	}

	.timeline-event.active .event-dot {
		background: var(--primary);
		box-shadow: 0 0 20px var(--primary);
		transform: scale(1.3);
	}

	.timeline-event.completed .event-dot {
		background: var(--accent);
		border-color: var(--accent);
	}

	.event-pulse {
		position: absolute;
		top: -5px;
		left: -5px;
		right: -5px;
		bottom: -5px;
		border: 2px solid var(--primary);
		border-radius: 50%;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0% {
			opacity: 1;
			transform: scale(1);
		}
		100% {
			opacity: 0;
			transform: scale(1.5);
		}
	}

	.event-label {
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-top: 1rem;
		text-align: center;
		min-width: 120px;
		opacity: 0.7;
		transition: opacity 0.3s ease;
	}

	.timeline-event.active .event-label {
		opacity: 1;
	}

	.event-date {
		font-size: 0.8rem;
		color: var(--secondary);
		margin-bottom: 0.25rem;
	}

	.event-title {
		font-size: 0.9rem;
		font-weight: 500;
		line-height: 1.2;
	}

	/* Conteúdo */
	.timeline-content {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 1rem;
		backdrop-filter: blur(10px);
	}

	.event-content {
		max-width: 800px;
		margin: 0 auto;
	}

	.content-date {
		font-size: 1.1rem;
		color: var(--secondary);
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.content-title {
		font-size: 2rem;
		font-weight: bold;
		margin-bottom: 1rem;
		color: var(--primary);
		line-height: 1.2;
	}

	.content-description {
		font-size: 1.1rem;
		line-height: 1.6;
		margin-bottom: 1.5rem;
	}

	.content-description :global(strong) {
		color: var(--primary);
	}

	.content-media {
		margin: 2rem 0;
		text-align: center;
	}

	.content-media img,
	.content-media video {
		max-width: 100%;
		height: auto;
		border-radius: 0.5rem;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
	}

	.content-media figcaption {
		margin-top: 0.5rem;
		font-size: 0.9rem;
		color: var(--secondary);
		font-style: italic;
	}

	.content-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 1rem 0;
	}

	.tag {
		background: var(--primary);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.8rem;
		font-weight: 500;
	}

	.content-severity {
		margin-top: 1rem;
		padding: 0.75rem;
		border-radius: 0.5rem;
		font-weight: 600;
	}

	.severity-high {
		background: rgba(239, 68, 68, 0.2);
		border-left: 4px solid #ef4444;
	}

	.severity-medium {
		background: rgba(245, 158, 11, 0.2);
		border-left: 4px solid #f59e0b;
	}

	.severity-low {
		background: rgba(16, 185, 129, 0.2);
		border-left: 4px solid #10b981;
	}

	.keyboard-hint {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
		font-size: 0.8rem;
		opacity: 0.5;
		background: rgba(0, 0, 0, 0.5);
		padding: 0.5rem;
		border-radius: 0.25rem;
	}

	/* Responsivo */
	@media (max-width: 768px) {
		.timeline-container {
			padding: 1rem;
			height: auto;
			min-height: var(--height);
		}

		.timeline-header {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}

		.timeline-title {
			font-size: 1.5rem;
		}

		.timeline-visual {
			height: 80px;
		}

		.event-label {
			font-size: 0.8rem;
			min-width: 80px;
		}

		.content-title {
			font-size: 1.5rem;
		}

		.keyboard-hint {
			display: none;
		}
	}
</style>
