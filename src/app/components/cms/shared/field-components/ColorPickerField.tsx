'use client';

import React, { useState, useEffect } from 'react';
import { ColorSwatch, Group, CheckIcon, SimpleGrid, ActionIcon, Popover, ColorPicker as MantineColorPicker, Text, Box } from '@mantine/core';
import { IconColorPicker } from '@tabler/icons-react';
import type { IFieldConfig } from '../../../../../types/requests/admin/fields.types';

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
    const [selected, setSelected] = useState<string>(value || '');
    const [customPickerOpened, setCustomPickerOpened] = useState(false);

    // Extract colors from config options
    const colors = config?.options?.map(option => option.value) || [];

    // Check if the current value is a hex color or a predefined color
    const isHexColor = selected && selected.startsWith('#');
    const isPredefinedColor = selected && colors.includes(selected);

    // Sync selected state with value prop
    useEffect(() => {
        if (value && value !== selected) {
            setSelected(value);
        }
    }, [value, selected]);

    const handleColorSelect = (color: string) => {
        setSelected(color);
        onChange(color);
    };

    const handleCustomColorSelect = (color: string) => {
        setSelected(color);
        onChange(color);
        setCustomPickerOpened(false);
    };

    return (
        <SimpleGrid cols={7} spacing="xs">
            {colors.map((color) => (
                <ColorSwatch
                    key={color}
                    color={color}
                    radius="sm"
                    onClick={() => !disabled && handleColorSelect(color)}
                    style={{
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.5 : 1
                    }}
                >
                    {selected === color && <CheckIcon size={16} color="white" />}
                </ColorSwatch>
            ))}

            {/* Custom color picker button */}
            <Popover
                opened={customPickerOpened}
                onChange={setCustomPickerOpened}
                position="bottom"
                withArrow
                shadow="md"
            >
                <Popover.Target>
                    <ActionIcon
                        variant={isHexColor ? "filled" : "default"}
                        color={isHexColor ? selected : undefined}
                        radius="sm"
                        size="lg"
                        onClick={() => !disabled && setCustomPickerOpened(true)}
                        disabled={disabled}
                        style={{
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            opacity: disabled ? 0.5 : 1,
                            border: isHexColor ? `2px solid ${selected}` : undefined
                        }}
                    >
                        <IconColorPicker size={18} />
                    </ActionIcon>
                </Popover.Target>

                <Popover.Dropdown>
                    <MantineColorPicker
                        value={selected.startsWith('#') ? selected : '#4c6ef5'}
                        onChange={handleCustomColorSelect}
                        format="hex"
                        swatches={colors}
                    />
                </Popover.Dropdown>
            </Popover>
        </SimpleGrid>
    );
}
