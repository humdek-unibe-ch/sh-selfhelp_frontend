import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/schedule/styles.css';
import '@mantine/carousel/styles.css';
import '@mantine/tiptap/styles.css';
import '../globals.css';

import { ServerProviders } from '../providers/server-providers';
import { resolveLanguageSSR } from './_lib/server-fetch';
import { ColorSchemeInjector } from './components/shared/common/ColorSchemeInjector';

/**
 * Root layout — a **Server Component**.
 *
 * Resolves the active language against the *live* `/languages` list (the DB
 * is the source of truth; there is no hardcoded locale→id map anywhere in
 * the app). The resolved id / locale are threaded down to
 * `ClientProviders` so `LanguageContext` seeds without a client-side
 * hydration round-trip.
 *
 * ## Color-scheme bootstrap
 * We **do not** render the bootstrap `<script>` inline here. React 19
 * warns about *any* `<script>` tag that appears in a component's JSX
 * (with or without `src`, `dangerouslySetInnerHTML`, or `next/script`),
 * and the warning is a known false positive for pre-hydration theme
 * scripts. Instead, `ColorSchemeInjector` uses `useServerInsertedHTML`
 * to stream `/public/mantine-color-scheme.js` into the document *outside*
 * React's render tree — see `ColorSchemeInjector.tsx` for the full
 * rationale.
 *
 * The `<title>` element is intentionally absent — per-page titles are
 * driven by `generateMetadata()` exports on route segments, so the browser
 * always shows the correct title before the first React render.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
    // Only `htmlLang` is needed here; the id + full language list is
    // resolved inside `ServerProviders` (which shares the same React-cached
    // `resolveLanguageSSR` call, so this does *not* double-hit Symfony).
    const { htmlLang } = await resolveLanguageSSR();

    return (
        <html lang={htmlLang} suppressHydrationWarning>
            <head>
                <link rel="shortcut icon" href="/favicon.svg" />
                <meta
                    name="viewport"
                    content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
                />
            </head>
            <body>
                <ColorSchemeInjector />
                <ServerProviders>{children}</ServerProviders>
            </body>
        </html>
    );
}

/**
 * Default metadata applied to every route unless a route segment overrides
 * it via its own `generateMetadata`. Keeping it here avoids the old
 * `<title>SelfHelp V2</title>` → real title flicker on slug pages.
 */
export const metadata = {
    title: {
        default: 'SelfHelp',
        template: '%s',
    },
    description: 'SelfHelp — research support platform.',
    robots: { index: true, follow: true },
};
