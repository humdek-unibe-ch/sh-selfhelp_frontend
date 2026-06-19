/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Code } from '@mantine/core';
import { type ICodeStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for CodeStyle component
 */
/**
 * Props interface for ICodeStyle component
 */
interface ICodeStyleProps {
    style: ICodeStyle;
    styleProps: Record<string, string>;
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
    const codeBlock = style.code_block?.content === '1';
    const color = style.shared_color?.content || undefined;
    const radiusToken = style.shared_radius?.content;

    // Build style object — map the shared radius token onto the block corners.
    const styleObj: React.CSSProperties = {};
    if (radiusToken) {
        styleObj.borderRadius =
            radiusToken === 'none' ? 0 : radiusToken === 'full' ? '9999px' : `var(--mantine-radius-${radiusToken})`;
    }

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
