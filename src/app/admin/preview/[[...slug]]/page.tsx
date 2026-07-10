/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Full-screen CMS **Live Preview** route — Server Component.
 *
 * Opened in a NEW TAB from the page editor. Authoritatively gated by the
 * `admin.mobile_preview.view` permission server-side (mirrored by the
 * client-side `useCanViewMobilePreview()` on the editor entry point), so a user
 * without it is bounced to the no-access page before the client renders. This
 * route deliberately does NOT use `AdminShell` — it is a dedicated, chrome-free
 * surface for testing the real flow.
 *
 * The optional catch-all slug carries the page keyword to launch on
 * (`/admin/preview/<keyword>`); with no slug it defaults to `home`.
 * `?path=` carries the public CMS URL for parameterized pages so a reload keeps
 * `route_params` (e.g. `/admin/preview/team-members-record?path=/team-members/4`).
 */

import { requireAdminPermission } from '../../../_lib/admin-guard';
import { PERMISSIONS } from '../../../../types/auth/jwt-payload.types';
import { LivePreview } from '../../../components/cms/live-preview/LivePreview';
import type { TPreviewModalMode } from '../../../components/cms/pages/mobile-preview/mobilePreviewUrl';

export const metadata = { title: 'Live Preview' };

const DEFAULT_PREVIEW_KEYWORD = 'home';

function parseModal(value: string | string[] | undefined): TPreviewModalMode | undefined {
    const v = Array.isArray(value) ? value[0] : value;
    return v === 'on' || v === 'off' ? v : undefined;
}

function parsePath(value: string | string[] | undefined): string | undefined {
    const v = Array.isArray(value) ? value[0] : value;
    if (!v || typeof v !== 'string') return undefined;
    const trimmed = v.trim();
    if (!trimmed.startsWith('/')) return undefined;
    return trimmed;
}

export default async function AdminLivePreviewPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug?: string[] }>;
    searchParams: Promise<{ modal?: string | string[]; path?: string | string[] }>;
}) {
    await requireAdminPermission(PERMISSIONS.ADMIN_MOBILE_PREVIEW_VIEW);

    const { slug } = await params;
    const { modal, path } = await searchParams;
    const keyword = slug?.[0]?.trim() || DEFAULT_PREVIEW_KEYWORD;

    return (
        <LivePreview
            keyword={keyword}
            initialPath={parsePath(path)}
            modal={parseModal(modal)}
        />
    );
}
