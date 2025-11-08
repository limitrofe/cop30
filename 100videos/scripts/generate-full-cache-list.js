// scripts/generate-full-cache-list.js
import fs from 'fs/promises';
import path from 'path';

async function generateFullCacheList() {
	const baseDir = path.join(process.cwd(), 'static/img/frames');
	const projectName = 'dias-perfeitos';
	const cacheUrls = [];

	console.log('🔍 Escaneando todos os frames...');

	// Escanear desktop
	const desktopDir = path.join(baseDir, 'desktop');
	const desktopVideos = await fs.readdir(desktopDir);

	for (const video of desktopVideos) {
		const framesDir = path.join(desktopDir, video);
		const frames = await fs.readdir(framesDir);

		for (const frame of frames) {
			if (frame.endsWith('.jpg')) {
				cacheUrls.push(`/g1/${projectName}/img/frames/desktop/${video}/${frame}`);
			}
		}
	}

	// Escanear mobile
	const mobileDir = path.join(baseDir, 'mobile');
	const mobileVideos = await fs.readdir(mobileDir);

	for (const video of mobileVideos) {
		const framesDir = path.join(mobileDir, video);
		const frames = await fs.readdir(framesDir);

		for (const frame of frames) {
			if (frame.endsWith('.webp')) {
				cacheUrls.push(`/g1/${projectName}/img/frames/mobile/${video}/${frame}`);
			}
		}
	}

	// Salvar lista
	await fs.writeFile('cache-all-frames.txt', cacheUrls.join('\n'));

	console.log(`✅ Lista completa gerada: ${cacheUrls.length} arquivos`);
	console.log(`📦 Tamanho estimado: ~${(cacheUrls.length * 0.1).toFixed(1)}MB`);

	// Criar script de warming
	const warmScript = `#!/bin/bash
# Script para aquecer o cache com TODOS os frames
# Executa em paralelo para ser mais rápido

echo "🔥 Aquecendo cache com ${cacheUrls.length} arquivos..."

# Função para fazer o curl
warm_url() {
  url=$1
  curl -s -o /dev/null -w "%{http_code}" "https://s3.glbimg.com/v1/AUTH_e03f7a1106bb438e970511f892f07c35$url"
  echo "✓ $url"
}

export -f warm_url

# Processar em paralelo (10 de cada vez)
cat cache-all-frames.txt | xargs -P 10 -I {} bash -c 'warm_url "{}"'

echo "✅ Cache aquecido com sucesso!"
`;

	await fs.writeFile('warm-cache.sh', warmScript);
	await fs.chmod('warm-cache.sh', '755');

	console.log('📄 Script de aquecimento criado: warm-cache.sh');
}

generateFullCacheList();
