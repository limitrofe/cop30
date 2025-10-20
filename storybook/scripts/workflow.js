#!/usr/bin/env node

// scripts/workflow.js
// SCRIPT MAESTRO - Orquestra todo o workflow

import PROJECT_CONFIG from '../project.config.js';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

class ProjectWorkflow {
	constructor() {
		this.config = PROJECT_CONFIG;
	}

	/**
	 * Executar comando e mostrar output
	 */
	exec(command, silent = false) {
		if (!silent) console.log(`\n⚡ Executando: ${command}`);
		try {
			execSync(command, {
				stdio: silent ? 'pipe' : 'inherit',
				cwd: rootDir
			});
			return true;
		} catch (error) {
			if (!silent) console.error(`❌ Falha: ${error.message}`);
			return false;
		}
	}

	/**
	 * 1. CONFIGURAR PROJETO
	 */
	async setup() {
		console.log('\n🔧 CONFIGURAÇÃO DO PROJETO');
		console.log('='.repeat(60));

		// Validar configuração
		if (!this.config.validate()) {
			console.error('\n❌ Corrija a configuração em project.config.js');
			process.exit(1);
		}

		this.config.print();

		// Criar estrutura de pastas
		const dirs = [
			'static/videos',
			'static/img/frames/desktop',
			'static/img/frames/mobile',
			'static/data'
		];

		for (const dir of dirs) {
			await fs.mkdir(path.join(rootDir, dir), { recursive: true });
		}

		console.log('\n✅ Estrutura de pastas criada');
		return true;
	}

	/**
	 * 2. PROCESSAR VÍDEOS (MODIFICADO PARA SER OPCIONAL)
	 */
	async processVideos() {
		console.log('\n🎬 PROCESSAMENTO DE VÍDEOS');
		console.log('='.repeat(60));

		// Verificar se existem vídeos
		const videosDir = path.join(rootDir, 'static/videos');
		let files = [];

		try {
			files = await fs.readdir(videosDir);
		} catch (error) {
			// Pasta não existe ou não pode ser lida
			files = [];
		}

		if (files.length === 0) {
			console.log('⚠️  Nenhum vídeo encontrado em static/videos/');
			console.log('   📝 Para usar vídeos, adicione arquivos como:');
			console.log('      • intro_desktop.mp4 e intro_mobile.mp4');
			console.log('      • video1_desktop.mp4 e video1_mobile.mp4');
			console.log('   ✅ Pulando processamento de vídeos...');
			return true; // ✅ MUDANÇA: retorna true ao invés de false
		}

		// Processar todos os vídeos
		const fps = this.config.frames.fps;
		const quality = this.config.frames.quality;

		console.log(`⚙️  Configuração: ${fps} FPS, ${quality}% qualidade`);
		console.log(`📹 Processando ${files.length} arquivo(s)...`);

		const success = this.exec(
			`node scripts/extract-frames.js --process-all --fps ${fps} --quality ${quality}`
		);

		return success;
	}

	/**
	 * 3. FAZER UPLOAD DOS FRAMES (MODIFICADO PARA SER OPCIONAL)
	 */
	async uploadFrames() {
		console.log('\n☁️  UPLOAD DE FRAMES PARA O VAULT');
		console.log('='.repeat(60));

		const framesBase = path.join(rootDir, 'static/img/frames');

		try {
			// Listar pastas de frames
			let desktopDirs = [];
			let mobileDirs = [];

			try {
				desktopDirs = await fs.readdir(path.join(framesBase, 'desktop'));
			} catch {
				// Pasta não existe ou vazia
			}

			try {
				mobileDirs = await fs.readdir(path.join(framesBase, 'mobile'));
			} catch {
				// Pasta não existe ou vazia
			}

			if (desktopDirs.length === 0 && mobileDirs.length === 0) {
				console.log('⚠️  Nenhum frame encontrado para upload');
				console.log('   📝 Frames são gerados automaticamente quando você processa vídeos');
				console.log('   ✅ Pulando upload de frames...');
				return true; // ✅ MUDANÇA: retorna true ao invés de false
			}

			console.log(`📦 Encontrados: ${desktopDirs.length} vídeos para upload`);

			// Upload de cada vídeo
			for (const videoName of desktopDirs) {
				console.log(`\n📤 Uploading: ${videoName}`);

				// Desktop
				if (desktopDirs.includes(videoName)) {
					console.log('   🖥️  Desktop...');
					this.exec(
						`node scripts/upload-globo-storage.js --frames static/img/frames/desktop/${videoName} ${videoName}_desktop ${this.config.projectName}`,
						true
					);
				}

				// Mobile
				if (mobileDirs.includes(videoName)) {
					console.log('   📱 Mobile...');
					this.exec(
						`node scripts/upload-globo-storage.js --frames static/img/frames/mobile/${videoName} ${videoName}_mobile ${this.config.projectName}`,
						true
					);
				}
			}

			console.log('\n✅ Upload concluído!');
			return true;
		} catch (error) {
			console.error('❌ Erro no upload:', error.message);
			return false;
		}
	}

	/**
	 * 4. GERAR CONFIGURAÇÃO PARA GOOGLE DOCS (MODIFICADO PARA SER OPCIONAL)
	 */
	async generateDocsConfig() {
		console.log('\n📄 CONFIGURAÇÃO PARA GOOGLE DOCS');
		console.log('='.repeat(60));

		const framesBase = path.join(rootDir, 'static/img/frames');
		const configs = [];

		try {
			let desktopDirs = [];

			try {
				desktopDirs = await fs.readdir(path.join(framesBase, 'desktop'));
			} catch {
				// Pasta não existe ou vazia
			}

			if (desktopDirs.length === 0) {
				console.log('⚠️  Nenhum frame encontrado para gerar configuração');
				console.log('   📝 Configuração é gerada quando você tem vídeos processados');
				console.log('   ✅ Pulando geração de configuração...');
				return true; // ✅ MUDANÇA: retorna true ao invés de array vazio
			}

			for (const videoName of desktopDirs) {
				// Contar frames
				const desktopFrames = await fs
					.readdir(path.join(framesBase, 'desktop', videoName))
					.catch(() => []);
				const frameCount = desktopFrames.filter((f) => f.endsWith('.jpg')).length;

				const config = this.config.getGoogleDocsConfig(videoName, frameCount);
				configs.push({ name: videoName, ...config });

				console.log(`\n📹 ${videoName}:`);
				console.log('```');
				console.log('type: videoscrollytelling');
				console.log(`imagePrefix: ${config.imagePrefix}`);
				console.log(`imagePrefixMobile: ${config.imagePrefixMobile}`);
				console.log(`totalFrames: ${config.totalFrames}`);
				console.log('```');
			}

			// Salvar configurações em arquivo
			const configPath = path.join(rootDir, 'frames-config.json');
			await fs.writeFile(configPath, JSON.stringify(configs, null, 2));
			console.log(`\n💾 Configurações salvas em: frames-config.json`);

			return true;
		} catch (error) {
			console.error('❌ Erro:', error.message);
			return false;
		}
	}

	/**
	 * 5. FETCH DO GOOGLE DOCS
	 */
	async fetchDocs() {
		console.log('\n📥 FETCH DO GOOGLE DOCS');
		console.log('='.repeat(60));

		if (!this.config.googleDocsId) {
			console.log('⚠️  Google Docs ID não configurado em project.config.js');
			return false;
		}

		return this.exec(`node scripts/fetch-docs.js ${this.config.googleDocsId}`);
	}

	/**
	 * 6. BUILD (MODIFICADO PARA INCLUIR FIX DE URLs)
	 */
	async build() {
		console.log('\n🔨 BUILD DO PROJETO');
		console.log('='.repeat(60));

		// 1. Build normal do SvelteKit
		const buildSuccess = this.exec('ALLOW_DYNAMIC_ROUTES=true npm run build');
		if (!buildSuccess) {
			console.error('❌ Falha no build do SvelteKit');
			return false;
		}

		// 2. 🆕 NOVO: Fix de URLs absolutas para S3
		console.log('\n🔧 CORRIGINDO URLs PARA S3...');
		const fixSuccess = this.exec('node scripts/fix-absolute-urls.js');
		if (!fixSuccess) {
			console.log('⚠️  Falha na correção de URLs, mas continuando...');
			console.log('   O deploy pode não funcionar corretamente para embed');
		} else {
			console.log('✅ URLs corrigidas para S3');
		}

		return true;
	}

	/**
	 * 7. DEPLOY
	 */
	async deploy() {
		console.log('\n🚀 DEPLOY PARA O VAULT');
		console.log('='.repeat(60));

		// Usar simple-deploy.js em vez de smart-deploy.js!
		return this.exec(`node scripts/simple-deploy.js ${this.config.projectName}`);
	}

	/**
	 * 🆕 8. GERAR CACHE AUTOMÁTICO
	 */
	async generateCache() {
		console.log('\n📦 GERANDO LISTA DE CACHE');
		console.log('='.repeat(60));

		try {
			// Tentar usar o script otimizado primeiro
			const success = this.exec('node scripts/simple-cache-generator.js', true);
			if (success) {
				console.log('✅ Lista de cache gerada com sucesso!');
				return true;
			}
		} catch (error) {
			console.log('⚠️ Script otimizado falhou, usando método simples...');
		}

		// Fallback: método manual simples
		console.log('🔄 Gerando cache manualmente...');
		const cacheUrls = [];

		try {
			const framesDir = path.join(rootDir, 'static/img/frames');

			// Desktop frames
			const desktopPath = path.join(framesDir, 'desktop');
			try {
				const videos = await fs.readdir(desktopPath);
				for (const video of videos) {
					const videoPath = path.join(desktopPath, video);
					const stat = await fs.stat(videoPath);
					if (stat.isDirectory()) {
						const frames = await fs.readdir(videoPath);
						for (const frame of frames) {
							if (frame.endsWith('.jpg')) {
								cacheUrls.push(
									`/${this.config.cdn.container}/${this.config.projectName}/img/frames/desktop/${video}/${frame}`
								);
							}
						}
					}
				}
			} catch (e) {
				console.log('⚠️ Desktop frames não encontrados');
			}

			// Mobile frames
			const mobilePath = path.join(framesDir, 'mobile');
			try {
				const videos = await fs.readdir(mobilePath);
				for (const video of videos) {
					const videoPath = path.join(mobilePath, video);
					const stat = await fs.stat(videoPath);
					if (stat.isDirectory()) {
						const frames = await fs.readdir(videoPath);
						for (const frame of frames) {
							if (frame.endsWith('.webp')) {
								cacheUrls.push(
									`/${this.config.cdn.container}/${this.config.projectName}/img/frames/mobile/${video}/${frame}`
								);
							}
						}
					}
				}
			} catch (e) {
				console.log('⚠️ Mobile frames não encontrados');
			}

			if (cacheUrls.length > 0) {
				await fs.writeFile(path.join(rootDir, 'cache-list.txt'), cacheUrls.join('\n'));
				console.log(`✅ ${cacheUrls.length} URLs adicionadas ao cache`);
				return true;
			} else {
				console.log('⚠️ Nenhum frame encontrado para cache');
				return false;
			}
		} catch (error) {
			console.error('❌ Erro na geração de cache:', error.message);
			return false;
		}
	}

	/**
	 * 🆕 9. AQUECER CACHE AUTOMÁTICO
	 */
	async warmCache() {
		console.log('\n🔥 AQUECENDO CACHE DA CDN');
		console.log('='.repeat(60));

		// Verificar se existe lista de cache
		const cacheListPath = path.join(rootDir, 'cache-list.txt');
		try {
			await fs.access(cacheListPath);
		} catch {
			console.log('⚠️ Lista de cache não encontrada, pulando aquecimento');
			return false;
		}

		try {
			const cacheContent = await fs.readFile(cacheListPath, 'utf8');
			const urls = cacheContent
				.trim()
				.split('\n')
				.filter((url) => url.trim());

			console.log(`🎯 Aquecendo ${urls.length} arquivos...`);

			let warmed = 0;
			let failed = 0;

			// Aquecer em lotes para não sobrecarregar
			const batchSize = 10;
			for (let i = 0; i < urls.length; i += batchSize) {
				const batch = urls.slice(i, i + batchSize);

				const promises = batch.map(async (urlPath) => {
					try {
						const fullUrl = `${this.config.cdn.baseUrl}${urlPath}`;
						const response = await fetch(fullUrl, {
							method: 'HEAD',
							headers: { 'User-Agent': 'WorkflowCacheWarmer/1.0' }
						});

						if (response.ok) {
							warmed++;
						} else {
							failed++;
						}
					} catch (error) {
						failed++;
					}
				});

				await Promise.all(promises);

				// Mostrar progresso
				const progress = Math.min(i + batchSize, urls.length);
				process.stdout.write(
					`\r🔥 Progresso: ${progress}/${urls.length} | ✅ ${warmed} | ❌ ${failed}`
				);

				// Pausa pequena entre lotes
				if (i + batchSize < urls.length) {
					await new Promise((resolve) => setTimeout(resolve, 500));
				}
			}

			console.log(`\n\n✅ Cache aquecido! ${warmed} sucessos, ${failed} falhas`);
			return true;
		} catch (error) {
			console.error('❌ Erro no aquecimento:', error.message);
			return false;
		}
	}

	/**
	 * WORKFLOW COMPLETO (AGORA COM STEPS OPCIONAIS!)
	 */
	async runComplete() {
		console.log('\n');
		console.log('🚀 WORKFLOW COMPLETO DO PROJETO');
		console.log('='.repeat(70));
		console.log(`📁 Projeto: ${this.config.projectName}`);
		console.log(`📄 Título: ${this.config.pageTitle}`);
		console.log('='.repeat(70));

		const steps = [
			{ name: 'Setup', fn: () => this.setup(), required: true },
			{ name: 'Processar Vídeos', fn: () => this.processVideos(), required: false },
			{ name: 'Upload Frames', fn: () => this.uploadFrames(), required: false },
			{ name: 'Gerar Config', fn: () => this.generateDocsConfig(), required: false },
			{ name: 'Fetch Docs', fn: () => this.fetchDocs(), required: false },
			{ name: 'Build', fn: () => this.build(), required: true },
			{ name: 'Deploy', fn: () => this.deploy(), required: true },
			{ name: 'Gerar Cache', fn: () => this.generateCache(), required: false },
			{ name: 'Aquecer Cache', fn: () => this.warmCache(), required: false }
		];

		for (let i = 0; i < steps.length; i++) {
			const step = steps[i];
			console.log(`\n[${i + 1}/${steps.length}] ${step.name}...`);

			const success = await step.fn();

			// ✅ MUDANÇA: Diferenciar entre steps obrigatórios e opcionais
			if (!success && step.required) {
				console.error(`\n❌ Falha em step obrigatório: ${step.name}`);
				process.exit(1);
			}

			if (!success && !step.required) {
				console.log(`⚠️ ${step.name} pulado/falhou (opcional), mas continuando...`);
			}
		}

		// Resumo final
		console.log('\n');
		console.log('='.repeat(70));
		console.log('✅ WORKFLOW CONCLUÍDO COM SUCESSO!');
		console.log('='.repeat(70));

		console.log('\n📋 RESUMO:');
		console.log(`   📁 Projeto: ${this.config.projectName}`);
		console.log(`   🌐 URL: ${this.config.baseProjectUrl}`);
		console.log(`   🎛️ Vault: ${this.config.urls.vault}`);
		console.log(`   🔥 Cache: Processo automático`);

		console.log('\n💡 PRÓXIMOS PASSOS:');
		console.log('   1. Para usar vídeos: adicione em static/videos/');
		console.log('   2. Copie as configurações para o Google Docs (se houver)');
		console.log('   3. Execute: npm run workflow:update');
		console.log('   4. Acesse a página publicada');

		console.log('\n🎉 Tudo pronto! Mobile-first sempre! 📱✨');
	}

	/**
	 * UPDATE (após atualizar Google Docs)
	 */
	async runUpdate() {
		console.log('\n🔄 ATUALIZANDO PROJETO');
		console.log('='.repeat(60));

		await this.fetchDocs();
		await this.build();
		await this.deploy();

		// 🆕 NOVO: Cache automático no update também
		console.log('\n🔥 Aquecendo cache após atualização...');
		await this.generateCache();
		await this.warmCache();

		console.log('\n✅ Atualização concluída com cache aquecido!');
		console.log(`🌐 URL: ${this.config.baseProjectUrl}`);
	}
}

// CLI
async function main() {
	const args = process.argv.slice(2);
	const workflow = new ProjectWorkflow();

	if (args[0] === '--help' || args[0] === '-h') {
		console.log(`
🎯 WORKFLOW MAESTRO - FAZ TUDO (AGORA COM CACHE)!

Comandos:
  node workflow.js              Roda workflow completo (NOVO: inclui cache!)
  node workflow.js update        Atualiza (fetch + build + deploy + cache)
  node workflow.js setup         Apenas configuração inicial
  node workflow.js videos        Apenas processar vídeos
  node workflow.js upload        Apenas upload de frames
  node workflow.js config        Gerar config para Google Docs
  node workflow.js deploy        Apenas deploy
  node workflow.js cache         Apenas gerar + aquecer cache

Workflow Completo (NOVO):
  1. Setup (cria pastas)
  2. Processa vídeos (extrai frames) - OPCIONAL
  3. Upload frames para Vault - OPCIONAL
  4. Gera configuração para Google Docs - OPCIONAL
  5. Fetch do Google Docs - OPCIONAL
  6. Build - OBRIGATÓRIO
  7. Deploy - OBRIGATÓRIO
  8. 🆕 Gerar lista de cache - OPCIONAL
  9. 🆕 Aquecer cache da CDN - OPCIONAL

IMPORTANTE:
  Configure primeiro em project.config.js!
  Cache agora é AUTOMÁTICO! 🔥
  Mobile-first sempre! 📱✨
    `);
		process.exit(0);
	}

	try {
		if (args[0] === 'update') {
			await workflow.runUpdate();
		} else if (args[0] === 'setup') {
			await workflow.setup();
		} else if (args[0] === 'videos') {
			await workflow.processVideos();
		} else if (args[0] === 'upload') {
			await workflow.uploadFrames();
		} else if (args[0] === 'config') {
			await workflow.generateDocsConfig();
		} else if (args[0] === 'deploy') {
			await workflow.deploy();
		} else if (args[0] === 'cache') {
			await workflow.generateCache();
			await workflow.warmCache();
		} else if (args[0] === '--help' || args[0] === '-h') {
			// Mostra help e sai
			process.exit(0);
		} else {
			// SEM ARGUMENTOS = RODAR WORKFLOW COMPLETO
			await workflow.runComplete();
		}
	} catch (error) {
		console.error('\n❌ Erro:', error.message);
		process.exit(1);
	}
}

// Executar
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main();
}

export default ProjectWorkflow;
