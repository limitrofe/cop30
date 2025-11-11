#!/bin/bash
# 🔥 CACHE COMPLETO - TUDO EXCETO JSON
# Projeto: a-trama-do-golpe
# Gerado: 8/29/2025, 3:17:55 AM
# Total: 73 arquivos

echo "🔥 AQUECENDO CACHE COMPLETO"
echo "📁 Projeto: a-trama-do-golpe"
echo "📊 Assets: 73 arquivos"
echo "🌐 CDN: https://s3.glbimg.com/v1/AUTH_e03f7a1106bb438e970511f892f07c35"
echo "❌ JSONs excluídos (sempre atualizados)"
echo ""

# Contador de progresso
count=0
total=73

# Função para aquecer com progresso
warm_url() {
  local url="$1"
  local response_code=$(curl -s -o /dev/null -w "%{http_code}" "https://s3.glbimg.com/v1/AUTH_e03f7a1106bb438e970511f892f07c35$url")
  
  count=$((count + 1))
  progress=$((count * 100 / total))
  
  if [ "$response_code" -eq 200 ]; then
    echo "[$progress%] ✅ $url"
  else
    echo "[$progress%] ❌ $url (HTTP $response_code)"
  fi
}

export -f warm_url
export count total

echo "🚀 Iniciando aquecimento paralelo (10 conexões)..."
echo ""

# Processar em paralelo com progresso
cat cache-list.txt | xargs -P 10 -I {} bash -c 'warm_url "{}"'

echo ""
echo "🎉 CACHE COMPLETO AQUECIDO!"
echo "⚡ Sua matéria vai carregar instantaneamente!"
echo "🎯 Projeto: https://s3.glbimg.com/v1/AUTH_e03f7a1106bb438e970511f892f07c35/g1/a-trama-do-golpe"
