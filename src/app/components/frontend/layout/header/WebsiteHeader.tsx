/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/*

SPDX-FileCopyrightText: 2026 Humdek, University of Bern

SPDX-License-Identifier: MPL-2.0

*/

import {

    getNavigationSSR,

    getProfilePagesSSR,

    resolveLanguageSSR,

} from '../../../../_lib/server-fetch';

import { WebsiteHeaderLayout } from './WebsiteHeaderLayout';
import type { INavigationPayload } from '../../../../../shared';



/**

 * Website header — **Server Component**.

 *

 * Resolves the active language and prefetches the public navigation tree on

 * the server, then hydrates the client layout shell for interactive chrome.

 */

export async function WebsiteHeader() {

    const { id: languageId } = await resolveLanguageSSR();

    const [navigation, initialProfilePages] = languageId > 0

        ? await Promise.all([

              getNavigationSSR(languageId),

              getProfilePagesSSR(languageId),

          ])

        : [null, []];



    const initialHeaderMenu = navigation?.menus?.web_header ?? null;
    const initialBranding = navigation?.branding ?? null;



    return (

        <WebsiteHeaderLayout

            initialHeaderMenu={initialHeaderMenu}
            initialNavigation={navigation as INavigationPayload | null}
            initialBranding={initialBranding}

            initialProfilePages={initialProfilePages}

        />

    );

}

