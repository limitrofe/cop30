// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
	const isBuilder = mode === 'builder';

	return {
		plugins: [sveltekit()],

		// Configurações específicas do builder
		...(isBuilder && {
			define: {
				'import.meta.env.BUILDER_MODE': true
			},

			server: {
				port: 3000,
				open: '/builder',
				fs: {
					allow: ['..']
				}
			}
		}),

		optimizeDeps: {
			include: ['lucide-svelte']
		},

		// Resolver imports dinâmicos
		build: {
			rollupOptions: {
				output: {
					manualChunks: {
						'story-components': [
							'./src/lib/components/story/Header.svelte',
							'./src/lib/components/story/StoryText.svelte',
							'./src/lib/components/story/PhotoWithCaption.svelte',
							'./src/lib/components/story/VideoPlayer.svelte'
						]
					}
				}
			}
		}
	};
});
