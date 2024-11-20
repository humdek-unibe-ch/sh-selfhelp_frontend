import React from 'react';
import Link from 'next/link';

interface IInternalLinkProps {
    href: string;
    children: React.ReactNode;
    className?: string;
    target?: string;
    rel?: string;
}

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
