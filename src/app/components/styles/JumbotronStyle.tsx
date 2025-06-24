import React from 'react';
import { IJumbotronStyle } from '../../../types/common/styles.types';
import BasicStyle from './BasicStyle';

/**
 * Props interface for JumbotronStyle component
 */
interface IJumbotronStyleProps {
    style: IJumbotronStyle;
}

/**
 * JumbotronStyle component renders a Bootstrap jumbotron container
 * A lightweight, flexible component for showcasing hero content
 */
const JumbotronStyle: React.FC<IJumbotronStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    return (
        <div className={`jumbotron ${style.css || ''}`}>
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id.content}-${index}`} style={childStyle} /> : null
            ))}
        </div>
    );
};

export default JumbotronStyle; 