import "@mantine/core/styles.css";
import '@mantine/dates/styles.css';
import "@mantine/notifications/styles.css";
import '@mantine/carousel/styles.css';
import '@mantine/tiptap/styles.css';
import "../globals.css";
import { ColorSchemeScript } from "@mantine/core";
import { Providers } from "../providers/providers";

/**
 * Root Layout Server Component
 * Optimized for performance with minimal server-side overhead
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
