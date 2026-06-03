/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
    IRegistrationCodesListResponse,
    IGenerateRegistrationCodesResponse,
} from '../../../types/responses/admin/registration-codes.types';

/**
 * Contract guard for the admin registration-code API client: the consumed
 * backend response fields (including the linked id_users/user_email added for
 * code consumption) must pass through untouched, query params must map to the
 * documented names, and generate must POST the request body verbatim.
 */
const { getMock, postMock } = vi.hoisted(() => ({
    getMock: vi.fn(),
    postMock: vi.fn(),
}));

vi.mock('../../base.api', () => ({
    permissionAwareApiClient: { get: getMock, post: postMock },
}));

import { AdminRegistrationCodesApi } from '../registration-codes.api';
import { API_CONFIG } from '../../../config/api.config';

const listResponse: IRegistrationCodesListResponse = {
    codes: [
        {
            id: '1',
            code: 'QAQA1234ABCD',
            id_groups: 1,
            group_name: 'QA Group',
            created_at: '2026-06-01 10:00:00',
            consumed_at: '2026-06-02 12:30:00',
            is_consumed: true,
            id_users: 77,
            user_email: 'qa.user@selfhelp.test',
        },
    ],
    pagination: { page: 2, pageSize: 50, totalCount: 1, totalPages: 1, hasNext: false, hasPrevious: true },
    config: { generate_min: 1, generate_max: 500 },
};

describe('AdminRegistrationCodesApi', () => {
    beforeEach(() => {
        getMock.mockReset();
        postMock.mockReset();
    });

    it('maps list params and returns codes with linked user info', async () => {
        getMock.mockResolvedValue({ data: { data: listResponse } });

        const result = await AdminRegistrationCodesApi.getAll({ page: 2, pageSize: 50, status: 'used' });

        expect(getMock).toHaveBeenCalledWith(
            API_CONFIG.ENDPOINTS.ADMIN_REGISTRATION_CODES_GET_ALL,
            { params: { page: '2', pageSize: '50', status: 'used' } },
        );
        expect(result.codes[0]).toMatchObject({
            id: '1',
            id_users: 77,
            user_email: 'qa.user@selfhelp.test',
            is_consumed: true,
        });
    });

    it('posts the generate request body and returns the created codes', async () => {
        const generated: IGenerateRegistrationCodesResponse = {
            codes: [
                {
                    id: '2',
                    code: 'QABB5678EFGH',
                    id_groups: 1,
                    group_name: 'QA Group',
                    created_at: '2026-06-03 09:00:00',
                    consumed_at: null,
                    is_consumed: false,
                    id_users: null,
                    user_email: null,
                },
            ],
        };
        postMock.mockResolvedValue({ data: { data: generated } });

        const result = await AdminRegistrationCodesApi.generate({ count: 3, id_groups: 1 });

        expect(postMock).toHaveBeenCalledWith(
            API_CONFIG.ENDPOINTS.ADMIN_REGISTRATION_CODES_GENERATE,
            { count: 3, id_groups: 1 },
        );
        expect(result.codes).toHaveLength(1);
        expect(result.codes[0].is_consumed).toBe(false);
    });

    it('returns the raw CSV body from the export endpoint', async () => {
        getMock.mockResolvedValue({ data: 'code,group,consumed\nQAQA1234ABCD,QA Group,2026-06-02 12:30:00' });

        const csv = await AdminRegistrationCodesApi.exportCsv({ status: 'used' });

        expect(getMock).toHaveBeenCalledWith(
            API_CONFIG.ENDPOINTS.ADMIN_REGISTRATION_CODES_EXPORT,
            expect.objectContaining({ params: { status: 'used' }, responseType: 'text' }),
        );
        expect(csv).toContain('QAQA1234ABCD');
    });
});
