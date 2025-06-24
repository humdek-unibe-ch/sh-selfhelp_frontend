'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../hooks/useAuth';
import { useSearchParams } from 'next/navigation';

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
}

/**
 * InternalLink component that handles both internal and external links.
 * For internal links, it uses Next.js Link component for client-side navigation.
 * For external links, it falls back to regular anchor tags with security attributes.
 * When users are logged in, language parameters are stripped from internal links.
 * When users are guests, language parameters are preserved across navigation.
 *
 * @component
 * @param {IInternalLinkProps} props - Component props
 * @returns {JSX.Element} Rendered link component
 */
export const InternalLink: React.FC<IInternalLinkProps> = ({ href, children, className, ...props }) => {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Don't process URLs on server side to avoid hydration issues
    if (!isClient) {
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
        
        if (user) {
            // If user is logged in, remove language parameter from URLs
            if (path.includes('?')) {
                const [pathname, searchParamsString] = path.split('?');
                const params = new URLSearchParams(searchParamsString);
                
                // Remove language parameter for authenticated users
                params.delete('language');
                
                // Reconstruct path with remaining parameters
                const remainingParams = params.toString();
                path = remainingParams ? `${pathname}?${remainingParams}` : pathname;
            }
        } else {
            // If user is not logged in, preserve/add language parameter
            const currentLanguage = searchParams.get('language');
            
            if (currentLanguage) {
                // Parse the target URL
                const [pathname, existingParams] = path.split('?');
                const params = new URLSearchParams(existingParams || '');
                
                // Only add language parameter if it's not already present
                if (!params.has('language')) {
                    params.set('language', currentLanguage);
                }
                
                // Reconstruct path with language parameter
                path = `${pathname}?${params.toString()}`;
            }
        }
        
        return (
            <Link 
                href={path}
                className={className}
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
            {...props}
        >
            {children}
        </a>
    );
};

export default InternalLink;
