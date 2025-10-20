// src/lib/utils/analytics.js
import { browser } from '$app/environment';

class StoryAnalytics {
	constructor() {
		this.sessionId = this.generateSessionId();
		this.startTime = Date.now();
		this.events = [];
		this.componentViews = new Map();
		this.scrollDepth = 0;
		this.maxScrollDepth = 0;
		this.isVisible = true;

		if (browser) {
			this.initializeTrackers();
		}
	}

	generateSessionId() {
		return `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	initializeTrackers() {
		// Tracker de visibilidade da página
		document.addEventListener('visibilitychange', () => {
			this.isVisible = !document.hidden;
			this.track('page_visibility', { visible: this.isVisible });
		});

		// Tracker de scroll profundidade
		this.initScrollDepthTracker();

		// Tracker de componentes no viewport
		this.initComponentViewTracker();

		// Tracker de saída da página
		window.addEventListener('beforeunload', () => {
			this.track('session_end', this.getSessionSummary());
		});
	}

	initScrollDepthTracker() {
		let ticking = false;

		const updateScrollDepth = () => {
			const scrollTop = window.pageYOffset;
			const docHeight = document.documentElement.scrollHeight - window.innerHeight;
			this.scrollDepth = Math.round((scrollTop / docHeight) * 100);

			if (this.scrollDepth > this.maxScrollDepth) {
				this.maxScrollDepth = this.scrollDepth;

				// Marcos de scroll importantes
				const milestones = [25, 50, 75, 90, 100];
				milestones.forEach((milestone) => {
					if (this.scrollDepth >= milestone && !this.hasReachedMilestone(milestone)) {
						this.track('scroll_depth', { depth: milestone });
						this.markMilestone(milestone);
					}
				});
			}

			ticking = false;
		};

		window.addEventListener('scroll', () => {
			if (!ticking) {
				requestAnimationFrame(updateScrollDepth);
				ticking = true;
			}
		});
	}

	initComponentViewTracker() {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					const componentType = entry.target.dataset.componentType;
					const componentIndex = entry.target.dataset.componentIndex;

					if (entry.isIntersecting && componentType) {
						const viewKey = `${componentType}_${componentIndex}`;

						if (!this.componentViews.has(viewKey)) {
							this.componentViews.set(viewKey, {
								type: componentType,
								index: parseInt(componentIndex),
								firstView: Date.now(),
								viewCount: 1,
								totalTime: 0
							});

							this.track('component_view', {
								type: componentType,
								index: parseInt(componentIndex),
								firstView: true
							});
						}
					}
				});
			},
			{
				threshold: 0.5, // 50% do componente visível
				rootMargin: '0px 0px -20% 0px'
			}
		);

		// Observer todos os componentes da story
		setTimeout(() => {
			document.querySelectorAll('[data-component-type]').forEach((el) => {
				observer.observe(el);
			});
		}, 1000);
	}

	// Métodos principais de tracking
	track(eventName, data = {}) {
		const event = {
			event: eventName,
			timestamp: Date.now(),
			sessionId: this.sessionId,
			url: window.location.href,
			userAgent: navigator.userAgent,
			viewport: {
				width: window.innerWidth,
				height: window.innerHeight
			},
			...data
		};

		this.events.push(event);

		// Enviar para analytics (Google Analytics, Adobe, etc.)
		this.sendToAnalytics(event);

		// Log para desenvolvimento
		if (import.meta.env.DEV) {
			console.log('📊 Analytics Event:', event);
		}
	}

	// Eventos específicos de stories
	trackStoryStart(storyData) {
		this.track('story_start', {
			title: storyData.title,
			author: storyData.author,
			theme: storyData.theme,
			totalComponents: storyData.paragraphs?.length || 0,
			estimatedReadTime: this.calculateReadTime(storyData)
		});
	}

	trackComponentInteraction(componentType, action, data = {}) {
		this.track('component_interaction', {
			componentType,
			action,
			...data
		});
	}

	trackMediaPlay(mediaType, mediaId, duration = null) {
		this.track('media_play', {
			mediaType, // 'video', 'audio', 'globoplayer'
			mediaId,
			duration
		});
	}

	trackMediaComplete(mediaType, mediaId, watchTime) {
		this.track('media_complete', {
			mediaType,
			mediaId,
			watchTime,
			completionRate: duration ? (watchTime / duration) * 100 : null
		});
	}

	trackShareAction(platform, storyTitle) {
		this.track('story_share', {
			platform, // 'facebook', 'twitter', 'whatsapp', 'copy_link'
			storyTitle
		});
	}

	// Helpers
	hasReachedMilestone(milestone) {
		return this.events.some((e) => e.event === 'scroll_depth' && e.depth === milestone);
	}

	markMilestone(milestone) {
		// Marca o milestone para não disparar novamente
		this[`milestone_${milestone}`] = true;
	}

	calculateReadTime(storyData) {
		const wordsPerMinute = 200;
		let words = 0;

		if (storyData.title) words += storyData.title.split(' ').length;
		if (storyData.intro?.text) words += storyData.intro.text.split(' ').length;

		storyData.paragraphs?.forEach((p) => {
			if (p.text) {
				const cleanText = p.text.replace(/<[^>]*>/g, '');
				words += cleanText.split(' ').length;
			}
		});

		return Math.ceil(words / wordsPerMinute);
	}

	getSessionSummary() {
		const duration = Date.now() - this.startTime;

		return {
			sessionDuration: duration,
			maxScrollDepth: this.maxScrollDepth,
			totalEvents: this.events.length,
			componentViews: Array.from(this.componentViews.values()),
			engagementScore: this.calculateEngagementScore(duration)
		};
	}

	calculateEngagementScore(duration) {
		// Score baseado em tempo, scroll e interações
		let score = 0;

		// Tempo na página (máximo 50 pontos)
		score += Math.min(50, (duration / 1000 / 60) * 10); // 10 pontos por minuto

		// Profundidade do scroll (máximo 30 pontos)
		score += (this.maxScrollDepth / 100) * 30;

		// Interações com componentes (máximo 20 pontos)
		const interactions = this.events.filter((e) => e.event === 'component_interaction').length;
		score += Math.min(20, interactions * 2);

		return Math.round(score);
	}

	// Integração com serviços de analytics
	sendToAnalytics(event) {
		// Google Analytics 4
		if (typeof gtag !== 'undefined') {
			gtag('event', event.event, {
				custom_parameter_1: event.sessionId,
				custom_parameter_2: event.componentType || null,
				value: event.engagementScore || 1
			});
		}

		// Adobe Analytics
		if (typeof s !== 'undefined') {
			s.linkTrackVars = 'events,eVar1,eVar2';
			s.events = event.event;
			s.eVar1 = event.sessionId;
			s.eVar2 = event.componentType || '';
			s.tl(true, 'o', event.event);
		}

		// Envio customizado para API
		this.sendToCustomAPI(event);
	}

	async sendToCustomAPI(event) {
		try {
			// Batch events para performance
			if (this.events.length % 5 === 0) {
				await fetch('/api/analytics', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						events: this.events.slice(-5) // Últimos 5 eventos
					})
				});
			}
		} catch (error) {
			console.warn('Failed to send analytics:', error);
		}
	}

	// API pública para componentes
	static getInstance() {
		if (!window.__storyAnalytics) {
			window.__storyAnalytics = new StoryAnalytics();
		}
		return window.__storyAnalytics;
	}
}

// Funções de conveniência para usar nos componentes
export const analytics = StoryAnalytics.getInstance();

export function trackComponentView(componentType, index) {
	analytics.trackComponentInteraction(componentType, 'view', { index });
}

export function trackComponentClick(componentType, action, data = {}) {
	analytics.trackComponentInteraction(componentType, 'click', { action, ...data });
}

export function trackVideoPlay(videoId, player = 'default') {
	analytics.trackMediaPlay('video', videoId);
}

export function trackGloboPlayerEvent(eventType, videoId, data = {}) {
	analytics.trackComponentInteraction('globoplayer', eventType, {
		videoId,
		...data
	});
}

export function trackShareClick(platform, storyTitle) {
	analytics.trackShareAction(platform, storyTitle);
}

// Export da classe principal
export default StoryAnalytics;
