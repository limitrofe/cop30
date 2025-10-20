#!/bin/bash
# workflow-s3.sh - Workflow completo para S3 CDN

echo "🚀 WORKFLOW COMPLETO PARA S3 CDN"
echo "================================="

PROJECT_NAME="dias-perfeitos"
S3_BASE="https://s3.glbimg.com/v1/AUTH_e03f7a1106bb438e970511f892f07c35/g1/${PROJECT_NAME}"

echo "📍 URL Base: ${S3_BASE}"
echo ""

# 1. Fetch dos dados (se necessário)
echo "📥 1. FETCH DOS DADOS DO GOOGLE DOCS"
echo "-----------------------------------"
if [ ! -z "$1" ]; then
    echo "Executando: npm run fetch $1"
    npm run fetch $1
    echo "✅ Dados atualizados"
else
    echo "ℹ️ Pulando fetch (sem DOC_ID fornecido)"
    echo "  Para atualizar: $0 DOC_ID"
fi
echo ""

# 2. Build
echo "🔨 2. BUILD DO PROJETO"
echo "---------------------"
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Falha no build"
    exit 1
fi
echo "✅ Build concluído"
echo ""

# 3. Fix de URLs absolutas
echo "🔧 3. CORRIGINDO URLs PARA S3"
echo "-----------------------------"
node scripts/fix-absolute-urls.js
if [ $? -ne 0 ]; then
    echo "❌ Falha na correção de URLs"
    exit 1
fi
echo "✅ URLs corrigidas para S3"
echo ""

# 4. Verificar estrutura final
echo "📁 4. VERIFICANDO ESTRUTURA FINAL"
echo "--------------------------------"
echo "Arquivos no build/:"
find build/ -type f | head -10
echo ""

echo "📄 Verificando URLs no index.html:"
if grep -q "${S3_BASE}" build/index.html; then
    echo "✅ URLs S3 encontradas no index.html"
    echo "Exemplos:"
    grep -o "${S3_BASE}[^\"']*" build/index.html | head -3
else
    echo "⚠️ URLs S3 não encontradas - verificar correção"
fi
echo ""

# 5. Verificar dados
echo "📊 5. VERIFICANDO DADOS"
echo "----------------------"
if [ -f "build/data/dias-perfeitos.json" ]; then
    echo "✅ Arquivo de dados encontrado: build/data/dias-perfeitos.json"
    DATA_SIZE=$(stat -f%z build/data/dias-perfeitos.json 2>/dev/null || stat -c%s build/data/dias-perfeitos.json 2>/dev/null)
    echo "📏 Tamanho: ${DATA_SIZE} bytes"
    
    # Verificar se tem conteúdo real
    if grep -q "scrollyframes\|scrollytelling" build/data/dias-perfeitos.json; then
        echo "✅ Componentes de scroll encontrados nos dados"
    else
        echo "⚠️ Componentes de scroll não encontrados - verificar dados"
    fi
else
    echo "❌ Arquivo de dados NÃO encontrado"
    echo "Arquivos em build/data/:"
    ls -la build/data/ 2>/dev/null || echo "Pasta data/ não existe"
fi
echo ""

# 6. Upload (se script disponível)
echo "☁️ 6. UPLOAD PARA S3"
echo "-------------------"
if [ -f "scripts/upload-globo-storage.js" ]; then
    echo "Executando upload..."
    npm run upload
    if [ $? -eq 0 ]; then
        echo "✅ Upload concluído"
    else
        echo "⚠️ Upload falhou - verificar credenciais"
    fi
else
    echo "ℹ️ Script de upload não encontrado"
    echo "Manual: Faça upload da pasta build/ para:"
    echo "   ${S3_BASE}/"
fi
echo ""

# 7. URLs finais
echo "🎯 7. URLS FINAIS"
echo "----------------"
echo "📄 Página principal: ${S3_BASE}/index.html"
echo "📊 Dados JSON: ${S3_BASE}/data/dias-perfeitos.json"
echo "🗂️ Assets: ${S3_BASE}/_app/"
echo ""

echo "✅ WORKFLOW CONCLUÍDO!"
echo "====================="
echo ""
echo "🔗 Para embed, use: ${S3_BASE}/index.html"
echo "📋 Ou copie o conteúdo de build/index.html"
echo ""

# 8. Teste rápido de URLs
echo "🧪 TESTE RÁPIDO"
echo "---------------"
echo "Testando se URLs estão corretas no build..."

# Procurar por URLs problemáticas
PROBLEMATIC_URLS=$(grep -r "href=\"\.\/" build/ 2>/dev/null | wc -l)
if [ "$PROBLEMATIC_URLS" -gt 0 ]; then
    echo "⚠️ Ainda há ${PROBLEMATIC_URLS} URLs relativas problemáticas"
    echo "Exemplos:"
    grep -r "href=\"\.\/" build/ | head -3
else
    echo "✅ Nenhuma URL relativa problemática encontrada"
fi

echo ""
echo "🎉 PRONTO PARA USAR!"