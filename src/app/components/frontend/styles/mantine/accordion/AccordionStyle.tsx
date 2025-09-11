import React from 'react';
import { Accordion } from '@mantine/core';
import BasicStyle from '../../BasicStyle';
import { getFieldContent } from '../../../../../../utils/style-field-extractor';
import { IAccordionStyle } from '../../../../../../types/common/styles.types';

/**
 * Props interface for AccordionStyle component
 */
interface IAccordionStyleProps {
    style: IAccordionStyle;
}

/**
 * AccordionStyle component renders a Mantine Accordion component for collapsible content.
 * Supports multiple selection and various variants.
 *
 * @component
 * @param {IAccordionStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Accordion with child accordion items
 */
const AccordionStyle: React.FC<IAccordionStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const variant = getFieldContent(style, 'mantine_accordion_variant') || 'default';
    const multiple = getFieldContent(style, 'mantine_accordion_multiple') === '1';
    const chevronPosition = getFieldContent(style, 'mantine_accordion_chevron_position') || 'left';
    const chevronSize = parseInt(getFieldContent(style, 'mantine_accordion_chevron_size') || '16');
    const disableChevronRotation = getFieldContent(style, 'mantine_accordion_disable_chevron_rotation') === '1';
    const loop = getFieldContent(style, 'mantine_accordion_loop') !== '0'; // Default to true
    const transitionDuration = parseInt(getFieldContent(style, 'mantine_accordion_transition_duration') || '200');
    const defaultValue = getFieldContent(style, 'mantine_accordion_default_value');
    const radius = getFieldContent(style, 'mantine_radius') || 'sm';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Parse defaultValue for multiple items
    const parsedDefaultValue = defaultValue
        ? multiple
            ? defaultValue.split(',').map(v => v.trim()).filter(v => v.length > 0)
            : defaultValue.trim()
        : undefined;

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};


    if (use_mantine_style) {
        return (
            <Accordion
                variant={variant as 'default' | 'contained' | 'filled' | 'separated'}
                multiple={multiple}
                chevronPosition={chevronPosition as 'left' | 'right'}
                chevronIconSize={chevronSize}
                disableChevronRotation={disableChevronRotation}
                loop={loop}
                transitionDuration={transitionDuration}
                defaultValue={parsedDefaultValue}
                radius={radius === 'none' ? 0 : radius}
                className={cssClass}
                style={styleObj}
            >
                {children.map((child: any, index: number) => (
                    child ? <BasicStyle key={index} style={child} /> : null
                ))}
            </Accordion>
        );
    }

    // Return null if Mantine styling is disabled (no fallback needed)
    return null;
};

export default AccordionStyle;

