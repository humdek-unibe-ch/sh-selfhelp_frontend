import React from 'react';
import { Title } from '@mantine/core';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { ITitleStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for TitleStyle component
 */
interface ITitleStyleProps {
    style: ITitleStyle;
}

/**
 * TitleStyle component renders a Mantine Title component for headings and titles.
 * Supports different heading levels (H1-H6), customizable size, text wrapping,
 * line clamping, and style inheritance. Follows Mantine Title API.
 *
 * @component
 * @param {ITitleStyleProps} props - Component props
 * @returns {JSX.Element | null} Rendered Mantine Title or null when styling is disabled
 */
const TitleStyle: React.FC<ITitleStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const title = getFieldContent(style, 'content') || getFieldContent(style, 'label') || getFieldContent(style, 'title') || 'Title';
    const order = parseInt(getFieldContent(style, 'mantine_title_order') || '1') as 1 | 2 | 3 | 4 | 5 | 6;
    const size = getFieldContent(style, 'mantine_size') || 'lg';
    const textWrap = getFieldContent(style, 'mantine_title_text_wrap') as 'wrap' | 'balance' | 'nowrap' | undefined;
    const lineClamp = getFieldContent(style, 'mantine_title_line_clamp');

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    return (
        <Title
            order={order}
            size={size as any}
            textWrap={textWrap}
            lineClamp={lineClamp ? parseInt(lineClamp) : undefined}
            // inherit={inherit}
            className={cssClass}
        >
            {title}
        </Title>
    );

};

export default TitleStyle;

