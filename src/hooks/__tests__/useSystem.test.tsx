/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '../../test-utils/renderWithProviders';

/**
 * The system-maintenance hooks wire the instance-scoped update flow: read the
 * version summary, run a target preflight (only when a target is set), and
 * request an update. The API + notifications are mocked so the test pins the
 * exact wiring and the hard rule that the request payload carries NO
 * `instance_id` (the backend derives + verifies it).
 */
const {
    getVersion, getHealth, getMaintenance, setMaintenance, getUpdatePreflight, getUpdateStatus, requestUpdate, notifyShow,
} = vi.hoisted(() => ({
    getVersion: vi.fn(),
    getHealth: vi.fn(),
    getMaintenance: vi.fn(),
    setMaintenance: vi.fn(),
    getUpdatePreflight: vi.fn(),
    getUpdateStatus: vi.fn(),
    requestUpdate: vi.fn(),
    notifyShow: vi.fn(),
}));

vi.mock('../../api/admin/system.api', () => ({
    AdminSystemApi: { getVersion, getHealth, getMaintenance, setMaintenance, getUpdatePreflight, getUpdateStatus, requestUpdate },
}));
vi.mock('@mantine/notifications', () => ({
    notifications: { show: notifyShow },
}));

import {
    useSystemVersion, useSystemHealth, useUpdatePreflight, useRequestUpdateMutation,
    useSystemMaintenance, useSetMaintenanceMutation,
} from '../useSystem';

function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>;
}

beforeEach(() => {
    getVersion.mockReset();
    getHealth.mockReset();
    getMaintenance.mockReset();
    setMaintenance.mockReset();
    getUpdatePreflight.mockReset();
    getUpdateStatus.mockReset();
    requestUpdate.mockReset();
    notifyShow.mockReset();
});

describe('useSystemVersion', () => {
    it('unwraps the envelope data', async () => {
        getVersion.mockResolvedValue({
            data: {
                instance_id: 'inst-1',
                selfhelp_version: '1.5.0',
                backend_version: '1.5.0',
                frontend_version: '1.5.0',
                plugin_api_version: '1.0.0',
                database_migration_version: 'Version20260608160348',
                safe_mode: false,
                maintenance_mode: false,
                installed_plugins: [],
            },
        });

        const { result } = renderHook(() => useSystemVersion(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data?.instance_id).toBe('inst-1');
        expect(getVersion).toHaveBeenCalledTimes(1);
    });
});

describe('useSystemHealth', () => {
    it('unwraps the aggregated health envelope data', async () => {
        getHealth.mockResolvedValue({
            data: {
                instance_id: 'inst-1',
                overall: 'healthy',
                checked_at: '2026-06-08T17:00:00+00:00',
                safe_mode: false,
                maintenance_mode: false,
                version: {
                    selfhelp: '0.1.0',
                    backend: '0.1.0',
                    frontend: '0.1.0',
                    plugin_api: '0.1.0',
                    database_migration: 'Version20260608181148',
                },
                update: { operation_id: '', status: 'succeeded', progress_percent: 100 },
                components: [
                    { name: 'database', status: 'ok', detail: 'Reachable.' },
                    { name: 'mercure', status: 'configured', detail: 'Hub URL configured.' },
                ],
            },
        });

        const { result } = renderHook(() => useSystemHealth(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data?.overall).toBe('healthy');
        expect(result.current.data?.components).toHaveLength(2);
        expect(getHealth).toHaveBeenCalledTimes(1);
    });
});

describe('useSystemMaintenance', () => {
    it('unwraps the maintenance state envelope', async () => {
        getMaintenance.mockResolvedValue({
            data: {
                enabled: true,
                forced_by_env: false,
                message: 'Upgrade window',
                since: '2026-06-08T18:00:00+00:00',
                updated_by: 'user:1',
                safe_mode: false,
            },
        });

        const { result } = renderHook(() => useSystemMaintenance(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data?.enabled).toBe(true);
        expect(getMaintenance).toHaveBeenCalledTimes(1);
    });
});

describe('useSetMaintenanceMutation', () => {
    it('sends enabled+message without an instance_id and notifies orange when enabling', async () => {
        setMaintenance.mockResolvedValue({
            data: { enabled: true, forced_by_env: false, message: 'window', since: 's', updated_by: 'user:1', safe_mode: false },
        });

        const { result } = renderHook(() => useSetMaintenanceMutation(), { wrapper });
        result.current.mutate({ enabled: true, message: 'window' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        const body = setMaintenance.mock.calls[0][0];
        expect(body).toEqual({ enabled: true, message: 'window' });
        expect(body).not.toHaveProperty('instance_id');
        expect(notifyShow).toHaveBeenCalledWith(expect.objectContaining({ color: 'orange' }));
    });

    it('notifies red when the toggle is rejected (e.g. env-forced)', async () => {
        setMaintenance.mockRejectedValue(new Error('conflict'));

        const { result } = renderHook(() => useSetMaintenanceMutation(), { wrapper });
        result.current.mutate({ enabled: false });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(notifyShow).toHaveBeenCalledWith(expect.objectContaining({ color: 'red' }));
    });
});

describe('useUpdatePreflight', () => {
    it('does not call the API while the target is null', async () => {
        renderHook(() => useUpdatePreflight(null), { wrapper });
        // Give React Query a tick; a disabled query must not fetch.
        await new Promise((r) => setTimeout(r, 10));
        expect(getUpdatePreflight).not.toHaveBeenCalled();
    });

    it('calls the API with the target once one is supplied', async () => {
        getUpdatePreflight.mockResolvedValue({ data: { preflight_id: 'pf1', status: 'ok', target_version: '1.6.0' } });

        const { result } = renderHook(() => useUpdatePreflight('1.6.0'), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(getUpdatePreflight).toHaveBeenCalledWith('1.6.0');
        expect(result.current.data?.preflight_id).toBe('pf1');
    });
});

describe('useRequestUpdateMutation', () => {
    it('posts the request without an instance_id and notifies on success', async () => {
        requestUpdate.mockResolvedValue({ data: { operation_id: 'op-9', instance_id: 'inst-1', status: 'requested' } });

        const { result } = renderHook(() => useRequestUpdateMutation(), { wrapper });
        result.current.mutate({ target_version: '1.6.0', preflight_id: 'pf1', accepted_migration_risk: false });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        const body = requestUpdate.mock.calls[0][0];
        expect(body).toEqual({ target_version: '1.6.0', preflight_id: 'pf1', accepted_migration_risk: false });
        expect(body).not.toHaveProperty('instance_id');
        expect(notifyShow).toHaveBeenCalledWith(expect.objectContaining({ color: 'green' }));
    });

    it('notifies in red when the request is rejected', async () => {
        requestUpdate.mockRejectedValue(new Error('cross-instance'));

        const { result } = renderHook(() => useRequestUpdateMutation(), { wrapper });
        result.current.mutate({ target_version: '1.6.0', preflight_id: 'pf1', accepted_migration_risk: false });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(notifyShow).toHaveBeenCalledWith(expect.objectContaining({ color: 'red' }));
    });
});
