import NavListing from './NavListing/NavListing';
import AuthLogo from '../../shared/logo/AuthLogo';
import { useSelector, useDispatch } from '@/store/hooks';
import { toggleMobileSidebar } from '@/store/customizer/CustomizerSlice';
import SidebarItems from '../../vertical/sidebar/SidebarItems';
import { AppState } from '@/store/store';
import { Profile } from '../../vertical/sidebar/SidebarProfile/Profile';
import { Box, Container, Drawer } from '@mantine/core';
import { useViewportSize } from '@mantine/hooks';
import { BREAKPOINT_VALUES } from '@/utils/theme/Theme';

const Navigation = () => {
  const { width } = useViewportSize();
  const lgUp = width >= BREAKPOINT_VALUES.lg;
  const customizer = useSelector((state: AppState) => state.customizer);
  const dispatch = useDispatch();

  if (lgUp) {
    return (
      <Box style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }} py={2}>
        <Container
          size={customizer.isLayout === 'boxed' ? 'lg' : '100%'}
        >
          <NavListing />
        </Container>
      </Box>
    );
  }

  return (
    <Drawer
      position="left"
      opened={customizer.isMobileSidebar || false}
      onClose={() => dispatch(toggleMobileSidebar())}
      size={customizer.SidebarWidth}
      styles={{
        content: {
          border: 0,
          boxShadow: 'var(--mantine-shadow-lg)'
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
};

export default Navigation;
