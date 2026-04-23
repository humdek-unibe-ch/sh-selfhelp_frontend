'use client';

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
 * The script itself lives in `/public/mantine-color-scheme.js` to keep
 * the component JSX clean and to let the browser cache it like any
 * other static asset.
 */
export function ColorSchemeInjector(): null {
    useServerInsertedHTML(() => (
        <script src="/mantine-color-scheme.js" />
    ));
    return null;
}
