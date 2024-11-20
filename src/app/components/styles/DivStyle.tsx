import React from 'react';
import { IDivStyle } from '@/types/api/styles.types';
import BasicStyle from './BasicStyle';

/**
 * Props interface for DivStyle component
 * @interface IDivStyleProps
 * @property {IDivStyle} style - The div style configuration object
 */
interface IDivStyleProps {
    style: IDivStyle;
}

/**
 * DivStyle component renders a div element with optional child elements.
 * Similar to ContainerStyle but specifically for div elements.
 * Uses BasicStyle for rendering nested style elements.
 *
 * @component
 * @param {IDivStyleProps} props - Component props
 * @returns {JSX.Element} Rendered div with styled children
 */
const DivStyle: React.FC<IDivStyleProps> = ({ style }) => {
    return (
        <div className={style.css}>
            {style.children?.map((child, index) => (
                child ? <BasicStyle key={index} style={child} /> : null
            ))}
        </div>
    );
};

export default DivStyle;