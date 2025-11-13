"use client";

import { useMemo } from 'react';
import {
  Stack,
  Text,
  Checkbox,
  Group,
  Paper,
  Badge,
  ScrollArea,
  Alert,
  Tooltip,
} from '@mantine/core';
import { IconInfoCircle, IconLock } from '@tabler/icons-react';
import { useAdminPages } from '../../../../../hooks/useAdminPages';

export type TAclPageType = 'all' | 'experiment-only' | 'menu-footer';

export interface IAclPage {
  id: number;
  keyword: string;
  title: string | null;
  type: number;
  isSystem: boolean;
  isConfiguration: boolean;
  permissions: {
    select: boolean;
    insert: boolean;
    update: boolean;
    delete: boolean;
  };
}

interface IAclSelectorProps {
  selectedPages: IAclPage[];
  onChange: (pages: IAclPage[]) => void;
  pageFilter?: TAclPageType;
  readonly?: boolean;
  showPermissionTypes?: boolean;
  maxHeight?: number;
}

interface IPageTypeInfo {
  label: string;
  color: string;
  description: string;
}

const PAGE_TYPE_INFO: Record<number, IPageTypeInfo> = {
  1: { label: 'Internal', color: 'gray', description: 'Internal system pages' },
  2: { label: 'Core', color: 'blue', description: 'Core system functionality' },
  3: { label: 'Experiment', color: 'green', description: 'User-accessible experiment pages' },
  4: { label: 'Open', color: 'cyan', description: 'Public access pages' },
  5: { label: 'Maintenance', color: 'orange', description: 'Maintenance pages' },
  6: { label: 'Global Values', color: 'violet', description: 'Global configuration' },
  7: { label: 'Emails', color: 'pink', description: 'Email templates' },
  8: { label: 'Global CSS', color: 'indigo', description: 'Global styling' },
  9: { label: 'Security', color: 'red', description: 'Security related pages' },
};

export function AclSelector({
  selectedPages,
  onChange,
  pageFilter = 'all',
  readonly = false,
  showPermissionTypes = true,
  maxHeight = 400,
}: IAclSelectorProps) {
  const { 
    pages, 
    systemPages, 
    regularPages, 
    configurationPages, 
    isLoading 
  } = useAdminPages();

  // Filter pages based on the pageFilter prop
  const filteredPages = useMemo(() => {
    let pagesToShow = pages;

    switch (pageFilter) {
      case 'experiment-only':
        // Only show experiment pages (type 3)
        pagesToShow = pages.filter(page => page.id_type === 3);
        break;
      case 'menu-footer':
        // Show experiment pages but exclude system and configuration pages
        pagesToShow = regularPages.filter(page => page.id_type === 3);
        break;
      case 'all':
      default:
        // Show all pages including system and configuration
        pagesToShow = pages;
        break;
    }

    return pagesToShow.map(page => ({
      id: page.id_pages,
      keyword: page.keyword,
      title: page.keyword,
      type: page.id_type || 3,
      isSystem: Boolean(page.is_system),
      isConfiguration: (page.id_type || 0) > 3,
      permissions: {
        select: selectedPages.some(p => p.id === page.id_pages && p.permissions.select),
        insert: selectedPages.some(p => p.id === page.id_pages && p.permissions.insert),
        update: selectedPages.some(p => p.id === page.id_pages && p.permissions.update),
        delete: selectedPages.some(p => p.id === page.id_pages && p.permissions.delete),
      },
    }));
  }, [pages, systemPages, regularPages, configurationPages, pageFilter, selectedPages]);

  // Group pages by type for better organization
  const groupedPages = useMemo(() => {
    const groups: Record<string, typeof filteredPages> = {};
    
    filteredPages.forEach(page => {
      const typeInfo = PAGE_TYPE_INFO[page.type] || { label: 'Other', color: 'gray', description: '' };
      const groupKey = `${page.type}_${typeInfo.label}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(page);
    });

    return groups;
  }, [filteredPages]);

  const handlePermissionChange = (pageId: number, permissionType: keyof IAclPage['permissions'], checked: boolean) => {
    if (readonly) return;

    const existingPageIndex = selectedPages.findIndex(p => p.id === pageId);
    const pageData = filteredPages.find(p => p.id === pageId);
    
    if (!pageData) return;

    let updatedPages = [...selectedPages];

    if (existingPageIndex >= 0) {
      // Update existing page permissions
      updatedPages[existingPageIndex] = {
        ...updatedPages[existingPageIndex],
        permissions: {
          ...updatedPages[existingPageIndex].permissions,
          [permissionType]: checked,
        },
      };

      // Remove page if all permissions are false
      const hasAnyPermission = Object.values(updatedPages[existingPageIndex].permissions).some(Boolean);
      if (!hasAnyPermission) {
        updatedPages.splice(existingPageIndex, 1);
      }
    } else if (checked) {
      // Add new page with the specific permission
      const newPage: IAclPage = {
        id: pageId,
        keyword: pageData.keyword,
        title: pageData.title,
        type: pageData.type,
        isSystem: pageData.isSystem,
        isConfiguration: pageData.isConfiguration,
        permissions: {
          select: permissionType === 'select',
          insert: permissionType === 'insert',
          update: permissionType === 'update',
          delete: permissionType === 'delete',
        },
      };
      updatedPages.push(newPage);
    }

    onChange(updatedPages);
  };

  const getFilterDescription = () => {
    switch (pageFilter) {
      case 'experiment-only':
        return 'Showing only experiment pages that users can access';
      case 'menu-footer':
        return 'Showing only user-accessible pages (excludes system and configuration pages)';
      case 'all':
      default:
        return 'Showing all pages including system and configuration pages';
    }
  };

  if (isLoading) {
    return <Text size="sm" c="dimmed">Loading pages...</Text>;
  }

  return (
    <Stack gap="sm">
      <Alert icon={<IconInfoCircle size="1rem" />} variant="light" color="blue">
        <Text size="sm">{getFilterDescription()}</Text>
      </Alert>

      <ScrollArea h={maxHeight}>
        <Stack gap="md">
          {Object.entries(groupedPages).map(([groupKey, groupPages]) => {
            const [, typeName] = groupKey.split('_');
            const typeId = parseInt(groupKey.split('_')[0]);
            const typeInfo = PAGE_TYPE_INFO[typeId] || { label: 'Other', color: 'gray', description: '' };

            return (
              <Paper key={groupKey} p="sm" withBorder>
                <Group justify="space-between" mb="xs">
                  <Group gap="xs">
                    <Badge color={typeInfo.color} variant="light">
                      {typeInfo.label}
                    </Badge>
                    <Text size="sm" fw={500}>{typeName} Pages</Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {groupPages.length} pages
                  </Text>
                </Group>

                <Stack gap="xs">
                  {groupPages.map(page => (
                    <Paper key={page.id} p="xs" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Group gap="xs">
                            <Text size="sm" fw={500}>
                              {page.keyword}
                            </Text>
                            {page.title && (
                              <Text size="xs" c="dimmed">
                                ({page.title})
                              </Text>
                            )}
                            {page.isSystem && (
                              <Tooltip label="System Page">
                                <IconLock size="0.875rem" color="var(--mantine-color-orange-6)" />
                              </Tooltip>
                            )}
                            {page.isConfiguration && (
                              <Badge size="xs" color="purple" variant="outline">
                                Config
                              </Badge>
                            )}
                          </Group>
                        </Group>

                        {showPermissionTypes && (
                          <Group gap="lg">
                            {(['select', 'insert', 'update', 'delete'] as const).map(permission => (
                              <Checkbox
                                key={permission}
                                label={permission.charAt(0).toUpperCase() + permission.slice(1)}
                                size="xs"
                                checked={page.permissions[permission]}
                                onChange={(event) => 
                                  handlePermissionChange(page.id, permission, event.currentTarget.checked)
                                }
                                disabled={readonly}
                              />
                            ))}
                          </Group>
                        )}
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </ScrollArea>

      {selectedPages.length > 0 && (
        <Paper p="sm" withBorder style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
          <Text size="sm" fw={500} mb="xs">
            Selected Pages ({selectedPages.length})
          </Text>
          <Group gap="xs">
            {selectedPages.slice(0, 5).map(page => (
              <Badge key={page.id} variant="filled" size="sm">
                {page.keyword}
              </Badge>
            ))}
            {selectedPages.length > 5 && (
              <Badge variant="outline" size="sm">
                +{selectedPages.length - 5} more
              </Badge>
            )}
          </Group>
        </Paper>
      )}
    </Stack>
  );
} 