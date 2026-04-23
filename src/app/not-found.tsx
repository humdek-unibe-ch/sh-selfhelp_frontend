import { cookies } from 'next/headers';
import { NotFoundClient } from './NotFoundClient';
import { AUTH_COOKIE } from '../config/server.config';

/**
 * Global 404 page (Server Component).
 *
 * Shown when the slug resolver (`getPageByKeywordSSRCached`) returns `null`
 * for a given keyword — e.g. a fresh install without a `home` page, or a
 * broken internal link.
 *
 * We peek at the httpOnly `sh_auth` cookie here (only possible on the
 * server) to decide whether to render the "Sign in" CTA. The actual UI is
 * delegated to `NotFoundClient` because Mantine `Button component={Link}`
 * passes a function prop, which would fail the RSC → Client Component
 * serialization check if rendered directly in this file.
 */
export default async function NotFound() {
    const cookieJar = await cookies();
    const isAuthenticated = Boolean(cookieJar.get(AUTH_COOKIE)?.value);

    return <NotFoundClient isAuthenticated={isAuthenticated} />;
}
