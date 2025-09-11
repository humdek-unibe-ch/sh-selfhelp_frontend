import React from 'react';
import { Accordion } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IAccordionItemStyle } from '../../../../../types/common/styles.types';

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
    const label = getFieldContent(style, 'label') || `Item ${style.id}`;
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Use style ID as the accordion value
    const value = style.id.toString();

    if (use_mantine_style) {
        return (
            <Accordion.Item
                value={value}
                className={cssClass}
                style={styleObj}
            >
                <Accordion.Control>{label}</Accordion.Control>
                <Accordion.Panel>
                    {children.map((child: any, index: number) => (
                        child ? <BasicStyle key={index} style={child} /> : null
                    ))}
                </Accordion.Panel>
            </Accordion.Item>
        );
    }

    // Fallback to basic collapsible structure when Mantine styling is disabled
    return (
        <div className={cssClass} style={{ ...styleObj, border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px' }}>
            <button
                style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    borderRadius: '4px 4px 0 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
                onClick={() => {
                    const content = document.querySelector(`.accordion-content-${style.id}`) as HTMLElement;
                    if (content) {
                        content.style.display = content.style.display === 'none' ? 'block' : 'none';
                    }
                }}
            >
                {label}
                <span style={{ fontSize: '1.2rem' }}>▼</span>
            </button>
            <div
                className={`accordion-content-${style.id}`}
                style={{
                    padding: '16px',
                    borderTop: '1px solid #eee',
                    display: 'block' // Default to open
                }}
            >
                {children.map((child: any, index: number) => (
                    child ? <BasicStyle key={index} style={child} /> : null
                ))}
            </div>
        </div>
    );
};

export default AccordionItemStyle;
