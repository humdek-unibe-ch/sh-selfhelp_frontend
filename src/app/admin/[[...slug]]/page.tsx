'use client';

import { useParams } from 'next/navigation';
import { 
  Box, 
  Title, 
  Text, 
  Group, 
  Button, 
  ActionIcon, 
  Paper, 
  Divider, 
  Stack, 
  ScrollArea,
  Collapse,
  Accordion,
  rem,
  Flex,
  Badge,
  Alert,
  Loader
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconChevronRight,
  IconChevronDown,
  IconSettings,
  IconEye,
  IconDeviceFloppy,
  IconInfoCircle,
  IconAlertCircle
} from '@tabler/icons-react';
import { PageSectionsList } from '../../components/admin/page-sections';
import { useAdminPages } from '../../../hooks/useAdminPages';
import { useMemo } from 'react';
import { debug } from '../../../utils/debug-logger';

export default function AdminPage() {
  const params = useParams();
  const path = params.slug ? (Array.isArray(params.slug) ? params.slug.join('/') : params.slug) : '';
  const { pages, isLoading, error } = useAdminPages();
  
  // State for content and properties panels
  const [contentOpened, { toggle: toggleContent }] = useDisclosure(true);
  const [propertiesOpened, { toggle: toggleProperties }] = useDisclosure(true);

  // Check if this is a page edit route
  const isPageRoute = path.startsWith('pages/');
  const keyword = isPageRoute ? path.replace('pages/', '') : null;

  // Find the specific page by keyword
  const selectedPage = useMemo(() => {
    if (!pages || !keyword) return null;
    
    const page = pages.find(p => p.keyword === keyword);
    debug('Found page for editing', 'AdminPage', { keyword, page: page?.keyword });
    return page || null;
  }, [pages, keyword]);

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
        <Stack gap="lg">
          {/* Page Header */}
          <div>
            <Group justify="space-between" align="flex-start" mb="md">
              <div>
                <Group gap="xs" mb="xs">
                  {selectedPage.is_headless === 1 && (
                    <Badge color="orange" variant="light">
                      Headless
                    </Badge>
                  )}
                  {selectedPage.nav_position !== null && (
                    <Badge color="blue" variant="light">
                      Menu Position: {selectedPage.nav_position}
                    </Badge>
                  )}
                  {selectedPage.parent !== null && (
                    <Badge color="green" variant="light">
                      Child Page
                    </Badge>
                  )}
                </Group>
                <Text c="dimmed" size="sm">Page ID: {selectedPage.id_pages}</Text>
              </div>
            </Group>

            <Divider mb="lg" />

            <Group gap="lg" wrap="wrap" mb="lg">
              <Box>
                <Text size="sm" fw={500} c="dimmed">Keyword</Text>
                <Text size="sm" style={{ fontFamily: 'monospace' }}>{selectedPage.keyword}</Text>
              </Box>
              <Box>
                <Text size="sm" fw={500} c="dimmed">URL</Text>
                <Text size="sm" style={{ fontFamily: 'monospace' }}>{selectedPage.url}</Text>
              </Box>
              <Box>
                <Text size="sm" fw={500} c="dimmed">Page ID</Text>
                <Text size="sm">{selectedPage.id_pages}</Text>
              </Box>
              {selectedPage.parent !== null && (
                <Box>
                  <Text size="sm" fw={500} c="dimmed">Parent ID</Text>
                  <Text size="sm">{selectedPage.parent}</Text>
                </Box>
              )}
            </Group>
          </div>

          {/* Page Sections */}
          <Stack gap="md">
            <Group gap="xs">
              <IconInfoCircle size="1.2rem" color="var(--mantine-color-blue-6)" />
              <Title order={3}>Page Sections</Title>
            </Group>
            
            <Alert 
              icon={<IconInfoCircle size="1rem" />} 
              title="Content sections will be loaded dynamically" 
              color="blue"
              variant="light"
            >
              This area will display the page sections and content fields for editing.
              The sections will be fetched from the API using page keyword: <strong>{selectedPage.keyword}</strong>
            </Alert>
          </Stack>
        </Stack>
      );
    }

    // Default dashboard content
    return <PageSectionsList />;
  };

  const getPageTitle = () => {
    if (isPageRoute && selectedPage) {
      return selectedPage.keyword;
    }
    return path || 'Dashboard';
  };

  return (
    <Flex style={{ height: 'calc(100vh - var(--mantine-header-height, 60px))' }}>
      {/* Main Content Area */}
      <Box style={{ flex: '1', padding: rem(20), overflowY: 'auto' }}>
        <Group justify="space-between" mb={rem(20)}>
          <Title order={2}>{getPageTitle()}</Title>
          <Group>
            <Button leftSection={<IconEye size={16} />} variant="light">Preview</Button>
            <Button leftSection={<IconDeviceFloppy size={16} />} color="blue">Save</Button>
          </Group>
        </Group>
        
        {/* Dynamic Content */}
        {renderMainContent()}
      </Box>
      
      {/* Right Sidebar - Properties Panel */}
      <Box style={{ 
        width: rem(300), 
        borderLeft: '1px solid var(--mantine-color-gray-3)', 
        height: '100%',
        overflowY: 'auto'
      }}>
        {/* Content Panel */}
        <Box p="md">
          <Group justify="space-between" mb="xs" onClick={toggleContent} style={{ cursor: 'pointer' }}>
            <Title order={5}>Content</Title>
            {contentOpened ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
          </Group>
          <Collapse in={contentOpened}>
            <Paper withBorder p="md" mb="md">
              <Text size="sm" c="dimmed" mb="md">
                {isPageRoute && selectedPage 
                  ? `Content settings for ${selectedPage.keyword} will be loaded dynamically`
                  : 'Content settings will be loaded dynamically'
                }
              </Text>
              <Divider mb="md" />
              <Button fullWidth variant="light">Edit Content</Button>
            </Paper>
          </Collapse>
        </Box>
        
        {/* Properties Panel */}
        <Box p="md">
          <Group justify="space-between" mb="xs" onClick={toggleProperties} style={{ cursor: 'pointer' }}>
            <Title order={5}>Properties</Title>
            {propertiesOpened ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
          </Group>
          <Collapse in={propertiesOpened}>
            <Paper withBorder p="md">
              <Text size="sm" c="dimmed" mb="md">
                {isPageRoute && selectedPage 
                  ? `Properties for ${selectedPage.keyword} will be loaded dynamically`
                  : 'Properties will be loaded dynamically'
                }
              </Text>
              <Divider mb="md" />
              <Button fullWidth leftSection={<IconSettings size={16} />} variant="light">Configure</Button>
            </Paper>
          </Collapse>
        </Box>
      </Box>
    </Flex>
  );
}
