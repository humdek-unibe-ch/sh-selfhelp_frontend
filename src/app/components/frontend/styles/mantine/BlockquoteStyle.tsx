import React from 'react';
import { Blockquote } from '@mantine/core';
import IconComponent from '../../../shared/common/IconComponent';
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
    const content = style.content?.content || 'This is a blockquote with some quoted text content.';
    const cite = style.cite?.content;
    const iconName = style.mantine_left_icon?.content || 'icon-quote';
    const iconSize = parseInt((style as any).mantine_icon_size?.content || '20');
    const color = style.mantine_color?.content || 'gray';
    const use_mantine_style = style.use_mantine_style?.content === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Get icon component
    const icon = <IconComponent iconName={iconName} size={iconSize} />;

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

    // Return null if Mantine styling is disabled (no fallback needed)
    return null;
};

export default BlockquoteStyle;

