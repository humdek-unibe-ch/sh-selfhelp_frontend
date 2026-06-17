/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Container } from '@mantine/core';
import RegisterStyle from '../../components/frontend/styles/RegisterStyle';
import { type IRegisterStyle } from '../../../types/common/styles.types';

export default function RegisterFallbackPage() {
    return (
        <Container size={420} my={40}>
            <RegisterStyle style={{} as unknown as IRegisterStyle} styleProps={{}} cssClass="" />
        </Container>
    );
}
