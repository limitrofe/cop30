// scripts/smart-deploy.js - Deploy Inteligente para Vault (CORRIGIDO)
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
// import BaseUploader from './BaseUploader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Deploy inteligente que organiza os arquivos na estrutura correta
 */
class SmartDeploy {
	constructor(projectName) {
		this.projectName = projectName;
		this.uploader = null;
		this.buildDir = path.join(__dirname, '../build');
		// class MeuUploader extends BaseUploader {
		//   // Herda toda configuração central
		// }
	}

	// Inicializar o uploader de forma async
	async init() {
		// Importar a classe QuickVaultUploader do arquivo existente
		const module = await import('./quick-upload.js');
		// A classe está definida no arquivo mas não exportada, vamos acessá-la dinamicamente
		const QuickVaultUploader = module.default || module.QuickVaultUploader;

		if (!QuickVaultUploader) {
			throw new Error('QuickVaultUploader não encontrado no módulo quick-upload.js');
		}

		this.uploader = new QuickVaultUploader(this.projectName);
		return this;
	}

	// Analisar estrutura do build
	async analyzeBuild() {
		console.log('🔍 Analisando estrutura do build...');

		const buildExists = await fs
			.access(this.buildDir)
			.then(() => true)
			.catch(() => false);
		if (!buildExists) {
			throw new Error('❌ Pasta build/ não encontrada. Execute npm run build primeiro.');
		}

		const files = await this.scanDirectory(this.buildDir);
		console.log(`📁 Encontrados ${files.length} arquivos para deploy`);

		// Encontrar index.html principal
		const indexFiles = files.filter((f) => f.name === 'index.html');
		let mainIndex = null;

		if (indexFiles.length === 0) {
			throw new Error('❌ Nenhum index.html encontrado no build');
		} else if (indexFiles.length === 1) {
			mainIndex = indexFiles[0];
		} else {
			// Múltiplos index.html - escolher o mais adequado
			const prerenderedIndex = indexFiles.find((f) => f.relativePath.includes('prerendered'));
			mainIndex = prerenderedIndex || indexFiles[0];

			if (prerenderedIndex) {
				console.log('✅ Usando index.html do prerendered como principal');
			}
		}

		return {
			files,
			mainIndex,
			assets: files.filter((f) => f.name !== 'index.html'),
			structure: this.categorizeFiles(files)
		};
	}

	// Escanear diretório recursivamente
	async scanDirectory(dir, baseDir = dir) {
		const files = [];
		const entries = await fs.readdir(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);

			if (entry.isDirectory()) {
				const subFiles = await this.scanDirectory(fullPath, baseDir);
				files.push(...subFiles);
			} else {
				const relativePath = path.relative(baseDir, fullPath);
				const stats = await fs.stat(fullPath);

				files.push({
					name: entry.name,
					fullPath,
					relativePath,
					size: stats.size,
					ext: path.extname(entry.name).toLowerCase()
				});
			}
		}

		return files;
	}

	// Categorizar arquivos por tipo
	categorizeFiles(files) {
		const structure = {
			html: [],
			css: [],
			js: [],
			assets: [],
			media: []
		};

		files.forEach((file) => {
			if (file.ext === '.html') {
				structure.html.push(file);
			} else if (file.ext === '.css') {
				structure.css.push(file);
			} else if (file.ext === '.js') {
				structure.js.push(file);
			} else if (
				['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.mp4', '.webm'].includes(file.ext)
			) {
				structure.media.push(file);
			} else {
				structure.assets.push(file);
			}
		});

		return structure;
	}

	// Executar deploy
	async deploy() {
		const analysis = await this.analyzeBuild();

		console.log('\n🚀 Iniciando deploy...');
		console.log(`📄 Index principal: ${analysis.mainIndex.relativePath}`);
		console.log(
			`📊 Estrutura: ${analysis.structure.html.length} HTML, ${analysis.structure.css.length} CSS, ${analysis.structure.js.length} JS`
		);

		const uploads = [];

		// 1. Upload do index principal para a raiz
		if (analysis.mainIndex.relativePath !== 'index.html') {
			console.log('📤 Movendo index.html para raiz...');
			uploads.push({
				source: analysis.mainIndex.fullPath,
				target: 'index.html',
				priority: 1
			});
		} else {
			uploads.push({
				source: analysis.mainIndex.fullPath,
				target: 'index.html',
				priority: 1
			});
		}

		// 2. Upload de todos os outros arquivos mantendo estrutura
		analysis.assets.forEach((file) => {
			uploads.push({
				source: file.fullPath,
				target: file.relativePath,
				priority: 2
			});
		});

		// Ordenar por prioridade
		uploads.sort((a, b) => a.priority - b.priority);

		// Executar uploads em batches
		const batchSize = 5;
		let uploaded = 0;

		for (let i = 0; i < uploads.length; i += batchSize) {
			const batch = uploads.slice(i, i + batchSize);

			await Promise.all(
				batch.map(async (upload) => {
					try {
						await this.uploader.uploadFile(upload.source, upload.target);
						uploaded++;
						console.log(`✅ ${uploaded}/${uploads.length} - ${upload.target}`);
					} catch (error) {
						console.error(`❌ Erro no upload de ${upload.target}:`, error.message);
					}
				})
			);
		}

		console.log(`\n🎉 Deploy concluído! ${uploaded}/${uploads.length} arquivos enviados.`);
		console.log(`🌐 URL: ${this.baseUrl}/index.html`);

		return {
			success: uploaded === uploads.length,
			uploaded,
			total: uploads.length,
			url: `${this.baseUrl}/index.html`
		};
	}

	// Validar se o site está funcionando
	async validate() {
		console.log('\n🔍 Validando deploy...');
		const url = `${this.baseUrl}/index.html`;

		try {
			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const html = await response.text();

			// Verificações básicas
			const checks = {
				hasTitle: /<title[^>]*>.*<\/title>/i.test(html),
				hasBody: /<body[^>]*>.*<\/body>/is.test(html),
				hasAssets: /_app\/immutable/i.test(html),
				size: html.length
			};

			console.log('✅ Site acessível:', url);
			console.log(`📄 HTML válido: ${checks.hasTitle && checks.hasBody ? 'SIM' : 'NÃO'}`);
			console.log(`📦 Assets linkados: ${checks.hasAssets ? 'SIM' : 'NÃO'}`);
			console.log(`📊 Tamanho: ${(checks.size / 1024).toFixed(1)}KB`);

			if (!checks.hasAssets) {
				console.warn('⚠️  Assets não encontrados - pode haver problemas de carregamento');
			}

			return checks;
		} catch (error) {
			console.error('❌ Validação falhou:', error.message);
			return { error: error.message };
		}
	}
}

// Função principal
async function main() {
	const args = process.argv.slice(2);
	const projectName = args[0];

	if (!projectName) {
		console.error('❌ Uso: node scripts/smart-deploy.js <projeto> [--build] [--validate]');
		process.exit(1);
	}

	const shouldBuild = args.includes('--build');
	const shouldValidate = args.includes('--validate');

	try {
		// Build se solicitado
		if (shouldBuild) {
			console.log('🔨 Executando build...');
			execSync('npm run build', { stdio: 'inherit' });
			console.log('✅ Build concluído!\n');
		}

		// Criar e inicializar deployer
		const deployer = await new SmartDeploy(projectName).init();

		// Executar deploy
		const result = await deployer.deploy();

		// Validar se solicitado
		if (shouldValidate && result.success) {
			await deployer.validate();
		}

		console.log('\n🎯 Deploy finalizado!');
	} catch (error) {
		console.error('💥 Erro no deploy:', error.message);
		process.exit(1);
	}
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
