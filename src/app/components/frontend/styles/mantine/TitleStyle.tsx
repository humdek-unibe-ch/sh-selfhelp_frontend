import React from 'react';
import { Title } from '@mantine/core';
import { ITitleStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for TitleStyle component
 */
/**
 * Props interface for ITitleStyle component
 */
interface ITitleStyleProps {
    style: ITitleStyle;
    styleProps: Record<string, any>;
    cssClass: string;
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
const TitleStyle: React.FC<ITitleStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract field values using the new unified field structure
    const title = style.content?.content || 'Title';
    const order = (style.mantine_title_order?.content || 1) as 1 | 2 | 3 | 4 | 5 | 6;
    const size = style.mantine_size?.content || 'lg';
    const textWrap = style.mantine_title_text_wrap?.content as 'wrap' | 'balance' | 'nowrap' | undefined;
    const lineClamp = style.mantine_title_line_clamp?.content;

    // Handle CSS field - use direct property from API response
    

    return (
        <Title
            order={order}
            size={size as any}
            textWrap={textWrap}
            lineClamp={lineClamp ? parseInt(lineClamp) : undefined}
            // inherit={inherit}
            {...styleProps} className={cssClass}
        >
            {title}
        </Title>
    );

};

export default TitleStyle;

