'use client';

import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
    Paper,
    Stack,
    Text,
    Group,
    Box,
    Checkbox,
    ActionIcon,
    Tooltip,
    Badge
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { usePageFormStore } from '../../../../store/pageFormStore';
import { LockedField } from '../../ui/locked-field/LockedField';
import { DragDropMenuPositioner } from '../../ui/drag-drop-menu-positioner/DragDropMenuPositioner';
import { FieldLabelWithTooltip } from '../../ui/field-label-with-tooltip/FieldLabelWithTooltip';
import { MenuType } from './PageInspector';
import { IAdminPage } from '../../../../../types/responses/admin/admin.types';
import { PagePropertyField } from './page-field-connectors';
import { IPageField } from '../../../../../types/common/pages.type';
import styles from './PageInspector.module.css';

// ==================== Page Info Panel ====================

interface IPageInfoPanelProps {
    page: IAdminPage;
    pageId?: number;
    isConfigurationPage: boolean;
}

export const PageInfoPanel = React.memo(function PageInfoPanel({
    page,
    pageId,
    isConfigurationPage
}: IPageInfoPanelProps) {
    return (
        <Paper withBorder style={{ backgroundColor: 'light-dark(var(--mantine-color-blue-0), var(--mantine-color-blue-9))' }}>
            <Box p="md">
                <Group gap="xs" mb="sm">
                    <IconInfoCircle size={16} style={{ color: 'var(--mantine-color-blue-6)' }} />
                    <Text size="sm" fw={500} c="blue">Page Information</Text>
                </Group>

                <Stack gap="xs">
                    <Group gap="md" wrap="wrap">
                        <Box>
                            <Text size="xs" fw={500} c="dimmed">Keyword</Text>
                            <Text size="sm" style={{ fontFamily: 'monospace', color: 'var(--mantine-color-text)' }}>{page.keyword}</Text>
                        </Box>
                        <Box>
                            <Text size="xs" fw={500} c="dimmed">URL</Text>
                            <Text size="sm" style={{ fontFamily: 'monospace', color: 'var(--mantine-color-text)' }}>{page.url}</Text>
                        </Box>
                        <Box>
                            <Text size="xs" fw={500} c="dimmed">Page ID</Text>
                            <Text size="sm" style={{ color: 'var(--mantine-color-text)' }}>{pageId || page.id_pages}</Text>
                        </Box>
                    </Group>

                    <Group gap="xs" mt="xs">
                        {isConfigurationPage && (
                            <Badge color="purple" variant="light" size="sm">
                                Configuration Page
                            </Badge>
                        )}
                        {page.is_headless && (
                            <Badge color="orange" variant="light" size="sm">
                                Headless
                            </Badge>
                        )}
                        {page.nav_position !== null && (
                            <Badge color="blue" variant="light" size="sm">
                                Menu Position: {page.nav_position}
                            </Badge>
                        )}
                        {page.parent !== null && (
                            <Badge color="green" variant="light" size="sm">
                                Child Page
                            </Badge>
                        )}
                    </Group>
                </Stack>
            </Box>
        </Paper>
    );
});

// ==================== Basic Info Fields (Keyword + URL) ====================

export const PageBasicInfoFields = React.memo(function PageBasicInfoFields() {
    const keyword = usePageFormStore((state) => state.keyword);
    const url = usePageFormStore((state) => state.url);
    const setKeyword = usePageFormStore((state) => state.setKeyword);
    const setUrl = usePageFormStore((state) => state.setUrl);

    return (
        <Paper p="md" withBorder>
            <Stack gap="md">
                <Text size="sm" fw={500} c="blue">Basic Information</Text>
                <LockedField
                    label={
                        <FieldLabelWithTooltip
                            label="Keyword"
                            tooltip="Unique identifier for the page. Used in URLs and internal references. Cannot contain spaces or special characters."
                        />
                    }
                    value={keyword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeyword(e.currentTarget.value)}
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
                    value={url}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.currentTarget.value)}
                    lockedTooltip="Enable URL editing"
                    unlockedTooltip="Lock URL editing"
                />
            </Stack>
        </Paper>
    );
});

// ==================== Page Access Type Radio ====================

interface IPageAccessTypeGroupProps {
    options: Array<{ lookupCode: string; lookupValue: string }>;
}

export const PageAccessTypeGroup = React.memo(function PageAccessTypeGroup({
    options
}: IPageAccessTypeGroupProps) {
    const pageAccessType = usePageFormStore((state) => state.pageAccessType);
    const setPageAccessType = usePageFormStore((state) => state.setPageAccessType);

    if (options.length === 0) return null;

    return (
        <Paper p="md" withBorder>
            <Stack gap="md">
                <FieldLabelWithTooltip
                    label="Page Access Type"
                    tooltip="Controls who can access this page - web only, mobile only, or both platforms"
                />
                <Stack gap="xs">
                    {options.map((type) => {
                        const id = `pageAccessType-${type.lookupCode}`;
                        return (
                            <Group key={type.lookupCode} gap="xs" align="center">
                                <input
                                    id={id}
                                    type="radio"
                                    name="pageAccessType"
                                    value={type.lookupCode}
                                    checked={pageAccessType === type.lookupCode}
                                    onChange={() => setPageAccessType(type.lookupCode)}
                                    className="cursor-pointer"
                                />
                                <label htmlFor={id} className="cursor-pointer">
                                    <Text size="sm">{type.lookupValue}</Text>
                                </label>
                            </Group>
                        );
                    })}
                </Stack>
            </Stack>
        </Paper>
    );
});

// ==================== Menu Positions ====================

interface IPageMenuPositionsProps {
    page: IAdminPage;
    parentPage: IAdminPage | null;
}

export const PageMenuPositions = React.memo(function PageMenuPositions({
    page,
    parentPage
}: IPageMenuPositionsProps) {
    const headerMenuEnabled = usePageFormStore((state) => state.headerMenuEnabled);
    const footerMenuEnabled = usePageFormStore((state) => state.footerMenuEnabled);
    const navPosition = usePageFormStore((state) => state.navPosition);
    const footerPosition = usePageFormStore((state) => state.footerPosition);
    const setHeaderMenuEnabled = usePageFormStore((state) => state.setHeaderMenuEnabled);
    const setFooterMenuEnabled = usePageFormStore((state) => state.setFooterMenuEnabled);
    const setNavPosition = usePageFormStore((state) => state.setNavPosition);
    const setFooterPosition = usePageFormStore((state) => state.setFooterPosition);

    const [activeDrag, setActiveDrag] = useState<MenuType | null>(null);
    const headerMenuGetFinalPosition = useRef<(() => number | null) | null>(null);
    const footerMenuGetFinalPosition = useRef<(() => number | null) | null>(null);

    useEffect(() => {
        if (headerMenuGetFinalPosition.current) {
            const lastPosition = headerMenuGetFinalPosition.current();
            if (lastPosition != null && navPosition == null) {
                setNavPosition(lastPosition);
            }
        }
    }, [headerMenuEnabled, navPosition, setNavPosition]);

    useEffect(() => {
        if (footerMenuGetFinalPosition.current) {
            const lastPosition = footerMenuGetFinalPosition.current();
            if (lastPosition != null && footerPosition == null) {
                setFooterPosition(lastPosition);
            }
        }
    }, [footerMenuEnabled, footerPosition, setFooterPosition]);

    const handleHeaderPositionChange = useCallback((position: number | null) => {
        setNavPosition(position);
    }, [setNavPosition]);

    const handleFooterPositionChange = useCallback((position: number | null) => {
        setFooterPosition(position);
    }, [setFooterPosition]);

    return (
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
                    activeDrag={activeDrag}
                    onGlobalDragStart={setActiveDrag}
                    onGlobalDragEnd={() => setActiveDrag(null)}
                    menuType={MenuType.HEADER}
                    title="Header Menu Position"
                    enabled={headerMenuEnabled}
                    position={navPosition}
                    onEnabledChange={setHeaderMenuEnabled}
                    onPositionChange={handleHeaderPositionChange}
                    onGetFinalPosition={(getFinalPositionFn) => {
                        headerMenuGetFinalPosition.current = getFinalPositionFn;
                    }}
                    parentPage={parentPage}
                    checkboxLabel="Header Menu"
                    showAlert={false}
                />

                <DragDropMenuPositioner
                    currentPage={page}
                    activeDrag={activeDrag}
                    onGlobalDragStart={setActiveDrag}
                    onGlobalDragEnd={() => setActiveDrag(null)}
                    menuType={MenuType.FOOTER}
                    title="Footer Menu Position"
                    enabled={footerMenuEnabled}
                    position={footerPosition}
                    onEnabledChange={setFooterMenuEnabled}
                    onPositionChange={handleFooterPositionChange}
                    onGetFinalPosition={(getFinalPositionFn) => {
                        footerMenuGetFinalPosition.current = getFinalPositionFn;
                    }}
                    parentPage={parentPage}
                    checkboxLabel="Footer Menu"
                    showAlert={false}
                />
            </Stack>
        </Paper>
    );
});

// ==================== Page Settings (Headless + Open Access) ====================

export const PageSettings = React.memo(function PageSettings() {
    const headless = usePageFormStore((state) => state.headless);
    const openAccess = usePageFormStore((state) => state.openAccess);
    const setHeadless = usePageFormStore((state) => state.setHeadless);
    const setOpenAccess = usePageFormStore((state) => state.setOpenAccess);

    return (
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
                            checked={headless}
                            onChange={(event) => setHeadless(event.currentTarget.checked)}
                        />
                    </Tooltip>
                    <Tooltip label="Page can be accessed without authentication - visible to all users including guests">
                        <Checkbox
                            label="Open Access"
                            checked={openAccess}
                            onChange={(event) => setOpenAccess(event.currentTarget.checked)}
                        />
                    </Tooltip>
                </Group>
            </Stack>
        </Paper>
    );
});

// ==================== Additional Properties ====================

interface IPageAdditionalPropertiesProps {
    fields: IPageField[];
    defaultLanguageId: number;
}

export const PageAdditionalProperties = React.memo(function PageAdditionalProperties({
    fields,
    defaultLanguageId
}: IPageAdditionalPropertiesProps) {
    if (fields.length === 0) return null;

    return (
        <Paper p="md" withBorder>
            <Stack gap="md">
                <Group gap="xs">
                    <Text size="sm" fw={500} c="blue">Additional Properties</Text>
                    <Tooltip
                        label="Additional configuration fields specific to this page type."
                        multiline
                        w={300}
                    >
                        <ActionIcon variant="subtle" size="xs" color="gray">
                            <IconInfoCircle size="0.75rem" />
                        </ActionIcon>
                    </Tooltip>
                </Group>

                {fields.map(field => (
                    <Box key={field.id}>
                        <PagePropertyField
                            field={field}
                            languageId={defaultLanguageId}
                            className={styles.fullWidthLabel}
                        />
                    </Box>
                ))}
            </Stack>
        </Paper>
    );
});
