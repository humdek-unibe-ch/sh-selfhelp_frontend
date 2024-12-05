import React, { useState } from 'react';
import {
  IconApps,
  IconCalendarEvent,
  IconChevronDown,
  IconChevronUp,
  IconGridDots,
  IconMail,
  IconMessages,
} from '@tabler/icons-react';
import Link from 'next/link';
import { Box, List, Drawer, ActionIcon, Text, UnstyledButton, Group } from '@mantine/core';

const MobileRightSidebar = () => {
  const [showDrawer, setShowDrawer] = useState(false);
  const [open, setOpen] = useState(true);

  const handleClick = () => {
    setOpen(!open);
  };

  const cartContent = (
    <Box>
      <Box px="md">
        <List listStyleType="none" spacing="xs">
          <UnstyledButton component={Link} href="/apps/chats">
            <Group gap="xs">
              <IconMessages size="1.3rem" stroke={1.5} />
              <Text fw={600} size="sm">Chats</Text>
            </Group>
          </UnstyledButton>

          <UnstyledButton component={Link} href="/apps/calendar">
            <Group gap="xs">
              <IconCalendarEvent size="1.3rem" stroke={1.5} />
              <Text fw={600} size="sm">Calendar</Text>
            </Group>
          </UnstyledButton>

          <UnstyledButton component={Link} href="/apps/email">
            <Group gap="xs">
              <IconMail size="1.3rem" stroke={1.5} />
              <Text fw={600} size="sm">Email</Text>
            </Group>
          </UnstyledButton>

          <UnstyledButton onClick={handleClick}>
            <Group gap="xs" justify="space-between">
              <Group gap="xs">
                <IconApps size="1.3rem" stroke={1.5} />
                <Text fw={600} size="sm">Apps</Text>
              </Group>
              {open ? (
                <IconChevronDown size="1.3rem" stroke={1.5} />
              ) : (
                <IconChevronUp size="1.3rem" stroke={1.5} />
              )}
            </Group>
          </UnstyledButton>
        </List>
      </Box>
    </Box>
  );

  return (
    <Box c="white">
      <ActionIcon
        size="lg"
        variant="transparent"
        color="white"
        onClick={() => setShowDrawer(true)}
      >
        <IconGridDots size="1.3rem" stroke={1.5} />
      </ActionIcon>

      <Drawer
        opened={showDrawer}
        onClose={() => setShowDrawer(false)}
        position="right"
        size={300}
      >
        <Box p="md" pb={0}>
          <Text size="lg" fw={600}>Navigation</Text>
        </Box>
        {cartContent}
      </Drawer>
    </Box>
  );
};

export default MobileRightSidebar;
