<!-- src/lib/components/navigation/StickyNavigationMenu.svelte -->
<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// Props
	export let storyData = null;
	export let seriesName = 'A trama do golpe';

	// Estado do componente
	let isMenuOpen = false;
	let isVisible = true;
	let lastScrollY = 0;
	let anchors = [];
	let activeSection = '';
	let menuElement;

	// Detectar âncoras automaticamente do storyData
	$: if (storyData && storyData.paragraphs) {
		anchors = extractAnchorsFromStory(storyData.paragraphs);
	}

	/**
	 * Mapeamento de IDs para nomes com acentos e caracteres especiais
	 */
	const ANCHOR_NAMES = {
		sinopse: 'Sinopse',
		personagens: 'Personagens',
		'sobre-o-livro': 'Sobre o Livro',
		'sobre-raphael-montes': 'Sobre Raphael Montes',
		'diferencas-entre-o-livro-e-a-serie': 'Diferenças Entre o Livro e a Série',
		'conteudos-relacionado': 'Conteúdos Relacionados',
		curiosidades: 'Curiosidades',
		bastidores: 'Bastidores',
		entrevistas: 'Entrevistas',
		fotos: 'Fotos',
		videos: 'Vídeos',
		creditos: 'Créditos',
		'proximos-episodios': 'Próximos Episódios',
		temporadas: 'Temporadas',
		elenco: 'Elenco',
		producao: 'Produção',
		locacoes: 'Locações',
		'trilha-sonora': 'Trilha Sonora',
		premios: 'Prêmios',
		critica: 'Crítica',
		avaliacoes: 'Avaliações',
		'making-of': 'Making Of'
	};

	/**
	 * Extrai âncoras do JSON da história vindas do Google Docs
	 */
	function extractAnchorsFromStory(paragraphs) {
		if (!paragraphs || !Array.isArray(paragraphs)) return [];

		return paragraphs
			.filter((p) => p.type === 'ancora' && p.id)
			.map((anchor, index) => {
				// Primeiro: tentar usar o mapeamento personalizado
				let name = ANCHOR_NAMES[anchor.id];

				if (!name) {
					// Segundo: buscar o próximo título após a âncora
					const anchorIndex = paragraphs.indexOf(anchor);
					const nextTitleIndex = paragraphs.findIndex(
						(p, i) => i > anchorIndex && (p.type === 'intertitulo' || p.type === 'titulo') && p.text
					);

					const nextTitle = nextTitleIndex !== -1 ? paragraphs[nextTitleIndex] : null;

					if (nextTitle) {
						name = cleanTitle(nextTitle.text);
					} else {
						// Terceiro: formatar o ID da âncora como fallback
						name = formatAnchorId(anchor.id);
					}
				}

				return {
					id: anchor.id,
					name: name
				};
			});
	}

	/**
	 * Formata o ID da âncora para um nome legível
	 */
	function formatAnchorId(id) {
		return id
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	/**
	 * Limpa o título removendo tags HTML e formatação extra
	 */
	function cleanTitle(title) {
		if (!title) return '';
		return title
			.replace(/<[^>]*>/g, '') // Remove HTML tags
			.replace(/\s*\|\s*/g, ' ') // Remove pipes
			.replace(/\s+/g, ' ') // Remove espaços extras
			.trim()
			.substring(0, 50); // Limita tamanho
	}

	/**
	 * Navega para uma âncora específica
	 */
	function scrollToAnchor(anchorId) {
		if (!browser) return;

		const element = document.getElementById(anchorId);
		if (element) {
			const headerOffset = 80;
			const elementPosition = element.getBoundingClientRect().top;
			const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

			window.scrollTo({
				top: offsetPosition,
				behavior: 'smooth'
			});

			closeMenu();
		}
	}

	/**
	 * Volta ao topo da página
	 */
	function scrollToTop() {
		if (!browser) return;

		window.scrollTo({
			top: 0,
			behavior: 'smooth'
		});

		closeMenu();
	}

	/**
	 * Toggle do menu
	 */
	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	/**
	 * Fecha o menu
	 */
	function closeMenu() {
		isMenuOpen = false;
	}

	/**
	 * Detecta a seção ativa baseada no scroll
	 */
	function updateActiveSection() {
		if (!browser || anchors.length === 0) return;

		const scrollPosition = window.scrollY + 120;
		let currentActive = '';

		for (const anchor of anchors) {
			const element = document.getElementById(anchor.id);
			if (element) {
				const rect = element.getBoundingClientRect();
				const elementTop = rect.top + window.pageYOffset;

				if (scrollPosition >= elementTop) {
					currentActive = anchor.id;
				}
			}
		}

		activeSection = currentActive;
	}

	/**
	 * Controla visibilidade do menu e barra de progresso
	 */
	function handleScroll() {
		if (!browser) return;

		const currentScrollY = window.scrollY;

		// Auto-hide menu quando scrolling para baixo
		if (currentScrollY > lastScrollY && currentScrollY > 100) {
			isVisible = false;
			closeMenu();
		} else {
			isVisible = true;
		}

		lastScrollY = currentScrollY;
		updateActiveSection();

		// Controlar barra de progresso
		updateProgressBarPosition();
	}

	/**
	 * Atualiza posição da barra de progresso
	 */
	function updateProgressBarPosition() {
		if (!browser) return;

		const progressBar = document.querySelector('.reading-progress');
		if (progressBar) {
			if (isVisible) {
				// Menu visível: barra fica abaixo do menu
				progressBar.style.top = '70px';
				progressBar.style.transform = 'translateY(0)';
			} else {
				// Menu escondido: barra sobe para o topo
				progressBar.style.top = '0px';
				progressBar.style.transform = 'translateY(0)';
			}
		}
	}

	/**
	 * Fecha menu ao clicar fora
	 */
	function handleClickOutside(event) {
		if (menuElement && !menuElement.contains(event.target) && isMenuOpen) {
			closeMenu();
		}
	}

	/**
	 * Fecha menu com tecla ESC
	 */
	function handleKeydown(event) {
		if (event.key === 'Escape' && isMenuOpen) {
			closeMenu();
		}
	}

	// Lifecycle
	onMount(() => {
		if (!browser) return;

		window.addEventListener('scroll', handleScroll, { passive: true });
		document.addEventListener('click', handleClickOutside);
		document.addEventListener('keydown', handleKeydown);

		// Configurar posição inicial da barra de progresso
		updateProgressBarPosition();

		return () => {
			window.removeEventListener('scroll', handleScroll);
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<!-- Sticky Navigation Menu -->
<nav
	class="sticky-nav"
	class:visible={isVisible}
	class:menu-open={isMenuOpen}
	bind:this={menuElement}
	role="navigation"
	aria-label="Menu de navegação principal"
>
	<!-- Menu Header -->
	<div class="nav-header">
		<!-- Hamburger Button -->
		<button
			class="hamburger-btn"
			class:active={isMenuOpen}
			on:click={toggleMenu}
			aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
			aria-expanded={isMenuOpen}
		>
			<span class="hamburger-line"></span>
			<span class="hamburger-line"></span>
			<span class="hamburger-line"></span>
		</button>

		<!-- Series Name -->
		<div class="series-name">
			<h1>{seriesName}</h1>
		</div>

		<!-- Progress Indicator -->
		{#if anchors.length > 0}
			<div class="progress-indicator">
				<span class="progress-text">
					{anchors.findIndex((a) => a.id === activeSection) + 1}/{anchors.length}
				</span>
			</div>
		{/if}
	</div>

	<!-- Dropdown Menu -->
	{#if isMenuOpen}
		<div class="dropdown-menu" role="menu">
			<div class="menu-content">
				<!-- Back to Top -->
				<button class="menu-item back-to-top" on:click={scrollToTop} role="menuitem">
					<span class="item-icon">↑</span>
					<span class="item-text">Voltar ao Topo</span>
				</button>

				<!-- Anchor Navigation -->
				{#if anchors.length > 0}
					<div class="anchors-section">
						<!-- <h3 class="section-title">Navegação</h3> -->
						<div class="anchors-list">
							{#each anchors as anchor, index}
								<button
									class="menu-item anchor-item"
									class:active={activeSection === anchor.id}
									on:click={() => scrollToAnchor(anchor.id)}
									role="menuitem"
								>
									<span class="item-number">{index + 1}</span>
									<span class="item-text">{anchor.name}</span>
									{#if activeSection === anchor.id}
										<span class="active-indicator">•</span>
									{/if}
								</button>
							{/each}
						</div>
					</div>
				{:else}
					<div class="no-anchors">
						<!-- <p>Nenhuma seção encontrada</p> -->
					</div>
				{/if}
			</div>
		</div>
	{/if}
</nav>

<style>
	/* Fonte Obviously para tudo */
	@import url('https://fonts.googleapis.com/css2?family=Obviously:wght@300;400;500;600;700;800;900&display=swap');

	* {
		font-family:
			'Obviously',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
	}

	.sticky-nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 9999;
		background-color: transparent;
		color: #ffffff;
		transition: transform 0.3s ease-in-out;
	}

	.sticky-nav:not(.visible) {
		transform: translateY(-100%);
	}

	.nav-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		height: 70px;
		background-color: transparent;
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
		border-bottom: none;
		transition: background-color 0.3s ease;
	}

	/* Header vermelho quando menu expandido */
	.menu-open .nav-header {
		background-color: #b51207 !important;
	}

	/* Hamburger Button */
	.hamburger-btn {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		width: 30px;
		height: 30px;
		background: none;
		border: none;
		cursor: pointer;
		z-index: 10001;
		transition: all 0.3s ease;
	}

	.hamburger-line {
		width: 20px;
		height: 2px;
		background-color: #ffffff;
		margin: 2px 0;
		transition: all 0.3s ease;
		transform-origin: center;
	}

	.hamburger-btn.active .hamburger-line:nth-child(1) {
		transform: rotate(45deg) translate(3px, 3px);
	}

	.hamburger-btn.active .hamburger-line:nth-child(2) {
		opacity: 0;
	}

	.hamburger-btn.active .hamburger-line:nth-child(3) {
		transform: rotate(-45deg) translate(3px, -3px);
	}

	.hamburger-btn:hover .hamburger-line {
		background-color: #ff0000;
	}

	/* Series Name */
	.series-name {
		flex: 1;
		text-align: center;
		margin: 0 1rem;
	}

	.series-name h1 {
		font-family:
			'Obviously',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		font-size: 1.2rem;
		font-weight: 700;
		margin: 0;
		letter-spacing: 1px;
		text-transform: uppercase;
		color: #ffffff;
	}

	/* Progress Indicator */
	.progress-indicator {
		display: flex;
		align-items: center;
	}

	.progress-text {
		font-family: 'Obviously', monospace;
		font-size: 0.85rem;
		font-weight: 500;
		opacity: 0.8;
	}

	/* Dropdown Menu - Fullscreen com Fundo Vermelho */
	.dropdown-menu {
		position: fixed;
		top: 70px;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #b51207 !important;
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
		animation: slideDown 0.3s ease-out;
		z-index: 9998;
		font-family:
			'Obviously',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.menu-content {
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		align-items: flex-start;
		height: calc(100vh - 70px);
		width: 100vw;
		padding: 2rem 3rem 4rem 3rem;
		text-align: left;
		background-color: transparent;
		font-family:
			'Obviously',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		overflow: hidden;
		box-sizing: border-box;
	}

	/* Menu Items - Alinhados à Esquerda */
	.menu-item {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		width: 100%;
		max-width: none;
		padding: 0.5rem 0;
		background: none;
		border: none;
		color: #000000;
		text-align: left;
		cursor: pointer;
		transition: all 0.3s ease;
		border-radius: 0;
		margin-bottom: 0.4rem;
		font-family:
			'Obviously',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		font-size: 1.8rem;
		font-weight: 700;
		letter-spacing: 1px;
		text-transform: uppercase;
		line-height: 1.1;
	}

	.menu-item:hover {
		color: #000000;
	}

	.menu-item.active {
		color: #000000;
		font-weight: 700;
		font-size: 1.8rem;
	}

	.menu-item:hover {
		background-color: rgba(255, 255, 255, 0.1);
		color: #ff0000;
	}

	.menu-item.active {
		background-color: #ff0000;
		color: white;
	}

	.menu-item.back-to-top {
		margin-bottom: 1rem;
		padding: 0.5rem 0;
		font-size: 1rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 2px;
		color: #000000;
	}

	.menu-item.back-to-top:hover {
		color: #000000;
	}

	.item-icon {
		font-size: 1.9rem;
		margin-right: 1rem;
		font-weight: bold;
		color: #000000;
	}

	.item-number {
		display: none;
	}

	.item-text {
		flex: 1;
		font-size: inherit;
		font-weight: inherit;
		line-height: inherit;
		text-transform: inherit;
		letter-spacing: inherit;
		color: inherit;
	}

	.active-indicator {
		display: none;
	}

	/* Sections - Alinhadas à Esquerda */
	.section-title {
		font-family:
			'Obviously',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		font-size: 0.9rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 2px;
		color: rgba(0, 0, 0, 0.6);
		margin: 0 0 1rem 0;
		padding: 0;
		text-align: left;
		background-color: transparent;
	}

	.anchors-section {
		background-color: transparent;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		max-width: none;
	}

	.anchors-list {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		width: 100%;
		gap: 0.4rem;
		background-color: transparent;
	}

	.no-anchors {
		text-align: center;
		padding: 2rem;
		opacity: 0.6;
		font-family:
			'Obviously',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		background-color: #000000;
	}

	.no-anchors p {
		margin: 0;
		font-style: italic;
		color: #ffffff;
	}

	/* Responsividade */
	@media (max-width: 768px) {
		.nav-header {
			padding: 0.75rem 1rem;
			height: 60px;
			background-color: transparent;
			backdrop-filter: none;
			-webkit-backdrop-filter: none;
		}

		/* Header vermelho quando menu expandido no mobile */
		.menu-open .nav-header {
			background-color: #b51207 !important;
		}

		.series-name h1 {
			font-size: 1rem;
		}

		.progress-text {
			font-size: 0.8rem;
		}

		.hamburger-btn {
			width: 28px;
			height: 28px;
		}

		.hamburger-line {
			width: 18px;
		}

		.dropdown-menu {
			top: 60px;
			background-color: #b51207 !important;
		}

		.menu-content {
			height: calc(100vh - 60px);
			padding: 2rem 1.5rem 3rem 1.5rem;
			justify-content: flex-end;
			align-items: flex-start;
		}

		.menu-item {
			padding: 0.4rem 0;
			font-size: 1.5rem;
			margin-bottom: 0.3rem;
		}

		.menu-item.active {
			font-size: 1.5rem;
		}

		.menu-item.back-to-top {
			font-size: 1rem;
			margin-bottom: 0.8rem;
		}

		.item-icon {
			font-size: 1.6rem;
		}

		.section-title {
			font-size: 0.8rem;
			margin-bottom: 0.8rem;
			letter-spacing: 1px;
		}

		.anchors-list {
			gap: 0.3rem;
		}
	}

	/* Melhorias de acessibilidade */
	@media (prefers-reduced-motion: reduce) {
		.sticky-nav,
		.hamburger-line,
		.menu-item {
			transition: none;
		}

		.dropdown-menu {
			animation: none;
		}
	}

	/* Focus styles para acessibilidade */
	.hamburger-btn:focus,
	.menu-item:focus {
		outline: 2px solid #ff0000;
		outline-offset: 2px;
	}
</style>
