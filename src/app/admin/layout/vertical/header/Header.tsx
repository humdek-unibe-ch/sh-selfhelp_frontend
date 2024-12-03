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

const Header = () => {
    const [height, setHeight] = useState('0px');
    const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up("lg"));

    // drawer
    const customizer = useSelector((state: AppState) => state.customizer);

    const toggleWidth =
        customizer.isCollapse && !customizer.isSidebarHover
            ? customizer.MiniSidebarWidth
            : customizer.SidebarWidth;

    const dispatch = useDispatch();

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
    const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
        width: "100%",
        color: theme.palette.warning.contrastText,
    }));

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
                    {/* ------------------------------------------- */}
                    {/* Logo */}
                    {/* ------------------------------------------- */}

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
                    {/* ------------------------------------------- */}
                    {/* Toggle Button Sidebar */}
                    {/* ------------------------------------------- */}

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

                    {/* ------------------------------------------- */}
                    {/* Search Dropdown */}
                    {/* ------------------------------------------- */}
                    <Search />
                    <Box flexGrow={1} />
                    <SystemControls />

                </ToolbarStyled>
            </AppBarStyled>
        </>
    );
};

export default Header;
