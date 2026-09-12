import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

/**
 * Dev proxy: browser calls relative `/api` (and `/api/v1/...`).
 * Vite forwards to the FastAPI backend (default http://127.0.0.1:8000).
 * Production: Caddy (or compose nginx in frontend image) reverse-proxies `/api`
 * the same way — see docs/DEPLOYMENT.md and frontend/nginx.conf.
 * Do not hardcode the API host in client fetch URLs.
 */
export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Static build for nginx:80 (compose FRONTEND_PORT → container :80).
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: undefined,
				precompress: false,
				strict: true
			})
		})
	],
	server: {
		proxy: {
			'/api': {
				target: 'http://127.0.0.1:8000',
				changeOrigin: true
			}
		}
	}
});