# Story Builder – Guia Rápido

Ambiente de criação de narrativas do Newsroom baseado em Svelte + Vite. Todo o conteúdo é montado direto no Builder visual — não há mais dependência de Google Docs.

## 1. Pré-requisitos

- **Node.js 20.x** (ou superior) e **npm**.
- **Git** para clonar o repositório.
- **FFmpeg** instalado no sistema (necessário para recursos de vídeo/frames).
- **VS Code** (opcional, mas recomendado) com a extensão **Svelte for VS Code** para autocompletar e linting.

## 2. Instalação

```bash
git clone https://github.com/limitrofe/storybook.git
cd storybook
npm install
```

## 3. Configurar o projeto (`project.config.js`)

Abra `project.config.js` e ajuste os campos principais:

- `projectName`: slug da história (sem espaços). Define a pasta de saída/local no CDN.
- `pageTitle`: título exibido na aba do navegador.
- `cdn` e `vault`: confirme URLs/credenciais corretas fornecidas pela infraestrutura.
- `googleDocsId` pode ficar vazio — o fluxo padrão agora é 100% via Builder.

Sempre que iniciar um novo especial, atualize esse arquivo primeiro.

## 4. Rodando o Builder

```bash
npm run builder
```

- O comando abre o Builder visual (`http://localhost:5173/builder`, ou a porta exibida no terminal).
- Monte a história arrastando blocos, editando textos e definindo mídias.
- Para visualizar a página final, abra o mesmo host **sem** `/builder` (ex.: `http://localhost:5173`). Esse preview usa o renderizador real da matéria.

## 5. Outras tarefas úteis

| Comando                                    | Descrição                                                                                                                                                   |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                              | Ambiente padrão do SvelteKit, útil para desenvolver componentes isolados.                                                                                   |
| `npm run builder:deploy -- --dest <pasta>` | Copia o conteúdo de `build/` para uma pasta local (`<dest>/<projectName>`). Executa `npm run build` automaticamente, a menos que seja usado `--skip-build`. |
| `npm run build`                            | Gera o build estático em `build/` (adapter-static).                                                                                                         |

## 6. Dicas de VS Code

- Instale a extensão **Svelte for VS Code**.
- Habilite o formatador padrão do projeto (`Prettier`) se desejar (`npm run format`).
- As paths raiz usam `jsconfig.json`, então os imports absolutos (`$lib/...`) funcionam imediatamente.

## 7. Fluxo sugerido

1. Ajuste `project.config.js` com nome/título/credenciais do projeto.
2. Rode `npm run builder` e crie a história visualmente.
3. Teste no preview (`http://localhost:5173`).
4. Gere a saída com `npm run builder:deploy` ou `npm run build` conforme a necessidade de publicação.

## 8. Deploy e exportação

- `npm run builder:deploy -- --dest ../publicacoes` cria uma pasta pronta para subir ao CDN (`../publicacoes/<projectName>`).
- `npm run deploy -- <projectName> --build --validate` dispara o fluxo inteligente de upload para o Vault/Globo (requer credenciais válidas no `project.config.js`).
- `npm run export:build` gera um ZIP com o conteúdo de `build/` em `exports/`.

Com isso, qualquer pessoa consegue clonar o repositório, configurar um projeto e montar histórias direto no Builder.
