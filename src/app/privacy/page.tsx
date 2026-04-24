import type { Metadata } from 'next';
import { Container, Title, Text, Stack, List } from '@mantine/core';

export const metadata: Metadata = {
    title: 'Privacy & cookies',
    description:
        'Privacy notice for the SelfHelp platform, including the list of strictly necessary cookies we use.',
    robots: { index: true, follow: true },
};

/**
 * Static privacy / cookies page — Server Component.
 *
 * We use **only** strictly necessary cookies (`sh_auth`, `sh_refresh`,
 * `sh_csrf`, `sh_lang`, `sh_accept_locale`). No analytics, advertising, or
 * third-party trackers.
 * Because the cookies are all essential for the app to function, a consent
 * banner is not required under GDPR; a link to this page from the footer
 * satisfies the transparency requirement.
 */
export default function PrivacyPage() {
    return (
        <Container size="md" py="xl">
            <Stack gap="md">
                <Title order={1}>Privacy & cookies</Title>

                <Text>
                    SelfHelp is a research support platform. We do not run analytics,
                    advertising, or any third-party tracking. The cookies listed below are
                    strictly necessary for authentication, security, and user preferences
                    and therefore do not require explicit consent.
                </Text>

                <Title order={2} size="h3">
                    Strictly necessary cookies
                </Title>

                <List spacing="sm">
                    <List.Item>
                        <Text fw={500}>sh_auth</Text>
                        <Text size="sm">
                            HttpOnly session access token. Used by the server to identify the
                            current user. Rotates on refresh. Cleared on logout.
                        </Text>
                    </List.Item>
                    <List.Item>
                        <Text fw={500}>sh_refresh</Text>
                        <Text size="sm">
                            HttpOnly refresh token that lets the server silently renew the
                            access token so you do not get logged out during an active
                            session. Cleared on logout.
                        </Text>
                    </List.Item>
                    <List.Item>
                        <Text fw={500}>sh_csrf</Text>
                        <Text size="sm">
                            Anti-CSRF token set on first visit. Compared against the
                            <code>X-CSRF-Token</code> header on any state-changing API call to
                            block cross-site forgery attacks.
                        </Text>
                    </List.Item>
                    <List.Item>
                        <Text fw={500}>sh_lang</Text>
                        <Text size="sm">
                            Remembers your selected language so the site renders in your
                            preferred locale on the first paint.
                        </Text>
                    </List.Item>
                    <List.Item>
                        <Text fw={500}>sh_accept_locale</Text>
                        <Text size="sm">
                            Records the browser&apos;s <code>Accept-Language</code> hint on
                            first visit so the server can pick a sensible default language
                            before you have signed in or explicitly chosen one. It stores
                            only a short locale tag (e.g. <code>en-GB</code>), never any
                            personal data.
                        </Text>
                    </List.Item>
                </List>

                <Title order={2} size="h3">
                    Contact
                </Title>
                <Text>
                    For any privacy-related questions please contact the research team that
                    gave you access to this platform.
                </Text>
            </Stack>
        </Container>
    );
}
