import React from 'react';
import BasicStyle from '../styles/BasicStyle';
import UnknownStyle from '../styles/UnknownStyle';
import { TStyle } from '../../../types/common/styles.types';

interface IPageContentRendererProps {
    sections: TStyle[];
}

/**
 * PageContentRenderer recursively renders page content sections
 * using the appropriate style components. It handles null sections
 * and falls back to UnknownStyle for unrecognized style types.
 * 
 * Now supports all style types through the enhanced BasicStyle component.
 */
export function PageContentRenderer({ sections }: IPageContentRendererProps) {
    if (!sections || sections.length === 0) {
        return null;
    }

    return (
        <>
            {sections.map((section, index) => {
                // Skip null or undefined sections
                if (!section) {
                    return null;
                }

                const key = `section-${section.id?.content || index}`;

                // BasicStyle now handles all style routing
                // It will internally render UnknownStyle for unsupported styles
                return <BasicStyle key={key} style={section} />;
            })}
        </>
    );
} 