import React from 'react';
import { Code } from '@mantine/core';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { ICodeStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for CodeStyle component
 */
interface ICodeStyleProps {
    style: ICodeStyle;
}

/**
 * CodeStyle component renders a Mantine Code component for displaying code snippets.
 * Supports block or inline display with customizable colors.
 *
 * @component
 * @param {ICodeStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Code with styled configuration
 */
const CodeStyle: React.FC<ICodeStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const codeBlock = getFieldContent(style, 'mantine_code_block') === '1';
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Get code content from any available field
    const codeContent = getFieldContent(style, 'text') ||
                       getFieldContent(style, 'content') ||
                       getFieldContent(style, 'code') ||
                       'console.log("Hello, World!");';

    if (use_mantine_style) {
        if (codeBlock) {
            return (
                <Code
                    block
                    color={color}
                    className={cssClass}
                    style={styleObj}
                >
                    {codeContent}
                </Code>
            );
        } else {
            return (
                <Code
                    color={color}
                    className={cssClass}
                    style={styleObj}
                >
                    {codeContent}
                </Code>
            );
        }
    }

    // Fallback to basic pre/code elements when Mantine styling is disabled
    if (codeBlock) {
        return (
            <pre className={cssClass} style={{
                ...styleObj,
                backgroundColor: '#f5f5f5',
                padding: '16px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                overflow: 'auto'
            }}>
                <code>{codeContent}</code>
            </pre>
        );
    } else {
        return (
            <code
                className={cssClass}
                style={{
                    ...styleObj,
                    backgroundColor: '#f5f5f5',
                    padding: '2px 4px',
                    borderRadius: '3px',
                    fontFamily: 'monospace',
                    fontSize: '0.875em'
                }}
            >
                {codeContent}
            </code>
        );
    }
};

export default CodeStyle;
