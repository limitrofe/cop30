#!/usr/bin/env node

// scripts/simple-deploy.js
// Deploy SIMPLES que USA A CONFIGURAÇÃO CENTRAL!

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import PROJECT_CONFIG from '../project.config.js'; // ← USA A CONFIG CENTRAL!

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

class SimpleDeploy {
	constructor(projectName) {
		// Pega TUDO da configuração central!
		this.config = PROJECT_CONFIG;
		this.projectName = projectName || this.config.projectName;
		this.buildDir = path.join(rootDir, 'build');

		// ✅ URLs CORRETAS do project.config.js
		this.baseUrl = this.config.cdn.baseUrl; // AUTH_e03f7a1106bb438e970511f892f07c35
		// CORREÇÃO: API usa globoi, não glbimg!
		this.adminUrl = this.config.cdn.baseUrl.replace(
			'https://s3.glbimg.com',
			'https://api.s3.globoi.com'
		);
		this.container = this.config.cdn.container;

		// ✅ CREDENCIAIS CORRETAS do project.config.js
		this.credentials = this.config.vault; // u_newsroom_project / newsroom_project

		this.authToken = null;

		console.log('\n🔧 CONFIGURAÇÃO DETECTADA:');
		console.log(`   CDN: ${this.baseUrl}`);
		console.log(`   Admin: ${this.adminUrl}`);
		console.log(`   Usuario: ${this.credentials.username}`);
		console.log(`   Projeto Auth: ${this.credentials.projectAuth}`);
		console.log(`   Container: ${this.container}`);
		console.log(`   Nome: ${this.projectName}`);
	}

	async authenticate() {
		console.log('\n🔐 Autenticando com credenciais do project.config.js...');

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
			console.log(`📤 POST ${this.credentials.authUrl}/auth/tokens`);
			console.log(`👤 Usuario: ${this.credentials.username}`);
			console.log(`📁 Projeto: ${this.credentials.projectAuth}`);

			const response = await fetch(`${this.credentials.authUrl}/auth/tokens`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'User-Agent': 'Newsroom-Deploy/1.0'
				},
				body: JSON.stringify(authPayload)
			});

			console.log(`📥 Resposta: ${response.status} ${response.statusText}`);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ Erro de autenticação:', errorText);
				throw new Error(`Autenticação falhou: ${response.status} - ${errorText.substring(0, 200)}`);
			}

			this.authToken = response.headers.get('x-subject-token');
			console.log('✅ Autenticado com sucesso!');
		} catch (error) {
			console.error('❌ Erro na autenticação:', error.message);
			throw error;
		}
	}

	async uploadFile(localPath, remotePath) {
		const fileContent = await fs.readFile(localPath);
		const uploadUrl = `${this.adminUrl}/${this.container}/${this.projectName}/${remotePath}`;

		try {
			const response = await fetch(uploadUrl, {
				method: 'PUT',
				headers: {
					'X-Auth-Token': this.authToken,
					'Content-Type': this.getContentType(localPath),
					'Content-Length': fileContent.length
				},
				body: fileContent
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error(`\n   ❌ ${remotePath}: ${response.status} - ${errorText.substring(0, 100)}`);
				throw new Error(`Upload falhou: ${response.status}`);
			}

			return `${this.baseUrl}/${this.container}/${this.projectName}/${remotePath}`;
		} catch (error) {
			throw error;
		}
	}

	getContentType(filePath) {
		const ext = path.extname(filePath).toLowerCase();
		const types = {
			'.html': 'text/html; charset=utf-8',
			'.js': 'application/javascript; charset=utf-8',
			'.mjs': 'application/javascript; charset=utf-8',
			'.css': 'text/css; charset=utf-8',
			'.json': 'application/json; charset=utf-8',
			'.jpg': 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.png': 'image/png',
			'.svg': 'image/svg+xml',
			'.webp': 'image/webp',
			'.woff': 'font/woff',
			'.woff2': 'font/woff2',
			'.ttf': 'font/ttf',
			'.eot': 'application/vnd.ms-fontobject',
			'.ico': 'image/x-icon',
			'.xml': 'application/xml',
			'.txt': 'text/plain'
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
			console.warn(`⚠️ Erro ao ler diretório ${dir}: ${error.message}`);
		}

		return files;
	}

	async createContainer() {
		console.log(`\n📦 Verificando container ${this.container}...`);

		// Tentar criar o container (se já existir, não faz nada)
		const containerUrl = `${this.adminUrl}/${this.container}`;

		try {
			const response = await fetch(containerUrl, {
				method: 'PUT',
				headers: {
					'X-Auth-Token': this.authToken,
					'X-Container-Read': '.r:*', // Leitura pública
					'X-Container-Write': `${this.credentials.username}`
				}
			});

			if (response.ok || response.status === 202) {
				console.log(`✅ Container ${this.container} pronto`);
			} else {
				console.log(`⚠️ Container pode já existir (${response.status})`);
			}
		} catch (error) {
			console.log(`⚠️ Não foi possível verificar container: ${error.message}`);
		}
	}

	async deploy() {
		console.log('\n🚀 DEPLOY USANDO CONFIGURAÇÃO CENTRAL');
		console.log('='.repeat(80));
		console.log(`📁 Projeto: ${this.projectName}`);
		console.log(`🌐 URL Final: ${this.baseUrl}/${this.container}/${this.projectName}/index.html`);
		console.log(`🎛️ Vault: ${this.config.urls.vault}`);
		console.log('='.repeat(80));

		// Verificar build
		try {
			await fs.access(this.buildDir);
			const buildStats = await fs.stat(this.buildDir);
			if (!buildStats.isDirectory()) {
				throw new Error('build não é um diretório');
			}
		} catch {
			console.error('❌ Pasta build/ não encontrada!');
			console.error('   Execute: npm run build');
			process.exit(1);
		}

		// Autenticar
		await this.authenticate();

		// Criar/verificar container
		await this.createContainer();

		// Listar arquivos
		console.log('\n📦 Analisando build...');
		const files = await this.getAllFiles(this.buildDir);
		console.log(`   ${files.length} arquivos encontrados`);

		if (files.length === 0) {
			console.error('❌ Nenhum arquivo encontrado no build!');
			process.exit(1);
		}

		// Upload
		console.log('\n📤 Fazendo upload...');
		let uploaded = 0;
		let failed = 0;

		for (const file of files) {
			const remotePath = file.relativePath.replace(/\\/g, '/');

			try {
				await this.uploadFile(file.fullPath, remotePath);
				uploaded++;
				process.stdout.write(`\r   ✅ ${uploaded} enviados | ❌ ${failed} falhas`);
			} catch (error) {
				failed++;
				// Continue com os próximos arquivos mesmo se um falhar
			}
		}

		console.log('\n\n' + '='.repeat(80));
		if (uploaded > 0) {
			console.log(`✅ DEPLOY CONCLUÍDO! (${uploaded}/${files.length} arquivos)`);
			console.log('='.repeat(80));
			console.log(`\n🌐 Acesse: ${this.baseUrl}/${this.container}/${this.projectName}/index.html`);
			console.log(`🎛️ Vault: ${this.config.urls.vault}`);

			if (failed > 0) {
				console.log(`\n⚠️ ${failed} arquivos falharam no upload`);
			}

			// Testar a URL
			console.log('\n🔍 Testando acesso...');
			try {
				const testUrl = `${this.baseUrl}/${this.container}/${this.projectName}/index.html`;
				const testResponse = await fetch(testUrl, { method: 'HEAD' });
				console.log(`📡 Status: ${testResponse.status} ${testResponse.statusText}`);

				if (testResponse.ok) {
					console.log('✅ Site está acessível!');
				} else {
					console.log('⚠️ Site pode não estar acessível ainda (cache/propagação)');
				}
			} catch (error) {
				console.log('⚠️ Não foi possível testar o acesso:', error.message);
			}
		} else {
			console.log('❌ DEPLOY FALHOU - Nenhum arquivo foi enviado');
			console.log('\nPossíveis problemas:');
			console.log('1. Container não existe ou sem permissão');
			console.log('2. Projeto já existe com outro owner');
			console.log('3. Problema de rede/conectividade');
			console.log('4. Token de autenticação expirado');
		}
	}
}

// CLI
async function main() {
	const args = process.argv.slice(2);
	const projectName = args[0] || PROJECT_CONFIG.projectName;

	console.log('🎯 Deploy usando configuração central do project.config.js');

	const deployer = new SimpleDeploy(projectName);

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

export default SimpleDeploy;
