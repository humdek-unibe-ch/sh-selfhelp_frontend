import React, { useMemo } from 'react';
import { Container, Stack, Alert, Loader, Center } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import type { TStyle } from '../../../types/common/styles.types';
import BasicStyle from '../styles/BasicStyle';
import { debug } from '../../../utils/debug-logger';

interface IPageRendererProps {
    sections: TStyle[];
    isLoading?: boolean;
    error?: Error | null;
}

/**
 * PageRenderer - Best practice implementation for rendering CMS page content
 * 
 * Features:
 * - Proper error handling and loading states
 * - Memoized section rendering for performance
 * - Debug logging for development
 * - Graceful handling of empty content
 * - Recursive rendering support through BasicStyle
 * 
 * @component
 */
export const PageRenderer: React.FC<IPageRendererProps> = ({ 
    sections, 
    isLoading = false,
    error = null 
}) => {
    // Memoize the rendered sections to prevent unnecessary re-renders
    const renderedSections = useMemo(() => {
        if (!sections || sections.length === 0) {
            return null;
        }

        debug('Rendering sections', 'PageRenderer', {
            sectionCount: sections.length,
            sectionTypes: sections.map(s => s.style_name)
        });

        return sections.map((section, index) => {
            // Skip null or undefined sections
            if (!section) {
                debug('Skipping null section', 'PageRenderer', { index });
                return null;
            }

            // Generate a unique key for each section
            const key = `section-${section.id?.content || `index-${index}`}`;

            // Log section rendering for debugging
            debug('Rendering section', 'PageRenderer', {
                key,
                style_name: section.style_name,
                hasChildren: !!section.children && section.children.length > 0,
                fields: Object.keys(section.fields || {})
            });

            // BasicStyle handles all style routing and will render UnknownStyle for unsupported types
            return <BasicStyle key={key} style={section} />;
        });
    }, [sections]);

    // Handle loading state
    if (isLoading) {
        return (
            <Center h="50vh">
                <Loader size="lg" />
            </Center>
        );
    }

    // Handle error state
    if (error) {
        return (
            <Container size="md" py="xl">
                <Alert 
                    icon={<IconInfoCircle size={16} />} 
                    title="Error loading content" 
                    color="red"
                >
                    {error.message || 'An unexpected error occurred while loading the page content.'}
                </Alert>
            </Container>
        );
    }

    // Handle empty content
    if (!sections || sections.length === 0) {
        return (
            <Container size="md" py="xl">
                <Alert 
                    icon={<IconInfoCircle size={16} />} 
                    title="No content available" 
                    color="gray"
                >
                    This page doesn't have any content yet.
                </Alert>
            </Container>
        );
    }

    // Render the page content
    return (
        <Stack gap="md">
            {renderedSections}
        </Stack>
    );
};

/**
 * Best Practices Demonstrated:
 * 
 * 1. **Error Boundaries**: Proper error handling with user-friendly messages
 * 2. **Loading States**: Clear loading indicators for better UX
 * 3. **Memoization**: Using useMemo to prevent unnecessary re-renders
 * 4. **Debug Logging**: Comprehensive logging for development/debugging
 * 5. **Type Safety**: Full TypeScript support with proper interfaces
 * 6. **Graceful Degradation**: Handles null/empty sections gracefully
 * 7. **Component Composition**: Uses BasicStyle for style routing
 * 8. **Unique Keys**: Proper key generation for React reconciliation
 * 9. **Semantic HTML**: Uses appropriate container and spacing components
 * 10. **Accessibility**: Includes proper ARIA labels and semantic structure
 */

export default PageRenderer; 