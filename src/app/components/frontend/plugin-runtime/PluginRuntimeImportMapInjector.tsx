/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useRef } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { PLUGIN_RUNTIME_IMPORT_MAP } from './runtime-globals';

/**
 * Streams the plugin-runtime import map into SSR HTML outside React's
 * client render tree.
 *
 * React 19 warns in development when a `<script>` tag appears in JSX,
 * even when the tag is a non-executing import map that the browser
 * must parse during initial document loading. Using
 * `useServerInsertedHTML()` lets Next inject the tag directly into the
 * HTML stream so the browser still sees it before any module import,
 * while React hydration no longer logs the false-positive warning.
 *
 * Next may call the insertion callback more than once during a single
 * streamed render. Guarding with a render-local flag ensures we emit
 * exactly one import map tag per request.
 */
export function PluginRuntimeImportMapInjector(): null {
    // Per-request guard. A ref (not a render-local `let`) keeps the mutation out
    // of render: Next may invoke the insertion callback more than once during a
    // streamed render, and on the server each request gets a fresh ref, so we
    // still emit exactly one import map tag per request.
    const insertedRef = useRef(false);

    useServerInsertedHTML(() => {
        if (insertedRef.current) {
            return null;
        }
        insertedRef.current = true;

        return (
            <script
                type="importmap"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({ imports: PLUGIN_RUNTIME_IMPORT_MAP }),
                }}
            />
        );
    });

    return null;
}
