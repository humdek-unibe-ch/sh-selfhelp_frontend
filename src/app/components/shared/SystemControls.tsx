/**
 * @fileoverview SystemControls component that provides a unified interface for system-wide
 * controls including language selection, theme toggling, and authentication actions.
 */

"use client";
import Language from "../../admin/layout/vertical/header/Language";
import DarkLightMode from "../../admin/layout/vertical/header/DarkLightMode";
import Profile from "./Profile";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@mantine/core";
import { Stack } from "@mantine/core";

/**
 * SystemControls component provides a collection of system-wide controls
 * displayed in the application header.
 * 
 * Features:
 * - Language selection dropdown
 * - Dark/Light theme toggle
 * - Authentication controls (Login button or Profile menu)
 * - Responsive layout using MUI Stack
 * 
 * The component adapts its display based on the authentication state:
 * - When authenticated: Shows the Profile component
 * - When not authenticated: Shows a Login button
 * 
 * @component
 * @example
 * return (
 *   <Header>
 *     <SystemControls />
 *   </Header>
 * )
 */
const SystemControls = () => {
    const { isAuthenticated } = useAuthContext();

    return (
        <Stack gap="xs" justify="center" align="center">
            <Language />
            <DarkLightMode />
            {isAuthenticated ? (
                <Profile />
            ) : (
                <Button 
                    component="a"
                    href="/auth/auth1/login"
                    aria-label="Login to account"
                >
                    Login
                </Button>
            )}
        </Stack>
    );
};

export default SystemControls;