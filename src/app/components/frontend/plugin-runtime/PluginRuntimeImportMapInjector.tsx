/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

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
    let inserted = false;

    useServerInsertedHTML(() => {
        if (inserted) {
            return null;
        }
        inserted = true;

        return (
            <script
                type="importmap"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({ imports: PLUGIN_RUNTIME_IMPORT_MAP }),
                }}
            />
        );
    });

    return null;
}
