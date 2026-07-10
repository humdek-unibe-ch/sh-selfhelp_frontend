/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * When CMS app content is hosted inside AdminShell, entry-table add/edit and
 * related links should stay on admin routes instead of public `/cms/...` URLs.
 */

import { createContext, useContext } from 'react';

export type TCmsAppFormMode = 'list' | 'create' | 'edit';

export interface ICmsAppAdminNavContextValue {
    appSlug: string;
    contentBasePath: string;
    formCreatePath: string;
    formEditPath: (recordId: string | number) => string;
    isAdminHost: true;
    formMode: TCmsAppFormMode;
    openCreateForm: () => void;
    openEditForm: (recordId: string | number) => void;
    closeForm: () => void;
    /** When set, the CMS list page refetches entry-table rows for this locale. */
    previewLanguageId: number | null;
    setPreviewLanguageId: (languageId: number | null) => void;
}

const CmsAppAdminNavContext = createContext<ICmsAppAdminNavContextValue | null>(null);

export { CmsAppAdminNavContext };

export function useCmsAppAdminNav(): ICmsAppAdminNavContextValue | null {
    return useContext(CmsAppAdminNavContext);
}
