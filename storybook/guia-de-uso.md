# Guia de Uso do Story Builder

Este documento explica tudo o que um(a) jornalista ou dev precisa para clonar o repositório, instalar dependências, configurar o ambiente e publicar histórias usando o builder.

## 1. Pré-requisitos

- **Node.js 20.x** (ou superior) e **npm** – verifique com `node -v` e `npm -v`.
- **Git** para clonar o repositório.
- **FFmpeg** (CLI) para gerar frames de vídeo. No macOS com Homebrew: `brew install ffmpeg`.
- **zip/unzip** instalados (já vêm no macOS/Linux; no Windows use Git Bash ou WSL).
- Credenciais de acesso à infraestrutura Globo (Vault/CDN). Peça para a equipe de infraestrutura caso ainda não tenha.

## 2. Clonar e instalar dependências

```bash
git clone https://github.com/<org>/storybook.git
cd storybook
npm install
```

O `npm install` baixa automaticamente todas as bibliotecas necessárias, incluindo:

- `@sveltejs/kit`, `@sveltejs/adapter-static`, `vite`
- `@neodrag/svelte`, `@sveltejs/svelte-scroller`, `lucide-svelte`
- utilitários para upload/deploy, cache, processamento de frames etc.

## 3. Configuração inicial

### 3.1 Ajustar `project.config.js`

Abra `project.config.js` e personalize os campos principais:

- `projectName`: slug da história (sem espaços). Esta pasta será criada no CDN e nas cópias locais.
- `pageTitle`: título mostrado no `<title>`.
- `googleDocsId`: ID do documento que alimenta o builder (quando usar integração via Google Docs).
- Blocos `cdn` e `vault`: confirme URLs, usuário e senha corretos. Use as credenciais fornecidas pela equipe.

Esse arquivo também gera URLs auxiliares (`PROJECT_CONFIG.urls`) usadas pelos scripts.

### 3.2 Variáveis em `.env` (opcional)

Alguns scripts legados utilizam `config/deploy.config.js`, que lê um arquivo `.env` na raiz. Crie e preencha se necessário:

```bash
cp .env.example .env # se existir, senão crie manualmente
```

Conteúdo típico do `.env`:

```
GLOBO_PASSWORD=senha_do_vault
auth_url=https://auth.s3.globoi.com:5000/v3
PROJECT_NAME=o-julgamento
```

Se usar apenas o fluxo com `project.config.js`, esse passo é opcional.

### 3.3 Conferir ferramentas externas

- Rode `ffmpeg -version` para garantir que o binário está disponível.
- Se for usar scripts de Excel/Google Docs, confirme que tem acesso ao documento configurado.

## 4. Scripts npm essenciais

| Comando                                              | Descrição                                                                         |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `npm run dev`                                        | Levanta o site em modo SvelteKit padrão (`http://localhost:5173`).                |
| `npm run builder`                                    | Abre o builder visual em `mode=builder` (porta 3000, rota `/builder`).            |
| `npm run builder:viewer`                             | Abre a visualização do builder em `/builder/viewer`.                              |
| `npm run builder:deploy -- --dest <pasta>`           | Gera (ou copia) o build para uma pasta local, criando subpasta com `projectName`. |
| `npm run build`                                      | Gera build estático em `build/` usando adapter-static.                            |
| `npm run deploy -- <projeto> [--build] [--validate]` | Executa `scripts/smart-deploy.js` para enviar ao Vault/Globo CDN.                 |
| `npm run extract[:all]`                              | Extrai frames de vídeos com ffmpeg segundo as configs.                            |
| `npm run upload`                                     | Faz upload manual de arquivos usando `upload-globo-storage.js`.                   |

> Dica: execute `npm run` para ver a lista completa de scripts disponíveis.

## 5. Fluxo recomendado para montar uma história

1. **Configurar o projeto**: ajuste `project.config.js` (nome, título, credenciais). Rode `node scripts/workflow.js config` se quiser validar e imprimir a configuração.
2. **Iniciar o builder**: `npm run builder`. Abra `http://localhost:3000/builder` e monte a história arrastando componentes. Os componentes como Scrolly, Step, etc. estão em `src/lib/components/story`.
3. **Sincronizar conteúdo** (opcional):
   - Para importar via Google Docs, use `npm run fetch`. O script lê o `googleDocsId` e atualiza dados locais.
   - Para trabalhar com frames de vídeo, coloque arquivos em `static/videos` e rode `npm run extract:all` para gerar as sequências.
4. **Visualizar**: abra `http://localhost:3000/builder/viewer` ou rode `npm run dev` para ver a história final no SvelteKit.
5. **Gerar build**: quando estiver satisfeito, execute `npm run builder:deploy -- --dest ../publicacoes` (por exemplo) para copiar o conteúdo de `build/` para uma pasta pronta para publicar. O script roda `npm run build` automaticamente, a menos que você use `--skip-build`.
6. **Deploy para o Vault/CDN** (opcional):
   - Localize a pasta copiada (`../publicacoes/<projectName>`). Você pode publicar manualmente ou usar `npm run deploy -- <projectName> --build --validate` para disparar o fluxo inteligente (`scripts/smart-deploy.js`).

## 6. Trabalhando com frames de vídeo

1. Coloque as versões desktop/mobile do vídeo em `static/videos`.
2. Rode `npm run extract:all` (ou `npm run extract`) para gerar as sequências otimizadas em `static/img/frames`.
3. Use `npm run upload` ou o fluxo de workflow (`node scripts/workflow.js`) para enviar os frames ao Vault, se necessário.
4. As URLs dos frames seguem o padrão definido em `project.config.js`. Use `PROJECT_CONFIG.getFrameUrl()` para construir links dinamicamente.

> Necessário ter **ffmpeg** instalado e acessível no PATH.

## 7. Opções de deploy

- **Builder Deploy local**: `npm run builder:deploy -- --dest <pasta>`. Útil para entregar os HTML/CSS/JS para outra equipe.
- **Smart Deploy**: `npm run deploy -- <projectName> --build --validate`. Faz build, organiza arquivos e envia ao Vault Globo.
- **Export ZIP**: `npm run export:build` gera `exports/story-build-<timestamp>.zip` com o conteúdo de `build/`.

Tenha certeza de que as credenciais no `project.config.js` (ou `.env`) estão corretas antes de qualquer deploy.

## 8. Estrutura básica do projeto

```
├── src/                     # Componentes Svelte, layouts e utilitários
│   └── lib/components/story # Componentes usados pelo builder
├── static/                  # Assets estáticos (imagens, vídeos, dados)
├── scripts/                 # Automação: deploy, cache, frames, builder
├── config/                  # Arquivos de configuração adicionais
├── build/                   # Resultado do `npm run build`
├── project.config.js        # Config central do projeto atual
├── svelte.config.js         # Adapter estático (build para CDN)
└── vite.config.js           # Configuração Vite/SvelteKit
```

## 9. Animações com GSAP

- Todos os componentes de história (exceto os gráficos) aceitam animações GSAP configuráveis bloco a bloco.
- Adicione, no builder, um campo `gsap`, `gsapAnimations` ou `gsapConfig` em cada parágrafo para controlar as animações do trecho.
- Propriedades principais suportadas:
  - `enabled`: ativa/desativa GSAP para o bloco (padrão automático quando existe alguma animação definida).
  - `mobileQuery`: breakpoint para diferenciar animações mobile/desktop (default: `(max-width: 768px)`).
  - `animations`: array de objetos contendo `targets` (seletor CSS relativo ao bloco), `from`, `to`, `duration`, `delay`, `ease`, `stagger`, além de blocos específicos `desktop`/`mobile`.
  - `defaultAnimation`: fallback aplicado quando `animations` estiver vazio.
  - `scrollTrigger`: configurações compatíveis com o plugin oficial (start, end, scrub, markers etc.).
- Exemplo de configuração para um bloco de texto:

```json
{
	"enabled": true,
	"mobileQuery": "(max-width: 600px)",
	"animations": [
		{
			"targets": [".story-section__inner h2"],
			"from": { "autoAlpha": 0, "y": 40 },
			"to": { "autoAlpha": 1, "y": 0, "duration": 0.6, "ease": "power3.out" },
			"mobile": {
				"from": { "autoAlpha": 0, "y": 24 },
				"to": { "autoAlpha": 1, "y": 0, "duration": 0.45 }
			}
		},
		{
			"targets": ".story-section__inner p",
			"from": { "autoAlpha": 0, "y": 32 },
			"to": { "autoAlpha": 1, "y": 0, "duration": 0.5, "stagger": 0.08 }
		}
	]
}
```

- Cada objeto `from`/`to` aceita qualquer propriedade GSAP (`x`, `y`, `opacity`, `scale`, `rotation`, `transformOrigin`, etc.).
- Para animações baseadas em scroll basta incluir `scrollTrigger` (o plugin é registrado automaticamente quando presente).
- Após atualizar o repositório, execute `npm install` para garantir a instalação da dependência `gsap`.

### 9.1 Biblioteca premium de presets

## 10. Templates prontos (estilo Awwwards)

Os novos modelos ficam em `static/data/templates/`. Para usar no builder:

1. Copie o JSON desejado para `static/data/story.json` (ou utilize o botão **Importar story** no builder e cole o conteúdo).
2. Atualize mídias, textos e animações conforme a pauta.
3. Gere os assets necessários (frames, imagens otimizadas, vídeos) antes de publicar.

Modelos disponíveis (sem uso de gráficos D3):

- `static/data/templates/awwwards-aurora-imersiva.json`: hero em vídeo + scrollytelling com cards de vidro e parallax, ideal para grandes especiais multimídia.
- `static/data/templates/awwwards-grid-modular.json`: hero minimalista, grid responsivo, carrossel e bloco de itens relacionados para matérias multi-capítulos.
- `static/data/templates/awwwards-chronicle-timeline.json`: linha do tempo dramática combinada com visualizador de documentos anotados.
- `static/data/templates/awwwards-retratos-imersivos.json`: header caótico com collage, apresentação de personagens e curiosidades animadas.
- `static/data/templates/awwwards-scrolly-frames.json`: sequência de frames controlada pelo scroll, bloco híbrido e comparador antes/depois.

> Dica: o template de scrolly frames espera arquivos nomeados como `frame_0001.jpg` em `static/img/frames/desktop/` e `static/img/frames/mobile/`. Gere esses frames com `npm run extract:all` ou carregue seus próprios assets no CDN.

- No inspetor do builder há uma biblioteca de presets avançados (“Hero Rise Timeline”, “Cards Cascade”, “Parallax Drift”, “Mask Reveal Gallery”, “Cards 3D Tilt”, “Scroll Pin Reveal”, “Neon Glow Pulse” etc.).
- Cada cartão aplica uma ou mais animações prontas (incluindo timelines, efeitos 3D, parallax com `scrollTrigger` e loops). Se precisar, edite os seletores depois de aplicar para adequar ao markup do bloco.
- Os presets continuam sendo configs GSAP normais, então você pode mesclar com animações manuais, alterar durações, adicionar `stagger`, trocar easings, incluir novas etapas na timeline e salvar variações personalizadas.

### 9.2 Máscaras SVG em animações

- Nas animações de qualquer bloco, use a seção **Máscara (SVG)** para aplicar `clip-path` ou `mask` sem editar JSON manualmente.
- Passos básicos:
  1. Insira o SVG (com `clipPath`/`mask`) no conteúdo da seção ou reutilize um `<defs>` global hospedado no projeto.
  2. No editor, escolha o campo _Aplicar em_: `clip-path`, `mask`, `mask-image`, `mask-border` ou `-webkit-mask-image` (para compatibilidade).
  3. Informe o valor da máscara (`url(#maskId)` ou um link remoto com SVG). Opcionalmente selecione um alvo específico (ex.: `.photo-with-caption img`).
  4. Marque **Animar máscara** para transicionar entre dois valores (`from`/`to`). É possível definir duração, ease e posição na timeline.
- O GSAP aplica a máscara automaticamente quando o bloco entra na viewport; o comportamento de replay fica ativado por padrão (desative com “Executar apenas uma vez” caso necessário).
- Exemplo rápido (imagens com `mask` animada):
  - Valor: `url(#maskLogo)`
  - Valor inicial: `url(#maskStart)`
  - Valor final: `url(#maskLogo)`
  - Duração: `0.8`
  - Ease: `power3.out`
- Para reutilizar a mesma máscara em vários blocos, mantenha o mesmo `id` no `<clipPath>`/`<mask>` e aplique o preset em cada bloco desejado.

### 9.3 Efeito “keyhole” rolável

- O preset **Scroll Keyhole Reveal** replica o efeito do CodePen (overlay abrindo enquanto a seta some). Para usá-lo:
  - Nas configurações do projeto, ative **Overlay keyhole (efeito CodePen)** e ajuste cor/posição da seta se necessário.
  - Insira no topo da página (pode ser via bloco Livre ou Snippet global) os elementos:
    ```html
    <span class="keyhole" aria-hidden="true"></span>
    <span class="arrow" aria-hidden="true">
    	<svg
    		width="20"
    		height="20"
    		viewBox="-5 -5 30 30"
    		fill="none"
    		xmlns="http://www.w3.org/2000/svg"
    	>
    		<path
    			d="M0 10H20L10 0M20 10L10 20"
    			stroke-width="4"
    			stroke-linecap="square"
    			stroke-linejoin="round"
    		/>
    	</svg>
    </span>
    ```
  - Adicione o CSS (ajuste cores/tamanhos conforme a matéria):
    ```css
    .keyhole {
    	position: fixed;
    	inset: 0;
    	pointer-events: none;
    	background: #fdcb6e; /* cor do overlay */
    	clip-path: polygon(
    		0% 0%,
    		0% 100%,
    		0% 100%,
    		0% 0%,
    		100% 0%,
    		100% 100%,
    		0% 100%,
    		0% 100%,
    		100% 100%,
    		100% 0%
    	);
    	z-index: 50;
    }
    .arrow {
    	position: fixed;
    	top: 75vh;
    	left: 50%;
    	transform: translateX(-50%);
    	z-index: 51;
    	animation: keyhole-arrow-float 1s ease-in-out infinite alternate;
    }
    .arrow svg {
    	width: 2rem;
    	height: auto;
    	transform: rotate(90deg);
    	stroke: #2d3436;
    }
    @keyframes keyhole-arrow-float {
    	from {
    		transform: translate(-50%, -50%);
    	}
    	to {
    		transform: translate(-50%, 50%);
    	}
    }
    ```
  - Aplique o preset **Scroll Keyhole Reveal** ao primeiro bloco da página e ajuste os seletores `trigger` (por padrão ele usa `.story-section:first-of-type`).
- O preset já configura o `clip-path` animado e a seta com `scrub`. Caso a página tenha outra estrutura, edite os campos `targets` e `scrollTrigger` após aplicar o preset.

## 11. Solução de problemas

- **Erro em deploy (401/403)**: verifique usuário/senha em `project.config.js` ou `.env`. Garante que o `projectName` não tem espaços.
- **ffmpeg não encontrado**: instale via `brew install ffmpeg` (macOS) ou `sudo apt install ffmpeg` (Linux). No Windows, use o pacote oficial e adicione ao PATH.
- **Builder sem estilos**: confirme que `npm install` foi executado e que o modo builder (`npm run builder`) está ativo.
- **Problemas com `npm install`**: limpe com `rm -rf node_modules package-lock.json` e instale novamente.

## 12. Anexo – Implementação VideoScrolly

As instruções a seguir detalham como registrar o componente `ScrollyFrames` e mapear novos tipos no renderer. Elas são úteis quando você estiver montando histórias com scrollytelling avançado.

### 12.1 Criar o componente

Copie o arquivo `ScrollyFrames.svelte` (artifact) para o caminho:

```
src/lib/components/story/ScrollyFrames.svelte
```

### 12.2 Atualizar `StoryRenderer.svelte`

```javascript
import ScrollyFrames from './story/ScrollyFrames.svelte';

<!-- VideoScrollytelling NOVO -->
{:else if componentType === 'video-scrolly-new'}
  <ScrollyFrames
    framePrefix={props.imagePrefix || ''}
    framePrefixMobile={props.imagePrefixMobile || props.imagePrefix || ''}
    totalFrames={parseInt(props.totalFrames) || 100}
    frameExtension={props.imageSuffix || '.jpg'}
    frameExtensionMobile={props.imageSuffixMobile || '.webp'}
    framePadding={4}
    startFrame={parseInt(props.frameStart) || 1}
    endFrame={parseInt(props.frameStop) || parseInt(props.totalFrames) || 100}
    height={props.height || '100vh'}
    showProgress={stringToBoolean(props.showProgress, true)}
    showFrameCounter={stringToBoolean(props.showFrameCounter, false)}
    preloadRadius={parseInt(props.preloadFrames) || 10}
    maxMemoryMB={parseInt(props.maxMemoryMB) || 50}
    className={`video-scrolly-${index + 1}`}
  />
```

### 12.3 Atualizar `getComponentType`

```javascript
// VideoScrollytelling NOVO
'videoscrollytelling': 'video-scrolly-new',
'video-scrollytelling': 'video-scrolly-new',
'videoscrolly': 'video-scrolly-new',
'video-scrolly': 'video-scrolly-new',
```

### 12.4 Ajustar `storyRenderer.js`

```javascript
case 'videoscrollytelling':
case 'video-scrollytelling':
case 'videoscrolly':
case 'video-scrolly':
  component.type = 'video-scrolly-new';
  component.imagePrefix = paragraph.imagePrefix || '';
  component.imagePrefixMobile = paragraph.imagePrefixMobile || paragraph.imagePrefix || '';
  component.imageSuffix = paragraph.imageSuffix || '.jpg';
  component.imageSuffixMobile = paragraph.imageSuffixMobile || '.webp';
  component.totalFrames = parseInt(paragraph.totalFrames) || 100;
  component.frameStart = parseInt(paragraph.frameStart) || 1;
  component.frameStop = parseInt(paragraph.frameStop) || component.totalFrames;
  component.height = paragraph.height || '100vh';
  component.showProgress = paragraph.showProgress !== false;
  component.showTime = paragraph.showTime !== false;
  component.preloadFrames = parseInt(paragraph.preloadFrames) || 10;
  component.maxMemoryMB = parseInt(paragraph.maxMemoryMB) || 50;
  component.fullWidth = paragraph.fullWidth !== false;
  break;
```

### 12.5 Teste rápido

Crie um JSON de teste e sirva com `npm run dev` para validar o comportamento, conforme instruções do trecho acima.

---

Com esse guia, qualquer pessoa consegue baixar o repositório, instalar o ambiente, utilizar o builder e publicar histórias sem depender de conhecimento prévio do projeto.
