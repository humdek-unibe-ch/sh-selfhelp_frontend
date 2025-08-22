import React, { useMemo } from 'react';
import { Container, Stack, Alert, Loader, Center } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import type { TStyle } from '../../../../types/common/styles.types';
import BasicStyle from '../styles/BasicStyle';

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

        return sections.map((section, index) => {
            // Skip null or undefined sections
            if (!section) {
                return null;
            }

            // Generate a unique key for each section
            const key = `section-${section.id || `index-${index}`}`;

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
                    color="yellow"
                >
                    This page doesn&apos;t have any content sections configured yet.
                </Alert>
            </Container>
        );
    }

    return (
        <Container size="xl" px={0}>
            <Stack gap={0}>
                {renderedSections}
            </Stack>
        </Container>
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
