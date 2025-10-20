// scripts/enhanced-cache-generator.js
// ⚡ CACHE GENERATOR COMPLETO - Todas as imagens, não só frames

import fs from 'fs/promises';
import path from 'path';
import PROJECT_CONFIG from '../project.config.js';

class EnhancedCacheGenerator {
	constructor() {
		this.config = PROJECT_CONFIG;
		this.cacheUrls = [];
		this.stats = {
			frames: { desktop: 0, mobile: 0 },
			images: { regular: 0, responsive: 0 },
			data: 0,
			total: 0
		};
	}

	async run() {
		console.log('\n🚀 CACHE GENERATOR COMPLETO - TODAS AS IMAGENS');
		console.log('='.repeat(60));
		console.log(`📁 Projeto: ${this.config.projectName}`);

		// Escanear todas as fontes de assets
		await this.scanFrames(); // Frames de vídeo (se existir)
		await this.scanImages(); // Todas as imagens em static/img
		await this.scanData(); // Dados JSON
		await this.scanBuildAssets(); // Assets do build

		await this.generateCacheList();
		await this.generateWarmScript();

		this.showStats();
	}

	/**
	 * Escanear frames de vídeo (sistema antigo)
	 */
	async scanFrames() {
		console.log('\n🎬 Escaneando frames de vídeo...');

		const framesDir = 'static/img/frames';

		try {
			await fs.access(framesDir);

			// Desktop frames
			await this.scanFramesDir(path.join(framesDir, 'desktop'), 'desktop', '.jpg');

			// Mobile frames
			await this.scanFramesDir(path.join(framesDir, 'mobile'), 'mobile', '.webp');

			console.log(
				`   ✅ Frames: ${this.stats.frames.desktop} desktop + ${this.stats.frames.mobile} mobile`
			);
		} catch {
			console.log('   ⚠️  Pasta frames não encontrada - sem problema!');
		}
	}

	async scanFramesDir(dirPath, type, extension) {
		try {
			const videos = await fs.readdir(dirPath);

			for (const video of videos) {
				const videoDir = path.join(dirPath, video);
				const stat = await fs.stat(videoDir);

				if (stat.isDirectory()) {
					const frames = await fs.readdir(videoDir);

					for (const frame of frames) {
						if (frame.endsWith(extension)) {
							const frameUrl = `/${this.config.cdn.container}/${this.config.projectName}/img/frames/${type}/${video}/${frame}`;
							this.cacheUrls.push(frameUrl);
							this.stats.frames[type]++;
						}
					}
				}
			}
		} catch {
			// Pasta não existe, ok
		}
	}

	/**
	 * 🆕 NOVO: Escanear TUDO exceto JSON
	 */
	async scanImages() {
		console.log('\n🖼️  Escaneando TODOS os assets (exceto JSON)...');

		const staticDir = 'static';

		try {
			await fs.access(staticDir);
			await this.scanDirectory(staticDir, 'static');

			console.log(`   ✅ Assets: ${this.stats.images.regular} arquivos encontrados`);
		} catch {
			console.log('   ⚠️  Pasta static não encontrada');
		}
	}

	/**
	 * Escanear diretório recursivamente - TUDO exceto JSON
	 */
	async scanDirectory(dirPath, basePath) {
		try {
			const items = await fs.readdir(dirPath, { withFileTypes: true });

			for (const item of items) {
				const itemPath = path.join(dirPath, item.name);
				const relativePath = path.relative('static', itemPath);

				if (item.isDirectory()) {
					// Recursivo para todas as subpastas
					await this.scanDirectory(itemPath, basePath);
				} else if (item.isFile()) {
					// Cachear TODOS os arquivos exceto JSON
					const ext = path.extname(item.name).toLowerCase();

					if (ext !== '.json') {
						const assetUrl = `/${this.config.cdn.container}/${this.config.projectName}/${relativePath.replace(/\\/g, '/')}`;
						this.cacheUrls.push(assetUrl);
						this.stats.images.regular++;

						// Log apenas alguns exemplos para não poluir
						if (this.stats.images.regular <= 5) {
							console.log(`   📄 ${relativePath}`);
						} else if (this.stats.images.regular === 6) {
							console.log('   ... (continuando scan)');
						}
					}
				}
			}
		} catch (error) {
			// Pasta não acessível, continuar
		}
	}

	/**
	 * Escanear assets do build (HTML, CSS, JS)
	 */
	async scanBuildAssets() {
		console.log('\n📦 Escaneando assets do build...');

		// Adicionar assets principais que sempre existem
		const mainAssets = [
			`/${this.config.cdn.container}/${this.config.projectName}/index.html`,
			`/${this.config.cdn.container}/${this.config.projectName}/app.css`,
			`/${this.config.cdn.container}/${this.config.projectName}/app.js`
		];

		for (const asset of mainAssets) {
			this.cacheUrls.push(asset);
			this.stats.data++;
		}

		console.log(`   ✅ Build assets: ${mainAssets.length} arquivos principais`);
	}

	/**
	 * Não cachear dados JSON (se mudam sempre)
	 */
	async scanData() {
		console.log('\n📄 Dados JSON...');
		console.log('   ⚠️  JSONs NÃO serão cacheados (mudam sempre)');
		console.log('   ✅ Isso garante conteúdo sempre atualizado!');
	}

	async generateCacheList() {
		// Remover duplicatas e ordenar
		this.cacheUrls = [...new Set(this.cacheUrls)].sort();
		this.stats.total = this.cacheUrls.length;

		// Salvar lista completa
		const listContent = this.cacheUrls.join('\n');
		await fs.writeFile('cache-list.txt', listContent);

		console.log(`\n📄 Lista de cache salva: cache-list.txt`);
		console.log(`📊 Total de URLs: ${this.stats.total} (sem duplicatas)`);

		// Salvar também uma versão detalhada para debug
		const detailedList = {
			projeto: this.config.projectName,
			gerado: new Date().toISOString(),
			total: this.stats.total,
			stats: this.stats,
			urls: this.cacheUrls
		};

		await fs.writeFile('cache-list-detailed.json', JSON.stringify(detailedList, null, 2));
		console.log(`📄 Lista detalhada: cache-list-detailed.json`);
	}

	async generateWarmScript() {
		const scriptContent = `#!/bin/bash
# 🔥 CACHE COMPLETO - TUDO EXCETO JSON
# Projeto: ${this.config.projectName}
# Gerado: ${new Date().toLocaleString()}
# Total: ${this.stats.total} arquivos

echo "🔥 AQUECENDO CACHE COMPLETO"
echo "📁 Projeto: ${this.config.projectName}"
echo "📊 Assets: ${this.stats.total} arquivos"
echo "🌐 CDN: ${this.config.cdn.baseUrl}"
echo "❌ JSONs excluídos (sempre atualizados)"
echo ""

# Contador de progresso
count=0
total=${this.stats.total}

# Função para aquecer com progresso
warm_url() {
  local url="$1"
  local response_code=$(curl -s -o /dev/null -w "%{http_code}" "${this.config.cdn.baseUrl}\$url")
  
  count=$((count + 1))
  progress=$((count * 100 / total))
  
  if [ "\$response_code" -eq 200 ]; then
    echo "[\$progress%] ✅ \$url"
  else
    echo "[\$progress%] ❌ \$url (HTTP \$response_code)"
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
echo "🎯 Projeto: ${this.config.baseProjectUrl}"
`;

		await fs.writeFile('warm-cache.sh', scriptContent);
		await fs.chmod('warm-cache.sh', '755');

		console.log(`\n📄 Script de aquecimento salvo: warm-cache.sh`);
		console.log(`\n🚀 Para executar:`);
		console.log(`   ./warm-cache.sh`);
	}

	showStats() {
		console.log('\n📊 ESTATÍSTICAS COMPLETAS');
		console.log('-'.repeat(40));
		console.log(`🎬 Frames de vídeo: ${this.stats.frames.desktop + this.stats.frames.mobile}`);
		console.log(`   • Desktop: ${this.stats.frames.desktop} (JPG)`);
		console.log(`   • Mobile: ${this.stats.frames.mobile} (WebP)`);
		console.log(`🖼️  Assets estáticos: ${this.stats.images.regular}`);
		console.log(`   • Imagens, vídeos, fontes, etc.`);
		console.log(`📦 Build assets: ${this.stats.data}`);
		console.log(`   • HTML, CSS, JS`);
		console.log(`❌ JSON excluídos: Sempre atualizados`);
		console.log('-'.repeat(40));
		console.log(`🎯 TOTAL CACHE: ${this.stats.total} arquivos`);
		console.log(`💾 Estimativa: ~${(this.stats.total * 0.15).toFixed(1)}MB`);
		console.log(`⚡ Performance: MÁXIMA com cache completo!`);

		console.log('\n💡 COMO FUNCIONA:');
		console.log('   ✅ Assets estáticos = Cache agressivo');
		console.log('   ❌ story.json = Sempre atualizado do Google Docs');
		console.log('   🎯 Melhor dos dois mundos!');
	}
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
	const generator = new EnhancedCacheGenerator();
	await generator.run();
}

export default EnhancedCacheGenerator;
