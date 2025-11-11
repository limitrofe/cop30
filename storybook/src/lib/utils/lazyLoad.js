// src/lib/utils/lazyLoad.js

/**
 * Ação de Svelte para "lazy load" de mídias (imagens, vídeos, backgrounds).
 * Usa a API IntersectionObserver para carregar o conteúdo apenas quando
 * o elemento entra no viewport.
 *
 * @param {HTMLElement} node O elemento do DOM ao qual a ação é aplicada.
 */
export function lazyLoad(node) {
	const observer = new IntersectionObserver(
		(entries) => {
			// Checa se o elemento está visível
			if (entries[0].isIntersecting) {
				// Lógica para <img> e <picture>
				if (node.tagName === 'IMG') {
					const imgNode = node;
					if (imgNode.dataset.src) {
						imgNode.src = imgNode.dataset.src;
					}
					if (imgNode.dataset.srcset) {
						imgNode.srcset = imgNode.dataset.srcset;
					}

					// Se for parte de um <picture>, ativa os <source>
					if (imgNode.parentElement?.tagName === 'PICTURE') {
						const sources = imgNode.parentElement.querySelectorAll('source[data-srcset]');
						sources.forEach((source) => {
							source.srcset = source.dataset.srcset;
						});
					}
				}
				// Lógica para <video>
				else if (node.tagName === 'VIDEO') {
					const videoNode = node;
					const sources = videoNode.querySelectorAll('source[data-src]');
					sources.forEach((source) => {
						source.src = source.dataset.src;
					});
					videoNode.load(); // Carrega o vídeo para que possa ser reproduzido
				}
				// Lógica para backgrounds
				else {
					if (node.dataset.src) {
						node.style.backgroundImage = `url(${node.dataset.src})`;
					}
				}

				// Para a observação após o carregamento para economizar recursos
				observer.unobserve(node);
			}
		},
		{ rootMargin: '50px' }
	); // Começa a carregar 50px antes de entrar na tela

	// Inicia a observação do elemento
	observer.observe(node);

	return {
		destroy() {
			// Limpa o observer quando o componente é destruído
			observer.unobserve(node);
		}
	};
}
