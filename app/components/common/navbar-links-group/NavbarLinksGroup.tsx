'use client';

import { useState } from 'react';
import { Box, Collapse, Group, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import classes from './NavbarLinksGroup.module.css';

interface LinkItem {
    label: string;
    link?: string;
    children?: LinkItem[];
}

interface LinksGroupProps {
    icon: React.ReactNode;
    label: string;
    initiallyOpened?: boolean;
    link?: string;
    children?: LinkItem[];
}

export function LinksGroup({ icon, label, initiallyOpened, children, link }: LinksGroupProps) {
    const router = useRouter();
    const hasLinks = Array.isArray(children) && children.length > 0;
    const [opened, setOpened] = useState(initiallyOpened || false);

    const renderItems = (items: LinkItem[]) => {
        return items.map((item) => {
            const hasNestedLinks = Array.isArray(item.children) && item.children.length > 0;
            const [isOpen, setIsOpen] = useState(false);

            return (
                <div className={classes.children} key={item.label}>
                    <Text<'a'>
                        component="a"
                        className={classes.link}
                        href={item.link}
                        onClick={(event) => {
                            event.preventDefault();
                            if (hasNestedLinks) {
                                setIsOpen((o) => !o);
                            }
                            if (item.link) {
                                router.push(item.link);
                            }
                        }}
                    >
                        <Group justify="space-between" gap={0}>
                            <span>{item.label}</span>
                            {hasNestedLinks && (
                                <IconChevronRight
                                    className={classes.chevron}
                                    stroke={1.5}
                                    size={16}
                                    style={{ transform: isOpen ? 'rotate(90deg)' : 'none' }}
                                />
                            )}
                        </Group>
                    </Text>
                    {hasNestedLinks && (
                        <Collapse in={isOpen}>
                            <div >
                                {renderItems(item.children!)}
                            </div>
                        </Collapse>
                    )}
                </div>
            );
        });
    };

    return (
        <>
            <UnstyledButton
                onClick={() => {
                    setOpened((o) => !o);
                    if (link) router.push(link);
                }}
                className={classes.control}
            >
                <Group justify="space-between" gap={0}>
                    <Box style={{ display: 'flex', alignItems: 'center' }}>
                        <ThemeIcon variant="light" size={30}>
                            {icon}
                        </ThemeIcon>
                        <Box ml="md">{label}</Box>
                    </Box>
                    {hasLinks && (
                        <IconChevronRight
                            className={classes.chevron}
                            stroke={1.5}
                            size={16}
                            style={{ transform: opened ? 'rotate(90deg)' : 'none' }}
                        />
                    )}
                </Group>
            </UnstyledButton>
            {hasLinks ? <Collapse in={opened}>{renderItems(children)}</Collapse> : null}
        </>
    );
} 