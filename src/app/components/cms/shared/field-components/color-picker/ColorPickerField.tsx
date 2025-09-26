'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ColorSwatch, Group, CheckIcon, UnstyledButton, Popover, ColorPicker as MantineColorPicker, TextInput, rem, Checkbox } from '@mantine/core';
import classes from './ColorPickerField.module.css';
import { IFieldConfig } from '../../../../../../types/requests/admin/fields.types';


export function ColorWheelIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 200 200"
      style={{ width: rem(18), height: rem(18) }}
    >
      <path fill="#FF5178" d="M100 0a100 100 0 00-50 13.398l30 51.961A40 40 0 01100 60V0z" />
      <path
        fill="#FF9259"
        d="M49.982 13.408a99.999 99.999 0 00-36.595 36.61l51.968 29.99a40 40 0 0114.638-14.645l-30.01-51.955z"
      />
      <path
        fill="#FFD23B"
        d="M13.386 50.02A100 100 0 000 100.025l60-.014a40 40 0 015.354-20.002L13.386 50.021z"
      />
      <path
        fill="#89C247"
        d="M0 100a99.999 99.999 0 0013.398 50l51.961-30A40.001 40.001 0 0160 100H0z"
      />
      <path
        fill="#49B296"
        d="M13.39 149.989a100.001 100.001 0 0036.599 36.607l30.006-51.958a39.99 39.99 0 01-14.639-14.643l-51.965 29.994z"
      />
      <path
        fill="#2897B1"
        d="M49.989 186.596A99.995 99.995 0 0099.987 200l.008-60a39.996 39.996 0 01-20-5.362l-30.007 51.958z"
      />
      <path
        fill="#3EC3FF"
        d="M100 200c17.554 0 34.798-4.621 50-13.397l-30-51.962A40 40 0 01100 140v60z"
      />
      <path
        fill="#09A1E5"
        d="M150.003 186.601a100.001 100.001 0 0036.601-36.604l-51.962-29.998a40 40 0 01-14.641 14.641l30.002 51.961z"
      />
      <path
        fill="#077CCC"
        d="M186.607 149.992A99.993 99.993 0 00200 99.99l-60 .006a39.998 39.998 0 01-5.357 20.001l51.964 29.995z"
      />
      <path
        fill="#622876"
        d="M200 100c0-17.554-4.621-34.798-13.397-50l-51.962 30A39.997 39.997 0 01140 100h60z"
      />
      <path
        fill="#962B7C"
        d="M186.597 49.99a99.994 99.994 0 00-36.606-36.598l-29.995 51.965a40 40 0 0114.643 14.64l51.958-30.006z"
      />
      <path
        fill="#CB2E81"
        d="M149.976 13.384A99.999 99.999 0 0099.973 0l.016 60a40.001 40.001 0 0120.002 5.353l29.985-51.97z"
      />
    </svg>
  );
}

interface IColorPickerFieldProps {
    fieldId: number;
    fieldName: string;
    fieldTitle?: string;
    value: string;
    onChange: (value: string) => void;
    help?: string;
    config?: IFieldConfig;
    disabled?: boolean;
}

export function ColorPickerField({
    fieldId,
    fieldName,
    fieldTitle,
    value,
    onChange,
    help,
    config,
    disabled = false
}: IColorPickerFieldProps) {


    // Extract colors from config options
    const colors = useMemo(() => config?.options?.map(option => option.value) || [], [config?.options]);

    const [colorPickerColor, setColorPickerColor] = useState('#fff');
    const [isColorEnabled, setIsColorEnabled] = useState(!!value);
    const [userInteracted, setUserInteracted] = useState(false);

    // Sync checkbox state with value changes
    useEffect(() => {
        const hasColorValue = !!value && value.trim() !== '';
        setIsColorEnabled(hasColorValue);
        // Always set the color picker to the current value for proper initialization
        // This ensures both predefined colors and custom colors work correctly
        if (value) {
            setColorPickerColor(value);
            // Reset user interaction flag when value changes externally
            setUserInteracted(false);
        }
    }, [value, colors]);

    const handleColorPickerChange = (color: string) => {
        setColorPickerColor(color);

        // Only call onChange when user has actually interacted with the color picker
        // This prevents automatic RGBA conversion from overriding named colors
        if (userInteracted) {
            onChange(color);
        }
    };

    const handleColorPickerInteraction = () => {
        setUserInteracted(true);
    };

    const handleCheckboxChange = (checked: boolean) => {
        setIsColorEnabled(checked);
        if (!checked) {
            // Always send empty string when disabling color selection to overwrite any existing color
            onChange('');
        }
        // When checked, don't send any value - user will select from palette
    };

    // Map configuration color values to Mantine CSS variables
    const getMantineColor = (color: string) => {
        // Handle transparent specially
        if (color === 'transparent') {
            return 'transparent';
        }

        // Handle Mantine color shades (e.g., "red-6", "blue-3")
        if (color.includes('-')) {
            const [colorName, shade] = color.split('-');
            return `var(--mantine-color-${colorName}-${shade})`;
        }

        // Fallback for any other color values
        return color.startsWith('#') ? color : `var(--mantine-color-${color}-filled)`;
    };

    const colorSwatches = colors.map((color) => {
        // Check if the current value matches this color
        const isSelected = value === color;

        return (
            <ColorSwatch
                color={getMantineColor(color)}
                component="button"
                key={color}
                onClick={() => isColorEnabled && onChange(color)}
                radius="sm"
                className={classes.swatch}
                aria-label={color}
                style={{
                    backgroundImage: color === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : undefined,
                    backgroundSize: color === 'transparent' ? '4px 4px' : undefined,
                    backgroundColor: color === 'transparent' ? 'transparent' : undefined,
                    border: color === 'transparent' ? '1px solid #ccc' : undefined,
                    borderRadius: 'var(--mantine-radius-sm)',
                    cursor: isColorEnabled ? 'pointer' : 'not-allowed',
                    // Apply disabled styling manually to keep check icon visible
                    opacity: isColorEnabled ? 1 : 0.4,
                    filter: isColorEnabled ? 'none' : 'grayscale(50%)'
                }}
                // Keep component enabled so check icon remains visible
                disabled={false}
            >
                {isSelected && <CheckIcon className={classes.check} />}
            </ColorSwatch>
        );
    });

    // Check if current value is a custom color (not matching any predefined colors)
    const isCustomColor = value && !colors.includes(value);

    return (
        <Group gap={2} mt={2} wrap="wrap" align="center">
            <Checkbox
                checked={isColorEnabled}
                onChange={(event) => handleCheckboxChange(event.currentTarget.checked)}
                size="sm"
                disabled={disabled}
                aria-label="Enable color selection"
            />
            <div style={{
                transition: 'all 0.2s ease'
            }}>
                <Group gap={2} wrap="wrap">
                    {colorSwatches}
                    <Popover radius="md" position="bottom-end" shadow="md" disabled={!isColorEnabled}>
                        <Popover.Target>
                            <UnstyledButton
                                className={classes.colorControl}
                                aria-label="Pick custom color"
                                disabled={!isColorEnabled}
                                style={{ cursor: isColorEnabled ? 'pointer' : 'not-allowed' }}
                            >
                                {isCustomColor ? (
                                    <ColorSwatch
                                        color={value}
                                        size={18}
                                        radius="sm"
                                        style={{ border: '1px solid var(--mantine-color-gray-3)' }}
                                    />
                                ) : (
                                    <ColorWheelIcon />
                                )}
                            </UnstyledButton>
                        </Popover.Target>

                        <Popover.Dropdown p={8}>
                            <MantineColorPicker
                                value={colorPickerColor}
                                onChange={handleColorPickerChange}
                                onMouseDown={handleColorPickerInteraction}
                                format="rgba"
                            />
                            <TextInput
                                value={colorPickerColor}
                                onChange={(event) => {
                                    handleColorPickerInteraction();
                                    handleColorPickerChange(event.currentTarget.value);
                                }}
                                placeholder="Enter color"
                                radius="md"
                                size="xs"
                                mt="xs"
                            />
                        </Popover.Dropdown>
                    </Popover>
                </Group>
            </div>
        </Group>
    );
}
