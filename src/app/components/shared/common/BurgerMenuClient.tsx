/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Burger } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

/**
 * Client Component for Burger Menu
 * Handles interactive mobile menu toggle
 */
export function BurgerMenuClient() {
    const [opened, { toggle }] = useDisclosure(false);

    return (
        <Burger
            opened={opened}
            onClick={toggle}
            size="sm"
            hiddenFrom="sm"
        />
    );
}
