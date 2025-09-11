import React from 'react';
import { Kbd } from '@mantine/core';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IKbdStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for KbdStyle component
 */
interface IKbdStyleProps {
    style: IKbdStyle;
}

/**
 * KbdStyle component renders a Mantine Kbd component for keyboard key display.
 * Used to show keyboard shortcuts and key combinations.
 *
 * @component
 * @param {IKbdStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Kbd component
 */
const KbdStyle: React.FC<IKbdStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const key = getFieldContent(style, 'content') || getFieldContent(style, 'label') || 'A';
    const size = getFieldContent(style, 'mantine_size') || 'sm';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    if (use_mantine_style) {
        return (
            <Kbd size={size as any} className={cssClass} style={styleObj}>
                {key}
            </Kbd>
        );
    }

    // Fallback to basic styled span when Mantine styling is disabled
    return (
        <span
            className={cssClass}
            style={{
                ...styleObj,
                display: 'inline-block',
                padding: '2px 6px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '3px',
                fontSize: size === 'xs' ? '0.75rem' : size === 'lg' ? '1rem' : '0.875rem',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                color: '#333',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
        >
            {key}
        </span>
    );
};

export default KbdStyle;

