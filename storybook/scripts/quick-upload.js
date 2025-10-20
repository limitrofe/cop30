// scripts/quick-upload.js - Upload Rápido para Vault
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

/**
 * Script simples para upload para Vault Globo
 */

export class QuickVaultUploader {
	constructor(projectName) {
		this.projectName = projectName || `projeto-${Date.now()}`;
		this.authToken = null;

		// Suas credenciais
		this.credentials = {
			username: 'u_especiais_svelte',
			password: 'cCb#9rFS8IBu',
			authUrl: 'https://auth.s3.globoi.com:5000/v3',
			projectAuth: 'especiais_svelte' // ✅ Nome correto descoberto!
		};

		this.storageUrl = 'https://api.s3.globoi.com/v1/AUTH_9897f8564b5c46c9b6e85bda5912fe3b';
		this.publicUrl = 'https://s3.glbimg.com/v1/AUTH_9897f8564b5c46c9b6e85bda5912fe3b';
	}

	async authenticate() {
		console.log('🔐 Autenticando com Vault...');
		console.log(`👤 Usuário: ${this.credentials.username}`);
		console.log(`🌐 URL: ${this.credentials.authUrl}`);
		console.log(`📁 Projeto: ${this.credentials.projectAuth}`);

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
			console.log('📤 Enviando requisição de autenticação...');

			const response = await fetch(`${this.credentials.authUrl}/auth/tokens`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'User-Agent': 'NewsroomSystem/1.0'
				},
				body: JSON.stringify(authPayload)
			});

			console.log(`📥 Resposta: ${response.status} ${response.statusText}`);

			if (!response.ok) {
				// Tentar ler o corpo da resposta para mais detalhes
				const errorText = await response.text();
				console.log('❌ Detalhes do erro:', errorText);

				// Tentar diferentes variações do nome do projeto
				if (response.status === 401) {
					console.log('\n🔄 Tentando variações do nome do projeto...');

					const projectVariations = [
						'especiais_svelte',
						'Especiais_svelte',
						'especiais-svelte',
						'Projeto_especiais_svelte'
					];

					for (const projectName of projectVariations) {
						console.log(`🔄 Tentando projeto: ${projectName}`);

						const newPayload = {
							...authPayload,
							auth: {
								...authPayload.auth,
								scope: {
									project: {
										name: projectName,
										domain: { name: 'default' }
									}
								}
							}
						};

						const retryResponse = await fetch(`${this.credentials.authUrl}/auth/tokens`, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								'User-Agent': 'NewsroomSystem/1.0'
							},
							body: JSON.stringify(newPayload)
						});

						console.log(`   └─ ${retryResponse.status} ${retryResponse.statusText}`);

						if (retryResponse.ok) {
							this.authToken = retryResponse.headers.get('x-subject-token');
							this.credentials.projectAuth = projectName; // Salvar o que funcionou
							console.log(`✅ Autenticado com projeto: ${projectName}`);
							return;
						}
					}
				}

				throw new Error(`Erro de autenticação: ${response.status} - ${errorText}`);
			}

			this.authToken = response.headers.get('x-subject-token');
			console.log('✅ Autenticado com sucesso!');
		} catch (error) {
			if (error.code === 'ENOTFOUND') {
				throw new Error(`Erro de rede: Não foi possível conectar com ${this.credentials.authUrl}`);
			}
			throw new Error(`Falha na autenticação: ${error.message}`);
		}
	}

	async uploadFile(localPath, remotePath) {
		if (!this.authToken) {
			await this.authenticate();
		}

		const fileBuffer = await fs.readFile(localPath);
		const fileStats = await fs.stat(localPath);

		// Path completo: g1/projeto/arquivo
		const fullPath = `g1/${this.projectName}/${remotePath}`;
		const url = `${this.storageUrl}/${fullPath}`;

		console.log(`📤 Subindo: ${fullPath} (${this.formatSize(fileStats.size)})`);

		try {
			const response = await fetch(url, {
				method: 'PUT',
				headers: {
					'X-Auth-Token': this.authToken,
					'Content-Type': this.getContentType(localPath),
					'X-Object-Meta-Project': this.projectName,
					'X-Object-Meta-Uploaded-At': new Date().toISOString()
				},
				body: fileBuffer
			});

			if (response.ok || response.status === 201) {
				const publicUrl = `${this.publicUrl}/${fullPath}`;
				const vaultUrl = `https://vault.globoi.com/p/especiais_svelte/storage/objects/${fullPath}`;

				console.log(`✅ Upload concluído!`);
				console.log(`🔗 URL Pública: ${publicUrl}`);
				console.log(`🎛️ Vault: ${vaultUrl}`);

				return { publicUrl, vaultUrl };
			} else {
				throw new Error(`Upload falhou: ${response.status}`);
			}
		} catch (error) {
			console.error(`❌ Erro no upload: ${error.message}`);
			throw error;
		}
	}

	async uploadDirectory(localDir, remotePrefix = '') {
		const files = await this.getAllFiles(localDir);
		console.log(`📁 Subindo ${files.length} arquivos...`);

		const results = [];

		for (const file of files) {
			try {
				const relativePath = path.relative(localDir, file);
				const remotePath = remotePrefix ? `${remotePrefix}/${relativePath}` : relativePath;
				const cleanRemotePath = remotePath.replace(/\\/g, '/');

				const result = await this.uploadFile(file, cleanRemotePath);
				results.push({ file, remotePath: cleanRemotePath, ...result });
			} catch (error) {
				console.error(`❌ Falha: ${file}`);
				results.push({ file, error: error.message });
			}
		}

		const successful = results.filter((r) => !r.error);
		console.log(`\n🎉 Upload concluído: ${successful.length}/${files.length} arquivos`);
		console.log(
			`🎛️ Ver no Vault: https://vault.globoi.com/p/especiais_svelte/storage/objects/g1/${this.projectName}/`
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
		const types = {
			'.jpg': 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.png': 'image/png',
			'.webp': 'image/webp',
			'.gif': 'image/gif',
			'.mp4': 'video/mp4',
			'.json': 'application/json',
			'.js': 'application/javascript',
			'.css': 'text/css',
			'.html': 'text/html'
		};
		return types[ext] || 'application/octet-stream';
	}

	formatSize(bytes) {
		const sizes = ['B', 'KB', 'MB', 'GB'];
		if (bytes === 0) return '0 B';
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
	}
}

// CLI
async function main() {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.log(`
🚀 Quick Upload para Vault Globo

Uso:
  node quick-upload.js <arquivo> <destino> [projeto]
  node quick-upload.js --dir <pasta> [prefixo] [projeto]

Exemplos:
  node quick-upload.js image.jpg assets/hero.jpg meu-projeto
  node quick-upload.js --dir ./build/ site/ minha-reportagem
  node quick-upload.js video.mp4 videos/intro.mp4
    `);
		process.exit(1);
	}

	try {
		if (args[0] === '--dir') {
			// Upload de pasta
			const localDir = args[1];
			const remotePrefix = args[2] || '';
			const projectName = args[3] || undefined;

			const uploader = new QuickVaultUploader(projectName);
			await uploader.uploadDirectory(localDir, remotePrefix);
		} else {
			// Upload de arquivo único
			const localPath = args[0];
			const remotePath = args[1];
			const projectName = args[2] || undefined;

			if (!remotePath) {
				throw new Error('Especifique o caminho de destino');
			}

			const uploader = new QuickVaultUploader(projectName);
			await uploader.uploadFile(localPath, remotePath);
		}
	} catch (error) {
		console.error('❌ Erro:', error.message);
		process.exit(1);
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
