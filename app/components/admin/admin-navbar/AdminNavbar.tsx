"use client";

import { useState } from 'react';
import { TextInput, NavLink, Button, Group, Stack, ScrollArea } from '@mantine/core';
import { IconSearch, IconPlus, IconFiles } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export function AdminNavbar() {
  const [search, setSearch] = useState('');
  const router = useRouter();

  // TODO: Replace with actual data fetching
  const pages = [
    { id: 1, title: 'Home', inMenu: true },
    { id: 2, title: 'About', inMenu: true },
    { id: 3, title: 'Contact', inMenu: false },
  ];

  const filteredPages = pages.filter(page => 
    page.title.toLowerCase().includes(search.toLowerCase())
  );

  const menuPages = filteredPages.filter(page => page.inMenu);
  const otherPages = filteredPages.filter(page => !page.inMenu);

  return (
    <Stack h="100%" p="xs">
      <Group justify="space-between" mb="md">
        <Button
          leftSection={<IconPlus size={14} />}
          onClick={() => router.push('/admin/pages/create')}
        >
          Add Page
        </Button>
      </Group>

      <TextInput
        placeholder="Search pages..."
        leftSection={<IconSearch size={14} />}
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="sm"
      />

      <ScrollArea>
        <Stack gap="xs">
          {menuPages.length > 0 && (
            <>
              <div style={{ fontWeight: 500 }}>Menu Pages</div>
              {menuPages.map((page) => (
                <NavLink
                  key={page.id}
                  label={page.title}
                  leftSection={<IconFiles size={14} />}
                  onClick={() => router.push(`/admin/pages/${page.id}`)}
                />
              ))}
            </>
          )}

          {otherPages.length > 0 && (
            <>
              <div style={{ fontWeight: 500, marginTop: '1rem' }}>Other Pages</div>
              {otherPages.map((page) => (
                <NavLink
                  key={page.id}
                  label={page.title}
                  leftSection={<IconFiles size={14} />}
                  onClick={() => router.push(`/admin/pages/${page.id}`)}
                />
              ))}
            </>
          )}
        </Stack>
      </ScrollArea>
    </Stack>
  );
}
