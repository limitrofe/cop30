// scripts/cache-purge.js
// Script para limpar/purgar cache da CDN
// Remove todos os arquivos do cache da CDN Globo

import fs from 'fs/promises';
import PROJECT_CONFIG from '../project.config.js';

class CachePurger {
	constructor() {
		this.config = PROJECT_CONFIG;
		this.purgedCount = 0;
		this.failedCount = 0;
	}

	async purgeCacheList() {
		console.log('\n🧹 LIMPANDO CACHE DA CDN');
		console.log('='.repeat(60));
		console.log(`📁 Projeto: ${this.config.projectName}`);
		console.log(`🌐 CDN Base: ${this.config.cdn.baseUrl}`);

		// Verificar se existe lista de cache
		try {
			await fs.access('cache-list.txt');
		} catch {
			console.error('❌ Arquivo cache-list.txt não encontrado!');
			console.error('💡 Execute primeiro: npm run cache:generate');
			process.exit(1);
		}

		// Ler lista de URLs
		const cacheContent = await fs.readFile('cache-list.txt', 'utf8');
		const urls = cacheContent
			.trim()
			.split('\n')
			.filter((url) => url.trim());

		console.log(`📄 ${urls.length} URLs encontradas na lista de cache`);
		console.log('\n🔥 Iniciando purge do cache...');

		// Purgar cada URL
		for (let i = 0; i < urls.length; i++) {
			const url = urls[i].trim();
			const progress = `[${i + 1}/${urls.length}]`;

			try {
				await this.purgeUrl(url);
				this.purgedCount++;
				process.stdout.write(
					`\r${progress} ✅ ${this.purgedCount} purgados | ❌ ${this.failedCount} falhas`
				);
			} catch (error) {
				this.failedCount++;
				process.stdout.write(
					`\r${progress} ✅ ${this.purgedCount} purgados | ❌ ${this.failedCount} falhas`
				);
			}

			// Pausa pequena para não sobrecarregar
			if (i % 10 === 0) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		}

		console.log('\n\n' + '='.repeat(60));
		console.log('🧹 PURGE CONCLUÍDO!');
		console.log(`✅ Purgados: ${this.purgedCount}`);
		console.log(`❌ Falhas: ${this.failedCount}`);
		console.log(`📊 Total: ${urls.length}`);
	}

	async purgeUrl(urlPath) {
		// URL completa para purge
		const fullUrl = `${this.config.cdn.baseUrl}${urlPath}`;

		// Fazer requisição PURGE para limpar cache
		// Método 1: PURGE request (padrão CDN)
		try {
			const response = await fetch(fullUrl, {
				method: 'PURGE',
				headers: {
					'User-Agent': 'CachePurger/1.0',
					'Cache-Control': 'no-cache'
				}
			});

			if (response.ok || response.status === 404) {
				return true; // Sucesso ou já não existe
			}

			throw new Error(`HTTP ${response.status}`);
		} catch (error) {
			// Método 2: HEAD request com cache-busting (fallback)
			try {
				const cacheBustUrl = `${fullUrl}?cb=${Date.now()}&purge=1`;
				const response = await fetch(cacheBustUrl, {
					method: 'HEAD',
					headers: {
						'Cache-Control': 'no-cache, no-store, must-revalidate',
						Pragma: 'no-cache',
						Expires: '0'
					}
				});
				return true;
			} catch (fallbackError) {
				throw new Error(`Purge failed: ${error.message}`);
			}
		}
	}

	async purgeProject() {
		console.log('\n🧹 PURGE COMPLETO DO PROJETO');
		console.log('='.repeat(60));
		console.log(`📁 Projeto: ${this.config.projectName}`);

		// URLs principais para purgar
		const mainUrls = [
			`/${this.config.cdn.container}/${this.config.projectName}/index.html`,
			`/${this.config.cdn.container}/${this.config.projectName}/`,
			`/${this.config.cdn.container}/${this.config.projectName}/app.css`,
			`/${this.config.cdn.container}/${this.config.projectName}/app.js`,
			`/${this.config.cdn.container}/${this.config.projectName}/data/story.json`
		];

		console.log('\n🔥 Purgando arquivos principais...');

		for (const url of mainUrls) {
			try {
				await this.purgeUrl(url);
				console.log(`✅ ${url}`);
			} catch (error) {
				console.log(`❌ ${url} (${error.message})`);
			}
		}

		// Purgar cache de frames se existir lista
		try {
			await fs.access('cache-list.txt');
			console.log('\n📄 Lista de cache encontrada - purgando frames...');
			await this.purgeCacheList();
		} catch {
			console.log('\n⚠️ Lista de cache não encontrada - apenas arquivos principais purgados');
		}
	}

	async generatePurgeScript() {
		console.log('\n📝 Gerando script de purge...');

		// Ler lista de cache se existir
		let urls = [];
		try {
			const cacheContent = await fs.readFile('cache-list.txt', 'utf8');
			urls = cacheContent
				.trim()
				.split('\n')
				.filter((url) => url.trim());
		} catch {
			console.log('⚠️ cache-list.txt não encontrado - usando URLs padrão');
			urls = [
				`/${this.config.cdn.container}/${this.config.projectName}/index.html`,
				`/${this.config.cdn.container}/${this.config.projectName}/app.css`,
				`/${this.config.cdn.container}/${this.config.projectName}/app.js`
			];
		}

		const bashScript = `#!/bin/bash
# Script para purgar cache do projeto ${this.config.projectName}
# Gerado automaticamente em: ${new Date().toLocaleString()}

echo "🧹 Purgando cache do projeto: ${this.config.projectName}"
echo "📊 Total de URLs: ${urls.length}"
echo "🌐 CDN Base: ${this.config.cdn.baseUrl}"
echo ""

# Função para purgar uma URL
purge_url() {
  local url_path="$1"
  local full_url="${this.config.cdn.baseUrl}\$url_path"
  
  # Tentar método PURGE primeiro
  response_code=$(curl -s -o /dev/null -w "%{http_code}" -X PURGE "\$full_url")
  
  if [ "\$response_code" -eq 200 ] || [ "\$response_code" -eq 404 ]; then
    echo "✅ Purgado: \$url_path (HTTP \$response_code)"
  else
    # Fallback: cache-busting
    cache_bust_url="\$full_url?cb=\$(date +%s)&purge=1"
    curl -s -o /dev/null -H "Cache-Control: no-cache" "\$cache_bust_url"
    echo "🔄 Cache-bust: \$url_path"
  fi
}

export -f purge_url

echo "🚀 Iniciando purge..."
echo ""

# Processar URLs em paralelo (5 de cada vez)
cat cache-list.txt 2>/dev/null | xargs -P 5 -I {} bash -c 'purge_url "{}"' || {
  echo "⚠️ cache-list.txt não encontrado - purgando apenas arquivos principais"
  echo "${this.config.cdn.container}/${this.config.projectName}/index.html" | xargs -I {} bash -c 'purge_url "{}"'
  echo "${this.config.cdn.container}/${this.config.projectName}/app.css" | xargs -I {} bash -c 'purge_url "{}"'
  echo "${this.config.cdn.container}/${this.config.projectName}/app.js" | xargs -I {} bash -c 'purge_url "{}"'
}

echo ""
echo "✅ Purge concluído!"
echo "🎯 Projeto: ${this.config.projectName}"
echo "🕒 Cache pode levar alguns minutos para ser totalmente limpo"
`;

		await fs.writeFile('purge-cache.sh', bashScript);
		await fs.chmod('purge-cache.sh', '755');

		console.log('📄 Script criado: purge-cache.sh');
	}

	async run(command = 'all') {
		switch (command) {
			case 'list':
				await this.purgeCacheList();
				break;
			case 'project':
				await this.purgeProject();
				break;
			case 'script':
				await this.generatePurgeScript();
				break;
			case 'all':
			default:
				await this.purgeProject();
				await this.generatePurgeScript();
				break;
		}

		console.log('\n💡 DICAS:');
		console.log('   • Cache da CDN pode levar 5-15 minutos para limpar completamente');
		console.log('   • Teste em navegador privado para verificar se cache foi limpo');
		console.log('   • Use Ctrl+F5 para forçar reload completo');
	}
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
	const purger = new CachePurger();
	const command = process.argv[2] || 'all';

	if (['--help', '-h'].includes(command)) {
		console.log(`
🧹 CACHE PURGER - Limpa cache da CDN

Uso: node scripts/cache-purge.js [comando]

Comandos:
  all       Purge completo (padrão)
  project   Purgar apenas arquivos principais
  list      Purgar baseado em cache-list.txt
  script    Gerar apenas script bash
  
Exemplos:
  npm run cache:purge
  npm run cache:purge project
  ./purge-cache.sh
`);
		process.exit(0);
	}

	await purger.run(command);
}
