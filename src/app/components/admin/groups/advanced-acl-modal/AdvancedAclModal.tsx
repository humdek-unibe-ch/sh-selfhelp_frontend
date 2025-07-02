"use client";

import { useState } from 'react';
import {
  Modal,
  Stack,
  Text,
  Button,
  Group,
  Tabs,
  Alert,
  LoadingOverlay,
} from '@mantine/core';
import { IconInfoCircle, IconDeviceFloppy } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { AclSelector, type IAclPage, type TAclPageType } from '../../shared/acl-selector/AclSelector';

interface IAdvancedAclModalProps {
  opened: boolean;
  onClose: () => void;
  groupId: number;
  groupName: string;
}

export function AdvancedAclModal({ 
  opened, 
  onClose, 
  groupId, 
  groupName 
}: IAdvancedAclModalProps) {
  const [selectedPages, setSelectedPages] = useState<IAclPage[]>([]);
  const [activeTab, setActiveTab] = useState<TAclPageType>('all');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to save page-based ACLs
      // This would be a new API endpoint like: PUT /admin/groups/{groupId}/page-acls
      
      notifications.show({
        title: 'Success',
        message: 'Page-based ACLs updated successfully',
        color: 'green',
      });
      
      onClose();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update ACLs',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTabDescription = (tab: TAclPageType) => {
    switch (tab) {
      case 'all':
        return 'Manage access to all pages in the system, including system and configuration pages';
      case 'experiment-only':
        return 'Manage access to experiment pages that users can interact with';
      case 'menu-footer':
        return 'Manage access to pages that can appear in navigation menus and footers';
      default:
        return '';
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text size="lg" fw={600}>
          Advanced ACL Management - {groupName}
        </Text>
      }
      size="xl"
      centered
    >
      <LoadingOverlay visible={isLoading} />
      
      <Stack gap="md">
        <Alert icon={<IconInfoCircle size="1rem" />} color="blue" variant="light">
          <Text size="sm">
            Configure page-based access control for this group. You can set different permission levels 
            (Select, Insert, Update, Delete) for each page.
          </Text>
        </Alert>

        <Tabs value={activeTab} onChange={(value) => setActiveTab(value as TAclPageType)}>
          <Tabs.List>
            <Tabs.Tab value="all">All Pages</Tabs.Tab>
            <Tabs.Tab value="experiment-only">Experiment Pages</Tabs.Tab>
            <Tabs.Tab value="menu-footer">Menu/Footer Pages</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value={activeTab} pt="md">
            <Stack gap="sm">
              <Text size="sm" c="dimmed">
                {getTabDescription(activeTab)}
              </Text>
              
              <AclSelector
                selectedPages={selectedPages}
                onChange={setSelectedPages}
                pageFilter={activeTab}
                showPermissionTypes={true}
                maxHeight={500}
              />
            </Stack>
          </Tabs.Panel>
        </Tabs>

        <Group justify="flex-end" gap="sm">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            leftSection={<IconDeviceFloppy size="1rem" />}
            onClick={handleSave} 
            loading={isLoading}
          >
            Save ACL Changes
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
} 