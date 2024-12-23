import "@mantine/core/styles.css";
import { ColorSchemeScript } from "@mantine/core";
import { AdminShell } from "../../components/admin/admin-shell/AdminShell";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Admin',
    default: 'SelfHelp'
  },
  description: "SelfHelp Research CMS builder",
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
  icons: {
    icon: '/favicon.svg',
  },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell>
      {children}
    </AdminShell>
  );
}
