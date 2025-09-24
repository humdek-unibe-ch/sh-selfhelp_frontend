import React from 'react';
import { IHtmlTagStyle } from '../../../../types/common/styles.types';
import BasicStyle from './BasicStyle';

/**
 * Props interface for IHtmlTagStyle component
 */
interface IHtmlTagStyleProps {
    style: IHtmlTagStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

const HtmlTagStyle: React.FC<IHtmlTagStyleProps> = ({ style, styleProps, cssClass }) => {
    const htmlTag = style.html_tag?.content || 'div';
    const content = style.html_tag_content?.content || '';

    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];
    // Handle CSS field - use direct property from API response
    

    // Create the element dynamically
    const TagComponent = htmlTag as keyof JSX.IntrinsicElements;

    console.log(htmlTag, content, cssClass);

    // If there are children, render them instead of using dangerouslySetInnerHTML
    if (children.length > 0) {
        return (
            <TagComponent {...styleProps} className={cssClass}>
                {children.map((childStyle, index) => (
                    childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
                ))}
            </TagComponent>
        );
    }

    // If there's HTML content but no children, use dangerouslySetInnerHTML
    if (content) {
        return (
            <TagComponent {...styleProps} className={cssClass} dangerouslySetInnerHTML={{ __html: content }} />
        );
    }

    // If neither children nor content, return empty tag
    return <TagComponent {...styleProps} className={cssClass} />;
};

export default HtmlTagStyle; 