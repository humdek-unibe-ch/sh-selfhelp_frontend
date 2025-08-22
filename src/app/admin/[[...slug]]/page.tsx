'use client';

import { useParams } from 'next/navigation';
import { 
  Box, 
  Title, 
  Text, 
  Stack, 
  rem,
  Flex,
  Alert,
  Loader
} from '@mantine/core';
import { 
  IconInfoCircle,
  IconAlertCircle
} from '@tabler/icons-react';
import { PageSections } from '../../components/admin/pages/page-sections/PageSections';
import { PageInspector } from '../../components/admin/pages/page-inspector/PageInspector';
import { SectionInspector } from '../../components/admin/pages/section-inspector';
import { ConfigurationPageEditor } from '../../components/admin/pages/configuration-page-editor/ConfigurationPageEditor';
import { useAdminPages } from '../../../hooks/useAdminPages';
import { useMemo } from 'react';
import { IAdminPage } from '../../../types/responses/admin/admin.types';

/**
 * Utility function to flatten a hierarchical pages array into a flat array
 * This ensures we can find all pages including nested children
 */
function flattenPages(pages: IAdminPage[]): IAdminPage[] {
  const flattened: IAdminPage[] = [];
  
  function flatten(pageList: IAdminPage[]) {
    pageList.forEach(page => {
      flattened.push(page);
      if (page.children && page.children.length > 0) {
        flatten(page.children);
      }
    });
  }
  
  flatten(pages);
  return flattened;
}

export default function AdminPage() {
  const params = useParams();
  const path = params.slug ? (Array.isArray(params.slug) ? params.slug.join('/') : params.slug) : '';
  const { pages, configurationPages, isLoading, error } = useAdminPages();

  // Parse the path to extract page keyword and section ID
  const { isPageRoute, keyword, selectedSectionId } = useMemo(() => {
    
    if (!path.startsWith('pages/')) {
      return { isPageRoute: false, keyword: null, selectedSectionId: null };
    }

    const pathParts = path.split('/');
    // Expected format: pages/keyword or pages/keyword/sectionId
    if (pathParts.length >= 2) {
      const pageKeyword = pathParts[1];
      const sectionId = pathParts.length >= 3 ? parseInt(pathParts[2], 10) : null;
      
      const result = {
        isPageRoute: true,
        keyword: pageKeyword,
        selectedSectionId: !isNaN(sectionId!) ? sectionId : null
      };
      
      return result;
    }

    return { isPageRoute: false, keyword: null, selectedSectionId: null };
  }, [path]);

  // Find the specific page by keyword - search in ALL pages including children
  const selectedPage = useMemo(() => {
    if (!pages || !keyword) return null;
    
    // Flatten the pages array to include all pages (root and children)
    const allPages = flattenPages(pages);
    const page = allPages.find(p => p.keyword === keyword);
    
    return page || null;
  }, [pages, keyword]);

  // Check if the selected page is a configuration page
  const isConfigurationPage = useMemo(() => {
    if (!selectedPage || !configurationPages) return false;
    return configurationPages.some(cp => cp.id_pages === selectedPage.id_pages);
  }, [selectedPage, configurationPages]);

  // Render page content based on route
  const renderMainContent = () => {
    if (isPageRoute) {
      if (isLoading) {
        return (
          <Stack align="center" py="xl">
            <Loader size="lg" />
            <Text size="lg" c="dimmed">Loading page data...</Text>
          </Stack>
        );
      }

      if (error) {
        return (
          <Alert 
            icon={<IconAlertCircle size="1rem" />} 
            title="Error loading page data" 
            color="red"
            variant="light"
          >
            Failed to load page information. Please try again.
          </Alert>
        );
      }

      if (!selectedPage) {
        return (
          <Alert 
            icon={<IconAlertCircle size="1rem" />} 
            title="Page not found" 
            color="orange"
            variant="light"
          >
            No page found with keyword: {keyword}
          </Alert>
        );
      }

      return (
        <Box style={{ height: '100%' }}>
          {/* Page Sections - Full height */}
          <PageSections 
            pageId={selectedPage.id_pages} 
            pageName={selectedPage.keyword}
            initialSelectedSectionId={selectedSectionId}
          />
        </Box>
      );
    }

    // Default dashboard content
    return (
      <Stack align="center" py="xl">
        <IconInfoCircle size="3rem" color="var(--mantine-color-gray-5)" />
        <Title order={3} c="dimmed">Welcome to Admin Dashboard</Title>
        <Text c="dimmed" ta="center">
          Select a page from the navigation to start editing its content and sections.
        </Text>
      </Stack>
    );
  };

  const getPageTitle = () => {
    if (isPageRoute && selectedPage) {
      return `Page: ${selectedPage.keyword}`;
    }
    return path || 'Dashboard';
  };

  return (
    <>
      {isConfigurationPage && selectedPage ? (
        // Configuration pages use full-width editor
        <ConfigurationPageEditor page={selectedPage} />
      ) : (
        // Regular pages use the split layout
        <Flex style={{ height: 'calc(100vh - var(--mantine-header-height, 60px))' }}>
          {/* Main Content Area */}
          <Box style={{ flex: '1', overflowY: 'auto' }}>
            {/* Dynamic Content */}
            {renderMainContent()}
          </Box>
          
          {/* Right Sidebar - Page Inspector or Section Inspector */}
          <Box style={{ 
            width: rem(400), 
            borderLeft: '1px solid var(--mantine-color-gray-3)', 
            height: '100%',
            overflowY: 'hidden'
          }}>
            {(() => {
              const shouldShowSectionInspector = selectedSectionId && !isNaN(selectedSectionId) && !isConfigurationPage;
              if (shouldShowSectionInspector) {
                return (
                  <SectionInspector 
                    pageId={selectedPage?.id_pages || null} 
                    sectionId={selectedSectionId} 
                  />
                );
              } else {
                return <PageInspector page={selectedPage} isConfigurationPage={isConfigurationPage} />;
              }
            })()}
          </Box>
        </Flex>
      )}
    </>
  );
}
