<script>
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	// Props básicas
	export let framePrefix = '';
	export let framePrefixMobile = '';
	export let totalFrames = 181;
	export let frameExtension = '.jpg';
	export let frameExtensionMobile = '.webp';
	export let framePadding = 4;
	export let startFrame = 1;
	export let endFrame = null;
	export let height = '400vh';
	export let showProgress = true;
	export let showFrameCounter = false;

	// NOVA: Config simples para suavizar
	export let smoothFactor = 0.1; // 0.05 = muito suave, 0.2 = mais rápido
	export let preloadRadius = 10; // Quantos frames ao redor carregar
	export let preloadInitial = 30; // Quantos frames carregar no início
	export let enableKinetic = true; // Kinetic scroll
	export let friction = 0.88; // Friction do kinetic (0.8 = para rápido, 0.95 = desliza mais)

	// Estado básico
	let scrollContainer;
	let canvas;
	let ctx;
	let frames = new Map();
	let loadingFrames = new Set();
	let currentFrame = startFrame;
	let targetFrame = startFrame;
	let isMobile = false;
	let isLoading = true;
	let loadProgress = 0;

	// NOVO: Estado do kinetic
	let isScrolling = false;
	let scrollVelocity = 0;
	let lastScrollTime = 0;
	let lastTargetFrame = startFrame;

	// Computed
	$: finalFrame = endFrame || totalFrames;
	$: frameRange = finalFrame - startFrame + 1;
	$: progress = ((currentFrame - startFrame) / (frameRange - 1)) * 100;

	function detectMobile() {
		return window.innerWidth <= 768;
	}

	function getFrameUrl(frameNum) {
		const paddedNum = frameNum.toString().padStart(framePadding, '0');
		const prefix = isMobile && framePrefixMobile ? framePrefixMobile : framePrefix;
		const extension = isMobile && frameExtensionMobile ? frameExtensionMobile : frameExtension;
		return `${prefix}${paddedNum}${extension}`;
	}

	function setupCanvas() {
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		canvas.width = rect.width;
		canvas.height = rect.height;
		ctx = canvas.getContext('2d');
	}

	async function loadFrame(frameNum) {
		if (frames.has(frameNum) || loadingFrames.has(frameNum)) {
			return frames.get(frameNum);
		}

		loadingFrames.add(frameNum);

		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				frames.set(frameNum, img);
				loadingFrames.delete(frameNum);
				updateLoadProgress();
				resolve(img);
			};
			img.onerror = () => {
				loadingFrames.delete(frameNum);
				reject();
			};
			img.src = getFrameUrl(frameNum);
		});
	}

	function updateLoadProgress() {
		loadProgress = (frames.size / Math.min(preloadInitial, frameRange)) * 100;
	}

	// MELHORADO: Preload agressivo dos frames próximos
	async function preloadNearby(centerFrame) {
		const promises = [];

		for (let i = -preloadRadius; i <= preloadRadius; i++) {
			const frameNum = centerFrame + i;
			if (frameNum >= startFrame && frameNum <= finalFrame && !frames.has(frameNum)) {
				promises.push(loadFrame(frameNum).catch(() => {}));
			}
		}

		await Promise.allSettled(promises);
	}

	function drawFrame(frameNum) {
		if (!ctx || !frames.has(frameNum)) return;

		const img = frames.get(frameNum);
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Calcular para preencher o canvas (object-fit: cover)
		const imgRatio = img.width / img.height;
		const canvasRatio = canvas.width / canvas.height;

		let drawWidth, drawHeight, drawX, drawY;

		if (imgRatio > canvasRatio) {
			drawHeight = canvas.height;
			drawWidth = drawHeight * imgRatio;
			drawX = (canvas.width - drawWidth) / 2;
			drawY = 0;
		} else {
			drawWidth = canvas.width;
			drawHeight = drawWidth / imgRatio;
			drawX = 0;
			drawY = (canvas.height - drawHeight) / 2;
		}

		ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
	}

	// NÚCLEO: Atualizar target baseado no scroll
	function updateTargetFromScroll() {
		if (!scrollContainer) return;

		const rect = scrollContainer.getBoundingClientRect();
		const windowHeight = window.innerHeight;

		let scrollProgress = 0;

		if (rect.top <= 0 && rect.bottom >= windowHeight) {
			const scrolled = Math.abs(rect.top);
			const scrollableHeight = rect.height - windowHeight;
			scrollProgress = scrolled / scrollableHeight;
		} else if (rect.top > 0) {
			scrollProgress = 0;
		} else {
			scrollProgress = 1;
		}

		scrollProgress = Math.max(0, Math.min(1, scrollProgress));
		targetFrame = Math.round(startFrame + (frameRange - 1) * scrollProgress);
	}

	// NÚCLEO: Smooth interpolation
	function smoothUpdate() {
		if (targetFrame !== currentFrame) {
			// Interpolação simples: vai um pouco em direção ao target
			const diff = targetFrame - currentFrame;
			const step = diff * smoothFactor;

			// Se a diferença é menor que 1, vai direto
			if (Math.abs(diff) < 1) {
				currentFrame = targetFrame;
			} else {
				currentFrame += step;
				currentFrame = Math.round(currentFrame);
			}

			// Garantir limites
			currentFrame = Math.max(startFrame, Math.min(finalFrame, currentFrame));

			// Renderizar se temos o frame
			if (frames.has(currentFrame)) {
				drawFrame(currentFrame);

				// NOVO: Preload dos frames próximos em background
				preloadNearby(currentFrame);
			} else {
				// Se não tem o frame, mostra o anterior enquanto carrega
				loadFrame(currentFrame)
					.then(() => {
						// Só desenha se ainda é o frame atual
						if (Math.abs(currentFrame - targetFrame) < 2) {
							drawFrame(currentFrame);
							preloadNearby(currentFrame);
						}
					})
					.catch(() => {});
			}
		}
	}

	// Loop principal SIMPLES
	let rafId;
	function startLoop() {
		function loop() {
			updateTargetFromScroll();
			smoothUpdate();
			rafId = requestAnimationFrame(loop);
		}
		loop();
	}

	function stopLoop() {
		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
	}

	// MELHORADO: Preload inicial mais agressivo
	async function preloadKey() {
		try {
			// Carregar primeiro frame
			await loadFrame(startFrame);
			drawFrame(startFrame);

			// Carregar frames iniciais em sequência (para não travar no começo)
			const initialFrames = [];
			for (let i = 0; i < Math.min(preloadInitial, frameRange); i++) {
				const frameNum = startFrame + i;
				if (frameNum <= finalFrame) {
					initialFrames.push(loadFrame(frameNum));
				}
			}

			// Carregar em lotes para não sobrecarregar
			const batchSize = 5;
			for (let i = 0; i < initialFrames.length; i += batchSize) {
				const batch = initialFrames.slice(i, i + batchSize);
				await Promise.allSettled(batch);

				// Pequena pausa entre lotes para não travar a UI
				await new Promise((resolve) => setTimeout(resolve, 50));
			}

			// Agora carregar frames-chave do resto em background
			const keyFrames = [
				startFrame + Math.floor(frameRange * 0.25),
				startFrame + Math.floor(frameRange * 0.5),
				startFrame + Math.floor(frameRange * 0.75),
				finalFrame
			];

			keyFrames.forEach((frame) => {
				if (frame <= finalFrame && !frames.has(frame)) {
					loadFrame(frame).catch(() => {});
				}
			});

			isLoading = false;
		} catch (err) {
			console.error('Erro no preload:', err);
			isLoading = false;
		}
	}

	// Intersection observer simples
	let observer;
	function setupObserver() {
		observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					startLoop();
				} else {
					stopLoop();
				}
			},
			{ threshold: 0.1 }
		);

		if (scrollContainer) {
			observer.observe(scrollContainer);
		}
	}

	// Lifecycle
	onMount(() => {
		if (!browser) return;

		isMobile = detectMobile();
		setupCanvas();
		setupObserver();
		preloadKey();

		window.addEventListener('resize', () => {
			isMobile = detectMobile();
			setupCanvas();
			if (frames.has(currentFrame)) {
				drawFrame(currentFrame);
			}
		});
	});

	onDestroy(() => {
		stopLoop();
		if (observer) observer.disconnect();
		frames.clear();
	});
</script>

<div class="container" bind:this={scrollContainer} style:height>
	<div class="player">
		<canvas bind:this={canvas}></canvas>

		{#if isLoading}
			<div class="loading">
				<div class="spinner"></div>
				<div>Carregando frames...</div>
				<div class="progress-text">{Math.round(loadProgress)}%</div>
				<div class="loading-bar">
					<div class="loading-fill" style:width="{loadProgress}%"></div>
				</div>
			</div>
		{/if}

		{#if showProgress && !isLoading}
			<div class="progress">
				<div class="bar" style:width="{progress}%"></div>
			</div>
		{/if}

		{#if showFrameCounter && !isLoading}
			<div class="counter">
				{currentFrame} / {finalFrame}
			</div>
		{/if}
	</div>
</div>

<style>
	.container {
		position: relative;
		width: 100%;
	}

	.player {
		position: sticky;
		top: 0;
		width: 100%;
		height: 100vh;
		background: #000;
		overflow: hidden;
	}

	canvas {
		width: 100%;
		height: 100%;
		display: block;
	}

	.loading {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: white;
		text-align: center;
	}

	.spinner {
		width: 30px;
		height: 30px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 10px;
	}

	.progress-text {
		font-family: monospace;
		font-size: 14px;
		margin: 10px 0 5px;
		opacity: 0.8;
	}

	.loading-bar {
		width: 200px;
		height: 3px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 2px;
		overflow: hidden;
		margin: 0 auto;
	}

	.loading-fill {
		height: 100%;
		background: linear-gradient(90deg, #ff6b6b, #4ecdc4);
		transition: width 0.3s ease;
	}

	.progress {
		position: absolute;
		bottom: 20px;
		left: 20px;
		right: 20px;
		height: 3px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 2px;
	}

	.bar {
		height: 100%;
		background: white;
		border-radius: 2px;
	}

	.counter {
		position: absolute;
		top: 20px;
		right: 20px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 5px 10px;
		border-radius: 3px;
		font-family: monospace;
		font-size: 12px;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.progress {
			bottom: 10px;
			left: 10px;
			right: 10px;
		}

		.counter {
			top: 10px;
			right: 10px;
			padding: 4px 8px;
			font-size: 11px;
		}
	}
</style>
