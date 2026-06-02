/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Vitest config for the SelfHelp frontend (Slice 6).
 *
 * - jsdom environment so React Testing Library can render components.
 * - `setupFiles` wires jest-dom matchers, jsdom polyfills Mantine needs,
 *   and the MSW server lifecycle (canonical Testing Rule 30: no real
 *   outbound — unhandled requests error).
 * - Unit/integration tests live next to the code under `__tests__/`.
 *   Playwright E2E specs live under `e2e/` and are excluded here (run by
 *   `npm run test:e2e` in a later slice).
 */
export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test-utils/setup.ts'],
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['node_modules', '.next', 'e2e'],
        clearMocks: true,
        restoreMocks: true,
    },
});
