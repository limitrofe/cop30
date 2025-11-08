// src/lib/utils/imageLoader.js

/**
 * ✅ UTILITÁRIO PARA CARREGAMENTO SEGURO DE IMAGENS
 * Garante que as imagens mobile sempre carreguem, mesmo com problemas de rede
 */

/**
 * Detecta se o dispositivo é mobile baseado na largura da tela
 */
export function isMobileDevice() {
	if (typeof window === 'undefined') return false;
	return window.innerWidth <= 768;
}

/**
 * Detecta se o dispositivo é mobile baseado no User Agent
 */
export function isMobileUserAgent() {
	if (typeof navigator === 'undefined') return false;
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Combina detecção de tela e user agent para maior precisão
 */
export function isMobile() {
	return isMobileDevice() || isMobileUserAgent();
}

/**
 * Escolhe a melhor URL de imagem baseada no dispositivo
 * @param {string} desktopSrc - URL da imagem desktop
 * @param {string} mobileSrc - URL da imagem mobile
 * @param {boolean} preferMobile - Forçar preferência mobile
 * @returns {string} URL da melhor imagem
 */
export function getBestImageSrc(desktopSrc, mobileSrc, preferMobile = false) {
	// Se não tem nenhuma imagem, retorna string vazia
	if (!desktopSrc && !mobileSrc) return '';

	// Se força mobile e tem mobile, usa mobile
	if (preferMobile && mobileSrc) return mobileSrc;

	// Se é mobile e tem versão mobile, usa mobile
	if (isMobile() && mobileSrc) return mobileSrc;

	// Senão, usa desktop como fallback, ou mobile se desktop não existir
	return desktopSrc || mobileSrc || '';
}

/**
 * Escolhe a melhor URL de vídeo baseada no dispositivo
 * @param {string} desktopSrc - URL do vídeo desktop
 * @param {string} mobileSrc - URL do vídeo mobile
 * @param {boolean} preferMobile - Forçar preferência mobile
 * @returns {string} URL do melhor vídeo
 */
export function getBestVideoSrc(desktopSrc, mobileSrc, preferMobile = false) {
	return getBestImageSrc(desktopSrc, mobileSrc, preferMobile);
}

/**
 * Testa se uma URL de imagem é válida e acessível
 * @param {string} url - URL para testar
 * @returns {Promise<boolean>} Promise que resolve com true se a imagem carregar
 */
export function testImageUrl(url) {
	return new Promise((resolve) => {
		if (!url) {
			resolve(false);
			return;
		}

		const img = new Image();

		img.onload = () => {
			console.log('✅ Imagem válida:', url);
			resolve(true);
		};

		img.onerror = () => {
			console.warn('❌ Imagem inválida:', url);
			resolve(false);
		};

		// Timeout de 5 segundos
		setTimeout(() => {
			console.warn('⏰ Timeout ao testar imagem:', url);
			resolve(false);
		}, 5000);

		img.src = url;
	});
}

/**
 * Testa múltiplas URLs e retorna a primeira que funcionar
 * @param {string[]} urls - Array de URLs para testar
 * @returns {Promise<string|null>} Promise que resolve com a primeira URL válida
 */
export async function findValidImageUrl(urls) {
	const validUrls = urls.filter((url) => url && url.trim());

	if (validUrls.length === 0) {
		console.warn('⚠️ Nenhuma URL fornecida para teste');
		return null;
	}

	console.log('🔍 Testando URLs:', validUrls);

	for (const url of validUrls) {
		const isValid = await testImageUrl(url);
		if (isValid) {
			console.log('✅ URL válida encontrada:', url);
			return url;
		}
	}

	console.error('❌ Nenhuma URL válida encontrada');
	return null;
}

/**
 * Resolve as melhores URLs para desktop e mobile, testando se necessário
 * @param {Object} options - Opções de configuração
 * @param {string} options.desktopSrc - URL desktop
 * @param {string} options.mobileSrc - URL mobile
 * @param {boolean} options.testUrls - Se deve testar URLs antes de retornar
 * @returns {Promise<{desktop: string, mobile: string, best: string}>}
 */
export async function resolveImageSources({ desktopSrc, mobileSrc, testUrls = false }) {
	let desktop = desktopSrc || '';
	let mobile = mobileSrc || desktopSrc || '';

	// Se deve testar URLs
	if (testUrls) {
		// Testa desktop
		if (desktop && !(await testImageUrl(desktop))) {
			console.warn('⚠️ URL desktop inválida, usando mobile como fallback');
			desktop = mobile;
		}

		// Testa mobile
		if (mobile && !(await testImageUrl(mobile))) {
			console.warn('⚠️ URL mobile inválida, usando desktop como fallback');
			mobile = desktop;
		}
	}

	const best = getBestImageSrc(desktop, mobile);

	return {
		desktop,
		mobile,
		best
	};
}

/**
 * Cria um elemento picture otimizado com fallbacks
 * @param {Object} options - Opções de configuração
 * @param {string} options.desktopSrc - URL desktop
 * @param {string} options.mobileSrc - URL mobile
 * @param {string} options.alt - Texto alternativo
 * @param {string} options.className - Classe CSS
 * @param {number} options.breakpoint - Breakpoint mobile em px
 * @returns {HTMLPictureElement} Elemento picture criado
 */
export function createOptimizedPicture({
	desktopSrc,
	mobileSrc,
	alt = '',
	className = '',
	breakpoint = 768
}) {
	const picture = document.createElement('picture');
	picture.className = className;

	// Source mobile
	if (mobileSrc && mobileSrc !== desktopSrc) {
		const sourceMobile = document.createElement('source');
		sourceMobile.media = `(max-width: ${breakpoint}px)`;
		sourceMobile.srcset = mobileSrc;
		picture.appendChild(sourceMobile);
	}

	// Source desktop
	if (desktopSrc) {
		const sourceDesktop = document.createElement('source');
		sourceDesktop.media = `(min-width: ${breakpoint + 1}px)`;
		sourceDesktop.srcset = desktopSrc;
		picture.appendChild(sourceDesktop);
	}

	// Img fallback
	const img = document.createElement('img');
	img.src = getBestImageSrc(desktopSrc, mobileSrc);
	img.alt = alt;
	img.loading = 'lazy';

	// Handler de erro com fallback inteligente
	img.onerror = (e) => {
		console.error('❌ Erro ao carregar imagem:', e.target.src);

		if (e.target.src === mobileSrc && desktopSrc) {
			console.log('📱➡️🖥️ Tentando fallback para desktop');
			e.target.src = desktopSrc;
		} else if (e.target.src === desktopSrc && mobileSrc) {
			console.log('🖥️➡️📱 Tentando fallback para mobile');
			e.target.src = mobileSrc;
		} else {
			console.log('❌ Nenhum fallback disponível');
			e.target.style.display = 'none';
		}
	};

	img.onload = (e) => {
		console.log('✅ Imagem carregada:', e.target.src);
	};

	picture.appendChild(img);
	return picture;
}

/**
 * Precarrega uma imagem
 * @param {string} src - URL da imagem
 * @returns {Promise<void>} Promise que resolve quando a imagem carregar
 */
export function preloadImage(src) {
	return new Promise((resolve, reject) => {
		if (!src) {
			reject(new Error('URL não fornecida'));
			return;
		}

		const img = new Image();
		img.onload = () => resolve();
		img.onerror = () => reject(new Error(`Falha ao precarregar: ${src}`));
		img.src = src;
	});
}

/**
 * Precarrega múltiplas imagens
 * @param {string[]} urls - Array de URLs
 * @returns {Promise<void[]>} Promise que resolve quando todas carregarem
 */
export function preloadImages(urls) {
	const validUrls = urls.filter((url) => url && url.trim());
	return Promise.all(validUrls.map(preloadImage));
}

/**
 * Debug helper - mostra informações sobre o dispositivo e imagens
 * @param {Object} images - Objeto com URLs das imagens
 */
export function debugImageInfo(images) {
	console.group('🔍 DEBUG: Informações de Imagem');
	console.log('📱 É Mobile (tela):', isMobileDevice());
	console.log('📱 É Mobile (UA):', isMobileUserAgent());
	console.log('📏 Largura da tela:', window.innerWidth + 'px');
	console.log('🖼️ Imagens disponíveis:', images);

	Object.entries(images).forEach(([key, url]) => {
		console.log(`   ${key}:`, url ? '✅' : '❌', url);
	});

	console.log('🎯 Melhor escolha:', getBestImageSrc(images.desktop, images.mobile));
	console.groupEnd();
}

export default {
	isMobile,
	isMobileDevice,
	isMobileUserAgent,
	getBestImageSrc,
	getBestVideoSrc,
	testImageUrl,
	findValidImageUrl,
	resolveImageSources,
	createOptimizedPicture,
	preloadImage,
	preloadImages,
	debugImageInfo
};
