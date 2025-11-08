// scripts/auto-cache-generator.js
// Script automático para gerar lista de cache baseado na configuração do projeto

import fs from 'fs/promises';
import path from 'path';
import PROJECT_CONFIG from '../project.config.js';

class AutoCacheGenerator {
	constructor() {
		this.config = PROJECT_CONFIG;
		this.cacheUrls = [];
		this.stats = {
			desktop: 0,
			mobile: 0,
			total: 0
		};
	}

	async scanFrames() {
		console.log('🔍 Escaneando frames automaticamente...');
		console.log(`📁 Projeto: ${this.config.projectName}`);

		const framesDir = this.config.localPaths.frames;

		try {
			await fs.access(framesDir);
		} catch {
			console.error(`❌ Pasta de frames não encontrada: ${framesDir}`);
			console.error('💡 Execute primeiro: npm run process:videos');
			process.exit(1);
		}

		// Escanear frames desktop
		await this.scanDesktopFrames();

		// Escanear frames mobile
		await this.scanMobileFrames();

		this.stats.total = this.cacheUrls.length;
	}

	async scanDesktopFrames() {
		const desktopDir = path.join(this.config.localPaths.frames, 'desktop');

		try {
			const videos = await fs.readdir(desktopDir);

			for (const video of videos) {
				const videoDir = path.join(desktopDir, video);
				const stat = await fs.stat(videoDir);

				if (stat.isDirectory()) {
					const frames = await fs.readdir(videoDir);

					for (const frame of frames) {
						if (frame.endsWith('.jpg')) {
							const frameUrl = `/${this.config.cdn.container}/${this.config.projectName}/img/frames/desktop/${video}/${frame}`;
							this.cacheUrls.push(frameUrl);
							this.stats.desktop++;
						}
					}
				}
			}

			console.log(`✅ Desktop: ${this.stats.desktop} frames`);
		} catch (error) {
			console.log(`⚠️ Pasta desktop não encontrada ou vazia`);
		}
	}

	async scanMobileFrames() {
		const mobileDir = path.join(this.config.localPaths.frames, 'mobile');

		try {
			const videos = await fs.readdir(mobileDir);

			for (const video of videos) {
				const videoDir = path.join(mobileDir, video);
				const stat = await fs.stat(videoDir);

				if (stat.isDirectory()) {
					const frames = await fs.readdir(videoDir);

					for (const frame of frames) {
						if (frame.endsWith('.webp')) {
							const frameUrl = `/${this.config.cdn.container}/${this.config.projectName}/img/frames/mobile/${video}/${frame}`;
							this.cacheUrls.push(frameUrl);
							this.stats.mobile++;
						}
					}
				}
			}

			console.log(`✅ Mobile: ${this.stats.mobile} frames`);
		} catch (error) {
			console.log(`⚠️ Pasta mobile não encontrada ou vazia`);
		}
	}

	async generateCacheList() {
		// Salvar lista completa
		const listContent = this.cacheUrls.join('\n');
		await fs.writeFile('cache-list.txt', listContent);

		console.log(`\n📄 Lista de cache salva: cache-list.txt`);
		console.log(`📊 Total de arquivos: ${this.stats.total}`);
		console.log(`   📱 Mobile: ${this.stats.mobile}`);
		console.log(`   🖥️ Desktop: ${this.stats.desktop}`);
	}

	async generateWarmScript() {
		const scriptContent = `#!/bin/bash
# Script automático para aquecer cache do projeto ${this.config.projectName}
# Gerado automaticamente em: ${new Date().toLocaleString()}

echo "🔥 Aquecendo cache do projeto: ${this.config.projectName}"
echo "📊 Total de arquivos: ${this.stats.total}"
echo "🌐 CDN Base: ${this.config.cdn.baseUrl}"
echo ""

# Função para requisição de aquecimento
warm_url() {
  local url="$1"
  local response_code=$(curl -s -o /dev/null -w "%{http_code}" "${this.config.cdn.baseUrl}\$url")
  
  if [ "\$response_code" -eq 200 ]; then
    echo "✅ \$url (HTTP \$response_code)"
  else
    echo "❌ \$url (HTTP \$response_code)"
  fi
}

export -f warm_url

echo "🚀 Iniciando aquecimento em paralelo (8 conexões simultâneas)..."
echo ""

# Processar em paralelo
cat cache-list.txt | xargs -P 8 -I {} bash -c 'warm_url "{}"'

echo ""
echo "✅ Aquecimento do cache concluído!"
echo "🎯 Projeto: ${this.config.projectName}"
echo "🌐 URL: ${this.config.baseProjectUrl}"
`;

		await fs.writeFile('warm-cache.sh', scriptContent);
		await fs.chmod('warm-cache.sh', '755');

		console.log(`📄 Script de aquecimento salvo: warm-cache.sh`);
	}

	async generateBatchWarmScript() {
		// Script em lotes para projetos grandes
		const batchSize = 100;
		const batches = Math.ceil(this.cacheUrls.length / batchSize);

		const batchScript = `#!/bin/bash
# Aquecimento em lotes para projeto grande: ${this.config.projectName}
# Total: ${this.stats.total} arquivos em ${batches} lotes

echo "🔥 Aquecimento em lotes - Projeto: ${this.config.projectName}"
echo "📦 ${this.stats.total} arquivos divididos em ${batches} lotes de ${batchSize}"
echo ""

# Função para aquecer um lote
warm_batch() {
  local batch_num="$1"
  local start_line=$(((\$batch_num - 1) * ${batchSize} + 1))
  local end_line=$((\$batch_num * ${batchSize}))
  
  echo "🔄 Processando lote \$batch_num de ${batches} (linhas \$start_line-\$end_line)..."
  
  sed -n "\${start_line},\${end_line}p" cache-list.txt | while read url; do
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "${this.config.cdn.baseUrl}\$url")
    echo "   ✓ \$url (\$response_code)"
  done
  
  echo "✅ Lote \$batch_num concluído"
  echo ""
}

export -f warm_batch

# Processar cada lote
for i in {1..${batches}}; do
  warm_batch \$i
  sleep 2  # Pausa entre lotes para não sobrecarregar
done

echo "🎉 Todos os lotes processados!"
echo "📊 Total aquecido: ${this.stats.total} arquivos"
`;

		await fs.writeFile('warm-cache-batch.sh', batchScript);
		await fs.chmod('warm-cache-batch.sh', '755');

		console.log(`📄 Script em lotes salvo: warm-cache-batch.sh`);
	}

	async run() {
		console.log('\n🚀 GERADOR AUTOMÁTICO DE CACHE');
		console.log('='.repeat(60));

		await this.scanFrames();
		await this.generateCacheList();
		await this.generateWarmScript();

		if (this.stats.total > 500) {
			await this.generateBatchWarmScript();
			console.log('\n💡 Projeto grande detectado - script em lotes criado');
		}

		console.log('\n✅ Scripts de cache gerados com sucesso!');
		console.log('\n📋 Como usar:');
		console.log('   1. Executar: ./warm-cache.sh (aquecimento normal)');
		if (this.stats.total > 500) {
			console.log('   2. Ou: ./warm-cache-batch.sh (para projetos grandes)');
		}
		console.log('   3. Lista salva em: cache-list.txt');

		console.log('\n🎯 Estatísticas:');
		console.log(`   📱 Mobile WebP: ${this.stats.mobile}`);
		console.log(`   🖥️ Desktop JPG: ${this.stats.desktop}`);
		console.log(`   📦 Total: ${this.stats.total}`);
		console.log(`   💾 Estimativa: ~${(this.stats.total * 0.1).toFixed(1)}MB`);
	}
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
	const generator = new AutoCacheGenerator();
	await generator.run();
}
