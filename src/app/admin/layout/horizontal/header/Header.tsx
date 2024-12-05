import * as React from "react";
import { useSelector, useDispatch } from "@/store/hooks";
import { toggleMobileSidebar } from "@/store/customizer/CustomizerSlice";
import { IconMenu2 } from "@tabler/icons-react";
import Search from "../../vertical/header/Search";
import Logo from "../../shared/logo/Logo";
import { AppState } from "@/store/store";
import SystemControls from "@/app/components/shared/SystemControls";
import { Box, Container, ActionIcon, Group } from "@mantine/core";
import { useViewportSize } from '@mantine/hooks';
import { BREAKPOINT_VALUES } from '@/utils/theme/Theme';

const Header = () => {
    const { width } = useViewportSize();
    const lgDown = width < BREAKPOINT_VALUES.lg * 16; // Convert em to px
    const lgUp = width >= BREAKPOINT_VALUES.lg * 16; // Convert em to px

    const customizer = useSelector((state: AppState) => state.customizer);
    const dispatch = useDispatch();

    return (
        <Box
            component="header"
            style={{
                position: "sticky",
                top: 0,
                boxShadow: 'var(--mantine-shadow-lg)',
                background: 'var(--mantine-color-blue-filled)',
                backdropFilter: "blur(4px)",
                minHeight: customizer.TopbarHeight,
                zIndex: 100,
            }}
        >
            <Container 
                size={customizer.isLayout === "boxed" ? "lg" : "100%"}
                h="100%"
            >
                <Group justify="space-between" h="100%">
                    <Group>
                        <Box w={lgDown ? 40 : "auto"} style={{ overflow: "hidden" }}>
                            <Logo />
                        </Box>
                        {lgDown && (
                            <ActionIcon
                                variant="transparent"
                                color="white"
                                onClick={() => dispatch(toggleMobileSidebar())}
                                aria-label="menu"
                            >
                                <IconMenu2 />
                            </ActionIcon>
                        )}
                        <Search />
                    </Group>
                    <SystemControls />
                </Group>
            </Container>
        </Box>
    );
};

export default Header;
