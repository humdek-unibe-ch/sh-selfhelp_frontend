"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import { 
  Box, 
  Button, 
  Group, 
  Menu,
  useMantineTheme
} from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import { useNavigation } from "@/hooks/useNavigation";
import { IMenuitemsType } from "@/types/layout/sidebar";

interface NavItemProps {
  item: IMenuitemsType;
  pathname: string;
}

const NavItem = ({ item, pathname }: NavItemProps) => {
  const [opened, setOpened] = useState(false);
  const theme = useMantineTheme();
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (hasChildren) {
      event.preventDefault();
      setOpened(!opened);
    }
  };

  return (
    <>
      <Menu 
        opened={opened} 
        onChange={setOpened}
        trigger="hover"
        openDelay={100}
        closeDelay={200}
      >
        <Menu.Target>
          <NextLink
            href={item.href || '#'}
            style={{ textDecoration: 'none' }}
            onClick={handleClick}
            prefetch={false}
          >
            <Button
              component="a"
              variant="subtle"
              color="gray"
              rightSection={hasChildren ? <IconChevronDown size={16} /> : null}
              className={pathname === item.href ? "active" : ""}
              styles={(theme) => ({
                root: {
                  color: theme.colors.gray[7],
                  fontWeight: 500,
                  fontSize: "15px",
                  padding: "8px 16px",
                  "&:hover": {
                    backgroundColor: theme.colors.blue[6] + '15',
                  },
                  "&.active": {
                    color: theme.colors.blue[6],
                    backgroundColor: theme.colors.blue[6] + '15',
                  },
                },
              })}
            >
              {item.title}
            </Button>
          </NextLink>
        </Menu.Target>

        {hasChildren && (
          <Menu.Dropdown>
            {item.children?.map((child, index) => (
              <NextLink
                key={child.href || index}
                href={child.href || '#'}
                style={{ textDecoration: 'none' }}
                prefetch={false}
              >
                <Menu.Item
                  component="a"
                  className={pathname === child.href ? "active" : ""}
                  style={{
                    fontSize: "14px",
                    minHeight: "36px",
                  }}
                  data-active={pathname === child.href}
                  bg={pathname === child.href ? theme.colors.blue[6] + '15' : undefined}
                  c={pathname === child.href ? theme.colors.blue[6] : theme.colors.gray[7]}
                >
                  {child.title}
                </Menu.Item>
              </NextLink>
            ))}
          </Menu.Dropdown>
        )}
      </Menu>
    </>
  );
};

const Navigations = () => {
  const pathname = usePathname();
  const { menuItems } = useNavigation();

  return (
    <Box>
      <Group gap="xs">
        {menuItems.map((item, i) => (
          <NavItem key={item.href || i} item={item} pathname={pathname} />
        ))}
      </Group>
    </Box>
  );
};

export default Navigations;
