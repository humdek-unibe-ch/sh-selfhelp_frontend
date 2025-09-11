import React from 'react';
import { SegmentedControl } from '@mantine/core';
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
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

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

    if (use_mantine_style) {
        return (
            <SegmentedControl
                data={controlData}
                orientation={orientation as 'horizontal' | 'vertical'}
                size={size as any}
                radius={radius}
                color={color}
                fullWidth={fullWidth}
                disabled={disabled}
                className={cssClass}
                style={styleObj}
            />
        );
    }

    // Fallback to basic select when Mantine styling is disabled
    return (
        <select
            className={cssClass}
            disabled={disabled}
            style={{
                ...styleObj,
                width: fullWidth ? '100%' : 'auto'
            }}
        >
            {controlData.map((option, index) => (
                <option key={index} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
};

export default SegmentedControlStyle;

