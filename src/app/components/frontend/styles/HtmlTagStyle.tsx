import React from 'react';
import { IHtmlTagStyle } from '../../../../types/common/styles.types';
import BasicStyle from './BasicStyle';

interface IHtmlTagStyleProps {
    style: IHtmlTagStyle;
}

const HtmlTagStyle: React.FC<IHtmlTagStyleProps> = ({ style }) => {
    const htmlTag = style.html_tag?.content || 'div';
    
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Create the element dynamically
    const TagComponent = htmlTag as keyof JSX.IntrinsicElements;

    return (
        <TagComponent className={style.css ?? ""}>
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
            ))}
        </TagComponent>
    );
};

export default HtmlTagStyle; 