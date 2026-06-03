/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Container } from '@mantine/core';
import ProfileStyle from '../../components/frontend/styles/ProfileStyle';

/**
 * Static fallback profile page used when the CMS `profile` page is missing
 * its required `profile` style section (`should_fallback: true`).
 *
 */
export default function ProfileFallbackPage() {
    return (
        <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-950 px-4 py-10 sm:px-6 sm:py-16">
            <Container size="lg" py="xl">
                <ProfileStyle style={{} as any} styleProps={{}} cssClass="" />
            </Container>
        </div>
    );
}
