/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../../../hooks/useAuth';
import { useIsClient } from '../../../../hooks/useIsClient';
import {
    isPreviewInternalPath,
    usePreviewNavigation,
} from '../../cms/live-preview/PreviewNavigationContext';

/**
 * Props interface for InternalLink component
 * @interface IInternalLinkProps
 * @property {string} href - The URL or path to link to
 * @property {React.ReactNode} children - The content to be rendered inside the link
 * @property {string} [className] - Optional CSS class name for styling
 * @property {string} [target] - Optional target attribute for the link
 * @property {string} [rel] - Optional rel attribute for the link
 */
interface IInternalLinkProps {
    href: string;
    children: React.ReactNode;
    className?: string;
    target?: string;
    rel?: string;
    onMouseEnter?: () => void;
}

/**
 * InternalLink component that handles both internal and external links.
 * For internal links, it uses Next.js Link component for client-side navigation.
 * For external links, it falls back to regular anchor tags with security attributes.
 *
 * @component
 * @param {IInternalLinkProps} props - Component props
 * @returns {JSX.Element} Rendered link component
 */
const InternalLink: React.FC<IInternalLinkProps> = ({ href, children, className, onMouseEnter, ...props }) => {
    const { isLoading: isAuthLoading } = useAuth();
    const isClient = useIsClient();
    // Non-null only inside the CMS Live Preview web pane; elsewhere this is a
    // no-op and the link keeps its normal Next.js navigation.
    const previewNav = usePreviewNavigation();

    // Don't process URLs on server side to avoid hydration issues
    if (!isClient) {
        return <Link href={href} className={className}>{children}</Link>;
    }
    
    // Wait for authentication check to complete before processing URLs
    if (isAuthLoading) {
        return <Link href={href} className={className}>{children}</Link>;
    }
    
    const isInternal = href && (
        href.startsWith('/') || 
        href.startsWith(window.location.origin) ||
        !href.startsWith('http')
    );

    if (isInternal) {
        // Clean up the href to get just the path
        let path = href.replace(window.location.origin, '');

        // Inside the Live Preview pane: drive the preview instead of navigating
        // the admin app. Modifier-clicks / middle-clicks still open normally.
        if (previewNav && isPreviewInternalPath(path)) {
            return (
                <a
                    href={path}
                    className={className}
                    onMouseEnter={onMouseEnter}
                    onClick={(e) => {
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
                        e.preventDefault();
                        previewNav.navigate(path);
                    }}
                >
                    {children}
                </a>
            );
        }

        return (
            <Link 
                href={path}
                className={className}
                onMouseEnter={onMouseEnter}
            >
                {children}
            </Link>
        );
    }

    // External links open in new tab
    return (
        <a 
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
            onMouseEnter={onMouseEnter}
            {...props}
        >
            {children}
        </a>
    );
};

export default InternalLink;
