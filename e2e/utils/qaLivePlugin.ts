/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Helpers for the `sh2-qa-live` fixture plugin (P10 golden `plugin-live-sync`).
 */
import { expect } from '@playwright/test';
import { setSectionText, type BackendPersona, type IMadePage } from './liveSync';

export const QA_LIVE_PLUGIN_ID = 'sh2-qa-live';
export const QA_LIVE_ADMIN_ITEMS_PATH = `/admin/plugins-host/${QA_LIVE_PLUGIN_ID}/items`;

const CRUD_READ = 2;
const CRUD_UPDATE = 4;
/** `group` in the lookup group `resourceTypes` of the QA database (same source as liveSync's pages id). */
const RESOURCE_TYPE_GROUP = 83;

export interface IQaLiveItem {
    id: number;
    title: string;
    published_version: number;
}

let qaLiveResourceTypeId: number | null = null;
const styleIds = new Map<string, number>();

async function qaLiveResourceTypeIdOf(admin: BackendPersona): Promise<number> {
    if (qaLiveResourceTypeId !== null) {
        return qaLiveResourceTypeId;
    }
    const types = await admin.ok<Array<{ id: number; code: string }>>('GET', '/admin/data-access/plugin-resource-types');
    const found = types.find((row) => row.code === 'qa_live_item');
    expect(found, 'plugin resource type qa_live_item').toBeDefined();
    qaLiveResourceTypeId = (found as { id: number }).id;
    return qaLiveResourceTypeId;
}

async function styleIdOf(admin: BackendPersona, name: string): Promise<number> {
    const cached = styleIds.get(name);
    if (cached !== undefined) {
        return cached;
    }
    const groups = await admin.ok<Array<{ styles?: Array<{ id: number; name: string }> }>>('GET', '/admin/styles');
    for (const group of groups) {
        for (const style of group.styles ?? []) {
            styleIds.set(style.name, style.id);
        }
    }
    const found = styleIds.get(name);
    expect(found, `style ${name}`).toBeDefined();
    return found as number;
}

export async function createQaLiveItem(admin: BackendPersona, title: string): Promise<IQaLiveItem> {
    const data = await admin.ok<IQaLiveItem>('POST', `/admin/plugins/${QA_LIVE_PLUGIN_ID}/items`, { title });
    return data;
}

export async function updateQaLiveItemTitle(admin: BackendPersona, id: number, title: string): Promise<IQaLiveItem> {
    return admin.ok('PUT', `/admin/plugins/${QA_LIVE_PLUGIN_ID}/items/${id}`, { title });
}

export async function publishQaLiveItem(admin: BackendPersona, id: number): Promise<IQaLiveItem> {
    return admin.ok('POST', `/admin/plugins/${QA_LIVE_PLUGIN_ID}/items/${id}/publish`, {});
}

export async function deleteQaLiveItem(admin: BackendPersona, id: number): Promise<void> {
    await admin.ok('DELETE', `/admin/plugins/${QA_LIVE_PLUGIN_ID}/items/${id}`);
}

export async function listQaLiveItems(admin: BackendPersona): Promise<IQaLiveItem[]> {
    const data = await admin.ok<{ items: IQaLiveItem[] }>('GET', `/admin/plugins/${QA_LIVE_PLUGIN_ID}/items`);
    return data.items;
}

/** Grant view on one QA live item to a role (merge-safe with existing role grants). */
export async function grantQaLiveItemView(admin: BackendPersona, roleId: number, itemId: number): Promise<void> {
    await mergeRoleGrant(admin, roleId, await qaLiveResourceTypeIdOf(admin), itemId, CRUD_READ);
}

/** Grant update on a group (therapist may write-for participants in that group). */
export async function grantGroupUpdate(admin: BackendPersona, roleId: number, groupId: number): Promise<void> {
    await mergeRoleGrant(admin, roleId, RESOURCE_TYPE_GROUP, groupId, CRUD_UPDATE);
}

async function mergeRoleGrant(
    admin: BackendPersona,
    roleId: number,
    resourceTypeId: number,
    resourceId: number,
    crud: number,
): Promise<void> {
    const effective = await admin.ok<{
        effective_permissions?: Array<{
            id_resource_types: number;
            resource_id: number;
            unified_permissions?: number;
            crud_permissions?: number;
        }>;
        permissions?: Array<{ id_resource_types: number; resource_id: number; crud_permissions: number }>;
    }>('GET', `/admin/data-access/roles/${roleId}/effective-permissions`);
    const rows = effective.effective_permissions ?? effective.permissions ?? [];
    const permissions = rows.map((row) => {
        const crud =
            'unified_permissions' in row && typeof row.unified_permissions === 'number'
                ? row.unified_permissions
                : (row.crud_permissions ?? 0);
        return {
            resource_type_id: row.id_resource_types,
            resource_id: row.resource_id,
            crud_permissions: crud,
        };
    });
    const existing = permissions.find(
        (row) => row.resource_type_id === resourceTypeId && row.resource_id === resourceId,
    );
    if (existing) {
        existing.crud_permissions = crud;
    } else {
        permissions.push({ resource_type_id: resourceTypeId, resource_id: resourceId, crud_permissions: crud });
    }
    await admin.ok('POST', `/admin/data-access/roles/${roleId}/permissions`, { permissions });
}

/** Role permissions by permission key names (ids from the catalogue). */
export async function createRoleWithNamedPermissions(admin: BackendPersona, name: string, keys: string[]): Promise<number> {
    const listed = await admin.ok<{ permissions: Array<{ id: number; name: string }> }>('GET', '/admin/permissions');
    const permissions = listed.permissions ?? [];
    const permission_ids = keys.map((key) => {
        const found = permissions.find((row) => row.name === key);
        expect(
            found,
            `permission ${key} (have ${permissions.length}: ${permissions
                .map((row) => row.name)
                .filter((n) => n.includes('qa_') || n.includes('admin.access'))
                .slice(0, 20)
                .join(', ')})`,
        ).toBeDefined();
        return (found as { id: number }).id;
    });
    const created = await admin.ok<{ id: number }>('POST', '/admin/roles', {
        name,
        description: 'qa plugin live-sync',
        permission_ids,
    });
    return created.id;
}

export async function writeForUser(
    caller: BackendPersona,
    ownerUserId: number,
    message: string,
    options: { contentRef?: string; table?: string; triggerType?: string; recordId?: number } = {},
): Promise<{ status: number; data?: { record_id?: number }; error?: unknown }> {
    const body: Record<string, unknown> = {
        owner_user_id: ownerUserId,
        message,
    };
    if (options.contentRef) {
        body.content_ref = options.contentRef;
    }
    if (options.table) {
        body.table = options.table;
    }
    if (options.triggerType) {
        body.trigger_type = options.triggerType;
    }
    if (options.recordId && options.recordId > 0) {
        body.record_id = options.recordId;
    }
    const result = await caller.call('POST', `/admin/plugins/${QA_LIVE_PLUGIN_ID}/write-for`, body);
    return {
        status: result.status,
        data: (result.json?.data ?? undefined) as { record_id?: number } | undefined,
        error: result.json?.error,
    };
}

/** Add a `qa-live-item` section to a page draft (property fields for item_id / pin_table_id). */
export async function addQaLiveItemSection(
    admin: BackendPersona,
    page: IMadePage,
    itemId: number,
    pinTableId = 0,
): Promise<number> {
    const styleId = await styleIdOf(admin, 'qa-live-item');
    const section = await admin.draftWriteOk<{ id: number }>(page.id, 'POST', `/admin/pages/${page.id}/sections/create`, {
        styleId,
        position: 20,
        name: 'qa_live_item_section',
    });
    const detail = await admin.ok<{ fields: Array<{ id: number; name: string }> }>(
        'GET',
        `/admin/pages/${page.id}/sections/${section.id}`,
    );
    const propertyFields = ['item_id', 'pin_table_id'].map((name) => {
        const field = detail.fields.find((row) => row.name === name);
        expect(field, `qa-live-item field ${name}`).toBeDefined();
        const value = name === 'item_id' ? String(itemId) : String(pinTableId);
        return { fieldId: (field as { id: number }).id, value };
    });
    await admin.draftWriteOk(page.id, 'PUT', `/admin/pages/${page.id}/sections/${section.id}`, {
        contentFields: [],
        propertyFields,
    });
    return section.id;
}

/** Page section that reads the last row from a data table (live-sync `data_config` pattern). */
export async function bindLastRecordText(
    admin: BackendPersona,
    page: IMadePage,
    tableName: string,
    scope: string,
    textTemplate: string,
): Promise<void> {
    await setSectionText(admin, page, textTemplate, [
        { table: tableName, retrieve: 'last', current_user: true, scope, all_fields: true },
    ]);
}

let finishedTriggerId: number | null = null;

async function finishedTriggerIdOf(admin: BackendPersona): Promise<number> {
    if (finishedTriggerId !== null) {
        return finishedTriggerId;
    }
    const lookups = await admin.ok<Array<{ id: number; typeCode?: string; type_code?: string; lookupCode?: string; lookup_code?: string }>>(
        'GET',
        '/lookups',
    );
    const found = lookups.find((row) => {
        const type = row.typeCode ?? row.type_code;
        const code = row.lookupCode ?? row.lookup_code;
        return type === 'actionTriggerTypes' && code === 'finished';
    });
    expect(found, 'actionTriggerTypes finished').toBeDefined();
    finishedTriggerId = (found as { id: number }).id;
    return finishedTriggerId;
}

/** Resolve a data table id by its storage name (for example a form section id). */
export async function dataTableIdByName(admin: BackendPersona, tableName: string): Promise<number> {
    const tables = await admin.ok<{ dataTables: Array<{ id: number; name: string }> }>('GET', '/admin/data/tables');
    const found = tables.dataTables.find((row) => row.name === tableName);
    expect(found, `data table ${tableName}`).toBeDefined();
    return (found as { id: number }).id;
}

/** Attach an immediate `qa_live_job` action to a data table (C12). */
export async function attachQaLiveJobAction(admin: BackendPersona, tableId: number, note: string): Promise<void> {
    const config = {
        blocks: [
            {
                jobs: [
                    {
                        job_name: 'qa_live_job_from_action',
                        job_type: 'qa_live_job',
                        plugin_config: { result_table: 'qa_live_job_results', note },
                        schedule_time: { job_schedule_types: 'immediately' },
                    },
                ],
            },
        ],
    };

    await admin.ok('POST', '/admin/actions', {
        name: `qa_live_job_action_${Date.now().toString(36)}`,
        id_action_trigger_types: await finishedTriggerIdOf(admin),
        id_data_tables: tableId,
        config,
    });
}

/** Run due queued jobs so plugin handlers write their result rows (e2e has no scheduler container). */
export async function runQueuedJobs(admin: BackendPersona): Promise<void> {
    await admin.ok('POST', '/admin/scheduled-jobs/runner/run-now', {});
    const listed = await admin.ok<{ jobs: Array<{ id: number; status?: { lookup_code?: string } }> }>(
        'GET',
        '/admin/scheduled-jobs?pageSize=50',
    );
    for (const job of listed.jobs ?? []) {
        if (job.status?.lookup_code === 'queued') {
            await admin.call('POST', `/admin/scheduled-jobs/${job.id}/execute`);
        }
    }
}