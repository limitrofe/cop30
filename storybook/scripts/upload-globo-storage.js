// scripts/upload-globo-storage.js
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import FormData from 'form-data';

/**
 * Sistema de upload para Globo Swift Object Storage - G1 Structure
 */
class GloboStorageUploader {
	constructor(projectName = null) {
		this.authToken = null;
		this.tokenExpiry = null;
		this.storageUrl = null;
		this.publicBaseUrl = 'https://s3.glbimg.com/v1/AUTH_9897f8564b5c46c9b6e85bda5912fe3b';
		this.adminUrl = 'https://api.s3.globoi.com/v1/AUTH_9897f8564b5c46c9b6e85bda5912fe3b';

		// Configuração específica do G1
		this.g1Container = 'g1';
		this.projectName = projectName || this.generateProjectName();

		// Credenciais
		this.credentials = {
			username: 'u_especiais_svelte',
			password: 'cCb#9rFS8IBu',
			authUrl: 'https://auth.s3.globoi.com:5000/v3',
			projectAuth: 'Projeto_especiais_svelte'
		};

		console.log(`📁 Projeto configurado: ${this.projectName}`);
	}

	generateProjectName() {
		const now = new Date();
		const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
		const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
		return `newsroom-${dateStr}-${timeStr}`;
	}

	async initialize() {
		console.log('🔐 Autenticando com Globo Object Storage (G1)...');
		await this.authenticate();
		await this.setupG1Project();
		console.log('✅ Autenticação e setup do projeto G1 concluídos');
	}

	async authenticate() {
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
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(authPayload)
			});

			if (!response.ok) {
				throw new Error(`Erro de autenticação: ${response.status} ${response.statusText}`);
			}

			this.authToken = response.headers.get('x-subject-token');
			const authData = await response.json();

			const catalog = authData.token.catalog;
			const objectStore = catalog.find((service) => service.type === 'object-store');

			if (objectStore) {
				const endpoint = objectStore.endpoints.find((ep) => ep.interface === 'public');
				this.storageUrl = endpoint.url;
			} else {
				this.storageUrl = this.adminUrl;
			}

			this.tokenExpiry = new Date(authData.token.expires_at);

			console.log(`✅ Token obtido para projeto: ${this.projectName}`);
		} catch (error) {
			throw new Error(`Falha na autenticação: ${error.message}`);
		}
	}

	async setupG1Project() {
		console.log(`📁 Configurando estrutura do projeto G1: ${this.projectName}`);

		// 1. Garantir que container g1 existe
		await this.ensureContainerExists(this.g1Container);

		// 2. Criar estrutura de pastas para o projeto
		const projectFolders = [
			`${this.projectName}/`,
			`${this.projectName}/frames/`,
			`${this.projectName}/frames/desktop/`,
			`${this.projectName}/frames/mobile/`,
			`${this.projectName}/assets/`,
			`${this.projectName}/config/`
		];

		for (const folder of projectFolders) {
			await this.createFolder(this.g1Container, folder);
		}

		// 3. Criar arquivo de manifesto do projeto
		const manifest = {
			projectName: this.projectName,
			createdAt: new Date().toISOString(),
			type: 'newsroom-storytelling',
			structure: {
				frames: `g1/${this.projectName}/frames/`,
				assets: `g1/${this.projectName}/assets/`,
				config: `g1/${this.projectName}/config/`
			},
			publicUrls: {
				base: `${this.publicBaseUrl}/g1/${this.projectName}/`,
				frames: `${this.publicBaseUrl}/g1/${this.projectName}/frames/`,
				assets: `${this.publicBaseUrl}/g1/${this.projectName}/assets/`
			}
		};

		await this.uploadContent(
			JSON.stringify(manifest, null, 2),
			`${this.projectName}/config/manifest.json`,
			this.g1Container,
			'application/json'
		);

		console.log(
			`✅ Estrutura do projeto G1 criada: https://vault.globoi.com/p/especiais_svelte/storage/objects/g1/${this.projectName}/`
		);
	}

	async ensureContainerExists(containerName) {
		const url = `${this.storageUrl}/${containerName}`;

		try {
			// Primeiro, tentar acessar o container
			const checkResponse = await fetch(url, {
				method: 'HEAD',
				headers: {
					'X-Auth-Token': this.authToken
				}
			});

			if (checkResponse.ok) {
				console.log(`✅ Container '${containerName}' já existe`);
				return true;
			}

			// Se não existir, criar
			const createResponse = await fetch(url, {
				method: 'PUT',
				headers: {
					'X-Auth-Token': this.authToken,
					'X-Container-Read': '.r:*',
					'X-Container-Meta-Access-Control-Allow-Origin': '*',
					'X-Container-Meta-Description': 'G1 Newsroom Storytelling Projects'
				}
			});

			if (createResponse.ok || createResponse.status === 202) {
				console.log(`✅ Container '${containerName}' criado`);
				return true;
			} else {
				console.warn(`⚠️ Aviso ao criar container: ${createResponse.status}`);
				return false;
			}
		} catch (error) {
			console.error(`❌ Erro com container ${containerName}:`, error.message);
			throw error;
		}
	}

	async createFolder(containerName, folderPath) {
		// No Swift, pastas são criadas implicitamente ou com arquivo .keep
		const keepFilePath = folderPath.endsWith('/') ? `${folderPath}.keep` : `${folderPath}/.keep`;

		try {
			await this.uploadContent(
				`# Pasta criada automaticamente em ${new Date().toISOString()}`,
				keepFilePath,
				containerName,
				'text/plain'
			);

			console.log(`📁 Pasta criada: g1/${folderPath}`);
		} catch (error) {
			console.warn(`⚠️ Aviso ao criar pasta ${folderPath}:`, error.message);
		}
	}

	async uploadContent(content, objectPath, containerName, contentType = 'text/plain') {
		await this.ensureAuthenticated();

		const url = `${this.storageUrl}/${containerName}/${objectPath}`;

		try {
			const response = await fetch(url, {
				method: 'PUT',
				headers: {
					'X-Auth-Token': this.authToken,
					'Content-Type': contentType,
					'X-Object-Meta-Uploaded-By': 'newsroom-storytelling',
					'X-Object-Meta-Uploaded-At': new Date().toISOString(),
					'X-Object-Meta-Project': this.projectName
				},
				body: content
			});

			if (response.ok || response.status === 201) {
				return { url: this.getG1PublicUrl(objectPath), etag: response.headers.get('etag') };
			} else {
				throw new Error(`Upload falhou: ${response.status} ${response.statusText}`);
			}
		} catch (error) {
			console.error(`❌ Erro no upload de conteúdo:`, error.message);
			throw error;
		}
	}

	async uploadFile(localPath, objectPath, containerName = this.g1Container) {
		await this.ensureAuthenticated();

		const fileBuffer = await fs.readFile(localPath);
		const fileStats = await fs.stat(localPath);

		// Automaticamente colocar dentro da pasta do projeto
		const fullObjectPath = `${this.projectName}/${objectPath}`;
		const url = `${this.storageUrl}/${containerName}/${fullObjectPath}`;

		try {
			console.log(`📤 Uploading: g1/${fullObjectPath} (${this.formatFileSize(fileStats.size)})`);

			const response = await fetch(url, {
				method: 'PUT',
				headers: {
					'X-Auth-Token': this.authToken,
					'Content-Type': this.getContentType(localPath),
					'Content-Length': fileStats.size.toString(),
					'X-Object-Meta-Uploaded-By': 'newsroom-storytelling',
					'X-Object-Meta-Uploaded-At': new Date().toISOString(),
					'X-Object-Meta-Project': this.projectName
				},
				body: fileBuffer
			});

			if (response.ok || response.status === 201) {
				const publicUrl = this.getG1PublicUrl(fullObjectPath);
				console.log(`✅ Upload concluído: ${publicUrl}`);
				return { url: publicUrl, etag: response.headers.get('etag') };
			} else {
				throw new Error(`Upload falhou: ${response.status} ${response.statusText}`);
			}
		} catch (error) {
			console.error(`❌ Erro no upload de ${fullObjectPath}:`, error.message);
			throw error;
		}
	}

	getG1PublicUrl(objectPath) {
		return `${this.publicBaseUrl}/g1/${objectPath}`;
	}

	getVaultUrl(objectPath) {
		return `https://vault.globoi.com/p/especiais_svelte/storage/objects/g1/${objectPath}`;
	}

	async ensureAuthenticated() {
		const now = new Date();

		if (
			!this.authToken ||
			!this.tokenExpiry ||
			this.tokenExpiry.getTime() - now.getTime() < 3600000
		) {
			console.log('🔄 Renovando token de autenticação...');
			await this.authenticate();
		}
	}

	async uploadDirectory(localDir, objectPrefix, containerName = this.g1Container) {
		const files = await this.getAllFiles(localDir);
		console.log(
			`📁 Uploading ${files.length} arquivos de ${localDir} para g1/${this.projectName}/${objectPrefix}`
		);

		const results = [];
		const batchSize = 5;

		for (let i = 0; i < files.length; i += batchSize) {
			const batch = files.slice(i, i + batchSize);

			const batchPromises = batch.map(async (file) => {
				const relativePath = path.relative(localDir, file);
				const objectPath = path.join(objectPrefix, relativePath).replace(/\\/g, '/');

				try {
					const result = await this.uploadFile(file, objectPath, containerName);
					return { file, objectPath, ...result };
				} catch (error) {
					console.error(`❌ Falha no upload de ${file}:`, error.message);
					return { file, objectPath, error: error.message };
				}
			});

			const batchResults = await Promise.all(batchPromises);
			results.push(...batchResults);

			console.log(
				`📊 Progresso: ${Math.min(i + batchSize, files.length)}/${files.length} arquivos`
			);
		}

		const successful = results.filter((r) => !r.error);
		const failed = results.filter((r) => r.error);

		console.log(`✅ Upload concluído: ${successful.length} sucessos, ${failed.length} falhas`);
		console.log(
			`🔗 Acesse em: https://vault.globoi.com/p/especiais_svelte/storage/objects/g1/${this.projectName}/`
		);

		return results;
	}

	async getAllFiles(dir) {
		const files = [];
		const items = await fs.readdir(dir, { withFileTypes: true });

		for (const item of items) {
			const fullPath = path.join(dir, item.name);

			if (item.isDirectory()) {
				files.push(...(await this.getAllFiles(fullPath)));
			} else {
				files.push(fullPath);
			}
		}

		return files;
	}

	getContentType(filePath) {
		const ext = path.extname(filePath).toLowerCase();

		const contentTypes = {
			'.jpg': 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.png': 'image/png',
			'.webp': 'image/webp',
			'.gif': 'image/gif',
			'.mp4': 'video/mp4',
			'.webm': 'video/webm',
			'.json': 'application/json',
			'.js': 'application/javascript',
			'.css': 'text/css',
			'.html': 'text/html'
		};

		return contentTypes[ext] || 'application/octet-stream';
	}

	formatFileSize(bytes) {
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		if (bytes === 0) return '0 Bytes';

		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
	}
}
// Função específica para upload de frames do G1
export async function uploadFramesToG1Storage(framesDir, videoName, projectName = null) {
	const uploader = new GloboStorageUploader(projectName);
	await uploader.initialize();

	const objectPrefix = `frames/${videoName}`;

	console.log(`🎬 Fazendo upload de frames para G1: ${videoName}`);
	console.log(`📁 Projeto: ${uploader.projectName}`);

	// Upload de todos os frames
	const results = await uploader.uploadDirectory(framesDir, objectPrefix);

	// Gerar URLs para uso no Google Docs
	const desktopFrames = results.filter((r) => r.objectPath.includes('/desktop/') && !r.error);
	const mobileFrames = results.filter((r) => r.objectPath.includes('/mobile/') && !r.error);

	const config = {
		projectName: uploader.projectName,
		baseUrl: uploader.getG1PublicUrl(`${uploader.projectName}/${objectPrefix}`),
		vaultUrl: uploader.getVaultUrl(`${uploader.projectName}/${objectPrefix}`),
		desktop: {
			baseUrl: uploader.getG1PublicUrl(`${uploader.projectName}/${objectPrefix}/desktop`),
			pattern: `${uploader.publicBaseUrl}/g1/${uploader.projectName}/${objectPrefix}/desktop/${videoName}_desktop_frame_`,
			total: desktopFrames.length
		},
		mobile: {
			baseUrl: uploader.getG1PublicUrl(`${uploader.projectName}/${objectPrefix}/mobile`),
			pattern: `${uploader.publicBaseUrl}/g1/${uploader.projectName}/${objectPrefix}/mobile/${videoName}_mobile_frame_`,
			total: mobileFrames.length
		}
	};

	console.log('📋 Configuração para Google Docs:');
	console.log(`imagePrefix: ${config.desktop.pattern}`);
	console.log(`imagePrefixMobile: ${config.mobile.pattern}`);
	console.log(`totalFrames: ${config.desktop.total}`);
	console.log(`🔗 Vault URL: ${config.vaultUrl}`);

	return config;
}

// CLI para uso manual
async function main() {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.log(`
🌐 Globo Object Storage Uploader - G1 Structure

Uso:
  node upload-globo-storage.js <arquivo> <caminho-objeto> [projeto]          # Upload único
  node upload-globo-storage.js --frames <dir> <nome-video> [projeto]        # Upload de frames
  node upload-globo-storage.js --new-project <nome-projeto>                 # Criar novo projeto
  node upload-globo-storage.js --list [projeto] [prefixo]                   # Listar objetos

Exemplos:
  node upload-globo-storage.js image.jpg assets/images/image.jpg
  node upload-globo-storage.js --frames ./generated-frames/intro intro
  node upload-globo-storage.js --frames ./generated-frames/intro intro meu-projeto-especial
  node upload-globo-storage.js --new-project reportagem-eleicoes-2024
  node upload-globo-storage.js --list meu-projeto frames/
    `);
		process.exit(1);
	}

	try {
		if (args[0] === '--frames') {
			const framesDir = args[1];
			const videoName = args[2];
			const projectName = args[3] || null;

			if (!framesDir || !videoName) {
				throw new Error('Especifique o diretório de frames e nome do vídeo');
			}

			const config = await uploadFramesToG1Storage(framesDir, videoName, projectName);

			// Salvar configuração em arquivo
			const configPath = `g1-video-config-${config.projectName}-${videoName}.json`;
			await fs.writeFile(configPath, JSON.stringify(config, null, 2));

			console.log(`🎉 Upload concluído! Configuração salva em: ${configPath}`);
		} else if (args[0] === '--new-project') {
			const projectName = args[1];

			if (!projectName) {
				throw new Error('Especifique o nome do projeto');
			}

			const uploader = new GloboStorageUploader(projectName);
			await uploader.initialize();

			console.log(`🎉 Projeto criado: ${projectName}`);
			console.log(
				`🔗 Acesse: https://vault.globoi.com/p/especiais_svelte/storage/objects/g1/${projectName}/`
			);
		} else if (args[0] === '--list') {
			const projectName = args[1];
			const prefix = args[2] || '';

			const uploader = new GloboStorageUploader(projectName);
			await uploader.initialize();

			const objects = await uploader.listObjects('g1', `${uploader.projectName}/${prefix}`);

			console.log(`📂 Objetos do projeto ${uploader.projectName} (prefixo: "${prefix}"):`);
			objects.forEach((obj) => {
				const relativePath = obj.name.replace(`${uploader.projectName}/`, '');
				console.log(`  ${relativePath} (${uploader.formatFileSize(obj.bytes)})`);
			});
		} else {
			// Upload de arquivo único
			const localPath = args[0];
			const objectPath = args[1];
			const projectName = args[2] || null;

			if (!localPath || !objectPath) {
				throw new Error('Especifique o arquivo local e caminho do objeto');
			}

			const uploader = new GloboStorageUploader(projectName);
			await uploader.initialize();

			const result = await uploader.uploadFile(localPath, objectPath);
			console.log('🎉 Upload concluído:', result.url);
			console.log('🔗 Vault:', uploader.getVaultUrl(`${uploader.projectName}/${objectPath}`));
		}
	} catch (error) {
		console.error('❌ Erro:', error.message);
		process.exit(1);
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export { GloboStorageUploader };
