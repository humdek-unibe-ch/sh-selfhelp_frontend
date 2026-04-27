import React, { useState, useEffect, useContext } from 'react';
import { Chip, Tooltip } from '@mantine/core';
import { IChipStyle } from '../../../../../../types/common/styles.types';
import IconComponent from '../../../../shared/common/IconComponent';
import { FormFieldValueContext } from '../../FormStyle';
import DOMPurify from 'isomorphic-dompurify';
import parse from "html-react-parser";
/**
 * Props interface for ChipStyle component
 */
/**
 * Props interface for IChipStyle component
 */
interface IChipStyleProps {
    style: IChipStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

/**
 * ChipStyle component renders a Mantine Chip component for selectable tags.
 * Supports various variants, sizes, and selection states.
 *
 * Form Integration Features:
 * - Configurable on/off values for form submission
 * - Proper form field naming and validation
 * - Support for required field validation
 * - Controlled component with state management
 * - Optional tooltip support that appears on hover with configurable position
 *
 * @component
 * @param {IChipStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Chip with styled configuration
 */
const ChipStyle: React.FC<IChipStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract field values using the new unified field structure
    const label = style.label?.content || 'Chip';
    const variant = style.mantine_chip_variant?.content || 'filled';
    const size = style.mantine_size?.content || 'sm';
    const radius = style.mantine_radius?.content || 'sm';
    const color = style.mantine_color?.content || 'blue';
    const disabled = style.disabled?.content === '1';

    // Form configuration fields (similar to checkbox)
    const name = style.name?.content || `section-${style.id}`;
    const onValue = style.chip_on_value?.content || '1'; // Value when checked
    const offValue = style.chip_off_value?.content || '0'; // Value when unchecked
    const isRequired = style.is_required?.content === '1';

    // Tooltip fields
    const tooltip = style.tooltip?.content;
    const tooltipPosition = style.mantine_tooltip_position?.content || 'top';

    // Validate tooltip position to ensure it's a valid Mantine position
    const validPositions = ['top', 'bottom', 'left', 'right', 'top-start', 'top-end', 'bottom-start', 'bottom-end', 'left-start', 'left-end', 'right-start', 'right-end'];
    const safeTooltipPosition = validPositions.includes(tooltipPosition) ? tooltipPosition : 'top';

    // Icon field configuration
    const iconName = style.mantine_left_icon?.content;
    const iconSize = parseInt(style.mantine_icon_size?.content || '16');

    const chipIcon = iconName ? <IconComponent iconName={iconName} size={iconSize} /> : null;


    // Handle CSS field - use direct property from API response
    

    // Get form context for pre-populated values
    const formContext = useContext(FormFieldValueContext);
    const formValue = formContext && name ? formContext.getFieldValue(name) : null;

    // Initialize checked state from form context or style configuration
    const [isChecked, setIsChecked] = useState(() => {
        if (formValue !== null) {
            // Use form value if available
            return formValue === onValue || (formValue === '1' && onValue === '1');
        }
        // Fallback to style configuration
        return style.chip_checked?.content === '1';
    });

    // Update checked state when form context changes (for record editing)
    useEffect(() => {
        if (formValue !== null) {
            const shouldBeChecked = formValue === onValue || (formValue === '1' && onValue === '1');
            setIsChecked(shouldBeChecked);
        }
    }, [formValue, onValue]);

    // Handle chip change
    const handleChange = (checked: boolean) => {
        setIsChecked(checked);
    };

    // Determine the current value based on checked state for form submission
    const currentValue = isChecked ? onValue : offValue;

    // Render chip with optional tooltip
    const chipElement = (
        <Chip
            checked={isChecked}
            onChange={handleChange}
            variant={variant as any}
            size={size as any}
            radius={radius === 'none' ? 0 : radius}
            color={color}
            disabled={disabled}
            {...styleProps} className={cssClass}
            required={isRequired}
            icon={chipIcon}
        >
            {label}
        </Chip>
    );

    return (
        <>
            {tooltip && tooltip.trim() ? (
                <Tooltip
                    label={parse(DOMPurify.sanitize(tooltip))}
                    position={safeTooltipPosition as any}
                    refProp="rootRef"
                >
                    {chipElement}
                </Tooltip>
            ) : (
                chipElement
            )}
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

