/**
 * Shared navigation transforms.
 *
 * The same logic must run in three places:
 *   1. SSR helpers (`getMenuPagesSSR` in `_lib/server-fetch.ts`) so the
 *      Server Component header can render the menu HTML on the very first
 *      painted frame.
 *   2. Client-side `useAppNavigation` `select` so React Query consumers see
 *      the same transformed shape after hydration.
 *   3. Hover-prefetch handlers (which need the keyword index of the
 *      flattened tree).
 *
 * Centralising it here guarantees the SSR `<title>` of a menu item matches
 * the post-hydration title char-for-char, so React does not warn about a
 * hydration mismatch on the menu structure.
 */
import { transformPageData } from '../api/navigation.api';
import type { IPageItem } from '../types/common/pages.type';

/**
 * Recursively rewrite child page URLs so they navigate to the direct
 * `/{keyword}` route instead of a nested `/parent/child` path. This is
 * historical behaviour — the backend stores nested URLs but the slug
 * router resolves every keyword from the top level.
 */
function fixChildPageUrls(pageList: IPageItem[]): IPageItem[] {
    return pageList.map((page) => {
        const fixedPage: IPageItem = { ...page };
        if (page.parent_page_id && page.keyword) {
            fixedPage.url = `/${page.keyword}`;
        }
        if (page.children && page.children.length > 0) {
            fixedPage.children = fixChildPageUrls(page.children);
        }
        return fixedPage;
    });
}

/**
 * Apply `transformPageData` and the URL fix-up to a raw API page list.
 * Use this when you need the full transformed pages tree (e.g. inside the
 * `useAppNavigation` `select` to derive footer / profile / route slices).
 */
export function transformNavigationPages(rawPages: any[]): IPageItem[] {
    if (!Array.isArray(rawPages)) return [];
    const transformed = rawPages.map(transformPageData);
    return fixChildPageUrls(transformed);
}

/**
 * Filter a transformed page tree down to the top-level menu entries —
 * pages that have a `navPosition` and are not flagged headless — sorted
 * by their nav position.
 *
 * Mirrors the menu-slice computed inside `useAppNavigation`'s `select`.
 */
export function selectMenuPages(pages: IPageItem[]): IPageItem[] {
    return pages
        .filter((page) => page.navPosition !== null && !page.is_headless)
        .sort((a, b) => (a.navPosition ?? 0) - (b.navPosition ?? 0));
}

/**
 * Filter a transformed page tree down to the footer entries.
 */
export function selectFooterPages(pages: IPageItem[]): IPageItem[] {
    return pages
        .filter((page) => page.footerPosition !== null && !page.is_headless)
        .sort((a, b) => (a.footerPosition ?? 0) - (b.footerPosition ?? 0));
}

/**
 * Filter a transformed page tree down to the profile-link entries (the
 * dropdown rendered behind the user avatar in the header). The backend
 * exposes these as `is_system === true` rows with the well-known
 * `profile-link` keyword, sorted by `navPosition` for predictable order.
 *
 * Mirrors the slice computed inside `useAppNavigation`'s `select` so the
 * SSR `<AuthButton>` render and the post-hydration client render produce
 * identical "Profil" / "Profile" / etc. output (no flash of the English
 * fallback when the user's language is non-English).
 */
export function selectProfilePages(pages: IPageItem[]): IPageItem[] {
    return pages
        .filter((page) => page.is_system === true && page.keyword === 'profile-link')
        .sort((a, b) => (a.navPosition ?? 0) - (b.navPosition ?? 0));
}

/**
 * Structural shape required by {@link getPageTitle}. Kept intentionally
 * narrow so it accepts both `IPageItem` (frontend nav) and `IAdminPage`
 * (admin nav) without coupling this util to either type.
 */
export interface IPageTitleSource {
    keyword: string;
    title?: string | null;
}

/**
 * Resolve the user-visible label for a navigation entry.
 *
 * Order of preference:
 *   1. Translated `title` from the backend (`pages_fields_translation`,
 *      `display=1`) when present and non-blank.
 *   2. Capitalised, hyphen/underscore-stripped `keyword` as a deterministic
 *      fallback — used both when the translation is missing AND when this
 *      runs server-side before the language has been resolved.
 *
 * Centralised here so the SSR header / footer / profile menu renders, the
 * post-hydration client render, and any prefetch-driven label all produce
 * the same character sequence. Drift here causes hydration mismatches.
 */
export function getPageTitle(page: IPageTitleSource): string {
    if (page.title && page.title.trim()) {
        return page.title;
    }
    return (
        page.keyword.charAt(0).toUpperCase() +
        page.keyword.slice(1).replace(/_/g, ' ').replace(/-/g, ' ')
    );
}
