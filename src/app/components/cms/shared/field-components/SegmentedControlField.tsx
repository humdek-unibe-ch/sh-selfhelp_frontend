'use client';

import { SegmentedControl, Input } from '@mantine/core';
import { IFieldConfig } from '../../../../../types/requests/admin/fields.types';

interface ISegmentedControlFieldProps {
    fieldId: number;
    config: IFieldConfig;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function SegmentedControlField({
    fieldId,
    config,
    value,
    onChange,
    placeholder = 'Select an option...',
    disabled = false
}: ISegmentedControlFieldProps) {
    const options = (config.options || []).map(option => ({
        value: option.value,
        label: option.text,
        disabled: option.disabled
    }));

    if (options.length === 0) {
        return (
            <Input.Wrapper labelElement="div" label={placeholder}>
                <SegmentedControl
                    key={fieldId}
                    data={[{ value: '', label: 'No options available', disabled: true }]}
                    value={value || ''}
                    onChange={onChange}
                    disabled={true}
                    fullWidth
                    transitionDuration={150}
                />
            </Input.Wrapper>
        );
    }

    return (
        <SegmentedControl
            key={fieldId}
            data={options}
            value={value || options[0]?.value || ''}
            onChange={onChange}
            disabled={config.disabled ?? disabled}
            fullWidth
            transitionDuration={150}
            size="sm"
        />
    );
}
