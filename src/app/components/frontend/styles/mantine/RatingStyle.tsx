import React from 'react';
import { Rating } from '@mantine/core';
import { getFieldContent, castMantineSize } from '../../../../../utils/style-field-extractor';
import { IRatingStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for RatingStyle component
 */
interface IRatingStyleProps {
    style: IRatingStyle;
}

/**
 * RatingStyle component renders a Mantine Rating component for star ratings.
 * Supports customizable count, fractions, and read-only mode.
 *
 * @component
 * @param {IRatingStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Rating with styled configuration
 */
const RatingStyle: React.FC<IRatingStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const count = parseInt(getFieldContent(style, 'mantine_rating_count') || '5') as 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    const fractions = parseInt(getFieldContent(style, 'mantine_rating_fractions') || '1') as 1 | 2 | 3 | 4 | 5;
    const readonly = getFieldContent(style, 'mantine_rating_readonly') === '1';
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const color = getFieldContent(style, 'mantine_color') || 'yellow';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    if (use_mantine_style) {
        return (
            <Rating
                count={count}
                fractions={fractions}
                readOnly={readonly}
                size={size}
                color={color}
                className={cssClass}
                style={styleObj}
            />
        );
    }

    // Fallback to basic star rating when Mantine styling is disabled
    return (
        <div className={cssClass} style={{ ...styleObj, display: 'inline-flex', gap: '2px' }}>
            {Array.from({ length: count }, (_, index) => (
                <span
                    key={index}
                    style={{
                        fontSize: size === 'xs' ? '16px' : size === 'sm' ? '20px' : size === 'lg' ? '28px' : size === 'xl' ? '32px' : '24px',
                        color: readonly ? color : '#ddd',
                        cursor: readonly ? 'default' : 'pointer',
                        transition: 'color 0.2s ease'
                    }}
                    onClick={!readonly ? () => console.log(`Rated: ${index + 1}`) : undefined}
                    onMouseEnter={!readonly ? (e) => {
                        e.currentTarget.style.color = color;
                        // Highlight all previous stars
                        const stars = e.currentTarget.parentElement?.children;
                        if (stars) {
                            for (let i = 0; i <= index; i++) {
                                (stars[i] as HTMLElement).style.color = color;
                            }
                        }
                    } : undefined}
                    onMouseLeave={!readonly ? (e) => {
                        const stars = e.currentTarget.parentElement?.children;
                        if (stars) {
                            for (let i = 0; i < stars.length; i++) {
                                (stars[i] as HTMLElement).style.color = '#ddd';
                            }
                        }
                    } : undefined}
                >
                    ★
                </span>
            ))}
        </div>
    );
};

export default RatingStyle;

