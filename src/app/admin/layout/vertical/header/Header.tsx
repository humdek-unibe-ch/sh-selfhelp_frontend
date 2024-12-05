/**
 * @fileoverview Admin header component that provides navigation and system controls
 * for the admin dashboard. Features responsive design and mobile menu functionality.
 */

"use client";
import { useSelector, useDispatch } from "@/store/hooks";
import {
    toggleSidebar,
    toggleMobileSidebar,
} from "@/store/customizer/CustomizerSlice";
import { IconMenu2 } from "@tabler/icons-react";
import Search from "./Search";
import { AppState } from "@/store/store";
import Logo from "../../shared/logo/Logo";
import { useEffect, useState } from "react";
import SystemControls from "@/app/components/shared/SystemControls";
import { useMediaQuery } from '@mantine/hooks';
import { BREAKPOINT_VALUES } from '@/utils/theme/Theme';
import { Box, Group, ActionIcon } from '@mantine/core';

/**
 * Header Component - Main navigation header for the admin dashboard
 * 
 * Features:
 * - Responsive layout with mobile menu toggle
 * - Search functionality
 * - System controls (theme, profile)
 * - Sidebar toggle for desktop view
 * - Company logo
 * 
 * @component
 */
const Header = () => {
    // State for mobile menu height
    const [height, setHeight] = useState('0px');
    
    // Media query hook for responsive design
    const lgUp = useMediaQuery(`(min-width: ${BREAKPOINT_VALUES.lg}em)`);

    // Redux state for customization settings
    const customizer = useSelector((state: AppState) => state.customizer);

    // Calculate sidebar width based on collapse state
    const toggleWidth = customizer.isCollapse && !customizer.isSidebarHover
        ? customizer.MiniSidebarWidth
        : customizer.SidebarWidth;

    const dispatch = useDispatch();

    /**
     * Effect hook to handle window resize events
     * Resets mobile menu height when screen size changes
     */
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= BREAKPOINT_VALUES.lg * 16) { // Convert em to px
                setHeight('0px')
            }
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <Box
            component="header"
            h={customizer.TopbarHeight}
            style={{
                boxShadow: 'var(--mantine-shadow-lg)',
                background: 'var(--mantine-color-blue-filled)',
                backdropFilter: 'blur(4px)',
            }}
        >
            <Group 
                h="100%" 
                px="md" 
                justify="space-between"
                wrap="nowrap"
            >
                {/* Logo Section - Shows full logo on desktop, menu icon on mobile */}
                {lgUp ? (
                    <Box style={{ width: toggleWidth }}>
                        <Logo />
                    </Box>
                ) : (
                    <ActionIcon
                        variant="transparent"
                        color="white"
                        onClick={() => dispatch(toggleMobileSidebar())}
                        aria-label="Toggle mobile menu"
                    >
                        <IconMenu2 size="1.3rem" />
                    </ActionIcon>
                )}

                {/* Sidebar Toggle Button - Only visible on desktop */}
                {lgUp && (
                    <ActionIcon
                        variant="transparent"
                        color="white"
                        onClick={() => dispatch(toggleSidebar())}
                        aria-label="Toggle sidebar"
                    >
                        <IconMenu2 size="1.3rem" />
                    </ActionIcon>
                )}

                {/* Search Component */}
                <Search />

                {/* Spacer */}
                <Box style={{ flex: 1 }} />

                {/* System Controls - Theme, Profile, etc. */}
                <SystemControls />
            </Group>
        </Box>
    );
};

export default Header;
