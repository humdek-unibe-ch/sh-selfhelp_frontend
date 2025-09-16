import React from 'react';
import { SegmentedControl, Input } from '@mantine/core';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { ISegmentedControlStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for SegmentedControlStyle component
 */
interface ISegmentedControlStyleProps {
    style: ISegmentedControlStyle;
}

/**
 * SegmentedControlStyle component renders a Mantine SegmentedControl component.
 * Supports horizontal/vertical orientation and multiple options from JSON data.
 *
 * @component
 * @param {ISegmentedControlStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine SegmentedControl with styled configuration
 */
const SegmentedControlStyle: React.FC<ISegmentedControlStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const orientation = getFieldContent(style, 'mantine_orientation') || 'horizontal';
    const size = getFieldContent(style, 'mantine_size') || 'sm';
    const radius = getFieldContent(style, 'mantine_radius') || 'sm';
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const fullWidth = getFieldContent(style, 'fullwidth') === '1';
    const disabled = getFieldContent(style, 'disabled') === '1';
    const readonly = getFieldContent(style, 'readonly') === '1';
    const name = getFieldContent(style, 'name');
    const label = getFieldContent(style, 'label');
    const description = getFieldContent(style, 'description');
    const defaultValue = getFieldContent(style, 'value');
    const itemBorder = getFieldContent(style, 'mantine_segmented_control_item_border') === '1';
    const isRequired = getFieldContent(style, 'is_required') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Parse segmented control data from JSON textarea
    let controlData: Array<{ value: string; label: string }> = [];
    try {
        const dataJson = getFieldContent(style, 'mantine_segmented_control_data');
        if (dataJson) {
            controlData = JSON.parse(dataJson);
        } else {
            // Default data if none provided
            controlData = [
                { value: 'option1', label: 'Option 1' },
                { value: 'option2', label: 'Option 2' },
                { value: 'option3', label: 'Option 3' }
            ];
        }
    } catch (error) {
        console.warn('Invalid JSON in mantine_segmented_control_data:', error);
        controlData = [];
    }

    // Create SegmentedControl component
    const segmentedControl = (
        <SegmentedControl
            data={controlData}
            orientation={orientation as 'horizontal' | 'vertical'}
            size={size as any}
            radius={radius === 'none' ? 0 : radius}
            color={color}
            fullWidth={fullWidth}
            disabled={disabled}
            readOnly={readonly}
            className={cssClass}
            style={styleObj}
            name={name}
            defaultValue={defaultValue}
            withItemsBorders={itemBorder}
        />
    );

    // Wrap with Input.Wrapper if label or description are provided
    if (label || description) {
        return (
            <Input.Wrapper
                label={label}
                description={description}
                required={isRequired}
                className={cssClass}
            >
                {segmentedControl}
            </Input.Wrapper>
        );
    }

    return segmentedControl;
};

export default SegmentedControlStyle;

