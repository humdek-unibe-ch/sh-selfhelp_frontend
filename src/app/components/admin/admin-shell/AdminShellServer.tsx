import { AppShell } from "@mantine/core";
import { AdminHeaderServer } from "../admin-header/AdminHeaderServer";
import { AdminNavbarServer } from "../admin-navbar/AdminNavbarServer";

interface IAdminShellServerProps {
    children: React.ReactNode;
    userData: any;
}

/**
 * Server Component for Admin Shell
 * Renders static admin layout structure on the server
 */
export function AdminShellServer({ children, userData }: IAdminShellServerProps) {
    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: 300,
                breakpoint: 'sm',
                collapsed: { mobile: true } // Default collapsed on mobile
            }}
            padding="md"
        >
            <AppShell.Header>
                <AdminHeaderServer userData={userData} />
            </AppShell.Header>
            <AppShell.Navbar>
                <AdminNavbarServer />
            </AppShell.Navbar>
            <AppShell.Main>
                {children}
            </AppShell.Main>
        </AppShell>
    );
}
