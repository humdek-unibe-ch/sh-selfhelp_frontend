'use client';

import { useEffect, useState, useMemo } from 'react';
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
import { AdminShell } from '../../../components/cms/admin-shell/AdminShell';
import { PageSections } from '../../../components/cms/pages/page-sections/PageSections';
import { ConfigurationPageEditor } from '../../../components/cms/pages/configuration-page-editor/ConfigurationPageEditor';
import { useAdminPages } from '../../../../hooks/useAdminPages';
import { IAdminPage } from '../../../../types/responses/admin/admin.types';
import { useQueryClient } from '@tanstack/react-query';
import { REACT_QUERY_CONFIG } from '../../../../config/react-query.config';
import { PageInspector } from '../../../components/cms/pages/page-inspector/PageInspector';
import { SectionInspector } from '../../../components/cms/sections';

/**
 * Utility function to flatten a hierarchical pages array into a flat array
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

function AdminPagesContent() {
  const params = useParams();
  const { pages, configurationPages, isLoading, isFetching, error } = useAdminPages();
  const queryClient = useQueryClient();

  // Parse slug to get keyword and sectionId
  const { keyword, sectionId } = useMemo(() => {
    const slug = params.slug;
    
    if (!slug || !Array.isArray(slug)) {
      return { keyword: null, sectionId: null };
    }

    const keyword = slug[0] || null;
    const sectionId = slug[1] ? parseInt(slug[1], 10) : null;
    
    return { 
      keyword, 
      sectionId: isNaN(sectionId!) ? null : sectionId 
    };
  }, [params.slug]);

  // Find the selected page
  // Note: React Query handles caching automatically - no need to manually invalidate on keyword change
  // The staleTime config in react-query.config.ts controls when data is refetched
  const selectedPage = useMemo(() => {
    if (!pages || !keyword) return null;
    
    const allPages = flattenPages(pages);
    const page = allPages.find(p => p.keyword === keyword);
    
    return page || null;
  }, [pages, keyword]);

  // Check if it's a configuration page
  const isConfigurationPage = useMemo(() => {
    if (!selectedPage || !configurationPages) return false;
    return configurationPages.some(cp => cp.id_pages === selectedPage.id_pages);
  }, [selectedPage, configurationPages]);

  // Memoize aside content to prevent unnecessary re-renders
  // CRITICAL FIX: Extract IDs outside useMemo and ONLY depend on primitive values
  // selectedPage object gets recreated due to useAdminPages select function creating new references
  // This was causing unmount/remount cycles when typing in fields
  const pageId = selectedPage?.id_pages;
  
  const asideContent = useMemo(() => {
    if (isConfigurationPage) {
      return null;
    }

    const shouldShowSectionInspector = sectionId && !isNaN(sectionId);
    if (shouldShowSectionInspector && pageId) {
      return (
        <SectionInspector 
          key={`section-${pageId}-${sectionId}`}
          pageId={pageId} 
          sectionId={sectionId}
        />
      );
    }
    
    // For PageInspector, we need the full object, but check it exists without depending on it
    if (pageId && !shouldShowSectionInspector) {
      return (
        <PageInspector 
          key={`page-${pageId}`}
          page={selectedPage!} 
          isConfigurationPage={isConfigurationPage}
        />
      );
    }
    
    return null;
    // CRITICAL: Only depend on primitive values (numbers/booleans), NOT objects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfigurationPage, sectionId, pageId]);

  // Render main content
  const renderMainContent = () => {
    // Show loading when no keyword is selected
    if (!keyword) {
      return (
        <Stack align="center" py="xl">
          <IconInfoCircle size="3rem" color="var(--mantine-color-gray-5)" />
          <Title order={3} c="dimmed">Select a Page</Title>
          <Text c="dimmed" ta="center">
            Choose a page from the navigation to start editing its content and sections.
          </Text>
        </Stack>
      );
    }

    // Show loading spinner on initial load when no data exists
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

    // Show configuration page editor if it's a config page
    if (isConfigurationPage) {
      return <ConfigurationPageEditor page={selectedPage} />;
    }

    return (
      <Box className={`max-h-screen transition-opacity duration-200 ${isFetching ? 'opacity-90' : 'opacity-100'}`}>
        <PageSections 
          pageId={selectedPage.id_pages} 
          pageName={selectedPage.keyword}
          initialSelectedSectionId={sectionId}
        />
      </Box>
    );
  };

  return (
    <AdminShell aside={asideContent} asideWidth={420}>
      {renderMainContent()}
    </AdminShell>
  );
}

export default function AdminPagesPage() {
  return <AdminPagesContent />;
}
