import React from 'react';
import { IButtonStyle } from '../../../types/common/styles.types';

/**
 * Props interface for ButtonStyle component
 * @interface IButtonStyleProps
 * @property {IButtonStyle} style - The button style configuration object
 */
interface IButtonStyleProps {
    style: IButtonStyle;
}

/**
 * ButtonStyle component renders a button element with specified styling.
 * Handles button text and click events with proper null checks.
 *
 * @component
 * @param {IButtonStyleProps} props - Component props
 * @returns {JSX.Element} Rendered button with specified styling
 */
const ButtonStyle: React.FC<IButtonStyleProps> = ({ style }) => {
    const handleClick = () => {
        if (style.url?.content) {
            window.location.href = style.url.content;
        }
    };

    return (
        <button 
            className={style.css || ''} 
            onClick={handleClick}
            type={style.type?.content || 'button'}
        >
            {style.label?.content || 'Button'}
        </button>
    );
};

export default ButtonStyle;