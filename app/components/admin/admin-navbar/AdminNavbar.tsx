"use client";

import { useState } from 'react';
import { Group, Code, ScrollArea, rem, Text, Collapse } from '@mantine/core';
import { IconChevronRight, IconFiles, IconLayoutDashboard, IconSettings } from '@tabler/icons-react';
import { usePathname, useRouter } from 'next/navigation';
import { SelfHelpLogo } from '../../common/SelfHelpLogo';
import { useNavigation } from '@/hooks/useNavigation';

interface NavbarLinkProps {
  icon: typeof IconFiles;
  label: string;
  active?: boolean;
  rightSection?: React.ReactNode;
  onClick?(): void;
}

function NavbarLink({ icon: Icon, label, active, rightSection, onClick }: NavbarLinkProps) {
  return (
    <button
      className={`
        w-full px-3 py-2 rounded-sm flex items-center justify-between text-sm font-medium 
        ${active 
          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300' 
          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50'
        }
        transition-colors duration-100
      `}
      onClick={onClick}
    >
      <span className="flex items-center">
        <Icon style={{ width: rem(20), height: rem(20) }} />
        <span className="ml-3">{label}</span>
      </span>
      {rightSection}
    </button>
  );
}

const systemLinks = [
  { label: 'Dashboard', icon: IconLayoutDashboard, link: '/admin' },
  { label: 'Settings', icon: IconSettings, link: '/admin/settings' },
];

export function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  // TODO rework page loading
  const { menuItems, routes, isLoading } = useNavigation(); 
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Filter root menu items (items without parents)
  const rootMenuItems = menuItems?.filter(item => !item.parent) ?? [];
  
  // Get all IDs from menu items and their children
  const menuItemIds = menuItems?.reduce<Set<number>>((ids, item) => {
    // Use Set to avoid duplicates
    ids.add(Number(item.id));
    if (item.children) {
      item.children.forEach(child => ids.add(Number(child.id)));
    }
    return ids;
  }, new Set()) ?? new Set();

  // Filter out pages that are in the menu (including children)
  const otherPages = routes.filter(route => !menuItemIds.has(Number(route.id)));

  // Filter function for search
  const matchesSearch = (text: string) => 
    text.toLowerCase().includes(search.toLowerCase());

  // Filter menu items and their children
  const filteredMenuItems = rootMenuItems.filter(item => 
    matchesSearch(item.title) || 
    item.children?.some(child => matchesSearch(child.title))
  );

  // Filter other pages
  const filteredOtherPages = otherPages.filter(page => 
    matchesSearch(page.title) || matchesSearch(page.path)
  );

  return (
    <nav className="h-full p-3">
      <ScrollArea className="h-[calc(100vh-60px)]" type="hover">
        <div className="mb-4 pl-3">
          <Group justify="apart">
            <SelfHelpLogo size={28} />
            <Code fw={700}>v1.0.0</Code>
          </Group>
        </div>

        {/* Search Input */}
        <div className="px-3 mb-4">
          <input
            type="text"
            placeholder="Search pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-sm border border-gray-200 
              dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* System Links */}
        <div className="mb-4">
          <Text className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
            System
          </Text>
          {systemLinks.map((link) => (
            <NavbarLink
              key={link.label}
              {...link}
              active={pathname === link.link}
              onClick={() => router.push(link.link)}
            />
          ))}
        </div>

        {/* Menu Pages */}
        {filteredMenuItems.length > 0 && (
          <div className="mb-4">
            <Text className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
              Menu Pages
            </Text>
            {filteredMenuItems.map((item) => (
              <div key={item.id}>
                <div className="flex">
                  <NavbarLink
                    icon={IconFiles}
                    label={item.title}
                    active={pathname === item.href}
                    onClick={() => router.push(item.href)}
                  />
                  {item.children?.length > 0 && (
                    <button
                      className="px-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      onClick={() => setOpenSection(openSection === item.id ? null : item.id)}
                    >
                      <IconChevronRight
                        className={`transform transition-transform ${
                          openSection === item.id ? 'rotate-90' : ''
                        }`}
                        size={16}
                      />
                    </button>
                  )}
                </div>
                {item.children?.length > 0 && (
                  <Collapse in={openSection === item.id}>
                    <div className="ml-4">
                      {item.children.map((child) => (
                        <NavbarLink
                          key={child.id}
                          icon={IconFiles}
                          label={child.title}
                          active={pathname === child.href}
                          onClick={() => router.push(child.href)}
                        />
                      ))}
                    </div>
                  </Collapse>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Other Pages */}
        {filteredOtherPages.length > 0 && (
          <div className="mb-4">
            <Text className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
              Other Pages
            </Text>
            {filteredOtherPages.map((page) => (
              <NavbarLink
                key={page.id}
                icon={IconFiles}
                label={page.title}
                active={pathname === page.path}
                onClick={() => router.push(page.path)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </nav>
  );
}
