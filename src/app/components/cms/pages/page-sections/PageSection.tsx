/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { forwardRef, useMemo, useState, type ComponentPropsWithRef } from 'react';
import { Box, Text, Paper, Group, Badge, ActionIcon, Tooltip, Checkbox, Menu } from '@mantine/core';
import {
    IconChevronRight,
    IconChevronDown,
    IconPlus,
    IconTrash,
    IconGripVertical,
    IconFilter,
    IconDatabase,
    IconCornerDownRight,
    IconRowInsertTop,
    IconRowInsertBottom
} from '@tabler/icons-react';
import { type IPageSectionWithFields } from '../../../../../types/common/pages.type';
import { getStyleVisual } from '../../../../../utils/style-visuals';
import { useUpdateSectionMutation } from '../../../../../hooks/mutations';
import { ConditionBuilderModal } from '../../shared/condition-builder-modal/ConditionBuilderModal';
import { DataConfigModal, type IDataSource } from '../../shared/data-config-modal/DataConfigModal';
import { RemoveSectionModal } from './RemoveSectionModal';
import styles from './PageSection.module.css';
import SectionLink from './SectionLink';
import { HighlightText } from './HighlightText';

interface IPageSectionProps {
    section: IPageSectionWithFields;
    level: number;
    parentId: number | null;
    pageId: number;
    expandedSections: Set<number>;
    onToggleExpand: (sectionId: number) => void;
    onRemoveSection: (sectionId: number, parentId: number | null) => void;
    onAddChildSection?: (parentSectionId: number) => void;
    onAddSiblingAbove?: (referenceSectionId: number, parentId: number | null) => void;
    onAddSiblingBelow?: (referenceSectionId: number, parentId: number | null) => void;
    onSectionSelect?: (sectionId: number) => void;
    selectedSectionId?: number | null;
    focusedSectionId?: number | null;
    searchQuery?: string;
    isDragActive: boolean;
    overId: string | number | null;
    draggedSectionId?: number | null;
    dragHandleProps?: ComponentPropsWithRef<'div'> & { 'data-drag-handle'?: boolean };
    isDragging?: boolean;

    showInsideDropZone?: boolean;

    defaultBulkSelected?: boolean;
    onToggleSelect?: (sectionId: number, selected: boolean) => void;
    selectionVersion: number;
    bulkMode: boolean;
}

export const PageSection = forwardRef<HTMLDivElement, IPageSectionProps>(({
    section,
    level,
    parentId,
    pageId,
    expandedSections,
    onToggleExpand,
    onRemoveSection,
    onAddChildSection,
    onAddSiblingAbove,
    onAddSiblingBelow,
    onSectionSelect,
    selectedSectionId,
    focusedSectionId,
    searchQuery,
    isDragActive,
    overId: _overId,
    draggedSectionId: _draggedSectionId,
    dragHandleProps,
    isDragging = false,

    showInsideDropZone: _showInsideDropZone = false,

    defaultBulkSelected = false,
    onToggleSelect,
    selectionVersion,
    bulkMode
}, ref) => {
    const [removeModalOpened, setRemoveModalOpened] = useState(false);
    const [conditionModalOpened, setConditionModalOpened] = useState(false);
    const [dataConfigModalOpened, setDataConfigModalOpened] = useState(false);
    // Pins the hover-only action buttons visible while the add menu is open.
    const [addMenuOpened, setAddMenuOpened] = useState(false);
    const [isBulkSelected, setIsBulkSelected] = useState(defaultBulkSelected);
    const [trackedSelectionVersion, setTrackedSelectionVersion] = useState(selectionVersion);

    // Sync from parent (Select All / Deselect All / Clear) without a wasted render.
    // React docs: "Storing information from previous renders" pattern.
    if (trackedSelectionVersion !== selectionVersion) {
        setTrackedSelectionVersion(selectionVersion);
        setIsBulkSelected(defaultBulkSelected);
    }

    const hasChildren = section.children && section.children.length > 0;
    const isExpanded = expandedSections.has(section.id);
    const canHaveChildren = !!section.can_have_children;
    const isActive = selectedSectionId === section.id;
    const isFocused = focusedSectionId === section.id;

    // Per-style icon + accent colour so an editor can distinguish a `container`
    // from an `image` from a `login` at a glance. Falls back to a
    // container-aware default for styles not yet in the visual registry.
    const styleVisual = useMemo(
        () => getStyleVisual(section.style_name, canHaveChildren),
        [section.style_name, canHaveChildren]
    );
    const StyleIcon = styleVisual.icon;

    // Inline indicators: a section can carry a visibility `condition` and/or a
    // dynamic `data_config`. Show a small chip for each so an editor can spot
    // conditional / data-bound sections without opening the inspector.
    const hasCondition = Boolean(section.condition && String(section.condition).trim());
    const hasDataConfig =
        section.data_config !== null &&
        section.data_config !== undefined &&
        String(section.data_config).trim() !== '';

    // Dynamic per-style theming: the row publishes its style's UNIQUE hue as
    // `--section-hue`; the CSS builds the tint / hover / accent from it (fixed
    // S/L, theme-aware). Every style thus reads in its own colour — a container
    // blue, a background-image green, an accordion orange, etc.
    // Nesting indentation is owned entirely by the `.childrenContainer` dashed
    // guide line in SectionsList — the row itself carries no per-level margin, so
    // deeply nested trees don't compound indent and squeeze the content to nothing.
    const getIndentationStyle = () => ({
        '--section-hue': styleVisual.hue
    } as React.CSSProperties);

    const handleToggleExpand = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (hasChildren) {
            onToggleExpand(section.id);
        }
    };

    const handleRemoveSection = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setRemoveModalOpened(true);
    };

    const handleRemoveModalClose = () => {
        setRemoveModalOpened(false);
    };

    const handleRemoveConfirm = () => {
        onRemoveSection(section.id, parentId);
        setRemoveModalOpened(false);
    };

    // Inline global-field editing: the condition / data-config icons open the
    // SAME builders the inspector uses, then persist via the section update
    // mutation (only the touched global field is sent; content/property fields
    // are left untouched with empty arrays).
    const updateGlobalFieldMutation = useUpdateSectionMutation({ pageId, showNotifications: true });

    const openConditionModal = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setConditionModalOpened(true);
    };

    const openDataConfigModal = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDataConfigModalOpened(true);
    };

    const handleConditionSave = (jsonLogic: string | null) => {
        updateGlobalFieldMutation.mutate({
            pageId,
            sectionId: section.id,
            sectionData: { contentFields: [], propertyFields: [], globalFields: { condition: jsonLogic } }
        });
        setConditionModalOpened(false);
    };

    const handleDataConfigSave = (dataConfig: IDataSource[]) => {
        const serialized = dataConfig.length > 0 ? JSON.stringify(dataConfig) : null;
        updateGlobalFieldMutation.mutate({
            pageId,
            sectionId: section.id,
            sectionData: { contentFields: [], propertyFields: [], globalFields: { data_config: serialized } }
        });
        setDataConfigModalOpened(false);
    };

    const handleAddChild = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (canHaveChildren && onAddChildSection) {
            onAddChildSection(section.id);
        }
    };

    const handleAddSiblingAbove = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onAddSiblingAbove) {
            onAddSiblingAbove(section.id, parentId);
        }
    };

    const handleAddSiblingBelow = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onAddSiblingBelow) {
            onAddSiblingBelow(section.id, parentId);
        }
    };

    // Remove the old click handler - now handled by SectionLink

    return (
      <>
        <div
          style={getIndentationStyle()}
          className={styles.indentationWrapper}
        >
          <SectionLink
            sectionId={section.id}
            onSectionSelect={onSectionSelect}
            className={`${styles.sectionItem} ${level === 0 ? styles.topRow : styles.nestedRow} ${isActive ? styles.selected : ""} ${isBulkSelected ? styles.bulkSelected : ""} ${isFocused ? styles.focused : ""}`}
            data-section-id={section.id}
          >
            <Paper ref={ref} className={styles.sectionPaper}>
              <Group
                gap="xs"
                p="xs"
                wrap="nowrap"
                align="center"
                className={styles.compactGroup}
              >
                {/* Drag Handle - properly connected */}
                <div {...dragHandleProps}>
                  <ActionIcon
                    variant="subtle"
                    size="xs"
                    color="gray"
                    className={`${styles.dragHandle} ${isDragActive ? "opacity-100" : "opacity-60"} ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                  >
                    <IconGripVertical />
                  </ActionIcon>
                </div>

                {/* Expand/Collapse Toggle - only show if has children */}
                {hasChildren ? (
                  <ActionIcon
                    variant="subtle"
                    size="xs"
                    onClick={handleToggleExpand}
                    className={styles.expandButton}
                    data-action-button="true"
                  >
                    {isExpanded ? <IconChevronDown /> : <IconChevronRight />}
                  </ActionIcon>
                ) : (
                  <Box w={12} />
                )}

                {/* Per-style icon chip (colour + glyph bound to the style). The
                    colour is derived in CSS from the row's `--section-hue`, so no
                    inline colour vars are needed and the SSR/hydrated markup stays
                    identical (no hydration mismatch). */}
                <Box className={styles.styleIcon} title={section.style_name}>
                  <StyleIcon size={13} stroke={2} />
                </Box>

                {/* Section Info - name + style badge + inline indicators */}
                <Box className={styles.sectionInfo}>
                  <Group gap={6} wrap="nowrap" align="center">
                    <Text
                      size="sm"
                      fw={600}
                      className={styles.sectionName}
                      title={section.section_name}
                    >
                      <HighlightText
                        text={section.section_name}
                        query={searchQuery}
                      />
                    </Text>
                    {/* Style badge — coloured from the row's `--section-hue` via
                        the CSS module (Mantine's `color` prop only accepts palette
                        keys, so we style it directly to allow a unique hue). */}
                    <Badge
                      size="xs"
                      variant="light"
                      radius="sm"
                      className={styles.styleBadge}
                    >
                      <HighlightText
                        text={section.style_name}
                        query={searchQuery}
                      />
                    </Badge>
                    {hasChildren && (
                      <Badge
                        size="xs"
                        variant="outline"
                        color="gray"
                        radius="sm"
                        className={styles.childCount}
                      >
                        {section.children?.length}
                      </Badge>
                    )}
                  </Group>
                </Box>

                {/* Action Buttons - Ultra compact and hover-based */}
                <Group
                  gap={1}
                  className={`${styles.actionButtons} ${addMenuOpened ? styles.actionButtonsPinned : ''}`}
                >
                  {/* Condition + Data Config modal triggers (left of add/remove).
                      Highlighted when the section already carries a value. */}
                  <Tooltip label={hasCondition ? 'Edit visibility condition' : 'Add visibility condition'} position="top" withArrow>
                    <ActionIcon
                      size="xs"
                      variant={hasCondition ? 'light' : 'subtle'}
                      color="violet"
                      onClick={openConditionModal}
                      className={`${styles.actionButton} ${hasCondition ? styles.actionButtonActive : ''}`}
                      data-action-button="true"
                      aria-label="Edit condition"
                    >
                      <IconFilter />
                    </ActionIcon>
                  </Tooltip>

                  <Tooltip label={hasDataConfig ? 'Edit data configuration' : 'Add data configuration'} position="top" withArrow>
                    <ActionIcon
                      size="xs"
                      variant={hasDataConfig ? 'light' : 'subtle'}
                      color="teal"
                      onClick={openDataConfigModal}
                      className={`${styles.actionButton} ${hasDataConfig ? styles.actionButtonActive : ''}`}
                      data-action-button="true"
                      aria-label="Edit data configuration"
                    >
                      <IconDatabase />
                    </ActionIcon>
                  </Tooltip>

                  <Menu
                    shadow="md"
                    position="bottom-end"
                    withArrow
                    withinPortal
                    opened={addMenuOpened}
                    onChange={setAddMenuOpened}
                  >
                    <Menu.Target>
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        color="green"
                        className={styles.actionButton}
                        data-action-button="true"
                        aria-label={`Add a section near ${section.section_name}`}
                      >
                        <IconPlus />
                      </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                      <Menu.Label>Add section</Menu.Label>
                      {canHaveChildren && (
                        <Menu.Item
                          leftSection={<IconCornerDownRight size={14} />}
                          onClick={handleAddChild}
                        >
                          Add child
                        </Menu.Item>
                      )}
                      <Menu.Item
                        leftSection={<IconRowInsertTop size={14} />}
                        onClick={handleAddSiblingAbove}
                      >
                        Add above
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconRowInsertBottom size={14} />}
                        onClick={handleAddSiblingBelow}
                      >
                        Add below
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>

                  <Tooltip label="Remove" position="top" withArrow>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="orange"
                      onClick={handleRemoveSection}
                      className={styles.actionButton}
                      data-action-button="true"
                    >
                      <IconTrash />
                    </ActionIcon>
                  </Tooltip>
                </Group>

                {/* id + position meta - at the very end, after the action buttons */}
                <Text size="xs" className={styles.sectionMeta}>
                  #
                  <HighlightText text={String(section.id)} query={searchQuery} />
                  {" · pos "}
                  {section.position}
                </Text>

                {bulkMode && (
                  <Checkbox
                    size="xs"
                    color="orange"
                    checked={isBulkSelected}
                    onChange={(event) => {
                      const checked = event.currentTarget.checked;
                      setIsBulkSelected(checked);
                      onToggleSelect?.(section.id, checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select ${section.section_name} for removal`}
                  />
                )}
              </Group>
            </Paper>
          </SectionLink>
        </div>

        {/* Remove Section Modal */}
        <RemoveSectionModal
          opened={removeModalOpened}
          onClose={handleRemoveModalClose}
          onConfirm={handleRemoveConfirm}
          section={section}
        />

        {/* Inline global-field editors (same builders as the inspector) */}
        {conditionModalOpened && (
          <ConditionBuilderModal
            opened={conditionModalOpened}
            onClose={() => setConditionModalOpened(false)}
            onSave={handleConditionSave}
            initialValue={section.condition ?? ''}
            title={`Condition — ${section.section_name}`}
          />
        )}
        {dataConfigModalOpened && (
          <DataConfigModal
            opened={dataConfigModalOpened}
            onClose={() => setDataConfigModalOpened(false)}
            onSave={handleDataConfigSave}
            initialValue={section.data_config ? String(section.data_config) : ''}
            title={`Data Config — ${section.section_name}`}
          />
        )}
      </>
    );
});

PageSection.displayName = 'PageSection'; 
