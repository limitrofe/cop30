#!/bin/bash
# git-push-code-only.sh
# Push apenas código para o Git, pulando mídias como deploy

echo "📤 GIT PUSH - APENAS CÓDIGO (SEM MÍDIAS)"
echo "========================================"

# Verificar se estamos no lugar certo
if [ ! -f "project.config.js" ]; then
    echo "❌ Execute no diretório do projeto"
    exit 1
fi

# Mostrar status atual
echo "📋 Status atual do git:"
git status --porcelain

# Contar arquivos
TOTAL_FILES=$(git status --porcelain | wc -l)
echo "📊 Total de arquivos modificados: $TOTAL_FILES"

if [ "$TOTAL_FILES" -eq 0 ]; then
    echo "✅ Nenhuma mudança para commit"
    exit 0
fi

echo ""
echo "🔍 Analisando arquivos..."

# Criar lista temporária de arquivos para adicionar (apenas código)
TEMP_FILE_LIST=$(mktemp)

# Padrões de arquivos de CÓDIGO que devem ser incluídos
CODE_PATTERNS=(
    "*.js"
    "*.mjs" 
    "*.css"
    "*.html"
    "*.json"
    "*.md"
    "*.txt"
    "*.xml"
    "*.yml"
    "*.yaml"
    "*.ts"
    "*.svelte"
    "*.vue"
    "*.jsx"
    "*.tsx"
    "package.json"
    "package-lock.json"
    "yarn.lock"
    ".gitignore"
    ".env.example"
    "*.config.js"
    "*.config.ts"
    "vite.config.*"
    "svelte.config.*"
    "tailwind.config.*"
    "postcss.config.*"
)

# Padrões de MÍDIA que devem ser EXCLUÍDOS
MEDIA_PATTERNS=(
    "*.jpg"
    "*.jpeg" 
    "*.png"
    "*.gif"
    "*.webp"
    "*.svg"
    "*.ico"
    "*.mp4"
    "*.webm"
    "*.mov"
    "*.avi"
    "*.mkv"
    "*.mp3"
    "*.wav"
    "*.ogg"
    "*.m4a"
    "*.pdf"
    "*.zip"
    "*.rar"
    "*.tar"
    "*.gz"
    "*.tiff"
    "*.bmp"
    "*.avif"
)

# Padrões de PASTAS DE MÍDIA para excluir
MEDIA_FOLDERS=(
    "img/"
    "images/"
    "videos/"
    "media/"
    "frames/"
    "static/img/"
    "static/images/"
    "static/videos/"
    "video-frames/"
    "build/img/"
    "build/images/"
    "build/frames/"
)

# Função para verificar se arquivo é mídia
is_media_file() {
    local file="$1"
    local lowercase_file=$(echo "$file" | tr '[:upper:]' '[:lower:]')
    
    # Verificar extensões de mídia
    for pattern in "${MEDIA_PATTERNS[@]}"; do
        if [[ $lowercase_file == *${pattern#\*} ]]; then
            return 0  # É mídia
        fi
    done
    
    # Verificar pastas de mídia
    for folder in "${MEDIA_FOLDERS[@]}"; do
        if [[ $lowercase_file == *$folder* ]]; then
            return 0  # É mídia
        fi
    done
    
    return 1  # Não é mídia
}

# Analisar arquivos modificados
CODE_FILES=()
MEDIA_FILES=()

while IFS= read -r line; do
    if [ -n "$line" ]; then
        # Extrair status e nome do arquivo
        status="${line:0:2}"
        file="${line:3}"
        
        if is_media_file "$file"; then
            MEDIA_FILES+=("$file")
        else
            CODE_FILES+=("$file")
        fi
    fi
done < <(git status --porcelain)

# Mostrar resumo
echo ""
echo "📊 ANÁLISE COMPLETA:"
echo "📄 Código: ${#CODE_FILES[@]} arquivos"
echo "🖼️  Mídia: ${#MEDIA_FILES[@]} arquivos"

if [ ${#CODE_FILES[@]} -eq 0 ]; then
    echo ""
    echo "⚠️  Nenhum arquivo de código para commit!"
    echo "💡 Apenas arquivos de mídia foram modificados"
    exit 0
fi

# Mostrar arquivos de código que serão incluídos
echo ""
echo "✅ CÓDIGO que será incluído:"
for file in "${CODE_FILES[@]:0:10}"; do
    echo "   📄 $file"
done

if [ ${#CODE_FILES[@]} -gt 10 ]; then
    echo "   ... e mais $((${#CODE_FILES[@]} - 10)) arquivos de código"
fi

# Mostrar exemplos de mídia que será pulada
if [ ${#MEDIA_FILES[@]} -gt 0 ]; then
    echo ""
    echo "🚫 MÍDIA que será pulada:"
    for file in "${MEDIA_FILES[@]:0:5}"; do
        echo "   🖼️  $file"
    done
    
    if [ ${#MEDIA_FILES[@]} -gt 5 ]; then
        echo "   ... e mais $((${#MEDIA_FILES[@]} - 5)) arquivos de mídia"
    fi
fi

# Confirmação
echo ""
read -p "Confirmar commit apenas do código? (s/N): " CONFIRM

if [[ ! $CONFIRM =~ ^[Ss]$ ]]; then
    echo "❌ Operação cancelada"
    exit 0
fi

# Adicionar apenas arquivos de código
echo ""
echo "📤 Adicionando arquivos de código..."

for file in "${CODE_FILES[@]}"; do
    git add "$file"
    echo "   ✅ $file"
done

# Criar commit
echo ""
echo "💾 Criando commit..."

COMMIT_MSG="feat: deploy scripts otimizados (apenas código)

🚀 Scripts melhorados:
- deploy-no-media-updated.js: deploy rápido sem mídias
- fix-absolute-urls-clean.js: URLs dinâmicas e correção de duplicação  
- simple-deploy.js: deploy usando configuração central

📋 Configuração:
- project.config.js: configuração unificada e validação

✨ Melhorias:
- Filtros inteligentes para JSON vs mídia
- URLs baseadas em project.config.js
- Economia significativa de tempo e banda
- Logs detalhados e verificação pré-deploy

📊 Commit stats: ${#CODE_FILES[@]} arquivos de código, ${#MEDIA_FILES[@]} mídias puladas"

git commit -m "$COMMIT_MSG"

if [ $? -eq 0 ]; then
    echo "✅ Commit criado com sucesso!"
    
    # Push
    echo ""
    read -p "Fazer push para origin? (s/N): " PUSH_CONFIRM
    
    if [[ $PUSH_CONFIRM =~ ^[Ss]$ ]]; then
        echo "🚀 Fazendo push..."
        git push origin $(git branch --show-current)
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "🎉 SUCCESS! Código enviado para o repositório"
            echo "🔗 https://github.com/limitrofe/newsroom"
            echo ""
            echo "📋 Estatísticas:"
            echo "   📄 Código enviado: ${#CODE_FILES[@]} arquivos"
            echo "   🖼️  Mídia pulada: ${#MEDIA_FILES[@]} arquivos"
            echo "   💾 Economia: Muito espaço e tempo!"
        else
            echo "❌ Erro no push"
        fi
    else
        echo "💾 Commit criado localmente"
        echo "🔄 Para fazer push depois: git push origin main"
    fi
else
    echo "❌ Erro ao criar commit"
fi

# Cleanup
rm -f "$TEMP_FILE_LIST"