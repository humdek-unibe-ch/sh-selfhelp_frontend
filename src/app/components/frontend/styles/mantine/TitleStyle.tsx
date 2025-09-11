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
 * Supports different heading levels (H1-H6) with customizable size and styling.
 *
 * @component
 * @param {ITitleStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Title with styled configuration
 */
const TitleStyle: React.FC<ITitleStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const title = getFieldContent(style, 'content') || getFieldContent(style, 'label') || getFieldContent(style, 'title') || 'Title';
    const order = parseInt(getFieldContent(style, 'mantine_title_order') || '1') as 1 | 2 | 3 | 4 | 5 | 6;
    const size = getFieldContent(style, 'mantine_size') || 'lg';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    if (use_mantine_style) {
        return (
            <Title
                order={order}
                size={size as any}
                className={cssClass}
                style={styleObj}
            >
                {title}
            </Title>
        );
    }

    // Fallback to semantic heading elements when Mantine styling is disabled
    const HeadingTag = `h${order}` as keyof JSX.IntrinsicElements;

    return (
        <HeadingTag
            className={cssClass}
            style={{
                ...styleObj,
                fontSize: size === 'xs' ? '1rem' : size === 'sm' ? '1.25rem' : size === 'lg' ? '2rem' : size === 'xl' ? '2.5rem' : '1.5rem',
                fontWeight: 'bold',
                margin: '0',
                lineHeight: '1.2'
            }}
        >
            {title}
        </HeadingTag>
    );
};

export default TitleStyle;

