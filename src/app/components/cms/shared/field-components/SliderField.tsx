'use client';

import { Input, Slider } from '@mantine/core';

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
        marks?: Array<{
            value: number;
            label: string;
            saveValue?: string;
        }>;
        min?: number;
        max?: number;
        step?: number;
        defaultValue?: number;
    };
    disabled?: boolean;
}

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
        // First priority: direct marks from config
        if (config?.marks && config.marks.length > 0) {
            return config.marks.map(mark => ({
                value: mark.value,
                label: mark.label,
                saveValue: mark.saveValue || mark.value.toString()
            }));
        }

        // Second priority: options from config
        if (config?.options && config.options.length > 0) {
            // Create marks from config options
            const optionCount = config.options.length;
            return config.options.map((option, index) => ({
                value: optionCount > 1 ? (index / (optionCount - 1)) * 100 : 50,
                label: option.text, // Display the text as label
                saveValue: option.value // Save the value as the actual value
            }));
        }

        // Default fallback marks
        return [
            { value: 0, label: 'xs', saveValue: 'xs' },
            { value: 25, label: 'sm', saveValue: 'sm' },
            { value: 50, label: 'md', saveValue: 'md' },
            { value: 75, label: 'lg', saveValue: 'lg' },
            { value: 100, label: 'xl', saveValue: 'xl' },
        ];
    };

    const marks = getMarks();
    const currentMark = marks.find((mark) => mark.saveValue === value);

    // Helper function to find closest mark
    const findClosestMark = (sliderValue: number) => {
        return marks.reduce((prev, curr) =>
            Math.abs(curr.value - sliderValue) < Math.abs(prev.value - sliderValue) ? curr : prev
        );
    };

    // Get slider configuration
    const getSliderConfig = () => {
        const min = config?.min ?? 0;
        const max = config?.max ?? 100;
        const step = config?.step ?? (marks.length > 1 ? (max - min) / (marks.length - 1) : (max - min) / 4);

        return { min, max, step };
    };

    const { min, max, step } = getSliderConfig();

    if (!currentMark) {
        // Fallback if value doesn't match any mark - use first mark or middle position
        const defaultValue = marks.length > 0 ? marks[0].value : min + (max - min) / 2;
        return (
            <Slider
                value={defaultValue}
                onChange={(val) => {
                    const closestMark = findClosestMark(val);
                    onChange(closestMark.saveValue);
                }}
                label={(val) => {
                    const closestMark = findClosestMark(val);
                    return closestMark.label;
                }}
                min={min}
                max={max}
                step={step}
                marks={marks}
                styles={{ markLabel: { display: 'none' } }}
                thumbLabel={fieldTitle || fieldName}
                disabled={disabled}
            />
        );
    }

    const handleChange = (val: number) => {
        const closestMark = findClosestMark(val);
        onChange(closestMark.saveValue);
    };

    return (
        <Input.Wrapper labelElement="div">
            <Slider
                key={fieldId}
                value={currentMark.value}
                onChange={handleChange}
                label={(val) => {
                    const closestMark = findClosestMark(val);
                    return closestMark.label;
                }}
                min={min}
                max={max}
                step={step}
                marks={marks}
                styles={{ markLabel: { display: 'none' } }}
                thumbLabel={fieldTitle || fieldName}
                disabled={disabled}
            />
        </Input.Wrapper>
    );
}
