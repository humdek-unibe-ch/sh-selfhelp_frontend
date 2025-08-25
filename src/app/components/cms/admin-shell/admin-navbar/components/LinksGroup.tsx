'use client';

import { useState, useEffect } from 'react';
import {
  Group,
  Box,
  Collapse,
  Text,
  UnstyledButton,
  rem,
} from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { useRouter, usePathname } from 'next/navigation';
import classes from './LinksGroup.module.css';

// Helper function to check if any nested link is active
function checkForActiveChild(links: any[], pathname: string): boolean {
  return links.some(link => {
    if (link.link === pathname) return true;
    if (link.links && link.links.length > 0) {
      return checkForActiveChild(link.links, pathname);
    }
    return false;
  });
}

interface ILinksGroupProps {
  icon?: React.ReactNode;
  label: string;
  initiallyOpened?: boolean;
  links?: Array<{
    label: string;
    link: string;
    links?: Array<{
      label: string;
      link: string;
      links?: Array<{
        label: string;
        link: string;
        links?: Array<{
          label: string;
          link: string;
        }>;
      }>;
    }>;
  }>;
  link?: string;
}

export function LinksGroup({ icon, label, initiallyOpened, links, link }: ILinksGroupProps) {
  const router = useRouter();
  const pathname = usePathname();
  const hasLinks = Array.isArray(links);
  const storageKey = `navbar-${label.replace(/\s+/g, '-').toLowerCase()}-opened`;
  
  // Check if this item or any nested item is active
  const isActive = link === pathname;
  const hasActiveChild = hasLinks && checkForActiveChild(links || [], pathname);
  
  // Initialize opened state from localStorage or initiallyOpened
  const [opened, setOpened] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    }
    return initiallyOpened || hasActiveChild || false;
  });

  // Auto-open if has active child
  useEffect(() => {
    if (hasActiveChild && !opened) {
      setOpened(true);
    }
  }, [hasActiveChild, opened]);

  // Save state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(opened));
    }
  }, [opened, storageKey]);

  const handleItemClick = (href: string, e?: React.MouseEvent) => {
    // Support middle click and ctrl+click for new tab
    if (e && (e.button === 1 || e.ctrlKey || e.metaKey)) {
      window.open(href, '_blank');
      return;
    }
    
    router.push(href);
  };

  const renderNestedLinks = (linkItems: any[], level: number = 0): React.ReactNode => {
    if (level >= 4) return null; // Limit to 4 levels as requested

    return linkItems?.map((item) => {
      const hasNestedLinks = Array.isArray(item.links) && item.links.length > 0;
      const isItemActive = item.link === pathname;
      
      if (hasNestedLinks) {
        return (
          <NestedLinksGroup
            key={item.label}
            label={item.label}
            links={item.links}
            level={level}
            pathname={pathname}
          />
        );
      }

      return (
        <Text<'a'>
          component="a"
          className={classes.link}
          href={item.link}
          key={item.label}
          data-active={isItemActive}
          onClick={(e) => {
            e.preventDefault();
            handleItemClick(item.link, e);
          }}
          onMouseDown={(e: React.MouseEvent) => {
            // Handle middle click
            if (e.button === 1) {
              e.preventDefault();
              window.open(item.link, '_blank');
            }
          }}
          onContextMenu={(e: React.MouseEvent) => {
            // Allow right-click context menu for "open in new tab"
            e.stopPropagation();
          }}
          style={{
            paddingLeft: `calc(${rem((level + 1) * 16)} + var(--mantine-spacing-md))`,
          }}
        >
          {item.label}
        </Text>
      );
    });
  };

  const items = renderNestedLinks(links || []);

  return (
    <>
      <UnstyledButton 
        onClick={() => {
          if (hasLinks) {
            setOpened((o) => !o);
          } else if (link) {
            handleItemClick(link);
          }
        }}
        className={classes.control}
        data-active={isActive}
        onMouseDown={(e: React.MouseEvent) => {
          // Handle middle click for direct links
          if (e.button === 1 && link) {
            e.preventDefault();
            window.open(link, '_blank');
          }
        }}
        onContextMenu={(e: React.MouseEvent) => {
          // Allow right-click context menu for "open in new tab"
          if (link) {
            e.stopPropagation();
          }
        }}
      >
        <Group justify="space-between" gap={0}>
          <Box style={{ display: 'flex', alignItems: 'center' }}>
            <Box mr="md">{icon}</Box>
            <Box>{label}</Box>
          </Box>
          {hasLinks && (
            <IconChevronRight
              className={classes.chevron}
              size="1rem"
              stroke={1.5}
              style={{
                transform: opened ? `rotate(${rem(90)})` : 'none',
              }}
            />
          )}
        </Group>
      </UnstyledButton>
      {hasLinks ? <Collapse in={opened}>{items}</Collapse> : null}
    </>
  );
}

// Nested component for handling deeper levels
interface INestedLinksGroupProps {
  label: string;
  links: Array<{
    label: string;
    link: string;
    links?: Array<{
      label: string;
      link: string;
      links?: Array<{
        label: string;
        link: string;
      }>;
    }>;
  }>;
  level: number;
  pathname: string;
}

function NestedLinksGroup({ label, links, level, pathname }: INestedLinksGroupProps) {
  const router = useRouter();
  const storageKey = `navbar-nested-${label.replace(/\s+/g, '-').toLowerCase()}-${level}-opened`;
  const hasActiveChild = checkForActiveChild(links, pathname);

  const [opened, setOpened] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    }
    return hasActiveChild || false;
  });

  // Auto-open if has active child
  useEffect(() => {
    if (hasActiveChild && !opened) {
      setOpened(true);
    }
  }, [hasActiveChild, opened]);

  // Save state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(opened));
    }
  }, [opened, storageKey]);

  const handleItemClick = (href: string, e?: React.MouseEvent) => {
    // Support middle click and ctrl+click for new tab
    if (e && (e.button === 1 || e.ctrlKey || e.metaKey)) {
      window.open(href, '_blank');
      return;
    }
    
    router.push(href);
  };

  const renderNestedLinks = (linkItems: any[], currentLevel: number): React.ReactNode => {
    if (currentLevel >= 4) return null; // Limit to 4 levels

    return linkItems?.map((item) => {
      const hasNestedLinks = Array.isArray(item.links) && item.links.length > 0;
      const isItemActive = item.link === pathname;
      
      if (hasNestedLinks) {
        return (
          <NestedLinksGroup
            key={item.label}
            label={item.label}
            links={item.links}
            level={currentLevel}
            pathname={pathname}
          />
        );
      }

      return (
        <Text<'a'>
          component="a"
          className={classes.link}
          href={item.link}
          key={item.label}
          data-active={isItemActive}
          onClick={(e) => {
            e.preventDefault();
            handleItemClick(item.link, e);
          }}
          onMouseDown={(e: React.MouseEvent) => {
            // Handle middle click
            if (e.button === 1) {
              e.preventDefault();
              window.open(item.link, '_blank');
            }
          }}
          onContextMenu={(e: React.MouseEvent) => {
            // Allow right-click context menu for "open in new tab"
            e.stopPropagation();
          }}
          style={{
            paddingLeft: `calc(${rem((currentLevel + 1) * 16)} + var(--mantine-spacing-md))`,
          }}
        >
          {item.label}
        </Text>
      );
    });
  };

  const items = renderNestedLinks(links, level + 1);

  return (
    <>
      <UnstyledButton 
        onClick={() => setOpened((o) => !o)}
        className={classes.link}
        style={{
          paddingLeft: `calc(${rem((level + 1) * 16)} + var(--mantine-spacing-md))`,
          fontWeight: 500,
        }}
      >
        <Group justify="space-between" gap={0}>
          <Box>{label}</Box>
          <IconChevronRight
            className={classes.chevron}
            size="1rem"
            stroke={1.5}
            style={{
              transform: opened ? `rotate(${rem(90)})` : 'none',
            }}
          />
        </Group>
      </UnstyledButton>
      <Collapse in={opened}>{items}</Collapse>
    </>
  );
}
