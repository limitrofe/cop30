import { browser } from '$app/environment';

export const GLOBO_SCRIPT_URL =
	'https://s3.glbimg.com/v1/AUTH_e1b09a2d222b4900a437a46914be81e5/api/stable/web/api.min.js';

let scriptPromise = null;

function waitForWindowPlayer(resolve, reject) {
	if (window?.WM?.playerAvailable) {
		resolve(window.WM);
		return;
	}
	reject(new Error('A API da Globo (WM) foi carregada, mas não ficou disponível.'));
}

export function ensureGloboPlayerScript() {
	if (!browser) {
		return Promise.resolve(null);
	}

	if (window?.WM?.playerAvailable) {
		return Promise.resolve(window.WM);
	}

	if (scriptPromise) {
		return scriptPromise;
	}

	scriptPromise = new Promise((resolve, reject) => {
		const existingScript = document.querySelector(`script[src="${GLOBO_SCRIPT_URL}"]`);

		const handleLoad = () => waitForWindowPlayer(resolve, reject);
		const handleError = (event) =>
			reject(
				new Error('Falha ao carregar a API do player da Globo. Verifique seu Ad Blocker.', {
					cause: event
				})
			);

		if (existingScript) {
			existingScript.addEventListener('load', handleLoad, { once: true });
			existingScript.addEventListener('error', handleError, { once: true });
			return;
		}

		const script = document.createElement('script');
		script.src = GLOBO_SCRIPT_URL;
		script.async = true;
		script.onload = handleLoad;
		script.onerror = handleError;

		document.body.appendChild(script);
	});

	return scriptPromise;
}
