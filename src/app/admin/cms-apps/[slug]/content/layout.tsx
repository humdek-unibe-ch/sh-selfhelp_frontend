/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/*

SPDX-FileCopyrightText: 2026 Humdek, University of Bern

SPDX-License-Identifier: MPL-2.0

*/

import type { ReactNode } from 'react';

import { requireAdminPermission } from '../../../../_lib/admin-guard';

import { PERMISSIONS } from '../../../../../types/auth/jwt-payload.types';

import { AdminShell } from '../../../../components/cms/admin-shell/AdminShell';

import { CmsAppContentPage } from '../../../../components/cms/cms-apps/CmsAppContentPage';



/**

 * Keeps AdminShell + the CMS content host mounted while create/edit URLs change.

 * Child route segments return null so list + modal state persist without a full

 * admin chrome remount.

 */

export default async function AdminCmsAppContentLayout({

    params,

    children,

}: {

    params: Promise<{ slug: string }>;

    children: ReactNode;

}) {

    await requireAdminPermission(PERMISSIONS.ADMIN_CMS_APP_READ);

    const { slug } = await params;



    return (

        <AdminShell>

            <CmsAppContentPage slug={slug} />

            {children}

        </AdminShell>

    );

}

