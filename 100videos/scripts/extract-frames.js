#!/usr/bin/env node

// scripts/extract-frames.js
// Extrator de frames OTIMIZADO - Desktop + Mobile
// ✅ Ajustes:
// - Força encoder estático para WebP: -c:v libwebp (evita WebP animado)
// - Remove smart_subsample (ou deixa comentado)
// - Garante dimensões pares: mobile scale '768:-2'
// - Acrescenta format=yuv420p no filtro (compat)
// - Adiciona -vsync 0 para sequência estável
// - Bufferiza stderr do FFmpeg para logs de erro úteis
// 🆕 NOVO: Suporte para múltiplas resoluções com controle de tamanho

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

class FrameExtractor {
	constructor() {
		// Base para os frames - sempre em static/img/frames
		this.outputBase = path.join(rootDir, 'static', 'img', 'frames');

		// Configurações padrão otimizadas para performance
		this.defaultConfig = {
			fps: 30, // 15 fps é suficiente para scroll suave
			quality: 75, // Qualidade boa mas não exagerada
			desktopFormat: 'jpg',
			mobileFormat: 'webp'
		};

		// 🆕 NOVO: Configuração de breakpoints responsivos
		this.responsiveBreakpoints = {
			desktop: [
				{ width: 2440, maxKB: 140, quality: 85, suffix: '_2440' },
				{ width: 1920, maxKB: 120, quality: 82, suffix: '_1920' },
				{ width: 1440, maxKB: 90, quality: 80, suffix: '_1440' },
				{ width: 1280, maxKB: 72, quality: 78, suffix: '_1280' }
			],
			mobile: [
				{ width: 900, maxKB: 60, quality: 85, suffix: '_900' },
				{ width: 650, maxKB: 45, quality: 82, suffix: '_650' },
				{ width: 300, maxKB: 40, quality: 80, suffix: '_300' }
			]
		};
	}

	/**
	 * Verificar se ffmpeg está instalado
	 */
	async checkFFmpeg() {
		return new Promise((resolve) => {
			const ffmpeg = spawn('ffmpeg', ['-version']);
			ffmpeg.on('error', () => resolve(false));
			ffmpeg.on('close', (code) => resolve(code === 0));
		});
	}

	/**
	 * Extrair frames de um vídeo com foco em performance
	 */
	async extractFrames(videoPath, outputDir, options = {}) {
		const {
			fps = this.defaultConfig.fps,
			quality = this.defaultConfig.quality,
			format = 'jpg',
			scale = null,
			startTime = null,
			duration = null,
			suffix = '' // 🆕 NOVO: Sufixo para múltiplas resoluções
		} = options;

		// Criar diretório de saída
		await fs.mkdir(outputDir, { recursive: true });

		// Padrão de nome dos frames (com sufixo opcional)
		const outputPattern = path.join(outputDir, `frame_%04d${suffix}.${format}`);

		// Montar comando ffmpeg otimizado
		const args = [];

		// Decodificação rápida
		args.push('-hwaccel', 'auto');

		// Tempo inicial
		if (startTime) {
			args.push('-ss', startTime);
		}

		// Input
		args.push('-i', videoPath);

		// Duração
		if (duration) {
			args.push('-t', duration);
		}

		// Filtros de vídeo
		const filters = [`fps=${fps}`];
		if (scale) {
			filters.push(`scale=${scale}:flags=fast_bilinear`); // Scaling rápido
		}
		// Compatibilidade com encoders que exigem YUV420
		filters.push('format=yuv420p');
		args.push('-vf', filters.join(','));

		// Configurações de qualidade otimizadas
		if (format === 'jpg' || format === 'jpeg') {
			// Converte 0-100 para 1-3 (aproximação de qualidade do mjpeg)
			args.push('-q:v', Math.max(1, Math.min(3, Math.round(quality / 33))).toString());
			// Codec padrão mjpeg é ok
		} else if (format === 'webp') {
			// ⚠️ Força encoder ESTÁTICO para evitar WebP animado
			args.push('-c:v', 'libwebp');
			args.push('-lossless', '0');
			args.push('-quality', quality.toString()); // 0-100
			args.push('-compression_level', '4'); // 0-6 (4 é mais rápido)
			args.push('-preset', 'picture');
			// args.push('-smart_subsample', '1'); // opcional, comente se seu build não suportar
			// Sequência estável de arquivos (1 arquivo por frame)
			args.push('-vsync', '0');
			// Também poderíamos forçar o pix_fmt aqui, mas já está no filtro:
			// args.push('-pix_fmt', 'yuv420p');
		}

		// Threading para acelerar
		args.push('-threads', '0'); // Usa todos os cores disponíveis

		// Output
		args.push(outputPattern);

		console.log(`   📹 Extraindo: ${path.basename(videoPath)}`);
		console.log(`      → FPS: ${fps} | Qualidade: ${quality}% | Formato: ${format.toUpperCase()}`);
		if (scale) console.log(`      → Resolução: ${scale}`);
		if (suffix) console.log(`      → Sufixo: ${suffix}`);

		return new Promise((resolve, reject) => {
			const ffmpeg = spawn('ffmpeg', args);

			let lastFrame = 0;
			let startTimeMs = Date.now();
			let stderrBuf = '';

			ffmpeg.stderr.on('data', (data) => {
				const output = data.toString();
				stderrBuf += output;

				// Capturar progresso
				const frameMatch = output.match(/frame=\s*(\d+)/);
				if (frameMatch) {
					lastFrame = parseInt(frameMatch[1]);
					const elapsed = (Date.now() - startTimeMs) / 1000;
					const fpsNow = lastFrame / elapsed;
					process.stdout.write(`\r      ⏳ Frame ${lastFrame} (${fpsNow.toFixed(1)} fps)...`);
				}
			});

			ffmpeg.on('close', async (code) => {
				console.log(''); // Nova linha

				if (code !== 0) {
					console.error('----- FFmpeg stderr -----\n' + stderrBuf + '\n------------------------');
					reject(new Error(`FFmpeg falhou com código ${code}`));
					return;
				}

				try {
					// Contar frames gerados
					const files = await fs.readdir(outputDir);
					const frames = files.filter((f) => f.endsWith(`.${format}`)).sort();

					const elapsed = ((Date.now() - startTimeMs) / 1000).toFixed(1);
					console.log(`      ✅ ${frames.length} frames em ${elapsed}s`);

					resolve({
						success: true,
						outputDir,
						frameCount: frames.length,
						frames: frames,
						elapsed: elapsed
					});
				} catch (err) {
					console.error('Erro ao ler diretório de saída:', err.message);
					reject(err);
				}
			});

			ffmpeg.on('error', (err) => {
				reject(err);
			});
		});
	}

	// 🆕 NOVO: Método para calcular qualidade ideal para atingir tamanho alvo
	async findOptimalQuality(videoPath, width, targetKB, format, fps) {
		let minQuality = 50;
		let maxQuality = 95;
		let optimalQuality = 75;
		let attempts = 0;
		const maxAttempts = 5;

		console.log(`      🎯 Buscando qualidade ideal para ${width}px (alvo: <${targetKB}KB)...`);

		while (attempts < maxAttempts && minQuality <= maxQuality) {
			attempts++;
			const testQuality = Math.round((minQuality + maxQuality) / 2);

			// Extrair frame de teste
			const testFile = path.join(this.outputBase, `test_${width}.${format}`);

			// Comando FFmpeg para extrair um frame de teste
			const args = [
				'-i',
				videoPath,
				'-vf',
				`scale=${width}:-2,select='eq(n\\,10)'`, // Frame 10 como amostra
				'-vframes',
				'1'
			];

			if (format === 'jpg') {
				args.push('-q:v', Math.round(testQuality / 33).toString());
			} else if (format === 'webp') {
				args.push('-c:v', 'libwebp');
				args.push('-quality', testQuality.toString());
			}

			args.push('-y', testFile);

			const success = await new Promise((resolve) => {
				const ffmpeg = spawn('ffmpeg', args, { stdio: 'pipe' });
				ffmpeg.on('close', (code) => resolve(code === 0));
				ffmpeg.on('error', () => resolve(false));
			});

			if (success) {
				try {
					const stats = await fs.stat(testFile);
					const sizeKB = stats.size / 1024;

					console.log(`         Teste ${attempts}: Q${testQuality} = ${sizeKB.toFixed(1)}KB`);

					if (sizeKB <= targetKB) {
						optimalQuality = testQuality;
						minQuality = testQuality + 1;

						// Se está muito abaixo do alvo, podemos aumentar mais
						if (sizeKB < targetKB * 0.8) {
							minQuality = testQuality + 5;
						}
					} else {
						maxQuality = testQuality - 1;
					}

					// Limpar arquivo de teste
					await fs.unlink(testFile).catch(() => {});
				} catch (err) {
					// Ignorar erro
				}
			}
		}

		console.log(`      ✅ Qualidade otimizada: ${optimalQuality}%`);
		return optimalQuality;
	}

	// 🆕 NOVO: Processar vídeo com múltiplas resoluções
	async processVideoResponsive(desktopVideo, mobileVideo, videoName, options = {}) {
		const {
			fps = this.defaultConfig.fps,
			skipSizes = [], // Array de widths para pular
			optimizeQuality = true // Se deve otimizar qualidade para tamanho alvo
		} = options;

		// Limpar nome
		const cleanName = videoName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

		console.log('\n' + '='.repeat(70));
		console.log(`🎬 PROCESSAMENTO RESPONSIVO: ${videoName}`);
		console.log('='.repeat(70));
		console.log(`⚡ Gerando múltiplas resoluções com controle de tamanho`);
		console.log(`📊 FPS: ${fps}`);

		const results = {
			desktop: {},
			mobile: {}
		};

		try {
			// 1. PROCESSAR VERSÕES DESKTOP
			console.log('\n🖥️  VERSÕES DESKTOP (múltiplas resoluções):');

			for (const config of this.responsiveBreakpoints.desktop) {
				if (skipSizes.includes(config.width)) {
					console.log(`   ⏭️  Pulando ${config.width}px`);
					continue;
				}

				const outputDir = path.join(this.outputBase, 'desktop', cleanName);

				console.log(`\n   📐 Processando ${config.width}px (máx ${config.maxKB}KB):`);

				// Otimizar qualidade se necessário
				let finalQuality = config.quality;
				if (optimizeQuality) {
					finalQuality = await this.findOptimalQuality(
						desktopVideo,
						config.width,
						config.maxKB,
						this.defaultConfig.desktopFormat,
						fps
					);
				}

				const result = await this.extractFrames(desktopVideo, outputDir, {
					fps,
					quality: finalQuality,
					format: this.defaultConfig.desktopFormat,
					scale: `${config.width}:-2`,
					suffix: config.suffix
				});

				results.desktop[config.width] = result;
			}

			// 2. PROCESSAR VERSÕES MOBILE
			console.log('\n📱 VERSÕES MOBILE (múltiplas resoluções):');

			for (const config of this.responsiveBreakpoints.mobile) {
				if (skipSizes.includes(config.width)) {
					console.log(`   ⏭️  Pulando ${config.width}px`);
					continue;
				}

				const outputDir = path.join(this.outputBase, 'mobile', cleanName);

				console.log(`\n   📐 Processando ${config.width}px (máx ${config.maxKB}KB):`);

				// Otimizar qualidade se necessário
				let finalQuality = config.quality;
				if (optimizeQuality) {
					finalQuality = await this.findOptimalQuality(
						mobileVideo,
						config.width,
						config.maxKB,
						this.defaultConfig.mobileFormat,
						fps
					);
				}

				const result = await this.extractFrames(mobileVideo, outputDir, {
					fps,
					quality: finalQuality,
					format: this.defaultConfig.mobileFormat,
					scale: `${config.width}:-2`,
					suffix: config.suffix
				});

				results.mobile[config.width] = result;
			}

			// 3. SALVAR CONFIGURAÇÃO
			const configPath = path.join(this.outputBase, `${cleanName}_responsive_config.json`);
			const configData = {
				name: cleanName,
				originalName: videoName,
				responsive: true,
				breakpoints: {
					desktop: this.responsiveBreakpoints.desktop.map((bp) => ({
						width: bp.width,
						maxKB: bp.maxKB,
						frameCount: results.desktop[bp.width]?.frameCount || 0,
						suffix: bp.suffix
					})),
					mobile: this.responsiveBreakpoints.mobile.map((bp) => ({
						width: bp.width,
						maxKB: bp.maxKB,
						frameCount: results.mobile[bp.width]?.frameCount || 0,
						suffix: bp.suffix
					}))
				},
				settings: { fps },
				processedAt: new Date().toISOString()
			};

			await fs.writeFile(configPath, JSON.stringify(configData, null, 2));

			// 4. RESUMO
			console.log('\n' + '='.repeat(70));
			console.log('✅ PROCESSAMENTO RESPONSIVO CONCLUÍDO!');
			console.log('='.repeat(70));

			console.log('\n📊 RESUMO:');
			console.log(`   Vídeo: ${cleanName}`);
			console.log(`   Desktop: ${Object.keys(results.desktop).length} resoluções`);
			console.log(`   Mobile: ${Object.keys(results.mobile).length} resoluções`);

			console.log('\n💾 USO NO SCROLLYFRAMES:');
			console.log('```javascript');
			console.log('// Detectar largura e escolher resolução ideal');
			console.log('const width = window.innerWidth;');
			console.log('if (width <= 768) {');
			console.log(`  // Mobile: ${Object.keys(results.mobile).join(', ')}px`);
			console.log('} else {');
			console.log(`  // Desktop: ${Object.keys(results.desktop).join(', ')}px`);
			console.log('}');
			console.log('```');

			return { ...results, config: configData };
		} catch (error) {
			console.error('\n❌ Erro no processamento responsivo:', error.message);
			throw error;
		}
	}

	/**
	 * Processar par de vídeos (desktop + mobile)
	 */
	async processVideoPair(desktopVideo, mobileVideo, videoName, options = {}) {
		const {
			fps = this.defaultConfig.fps,
			quality = this.defaultConfig.quality,
			desktopScale = '1920:-2', // Mantém AR e garante dimensão par
			mobileScale = '768:-2' // Mantém AR e garante dimensão par
		} = options;

		// Validar nome
		if (!videoName || videoName.trim() === '') {
			throw new Error('Nome do vídeo é obrigatório!');
		}

		// Limpar nome (remover caracteres especiais)
		const cleanName = videoName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

		console.log('\n' + '='.repeat(60));
		console.log(`🎬 PROCESSANDO: ${videoName}`);
		console.log('='.repeat(60));
		console.log(`⚡ Modo: PERFORMANCE (${fps} fps, ${quality}% qualidade)`);

		const results = {};

		try {
			// Criar diretórios
			const desktopDir = path.join(this.outputBase, 'desktop', cleanName);
			const mobileDir = path.join(this.outputBase, 'mobile', cleanName);

			// 1. DESKTOP - JPG otimizado
			console.log('\n🖥️  DESKTOP:');
			const desktopStart = Date.now();
			results.desktop = await this.extractFrames(desktopVideo, desktopDir, {
				fps,
				quality,
				format: this.defaultConfig.desktopFormat,
				scale: desktopScale
			});

			// 2. MOBILE - WebP otimizado (estático, 1 arquivo por frame)
			console.log('\n📱 MOBILE:');
			const mobileStart = Date.now();
			results.mobile = await this.extractFrames(mobileVideo, mobileDir, {
				fps,
				quality,
				format: this.defaultConfig.mobileFormat,
				scale: mobileScale
			});

			// Tempo total
			const totalTime = ((Date.now() - desktopStart) / 1000).toFixed(1);

			// Resumo
			console.log('\n' + '='.repeat(60));
			console.log('✅ CONCLUÍDO!');
			console.log('='.repeat(60));

			console.log('\n📊 RESUMO:');
			console.log(`   Nome: ${cleanName}`);
			console.log(`   FPS: ${fps}`);
			console.log(`   Qualidade: ${quality}%`);
			console.log(
				`   Desktop: ${results.desktop.frameCount} frames (${this.defaultConfig.desktopFormat.toUpperCase()})`
			);
			console.log(
				`   Mobile: ${results.mobile.frameCount} frames (${this.defaultConfig.mobileFormat.toUpperCase()})`
			);
			console.log(`   Tempo total: ${totalTime}s`);

			console.log('\n📁 ESTRUTURA GERADA:');
			console.log(`   static/img/frames/`);
			console.log(`   ├── desktop/`);
			console.log(`   │   └── ${cleanName}/`);
			console.log(`   │       ├── frame_0001.${this.defaultConfig.desktopFormat}`);
			console.log(`   │       └── ...`);
			console.log(`   └── mobile/`);
			console.log(`       └── ${cleanName}/`);
			console.log(`           ├── frame_0001.${this.defaultConfig.mobileFormat}`);
			console.log(`           └── ...`);

			// Salvar configuração
			const configPath = path.join(this.outputBase, `${cleanName}_config.json`);
			const config = {
				name: cleanName,
				originalName: videoName,
				desktop: {
					path: `/img/frames/desktop/${cleanName}/`,
					frameCount: results.desktop.frameCount,
					format: this.defaultConfig.desktopFormat,
					pattern: `frame_%04d.${this.defaultConfig.desktopFormat}`
				},
				mobile: {
					path: `/img/frames/mobile/${cleanName}/`,
					frameCount: results.mobile.frameCount,
					format: this.defaultConfig.mobileFormat,
					pattern: `frame_%04d.${this.defaultConfig.mobileFormat}`
				},
				settings: {
					fps,
					quality
				},
				processedAt: new Date().toISOString()
			};

			await fs.writeFile(configPath, JSON.stringify(config, null, 2));

			console.log('\n💾 CONFIGURAÇÃO PARA O SCROLLYFRAMES:');
			console.log('```');
			console.log(`framePrefix="/img/frames/desktop/${cleanName}/frame_"`);
			console.log(`framePrefixMobile="/img/frames/mobile/${cleanName}/frame_"`);
			console.log(
				`totalFrames={${Math.min(results.desktop.frameCount, results.mobile.frameCount)}}`
			);
			console.log('```');

			return { ...results, config };
		} catch (error) {
			console.error('\n❌ Erro no processamento:', error.message);
			throw error;
		}
	}

	/**
	 * Processar múltiplos pares de vídeos
	 */
	async processBatch(videoPairs) {
		console.log('\n🎬 PROCESSAMENTO EM LOTE');
		console.log(`📦 Total: ${videoPairs.length} pares de vídeos`);

		const results = [];

		for (let i = 0; i < videoPairs.length; i++) {
			const pair = videoPairs[i];
			console.log(`\n[${i + 1}/${videoPairs.length}] Processando: ${pair.name}`);

			try {
				const result = await this.processVideoPair(
					pair.desktop,
					pair.mobile,
					pair.name,
					pair.options || {}
				);
				results.push(result);
			} catch (error) {
				console.error(`❌ Falha em ${pair.name}:`, error.message);
				results.push({ error: error.message, name: pair.name });
			}
		}

		return results;
	}

	/**
	 * Listar vídeos já processados
	 */
	async listProcessed() {
		try {
			const desktopDir = path.join(this.outputBase, 'desktop');
			const mobileDir = path.join(this.outputBase, 'mobile');

			const desktopFolders = await fs.readdir(desktopDir).catch(() => []);
			const mobileFolders = await fs.readdir(mobileDir).catch(() => []);

			const processed = [];

			for (const folder of desktopFolders) {
				if (mobileFolders.includes(folder)) {
					const configPath = path.join(this.outputBase, `${folder}_config.json`);
					try {
						const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
						processed.push(config);
					} catch {
						processed.push({ name: folder });
					}
				}
			}

			return processed;
		} catch {
			return [];
		}
	}

	/**
	 * Listar vídeos disponíveis na pasta static/videos
	 */
	async listAvailableVideos() {
		const videosDir = path.join(rootDir, 'static', 'videos');

		try {
			// Verificar se a pasta existe
			await fs.access(videosDir);

			// Listar arquivos
			const files = await fs.readdir(videosDir);

			// Filtrar apenas vídeos
			const videoFiles = files.filter((f) => f.match(/\.(mp4|webm|mov|avi|mkv)$/i));

			// Agrupar por pares (desktop/mobile)
			const pairs = new Map();

			for (const file of videoFiles) {
				// Tentar identificar o nome base e o tipo
				let baseName, type;

				if (file.includes('_desktop') || file.includes('_wide')) {
					baseName = file.replace(/_desktop|_wide/i, '').replace(/\.[^.]+$/, '');
					type = 'desktop';
				} else if (file.includes('_mobile') || file.includes('_vertical')) {
					baseName = file.replace(/_mobile|_vertical/i, '').replace(/\.[^.]+$/, '');
					type = 'mobile';
				} else {
					// Arquivo sem sufixo claro
					baseName = file.replace(/\.[^.]+$/, '');
					type = 'unknown';
				}

				if (!pairs.has(baseName)) {
					pairs.set(baseName, {});
				}

				pairs.get(baseName)[type] = file;
			}

			return { videosDir, files: videoFiles, pairs };
		} catch (error) {
			if (error.code === 'ENOENT') {
				return {
					videosDir,
					files: [],
					pairs: new Map(),
					error: 'Pasta static/videos não encontrada'
				};
			}
			throw error;
		}
	}

	/**
	 * Processar todos os pares de vídeos encontrados
	 */
	async processAllVideos(options = {}) {
		const { pairs, videosDir } = await this.listAvailableVideos();

		if (pairs.size === 0) {
			console.log('Nenhum par de vídeos encontrado em static/videos/');
			return [];
		}

		const results = [];
		let processed = 0;

		for (const [baseName, files] of pairs) {
			if (files.desktop && files.mobile) {
				processed++;
				console.log(`\n[${processed}/${pairs.size}] Processando: ${baseName}`);

				try {
					const result = await this.processVideoPair(
						path.join(videosDir, files.desktop),
						path.join(videosDir, files.mobile),
						baseName,
						options
					);
					results.push({ name: baseName, ...result });
				} catch (error) {
					console.error(`❌ Erro em ${baseName}:`, error.message);
					results.push({ name: baseName, error: error.message });
				}
			}
		}

		return results;
	}
}

// ==== CLI ====
async function main() {
	const args = process.argv.slice(2);

	if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
		console.log(`
🎬 EXTRATOR DE FRAMES OTIMIZADO PARA SCROLLYFRAMES

Uso:
  node extract-frames.js <desktop.mp4> <mobile.mp4> <nome> [opções]
  node extract-frames.js --list-videos    Lista vídeos em static/videos/
  node extract-frames.js --list           Lista frames já processados
  node extract-frames.js --process-all    Processa todos os vídeos
  node extract-frames.js --responsive <desktop.mp4> <mobile.mp4> <nome>  🆕 NOVO

Opções:
  --fps <n>          FPS (padrão: 15, recomendado: 10-20)
  --quality <n>      Qualidade 0-100 (padrão: 85)
  --desktop-scale    Resolução desktop (padrão: 1920:-2)
  --mobile-scale     Resolução mobile (padrão: 768:-2)
  --responsive       🆕 Gerar múltiplas resoluções responsivas
  --skip <widths>    🆕 Pular resoluções específicas (ex: --skip 2440,300)

🆕 MODO RESPONSIVO:
  Gera 7 resoluções diferentes com controle de tamanho:
  
  Desktop (JPG):
    • 2440px - máx 140KB por frame
    • 1920px - máx 120KB por frame
    • 1440px - máx 90KB por frame
    • 1280px - máx 72KB por frame
  
  Mobile (WebP):
    • 900px - máx 60KB por frame
    • 650px - máx 45KB por frame
    • 300px - máx 40KB por frame

Comandos Especiais:
  --list-videos      Mostra vídeos disponíveis em static/videos/
  --list             Mostra frames já processados
  --process-all      Processa todos os pares de vídeos automaticamente
  --responsive       Processa com múltiplas resoluções

Exemplos:
  # Processar vídeos da pasta static/videos/
  node extract-frames.js static/videos/intro_desktop.mp4 static/videos/intro_mobile.mp4 intro
  
  # Ver vídeos disponíveis
  node extract-frames.js --list-videos
  
  # Processar TODOS os vídeos de uma vez
  node extract-frames.js --process-all --fps 15 --quality 85
  
  # 🆕 MODO RESPONSIVO - Múltiplas resoluções
  node extract-frames.js --responsive desktop.mp4 mobile.mp4 hero
  node extract-frames.js --responsive desktop.mp4 mobile.mp4 hero --skip 2440,300
  
  # Performance máxima (10 fps, qualidade 70%)
  node extract-frames.js desktop.mp4 mobile.mp4 hero --fps 10 --quality 70
  
  # Alta qualidade (20 fps, qualidade 95%)
  node extract-frames.js desktop.mp4 mobile.mp4 hero --fps 20 --quality 95

Organização Recomendada:
  static/videos/
  ├── intro_desktop.mp4    (ou intro_wide.mp4)
  ├── intro_mobile.mp4     (ou intro_vertical.mp4)
  ├── hero_desktop.mp4
  ├── hero_mobile.mp4
  └── ...

Performance vs Qualidade:
  🚀 RÁPIDO:     --fps 10 --quality 70  (recomendado para testes)
  ⚖️  BALANCEADO: --fps 15 --quality 85  (padrão, recomendado)
  🎨 QUALIDADE:  --fps 20 --quality 95  (para produção)
  🎬 CINEMA:     --fps 24 --quality 95  (máxima qualidade)
    `);
		process.exit(0);
	}

	// 🆕 NOVO: Processar com múltiplas resoluções
	if (args[0] === '--responsive') {
		if (args.length < 4) {
			console.error(
				'❌ Uso: node extract-frames.js --responsive <desktop.mp4> <mobile.mp4> <nome>'
			);
			process.exit(1);
		}

		const desktopVideo = args[1];
		const mobileVideo = args[2];
		const videoName = args[3];

		const options = {
			fps: 30,
			skipSizes: [],
			optimizeQuality: true
		};

		// Parse de opções
		const fpsIndex = args.indexOf('--fps');
		if (fpsIndex > -1 && args[fpsIndex + 1]) {
			options.fps = parseInt(args[fpsIndex + 1]);
		}

		const skipIndex = args.indexOf('--skip');
		if (skipIndex > -1 && args[skipIndex + 1]) {
			options.skipSizes = args[skipIndex + 1].split(',').map((w) => parseInt(w));
		}

		const extractor = new FrameExtractor();

		// Verificar ffmpeg
		const hasFFmpeg = await extractor.checkFFmpeg();
		if (!hasFFmpeg) {
			console.error('❌ FFmpeg não encontrado!');
			console.error('   Mac: brew install ffmpeg');
			console.error('   Linux: sudo apt install ffmpeg');
			console.error('   Windows: https://ffmpeg.org/download.html');
			process.exit(1);
		}

		try {
			// Verificar se os vídeos existem
			await fs.access(desktopVideo);
			await fs.access(mobileVideo);

			// Processar com múltiplas resoluções
			await extractor.processVideoResponsive(desktopVideo, mobileVideo, videoName, options);

			console.log('\n✨ Frames responsivos gerados com sucesso!');
			console.log('💡 As múltiplas resoluções otimizam o carregamento para cada dispositivo');
		} catch (error) {
			if (error.code === 'ENOENT') {
				console.error(`❌ Arquivo não encontrado: ${error.path}`);
			} else {
				console.error('\n❌ Falha:', error.message);
			}
			process.exit(1);
		}

		process.exit(0);
	}

	// Listar vídeos disponíveis
	if (args[0] === '--list-videos') {
		const extractor = new FrameExtractor();
		const { videosDir, files, pairs, error } = await extractor.listAvailableVideos();

		if (error) {
			console.log(`❌ ${error}`);
			console.log('\n💡 Crie a pasta: mkdir -p static/videos');
			process.exit(1);
		}

		if (files.length === 0) {
			console.log('📁 Pasta static/videos está vazia.');
			console.log('\n💡 Adicione seus vídeos com nomes como:');
			console.log('   exemplo_desktop.mp4 + exemplo_mobile.mp4');
			console.log('   ou');
			console.log('   exemplo_wide.mp4 + exemplo_vertical.mp4');
			process.exit(0);
		}

		console.log('\n📁 VÍDEOS DISPONÍVEIS EM static/videos/\n');
		console.log('='.repeat(60));

		let pairCount = 0;
		for (const [baseName, files] of pairs) {
			if (files.desktop && files.mobile) {
				pairCount++;
				console.log(`\n✅ ${pairCount}. ${baseName}`);
				console.log(`   Desktop: ${files.desktop}`);
				console.log(`   Mobile:  ${files.mobile}`);
			}
		}

		// Listar vídeos sem par
		console.log('\n' + '-'.repeat(60));
		let orphanCount = 0;
		for (const [baseName, files] of pairs) {
			if (!files.desktop || !files.mobile) {
				orphanCount++;
				if (orphanCount === 1) console.log('\n⚠️  VÍDEOS SEM PAR:');
				console.log(`   ${baseName}:`);
				if (files.desktop) console.log(`     ✓ Desktop: ${files.desktop}`);
				else console.log(`     ✗ Desktop: faltando`);
				if (files.mobile) console.log(`     ✓ Mobile: ${files.mobile}`);
				else console.log(`     ✗ Mobile: faltando`);
				if (files.unknown) console.log(`     ? Arquivo: ${files.unknown} (tipo não identificado)`);
			}
		}

		if (pairCount > 0) {
			console.log('\n' + '='.repeat(60));
			console.log(`\n💡 Para processar todos os ${pairCount} pares:`);
			console.log('   node extract-frames.js --process-all');
			console.log('\n💡 Para processar um específico:');
			console.log(
				'   node extract-frames.js static/videos/[nome]_desktop.mp4 static/videos/[nome]_mobile.mp4 [nome]'
			);
			console.log('\n🆕 Para processar com múltiplas resoluções:');
			console.log(
				'   node extract-frames.js --responsive static/videos/[nome]_desktop.mp4 static/videos/[nome]_mobile.mp4 [nome]'
			);
		}

		process.exit(0);
	}

	// Processar todos os vídeos
	if (args[0] === '--process-all') {
		const extractor = new FrameExtractor();

		// Parse de opções globais
		const options = {
			fps: 30,
			quality: 85
		};

		const fpsIndex = args.indexOf('--fps');
		if (fpsIndex > -1 && args[fpsIndex + 1]) {
			options.fps = parseInt(args[fpsIndex + 1]);
		}

		const qualityIndex = args.indexOf('--quality');
		if (qualityIndex > -1 && args[qualityIndex + 1]) {
			options.quality = parseInt(args[qualityIndex + 1]);
		}

		// Aceitar overrides de scale
		const desktopScaleIndex = args.indexOf('--desktop-scale');
		if (desktopScaleIndex > -1 && args[desktopScaleIndex + 1]) {
			options.desktopScale = args[desktopScaleIndex + 1];
		}
		const mobileScaleIndex = args.indexOf('--mobile-scale');
		if (mobileScaleIndex > -1 && args[mobileScaleIndex + 1]) {
			options.mobileScale = args[mobileScaleIndex + 1];
		}

		console.log('🎬 PROCESSAMENTO EM LOTE');
		console.log(`⚙️  Configuração: ${options.fps} FPS, ${options.quality}% qualidade\n`);

		const results = await extractor.processAllVideos(options);

		if (results.length === 0) {
			console.log('Nenhum par de vídeos para processar.');
			process.exit(0);
		}

		// Resumo final
		console.log('\n' + '='.repeat(60));
		console.log('📊 RESUMO DO PROCESSAMENTO');
		console.log('='.repeat(60));

		const successful = results.filter((r) => !r.error);
		const failed = results.filter((r) => r.error);

		console.log(`\n✅ Sucesso: ${successful.length}`);
		successful.forEach((r) => {
			console.log(`   ${r.name}`);
		});

		if (failed.length > 0) {
			console.log(`\n❌ Falhas: ${failed.length}`);
			failed.forEach((r) => {
				console.log(`   ${r.name}: ${r.error}`);
			});
		}

		console.log('\n✨ Processamento em lote concluído!');
		process.exit(0);
	}

	// Listar processados
	if (args[0] === '--list') {
		const extractor = new FrameExtractor();
		const processed = await extractor.listProcessed();

		if (processed.length === 0) {
			console.log('Nenhum vídeo processado ainda.');
		} else {
			console.log('\n📦 VÍDEOS PROCESSADOS:\n');
			processed.forEach((item, i) => {
				console.log(`${i + 1}. ${item.originalName || item.name}`);
				if (item.desktop) {
					console.log(`   Desktop: ${item.desktop.frameCount} frames`);
					console.log(`   Mobile: ${item.mobile.frameCount} frames`);
					console.log(`   Processado: ${item.processedAt || 'N/A'}`);
				}
				// 🆕 Mostrar se tem versão responsiva
				if (item.responsive) {
					console.log(
						`   🆕 Responsivo: ${item.breakpoints.desktop.length + item.breakpoints.mobile.length} resoluções`
					);
				}
			});
		}
		process.exit(0);
	}

	// Validar argumentos
	if (args.length < 3) {
		console.error('❌ Uso: node extract-frames.js <desktop.mp4> <mobile.mp4> <nome>');
		console.error('   Ou: node extract-frames.js --responsive <desktop.mp4> <mobile.mp4> <nome>');
		process.exit(1);
	}

	const desktopVideo = args[0];
	const mobileVideo = args[1];
	const videoName = args[2];

	// Parse de opções
	const options = {
		fps: 30,
		quality: 85,
		desktopScale: '1920:-2',
		mobileScale: '768:-2'
	};

	// Buscar valores das opções
	const fpsIndex = args.indexOf('--fps');
	if (fpsIndex > -1 && args[fpsIndex + 1]) {
		options.fps = parseInt(args[fpsIndex + 1]);
	}

	const qualityIndex = args.indexOf('--quality');
	if (qualityIndex > -1 && args[qualityIndex + 1]) {
		options.quality = parseInt(args[qualityIndex + 1]);
	}

	const desktopScaleIndex = args.indexOf('--desktop-scale');
	if (desktopScaleIndex > -1 && args[desktopScaleIndex + 1]) {
		options.desktopScale = args[desktopScaleIndex + 1];
	}

	const mobileScaleIndex = args.indexOf('--mobile-scale');
	if (mobileScaleIndex > -1 && args[mobileScaleIndex + 1]) {
		options.mobileScale = args[mobileScaleIndex + 1];
	}

	// Executar
	const extractor = new FrameExtractor();

	// Verificar ffmpeg
	const hasFFmpeg = await extractor.checkFFmpeg();
	if (!hasFFmpeg) {
		console.error('❌ FFmpeg não encontrado!');
		console.error('   Mac: brew install ffmpeg');
		console.error('   Linux: sudo apt install ffmpeg');
		console.error('   Windows: https://ffmpeg.org/download.html');
		process.exit(1);
	}

	try {
		// Verificar se os vídeos existem
		try {
			await fs.access(desktopVideo);
		} catch {
			console.error(`❌ Vídeo desktop não encontrado: ${desktopVideo}`);
			process.exit(1);
		}

		try {
			await fs.access(mobileVideo);
		} catch {
			console.error(`❌ Vídeo mobile não encontrado: ${mobileVideo}`);
			process.exit(1);
		}

		// Processar
		await extractor.processVideoPair(desktopVideo, mobileVideo, videoName, options);

		console.log('\n✨ Pronto! Frames extraídos com sucesso.');
		console.log('💡 Use as configurações acima no seu componente ScrollyFrames');
		console.log('\n🆕 Para gerar múltiplas resoluções, use:');
		console.log(
			`   node extract-frames.js --responsive ${desktopVideo} ${mobileVideo} ${videoName}`
		);
	} catch (error) {
		console.error('\n❌ Falha:', error.message);
		process.exit(1);
	}
}

// Executar se chamado diretamente
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main();
}

// Exportar classe
export default FrameExtractor;
