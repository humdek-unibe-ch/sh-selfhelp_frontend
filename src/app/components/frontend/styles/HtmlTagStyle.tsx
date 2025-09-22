import React from 'react';
import { IHtmlTagStyle } from '../../../../types/common/styles.types';
import BasicStyle from './BasicStyle';
import { getFieldContent } from '../../../../utils/style-field-extractor';

interface IHtmlTagStyleProps {
    style: IHtmlTagStyle;
}

const HtmlTagStyle: React.FC<IHtmlTagStyleProps> = ({ style }) => {
    const htmlTag = getFieldContent(style, 'html_tag') || 'div';
    const content = getFieldContent(style, 'html_tag_content') || '';

    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];
    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Create the element dynamically
    const TagComponent = htmlTag as keyof JSX.IntrinsicElements;

    console.log(htmlTag, content, cssClass);

    // If there are children, render them instead of using dangerouslySetInnerHTML
    if (children.length > 0) {
        return (
            <TagComponent className={cssClass}>
                {children.map((childStyle, index) => (
                    childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
                ))}
            </TagComponent>
        );
    }

    // If there's HTML content but no children, use dangerouslySetInnerHTML
    if (content) {
        return (
            <TagComponent className={cssClass} dangerouslySetInnerHTML={{ __html: content }} />
        );
    }

    // If neither children nor content, return empty tag
    return <TagComponent className={cssClass} />;
};

export default HtmlTagStyle; 