/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Component coverage for the page-editor `MobilePreviewPanel`.
 *
 * These assert the UI contract that ties the CMS to the
 * `selfhelp-mobile-preview` image (Testing Rule 22 — the UI enforces the
 * contract, not just the backend):
 *
 *   - it probes `<origin>/version.json` and, when available, mints a one-time
 *     code (scoped to the page) and embeds it — plus the keyword / device /
 *     draft / language — in the iframe `src` per the embed contract;
 *   - changing a toolbar control (device) mints a FRESH code (each iframe load
 *     consumes one on exchange) and updates the `src`;
 *   - a same-origin path whose `version.json` 404s renders the graceful
 *     "unavailable" fallback with no iframe and never mints;
 *   - an absolute live-reload dev origin stays available even without a
 *     `version.json`;
 *   - a mint failure surfaces an inline error and renders no iframe.
 *
 * The thin BFF mint client is mocked (its real axios->BFF path is covered by the
 * dedicated route + the pure `buildMobilePreviewUrl` builder test) and the
 * `version.json` probe `fetch` is stubbed, so the panel logic is deterministic.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import type { ILanguage } from '../../../../../../shared';

const mintState = vi.hoisted(() => ({ createSession: vi.fn() }));

vi.mock('../../../../../../api/admin/mobile-preview.api', () => ({
    AdminMobilePreviewApi: { createSession: mintState.createSession },
}));

import { MobilePreviewPanel } from '../MobilePreviewPanel';

const LANGUAGES: ILanguage[] = [
    { id: 1, locale: 'en-GB', language: 'English' },
    { id: 2, locale: 'de-CH', language: 'German' },
];

const VERSION_INFO = {
    version: '1.2.3',
    mobileRendererVersion: '0.1.0',
    bundledPlugins: [{ id: 'sh2-shp-survey-js', version: '0.1.0' }],
};

/** Stub the version.json probe `fetch` with a fixed availability outcome. */
function stubVersionProbe(outcome: 'ok' | '404'): void {
    vi.stubGlobal(
        'fetch',
        vi.fn(async () =>
            outcome === 'ok'
                ? ({ ok: true, json: async () => VERSION_INFO } as Response)
                : ({ ok: false, status: 404, json: async () => ({}) } as Response),
        ),
    );
}

/** Mint codes monotonically so a re-mint is observable in the iframe src. */
function mintSequential(): void {
    let n = 0;
    mintState.createSession.mockImplementation(async () => {
        n += 1;
        return { code: `CODE${n}`, expires_at: '2099-01-01T00:00:00.000Z' };
    });
}

function queryOf(src: string): Record<string, string> {
    return Object.fromEntries(new URLSearchParams(src.slice(src.indexOf('?') + 1)).entries());
}

function renderPanel() {
    return renderWithProviders(
        <MobilePreviewPanel keyword="home" pageId={42} languages={LANGUAGES} defaultLanguageId={1} />,
    );
}

afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
});

describe('MobilePreviewPanel', () => {
    describe('same-origin deployed image', () => {
        beforeEach(() => {
            vi.stubEnv('NEXT_PUBLIC_MOBILE_PREVIEW_ORIGIN', '/mobile-preview');
            stubVersionProbe('ok');
            mintSequential();
        });

        it('mints a scoped one-time code and embeds the contract params in the iframe src', async () => {
            renderPanel();

            const iframe = (await screen.findByTitle('Mobile preview')) as HTMLIFrameElement;
            const src = iframe.getAttribute('src') ?? '';
            expect(src.startsWith('/mobile-preview/?')).toBe(true);
            expect(queryOf(src)).toMatchObject({
                embed: '1',
                preview: 'true',
                device: 'phone',
                orientation: 'portrait',
                keyword: 'home',
                language: 'en-GB',
                previewSession: 'CODE1',
            });

            // Code is minted scoped to the page being edited.
            expect(mintState.createSession).toHaveBeenCalledWith({
                keyword: 'home',
                page_id: 42,
                language_id: 1,
                draft: true,
            });

            // Availability badges read straight from version.json.
            expect(screen.getByText('preview v1.2.3')).toBeInTheDocument();
            expect(screen.getByText('1 bundled plugin')).toBeInTheDocument();
        });

        it('mints a fresh code when a toolbar control changes (device -> tablet)', async () => {
            renderPanel();

            const iframe = (await screen.findByTitle('Mobile preview')) as HTMLIFrameElement;
            await waitFor(() =>
                expect(iframe.getAttribute('src')).toContain('previewSession=CODE1'),
            );

            fireEvent.click(screen.getByRole('radio', { name: 'Tablet' }));

            await waitFor(() => {
                const src = iframe.getAttribute('src') ?? '';
                expect(src).toContain('device=tablet');
                expect(src).toContain('previewSession=CODE2');
            });
            expect(mintState.createSession).toHaveBeenCalledTimes(2);
        });

        it('surfaces a mint failure inline and renders no iframe', async () => {
            mintState.createSession.mockReset();
            mintState.createSession.mockRejectedValue(new Error('mint boom'));

            renderPanel();

            expect(await screen.findByText('Preview error')).toBeInTheDocument();
            expect(screen.getByText('mint boom')).toBeInTheDocument();
            expect(screen.queryByTitle('Mobile preview')).not.toBeInTheDocument();
        });
    });

    describe('graceful unavailable fallback', () => {
        beforeEach(() => {
            vi.stubEnv('NEXT_PUBLIC_MOBILE_PREVIEW_ORIGIN', '/mobile-preview');
            stubVersionProbe('404');
            mintSequential();
        });

        it('renders the fallback when version.json 404s and never mints', async () => {
            renderPanel();

            expect(await screen.findByText('Mobile preview unavailable')).toBeInTheDocument();
            expect(screen.queryByTitle('Mobile preview')).not.toBeInTheDocument();
            expect(mintState.createSession).not.toHaveBeenCalled();
        });
    });

    describe('absolute live-reload dev origin', () => {
        beforeEach(() => {
            vi.stubEnv('NEXT_PUBLIC_MOBILE_PREVIEW_ORIGIN', 'http://localhost:8081');
            stubVersionProbe('404');
            mintSequential();
        });

        it('stays available without a version.json (Expo dev server)', async () => {
            renderPanel();

            const iframe = (await screen.findByTitle('Mobile preview')) as HTMLIFrameElement;
            expect(iframe.getAttribute('src')?.startsWith('http://localhost:8081/?')).toBe(true);
            expect(screen.getByText('live-reload dev')).toBeInTheDocument();
        });
    });
});
