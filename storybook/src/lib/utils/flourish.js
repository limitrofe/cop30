// src/lib/utils/flourish.js

let scriptPromise = null;
let isScriptLoaded = false;

/**
 * Função inteligente que carrega o script de embed do Flourish.
 * Ela garante que o script seja adicionado à página apenas uma vez,
 * não importa quantos componentes Flourish existam na página.
 * @returns {Promise<void>} Uma promessa que é resolvida quando o script está carregado e pronto.
 */
export function loadFlourishScript() {
	// Se já foi carregado, resolve imediatamente
	if (isScriptLoaded && window.Flourish) {
		console.log('🌺 Script Flourish já carregado');
		return Promise.resolve();
	}

	// Se já estamos carregando, retorna a promessa existente
	if (scriptPromise) {
		console.log('🌺 Script Flourish já sendo carregado...');
		return scriptPromise;
	}

	console.log('🌺 Iniciando carregamento do script Flourish...');

	// Cria a promessa apenas na primeira vez que a função é chamada
	scriptPromise = new Promise((resolve, reject) => {
		// Se o script já foi carregado por algum outro meio, resolve imediatamente
		if (window.Flourish) {
			console.log('🌺 Flourish já disponível globalmente');
			isScriptLoaded = true;
			return resolve();
		}

		// Verifica se o script já existe no DOM
		const existingScript = document.querySelector('script[src*="flourish.studio"]');
		if (existingScript) {
			console.log('🌺 Script Flourish já existe no DOM, aguardando carregamento...');

			// Se já existe, adiciona listeners para saber quando terminar
			existingScript.addEventListener('load', () => {
				console.log('✅ Script Flourish existente carregado');
				isScriptLoaded = true;
				resolve();
			});

			existingScript.addEventListener('error', () => {
				console.error('❌ Erro no script Flourish existente');
				reject(new Error('Script Flourish existente falhou'));
			});

			return;
		}

		// Cria novo script
		console.log('🌺 Criando novo script Flourish...');
		const script = document.createElement('script');
		script.src = 'https://public.flourish.studio/resources/embed.js';
		script.async = true;

		script.onload = () => {
			console.log('✅ Script do Flourish carregado com sucesso');

			const startedAt = Date.now();
			const maxWait = 5000;

			(function checkAvailability() {
				if (window.Flourish && window.Flourish.Live) {
					console.log('✅ window.Flourish disponível:', typeof window.Flourish);
					isScriptLoaded = true;
					resolve();
					return;
				}

				if (Date.now() - startedAt > maxWait) {
					console.error('❌ window.Flourish não está disponível após carregamento');
					scriptPromise = null; // permite tentativa futura
					reject(new Error('window.Flourish não disponível'));
					return;
				}

				requestAnimationFrame(checkAvailability);
			})();
		};

		script.onerror = () => {
			console.error('❌ Falha ao carregar o script do Flourish');
			scriptPromise = null; // Reset para permitir retry
			reject(new Error('Não foi possível carregar o script do Flourish'));
		};

		document.head.appendChild(script);
		console.log('🌺 Script Flourish adicionado ao DOM');
	});

	return scriptPromise;
}

/**
 * Verifica se o Flourish está disponível
 * @returns {boolean}
 */
export function isFlourishAvailable() {
	return isScriptLoaded && window.Flourish && typeof window.Flourish.Live === 'function';
}

/**
 * Aguarda o Flourish estar disponível com timeout
 * @param {number} timeout - Timeout em ms (padrão: 10000)
 * @returns {Promise<void>}
 */
export function waitForFlourish(timeout = 10000) {
	return new Promise((resolve, reject) => {
		if (isFlourishAvailable()) {
			return resolve();
		}

		const startTime = Date.now();
		const checkInterval = setInterval(() => {
			if (isFlourishAvailable()) {
				clearInterval(checkInterval);
				resolve();
			} else if (Date.now() - startTime > timeout) {
				clearInterval(checkInterval);
				reject(new Error('Timeout aguardando Flourish'));
			}
		}, 100);
	});
}

/**
 * Debug: Mostra informações sobre o estado do Flourish
 */
export function debugFlourish() {
	console.log('🔍 Flourish Debug Info:', {
		scriptLoaded: isScriptLoaded,
		windowFlourish: !!window.Flourish,
		flourishLive: !!(window.Flourish && window.Flourish.Live),
		scriptInDom: !!document.querySelector('script[src*="flourish.studio"]'),
		promiseExists: !!scriptPromise
	});
}
