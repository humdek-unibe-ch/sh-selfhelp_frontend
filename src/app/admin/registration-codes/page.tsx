/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { RegistrationCodesPage } from '../../components/cms/registration-codes/RegistrationCodesPage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';
import { requireAdminPermission } from '../../_lib/admin-guard';
import { PERMISSIONS } from '../../../types/auth/jwt-payload.types';

export const metadata = { title: 'Registration Codes' };

export default async function AdminRegistrationCodesPage() {
    await requireAdminPermission(PERMISSIONS.ADMIN_REGISTRATION_CODE_READ);
    return (
        <AdminShell>
            <Suspense fallback={<LoadingScreen />}>
                <RegistrationCodesPage />
            </Suspense>
        </AdminShell>
    );
}
