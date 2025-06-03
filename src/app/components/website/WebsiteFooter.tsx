'use client';

import { Group, Skeleton, Text } from '@mantine/core';
import Link from 'next/link';
import { useAppNavigation } from '../../../hooks/useAppNavigation';

function FooterSkeleton() {
    return (
        <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Group gap={24} className="flex flex-wrap justify-center">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton key={index} height={20} width={80} radius="sm" />
                    ))}
                </Group>
            </div>
        </footer>
    );
}

export function WebsiteFooter() {
    const { footerPages, isLoading } = useAppNavigation();

    if (isLoading) {
        return <FooterSkeleton />;
    }

    if (footerPages.length === 0) {
        return null;
    }

    return (
        <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Group gap={24} className="flex flex-wrap justify-center">
                    {footerPages.map(page => (
                        <Link
                            key={page.id_pages}
                            href={page.url}
                            className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
                        >
                            {page.keyword}
                        </Link>
                    ))}
                </Group>
                
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Text 
                        size="sm" 
                        className="text-center text-gray-500 dark:text-gray-400"
                    >
                        © {new Date().getFullYear()} Self Help. All rights reserved.
                    </Text>
                </div>
            </div>
        </footer>
    );
} 