'use client';

import { useCssClasses } from '../../../../../hooks/useCssClasses';
import { IFieldConfig } from '../../../../../types/requests/admin/fields.types';
import { CreatableSelectField } from './CreatableSelectField/CreatableSelectField';

interface IGlobalCreatableSelectFieldProps {
    fieldId: number;
    config: IFieldConfig;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    isLoading?: boolean;
    clearable?: boolean;
}

export function GlobalCreatableSelectField({
    fieldId,
    config: config,
    value,
    onChange,
    disabled = false,
    isLoading = false,
    clearable = false
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
        // Only allow letters, numbers, hyphens, underscores, and colons
        return /^[a-zA-Z0-9:_-]+$/.test(input);
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
            singleCreatePlaceholder="Enter CSS class name (letters, numbers, hyphens, underscores only)"
            multiCreatePlaceholder={`Enter multiple CSS classes (one per line or space-separated):\npx-4 py-2\nrounded-lg\nfont-medium\ntext-white\nbg-blue-600\nhover:bg-blue-700`}
            addSingleButtonText="Add custom CSS class"
            addMultipleButtonText="Add multiple classes"
            addClassesButtonText="Add Classes"
            cancelButtonText="Cancel"
            validateSingle={validateCssClass}
            validateMultiple={validateMultipleCssClasses}
            validationErrorMessage="Invalid CSS class name"
        />
    );
}
