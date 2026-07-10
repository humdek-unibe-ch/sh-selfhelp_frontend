/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useMemo } from 'react';
import { Stack, Text } from '@mantine/core';
import { CreatableSelectField } from './CreatableSelectField';
import type { IFieldConfig } from '../../../../../types/requests/admin/fields.types';

/**
 * Editor for the `modal_width` / `modal_height` page properties
 * (`select-modal-size` field type).
 *
 * Reuses the SAME creatable-select the section editor uses for CSS-like values
 * (`CreatableSelectField`): a dropdown of useful size presets plus a manual
 * "Custom size" entry, so the author can pick a preset or type any CSS length.
 *
 * Values mirror `IPageContent.modal_width|modal_height` (`@selfhelp/shared`):
 *   - empty   -> the frontend default (80% of the viewport);
 *   - a preset / CSS length (`80%`, `640px`, `48rem`, ...);
 *   - `auto`  -> the modal grows to fit its content.
 * Whatever the value, the modal is capped at 90% of the viewport by the
 * frontend, so this only sets the preferred size.
 */

/** Useful presets offered in the dropdown; any custom CSS length is still allowed. */
const MODAL_SIZE_PRESETS = ['auto', '50%', '60%', '70%', '80%', '90%', '100%'] as const;

interface IModalSizeSelectFieldProps {
    fieldId: number;
    config: IFieldConfig;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function ModalSizeSelectField({
    fieldId,
    config,
    value,
    onChange,
    disabled = false,
}: IModalSizeSelectFieldProps) {
    // Single-select creatable dropdown pre-filled with the size presets. The
    // options live here (web-only contract), so no per-field DB config is needed
    // — same approach as other creatable select fields.
    const mergedConfig: IFieldConfig = useMemo(
        () => ({
            ...config,
            multiSelect: false,
            creatable: true,
            searchable: false,
            options: MODAL_SIZE_PRESETS.map((preset) => ({ value: preset, text: preset })),
        }),
        [config]
    );

    return (
        <Stack gap={4}>
            <CreatableSelectField
                fieldId={fieldId}
                config={mergedConfig}
                value={value || ''}
                onChange={onChange}
                disabled={disabled}
                clearable
                placeholder="Default (80%)"
                singleCreatePlaceholder="Custom size, e.g. 640px or 48rem"
                addSingleButtonText="Custom size"
            />
            <Text size="xs" c="dimmed">
                Leave empty for the default 80%. Pick a preset, choose <b>auto</b> to fit the
                content, or add a custom CSS size. The modal never exceeds 90% of the screen.
            </Text>
        </Stack>
    );
}
