/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useMutation } from '@tanstack/react-query';
import { AuthApi } from '../../api/auth.api';
import { IRegisterRequest } from '../../types/requests/auth/auth.types';
import { REACT_QUERY_CONFIG } from '../../config/react-query.config';

export function useRegisterMutation() {
    return useMutation({
        mutationFn: (data: IRegisterRequest) => AuthApi.register(data),
        ...REACT_QUERY_CONFIG.DEFAULT_OPTIONS.mutations,
    });
}
