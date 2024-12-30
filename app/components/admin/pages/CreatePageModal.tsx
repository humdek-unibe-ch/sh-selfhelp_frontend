"use client";

import { Button, TextInput, Stack, Group, Radio, Checkbox, Select, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { CustomModal } from '../../common/CustomModal';

interface CreatePageModalProps {
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
}

export const CreatePageModal = ({ isOpen, onClose }: CreatePageModalProps) => {
  const form = useForm<PageFormValues>({
    initialValues: {
      keyword: '',
      pageType: 'sections',
      headerPosition: true,
      headlessPage: false,
      pageAccessType: 'mobile_and_web',
      protocols: ['GET'],
      openAccess: false,
      advanced: false,
      urlPattern: '',
    },
  });

  const handleSubmit = (values: PageFormValues) => {
    console.log('Form values:', values);
    onClose();
    form.reset();
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Page"
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack spacing="md">
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
              <Radio value="component" label="Component" />
              <Radio value="backend" label="Backend" />
              <Radio value="ajax" label="Ajax" />
            </Group>
          </Radio.Group>

          {/* Header Configuration */}
          <Group grow>
            <Checkbox
              label="Header Position"
              description="When activated, the page will appear in the header"
              {...form.getInputProps('headerPosition', { type: 'checkbox' })}
            />
            <Checkbox
              label="Headless Page"
              description="A headless page will not render any header or footer"
              {...form.getInputProps('headlessPage', { type: 'checkbox' })}
            />
          </Group>

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

          {/* Protocols */}
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

          {/* Access Settings */}
          <Group grow>
            <Checkbox
              label="Open Access"
              description="When activated the page will be accessible by anyone without having to log in"
              {...form.getInputProps('openAccess', { type: 'checkbox' })}
            />
            <Checkbox
              label="Advanced"
              {...form.getInputProps('advanced', { type: 'checkbox' })}
            />
          </Group>

          {/* URL Pattern */}
          <TextInput
            label="URL Pattern"
            description="This is set automatically. If you know what you are doing you may overwrite the value"
            placeholder="/page-url-pattern"
            {...form.getInputProps('urlPattern')}
          />

          {/* Form Actions */}
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onClose}>Cancel</Button>
            <Button type="submit">Create</Button>
          </Group>
        </Stack>
      </form>
    </CustomModal>
  );
};
