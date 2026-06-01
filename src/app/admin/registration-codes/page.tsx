/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { RegistrationCodesPage } from '../../components/cms/registration-codes/RegistrationCodesPage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';

export const metadata = { title: 'Registration Codes' };

export default function AdminRegistrationCodesPage() {
    return (
        <AdminShell>
            <Suspense fallback={<LoadingScreen />}>
                <RegistrationCodesPage />
            </Suspense>
        </AdminShell>
    );
}
