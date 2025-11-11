// scripts/fix-absolute-urls-clean.js
// Script limpo para corrigir URLs duplicadas

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import PROJECT_CONFIG from '../project.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixAbsoluteUrls() {
	console.log('\n🔧 CORRIGINDO URLs DUPLICADAS...');

	// Validar configuração do projeto
	if (!PROJECT_CONFIG.validate()) {
		console.error('❌ Configuração do projeto inválida');
		process.exit(1);
	}

	// Usar URL base dinâmica do projeto
	const baseUrl =
		'https://s3.glbimg.com/v1/AUTH_e03f7a1106bb438e970511f892f07c35/g1/a-trama-do-golpe';

	console.log(`📁 Projeto: ${PROJECT_CONFIG.projectName}`);
	console.log(`🌐 URL Base: ${BASE_URL}`);
	console.log('='.repeat(80));

	const buildDir = path.join(__dirname, '../build');

	try {
		// 1. Processar index.html
		const indexPath = path.join(buildDir, 'index.html');
		let indexContent = await fs.readFile(indexPath, 'utf8');

		console.log('🔍 Corrigindo URLs no index.html...');

		let totalChanges = 0;

		// Padrão 1: Corrigir URLs duplicadas (mais comum)
		const duplicatedPattern = /https:\/\/[^"']*https:\/\/[^"']*/g;
		const duplicatedUrls = indexContent.match(duplicatedPattern);

		if (duplicatedUrls) {
			console.log(`  ⚠️ Encontradas ${duplicatedUrls.length} URLs duplicadas`);
			duplicatedUrls.forEach((url, index) => {
				if (index < 3) {
					console.log(`    ${url.substring(0, 80)}...`);
				}
			});

			// Corrigir duplicações: manter apenas a primeira parte da URL
			indexContent = indexContent.replace(duplicatedPattern, (match) => {
				// Pegar apenas a primeira URL válida
				const firstHttps = match.indexOf('https://');
				const secondHttps = match.indexOf('https://', firstHttps + 1);

				if (secondHttps > -1) {
					// Pegar a primeira URL + a parte após a segunda
					const firstPart = match.substring(0, secondHttps);
					const secondPart = match.substring(secondHttps);

					// Extrair apenas o path da segunda URL
					const pathMatch = secondPart.match(/https:\/\/[^\/]+(.*)$/);
					if (pathMatch) {
						return firstPart + pathMatch[1];
					}
				}

				return match;
			});

			totalChanges += duplicatedUrls.length;
			console.log(`  ✅ URLs duplicadas corrigidas`);
		}

		// Padrão 2: Substituir URLs relativos que não foram convertidos
		const relativePatterns = [
			{
				pattern: /href="\.\/([^"]+)"/g,
				replacement: `href="${BASE_URL}/$1"`,
				name: 'CSS/JS relativos (href)'
			},
			{
				pattern: /src="\.\/([^"]+)"/g,
				replacement: `src="${BASE_URL}/$1"`,
				name: 'Scripts relativos (src)'
			},
			{
				pattern: /href="\/(?!http)([^"]+)"/g,
				replacement: `href="${BASE_URL}/$1"`,
				name: 'Assets absolutos (href)'
			},
			{
				pattern: /src="\/(?!http)([^"]+)"/g,
				replacement: `src="${BASE_URL}/$1"`,
				name: 'Sources absolutos (src)'
			},
			// ✅ NOVO: URLs em import() dentro de JavaScript inline
			{
				pattern: /import\("\.\/([^"]+)"\)/g,
				replacement: `import("${BASE_URL}/$1")`,
				name: 'Import statements inline'
			},
			{
				pattern: /import\('\.\/([^']+)'\)/g,
				replacement: `import('${BASE_URL}/$1')`,
				name: 'Import statements inline (single quotes)'
			},
			// ✅ NOVO: URLs em import() que começam com /
			{
				pattern: /import\("\/(?!http)([^"]+)"\)/g,
				replacement: `import("${BASE_URL}/$1")`,
				name: 'Import absolutos'
			},
			{
				pattern: /import\('\/(?!http)([^']+)'\)/g,
				replacement: `import('${BASE_URL}/$1')`,
				name: 'Import absolutos (single quotes)'
			}
		];

		relativePatterns.forEach(({ pattern, replacement, name }) => {
			const matches = indexContent.match(pattern);
			if (matches) {
				console.log(`  📝 ${name}: ${matches.length} correções`);
				indexContent = indexContent.replace(pattern, replacement);
				totalChanges += matches.length;
			}
		});

		// Padrão 3: Verificar se há URLs de projetos antigos
		const oldUrls = [
			'https://s3.glbimg.com/v1/AUTH_e03f7a1106bb438e970511f892f07c35/g1/dias-perfeitos',
			'https://s3.glbimg.com/v1/AUTH_9897f8564b5c46c9b6e85bda5912fe3b'
		];

		oldUrls.forEach((oldUrl) => {
			if (oldUrl !== BASE_URL && indexContent.includes(oldUrl)) {
				console.log(`  🔄 Substituindo URL antiga: ${oldUrl}`);
				const count = (
					indexContent.match(new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []
				).length;
				indexContent = indexContent.replaceAll(oldUrl, BASE_URL);
				totalChanges += count;
			}
		});

		// Salvar arquivo corrigido
		await fs.writeFile(indexPath, indexContent);
		console.log(`✅ index.html corrigido (${totalChanges} alterações)`);

		// 2. Processar arquivos JavaScript
		console.log('\n🔍 Processando arquivos JavaScript...');
		const jsFiles = await findJSFiles(buildDir);

		if (jsFiles.length > 0) {
			for (const jsFile of jsFiles) {
				await fixJSFile(jsFile, BASE_URL);
			}
		} else {
			console.log('ℹ️  Nenhum arquivo JS encontrado');
		}

		// 3. Relatório final
		console.log('\n' + '='.repeat(80));
		console.log('🎯 CORREÇÃO CONCLUÍDA:');
		console.log('='.repeat(80));
		console.log(`📁 Projeto: ${PROJECT_CONFIG.projectName}`);
		console.log(`🌐 URL Base: ${BASE_URL}`);
		console.log(`🔧 Total de correções: ${totalChanges}`);
		console.log(`📄 Arquivos JS processados: ${jsFiles.length}`);
		console.log('');
		console.log('✅ Build corrigido e pronto para deploy!');
		console.log(`🔗 URL para testar: ${BASE_URL}/index.html`);
		console.log('='.repeat(80));
	} catch (error) {
		console.error('❌ Erro durante a correção:', error.message);
		console.error(error.stack);
		process.exit(1);
	}
}

async function findJSFiles(dir) {
	const files = [];

	async function scan(currentDir) {
		try {
			const items = await fs.readdir(currentDir, { withFileTypes: true });

			for (const item of items) {
				const fullPath = path.join(currentDir, item.name);

				if (item.isDirectory() && !item.name.startsWith('.')) {
					await scan(fullPath);
				} else if (item.name.endsWith('.js') || item.name.endsWith('.mjs')) {
					files.push(fullPath);
				}
			}
		} catch (error) {
			// Ignorar erros de diretório
		}
	}

	await scan(dir);
	return files;
}

async function fixJSFile(filePath, baseUrl) {
	try {
		let content = await fs.readFile(filePath, 'utf8');
		const originalContent = content;

		// Corrigir URLs duplicadas em JS
		const duplicatedPattern = /https:\/\/[^"']*https:\/\/[^"']*/g;
		if (duplicatedPattern.test(content)) {
			content = content.replace(duplicatedPattern, (match) => {
				const firstHttps = match.indexOf('https://');
				const secondHttps = match.indexOf('https://', firstHttps + 1);

				if (secondHttps > -1) {
					const firstPart = match.substring(0, secondHttps);
					const secondPart = match.substring(secondHttps);

					const pathMatch = secondPart.match(/https:\/\/[^\/]+(.*)$/);
					if (pathMatch) {
						return firstPart + pathMatch[1];
					}
				}

				return match;
			});
		}

		// Padrões específicos para JavaScript
		const jsPatterns = [
			{
				pattern: /fetch\s*\(\s*["']\/(?!http)([^"']+)["']\s*\)/g,
				replacement: `fetch("${baseUrl}/$1")`
			},
			{
				pattern: /import\s*\(\s*["']\.\/([^"']+)["']\s*\)/g,
				replacement: `import("${baseUrl}/$1")`
			}
		];

		jsPatterns.forEach(({ pattern, replacement }) => {
			content = content.replace(pattern, replacement);
		});

		if (content !== originalContent) {
			await fs.writeFile(filePath, content);
			console.log(`  ✅ ${path.basename(filePath)} corrigido`);
		}
	} catch (error) {
		console.log(`  ⚠️ Erro ao processar ${path.basename(filePath)}: ${error.message}`);
	}
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
	fixAbsoluteUrls();
}

export default fixAbsoluteUrls;
