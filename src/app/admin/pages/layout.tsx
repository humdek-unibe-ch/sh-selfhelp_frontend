import type { Metadata } from 'next';

/**
 * Metadata segment for the `/admin/pages/*` route group.
 *
 * The editor itself (`[[...slug]]/page.tsx`) is a Client Component and
 * therefore cannot export `metadata` directly. Placing it here keeps the
 * server-rendered first paint useful (tab reads "Pages · Admin · SelfHelp"
 * before any page is selected) while still composing cleanly through the
 * parent `/admin/layout.tsx` template.
 *
 * Once a page is selected in the editor, the client component uses
 * `useSyncDocumentMetadata` to append the page keyword to the tab title
 * (e.g. "form · Pages · Admin · SelfHelp").
 */
export const metadata: Metadata = {
    title: 'Pages',
};

export default function AdminPagesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
