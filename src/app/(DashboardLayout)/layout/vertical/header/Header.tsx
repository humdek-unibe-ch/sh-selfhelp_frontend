import {
    IconButton,
    Box,
    AppBar,
    useMediaQuery,
    Toolbar,
    styled,
    Stack,
} from "@mui/material";
import { useSelector, useDispatch } from "@/store/hooks";
import {
    toggleSidebar,
    toggleMobileSidebar,
} from "@/store/customizer/CustomizerSlice";
import { IconMenu2, IconDots } from "@tabler/icons-react";
import Notifications from "./Notification";
import Profile from "./Profile";
import Search from "./Search";
import Language from "./Language";
import { AppState } from "@/store/store";
import MobileRightSidebar from "./MobileRightSidebar";
import Logo from "../../shared/logo/Logo";
import AppDD from "./Navigation";
import { useEffect, useState } from "react";
import Messages from "./Messages";
import DarkLightMode from "./DarkLightMode";
import SystemControls from "../../shared/SystemControls";


const Header = () => {
    const [height, setHeight] = useState('0px');


    const handleChange = () => {
        height == '0px' ? setHeight('auto') : setHeight('0px')
    };
    const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up("lg"));
    const lgDown = useMediaQuery((theme: any) => theme.breakpoints.down("lg"));



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
                    {lgUp ? (
                        <>
                            <Search />
                        </>
                    ) : null}

                    {lgUp ? (
                        <>
                            <AppDD />
                        </>
                    ) : null}

                    <Box flexGrow={1} />

                    {lgUp ? (
                        <SystemControls isLoggedIn={false} /> // Set isLoggedIn based on your auth state
                    ) : <Box
                        display='flex'
                        justifyContent="center"
                        sx={{
                            width: toggleWidth,
                        }}
                    >
                        <Logo />
                    </Box>}
                    {lgUp ? (
                        null
                    ) : <>
                        <Box flexGrow={1} />
                    </>}
                    {lgUp ? (
                        null
                    ) :
                        <>
                            <IconButton
                                onClick={handleChange}
                                aria-label="show 4 new mails"
                                color="inherit"
                                size="large"
                            >
                                <IconDots size="22" />
                            </IconButton>
                        </>}
                </ToolbarStyled>
                <Box
                    sx={{
                        maxHeight: { height },
                        width: '100%',
                        backgroundColor: "transparent",
                        transition: "all 2s ease",
                        overflow: "hidden"
                    }}>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={0}
                        paddingX={3}
                    >
                        <Stack spacing={0.5} direction="row" alignItems="center">
                            {/* ------------------------------------------- */}
                            {/* Notification Dropdown */}
                            {/* ------------------------------------------- */}
                            <Notifications />
                            {/* ------------------------------------------- */}
                            {/* Messages Dropdown */}
                            {/* ------------------------------------------- */}
                            <Messages />

                            {/* ------------------------------------------- */}
                            {/* Toggle Right Sidebar for mobile */}
                            {/* ------------------------------------------- */}
                            {lgDown ? <MobileRightSidebar /> : null}
                        </Stack>
                        <Stack spacing={0.5} direction="row" alignItems="center">
                            {/* ------------------------------------------- */}
                            {/* Language */}
                            {/* ------------------------------------------- */}
                            <Language />
                            {/* ------------------------------------------- */}
                            {/* DarkLightMode */}
                            {/* ------------------------------------------- */}
                            <DarkLightMode />
                            {/* ------------------------------------------- */}
                            {/* Profile */}
                            {/* ------------------------------------------- */}
                            <Profile />
                        </Stack>
                    </Stack>
                </Box>
            </AppBarStyled>
        </>
    );
};

export default Header;
