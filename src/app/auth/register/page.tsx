/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Container } from '@mantine/core';
import RegisterStyle from '../../components/frontend/styles/RegisterStyle';

export default function RegisterFallbackPage() {
    return (
        <Container size={420} my={40}>
            <RegisterStyle style={{} as any} styleProps={{}} cssClass="" />
        </Container>
    );
}
