/**
 * @fileoverview Frontend header component that provides navigation, system controls,
 * and responsive layout for both desktop and mobile views.
 */

"use client";
import React from "react";
import { IconMenu2 } from "@tabler/icons-react";
import { useSelector } from "@/store/hooks";
import { AppState } from "@/store/store";
import { Box, Container, Drawer, ActionIcon, Stack, Group } from "@mantine/core";
import { useViewportSize } from '@mantine/hooks';
import { BREAKPOINT_VALUES } from '@/utils/theme/Theme';

// Custom components
import Navigations from "./Navigations";
import MobileSidebar from "./MobileSidebar";
import AuthLogo from "@/app/admin/layout/shared/logo/AuthLogo";
import SystemControls from "@/app/components/shared/SystemControls";

/**
 * Frontend header component that provides navigation and system controls.
 * Includes responsive design for both desktop and mobile views.
 * 
 * Features:
 * - Responsive layout with different views for desktop and mobile
 * - System controls (language, theme, authentication)
 * - Mobile navigation drawer
 * - Company logo
 * 
 * @component
 */
const HpHeader = () => {
    const { width } = useViewportSize();
    const lgUp = width >= BREAKPOINT_VALUES.lg * 16; // Convert em to px
    const lgDown = width < BREAKPOINT_VALUES.lg * 16; // Convert em to px
    const [open, setOpen] = React.useState(false);
    const customizer = useSelector((state: AppState) => state.customizer);

    return (
        <Box
            component="header"
            style={{
                position: "sticky",
                top: 0,
                minHeight: "100px",
                background: 'var(--mantine-color-blue-light)',
                zIndex: 100,
            }}
        >
            <Container 
                size={customizer.isLayout === "boxed" ? "lg" : "100%"}
                h="100%"
            >
                <Group 
                    h="100%" 
                    justify="space-between" 
                    wrap="nowrap"
                    px={0}
                >
                    {/* Desktop view */}
                    {!lgDown ? (
                        <>
                            <Group gap="xl">
                                <AuthLogo />
                                <Navigations />
                            </Group>
                            <SystemControls />
                        </>
                    ) : (
                        // Mobile view
                        <>
                            <AuthLogo />
                            <Group gap="xs">
                                <SystemControls />
                                <ActionIcon
                                    variant="subtle"
                                    onClick={() => setOpen(true)}
                                    aria-label="menu"
                                >
                                    <IconMenu2 size="1.3rem" />
                                </ActionIcon>
                            </Group>
                            <Drawer
                                position="right"
                                opened={open}
                                onClose={() => setOpen(false)}
                                size="280px"
                                styles={{
                                    content: {
                                        background: 'var(--mantine-color-body)',
                                    }
                                }}
                            >
                                <MobileSidebar />
                            </Drawer>
                        </>
                    )}
                </Group>
            </Container>
        </Box>
    );
};

export default HpHeader;
