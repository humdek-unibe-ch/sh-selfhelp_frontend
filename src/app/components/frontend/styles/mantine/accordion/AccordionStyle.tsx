/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Accordion } from '@mantine/core';
import BasicStyle from '../../BasicStyle';
import { type IAccordionStyle } from '../../../../../../types/common/styles.types';

/**
 * Props interface for AccordionStyle component
 */
/**
 * Props interface for IAccordionStyle component
 */
interface IAccordionStyleProps {
    style: IAccordionStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

/**
 * AccordionStyle component renders a Mantine Accordion component for collapsible content.
 * Supports multiple selection and various variants.
 *
 * @component
 * @param {IAccordionStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Accordion with child accordion items
 */
const AccordionStyle: React.FC<IAccordionStyleProps> = ({ style, styleProps, cssClass }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const variant = style.accordion_variant?.content || 'default';
    const multiple = style.multiple?.content === '1';
    const chevronPosition = style.web_accordion_chevron_position?.content || 'left';
    const chevronSize = parseInt(style.web_accordion_chevron_size?.content || '16');
    const disableChevronRotation = style.web_accordion_disable_chevron_rotation?.content === '1';
    const loop = style.web_accordion_loop?.content !== '0'; // Default to true
    const transitionDuration = parseInt(style.web_accordion_transition_duration?.content || '200');
    const defaultValue = style.web_accordion_default_value?.content;
    const radius = style.radius?.content || 'sm';
    // Parse defaultValue for multiple items
    const parsedDefaultValue = defaultValue
        ? multiple
            ? defaultValue.split(',').map(v => v.trim()).filter(v => v.length > 0)
            : defaultValue.trim()
        : undefined;

    // Handle CSS field - use direct property from API response
    

    // Build style object
    const styleObj: React.CSSProperties = {};


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
                {...styleProps} className={cssClass}
                style={styleObj}
            >
                {children.map((child, index: number) => (
                    child ? <BasicStyle key={index} style={child} /> : null
                ))}
            </Accordion>
        );
};

export default AccordionStyle;

