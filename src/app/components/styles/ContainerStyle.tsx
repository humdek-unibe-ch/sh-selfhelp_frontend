import React from 'react';
import { IContainerStyle } from '../../../types/common/styles.types';
import BasicStyle from './BasicStyle';

/**
 * Props interface for ContainerStyle component
 * @interface IContainerStyleProps
 * @property {IContainerStyle} style - The container style configuration object
 */
interface IContainerStyleProps {
    style: IContainerStyle;
}

/**
 * ContainerStyle component renders a container element with child elements.
 * Uses BasicStyle for rendering nested style elements.
 *
 * @component
 * @param {IContainerStyleProps} props - Component props
 * @returns {JSX.Element} Rendered container with styled children
 */
const ContainerStyle: React.FC<IContainerStyleProps> = ({ style }) => {
    return (
        <div className={style.css}>
            {style.children?.map((child, index) => (
                child ? <BasicStyle key={index} style={child} /> : null
            ))}
        </div>
    );
};

export default ContainerStyle;