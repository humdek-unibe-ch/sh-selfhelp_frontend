/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import { describe, expect, it } from 'vitest';
import { sanitizePluginHtml } from '../PluginRuntime';

describe('sanitizePluginHtml (IPluginApi.sanitizeHtml)', () => {
    const attack = '<h2>Title</h2><p>Thanks<img src="x" onerror="alert(1)"><script>alert(2)</script><a href="javascript:alert(3)">link</a></p>';

    it('removes anything that could run script, in both modes', () => {
        for (const mode of ['inline', 'block'] as const) {
            const html = sanitizePluginHtml(attack, mode);
            expect(html).toContain('Thanks');
            expect(html).not.toMatch(/onerror|<script|javascript:/i);
        }
    });

    it('keeps block structure only in block mode', () => {
        expect(sanitizePluginHtml('<ul><li>a</li></ul><blockquote>q</blockquote>', 'block')).toContain('<blockquote>');
        expect(sanitizePluginHtml('<ul><li>a</li></ul><blockquote>q</blockquote>', 'inline')).not.toContain('<blockquote>');
    });

    it('sends record file links through the web proxy, like core pages', () => {
        expect(sanitizePluginHtml('<a href="/lists/1/records/2/files/a.pdf">a</a>', 'inline')).toContain('/api/lists/1/records/2/files/a.pdf');
    });
});
