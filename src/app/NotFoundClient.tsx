'use client';

import { Container, Title, Text, Button, Group, Stack } from '@mantine/core';
import Link from 'next/link';
import { ROUTES } from '../config/routes.config';

/**
 * Client half of the 404 page.
 *
 * The Mantine `Button` with `component={Link}` receives a *function*
 * (`LinkComponent`) as a prop, which cannot cross the RSC → CC serialization
 * boundary. So the server component (`not-found.tsx`) reads the auth cookie
 * and passes only a plain boolean prop to this client component; the
 * function-valued `component` prop is applied here, inside the client tree,
 * where React's check is satisfied.
 */
export function NotFoundClient({ isAuthenticated }: { isAuthenticated: boolean }) {
    return (
        <Container size="md" style={{ textAlign: 'center', paddingTop: '100px' }}>
            <Stack gap="md">
                <Title order={1} size="3.5rem">
                    404
                </Title>
                <Text size="xl">Page not found</Text>
                <Text c="dimmed">
                    The page you are looking for does not exist or has been moved.
                </Text>
                <Group justify="center" mt="md">
                    <Button component={Link} href="/" variant={isAuthenticated ? 'filled' : 'light'}>
                        Back to home
                    </Button>
                    {!isAuthenticated && (
                        <Button component={Link} href={ROUTES.LOGIN}>
                            Sign in
                        </Button>
                    )}
                </Group>
            </Stack>
        </Container>
    );
}
