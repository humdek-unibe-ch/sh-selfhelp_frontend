"use client";

import { NavLink, ScrollArea } from '@mantine/core';
import { IconFile, IconFingerprint, IconGauge, IconChartBar, IconUsers } from '@tabler/icons-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useNavigation } from '@refinedev/core';

interface NavItem {
  label: string;
  link?: string;
  icon?: any;
  initiallyOpened?: boolean;
  links?: NavItem[];
}

const mockdata: NavItem[] = [
  {
    label: 'Dashboard',
    icon: IconGauge,
    link: '/admin/dashboard'
  },
  {
    label: 'Analytics',
    icon: IconChartBar,
    initiallyOpened: false,
    links: [
      { label: 'Overview', link: '/admin/analytics/overview' },
      { label: 'Reports', link: '/admin/analytics/reports' },
      { label: 'Real-time', link: '/admin/analytics/real-time' }
    ]
  },
  {
    label: 'User Management',
    icon: IconUsers,
    initiallyOpened: false,
    links: [
      { label: 'Users List', link: '/admin/users' },
      { label: 'Roles', link: '/admin/roles' },
      { label: 'Permissions', link: '/admin/permissions' }
    ]
  },
  {
    label: 'Content',
    icon: IconFile,
    initiallyOpened: false,
    links: [
      { 
        label: 'Pages', 
        link: '/admin/content/pages',
        links: [
          { label: 'Pages2', link: '/admin/content/pages2' },
          { label: 'Blog Posts2', link: '/admin/content/blog2' },
          { label: 'Media Library2', link: '/admin/content/media2' }
        ]
      },
      { label: 'Blog Posts', link: '/admin/content/blog' },
      { label: 'Media Library', link: '/admin/content/media' }
    ]
  },
  {
    label: 'Security',
    icon: IconFingerprint,
    initiallyOpened: false,
    links: [
      { label: 'Settings', link: '/admin/security/settings' },
      { label: 'Audit Log', link: '/admin/security/audit' }
    ]
  }
];

export function AdminNavbar() {
  const pathname = usePathname();
  const [openItems, setOpenItems] = useState<string[]>([]);
  const { push } = useNavigation();

  const handleClick = (link: string) => {
    push(link);
  };

  const toggleItem = (label: string) => {
    setOpenItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.link;
    const isOpen = openItems.includes(item.label);
    const hasNestedLinks = item.links && item.links.length > 0;

    return (
      <NavLink
        key={item.label}
        label={item.label}
        leftSection={item.icon && <item.icon size="1rem" stroke={1.5} />}
        childrenOffset={28}
        opened={isOpen}
        active={isActive}
        onClick={() => {
          if (hasNestedLinks) {
            toggleItem(item.label);
          } else if (item.link) {
            handleClick(item.link);
          }
        }}
      >
        {hasNestedLinks && item.links?.map(renderNavItem)}
      </NavLink>
    );
  };

  return (
    <ScrollArea className="bg-[var(--mantine-color-white)] dark:bg-[var(--mantine-color-dark-6)] h-[800px] w-[300px] p-[var(--mantine-spacing-md)] pb-0 flex flex-col border-r border-[var(--mantine-color-gray-3)] dark:border-[var(--mantine-color-dark-4)]">
      {mockdata.map(renderNavItem)}
    </ScrollArea>
  );
}
