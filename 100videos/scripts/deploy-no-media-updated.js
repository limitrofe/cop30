// scripts/deploy-no-media-updated.js
// Deploy que pula imagens, vídeos e frames - USANDO CONFIGURAÇÃO CENTRAL

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import PROJECT_CONFIG from '../project.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DeployWithoutMedia {
	constructor(projectName) {
		// ✅ Usar configuração central
		this.config = PROJECT_CONFIG;
		this.projectName = projectName || this.config.projectName;
		this.buildDir = path.join(__dirname, '../build');

		// ✅ URLs e credenciais da configuração central
		this.baseUrl = this.config.cdn.baseUrl;
		this.adminUrl = this.config.cdn.baseUrl.replace(
			'https://s3.glbimg.com',
			'https://api.s3.globoi.com'
		);
		this.container = this.config.cdn.container;
		this.credentials = this.config.vault;

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
			'.gz', // Outros binários
			'.tiff',
			'.bmp',
			'.avif' // Imagens extras
		];

		// 📁 PASTAS DE MÍDIA PARA PULAR COMPLETAMENTE
		this.mediaPaths = [
			'/img/',
			'/images/',
			'/videos/',
			'/media/',
			'/frames/',
			'/static/img/',
			'/static/images/',
			'/static/videos/',
			'/video-frames/' // ✅ Frames do projeto
			// ❌ REMOVIDO: '_app/immutable/assets/', // CSS é importante!
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
		console.log('\n🚀 DEPLOY SEM MÍDIAS - APENAS CÓDIGO');
		console.log('='.repeat(70));
		console.log(`📁 Projeto: ${this.projectName}`);
		console.log(`🌐 URL Base: ${this.baseUrl}`);
		console.log('='.repeat(70));

		try {
			// 1. Verificar configuração
			if (!this.config.validate()) {
				throw new Error('Configuração do projeto inválida');
			}

			// 2. Verificar se build existe
			await this.checkBuild();

			// 3. Autenticar
			await this.authenticate();

			// 4. Criar container se não existir
			await this.createContainer();

			// 5. Escanear arquivos e filtrar mídias
			const allFiles = await this.getAllFiles(this.buildDir);
			const { codeFiles, mediaFiles } = this.filterFiles(allFiles);

			// 6. Mostrar resumo do que será feito
			this.showFilterSummary(codeFiles, mediaFiles);

			// 7. Upload apenas dos arquivos de código
			await this.uploadFiles(codeFiles);

			// 8. Mostrar resultado final
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
		console.log('🔑 Autenticando com credenciais do projeto...');

		const authPayload = {
			auth: {
				identity: {
					methods: ['password'],
					password: {
						user: {
							name: this.credentials.username,
							domain: { name: 'default' },
							password: this.credentials.password
						}
					}
				},
				scope: {
					project: {
						name: this.credentials.projectAuth,
						domain: { name: 'default' }
					}
				}
			}
		};

		try {
			const response = await fetch(`${this.credentials.authUrl}/auth/tokens`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(authPayload)
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Erro de autenticação: ${response.status} - ${errorText}`);
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
					'X-Container-Read': '.r:*',
					'X-Container-Write': `${this.credentials.username}`
				}
			});

			if (response.ok || response.status === 202) {
				console.log('📦 Container verificado');
			} else {
				console.log(`⚠️ Container status: ${response.status}`);
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
		const fileName = path.basename(lowerPath);

		// 1. CÓDIGO/CONFIGURAÇÃO sempre enviado (NUNCA pular)
		const codeExtensions = ['.css', '.js', '.mjs', '.json', '.html', '.txt', '.xml'];
		const fontExtensions = ['.woff', '.woff2', '.ttf', '.eot'];
		const isCodeFile = [...codeExtensions, ...fontExtensions].some((ext) =>
			lowerPath.endsWith(ext)
		);

		if (isCodeFile) {
			return false; // ✅ Código, JSON, CSS sempre enviado
		}

		// 2. Verificar extensão de mídia real
		const hasMediaExtension = this.mediaExtensions.some((ext) => lowerPath.endsWith(ext));

		// 3. Verificar se está em pasta de mídia (mas JSON sempre passa)
		const isInMediaPath = this.mediaPaths.some((mediaPath) =>
			lowerPath.includes(mediaPath.toLowerCase())
		);

		// ✅ Se for JSON, sempre enviar (mesmo em pasta de mídia)
		if (lowerPath.endsWith('.json')) {
			return false;
		}

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
		console.log(`   💡 Tipos: index.html, *.js, *.css, *.json, *.woff, etc.`);

		console.log(`\n⏭️ SERÁ PULADO:`);
		console.log(`   🖼️ Mídias: ${mediaFiles.length} arquivos (${this.formatBytes(mediaSize)})`);
		console.log(`   📁 Extensões: ${this.mediaExtensions.slice(0, 8).join(', ')}...`);
		console.log(`   📂 Pastas: /frames/, /img/, /videos/, etc.`);

		console.log(`\n💾 ECONOMIA: ${this.formatBytes(mediaSize)} não transferidos!`);

		this.stats.total = codeFiles.length + mediaFiles.length;
		this.stats.skipped = mediaFiles.length;
		this.stats.skippedSize = mediaSize;

		if (codeFiles.length === 0) {
			throw new Error('❌ Nenhum arquivo de código encontrado para upload!');
		}

		// Mostrar alguns exemplos
		console.log('\n📝 Arquivos que SERÃO enviados:');
		const examples = codeFiles.slice(0, 8);
		examples.forEach((file, index) => {
			console.log(`   ${index + 1}. ${file.relativePath}`);
		});

		if (codeFiles.length > 8) {
			console.log(`   ... e mais ${codeFiles.length - 8} arquivos`);
		}

		// Arquivos que serão pulados
		if (mediaFiles.length > 0) {
			console.log('\n🚫 Exemplos de arquivos que serão PULADOS:');
			const skippedExamples = mediaFiles.slice(0, 5);
			skippedExamples.forEach((file, index) => {
				console.log(`   ${index + 1}. ${file.relativePath}`);
			});
			if (mediaFiles.length > 5) {
				console.log(`   ... e mais ${mediaFiles.length - 5} mídias`);
			}
		}
	}

	async uploadFiles(files) {
		console.log(`\n📤 Enviando ${files.length} arquivos...`);
		console.log('='.repeat(50));

		let uploaded = 0;
		let failed = 0;
		let uploadedSize = 0;

		// Upload em paralelo (batches de 3 para evitar sobrecarga)
		const batchSize = 3;

		for (let i = 0; i < files.length; i += batchSize) {
			const batch = files.slice(i, i + batchSize);

			await Promise.all(
				batch.map(async (file) => {
					try {
						const size = await this.uploadFile(file);
						uploaded++;
						uploadedSize += size;

						// Barra de progresso
						const progress = Math.round((uploaded / files.length) * 100);
						process.stdout.write(
							`\r✅ ${uploaded}/${files.length} (${progress}%) - ${file.relativePath.substring(0, 40)}...`
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
			const errorText = await response.text();
			throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
		}

		return fileContent.length;
	}

	getContentType(filePath) {
		const ext = path.extname(filePath).toLowerCase();
		const types = {
			'.html': 'text/html; charset=utf-8',
			'.js': 'application/javascript; charset=utf-8',
			'.mjs': 'application/javascript; charset=utf-8',
			'.css': 'text/css; charset=utf-8',
			'.json': 'application/json; charset=utf-8',
			'.txt': 'text/plain; charset=utf-8',
			'.xml': 'application/xml; charset=utf-8',
			'.woff': 'font/woff',
			'.woff2': 'font/woff2',
			'.ttf': 'font/ttf',
			'.eot': 'application/vnd.ms-fontobject',
			'.ico': 'image/x-icon'
		};
		return types[ext] || 'application/octet-stream';
	}

	async getAllFiles(dir, baseDir = dir) {
		const files = [];

		try {
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
		} catch (error) {
			console.warn(`⚠️ Erro ao ler ${dir}: ${error.message}`);
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
		console.log('\n🎉 DEPLOY SEM MÍDIAS CONCLUÍDO!');
		console.log('='.repeat(50));
		console.log(
			`📤 Enviados: ${this.stats.uploaded} arquivos (${this.formatBytes(this.stats.uploadedSize)})`
		);
		console.log(
			`⏭️ Pulados: ${this.stats.skipped} mídias (${this.formatBytes(this.stats.skippedSize)})`
		);

		if (this.stats.failed > 0) {
			console.log(`❌ Falharam: ${this.stats.failed} arquivos`);
		}

		const successRate = Math.round(
			(this.stats.uploaded / (this.stats.uploaded + this.stats.failed)) * 100
		);
		console.log(`📊 Taxa de sucesso: ${successRate}%`);

		console.log(`\n🌐 URL: ${this.baseUrl}/${this.container}/${this.projectName}/index.html`);
		console.log(`🎛️ Vault: ${this.config.urls.vault}`);

		const timeSaved = Math.round(this.stats.skippedSize / (1024 * 1024)); // MB
		if (timeSaved > 10) {
			console.log(`\n⚡ Economia de tempo: ~${timeSaved}MB não transferidos!`);
		}

		console.log('\n💡 Dica: Mídias (frames, imagens, vídeos) devem ser enviadas separadamente');
	}
}

// CLI
async function main() {
	const args = process.argv.slice(2);
	const projectName = args[0] || PROJECT_CONFIG.projectName;

	console.log('🚀 Deploy sem mídias - apenas código/build será enviado');
	console.log('💡 Imagens, vídeos e frames serão pulados para deploy rápido');

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
