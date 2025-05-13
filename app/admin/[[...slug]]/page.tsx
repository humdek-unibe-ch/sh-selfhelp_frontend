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
  Flex
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconChevronRight,
  IconChevronDown,
  IconSettings,
  IconEye,
  IconDeviceFloppy
} from '@tabler/icons-react';
import { PageSections } from '@/components/admin/page-sections';

export default function AdminPage() {
  const params = useParams();
  const path = params.slug ? (Array.isArray(params.slug) ? params.slug.join('/') : params.slug) : '';
  
  // State for content and properties panels
  const [contentOpened, { toggle: toggleContent }] = useDisclosure(true);
  const [propertiesOpened, { toggle: toggleProperties }] = useDisclosure(true);
  
  // Page sections are now loaded via the PageSections component

  return (
    <Flex style={{ height: 'calc(100vh - var(--mantine-header-height, 60px))' }}>
      {/* Main Content Area */}
      <Box style={{ flex: '1', padding: rem(20), overflowY: 'auto' }}>
        <Group justify="space-between" mb={rem(20)}>
          <Title order={2}>{path || 'Dashboard'}</Title>
          <Group>
            <Button leftSection={<IconEye size={16} />} variant="light">Preview</Button>
            <Button leftSection={<IconDeviceFloppy size={16} />} color="blue">Save</Button>
          </Group>
        </Group>
        
        {/* Sections Container */}
        <PageSections />
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
              <Text size="sm" c="dimmed" mb="md">Content settings will be loaded dynamically</Text>
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
              <Text size="sm" c="dimmed" mb="md">Properties will be loaded dynamically</Text>
              <Divider mb="md" />
              <Button fullWidth leftSection={<IconSettings size={16} />} variant="light">Configure</Button>
            </Paper>
          </Collapse>
        </Box>
      </Box>
    </Flex>
  );
}
