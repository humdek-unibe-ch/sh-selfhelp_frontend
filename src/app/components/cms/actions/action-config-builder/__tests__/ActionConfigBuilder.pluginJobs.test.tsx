/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import type { IActionConfig } from '../../../../../../types/requests/admin/actions.types';

const state = vi.hoisted(() => ({
    empty: [] as never[],
    jobTypes: [
        {
            type: 'r_script',
            plugin_id: 'sh2-shp-r-serve',
            label: 'R script',
            config_schema: {
                type: 'object' as const,
                properties: {
                    script_id: { type: 'integer' as const, title: 'Script' },
                    note: { type: 'string' as const, title: 'Note' },
                },
                required: ['script_id'],
            },
            resource_fields: { script_id: 'rserve_script' },
        },
    ],
}));

vi.mock('../../../plugins/hooks/usePluginJobTypes', () => ({
    usePluginJobTypes: () => ({ data: state.jobTypes, isLoading: false }),
}));

vi.mock('../../../../../../api/admin/data-access.api', () => ({
    AdminDataAccessApi: {
        getPluginResources: vi.fn(async () => [{ id: 12, name: 'Intake script', description: null }]),
    },
}));

vi.mock('../../../../../../hooks/useLookups', () => ({
    useLookupsByType: () => state.empty,
}));

vi.mock('../../../../../../hooks/useActionTranslations', () => ({
    useActionTranslations: () => ({ data: state.empty }),
}));

vi.mock('../../../../../../hooks/usePageKeywords', () => ({
    usePageKeywords: () => ({ data: state.empty }),
}));

vi.mock('../../../../../../hooks/useLanguages', () => ({
    usePublicLanguages: () => ({ languages: state.empty }),
}));

vi.mock('../../../../../../api/admin/group.api', () => ({
    AdminGroupApi: { getAllGroups: vi.fn(async () => []) },
}));

vi.mock('../../../../../../api/admin/data.api', () => ({
    AdminDataApi: { listDataTables: vi.fn(async () => ({ dataTables: [] })) },
}));

vi.mock('../../../../../../api/admin/asset.api', () => ({
    AdminAssetApi: { getAssets: vi.fn(async () => ({ assets: [] })) },
}));

vi.mock('next/dynamic', () => ({
    default: () => {
        function Dyn() {
            return null;
        }
        return Dyn;
    },
}));

import { ActionConfigBuilder } from '../ActionConfigBuilder';

const INITIAL: IActionConfig = {
    blocks: [{
        block_name: 'Block',
        jobs: [{
            job_name: 'Job',
            job_type: 'r_script',
            plugin_config: { script_id: 12 },
            schedule_time: { job_schedule_types: 'immediately' },
        }],
    }],
};

function Harness({ onUpdate }: { onUpdate: (cfg: IActionConfig) => void }) {
    const [cfg, setCfg] = useState<IActionConfig>(INITIAL);
    return (
        <ActionConfigBuilder
            value={cfg}
            onChange={(next) => {
                setCfg(next);
                onUpdate(next);
            }}
        />
    );
}

describe('ActionConfigBuilder plugin jobs (P8-A1)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('offers a plugin job type and saves plugin_config from the generated form', async () => {
        const onUpdate = vi.fn();
        renderWithProviders(<Harness onUpdate={onUpdate} />);

        expect(await screen.findByTestId('plugin-job-config')).toBeInTheDocument();
        expect(screen.getByDisplayValue('r_script')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByDisplayValue('Intake script')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText(/^Note$/), { target: { value: 'run me' } });

        await waitFor(() => {
            const last = onUpdate.mock.calls.at(-1)?.[0] as IActionConfig;
            const job = last.blocks?.[0]?.jobs?.[0];
            expect(job?.job_type).toBe('r_script');
            expect(job?.plugin_config).toMatchObject({ script_id: 12, note: 'run me' });
        });
    });
});
