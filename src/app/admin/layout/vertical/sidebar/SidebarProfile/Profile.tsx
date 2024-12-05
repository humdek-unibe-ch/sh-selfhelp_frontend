"use client"

import React from 'react';
import { useSelector } from "@/store/hooks";
import { AppState } from "@/store/store";
import {
  IconCaretDownFilled,
  IconUser,
  IconMail,
  IconLock,
  IconSettings,
  IconLogout,
} from "@tabler/icons-react";
import { 
  Box, 
  Avatar, 
  Text, 
  Menu, 
  UnstyledButton, 
  Divider,
  rem,
  useMantineTheme
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { BREAKPOINTS } from '@/utils/theme/Theme';

export const Profile = () => {
  const [anchorEl2, setAnchorEl2] = React.useState<null | HTMLElement>(null);
  const customizer = useSelector((state: AppState) => state.customizer);
  const theme = useMantineTheme();
  const lgUp = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);

  const handleClick2 = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl2(event.currentTarget);
  };
  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  const ProfileContent = () => {
    return (
      <>
        <Box style={{ padding: '12px 24px 8px 24px' }}>
          <Box style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              src={"/images/profile/user-1.jpg"} 
              alt="profile" 
              radius="xl"
              size="lg"
            />
            <Box style={{ marginLeft: '1rem', overflow: 'hidden' }}>
              <Text fw={600} size="sm" truncate>
                Mathew Anderson
              </Text>
              <Text size="xs" c="dimmed" truncate>
                Designer
              </Text>
            </Box>
          </Box>
        </Box>
        <Divider my="sm" />
      </>
    );
  };

  return (
    <Box>
      {customizer.isCollapse && !customizer.isSidebarHover ? (
        <Box style={{ px: 3, pt: 3, pb: 1 }}>
          <Avatar
            src={"/images/profile/user-1.jpg"}
            alt="profile"
            radius="xl"
            size="lg"
          />
        </Box>
      ) : (
        <>
          <Box
            style={{
              padding: '12px 24px 8px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box style={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                src={"/images/profile/user-1.jpg"}
                alt="profile"
                radius="xl"
                size="lg"
              />
              <Box ml="md" style={{ overflow: 'hidden' }}>
                <Text fw={600} size="sm" truncate>
                  Mathew Anderson
                </Text>
                <Text size="xs" c="dimmed" truncate>
                  Designer
                </Text>
              </Box>
            </Box>
            <Menu
              width={200}
              position="right-end"
              offset={15}
              opened={Boolean(anchorEl2)}
              onChange={handleClose2}
            >
              <Menu.Target>
                <UnstyledButton
                  onClick={handleClick2}
                  style={{
                    ml: 1,
                    padding: rem(8),
                    borderRadius: theme.radius.sm,
                    '&:hover': {
                      backgroundColor: theme.colors.gray[1]
                    }
                  }}
                >
                  <IconCaretDownFilled size="1.2rem" />
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconUser size={16} />}>
                  My Profile
                </Menu.Item>
                <Menu.Item leftSection={<IconMail size={16} />}>
                  My Account
                </Menu.Item>
                <Menu.Item leftSection={<IconLock size={16} />}>
                  Lock Screen
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item leftSection={<IconSettings size={16} />}>
                  Account Settings
                </Menu.Item>
                <Menu.Item leftSection={<IconLogout size={16} />} color="red">
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Box>
          <Divider my="sm" />
        </>
      )}
    </Box>
  );
};
