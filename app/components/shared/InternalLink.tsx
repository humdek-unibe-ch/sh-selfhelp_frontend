import React from 'react';
import Link from 'next/link';

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
 *
 * @component
 * @param {IInternalLinkProps} props - Component props
 * @returns {JSX.Element} Rendered link component
 */
export const InternalLink: React.FC<IInternalLinkProps> = ({ href, children, className, ...props }) => {
    const isInternal = href && (
        href.startsWith('/') || 
        href.startsWith(window.location.origin) ||
        !href.startsWith('http')
    );

    if (isInternal) {
        // Clean up the href to get just the path
        const path = href.replace(window.location.origin, '');
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
