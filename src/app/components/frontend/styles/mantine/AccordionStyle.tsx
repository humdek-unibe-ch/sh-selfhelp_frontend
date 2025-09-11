import React from 'react';
import { Accordion } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IAccordionStyle } from '../../../../../types/common/styles.types';

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
    const radius = getFieldContent(style, 'mantine_radius') || 'sm';
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    if (use_mantine_style) {
        return (
            <Accordion
                variant={variant as 'default' | 'contained' | 'filled' | 'separated'}
                multiple={multiple}
                radius={radius}
                className={cssClass}
                style={styleObj}
            >
                {children.map((child: any, index: number) => (
                    child ? <BasicStyle key={index} style={child} /> : null
                ))}
            </Accordion>
        );
    }

    // Fallback to basic accordion structure when Mantine styling is disabled
    return (
        <div className={cssClass} style={{ ...styleObj }}>
            {children.map((child: any, index: number) => (
                child ? <BasicStyle key={index} style={child} /> : null
            ))}

            {/* If no children, show a sample accordion */}
            {children.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Accordion</h3>
                    <p>Add Accordion.Item components as children to display collapsible content.</p>
                </div>
            )}
        </div>
    );
};

export default AccordionStyle;

