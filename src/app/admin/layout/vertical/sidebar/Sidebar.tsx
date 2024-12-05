import SidebarItems from "./SidebarItems";
import { useSelector, useDispatch } from "@/store/hooks";
import {
  hoverSidebar,
  toggleMobileSidebar,
} from "@/store/customizer/CustomizerSlice";
import Scrollbar from "@/app/components/custom-scroll/Scrollbar";
import { Profile } from "./SidebarProfile/Profile";
import { AppState } from "@/store/store";
import AuthLogo from "../../shared/logo/AuthLogo";
import { useMediaQuery } from "@mantine/hooks";
import { Box, Drawer, ScrollArea } from '@mantine/core';
import { BREAKPOINTS } from '@/utils/theme/Theme';

const Sidebar = () => {
  const lgDown = useMediaQuery(`(max-width: ${BREAKPOINTS.lg}px)`);
  const customizer = useSelector((state: AppState) => state.customizer);
  const dispatch = useDispatch();

  const toggleWidth = customizer.isCollapse && !customizer.isSidebarHover
    ? customizer.MiniSidebarWidth
    : customizer.SidebarWidth;

  const onHoverEnter = () => {
    if (customizer.isCollapse) {
      dispatch(hoverSidebar(true));
    }
  };

  const onHoverLeave = () => {
    dispatch(hoverSidebar(false));
  };

  if (lgDown) {
    return (
      <Drawer
        opened={Boolean(customizer.isMobileSidebar)}
        onClose={() => dispatch(toggleMobileSidebar())}
        size={customizer.SidebarWidth}
        styles={{
          root: {
            '& .mantine-drawer-content': {
              boxShadow: 'var(--mantine-shadow-lg)',
              border: 0,
            }
          }
        }}
      >
        <Box p="md">
          <AuthLogo />
        </Box>
        <Profile />
        <SidebarItems />
      </Drawer>
    );
  }

  return (
    <Box
      style={{
        zIndex: 100,
        width: toggleWidth,
        flexShrink: 0,
        ...(customizer.isCollapse && {
          position: "absolute",
        }),
      }}
    >
      <Drawer
        opened
        onClose={() => {}}
        onMouseEnter={onHoverEnter}
        onMouseLeave={onHoverLeave}
        withCloseButton={false}
        position="left"
        size={toggleWidth}
        styles={{
          root: {
            position: 'fixed',
            '& .mantine-drawer-content': {
              boxShadow: 'var(--mantine-shadow-sm)',
              border: 0,
              top: customizer.TopbarHeight,
              transition: 'width 0.2s ease-in-out',
            }
          }
        }}
      >
        <Box style={{ height: '100%' }}>
          <Profile />
          <ScrollArea h="calc(100% - 220px)" type="hover">
            <SidebarItems />
          </ScrollArea>
        </Box>
      </Drawer>
    </Box>
  );
};

export default Sidebar;
