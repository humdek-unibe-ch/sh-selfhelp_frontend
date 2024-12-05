import { useState } from 'react';
import { IconSearch, IconX } from '@tabler/icons-react';
import Link from 'next/link';
import { useNavigation } from '@/hooks/useNavigation';
import { IMenuitemsType } from '@/types/layout/sidebar';
import { 
  ActionIcon, 
  Modal, 
  TextInput, 
  Group, 
  Box, 
  Text, 
  Stack,
  UnstyledButton,
  Divider,
  ScrollArea
} from '@mantine/core';

const Search = () => {
  const [opened, setOpened] = useState(false);
  const [search, setSearch] = useState('');
  const { menuItems = [] } = useNavigation();

  const handleClose = () => {
    setOpened(false);
    setSearch('');
  };

  const filterRoutes = (menuItems: IMenuitemsType[], searchTerm: string) => {
    if (!searchTerm) return menuItems;
    return menuItems.filter((menuItem) =>
      menuItem.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menuItem.href?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const searchData = filterRoutes(menuItems, search);

  return (
    <>
      <ActionIcon
        variant="transparent"
        color="white"
        size="lg"
        onClick={() => setOpened(true)}
        aria-label="Search"
      >
        <IconSearch size="1.3rem" />
      </ActionIcon>

      <Modal
        opened={opened}
        onClose={handleClose}
        size="md"
        yOffset={30}
        title={
          <Group justify="space-between" w="100%">
            <TextInput
              placeholder="Search here"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
            <ActionIcon variant="subtle" onClick={handleClose} size="sm">
              <IconX size="1rem" />
            </ActionIcon>
          </Group>
        }
        styles={{
          title: {
            width: '100%',
          },
          header: {
            padding: 'var(--mantine-spacing-md)',
            marginBottom: 0,
          }
        }}
      >
        <Divider />
        <ScrollArea h="60vh">
          <Box p="md">
            <Text fw={500} size="lg" mb="xs">Quick Page Links</Text>
            <Stack gap="xs">
              {searchData.map((menuItem) => (
                <UnstyledButton
                  key={menuItem.href}
                  component={Link}
                  href={menuItem.href ?? '#'}
                >
                  <Box py="xs">
                    <Text size="sm" fw={500}>{menuItem.title}</Text>
                    <Text size="xs" c="dimmed">{menuItem.href}</Text>
                  </Box>
                </UnstyledButton>
              ))}
            </Stack>
          </Box>
        </ScrollArea>
      </Modal>
    </>
  );
};

export default Search;
