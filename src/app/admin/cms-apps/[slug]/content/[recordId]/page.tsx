/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { notFound } from 'next/navigation';

interface IAdminCmsAppContentRecordRouteProps {
    params: Promise<{ recordId: string }>;
}

/**
 * Route segment exists for URL matching; UI is rendered from `layout.tsx`.
 * Reject non-numeric ids so `/content/foo` 404s.
 */
export default async function AdminCmsAppContentRecordRoute({
    params,
}: IAdminCmsAppContentRecordRouteProps) {
    const { recordId } = await params;
    if (!/^\d+$/.test(recordId)) {
        notFound();
    }

    return null;
}
