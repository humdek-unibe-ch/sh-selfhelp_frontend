/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/*

SPDX-FileCopyrightText: 2026 Humdek, University of Bern

SPDX-License-Identifier: MPL-2.0

*/

'use client';



import { useMemo, useState } from 'react';

import {

    Button,

    Group,

    Image,

    NumberInput,

    Paper,

    Select,

    Stack,

    Text,

    TextInput,

    Title,

} from '@mantine/core';

import { useAdminPages } from '../../../../hooks/useAdminPages';

import { useAssets } from '../../../../hooks/useAssets';

import { getAssetUrl } from '../../../../utils/asset-url.utils';

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|svg|webp|avif)$/i;



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

    logo_asset_path: string | null;

    logo_alt: string | null;

    logo_link_page_id: number | null;

    logo_size: string;

    logo_variant: string;

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

        logo_asset_path: typeof settings.logo_asset_path === 'string' && settings.logo_asset_path !== '' ? settings.logo_asset_path : null,

        logo_alt: typeof settings.logo_alt === 'string' && settings.logo_alt !== '' ? settings.logo_alt : null,

        logo_link_page_id: settings.logo_link_page_id ? Number(settings.logo_link_page_id) : null,

        logo_size: String(settings.logo_size ?? 'md'),

        logo_variant: String(settings.logo_variant ?? 'logo-and-name'),

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

        logo_asset_path: state.logo_asset_path,

        logo_alt: state.logo_alt,

        logo_link_page_id: state.logo_link_page_id,

        logo_size: state.logo_size,

        logo_variant: state.logo_variant,

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

            label: page.title && page.title.trim() !== '' ? `${page.title} \u00b7 ${page.keyword}` : page.keyword,

        })),

        [pages],

    );

    // fresh: newly uploaded assets appear in the picker without a full
    // browser refresh (refetch on mount + window focus).
    const { data: assetsData } = useAssets({ pageSize: 500 }, { fresh: true });

    const imageAssetOptions = useMemo(() => {

        const assets = assetsData?.assets ?? [];

        return assets

            .filter((asset) => IMAGE_EXTENSIONS.test(asset.file_name))

            .map((asset) => ({

                // Persist the delivery URL, not the (unfetchable) file_path key.
                value: asset.url,

                label: asset.original_name && asset.original_name.trim() !== '' ? asset.original_name : asset.file_name,

            }));

    }, [assetsData]);



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

                <Title order={4}>Navigation settings</Title>

                <Text size="sm" c="dimmed" mt={4}>

                    Changes on this tab are not saved automatically. Review your updates, then click Save settings.

                </Text>

            </div>



            <Paper withBorder radius="md" p="lg">

                <Stack gap="md">

                    <div>

                        <Text fw={600}>Branding</Text>

                        <Text size="sm" c="dimmed">

                            Logo shown in the web header and the mobile drawer. Upload images under Assets first.

                        </Text>

                    </div>

                    <Group align="flex-start" gap="md" wrap="nowrap">

                        <Paper

                            withBorder

                            radius="md"

                            p="xs"

                            w={96}

                            h={96}

                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}

                        >

                            {formState.logo_asset_path ? (

                                <Image

                                    src={getAssetUrl(formState.logo_asset_path)}

                                    alt={formState.logo_alt ?? 'Logo preview'}

                                    fit="contain"

                                    mah={80}

                                    maw={80}

                                />

                            ) : (

                                <Text size="xs" c="dimmed" ta="center">No logo selected</Text>

                            )}

                        </Paper>

                        <Stack gap="sm" style={{ flex: 1 }}>

                            <Select

                                label="Logo image"

                                description="Falls back to the text logo when empty."

                                searchable

                                clearable

                                data={imageAssetOptions}

                                value={formState.logo_asset_path}

                                onChange={(value) => update('logo_asset_path', value)}

                                disabled={readOnly}

                            />

                            <Group grow align="flex-start">

                                <TextInput

                                    label="Logo alt text"

                                    description="Accessible name, also used as the text logo."

                                    value={formState.logo_alt ?? ''}

                                    onChange={(event) => update('logo_alt', event.currentTarget.value === '' ? null : event.currentTarget.value)}

                                    disabled={readOnly}

                                />

                                <Select

                                    label="Logo links to"

                                    description="Page opened on logo click. Empty = home."

                                    searchable

                                    clearable

                                    data={pageOptions}

                                    value={formState.logo_link_page_id ? String(formState.logo_link_page_id) : null}

                                    onChange={(value) => update('logo_link_page_id', value ? Number(value) : null)}

                                    disabled={readOnly}

                                />

                            </Group>

                            <Group grow align="flex-start">

                                <Select

                                    label="Logo size"

                                    description="Rendered height in the header / drawer."

                                    data={[

                                        { value: 'sm', label: 'Small (24 px)' },

                                        { value: 'md', label: 'Medium (32 px)' },

                                        { value: 'lg', label: 'Large (44 px)' },

                                        { value: 'xl', label: 'Extra large (56 px)' },

                                    ]}

                                    value={formState.logo_size}

                                    onChange={(value) => update('logo_size', value ?? 'md')}

                                    disabled={readOnly}

                                />

                                <Select

                                    label="Logo display"

                                    description="How logo and site name are combined."

                                    data={[

                                        { value: 'logo-and-name', label: 'Logo + name' },

                                        { value: 'logo-only', label: 'Logo only' },

                                        { value: 'name-only', label: 'Name only' },

                                    ]}

                                    value={formState.logo_variant}

                                    onChange={(value) => update('logo_variant', value ?? 'logo-and-name')}

                                    disabled={readOnly}

                                />

                            </Group>

                        </Stack>

                    </Group>

                </Stack>

            </Paper>



            <Paper withBorder radius="md" p="lg">

                <Stack gap="md">

                    <div>

                        <Text fw={600}>Start & search</Text>

                    </div>

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

