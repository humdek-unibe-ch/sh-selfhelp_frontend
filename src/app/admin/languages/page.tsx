import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { LanguagesPage } from '../../components/cms/languages/languages-page/LanguagesPage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';

export default function AdminLanguagesPage() {
    return (
        <AdminShell>
            <Suspense fallback={<LoadingScreen />}>
                <LanguagesPage />
            </Suspense>
        </AdminShell>
    );
}
