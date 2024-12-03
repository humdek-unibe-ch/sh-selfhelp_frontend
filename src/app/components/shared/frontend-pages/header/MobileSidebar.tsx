/**
 * @fileoverview Mobile sidebar navigation component that displays a collapsible menu
 * for mobile and tablet views of the application.
 */

"use client";
import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

// Custom components and hooks
import Logo from "@/app/admin/layout/shared/logo/Logo";
import { useNavigation } from "@/hooks/useNavigation";

/**
 * MobileSidebar component provides a responsive navigation menu for mobile devices.
 * It displays the application logo and a vertical stack of navigation links.
 * 
 * Features:
 * - Responsive design optimized for mobile views
 * - Company logo display
 * - Dynamic navigation menu using useNavigation hook
 * - Vertical button layout for easy touch interaction
 * 
 * @component
 * @example
 * return (
 *   <Drawer>
 *     <MobileSidebar />
 *   </Drawer>
 * )
 */
const MobileSidebar = () => {
    // Get navigation menu items from the custom hook
    const { menuItems } = useNavigation();

    return (
        <>
            {/* Logo section */}
            <Box px={3}>
                <Logo />
            </Box>

            {/* Navigation buttons section */}
            <Box p={3}>
                <Stack direction="column" spacing={2}>
                    {menuItems.map((navlink, i) => (
                        <Button
                            color="inherit"
                            href={navlink.href}
                            key={i}
                            sx={{
                                justifyContent: "start",
                            }}
                        >
                            {navlink.title}{" "}
                        </Button>
                    ))}
                </Stack>
            </Box>
        </>
    );
};

export default MobileSidebar;
