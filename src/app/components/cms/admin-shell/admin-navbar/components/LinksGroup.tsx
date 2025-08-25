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
    selectable?: boolean;
    onClick?: () => void;
    links?: Array<{
      label: string;
      link: string;
      selectable?: boolean;
      onClick?: () => void;
      links?: Array<{
        label: string;
        link: string;
        selectable?: boolean;
        onClick?: () => void;
        links?: Array<{
          label: string;
          link: string;
          selectable?: boolean;
          onClick?: () => void;
        }>;
      }>;
    }>;
  }>;
  link?: string;
  selectable?: boolean;
  onClick?: () => void;
}

export function LinksGroup({ icon, label, initiallyOpened, links, link, selectable = true, onClick }: ILinksGroupProps) {
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

  const handleItemClick = (href: string, clickHandler?: () => void, e?: React.MouseEvent) => {
    // Support middle click and ctrl+click for new tab
    if (e && (e.button === 1 || e.ctrlKey || e.metaKey)) {
      window.open(href, '_blank');
      return;
    }
    
    // If there's a custom click handler, use it
    if (clickHandler) {
      clickHandler();
      return;
    }
    
    // Only navigate if it's not just a '#' placeholder
    if (href && href !== '#') {
      router.push(href);
    }
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
            link={item.link}
            links={item.links}
            level={level}
            pathname={pathname}
            selectable={item.selectable}
            onClick={item.onClick}
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
            handleItemClick(item.link, item.onClick, e);
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
      <Box className={classes.control} data-active={isActive}>
        <Group justify="space-between" gap={0}>
          {/* Main clickable area for navigation */}
          <UnstyledButton
            onClick={() => {
              // Always handle navigation/selection for main area
              if (link && link !== '#') {
                handleItemClick(link, onClick);
              } else if (onClick) {
                onClick();
              }
            }}
            onMouseDown={(e: React.MouseEvent) => {
              // Handle middle click for direct links
              if (e.button === 1 && link && link !== '#') {
                e.preventDefault();
                window.open(link, '_blank');
              }
            }}
            onContextMenu={(e: React.MouseEvent) => {
              // Allow right-click context menu for "open in new tab"
              if (link && link !== '#') {
                e.stopPropagation();
              }
            }}
            style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'flex-start',
              padding: 0,
              backgroundColor: 'transparent',
              border: 'none'
            }}
          >
            <Box style={{ display: 'flex', alignItems: 'center' }}>
              <Box mr="md">{icon}</Box>
              <Box>{label}</Box>
            </Box>
          </UnstyledButton>
          
          {/* Separate clickable area for expand/collapse */}
          {hasLinks && (
            <UnstyledButton
              onClick={(e) => {
                e.stopPropagation();
                setOpened((o: boolean) => !o);
              }}
              style={{
                padding: '4px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              styles={{
                root: {
                  '&:hover': {
                    backgroundColor: 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-5))'
                  }
                }
              }}
            >
              <IconChevronRight
                className={classes.chevron}
                size="1rem"
                stroke={1.5}
                style={{
                  transform: opened ? `rotate(${rem(90)})` : 'none',
                }}
              />
            </UnstyledButton>
          )}
        </Group>
      </Box>
      {hasLinks ? <Collapse in={opened}>{items}</Collapse> : null}
    </>
  );
}

// Nested component for handling deeper levels
interface INestedLinksGroupProps {
  label: string;
  link: string;
  links: Array<{
    label: string;
    link: string;
    selectable?: boolean;
    onClick?: () => void;
    links?: Array<{
      label: string;
      link: string;
      selectable?: boolean;
      onClick?: () => void;
      links?: Array<{
        label: string;
        link: string;
        selectable?: boolean;
        onClick?: () => void;
      }>;
    }>;
  }>;
  level: number;
  pathname: string;
  selectable?: boolean;
  onClick?: () => void;
}

function NestedLinksGroup({ label, link, links, level, pathname, selectable = true, onClick }: INestedLinksGroupProps) {
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

  const handleItemClick = (href: string, clickHandler?: () => void, e?: React.MouseEvent) => {
    // Support middle click and ctrl+click for new tab
    if (e && (e.button === 1 || e.ctrlKey || e.metaKey)) {
      window.open(href, '_blank');
      return;
    }
    
    // If there's a custom click handler, use it
    if (clickHandler) {
      clickHandler();
      return;
    }
    
    // Only navigate if it's not just a '#' placeholder
    if (href && href !== '#') {
      router.push(href);
    }
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
            link={item.link}
            links={item.links}
            level={currentLevel}
            pathname={pathname}
            selectable={item.selectable}
            onClick={item.onClick}
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
            handleItemClick(item.link, item.onClick, e);
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
      <Box 
        className={classes.link}
        style={{
          paddingLeft: `calc(${rem((level + 1) * 16)} + var(--mantine-spacing-md))`,
          fontWeight: 500,
        }}
      >
        <Group justify="space-between" gap={0}>
          {/* Main clickable area for navigation */}
          <UnstyledButton
            onClick={() => {
              // Always handle navigation/selection for main area  
              if (selectable && link && link !== '#') {
                handleItemClick(link, onClick, undefined);
              } else if (onClick) {
                onClick();
              }
            }}
            style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'flex-start',
              padding: 0,
              backgroundColor: 'transparent',
              border: 'none'
            }}
          >
            <Box>{label}</Box>
          </UnstyledButton>
          
          {/* Separate clickable area for expand/collapse */}
          <UnstyledButton
            onClick={(e) => {
              e.stopPropagation();
              setOpened((o: boolean) => !o);
            }}
            style={{
              padding: '4px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            styles={{
              root: {
                '&:hover': {
                  backgroundColor: 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-5))'
                }
              }
            }}
          >
            <IconChevronRight
              className={classes.chevron}
              size="1rem"
              stroke={1.5}
              style={{
                transform: opened ? `rotate(${rem(90)})` : 'none',
              }}
            />
          </UnstyledButton>
        </Group>
      </Box>
      <Collapse in={opened}>{items}</Collapse>
    </>
  );
}
