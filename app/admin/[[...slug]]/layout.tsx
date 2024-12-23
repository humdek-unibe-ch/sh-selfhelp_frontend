'use client';

import "@mantine/core/styles.css";
import React from "react";
import { MantineProvider, ColorSchemeScript, AppShell } from "@mantine/core";
import { theme } from "../../../theme";
import { AdminHeader } from "../../components/admin/admin-header/AdminHeader";
import { AdminNavbar } from "../../components/admin/admin-navbar/AdminNavbar";

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
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
      </body>
    </html>
  );
}
