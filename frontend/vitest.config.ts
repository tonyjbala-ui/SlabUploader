import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Vitest for pure math/image modules (Lane A).
 * Kept separate from the SvelteKit vite.config so we do not disturb the scaffold.
 */
export default defineConfig({
	test: {
		name: 'math',
		include: ['src/lib/math/**/*.test.ts', 'src/lib/image/**/*.test.ts'],
		reporters: ['verbose'],
		environment: 'node'
	},
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib')
		}
	}
});
