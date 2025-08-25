'use client';

import { useParams } from 'next/navigation';
import { 
  Box, 
  Title, 
  Text, 
  Stack, 
  Alert,
  Loader
} from '@mantine/core';
import { 
  IconInfoCircle,
  IconAlertCircle
} from '@tabler/icons-react';
import { PageSections } from '../../components/cms/pages/page-sections/PageSections';
import { PageInspector } from '../../components/cms/pages/page-inspector/PageInspector';
import { SectionInspector } from '../../components/cms/pages/section-inspector';
import { ConfigurationPageEditor } from '../../components/cms/pages/configuration-page-editor/ConfigurationPageEditor';
import { AdminShellWrapper } from '../../components/cms/admin-shell/AdminShellWrapper';
import { useAdminPages } from '../../../hooks/useAdminPages';
import { useMemo, useEffect } from 'react';
import { IAdminPage } from '../../../types/responses/admin/admin.types';
import { useQueryClient } from '@tanstack/react-query';
import { REACT_QUERY_CONFIG } from '../../../config/react-query.config';


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
  const { pages, configurationPages, isLoading, isFetching, error } = useAdminPages();
  const queryClient = useQueryClient();

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

  // Refresh admin pages data on navigation to ensure fresh data
  useEffect(() => {
    const refreshAdminPages = async () => {
      // Invalidate admin pages to ensure fresh data
      await queryClient.invalidateQueries({ 
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_PAGES 
      });
      
      // Refetch admin pages silently in the background
      queryClient.prefetchQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_PAGES,
        staleTime: 0, // Force fresh data
      });
    };

    // Only refresh when we have a valid page route
    if (isPageRoute && keyword) {
      refreshAdminPages();
    }
  }, [path, queryClient, isPageRoute, keyword]); // Refresh when path changes

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
      // Only show loading spinner on initial load when no data exists
      if (isLoading && !pages?.length) {
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
        <Box className={`max-h-screen transition-opacity duration-200 ${isFetching ? 'opacity-90' : 'opacity-100'}`}>
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

  // Determine which inspector to show in the aside panel
  const renderAside = () => {
    // Configuration pages don't show aside panels
    if (isConfigurationPage) {
      return null;
    }

    const shouldShowSectionInspector = selectedSectionId && !isNaN(selectedSectionId);
    if (shouldShowSectionInspector) {
      return (
        <SectionInspector 
          pageId={selectedPage?.id_pages || null} 
          sectionId={selectedSectionId}

        />
      );
    } else if (isPageRoute) {
      return (
        <PageInspector 
          page={selectedPage} 
          isConfigurationPage={isConfigurationPage}

        />
      );
    }
    
    return null;
  };



  return (
    <AdminShellWrapper 
      aside={renderAside()}
      asideWidth={420}
    >
      {isConfigurationPage && selectedPage ? (
        // Configuration pages use full-width editor
        <ConfigurationPageEditor page={selectedPage} />
      ) : (
        // Regular pages show main content only (aside is handled by shell)
        <Box>
          {renderMainContent()}
        </Box>
      )}
    </AdminShellWrapper>
  );
}
