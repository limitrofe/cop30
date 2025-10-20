export const GSAP_PRESET_LIBRARY = [
	{
		id: 'hero-rise-timeline',
		label: 'Hero Rise Timeline',
		category: 'Hero',
		description:
			'Título, subtítulo e CTA entram em sequência com overshoot suave — ideal para blocos de abertura.',
		recommendation: 'Funciona melhor em seções com heading, parágrafo e botão/link.',
		config: {
			animations: [
				{
					label: 'Hero timeline',
					targets: '.story-section__inner',
					once: true,
					timeline: {
						targets: '.story-section__inner',
						options: {
							defaults: {
								ease: 'power3.out',
								duration: 0.6
							}
						},
						steps: [
							{
								targets:
									'.story-section__inner h1, .story-section__inner h2, .story-section__inner .hero-title',
								from: {
									autoAlpha: 0,
									y: 90,
									skewY: 4
								},
								to: {
									autoAlpha: 1,
									y: 0,
									skewY: 0,
									duration: 0.9,
									ease: 'expo.out'
								},
								position: '0'
							},
							{
								targets:
									'.story-section__inner p, .story-section__inner .lead, .story-section__inner .subtitle',
								from: {
									autoAlpha: 0,
									y: 55
								},
								to: {
									autoAlpha: 1,
									y: 0,
									duration: 0.7,
									ease: 'power3.out'
								},
								position: '-0.35'
							},
							{
								targets:
									'.story-section__inner .cta, .story-section__inner .button, .story-section__inner a, .story-section__inner button',
								from: {
									autoAlpha: 0,
									y: 40,
									scale: 0.9
								},
								to: {
									autoAlpha: 1,
									y: 0,
									scale: 1,
									duration: 0.6,
									ease: 'back.out(1.7)'
								},
								position: '-0.2'
							}
						]
					}
				},
				{
					label: 'Hero media glow',
					targets:
						'.story-section__inner img, .story-section__inner video, .story-section__inner figure, .story-section__inner picture',
					from: {
						autoAlpha: 0,
						scale: 1.08,
						y: 32,
						filter: 'blur(16px)'
					},
					to: {
						autoAlpha: 1,
						scale: 1,
						y: 0,
						filter: 'blur(0px)',
						duration: 0.9,
						ease: 'power2.out'
					}
				}
			]
		}
	},
	{
		id: 'cards-cascade',
		label: 'Cards Cascade',
		category: 'Listas & Cards',
		description:
			'Coleções de cards entram com leve inclinação 3D, cascade e bounce sutil — ótimo para grades de destaques.',
		recommendation: 'Aplique em `.card`, `.item`, `li`, `article` ou classes equivalentes.',
		config: {
			animations: [
				{
					targets:
						'.story-section__inner .card, .story-section__inner .item, .story-section__inner li, .story-section__inner article',
					from: {
						autoAlpha: 0,
						y: 70,
						rotationX: -18,
						transformPerspective: 900
					},
					to: {
						autoAlpha: 1,
						y: 0,
						rotationX: 0,
						duration: 0.8,
						ease: 'power4.out',
						stagger: 0.12
					}
				},
				{
					targets:
						'.story-section__inner .card img, .story-section__inner .item img, .story-section__inner figure img',
					from: {
						scale: 1.1,
						autoAlpha: 0.6
					},
					to: {
						scale: 1,
						autoAlpha: 1,
						duration: 0.65,
						ease: 'power2.out',
						stagger: 0.08
					}
				}
			]
		}
	},
	{
		id: 'parallax-drift',
		label: 'Parallax Drift',
		category: 'Scroll',
		description:
			'Cria efeito parallax suave com scrub durante o scroll para imagens e elementos com `data-parallax`.',
		recommendation: 'Ideal para blocos com imagens de fundo ou destaques verticais.',
		config: {
			animations: [
				{
					targets:
						'.story-section__inner [data-parallax], .story-section__inner img, .story-section__inner figure',
					from: {
						autoAlpha: 0,
						yPercent: 15,
						scale: 1.05
					},
					to: {
						autoAlpha: 1,
						yPercent: -10,
						scale: 1,
						duration: 1.2,
						ease: 'none',
						scrollTrigger: {
							start: 'top 90%',
							end: 'bottom top',
							scrub: true
						}
					}
				}
			]
		}
	},
	{
		id: 'mask-gallery',
		label: 'Mask Reveal Gallery',
		category: 'Galerias',
		description:
			'Cada mídia revela com máscara vertical e leve zoom — perfeito para fotos em sequência.',
		recommendation:
			'Funciona bem com `<figure>`, `.gallery-item` e elementos com imagem de destaque.',
		config: {
			animations: [
				{
					targets:
						'.story-section__inner figure, .story-section__inner img, .story-section__inner .gallery-item',
					from: {
						autoAlpha: 0,
						clipPath: 'inset(0% 0% 100% 0%)',
						scale: 1.08
					},
					to: {
						autoAlpha: 1,
						clipPath: 'inset(0% 0% 0% 0%)',
						scale: 1,
						filter: 'blur(0px)',
						duration: 0.85,
						ease: 'power3.out',
						stagger: 0.12
					}
				}
			]
		}
	},
	{
		id: 'photo-legend-reveal',
		label: 'Foto com Legenda · Reveal',
		category: 'Foto',
		description:
			'Imagem dá zoom-in suave enquanto legenda sobe com leve atraso — ideal para Foto com legenda.',
		recommendation:
			'Aplica em `.photo-with-caption` ou seletores equivalentes. Ajuste target se usar outro componente.',
		config: {
			animations: [
				{
					targets:
						'.story-section__inner .photo-with-caption img, .story-section__inner figure img, .story-section__inner picture img',
					from: {
						autoAlpha: 0,
						scale: 1.08,
						rotate: -1.5,
						y: 42,
						filter: 'blur(12px)'
					},
					to: {
						autoAlpha: 1,
						scale: 1,
						rotate: 0,
						y: 0,
						filter: 'blur(0px)',
						duration: 0.85,
						ease: 'power3.out'
					}
				},
				{
					targets:
						'.story-section__inner .photo-with-caption figcaption, .story-section__inner .photo-with-caption .caption',
					from: {
						autoAlpha: 0,
						y: 24,
						filter: 'blur(6px)'
					},
					to: {
						autoAlpha: 1,
						y: 0,
						filter: 'blur(0px)',
						duration: 0.6,
						ease: 'power2.out',
						delay: 0.12
					}
				}
			]
		}
	},
	{
		id: 'photo-legend-parallax',
		label: 'Foto com Legenda · Parallax Scroll',
		category: 'Foto',
		description:
			'Imagem ganha parallax vertical suave com scrub; legenda aparece com fade escalonado.',
		recommendation:
			'Combine com seções mais altas. O efeito usa `scrollTrigger` e funciona bem em narrativas longas.',
		config: {
			animations: [
				{
					targets:
						'.story-section__inner .photo-with-caption img, .story-section__inner figure img, .story-section__inner picture img',
					from: {
						autoAlpha: 0,
						yPercent: 18,
						scale: 1.05
					},
					to: {
						autoAlpha: 1,
						yPercent: -12,
						scale: 1,
						duration: 1.2,
						ease: 'none',
						scrollTrigger: {
							start: 'top 85%',
							end: 'bottom top',
							scrub: true
						}
					}
				},
				{
					targets:
						'.story-section__inner .photo-with-caption figcaption, .story-section__inner .photo-with-caption .caption',
					from: {
						autoAlpha: 0,
						y: 36
					},
					to: {
						autoAlpha: 1,
						y: 0,
						duration: 0.6,
						ease: 'power3.out',
						delay: 0.1
					}
				}
			]
		}
	},
	{
		id: 'headline-mask-split',
		label: 'Headline Mask Split',
		category: 'Texto',
		description:
			'Headline revela de baixo para cima com máscara e leve deslocamento horizontal, seguido pelo corpo do texto.',
		recommendation: 'Aplique em blocos com heading (`h2`, `h3`) e parágrafos subsequentes.',
		config: {
			animations: [
				{
					targets:
						'.story-section__inner h1, .story-section__inner h2, .story-section__inner h3, .story-section__inner .headline',
					from: {
						clipPath: 'inset(0% 0% 100% 0%)',
						y: 40,
						autoAlpha: 0.6,
						skewY: 5
					},
					to: {
						clipPath: 'inset(0% 0% 0% 0%)',
						y: 0,
						skewY: 0,
						autoAlpha: 1,
						duration: 0.85,
						ease: 'power4.out'
					}
				},
				{
					targets: '.story-section__inner p, .story-section__inner .rich-text > *',
					from: {
						autoAlpha: 0,
						y: 40,
						filter: 'blur(8px)'
					},
					to: {
						autoAlpha: 1,
						y: 0,
						filter: 'blur(0px)',
						duration: 0.7,
						ease: 'power3.out',
						stagger: 0.08
					}
				}
			]
		}
	},
	{
		id: 'intertitle-lift',
		label: 'Intertítulo Lift',
		category: 'Intertítulo',
		description:
			'Anima títulos de seção com máscara vertical e destaque na linha decorativa, enquanto o texto de apoio sobe com atraso.',
		recommendation:
			'Funciona com o componente Intertítulo/SectionTitle (`.section-title__title`, `.section-title__subtitle`, `.section-title__background`).',
		config: {
			animations: [
				{
					targets: '.story-section__inner .section-title__title',
					from: {
						autoAlpha: 0,
						y: 60,
						clipPath: 'inset(100% 0% 0% 0%)'
					},
					to: {
						autoAlpha: 1,
						y: 0,
						clipPath: 'inset(0% 0% 0% 0%)',
						duration: 0.8,
						ease: 'power4.out'
					}
				},
				{
					targets:
						'.story-section__inner .section-title__subtitle, .story-section__inner .section-title__description',
					from: {
						autoAlpha: 0,
						y: 32,
						filter: 'blur(6px)'
					},
					to: {
						autoAlpha: 1,
						y: 0,
						filter: 'blur(0px)',
						duration: 0.6,
						ease: 'power3.out',
						delay: 0.12
					}
				},
				{
					targets:
						'.story-section__inner .section-title__background, .story-section__inner .section-title__overlay',
					from: {
						autoAlpha: 0,
						scaleX: 0,
						transformOrigin: 'left center'
					},
					to: {
						autoAlpha: 0.9,
						scaleX: 1,
						duration: 0.7,
						ease: 'power2.out'
					}
				}
			]
		}
	},
	{
		id: 'cards-3d-tilt',
		label: 'Cards 3D Tilt',
		category: 'Listas & Cards',
		description:
			'Cards fazem entrada 3D com leve rotação Y e brilho dinâmico — efeito moderno para grids premiados.',
		recommendation: 'Apontar para `.card`, `.tile`, `.box` ou `.panel`.',
		config: {
			animations: [
				{
					targets:
						'.story-section__inner .card, .story-section__inner .tile, .story-section__inner .box, .story-section__inner .panel',
					from: {
						autoAlpha: 0,
						y: 80,
						rotationY: -25,
						transformPerspective: 1000,
						boxShadow: '0 80px 120px rgba(15,23,42,0.35)'
					},
					to: {
						autoAlpha: 1,
						y: 0,
						rotationY: 0,
						boxShadow: '0 24px 60px rgba(15,23,42,0.22)',
						duration: 0.85,
						ease: 'power4.out',
						stagger: 0.14
					}
				}
			]
		}
	},
	{
		id: 'scroll-pin-reveal',
		label: 'Scroll Pin Reveal',
		category: 'Scroll',
		description:
			'Conteúdo fixa por alguns pixels enquanto o fundo continua se movendo, criando narrativa imersiva.',
		recommendation: 'Use em blocos com altura relevante (parallax, destaque fotográfico).',
		config: {
			animations: [
				{
					targets: '.story-section__inner',
					from: {
						autoAlpha: 1
					},
					to: {
						autoAlpha: 1,
						scrollTrigger: {
							start: 'top center',
							end: '+=80%',
							pin: true,
							pinSpacing: true,
							scrub: true
						}
					}
				},
				{
					targets: '.story-section__inner .background, .story-section__inner figure img',
					from: {
						scale: 1.1
					},
					to: {
						scale: 1,
						scrollTrigger: {
							start: 'top center',
							end: 'bottom top',
							scrub: true
						}
					}
				}
			]
		}
	},
	{
		id: 'scroll-keyhole-reveal',
		label: 'Scroll Keyhole Reveal',
		category: 'Scroll',
		description:
			'Overlay em formato de “olho de fechadura” abre conforme o leitor rola e a seta indicativa desaparece.',
		recommendation:
			'Adicione os elementos `.keyhole` e `.arrow` fixos no topo da página (como no snippet de estilo fornecido no guia) e ajuste o seletor `trigger` conforme a primeira seção da matéria.',
		config: {
			animations: [
				{
					label: 'Keyhole reveal',
					targets: '.keyhole',
					once: false,
					autoScroll: false,
					from: {
						clipPath:
							'polygon(0% 0%, 0% 100%, 0% 100%, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 100%, 100% 100%, 100% 0%)'
					},
					to: {
						clipPath:
							'polygon(0% 0%, 0% 100%, 25% 100%, 25% 25%, 75% 25%, 75% 75%, 25% 75%, 25% 100%, 100% 100%, 100% 0%)',
						duration: 1,
						ease: 'none'
					},
					scrollTrigger: {
						trigger: '.story-section:first-of-type',
						start: 'top top',
						end: 'bottom bottom',
						scrub: true
					},
					mask: {
						property: 'clipPath',
						value:
							'polygon(0% 0%, 0% 100%, 25% 100%, 25% 25%, 75% 25%, 75% 75%, 25% 75%, 25% 100%, 100% 100%, 100% 0%)'
					}
				},
				{
					label: 'Arrow fade',
					targets: '.arrow',
					once: false,
					autoScroll: false,
					from: {
						autoAlpha: 1
					},
					to: {
						autoAlpha: 0,
						duration: 0.6,
						ease: 'sine.out'
					},
					scrollTrigger: {
						trigger: '.story-section:first-of-type',
						start: 'top top',
						end: '+=200',
						scrub: true
					}
				}
			]
		}
	},
	{
		id: 'neon-glow',
		label: 'Neon Glow Pulse',
		category: 'Ambient',
		description:
			'Adiciona brilho pulsante a elementos de destaque — combina bem com botões ou badges.',
		recommendation: 'Aponte para `.badge`, `.label`, `.cta` ou elementos decorativos.',
		config: {
			animations: [
				{
					targets:
						'.story-section__inner .badge, .story-section__inner .label, .story-section__inner .cta, .story-section__inner .chip',
					from: {
						autoAlpha: 0,
						scale: 0.9,
						filter: 'blur(6px)',
						boxShadow: '0 0 0 rgba(59,130,246,0)'
					},
					to: {
						autoAlpha: 1,
						scale: 1,
						filter: 'blur(0px)',
						duration: 0.6,
						ease: 'back.out(1.8)'
					}
				},
				{
					targets:
						'.story-section__inner .badge, .story-section__inner .label, .story-section__inner .cta, .story-section__inner .chip',
					to: {
						boxShadow: '0 0 32px rgba(59,130,246,0.55)',
						repeat: -1,
						yoyo: true,
						duration: 1.6,
						ease: 'sine.inOut'
					}
				}
			]
		}
	}
];

export const GSAP_PRESET_CATEGORIES = [
	'Todos',
	...Array.from(new Set(GSAP_PRESET_LIBRARY.map((preset) => preset.category || 'Outros')))
];
