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
  IconPlus, 
  IconTrash, 
  IconCopy, 
  IconArrowUp, 
  IconArrowDown,
  IconChevronRight,
  IconChevronDown,
  IconSettings,
  IconEye,
  IconDeviceFloppy
} from '@tabler/icons-react';

export default function AdminPage() {
  const params = useParams();
  const path = params.slug ? (Array.isArray(params.slug) ? params.slug.join('/') : params.slug) : '';
  
  // State for content and properties panels
  const [contentOpened, { toggle: toggleContent }] = useDisclosure(true);
  const [propertiesOpened, { toggle: toggleProperties }] = useDisclosure(true);
  
  // Mock sections data (will be dynamic in the future)
  const mockSections = [
    { id: 1, title: 'Header Section' },
    { id: 2, title: 'Introduction Text' },
    { id: 3, title: 'Image Gallery' },
    { id: 4, title: 'Contact Form' },
  ];

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
        <Paper p="md" withBorder mb="md">
          <Group justify="space-between" mb="md">
            <Title order={4}>Page Sections</Title>
            <Button leftSection={<IconPlus size={16} />} size="xs">Add Section</Button>
          </Group>
          
          <ScrollArea h={500} offsetScrollbars>
            <Stack gap="md">
              {mockSections.map((section) => (
                <Paper key={section.id} withBorder p="md" shadow="xs">
                  <Group justify="space-between" wrap="nowrap">
                    <Text fw={500}>{section.title}</Text>
                    <Group gap="xs">
                      <ActionIcon variant="subtle" size="sm">
                        <IconArrowUp size={16} />
                      </ActionIcon>
                      <ActionIcon variant="subtle" size="sm">
                        <IconArrowDown size={16} />
                      </ActionIcon>
                      <ActionIcon variant="subtle" size="sm">
                        <IconCopy size={16} />
                      </ActionIcon>
                      <ActionIcon variant="subtle" color="red" size="sm">
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </ScrollArea>
        </Paper>
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
