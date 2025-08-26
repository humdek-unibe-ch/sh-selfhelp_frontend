import "@mantine/core/styles.css";
import '@mantine/dates/styles.css';
import { ColorSchemeScript } from "@mantine/core";
import { Metadata } from 'next';
import { AdminRouteFrame } from "./AdminRouteFrame";

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
    <AdminRouteFrame>
      {children}
    </AdminRouteFrame>
  );
}
