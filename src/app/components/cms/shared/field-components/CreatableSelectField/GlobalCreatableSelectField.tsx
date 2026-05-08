/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useCssClasses, useMobileCssClasses } from '../../../../../../hooks/useCssClasses';
import { IFieldConfig } from '../../../../../../types/requests/admin/fields.types';
import { CreatableSelectField, CREATABLE_SELECT_CONFIGS } from './CreatableSelectField';

/**
 * `target` selects which CSS catalogue feeds the dropdown:
 * - `'web'`    : full Tailwind set (default — used by the `css` field).
 * - `'mobile'` : curated mobile-safe subset (used by the `css_mobile`
 *                field). The mobile renderer only understands the
 *                classes in `@selfhelp/shared/cms-classes` allow-list,
 *                so showing anything else in the picker would mislead
 *                the editor.
 */
export type TCssClassTarget = 'web' | 'mobile';

export interface IGlobalCreatableSelectFieldProps {
    fieldId: number;
    config: IFieldConfig;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    isLoading?: boolean;
    clearable?: boolean;
    dataVariables?: Record<string, string>;
    target?: TCssClassTarget;
}

export function GlobalCreatableSelectField({
    fieldId,
    config: config,
    value,
    onChange,
    disabled = false,
    isLoading = false,
    clearable = false,
    dataVariables,
    target = 'web',
}: IGlobalCreatableSelectFieldProps) {
    const webQuery = useCssClasses();
    const mobileQuery = useMobileCssClasses();
    const { data: cssClasses, isLoading: cssLoading } = target === 'mobile' ? mobileQuery : webQuery;

    const updatedConfig = {
        ...config,
        options: (cssClasses || config.options || []).map(option => ({
            value: option.value,
            text: option.text
        }))
    };

    const cssConfig = CREATABLE_SELECT_CONFIGS.cssClasses;

    return (
        <CreatableSelectField
            fieldId={fieldId}
            config={updatedConfig}
            value={value}
            onChange={onChange}
            disabled={disabled}
            isLoading={isLoading || cssLoading}
            clearable={clearable}
            {...cssConfig}
            dataVariables={dataVariables}
        />
    );
}
