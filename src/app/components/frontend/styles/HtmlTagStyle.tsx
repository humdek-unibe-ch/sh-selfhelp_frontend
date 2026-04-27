import React from 'react';
import { IHtmlTagStyle } from '../../../../types/common/styles.types';
import BasicStyle from './BasicStyle';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Props interface for IHtmlTagStyle component
 */
interface IHtmlTagStyleProps {
    style: IHtmlTagStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

// Inline-only HTML elements that must not wrap block-level content.
// React/HTML's parsing rules forbid block-level descendants here, so
// when a user-authored `html-tag` specifies one of these AND has child
// styles (which frequently render as <p>/<div>/etc.), we downgrade the
// wrapper to a <div> to avoid a hydration crash.
const INLINE_ONLY_HTML_TAGS = new Set([
    'p', 'span', 'em', 'strong', 'b', 'i', 'u', 'mark', 'small', 'sup',
    'sub', 'cite', 'q', 'abbr', 'dfn', 'time', 'var', 'samp', 'kbd',
    'del', 'ins', 's', 'label', 'a'
]);

const HtmlTagStyle: React.FC<IHtmlTagStyleProps> = ({ style, styleProps, cssClass }) => {
    const requestedTag = style.html_tag?.content || 'div';
    const content = DOMPurify.sanitize(style.html_tag_content?.content ?? '', {
    ALLOWED_TAGS: [],
  });

    const children = Array.isArray(style.children) ? style.children : [];

    const elementProps = {
        ...styleProps,
        className: cssClass
    };

    if (children.length > 0) {
        const isInlineOnly = INLINE_ONLY_HTML_TAGS.has(requestedTag);
        if (isInlineOnly && process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.warn(
                `[HtmlTagStyle] section ${style.id}: inline-only tag <${requestedTag}> ` +
                `had ${children.length} child style(s); rendered as <div> to avoid a hydration crash.`
            );
        }
        const htmlTag = isInlineOnly ? 'div' : requestedTag;

        return React.createElement(
            htmlTag,
            elementProps,
            children.map((childStyle, index) =>
                childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
            )
        );
    }

    const htmlTag = requestedTag;

    // If there's HTML content but no children
    if (content) {
        return React.createElement(htmlTag, {
            ...elementProps,
            content
        });
    }

    // If neither children nor content, return empty tag
    return React.createElement(htmlTag, elementProps);
};

export default HtmlTagStyle; 