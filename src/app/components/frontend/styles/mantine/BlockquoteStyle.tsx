/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Blockquote } from '@mantine/core';
import IconComponent from '../../../shared/common/IconComponent';
import { type IBlockquoteStyle } from '../../../../../types/common/styles.types';
import { renderRichInline } from '../../../../../utils/html-sanitizer.utils';

/**
 * Props interface for BlockquoteStyle component
 */
/**
 * Props interface for IBlockquoteStyle component
 */
interface IBlockquoteStyleProps {
    style: IBlockquoteStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

/**
 * BlockquoteStyle component renders a Mantine Blockquote component for quoted text.
 * Supports citation and optional icons.
 *
 * @component
 * @param {IBlockquoteStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Blockquote with styled configuration
 */
const BlockquoteStyle: React.FC<IBlockquoteStyleProps> = ({ style, styleProps, cssClass }) => {
    // Dedicated markdown-inline field — render the safe inline subset (bold /
    // italic / underline / links) the author applied instead of stripping it.
    const content = renderRichInline(
        style.blockquote_content?.content || 'This is a blockquote with some quoted text content.'
    );
    const cite = style.cite?.content;
    const iconName = style.web_left_icon?.content || 'icon-quote';
    const iconSize = parseInt(style.web_icon_size?.content || '20');
    const color = style.shared_color?.content || 'gray';
    // Handle CSS field - use direct property from API response
    

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Get icon component
    const icon = <IconComponent iconName={iconName} size={iconSize} />;

    return (
        <Blockquote
            cite={cite}
            icon={icon}
            color={color}
            {...styleProps} className={cssClass}
            style={styleObj}
        >
            {content}
        </Blockquote>
    );
};

export default BlockquoteStyle;

