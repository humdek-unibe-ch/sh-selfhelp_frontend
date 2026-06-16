/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import { describe, expect, it } from 'vitest';
import { hasRenderableMaintenancePage, isMaintenanceStatus } from './maintenance';

describe('maintenance helpers', () => {
    describe('isMaintenanceStatus', () => {
        it('is true only for a 503 (Service Unavailable)', () => {
            expect(isMaintenanceStatus(503)).toBe(true);
        });

        it('is false for a real 404 and other statuses', () => {
            expect(isMaintenanceStatus(404)).toBe(false);
            expect(isMaintenanceStatus(200)).toBe(false);
            expect(isMaintenanceStatus(500)).toBe(false);
        });

        it('is false when the request never completed', () => {
            expect(isMaintenanceStatus(null)).toBe(false);
            expect(isMaintenanceStatus(undefined)).toBe(false);
        });
    });

    describe('hasRenderableMaintenancePage', () => {
        it('prefers the BE should_fallback flag', () => {
            expect(hasRenderableMaintenancePage({ id: 9, should_fallback: false })).toBe(true);
            expect(hasRenderableMaintenancePage({ id: 9, should_fallback: true })).toBe(false);
        });

        it('falls back to a zero-sections check for older BE payloads', () => {
            expect(hasRenderableMaintenancePage({ id: 9, sections: [{}, {}] })).toBe(true);
            expect(hasRenderableMaintenancePage({ id: 9, sections: [] })).toBe(false);
        });

        it('is false for missing / malformed pages', () => {
            expect(hasRenderableMaintenancePage(null)).toBe(false);
            expect(hasRenderableMaintenancePage(undefined)).toBe(false);
            expect(hasRenderableMaintenancePage({})).toBe(false);
            // A page without a numeric id cannot be rendered by DynamicPageClient.
            expect(hasRenderableMaintenancePage({ should_fallback: false })).toBe(false);
        });
    });
});
