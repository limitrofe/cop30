#!/bin/bash
# Script para purgar cache do projeto a-trama-do-golpe
# Gerado automaticamente em: 8/29/2025, 12:49:36 AM

echo "🧹 Purgando cache do projeto: a-trama-do-golpe"
echo "📊 Total de URLs: 73"
echo "🌐 CDN Base: https://s3.glbimg.com/v1/AUTH_e03f7a1106bb438e970511f892f07c35"
echo ""

# Função para purgar uma URL
purge_url() {
  local url_path="$1"
  local full_url="https://s3.glbimg.com/v1/AUTH_e03f7a1106bb438e970511f892f07c35$url_path"
  
  # Tentar método PURGE primeiro
  response_code=$(curl -s -o /dev/null -w "%{http_code}" -X PURGE "$full_url")
  
  if [ "$response_code" -eq 200 ] || [ "$response_code" -eq 404 ]; then
    echo "✅ Purgado: $url_path (HTTP $response_code)"
  else
    # Fallback: cache-busting
    cache_bust_url="$full_url?cb=$(date +%s)&purge=1"
    curl -s -o /dev/null -H "Cache-Control: no-cache" "$cache_bust_url"
    echo "🔄 Cache-bust: $url_path"
  fi
}

export -f purge_url

echo "🚀 Iniciando purge..."
echo ""

# Processar URLs em paralelo (5 de cada vez)
cat cache-list.txt 2>/dev/null | xargs -P 5 -I {} bash -c 'purge_url "{}"' || {
  echo "⚠️ cache-list.txt não encontrado - purgando apenas arquivos principais"
  echo "g1/a-trama-do-golpe/index.html" | xargs -I {} bash -c 'purge_url "{}"'
  echo "g1/a-trama-do-golpe/app.css" | xargs -I {} bash -c 'purge_url "{}"'
  echo "g1/a-trama-do-golpe/app.js" | xargs -I {} bash -c 'purge_url "{}"'
}

echo ""
echo "✅ Purge concluído!"
echo "🎯 Projeto: a-trama-do-golpe"
echo "🕒 Cache pode levar alguns minutos para ser totalmente limpo"
