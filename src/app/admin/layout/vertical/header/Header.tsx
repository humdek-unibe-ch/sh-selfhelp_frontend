/**
 * @fileoverview Admin header component that provides navigation and system controls
 * for the admin dashboard. Features responsive design and mobile menu functionality.
 */

"use client";
// Material-UI and core dependencies
import {
    IconButton,
    Box,
    AppBar,
    useMediaQuery,
    Toolbar,
    styled,
} from "@mui/material";
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
    const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up("lg"));

    // Redux state for customization settings
    const customizer = useSelector((state: AppState) => state.customizer);

    // Calculate sidebar width based on collapse state
    const toggleWidth =
        customizer.isCollapse && !customizer.isSidebarHover
            ? customizer.MiniSidebarWidth
            : customizer.SidebarWidth;

    const dispatch = useDispatch();

    /**
     * Styled AppBar component with custom height and responsive behavior
     * Includes shadow, background, and backdrop filter effects
     */
    const AppBarStyled = styled(AppBar)(({ theme }) => ({
        boxShadow:
            "0 -2px 5px -1px rgba(0, 0, 0, .2),0 5px 8px 0 rgba(0, 0, 0, .14),0 1px 4px 0 rgba(0, 0, 0, .12)!important",
        background: theme.palette.primary.main,
        justifyContent: "center",
        backdropFilter: "blur(4px)",
        [theme.breakpoints.up("lg")]: {
            minHeight: customizer.TopbarHeight,
        },
    }));

    /**
     * Styled Toolbar component with custom width and color
     */
    const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
        width: "100%",
        color: theme.palette.warning.contrastText,
    }));

    /**
     * Effect hook to handle window resize events
     * Resets mobile menu height when screen size changes
     */
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 992) {
                setHeight('0px')
            }
        }
        window.addEventListener('resize', handleResize);

        // Cleanup function to remove event listener on unmount
        return () => window.removeEventListener('resize', handleResize);
    }, [])

    return (
        <>
            <AppBarStyled position="sticky" color="default">
                <ToolbarStyled>
                    {/* Logo Section - Shows full logo on desktop, menu icon on mobile */}
                    {lgUp ? (
                        <>
                            <Box
                                sx={{
                                    width: toggleWidth,
                                }}
                            >
                                <Logo />
                            </Box>
                        </>
                    ) : <IconButton
                        color="inherit"
                        aria-label="menu"
                        onClick={
                            lgUp
                                ? () => dispatch(toggleSidebar())
                                : () => dispatch(toggleMobileSidebar())
                        }
                    >
                        <IconMenu2 size="22" />
                    </IconButton>}

                    {/* Sidebar Toggle Button - Only visible on desktop */}
                    {lgUp ? (
                        <>
                            <IconButton
                                color="inherit"
                                aria-label="menu"
                                onClick={
                                    lgUp
                                        ? () => dispatch(toggleSidebar())
                                        : () => dispatch(toggleMobileSidebar())
                                }
                            >
                                <IconMenu2 size="22" />
                            </IconButton>
                        </>
                    ) : null}

                    {/* Search Component - Global search functionality */}
                    <Search />

                    {/* Spacer */}
                    <Box flexGrow={1} />

                    {/* System Controls - Theme, Profile, etc. */}
                    <SystemControls />
                </ToolbarStyled>
            </AppBarStyled>
        </>
    );
};

export default Header;
