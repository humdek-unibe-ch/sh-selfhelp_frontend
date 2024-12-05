import React from 'react';
import Link from 'next/link';
import { useSelector } from '@/store/hooks';
import { useTranslation } from 'react-i18next';
import { AppState } from '@/store/store';
import { Box, UnstyledButton, Text, Badge, useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { BREAKPOINTS } from '@/utils/theme/Theme';

type NavGroup = {
  [x: string]: any;
  id?: string;
  navlabel?: boolean;
  subheader?: string;
  title?: string;
  icon?: any;
  href?: any;
  children?: NavGroup[];
  chip?: string;
  chipColor?: any;
  variant?: string | any;
  external?: boolean;
  level?: number;
  onClick?: React.MouseEvent<HTMLButtonElement, MouseEvent>;
};

interface ItemType {
  item: NavGroup;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  hideMenu?: any;
  level?: number | any;
  pathDirect: string;
}

export default function NavItem({ item, level, pathDirect, hideMenu, onClick }: ItemType) {
  const lgDown = useMediaQuery(`(max-width: ${BREAKPOINTS.lg}px)`);
  const customizer = useSelector((state: AppState) => state.customizer);
  const Icon = item?.icon;
  const theme = useMantineTheme();
  const { t } = useTranslation();
  
  const itemIcon = Icon ? (
    level > 1 ? <Icon stroke={1.5} size="1rem" /> : <Icon stroke={1.5} size="1.3rem" />
  ) : null;

  const isSelected = pathDirect === item?.href;
  const isLevel1Selected = level > 1 && isSelected;

  const buttonStyles = {
    whiteSpace: 'nowrap' as const,
    marginBottom: '10px',
    padding: '9.5px 12px',
    borderRadius: `${customizer.borderRadius}px`,
    backgroundColor: level > 1 ? 'transparent !important' : 'inherit',
    color: isLevel1Selected ? `${theme.colors.blue[6]} !important` : theme.colors.gray[7],
    paddingLeft: hideMenu ? '10px' : level > 2 ? `${level * 15}px` : '10px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    '&:hover': {
      backgroundColor: theme.colors.blue[1],
      color: theme.colors.blue[6],
    },
    ...(isSelected && {
      color: 'white',
      backgroundColor: theme.colors.blue[6],
      '&:hover': {
        backgroundColor: theme.colors.blue[6],
        color: 'white',
      },
    }),
  };

  return (
    <Box component="li" style={{ listStyle: 'none', padding: 0 }} key={item?.id && item.title}>
      <Link href={item.href} style={{ textDecoration: 'none' }}>
        <UnstyledButton
          disabled={item?.disabled}
          data-selected={isSelected}
          onClick={lgDown ? onClick : undefined}
          style={buttonStyles}
        >
          {itemIcon && (
            <Box style={{ 
              minWidth: '36px',
              padding: '3px 0',
              color: isLevel1Selected ? `${theme.colors.blue[6]} !important` : 'inherit'
            }}>
              {itemIcon}
            </Box>
          )}
          <Box style={{ flex: 1 }}>
            <Text c={isSelected ? 'white' : undefined}>
              {hideMenu ? '' : t(`${item?.title}`)}
            </Text>
            {item?.subtitle && !hideMenu && (
              <Text size="xs" c={isSelected ? 'white' : 'dimmed'}>
                {item.subtitle}
              </Text>
            )}
          </Box>

          {!item?.chip || hideMenu ? null : (
            <Badge
              color={item?.chipColor}
              variant={item?.variant || 'filled'}
              size="sm"
            >
              {item?.chip}
            </Badge>
          )}
        </UnstyledButton>
      </Link>
    </Box>
  );
}

