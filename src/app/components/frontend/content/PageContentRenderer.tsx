import React from 'react';
import { Stack } from '@mantine/core';
import type { TStyle } from '../../../../types/common/styles.types';
import BasicStyle from '../styles/BasicStyle';

interface IPageContentRendererProps {
    sections: TStyle[];
}

/**
 * PageContentRenderer - Core component for rendering CMS page content
 * 
 * This component takes an array of sections and renders them using the
 * BasicStyle component factory. It's used by both the main page renderer
 * and the client-side renderer for dynamic content updates.
 * 
 * @component
 */
export function PageContentRenderer({ sections }: IPageContentRendererProps) {
    if (!sections || sections.length === 0) {
        return null;
    }

    return (
        <div>
            <Stack gap={0}>
                {sections.map((section, index) => {
                    if (!section) return null;

                    const key = `section-${section.id || `index-${index}`}`;
                    return <BasicStyle key={key} style={section} />;
                })}
            </Stack>
        </div>
    );
}

// export default PageContentRenderer;
