import { defineConfig } from '@playwright/test';

const isCI = !!process.env.CI;
const port = 4173;

export default defineConfig({
	testDir: './tests/e2e',
	timeout: 30_000,
	expect: { timeout: 5_000 },
	webServer: {
		command: 'npm run dev -- --host 127.0.0.1 --port 4173',
		port,
		reuseExistingServer: !isCI
	},
	use: {
		baseURL: `http://127.0.0.1:${port}`,
		trace: 'on-first-retry'
	}
});
