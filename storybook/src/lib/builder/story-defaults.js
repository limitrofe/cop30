const fontOptions = [{ label: 'Globotipo (padrão)', value: '"Globotipo", sans-serif' }];

const colorSchemeOptions = [
	{ label: 'Padrão (claro)', value: 'default' },
	{ label: 'Padrão (escuro)', value: 'dark' },
	{ label: 'Mundo claro', value: 'mundo-claro' },
	{ label: 'Mundo escuro', value: 'mundo-escuro' },
	{ label: 'Natureza', value: 'natureza' },
	{ label: 'Lavanda', value: 'lavanda' },
	{ label: 'Sépia', value: 'sepia' },
	{ label: 'Pop Art', value: 'pop-art' },
	{ label: 'Alto contraste', value: 'alto-contraste' },
	{ label: 'Coral', value: 'coral' },
	{ label: 'Brisa clara', value: 'brisa-clara' },
	{ label: 'Brisa escura', value: 'brisa-escura' },
	{ label: 'Névoa', value: 'nevoa' },
	{ label: 'Vinho nobre', value: 'vinho-nobre' },
	{ label: 'Aurora', value: 'aurora' },
	{ label: 'Grafite', value: 'grafite' },
	{ label: 'Acqua', value: 'acqua' },
	{ label: 'Dourado', value: 'dourado' },
	{ label: 'Vermelho profundo', value: 'vermelho-profundo' },
	{ label: 'Neon sutil', value: 'neon-sutil' },
	{ label: 'Dias perfeitos', value: 'dias-perfeitos' }
];

const weightOptions = [
	{ label: 'Regular (400)', value: '400' },
	{ label: 'Semibold (600)', value: '600' },
	{ label: 'Bold (700)', value: '700' },
	{ label: 'Extra Bold (800)', value: '800' }
];

const transformOptions = [
	{ label: 'Normal', value: 'none' },
	{ label: 'Maiúsculas', value: 'uppercase' },
	{ label: 'Minúsculas', value: 'lowercase' },
	{ label: 'Capitalize', value: 'capitalize' }
];

export const storyDefaults = {
	title: 'Nova matéria',
	subtitle: 'Subtítulo descritivo da matéria',
	description: '',
	author: '',
	date: '',
	slug: '',
	theme: 'dark',
	tags: [],
	share: {
		title: '',
		description: '',
		image: '',
		imageSquare: '',
		imageTwitter: '',
		imageGoogle: ''
	},
	seo: {
		canonicalUrl: '',
		keywords: [],
		readingTime: '',
		ogType: 'article'
	},
	appearance: {
		colorScheme: 'dark',
		backgroundColor: '#0b0d17',
		backgroundColorMobile: '#0b0d17',
		surfaceColor: 'transparent',
		textColor: '#f8fafc',
		accentColor: '#f97316',
		pagePadding: {
			desktop: '0',
			mobile: '0'
		},
		useGradient: false,
		gradient: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
		customCSS: '',
		typography: {
			h1: {
				fontFamily: '"Globotipo", sans-serif',
				fontWeight: '900',
				textTransform: 'uppercase',
				letterSpacing: '-0.02em',
				color: '#f8fafc',
				desktop: { fontSize: 'clamp(3.5rem, 5vw, 4.5rem)', lineHeight: '1.05' },
				mobile: { fontSize: 'clamp(2.4rem, 8vw, 3rem)', lineHeight: '1.12' }
			},
			h2: {
				fontFamily: '"Globotipo", sans-serif',
				fontWeight: '800',
				textTransform: 'none',
				letterSpacing: '-0.015em',
				color: '#f8fafc',
				desktop: { fontSize: 'clamp(2.8rem, 4.5vw, 3.2rem)', lineHeight: '1.1' },
				mobile: { fontSize: 'clamp(2.1rem, 7vw, 2.5rem)', lineHeight: '1.15' }
			},
			h3: {
				fontFamily: '"Globotipo", sans-serif',
				fontWeight: '700',
				textTransform: 'none',
				letterSpacing: '-0.01em',
				color: '#f8fafc',
				desktop: { fontSize: 'clamp(2.2rem, 4vw, 2.6rem)', lineHeight: '1.22' },
				mobile: { fontSize: 'clamp(1.7rem, 6.5vw, 2.1rem)', lineHeight: '1.22' }
			},
			h4: {
				fontFamily: '"Globotipo", sans-serif',
				fontWeight: '600',
				textTransform: 'none',
				color: '#f8fafc',
				desktop: { fontSize: '1.9rem', lineHeight: '1.3' },
				mobile: { fontSize: '1.55rem', lineHeight: '1.35' }
			},
			h5: {
				fontFamily: '"Globotipo", sans-serif',
				fontWeight: '600',
				textTransform: 'uppercase',
				letterSpacing: '0.08em',
				color: '#e2e8f0',
				desktop: { fontSize: '1.35rem', lineHeight: '1.4' },
				mobile: { fontSize: '1.15rem', lineHeight: '1.45' }
			},
			h6: {
				fontFamily: '"Globotipo", sans-serif',
				fontWeight: '500',
				textTransform: 'uppercase',
				letterSpacing: '0.1em',
				color: '#cbd5f5',
				desktop: { fontSize: '1.05rem', lineHeight: '1.5' },
				mobile: { fontSize: '0.95rem', lineHeight: '1.55' }
			},
			body: {
				fontFamily: '"Globotipo", sans-serif',
				fontWeight: '400',
				color: '#d1d5db',
				desktop: { fontSize: '1.1rem', lineHeight: '1.8' },
				mobile: { fontSize: '1rem', lineHeight: '1.7' }
			},
			lead: {
				fontFamily: '"Globotipo", sans-serif',
				fontWeight: '500',
				color: '#f1f5f9',
				desktop: { fontSize: '1.5rem', lineHeight: '1.6' },
				mobile: { fontSize: '1.3rem', lineHeight: '1.6' }
			},
			small: {
				fontFamily: '"Globotipo", sans-serif',
				fontWeight: '400',
				color: '#94a3b8',
				desktop: { fontSize: '0.875rem', lineHeight: '1.4' },
				mobile: { fontSize: '0.82rem', lineHeight: '1.4' }
			},
			caption: {
				fontFamily: '"Globotipo", sans-serif',
				fontWeight: '400',
				color: '#e2e8f0',
				desktop: { fontSize: '0.95rem', lineHeight: '1.45' },
				mobile: { fontSize: '0.9rem', lineHeight: '1.45' }
			},
			annotation: {
				fontFamily: '"Globotipo", sans-serif',
				fontWeight: '500',
				textTransform: 'uppercase',
				letterSpacing: '0.12em',
				color: '#f97316',
				desktop: { fontSize: '0.8rem', lineHeight: '1.4' },
				mobile: { fontSize: '0.75rem', lineHeight: '1.4' }
			},
			blockquote: {
				fontFamily: '"Globotipo", sans-serif',
				fontWeight: '700',
				fontStyle: 'italic',
				color: '#f8fafc',
				accentColor: '#f97316',
				background: 'rgba(15, 23, 42, 0.7)',
				borderColor: 'rgba(249, 115, 22, 0.35)',
				desktop: { fontSize: '2rem', lineHeight: '1.4' },
				mobile: { fontSize: '1.6rem', lineHeight: '1.45' }
			}
		}
	},
	overlays: {
		keyhole: {
			enabled: false,
			color: '#fdcb6e',
			zIndex: 120,
			arrowEnabled: true,
			arrowColor: '#2d3436',
			arrowAnimation: true,
			arrowTop: '75vh'
		}
	},
	analytics: {
		ga4: '',
		gtm: '',
		datalayerProject: ''
	},
	intro: {
		text: ''
	},
	credits: {
		enabled: true,
		title: 'Créditos',
		groups: [],
		groupsText: '',
		notes: '',
		sources: [],
		authors: [],
		editedBy: [],
		additionalGraphics: [],
		sections: [],
		backgroundColor: '',
		textColor: '',
		titleColor: '',
		borderColor: '',
		backgroundImage: '',
		backgroundImageMobile: '',
		backgroundVideo: '',
		backgroundVideoMobile: '',
		backgroundPosition: 'center center',
		backgroundPositionMobile: '',
		backgroundSize: 'cover',
		backgroundSizeMobile: '',
		overlay: false,
		overlayColor: 'rgba(0, 0, 0, 0.4)',
		maxWidth: '960px',
		paddingDesktop: '3rem 1.5rem',
		paddingMobile: '2.5rem 1.25rem',
		customClass: ''
	},
	paragraphs: []
};

const baseMetadataFields = [
	{ path: 'title', label: 'Título da história', type: 'text', required: true },
	{ path: 'subtitle', label: 'Subtítulo', type: 'textarea', rows: 2 },
	{ path: 'description', label: 'Descrição / SEO', type: 'textarea', rows: 3 },
	{ path: 'author', label: 'Autor(a)', type: 'text' },
	{ path: 'date', label: 'Data de publicação', type: 'text', placeholder: '2024-01-31' },
	{ path: 'slug', label: 'Slug', type: 'text', placeholder: 'nome-do-projeto' },
	{
		path: 'theme',
		label: 'Tema geral (legacy)',
		type: 'select',
		options: [
			{ label: 'Dark', value: 'dark' },
			{ label: 'Light', value: 'light' }
		]
	},
	{
		path: 'tags',
		label: 'Tags (JSON)',
		type: 'json',
		placeholder: '["especial", "podcast"]',
		emptyValue: []
	},
	{ path: 'intro.text', label: 'Texto de abertura', type: 'richtext', rows: 4 },
	// Aparência
	{
		path: 'appearance.colorScheme',
		label: 'Esquema de cores',
		type: 'select',
		options: colorSchemeOptions
	},
	{ path: 'appearance.backgroundColor', label: 'Cor de fundo (desktop)', type: 'color' },
	{ path: 'appearance.backgroundColorMobile', label: 'Cor de fundo (mobile)', type: 'color' },
	{ path: 'appearance.surfaceColor', label: 'Cor das seções', type: 'color' },
	{ path: 'appearance.textColor', label: 'Cor do texto padrão', type: 'color' },
	{ path: 'appearance.accentColor', label: 'Cor de destaque', type: 'color' },
	{ path: 'appearance.useGradient', label: 'Usar gradiente no fundo', type: 'boolean' },
	{
		path: 'appearance.gradient',
		label: 'CSS do gradiente',
		type: 'text',
		placeholder: 'linear-gradient(...)'
	},
	{
		path: 'appearance.pagePadding.desktop',
		label: 'Padding lateral desktop',
		type: 'text',
		placeholder: '0 0 0 0'
	},
	{
		path: 'appearance.pagePadding.mobile',
		label: 'Padding lateral mobile',
		type: 'text',
		placeholder: '0 0 0 0'
	},
	{ path: 'appearance.customCSS', label: 'CSS adicional (inline)', type: 'textarea', rows: 3 },
	{
		path: 'overlays.keyhole.enabled',
		label: 'Overlay keyhole (efeito CodePen)',
		type: 'boolean',
		helpText: 'Ativa o overlay fixo com máscara animada sobre a primeira seção.'
	},
	{ path: 'overlays.keyhole.color', label: 'Cor do overlay', type: 'color' },
	{
		path: 'overlays.keyhole.zIndex',
		label: 'z-index do overlay',
		type: 'text',
		placeholder: '120'
	},
	{
		path: 'overlays.keyhole.arrowEnabled',
		label: 'Exibir seta indicativa',
		type: 'boolean'
	},
	{ path: 'overlays.keyhole.arrowColor', label: 'Cor da seta', type: 'color' },
	{
		path: 'overlays.keyhole.arrowTop',
		label: 'Posição vertical da seta',
		type: 'text',
		placeholder: '75vh'
	},
	{
		path: 'overlays.keyhole.arrowAnimation',
		label: 'Animar seta (flutuar)',
		type: 'boolean'
	},
	// Compartilhamento
	{ path: 'share.title', label: 'Título para compartilhamento', type: 'text' },
	{
		path: 'share.description',
		label: 'Descrição para compartilhamento',
		type: 'textarea',
		rows: 2
	},
	{ path: 'share.image', label: 'Imagem principal (1200x630)', type: 'url' },
	{ path: 'share.imageSquare', label: 'Imagem quadrada (1080x1080)', type: 'url' },
	{ path: 'share.imageTwitter', label: 'Imagem Twitter (1600x900)', type: 'url' },
	{ path: 'share.imageGoogle', label: 'Imagem Google/Discover', type: 'url' },
	// SEO
	{ path: 'seo.canonicalUrl', label: 'URL canônica', type: 'url' },
	{
		path: 'seo.keywords',
		label: 'Palavras-chave (JSON)',
		type: 'json',
		placeholder: '["golpe", "investigação"]',
		emptyValue: []
	},
	{
		path: 'seo.readingTime',
		label: 'Tempo de leitura estimado',
		type: 'text',
		placeholder: '6 minutos'
	},
	{
		path: 'seo.ogType',
		label: 'Open Graph type',
		type: 'select',
		options: [
			{ label: 'Article', value: 'article' },
			{ label: 'Video', value: 'video.other' },
			{ label: 'Website', value: 'website' }
		]
	},
	// Analytics
	{ path: 'analytics.ga4', label: 'GA4 Measurement ID', type: 'text', placeholder: 'G-XXXXXXXX' },
	{ path: 'analytics.gtm', label: 'Google Tag Manager ID', type: 'text', placeholder: 'GTM-XXXX' },
	{ path: 'analytics.datalayerProject', label: 'Nome do projeto no dataLayer', type: 'text' }
];

const headingLevels = [1, 2, 3, 4, 5, 6];

const headingMetadataFields = headingLevels.flatMap((level) => {
	const basePath = `appearance.typography.h${level}`;
	return [
		{
			path: `${basePath}.fontFamily`,
			label: `H${level} • Fonte`,
			type: 'select',
			options: fontOptions
		},
		{
			path: `${basePath}.fontWeight`,
			label: `H${level} • Peso`,
			type: 'select',
			options: weightOptions
		},
		{
			path: `${basePath}.textTransform`,
			label: `H${level} • Transformação`,
			type: 'select',
			options: transformOptions
		},
		{ path: `${basePath}.color`, label: `H${level} • Cor`, type: 'color' },
		{
			path: `${basePath}.desktop.fontSize`,
			label: `H${level} • Tamanho desktop`,
			type: 'text',
			placeholder: 'clamp(...)'
		},
		{
			path: `${basePath}.desktop.lineHeight`,
			label: `H${level} • Altura linha desktop`,
			type: 'text',
			placeholder: '1.2'
		},
		{
			path: `${basePath}.mobile.fontSize`,
			label: `H${level} • Tamanho mobile`,
			type: 'text',
			placeholder: 'clamp(...)'
		},
		{
			path: `${basePath}.mobile.lineHeight`,
			label: `H${level} • Altura linha mobile`,
			type: 'text',
			placeholder: '1.3'
		}
	];
});

const blockquoteMetadataFields = [
	{
		path: 'appearance.typography.blockquote.fontFamily',
		label: 'Citação • Fonte',
		type: 'select',
		options: fontOptions
	},
	{
		path: 'appearance.typography.blockquote.color',
		label: 'Citação • Cor do texto',
		type: 'color'
	},
	{
		path: 'appearance.typography.blockquote.accentColor',
		label: 'Citação • Cor de destaque',
		type: 'color'
	},
	{ path: 'appearance.typography.blockquote.background', label: 'Citação • Fundo', type: 'color' },
	{ path: 'appearance.typography.blockquote.borderColor', label: 'Citação • Borda', type: 'color' },
	{
		path: 'appearance.typography.blockquote.desktop.fontSize',
		label: 'Citação • Tamanho desktop',
		type: 'text',
		placeholder: '2rem'
	},
	{
		path: 'appearance.typography.blockquote.desktop.lineHeight',
		label: 'Citação • Altura linha desktop',
		type: 'text',
		placeholder: '1.4'
	},
	{
		path: 'appearance.typography.blockquote.mobile.fontSize',
		label: 'Citação • Tamanho mobile',
		type: 'text',
		placeholder: '1.6rem'
	},
	{
		path: 'appearance.typography.blockquote.mobile.lineHeight',
		label: 'Citação • Altura linha mobile',
		type: 'text',
		placeholder: '1.45'
	}
];

const bodyMetadataFields = [
	{
		path: 'appearance.typography.body.fontFamily',
		label: 'Body • Fonte',
		type: 'select',
		options: fontOptions
	},
	{ path: 'appearance.typography.body.color', label: 'Body • Cor', type: 'color' },
	{
		path: 'appearance.typography.body.desktop.fontSize',
		label: 'Body • Tamanho desktop',
		type: 'text',
		placeholder: '1.1rem'
	},
	{
		path: 'appearance.typography.body.desktop.lineHeight',
		label: 'Body • Altura linha desktop',
		type: 'text',
		placeholder: '1.8'
	},
	{
		path: 'appearance.typography.body.mobile.fontSize',
		label: 'Body • Tamanho mobile',
		type: 'text',
		placeholder: '1rem'
	},
	{
		path: 'appearance.typography.body.mobile.lineHeight',
		label: 'Body • Altura linha mobile',
		type: 'text',
		placeholder: '1.7'
	}
];

const leadMetadataFields = [
	{
		path: 'appearance.typography.lead.fontFamily',
		label: 'Lead • Fonte',
		type: 'select',
		options: fontOptions
	},
	{ path: 'appearance.typography.lead.color', label: 'Lead • Cor', type: 'color' },
	{
		path: 'appearance.typography.lead.desktop.fontSize',
		label: 'Lead • Tamanho desktop',
		type: 'text',
		placeholder: '1.5rem'
	},
	{
		path: 'appearance.typography.lead.desktop.lineHeight',
		label: 'Lead • Altura linha desktop',
		type: 'text',
		placeholder: '1.6'
	},
	{
		path: 'appearance.typography.lead.mobile.fontSize',
		label: 'Lead • Tamanho mobile',
		type: 'text',
		placeholder: '1.3rem'
	},
	{
		path: 'appearance.typography.lead.mobile.lineHeight',
		label: 'Lead • Altura linha mobile',
		type: 'text',
		placeholder: '1.6'
	}
];

const smallMetadataFields = [
	{
		path: 'appearance.typography.small.fontFamily',
		label: 'Small • Fonte',
		type: 'select',
		options: fontOptions
	},
	{ path: 'appearance.typography.small.color', label: 'Small • Cor', type: 'color' },
	{
		path: 'appearance.typography.small.desktop.fontSize',
		label: 'Small • Tamanho desktop',
		type: 'text',
		placeholder: '0.875rem'
	},
	{
		path: 'appearance.typography.small.desktop.lineHeight',
		label: 'Small • Altura linha desktop',
		type: 'text',
		placeholder: '1.4'
	},
	{
		path: 'appearance.typography.small.mobile.fontSize',
		label: 'Small • Tamanho mobile',
		type: 'text',
		placeholder: '0.82rem'
	},
	{
		path: 'appearance.typography.small.mobile.lineHeight',
		label: 'Small • Altura linha mobile',
		type: 'text',
		placeholder: '1.4'
	}
];

const captionMetadataFields = [
	{
		path: 'appearance.typography.caption.fontFamily',
		label: 'Legenda • Fonte',
		type: 'select',
		options: fontOptions
	},
	{ path: 'appearance.typography.caption.color', label: 'Legenda • Cor', type: 'color' },
	{
		path: 'appearance.typography.caption.desktop.fontSize',
		label: 'Legenda • Tamanho desktop',
		type: 'text',
		placeholder: '0.95rem'
	},
	{
		path: 'appearance.typography.caption.desktop.lineHeight',
		label: 'Legenda • Altura linha desktop',
		type: 'text',
		placeholder: '1.45'
	},
	{
		path: 'appearance.typography.caption.mobile.fontSize',
		label: 'Legenda • Tamanho mobile',
		type: 'text',
		placeholder: '0.9rem'
	},
	{
		path: 'appearance.typography.caption.mobile.lineHeight',
		label: 'Legenda • Altura linha mobile',
		type: 'text',
		placeholder: '1.45'
	}
];

const annotationMetadataFields = [
	{
		path: 'appearance.typography.annotation.fontFamily',
		label: 'Anotação • Fonte',
		type: 'select',
		options: fontOptions
	},
	{ path: 'appearance.typography.annotation.color', label: 'Anotação • Cor', type: 'color' },
	{
		path: 'appearance.typography.annotation.textTransform',
		label: 'Anotação • Transformação',
		type: 'select',
		options: transformOptions
	},
	{
		path: 'appearance.typography.annotation.desktop.fontSize',
		label: 'Anotação • Tamanho desktop',
		type: 'text',
		placeholder: '0.8rem'
	},
	{
		path: 'appearance.typography.annotation.desktop.lineHeight',
		label: 'Anotação • Altura linha desktop',
		type: 'text',
		placeholder: '1.4'
	},
	{
		path: 'appearance.typography.annotation.mobile.fontSize',
		label: 'Anotação • Tamanho mobile',
		type: 'text',
		placeholder: '0.75rem'
	},
	{
		path: 'appearance.typography.annotation.mobile.lineHeight',
		label: 'Anotação • Altura linha mobile',
		type: 'text',
		placeholder: '1.4'
	}
];

export const metadataFields = [
	...baseMetadataFields,
	...headingMetadataFields,
	...blockquoteMetadataFields,
	...bodyMetadataFields,
	...leadMetadataFields,
	...smallMetadataFields,
	...captionMetadataFields,
	...annotationMetadataFields
];

export const creditsFields = [
	{
		path: 'credits.enabled',
		label: 'Exibir créditos',
		type: 'boolean',
		helpText: 'Desative apenas se esta história não deve mostrar a seção de créditos.'
	},
	{ path: 'credits.title', label: 'Título da seção', type: 'text', placeholder: 'Créditos' },
	{
		path: 'credits.groupsText',
		label: 'Créditos por grupo',
		type: 'textarea',
		rows: 8,
		placeholder: 'Design\nFulana\nCiclana\n\nDesenvolvimento\nBeltrano\nSicrana',
		description:
			'Separe cada grupo com uma linha em branco. A primeira linha vira o nome do grupo e as seguintes listam os participantes.'
	},
	{
		path: 'credits.notes',
		label: 'Notas adicionais',
		type: 'textarea',
		rows: 3,
		description: 'Opcional: exibido como uma seção “Notas”.'
	},
	{ path: 'credits.backgroundColor', label: 'Cor de fundo', type: 'color' },
	{ path: 'credits.textColor', label: 'Cor do texto', type: 'color' },
	{ path: 'credits.titleColor', label: 'Cor dos títulos', type: 'color' },
	{ path: 'credits.borderColor', label: 'Cor da borda superior', type: 'color' },
	{ path: 'credits.backgroundImage', label: 'Imagem de fundo (desktop)', type: 'url' },
	{ path: 'credits.backgroundImageMobile', label: 'Imagem de fundo (mobile)', type: 'url' },
	{ path: 'credits.backgroundVideo', label: 'Vídeo de fundo (desktop)', type: 'url' },
	{ path: 'credits.backgroundVideoMobile', label: 'Vídeo de fundo (mobile)', type: 'url' },
	{
		path: 'credits.backgroundPosition',
		label: 'Posição da mídia',
		type: 'text',
		placeholder: 'center center'
	},
	{
		path: 'credits.backgroundPositionMobile',
		label: 'Posição da mídia (mobile)',
		type: 'text',
		placeholder: 'herda do desktop'
	},
	{
		path: 'credits.backgroundSize',
		label: 'Tamanho da mídia',
		type: 'text',
		placeholder: 'cover'
	},
	{
		path: 'credits.backgroundSizeMobile',
		label: 'Tamanho da mídia (mobile)',
		type: 'text',
		placeholder: 'herda do desktop'
	},
	{
		path: 'credits.overlay',
		label: 'Aplicar overlay',
		type: 'boolean'
	},
	{ path: 'credits.overlayColor', label: 'Cor do overlay', type: 'color' },
	{
		path: 'credits.maxWidth',
		label: 'Largura máxima do conteúdo',
		type: 'text',
		placeholder: '960px'
	},
	{
		path: 'credits.paddingDesktop',
		label: 'Padding desktop',
		type: 'text',
		placeholder: '3rem 1.5rem'
	},
	{
		path: 'credits.paddingMobile',
		label: 'Padding mobile',
		type: 'text',
		placeholder: '2.5rem 1.25rem'
	},
	{
		path: 'credits.customClass',
		label: 'Classe CSS extra',
		type: 'text',
		placeholder: 'meus-creditos'
	}
];
