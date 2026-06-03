/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import WebsiteLayout from '../../components/frontend/layout/WebsiteLayout';

export default function ProfileFallbackLayout({ children }: { children: React.ReactNode }) {
    return <WebsiteLayout>{children}</WebsiteLayout>;
}
