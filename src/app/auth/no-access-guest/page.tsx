/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import NoAccessStyle from '../../components/frontend/styles/NoAccessStyle';

export default function NoAccessGuestFallbackPage() {
    return (
        <NoAccessStyle
            style={{
                title: { content: 'Access denied' },
                message: { content: 'You need to be logged in to view this page. Please sign in to continue.' },
                show_login: { content: '1' },
            }}
            styleProps={{}}
            cssClass=""
        />
    );
}
