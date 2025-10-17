'use client';

import { useCssClasses } from '../../../../../hooks/useCssClasses';
import { IFieldConfig } from '../../../../../types/requests/admin/fields.types';
import { CreatableSelectField } from './CreatableSelectField';

interface IGlobalCreatableSelectFieldProps {
    fieldId: number;
    config: IFieldConfig;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    isLoading?: boolean;
    clearable?: boolean;
    variables?: import('../../../../../utils/mentions.utils').IVariableSuggestion[];
}

export function GlobalCreatableSelectField({
    fieldId,
    config: config,
    value,
    onChange,
    disabled = false,
    isLoading = false,
    clearable = false,
    variables
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

    // CSS class validation function
    const validateCssClass = (input: string): boolean => {
        // Allow CSS classes with embedded variables
        // Examples: px-4, {{my_var}}, stef-{{user_id}}, {{var}}-suffix, prefix-{{var}}-suffix
        if (!input.trim()) return false;

        // Check that all {{}} are properly closed and contain valid variable names
        const varRegex = /\{\{[a-zA-Z_][a-zA-Z0-9_]*\}\}/g;
        const invalidVars = input.match(/\{\{[^}]*(?:\{|\}[^}]*\{)/g);
        if (invalidVars) return false;

        // Remove all valid variables and check remaining characters
        const withoutVars = input.replace(varRegex, '');
        const remainingValid = /^[a-zA-Z0-9:_-]*$/.test(withoutVars);

        return remainingValid;
    };

    // CSS classes validation function for multiple input
    const validateMultipleCssClasses = (input: string): boolean => {
        if (!input.trim()) return false;

        // Split by whitespace, newlines, and filter out empty strings
        const classes = input.split(/[\s\n]+/).filter(Boolean);

        // Validate each class
        return classes.every(cls => validateCssClass(cls));
    };

    return (
        <CreatableSelectField
            fieldId={fieldId}
            config={updatedConfig}
            value={value}
            onChange={onChange}
            disabled={disabled}
            isLoading={isLoading || cssLoading}
            clearable={clearable}
            placeholder="Search and select CSS classes..."
            searchPlaceholder="Search CSS classes..."
            noOptionsMessage="No CSS classes found"
            singleCreatePlaceholder="Enter CSS class name (can include variables like stef-{{user_id}})"
            multiCreatePlaceholder="Enter multiple CSS classes (space-separated): px-4 py-2 rounded-lg {{my_css}} stef-{{user_id}} text-{{theme}}"
            addSingleButtonText="Add custom CSS class"
            addMultipleButtonText="Add multiple classes"
            addClassesButtonText="Add Classes"
            cancelButtonText="Cancel"
            validateSingle={validateCssClass}
            validateMultiple={validateMultipleCssClasses}
            validationErrorMessage="Invalid CSS class name"
            variables={variables}
        />
    );
}
