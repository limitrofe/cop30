import Header from '$lib/components/story/Header.svelte';
import HeaderCaotico from '$lib/components/story/HeaderCaotico.svelte';
import StoryText from '$lib/components/story/StoryText.svelte';
import SectionTitle from '$lib/components/story/SectionTitle.svelte';
import PhotoWithCaption from '$lib/components/story/PhotoWithCaption.svelte';
import VideoPlayer from '$lib/components/story/VideoPlayer.svelte';
import GloboPlayer from '$lib/components/story/GloboPlayer.svelte';
import PhotoGallery from '$lib/components/story/PhotoGallery.svelte';
import Carousel from '$lib/components/story/Carousel.svelte';
import GloboPlayerCarousel from '$lib/components/story/GloboPlayerCarousel.svelte';
import GloboPlayerGridSlider from '$lib/components/story/GloboPlayerGridSlider.svelte';
import Parallax from '$lib/components/story/Parallax.svelte';
import BeforeAfter from '$lib/components/story/BeforeAfter.svelte';
import ScrollyTelling from '$lib/components/story/ScrollyTelling.svelte';
import ScrollyFrames from '$lib/components/story/ScrollyFrames.svelte';
import FlourishEmbed from '$lib/components/story/FlourishEmbed.svelte';
import FlourishScrolly from '$lib/components/story/FlourishScrolly.svelte';
import RecommendedItems from '$lib/components/story/RecommendedItems.svelte';
import CharacterPresentation from '$lib/components/story/CharacterPresentation.svelte';
import Curiosidades from '$lib/components/story/Curiosidades.svelte';
import TimelineInteractive from '$lib/components/story/TimelineInteractive.svelte';
import DocumentViewer from '$lib/components/story/DocumentViewer.svelte';
import CrimeExplainer from '$lib/components/story/CrimeExplainer.svelte';
import AnchorPoint from '$lib/components/story/AnchorPoint.svelte';
import ChartBar from '$lib/components/story/ChartBar.svelte';
import FlexibleLayout from '$lib/components/story/FlexibleLayout.svelte';
import ContentGrid from '$lib/components/story/ContentGrid.svelte';
import ResponsiveMediaLayout from '$lib/components/story/ResponsiveMediaLayout.svelte';
import MediaTextLayout from '$lib/components/story/MediaTextLayout.svelte';
import FreeCanvas from '$lib/components/story/FreeCanvas.svelte';
import ChartLine from '$lib/components/story/ChartLine.svelte';
import { DEFAULT_BAR_CHART_DATA } from '$lib/utils/chartData.js';
import { DEFAULT_LINE_CHART_DATA } from '$lib/utils/lineChartData.js';

const BAR_CHART_SAMPLE_CSV = `label,value
Categoria A,32
Categoria B,45
Categoria C,28
Categoria D,54
Categoria E,18`;

const LINE_CHART_SAMPLE_CSV = `date,value,min,max
1994-01-01,23.4,18.1,28.6
1998-01-01,27.4,22.0,33.7
2002-01-01,29.4,24.2,36.2
2006-01-01,31.3,26.0,38.9
2010-01-01,33.2,27.6,41.0
2014-01-01,35.2,29.3,43.6
2018-01-01,37.2,30.9,45.8
2022-01-01,39.2,32.7,47.9`;

/**
 * Catálogo centralizado de blocos disponíveis no builder.
 * Mantém um manifesto único com os presets, formulários e metadados.
 */
export const componentRegistry = [
	{
		type: 'header',
		label: 'Header Hero',
		icon: '📰',
		category: 'Estrutura',
		description: 'Abertura com imagem ou vídeo de fundo, título e metadados.',
		component: Header,
		defaultData: {
			type: 'header',
			title: 'Título da matéria',
			subtitle: 'Subtítulo chamativo para contextualizar o tema.',
			author: '',
			date: '',
			backgroundImage: '',
			backgroundImageMobile: '',
			backgroundVideo: '',
			backgroundVideoMobile: '',
			poster: '',
			posterMobile: '',
			variant: 'default',
			overlay: true,
			overlayGradient: 'top-to-bottom',
			verticalAlign: 'top',
			horizontalAlign: 'left',
			titleColor: '',
			subtitleColor: '',
			metaColor: '',
			onMediaColor: '',
			titleShadow: {
				enabled: false,
				offsetX: '0px',
				offsetY: '3px',
				blur: '18px',
				spread: '',
				color: 'rgba(15, 23, 42, 0.55)'
			},
			subtitleShadow: {
				enabled: false,
				offsetX: '0px',
				offsetY: '2px',
				blur: '12px',
				spread: '',
				color: 'rgba(15, 23, 42, 0.45)'
			},
			metaShadow: {
				enabled: false,
				offsetX: '0px',
				offsetY: '2px',
				blur: '10px',
				spread: '',
				color: 'rgba(15, 23, 42, 0.35)'
			},
			titleFontSizeDesktop: '',
			titleFontSizeMobile: '',
			titleLineHeightDesktop: '',
			titleLineHeightMobile: '',
			subtitleFontSizeDesktop: '',
			subtitleFontSizeMobile: '',
			subtitleLineHeightDesktop: '',
			subtitleLineHeightMobile: ''
		},
		fields: [
			{ path: 'title', label: 'Título', type: 'text', required: true },
			{ path: 'subtitle', label: 'Subtítulo', type: 'textarea', rows: 2 },
			{ path: 'author', label: 'Autor(a)', type: 'text' },
			{ path: 'date', label: 'Data (YYYY-MM-DD)', type: 'text' },
			{ path: 'titleColor', label: 'Cor do título', type: 'text', placeholder: '#ffffff' },
			{ path: 'subtitleColor', label: 'Cor do subtítulo', type: 'text', placeholder: '#ffffff' },
			{ path: 'metaColor', label: 'Cor do autor/data', type: 'text', placeholder: '#ffffff' },
			{
				path: 'onMediaColor',
				label: 'Cor do texto sobre mídia',
				type: 'text',
				placeholder: '#ffffff'
			},
			{
				path: 'variant',
				label: 'Variante visual',
				type: 'select',
				options: [
					{ label: 'Default', value: 'default' },
					{ label: 'Hero', value: 'hero' },
					{ label: 'Minimal', value: 'minimal' }
				]
			},
			{
				path: 'overlay',
				label: 'Aplicar overlay',
				type: 'boolean',
				helpText: 'Melhora a legibilidade do texto sobre a mídia.'
			},
			{
				path: 'overlayGradient',
				label: 'Overlay • gradiente',
				type: 'text',
				placeholder: 'top-to-bottom | bottom-to-top',
				helpText:
					'Use os presets top-to-bottom/bottom-to-top ou cole um linear-gradient CSS personalizado.'
			},
			{
				path: 'titleShadow.enabled',
				label: 'Título • sombra ativada',
				type: 'boolean',
				helpText: 'Habilita a sombra personalizada do título.'
			},
			{
				path: 'titleShadow.offsetX',
				label: 'Título • deslocamento X',
				type: 'text',
				placeholder: '0px'
			},
			{
				path: 'titleShadow.offsetY',
				label: 'Título • deslocamento Y',
				type: 'text',
				placeholder: '3px'
			},
			{
				path: 'titleShadow.blur',
				label: 'Título • blur',
				type: 'text',
				placeholder: '18px'
			},
			{
				path: 'titleShadow.color',
				label: 'Título • cor da sombra',
				type: 'color',
				showAlpha: true,
				allowClear: true,
				clearValue: ''
			},
			{
				path: 'subtitleShadow.enabled',
				label: 'Subtítulo • sombra ativada',
				type: 'boolean',
				helpText: 'Controle a sombra do subtítulo para contraste extra.'
			},
			{
				path: 'subtitleShadow.offsetX',
				label: 'Subtítulo • deslocamento X',
				type: 'text',
				placeholder: '0px'
			},
			{
				path: 'subtitleShadow.offsetY',
				label: 'Subtítulo • deslocamento Y',
				type: 'text',
				placeholder: '2px'
			},
			{
				path: 'subtitleShadow.blur',
				label: 'Subtítulo • blur',
				type: 'text',
				placeholder: '12px'
			},
			{
				path: 'subtitleShadow.color',
				label: 'Subtítulo • cor da sombra',
				type: 'color',
				showAlpha: true,
				allowClear: true,
				clearValue: ''
			},
			{
				path: 'metaShadow.enabled',
				label: 'Autor/Data • sombra ativada',
				type: 'boolean',
				helpText: 'Controle a sombra das linhas de autor e data.'
			},
			{
				path: 'metaShadow.offsetX',
				label: 'Autor/Data • deslocamento X',
				type: 'text',
				placeholder: '0px'
			},
			{
				path: 'metaShadow.offsetY',
				label: 'Autor/Data • deslocamento Y',
				type: 'text',
				placeholder: '2px'
			},
			{ path: 'metaShadow.blur', label: 'Autor/Data • blur', type: 'text', placeholder: '10px' },
			{
				path: 'metaShadow.color',
				label: 'Autor/Data • cor da sombra',
				type: 'color',
				showAlpha: true,
				allowClear: true,
				clearValue: ''
			},
			{ path: 'backgroundImage', label: 'Imagem desktop (1920x1080)', type: 'url' },
			{ path: 'backgroundImageMobile', label: 'Imagem mobile (1080x1920)', type: 'url' },
			{ path: 'backgroundVideo', label: 'Vídeo desktop (mp4)', type: 'url' },
			{ path: 'backgroundVideoMobile', label: 'Vídeo mobile (mp4)', type: 'url' },
			{ path: 'poster', label: 'Poster desktop', type: 'url' },
			{ path: 'posterMobile', label: 'Poster mobile', type: 'url' },
			{
				path: 'verticalAlign',
				label: 'Alinhamento vertical',
				type: 'select',
				options: [
					{ label: 'Topo', value: 'top' },
					{ label: 'Centro', value: 'center' },
					{ label: 'Base', value: 'bottom' }
				]
			},
			{
				path: 'horizontalAlign',
				label: 'Alinhamento horizontal',
				type: 'select',
				options: [
					{ label: 'Esquerda', value: 'left' },
					{ label: 'Centro', value: 'center' },
					{ label: 'Direita', value: 'right' }
				]
			},
			{
				path: 'titleFontSizeDesktop',
				label: 'Título • tamanho desktop',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'titleFontSizeMobile',
				label: 'Título • tamanho mobile',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'titleLineHeightDesktop',
				label: 'Título • altura linha desktop',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'titleLineHeightMobile',
				label: 'Título • altura linha mobile',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'subtitleFontSizeDesktop',
				label: 'Subtítulo • tamanho desktop',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'subtitleFontSizeMobile',
				label: 'Subtítulo • tamanho mobile',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'subtitleLineHeightDesktop',
				label: 'Subtítulo • altura linha desktop',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'subtitleLineHeightMobile',
				label: 'Subtítulo • altura linha mobile',
				type: 'text',
				placeholder: 'herda do tema'
			}
		]
	},
	{
		type: 'header-caotico',
		label: 'Header Caótico',
		icon: '🌪️',
		category: 'Estrutura',
		hidden: true,
		description: 'Intro com dezenas de mídias animadas e camadas sobrepostas.',
		component: HeaderCaotico,
		defaultData: {
			type: 'header-caotico',
			title: 'HEADER CAÓTICO',
			subtitle: '40 mídias se movimentando dinamicamente',
			titleColor: '#f8fafc',
			overlay: true,
			overlayOpacity: 0.55,
			useCustomBackground: false,
			backgroundImage: '',
			backgroundImageMobile: '',
			backgroundVideo: '',
			backgroundVideoMobile: '',
			mediaWidth: 220,
			mediaHeight: 165,
			mediaWidthMobile: 160,
			mediaHeightMobile: 120,
			totalDefaultMedias: 36,
			shuffleInterval: 2800,
			animationDelay: 220,
			medias: []
		},
		fields: [
			{ path: 'title', label: 'Título', type: 'text', required: true },
			{ path: 'subtitle', label: 'Subtítulo', type: 'textarea', rows: 2 },
			{ path: 'titleColor', label: 'Cor do título', type: 'color' },
			{ path: 'overlay', label: 'Overlay escuro', type: 'boolean' },
			{
				path: 'overlayOpacity',
				label: 'Opacidade do overlay',
				type: 'number',
				min: 0,
				max: 1,
				step: 0.05
			},
			{ path: 'useCustomBackground', label: 'Usar mídia de fundo fixa', type: 'boolean' },
			{ path: 'backgroundImage', label: 'Imagem desktop', type: 'url' },
			{ path: 'backgroundImageMobile', label: 'Imagem mobile', type: 'url' },
			{ path: 'backgroundVideo', label: 'Vídeo desktop', type: 'url' },
			{ path: 'backgroundVideoMobile', label: 'Vídeo mobile', type: 'url' },
			{ path: 'mediaWidth', label: 'Largura mídia desktop', type: 'number' },
			{ path: 'mediaHeight', label: 'Altura mídia desktop', type: 'number' },
			{ path: 'mediaWidthMobile', label: 'Largura mídia mobile', type: 'number' },
			{ path: 'mediaHeightMobile', label: 'Altura mídia mobile', type: 'number' },
			{ path: 'totalDefaultMedias', label: 'Qtd. mídias geradas automaticamente', type: 'number' },
			{ path: 'shuffleInterval', label: 'Intervalo de embaralhamento (ms)', type: 'number' },
			{ path: 'animationDelay', label: 'Delay entre entradas (ms)', type: 'number' },
			{
				path: 'medias',
				label: 'Lista de mídias (JSON)',
				type: 'json',
				rows: 6,
				placeholder: '[{"type":"image","src":"https://..."}]',
				emptyValue: []
			}
		]
	},
	{
		type: 'intertitulo',
		label: 'Intertítulo',
		icon: '🔖',
		category: 'Estrutura',
		description: 'Transição entre seções com opções de mídia e overlay.',
		component: SectionTitle,
		defaultData: {
			type: 'intertitulo',
			text: 'Intertítulo impactante',
			subtitle: '',
			backgroundColor: '',
			textColor: '',
			fontFamily: 'globotipo',
			variant: 'default',
			minimalAccentColor: '',
			minimalAccentWidthDesktop: '',
			minimalAccentWidthMobile: '',
			minimalAccentHeightDesktop: '',
			minimalAccentHeightMobile: '',
			size: 'medium',
			overlay: false,
			titleShadow: {
				enabled: false,
				offsetX: '0px',
				offsetY: '3px',
				blur: '18px',
				spread: '',
				color: 'rgba(15, 23, 42, 0.55)'
			},
			subtitleShadow: {
				enabled: false,
				offsetX: '0px',
				offsetY: '2px',
				blur: '12px',
				spread: '',
				color: 'rgba(15, 23, 42, 0.45)'
			},
			textAlign: 'center',
			textPosition: 'center',
			titleFontSizeDesktop: '',
			titleFontSizeMobile: '',
			titleLineHeightDesktop: '',
			titleLineHeightMobile: '',
			subtitleFontSizeDesktop: '',
			subtitleFontSizeMobile: '',
			subtitleLineHeightDesktop: '',
			subtitleLineHeightMobile: '',
			titleFontWeight: '',
			titleFontStyle: '',
			subtitleFontWeight: '',
			subtitleFontStyle: ''
		},
		fields: [
			{ path: 'text', label: 'Título', type: 'text', required: true },
			{ path: 'subtitle', label: 'Subtítulo', type: 'textarea', rows: 2 },
			{
				path: 'variant',
				label: 'Variante',
				type: 'select',
				options: [
					{ label: 'Default', value: 'default' },
					{ label: 'Minimal', value: 'minimal' },
					{ label: 'Hero', value: 'hero' }
				]
			},
			{
				path: 'size',
				label: 'Tamanho',
				type: 'select',
				options: [
					{ label: 'Pequeno', value: 'small' },
					{ label: 'Médio', value: 'medium' },
					{ label: 'Grande', value: 'large' }
				]
			},
			{
				path: 'fontFamily',
				label: 'Fonte',
				type: 'select',
				options: [
					{ label: 'Globotipo', value: 'globotipo' },
					{ label: 'Obviously', value: 'obviously' },
					{ label: 'Serif', value: 'serif' },
					{ label: 'Sans Serif', value: 'sans' }
				]
			},
			{ path: 'backgroundColor', label: 'Cor de fundo', type: 'color' },
			{ path: 'textColor', label: 'Cor do texto', type: 'color' },
			{
				path: 'minimalAccentColor',
				label: 'Minimal • cor do traço',
				type: 'color',
				helpText: 'Personaliza a linha acima do título na variante minimal.'
			},
			{
				path: 'minimalAccentWidthDesktop',
				label: 'Minimal • largura desktop',
				type: 'text',
				placeholder: '30%'
			},
			{
				path: 'minimalAccentWidthMobile',
				label: 'Minimal • largura mobile',
				type: 'text',
				placeholder: '40%'
			},
			{
				path: 'minimalAccentHeightDesktop',
				label: 'Minimal • altura desktop',
				type: 'text',
				placeholder: '2px'
			},
			{
				path: 'minimalAccentHeightMobile',
				label: 'Minimal • altura mobile',
				type: 'text',
				placeholder: '2px'
			},
			{ path: 'backgroundImage', label: 'Imagem desktop', type: 'url' },
			{ path: 'backgroundImageMobile', label: 'Imagem mobile', type: 'url' },
			{ path: 'backgroundVideo', label: 'Vídeo desktop', type: 'url' },
			{ path: 'backgroundVideoMobile', label: 'Vídeo mobile', type: 'url' },
			{ path: 'height', label: 'Altura desktop', type: 'text', placeholder: '60vh' },
			{ path: 'heightMobile', label: 'Altura mobile', type: 'text', placeholder: '50vh' },
			{
				path: 'textAlign',
				label: 'Alinhamento texto desktop',
				type: 'select',
				options: [
					{ label: 'Centro', value: 'center' },
					{ label: 'Esquerda', value: 'left' },
					{ label: 'Direita', value: 'right' }
				]
			},
			{
				path: 'textAlignMobile',
				label: 'Alinhamento texto mobile',
				type: 'select',
				options: [
					{ label: 'Centro', value: 'center' },
					{ label: 'Esquerda', value: 'left' },
					{ label: 'Direita', value: 'right' }
				]
			},
			{ path: 'overlay', label: 'Overlay escuro', type: 'boolean' },
			{
				path: 'titleShadow.enabled',
				label: 'Título • sombra ativada',
				type: 'boolean',
				helpText: 'Ativa a sombra configurável do intertítulo.'
			},
			{
				path: 'titleShadow.offsetX',
				label: 'Título • deslocamento X',
				type: 'text',
				placeholder: '0px'
			},
			{
				path: 'titleShadow.offsetY',
				label: 'Título • deslocamento Y',
				type: 'text',
				placeholder: '3px'
			},
			{ path: 'titleShadow.blur', label: 'Título • blur', type: 'text', placeholder: '18px' },
			{
				path: 'titleShadow.color',
				label: 'Título • cor da sombra',
				type: 'color',
				showAlpha: true,
				allowClear: true,
				clearValue: ''
			},
			{
				path: 'subtitleShadow.enabled',
				label: 'Subtítulo • sombra ativada',
				type: 'boolean',
				helpText: 'Melhore a leitura do subtítulo sobre fundos claros.'
			},
			{
				path: 'subtitleShadow.offsetX',
				label: 'Subtítulo • deslocamento X',
				type: 'text',
				placeholder: '0px'
			},
			{
				path: 'subtitleShadow.offsetY',
				label: 'Subtítulo • deslocamento Y',
				type: 'text',
				placeholder: '2px'
			},
			{ path: 'subtitleShadow.blur', label: 'Subtítulo • blur', type: 'text', placeholder: '12px' },
			{
				path: 'subtitleShadow.color',
				label: 'Subtítulo • cor da sombra',
				type: 'color',
				showAlpha: true,
				allowClear: true,
				clearValue: ''
			},
			{
				path: 'titleFontSizeDesktop',
				label: 'Título • tamanho desktop',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'titleFontSizeMobile',
				label: 'Título • tamanho mobile',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'titleLineHeightDesktop',
				label: 'Título • altura linha desktop',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'titleLineHeightMobile',
				label: 'Título • altura linha mobile',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'subtitleFontSizeDesktop',
				label: 'Subtítulo • tamanho desktop',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'subtitleFontSizeMobile',
				label: 'Subtítulo • tamanho mobile',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'subtitleLineHeightDesktop',
				label: 'Subtítulo • altura linha desktop',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'subtitleLineHeightMobile',
				label: 'Subtítulo • altura linha mobile',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'titleFontWeight',
				label: 'Título • peso',
				type: 'select',
				options: [
					{ label: 'Herda do tema (800)', value: '' },
					{ label: 'Light (300)', value: '300' },
					{ label: 'Normal (400)', value: '400' },
					{ label: 'Semi-bold (600)', value: '600' },
					{ label: 'Bold (700)', value: '700' },
					{ label: 'Extra Bold (800)', value: '800' },
					{ label: 'Black (900)', value: '900' }
				]
			},
			{
				path: 'titleFontStyle',
				label: 'Título • estilo',
				type: 'select',
				options: [
					{ label: 'Herda do tema (normal)', value: '' },
					{ label: 'Normal', value: 'normal' },
					{ label: 'Itálico', value: 'italic' }
				]
			},
			{
				path: 'subtitleFontWeight',
				label: 'Subtítulo • peso',
				type: 'select',
				options: [
					{ label: 'Herda do tema (400)', value: '' },
					{ label: 'Light (300)', value: '300' },
					{ label: 'Normal (400)', value: '400' },
					{ label: 'Semi-bold (600)', value: '600' },
					{ label: 'Bold (700)', value: '700' }
				]
			},
			{
				path: 'subtitleFontStyle',
				label: 'Subtítulo • estilo',
				type: 'select',
				options: [
					{ label: 'Herda do tema (normal)', value: '' },
					{ label: 'Normal', value: 'normal' },
					{ label: 'Itálico', value: 'italic' }
				]
			}
		]
	},
	{
		type: 'texto',
		label: 'Texto',
		icon: '📝',
		category: 'Narrativa',
		description: 'Parágrafo de texto com suporte a HTML, citação e ajustes.',
		component: StoryText,
		defaultData: {
			type: 'texto',
			text: '<p>Escreva aqui o texto do parágrafo.</p>',
			variant: 'body',
			align: 'left',
			maxWidth: '720px',
			maxWidthDesktop: '',
			maxWidthMobile: '',
			widthDesktop: '',
			widthMobile: '',
			containerWidth: '',
			containerWidthDesktop: '',
			containerWidthMobile: '',
			containerMaxWidth: '',
			containerMaxWidthDesktop: '',
			containerMaxWidthMobile: '',
			containerMinHeight: '',
			containerMinHeightDesktop: '',
			containerMinHeightMobile: '',
			horizontalPosition: 'center',
			verticalPosition: 'top',
			fontSizeDesktop: '',
			fontSizeMobile: '',
			lineHeightDesktop: '',
			lineHeightMobile: '',
			textColor: ''
		},
		fields: [
			{ path: 'text', label: 'Conteúdo (HTML)', type: 'richtext', rows: 6 },
			{
				path: 'variant',
				label: 'Estilo',
				type: 'select',
				options: [
					{ label: 'Corpo', value: 'body' },
					{ label: 'Lead', value: 'lead' },
					{ label: 'Citação', value: 'quote' }
				]
			},
			{
				path: 'align',
				label: 'Alinhamento',
				type: 'select',
				options: [
					{ label: 'Esquerda', value: 'left' },
					{ label: 'Centro', value: 'center' },
					{ label: 'Direita', value: 'right' },
					{ label: 'Justificado', value: 'justify' }
				]
			},
			{ path: 'maxWidth', label: 'Largura máxima', type: 'text', placeholder: '720px' },
			{
				path: 'maxWidthDesktop',
				label: 'Max desktop',
				type: 'text',
				placeholder: '720px ou 70%'
			},
			{
				path: 'maxWidthMobile',
				label: 'Max mobile',
				type: 'text',
				placeholder: '360px ou 90%'
			},
			{ path: 'widthDesktop', label: 'Largura desktop', type: 'text', placeholder: 'auto' },
			{ path: 'widthMobile', label: 'Largura mobile', type: 'text', placeholder: 'auto' },
			{
				path: 'horizontalPosition',
				label: 'Posição horizontal',
				type: 'select',
				options: [
					{ label: 'Centro', value: 'center' },
					{ label: 'Esquerda', value: 'left' },
					{ label: 'Direita', value: 'right' }
				]
			},
			{
				path: 'verticalPosition',
				label: 'Posição vertical',
				type: 'select',
				options: [
					{ label: 'Topo', value: 'top' },
					{ label: 'Centro', value: 'center' },
					{ label: 'Base', value: 'bottom' }
				]
			},
			{
				path: 'containerMinHeightDesktop',
				label: 'Altura mínima desktop',
				type: 'text',
				placeholder: 'auto ou 80vh'
			},
			{
				path: 'containerMinHeightMobile',
				label: 'Altura mínima mobile',
				type: 'text',
				placeholder: 'auto'
			},
			{ path: 'author', label: 'Autor (para citações)', type: 'text' },
			{ path: 'role', label: 'Cargo (para citações)', type: 'text' },
			{
				path: 'fontSizeDesktop',
				label: 'Tamanho desktop',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'fontSizeMobile',
				label: 'Tamanho mobile',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'lineHeightDesktop',
				label: 'Altura linha desktop',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'lineHeightMobile',
				label: 'Altura linha mobile',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{ path: 'textColor', label: 'Cor do texto', type: 'color' }
		]
	},
	{
		type: 'citacao',
		label: 'Citação destacada',
		icon: '💬',
		category: 'Narrativa',
		description: 'Bloco de citação com destaque visual e crédito.',
		component: StoryText,
		defaultData: {
			type: 'citacao',
			text: '<p>"Uma fala marcante para destacar na matéria."</p>',
			author: '',
			role: '',
			fontSizeDesktop: '',
			fontSizeMobile: '',
			lineHeightDesktop: '',
			lineHeightMobile: '',
			textColor: ''
		},
		fields: [
			{ path: 'text', label: 'Texto da citação', type: 'richtext', rows: 4 },
			{ path: 'author', label: 'Autor(a)', type: 'text' },
			{ path: 'role', label: 'Cargo/Função', type: 'text' },
			{
				path: 'fontSizeDesktop',
				label: 'Tamanho desktop',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'fontSizeMobile',
				label: 'Tamanho mobile',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'lineHeightDesktop',
				label: 'Altura linha desktop',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'lineHeightMobile',
				label: 'Altura linha mobile',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{ path: 'textColor', label: 'Cor do texto', type: 'color' }
		]
	},
	{
		type: 'foto',
		label: 'Foto com legenda',
		icon: '🖼️',
		category: 'Mídia',
		description: 'Imagem responsiva com legenda, crédito e link opcional.',
		component: PhotoWithCaption,
		defaultData: {
			type: 'foto',
			src: 'https://via.placeholder.com/1600x900',
			srcMobile: 'https://via.placeholder.com/900x1600',
			alt: 'Descrição da imagem',
			caption: '',
			credit: '',
			fullWidth: false,
			widthDesktop: 'min(100%, 800px)',
			widthMobile: '100%',
			alignDesktop: 'center',
			alignMobile: 'center',
			link: '',
			target: '_blank'
		},
		fields: [
			{ path: 'src', label: 'Imagem desktop (1600x900)', type: 'url', required: true },
			{
				path: 'srcMobile',
				label: 'Imagem mobile (900x1600)',
				type: 'url',
				required: true,
				description: 'Obrigatório para desempenho mobile.'
			},
			{ path: 'alt', label: 'Texto alternativo', type: 'text' },
			{ path: 'caption', label: 'Legenda (HTML)', type: 'richtext', rows: 3 },
			{ path: 'credit', label: 'Crédito', type: 'text' },
			{ path: 'fullWidth', label: 'Ocupar largura total', type: 'boolean' },
			{
				path: 'widthDesktop',
				label: 'Largura desktop',
				type: 'text',
				placeholder: 'min(100%, 800px)',
				description: 'Aceita %, px, vw, clamp, etc.'
			},
			{
				path: 'widthMobile',
				label: 'Largura mobile',
				type: 'text',
				placeholder: '100%'
			},
			{
				path: 'alignDesktop',
				label: 'Alinhamento desktop',
				type: 'select',
				options: [
					{ label: 'Esquerda', value: 'left' },
					{ label: 'Centralizado', value: 'center' },
					{ label: 'Direita', value: 'right' }
				],
				description: 'Aplicado quando a largura for menor que 100%.'
			},
			{
				path: 'alignMobile',
				label: 'Alinhamento mobile',
				type: 'select',
				options: [
					{ label: 'Esquerda', value: 'left' },
					{ label: 'Centralizado', value: 'center' },
					{ label: 'Direita', value: 'right' }
				],
				description: 'Aplicado quando a largura for menor que 100%.'
			},
			{ path: 'link', label: 'Link opcional', type: 'url' },
			{
				path: 'target',
				label: 'Abertura do link',
				type: 'select',
				options: [
					{ label: 'Mesma aba', value: '_self' },
					{ label: 'Nova aba', value: '_blank' }
				]
			}
		]
	},
	{
		type: 'video',
		label: 'Vídeo MP4',
		icon: '🎥',
		category: 'Mídia',
		description: 'Player otimizado com pôster, autoplay opcional e largura customizável.',
		component: VideoPlayer,
		defaultData: {
			type: 'video',
			src: '',
			srcMobile: '',
			poster: '',
			posterMobile: '',
			caption: '',
			credit: '',
			autoplay: false,
			controls: true,
			loop: false,
			showCaption: true,
			alignment: 'center',
			customWidthDesktop: '960px',
			customWidthMobile: '360px',
			aspectRatioDesktop: '16/9',
			aspectRatioMobile: '9/16',
			backgroundColor: '#0f172a',
			fullWidth: false,
			fullWidthBackground: false
		},
		fields: [
			{ path: 'src', label: 'Vídeo desktop (mp4)', type: 'url', required: true },
			{
				path: 'srcMobile',
				label: 'Vídeo mobile (mp4)',
				type: 'url',
				required: true,
				description: 'Versão otimizada para redes móveis.'
			},
			{ path: 'poster', label: 'Poster desktop (jpg/png)', type: 'url', required: true },
			{ path: 'posterMobile', label: 'Poster mobile (jpg/png)', type: 'url', required: true },
			{ path: 'caption', label: 'Legenda (HTML)', type: 'richtext', rows: 2 },
			{ path: 'credit', label: 'Crédito', type: 'text' },
			{
				path: 'autoplay',
				label: 'Autoplay',
				type: 'boolean',
				helpText: 'Será silenciado no carregamento inicial.'
			},
			{ path: 'controls', label: 'Exibir controles nativos', type: 'boolean' },
			{ path: 'loop', label: 'Loop infinito', type: 'boolean' },
			{ path: 'showCaption', label: 'Mostrar legenda/credito abaixo', type: 'boolean' },
			{
				path: 'alignment',
				label: 'Alinhamento do player',
				type: 'select',
				options: [
					{ label: 'Centralizado', value: 'center' },
					{ label: 'Esquerda', value: 'left' },
					{ label: 'Direita', value: 'right' }
				]
			},
			{ path: 'customWidthDesktop', label: 'Largura desktop', type: 'text', placeholder: '960px' },
			{ path: 'customWidthMobile', label: 'Largura mobile', type: 'text', placeholder: '360px' },
			{ path: 'aspectRatioDesktop', label: 'Proporção desktop', type: 'text', placeholder: '16/9' },
			{ path: 'aspectRatioMobile', label: 'Proporção mobile', type: 'text', placeholder: '9/16' },
			{ path: 'backgroundColor', label: 'Cor de fundo', type: 'color' },
			{ path: 'fullWidth', label: 'Ocupar toda a largura', type: 'boolean' },
			{ path: 'fullWidthBackground', label: 'Fundo em largura total', type: 'boolean' }
		]
	},
	{
		type: 'globo-player',
		label: 'Globo Player',
		icon: '📺',
		category: 'Mídia',
		description: 'Embed oficial da Globo com suporte a IDs desktop/mobile e background.',
		component: GloboPlayer,
		defaultData: {
			type: 'globo-player',
			videoIdDesktop: '',
			videoIdMobile: '',
			videoId: '',
			containerBackgroundColor: '#000000',
			widthDesktop: '100%',
			widthMobile: '100%',
			aspectRatio: '16 / 9',
			aspectRatioMobile: '9 / 16',
			autoPlay: false,
			startMuted: true,
			skipDFP: false,
			controls: true,
			showCaption: true,
			caption: '',
			credit: '',
			fullWidth: false
		},
		fields: [
			{ path: 'videoIdDesktop', label: 'Video ID desktop', type: 'text', required: true },
			{ path: 'videoIdMobile', label: 'Video ID mobile', type: 'text', required: true },
			{
				path: 'videoId',
				label: 'Video ID fallback',
				type: 'text',
				description: 'Usado se os campos específicos não estiverem disponíveis.'
			},
			{ path: 'containerBackgroundColor', label: 'Cor do container', type: 'color' },
			{ path: 'widthDesktop', label: 'Largura desktop', type: 'text', placeholder: '100%' },
			{ path: 'widthMobile', label: 'Largura mobile', type: 'text', placeholder: '100%' },
			{ path: 'aspectRatio', label: 'Aspect ratio desktop', type: 'text', placeholder: '16 / 9' },
			{
				path: 'aspectRatioMobile',
				label: 'Aspect ratio mobile',
				type: 'text',
				placeholder: '9 / 16'
			},
			{ path: 'autoPlay', label: 'Autoplay', type: 'boolean' },
			{ path: 'startMuted', label: 'Iniciar sem som', type: 'boolean' },
			{ path: 'skipDFP', label: 'Pular anúncios DFP', type: 'boolean' },
			{ path: 'controls', label: 'Exibir controles', type: 'boolean' },
			{ path: 'showCaption', label: 'Mostrar legenda/crédito', type: 'boolean' },
			{ path: 'caption', label: 'Legenda (HTML)', type: 'richtext', rows: 2 },
			{ path: 'credit', label: 'Crédito', type: 'text' },
			{ path: 'fullWidth', label: 'Largura total', type: 'boolean' }
		]
	},
	{
		type: 'galeria',
		label: 'Galeria de fotos',
		icon: '🗂️',
		category: 'Mídia',
		description: 'Grade responsiva para múltiplas imagens com suporte a lightbox.',
		component: PhotoGallery,
		defaultData: {
			type: 'galeria',
			images: [
				{
					src: '',
					srcMobile: '',
					alt: '',
					caption: '',
					captionMobile: '',
					credit: '',
					creditMobile: ''
				}
			],
			layout: 'grid',
			columns: 3,
			gap: '1rem',
			lightbox: true,
			backgroundColor: '',
			backgroundImage: '',
			backgroundVideo: ''
		},
		fields: [
			{ path: 'images', label: 'Imagens', type: 'gallery-items' },
			{
				path: 'layout',
				label: 'Layout',
				type: 'select',
				options: [
					{ label: 'Grid', value: 'grid' },
					{ label: 'Masonry', value: 'masonry' }
				]
			},
			{ path: 'columns', label: 'Colunas', type: 'number', min: 1, max: 6 },
			{ path: 'gap', label: 'Espaçamento entre fotos', type: 'text', placeholder: '1rem' },
			{ path: 'lightbox', label: 'Ativar lightbox', type: 'boolean' },
			{ path: 'backgroundColor', label: 'Cor de fundo', type: 'color' },
			{ path: 'backgroundImage', label: 'Imagem de fundo', type: 'url' },
			{ path: 'backgroundVideo', label: 'Vídeo de fundo (mp4)', type: 'url' }
		]
	},
	{
		type: 'carousel',
		label: 'Carrossel',
		icon: '🎠',
		category: 'Mídia',
		description: 'Carrossel com itens customizáveis (imagens, cards, vídeos).',
		component: Carousel,
		defaultData: {
			type: 'carousel',
			items: [
				{
					type: 'image',
					src: '',
					srcMobile: '',
					alt: '',
					caption: '',
					credit: ''
				}
			],
			autoplay: false,
			interval: 4000,
			showDots: true,
			showArrows: true
		},
		fields: [
			{
				path: 'items',
				label: 'Slides',
				type: 'carousel-items'
			},
			{ path: 'autoplay', label: 'Autoplay', type: 'boolean' },
			{ path: 'interval', label: 'Intervalo em ms', type: 'number', min: 1000, step: 250 },
			{ path: 'showDots', label: 'Mostrar indicadores', type: 'boolean' },
			{ path: 'showArrows', label: 'Mostrar setas', type: 'boolean' }
		]
	},
	{
		type: 'globoplayer-carousel',
		label: 'Carrossel GloboPlay',
		icon: '📺',
		category: 'Mídia',
		description:
			'Carrossel com reprodução automática e botão de áudio usando vídeos do GloboPlay (2 a 10 itens).',
		component: GloboPlayerCarousel,
		defaultData: {
			type: 'globoplayer-carousel',
			videos: [
				{
					title: 'Destaque 1',
					videoIdDesktop: '',
					videoIdMobile: '',
					videoId: '',
					caption: '',
					credit: '',
					hasAds: false
				},
				{
					title: 'Destaque 2',
					videoIdDesktop: '',
					videoIdMobile: '',
					videoId: '',
					caption: '',
					credit: '',
					hasAds: false
				}
			],
			autoplay: true,
			interval: 6000,
			showDots: true,
			showArrows: true,
			audioButtonBackground: 'rgba(0, 0, 0, 0.7)',
			audioButtonHoverBackground: 'rgba(0, 0, 0, 0.85)',
			audioButtonTextColor: '#ffffff',
			fallbackTitlePrefix: 'Vídeo'
		},
		fields: [
			{ path: 'videos', label: 'Lista de vídeos', type: 'globoplayer-slides' },
			{
				path: 'autoplay',
				label: 'Girar automaticamente',
				type: 'boolean',
				description: 'Ativa a rotação contínua enquanto o bloco estiver visível.'
			},
			{
				path: 'interval',
				label: 'Intervalo entre slides (ms)',
				type: 'number',
				min: 3000,
				step: 500
			},
			{ path: 'showDots', label: 'Mostrar indicadores (bolinhas)', type: 'boolean' },
			{ path: 'showArrows', label: 'Mostrar setas de navegação', type: 'boolean' },
			{ path: 'audioButtonBackground', label: 'Cor do botão de áudio', type: 'color' },
			{ path: 'audioButtonHoverBackground', label: 'Cor do botão de áudio (hover)', type: 'color' },
			{ path: 'audioButtonTextColor', label: 'Cor do texto do botão de áudio', type: 'color' },
			{
				path: 'fallbackTitlePrefix',
				label: 'Prefixo automático para títulos',
				type: 'text',
				placeholder: 'Vídeo'
			}
		]
	},
	{
		type: 'globoplayer-grid-slider',
		label: 'Grade GloboPlay com Slider',
		icon: '🎞️',
		category: 'Mídia',
		description:
			'Grade horizontal com slides configuráveis usando vídeos do GloboPlay (arraste ou use setas).',
		component: GloboPlayerGridSlider,
		defaultData: {
			type: 'globoplayer-grid-slider',
			slides: [
				{
					title: 'Slide inicial',
					description: 'Combine vídeos horizontais e verticais no mesmo quadro.',
					backgroundColor: '',
					gapDesktop: '1.5rem',
					gapMobile: '1rem',
					paddingDesktop: '1.5rem 0',
					paddingMobile: '1rem 0',
					videos: [
						{
							title: 'Vídeo principal',
							videoIdDesktop: '',
							videoIdMobile: '',
							videoId: '',
							caption: '',
							credit: '',
							autoPlay: false,
							startMuted: true,
							showCaption: true,
							backgroundColor: '',
							spanDesktop: null,
							spanTablet: null,
							spanMobile: null,
							aspectRatio: '16 / 9',
							aspectRatioMobile: '9 / 16'
						},
						{
							title: 'Vídeo complementar',
							videoIdDesktop: '',
							videoIdMobile: '',
							videoId: '',
							caption: '',
							credit: '',
							autoPlay: false,
							startMuted: true,
							showCaption: true,
							backgroundColor: '',
							spanDesktop: null,
							spanTablet: null,
							spanMobile: null,
							aspectRatio: '16 / 9',
							aspectRatioMobile: '9 / 16'
						}
					]
				},
				{
					title: 'Slide vertical',
					description: '',
					backgroundColor: '',
					gapDesktop: '1.5rem',
					gapMobile: '1rem',
					paddingDesktop: '1.5rem 0',
					paddingMobile: '1rem 0',
					videos: [
						{
							title: 'Vídeo vertical',
							videoIdDesktop: '',
							videoIdMobile: '',
							videoId: '',
							caption: '',
							credit: '',
							autoPlay: false,
							startMuted: true,
							showCaption: true,
							backgroundColor: '',
							spanDesktop: null,
							spanTablet: null,
							spanMobile: null,
							aspectRatio: '9 / 16',
							aspectRatioMobile: '9 / 16'
						},
						{
							title: 'Vídeo horizontal',
							videoIdDesktop: '',
							videoIdMobile: '',
							videoId: '',
							caption: '',
							credit: '',
							autoPlay: false,
							startMuted: true,
							showCaption: true,
							backgroundColor: '',
							spanDesktop: null,
							spanTablet: null,
							spanMobile: null,
							aspectRatio: '16 / 9',
							aspectRatioMobile: '16 / 9'
						}
					]
				}
			],
			showArrows: true,
			showDots: true,
			enableDrag: true,
			gapDesktop: '1.5rem',
			gapMobile: '1rem',
			paddingDesktop: '1.5rem 0',
			paddingMobile: '1rem 0',
			backgroundColor: '',
			borderRadius: '0',
			tabletBreakpoint: '1024px',
			mobileBreakpoint: '768px'
		},
		fields: [
			{ path: 'slides', label: 'Slides', type: 'globoplayer-grid-slides' },
			{ path: 'showArrows', label: 'Mostrar setas de navegação', type: 'boolean' },
			{ path: 'showDots', label: 'Mostrar indicadores', type: 'boolean' },
			{
				path: 'enableDrag',
				label: 'Permitir arrastar com mouse/touch',
				type: 'boolean'
			},
			{
				path: 'gapDesktop',
				label: 'Espaçamento entre vídeos no desktop',
				type: 'text',
				placeholder: '1.5rem'
			},
			{
				path: 'gapMobile',
				label: 'Espaçamento entre vídeos no mobile',
				type: 'text',
				placeholder: '1rem'
			},
			{
				path: 'paddingDesktop',
				label: 'Padding do slide (desktop)',
				type: 'text',
				placeholder: '1.5rem 0'
			},
			{
				path: 'paddingMobile',
				label: 'Padding do slide (mobile)',
				type: 'text',
				placeholder: '1rem 0'
			},
			{
				path: 'backgroundColor',
				label: 'Cor de fundo geral',
				type: 'text',
				placeholder: 'transparent'
			},
			{ path: 'borderRadius', label: 'Raio da borda externa', type: 'text', placeholder: '0' },
			{
				path: 'tabletBreakpoint',
				label: 'Breakpoint tablet',
				type: 'text',
				placeholder: '1024px'
			},
			{
				path: 'mobileBreakpoint',
				label: 'Breakpoint mobile',
				type: 'text',
				placeholder: '768px'
			}
		]
	},
	{
		type: 'parallax',
		label: 'Parallax',
		icon: '🪂',
		category: 'Interativo',
		description: 'Bloco com efeito parallax e conteúdo sobreposto.',
		component: Parallax,
		defaultData: {
			type: 'parallax',
			image: '',
			imageMobile: '',
			height: '65vh',
			speed: 0.45,
			overlay: true,
			content: '',
			backgroundPosition: 'center center',
			backgroundPositionMobile: '',
			backgroundSize: 'cover',
			backgroundSizeMobile: '',
			backgroundBaseColor: '',
			backgroundBaseImage: '',
			backgroundBaseImageMobile: '',
			backgroundBasePosition: '',
			backgroundBasePositionMobile: '',
			backgroundBaseSize: '',
			backgroundBaseSizeMobile: ''
		},
		fields: [
			{ path: 'image', label: 'Imagem desktop (jpg/webp)', type: 'url', required: true },
			{ path: 'imageMobile', label: 'Imagem mobile', type: 'url', required: true },
			{ path: 'height', label: 'Altura', type: 'text', placeholder: '65vh' },
			{ path: 'speed', label: 'Velocidade do efeito', type: 'number', step: 0.05 },
			{ path: 'overlay', label: 'Overlay escuro', type: 'boolean' },
			{
				path: 'backgroundPosition',
				label: 'Posição da imagem (desktop)',
				type: 'text',
				placeholder: 'center center'
			},
			{
				path: 'backgroundPositionMobile',
				label: 'Posição da imagem (mobile)',
				type: 'text',
				placeholder: 'herda do desktop'
			},
			{
				path: 'backgroundSize',
				label: 'Tamanho da imagem (desktop)',
				type: 'text',
				placeholder: 'cover'
			},
			{
				path: 'backgroundSizeMobile',
				label: 'Tamanho da imagem (mobile)',
				type: 'text',
				placeholder: 'herda do desktop'
			},
			{ path: 'backgroundBaseColor', label: 'Cor de fundo (fallback)', type: 'color' },
			{ path: 'backgroundBaseImage', label: 'Imagem de fundo (desktop)', type: 'url' },
			{ path: 'backgroundBaseImageMobile', label: 'Imagem de fundo (mobile)', type: 'url' },
			{
				path: 'backgroundBasePosition',
				label: 'Fundo • posição desktop',
				type: 'text',
				placeholder: 'inherit'
			},
			{
				path: 'backgroundBasePositionMobile',
				label: 'Fundo • posição mobile',
				type: 'text',
				placeholder: 'herda do desktop'
			},
			{
				path: 'backgroundBaseSize',
				label: 'Fundo • tamanho desktop',
				type: 'text',
				placeholder: 'cover'
			},
			{
				path: 'backgroundBaseSizeMobile',
				label: 'Fundo • tamanho mobile',
				type: 'text',
				placeholder: 'herda do desktop'
			},
			{ path: 'content', label: 'HTML sobreposto', type: 'richtext', rows: 3 }
		]
	},
	{
		type: 'antes-depois',
		label: 'Antes & Depois',
		icon: '🪞',
		category: 'Interativo',
		description: 'Comparativo interativo com duas imagens e slider.',
		component: BeforeAfter,
		defaultData: {
			type: 'antes-depois',
			beforeImage: '',
			beforeImageMobile: '',
			beforeCaption: '',
			beforeCredit: '',
			afterImage: '',
			afterImageMobile: '',
			afterCaption: '',
			afterCredit: '',
			beforeLabel: 'Antes',
			afterLabel: 'Depois',
			orientation: 'vertical',
			width: '100%',
			maxWidth: '',
			widthMobile: '',
			maxWidthMobile: ''
		},
		fields: [
			{ path: 'beforeImage', label: 'Imagem "Antes"', type: 'url', required: true },
			{ path: 'beforeImageMobile', label: 'Imagem "Antes" (mobile)', type: 'url', required: true },
			{ path: 'afterImage', label: 'Imagem "Depois"', type: 'url', required: true },
			{ path: 'afterImageMobile', label: 'Imagem "Depois" (mobile)', type: 'url', required: true },
			{ path: 'beforeLabel', label: 'Legenda antes', type: 'text' },
			{ path: 'afterLabel', label: 'Legenda depois', type: 'text' },
			{ path: 'beforeCaption', label: 'Descrição antes (HTML)', type: 'textarea', rows: 2 },
			{ path: 'beforeCredit', label: 'Crédito antes', type: 'text' },
			{ path: 'afterCaption', label: 'Descrição depois (HTML)', type: 'textarea', rows: 2 },
			{ path: 'afterCredit', label: 'Crédito depois', type: 'text' },
			{
				path: 'orientation',
				label: 'Orientação do slider',
				type: 'select',
				options: [
					{ label: 'Vertical', value: 'vertical' },
					{ label: 'Horizontal', value: 'horizontal' }
				]
			},
			{
				path: 'width',
				label: 'Largura (desktop)',
				type: 'text',
				placeholder: 'ex: 100vw, 30vw, 600px'
			},
			{
				path: 'maxWidth',
				label: 'Largura máxima (desktop)',
				type: 'text',
				placeholder: 'opcional'
			},
			{
				path: 'widthMobile',
				label: 'Largura (mobile)',
				type: 'text',
				placeholder: 'ex: 100vw, 90vw'
			},
			{
				path: 'maxWidthMobile',
				label: 'Largura máxima (mobile)',
				type: 'text',
				placeholder: 'opcional'
			}
		]
	},
	{
		type: 'scrolly',
		label: 'Scrollytelling',
		icon: '📜',
		category: 'Interativo',
		description: 'Sequência de passos que avançam conforme o scroll.',
		component: ScrollyTelling,
		defaultData: {
			type: 'scrolly',
			steps: [
				{
					title: 'Título do passo',
					text: '<p>Descreva o momento desta passagem.</p>',
					position: 'right',
					variant: 'default',
					backgroundColor: 'rgba(15, 23, 42, 0.82)',
					overlayColor: 'rgba(0, 0, 0, 0.35)',
					textColor: '#F9FAFB',
					accentColor: '#C4170C',
					borderColor: 'rgba(255, 255, 255, 0.12)',
					padding: '2rem',
					maxWidth: '460px',
					maxWidthMobile: '92%',
					cardVisibility: 'card',
					slideFromBottom: true,
					travelDistance: 'auto',
					image: '',
					imageMobile: '',
					video: '',
					videoMobile: '',
					backgroundImage: '',
					backgroundImageMobile: '',
					backgroundVideo: '',
					backgroundVideoMobile: '',
					alt: '',
					caption: ''
				}
			],
			fullWidth: false,
			activationMode: 'exit',
			activationLine: 0,
			exitLine: 0
		},
		fields: [
			{
				path: 'steps',
				label: 'Passos do scrollytelling',
				type: 'scrolly-steps'
			},
			{ path: 'fullWidth', label: 'Ocupar largura total', type: 'boolean' },
			{
				path: 'activationMode',
				label: 'Trocar passo quando',
				type: 'select',
				options: [
					{ label: 'Quando o próximo card encosta no topo', value: 'enter' },
					{ label: 'Quando o card atual sai da tela', value: 'exit' }
				],
				description: 'Defina o momento em que o fundo e os passos avançam.'
			},
			{
				path: 'activationLine',
				label: 'Linha de ativação (0-1)',
				type: 'number',
				min: 0,
				max: 1,
				step: 0.05,
				description: 'Posição vertical usada como linha-guia. 0 = topo da viewport.'
			},
			{
				path: 'exitLine',
				label: 'Linha de saída (0-1)',
				type: 'number',
				min: 0,
				max: 1,
				step: 0.05,
				description: 'Para o modo "sair da tela", define onde o card precisa passar. 0 = topo.'
			}
		]
	},
	{
		type: 'scrollyframes',
		label: 'Scrolly Frames',
		icon: '🎞️',
		category: 'Interativo',
		description: 'Animação quadro a quadro controlada pelo scroll, com frames desktop/mobile.',
		component: ScrollyFrames,
		defaultData: {
			type: 'scrollyframes',
			imagePrefix: '',
			imagePrefixMobile: '',
			imageSuffix: '.jpg',
			imageSuffixMobile: '.webp',
			frameStart: 1,
			frameStop: 120,
			height: '400vh',
			showProgress: true,
			showTime: false,
			preloadFrames: 10
		},
		fields: [
			{
				path: 'imagePrefix',
				label: 'Prefixo desktop',
				type: 'text',
				placeholder: 'https://cdn/.../frame_'
			},
			{
				path: 'imagePrefixMobile',
				label: 'Prefixo mobile',
				type: 'text',
				placeholder: 'https://cdn/.../mobile/frame_'
			},
			{ path: 'imageSuffix', label: 'Extensão desktop', type: 'text', placeholder: '.jpg' },
			{ path: 'imageSuffixMobile', label: 'Extensão mobile', type: 'text', placeholder: '.webp' },
			{ path: 'frameStart', label: 'Frame inicial', type: 'number', min: 0 },
			{ path: 'frameStop', label: 'Frame final', type: 'number', min: 1 },
			{ path: 'height', label: 'Altura da seção', type: 'text', placeholder: '400vh' },
			{ path: 'showProgress', label: 'Mostrar barra de progresso', type: 'boolean' },
			{ path: 'showTime', label: 'Mostrar contador de frames', type: 'boolean' },
			{ path: 'preloadFrames', label: 'Raio de preload', type: 'number', min: 1, max: 40 }
		]
	},
	{
		type: 'flourish',
		label: 'Flourish Embed',
		icon: '📊',
		category: 'Interativo',
		description: 'Embed responsivo de visualizações Flourish.',
		component: FlourishEmbed,
		defaultData: {
			type: 'flourish',
			src: 'https://flo.uri.sh/visualisation/12345/embed',
			width: '100%',
			maxWidth: '800px',
			height: 'auto',
			heightMobile: 'auto',
			widthMobile: '100%',
			maxWidthMobile: '100%',
			caption: '',
			credit: ''
		},
		fields: [
			{ path: 'src', label: 'URL do Flourish', type: 'url', required: true },
			{ path: 'width', label: 'Largura desktop', type: 'text', placeholder: '100%' },
			{
				path: 'maxWidth',
				label: 'Largura máxima desktop',
				type: 'text',
				placeholder: '800px (use none para desativar)'
			},
			{ path: 'widthMobile', label: 'Largura mobile', type: 'text', placeholder: '100%' },
			{
				path: 'maxWidthMobile',
				label: 'Largura máxima mobile',
				type: 'text',
				placeholder: '100%'
			},
			{
				path: 'height',
				label: 'Altura desktop',
				type: 'text',
				placeholder: 'auto (ex: 80vh, 600px)'
			},
			{
				path: 'heightMobile',
				label: 'Altura mobile',
				type: 'text',
				placeholder: 'auto (ex: 80vh, 600px)'
			},
			{ path: 'caption', label: 'Legenda (HTML)', type: 'richtext', rows: 2 },
			{ path: 'credit', label: 'Crédito', type: 'text' }
		]
	},
	{
		type: 'flourish-scrolly',
		label: 'Flourish Scrolly',
		icon: '🌀',
		category: 'Interativo',
		description: 'História Flourish com etapas sincronizadas.',
		component: FlourishScrolly,
		defaultData: {
			type: 'flourish-scrolly',
			src: 'https://flo.uri.sh/story/12345/embed',
			steps: [],
			activationMode: 'exit',
			activationLine: 0,
			exitLine: 0
		},
		fields: [
			{ path: 'src', label: 'URL do story Flourish', type: 'url', required: true },
			{
				path: 'steps',
				label: 'Steps',
				type: 'flourish-scrolly-steps',
				description: 'Adicione cards de texto e associe a um slide do story Flourish.',
				emptyValue: []
			},
			{
				path: 'activationMode',
				label: 'Trocar passo quando',
				type: 'select',
				options: [
					{ label: 'Quando o próximo card encosta no topo', value: 'enter' },
					{ label: 'Quando o card atual sai da tela', value: 'exit' }
				]
			},
			{
				path: 'activationLine',
				label: 'Linha de ativação (0-1)',
				type: 'number',
				min: 0,
				max: 1,
				step: 0.05
			},
			{
				path: 'exitLine',
				label: 'Linha de saída (0-1)',
				type: 'number',
				min: 0,
				max: 1,
				step: 0.05
			}
		]
	},
	{
		type: 'recommended-items',
		label: 'Itens recomendados',
		icon: '🧲',
		category: 'Narrativa',
		hidden: true,
		description: 'Lista de conteúdos relacionados com layout grid ou lista.',
		component: RecommendedItems,
		defaultData: {
			type: 'recommended-items',
			title: 'conteúdos relacionados',
			layout: 'grid',
			columns: 5,
			showTitle: true,
			backgroundColor: '',
			titleColor: '',
			textColor: '',
			titleFontSizeDesktop: '',
			titleFontSizeMobile: '',
			itemTitleFontSizeDesktop: '',
			itemTitleFontSizeMobile: '',
			itemTextFontSizeDesktop: '',
			itemTextFontSizeMobile: '',
			items: []
		},
		fields: [
			{ path: 'title', label: 'Título da seção', type: 'text' },
			{
				path: 'layout',
				label: 'Layout',
				type: 'select',
				options: [
					{ label: 'Grade', value: 'grid' },
					{ label: 'Lista', value: 'list' }
				]
			},
			{ path: 'columns', label: 'Colunas (grid)', type: 'number', min: 1, max: 6 },
			{ path: 'showTitle', label: 'Exibir título', type: 'boolean' },
			{ path: 'backgroundColor', label: 'Cor de fundo', type: 'color' },
			{ path: 'titleColor', label: 'Cor do título', type: 'color' },
			{ path: 'textColor', label: 'Cor do texto', type: 'color' },
			{
				path: 'titleFontSizeDesktop',
				label: 'Título seção • tamanho desktop',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'titleFontSizeMobile',
				label: 'Título seção • tamanho mobile',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'itemTitleFontSizeDesktop',
				label: 'Item título • tamanho desktop',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'itemTitleFontSizeMobile',
				label: 'Item título • tamanho mobile',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'itemTextFontSizeDesktop',
				label: 'Item texto • tamanho desktop',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'itemTextFontSizeMobile',
				label: 'Item texto • tamanho mobile',
				type: 'text',
				placeholder: 'herda do tema'
			},
			{
				path: 'items',
				label: 'Itens (JSON)',
				type: 'json',
				rows: 8,
				placeholder: '[{"title":"","description":"","image":"","link":""}]',
				emptyValue: []
			}
		]
	},
	{
		type: 'character-presentation',
		label: 'Apresentação de personagens',
		icon: '🧑‍🤝‍🧑',
		category: 'Narrativa',
		hidden: true,
		description: 'Grade animada com personagens e descrições.',
		component: CharacterPresentation,
		defaultData: {
			type: 'character-presentation',
			personagens: [],
			shapeColor: '#dc2626',
			nameColor: '#0f172a',
			textColor: '#ffffff',
			backgroundColor: '#000000',
			animationSpeed: 'normal',
			sectionHeight: '100vh',
			sectionHeightMobile: '100vh'
		},
		fields: [
			{
				path: 'personagens',
				label: 'Personagens (JSON)',
				type: 'json',
				rows: 8,
				placeholder: '[{"nome":"Personagem","descricao":"Bio","foto":"https://..."}]',
				emptyValue: []
			},
			{ path: 'shapeColor', label: 'Cor dos elementos decorativos', type: 'color' },
			{ path: 'nameColor', label: 'Cor dos nomes', type: 'color' },
			{ path: 'textColor', label: 'Cor do texto', type: 'color' },
			{ path: 'backgroundColor', label: 'Cor de fundo', type: 'color' },
			{
				path: 'animationSpeed',
				label: 'Velocidade da animação',
				type: 'select',
				options: [
					{ label: 'Lenta', value: 'slow' },
					{ label: 'Normal', value: 'normal' },
					{ label: 'Rápida', value: 'fast' }
				]
			},
			{ path: 'sectionHeight', label: 'Altura desktop', type: 'text', placeholder: '100vh' },
			{ path: 'sectionHeightMobile', label: 'Altura mobile', type: 'text', placeholder: '100vh' }
		]
	},
	{
		type: 'curiosidades',
		label: 'Curiosidades',
		icon: '❓',
		category: 'Narrativa',
		hidden: true,
		description: 'Cartões animados com fatos e curiosidades.',
		component: Curiosidades,
		defaultData: {
			type: 'curiosidades',
			personagens: [],
			shapeColor: '#b51207',
			nameColor: '#0f172a',
			textColor: '#ffffff',
			backgroundColor: '#000000',
			quoteColor: '#ffd700'
		},
		fields: [
			{
				path: 'personagens',
				label: 'Itens (JSON)',
				type: 'json',
				rows: 8,
				placeholder: '[{"nome":"Curiosidade","descricao":"Texto","frase":"Quote"}]',
				emptyValue: []
			},
			{ path: 'shapeColor', label: 'Cor dos elementos', type: 'color' },
			{ path: 'nameColor', label: 'Cor do título', type: 'color' },
			{ path: 'textColor', label: 'Cor do texto', type: 'color' },
			{ path: 'backgroundColor', label: 'Cor de fundo', type: 'color' },
			{ path: 'quoteColor', label: 'Cor das citações', type: 'color' }
		]
	},
	{
		type: 'timeline-interactive',
		label: 'Timeline interativa',
		icon: '🗓️',
		category: 'Investigativo',
		hidden: true,
		description: 'Linha do tempo com eventos detalhados e animações.',
		component: TimelineInteractive,
		defaultData: {
			type: 'timeline-interactive',
			events: [],
			theme: 'dramatic',
			autoAdvance: false,
			showProgress: true,
			height: '100vh',
			fullWidth: false,
			highlightCurrent: true
		},
		fields: [
			{
				path: 'events',
				label: 'Eventos (JSON)',
				type: 'json',
				rows: 10,
				placeholder: '[{"title":"","date":"","description":""}]',
				emptyValue: []
			},
			{
				path: 'theme',
				label: 'Tema',
				type: 'select',
				options: [
					{ label: 'Investigativo', value: 'investigative' },
					{ label: 'Dramático', value: 'dramatic' },
					{ label: 'Clean', value: 'clean' }
				]
			},
			{ path: 'autoAdvance', label: 'Avanço automático', type: 'boolean' },
			{ path: 'showProgress', label: 'Mostrar barra de progresso', type: 'boolean' },
			{ path: 'height', label: 'Altura mínima', type: 'text', placeholder: '100vh' },
			{ path: 'fullWidth', label: 'Largura total', type: 'boolean' },
			{ path: 'highlightCurrent', label: 'Destacar evento atual', type: 'boolean' }
		]
	},
	{
		type: 'document-viewer',
		label: 'Documentos interativos',
		icon: '📄',
		category: 'Investigativo',
		hidden: true,
		description: 'Visualizador de documentos com marcações e galeria.',
		component: DocumentViewer,
		defaultData: {
			type: 'document-viewer',
			documents: [],
			classification: 'CONFIDENCIAL',
			theme: 'investigative',
			showWatermark: true,
			highlightAreas: [],
			allowDownload: false,
			showThumbnails: true
		},
		fields: [
			{
				path: 'documents',
				label: 'Documentos (JSON)',
				type: 'json',
				rows: 8,
				placeholder: '[{"title":"","src":"https://..."}]',
				emptyValue: []
			},
			{
				path: 'classification',
				label: 'Carimbo de classificação',
				type: 'text',
				placeholder: 'CONFIDENCIAL'
			},
			{
				path: 'theme',
				label: 'Tema',
				type: 'select',
				options: [
					{ label: 'Investigativo', value: 'investigative' },
					{ label: 'Neutro', value: 'neutral' },
					{ label: 'Escuro', value: 'dark' }
				]
			},
			{ path: 'showWatermark', label: 'Mostrar marca d água', type: 'boolean' },
			{
				path: 'highlightAreas',
				label: 'Áreas destacadas (JSON)',
				type: 'json',
				rows: 4,
				placeholder: '[{"page":1,"text":"..."}]',
				emptyValue: []
			},
			{ path: 'allowDownload', label: 'Permitir download', type: 'boolean' },
			{ path: 'showThumbnails', label: 'Mostrar miniaturas', type: 'boolean' }
		]
	},
	{
		type: 'crime-explainer',
		label: 'Crime Explainer',
		icon: '⚖️',
		category: 'Investigativo',
		hidden: true,
		description: 'Explica cada crime com penas, detalhes e interatividade.',
		component: CrimeExplainer,
		defaultData: {
			type: 'crime-explainer',
			crimes: [],
			theme: 'judicial',
			interactive: true,
			showPenalties: true,
			layout: 'cards',
			autoAdvance: false
		},
		fields: [
			{
				path: 'crimes',
				label: 'Lista de crimes (JSON)',
				type: 'json',
				rows: 8,
				placeholder: '[{"title":"","description":"","penalty":""}]',
				emptyValue: []
			},
			{
				path: 'theme',
				label: 'Tema visual',
				type: 'select',
				options: [
					{ label: 'Judicial', value: 'judicial' },
					{ label: 'Dramático', value: 'dramatic' },
					{ label: 'Clean', value: 'clean' }
				]
			},
			{ path: 'interactive', label: 'Interatividade ativada', type: 'boolean' },
			{ path: 'showPenalties', label: 'Mostrar penas', type: 'boolean' },
			{
				path: 'layout',
				label: 'Layout',
				type: 'select',
				options: [
					{ label: 'Cards', value: 'cards' },
					{ label: 'Linha do tempo', value: 'timeline' }
				]
			},
			{ path: 'autoAdvance', label: 'Avançar automaticamente', type: 'boolean' }
		]
	},
	{
		type: 'chart-bar',
		label: 'Gráfico de barras',
		icon: '📊',
		category: 'Charts',
		description: 'Comparativo simples de categorias utilizando barras verticais.',
		component: ChartBar,
		defaultData: {
			type: 'chart-bar',
			title: 'Vendas por categoria',
			titleTag: 'h3',
			titleColor: '',
			description: 'Distribuição de vendas por canal no último trimestre.',
			descriptionColor: '',
			notes: [],
			noteColor: '',
			footnote: '',
			footnoteColor: '',
			sourceLabel: '',
			sourceUrl: '',
			sourceColor: '',
			barColor: '#0ea5e9',
			highlightColor: '#facc15',
			highlights: [],
			dimOpacity: 0.35,
			annotations: [],
			annotationColor: '',
			tooltipEnabled: true,
			tooltipShowOriginalValue: true,
			valueLabelsMode: 'hover',
			valueLabelColor: '',
			valueLabelStroke: '',
			valueLabelStrokeWidth: 0,
			valueDivisor: 1,
			valueUnit: '',
			height: 400,
			showGrid: true,
			yTicks: 4,
			csvData: BAR_CHART_SAMPLE_CSV,
			csvUrl: '',
			sheetId: '',
			sheetGid: '',
			autoRefreshMinutes: 0,
			labelKey: 'label',
			valueKey: 'value',
			data: DEFAULT_BAR_CHART_DATA,
			enableTransitions: true,
			animationDuration: 450,
			animationDelay: 30,
			enableWheelZoom: false,
			wheelZoomIntensity: 0.25,
			enableBrush: false
		},
		fields: [
			{ path: 'title', label: 'Título', type: 'text', placeholder: 'Título do gráfico' },
			{
				path: 'titleTag',
				label: 'Nível do título',
				type: 'select',
				options: [
					{ label: 'H2', value: 'h2' },
					{ label: 'H3', value: 'h3' },
					{ label: 'H4', value: 'h4' }
				]
			},
			{ path: 'titleColor', label: 'Cor do título', type: 'color', allowClear: true },
			{
				path: 'description',
				label: 'Descrição',
				type: 'textarea',
				rows: 3,
				placeholder: 'Resumo que contextualiza o dado apresentado.'
			},
			{ path: 'descriptionColor', label: 'Cor da descrição', type: 'color', allowClear: true },
			{
				path: 'notes',
				label: 'Notas adicionais',
				type: 'textarea',
				rows: 3,
				placeholder: 'Use quebras de linha para múltiplas notas.'
			},
			{ path: 'noteColor', label: 'Cor das notas', type: 'color', allowClear: true },
			{ path: 'sourceLabel', label: 'Fonte (texto)', type: 'text', placeholder: 'Instituto...' },
			{ path: 'sourceUrl', label: 'Fonte (link)', type: 'text', placeholder: 'https://...' },
			{ path: 'sourceColor', label: 'Cor da fonte', type: 'color', allowClear: true },
			{
				path: 'footnote',
				label: 'Rodapé',
				type: 'textarea',
				rows: 2,
				placeholder: 'Ex.: Pesquisa realizada entre 1º e 15 de março.'
			},
			{ path: 'footnoteColor', label: 'Cor do rodapé', type: 'color', allowClear: true },
			{
				path: 'barColor',
				label: 'Cor das barras',
				type: 'color',
				showAlpha: false,
				allowClear: false
			},
			{
				path: 'highlightColor',
				label: 'Cor dos destaques',
				type: 'color',
				showAlpha: false
			},
			{
				path: 'highlights',
				label: 'Destacar rótulos',
				type: 'textarea',
				rows: 2,
				placeholder: 'Categoria A, Categoria C',
				description: 'Separe por vírgulas ou informe um array JSON de rótulos.'
			},
			{
				path: 'dimOpacity',
				label: 'Opacidade dos itens não destacados',
				type: 'number',
				min: 0,
				max: 1,
				step: 0.05
			},
			{
				path: 'annotations',
				label: 'Anotações (JSON)',
				type: 'textarea',
				rows: 6,
				placeholder: '[{"label":"Categoria A","text":"Maior crescimento","offsetY":-24}]',
				description: 'Use label/text e, opcionalmente, offsetX, offsetY, color.'
			},
			{
				path: 'annotationColor',
				label: 'Cor padrão das anotações',
				type: 'color',
				allowClear: true
			},
			{
				path: 'tooltipEnabled',
				label: 'Exibir tooltip ao passar o mouse',
				type: 'boolean',
				defaultValue: true
			},
			{
				path: 'tooltipShowOriginalValue',
				label: 'Mostrar valor original no tooltip',
				type: 'boolean',
				defaultValue: true
			},
			{
				path: 'valueLabelsMode',
				label: 'Exibir valores',
				type: 'select',
				options: [
					{ label: 'Apenas ao interagir', value: 'hover' },
					{ label: 'Sempre visíveis', value: 'always' },
					{ label: 'Ocultar valores', value: 'never' }
				]
			},
			{ path: 'valueLabelColor', label: 'Cor dos valores', type: 'color', allowClear: true },
			{
				path: 'valueLabelStroke',
				label: 'Contorno dos valores',
				type: 'color',
				allowClear: true
			},
			{
				path: 'valueLabelStrokeWidth',
				label: 'Espessura do contorno (px)',
				type: 'number',
				placeholder: '0'
			},
			{
				path: 'valueDivisor',
				label: 'Divisor dos valores',
				type: 'number',
				placeholder: '1',
				min: 1
			},
			{
				path: 'valueUnit',
				label: 'Sufixo / unidade',
				type: 'text',
				placeholder: 'mil, milhões, R$'
			},
			{
				path: 'height',
				label: 'Altura (px)',
				type: 'number',
				placeholder: '400'
			},
			{
				path: 'yTicks',
				label: 'Divisões no eixo Y',
				type: 'number',
				placeholder: '4'
			},
			{
				path: 'showGrid',
				label: 'Mostrar linhas de grade',
				type: 'boolean',
				defaultValue: true
			},
			{
				path: 'csvUrl',
				label: 'URL CSV externa',
				type: 'text',
				placeholder: 'https://docs.google.com/.../export?format=csv',
				description: 'Link direto para CSV (Google Sheets, S3, etc.).'
			},
			{
				path: 'sheetId',
				label: 'Google Sheets ID',
				type: 'text',
				placeholder: '1AbC...'
			},
			{ path: 'sheetGid', label: 'Sheet GID', type: 'text', placeholder: '0' },
			{
				path: 'autoRefreshMinutes',
				label: 'Atualizar a cada (minutos)',
				type: 'number',
				placeholder: '0',
				description: 'Defina 0 para manter um snapshot fixo.'
			},
			{
				path: 'labelKey',
				label: 'Coluna de rótulos',
				type: 'text',
				placeholder: 'label'
			},
			{
				path: 'valueKey',
				label: 'Coluna de valores',
				type: 'text',
				placeholder: 'value'
			},
			{
				path: 'csvData',
				label: 'Dados (CSV)',
				type: 'textarea',
				rows: 8,
				placeholder: 'label,value\nCategoria A,32\nCategoria B,45',
				description: 'Cole dados do Google Sheets ou CSV com as colunas label e value.'
			},
			{
				path: 'data',
				label: 'Dados em JSON (fallback)',
				type: 'json',
				rows: 6,
				placeholder: '[{"label":"Categoria","value":10}]',
				emptyValue: []
			},
			{
				path: 'enableTransitions',
				label: 'Transições animadas',
				type: 'boolean',
				defaultValue: true
			},
			{
				path: 'animationDuration',
				label: 'Duração das transições (ms)',
				type: 'number',
				placeholder: '450'
			},
			{
				path: 'animationDelay',
				label: 'Delay entre barras (ms)',
				type: 'number',
				placeholder: '30'
			},
			{
				path: 'enableWheelZoom',
				label: 'Ativar zoom com a roda do mouse',
				type: 'boolean',
				defaultValue: false
			},
			{
				path: 'wheelZoomIntensity',
				label: 'Intensidade do zoom',
				type: 'number',
				step: 0.05,
				min: 0.05,
				placeholder: '0.25'
			},
			{
				path: 'enableBrush',
				label: 'Permitir seleção por arrasto (brush)',
				type: 'boolean',
				defaultValue: false
			}
		]
	},
	{
		type: 'chart-line',
		label: 'Gráfico de linha',
		icon: '📈',
		category: 'Charts',
		description:
			'Série temporal ou sequencial com zoom, tooltip personalizável e banda min/máx opcional.',
		component: ChartLine,
		defaultData: {
			type: 'chart-line',
			title: 'Evolução anual de temperaturas globais',
			titleTag: 'h3',
			titleColor: '',
			description: 'Médias anuais com intervalo mínimo e máximo estimado.',
			descriptionColor: '',
			notes: [],
			noteColor: '',
			footnote: '',
			footnoteColor: '',
			sourceLabel: '',
			sourceUrl: '',
			sourceColor: '',
			csvData: LINE_CHART_SAMPLE_CSV,
			csvUrl: '',
			sheetId: '',
			sheetGid: '',
			autoRefreshMinutes: 0,
			xKey: 'date',
			yKey: 'value',
			yLowKey: 'min',
			yHighKey: 'max',
			data: DEFAULT_LINE_CHART_DATA,
			height: 360,
			margin: { top: 40, right: 32, bottom: 64, left: 80 },
			backgroundColor: '',
			fontFamily: 'inherit',
			fontSize: '0.85rem',
			lineColor: '#0ea5e9',
			lineWidth: 2.5,
			lineOpacity: 0.95,
			curveType: 'monotone',
			showArea: true,
			areaColor: 'rgba(14, 165, 233, 0.18)',
			areaOpacity: 1,
			gradientStops: '',
			showGrid: true,
			showXAxis: true,
			showYAxis: true,
			gridColor: 'rgba(148, 163, 184, 0.25)',
			gridDashArray: '3,3',
			axisColor: '',
			axisLineColor: '',
			pointColor: '#0f172a',
			pointRadius: 3.5,
			pointStroke: '#ffffff',
			pointStrokeWidth: 1.5,
			showPoints: false,
			pointFocusRadius: 5.5,
			xAxisLabel: '',
			yAxisLabel: '',
			axisLabelColor: '',
			axisLabelFontSize: '0.78rem',
			axisLabelOffset: { x: 36, y: 42 },
			valueLabels: false,
			valueLabelColor: '',
			valueLabelAnchor: 'middle',
			tooltipEnabled: true,
			tooltipShowOriginalValue: true,
			tooltipOffsetX: 0,
			tooltipOffsetY: -16,
			enableZoom: true,
			zoomMode: 'x',
			zoomScaleMin: 1,
			zoomScaleMax: 32,
			enableCrosshair: true,
			enableTransitions: true,
			animationType: 'draw',
			animationDuration: 600,
			animationEasing: 'cubic-bezier(0.22, 1, 0.36, 1)',
			yDomainPadding: 0.08,
			yNice: true,
			maxXTicks: 8,
			maxYTicks: 6
		},
		fields: [
			{ path: 'title', label: 'Título', type: 'text', placeholder: 'Título do gráfico' },
			{
				path: 'titleTag',
				label: 'Nível do título',
				type: 'select',
				options: [
					{ label: 'H2', value: 'h2' },
					{ label: 'H3', value: 'h3' },
					{ label: 'H4', value: 'h4' }
				]
			},
			{ path: 'titleColor', label: 'Cor do título', type: 'color', allowClear: true },
			{
				path: 'description',
				label: 'Descrição',
				type: 'textarea',
				rows: 3,
				placeholder: 'Resumo que contextualiza o dado apresentado.'
			},
			{ path: 'descriptionColor', label: 'Cor da descrição', type: 'color', allowClear: true },
			{
				path: 'notes',
				label: 'Notas adicionais',
				type: 'textarea',
				rows: 3,
				placeholder: 'Use quebras de linha para múltiplas notas.'
			},
			{ path: 'noteColor', label: 'Cor das notas', type: 'color', allowClear: true },
			{ path: 'sourceLabel', label: 'Fonte (texto)', type: 'text', placeholder: 'Instituto...' },
			{ path: 'sourceUrl', label: 'Fonte (link)', type: 'text', placeholder: 'https://...' },
			{ path: 'sourceColor', label: 'Cor da fonte', type: 'color', allowClear: true },
			{
				path: 'footnote',
				label: 'Rodapé',
				type: 'textarea',
				rows: 2,
				placeholder: 'Ex.: Dados sujeitos a revisão.'
			},
			{ path: 'footnoteColor', label: 'Cor do rodapé', type: 'color', allowClear: true },
			{ path: 'backgroundColor', label: 'Cor de fundo', type: 'color', allowClear: true },
			{ path: 'fontFamily', label: 'Fonte', type: 'text', placeholder: 'inherit' },
			{
				path: 'fontSize',
				label: 'Tamanho base',
				type: 'text',
				placeholder: '0.85rem'
			},
			{ path: 'lineColor', label: 'Cor da linha', type: 'color' },
			{
				path: 'lineWidth',
				label: 'Espessura da linha',
				type: 'number',
				min: 0.5,
				step: 0.1,
				placeholder: '2.5'
			},
			{
				path: 'lineOpacity',
				label: 'Opacidade da linha',
				type: 'number',
				min: 0,
				max: 1,
				step: 0.05
			},
			{
				path: 'curveType',
				label: 'Curva',
				type: 'select',
				options: [
					{ label: 'Linear', value: 'linear' },
					{ label: 'Monotônica', value: 'monotone' },
					{ label: 'Suave (Basis)', value: 'basis' },
					{ label: 'Degrau', value: 'step' }
				]
			},
			{
				path: 'showArea',
				label: 'Preencher área sob a curva',
				type: 'boolean',
				defaultValue: true
			},
			{ path: 'areaColor', label: 'Cor da área', type: 'color', allowClear: true },
			{
				path: 'areaOpacity',
				label: 'Opacidade da área',
				type: 'number',
				min: 0,
				max: 1,
				step: 0.05
			},
			{
				path: 'gradientStops',
				label: 'Gradiente (JSON opcional)',
				type: 'textarea',
				rows: 4,
				placeholder:
					'[{"offset":"0%","color":"#0ea5e9","opacity":0.9},{"offset":"100%","color":"#38bdf8","opacity":0.1}]',
				description: 'Informe um array JSON com offset, color, opacity para personalizar a área.'
			},
			{
				path: 'showGrid',
				label: 'Mostrar linhas de grade',
				type: 'boolean',
				defaultValue: true
			},
			{ path: 'gridColor', label: 'Cor da grade', type: 'color', allowClear: true },
			{
				path: 'gridDashArray',
				label: 'Tracejado da grade',
				type: 'text',
				placeholder: '3,3'
			},
			{
				path: 'showXAxis',
				label: 'Exibir eixo X',
				type: 'boolean',
				defaultValue: true
			},
			{
				path: 'showYAxis',
				label: 'Exibir eixo Y',
				type: 'boolean',
				defaultValue: true
			},
			{ path: 'axisColor', label: 'Cor dos rótulos dos eixos', type: 'color', allowClear: true },
			{ path: 'axisLineColor', label: 'Cor das linhas dos eixos', type: 'color', allowClear: true },
			{ path: 'xAxisLabel', label: 'Legenda eixo X', type: 'text' },
			{ path: 'yAxisLabel', label: 'Legenda eixo Y', type: 'text' },
			{ path: 'axisLabelColor', label: 'Cor das legendas', type: 'color', allowClear: true },
			{
				path: 'axisLabelFontSize',
				label: 'Tamanho das legendas',
				type: 'text',
				placeholder: '0.78rem'
			},
			{
				path: 'axisLabelOffset',
				label: 'Offset das legendas (JSON)',
				type: 'json',
				rows: 3,
				placeholder: '{"x":36,"y":42}'
			},
			{
				path: 'showPoints',
				label: 'Exibir marcadores',
				type: 'boolean',
				defaultValue: false
			},
			{ path: 'pointColor', label: 'Cor dos pontos', type: 'color', allowClear: true },
			{
				path: 'pointRadius',
				label: 'Raio dos pontos',
				type: 'number',
				min: 0,
				step: 0.5
			},
			{ path: 'pointStroke', label: 'Borda dos pontos', type: 'color', allowClear: true },
			{
				path: 'pointStrokeWidth',
				label: 'Espessura da borda',
				type: 'number',
				min: 0,
				step: 0.5
			},
			{
				path: 'pointFocusRadius',
				label: 'Raio ao focar/hover',
				type: 'number',
				min: 0,
				step: 0.5
			},
			{
				path: 'valueLabels',
				label: 'Exibir valores sobre a linha',
				type: 'boolean',
				defaultValue: false
			},
			{ path: 'valueLabelColor', label: 'Cor dos valores', type: 'color', allowClear: true },
			{
				path: 'valueLabelAnchor',
				label: 'Alinhamento dos valores',
				type: 'select',
				options: [
					{ label: 'Esquerda', value: 'start' },
					{ label: 'Centro', value: 'middle' },
					{ label: 'Direita', value: 'end' }
				]
			},
			{
				path: 'tooltipEnabled',
				label: 'Exibir tooltip ao interagir',
				type: 'boolean',
				defaultValue: true
			},
			{
				path: 'tooltipShowOriginalValue',
				label: 'Mostrar valor original no tooltip',
				type: 'boolean',
				defaultValue: true
			},
			{
				path: 'tooltipOffsetX',
				label: 'Deslocamento tooltip X',
				type: 'number',
				step: 1
			},
			{
				path: 'tooltipOffsetY',
				label: 'Deslocamento tooltip Y',
				type: 'number',
				step: 1
			},
			{
				path: 'enableZoom',
				label: 'Habilitar zoom',
				type: 'boolean',
				defaultValue: true
			},
			{
				path: 'zoomMode',
				label: 'Direção do zoom',
				type: 'select',
				options: [
					{ label: 'Horizontal (X)', value: 'x' },
					{ label: 'Vertical (Y)', value: 'y' },
					{ label: 'Ambos', value: 'xy' }
				]
			},
			{
				path: 'zoomScaleMin',
				label: 'Zoom mínimo',
				type: 'number',
				min: 1,
				step: 0.5
			},
			{
				path: 'zoomScaleMax',
				label: 'Zoom máximo',
				type: 'number',
				min: 1,
				step: 0.5
			},
			{
				path: 'enableCrosshair',
				label: 'Exibir crosshair',
				type: 'boolean',
				defaultValue: true
			},
			{
				path: 'enableTransitions',
				label: 'Transições animadas',
				type: 'boolean',
				defaultValue: true
			},
			{
				path: 'animationType',
				label: 'Tipo de animação',
				type: 'select',
				options: [
					{ label: 'Desenhar linha', value: 'draw' },
					{ label: 'Fade-in', value: 'fade' },
					{ label: 'Sem animação', value: 'none' }
				]
			},
			{
				path: 'animationDuration',
				label: 'Duração da animação (ms)',
				type: 'number',
				placeholder: '600'
			},
			{
				path: 'animationEasing',
				label: 'Easing CSS',
				type: 'text',
				placeholder: 'cubic-bezier(0.22, 1, 0.36, 1)'
			},
			{
				path: 'yDomainPadding',
				label: 'Padding vertical (fração)',
				type: 'number',
				step: 0.01,
				placeholder: '0.08'
			},
			{
				path: 'yNice',
				label: 'Arredondar domínio Y',
				type: 'boolean',
				defaultValue: true
			},
			{
				path: 'maxXTicks',
				label: 'Máx. ticks no eixo X',
				type: 'number',
				placeholder: '8'
			},
			{
				path: 'maxYTicks',
				label: 'Máx. ticks no eixo Y',
				type: 'number',
				placeholder: '6'
			},
			{
				path: 'height',
				label: 'Altura (px)',
				type: 'number',
				placeholder: '360'
			},
			{
				path: 'margin',
				label: 'Margens (JSON)',
				type: 'json',
				rows: 3,
				placeholder: '{"top":40,"right":32,"bottom":64,"left":80}'
			},
			{
				path: 'csvUrl',
				label: 'URL CSV externa',
				type: 'text',
				placeholder: 'https://docs.google.com/.../export?format=csv'
			},
			{ path: 'sheetId', label: 'Google Sheets ID', type: 'text', placeholder: '1AbC...' },
			{ path: 'sheetGid', label: 'Sheet GID', type: 'text', placeholder: '0' },
			{
				path: 'autoRefreshMinutes',
				label: 'Atualizar a cada (minutos)',
				type: 'number',
				placeholder: '0',
				description: 'Defina 0 para manter um snapshot fixo.'
			},
			{ path: 'xKey', label: 'Coluna eixo X', type: 'text', placeholder: 'date' },
			{ path: 'yKey', label: 'Coluna valor', type: 'text', placeholder: 'value' },
			{ path: 'yLowKey', label: 'Coluna valor mínimo', type: 'text', placeholder: 'min' },
			{ path: 'yHighKey', label: 'Coluna valor máximo', type: 'text', placeholder: 'max' },
			{
				path: 'csvData',
				label: 'Dados (CSV)',
				type: 'textarea',
				rows: 8,
				placeholder: 'date,value,min,max\n2020-01-01,30,22,36\n2021-01-01,32,24,38'
			},
			{
				path: 'data',
				label: 'Dados em JSON (fallback)',
				type: 'json',
				rows: 6,
				placeholder: '[{"date":"2020-01-01","value":30,"min":22,"max":36}]',
				emptyValue: []
			}
		]
	},
	{
		type: 'flexible-layout',
		label: 'Flexible Layout',
		icon: '🧬',
		category: 'Layout',
		hidden: true,
		description: 'Hero flexível com textos posicionados e duas camadas de mídia.',
		component: FlexibleLayout,
		defaultData: {
			type: 'flexible-layout',
			text: 'Cabeçalho impactante<br>com imagens posicionadas',
			textAlign: 'left',
			textPosition: 'left',
			backgroundColor: '#020617',
			textColor: '#f8fafc',
			fontSize: 'clamp(2rem, 5vw, 4rem)',
			fontSizeMobile: 'clamp(1.6rem, 8vw, 2.8rem)',
			minHeight: '90vh',
			minHeightMobile: '80vh',
			padding: '3rem',
			paddingMobile: '1.5rem',
			textZIndex: '12',
			image1Desktop: '',
			image1Mobile: '',
			image1Width: '320px',
			image1Height: 'auto',
			image1WidthMobile: '220px',
			image1HeightMobile: 'auto',
			image1X: '10%',
			image1Y: '20%',
			image1XMobile: '50%',
			image1YMobile: '10%',
			image1ZIndex: '8',
			image2Desktop: '',
			image2Mobile: '',
			image2Width: '520px',
			image2Height: 'auto',
			image2WidthMobile: '320px',
			image2HeightMobile: 'auto',
			image2X: '60%',
			image2Y: '40%',
			image2XMobile: '50%',
			image2YMobile: '55%',
			image2ZIndex: '2',
			image2Position: 'right'
		},
		fields: [
			{ path: 'text', label: 'Texto (HTML suportado)', type: 'richtext', rows: 4 },
			{
				path: 'textAlign',
				label: 'Alinhamento do texto',
				type: 'select',
				options: [
					{ label: 'Esquerda', value: 'left' },
					{ label: 'Centro', value: 'center' },
					{ label: 'Direita', value: 'right' }
				]
			},
			{
				path: 'textPosition',
				label: 'Posição do bloco de texto',
				type: 'select',
				options: [
					{ label: 'Esquerda', value: 'left' },
					{ label: 'Centro', value: 'center' },
					{ label: 'Direita', value: 'right' }
				]
			},
			{ path: 'backgroundColor', label: 'Cor de fundo', type: 'color' },
			{ path: 'textColor', label: 'Cor do texto', type: 'color' },
			{
				path: 'fontSize',
				label: 'Font size desktop',
				type: 'text',
				placeholder: 'clamp(2rem, 5vw, 4rem)'
			},
			{
				path: 'fontSizeMobile',
				label: 'Font size mobile',
				type: 'text',
				placeholder: 'clamp(1.6rem, 8vw, 2.8rem)'
			},
			{ path: 'minHeight', label: 'Altura mínima desktop', type: 'text', placeholder: '90vh' },
			{ path: 'minHeightMobile', label: 'Altura mínima mobile', type: 'text', placeholder: '80vh' },
			{ path: 'padding', label: 'Padding desktop', type: 'text', placeholder: '3rem' },
			{ path: 'paddingMobile', label: 'Padding mobile', type: 'text', placeholder: '1.5rem' },
			{ path: 'textZIndex', label: 'Z-index do texto', type: 'number' },
			{ path: 'image1Desktop', label: 'Imagem destaque desktop', type: 'url' },
			{ path: 'image1Mobile', label: 'Imagem destaque mobile', type: 'url' },
			{ path: 'image1Width', label: 'Largura imagem 1 desktop', type: 'text' },
			{ path: 'image1WidthMobile', label: 'Largura imagem 1 mobile', type: 'text' },
			{ path: 'image1X', label: 'Posição X desktop imagem 1', type: 'text' },
			{ path: 'image1Y', label: 'Posição Y desktop imagem 1', type: 'text' },
			{ path: 'image1XMobile', label: 'Posição X mobile imagem 1', type: 'text' },
			{ path: 'image1YMobile', label: 'Posição Y mobile imagem 1', type: 'text' },
			{ path: 'image1ZIndex', label: 'Z-index imagem 1', type: 'number' },
			{ path: 'image2Desktop', label: 'Imagem principal desktop', type: 'url' },
			{ path: 'image2Mobile', label: 'Imagem principal mobile', type: 'url' },
			{ path: 'image2Width', label: 'Largura imagem 2 desktop', type: 'text' },
			{ path: 'image2WidthMobile', label: 'Largura imagem 2 mobile', type: 'text' },
			{ path: 'image2X', label: 'Posição X desktop imagem 2', type: 'text' },
			{ path: 'image2Y', label: 'Posição Y desktop imagem 2', type: 'text' },
			{ path: 'image2XMobile', label: 'Posição X mobile imagem 2', type: 'text' },
			{ path: 'image2YMobile', label: 'Posição Y mobile imagem 2', type: 'text' },
			{ path: 'image2ZIndex', label: 'Z-index imagem 2', type: 'number' },
			{
				path: 'image2Position',
				label: 'Posicionamento imagem 2',
				type: 'select',
				options: [
					{ label: 'Esquerda', value: 'left' },
					{ label: 'Direita', value: 'right' }
				]
			}
		]
	},
	{
		type: 'content-grid',
		label: 'Grid de colunas',
		icon: '🧩',
		category: 'Layout',
		description: 'Grade responsiva com colunas configuraveis (texto, imagem, video ou GloboPlay).',
		component: ContentGrid,
		defaultData: {
			type: 'content-grid',
			columnsDesktop: 3,
			gapDesktop: '1.5rem',
			gapMobile: '1rem',
			backgroundColor: '',
			paddingDesktop: '0',
			paddingMobile: '',
			borderRadius: '0',
			itemBackground: '',
			itemPadding: '0',
			itemBorderRadius: '0',
			mobileBreakpoint: '768px',
			items: [
				{
					type: 'text',
					pretitle: '',
					title: 'Titulo da coluna',
					subtitle: '',
					text: '<p>Insira o conteudo da coluna.</p>',
					align: 'start',
					callout: '',
					spanDesktop: 1,
					spanTablet: 1,
					spanMobile: 1,
					blocks: []
				},
				{
					type: 'image',
					title: 'Imagem ilustrativa',
					image: {
						desktop: '',
						mobile: '',
						alt: 'Descricao da imagem',
						caption: '',
						credit: ''
					},
					callout: '',
					spanDesktop: 1,
					spanTablet: 1,
					spanMobile: 1,
					blocks: []
				},
				{
					type: 'card',
					pretitle: '',
					title: 'Card com midia',
					subtitle: 'Combine midia e texto flexivel.',
					text: '<p>Apresente personagens, destaques ou dados ao lado de uma midia vertical.</p>',
					align: 'start',
					layout: 'media-left',
					mediaType: 'image',
					mediaImage: {
						desktop: '',
						mobile: '',
						alt: 'Descricao da imagem',
						caption: '',
						credit: ''
					},
					spanDesktop: 2,
					spanTablet: 2,
					spanMobile: 1,
					blocks: []
				}
			]
		},
		fields: [
			{
				path: 'columnsDesktop',
				label: 'Colunas (desktop)',
				type: 'number',
				min: 1,
				max: 6,
				required: true
			},
			{
				path: 'gapDesktop',
				label: 'Espaco entre colunas (desktop)',
				type: 'text',
				placeholder: '1.5rem'
			},
			{
				path: 'gapMobile',
				label: 'Espaco entre colunas (mobile)',
				type: 'text',
				placeholder: '1rem'
			},
			{ path: 'backgroundColor', label: 'Cor de fundo', type: 'color', allowClear: true },
			{ path: 'paddingDesktop', label: 'Padding desktop', type: 'text', placeholder: '0' },
			{ path: 'paddingMobile', label: 'Padding mobile', type: 'text', placeholder: '0' },
			{ path: 'borderRadius', label: 'Raio do container', type: 'text', placeholder: '0' },
			{ path: 'itemBackground', label: 'Cor dos itens', type: 'color', allowClear: true },
			{ path: 'itemPadding', label: 'Padding dos itens', type: 'text', placeholder: '0' },
			{ path: 'itemBorderRadius', label: 'Raio dos itens', type: 'text', placeholder: '0' },
			{ path: 'mobileBreakpoint', label: 'Breakpoint mobile', type: 'text', placeholder: '768px' },
			{
				path: 'items',
				label: 'Colunas do grid',
				type: 'content-grid-items',
				description: 'Adicione e configure cada coluna (texto, imagem, video, frase ou GloboPlay).',
				emptyValue: []
			}
		]
	},
	{
		type: 'media-text',
		label: 'Mídia + Texto',
		icon: '🖼️',
		category: 'Layout',
		description:
			'Bloco em duas colunas que combina mídia (imagem, vídeo ou GloboPlayer) com textos flexíveis.',
		component: MediaTextLayout,
		defaultData: {
			type: 'media-text',
			mediaType: 'image',
			mediaSrc: '',
			mediaSrcDesktop: '',
			mediaSrcMobile: '',
			mediaAlt: 'Descrição da mídia',
			mediaPoster: '',
			mediaAutoplay: true,
			mediaLoop: true,
			mediaMuted: true,
			mediaControls: false,
			mediaPlaysInline: true,
			mediaAspectRatio: '16 / 9',
			mediaBackground: 'transparent',
			mediaBorderRadius: '0.75rem',
			mediaHeightDesktop: '',
			mediaHeightMobile: '',
			mediaPadding: '0',
			mediaCaption: '',
			mediaCredit: '',
			mediaClass: '',
			globoPlayer: {
				videoIdDesktop: '',
				videoIdMobile: '',
				videoId: '',
				containerBackgroundColor: 'transparent',
				aspectRatio: '16 / 9',
				aspectRatioMobile: '16 / 9',
				startMuted: true,
				autoPlay: false,
				controls: true,
				showCaption: false
			},
			pretitle: '',
			title: 'Apresente seu destaque aqui',
			subtitle: 'Use o subtítulo para complementar a chamada principal.',
			text: '<p>Estruture o conteúdo com parágrafos, listas ou links para aprofundar a história.</p>',
			blockquote: '',
			blockquoteAuthor: '',
			blockquoteRole: '',
			textOrder: 'pretitle,title,subtitle,text,blockquote',
			textAlign: 'left',
			textColor: '',
			textSpacing: '1.25rem',
			textMaxWidth: '560px',
			mediaPosition: 'left',
			verticalAlign: 'center',
			gapDesktop: '2.5rem',
			gapMobile: '1.5rem',
			backgroundColor: 'transparent',
			paddingDesktop: '3rem 0',
			paddingMobile: '2rem 1rem',
			containerWidth: '100%',
			containerMaxWidth: '1200px',
			mediaWidthDesktop: 'minmax(0, 48%)',
			textWidthDesktop: 'minmax(0, 52%)',
			mediaWidthMobile: '100%',
			textWidthMobile: '100%',
			fullWidthOnMobile: false,
			shadow: '',
			mediaOrderMobile: 'auto'
		},
		fields: [
			{
				path: 'mediaType',
				label: 'Tipo de mídia',
				type: 'select',
				options: [
					{ label: 'Imagem (jpg/png/webp/gif)', value: 'image' },
					{ label: 'Vídeo MP4', value: 'video' },
					{ label: 'GloboPlayer', value: 'globo-player' }
				]
			},
			{ path: 'mediaSrc', label: 'Mídia principal (desktop)', type: 'url' },
			{ path: 'mediaSrcDesktop', label: 'Imagem/Vídeo desktop', type: 'url' },
			{ path: 'mediaSrcMobile', label: 'Imagem/Vídeo mobile', type: 'url' },
			{ path: 'mediaAlt', label: 'Texto alternativo', type: 'text' },
			{ path: 'mediaPoster', label: 'Poster do vídeo (jpg/png)', type: 'url' },
			{ path: 'mediaCaption', label: 'Legenda da mídia', type: 'richtext', rows: 2 },
			{ path: 'mediaCredit', label: 'Crédito da mídia', type: 'text' },
			{
				path: 'mediaAutoplay',
				label: 'Autoplay (vídeos)',
				type: 'boolean',
				helpText: 'Aplica-se apenas quando o tipo for vídeo.'
			},
			{ path: 'mediaLoop', label: 'Loop', type: 'boolean' },
			{ path: 'mediaMuted', label: 'Começar sem áudio', type: 'boolean' },
			{ path: 'mediaControls', label: 'Exibir controles nativos', type: 'boolean' },
			{ path: 'mediaPlaysInline', label: 'Plays inline', type: 'boolean' },
			{
				path: 'mediaAspectRatio',
				label: 'Aspect ratio da mídia',
				type: 'text',
				placeholder: '16 / 9'
			},
			{
				path: 'mediaHeightDesktop',
				label: 'Altura da mídia (desktop)',
				type: 'text',
				placeholder: 'auto',
				description: 'Use valores CSS (ex: 420px, 60vh). Quando definido, substitui o aspect ratio.'
			},
			{
				path: 'mediaHeightMobile',
				label: 'Altura da mídia (mobile)',
				type: 'text',
				placeholder: 'auto',
				description: 'Deixe vazio para herdar a altura de desktop.'
			},
			{ path: 'mediaBackground', label: 'Cor de fundo da mídia', type: 'color', allowClear: true },
			{
				path: 'mediaBorderRadius',
				label: 'Raio da borda da mídia',
				type: 'text',
				placeholder: '0.75rem'
			},
			{ path: 'mediaPadding', label: 'Padding interno da mídia', type: 'text', placeholder: '0' },
			{ path: 'mediaClass', label: 'Classe CSS extra para a mídia', type: 'text' },
			{
				path: 'mediaOrderMobile',
				label: 'Ordem da mídia no mobile',
				type: 'select',
				options: [
					{ label: 'Seguir layout desktop', value: 'auto' },
					{ label: 'Mídia antes do texto', value: 'media-first' },
					{ label: 'Mídia depois do texto', value: 'text-first' }
				],
				description: 'Controle independente da ordem vertical quando empilha no mobile.'
			},
			{
				path: 'shadow',
				label: 'Sombra (box-shadow)',
				type: 'text',
				placeholder: '0 20px 40px rgba(15,23,42,0.35)'
			},
			{
				path: 'globoPlayer.videoIdDesktop',
				label: 'GloboPlayer • videoId desktop',
				type: 'text',
				description: 'Preencha quando o tipo de mídia for GloboPlayer.'
			},
			{ path: 'globoPlayer.videoIdMobile', label: 'GloboPlayer • videoId mobile', type: 'text' },
			{
				path: 'globoPlayer.videoId',
				label: 'GloboPlayer • videoId fallback',
				type: 'text',
				description: 'Opcional, usado quando os IDs específicos não estiverem disponíveis.'
			},
			{
				path: 'globoPlayer.containerBackgroundColor',
				label: 'GloboPlayer • cor do container',
				type: 'color',
				allowClear: true
			},
			{
				path: 'globoPlayer.aspectRatio',
				label: 'GloboPlayer • aspect ratio desktop',
				type: 'text'
			},
			{
				path: 'globoPlayer.aspectRatioMobile',
				label: 'GloboPlayer • aspect ratio mobile',
				type: 'text'
			},
			{ path: 'globoPlayer.startMuted', label: 'GloboPlayer • iniciar sem som', type: 'boolean' },
			{ path: 'globoPlayer.autoPlay', label: 'GloboPlayer • autoplay', type: 'boolean' },
			{ path: 'globoPlayer.controls', label: 'GloboPlayer • exibir controles', type: 'boolean' },
			{
				path: 'globoPlayer.showCaption',
				label: 'GloboPlayer • mostrar legenda interna',
				type: 'boolean'
			},
			{ path: 'pretitle', label: 'Pré-título', type: 'text' },
			{ path: 'title', label: 'Título', type: 'text', required: true },
			{ path: 'subtitle', label: 'Subtítulo', type: 'textarea', rows: 2 },
			{ path: 'text', label: 'Texto (HTML)', type: 'richtext', rows: 6 },
			{ path: 'blockquote', label: 'Citação (HTML)', type: 'richtext', rows: 4 },
			{ path: 'blockquoteAuthor', label: 'Autor da citação', type: 'text' },
			{ path: 'blockquoteRole', label: 'Função/descrição do autor', type: 'text' },
			{
				path: 'textOrder',
				label: 'Ordem dos blocos de texto',
				type: 'text',
				placeholder: 'pretitle,title,subtitle,text,blockquote',
				description: 'Informe uma lista separada por vírgulas com os blocos desejados.'
			},
			{
				path: 'textAlign',
				label: 'Alinhamento do texto',
				type: 'select',
				options: [
					{ label: 'Esquerda', value: 'left' },
					{ label: 'Centro', value: 'center' },
					{ label: 'Direita', value: 'right' }
				]
			},
			{ path: 'textColor', label: 'Cor do texto', type: 'color', allowClear: true },
			{
				path: 'textSpacing',
				label: 'Espaçamento entre blocos de texto',
				type: 'text',
				placeholder: '1.25rem'
			},
			{
				path: 'textMaxWidth',
				label: 'Largura máxima do texto',
				type: 'text',
				placeholder: '560px'
			},
			{
				path: 'mediaPosition',
				label: 'Posição da mídia no desktop',
				type: 'select',
				options: [
					{ label: 'Mídia à esquerda', value: 'left' },
					{ label: 'Mídia à direita', value: 'right' }
				]
			},
			{
				path: 'verticalAlign',
				label: 'Alinhamento vertical',
				type: 'select',
				options: [
					{ label: 'Topo', value: 'top' },
					{ label: 'Centro', value: 'center' },
					{ label: 'Base', value: 'bottom' },
					{ label: 'Esticar', value: 'stretch' }
				]
			},
			{
				path: 'gapDesktop',
				label: 'Gap entre colunas (desktop)',
				type: 'text',
				placeholder: '2.5rem'
			},
			{
				path: 'gapMobile',
				label: 'Gap entre colunas (mobile)',
				type: 'text',
				placeholder: '1.5rem'
			},
			{ path: 'backgroundColor', label: 'Cor de fundo', type: 'color', allowClear: true },
			{ path: 'paddingDesktop', label: 'Padding desktop', type: 'text', placeholder: '3rem 0' },
			{ path: 'paddingMobile', label: 'Padding mobile', type: 'text', placeholder: '2rem 1rem' },
			{ path: 'containerWidth', label: 'Largura do container', type: 'text', placeholder: '100%' },
			{ path: 'containerMaxWidth', label: 'Largura máxima', type: 'text', placeholder: '1200px' },
			{
				path: 'mediaWidthDesktop',
				label: 'Largura da mídia (desktop)',
				type: 'text',
				placeholder: 'minmax(0, 48%)'
			},
			{
				path: 'textWidthDesktop',
				label: 'Largura do texto (desktop)',
				type: 'text',
				placeholder: 'minmax(0, 52%)'
			},
			{
				path: 'mediaWidthMobile',
				label: 'Largura da mídia (mobile)',
				type: 'text',
				placeholder: '100%'
			},
			{
				path: 'textWidthMobile',
				label: 'Largura do texto (mobile)',
				type: 'text',
				placeholder: '100%'
			},
			{
				path: 'fullWidthOnMobile',
				label: 'Forçar largura total no mobile',
				type: 'boolean',
				helpText: 'Expande mídia e texto até as bordas (útil para narrativas imersivas).'
			}
		]
	},

	{
		type: 'responsive-media',
		label: 'Responsive Media Layout',
		icon: '🖥️',
		category: 'Layout',
		hidden: true,
		description: 'Canvas responsivo com textos e imagens posicionadas via JSON.',
		component: ResponsiveMediaLayout,
		defaultData: {
			type: 'responsive-media',
			heightDesktop: '100vh',
			heightMobile: '100vh',
			backgroundType: 'color',
			backgroundColor: '#020617',
			backgroundImageDesktop: '',
			backgroundImageMobile: '',
			backgroundVideoDesktop: '',
			backgroundVideoMobile: '',
			backgroundPositionDesktop: 'center center',
			backgroundPositionMobile: 'center center',
			backgroundSizeDesktop: 'cover',
			backgroundSizeMobile: 'cover',
			textos: [],
			imagens: []
		},
		fields: [
			{ path: 'heightDesktop', label: 'Altura desktop', type: 'text', placeholder: '100vh' },
			{ path: 'heightMobile', label: 'Altura mobile', type: 'text', placeholder: '100vh' },
			{
				path: 'backgroundType',
				label: 'Tipo de fundo',
				type: 'select',
				options: [
					{ label: 'Cor', value: 'color' },
					{ label: 'Imagem', value: 'image' },
					{ label: 'Vídeo', value: 'video' }
				]
			},
			{ path: 'backgroundColor', label: 'Cor de fundo', type: 'color' },
			{ path: 'backgroundImageDesktop', label: 'Imagem desktop', type: 'url' },
			{ path: 'backgroundImageMobile', label: 'Imagem mobile', type: 'url' },
			{ path: 'backgroundVideoDesktop', label: 'Vídeo desktop', type: 'url' },
			{ path: 'backgroundVideoMobile', label: 'Vídeo mobile', type: 'url' },
			{
				path: 'backgroundPositionDesktop',
				label: 'Background position desktop',
				type: 'text',
				placeholder: 'center center'
			},
			{
				path: 'backgroundPositionMobile',
				label: 'Background position mobile',
				type: 'text',
				placeholder: 'center center'
			},
			{
				path: 'backgroundSizeDesktop',
				label: 'Background size desktop',
				type: 'text',
				placeholder: 'cover'
			},
			{
				path: 'backgroundSizeMobile',
				label: 'Background size mobile',
				type: 'text',
				placeholder: 'cover'
			},
			{
				path: 'textos',
				label: 'Textos posicionados (JSON)',
				type: 'json',
				rows: 10,
				placeholder: '[{"content":"","fontSize":{"desktop":"4rem"}}]',
				emptyValue: []
			},
			{
				path: 'imagens',
				label: 'Imagens posicionadas (JSON)',
				type: 'json',
				rows: 8,
				placeholder: '[{"srcDesktop":"","position":{"desktop":{"x":"10%","y":"20%"}}}]',
				emptyValue: []
			}
		]
	},
	{
		type: 'free-canvas',
		label: 'Free Canvas',
		icon: '🖼️',
		category: 'Layout',
		description: 'Canvas livre com elementos arrastáveis em pixels.',
		component: FreeCanvas,
		defaultData: {
			type: 'free-canvas',
			minHeightDesktop: 400,
			maxHeightDesktop: null,
			minHeightMobile: 400,
			maxHeightMobile: null,
			backgroundSource: 'color',
			backgroundColor: '#000000',
			backgroundColorDesktop: '#000000',
			backgroundColorMobile: '#000000',
			backgroundImageDesktop: '',
			backgroundImageMobile: '',
			backgroundVideoDesktop: '',
			backgroundVideoMobile: '',
			backgroundVideoPosterDesktop: '',
			backgroundVideoPosterMobile: '',
			videoAutoplay: true,
			videoLoop: true,
			videoMuted: true,
			items: []
		},
		fields: []
	},
	{
		type: 'ancora',
		label: 'Ponto de âncora',
		icon: '⛳️',
		category: 'Utilitário',
		hidden: true,
		description: 'Marca um ponto da página para navegação interna.',
		component: AnchorPoint,
		defaultData: {
			type: 'ancora',
			id: 'bloco-1'
		},
		fields: [{ path: 'id', label: 'ID da âncora', type: 'text', required: true }]
	}
];

export function getComponentDefinition(type) {
	return componentRegistry.find((component) => component.type === type);
}

export function listComponentsByCategory() {
	return componentRegistry.reduce((acc, component) => {
		if (component.hidden) {
			return acc;
		}
		const category = component.category || 'Outros';
		if (!acc[category]) {
			acc[category] = [];
		}
		acc[category].push(component);
		return acc;
	}, {});
}
