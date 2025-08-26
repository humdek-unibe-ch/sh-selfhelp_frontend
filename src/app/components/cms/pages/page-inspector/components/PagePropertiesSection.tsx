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
    Checkbox
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { CollapsibleInspectorSection } from '../../../shared';
import { LockedField } from '../../../ui/locked-field/LockedField';
import { FieldLabelWithTooltip } from '../../../ui/field-label-with-tooltip/FieldLabelWithTooltip';
import { DragDropMenuPositioner } from '../../../ui/drag-drop-menu-positioner/DragDropMenuPositioner';
import { INSPECTOR_TYPES, INSPECTOR_SECTIONS } from '../../../../../../store/inspectorStore';

interface IPagePropertiesSectionProps {
    form: any; // Mantine form instance
    pageAccessTypes: Array<{ lookupCode: string; lookupValue: string }>;
    page: any;
    parentPage: any;
    headerMenuGetFinalPosition: React.MutableRefObject<(() => number | null) | null>;
    footerMenuGetFinalPosition: React.MutableRefObject<(() => number | null) | null>;
    onHeaderMenuChange: (enabled: boolean) => void;
    onHeaderPositionChange: (position: number) => void;
    onFooterMenuChange: (enabled: boolean) => void;
    onFooterPositionChange: (position: number) => void;
    className?: string;
}

export const PagePropertiesSection = memo<IPagePropertiesSectionProps>(
    function PagePropertiesSection({
        form,
        pageAccessTypes,
        page,
        parentPage,
        headerMenuGetFinalPosition,
        footerMenuGetFinalPosition,
        onHeaderMenuChange,
        onHeaderPositionChange,
        onFooterMenuChange,
        onFooterPositionChange,
        className
    }) {
        return (
            <CollapsibleInspectorSection
                title="Properties"
                inspectorType={INSPECTOR_TYPES.PAGE}
                sectionName={INSPECTOR_SECTIONS.PROPERTIES}
                defaultExpanded={true}
            >
                <Stack gap="xs" className={className}>
                    {/* Page Basic Properties */}
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
                                {...form.getInputProps('keyword')}
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
                                {...form.getInputProps('url')}
                                lockedTooltip="Enable URL editing"
                                unlockedTooltip="Lock URL editing"
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
                                value={form.values.pageAccessType}
                                onChange={(value) => form.setFieldValue('pageAccessType', value)}
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
                                enabled={form.values.headerMenuEnabled}
                                position={form.values.navPosition}
                                onEnabledChange={onHeaderMenuChange}
                                onPositionChange={onHeaderPositionChange}
                                onGetFinalPosition={(getFinalPositionFn) => {
                                    headerMenuGetFinalPosition.current = getFinalPositionFn;
                                }}
                                parentPage={parentPage}
                                checkboxLabel="Header Menu"
                                showAlert={false}
                            />

                            <DragDropMenuPositioner
                                currentPage={page}
                                menuType="footer"
                                title="Footer Menu Position"
                                enabled={form.values.footerMenuEnabled}
                                position={form.values.footerPosition}
                                onEnabledChange={onFooterMenuChange}
                                onPositionChange={onFooterPositionChange}
                                onGetFinalPosition={(getFinalPositionFn) => {
                                    footerMenuGetFinalPosition.current = getFinalPositionFn;
                                }}
                                parentPage={parentPage}
                                checkboxLabel="Footer Menu"
                                showAlert={false}
                            />
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
                                        {...form.getInputProps('headless', { type: 'checkbox' })}
                                    />
                                </Tooltip>
                            </Group>
                        </Stack>
                    </Paper>
                </Stack>
            </CollapsibleInspectorSection>
        );
    }
    // Note: No custom comparison due to complex form object and callback dependencies
    // The CollapsibleInspectorSection handles its own memoization
);
