// svelte.config.js
import adapter from '@sveltejs/adapter-static';

const allowDynamicRoutes = process.env.ALLOW_DYNAMIC_ROUTES === 'true';

const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			precompress: false,
			strict: !allowDynamicRoutes
		}),

		paths: {
			base: process.env.NODE_ENV === 'production' ? '' : ''
		},

		prerender: {
			handleHttpError: 'warn',
			handleMissingId: 'warn',
			entries: ['*']
		}
	}
};

export default config;
