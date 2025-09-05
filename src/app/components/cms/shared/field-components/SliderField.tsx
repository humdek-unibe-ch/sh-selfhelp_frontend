'use client';

import { BoxProps, ElementProps, Input, Slider } from '@mantine/core';

interface ISliderFieldProps {
    fieldId: number;
    fieldName: string;
    fieldTitle?: string | null;
    value: string;
    onChange: (value: string) => void;
    config?: {
        options?: Array<{
            text: string;
            value: string;
        }>;
    };
    disabled?: boolean;
}

const MARKS = [
    { value: 0, label: 'xs' },
    { value: 25, label: 'sm' },
    { value: 50, label: 'md' },
    { value: 75, label: 'lg' },
    { value: 100, label: 'xl' },
];

export function SliderField({
    fieldId,
    fieldName,
    fieldTitle,
    value,
    onChange,
    config,
    disabled = false
}: ISliderFieldProps) {
    // Get marks from config or use default
    const getMarks = () => {
        if (config?.options && config.options.length > 0) {
            // Create marks from config options
            const optionCount = config.options.length;
            return config.options.map((option, index) => ({
                value: (index / (optionCount - 1)) * 100,
                label: option.value
            }));
        }
        return MARKS;
    };

    const marks = getMarks();
    const currentMark = marks.find((mark) => mark.label === value);

    if (!currentMark) {
        // Fallback if value doesn't match any mark
        return (
            <Input.Wrapper labelElement="div" label={fieldTitle || fieldName}>
                <Slider
                    value={50} // Default to middle
                    onChange={(val) => {
                        const closestMark = marks.reduce((prev, curr) =>
                            Math.abs(curr.value - val) < Math.abs(prev.value - val) ? curr : prev
                        );
                        onChange(closestMark.label);
                    }}
                    label={(val) => {
                        const closestMark = marks.reduce((prev, curr) =>
                            Math.abs(curr.value - val) < Math.abs(prev.value - val) ? curr : prev
                        );
                        return closestMark.label;
                    }}
                    step={25}
                    marks={marks}
                    styles={{ markLabel: { display: 'none' } }}
                    thumbLabel="Size"
                    disabled={disabled}
                />
            </Input.Wrapper>
        );
    }

    const _value = currentMark.value;
    const handleChange = (val: number) => {
        const closestMark = marks.reduce((prev, curr) =>
            Math.abs(curr.value - val) < Math.abs(prev.value - val) ? curr : prev
        );
        onChange(closestMark.label);
    };

    return (
        <Input.Wrapper labelElement="div">
            <Slider
                key={fieldId}
                value={_value}
                onChange={handleChange}
                label={(val) => {
                    const closestMark = marks.reduce((prev, curr) =>
                        Math.abs(curr.value - val) < Math.abs(prev.value - val) ? curr : prev
                    );
                    return closestMark.label;
                }}
                step={25}
                marks={marks}
                styles={{ markLabel: { display: 'none' } }}
                thumbLabel={fieldTitle || fieldName}
                disabled={disabled}
            />
        </Input.Wrapper>
    );
}
