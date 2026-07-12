/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const OPTION_RENDERERS = [
    '../SelectStyle.tsx',
    '../mantine/inputs/RadioStyle.tsx',
    '../mantine/inputs/ComboboxStyle.tsx',
    '../mantine/inputs/SegmentedControlStyle.tsx',
];

describe('option renderers shared resolver adoption', () => {
    it.each(OPTION_RENDERERS)('%s imports the shared resolver without a local copy', (relativePath) => {
        const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');

        expect(source).toContain("from '@selfhelp/shared'");
        expect(source).toContain('resolveOptions(');
        expect(source).not.toContain('function resolveOptions');
    });
});
