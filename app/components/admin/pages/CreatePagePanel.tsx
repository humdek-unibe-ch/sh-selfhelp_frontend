"use client";

import { Button, TextInput, Stack, Group, Radio, Checkbox, Select, Text, Box, Badge, Transition, Paper } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState, useMemo } from 'react';
import { IconGripVertical } from '@tabler/icons-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import classes from './CreatePagePanel.module.css';

interface CreatePagePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PageFormValues {
  keyword: string;
  pageType: string;
  headerPosition: boolean;
  headlessPage: boolean;
  pageAccessType: string;
  protocols: string[];
  openAccess: boolean;
  advanced: boolean;
  urlPattern: string;
  position: number | null;
}

// Mock data for existing pages
const mockPages = [
  { id: '1', content: 'Page 1', position: 10 },
  { id: '2', content: 'Page 2', position: 20 },
  { id: '3', content: 'Page 3', position: 30 },
];

export const CreatePagePanel = ({ isOpen, onClose }: CreatePagePanelProps) => {
  const [pages, setPages] = useState(mockPages);
  const [newPagePosition, setNewPagePosition] = useState<number | null>(null);

  const form = useForm<PageFormValues>({
    initialValues: {
      keyword: '',
      pageType: 'sections',
      headerPosition: false,
      headlessPage: false,
      pageAccessType: 'mobile_and_web',
      protocols: ['GET'],
      openAccess: false,
      advanced: false,
      urlPattern: '',
      position: null,
    },
  });

  // Combine existing pages with new page if keyword exists
  const allPages = useMemo(() => {
    if (!form.values.keyword) return pages;
    
    const newPage = {
      id: 'new-page',
      content: form.values.keyword,
      position: newPagePosition ?? (pages.length + 1) * 10,
      isNew: true
    };

    if (newPagePosition === null) {
      return [...pages, newPage];
    }

    return [...pages, newPage].sort((a, b) => a.position - b.position);
  }, [pages, form.values.keyword, newPagePosition]);

  const handleDragEnd = (result: { source: { index: number }; destination?: { index: number } }) => {
    if (!result.destination || !form.values.keyword) return;

    const newPageIndex = allPages.findIndex(page => 'isNew' in page);
    if (newPageIndex === -1) return;

    // Calculate new position based on surrounding pages
    const destIndex = result.destination.index;
    const prevPage = destIndex > 0 ? allPages[destIndex - 1] : null;
    const nextPage = destIndex < allPages.length - 1 ? allPages[destIndex] : null;
    
    let newPosition: number;
    if (!prevPage) {
      // Placing at the start
      newPosition = nextPage ? nextPage.position / 2 : 10;
    } else if (!nextPage) {
      // Placing at the end
      newPosition = prevPage.position + 10;
    } else {
      // Placing between two pages
      newPosition = (prevPage.position + nextPage.position) / 2;
    }

    setNewPagePosition(newPosition);
  };

  const getDragHandleProps = (defaultDragHandleProps: any, isNewPage: boolean) => ({
    ...defaultDragHandleProps,
    style: {
      ...defaultDragHandleProps?.style,
      cursor: isNewPage ? 'grab' : 'not-allowed',
      color: isNewPage ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-4)',
    }
  });

  const handleSubmit = (values: PageFormValues) => {
    console.log('Form values:', values);
    onClose();
    form.reset();
  };

  return (
    <Transition mounted={isOpen} transition="slide-right" duration={200}>
      {(styles) => (
        <Paper
          shadow="md"
          style={{
            ...styles,
            position: 'fixed',
            top: 'var(--mantine-header-height, 60px)',
            left: '300px',
            bottom: 0,
            width: '400px',
            overflowY: 'auto',
            zIndex: 1,
            borderLeft: '1px solid var(--mantine-color-gray-3)',
          }}
        >
          <Box p="md">
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Group justify="space-between" mb="lg">
                <Text size="lg" fw={500}>Create New Page</Text>
                <Button variant="subtle" onClick={onClose}>Close</Button>
              </Group>

              <Stack gap="md">
                {/* Page Properties */}
                <TextInput
                  label="Keyword"
                  placeholder="Enter unique page identifier"
                  required
                  {...form.getInputProps('keyword')}
                />
                <Text size="xs" c="dimmed">
                  The page keyword must be unique. Note that the page keyword can contain numbers, letters, - and _ characters
                </Text>

                {/* Page Type */}
                <Radio.Group
                  name="pageType"
                  label="Page Type"
                  description="The page type specified how the page content will be assembled"
                  required
                  {...form.getInputProps('pageType')}
                >
                  <Group mt="xs">
                    <Radio value="sections" label="Sections" />
                    <Radio value="navigation" label="Navigation" />
                    <Radio 
                      value="component" 
                      label="Component" 
                      disabled={!form.values.advanced}
                    />
                    <Radio 
                      value="backend" 
                      label="Backend" 
                      disabled={!form.values.advanced}
                    />
                    <Radio 
                      value="ajax" 
                      label="Ajax" 
                      disabled={!form.values.advanced}
                    />
                  </Group>
                </Radio.Group>

                {/* Header Configuration */}
                <Group grow>
                  <Checkbox
                    label="Header Position"
                    description="When activated, the page will appear in the header"
                    {...form.getInputProps('headerPosition', { type: 'checkbox' })}
                  />
                  <Box display={form.values.advanced ? 'block' : 'none'}>
                    <Checkbox
                      label="Headless Page"
                      description="A headless page will not render any header or footer"
                      {...form.getInputProps('headlessPage', { type: 'checkbox' })}
                    />
                  </Box>
                </Group>

                {/* Position Settings */}
                {form.values.headerPosition && (
                  <Box style={{ position: 'relative' }}>
                    <Text size="sm" fw={500} mb="xs">Page Order</Text>
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="pages">
                        {(provided) => (
                          <Box 
                            {...provided.droppableProps} 
                            ref={provided.innerRef}
                            style={{ 
                              position: 'relative',
                              minHeight: '100px'
                            }}
                          >
                            <Stack gap="xs">
                              {allPages.map((page, index) => (
                                <Draggable 
                                  key={page.id} 
                                  draggableId={page.id} 
                                  index={index}
                                  isDragDisabled={!('isNew' in page)}
                                >
                                  {(provided, snapshot) => (
                                    <Group 
                                      p="xs"
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={classes.draggableItem}
                                      data-is-dragging={snapshot.isDragging}
                                      style={{
                                        ...provided.draggableProps.style,
                                        background: snapshot.isDragging 
                                          ? 'var(--mantine-color-blue-0)' 
                                          : 'var(--mantine-color-body)',
                                        border: '1px solid var(--mantine-color-gray-3)',
                                        borderRadius: 'var(--mantine-radius-sm)',
                                        opacity: ('isNew' in page) ? 1 : 0.7,
                                        position: 'relative',
                                        left: 'auto',
                                        top: 'auto'
                                      }}
                                    >
                                      <Box 
                                        {...getDragHandleProps(provided.dragHandleProps, 'isNew' in page)}
                                        className={classes.dragHandle}
                                      >
                                        <IconGripVertical />
                                      </Box>
                                      <Badge size="sm">{Math.round(page.position / 10)}</Badge>
                                      <Text 
                                        size="sm" 
                                        c={('isNew' in page) ? 'blue' : 'dimmed'}
                                      >
                                        {page.content}
                                      </Text>
                                      {'isNew' in page && <Badge size="sm" color="blue">New</Badge>}
                                    </Group>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </Stack>
                          </Box>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </Box>
                )}

                {/* Access Control */}
                <Select
                  label="Page Access Type"
                  data={[
                    { value: 'mobile', label: 'Mobile' },
                    { value: 'web', label: 'Web' },
                    { value: 'mobile_and_web', label: 'Mobile and web' },
                  ]}
                  {...form.getInputProps('pageAccessType')}
                />

                {/* Advanced Settings Toggle */}
                <Checkbox
                  label="Advanced"
                  {...form.getInputProps('advanced', { type: 'checkbox' })}
                />

                {/* Protocols - Only visible in advanced mode */}
                {form.values.advanced && (
                  <Checkbox.Group
                    label="Protocol"
                    description="The protocol specifies how a page is accessed"
                    {...form.getInputProps('protocols')}
                  >
                    <Group mt="xs">
                      <Checkbox value="GET" label="GET" />
                      <Checkbox value="POST" label="POST" />
                      <Checkbox value="PUT" label="PUT" />
                      <Checkbox value="PATCH" label="PATCH" />
                      <Checkbox value="DELETE" label="DELETE" />
                    </Group>
                  </Checkbox.Group>
                )}

                {/* URL Pattern - Read-only unless in advanced mode */}
                <TextInput
                  label="URL Pattern"
                  description="This is set automatically. If you know what you are doing you may overwrite the value"
                  placeholder="/page-url-pattern"
                  readOnly={!form.values.advanced}
                  {...form.getInputProps('urlPattern')}
                />

                {/* Form Actions */}
                <Group justify="flex-end" mt="md">
                  <Button variant="light" onClick={onClose}>Cancel</Button>
                  <Button type="submit">Create</Button>
                </Group>
              </Stack>
            </form>
          </Box>
        </Paper>
      )}
    </Transition>
  );
};
