/**
 * @fileoverview Mobile sidebar navigation component that displays a collapsible menu
 * for mobile and tablet views of the application.
 */

"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import { 
  Box, 
  Button, 
  Stack,
  Collapse,
  NavLink,
  useMantineTheme
} from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import Logo from "@/app/admin/layout/shared/logo/Logo";
import { useNavigation } from "@/hooks/useNavigation";
import { IMenuitemsType } from "@/types/layout/sidebar";

interface NavItemProps {
  item: IMenuitemsType;
  pathname: string;
}

const NavItem = ({ item, pathname }: NavItemProps) => {
  const [open, setOpen] = useState(false);
  const theme = useMantineTheme();
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (hasChildren) {
      event.preventDefault();
      setOpen(!open);
    }
  };

  return (
    <>
      <NextLink
        href={item.href || '#'}
        style={{ textDecoration: 'none', width: '100%' }}
        onClick={handleClick}
        prefetch={false}
      >
        <Button
          component="a"
          variant="subtle"
          color="gray"
          fullWidth
          rightSection={hasChildren ? (open ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />) : null}
          className={pathname === item.href ? "active" : ""}
          styles={(theme) => ({
            root: {
              color: theme.colors.gray[7],
              fontWeight: 500,
              fontSize: "15px",
              padding: "8px 16px",
              justifyContent: "flex-start",
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
      {hasChildren && (
        <Collapse in={open}>
          <Stack gap={0} pl="md">
            {item.children?.map((child, index) => (
              <NextLink
                key={child.href || index}
                href={child.href || '#'}
                style={{ textDecoration: 'none' }}
                prefetch={false}
              >
                <NavLink
                  component="a"
                  active={pathname === child.href}
                  label={child.title}
                  styles={(theme) => ({
                    root: {
                      padding: "4px 16px",
                    },
                    label: {
                      fontSize: "14px",
                    },
                  })}
                />
              </NextLink>
            ))}
          </Stack>
        </Collapse>
      )}
    </>
  );
};

const MobileSidebar = () => {
  const pathname = usePathname();
  const { menuItems } = useNavigation();

  return (
    <>
      <Box p="md">
        <Logo />
      </Box>
      <Box>
        <Stack gap="xs">
          {menuItems.map((item, i) => (
            <NavItem 
              key={item.href || i} 
              item={item} 
              pathname={pathname}
            />
          ))}
        </Stack>
      </Box>
    </>
  );
};

export default MobileSidebar;
