// config/deploy.config.js
// Configuração central do projeto - NÃO HARDCODE NADA AQUI!

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Configuração central do projeto
 * Todas as URLs e configurações devem vir daqui
 */
const config = {
	// Configuração do servidor/CDN
	cdn: {
		baseUrl:
			process.env.CDN_BASE_URL || 'https://s3.glbimg.com/v1/AUTH_9897f8564b5c46c9b6e85bda5912fe3b',
		container: process.env.CDN_CONTAINER || 'g1',
		projectName: process.env.PROJECT_NAME || `newsroom-${new Date().toISOString().slice(0, 10)}`
	},

	// Configuração de autenticação
	auth: {
		username: process.env.GLOBO_USERNAME || 'u_especiais_svelte',
		password: process.env.GLOBO_PASSWORD, // DEVE vir do .env
		authUrl: process.env.AUTH_URL || 'https://auth.s3.globoi.com:5000/v3',
		projectAuth: process.env.PROJECT_AUTH || 'Projeto_especiais_svelte',
		adminUrl:
			process.env.ADMIN_URL || 'https://api.s3.globoi.com/v1/AUTH_9897f8564b5c46c9b6e85bda5912fe3b'
	},

	// Configuração de build
	build: {
		outputDir: process.env.BUILD_DIR || 'build',
		assetsDir: process.env.ASSETS_DIR || 'assets',
		framesDir: process.env.FRAMES_DIR || 'video-frames',
		dataDir: process.env.DATA_DIR || 'static/data'
	},

	// Configuração de frames
	frames: {
		desktop: {
			extension: '.jpg',
			quality: 85,
			maxWidth: 1920,
			maxHeight: 1080
		},
		mobile: {
			extension: '.webp',
			quality: 80,
			maxWidth: 768,
			maxHeight: 1366
		},
		padding: 4, // zeros à esquerda (0001, 0002, etc)
		preloadRadius: parseInt(process.env.PRELOAD_RADIUS) || 8,
		maxMemoryMB: parseInt(process.env.MAX_MEMORY_MB) || 50
	},

	// URLs computadas (não modificar)
	get urls() {
		const base = `${this.cdn.baseUrl}/${this.cdn.container}/${this.cdn.projectName}`;
		return {
			base,
			frames: `${base}/${this.build.framesDir}`,
			assets: `${base}/${this.build.assetsDir}`,
			data: `${base}/data`,
			admin: this.auth.adminUrl,
			vault: `https://vault.globoi.com/p/especiais_svelte/storage/objects/${this.cdn.container}/${this.cdn.projectName}/`
		};
	},

	// Helpers para gerar URLs
	getPublicUrl(path) {
		// Remove barras iniciais duplicadas
		const cleanPath = path.replace(/^\/+/, '');
		return `${this.urls.base}/${cleanPath}`;
	},

	getFrameUrl(frameName, isMobile = false) {
		const dir = isMobile ? 'mobile' : 'desktop';
		return `${this.urls.frames}/${dir}/${frameName}`;
	},

	getAssetUrl(assetPath) {
		const cleanPath = assetPath.replace(/^\/+/, '');
		return `${this.urls.assets}/${cleanPath}`;
	},

	// Validação da configuração
	validate() {
		const errors = [];

		if (!this.auth.password) {
			errors.push('❌ GLOBO_PASSWORD não configurado no .env');
		}

		if (!this.cdn.projectName) {
			errors.push('❌ PROJECT_NAME não configurado');
		}

		if (this.cdn.projectName.includes(' ')) {
			errors.push('❌ PROJECT_NAME não pode conter espaços');
		}

		if (errors.length > 0) {
			console.error('\n🚨 Erros de configuração:');
			errors.forEach((err) => console.error(err));
			console.error('\n💡 Execute: npm run setup\n');
			process.exit(1);
		}

		return true;
	},

	// Imprimir configuração atual (sem senha)
	print() {
		console.log('\n📋 Configuração Atual:');
		console.log('='.repeat(60));
		console.log(`📁 Projeto: ${this.cdn.projectName}`);
		console.log(`🌐 Base URL: ${this.urls.base}`);
		console.log(`🖼️ Frames URL: ${this.urls.frames}`);
		console.log(`📦 Assets URL: ${this.urls.assets}`);
		console.log(`🔐 Username: ${this.auth.username}`);
		console.log(`🔑 Password: ${this.auth.password ? '***configurado***' : '❌ NÃO CONFIGURADO'}`);
		console.log(`🎛️ Vault: ${this.urls.vault}`);
		console.log('='.repeat(60));
	}
};

// Exportar como default e também named exports
export default config;
export const { cdn, auth, build, frames, urls } = config;
