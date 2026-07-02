/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import {
  Group,
  Box,
  Collapse,
  Text,
  UnstyledButton,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { IconChevronRight, IconRoute } from '@tabler/icons-react';
import { useRouter, usePathname } from 'next/navigation';
import { MenuItemIcon } from '../../../navigation/MenuItemIcon';
import classes from './LinksGroup.module.css';
import { useIsClient } from '../../../../../../hooks/useIsClient';

/** A single admin navbar link, optionally containing nested children. */
interface INavLinkItem {
  label: string;
  link: string;
  selectable?: boolean;
  onClick?: () => void;
  id?: number | string;
  links?: INavLinkItem[];
  menuBuilderLink?: string;
  menuIcon?: string | null;
  menuPlatform?: 'web' | 'mobile';
}

// Helper function to check if any nested link is active
function checkForActiveChild(links: INavLinkItem[], pathname: string): boolean {
  return links.some(link => {
    if (link.link === pathname) return true;
    if (link.links && link.links.length > 0) {
      return checkForActiveChild(link.links, pathname);
    }
    return false;
  });
}

const noopSubscribe = () => () => {};

// Read the persisted open/closed boolean for a navbar group. Returns null when
// there is no usable stored value (or on the server, via getServerSnapshot).
function readStoredOpened(storageKey: string): boolean | null {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (typeof parsed === 'boolean') return parsed;
    }
  } catch {
    // Corrupt value — ignore and fall back to the deterministic default.
  }
  return null;
}

/**
 * Disclosure state for a navbar group that is persisted in localStorage.
 *
 * The initial render is deterministic (server and first client render use
 * `defaultOpened`) to avoid hydration mismatches; the persisted value is read
 * SSR-safely via `useSyncExternalStore` and applied once after hydration, and
 * the current value is written back after the first client render. This keeps
 * the previous behaviour without any set-state-in-effect.
 */
function usePersistedDisclosure(
  storageKey: string,
  defaultOpened: boolean,
  hasActiveChild: boolean,
): readonly [boolean, React.Dispatch<React.SetStateAction<boolean>>] {
  const [opened, setOpened] = useState<boolean>(defaultOpened);
  const hydrated = useIsClient();
  const persisted = useSyncExternalStore(
    noopSubscribe,
    () => readStoredOpened(storageKey),
    () => null,
  );
  const [appliedPersisted, setAppliedPersisted] = useState(false);
  if (!appliedPersisted && persisted !== null) {
    setAppliedPersisted(true);
    setOpened(persisted);
  }
  // Auto-open when a descendant route is active.
  if (hasActiveChild && !opened) {
    setOpened(true);
  }
  // Persist after the first client render, so the deterministic default cannot
  // overwrite a previously-stored choice.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(opened));
    } catch {
      // Quota / private-mode — best-effort, don't throw.
    }
  }, [opened, storageKey, hydrated]);
  return [opened, setOpened] as const;
}

interface ILinksGroupProps {
  icon?: React.ReactNode;
  label: string;
  initiallyOpened?: boolean;
  id?: number | string;
  links?: INavLinkItem[];
  link?: string;
  selectable?: boolean;
  onClick?: () => void;
}

export function LinksGroup({ icon, label, initiallyOpened, links, link, onClick }: ILinksGroupProps) {
  const router = useRouter();
  const pathname = usePathname();
  const hasLinks = Array.isArray(links);
  const storageKey = `navbar-${label.replace(/\s+/g, '-').toLowerCase()}-opened`;

  // Check if this item or any nested item is active
  const isActive = link === pathname;
  const hasActiveChild = hasLinks && checkForActiveChild(links || [], pathname);

  // Initial render must be identical on server and client, so the persisted
  // localStorage value is reconciled after hydration (see usePersistedDisclosure)
  // rather than read during the initial render, which would cause a mismatch.
  const [opened, setOpened] = usePersistedDisclosure(
    storageKey,
    Boolean(initiallyOpened || hasActiveChild),
    hasActiveChild,
  );

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

  const renderNestedLinks = (linkItems: INavLinkItem[], level: number = 0): React.ReactNode => {
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
            links={item.links ?? []}
            level={level}
            pathname={pathname}
            selectable={item.selectable}
            onClick={item.onClick}
            id={item.id}
          />
        );
      }

      return (
        <Group key={item.id || item.label} gap={4} wrap="nowrap" className={getNestedLinkClass(level)}>
          {item.menuIcon && item.menuPlatform ? (
            <Box style={{ flexShrink: 0, display: 'inline-flex', marginLeft: 4 }}>
              <MenuItemIcon iconName={item.menuIcon} platform={item.menuPlatform} size={14} />
            </Box>
          ) : null}
          <Text<'a'>
            component="a"
            className={`${classes.link}`}
            href={item.link}
            data-active={isItemActive}
            style={{ flex: 1 }}
            onClick={(e) => {
              e.preventDefault();
              handleItemClick(item.link, item.onClick, e);
            }}
            onMouseDown={(e: React.MouseEvent) => {
              if (e.button === 1) {
                e.preventDefault();
                window.open(item.link, '_blank');
              }
            }}
            onContextMenu={(e: React.MouseEvent) => {
              e.stopPropagation();
            }}
          >
            {item.label}
          </Text>
          {item.menuBuilderLink ? (
            <Tooltip label="Edit in menu builder">
              <ActionIcon
                component="a"
                href={item.menuBuilderLink}
                variant="subtle"
                size="sm"
                aria-label="Edit in menu builder"
                onClick={(e) => e.stopPropagation()}
              >
                <IconRoute size={14} />
              </ActionIcon>
            </Tooltip>
          ) : null}
        </Group>
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
  links: INavLinkItem[];
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
  const [opened, setOpened] = usePersistedDisclosure(
    storageKey,
    Boolean(hasActiveChild),
    hasActiveChild,
  );

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

  const renderNestedLinks = (linkItems: INavLinkItem[], currentLevel: number): React.ReactNode => {
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
            links={item.links ?? []}
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
            if (e.button === 1) {
              e.preventDefault();
              window.open(item.link, '_blank');
            }
          }}
          onContextMenu={(e: React.MouseEvent) => {
            e.stopPropagation();
          }}
        >
          <Group gap={6} wrap="nowrap">
            {item.menuIcon && item.menuPlatform ? (
              <MenuItemIcon iconName={item.menuIcon} platform={item.menuPlatform} size={14} />
            ) : null}
            <span>{item.label}</span>
          </Group>
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
