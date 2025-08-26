'use client';

import { memo } from 'react';
import { Group, Box } from '@mantine/core';
import { IPageSectionsState, IPageSectionsHandlers } from './PageSections';
import { 
    PageTitle, 
    ExpandCollapseControls, 
    SearchControls, 
    AddSectionButton 
} from './components';

interface IPageSectionsHeaderProps {
    pageName?: string;
    state: IPageSectionsState;
    handlers: IPageSectionsHandlers;
}

export const PageSectionsHeader = memo<IPageSectionsHeaderProps>(
    function PageSectionsHeader({ pageName, state, handlers }) {
        if (!pageName) {
            return null;
        }

        return (
            <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                {/* Page Title and Section Count - Only re-renders when title/count changes */}
                <Box mb="md">
                    <PageTitle 
                        pageName={pageName}
                        sectionsCount={state.sectionsCount}
                        isProcessing={state.isProcessing}
                    />
                </Box>

                {/* Page Controls - Each component only re-renders when its specific props change */}
                <Group gap="xs" align="center" wrap="nowrap" justify="space-between">
                    {/* Left side - Expand/Collapse Controls */}
                    <ExpandCollapseControls 
                        onExpandAll={handlers.onExpandAll}
                        onCollapseAll={handlers.onCollapseAll}
                    />

                    {/* Center - Search Controls */}
                    <SearchControls 
                        searchQuery={state.searchQuery}
                        searchResults={state.searchResults}
                        currentSearchIndex={state.currentSearchIndex}
                        onSearchChange={handlers.onSearchChange}
                        onSearchNext={handlers.onSearchNext}
                        onSearchPrevious={handlers.onSearchPrevious}
                        onSearchClear={handlers.onSearchClear}
                    />

                    {/* Right side - Add Section Button */}
                    <AddSectionButton onAddSection={handlers.onAddSection} />
                </Group>
            </Box>
        );
    },
    // Custom comparison - only re-render if pageName changes
    // Child components handle their own prop changes
    (prevProps, nextProps) => {
        return prevProps.pageName === nextProps.pageName;
        // Note: We don't compare state/handlers here because child components
        // have their own memo comparisons for optimal granular updates
    }
);
