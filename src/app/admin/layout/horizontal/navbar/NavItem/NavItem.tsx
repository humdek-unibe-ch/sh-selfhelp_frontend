import React from 'react';
import Link from 'next/link';
import { useSelector } from '@/store/hooks';
import { useTranslation } from 'react-i18next';
import { AppState } from '@/store/store';
import { useMediaQuery } from '@mantine/hooks';
import { Box, UnstyledButton, Group, Text, Badge } from '@mantine/core';

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
  const lgDown = useMediaQuery('(max-width: 1200px)');
  const customizer = useSelector((state: AppState) => state.customizer);
  const Icon = item?.icon;
  const { t } = useTranslation();
  
  const itemIcon = Icon ? (
    level > 1 ? <Icon stroke={1.5} size="1rem" /> : <Icon stroke={1.5} size="1.3rem" />
  ) : null;

  return (
    <Box component="li" style={{ padding: 0 }} key={item?.id && item.title}>
      <Link href={item.href} style={{ textDecoration: 'none' }}>
        <UnstyledButton
          disabled={item?.disabled}
          onClick={lgDown ? onClick : undefined}
          style={{
            width: '100%',
            padding: '5px 10px',
            gap: '10px',
            borderRadius: customizer.borderRadius,
            backgroundColor: level > 1 ? 'transparent' : 'inherit',
            marginBottom: level > 1 ? '3px' : '0px',
            paddingLeft: hideMenu ? '10px' : level > 2 ? `${level * 15}px` : '10px',
            color: level > 1 && pathDirect === item?.href
              ? 'var(--mantine-color-secondary-6)'
              : 'var(--mantine-color-text)',
            '&:hover': {
              backgroundColor: 'var(--mantine-color-secondary-1)',
              color: 'var(--mantine-color-secondary-6)',
            },
            ...(pathDirect === item?.href && {
              color: 'white',
              backgroundColor: 'var(--mantine-color-secondary-6)',
              '&:hover': {
                backgroundColor: 'var(--mantine-color-secondary-6)',
                color: 'white',
              },
            }),
          }}
        >
          <Group gap="xs" wrap="nowrap">
            <Box
              style={{
                color: level > 1 && pathDirect === item?.href
                  ? 'var(--mantine-color-secondary-6)'
                  : 'inherit',
              }}
            >
              {itemIcon}
            </Box>
            
            <Box style={{ flex: 1 }}>
              {!hideMenu && (
                <>
                  <Text size="sm">{t(`${item?.title}`)}</Text>
                  {item?.subtitle && (
                    <Text size="xs" c="dimmed">
                      {item?.subtitle}
                    </Text>
                  )}
                </>
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
          </Group>
        </UnstyledButton>
      </Link>
    </Box>
  );
}

