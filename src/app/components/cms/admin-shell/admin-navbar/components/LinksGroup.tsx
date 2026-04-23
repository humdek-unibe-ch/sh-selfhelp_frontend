'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Group,
  Box,
  Collapse,
  Text,
  UnstyledButton,
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
  id?: number | string;
  links?: Array<{
    label: string;
    link: string;
    selectable?: boolean;
    onClick?: () => void;
    id?: number | string;
    links?: Array<{
      label: string;
      link: string;
      selectable?: boolean;
      onClick?: () => void;
      id?: number | string;
      links?: Array<{
        label: string;
        link: string;
        selectable?: boolean;
        onClick?: () => void;
        id?: number | string;
        links?: Array<{
          label: string;
          link: string;
          selectable?: boolean;
          onClick?: () => void;
          id?: number | string;
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

  // Initial render must be identical on server and client, so we do NOT read
  // localStorage during useState init (that would cause a hydration mismatch
  // — the server never has localStorage, the client does). Instead the
  // `opened` state starts deterministically from `initiallyOpened` or
  // `hasActiveChild`, and we reconcile with the persisted value in a
  // post-mount effect below.
  const [opened, setOpened] = useState<boolean>(
    () => Boolean(initiallyOpened || hasActiveChild)
  );
  const hasHydratedFromStorage = useRef(false);

  // Hydrate persisted open/closed state once, after mount.
  useEffect(() => {
    if (hasHydratedFromStorage.current) return;
    hasHydratedFromStorage.current = true;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'boolean') {
          setOpened(parsed);
        }
      }
    } catch {
      // Corrupt value — ignore and fall back to the deterministic default.
    }
  }, [storageKey]);

  // Auto-open if has active child.
  useEffect(() => {
    if (hasActiveChild && !opened) {
      setOpened(true);
    }
  }, [hasActiveChild, opened]);

  // Persist state to localStorage — but only *after* we've hydrated the
  // stored value, so the hydration effect cannot overwrite a user's
  // previously-persisted choice with the deterministic default.
  useEffect(() => {
    if (!hasHydratedFromStorage.current) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(opened));
    } catch {
      // Quota / private-mode — best-effort, don't throw.
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

  const getNestedLinkClass = (level: number): string => {
    switch (level) {
      case 0: return classes.nestedLinkLevel1;
      case 1: return classes.nestedLinkLevel2;
      case 2: return classes.nestedLinkLevel3;
      case 3: return classes.nestedLinkLevel4;
      default: return classes.nestedLinkLevel1;
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
            key={item.id || item.label}
            label={item.label}
            link={item.link}
            links={item.links}
            level={level}
            pathname={pathname}
            selectable={item.selectable}
            onClick={item.onClick}
            id={item.id}
          />
        );
      }

      return (
        <Text<'a'>
          component="a"
          className={`${classes.link} ${getNestedLinkClass(level)}`}
          href={item.link}
          key={item.id || item.label}
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
            className={classes.nestedLink}
          >
            <Box className={classes.iconContainer}>
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
              className={classes.chevronButton}
            >
              <IconChevronRight
                className={`${classes.chevron} ${classes.chevronIcon} ${opened ? classes.chevronRotated : classes.chevronNormal}`}
                size="1rem"
                stroke={1.5}
              />
            </UnstyledButton>
          )}
        </Group>
      </Box>
      {hasLinks ? <Collapse expanded={opened}>{items}</Collapse> : null}
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
    id?: number | string;
    links?: Array<{
      label: string;
      link: string;
      selectable?: boolean;
      onClick?: () => void;
      id?: number | string;
      links?: Array<{
        label: string;
        link: string;
        selectable?: boolean;
        onClick?: () => void;
        id?: number | string;
      }>;
    }>;
  }>;
  level: number;
  pathname: string;
  selectable?: boolean;
  onClick?: () => void;
  id?: number | string;
}

function NestedLinksGroup({ label, link, links, level, pathname, selectable = true, onClick }: INestedLinksGroupProps) {
  const router = useRouter();
  const storageKey = `navbar-nested-${label.replace(/\s+/g, '-').toLowerCase()}-${level}-opened`;
  const hasActiveChild = checkForActiveChild(links, pathname);

  // Deterministic initial state to keep SSR and first client render in sync.
  // See the matching comment in `LinksGroup` above.
  const [opened, setOpened] = useState<boolean>(() => Boolean(hasActiveChild));
  const hasHydratedFromStorage = useRef(false);

  useEffect(() => {
    if (hasHydratedFromStorage.current) return;
    hasHydratedFromStorage.current = true;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'boolean') {
          setOpened(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  useEffect(() => {
    if (hasActiveChild && !opened) {
      setOpened(true);
    }
  }, [hasActiveChild, opened]);

  useEffect(() => {
    if (!hasHydratedFromStorage.current) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(opened));
    } catch {
      // ignore
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

  const getNestedLinkClass = (currentLevel: number): string => {
    switch (currentLevel) {
      case 0: return classes.nestedLinkLevel1;
      case 1: return classes.nestedLinkLevel2;
      case 2: return classes.nestedLinkLevel3;
      case 3: return classes.nestedLinkLevel4;
      default: return classes.nestedLinkLevel1;
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
            key={item.id || item.label}
            label={item.label}
            link={item.link}
            links={item.links}
            level={currentLevel}
            pathname={pathname}
            selectable={item.selectable}
            onClick={item.onClick}
            id={item.id}
          />
        );
      }

      return (
        <Text<'a'>
          component="a"
          className={`${classes.link} ${getNestedLinkClass(currentLevel)}`}
          href={item.link}
          key={item.id || item.label}
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
        >
          {item.label}
        </Text>
      );
    });
  };

  const items = renderNestedLinks(links, level + 1);

  const getNestedParentLinkClass = (currentLevel: number): string => {
    switch (currentLevel) {
      case 0: return classes.nestedParentLink;
      case 1: return classes.nestedParentLinkLevel2;
      case 2: return classes.nestedParentLinkLevel3;
      case 3: return classes.nestedParentLinkLevel4;
      default: return classes.nestedParentLink;
    }
  };

  return (
    <>
      <Box
        className={`${classes.link} ${getNestedParentLinkClass(level)}`}
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
            className={classes.nestedLink}
          >
            <Box>{label}</Box>
          </UnstyledButton>

          {/* Separate clickable area for expand/collapse */}
          <UnstyledButton
            onClick={(e) => {
              e.stopPropagation();
              setOpened((o: boolean) => !o);
            }}
            className={classes.chevronButton}
          >
            <IconChevronRight
              className={`${classes.chevron} ${classes.chevronIcon} ${opened ? classes.chevronRotated : classes.chevronNormal}`}
              size="1rem"
              stroke={1.5}
            />
          </UnstyledButton>
        </Group>
      </Box>
      <Collapse expanded={opened}>{items}</Collapse>
    </>
  );
}
