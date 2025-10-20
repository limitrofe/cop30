#!/bin/bash
# Aquecimento em lotes para projeto grande: dias-perfeitos
# Total: 1291 arquivos em 13 lotes

echo "🔥 Aquecimento em lotes - Projeto: dias-perfeitos"
echo "📦 1291 arquivos divididos em 13 lotes de 100"
echo ""

# Função para aquecer um lote
warm_batch() {
  local batch_num="$1"
  local start_line=$((($batch_num - 1) * 100 + 1))
  local end_line=$(($batch_num * 100))
  
  echo "🔄 Processando lote $batch_num de 13 (linhas $start_line-$end_line)..."
  
  sed -n "${start_line},${end_line}p" cache-list.txt | while read url; do
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "https://s3.glbimg.com/v1/AUTH_e03f7a1106bb438e970511f892f07c35$url")
    echo "   ✓ $url ($response_code)"
  done
  
  echo "✅ Lote $batch_num concluído"
  echo ""
}

export -f warm_batch

# Processar cada lote
for i in {1..13}; do
  warm_batch $i
  sleep 2  # Pausa entre lotes para não sobrecarregar
done

echo "🎉 Todos os lotes processados!"
echo "📊 Total aquecido: 1291 arquivos"
