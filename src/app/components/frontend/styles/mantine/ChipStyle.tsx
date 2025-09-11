import React, { useState, useEffect } from 'react';
import { Chip } from '@mantine/core';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IChipStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for ChipStyle component
 */
interface IChipStyleProps {
    style: IChipStyle;
}

/**
 * ChipStyle component renders a Mantine Chip component for selectable tags.
 * Supports various variants, sizes, and selection states.
 *
 * Form Integration Features:
 * - Configurable on/off values for form submission
 * - Proper form field naming and validation
 * - Backward compatibility with legacy chip_value field
 * - Support for required field validation
 * - Controlled component with state management
 *
 * @component
 * @param {IChipStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Chip with styled configuration
 */
const ChipStyle: React.FC<IChipStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const label = getFieldContent(style, 'label') || 'Chip';
    const variant = getFieldContent(style, 'mantine_chip_variant') || 'filled';
    const size = getFieldContent(style, 'mantine_size') || 'sm';
    const radius = getFieldContent(style, 'mantine_radius') || 'sm';
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const disabled = getFieldContent(style, 'disabled') === '1';

    // Form configuration fields (similar to checkbox)
    const name = getFieldContent(style, 'name') || `section-${style.id}`;
    const defaultValue = getFieldContent(style, 'value');
    const legacyChipValue = getFieldContent(style, 'chip_value') || '1'; // Legacy field for backward compatibility
    const onValue = getFieldContent(style, 'chip_on_value') || legacyChipValue; // Value when checked
    const offValue = getFieldContent(style, 'chip_off_value') || '0'; // Value when unchecked
    const isRequired = getFieldContent(style, 'is_required') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Initialize checked state from section_data if available (for record forms)
    const [isChecked, setIsChecked] = useState(() => {
        // Check if we have existing data from section_data (for record forms)
        const sectionDataArray: any[] | undefined = (style as any).section_data;
        const firstRecord = Array.isArray(sectionDataArray) && sectionDataArray.length > 0 ? sectionDataArray[0] : null;

        if (firstRecord && firstRecord[name]) {
            // If we have existing data, use it to determine checked state
            const existingValue = firstRecord[name];
            return existingValue === onValue || (existingValue === '1' && onValue === '1');
        }

        // Fallback to style configuration
        return getFieldContent(style, 'chip_checked') === '1';
    });

    // Update checked state when section_data changes (for record form pre-population)
    useEffect(() => {
        const sectionDataArray: any[] | undefined = (style as any).section_data;
        const firstRecord = Array.isArray(sectionDataArray) && sectionDataArray.length > 0 ? sectionDataArray[0] : null;

        if (firstRecord && firstRecord[name]) {
            const existingValue = firstRecord[name];
            const shouldBeChecked = existingValue === onValue || (existingValue === '1' && onValue === '1');
            setIsChecked(shouldBeChecked);
        }
    }, [style, name, onValue]);

    // Handle chip change
    const handleChange = (checked: boolean) => {
        setIsChecked(checked);
    };

    // Determine the current value based on checked state for form submission
    const currentValue = isChecked ? onValue : offValue;

    return (
        <>
            <Chip
                checked={isChecked}
                onChange={handleChange}
                variant={variant as any}
                size={size as any}
                radius={radius === 'none' ? 0 : radius}
                color={color}
                disabled={disabled}
                className={cssClass}
                style={styleObj}
                required={isRequired}
            >
                {label}
            </Chip>
            {/* Hidden input to ensure form submission captures the value */}
            <input
                type="hidden"
                name={name}
                value={currentValue}
            />
        </>
    );
};

export default ChipStyle;

