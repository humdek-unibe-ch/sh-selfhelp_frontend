import React from 'react';
import { Fieldset } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IFieldsetStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for FieldsetStyle component
 */
interface IFieldsetStyleProps {
    style: IFieldsetStyle;
}

/**
 * FieldsetStyle component renders a Mantine Fieldset component for grouping form elements.
 * Provides legend and grouped content functionality.
 *
 * @component
 * @param {IFieldsetStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Fieldset with child content
 */
const FieldsetStyle: React.FC<IFieldsetStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const legend = getFieldContent(style, 'legend');
    const variant = getFieldContent(style, 'mantine_fieldset_variant') || 'default';
    const radius = getFieldContent(style, 'mantine_radius') || 'sm';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    if (use_mantine_style) {
        return (
            <Fieldset
                legend={legend}
                variant={variant as 'default' | 'filled'}
                radius={radius === 'none' ? 0 : radius}
                className={cssClass}
                style={styleObj}
            >
                {children.map((child: any, index: number) => (
                    child ? <BasicStyle key={index} style={child} /> : null
                ))}
            </Fieldset>
        );
    }

    // Fallback to basic styled fieldset when Mantine styling is disabled
    return (
        <fieldset
            className={cssClass}
            style={{
                ...styleObj,
                border: variant === 'filled' ? 'none' : '1px solid #ddd',
                borderRadius: radius === 'xs' ? '2px' : radius === 'sm' ? '4px' : radius === 'lg' ? '8px' : radius === 'xl' ? '12px' : '6px',
                padding: '16px',
                margin: '16px 0',
                backgroundColor: variant === 'filled' ? '#f8f9fa' : 'transparent'
            }}
        >
            {legend && (
                <legend style={{
                    padding: '0 8px',
                    fontWeight: 'bold',
                    color: '#333',
                    backgroundColor: 'white',
                    borderRadius: '2px'
                }}>
                    {legend}
                </legend>
            )}
            <div style={{ marginTop: legend ? '8px' : '0' }}>
                {children.map((child: any, index: number) => (
                    child ? <BasicStyle key={index} style={child} /> : null
                ))}
            </div>
        </fieldset>
    );
};

export default FieldsetStyle;

