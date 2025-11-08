<!-- DebugGloboPlayer.svelte - Para identificar problemas -->
<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// Props para debug
	export let videosIDs = null;
	export let videoId = null; // Alternativa
	export let id = null; // Outra alternativa

	// Props de controle
	export let width = '100%';
	export let height = 450;
	export let autoPlay = false;
	export let startMuted = true;
	export let maxQualityLevel = 'high';
	export let skipDFP = false;
	export let fullWidth = false;
	export let caption = '';
	export let credit = '';

	// Estado para debug
	let debugInfo = {
		propsReceived: {},
		finalVideoId: null,
		scriptStatus: 'not-loaded',
		playerStatus: 'not-created',
		errors: [],
		logs: []
	};

	let playerContainer;
	let player = null;

	// Função para log
	function addLog(message, type = 'info') {
		const timestamp = new Date().toLocaleTimeString();
		debugInfo.logs = [...debugInfo.logs, { timestamp, message, type }];
		console.log(`[GloboPlayer ${type.toUpperCase()}] ${message}`);
	}

	// Função para erro
	function addError(message, error = null) {
		debugInfo.errors = [...debugInfo.errors, { message, error: error?.toString() }];
		addLog(message, 'error');
		if (error) console.error(error);
	}

	// Debug das props recebidas
	function debugProps() {
		debugInfo.propsReceived = {
			videosIDs,
			videoId,
			id,
			width,
			height,
			autoPlay,
			startMuted,
			maxQualityLevel,
			skipDFP,
			fullWidth,
			caption,
			credit
		};

		// Determinar o ID final do vídeo
		debugInfo.finalVideoId = videosIDs || videoId || id;

		addLog('Props recebidas:', 'info');
		console.table(debugInfo.propsReceived);

		if (!debugInfo.finalVideoId) {
			addError('ERRO: Nenhum ID de vídeo fornecido! Verifique videosIDs, videoId ou id');
		} else {
			addLog(`ID do vídeo identificado: ${debugInfo.finalVideoId}`);
		}
	}

	// Função para carregar script da Globo
	async function loadGloboScript() {
		try {
			addLog('Iniciando carregamento do script da Globo...');
			debugInfo.scriptStatus = 'loading';

			// Verificar se já existe
			if (window.WM && window.WM.Player) {
				addLog('Script da Globo já carregado!');
				debugInfo.scriptStatus = 'loaded';
				return true;
			}

			// Verificar se script já existe no DOM
			const existingScript = document.querySelector('script[src*="glbimg.com"]');
			if (existingScript) {
				addLog('Script já existe no DOM, aguardando carregamento...');
				return new Promise((resolve, reject) => {
					existingScript.addEventListener('load', () => {
						debugInfo.scriptStatus = 'loaded';
						addLog('Script carregado via elemento existente');
						resolve(true);
					});
					existingScript.addEventListener('error', (e) => {
						debugInfo.scriptStatus = 'error';
						addError('Erro ao carregar script existente', e);
						reject(e);
					});
				});
			}

			// Criar novo script
			addLog('Criando novo elemento script...');
			const script = document.createElement('script');
			script.src =
				'https://s3.glbimg.com/v1/AUTH_e1b09a2d222b4900a437a46914be81e5/api/stable/web/api.min.js';
			script.async = true;

			return new Promise((resolve, reject) => {
				script.onload = () => {
					debugInfo.scriptStatus = 'loaded';
					addLog('Script carregado com sucesso!');

					// Verificar se WM está disponível
					if (window.WM) {
						addLog('window.WM disponível');
						if (window.WM.Player) {
							addLog('window.WM.Player disponível');
						} else {
							addError('window.WM.Player não encontrado');
						}
					} else {
						addError('window.WM não encontrado após carregamento');
					}

					resolve(true);
				};

				script.onerror = (e) => {
					debugInfo.scriptStatus = 'error';
					addError('Falha ao carregar script da Globo', e);
					reject(e);
				};

				document.head.appendChild(script);
				addLog('Script adicionado ao head');
			});
		} catch (error) {
			debugInfo.scriptStatus = 'error';
			addError('Erro inesperado ao carregar script', error);
			throw error;
		}
	}

	// Função para criar player
	async function createPlayer() {
		try {
			addLog('Iniciando criação do player...');
			debugInfo.playerStatus = 'creating';

			if (!debugInfo.finalVideoId) {
				throw new Error('ID do vídeo não fornecido');
			}

			// Aguardar playerAvailable se existir
			if (window.WM && window.WM.playerAvailable) {
				addLog('Aguardando WM.playerAvailable...');
				await window.WM.playerAvailable;
				addLog('WM.playerAvailable resolvido!');
			}

			// Configurar player
			const config = {
				videosIDs: debugInfo.finalVideoId,
				width: typeof width === 'number' ? `${width}px` : width,
				height: typeof height === 'number' ? `${height}px` : height,
				autoPlay,
				startMuted,
				maxQualityLevel,
				skipDFP,
				env: 'production'
			};

			addLog('Configuração do player:');
			console.table(config);

			// Criar player
			addLog('Criando instância do WM.Player...');
			player = new window.WM.Player(config);

			addLog('Player criado, anexando ao DOM...');
			if (playerContainer) {
				player.attachTo(playerContainer);
				debugInfo.playerStatus = 'attached';
				addLog('Player anexado com sucesso!');
			} else {
				throw new Error('Container do player não encontrado');
			}
		} catch (error) {
			debugInfo.playerStatus = 'error';
			addError('Erro ao criar player', error);
		}
	}

	// Inicialização
	onMount(async () => {
		if (!browser) {
			addLog('Não está no browser, pulando inicialização');
			return;
		}

		addLog('=== INICIANDO DEBUG DO GLOBOPLAYER ===');

		try {
			// 1. Debug das props
			debugProps();

			// 2. Carregar script
			await loadGloboScript();

			// 3. Criar player
			await createPlayer();

			addLog('=== DEBUG CONCLUÍDO ===');
		} catch (error) {
			addError('Erro fatal na inicialização', error);
		}
	});

	// Função para limpar logs
	function clearLogs() {
		debugInfo.logs = [];
		debugInfo.errors = [];
	}

	// Função para exportar debug
	function exportDebugInfo() {
		const debugData = {
			...debugInfo,
			timestamp: new Date().toISOString(),
			userAgent: navigator.userAgent,
			url: window.location.href
		};

		console.log('=== INFORMAÇÕES DE DEBUG ===');
		console.log(JSON.stringify(debugData, null, 2));

		// Copiar para clipboard se possível
		if (navigator.clipboard) {
			navigator.clipboard
				.writeText(JSON.stringify(debugData, null, 2))
				.then(() => addLog('Debug copiado para clipboard!'))
				.catch(() => addLog('Falha ao copiar para clipboard'));
		}
	}
</script>

<div class="debug-container">
	<div class="debug-header">
		<h3>🔍 Debug GloboPlayer</h3>
		<div class="debug-controls">
			<button on:click={clearLogs} class="btn btn-secondary">🗑️ Limpar</button>
			<button on:click={exportDebugInfo} class="btn btn-primary">📋 Exportar</button>
		</div>
	</div>

	<!-- Status Cards -->
	<div class="status-grid">
		<div
			class="status-card"
			class:success={debugInfo.finalVideoId}
			class:error={!debugInfo.finalVideoId}
		>
			<div class="status-icon">{debugInfo.finalVideoId ? '✅' : '❌'}</div>
			<div class="status-info">
				<div class="status-title">Video ID</div>
				<div class="status-value">{debugInfo.finalVideoId || 'NÃO ENCONTRADO'}</div>
			</div>
		</div>

		<div
			class="status-card"
			class:success={debugInfo.scriptStatus === 'loaded'}
			class:warning={debugInfo.scriptStatus === 'loading'}
			class:error={debugInfo.scriptStatus === 'error'}
		>
			<div class="status-icon">
				{#if debugInfo.scriptStatus === 'loaded'}✅
				{:else if debugInfo.scriptStatus === 'loading'}⏳
				{:else if debugInfo.scriptStatus === 'error'}❌
				{:else}⚪{/if}
			</div>
			<div class="status-info">
				<div class="status-title">Script Status</div>
				<div class="status-value">{debugInfo.scriptStatus}</div>
			</div>
		</div>

		<div
			class="status-card"
			class:success={debugInfo.playerStatus === 'attached'}
			class:warning={debugInfo.playerStatus === 'creating'}
			class:error={debugInfo.playerStatus === 'error'}
		>
			<div class="status-icon">
				{#if debugInfo.playerStatus === 'attached'}✅
				{:else if debugInfo.playerStatus === 'creating'}⏳
				{:else if debugInfo.playerStatus === 'error'}❌
				{:else}⚪{/if}
			</div>
			<div class="status-info">
				<div class="status-title">Player Status</div>
				<div class="status-value">{debugInfo.playerStatus}</div>
			</div>
		</div>

		<div
			class="status-card"
			class:success={debugInfo.errors.length === 0}
			class:error={debugInfo.errors.length > 0}
		>
			<div class="status-icon">{debugInfo.errors.length === 0 ? '✅' : '❌'}</div>
			<div class="status-info">
				<div class="status-title">Errors</div>
				<div class="status-value">{debugInfo.errors.length}</div>
			</div>
		</div>
	</div>

	<!-- Props Debug -->
	<div class="debug-section">
		<h4>📝 Props Recebidas</h4>
		<div class="props-grid">
			{#each Object.entries(debugInfo.propsReceived) as [key, value]}
				<div class="prop-item">
					<span class="prop-key">{key}:</span>
					<span class="prop-value" class:empty={!value}>{value || 'undefined'}</span>
				</div>
			{/each}
		</div>
	</div>

	<!-- Player Container -->
	<div class="player-section">
		<h4>🎬 Player Container</h4>
		<div
			bind:this={playerContainer}
			class="player-container"
			style="width: {width}; height: {height}px;"
		>
			{#if debugInfo.playerStatus === 'not-created'}
				<div class="placeholder">Aguardando criação do player...</div>
			{:else if debugInfo.playerStatus === 'creating'}
				<div class="placeholder">Criando player...</div>
			{:else if debugInfo.playerStatus === 'error'}
				<div class="placeholder error">Erro ao criar player</div>
			{:else}
				<div class="placeholder">Player deve aparecer aqui</div>
			{/if}
		</div>
	</div>

	<!-- Caption/Credit -->
	{#if caption || credit}
		<div class="media-caption">
			{#if caption}
				<p class="caption">{@html caption}</p>
			{/if}
			{#if credit}
				<p class="credit">{credit}</p>
			{/if}
		</div>
	{/if}

	<!-- Errors -->
	{#if debugInfo.errors.length > 0}
		<div class="debug-section">
			<h4>❌ Erros</h4>
			<div class="errors-list">
				{#each debugInfo.errors as error}
					<div class="error-item">
						<div class="error-message">{error.message}</div>
						{#if error.error}
							<div class="error-details">{error.error}</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Logs -->
	<div class="debug-section">
		<h4>📋 Logs ({debugInfo.logs.length})</h4>
		<div class="logs-container">
			{#each debugInfo.logs as log}
				<div
					class="log-entry"
					class:error={log.type === 'error'}
					class:warning={log.type === 'warning'}
				>
					<span class="log-time">{log.timestamp}</span>
					<span class="log-type">{log.type.toUpperCase()}</span>
					<span class="log-message">{log.message}</span>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.debug-container {
		border: 2px solid #ff6b35;
		border-radius: 8px;
		padding: 1.5rem;
		margin: 2rem 0;
		background: #fff;
		font-family: 'Courier New', monospace;
		font-size: 0.9rem;
	}

	.debug-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #eee;
	}

	.debug-header h3 {
		margin: 0;
		color: #ff6b35;
		font-size: 1.2rem;
	}

	.debug-controls {
		display: flex;
		gap: 0.5rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.8rem;
		transition: background-color 0.2s;
	}

	.btn-primary {
		background: #007bff;
		color: white;
	}

	.btn-secondary {
		background: #6c757d;
		color: white;
	}

	.btn:hover {
		opacity: 0.8;
	}

	.status-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.status-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: 6px;
		border: 1px solid #ddd;
		background: #f8f9fa;
	}

	.status-card.success {
		border-color: #28a745;
		background: #d4edda;
	}

	.status-card.warning {
		border-color: #ffc107;
		background: #fff3cd;
	}

	.status-card.error {
		border-color: #dc3545;
		background: #f8d7da;
	}

	.status-icon {
		font-size: 1.5rem;
	}

	.status-title {
		font-weight: bold;
		font-size: 0.8rem;
		color: #666;
	}

	.status-value {
		font-size: 0.9rem;
		color: #333;
	}

	.debug-section {
		margin-bottom: 1.5rem;
	}

	.debug-section h4 {
		margin: 0 0 1rem 0;
		color: #333;
		font-size: 1rem;
	}

	.props-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 0.5rem;
	}

	.prop-item {
		display: flex;
		gap: 0.5rem;
	}

	.prop-key {
		font-weight: bold;
		color: #666;
	}

	.prop-value {
		color: #333;
	}

	.prop-value.empty {
		color: #999;
		font-style: italic;
	}

	.player-container {
		border: 2px dashed #ddd;
		border-radius: 4px;
		background: #f8f9fa;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		position: relative;
	}

	.placeholder {
		text-align: center;
		color: #666;
		font-size: 0.9rem;
	}

	.placeholder.error {
		color: #dc3545;
	}

	.media-caption {
		text-align: center;
		margin-top: 1rem;
	}

	.caption {
		margin: 0 0 0.5rem 0;
		color: #666;
		font-size: 0.9rem;
	}

	.credit {
		margin: 0;
		color: #999;
		font-size: 0.8rem;
	}

	.errors-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.error-item {
		padding: 0.75rem;
		background: #f8d7da;
		border: 1px solid #dc3545;
		border-radius: 4px;
	}

	.error-message {
		font-weight: bold;
		color: #721c24;
	}

	.error-details {
		margin-top: 0.25rem;
		font-size: 0.8rem;
		color: #721c24;
		opacity: 0.8;
	}

	.logs-container {
		max-height: 300px;
		overflow-y: auto;
		border: 1px solid #ddd;
		border-radius: 4px;
		background: #f8f9fa;
	}

	.log-entry {
		display: flex;
		gap: 1rem;
		padding: 0.5rem;
		border-bottom: 1px solid #eee;
		font-size: 0.8rem;
	}

	.log-entry:last-child {
		border-bottom: none;
	}

	.log-entry.error {
		background: #f8d7da;
	}

	.log-entry.warning {
		background: #fff3cd;
	}

	.log-time {
		color: #666;
		font-weight: bold;
		min-width: 80px;
	}

	.log-type {
		color: #333;
		font-weight: bold;
		min-width: 60px;
	}

	.log-message {
		color: #333;
		flex: 1;
	}

	@media (max-width: 768px) {
		.debug-header {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.status-grid {
			grid-template-columns: 1fr;
		}

		.props-grid {
			grid-template-columns: 1fr;
		}

		.log-entry {
			flex-direction: column;
			gap: 0.25rem;
		}
	}
</style>
