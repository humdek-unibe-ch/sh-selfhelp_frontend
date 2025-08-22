import React from 'react';
import { Select, MultiSelect } from '@mantine/core';
import { ISelectStyle } from '../../../../types/common/styles.types';

/**
 * Props interface for SelectStyle component
 */
interface ISelectStyleProps {
    style: ISelectStyle;
}

/**
 * SelectStyle component renders a dropdown selection field
 * Supports single and multiple selection, live search, image selection
 * Uses Mantine UI components for consistency
 */
const SelectStyle: React.FC<ISelectStyleProps> = ({ style }) => {
    const label = style.label?.content;
    const placeholder = style.alt?.content || 'Select an option';
    const name = style.name?.content;
    const value = style.value?.content;
    const required = style.is_required?.content === '1';
    const isMultiple = style.is_multiple?.content === '1';
    const searchable = style.live_search?.content === '1';
    const disabled = style.disabled?.content === '1';
    const clearable = style.allow_clear?.content === '1';
    const locked = style.locked_after_submit?.content === '1';
    const maxValues = style.max?.content ? parseInt(style.max.content) : undefined;

    // Parse items - handle both array and JSON string formats
    let itemsArray: any[] = [];
    try {
        const itemsContent = style.items?.content;
        if (Array.isArray(itemsContent)) {
            itemsArray = itemsContent;
        } else if (itemsContent && typeof itemsContent === 'string') {
            const stringContent = itemsContent as string;
            if (stringContent.trim()) {
                itemsArray = JSON.parse(stringContent);
            }
        }
    } catch (error) {

        itemsArray = [];
    }

    // Transform items from the database format to Mantine format
    const items = itemsArray.map((item: any) => ({
        value: item.value,
        label: item.text,
        image: style.image_selector?.content === '1' ? item.text : undefined,
    }));

    const commonProps = {
        label,
        placeholder,
        name,
        required,
        disabled: disabled || locked,
        searchable,
        clearable,
        className: style.css || '',
        size: 'md' as const,
        data: items,
    };

    if (isMultiple) {
        return (
            <MultiSelect
                {...commonProps}
                defaultValue={value ? value.split(',') : undefined}
                maxValues={maxValues}
            />
        );
    }

    return (
        <Select
            {...commonProps}
            defaultValue={value}
        />
    );
};

export default SelectStyle; 