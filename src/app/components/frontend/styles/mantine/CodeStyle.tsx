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

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Get code content from any available field
    const codeContent = getFieldContent(style, 'content') || '';

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
};

export default CodeStyle;
