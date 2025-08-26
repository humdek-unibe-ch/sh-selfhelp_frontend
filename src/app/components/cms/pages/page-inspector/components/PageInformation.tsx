'use client';

import { memo } from 'react';
import { InspectorInfoSection } from '../../../shared';

interface IPageInformationProps {
    page: {
        keyword: string;
        url: string;
        is_headless?: number;
        nav_position?: number | null;
        parent?: number | null;
    };
    pageId: number;
    isConfigurationPage?: boolean;
}

export const PageInformation = memo<IPageInformationProps>(
    function PageInformation({ page, pageId, isConfigurationPage }) {
        return (
            <InspectorInfoSection
                title="Page Information"
                infoItems={[
                    { label: 'Keyword', value: page.keyword, variant: 'code' },
                    { label: 'URL', value: page.url, variant: 'code' },
                    { label: 'Page ID', value: pageId }
                ]}
                badges={[
                    ...(isConfigurationPage ? [{ label: 'Configuration Page', color: 'purple' }] : []),
                    ...(page.is_headless === 1 ? [{ label: 'Headless', color: 'orange' }] : []),
                    ...(page.nav_position !== null ? [{ label: `Menu Position: ${page.nav_position}`, color: 'blue' }] : []),
                    ...(page.parent !== null ? [{ label: 'Child Page', color: 'green' }] : [])
                ]}
            />
        );
    },
    // Custom comparison - only re-render if page data or configuration changes
    (prevProps, nextProps) => {
        return (
            prevProps.pageId === nextProps.pageId &&
            prevProps.isConfigurationPage === nextProps.isConfigurationPage &&
            prevProps.page.keyword === nextProps.page.keyword &&
            prevProps.page.url === nextProps.page.url &&
            prevProps.page.is_headless === nextProps.page.is_headless &&
            prevProps.page.nav_position === nextProps.page.nav_position &&
            prevProps.page.parent === nextProps.page.parent
        );
    }
);
