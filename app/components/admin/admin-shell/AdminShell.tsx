'use client';

import { AppShell, MantineProvider } from "@mantine/core";
import { AdminHeader } from "../admin-header/AdminHeader";
import { AdminNavbar } from "../admin-navbar/AdminNavbar";
import { theme } from "../../../../theme";
import { useDisclosure } from '@mantine/hooks';

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const [opened, { toggle }] = useDisclosure();

  return (
    <MantineProvider theme={theme}>
      <AppShell
        header={{ height: 60 }}
        navbar={{ 
          width: 300, 
          breakpoint: 'sm',
          collapsed: { mobile: !opened }
        }}
        padding="md"
      >
        <AppShell.Header>
          <AdminHeader opened={opened} onToggle={toggle} />
        </AppShell.Header>
        <AppShell.Navbar>
          <AdminNavbar />
        </AppShell.Navbar>
        <AppShell.Main>
          {children}
        </AppShell.Main>
        <AppShell.Aside p="md">Aside</AppShell.Aside>
      </AppShell>
    </MantineProvider>
  );
} 