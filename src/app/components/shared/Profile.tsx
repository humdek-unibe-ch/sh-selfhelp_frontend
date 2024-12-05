/**
 * @fileoverview Profile component that handles user authentication state and profile menu
 * in the application header. Provides user information display and logout functionality.
 */

"use client";
import { useState } from "react";
import { Menu, Avatar, Text, Divider, Button, ActionIcon, Stack, Group, Paper } from "@mantine/core";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { jwtDecode, JwtPayload } from "jwt-decode";

/**
 * Interface for decoded JWT token with user information
 */
interface UserToken extends JwtPayload {
  sub?: string;  // User ID
}

/**
 * Profile component displays user information and authentication controls.
 * Features a dropdown menu with user details and logout functionality.
 * 
 * Features:
 * - User avatar display
 * - Profile dropdown menu
 * - User information display
 * - Logout functionality
 * - JWT token handling
 * 
 * @component
 * @example
 * return (
 *   <Header>
 *     <Profile />
 *   </Header>
 * )
 */
const Profile = () => {
  // State for managing the profile menu anchor element
  const [opened, setOpened] = useState(false);
  
  // Authentication hooks and context
  const { accessToken } = useAuthContext();
  const { logout } = useAuth();

  // Decode JWT token to get user information
  const decodedToken = accessToken ? jwtDecode<UserToken>(accessToken) : null;

  /**
   * Handles user logout process
   * Closes the menu and calls the logout function from useAuth hook
   */
  const handleLogout = async () => {
    try {
      setOpened(false);
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Menu 
      opened={opened}
      onChange={setOpened}
      position="bottom-end"
      offset={5}
      width={300}
      withArrow
      arrowPosition="center"
    >
      <Menu.Target>
        <ActionIcon
          size="xl"
          variant={opened ? "filled" : "subtle"}
          color={opened ? "blue" : "gray"}
          radius="xl"
        >
          <Avatar
            src="/images/profile/user2.jpg"
            alt="User"
            size="md"
            radius="xl"
          />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Paper p="md" withBorder={false}>
          <Stack gap="md">
            <Group>
              <Avatar
                src="/images/profile/user2.jpg"
                alt="User"
                size={64}
                radius="xl"
              />
              <Stack gap={2}>
                <Text fw={600} size="sm">
                  User ID: {decodedToken?.sub || 'Unknown'}
                </Text>
              </Stack>
            </Group>
          </Stack>
        </Paper>
        
        <Divider />
        
        <Paper p="md" withBorder={false}>
          <Button
            fullWidth
            variant="light"
            color="red"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Paper>
      </Menu.Dropdown>
    </Menu>
  );
};

export default Profile;
