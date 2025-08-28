'use client';

import { memo } from 'react';
import {
    Stack,
    Paper,
    Text,
    Group,
    Radio,
    Tooltip,
    ActionIcon,
    Checkbox,
    Box
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { CollapsibleInspector } from '../shared/CollapsibleInspector';
import { InspectorFields } from '../shared/InspectorFields';
import { InspectorInfo } from '../InspectorInfo';
import { DragDropMenuPositioner } from '../../ui/drag-drop-menu-positioner/DragDropMenuPositioner';
import { LockedField } from '../../ui/locked-field/LockedField';
import { FieldLabelWithTooltip } from '../../ui/field-label-with-tooltip/FieldLabelWithTooltip';
import { INSPECTOR_TYPES, INSPECTOR_SECTIONS } from '../../../../../store/inspectorStore';
import { IAdminPage } from '../../../../../types/responses/admin/admin.types';
import { IPageField } from '../../../../../types/responses/admin/page-details.types';
import { ILanguage } from '../../../../../types/responses/admin/languages.types';
import { useForm } from '@mantine/form';

type TFieldsForm = {
    values: { fields: Record<string, Record<number, string>> };
    setFieldValue: (path: string, value: string) => void;
};

interface IPagePropertiesProps {
    form: ReturnType<typeof useForm<any>>; // Mantine form instance
    pageAccessTypes: Array<{ lookupCode: string; lookupValue: string }>;
    page: IAdminPage;
    parentPage: IAdminPage | null;
    propertyFields?: IPageField[]; // For configuration pages
    isConfigurationPage?: boolean;
    className?: string;
    // For configuration pages - InspectorFields props
    languages?: ILanguage[];
    propertyValues?: Record<string, string | boolean>;
    onPropertyFieldChange?: (fieldName: string, value: string | boolean) => void;
    // Shared fields form (content + properties)
    fieldsForm?: TFieldsForm;
    // Menu position handlers (for non-configuration pages)
    headerMenuGetFinalPosition?: React.MutableRefObject<(() => number | null) | null>;
    footerMenuGetFinalPosition?: React.MutableRefObject<(() => number | null) | null>;
    onHeaderMenuChange?: (enabled: boolean) => void;
    onHeaderPositionChange?: (position: number) => void;
    onFooterMenuChange?: (enabled: boolean) => void;
    onFooterPositionChange?: (position: number) => void;
}

export const PageProperties = memo<IPagePropertiesProps>(
    function PageProperties({
        form,
        pageAccessTypes,
        page,
        parentPage,
        propertyFields = [],
        isConfigurationPage = false,
        className,
        languages = [],
        propertyValues = {},
        onPropertyFieldChange,
        headerMenuGetFinalPosition,
        footerMenuGetFinalPosition,
        onHeaderMenuChange,
        onHeaderPositionChange,
        onFooterMenuChange,
        onFooterPositionChange,
        fieldsForm
    }) {
        return (
            <CollapsibleInspector
                title="Properties"
                inspectorType={INSPECTOR_TYPES.PAGE}
                sectionName={INSPECTOR_SECTIONS.PROPERTIES}
                defaultExpanded={true}
            >
                <Stack gap="xs" className={className}>
                    {/* Configuration Page Property Fields */}
                    {isConfigurationPage && propertyFields.length > 0 && (
                        <InspectorInfo
                            title="Configuration Properties"
                            infoItems={[]}
                        >
                            <InspectorFields
                                title=""
                                fields={propertyFields.map(field => ({
                                    id: field.id,
                                    name: field.name,
                                    title: field.title,
                                    type: field.type,
                                    default_value: field.default_value,
                                    help: field.help,
                                    disabled: false,
                                    hidden: 0,
                                    display: Boolean(field.display),
                                    translations: field.translations || [],
                                    fieldConfig: field.fieldConfig || {}
                                }))}
                                languages={languages}
                                fieldValues={propertyValues}
                                onFieldChange={onPropertyFieldChange ? (fieldName, _languageId, value) => onPropertyFieldChange(fieldName, value) : undefined}
                                form={fieldsForm as any}
                                isMultiLanguage={false}
                                className={className}
                                inspectorType={INSPECTOR_TYPES.PAGE}
                                sectionName="configuration-properties"
                            />
                        </InspectorInfo>
                    )}

                    {/* Regular Page Properties */}
                    {!isConfigurationPage && (
                        <>
                            {/* Page Basic Properties */}
                            <Paper p="sm" withBorder>
                                <Stack gap="sm">
                                    <Text size="xs" fw={500} c="blue">Basic Information</Text>
                                    
                                    <Group>
                                        <Tooltip label="Page will not include header/footer layout - useful for popups, embeds, or standalone pages">
                                            <Checkbox
                                                label="Headless Page"
                                                {...form?.getInputProps('headless', { type: 'checkbox' })}
                                            />
                                        </Tooltip>
                                    </Group>
                                </Stack>
                            </Paper>

                            {/* Page Basic Properties with Locked Fields */}
                            <Paper p="sm" withBorder>
                                <Stack gap="sm">
                                    <Text size="xs" fw={500} c="blue">Basic Information</Text>
                                    <LockedField
                                        label={
                                            <FieldLabelWithTooltip 
                                                label="Keyword" 
                                                tooltip="Unique identifier for the page. Used in URLs and internal references. Cannot contain spaces or special characters."
                                            />
                                        }
                                        {...form?.getInputProps('keyword')}
                                        lockedTooltip="Enable keyword editing"
                                        unlockedTooltip="Lock keyword editing"
                                    />
                                    
                                    <LockedField
                                        label={
                                            <FieldLabelWithTooltip 
                                                label="URL" 
                                                tooltip="The web address path for this page. Should start with / and be user-friendly."
                                            />
                                        }
                                        {...form?.getInputProps('url')}
                                        lockedTooltip="Enable URL editing"
                                        unlockedTooltip="Lock URL editing"
                                    />
                                </Stack>
                            </Paper>

                            {/* Menu Positions */}
                            <Paper p="md" withBorder>
                                <Stack gap="md">
                                    <Group gap="xs">
                                        <Text size="sm" fw={500} c="blue">Menu Positions</Text>
                                        <Tooltip 
                                            label="Configure where this page appears in the website navigation menus. You can drag to reorder positions."
                                            multiline
                                            w={300}
                                        >
                                            <ActionIcon variant="subtle" size="xs" color="gray">
                                                <IconInfoCircle size="0.75rem" />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                    
                                    <DragDropMenuPositioner
                                        currentPage={page}
                                        menuType="header"
                                        title="Header Menu Position"
                                        enabled={form?.values.headerMenuEnabled || (form?.values.navPosition !== null && form?.values.navPosition !== undefined)}
                                        position={form?.values.navPosition}
                                        onEnabledChange={onHeaderMenuChange || (() => {})}
                                        onPositionChange={(pos) => onHeaderPositionChange ? onHeaderPositionChange(pos ?? 0) : undefined}
                                        onGetFinalPosition={(getFinalPositionFn) => {
                                            if (headerMenuGetFinalPosition) {
                                                headerMenuGetFinalPosition.current = getFinalPositionFn;
                                            }
                                        }}
                                        parentPage={parentPage}
                                        checkboxLabel="Header Menu"
                                        showAlert={false}
                                    />

                                    <DragDropMenuPositioner
                                        currentPage={page}
                                        menuType="footer"
                                        title="Footer Menu Position"
                                        enabled={form?.values.footerMenuEnabled || (form?.values.footerPosition !== null && form?.values.footerPosition !== undefined)}
                                        position={form?.values.footerPosition}
                                        onEnabledChange={onFooterMenuChange || (() => {})}
                                        onPositionChange={(pos) => onFooterPositionChange ? onFooterPositionChange(pos ?? 0) : undefined}
                                        onGetFinalPosition={(getFinalPositionFn) => {
                                            if (footerMenuGetFinalPosition) {
                                                footerMenuGetFinalPosition.current = getFinalPositionFn;
                                            }
                                        }}
                                        parentPage={parentPage}
                                        checkboxLabel="Footer Menu"
                                        showAlert={false}
                                    />
                                </Stack>
                            </Paper>

                            {/* Page Access Type */}
                            <Paper p="md" withBorder>
                                <Stack gap="md">
                                    <FieldLabelWithTooltip 
                                        label="Page Access Type" 
                                        tooltip="Controls who can access this page - web only, mobile only, or both platforms"
                                    />
                                    <Radio.Group
                                        value={form?.values.pageAccessType}
                                        onChange={(value) => form?.setFieldValue('pageAccessType', value)}
                                    >
                                        <Stack gap="xs">
                                            {pageAccessTypes.map((type) => (
                                                <Radio
                                                    key={type.lookupCode}
                                                    value={type.lookupCode}
                                                    label={type.lookupValue}
                                                />
                                            ))}
                                        </Stack>
                                    </Radio.Group>
                                </Stack>
                            </Paper>

                            {/* Page Settings */}
                            <Paper p="md" withBorder>
                                <Stack gap="md">
                                    <Group gap="xs">
                                        <Text size="sm" fw={500} c="blue">Page Settings</Text>
                                        <Tooltip 
                                            label="Configure special page behaviors and access controls."
                                            multiline
                                            w={300}
                                        >
                                            <ActionIcon variant="subtle" size="xs" color="gray">
                                                <IconInfoCircle size="0.75rem" />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                    
                                    <Group>
                                        <Tooltip label="Page will not include header/footer layout - useful for popups, embeds, or standalone pages">
                                            <Checkbox
                                                label="Headless Page"
                                                {...form?.getInputProps('headless', { type: 'checkbox' })}
                                            />
                                        </Tooltip>
                                    </Group>
                                </Stack>
                            </Paper>
                        </>
                    )}
                </Stack>
            </CollapsibleInspector>
        );
    }
    // Note: No custom comparison due to complex form object and callback dependencies
    // The CollapsibleInspectorSection handles its own memoization
);
