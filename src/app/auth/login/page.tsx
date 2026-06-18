/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Container } from '@mantine/core';
import LoginStyle from '../../components/frontend/styles/LoginStyle';
import { type ILoginStyle } from '../../../types/common/styles.types';

export default function LoginPage() {
    return (
        <Container size={420} my={40}>
            <LoginStyle style={{} as unknown as ILoginStyle} styleProps={{}} cssClass="" />
        </Container>
    );
}