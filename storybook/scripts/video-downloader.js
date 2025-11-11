// scripts/video-downloader.js - Download Automático de Vídeos
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

/**
 * Classe para download de vídeos de URLs
 */
export class VideoDownloader {
	constructor(options = {}) {
		this.outputDir = options.outputDir || 'static/videos';
		this.maxFileSize = options.maxFileSize || 500 * 1024 * 1024; // 500MB
		this.timeout = options.timeout || 300000; // 5 minutos
	}

	/**
	 * Download de vídeo único
	 */
	async downloadVideo(url, filename = null) {
		// Criar diretório de saída
		await fs.mkdir(this.outputDir, { recursive: true });

		// Gerar nome do arquivo se não fornecido
		if (!filename) {
			const urlPath = new URL(url).pathname;
			filename = path.basename(urlPath) || `video_${Date.now()}.mp4`;
		}

		// Garantir extensão .mp4
		if (!filename.toLowerCase().endsWith('.mp4')) {
			filename += '.mp4';
		}

		const outputPath = path.join(this.outputDir, filename);

		console.log(`📥 Baixando: ${url}`);
		console.log(`💾 Destino: ${outputPath}`);

		try {
			// Fazer request inicial para verificar tamanho
			const response = await fetch(url, {
				method: 'HEAD',
				timeout: this.timeout
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const contentLength = parseInt(response.headers.get('content-length') || '0');
			const contentType = response.headers.get('content-type') || '';

			console.log(`📊 Tamanho: ${this.formatSize(contentLength)}`);
			console.log(`🎬 Tipo: ${contentType}`);

			// Verificar tamanho
			if (contentLength > this.maxFileSize) {
				throw new Error(
					`Arquivo muito grande: ${this.formatSize(contentLength)} > ${this.formatSize(this.maxFileSize)}`
				);
			}

			// Verificar se é vídeo
			if (!contentType.includes('video') && !contentType.includes('mp4')) {
				console.warn(`⚠️ Tipo de arquivo suspeito: ${contentType}`);
			}

			// Download real
			const downloadResponse = await fetch(url, { timeout: this.timeout });

			if (!downloadResponse.ok) {
				throw new Error(`HTTP ${downloadResponse.status}: ${downloadResponse.statusText}`);
			}

			// Fazer download com stream
			await pipeline(downloadResponse.body, createWriteStream(outputPath));

			// Verificar se arquivo foi criado
			const stats = await fs.stat(outputPath);
			console.log(`✅ Download concluído: ${this.formatSize(stats.size)}`);

			return {
				url,
				filename,
				outputPath,
				size: stats.size,
				success: true
			};
		} catch (error) {
			console.error(`❌ Erro no download:`, error.message);

			// Limpar arquivo parcial se existir
			try {
				await fs.unlink(outputPath);
			} catch {
				// Ignorar erro de limpeza
			}

			throw error;
		}
	}

	/**
	 * Processar documento JSON e baixar todos os vídeos de VideoScrollytelling
	 */
	async processDocument(docPath) {
		console.log(`📖 Processando documento: ${docPath}`);

		const docContent = await fs.readFile(docPath, 'utf8');
		const doc = JSON.parse(docContent);

		// Encontrar componentes VideoScrollytelling
		const videoScrollyComponents =
			doc.paragraphs?.filter((p) =>
				['videoscrollytelling', 'video-scrollytelling', 'videoscrolly', 'video-scrolly'].includes(
					p.type?.toLowerCase()
				)
			) || [];

		if (videoScrollyComponents.length === 0) {
			console.log('⚠️ Nenhum componente VideoScrollytelling encontrado');
			return [];
		}

		console.log(`🎥 Encontrados ${videoScrollyComponents.length} componentes VideoScrollytelling`);

		const downloads = [];

		for (let i = 0; i < videoScrollyComponents.length; i++) {
			const component = videoScrollyComponents[i];

			console.log(`\n🔄 Processando VideoScrolly ${i + 1}/${videoScrollyComponents.length}`);

			// Download vídeo principal
			if (component.videoSrc && this.isUrl(component.videoSrc)) {
				try {
					const filename = `videoscrolly_${i + 1}_main.mp4`;
					const result = await this.downloadVideo(component.videoSrc, filename);

					// Atualizar componente com path local
					component.videoSrc = `videos/${filename}`;

					downloads.push({
						...result,
						componentIndex: i,
						type: 'main'
					});
				} catch (error) {
					console.error(`❌ Erro no download do vídeo principal:`, error.message);
				}
			}

			// Download vídeo mobile
			if (component.videoSrcMobile && this.isUrl(component.videoSrcMobile)) {
				try {
					const filename = `videoscrolly_${i + 1}_mobile.mp4`;
					const result = await this.downloadVideo(component.videoSrcMobile, filename);

					// Atualizar componente com path local
					component.videoSrcMobile = `videos/${filename}`;

					downloads.push({
						...result,
						componentIndex: i,
						type: 'mobile'
					});
				} catch (error) {
					console.error(`❌ Erro no download do vídeo mobile:`, error.message);
				}
			}
		}

		// Salvar documento atualizado com paths locais
		if (downloads.length > 0) {
			await fs.writeFile(docPath, JSON.stringify(doc, null, 2));
			console.log(`\n✅ Documento atualizado com paths locais`);
		}

		return downloads;
	}

	/**
	 * Verificar se string é URL
	 */
	isUrl(str) {
		try {
			new URL(str);
			return str.startsWith('http');
		} catch {
			return false;
		}
	}

	/**
	 * Formatar tamanho em bytes
	 */
	formatSize(bytes) {
		const sizes = ['B', 'KB', 'MB', 'GB'];
		if (bytes === 0) return '0 B';
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
	}

	/**
	 * Limpar vídeos baixados
	 */
	async cleanVideos(pattern = 'videoscrolly_') {
		try {
			const files = await fs.readdir(this.outputDir);
			const toDelete = files.filter((f) => f.includes(pattern));

			for (const file of toDelete) {
				await fs.unlink(path.join(this.outputDir, file));
			}

			console.log(`🧹 Removidos ${toDelete.length} vídeos`);
		} catch (error) {
			console.warn('⚠️ Erro ao limpar vídeos:', error.message);
		}
	}

	/**
	 * Listar vídeos baixados
	 */
	async listVideos() {
		try {
			const files = await fs.readdir(this.outputDir);
			const videoFiles = files.filter((f) => f.endsWith('.mp4'));

			console.log(`📁 Vídeos em ${this.outputDir}:`);

			for (const file of videoFiles) {
				const filePath = path.join(this.outputDir, file);
				const stats = await fs.stat(filePath);
				console.log(`  📹 ${file} - ${this.formatSize(stats.size)}`);
			}

			return videoFiles;
		} catch (error) {
			console.error('❌ Erro ao listar vídeos:', error.message);
			return [];
		}
	}
}

// CLI
async function main() {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.log(`
📥 Video Downloader para VideoScrollytelling

Uso:
  node video-downloader.js <documento.json>
  node video-downloader.js --url <url> [filename]
  node video-downloader.js --list
  node video-downloader.js --clean

Exemplos:
  node video-downloader.js story.json
  node video-downloader.js --url https://example.com/video.mp4 my-video.mp4
  node video-downloader.js --list
  node video-downloader.js --clean
    `);
		process.exit(1);
	}

	try {
		const downloader = new VideoDownloader();

		if (args[0] === '--url') {
			// Download de URL específica
			const url = args[1];
			const filename = args[2];

			if (!url) throw new Error('Especifique a URL do vídeo');

			await downloader.downloadVideo(url, filename);
		} else if (args[0] === '--list') {
			// Listar vídeos
			await downloader.listVideos();
		} else if (args[0] === '--clean') {
			// Limpar vídeos
			await downloader.cleanVideos();
		} else {
			// Processar documento
			const docPath = args[0];
			const downloads = await downloader.processDocument(docPath);

			console.log(`\n✅ Downloads concluídos: ${downloads.length}`);
			downloads.forEach((d) => {
				console.log(`  📹 ${d.filename} - ${downloader.formatSize(d.size)}`);
			});
		}
	} catch (error) {
		console.error('❌ Erro:', error.message);
		process.exit(1);
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
