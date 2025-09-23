import React from 'react';
import { Card } from '@mantine/core';
import BasicStyle from '../../BasicStyle';
import { ICardSegmentStyle } from '../../../../../../types/common/styles.types';

/**
 * Props interface for CardSegmentStyle component
 */
interface ICardSegmentStyleProps {
    style: ICardSegmentStyle;
}

/**
 * CardSegmentStyle component renders a Mantine Card.Section component.
 * Used to organize content within Card components with optional sections.
 *
 * @component
 * @param {ICardSegmentStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Card.Section with child content
 */
const CardSegmentStyle: React.FC<ICardSegmentStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    return (
        <Card.Section
            className={cssClass}
        >
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
            ))}
        </Card.Section>
    );
};

export default CardSegmentStyle;
