/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Text } from '@mantine/core';
import { ConfirmationModal } from '@selfhelp/ui';
import { IPageSectionWithFields } from '../../../../../types/common/pages.type';

interface IRemoveSectionModalProps {
    opened: boolean;
    onClose: () => void;
    onConfirm: () => void;
    section: IPageSectionWithFields;
    isLoading?: boolean;
}

export function RemoveSectionModal({ opened, onClose, onConfirm, section, isLoading = false }: IRemoveSectionModalProps) {
    if (!section) return null;

    const childNote = section.children && section.children.length > 0
        ? ` This section has ${section.children.length} child section(s) that will also be removed.`
        : '';

    return (
        <ConfirmationModal
            opened={opened}
            onClose={onClose}
            onConfirm={onConfirm}
            title="Remove Section"
            message={`This will remove the section from this page/parent, but the section will not be deleted permanently. You can add it back later from the unused sections.${childNote}`}
            confirmLabel="Remove Section"
            cancelLabel="Cancel"
            intent="info"
            confirmColor="orange"
            isLoading={isLoading}
            footer={
                <Text size="sm">
                    Are you sure you want to remove section: <Text span fw={700}>{section.section_name}</Text>?
                </Text>
            }
        />
    );
}
