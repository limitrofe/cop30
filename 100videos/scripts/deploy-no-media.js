// scripts/deploy-no-media.js - Deploy que pula imagens e vídeos
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DeployWithoutMedia {
	constructor(projectName) {
		this.projectName = projectName;
		this.buildDir = path.join(__dirname, '../build');

		// 🎯 CONFIGURAÇÕES EXATAS DO SEU PROJETO
		this.container = 'g1';
		this.baseUrl = 'https://s3.glbimg.com/v1/AUTH_9897f8564b5c46c9b6e85bda5912fe3b';
		this.adminUrl = 'https://api.s3.globoi.com/v1/AUTH_9897f8564b5c46c9b6e85bda5912fe3b';
		this.authToken = null;

		// 🎯 EXTENSÕES DE MÍDIA PARA PULAR
		this.mediaExtensions = [
			'.jpg',
			'.jpeg',
			'.png',
			'.gif',
			'.webp',
			'.svg',
			'.ico', // Imagens
			'.mp4',
			'.webm',
			'.mov',
			'.avi',
			'.mkv', // Vídeos
			'.mp3',
			'.wav',
			'.ogg',
			'.m4a', // Áudios
			'.pdf',
			'.zip',
			'.rar',
			'.tar',
			'.gz' // Outros binários
		];

		// 📁 PASTAS DE MÍDIA PARA PULAR
		this.mediaPaths = [
			'/img/',
			'/images/',
			'/videos/',
			'/media/',
			'/assets/img/',
			'/assets/images/',
			'/assets/videos/',
			'/static/img/',
			'/static/images/',
			'/static/videos/',
			'/frames/',
			'_app/immutable/assets/' // Pular só assets grandes do SvelteKit
		];

		this.stats = {
			total: 0,
			skipped: 0,
			uploaded: 0,
			failed: 0,
			skippedSize: 0,
			uploadedSize: 0
		};
	}

	async deploy() {
		console.log('\n🚀 DEPLOY SEM MÍDIAS - PULA IMAGENS E VÍDEOS');
		console.log('='.repeat(70));
		console.log(`📁 Projeto: ${this.projectName}`);

		try {
			// 1. Verificar se build existe
			await this.checkBuild();

			// 2. Autenticar
			await this.authenticate();

			// 3. Criar container se não existir
			await this.createContainer();

			// 4. Escanear arquivos e filtrar mídias
			const allFiles = await this.getAllFiles(this.buildDir);
			const { codeFiles, mediaFiles } = this.filterFiles(allFiles);

			// 5. Mostrar resumo do que será feito
			this.showFilterSummary(codeFiles, mediaFiles);

			// 6. Upload apenas dos arquivos de código
			await this.uploadFiles(codeFiles);

			// 7. Mostrar resultado final
			this.showResults();
		} catch (error) {
			console.error('\n❌ Erro no deploy:', error.message);
			throw error;
		}
	}

	async checkBuild() {
		try {
			await fs.access(this.buildDir);
			const buildFiles = await fs.readdir(this.buildDir);
			if (buildFiles.length === 0) {
				throw new Error('Build directory is empty');
			}
			console.log('✅ Build encontrado');
		} catch (error) {
			throw new Error('❌ Build não encontrado. Execute "npm run build" primeiro!');
		}
	}

	async authenticate() {
		console.log('🔑 Autenticando no Vault...');

		// 🎯 CONFIGURAÇÕES EXATAS DO SEU PROJETO
		const authPayload = {
			auth: {
				identity: {
					methods: ['password'],
					password: {
						user: {
							name: 'u_especiais_svelte',
							domain: { name: 'default' },
							password: 'cCb#9rFS8IBu'
						}
					}
				},
				scope: {
					project: {
						name: 'Projeto_especiais_svelte',
						domain: { name: 'default' }
					}
				}
			}
		};

		try {
			const response = await fetch('https://auth.s3.globoi.com:5000/v3/auth/tokens', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(authPayload)
			});

			if (!response.ok) {
				throw new Error(`Erro de autenticação: ${response.status}`);
			}

			this.authToken = response.headers.get('x-subject-token');
			console.log('✅ Autenticado com sucesso');
		} catch (error) {
			throw new Error(`Falha na autenticação: ${error.message}`);
		}
	}

	async createContainer() {
		const url = `${this.adminUrl}/${this.container}`;

		try {
			const response = await fetch(url, {
				method: 'PUT',
				headers: {
					'X-Auth-Token': this.authToken,
					'X-Container-Read': '.r:*'
				}
			});

			if (response.ok || response.status === 202) {
				console.log('📦 Container verificado');
			}
		} catch (error) {
			console.warn('⚠️ Aviso ao verificar container:', error.message);
		}
	}

	filterFiles(allFiles) {
		const codeFiles = [];
		const mediaFiles = [];

		for (const file of allFiles) {
			const relativePath = file.relativePath.replace(/\\/g, '/');
			const isMedia = this.isMediaFile(relativePath);

			if (isMedia) {
				mediaFiles.push(file);
			} else {
				codeFiles.push(file);
			}
		}

		return { codeFiles, mediaFiles };
	}

	isMediaFile(filePath) {
		const lowerPath = filePath.toLowerCase();

		// 1. Verificar extensão
		const hasMediaExtension = this.mediaExtensions.some((ext) => lowerPath.endsWith(ext));

		// 2. Verificar se está em pasta de mídia
		const isInMediaPath = this.mediaPaths.some((mediaPath) =>
			lowerPath.includes(mediaPath.toLowerCase())
		);

		// 3. Verificar se é um arquivo muito grande (provável mídia)
		// Nota: isso requer stat do arquivo, implementaremos se necessário

		return hasMediaExtension || isInMediaPath;
	}

	async showFilterSummary(codeFiles, mediaFiles) {
		console.log('\n📊 ANÁLISE DE ARQUIVOS:');

		// Calcular tamanhos
		let codeSize = 0;
		let mediaSize = 0;

		for (const file of codeFiles) {
			try {
				const stats = await fs.stat(file.fullPath);
				codeSize += stats.size;
			} catch (e) {}
		}

		for (const file of mediaFiles) {
			try {
				const stats = await fs.stat(file.fullPath);
				mediaSize += stats.size;
			} catch (e) {}
		}

		console.log(`📤 SERÁ ENVIADO:`);
		console.log(`   📄 Código/Build: ${codeFiles.length} arquivos (${this.formatBytes(codeSize)})`);
		console.log(`   
   Exemplos: index.html, *.js, *.css, *.json`);

		console.log(`\n⏭️  SERÁ PULADO:`);
		console.log(`   🖼️  Mídias: ${mediaFiles.length} arquivos (${this.formatBytes(mediaSize)})`);
		console.log(`   📁 Extensões: ${this.mediaExtensions.join(', ')}`);
		console.log(`   📂 Pastas: ${this.mediaPaths.slice(0, 5).join(', ')}...`);

		console.log(`\n💾 ECONOMIA: ${this.formatBytes(mediaSize)} não serão transferidos!`);

		this.stats.total = codeFiles.length + mediaFiles.length;
		this.stats.skipped = mediaFiles.length;
		this.stats.skippedSize = mediaSize;

		if (codeFiles.length === 0) {
			throw new Error('❌ Nenhum arquivo de código encontrado para upload!');
		}

		// Mostrar alguns exemplos
		console.log('\n📝 Exemplos de arquivos que SERÃO enviados:');
		const examples = codeFiles.slice(0, 8);
		examples.forEach((file) => {
			console.log(`   📄 ${file.relativePath}`);
		});

		if (codeFiles.length > 8) {
			console.log(`   ... e mais ${codeFiles.length - 8} arquivos`);
		}
	}

	async uploadFiles(files) {
		console.log(`\n📤 Enviando ${files.length} arquivos...`);
		console.log('='.repeat(50));

		let uploaded = 0;
		let failed = 0;
		let uploadedSize = 0;

		// Upload em paralelo (batches de 5)
		const batchSize = 5;

		for (let i = 0; i < files.length; i += batchSize) {
			const batch = files.slice(i, i + batchSize);

			await Promise.all(
				batch.map(async (file) => {
					try {
						const size = await this.uploadFile(file);
						uploaded++;
						uploadedSize += size;

						// Barra de progresso simples
						const progress = Math.round((uploaded / files.length) * 100);
						process.stdout.write(
							`\r✅ ${uploaded}/${files.length} (${progress}%) - ${file.relativePath.substring(0, 50)}`
						);
					} catch (error) {
						failed++;
						console.log(`\n❌ Falha: ${file.relativePath} - ${error.message}`);
					}
				})
			);
		}

		console.log('\n'); // Nova linha após a barra de progresso

		this.stats.uploaded = uploaded;
		this.stats.failed = failed;
		this.stats.uploadedSize = uploadedSize;
	}

	async uploadFile(file) {
		const fileContent = await fs.readFile(file.fullPath);
		const remotePath = file.relativePath.replace(/\\/g, '/');
		const uploadUrl = `${this.adminUrl}/${this.container}/${this.projectName}/${remotePath}`;

		const response = await fetch(uploadUrl, {
			method: 'PUT',
			headers: {
				'X-Auth-Token': this.authToken,
				'Content-Type': this.getContentType(file.fullPath),
				'Content-Length': fileContent.length
			},
			body: fileContent
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		return fileContent.length;
	}

	getContentType(filePath) {
		const ext = path.extname(filePath).toLowerCase();
		const types = {
			'.html': 'text/html',
			'.js': 'application/javascript',
			'.css': 'text/css',
			'.json': 'application/json',
			'.txt': 'text/plain',
			'.xml': 'application/xml',
			'.woff': 'font/woff',
			'.woff2': 'font/woff2',
			'.ttf': 'font/ttf',
			'.eot': 'application/vnd.ms-fontobject'
		};
		return types[ext] || 'application/octet-stream';
	}

	async getAllFiles(dir, baseDir = dir) {
		const files = [];
		const items = await fs.readdir(dir, { withFileTypes: true });

		for (const item of items) {
			const fullPath = path.join(dir, item.name);
			if (item.isDirectory()) {
				files.push(...(await this.getAllFiles(fullPath, baseDir)));
			} else {
				const relativePath = path.relative(baseDir, fullPath);
				files.push({ fullPath, relativePath });
			}
		}

		return files;
	}

	formatBytes(bytes) {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	showResults() {
		console.log('\n🎉 DEPLOY CONCLUÍDO!');
		console.log('='.repeat(50));
		console.log(
			`📤 Enviados: ${this.stats.uploaded} arquivos (${this.formatBytes(this.stats.uploadedSize)})`
		);
		console.log(
			`⏭️  Pulados: ${this.stats.skipped} mídias (${this.formatBytes(this.stats.skippedSize)})`
		);

		if (this.stats.failed > 0) {
			console.log(`❌ Falharam: ${this.stats.failed} arquivos`);
		}

		const successRate = Math.round(
			(this.stats.uploaded / (this.stats.uploaded + this.stats.failed)) * 100
		);
		console.log(`📊 Taxa de sucesso: ${successRate}%`);

		console.log(`\n🌐 URL: ${this.baseUrl}/${this.container}/${this.projectName}/index.html`);
		console.log(
			`🎛️  Vault: https://vault.globoi.com/p/especiais_svelte/storage/objects/${this.container}/${this.projectName}/`
		);

		const timeSaved = Math.round(this.stats.skippedSize / (1024 * 1024)); // MB
		if (timeSaved > 10) {
			console.log(`\n⚡ Economia de tempo: ~${timeSaved}MB não transferidos!`);
		}
	}
}

// CLI
async function main() {
	const args = process.argv.slice(2);
	const projectName = args[0] || 'especial-eleicoes-2024';

	console.log('🚀 Deploy sem mídias - apenas código/build será enviado');
	console.log('💡 Imagens, vídeos e outros arquivos grandes serão pulados');

	const deployer = new DeployWithoutMedia(projectName);

	try {
		await deployer.deploy();
	} catch (error) {
		console.error('\n❌ Erro no deploy:', error.message);
		process.exit(1);
	}
}

// Executar
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main();
}

export default DeployWithoutMedia;
