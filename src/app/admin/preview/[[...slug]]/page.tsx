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

export default async function AdminLivePreviewPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug?: string[] }>;
    searchParams: Promise<{ modal?: string | string[] }>;
}) {
    await requireAdminPermission(PERMISSIONS.ADMIN_MOBILE_PREVIEW_VIEW);

    const { slug } = await params;
    const { modal } = await searchParams;
    const keyword = slug?.[0]?.trim() || DEFAULT_PREVIEW_KEYWORD;

    return <LivePreview keyword={keyword} modal={parseModal(modal)} />;
}
