'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Props interface for SectionLink component
 */
interface ISectionLinkProps {
    sectionId: number;
    children: React.ReactNode;
    className?: string;
    onSectionSelect?: (sectionId: number) => void;
    style?: React.CSSProperties;
    'data-section-id'?: number;
}

/**
 * SectionLink component that creates proper links for section navigation
 * Supports right-click "Open in new tab" and middle-click functionality
 * while maintaining client-side navigation for regular clicks
 */
export const SectionLink: React.FC<ISectionLinkProps> = ({ 
    sectionId, 
    children, 
    className, 
    onSectionSelect, 
    style,
    'data-section-id': dataSectionId,
    ...props 
}) => {
    const router = useRouter();
    const pathname = usePathname();

    // Build the section URL based on current path
    const getSectionUrl = () => {
        const pathParts = pathname.split('/');
        const adminIndex = pathParts.indexOf('admin');
        const pagesIndex = pathParts.indexOf('pages', adminIndex);

        if (pagesIndex !== -1 && pathParts[pagesIndex + 1]) {
            const pageKeyword = pathParts[pagesIndex + 1];
            return `/admin/pages/${pageKeyword}/${sectionId}`;
        }
        
        // Fallback - should not happen in normal usage
        return `/admin/pages/unknown/${sectionId}`;
    };

    const handleClick = (e: React.MouseEvent) => {
        // Allow default behavior for right-click, middle-click, and ctrl/cmd+click
        if (e.button !== 0 || e.ctrlKey || e.metaKey) {
            return;
        }

        // Check if the click originated from an action button or other interactive element
        const target = e.target as HTMLElement;
        const isActionButton = target.closest('button, [role="button"], .mantine-ActionIcon-root, [data-action-button="true"]') ||
                              target.tagName === 'BUTTON' ||
                              target.closest('[class*="ActionIcon"]') ||
                              target.closest('[class*="actionButton"]');
        
        if (isActionButton) {
            // Don't handle section navigation if clicking on action buttons
            return;
        }

        // Prevent default link navigation for regular clicks
        e.preventDefault();

        // Call the onSectionSelect callback if provided (for state management)
        if (onSectionSelect) {
            onSectionSelect(sectionId);
        }

        // Navigate using Next.js router for client-side navigation
        router.push(getSectionUrl(), { scroll: false });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        // Handle middle-click (mouse button 1)
        if (e.button === 1) {
            e.preventDefault();
            window.open(getSectionUrl(), '_blank');
        }
    };

    return (
        <Link 
            href={getSectionUrl()}
            className={className}
            style={style}
            data-section-id={dataSectionId}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            {...props}
        >
            {children}
        </Link>
    );
};

export default SectionLink;
