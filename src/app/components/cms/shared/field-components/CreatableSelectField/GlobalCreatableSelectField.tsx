'use client';

import { IVariableSuggestion } from '../../../../../../utils/mentions.utils';
import { useCssClasses } from '../../../../../../hooks/useCssClasses';
import { IFieldConfig } from '../../../../../../types/requests/admin/fields.types';
import { CreatableSelectField, CREATABLE_SELECT_CONFIGS } from './CreatableSelectField';

export interface IGlobalCreatableSelectFieldProps {
    fieldId: number;
    config: IFieldConfig;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    isLoading?: boolean;
    clearable?: boolean;
    variables?: IVariableSuggestion[];
    dataVariables?: Record<string, string>;
}

export function GlobalCreatableSelectField({
    fieldId,
    config: config,
    value,
    onChange,
    disabled = false,
    isLoading = false,
    clearable = false,
    variables,
    dataVariables
}: IGlobalCreatableSelectFieldProps) {
    const { data: cssClasses, isLoading: cssLoading } = useCssClasses();

    // For CSS, prioritize API data over fieldConfig.options
    const updatedConfig = {
        ...config,
        options: (cssClasses || config.options || []).map(option => ({
            value: option.value,
            text: option.text
        }))
    };

    // Use the shared CSS classes configuration
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
            variables={variables}
            dataVariables={dataVariables}
        />
    );
}
