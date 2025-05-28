'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  Box, 
  Title, 
  Button, 
  Paper, 
  Stack, 
  ScrollArea,
  Group,
  Text,
  Loader,
  Alert
} from '@mantine/core';
import { IconPlus, IconAlertCircle } from '@tabler/icons-react';
import { AdminApi } from '@/api/admin.api';
import { SectionItem } from '@/components/admin/page-sections/section-item';
import { IPageField } from '@/types/api/page-fields.type';

export function PageSections() {
  const params = useParams();
  const pageKeyword = params.slug ? (Array.isArray(params.slug) ? params.slug[1] : params.slug) : '';

  // Fetch page sections data using TanStack Query
  const { 
    data, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['pageSections', pageKeyword],
    queryFn: () => AdminApi.getPageFields(pageKeyword as string),
    enabled: !!pageKeyword,
  });

  // Handle loading state
  if (isLoading) {
    return (
      <Paper p="md" withBorder mb="md">
        <Group justify="space-between" mb="md">
          <Title order={4}>Page Sections</Title>
          <Button leftSection={<IconPlus size={16} />} size="xs" disabled>Add Section</Button>
        </Group>
        <Box py="xl" ta="center">
          <Loader size="md" />
          <Text size="sm" c="dimmed" mt="md">Loading page sections...</Text>
        </Box>
      </Paper>
    );
  }

  // Handle error state
  if (isError) {
    return (
      <Paper p="md" withBorder mb="md">
        <Group justify="space-between" mb="md">
          <Title order={4}>Page Sections</Title>
          <Button leftSection={<IconPlus size={16} />} size="xs">Add Section</Button>
        </Group>
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="Error loading sections" 
          color="red"
        >
          {(error as Error)?.message || 'Failed to load page sections. Please try again.'}
        </Alert>
      </Paper>
    );
  }

  // Handle empty sections
  if (!data || data.length === 0) {
    return (
      <Paper p="md" withBorder mb="md">
        <Group justify="space-between" mb="md">
          <Title order={4}>Page Sections</Title>
          <Button leftSection={<IconPlus size={16} />} size="xs">Add Section</Button>
        </Group>
        <Text c="dimmed" ta="center" py="xl">No sections found. Click &quot;Add Section&quot; to create one.</Text>
      </Paper>
    );
  }

  // Handle add section
  const handleAddSection = () => {
    // Implement add section functionality
  };

  return (
    <Paper p="md" withBorder mb="md">
      <Group justify="space-between" mb="md">
        <Title order={4}>Page Sections</Title>
        <Button 
          leftSection={<IconPlus size={16} />} 
          size="xs"
          onClick={handleAddSection}
        >
          Add Section
        </Button>
      </Group>
      
      <ScrollArea h={500} offsetScrollbars>
        <Stack gap="md">
          {Array.isArray(data) ? (
            data.map((section: IPageField, index: number) => (
              <SectionItem 
                key={`${section.id}-${section.path}-${index}`} 
                section={section} 
                isTopLevel={true}
              />
            ))
          ) : (
            <Text c="dimmed" ta="center" py="xl">Invalid data format received from API</Text>
          )}
        </Stack>
      </ScrollArea>
    </Paper>
  );
}
