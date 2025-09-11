import React from 'react';
import { Blockquote } from '@mantine/core';
import IconComponent from '../../../shared/common/IconComponent';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IBlockquoteStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for BlockquoteStyle component
 */
interface IBlockquoteStyleProps {
    style: IBlockquoteStyle;
}

/**
 * BlockquoteStyle component renders a Mantine Blockquote component for quoted text.
 * Supports citation and optional icons.
 *
 * @component
 * @param {IBlockquoteStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Blockquote with styled configuration
 */
const BlockquoteStyle: React.FC<IBlockquoteStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const content = getFieldContent(style, 'content') || getFieldContent(style, 'text') || 'This is a blockquote with some quoted text content.';
    const cite = getFieldContent(style, 'cite');
    const iconName = getFieldContent(style, 'mantine_left_icon') || 'icon-quote';
    const color = getFieldContent(style, 'mantine_color') || 'gray';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Get icon component
    const icon = <IconComponent iconName={iconName} size={20} />;

    if (use_mantine_style) {
        return (
            <Blockquote
                cite={cite}
                icon={icon}
                color={color}
                className={cssClass}
                style={styleObj}
            >
                {content}
            </Blockquote>
        );
    }

    // Fallback to basic styled blockquote when Mantine styling is disabled
    return (
        <blockquote
            className={cssClass}
            style={{
                ...styleObj,
                borderLeft: `4px solid ${color}`,
                paddingLeft: '16px',
                margin: '16px 0',
                fontStyle: 'italic',
                color: '#666',
                position: 'relative'
            }}
        >
            {icon && (
                <div style={{
                    position: 'absolute',
                    top: '-8px',
                    left: '-12px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    padding: '4px'
                }}>
                    {icon}
                </div>
            )}
            <p style={{ margin: '8px 0' }}>
                {content}
            </p>
            {cite && (
                <footer style={{
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    color: '#333',
                    marginTop: '8px'
                }}>
                    — {cite}
                </footer>
            )}
        </blockquote>
    );
};

export default BlockquoteStyle;

