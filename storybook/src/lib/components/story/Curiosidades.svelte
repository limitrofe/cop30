<script>
	import { onMount, onDestroy } from 'svelte';

	export let personagens = [];
	export let shapeColor = '#000000';
	export let nameColor = '#ffffff';
	export let textColor = '#ffffff';
	export let backgroundColor = '#b51207';
	export let quoteColor = '#ffd700'; // Cor especial para frases

	// Processar personagens/curiosidades
	$: processedPersonagens = (() => {
		if (!personagens) return [];
		if (typeof personagens === 'string') {
			try {
				return JSON.parse(personagens);
			} catch {
				return [];
			}
		}
		if (Array.isArray(personagens)) return personagens;
		return personagens.personagens || personagens.characters || personagens.lista || [];
	})();

	let scrollY = 0;
	let containerElement;
	let characterSections = [];
	let animationStates = [];

	onMount(() => {
		// Inicializar estados
		animationStates = processedPersonagens.map(() => ({
			inView: false,
			nameProgress: 0,
			shapeProgress: 0,
			textProgress: 0,
			quoteProgress: 0, // Novo estado para animação da frase
			isPinned: false
		}));

		const handleScroll = () => {
			scrollY = window.scrollY;
			updateAnimations();
		};

		window.addEventListener('scroll', handleScroll);

		// Um pequeno delay para garantir que o DOM foi totalmente renderizado
		setTimeout(() => {
			if (containerElement) {
				characterSections = Array.from(containerElement.querySelectorAll('.character-wrapper'));
				updateAnimations(); // Chame uma vez para definir o estado inicial (que agora será 0 para o primeiro item)
			}
		}, 100);

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});

	function updateAnimations() {
		if (!characterSections || !window) return;

		const windowHeight = window.innerHeight;

		characterSections.forEach((element, index) => {
			const rect = element.getBoundingClientRect();
			const elementHeight = rect.height;
			const elementTop = rect.top;

			// Definimos que a animação completa ocorrerá durante 200vh (2x a altura da tela) de scroll.
			// Isso dá um bom ritmo para a animação.
			const animationScrollDuration = windowHeight * 2;

			// O progresso da animação (de 0.0 a 1.0) é calculado com base em quanto o usuário
			// já rolou para baixo DEPOIS que a seção ficou fixa no topo.
			// `elementTop` se torna negativo ao rolar para baixo, por isso `-elementTop`.
			const scrollProgress = Math.max(0, Math.min(1, -elementTop / animationScrollDuration));

			const state = animationStates[index];

			// Atualiza o estado de "pinado"
			state.isPinned = elementTop <= 0 && elementTop > -elementHeight + windowHeight;

			// Com o novo `scrollProgress`, as animações só começarão quando o usuário rolar a página,
			// mesmo para o primeiro personagem.

			// Fase 1: Nome se move (ocorre nos primeiros 15% da animação)
			state.nameProgress = Math.min(1, scrollProgress / 0.15);

			// Fase 2: Tarja entra (começa em 10% e termina em 25%)
			state.shapeProgress = scrollProgress > 0.1 ? Math.min(1, (scrollProgress - 0.1) / 0.15) : 0;

			// Fase 3: Texto aparece (começa em 25% e vai até 60%)
			state.textProgress = scrollProgress > 0.25 ? Math.min(1, (scrollProgress - 0.25) / 0.35) : 0;

			// Fase 4: Frase aparece (começa em 60% e vai até o final)
			state.quoteProgress = scrollProgress > 0.6 ? (scrollProgress - 0.6) / 0.4 : 0;

			animationStates[index] = { ...state };
		});

		animationStates = [...animationStates];
	}

	// Função para dividir o nome em linhas quando necessário
	function splitName(nome) {
		if (!nome) return { linha1: '', linha2: '' };

		const palavras = nome.trim().split(/\s+/);

		// Se tem só uma palavra, coloca ela sozinha
		if (palavras.length === 1) {
			return { linha1: palavras[0], linha2: '' };
		}

		// Se tem duas palavras, uma em cada linha
		if (palavras.length === 2) {
			return { linha1: palavras[0], linha2: palavras[1] };
		}

		// Se tem três ou mais palavras, divide aproximadamente no meio
		const meio = Math.ceil(palavras.length / 2);
		return {
			linha1: palavras.slice(0, meio).join(' '),
			linha2: palavras.slice(meio).join(' ')
		};
	}
</script>

<div class="container" bind:this={containerElement}>
	{#if processedPersonagens && processedPersonagens.length > 0}
		{#each processedPersonagens as personagem, index}
			{@const nomeLinhas = splitName(personagem.nome)}
			<div class="character-wrapper">
				<div class="character-section">
					<div class="character-container">
						<!-- Foto/vídeo de fundo (opcional) -->
						<div class="photo-background">
							{#if personagem.video || personagem.videoMobile}
								<!-- Vídeo responsivo -->
								<video class="background-video" autoplay muted loop playsinline>
									<!-- Vídeo mobile (prioridade se disponível) -->
									{#if personagem.videoMobile}
										<source
											src={personagem.videoMobile}
											type="video/mp4"
											media="(max-width: 768px)"
										/>
									{/if}
									<!-- Vídeo desktop -->
									{#if personagem.video}
										<source src={personagem.video} type="video/mp4" />
									{/if}
									<!-- Fallback para imagem se vídeo não funcionar -->
									{#if personagem.foto || personagem.fotoMobile}
										<img
											src={personagem.fotoMobile || personagem.foto}
											alt={personagem.nome || 'Curiosidade'}
											class="photo"
										/>
									{/if}
								</video>
							{:else if personagem.foto || personagem.fotoMobile}
								<!-- Imagem responsiva -->
								<picture>
									<!-- Imagem mobile -->
									{#if personagem.fotoMobile}
										<source srcset={personagem.fotoMobile} media="(max-width: 768px)" />
									{/if}
									<!-- Imagem desktop -->
									<img
										src={personagem.foto || personagem.fotoMobile}
										alt={personagem.nome || 'Curiosidade'}
										class="photo"
									/>
								</picture>
							{:else}
								<div class="photo-placeholder" style="background: #b51207;">
									<div class="placeholder-text"></div>
								</div>
							{/if}
						</div>

						<!-- Nome (obrigatório) -->
						<div
							class="character-name"
							style="
                color: #ffffff;
                transform: 
                  translate(
                    {index % 2 === 0 ? -10 : -90}%, 
                    {index % 2 === 0 ? 20 : 20}%
                  ) 
                  translateX(
                    {(animationStates[index]?.nameProgress || 0) * (index % 2 === 0 ? -40 : 40)}vw
                  );
              "
						>
							{#if personagem.sobrenome}
								<h5>{personagem.sobrenome}</h5>
							{/if}

							<!-- Nome dividido em duas linhas automaticamente -->
							<div class="nome-container">
								<h2 class="nome-linha">{nomeLinhas.linha1}</h2>
								{#if nomeLinhas.linha2}
									<h2 class="nome-linha">{nomeLinhas.linha2}</h2>
								{/if}
							</div>
						</div>

						<!-- Tarja vermelha -->
						<div
							class="shape-overlay"
							style="
                --shape-color: #000100;
                transform: translateX({index % 2 === 0
								? 100 - (animationStates[index]?.shapeProgress || 0) * 100
								: -100 + (animationStates[index]?.shapeProgress || 0) * 100}%);
              "
						/>

						<!-- Container de texto e frase -->
						<div class="content-container {index % 2 === 0 ? 'content-right' : 'content-left'}">
							<div class="content-wrapper {index % 2 === 0 ? 'align-left' : 'align-right'}">
								<!-- Descrição (opcional) -->
								{#if personagem.descricao}
									<div class="description-section">
										<p class="description-text" style="--text-color: {textColor}">
											{#each (personagem.descricao || '').split('. ') as linha, lineIndex}
												{#if linha.trim()}
													{@const totalLines = personagem.descricao
														.split('. ')
														.filter((l) => l.trim()).length}
													{@const lineProgress =
														(animationStates[index]?.textProgress || 0) * totalLines}
													<span
														class="text-line"
														class:visible={lineIndex < lineProgress}
														style="transition-delay: {lineIndex * 0.15}s"
													>
														{linha.replace(/\.+$/, '')}.
													</span>
												{/if}
											{/each}
										</p>
									</div>
								{/if}

								<!-- Frase destacada (opcional) -->
								{#if personagem.frase}
									<div
										class="quote-section"
										class:visible={(animationStates[index]?.quoteProgress || 0) > 0}
										style="
                      opacity: {animationStates[index]?.quoteProgress || 0};
                      transform: translateY({30 -
											(animationStates[index]?.quoteProgress || 0) * 30}px);
                      transition: all 1s ease-out;
                      transition-delay: 0.3s;
                    "
									>
										<blockquote class="quote-text" style="--quote-color: {quoteColor}">
											"{personagem.frase}"
										</blockquote>

										<!-- Autor e profissão da frase (opcional) -->
										{#if personagem.autor || personagem.author || personagem.profissao || personagem.profession}
											<div class="quote-attribution">
												{#if personagem.autor || personagem.author}
													<span class="quote-author">{personagem.autor || personagem.author}</span>
												{/if}
												{#if personagem.profissao || personagem.profession}
													<span class="quote-profession"
														>{personagem.profissao || personagem.profession}</span
													>
												{/if}
											</div>
										{/if}
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		{/each}
	{:else}
		<div class="character-section">
			<p style="color: white; text-align: center;">Nenhuma curiosidade encontrada</p>
		</div>
	{/if}
</div>

<style>
	.container {
		width: 100%;
		background: #b51207;
		position: relative;
	}

	.character-wrapper {
		height: 400vh; /* Altura para permitir scroll longo */
		position: relative;
	}

	.character-section {
		height: 100vh;
		width: 100%;
		position: sticky;
		top: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	/* Container principal - tela inteira */
	.character-container {
		width: 100%;
		height: 100vh;
		position: relative;
		overflow: hidden;
	}

	/* Foto de fundo - tela inteira */
	.photo-background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
	}

	.photo {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	/* Vídeo de fundo */
	.background-video {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	/* Picture element para responsividade */
	picture {
		width: 100%;
		height: 100%;
		display: block;
	}

	.photo-placeholder {
		width: 100%;
		height: 100%;
		background: #b51207;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.3);
		font-size: 2rem;
		position: relative;
	}

	.placeholder-text {
		font-family: 'obviously', sans-serif;
		font-weight: 300;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	/* Nome do personagem - centralizado inicialmente */
	.character-name {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		font-size: clamp(4rem, 10vw, 10rem);
		font-weight: 700;
		letter-spacing: -0.01em;
		z-index: 10;
		text-transform: uppercase;
		font-family: 'obviously-compressed', sans-serif;
		transition: transform 1s cubic-bezier(0.4, 0, 0.2, 1);
		will-change: transform;
		/* text-shadow: 0 0 5px rgba(0,0,0,0.5); */
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.character-name h5 {
		font-size: 1.5rem;
		font-family: 'obviously', sans-serif;
		font-weight: 400;
		letter-spacing: normal;
		line-height: 0.8;
		margin: 0;
		margin-bottom: 0.3rem;
		opacity: 0.9;
		text-transform: none;
	}

	/* Container para o nome dividido em linhas */
	.nome-container {
		display: flex;
		flex-direction: column;
		align-items: start;
		line-height: 0.8;
	}

	.nome-linha {
		margin: 0;
		line-height: 0.8;
		font-size: inherit;
		font-family: 'obviously-compressed', sans-serif;
		font-weight: 700;
		white-space: nowrap;
	}

	/* Tarja vermelha - cobre toda a tela */
	.shape-overlay {
		position: absolute;
		top: 0;
		width: 100%;
		height: 100%;
		background: var(--shape-color, #b51207);
		z-index: 5;
		will-change: transform;
		transition: transform 1s cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* Container do conteúdo - aparece sobre a tarja */
	.content-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 8;
		display: flex;
		align-items: center;
		pointer-events: none;
	}

	/* Conteúdo à direita (quando nome vai para esquerda) */
	.content-container.content-right {
		justify-content: flex-end;
		padding-right: 5%;
	}

	/* Conteúdo à esquerda (quando nome vai para direita) */
	.content-container.content-left {
		justify-content: flex-start;
		padding-left: 5%;
	}

	.content-wrapper {
		width: 85%;
		max-width: 700px;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.content-wrapper.align-left {
		text-align: right;
		padding-right: 5%;
		align-items: flex-end;
	}

	.content-wrapper.align-right {
		text-align: left;
		align-items: flex-start;
	}

	/* Seção de descrição */
	.description-section {
		width: 95%;
	}

	.description-text {
		font-size: 1.1rem;
		line-height: 1.5;
		font-weight: 300;
		color: var(--text-color, #fff);
		font-family: 'obviously', sans-serif;
	}

	.text-line {
		display: block;
		opacity: 0;
		transform: translateY(30px);
		transition: all 0.8s ease-out;
		margin-bottom: 1em;
	}

	.text-line.visible {
		opacity: 1;
		transform: translateY(0);
	}

	/* Seção de frase destacada */
	.quote-section {
		width: 80%;
		margin-top: 0rem;
	}

	.quote-text {
		font-size: 1.6rem;
		line-height: 1.3;
		font-weight: 400;
		color: var(--quote-color, #ffd700);
		font-family: 'obviously', sans-serif;
		font-style: italic;
		margin: 0;
		padding: 0.5rem 0;
		border-left: 4px solid var(--quote-color, #ffd700);
		padding-left: 2rem;
		/* text-shadow: 0 2px 4px rgba(0,0,0,0.3); */
	}

	/* Atribuição da frase (autor e profissão) */
	.quote-attribution {
		margin-top: 0.9rem;
		text-align: right;
		font-family: 'obviously', sans-serif;
		font-style: normal;
	}

	.quote-author {
		display: block;
		font-size: 1rem;
		font-weight: 600;
		color: var(--quote-color, #ffd700);
		margin-bottom: 0.2rem;
	}

	.quote-profession {
		display: block;
		font-size: 0.9rem;
		font-weight: 300;
		color: rgba(255, 255, 255, 0.8);
		text-transform: lowercase;
	}

	/* Background gradiente */
	.character-wrapper:nth-child(even) .character-section {
		background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
	}

	.character-wrapper:nth-child(odd) .character-section {
		background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
	}

	@media (max-width: 768px) {
		.character-name {
			font-size: clamp(4rem, 16vw, 4rem);
			top: 75%;
			align-items: start;
			margin-bottom: 0px;
			/* text-shadow: none; */
			color: white;
		}

		.character-name h5 {
			font-size: 1rem;
			color: white;
		}

		.description-text {
			font-size: 0.9rem;
			text-align: left;
			width: 100%;
		}

		.quote-section {
			width: 95%;
		}
		.quote-text {
			font-size: 1rem;
			padding-left: 0.5rem;
			border-left-width: 3px;
		}

		.quote-author {
			font-size: 1rem;
		}

		.quote-profession {
			font-size: 0.8rem;
		}

		.content-container {
			align-items: start;
			top: 5%;
		}

		/* No mobile, centraliza o conteúdo */
		.content-container.content-right,
		.content-container.content-left {
			justify-content: center;
			padding: 0 1%;
		}

		.content-wrapper {
			width: 90%;
			text-align: center !important;
			top: 5%;
			gap: 0.5rem;
		}

		.content-wrapper.align-left,
		.content-wrapper.align-right {
			text-align: left !important;
			align-items: flex-start;
		}
	}
</style>
