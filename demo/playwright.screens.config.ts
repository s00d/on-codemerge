import { defineConfig } from '@playwright/test';
import base from './playwright.config';

/** README screenshots only (`pnpm screenshots`); not part of `pnpm test:e2e`. */
export default defineConfig({ ...base, testDir: './screens', fullyParallel: false, workers: 1 });
