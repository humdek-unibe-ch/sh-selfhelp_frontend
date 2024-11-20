import React from 'react';
import { IButtonStyle } from '@/types/api/styles.types';

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
 * Handles button text and click events.
 *
 * @component
 * @param {IButtonStyleProps} props - Component props
 * @returns {JSX.Element} Rendered button with specified styling
 */
const ButtonStyle: React.FC<IButtonStyleProps> = ({ style }) => {
    return (
        <button className={style.css}>
            {style.label.content}
        </button>
    );
};

export default ButtonStyle;