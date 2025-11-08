import {
	validateResponsiveMediaComponent,
	isResponsiveMediaComponent
} from '../src/lib/utils/storyRenderer.js';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchGoogleDoc(docId) {
	console.log('📥 Baixando documento...');

	try {
		const url = `https://docs.google.com/document/d/${docId}/export?format=html`;
		const response = await axios.get(url);

		if (response.status !== 200) {
			throw new Error('Documento não encontrado. Verifique se está público.');
		}

		let rawHtml = response.data.trim();

		const data = parseHTMLFormat(rawHtml);

		if (!data.title) {
			console.warn(
				'⚠️  Aviso: O campo "title" não foi encontrado nos metadados do topo. O sistema irá procurar por um componente `type: header` nos parágrafos.'
			);
		}

		if (!data.slug) {
			data.slug = (data.title || `doc-${Date.now()}`)
				.toLowerCase()
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.replace(/[^a-z0-9\s-]/g, '')
				.replace(/\s+/g, '-')
				.substring(0, 50);
		}

		const outputDir = path.join(__dirname, '../static/data');
		await fs.mkdir(outputDir, { recursive: true });

		const filename = `${data.slug}.json`;
		const filepath = path.join(outputDir, filename);

		await fs.writeFile(filepath, JSON.stringify(data, null, 2));

		console.log(`\n✅ Sucesso! Arquivo salvo: ${filename}`);
		console.log(`📝 Título: ${data.title}`);
		console.log(`📊 Intro: ${data.intro ? 'OK' : 'Vazio'}`);
		console.log(`📊 Paragraphs: ${data.paragraphs ? data.paragraphs.length : 0} itens`);
		console.log(`📝 Créditos: ${data.credits ? 'OK' : 'Vazio'}`);

		// ScrollyTelling tradicional
		const scrollyComponents =
			data.paragraphs?.filter((p) =>
				['scrollytelling', 'scrolly'].includes(p.type?.toLowerCase())
			) || [];

		if (scrollyComponents.length > 0) {
			console.log(`📜 ScrollyTelling encontrados: ${scrollyComponents.length}`);
			scrollyComponents.forEach((comp, index) => {
				const stepsCount = comp.steps?.length || 0;
				console.log(
					`  ${index + 1}. Steps: ${stepsCount} | FullWidth: ${comp.fullWidth || 'false'}`
				);
				if (stepsCount === 0) {
					console.warn(`⚠️ ScrollyTelling sem steps: ${comp.text?.substring(0, 50)}...`);
				} else {
					comp.steps.forEach((step, stepIndex) => {
						// 🔧 LOG CORRIGIDO - AGORA MOSTRA MOBILE TAMBÉM
						const hasImage = !!step.image;
						const hasImageMobile = !!step.imageMobile;
						const hasVideo = !!step.video;
						const hasVideoMobile = !!step.videoMobile;

						console.log(`     Step ${stepIndex + 1}: "${step.title?.substring(0, 30)}..."`);
						console.log(
							`        Desktop - Imagem: ${hasImage ? '✅' : '❌'} | Vídeo: ${hasVideo ? '✅' : '❌'}`
						);
						console.log(
							`        Mobile  - Imagem: ${hasImageMobile ? '✅' : '❌'} | Vídeo: ${hasVideoMobile ? '✅' : '❌'}`
						);
					});
				}
			});
		}

		// 🎨 RESPONSIVE MEDIA LAYOUT
		const responsiveMediaComponents =
			data.paragraphs?.filter((p) =>
				[
					'responsive-media',
					'responsivemedia',
					'responsive-layout',
					'media-layout',
					'flexible-layout'
				].includes(p.type?.toLowerCase())
			) || [];

		if (responsiveMediaComponents.length > 0) {
			console.log(`🎨 Responsive Media Layout encontrados: ${responsiveMediaComponents.length}`);
			responsiveMediaComponents.forEach((comp, index) => {
				const textosCount = comp.textos?.length || comp.texts?.length || 0;
				const imagensCount = comp.imagens?.length || comp.images?.length || 0;
				const backgroundType = comp.backgroundType || 'color';
				const heightDesktop = comp.heightDesktop || comp.height || '100vh';
				const heightMobile = comp.heightMobile || comp.height || '100vh';

				console.log(
					`  ${index + 1}. Textos: ${textosCount} | Imagens: ${imagensCount} | Background: ${backgroundType} | Height: ${heightDesktop}/${heightMobile}`
				);

				if (textosCount === 0 && imagensCount === 0) {
					console.warn(`⚠️ Responsive Media Layout vazio: ${comp.text?.substring(0, 50)}...`);
				} else {
					// Log dos textos
					if (textosCount > 0) {
						const textos = comp.textos || comp.texts || [];
						textos.forEach((texto, textoIndex) => {
							const content = (texto.content || texto.texto || '').substring(0, 30);
							const hasPosition = !!(texto.xDesktop || texto.position?.desktop?.x);
							const fontFamily = texto.fontFamily || texto.familia || 'inherit';
							const fontSize = texto.fontSizeDesktop || texto.fontSize?.desktop || '2rem';
							console.log(
								`     Texto ${textoIndex + 1}: "${content}..." | Font: ${fontFamily}/${fontSize} | HasPosition: ${hasPosition}`
							);
						});
					}

					// Log das imagens
					if (imagensCount > 0) {
						const imagens = comp.imagens || comp.images || [];
						imagens.forEach((imagem, imagemIndex) => {
							const hasSrcDesktop = !!(imagem.srcDesktop || imagem.src);
							const hasSrcMobile = !!imagem.srcMobile;
							const hasPosition = !!(imagem.xDesktop || imagem.position?.desktop?.x);
							const width = imagem.widthDesktop || imagem.width?.desktop || 'auto';
							console.log(
								`     Imagem ${imagemIndex + 1}: Desktop: ${hasSrcDesktop} | Mobile: ${hasSrcMobile} | Width: ${width} | HasPosition: ${hasPosition}`
							);
						});
					}
				}
			});
		}

		// 🆕 ScrollyFrames (novo)
		const scrollyFramesComponents =
			data.paragraphs?.filter((p) => p.type?.toLowerCase() === 'scrollyframes') || [];

		if (scrollyFramesComponents.length > 0) {
			console.log(`🎬 ScrollyFrames encontrados: ${scrollyFramesComponents.length}`);
			scrollyFramesComponents.forEach((comp, index) => {
				const stepsCount = comp.steps?.length || 0;
				console.log(
					`  ${index + 1}. Frames: ${comp.frameStart || 1}-${comp.frameStop || 'N/A'} | Steps: ${stepsCount}`
				);
				console.log(
					`     Prefix: ${comp.imagePrefix ? '✅' : '❌'} | Mobile: ${comp.imagePrefixMobile ? '✅' : '❌'}`
				);
				console.log(
					`     Progress: ${comp.showProgress !== false} | Time: ${comp.showTime !== false}`
				);
				if (stepsCount > 0) {
					comp.steps.forEach((step, stepIndex) => {
						console.log(
							`     Step ${stepIndex + 1}: "${step.title?.substring(0, 30)}..." | Frames: ${step.startFrame}-${step.endFrame}`
						);
					});
				}
			});
		}

		// VideoScrollyTelling
		const videoScrollyComponents =
			data.paragraphs?.filter((p) =>
				['videoscrollytelling', 'video-scrollytelling', 'videoscrolly', 'video-scrolly'].includes(
					p.type?.toLowerCase()
				)
			) || [];

		if (videoScrollyComponents.length > 0) {
			console.log(`🎥 VideoScrollyTelling encontrados: ${videoScrollyComponents.length}`);
			videoScrollyComponents.forEach((comp, index) => {
				const stepsCount = comp.steps?.length || 0;
				console.log(
					`  ${index + 1}. Steps: ${stepsCount} | VideoSrc: ${!!comp.videoSrc || !!comp.src} | Mobile: ${!!comp.videoSrcMobile || !!comp.srcMobile}`
				);
				if (stepsCount === 0) {
					console.warn(`⚠️ VideoScrollyTelling sem steps: ${comp.text?.substring(0, 50)}...`);
				} else {
					comp.steps.forEach((step, stepIndex) => {
						console.log(
							`     Step ${stepIndex + 1}: "${step.title?.substring(0, 30)}..." | Time: ${step.time}s`
						);
					});
				}
			});
		}

		// 🎬 NOVO: Apresentação de Personagens
		const characterComponents =
			data.paragraphs?.filter((p) =>
				[
					'personagens',
					'characters',
					'character-presentation',
					'apresentacao-personagens'
				].includes(p.type?.toLowerCase())
			) || [];

		if (characterComponents.length > 0) {
			console.log(`🎭 Apresentação de Personagens encontrados: ${characterComponents.length}`);
			characterComponents.forEach((comp, index) => {
				const charCount =
					comp.personagens?.length || comp.characters?.length || comp.lista?.length || 0;
				console.log(
					`  ${index + 1}. Personagens: ${charCount} | ShapeColor: ${comp.shapeColor || '#DC2626'}`
				);
				if (charCount > 0) {
					const chars = comp.personagens || comp.characters || comp.lista || [];
					chars.forEach((char, charIndex) => {
						console.log(
							`     Personagem ${charIndex + 1}: "${char.nome || char.name}" | Foto: ${!!char.foto || !!char.photo} | Descrição: ${(char.descricao || char.description || '').substring(0, 50)}...`
						);
					});
				}
			});
		}
		// 🎯 NOVO: Curiosidades - ADICIONAR após o bloco de Apresentação de Personagens
		const curiosidadesComponents =
			data.paragraphs?.filter((p) =>
				['curiosidades', 'trivia', 'facts', 'apresentacao-curiosidades'].includes(
					p.type?.toLowerCase()
				)
			) || [];

		if (curiosidadesComponents.length > 0) {
			console.log(`🎯 Curiosidades encontrados: ${curiosidadesComponents.length}`);
			curiosidadesComponents.forEach((comp, index) => {
				const charCount =
					comp.personagens?.length || comp.characters?.length || comp.lista?.length || 0;
				console.log(
					`  ${index + 1}. Curiosidades: ${charCount} | ShapeColor: ${comp.shapeColor || '#b51207'} | QuoteColor: ${comp.quoteColor || '#ffd700'}`
				);
				if (charCount > 0) {
					const chars = comp.personagens || comp.characters || comp.lista || [];
					chars.forEach((char, charIndex) => {
						const temFrase = !!(char.frase || char.quote || char.phrase);
						console.log(
							`     Curiosidade ${charIndex + 1}: "${char.nome || char.name}" | Foto: ${!!char.foto || !!char.photo} | Frase: ${temFrase ? '✅' : '❌'} | Descrição: ${(char.descricao || char.description || '').substring(0, 50)}...`
						);
					});
				}
			});
		}

		// 🆕 NOVO: Itens Recomendados
		const recommendedComponents =
			data.paragraphs?.filter((p) =>
				[
					'recomendados',
					'recommended',
					'recommended-items',
					'itens-recomendados',
					'relacionados',
					'conteudos-relacionados'
				].includes(p.type?.toLowerCase())
			) || [];

		if (recommendedComponents.length > 0) {
			console.log(`🎯 Itens Recomendados encontrados: ${recommendedComponents.length}`);
			recommendedComponents.forEach((comp, index) => {
				const itemsCount = comp.items?.length || comp.itens?.length || 0;
				const layout = comp.layout || 'grid';
				const columns = comp.columns || comp.colunas || 5;
				const title = comp.title || comp.titulo || 'conteúdos relacionados';
				const backgroundColor = comp.backgroundColor || comp.corFundo || '#000000';
				const titleColor = comp.titleColor || comp.corTitulo || '#ff0000';

				console.log(
					`  ${index + 1}. Items: ${itemsCount} | Layout: ${layout} | Columns: ${columns} | Title: "${title}"`
				);
				console.log(`     Colors: BG=${backgroundColor} | Title=${titleColor}`);

				if (itemsCount === 0) {
					console.warn(`⚠️ Itens Recomendados sem items: ${comp.text?.substring(0, 50)}...`);
				} else {
					const items = comp.items || comp.itens || [];
					items.forEach((item, itemIndex) => {
						const itemTitle = item.title || item.titulo || item.nome || 'Sem título';
						const hasImage = !!(item.image || item.imagem || item.img || item.foto);
						const hasLink = !!(item.link || item.url);
						const category = item.category || item.categoria || '';
						const isNew = item.isNew || item.novo || item.new || false;

						console.log(
							`     Item ${itemIndex + 1}: "${itemTitle.substring(0, 30)}..." | Image: ${hasImage} | Link: ${hasLink} | Category: ${category} | New: ${isNew}`
						);
					});
				}
			});
		}

		// 🆕 NOVOS COMPONENTES - TIMELINE INTERACTIVE
		const timelineComponents =
			data.paragraphs?.filter((p) =>
				['timeline-interactive', 'timeline', 'cronologia', 'cronologia-interativa'].includes(
					p.type?.toLowerCase()
				)
			) || [];

		if (timelineComponents.length > 0) {
			console.log(`🕐 Timeline Interactive encontrados: ${timelineComponents.length}`);
			timelineComponents.forEach((comp, index) => {
				const eventsCount = comp.events?.length || 0;
				const theme = comp.theme || 'dramatic';
				const autoAdvance = comp.autoAdvance || false;
				const showProgress = comp.showProgress !== false;

				console.log(
					`  ${index + 1}. Events: ${eventsCount} | Theme: ${theme} | AutoAdvance: ${autoAdvance} | Progress: ${showProgress}`
				);

				if (eventsCount === 0) {
					console.warn(`⚠️ Timeline Interactive sem events: ${comp.text?.substring(0, 50)}...`);
				} else {
					comp.events.forEach((event, eventIndex) => {
						const eventTitle = event.title || 'Sem título';
						const hasImage = !!event.image;
						const hasVideo = !!event.video;
						const severity = event.severity || 'medium';

						console.log(
							`     Event ${eventIndex + 1}: "${eventTitle.substring(0, 30)}..." | Date: ${event.date} | Image: ${hasImage} | Video: ${hasVideo} | Severity: ${severity}`
						);
					});
				}
			});
		}

		// 🆕 NOVOS COMPONENTES - DOCUMENT VIEWER
		const documentComponents =
			data.paragraphs?.filter((p) =>
				['document-viewer', 'documents', 'docs', 'visualizador-documentos'].includes(
					p.type?.toLowerCase()
				)
			) || [];

		if (documentComponents.length > 0) {
			console.log(`📄 Document Viewer encontrados: ${documentComponents.length}`);
			documentComponents.forEach((comp, index) => {
				const docsCount = comp.documents?.length || 0;
				const classification = comp.classification || 'CONFIDENCIAL';
				const theme = comp.theme || 'investigative';
				const showWatermark = comp.showWatermark !== false;
				const highlightAreasCount = comp.highlightAreas?.length || 0;

				console.log(
					`  ${index + 1}. Documents: ${docsCount} | Classification: ${classification} | Theme: ${theme} | Watermark: ${showWatermark} | Highlights: ${highlightAreasCount}`
				);

				if (docsCount === 0) {
					console.warn(`⚠️ Document Viewer sem documents: ${comp.text?.substring(0, 50)}...`);
				} else {
					comp.documents.forEach((doc, docIndex) => {
						const docTitle = doc.title || 'Sem título';
						const hasImage = !!doc.image;
						const hasThumbnail = !!doc.thumbnail;

						console.log(
							`     Doc ${docIndex + 1}: "${docTitle.substring(0, 30)}..." | Date: ${doc.date} | Image: ${hasImage} | Thumbnail: ${hasThumbnail}`
						);
					});
				}
			});
		}

		// 🆕 NOVOS COMPONENTES - CRIME EXPLAINER
		const crimeComponents =
			data.paragraphs?.filter((p) =>
				['crime-explainer', 'crimes', 'explicador-crimes', 'crimes-explicacao'].includes(
					p.type?.toLowerCase()
				)
			) || [];

		if (crimeComponents.length > 0) {
			console.log(`⚖️ Crime Explainer encontrados: ${crimeComponents.length}`);
			crimeComponents.forEach((comp, index) => {
				const crimesCount = comp.crimes?.length || 0;
				const theme = comp.theme || 'judicial';
				const interactive = comp.interactive !== false;
				const showPenalties = comp.showPenalties !== false;
				const layout = comp.layout || 'cards';

				console.log(
					`  ${index + 1}. Crimes: ${crimesCount} | Theme: ${theme} | Interactive: ${interactive} | Penalties: ${showPenalties} | Layout: ${layout}`
				);

				if (crimesCount === 0) {
					console.warn(`⚠️ Crime Explainer sem crimes: ${comp.text?.substring(0, 50)}...`);
				} else {
					comp.crimes.forEach((crime, crimeIndex) => {
						const crimeName = crime.name || 'Sem nome';
						const legalBase = crime.legalBase || 'N/A';
						const penaltyMin = crime.penaltyMin || 0;
						const penaltyMax = crime.penaltyMax || 0;
						const canBeArrested = crime.canBeArrested !== undefined ? crime.canBeArrested : true;

						console.log(
							`     Crime ${crimeIndex + 1}: "${crimeName.substring(0, 30)}..." | Base: ${legalBase} | Pena: ${penaltyMin}-${penaltyMax} anos | Prisão: ${canBeArrested}`
						);
					});
				}
			});
		}

		// 🌪️ NOVO: Header Caótico
		const chaoticComponents =
			data.paragraphs?.filter((p) =>
				['header-caotico', 'header-caótico', 'caotico', 'chaotic-header', 'caos'].includes(
					p.type?.toLowerCase()
				)
			) || [];

		if (chaoticComponents.length > 0) {
			console.log(`🌪️ Header Caótico encontrados: ${chaoticComponents.length}`);
			chaoticComponents.forEach((comp, index) => {
				const mediasCount = comp.medias?.length || 0;
				const title = comp.title || 'HEADER CAÓTICO';
				const subtitle = comp.subtitle || '40 mídias se movimentando dinamicamente';
				const shuffleInterval = comp.shuffleInterval || 3000;
				const animationDelay = comp.animationDelay || 100;
				const backgroundColor = comp.backgroundColor || '#1a1a1a';

				console.log(`  ${index + 1}. Title: "${title}" | Subtitle: "${subtitle}"`);
				console.log(
					`     Mídias customizadas: ${mediasCount > 0 ? mediasCount : 'Usando padrão (40)'} | Shuffle: ${shuffleInterval}ms | Delay: ${animationDelay}ms`
				);
				console.log(`     Background: ${backgroundColor}`);

				if (mediasCount === 0) {
					console.log(`     ℹ️ Usando 40 mídias padrão (2 vídeos + 38 imagens aleatórias)`);
				} else {
					comp.medias.forEach((media, mediaIndex) => {
						const mediaType = media.type || 'image';
						const mediaSrc = media.src || 'N/A';
						console.log(
							`     Mídia ${mediaIndex + 1}: ${mediaType} | Src: ${mediaSrc.substring(0, 50)}...`
						);
					});
				}
			});
		}

		return data;
	} catch (error) {
		console.error(`❌ Erro: ${error.message}`);
		process.exit(1);
	}
}

function parseHTMLFormat(html) {
	html = html.replace(/<style[^>]*>.*?<\/style>/gs, '');
	html = html.replace(/<script[^>]*>.*?<\/script>/gs, '');
	html = html.replace(/<head[^>]*>.*?<\/head>/gs, '');

	const data = {};
	let allBlocks = [];

	// 1. Pega todo o conteúdo do body para análise
	const bodyContentMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/s);
	if (!bodyContentMatch) {
		console.warn('⚠️ Tag <body> não encontrada. Analisando o HTML completo.');
		bodyContentMatch = [null, html];
	}
	let bodyContent = bodyContentMatch[1];

	// 2. Separa os blocos estruturados ([+...]) do conteúdo solto
	const blockRegex = /\[(?:\+)?(paragraphs|intro|credits)\]([\s\S]*?)\[\1\]/gs;

	const potentialMetaContent = bodyContent.replace(blockRegex, '').trim();
	const blocks = [...bodyContent.matchAll(blockRegex)];

	// 3. Adiciona o conteúdo solto (que deve ser seu header principal) à lista para ser parseado
	if (potentialMetaContent) {
		allBlocks.push(...parseParagraphsHTML(potentialMetaContent));
	}

	// 4. Adiciona o conteúdo dos blocos estruturados na ordem em que aparecem
	blocks.forEach((blockMatch) => {
		const blockType = blockMatch[1];
		const blockContent = blockMatch[2];

		if (blockType === 'paragraphs') {
			allBlocks.push(...parseParagraphsHTML(blockContent));
		} else if (blockType === 'intro') {
			const introData = parseIntroHTML(blockContent);
			if (introData.text) {
				allBlocks.push({ type: 'intro', ...introData });
			}
		} else if (blockType === 'credits') {
			data.credits = parseCreditsHTML(blockContent);
		}
	});

	// 5. Encontra o PRIMEIRO 'type: header' na lista de todos os blocos
	const mainHeaderIndex = allBlocks.findIndex(
		(block) => block.type && block.type.toLowerCase() === 'header'
	);

	if (mainHeaderIndex !== -1) {
		// 6. Tira ele da lista e usa para os metadados principais (data.title, etc.)
		const [mainHeader] = allBlocks.splice(mainHeaderIndex, 1);
		Object.assign(data, mainHeader);
	} else {
		// Se não achar um header, usa a lógica antiga como fallback para pegar pelo menos o título
		console.warn('⚠️ Nenhum bloco `type: header` encontrado. Usando fallback para metadados.');
		const titleMatch = html.match(/title:\s*([^<\n]+)/i);
		if (titleMatch) data.title = decodeHTMLEntities(titleMatch[1].trim());
	}

	// 7. O que sobrou na lista vira o `paragraphs` do JSON
	data.paragraphs = allBlocks;

	const introIndex = data.paragraphs.findIndex((p) => p.type === 'intro');
	if (introIndex !== -1) {
		const [introBlock] = data.paragraphs.splice(introIndex, 1);
		data.intro = { text: introBlock.text };
	}

	return data;
}

function parseIntroHTML(html) {
	const intro = {};
	const introTextMatch = html.match(/text:\s*([\s\S]*?)(?=\[intro\]|$)/);
	if (introTextMatch) {
		intro.text = cleanAndFormatHTML(introTextMatch[1]);
	}
	return intro;
}

function decodeHTMLEntities(text) {
	if (!text) return '';

	// Mapa completo de entidades HTML incluindo aspas especiais e caracteres especiais
	const entities = {
		// Básicas
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&#39;': "'",
		'&nbsp;': ' ',

		// 🔧 ADICIONADO: Ordinais (masculino e feminino)
		'&ordf;': 'ª', // Símbolo ordinal feminino (1ª, 2ª, etc.)
		'&ordm;': 'º', // Símbolo ordinal masculino (1º, 2º, etc.)

		// Aspas e citações - PROBLEMA PRINCIPAL
		'&lsquo;': "'",
		'&rsquo;': "'",
		'&ldquo;': '"',
		'&rdquo;': '"',
		'&laquo;': '«',
		'&raquo;': '»',
		'&sbquo;': '‚',
		'&bdquo;': '„',
		'&#8216;': "'",
		'&#8217;': "'",
		'&#8218;': '‚',
		'&#8220;': '"',
		'&#8221;': '"',
		'&#8222;': '„',
		'&#8249;': '‹',
		'&#8250;': '›',

		// Acentos portugueses
		'&aacute;': 'á',
		'&agrave;': 'à',
		'&acirc;': 'â',
		'&atilde;': 'ã',
		'&auml;': 'ä',
		'&aring;': 'å',
		'&eacute;': 'é',
		'&egrave;': 'è',
		'&ecirc;': 'ê',
		'&euml;': 'ë',
		'&iacute;': 'í',
		'&igrave;': 'ì',
		'&icirc;': 'î',
		'&iuml;': 'ï',
		'&oacute;': 'ó',
		'&ograve;': 'ò',
		'&ocirc;': 'ô',
		'&otilde;': 'õ',
		'&ouml;': 'ö',
		'&uacute;': 'ú',
		'&ugrave;': 'ù',
		'&ucirc;': 'û',
		'&uuml;': 'ü',
		'&ccedil;': 'ç',
		'&ntilde;': 'ñ',

		// Maiúsculas acentuadas
		'&Aacute;': 'Á',
		'&Agrave;': 'À',
		'&Acirc;': 'Â',
		'&Atilde;': 'Ã',
		'&Auml;': 'Ä',
		'&Eacute;': 'É',
		'&Egrave;': 'È',
		'&Ecirc;': 'Ê',
		'&Euml;': 'Ë',
		'&Iacute;': 'Í',
		'&Igrave;': 'Ì',
		'&Icirc;': 'Î',
		'&Iuml;': 'Ï',
		'&Oacute;': 'Ó',
		'&Ograve;': 'Ò',
		'&Ocirc;': 'Ô',
		'&Otilde;': 'Õ',
		'&Ouml;': 'Ö',
		'&Uacute;': 'Ú',
		'&Ugrave;': 'Ù',
		'&Ucirc;': 'Û',
		'&Uuml;': 'Ü',
		'&Ccedil;': 'Ç',
		'&Ntilde;': 'Ñ',

		// Símbolos matemáticos e especiais comuns
		'&frac12;': '½',
		'&frac14;': '¼',
		'&frac34;': '¾',
		'&sup1;': '¹',
		'&sup2;': '²',
		'&sup3;': '³',
		'&plusmn;': '±',
		'&times;': '×',
		'&divide;': '÷',
		'&sect;': '§',
		'&para;': '¶',
		'&micro;': 'µ',

		// Outros símbolos comuns
		'&mdash;': '—',
		'&ndash;': '–',
		'&hellip;': '…',
		'&middot;': '·',
		'&bull;': '•',
		'&dagger;': '†',
		'&Dagger;': '‡',
		'&permil;': '‰',
		'&prime;': '′',
		'&Prime;': '″',
		'&lsaquo;': '‹',
		'&rsaquo;': '›',
		'&copy;': '©',
		'&reg;': '®',
		'&trade;': '™',
		'&deg;': '°'
	};

	// Primeiro, aplica o mapa de entidades conhecidas
	let decoded = text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => entities[entity] || entity);

	// Em seguida, tenta decodificar entidades numéricas que possam ter sobrado
	decoded = decoded.replace(/&#(\d+);/g, (match, num) => {
		try {
			return String.fromCharCode(parseInt(num, 10));
		} catch (e) {
			return match; // Se falhar, mantém o original
		}
	});

	// Por último, tenta decodificar entidades hexadecimais
	decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
		try {
			return String.fromCharCode(parseInt(hex, 16));
		} catch (e) {
			return match; // Se falhar, mantém o original
		}
	});

	return decoded;
}

// ==================================================================
// ✅ FUNÇÃO SUBSTITUÍDA: Versão mais inteligente para parsear JSON
// ==================================================================
function parseJSONField(jsonString, fieldName) {
	if (!jsonString) return null;

	// 1. Limpeza inicial de HTML, quebras de linha e espaços extras
	let cleanedString = jsonString
		.replace(/<[^>]*>/g, '')
		.replace(/(\r\n|\n|\r)/gm, ' ')
		.replace(/\s{2,}/g, ' ')
		.trim();

	// 2. Decodifica TODAS as entidades HTML para caracteres reais
	cleanedString = decodeHTMLEntities(cleanedString);

	// 3. ✅ CORREÇÃO CRUCIAL: Normaliza todas as aspas para o padrão JSON
	cleanedString = cleanedString.replace(/[“”«»„‟‶‷″‟‹›]/g, '"');
	cleanedString = cleanedString.replace(/[‘’‚‛‹›]/g, "'");

	// 4. Tenta o parse. Se falhar, é por causa de aspas dentro do conteúdo.
	try {
		const validJsonString = cleanedString.replace(/,\s*([}\]])/g, '$1');
		const parsed = JSON.parse(validJsonString);

		// 🔧 VALIDAÇÃO ESPECÍFICA PARA STEPS DE SCROLLYTELLING
		if (fieldName === 'steps' && Array.isArray(parsed)) {
			console.log(`✅ JSON parseado com sucesso para ${fieldName}: ${parsed.length} step(s)`);

			// Verifica se os steps têm campos mobile
			let stepsMobileCount = 0;
			parsed.forEach((step, index) => {
				if (step.imageMobile || step.videoMobile) {
					stepsMobileCount++;
				}
			});

			if (stepsMobileCount > 0) {
				console.log(`   📱 Steps com conteúdo mobile: ${stepsMobileCount}/${parsed.length}`);
			} else {
				console.warn(`   ⚠️  Nenhum step possui imageMobile ou videoMobile configurado!`);
				console.warn(
					`   💡 Adicione campos "imageMobile" e/ou "videoMobile" nos steps para suporte mobile`
				);
			}
		} else {
			console.log(
				`✅ JSON parseado com sucesso para ${fieldName}: ${Array.isArray(parsed) ? parsed.length : 1} item(s)`
			);
		}

		return parsed;
	} catch (e) {
		console.warn(
			`⚠️  Parse inicial falhou para "${fieldName}". Tentando corrigir aspas no conteúdo...`
		);

		// Fallback: Escapa as aspas que estão DENTRO do conteúdo.
		const escapedString = cleanedString.replace(/(?<![\[{,:\s])"(?![\]},:\s])/g, '\\"');

		try {
			const validJsonString = escapedString.replace(/,\s*([}\]])/g, '$1');
			const parsed = JSON.parse(validJsonString);
			console.log(`✅ JSON parseado com sucesso para ${fieldName} (com fallback de aspas)`);
			return parsed;
		} catch (e2) {
			console.error(
				`❌ Fallback de escape de aspas também falhou para "${fieldName}":`,
				e2.message
			);
			console.log('   JSON problemático:', cleanedString.substring(0, 300));
			return null;
		}
	}
}

function parseParagraphsHTML(html) {
	const paragraphs = [];
	const typeBlocks = html.split(/(?=type:\s*)/);

	for (const block of typeBlocks) {
		if (!block.trim() || !block.includes('type:')) continue;

		const paragraph = {};

		const typeMatch = block.match(/type:\s*([^\n<]+)/);
		if (typeMatch) {
			paragraph.type = decodeHTMLEntities(typeMatch[1].trim());
		}

		// 🌪️ NOVO: TRATAMENTO ESPECÍFICO PARA HEADER CAÓTICO
		if (
			['header-caotico', 'header-caótico', 'caotico', 'chaotic-header', 'caos'].includes(
				paragraph.type?.toLowerCase()
			)
		) {
			console.log('🌪️ Processando Header Caótico...');

			// Campos específicos do header caótico
			const chaoticFields = {
				// Básicos
				title: /title:\s*([^\n<]+)/i,
				subtitle: /subtitle:\s*([^\n<]+)/i,
				titleColor: /titleColor:\s*([^\n<]+)/i,

				// Mídias caóticas
				medias: /medias:\s*(\[[\s\S]*?\])/i,
				totalDefaultMedias: /totalDefaultMedias:\s*([^\n<]+)/i,
				shuffleInterval: /shuffleInterval:\s*([^\n<]+)/i,
				animationDelay: /animationDelay:\s*([^\n<]+)/i,

				// 🆕 CAMPOS DE BACKGROUND
				useCustomBackground: /useCustomBackground:\s*([^\n<]+)/i,
				backgroundImage: /backgroundImage:\s*([^\n<]+)/i,
				backgroundImageMobile: /backgroundImageMobile:\s*([^\n<]+)/i,
				backgroundVideo: /backgroundVideo:\s*([^\n<]+)/i,
				backgroundVideoMobile: /backgroundVideoMobile:\s*([^\n<]+)/i,
				overlay: /overlay:\s*([^\n<]+)/i,
				overlayOpacity: /overlayOpacity:\s*([^\n<]+)/i,

				// 🆕 CAMPOS DE TAMANHO
				mediaWidth: /mediaWidth:\s*([^\n<]+)/i,
				mediaHeight: /mediaHeight:\s*([^\n<]+)/i,
				mediaWidthMobile: /mediaWidthMobile:\s*([^\n<]+)/i,
				mediaHeightMobile: /mediaHeightMobile:\s*([^\n<]+)/i,
				mediaSizeVariation: /mediaSizeVariation:\s*([^\n<]+)/i
			};

			// Processar lista de mídias customizadas (JSON array) - OPCIONAL
			const mediasMatch = block.match(chaoticFields.medias);
			if (mediasMatch) {
				paragraph.medias = parseJSONField(mediasMatch[1], 'chaotic header medias');
				console.log(`   ✅ ${paragraph.medias?.length || 0} mídias customizadas processadas`);
			}

			// Processar outros campos do header caótico
			for (const [field, regex] of Object.entries(chaoticFields)) {
				if (field === 'medias') continue; // Já processado acima

				const match = block.match(regex);
				if (match) {
					paragraph[field] = decodeHTMLEntities(match[1].trim());
				}
			}

			// Log das configurações processadas
			const totalMedias = paragraph.totalDefaultMedias || '40';
			const mediaSize = `${paragraph.mediaWidth || '220'}x${paragraph.mediaHeight || '165'}`;
			const mediaSizeMobile = `${paragraph.mediaWidthMobile || '160'}x${paragraph.mediaHeightMobile || '120'}`;
			const hasBackground = paragraph.useCustomBackground === 'true';
			const customMediasCount = paragraph.medias?.length || 0;

			console.log(`   📏 Tamanhos: Desktop ${mediaSize} | Mobile ${mediaSizeMobile}`);
			console.log(
				`   🎪 Mídias: ${customMediasCount > 0 ? customMediasCount + ' customizadas' : totalMedias + ' padrão'}`
			);
			console.log(`   🖼️ Background personalizado: ${hasBackground ? 'Sim' : 'Não'}`);
			console.log(
				`   ⚡ Shuffle: ${paragraph.shuffleInterval || '3000'}ms | Delay: ${paragraph.animationDelay || '300'}ms`
			);
			if (hasBackground) {
				console.log(
					`   🎨 Overlay: ${paragraph.overlay !== 'false' ? 'Sim' : 'Não'} (${paragraph.overlayOpacity || '0.5'})`
				);
			}

			// Processar campo 'text' para header caótico
			const textMatch = block.match(/text:\s*(.*?)(?=\s*type:|$)/s);
			if (textMatch) {
				paragraph.text = decodeHTMLEntities(textMatch[1].trim());
			}

			paragraphs.push(paragraph);
			continue;
		}

		// 🎬 NOVO: TRATAMENTO ESPECÍFICO PARA APRESENTAÇÃO DE PERSONAGENS
		if (
			['personagens', 'characters', 'character-presentation', 'apresentacao-personagens'].includes(
				paragraph.type?.toLowerCase()
			)
		) {
			console.log('🎭 Processando Apresentação de Personagens...');

			// Campos específicos de personagens
			const characterFields = {
				personagens: /personagens:\s*(\[[\s\S]*?\])/i,
				characters: /characters:\s*(\[[\s\S]*?\])/i,
				lista: /lista:\s*(\[[\s\S]*?\])/i,
				shapeColor: /shapeColor:\s*([^\n<]+)/i,
				nameColor: /nameColor:\s*([^\n<]+)/i,
				textColor: /textColor:\s*([^\n<]+)/i,
				backgroundColor: /backgroundColor:\s*([^\n<]+)/i,
				animationSpeed: /animationSpeed:\s*([^\n<]+)/i,
				sectionHeight: /sectionHeight:\s*([^\n<]+)/i,
				sectionHeightMobile: /sectionHeightMobile:\s*([^\n<]+)/i
			};

			// Processar lista de personagens (JSON array)
			for (const field of ['personagens', 'characters', 'lista']) {
				const regex = characterFields[field];
				const match = block.match(regex);
				if (match) {
					paragraph[field] = parseJSONField(match[1], `character ${field}`);
					console.log(`   ✅ ${paragraph[field]?.length || 0} personagens processados em ${field}`);
					break; // Usa apenas o primeiro campo encontrado
				}
			}

			// Processar outros campos
			for (const [field, regex] of Object.entries(characterFields)) {
				if (['personagens', 'characters', 'lista'].includes(field)) continue; // Já processado acima

				const match = block.match(regex);
				if (match) {
					paragraph[field] = decodeHTMLEntities(match[1].trim());
				}
			}

			// 🔧 CORREÇÃO: Processar campo 'text' para apresentação de personagens também
			const textMatch = block.match(
				/text:\s*(.*?)(?=\s*(?:personagens|characters|lista|shapeColor|nameColor|textColor|backgroundColor|animationSpeed|sectionHeight|sectionHeightMobile):|type:|$)/is
			);
			if (textMatch) {
				paragraph.text = cleanAndFormatHTML(textMatch[1].trim());
			}

			paragraphs.push(paragraph);
			continue;
		}

		// 🎯 NOVO: TRATAMENTO ESPECÍFICO PARA CURIOSIDADES - ADICIONAR após personagens
		if (
			['curiosidades', 'trivia', 'facts', 'apresentacao-curiosidades'].includes(
				paragraph.type?.toLowerCase()
			)
		) {
			console.log('🎯 Processando Curiosidades...');

			// Campos específicos de curiosidades
			const curiosidadesFields = {
				personagens: /personagens:\s*(\[[\s\S]*?\])/i,
				characters: /characters:\s*(\[[\s\S]*?\])/i,
				lista: /lista:\s*(\[[\s\S]*?\])/i,
				shapeColor: /shapeColor:\s*([^\n<]+)/i,
				nameColor: /nameColor:\s*([^\n<]+)/i,
				textColor: /textColor:\s*([^\n<]+)/i,
				backgroundColor: /backgroundColor:\s*([^\n<]+)/i,
				quoteColor: /quoteColor:\s*([^\n<]+)/i // ✅ NOVO CAMPO
			};

			// Processar lista de curiosidades (JSON array)
			for (const field of ['personagens', 'characters', 'lista']) {
				const regex = curiosidadesFields[field];
				const match = block.match(regex);
				if (match) {
					paragraph[field] = parseJSONField(match[1], `curiosidades ${field}`);
					console.log(
						`   ✅ ${paragraph[field]?.length || 0} curiosidades processadas em ${field}`
					);
					break; // Usa apenas o primeiro campo encontrado
				}
			}

			// Processar outros campos de curiosidades
			for (const [field, regex] of Object.entries(curiosidadesFields)) {
				if (['personagens', 'characters', 'lista'].includes(field)) continue; // Já processado acima

				const match = block.match(regex);
				if (match) {
					paragraph[field] = decodeHTMLEntities(match[1].trim());
				}
			}

			// Processar campo 'text' para curiosidades
			const textMatch = block.match(
				/text:\s*(.*?)(?=\s*(?:personagens|characters|lista|shapeColor|nameColor|textColor|backgroundColor|quoteColor):|type:|$)/is
			);
			if (textMatch) {
				paragraph.text = cleanAndFormatHTML(textMatch[1].trim());
			}

			paragraphs.push(paragraph);
			continue;
		}

		// 🆕 NOVO: TRATAMENTO ESPECÍFICO PARA ITENS RECOMENDADOS
		if (
			[
				'recomendados',
				'recommended',
				'recommended-items',
				'itens-recomendados',
				'relacionados',
				'conteudos-relacionados'
			].includes(paragraph.type?.toLowerCase())
		) {
			console.log('🎯 Processando Itens Recomendados...');

			// Campos específicos de itens recomendados
			const recommendedFields = {
				items: /items:\s*(\[[\s\S]*?\])/i,
				itens: /itens:\s*(\[[\s\S]*?\])/i,
				title: /title:\s*([^\n<]+)/i,
				titulo: /titulo:\s*([^\n<]+)/i,
				layout: /layout:\s*([^\n<]+)/i,
				columns: /columns:\s*([^\n<]+)/i,
				colunas: /colunas:\s*([^\n<]+)/i,
				showTitle: /showTitle:\s*([^\n<]+)/i,
				mostrarTitulo: /mostrarTitulo:\s*([^\n<]+)/i,
				backgroundColor: /backgroundColor:\s*([^\n<]+)/i,
				corFundo: /corFundo:\s*([^\n<]+)/i,
				titleColor: /titleColor:\s*([^\n<]+)/i,
				corTitulo: /corTitulo:\s*([^\n<]+)/i,
				textColor: /textColor:\s*([^\n<]+)/i,
				corTexto: /corTexto:\s*([^\n<]+)/i
			};

			// Processar lista de itens (JSON array)
			for (const field of ['items', 'itens']) {
				const regex = recommendedFields[field];
				const match = block.match(regex);
				if (match) {
					paragraph[field] = parseJSONField(match[1], `recommended ${field}`);
					console.log(`   ✅ ${paragraph[field]?.length || 0} itens processados em ${field}`);
					break; // Usa apenas o primeiro campo encontrado
				}
			}

			// Processar outros campos de itens recomendados
			for (const [field, regex] of Object.entries(recommendedFields)) {
				if (['items', 'itens'].includes(field)) continue; // Já processado acima

				const match = block.match(regex);
				if (match) {
					paragraph[field] = decodeHTMLEntities(match[1].trim());
				}
			}

			// Processar campo 'text' para itens recomendados
			const textMatch = block.match(
				/text:\s*(.*?)(?=\s*(?:items|itens|title|titulo|layout|columns|colunas|showTitle|mostrarTitulo|backgroundColor|corFundo|titleColor|corTitulo|textColor|corTexto):|type:|$)/is
			);
			if (textMatch) {
				paragraph.text = cleanAndFormatHTML(textMatch[1].trim());
			}

			paragraphs.push(paragraph);
			continue;
		}

		// 🆕 NOVOS COMPONENTES - TIMELINE INTERACTIVE
		if (
			['timeline-interactive', 'timeline', 'cronologia', 'cronologia-interativa'].includes(
				paragraph.type?.toLowerCase()
			)
		) {
			console.log('🕐 Processando Timeline Interactive...');

			// Campos específicos de timeline
			const timelineFields = {
				events: /events:\s*(\[[\s\S]*?\])/i,
				theme: /theme:\s*([^\n<]+)/i,
				autoAdvance: /autoAdvance:\s*([^\n<]+)/i,
				showProgress: /showProgress:\s*([^\n<]+)/i,
				height: /height:\s*([^\n<]+)/i,
				fullWidth: /fullWidth:\s*([^\n<]+)/i,
				highlightCurrent: /highlightCurrent:\s*([^\n<]+)/i
			};

			// Processar lista de eventos (JSON array)
			const eventsMatch = block.match(timelineFields.events);
			if (eventsMatch) {
				paragraph.events = parseJSONField(eventsMatch[1], 'timeline events');
				console.log(`   ✅ ${paragraph.events?.length || 0} eventos processados`);
			}

			// Processar outros campos de timeline
			for (const [field, regex] of Object.entries(timelineFields)) {
				if (field === 'events') continue; // Já processado acima

				const match = block.match(regex);
				if (match) {
					paragraph[field] = decodeHTMLEntities(match[1].trim());
				}
			}

			// Processar campo 'text' para timeline
			const textMatch = block.match(
				/text:\s*(.*?)(?=\s*(?:events|theme|autoAdvance|showProgress|height|fullWidth|highlightCurrent):|type:|$)/is
			);
			if (textMatch) {
				paragraph.text = cleanAndFormatHTML(textMatch[1].trim());
			}

			paragraphs.push(paragraph);
			continue;
		}

		// 🆕 NOVOS COMPONENTES - DOCUMENT VIEWER
		if (
			['document-viewer', 'documents', 'docs', 'visualizador-documentos'].includes(
				paragraph.type?.toLowerCase()
			)
		) {
			console.log('📄 Processando Document Viewer...');

			// Campos específicos de document viewer
			const documentFields = {
				documents: /documents:\s*(\[[\s\S]*?\])/i,
				classification: /classification:\s*([^\n<]+)/i,
				theme: /theme:\s*([^\n<]+)/i,
				showWatermark: /showWatermark:\s*([^\n<]+)/i,
				highlightAreas: /highlightAreas:\s*(\[[\s\S]*?\])/i,
				allowDownload: /allowDownload:\s*([^\n<]+)/i,
				showThumbnails: /showThumbnails:\s*([^\n<]+)/i
			};

			// Processar lista de documentos (JSON array)
			const documentsMatch = block.match(documentFields.documents);
			if (documentsMatch) {
				paragraph.documents = parseJSONField(documentsMatch[1], 'documents');
				console.log(`   ✅ ${paragraph.documents?.length || 0} documentos processados`);
			}

			// Processar highlight areas (JSON array)
			const highlightMatch = block.match(documentFields.highlightAreas);
			if (highlightMatch) {
				paragraph.highlightAreas = parseJSONField(highlightMatch[1], 'highlight areas');
				console.log(`   ✅ ${paragraph.highlightAreas?.length || 0} áreas de destaque processadas`);
			}

			// Processar outros campos de document viewer
			for (const [field, regex] of Object.entries(documentFields)) {
				if (['documents', 'highlightAreas'].includes(field)) continue; // Já processado acima

				const match = block.match(regex);
				if (match) {
					paragraph[field] = decodeHTMLEntities(match[1].trim());
				}
			}

			// Processar campo 'text' para document viewer
			const textMatch = block.match(
				/text:\s*(.*?)(?=\s*(?:documents|classification|theme|showWatermark|highlightAreas|allowDownload|showThumbnails):|type:|$)/is
			);
			if (textMatch) {
				paragraph.text = cleanAndFormatHTML(textMatch[1].trim());
			}

			paragraphs.push(paragraph);
			continue;
		}

		// 🆕 NOVOS COMPONENTES - CRIME EXPLAINER
		if (
			['crime-explainer', 'crimes', 'explicador-crimes', 'crimes-explicacao'].includes(
				paragraph.type?.toLowerCase()
			)
		) {
			console.log('⚖️ Processando Crime Explainer...');

			// Campos específicos de crime explainer
			const crimeFields = {
				crimes: /crimes:\s*(\[[\s\S]*?\])/i,
				theme: /theme:\s*([^\n<]+)/i,
				interactive: /interactive:\s*([^\n<]+)/i,
				showPenalties: /showPenalties:\s*([^\n<]+)/i,
				layout: /layout:\s*([^\n<]+)/i,
				autoAdvance: /autoAdvance:\s*([^\n<]+)/i
			};

			// Processar lista de crimes (JSON array)
			const crimesMatch = block.match(crimeFields.crimes);
			if (crimesMatch) {
				paragraph.crimes = parseJSONField(crimesMatch[1], 'crimes');
				console.log(`   ✅ ${paragraph.crimes?.length || 0} crimes processados`);
			}

			// Processar outros campos de crime explainer
			for (const [field, regex] of Object.entries(crimeFields)) {
				if (field === 'crimes') continue; // Já processado acima

				const match = block.match(regex);
				if (match) {
					paragraph[field] = decodeHTMLEntities(match[1].trim());
				}
			}

			// Processar campo 'text' para crime explainer
			const textMatch = block.match(
				/text:\s*(.*?)(?=\s*(?:crimes|theme|interactive|showPenalties|layout|autoAdvance):|type:|$)/is
			);
			if (textMatch) {
				paragraph.text = cleanAndFormatHTML(textMatch[1].trim());
			}

			paragraphs.push(paragraph);
			continue;
		}

		// ==========================================================
		// 🚀 NOVO: SUPERFLEX LAYOUT (O filho chora e a mãe vê)
		// ==========================================================

		// 🆕 TRATAMENTO ESPECÍFICO PARA SCROLLYFRAMES
		if (paragraph.type?.toLowerCase() === 'scrollyframes') {
			console.log('🎬 Processando ScrollyFrames...');

			// Campos específicos do ScrollyFrames
			const scrollyFramesFields = {
				frameStart: /frameStart:\s*([^\n<]+)/i,
				frameStop: /frameStop:\s*([^\n<]+)/i,
				imagePrefix: /imagePrefix:\s*([^\n<]+)/i,
				imageSuffix: /imageSuffix:\s*([^\n<]+)/i,
				imagePrefixMobile: /imagePrefixMobile:\s*([^\n<]+)/i,
				imageSuffixMobile: /imageSuffixMobile:\s*([^\n<]+)/i,
				height: /height:\s*([^\n<]+)/i,
				showProgress: /showProgress:\s*([^\n<]+)/i,
				showTime: /showTime:\s*([^\n<]+)/i,
				preloadFrames: /preloadFrames:\s*([^\n<]+)/i,
				memoryLimit: /memoryLimit:\s*([^\n<]+)/i,
				animationSpeed: /animationSpeed:\s*([^\n<]+)/i,
				smoothing: /smoothing:\s*([^\n<]+)/i,
				debug: /debug:\s*([^\n<]+)/i,
				fullWidth: /fullWidth:\s*([^\n<]+)/i
			};

			// Processar campos específicos
			for (const [field, regex] of Object.entries(scrollyFramesFields)) {
				const match = block.match(regex);
				if (match) {
					let value = decodeHTMLEntities(match[1].trim());

					// Converter tipos apropriados
					if (['frameStart', 'frameStop', 'preloadFrames', 'memoryLimit'].includes(field)) {
						paragraph[field] =
							parseInt(value) ||
							(field === 'frameStart'
								? 1
								: field === 'preloadFrames'
									? 8
									: field === 'memoryLimit'
										? 30
										: 100);
					} else if (field === 'animationSpeed') {
						paragraph[field] = parseFloat(value) || 0.1;
					} else if (['showProgress', 'showTime', 'smoothing', 'fullWidth'].includes(field)) {
						paragraph[field] = value.toLowerCase() !== 'false';
					} else if (field === 'debug') {
						paragraph[field] = value.toLowerCase() === 'true';
					} else {
						paragraph[field] = value;
					}
				}
			}

			// Processar steps específicos para ScrollyFrames
			const stepsMatch = block.match(/steps:\s*(\[[\s\S]*?\])/i);
			if (stepsMatch) {
				paragraph.steps = parseJSONField(stepsMatch[1], 'scrollyframes steps');
				console.log(`   ✅ ${paragraph.steps?.length || 0} steps processados`);
			}

			// Processar texto se existir
			const textMatch = block.match(
				/text:\s*(.*?)(?=\s*(?:frameStart|frameStop|imagePrefix|imageSuffix|imagePrefixMobile|imageSuffixMobile|height|showProgress|showTime|preloadFrames|memoryLimit|animationSpeed|smoothing|debug|fullWidth|steps):|type:|$)/is
			);
			if (textMatch) {
				paragraph.text = cleanAndFormatHTML(textMatch[1].trim());
			}

			paragraphs.push(paragraph);
			continue;
		}

		// Flourish e outros componentes especiais
		if (['flourish', 'flourish-scrolly', 'grafico', 'mapa'].includes(paragraph.type)) {
			const srcMatch = block.match(/src:\s*([^\n<]+)/);
			if (srcMatch) {
				paragraph.src = srcMatch[1].trim();
			}

			const stepsMatch = block.match(/steps:\s*(\[[\s\S]*?\])/);
			if (stepsMatch) {
				paragraph.steps = parseJSONField(stepsMatch[1], 'flourish steps');
			}

			paragraphs.push(paragraph);
			continue;
		}

		// Processamento de texto para outros tipos
		const textMatch = block.match(
			/text:\s*(.*?)(?=\s*(?:backgroundImage|backgroundImageMobile|backgroundVideo|backgroundVideoMobile|backgroundPosition|backgroundPositionMobile|author|role|src|videoSrc|videoSrcMobile|caption|credit|alt|fullWidth|variant|size|orientation|autoplay|controls|poster|images|items|steps|beforeImage|afterImage|beforeLabel|afterLabel|image|height|heightMobile|speed|content|overlay|layout|columns|interval|showDots|showArrows|stickyHeight|videoId|videosIDs|id|skipDFP|skipdfp|autoPlay|startMuted|maxQuality|quality|chromeless|isLive|live|allowRestrictedContent|preventBlackBars|globoId|token|adAccountId|adCmsId|siteName|width|textPosition|textPositionMobile|textAlign|textAlignMobile|title|subtitle|date|theme|videoAspectRatio|showProgress|showTime|showControls|textColor|fontSize|fontSizeMobile|textZIndex|image1Desktop|image1Mobile|image1Width|image1Height|image1WidthMobile|image1HeightMobile|image1X|image1Y|image1XMobile|image1YMobile|image1ZIndex|image2Desktop|image2Mobile|image2Width|image2Height|image2WidthMobile|image2HeightMobile|image2Position|image2X|image2Y|image2XMobile|image2YMobile|image2ZIndex|backgroundColor|minHeight|minHeightMobile|padding|paddingMobile):|type:|$)/is
		);
		if (textMatch) {
			if (['texto', 'frase', 'intro'].includes(paragraph.type)) {
				// 🔧 LIMPEZA ESPECÍFICA PARA ÚLTIMO PARÁGRAFO
				let rawText = textMatch[1].trim();
				rawText = rawText.replace(/\.\s*\.\s*$/, '.'); // Remove ponto duplo no final
				rawText = rawText.replace(/\s+\.\s*$/, '.'); // Remove espaços antes do ponto final
				paragraph.text = cleanAndFormatHTML(rawText);
			} else {
				// 🔧 LIMPEZA ESPECÍFICA PARA ÚLTIMO PARÁGRAFO
				let rawText = textMatch[1].trim();
				rawText = rawText.replace(/\.\s*\.\s*$/, '.'); // Remove ponto duplo no final
				rawText = rawText.replace(/\s+\.\s*$/, '.'); // Remove espaços antes do ponto final
				paragraph.text = cleanAndFormatHTML(rawText);
			}
		}

		// Processar arrays JSON
		const jsonFields = ['images', 'items', 'steps'];
		for (const field of jsonFields) {
			const regex = new RegExp(`${field}:\\s*(\\[[\\s\\S]*?\\])`, 'i');
			const match = block.match(regex);
			if (match) {
				paragraph[field] = parseJSONField(match[1], field);
			}
		}

		// Campos gerais (mantém sua lógica original)
		const fieldMappings = {
			// Campos existentes
			title: 'title',
			subtitle: 'subtitle',
			date: 'date',
			theme: 'theme',
			backgroundImage: 'backgroundImage',
			backgroundImageMobile: 'backgroundImageMobile',
			backgroundVideo: 'backgroundVideo',
			backgroundVideoMobile: 'backgroundVideoMobile',
			backgroundPosition: 'backgroundPosition',
			backgroundPositionMobile: 'backgroundPositionMobile',
			textPosition: 'textPosition',
			textPositionMobile: 'textPositionMobile',
			textAlign: 'textAlign',
			textAlignMobile: 'textAlignMobile',
			author: 'author',
			role: 'role',
			src: 'src',
			videoSrc: 'videoSrc',
			videoSrcMobile: 'videoSrcMobile',

			// Dimensionamento da foto
			width: 'width', // Largura (já existe)
			height: 'height', // Altura (já existe)
			maxWidth: 'maxWidth', // Largura máxima
			maxHeight: 'maxHeight', // Altura máxima

			// Posicionamento e alinhamento
			alignment: 'alignment', // Alinhamento (já existe)
			position: 'position', // Posição da foto

			// Estilos específicos da foto
			borderRadius: 'borderRadius', // Borda arredondada
			shadow: 'shadow', // Sombra
			border: 'border', // Borda
			filter: 'filter', // Filtros CSS

			// Comportamento
			lazy: 'lazy', // Lazy loading
			loading: 'loading', // Tipo de loading
			clickable: 'clickable', // Se é clicável
			zoomable: 'zoomable', // Se permite zoom

			// Layout
			fullWidth: 'fullWidth', // Largura total (já existe)
			containerClass: 'containerClass', // Classe CSS do container
			imageClass: 'imageClass', // Classe CSS da imagem

			// 🎬 VIDEO PLAYER - Props atualizadas
			srcMobile: 'srcMobile',
			'src-mobile': 'srcMobile', // Alias
			poster: 'poster',
			posterDesktop: 'poster', // Alias para desktop
			'poster-desktop': 'poster', // Alias para desktop
			posterMobile: 'posterMobile',
			'poster-mobile': 'posterMobile', // Alias
			customWidth: 'customWidth',
			'custom-width': 'customWidth', // Alias
			customWidthDesktop: 'customWidthDesktop',
			'custom-width-desktop': 'customWidthDesktop', // Alias
			customWidthMobile: 'customWidthMobile',
			'custom-width-mobile': 'customWidthMobile', // Alias
			aspectRatio: 'aspectRatio',
			'aspect-ratio': 'aspectRatio', // Alias
			aspectRatioMobile: 'aspectRatioMobile',
			'aspect-ratio-mobile': 'aspectRatioMobile', // Alias
			fullWidthBackground: 'fullWidthBackground',
			'full-width-background': 'fullWidthBackground', // Alias
			poster: 'poster',
			posterImage: 'poster', // Alias para poster
			posterDesktop: 'poster', // Alias para poster
			posterMobile: 'posterMobile',
			'poster-mobile': 'posterMobile', // Alias

			caption: 'caption',
			credit: 'credit',
			alt: 'alt',
			fullWidth: 'fullWidth',
			variant: 'variant',
			size: 'size',
			orientation: 'orientation',
			autoplay: 'autoplay',
			controls: 'controls',
			overlay: 'overlay',
			layout: 'layout',
			columns: 'columns',
			interval: 'interval',
			showDots: 'showDots',
			showArrows: 'showArrows',
			stickyHeight: 'stickyHeight',
			beforeImage: 'beforeImage',
			afterImage: 'afterImage',
			beforeLabel: 'beforeLabel',
			afterLabel: 'afterLabel',
			image: 'image',
			speed: 'speed',
			content: 'content',

			// IDs de vídeo específicos
			videoIdMobile: 'videoIdMobile',
			videoIdDesktop: 'videoIdDesktop',
			'videoId-mobile': 'videoIdMobile', // Alias
			'videoId-desktop': 'videoIdDesktop', // Alias
			'video-id-mobile': 'videoIdMobile', // Alias
			'video-id-desktop': 'videoIdDesktop', // Alias

			// Dimensões responsivas
			widthMobile: 'widthMobile',
			widthDesktop: 'widthDesktop',
			'width-mobile': 'widthMobile', // Alias
			'width-desktop': 'widthDesktop', // Alias

			// Cor de fundo - ATUALIZADO
			containerBackgroundColor: 'containerBackgroundColor',
			backgroundColor: 'backgroundColor', // MUDOU: era 'containerBackgroundColor'
			'background-color': 'backgroundColor', // MUDOU: era 'containerBackgroundColor'
			'container-background': 'containerBackgroundColor',
			aspectRatio: 'aspectRatio',
			aspectRatioMobile: 'aspectRatioMobile',
			'aspect-ratio': 'aspectRatio',
			'aspect-ratio-mobile': 'aspectRatioMobile',
			videoId: 'videoId',
			videosIDs: 'videosIDs',
			id: 'id',
			skipDFP: 'skipDFP',
			skipdfp: 'skipdfp',
			autoPlay: 'autoPlay',
			startMuted: 'startMuted',
			maxQuality: 'maxQuality',
			quality: 'quality',
			chromeless: 'chromeless',
			isLive: 'isLive',
			live: 'live',
			allowRestrictedContent: 'allowRestrictedContent',
			preventBlackBars: 'preventBlackBars',
			globoId: 'globoId',
			token: 'token',
			adAccountId: 'adAccountId',
			adCmsId: 'adCmsId',
			siteName: 'siteName',
			width: 'width',
			height: 'height',
			heightMobile: 'heightMobile',
			showCaption: 'showCaption',
			alignment: 'alignment',
			loop: 'loop',
			videoAspectRatio: 'videoAspectRatio',
			aspectRatio: 'aspectRatio',
			showProgress: 'showProgress',
			showTime: 'showTime',
			showControls: 'showControls',

			// NOVOS CAMPOS PARA LAYOUT-FLEXIVEL:

			// Texto - Layout Flexível
			textColor: 'textColor',
			fontSize: 'fontSize',
			fontSizeMobile: 'fontSizeMobile',
			textZIndex: 'textZIndex',

			// Imagem 1 - Grifo/Destaque
			image1Desktop: 'image1Desktop',
			image1Mobile: 'image1Mobile',
			image1Width: 'image1Width',
			image1Height: 'image1Height',
			image1WidthMobile: 'image1WidthMobile',
			image1HeightMobile: 'image1HeightMobile',
			image1X: 'image1X',
			image1Y: 'image1Y',
			image1XMobile: 'image1XMobile',
			image1YMobile: 'image1YMobile',
			image1ZIndex: 'image1ZIndex',

			// Imagem 2 - Principal
			image2Desktop: 'image2Desktop',
			image2Mobile: 'image2Mobile',
			image2Width: 'image2Width',
			image2Height: 'image2Height',
			image2WidthMobile: 'image2WidthMobile',
			image2HeightMobile: 'image2HeightMobile',
			image2Position: 'image2Position',
			image2X: 'image2X',
			image2Y: 'image2Y',
			image2XMobile: 'image2XMobile',
			image2YMobile: 'image2YMobile',
			image2ZIndex: 'image2ZIndex',

			// Layout - Layout Flexível
			minHeight: 'minHeight',
			minHeightMobile: 'minHeightMobile',
			padding: 'padding',
			paddingMobile: 'paddingMobile'
		};

		for (const [field, prop] of Object.entries(fieldMappings)) {
			const regex = new RegExp(`\\b${field}:\\s*([^\\n<]*)`, 'i');
			const match = block.match(regex);
			if (match) {
				const cleanedValue = (match[1] || '')
					.replace(/&nbsp;/g, ' ')
					.replace(/<[^>]*>/g, '')
					.trim();

				paragraph[prop] = decodeHTMLEntities(cleanedValue);
			}
		}

		if (paragraph.type) {
			paragraphs.push(paragraph);
		}
	}
	return paragraphs;
}

function parseCreditsHTML(html) {
	const credits = {};

	const notesMatch = html.match(
		/notes:\s*([\s\S]*?)(?=sources:|additionalGraphics:|editedBy:|authors:|$)/s
	);
	if (notesMatch) {
		credits.notes = cleanAndFormatHTML(notesMatch[1].trim());
	}

	const arrayFields = ['sources', 'additionalGraphics', 'editedBy', 'authors'];
	for (const field of arrayFields) {
		const regex = new RegExp(
			`${field}:\\s*([\\s\\S]*?)(?=(?:notes:|sources:|additionalGraphics:|editedBy:|authors:|\\[credits\\])|$)`,
			'i'
		);
		const match = html.match(regex);

		if (match && match[1]) {
			let rawContent = match[1];
			rawContent = rawContent.replace(/<\/?ul[^>]*>/g, '');
			rawContent = rawContent.replace(/<\/?li[^>]*>/g, '');
			rawContent = rawContent.replace(/&nbsp;/g, ' ');

			credits[field] = rawContent
				.split('- ')
				.map((item) => {
					return cleanAndFormatHTML(item.trim());
				})
				.filter(Boolean);
		}
	}
	return credits;
}

function cleanAndFormatHTML(html) {
	if (!html) return '';

	// 🔧 CORREÇÃO: Primeiro decodifica as entidades HTML
	let cleanedHtml = decodeHTMLEntities(html);

	// Remove backticks problemáticos
	cleanedHtml = cleanedHtml.replace(/`/g, "'");

	// Preserva formatação básica convertendo estilos inline para tags simples
	cleanedHtml = cleanedHtml.replace(
		/<([^>]+)style="[^"]*font-weight:\s*(?:bold|[7-9]\d\d|700|800|900)[^"]*"[^>]*>(.*?)<\/\1>/gi,
		'<strong>$2</strong>'
	);
	cleanedHtml = cleanedHtml.replace(
		/<([^>]+)style="[^"]*font-style:\s*italic[^"]*"[^>]*>(.*?)<\/\1>/gi,
		'<em>$2</em>'
	);
	cleanedHtml = cleanedHtml.replace(
		/<([^>]+)style="[^"]*text-decoration[^"]*underline[^"]*"[^>]*>(.*?)<\/\1>/gi,
		'<u>$2</u>'
	);
	cleanedHtml = cleanedHtml.replace(/<a\s+href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '<a href="$1">$2</a>');

	// Processa listas com bullets
	const listRegex = /((?:[•*-]\s.*)(?:<br\s*\/?>\s*[•*-]\s.*)*)/g;
	cleanedHtml = cleanedHtml.replace(listRegex, (listBlock) => {
		const items = listBlock
			.split(/<br\s*\/?>/gi)
			.map((item) => item.trim())
			.filter((item) => item.length > 0)
			.map((item) => `<li>${item.replace(/^[•*-]\s/, '').trim()}</li>`)
			.join('');
		return items ? `<ul>${items}</ul>` : '';
	});

	// Remove tags desnecessárias mas preserva conteúdo
	cleanedHtml = cleanedHtml.replace(/<\/?(span|p|div)[^>]*>/gi, '');

	cleanedHtml = cleanedHtml
		.replace(/\.{2,}/g, '.') // Remove pontos duplos/triplos
		.replace(/,(?!\s)/g, ', ') // Garante espaço após vírgula
		.replace(/\s+\./g, '.') // Remove espaços antes de pontos
		.replace(/\s+,/g, ',') // Remove espaços antes de vírgulas
		.replace(/\s{2,}/g, ' '); // Remove espaços múltiplos

	cleanedHtml = cleanedHtml
		.replace(/\.\s*\.\s*$/g, '.') // Remove pontos duplos especificamente no final
		.replace(/\.\s*\.\s*/g, '. ') // Substitui pontos duplos por ponto simples + espaço no meio
		.replace(/\s+\.\s*$/g, '.') // Remove espaços antes do ponto final
		.replace(/\.+$/g, '.'); // Garante apenas um ponto no final

	return cleanedHtml.trim();
}

const args = process.argv.slice(2);
if (args.length === 0) {
	console.log('❌ Use: npm run fetch DOC_ID');
	process.exit(1);
}

fetchGoogleDoc(args[0]);
