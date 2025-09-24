import React from 'react';
import { Code } from '@mantine/core';
import { ICodeStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for CodeStyle component
 */
/**
 * Props interface for ICodeStyle component
 */
interface ICodeStyleProps {
    style: ICodeStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

/**
 * CodeStyle component renders a Mantine Code component for displaying code snippets.
 * Supports block or inline display with customizable colors.
 *
 * @component
 * @param {ICodeStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Code with styled configuration
 */
const CodeStyle: React.FC<ICodeStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract field values using the new unified field structure
    const codeBlock = style.mantine_code_block?.content === '1';
    const color = style.mantine_color?.content || 'blue';

    // Handle CSS field - use direct property from API response
    

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Get code content from any available field
    const codeContent = style.content?.content || '';

    if (codeBlock) {
        return (
            <Code
                block
                color={color}
                {...styleProps} className={cssClass}
                style={styleObj}
            >
                {codeContent}
            </Code>
        );
    } else {
        return (
            <Code
                color={color}
                {...styleProps} className={cssClass}
                style={styleObj}
            >
                {codeContent}
            </Code>
        );
    }
};

export default CodeStyle;
