<!-- src/lib/components/story/GloboPlayer.svelte -->
<script>
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';

	// Script Loading Promise (Singleton)
	let scriptLoadPromise = null;
	function loadGloboScript() {
		if (scriptLoadPromise) {
			return scriptLoadPromise;
		}
		scriptLoadPromise = new Promise((resolve, reject) => {
			if (window.WM && window.WM.playerAvailable) {
				return resolve();
			}
			const scriptUrl =
				'https://s3.glbimg.com/v1/AUTH_e1b09a2d222b4900a437a46914be81e5/api/stable/web/api.min.js';
			const existingScript = document.querySelector(`script[src="${scriptUrl}"]`);
			if (existingScript) {
				existingScript.addEventListener('load', () => resolve(window.WM.playerAvailable));
				existingScript.addEventListener('error', (e) =>
					reject(new Error('Falha ao carregar script da Globo (existente).', e))
				);
				return;
			}
			const script = document.createElement('script');
			script.src = scriptUrl;
			script.async = true;
			script.onload = () => {
				resolve(window.WM.playerAvailable);
			};
			script.onerror = (e) => {
				reject(
					new Error('Falha ao carregar a API do player da Globo. Verifique seu Ad Blocker.', e)
				);
			};
			document.body.appendChild(script);
		});
		return scriptLoadPromise;
	}

	// --- 🎯 PROPS PRINCIPAIS (MOBILE FIRST) ---

	// ✅ IDs DE VÍDEO - MOBILE E DESKTOP SEPARADOS
	export let videoIdMobile = null; // ID específico para mobile
	export let videoIdDesktop = null; // ID específico para desktop
	export let videoId = null; // Fallback geral (compatibilidade)
	export let videosIDs = null; // Outro fallback (compatibilidade)

	// ✅ COR DE FUNDO CUSTOMIZÁVEL
	export let containerBackgroundColor = 'transparent'; // Cor do fundo da div container

	// ✅ DIMENSÕES RESPONSIVAS
	export let widthMobile = '100%'; // Largura no mobile
	export let widthDesktop = '100%'; // Largura no desktop
	export let aspectRatio = '16 / 9'; // Aspect ratio desktop
	export let aspectRatioMobile = '16 / 9'; // Aspect ratio mobile

	// Props originais mantidas para compatibilidade
	export let autoPlay = false;
	export let startMuted = true;
	export let skipDFP = false;
	export let loop = false;
	export let width = '100%'; // Deprecated, usar widthMobile/widthDesktop
	export let height = '100%';
	export let chromeless = false;
	export let allowRestrictedContent = true;
	export let allowLocation = true;
	export let exitFullscreenOnEnd = true;
	export let isLiveContent = false;
	export let preventBlackBars = false;
	export let includeResetStyle = true;
	export let disasterRecoveryMode = false;
	export let env = 'production';
	export let globoId = null;
	export let token = null;
	export let resumeAt = null;
	export let maxQualityLevel = null;
	export let defaultSubtitle = null;
	export let defaultAudio = null;
	export let adAccountId = null;
	export let adCmsId = null;
	export let adUnit = null;
	export let adCustomData = null;
	export let siteName = null;
	export let ga4 = null;
	export let caption = '';
	export let credit = '';
	export let fullWidth = false;
	export let autoplay = false;
	export let controls = true;
	export let showCaption = true;

	// --- VARIÁVEIS INTERNAS ---
	let playerElement;
	let playerInstance = null;
	let isLoading = false;
	let error = null;
	let isMuted = startMuted;
	const dispatch = createEventDispatcher();

	// Controle de estado
	let observer = null;
	let hasBeenInitialized = false;
	let isMobile = false;
	let publicControls;
	let lastPropStartMuted = startMuted;
	let isRecreatingForMute = false;

	function buildControls() {
		publicControls = {
			play: () => {
				try {
					return playerInstance?.play?.();
				} catch (controlError) {
					console.warn('GloboPlayer: falha ao dar play via controles públicos', controlError);
					return undefined;
				}
			},
			pause: () => {
				try {
					return playerInstance?.pause?.();
				} catch (controlError) {
					console.warn('GloboPlayer: falha ao pausar via controles públicos', controlError);
					return undefined;
				}
			},
			setMuted: (nextMuted) => setMutedState(!!nextMuted, { allowRecreate: true }),
			isMuted: () => isMuted,
			getPlayer: () => playerInstance
		};
		return publicControls;
	}

	function notifyControls(reason = 'update') {
		const controls = publicControls || buildControls();
		dispatch('controls', { controls, reason });
		return controls;
	}

	function setMutedState(nextMuted, options = {}) {
		const { allowRecreate = false } = options;
		isMuted = nextMuted;

		if (!playerInstance) {
			return false;
		}

		let applied = false;
		try {
			if (typeof playerInstance.setMuted === 'function') {
				playerInstance.setMuted(nextMuted);
				applied = true;
			} else if (typeof playerInstance.setMute === 'function') {
				playerInstance.setMute(nextMuted);
				applied = true;
			} else if (nextMuted && typeof playerInstance.mute === 'function') {
				playerInstance.mute();
				applied = true;
			} else if (!nextMuted && typeof playerInstance.unmute === 'function') {
				playerInstance.unmute();
				applied = true;
			} else if (typeof playerInstance.command === 'function') {
				try {
					playerInstance.command('mute', nextMuted);
					applied = true;
				} catch (commandError) {
					console.warn('GloboPlayer: comando mute falhou', commandError);
				}
			} else if (typeof playerInstance.setVolume === 'function') {
				playerInstance.setVolume(nextMuted ? 0 : 1);
				applied = true;
			} else if (playerElement) {
				const inlineVideo = playerElement.querySelector('video');
				if (inlineVideo) {
					inlineVideo.muted = nextMuted;
					inlineVideo.volume = nextMuted ? 0 : 1;
					applied = true;
				}
			}
		} catch (muteError) {
			console.warn('GloboPlayer: falha ao alterar estado de mute', muteError);
		}

		if (!applied && allowRecreate && !nextMuted && !isRecreatingForMute) {
			// Fallback: recria player para garantir áudio habilitado
			isRecreatingForMute = true;
			try {
				createPlayer(true, { preserveMuteState: true });
				applied = true;
			} finally {
				isRecreatingForMute = false;
			}
		}

		return applied;
	}

	// ✅ LÓGICA MOBILE FIRST - DETERMINA O ID CORRETO
	function getVideoId() {
		if (!browser) return null;

		// Mobile first: sempre verificar mobile primeiro
		if (isMobile) {
			// Se tem ID específico para mobile, usa ele
			if (videoIdMobile) return videoIdMobile;
			// Senão, fallback para o geral
			if (videoIdDesktop) return videoIdDesktop;
		} else {
			// Desktop: usa ID específico ou fallback
			if (videoIdDesktop) return videoIdDesktop;
			if (videoIdMobile) return videoIdMobile;
		}

		// Fallbacks de compatibilidade
		return videoId || videosIDs || null;
	}

	// Criar o player
	function createPlayer(shouldAutoplayOnCreate = false, options = {}) {
		const { preserveMuteState = false } = options;
		if (!browser || !window.WM || !window.WM.Player) {
			error = new Error('A API do player da Globo (WM) não está disponível.');
			isLoading = false;
			return;
		}

		const actualVideoId = getVideoId();
		if (!actualVideoId) {
			error = new Error('É necessário informar o videoId para criar o player!');
			isLoading = false;
			return;
		}

		// Destruir player anterior se existir
		if (playerInstance && typeof playerInstance.destroy === 'function') {
			playerInstance.destroy();
		}
		playerInstance = null;
		publicControls = null;
		if (!preserveMuteState) {
			lastPropStartMuted = startMuted;
			isMuted = !!lastPropStartMuted;
		}
		isLoading = true;
		error = null;

		const config = {
			source: Number(actualVideoId),
			autoPlay: shouldAutoplayOnCreate,
			startMuted: isMuted,
			skipDFP,
			width: '100%',
			height: '100%',
			chromeless,
			allowRestrictedContent,
			allowLocation,
			exitFullscreenOnEnd,
			isLiveContent,
			preventBlackBars,
			includeResetStyle,
			disasterRecoveryMode,
			env,
			globoId,
			token,
			resumeAt,
			maxQualityLevel,
			defaultSubtitle,
			defaultAudio,
			adAccountId,
			adCmsId,
			adUnit,
			adCustomData,
			siteName,
			ga4
		};

		// Limpar propriedades nulas
		Object.keys(config).forEach(
			(key) => (config[key] === null || config[key] === undefined) && delete config[key]
		);

		// Eventos
		config.events = {
			onError: (err) => {
				error = err;
				isLoading = false;
				dispatch('error', err);
			},
			onReady: () => {
				isLoading = false;
				if (shouldAutoplayOnCreate) playerInstance.play();
				setMutedState(isMuted, { allowRecreate: false });
				const controls = notifyControls('ready');
				dispatch('ready', { player: playerInstance, controls });
			},
			onEnded: () => {
				if (loop && playerInstance && typeof playerInstance.seek === 'function') {
					try {
						playerInstance.seek(0);
						if (typeof playerInstance.play === 'function') {
							playerInstance.play();
						}
					} catch (error) {
						console.warn('Erro ao reiniciar GloboPlayer em loop', error);
					}
				}
				dispatch('ended');
			},
			onPlay: () => dispatch('play'),
			onPause: () => dispatch('pause')
		};

		try {
			playerInstance = new window.WM.Player(config);
			playerInstance.attachTo(playerElement);
			setMutedState(isMuted, { allowRecreate: false });
			notifyControls('created');
		} catch (e) {
			error = e;
			isLoading = false;
		}
	}

	// Inicializar player
	async function initializePlayer(shouldPlay) {
		if (hasBeenInitialized || !browser) return;
		hasBeenInitialized = true;
		isLoading = true;

		try {
			await loadGloboScript();
			createPlayer(shouldPlay);
		} catch (err) {
			error = err;
			isLoading = false;
		}
	}

	// ✅ DETECTAR MOBILE E CONFIGURAR OBSERVER
	onMount(() => {
		if (!browser) return;

		// Mobile detection (mobile first)
		const checkMobile = () => {
			isMobile = window.innerWidth <= 768;
		};
		checkMobile();
		window.addEventListener('resize', checkMobile);

		// Intersection Observer para lazy loading
		const options = {
			root: null,
			rootMargin: '0px',
			threshold: 0.5
		};

		observer = new IntersectionObserver((entries) => {
			const entry = entries[0];
			const shouldPlayVideo = autoPlay || autoplay;

			if (entry.isIntersecting) {
				if (!hasBeenInitialized) {
					initializePlayer(shouldPlayVideo);
				} else if (playerInstance && typeof playerInstance.play === 'function' && shouldPlayVideo) {
					playerInstance.play();
				}
			} else {
				if (playerInstance && typeof playerInstance.pause === 'function' && shouldPlayVideo) {
					playerInstance.pause();
				}
			}
		}, options);

		if (playerElement) {
			observer.observe(playerElement);
		}

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});

	// Cleanup
	onDestroy(() => {
		if (observer && playerElement) {
			observer.unobserve(playerElement);
		}
		if (playerInstance && typeof playerInstance.destroy === 'function') {
			playerInstance.destroy();
			console.log('🗑️ GloboPlayer destruído');
		}
		dispatch('destroyed', { player: playerInstance, controls: publicControls });
		playerInstance = null;
		publicControls = null;
	});

	// Reativo: recriar player quando IDs mudarem
	$: if (
		browser &&
		(videoIdMobile || videoIdDesktop || videoId || videosIDs) &&
		hasBeenInitialized
	) {
		createPlayer(false);
	}

	$: if (startMuted !== lastPropStartMuted) {
		lastPropStartMuted = startMuted;
		isMuted = !!lastPropStartMuted;
		if (playerInstance) {
			setMutedState(isMuted, { allowRecreate: false });
		}
	}

	export function play() {
		return publicControls?.play?.();
	}

	export function pause() {
		return publicControls?.pause?.();
	}

	export function setMuted(muted) {
		return setMutedState(!!muted, { allowRecreate: true });
	}

	export function getMuted() {
		return isMuted;
	}
</script>

<!-- ✅ CONTAINER COM BACKGROUND CUSTOMIZÁVEL -->
<div class="video-section-wrapper" style="background-color: {containerBackgroundColor};">
	<div
		class="globo-player-container"
		class:full-width={fullWidth}
		style="--width-desktop: {widthDesktop}; --width-mobile: {widthMobile};"
	>
		<div
			class="player-wrapper"
			bind:this={playerElement}
			style="--aspect-ratio-desktop: {aspectRatio}; --aspect-ratio-mobile: {aspectRatioMobile};"
		>
			{#if isLoading}
				<div class="feedback-state loading-state">
					<div class="loading-spinner"></div>
					<div class="loading-text">Carregando player Globo...</div>
				</div>
			{:else if error}
				<div class="feedback-state error-state">
					<div class="error-icon">⚠️</div>
					<strong>Erro no Player Globo</strong>
					<p>{error.message || 'Ocorreu um erro.'}</p>
					<button
						on:click={() => {
							isLoading = true;
							error = null;
							initializePlayer(false);
						}}
					>
						Tentar novamente
					</button>
				</div>
			{/if}
		</div>

		{#if showCaption && (caption || credit)}
			<div class="media-caption">
				{#if caption}<div class="caption-text">{@html caption}</div>{/if}
				{#if credit}<div class="caption-credit">{@html credit}</div>{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	/* ✅ WRAPPER COM FUNDO CUSTOMIZÁVEL */
	.video-section-wrapper {
		width: 100%;
		position: relative;
		left: 50%;
		transform: translateX(-50%);
		padding: 0;
		display: flex;
		justify-content: center;
		/* A cor de fundo é aplicada via style inline */
	}

	/* ✅ CONTAINER RESPONSIVO MOBILE FIRST */
	.globo-player-container {
		width: var(--width-mobile);
		max-width: 100%;
		margin: 0 auto;
		position: relative;
	}

	/* ✅ DESKTOP: aplica largura de desktop */
	@media (min-width: 769px) {
		.globo-player-container {
			width: var(--width-desktop);
		}
	}

	/* ✅ FULL WIDTH: remove limitações */
	.globo-player-container.full-width {
		width: 100% !important;
		max-width: none;
	}

	/* ✅ REMOVE PADDING QUANDO FULL WIDTH */
	.video-section-wrapper:has(.full-width) {
		padding: 0;
	}

	/* ✅ PLAYER WRAPPER COM ASPECT RATIO RESPONSIVO */
	.player-wrapper {
		width: 100%;
		aspect-ratio: var(--aspect-ratio-mobile);
		position: relative;
		background: #000;
		border-radius: 4px;
		overflow: hidden;
	}

	/* ✅ DESKTOP: aspect ratio diferente */
	@media (min-width: 769px) {
		.player-wrapper {
			aspect-ratio: var(--aspect-ratio-desktop);
		}
	}

	/* ✅ ESTADOS DE FEEDBACK */
	.feedback-state {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: #f5f5f5;
		color: #333;
		text-align: center;
		padding: 1rem;
	}

	.loading-state {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.error-state {
		background: #fee;
		color: #d33;
		border: 2px solid #fcc;
	}

	.error-state button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: #d33;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.error-state button:hover {
		background: #b22;
	}

	/* ✅ LOADING SPINNER */
	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		border-top-color: white;
		animation: spin 1s ease-in-out infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.loading-text {
		font-size: 0.9rem;
		opacity: 0.9;
	}

	/* ✅ LEGENDAS */
	.media-caption {
		margin-top: 0.75rem;
		font-size: 0.9rem;
		line-height: 1.4;
	}

	.caption-text {
		color: #666;
		margin-bottom: 0.25rem;
	}

	.caption-credit {
		color: #999;
		font-size: 0.8rem;
		font-style: italic;
	}

	/* ✅ RESPONSIVIDADE ADICIONAL */
	@media (max-width: 480px) {
		.video-section-wrapper {
			padding: 1rem 0;
		}

		.media-caption {
			font-size: 0.85rem;
		}
	}
</style>
