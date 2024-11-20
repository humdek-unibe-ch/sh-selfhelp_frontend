import React from 'react';
import { ICardStyle } from '@/types/api/styles.types';
import BasicStyle from './BasicStyle';

/**
 * Props interface for CardStyle component
 * @interface ICardStyleProps
 * @property {ICardStyle} style - The card style configuration object
 */
interface ICardStyleProps {
    style: ICardStyle;
}

/**
 * CardStyle component renders a card container with optional child elements.
 * Provides a styled container that can hold other style components.
 * Uses BasicStyle for rendering nested style elements.
 *
 * @component
 * @param {ICardStyleProps} props - Component props
 * @returns {JSX.Element} Rendered card with styled children
 */
const CardStyle: React.FC<ICardStyleProps> = ({ style }) => {
    return (
        <div className={style.css}>
            <h3>{style.title.content}</h3>
            {
                style.children?.map(
                    (childStyle, index) => (
                        childStyle ? <BasicStyle key={`${childStyle.id.content}-${index}`} style={childStyle} /> : null
                    )
                )
            }
        </div>
    );
};

export default CardStyle;