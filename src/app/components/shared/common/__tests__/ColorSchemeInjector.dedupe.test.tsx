/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { isValidElement, type ReactNode } from 'react';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// `useServerInsertedHTML` fires its callback once per SSR stream flush. We
// capture every registered callback so the test can replay those flushes and
// assert the bootstrap <script> is emitted only once (not duplicated per flush).
const insertedCallbacks: Array<() => ReactNode> = [];

vi.mock('next/navigation', () => ({
    useServerInsertedHTML: (cb: () => ReactNode) => {
        insertedCallbacks.push(cb);
    },
}));

import { ColorSchemeInjector, COLOR_SCHEME_BOOTSTRAP } from '../ColorSchemeInjector';

describe('ColorSchemeInjector single-emit guard', () => {
    afterEach(() => {
        insertedCallbacks.length = 0;
        vi.clearAllMocks();
    });

    it('emits the bootstrap <script> on the first flush and null afterwards', () => {
        render(<ColorSchemeInjector />);

        expect(insertedCallbacks.length).toBeGreaterThanOrEqual(1);

        // Replay ~33 stream flushes across every registered callback (mirrors the
        // real per-flush invocation that previously duplicated the script).
        const outputs: ReactNode[] = [];
        for (const cb of insertedCallbacks) {
            for (let i = 0; i < 33; i += 1) {
                outputs.push(cb());
            }
        }

        const emitted = outputs.filter((o) => isValidElement(o));
        expect(emitted).toHaveLength(1);

        const script = emitted[0];
        expect(isValidElement(script)).toBe(true);
        if (isValidElement<{ dangerouslySetInnerHTML?: { __html?: string } }>(script)) {
            expect(script.type).toBe('script');
            expect(script.props.dangerouslySetInnerHTML?.__html).toBe(COLOR_SCHEME_BOOTSTRAP);
        }
    });
});
