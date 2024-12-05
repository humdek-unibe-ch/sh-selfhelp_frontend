import React from 'react';
import { usePathname } from "next/navigation";
import { useSelector } from '@/store/hooks';
import NavItem from '../NavItem/NavItem';
import { IconChevronDown } from '@tabler/icons-react';
import { AppState } from '@/store/store';
import { useMantineTheme, UnstyledButton, Box, Group, Text } from '@mantine/core';

type NavGroupProps = {
  [x: string]: any;
  navlabel?: boolean;
  subheader?: string;
  title?: string;
  icon?: any;
  href?: any;
};

interface NavCollapseProps {
  menu: NavGroupProps;
  level: number;
  pathWithoutLastPart: any;
  pathDirect: any;
  hideMenu: any;
  onClick: any;
}

const NavCollapse = ({ menu, level, pathWithoutLastPart, pathDirect, hideMenu }: NavCollapseProps) => {
  const Icon = menu.icon || IconChevronDown;
  const theme = useMantineTheme();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const customizer = useSelector((state: AppState) => state.customizer);
  const menuIcon = Icon ? (
    level > 1 ? <Icon stroke={1.5} size="1rem" /> : <Icon stroke={1.5} size="1.1rem" />
  ) : null;

  React.useEffect(() => {
    setOpen(false);
    menu.children.forEach((item: any) => {
      if (item.href === pathname) {
        setOpen(true);
      }
    });
  }, [pathname, menu.children]);

  const submenus = menu.children?.map((item: any) => {
    if (item.children) {
      return (
        <NavCollapse
          key={item.id}
          menu={item}
          level={level + 1}
          pathWithoutLastPart={pathWithoutLastPart}
          pathDirect={pathDirect}
          hideMenu={hideMenu}
          onClick={undefined}
        />
      );
    } else {
      return (
        <NavItem
          key={item.id}
          item={item}
          level={level + 1}
          pathDirect={pathDirect}
          hideMenu={hideMenu}
          onClick={() => {}}
        />
      );
    }
  });

  return (
    <Box component="li" key={menu.id}>
      <UnstyledButton
        style={{
          width: 'auto',
          padding: '5px 10px',
          position: 'relative',
          gap: '10px',
          borderRadius: customizer.borderRadius,
          whiteSpace: 'nowrap',
          color: open || pathname.includes(menu.href) || level < 1 ? 'white' : 'var(--mantine-color-text)',
          backgroundColor: open || pathname.includes(menu.href) ? 'var(--mantine-color-secondary-6)' : '',
          '&:hover': {
            backgroundColor: open || pathname.includes(menu.href)
              ? 'var(--mantine-color-secondary-6)'
              : 'var(--mantine-color-secondary-1)',
          },
        }}
        className={open ? 'selected' : ''}
      >
        <Group gap="xs">
          {menuIcon}
          <Text>{menu.title}</Text>
          <IconChevronDown size="1rem" />
        </Group>
        <Box
          component="ul"
          className="SubNav"
          style={{
            display: 'none',
            position: 'absolute',
            top: level > 1 ? 0 : 35,
            left: level > 1 ? level + 228 : 0,
            padding: '10px',
            width: 250,
            backgroundColor: 'var(--mantine-color-body)',
            boxShadow: 'var(--mantine-shadow-lg)',
            '&:hover': { display: 'block' },
          }}
        >
          {submenus}
        </Box>
      </UnstyledButton>
    </Box>
  );
};

export default NavCollapse;
