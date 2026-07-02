/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useMemo, useState } from 'react';
import {
    Button,
    Group,
    NumberInput,
    Paper,
    Select,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import { useAdminPages } from '../../../../hooks/useAdminPages';

interface INavigationSettingsFormState {
    web_header_search_mode: string;
    web_header_search_min_chars: number;
    web_header_search_result_limit: number;
    search_field_policy: string;
    search_default_visibility: string;
    web_guest_start_page_id: number | null;
    web_user_start_page_id: number | null;
    web_user_start_mode: string;
    mobile_guest_start_page_id: number | null;
    mobile_user_start_page_id: number | null;
    mobile_user_start_mode: string;
    mobile_start_page_source: string;
    route_sync_old_route_policy: string;
}

function settingsToFormState(settings: Record<string, unknown>): INavigationSettingsFormState {
    return {
        web_header_search_mode: String(settings.web_header_search_mode ?? 'content_index'),
        web_header_search_min_chars: Number(settings.web_header_search_min_chars ?? 2),
        web_header_search_result_limit: Number(settings.web_header_search_result_limit ?? 8),
        search_field_policy: String(settings.search_field_policy ?? 'all_display_text'),
        search_default_visibility: String(settings.search_default_visibility ?? 'all_accessible_pages'),
        web_guest_start_page_id: settings.web_guest_start_page_id ? Number(settings.web_guest_start_page_id) : null,
        web_user_start_page_id: settings.web_user_start_page_id ? Number(settings.web_user_start_page_id) : null,
        web_user_start_mode: String(settings.web_user_start_mode ?? 'fixed_page'),
        mobile_guest_start_page_id: settings.mobile_guest_start_page_id ? Number(settings.mobile_guest_start_page_id) : null,
        mobile_user_start_page_id: settings.mobile_user_start_page_id ? Number(settings.mobile_user_start_page_id) : null,
        mobile_user_start_mode: String(settings.mobile_user_start_mode ?? 'fixed_page'),
        mobile_start_page_source: String(settings.mobile_start_page_source ?? 'same_as_web'),
        route_sync_old_route_policy: String(settings.route_sync_old_route_policy ?? 'ask'),
    };
}

function formStateToPayload(state: INavigationSettingsFormState): Record<string, unknown> {
    return {
        web_header_search_mode: state.web_header_search_mode,
        web_header_search_min_chars: state.web_header_search_min_chars,
        web_header_search_result_limit: state.web_header_search_result_limit,
        search_field_policy: state.search_field_policy,
        search_default_visibility: state.search_default_visibility,
        web_guest_start_page_id: state.web_guest_start_page_id,
        web_user_start_page_id: state.web_user_start_page_id,
        web_user_start_mode: state.web_user_start_mode,
        mobile_guest_start_page_id: state.mobile_guest_start_page_id,
        mobile_user_start_page_id: state.mobile_user_start_page_id,
        mobile_user_start_mode: state.mobile_user_start_mode,
        mobile_start_page_source: state.mobile_start_page_source,
        route_sync_old_route_policy: state.route_sync_old_route_policy,
    };
}

function formStatesEqual(a: INavigationSettingsFormState, b: INavigationSettingsFormState): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

interface INavigationSettingsFormProps {
    settings: Record<string, unknown>;
    onSave: (payload: Record<string, unknown>) => void;
    isSaving: boolean;
    readOnly?: boolean;
}

function NavigationSettingsForm({
    settings,
    onSave,
    isSaving,
    readOnly = false,
}: INavigationSettingsFormProps): React.ReactElement {
    const { pages } = useAdminPages();
    const pageOptions = useMemo(
        () => (pages ?? []).map((page) => ({
            value: String(page.id_pages),
            label: page.keyword,
        })),
        [pages],
    );

    const savedState = useMemo(() => settingsToFormState(settings), [settings]);
    const [formState, setFormState] = useState<INavigationSettingsFormState>(
        () => settingsToFormState(settings),
    );

    const isDirty = !formStatesEqual(formState, savedState);

    const update = <K extends keyof INavigationSettingsFormState>(
        key: K,
        value: INavigationSettingsFormState[K],
    ): void => {
        setFormState((current) => ({ ...current, [key]: value }));
    };

    return (
        <Stack gap="md">
            <div>
                <Title order={4}>Start & search</Title>
                <Text size="sm" c="dimmed" mt={4}>
                    Changes on this tab are not saved automatically. Review your updates, then click Save settings.
                </Text>
            </div>

            <Paper withBorder radius="md" p="lg">
                <Stack gap="md">
                    <Select
                        label="Web header search mode"
                        data={[
                            { value: 'off', label: 'Off' },
                            { value: 'menu_pages', label: 'Menu pages only' },
                            { value: 'searchable_pages', label: 'Searchable pages' },
                            { value: 'content_index', label: 'Content index' },
                        ]}
                        value={formState.web_header_search_mode}
                        onChange={(value) => update('web_header_search_mode', value ?? 'content_index')}
                        disabled={readOnly}
                    />
                    <Group grow align="flex-start">
                        <NumberInput
                            label="Min chars"
                            value={formState.web_header_search_min_chars}
                            onChange={(value) => update('web_header_search_min_chars', Number(value) || 2)}
                            min={1}
                            disabled={readOnly}
                        />
                        <NumberInput
                            label="Result limit"
                            value={formState.web_header_search_result_limit}
                            onChange={(value) => update('web_header_search_result_limit', Number(value) || 8)}
                            min={1}
                            max={50}
                            disabled={readOnly}
                        />
                    </Group>
                    <Select
                        label="Search field policy"
                        data={[
                            { value: 'all_display_text', label: 'All display text' },
                            { value: 'page_metadata_only', label: 'Page metadata only' },
                        ]}
                        value={formState.search_field_policy}
                        onChange={(value) => update('search_field_policy', value ?? 'all_display_text')}
                        disabled={readOnly}
                    />
                    <Select
                        label="Default search visibility"
                        data={[
                            { value: 'all_accessible_pages', label: 'All accessible pages' },
                            { value: 'menu_pages_only', label: 'Menu pages only' },
                        ]}
                        value={formState.search_default_visibility}
                        onChange={(value) => update('search_default_visibility', value ?? 'all_accessible_pages')}
                        disabled={readOnly}
                    />
                    <Select
                        label="Web guest start page"
                        searchable
                        clearable
                        data={pageOptions}
                        value={formState.web_guest_start_page_id ? String(formState.web_guest_start_page_id) : null}
                        onChange={(value) => update('web_guest_start_page_id', value ? Number(value) : null)}
                        disabled={readOnly}
                    />
                    <Select
                        label="Web logged-in start page"
                        searchable
                        clearable
                        data={pageOptions}
                        value={formState.web_user_start_page_id ? String(formState.web_user_start_page_id) : null}
                        onChange={(value) => update('web_user_start_page_id', value ? Number(value) : null)}
                        disabled={readOnly}
                    />
                    <Select
                        label="Web logged-in start mode"
                        data={[
                            { value: 'fixed_page', label: 'Fixed landing page' },
                            { value: 'last_visited_then_fixed_page', label: 'Last visited, then fixed page' },
                        ]}
                        value={formState.web_user_start_mode}
                        onChange={(value) => update('web_user_start_mode', value ?? 'fixed_page')}
                        disabled={readOnly}
                    />
                    <Select
                        label="Mobile start page source"
                        data={[
                            { value: 'same_as_web', label: 'Same as web' },
                            { value: 'custom_mobile_pages', label: 'Custom mobile pages' },
                        ]}
                        value={formState.mobile_start_page_source}
                        onChange={(value) => update('mobile_start_page_source', value ?? 'same_as_web')}
                        disabled={readOnly}
                    />
                    <Select
                        label="Mobile guest start page"
                        searchable
                        clearable
                        disabled={readOnly || formState.mobile_start_page_source !== 'custom_mobile_pages'}
                        data={pageOptions}
                        value={formState.mobile_guest_start_page_id ? String(formState.mobile_guest_start_page_id) : null}
                        onChange={(value) => update('mobile_guest_start_page_id', value ? Number(value) : null)}
                    />
                    <Select
                        label="Mobile logged-in start page"
                        searchable
                        clearable
                        disabled={readOnly || formState.mobile_start_page_source !== 'custom_mobile_pages'}
                        data={pageOptions}
                        value={formState.mobile_user_start_page_id ? String(formState.mobile_user_start_page_id) : null}
                        onChange={(value) => update('mobile_user_start_page_id', value ? Number(value) : null)}
                    />
                    <Select
                        label="Mobile logged-in start mode"
                        data={[
                            { value: 'fixed_page', label: 'Fixed landing page' },
                            { value: 'last_visited_then_fixed_page', label: 'Last visited, then fixed page' },
                        ]}
                        value={formState.mobile_user_start_mode}
                        onChange={(value) => update('mobile_user_start_mode', value ?? 'fixed_page')}
                        disabled={readOnly}
                    />
                    <Select
                        label="Route sync old-route policy"
                        data={[
                            { value: 'ask', label: 'Ask on each save' },
                            { value: 'keep_alias', label: 'Keep old route as alias' },
                            { value: 'remove_old_route', label: 'Remove old route' },
                        ]}
                        value={formState.route_sync_old_route_policy}
                        onChange={(value) => update('route_sync_old_route_policy', value ?? 'ask')}
                        disabled={readOnly}
                    />

                    {!readOnly ? (
                        <Group
                            justify="flex-end"
                            align="center"
                            gap="sm"
                            pt="md"
                            mt="xs"
                            style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
                        >
                            {isDirty ? (
                                <Text size="sm" c="yellow.4" mr="auto">
                                    Unsaved changes
                                </Text>
                            ) : null}
                            <Button
                                variant="default"
                                disabled={!isDirty || isSaving}
                                onClick={() => setFormState(savedState)}
                            >
                                Discard
                            </Button>
                            <Button
                                loading={isSaving}
                                disabled={!isDirty}
                                onClick={() => onSave(formStateToPayload(formState))}
                            >
                                Save settings
                            </Button>
                        </Group>
                    ) : null}
                </Stack>
            </Paper>

            {readOnly ? (
                <Text size="sm" c="dimmed">Read-only — you need navigation update permission to change settings.</Text>
            ) : null}
        </Stack>
    );
}

export function NavigationSettingsPanel({
    settings,
    onSave,
    isSaving,
    readOnly = false,
}: {
    settings: Record<string, unknown>;
    onSave: (payload: Record<string, unknown>) => void;
    isSaving: boolean;
    readOnly?: boolean;
}): React.ReactElement {
    const settingsKey = useMemo(() => JSON.stringify(settings), [settings]);

    return (
        <NavigationSettingsForm
            key={settingsKey}
            settings={settings}
            onSave={onSave}
            isSaving={isSaving}
            readOnly={readOnly}
        />
    );
}
