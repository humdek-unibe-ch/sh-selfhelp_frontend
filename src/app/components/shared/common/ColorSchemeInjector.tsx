/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useRef } from 'react';
import { useServerInsertedHTML } from 'next/navigation';

/**
 * Injects the Mantine color-scheme bootstrap script into the SSR HTML
 * stream, **outside** of React's render tree.
 *
 * ## Why this is necessary
 * React 19 emits a dev-only warning for any `<script>` tag that appears
 * inside a component's JSX output:
 *
 *   > Encountered a script tag while rendering React component. Scripts
 *   > inside React components are never executed when rendering on the
 *   > client. Consider using template tag instead.
 *
 * The warning fires regardless of whether the `<script>` carries `src`
 * or `dangerouslySetInnerHTML`, and whether the component is a Server
 * Component, Client Component, or `next/script` helper — any
 * `React.createElement('script', ...)` in the tree triggers it. This is
 * a known false positive for bootstrap scripts that do need to run
 * synchronously before hydration to avoid a theme flash (see
 * [next-themes#385](https://github.com/pacocoursey/next-themes/issues/385),
 * [shadcn-ui/ui#10104](https://github.com/shadcn-ui/ui/issues/10104)).
 *
 * `useServerInsertedHTML` from `next/navigation` is the supported escape
 * hatch: the callback fires only during SSR streaming, and Next injects
 * the returned HTML directly into the document — it never passes through
 * React's client-side component tree, so React's validator never sees
 * the script element. On the client, the hook is a no-op.
 *
 * ## Why the script is INLINE (not `<script src>`)
 * An external `<script src="/mantine-color-scheme.js">` needs a separate
 * network fetch, and React 19 hoists it as a resource rather than a
 * blocking parser script. On a cold cache / slow connection the body
 * therefore paints with the default (light) scheme for the duration of
 * that fetch, then flips to the resolved scheme once the script finally
 * runs — the "auto + OS dark → light flash on reload" bug. Inlining the
 * logic makes it execute synchronously the instant the parser reaches it,
 * before any body content paints, so the correct scheme is applied on the
 * very first frame with zero fetch latency. This inline copy is the single
 * source of truth (the old `/public/mantine-color-scheme.js` asset is no
 * longer referenced).
 *
 * Resolution order (first match wins): an explicit `data-mantine-color-scheme`
 * already stamped server-side (light/dark cookie) → the `sh_color_scheme`
 * cookie → `auto` (the app default). `auto` — whether explicit or the
 * no-cookie default — is expanded via `prefers-color-scheme` so Mantine's CSS
 * variables bind correctly on the first painted frame.
 *
 * ## Why the no-cookie default is `auto`, not `light`
 * `MantineProvider` is created with `defaultColorScheme="auto"`, so a visitor
 * with no `sh_color_scheme` cookie resolves to their OS preference after
 * hydration. If the bootstrap defaulted to `light` here, an OS-dark first-time
 * visitor would paint light, then Mantine would flip to dark on hydration — the
 * exact "nothing selected → light-then-dark blink" users reported. Defaulting
 * to `auto` makes the pre-paint resolution match Mantine's, so there is no flip.
 *
 * ## Why it is emitted only ONCE
 * `useServerInsertedHTML` fires its callback on every SSR stream flush (so
 * CSS-in-JS libraries can append styles collected per chunk). For a static,
 * idempotent bootstrap we only need it once — the first flush already
 * contains `<head>`, so the single emitted copy runs before any body content
 * paints. Without the guard the script was duplicated ~33× per page (one copy
 * per flush). The `injectedRef` makes the callback return the script on the
 * first flush and `null` afterwards (the same dedupe pattern emotion uses for
 * SSR style insertion).
 */
export const COLOR_SCHEME_BOOTSTRAP = `(function(){try{var h=document.documentElement;var s=h.getAttribute("data-mantine-color-scheme");if(s==="light"||s==="dark")return;var c=null;var m=document.cookie.match(/(?:^|;\\s*)sh_color_scheme=([^;]+)/);if(m){var r=decodeURIComponent(m[1]);if(r==="light"||r==="dark"||r==="auto")c=r;}var cs=c||"auto";var v=cs!=="auto"?cs:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");h.setAttribute("data-mantine-color-scheme",v);}catch(e){}})();`;

export function ColorSchemeInjector(): null {
    const injectedRef = useRef(false);
    useServerInsertedHTML(() => {
        if (injectedRef.current) return null;
        injectedRef.current = true;
        return <script dangerouslySetInnerHTML={{ __html: COLOR_SCHEME_BOOTSTRAP }} />;
    });
    return null;
}
