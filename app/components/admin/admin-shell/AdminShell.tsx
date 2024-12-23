'use client';

import { AppShell, MantineProvider } from "@mantine/core";
import { AdminHeader } from "../admin-header/AdminHeader";
import { AdminNavbar } from "../admin-navbar/AdminNavbar";
import { theme } from "../../../../theme";

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <MantineProvider theme={theme}>
      <AppShell
        header={{ height: 60 }}
        navbar={{ width: 300, breakpoint: 'sm' }}
        padding="md"
      >
        <AppShell.Header>
          <AdminHeader />
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