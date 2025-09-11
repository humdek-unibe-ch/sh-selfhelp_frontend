import React from 'react';
import { Accordion } from '@mantine/core';
import { getFieldContent } from '../../../../../../utils/style-field-extractor';
import IconComponent from '../../../../shared/common/IconComponent';
import { IAccordionItemStyle } from '../../../../../../types/common/styles.types';
import BasicStyle from '../../BasicStyle';

/**
 * Props interface for AccordionItemStyle component
 */
interface IAccordionItemStyleProps {
    style: IAccordionItemStyle;
}

/**
 * AccordionItemStyle component renders a Mantine Accordion.Item component for individual accordion items.
 * Can contain child components and supports custom labels.
 *
 * @component
 * @param {IAccordionItemStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Accordion.Item with child content
 */
const AccordionItemStyle: React.FC<IAccordionItemStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const itemValue = getFieldContent(style, 'mantine_accordion_item_value') || `section-${style.id}`;
    const label = getFieldContent(style, 'label') || `Item ${style.id}`;
    const iconName = getFieldContent(style, 'mantine_accordion_item_icon');
    const disabled = getFieldContent(style, 'disabled') === '1';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Get icon component using IconComponent
    const icon = iconName ? <IconComponent iconName={iconName} size={16} /> : undefined;

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Use custom value if provided, otherwise use style ID
    const value = itemValue;

    if (use_mantine_style) {
        return (
            <Accordion.Item
                value={value}
                className={cssClass}
                style={styleObj}
            >
                <Accordion.Control icon={icon} disabled={disabled}>
                    {label}
                </Accordion.Control>
                <Accordion.Panel>
                    {children.map((child: any, index: number) => (
                        child ? <BasicStyle key={index} style={child} /> : null
                    ))}
                </Accordion.Panel>
            </Accordion.Item>
        );
    }

    // Return null if Mantine styling is disabled (no fallback needed)
    return null;
};

export default AccordionItemStyle;
