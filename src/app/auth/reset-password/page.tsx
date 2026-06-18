/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import ResetPasswordStyle from '../../components/frontend/styles/ResetPasswordStyle';
import { type IResetPasswordStyle } from '../../../types/common/styles.types';

export default function ResetPasswordFallbackPage() {
    return (
        <ResetPasswordStyle
            style={{} as unknown as IResetPasswordStyle}
            styleProps={{ style: { maxWidth: 420, margin: '40px auto' } }}
            cssClass=""
        />
    );
}
