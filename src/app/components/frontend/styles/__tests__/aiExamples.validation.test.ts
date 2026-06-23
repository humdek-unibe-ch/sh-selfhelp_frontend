/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { validateAllExamples } from '../../../../../../scripts/validate-ai-examples.mjs';

/**
 * Drift guard for the curated AI section examples
 * (`docs/reference/ai-prompts/generated-examples/*.json`).
 *
 * Each example is validated DB-free against the committed live-schema snapshot
 * (`docs/reference/ai-prompts/style-schema.snapshot.json`) using the same
 * `scripts/validate-ai-examples.mjs` CI runs — so an example that re-introduces
 * an obsolete field name (`mantine_*`, non-reserved `shared_*`), the wrong
 * locale scope, a broken parent/child slot, or a `css_mobile` token that would
 * be dropped on native fails here.
 */
describe('AI section examples stay valid against the live style schema', () => {
    it('every committed example validates with zero errors', async () => {
        const { files, errors } = await validateAllExamples();
        expect(files.length).toBeGreaterThan(0);
        const detail = errors
            .map((e: { file: string; path: string; message: string }) => `${e.file} ${e.path}: ${e.message}`)
            .join('\n');
        expect(detail).toBe('');
    });
});
