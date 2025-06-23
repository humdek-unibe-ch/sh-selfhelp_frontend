import React from 'react';
import { TStyle } from '../../../types/common/styles.types';
import BasicStyle from '../styles/BasicStyle';
import UnknownStyle from '../styles/UnknownStyle';

interface IPageContentRendererProps {
    content: (TStyle | null)[];
}

/**
 * PageContentRenderer recursively renders page content sections
 * using the appropriate style components. It handles null sections
 * and falls back to UnknownStyle for unrecognized style types.
 */
export function PageContentRenderer({ content }: IPageContentRendererProps) {
    if (!content || content.length === 0) {
        return null;
    }

    return (
        <>
            {content.map((section, index) => {
                // Skip null sections
                if (!section) {
                    return null;
                }

                const key = `section-${section.id?.content || index}`;

                // Check if the style is supported by BasicStyle
                const supportedStyles = [
                    'container', 'image', 'markdown', 'heading', 'card', 
                    'div', 'button', 'carousel', 'link', 'formUserInputLog', 'textarea'
                ];

                if (supportedStyles.includes(section.style_name)) {
                    return <BasicStyle key={key} style={section} />;
                } else {
                    // Use UnknownStyle for unsupported styles
                    return <UnknownStyle key={`unknown-${key}`} style={section} />;
                }
            })}
        </>
    );
} 