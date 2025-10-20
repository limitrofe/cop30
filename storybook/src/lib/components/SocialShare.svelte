<!-- src/lib/components/SocialShare.svelte -->
<script>
	import { trackShareClick } from '$lib/utils/analytics.js';
	import { browser } from '$app/environment';

	export let title = '';
	export let description = '';
	export let url = '';
	export let image = '';
	export let author = '';
	export let position = 'floating'; // 'floating', 'inline', 'sticky'
	export let theme = 'default'; // 'default', 'minimal', 'colorful'
	export let platforms = ['facebook', 'twitter', 'whatsapp', 'linkedin', 'copy'];

	let showShareMenu = false;
	let copied = false;

	// URLs de compartilhamento
	const shareUrls = {
		facebook: (url, title) =>
			`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,

		twitter: (url, title, author) =>
			`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}${author ? `&via=${author}` : ''}`,

		whatsapp: (url, title) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,

		linkedin: (url, title, description) =>
			`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,

		telegram: (url, title) =>
			`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,

		reddit: (url, title) =>
			`https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,

		pinterest: (url, title, image) =>
			`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(image)}&description=${encodeURIComponent(title)}`
	};

	// Ícones das plataformas
	const platformIcons = {
		facebook: '📘',
		twitter: '🐦',
		whatsapp: '💬',
		linkedin: '💼',
		telegram: '✈️',
		reddit: '🔴',
		pinterest: '📌',
		copy: '📋'
	};

	const platformLabels = {
		facebook: 'Facebook',
		twitter: 'Twitter',
		whatsapp: 'WhatsApp',
		linkedin: 'LinkedIn',
		telegram: 'Telegram',
		reddit: 'Reddit',
		pinterest: 'Pinterest',
		copy: 'Copiar Link'
	};

	function getShareUrl(platform) {
		if (!browser) return '#';

		const currentUrl = url || window.location.href;
		const shareTitle = title || document.title;

		switch (platform) {
			case 'facebook':
				return shareUrls.facebook(currentUrl, shareTitle);
			case 'twitter':
				return shareUrls.twitter(currentUrl, shareTitle, author);
			case 'whatsapp':
				return shareUrls.whatsapp(currentUrl, shareTitle);
			case 'linkedin':
				return shareUrls.linkedin(currentUrl, shareTitle, description);
			case 'telegram':
				return shareUrls.telegram(currentUrl, shareTitle);
			case 'reddit':
				return shareUrls.reddit(currentUrl, shareTitle);
			case 'pinterest':
				return shareUrls.pinterest(currentUrl, shareTitle, image);
			default:
				return '#';
		}
	}

	function shareToPlatform(platform, event) {
		if (platform === 'copy') {
			copyToClipboard();
			return;
		}

		// Analytics
		trackShareClick(platform, title);

		// Abrir popup de compartilhamento
		const shareUrl = getShareUrl(platform);
		const popup = window.open(
			shareUrl,
			'share',
			'width=600,height=400,scrollbars=yes,resizable=yes'
		);

		// Fechar menu após compartilhar
		showShareMenu = false;
	}

	async function copyToClipboard() {
		const currentUrl = url || window.location.href;

		try {
			await navigator.clipboard.writeText(currentUrl);
			copied = true;
			trackShareClick('copy_link', title);

			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (err) {
			console.error('Erro ao copiar:', err);
			// Fallback para browsers mais antigos
			fallbackCopy(currentUrl);
		}
	}

	function fallbackCopy(text) {
		const textArea = document.createElement('textarea');
		textArea.value = text;
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();

		try {
			document.execCommand('copy');
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch (err) {
			console.error('Fallback copy failed:', err);
		}

		document.body.removeChild(textArea);
	}

	function toggleShareMenu() {
		showShareMenu = !showShareMenu;
	}

	// Usar Web Share API se disponível
	async function nativeShare() {
		if (navigator.share) {
			try {
				await navigator.share({
					title: title,
					text: description,
					url: url || window.location.href
				});
				trackShareClick('native_share', title);
			} catch (err) {
				if (err.name !== 'AbortError') {
					console.error('Erro no compartilhamento nativo:', err);
				}
			}
		} else {
			toggleShareMenu();
		}
	}

	// Fechar menu ao clicar fora
	function handleClickOutside(event) {
		if (!event.target.closest('.social-share')) {
			showShareMenu = false;
		}
	}

	$: if (browser && showShareMenu) {
		document.addEventListener('click', handleClickOutside);
	} else if (browser) {
		document.removeEventListener('click', handleClickOutside);
	}
</script>

<div class="social-share social-share--{position} social-share--{theme}">
	<!-- Botão principal -->
	<button class="social-share__trigger" on:click={nativeShare} title="Compartilhar esta história">
		<span class="social-share__icon">📤</span>
		<span class="social-share__label">Compartilhar</span>
	</button>

	<!-- Menu de plataformas -->
	{#if showShareMenu}
		<div class="social-share__menu" class:visible={showShareMenu}>
			<div class="social-share__header">
				<h4>Compartilhar história</h4>
				<button class="social-share__close" on:click={toggleShareMenu}> ✕ </button>
			</div>

			<div class="social-share__platforms">
				{#each platforms as platform}
					<button
						class="social-share__platform"
						class:copied={platform === 'copy' && copied}
						on:click={(e) => shareToPlatform(platform, e)}
						title="Compartilhar no {platformLabels[platform]}"
					>
						<span class="social-share__platform-icon">
							{platformIcons[platform]}
						</span>
						<span class="social-share__platform-label">
							{platform === 'copy' && copied ? 'Copiado!' : platformLabels[platform]}
						</span>
					</button>
				{/each}
			</div>

			{#if title}
				<div class="social-share__preview">
					<h5>"{title}"</h5>
					{#if author}
						<p>por {author}</p>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Overlay para mobile -->
	{#if showShareMenu}
		<div class="social-share__overlay" on:click={toggleShareMenu}></div>
	{/if}
</div>

<style>
	.social-share {
		position: relative;
		z-index: 100;
	}

	/* Posicionamentos */
	.social-share--floating {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
	}

	.social-share--sticky {
		position: sticky;
		top: 1rem;
		margin: 1rem 0;
	}

	.social-share--inline {
		display: inline-block;
		margin: 1rem 0;
	}

	/* Botão principal */
	.social-share__trigger {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: 24px;
		cursor: pointer;
		font-size: var(--font-size-50);
		font-weight: 600;
		box-shadow: 0 4px 12px rgba(196, 23, 12, 0.3);
		transition: all 0.3s ease;
	}

	.social-share__trigger:hover {
		background: #a61409;
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(196, 23, 12, 0.4);
	}

	.social-share__icon {
		font-size: 1.2rem;
	}

	/* Temas */
	.social-share--minimal .social-share__trigger {
		background: var(--color-background);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.social-share--minimal .social-share__trigger:hover {
		background: var(--color-highlight-bg);
	}

	.social-share--colorful .social-share__trigger {
		background: linear-gradient(45deg, #ff6b35, #f7931e);
	}

	.social-share--colorful .social-share__trigger:hover {
		background: linear-gradient(45deg, #e55a2e, #e8851a);
	}

	/* Menu */
	.social-share__menu {
		position: absolute;
		bottom: 100%;
		right: 0;
		margin-bottom: 1rem;
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
		min-width: 280px;
		opacity: 0;
		transform: translateY(10px) scale(0.95);
		transition: all 0.3s ease;
		pointer-events: none;
	}

	.social-share__menu.visible {
		opacity: 1;
		transform: translateY(0) scale(1);
		pointer-events: auto;
	}

	.social-share__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid var(--color-border);
	}

	.social-share__header h4 {
		margin: 0;
		font-size: var(--font-size-60);
		font-weight: 600;
		color: var(--color-text);
	}

	.social-share__close {
		background: none;
		border: none;
		color: var(--color-secondary);
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.social-share__close:hover {
		background: var(--color-highlight-bg);
		color: var(--color-text);
	}

	.social-share__platforms {
		padding: 1rem;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}

	.social-share__platform {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--color-highlight-bg);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		font-size: var(--font-size-50);
	}

	.social-share__platform:hover {
		background: var(--color-border);
		transform: translateY(-1px);
	}

	.social-share__platform.copied {
		background: #d4edda;
		border-color: #28a745;
		color: #155724;
	}

	.social-share__platform-icon {
		font-size: 1.5rem;
		min-width: 24px;
	}

	.social-share__platform-label {
		font-weight: 500;
		color: var(--color-text);
	}

	.social-share__preview {
		padding: 1rem;
		border-top: 1px solid var(--color-border);
		background: var(--color-highlight-bg);
	}

	.social-share__preview h5 {
		margin: 0 0 0.5rem 0;
		font-size: var(--font-size-50);
		font-weight: 600;
		color: var(--color-text);
		line-height: 1.3;
	}

	.social-share__preview p {
		margin: 0;
		font-size: var(--font-size-40);
		color: var(--color-secondary);
	}

	/* Overlay para mobile */
	.social-share__overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		z-index: -1;
		opacity: 0;
		animation: fadeIn 0.3s ease forwards;
	}

	@keyframes fadeIn {
		to {
			opacity: 1;
		}
	}

	/* Mobile */
	@media (max-width: 768px) {
		.social-share--floating {
			bottom: 1rem;
			right: 1rem;
		}

		.social-share__trigger {
			padding: 0.6rem 0.9rem;
			font-size: var(--font-size-45);
		}

		.social-share__label {
			display: none; /* Só mostra ícone no mobile */
		}

		.social-share__menu {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			margin: 0;
			border-radius: 16px 16px 0 0;
			max-width: none;
			width: 100%;
			transform: translateY(100%);
		}

		.social-share__menu.visible {
			transform: translateY(0);
		}

		.social-share__platforms {
			grid-template-columns: repeat(3, 1fr);
			gap: 0.5rem;
		}

		.social-share__platform {
			flex-direction: column;
			text-align: center;
			padding: 1rem 0.5rem;
			gap: 0.5rem;
		}

		.social-share__platform-label {
			font-size: var(--font-size-40);
		}
	}

	/* Estados especiais */
	.social-share--hidden {
		display: none;
	}

	/* Animações */
	@keyframes bounce {
		0%,
		20%,
		53%,
		80%,
		100% {
			transform: translate3d(0, 0, 0);
		}
		40%,
		43% {
			transform: translate3d(0, -8px, 0);
		}
		70% {
			transform: translate3d(0, -4px, 0);
		}
		90% {
			transform: translate3d(0, -2px, 0);
		}
	}

	.social-share__trigger:active {
		animation: bounce 0.6s ease;
	}

	/* Acessibilidade */
	@media (prefers-reduced-motion: reduce) {
		.social-share__trigger,
		.social-share__menu,
		.social-share__platform {
			transition: none;
		}

		.social-share__trigger:active {
			animation: none;
		}
	}

	/* Alto contraste */
	@media (prefers-contrast: high) {
		.social-share__trigger {
			border: 2px solid currentColor;
		}

		.social-share__menu {
			border-width: 2px;
		}
	}
</style>
