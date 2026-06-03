/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Container } from '@mantine/core';
import TwoFactorAuthStyle from '../../components/frontend/styles/TwoFactorAuthStyle';

export default function TwoFactorAuthenticationPage() {
    return (
        <Container size={420} my={40}>
            <TwoFactorAuthStyle style={{} as any} styleProps={{}} cssClass="" />
        </Container>
    );
}
