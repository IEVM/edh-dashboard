import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
	plugins: [sveltekit(), purgeCss()],
	test: {
		environment: 'node',
		environmentMatchGlobs: [['tests/components/**', 'jsdom']],
		include: [
			'tests/unit/**/*.test.ts',
			'tests/components/**/*.test.ts',
			'tests/routes/**/*.test.ts'
		],
		setupFiles: ['./vitest.setup.ts']
	}
});
