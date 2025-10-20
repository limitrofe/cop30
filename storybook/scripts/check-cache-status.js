// scripts/check-cache-status.js
// Verifica quais arquivos estão em cache na CDN

import fs from 'fs/promises';

class CacheChecker {
	constructor() {
		// Config simples - mude se necessário
		this.projectName = 'dias-perfeitos';
		this.container = 'g1';
		this.cdnBaseUrl = 'https://s3.glbimg.com/v1/AUTH_e03f7a1106bb438e970511f892f07c35';
	}

	async checkCacheStatus() {
		console.log('\n🔍 VERIFICANDO STATUS DO CACHE');
		console.log('='.repeat(60));
		console.log(`📁 Projeto: ${this.projectName}`);
		console.log(`🌐 CDN: ${this.cdnBaseUrl}`);

		// Ler lista de cache se existir
		let urls = [];
		try {
			const content = await fs.readFile('cache-list.txt', 'utf8');
			urls = content
				.trim()
				.split('\n')
				.filter((url) => url.trim());
			console.log(`📄 ${urls.length} URLs na lista de cache`);
		} catch {
			console.error('❌ cache-list.txt não encontrado!');
			console.error('💡 Execute primeiro: node scripts/simple-cache-generator.js');
			process.exit(1);
		}

		console.log('\n🚀 Verificando status do cache...');

		const results = {
			cached: [],
			notCached: [],
			errors: []
		};

		// Verificar cada URL
		for (let i = 0; i < urls.length; i++) {
			const urlPath = urls[i].trim();
			const fullUrl = `${this.cdnBaseUrl}${urlPath}`;

			try {
				const response = await fetch(fullUrl, {
					method: 'HEAD',
					headers: {
						'User-Agent': 'CacheChecker/1.0'
					}
				});

				// Verificar headers de cache
				const cacheStatus = this.getCacheStatus(response);
				const fileName = urlPath.split('/').pop();

				const info = {
					url: urlPath,
					file: fileName,
					status: response.status,
					cached: cacheStatus.cached,
					age: cacheStatus.age,
					server: response.headers.get('server') || 'unknown'
				};

				if (cacheStatus.cached) {
					results.cached.push(info);
				} else {
					results.notCached.push(info);
				}
			} catch (error) {
				results.errors.push({
					url: urlPath,
					error: error.message
				});
			}

			// Mostrar progresso
			const progress = `[${i + 1}/${urls.length}]`;
			const cached = results.cached.length;
			const notCached = results.notCached.length;
			const errors = results.errors.length;

			process.stdout.write(`\r${progress} ✅ ${cached} | ❌ ${notCached} | 🔥 ${errors}`);

			// Pausa para não sobrecarregar
			if (i % 20 === 0) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		}

		console.log('\n\n' + '='.repeat(60));
		await this.showResults(results);
	}

	getCacheStatus(response) {
		// Analisar headers para determinar se está em cache
		const cacheControl = response.headers.get('cache-control') || '';
		const age = response.headers.get('age');
		const xCache = response.headers.get('x-cache') || '';
		const cfCache = response.headers.get('cf-cache-status') || '';

		// Indicadores de cache HIT
		const cacheIndicators = [
			xCache.toLowerCase().includes('hit'),
			cfCache.toLowerCase().includes('hit'),
			age && parseInt(age) > 0,
			response.headers.get('x-served-by'),
			response.headers.get('x-cache-hits')
		];

		const cached = cacheIndicators.some((indicator) => indicator);

		return {
			cached,
			age: age ? `${age}s` : 'unknown',
			cacheHeader: xCache || cfCache || 'none',
			cacheControl
		};
	}

	async showResults(results) {
		console.log('📊 RESULTADO DA VERIFICAÇÃO');
		console.log('='.repeat(60));

		const total = results.cached.length + results.notCached.length + results.errors.length;
		const cachePercent = ((results.cached.length / total) * 100).toFixed(1);

		console.log(`✅ Em cache: ${results.cached.length} (${cachePercent}%)`);
		console.log(`❌ Não em cache: ${results.notCached.length}`);
		console.log(`🔥 Erros: ${results.errors.length}`);
		console.log(`📦 Total: ${total}`);

		// Salvar relatório detalhado
		const report = {
			timestamp: new Date().toISOString(),
			project: this.projectName,
			summary: {
				total,
				cached: results.cached.length,
				notCached: results.notCached.length,
				errors: results.errors.length,
				cachePercentage: cachePercent
			},
			details: {
				cached: results.cached.slice(0, 10), // Apenas primeiros 10
				notCached: results.notCached.slice(0, 10),
				errors: results.errors
			}
		};

		await fs.writeFile('cache-status-report.json', JSON.stringify(report, null, 2));
		console.log('\n📄 Relatório salvo: cache-status-report.json');

		// Mostrar alguns exemplos
		if (results.cached.length > 0) {
			console.log('\n✅ Exemplos em cache:');
			results.cached.slice(0, 5).forEach((item) => {
				console.log(`   ${item.file} (age: ${item.age})`);
			});
		}

		if (results.notCached.length > 0) {
			console.log('\n❌ Exemplos NÃO em cache:');
			results.notCached.slice(0, 5).forEach((item) => {
				console.log(`   ${item.file}`);
			});

			if (results.notCached.length > 0) {
				console.log('\n💡 Para aquecer cache:');
				console.log('   npm run cache:warm');
				console.log('   ./warm-cache.sh');
			}
		}

		if (results.errors.length > 0) {
			console.log('\n🔥 Erros encontrados:');
			results.errors.slice(0, 3).forEach((item) => {
				console.log(`   ${item.url}: ${item.error}`);
			});
		}
	}

	async checkSingleFile(filePath) {
		console.log(`🔍 Verificando: ${filePath}`);

		const fullUrl = `${this.cdnBaseUrl}${filePath}`;

		try {
			const response = await fetch(fullUrl, { method: 'HEAD' });
			const cacheStatus = this.getCacheStatus(response);

			console.log(`Status: ${response.status}`);
			console.log(`Cache: ${cacheStatus.cached ? '✅ HIT' : '❌ MISS'}`);
			console.log(`Age: ${cacheStatus.age}`);
			console.log(`Cache Header: ${cacheStatus.cacheHeader}`);

			return cacheStatus.cached;
		} catch (error) {
			console.error(`❌ Erro: ${error.message}`);
			return false;
		}
	}
}

// CLI
async function main() {
	const args = process.argv.slice(2);
	const checker = new CacheChecker();

	if (args[0] === '--help' || args[0] === '-h') {
		console.log(`
🔍 CACHE STATUS CHECKER

Uso:
  node check-cache-status.js              Verificar todos os arquivos
  node check-cache-status.js --file URL   Verificar arquivo específico

Exemplos:
  node check-cache-status.js
  node check-cache-status.js --file /g1/projeto/img/frame001.jpg

Saída:
  • Lista quais arquivos estão em cache
  • Mostra porcentagem de cache hit
  • Salva relatório em cache-status-report.json
`);
		process.exit(0);
	}

	if (args[0] === '--file' && args[1]) {
		await checker.checkSingleFile(args[1]);
	} else {
		await checker.checkCacheStatus();
	}
}

// Executar
if (import.meta.url === `file://${process.argv[1]}`) {
	await main();
}
