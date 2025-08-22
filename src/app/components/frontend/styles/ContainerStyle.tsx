import React from 'react';
import BasicStyle from './BasicStyle';
import { getFieldContent } from '../../../../utils/style-field-extractor';
import { IContainerStyle } from '../../../../types/common/styles.types';

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
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];
    const cssClass = getFieldContent(style, 'css');

    return (
        <div className={cssClass}>
            {children.map((child: any, index: number) => (
                child ? <BasicStyle key={index} style={child} /> : null
            ))}
        </div>
    );
};

export default ContainerStyle;