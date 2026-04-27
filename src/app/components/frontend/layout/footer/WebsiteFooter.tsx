
"use server";
import { Box, Container, Group, Stack, Text } from '@mantine/core';
import styles from './WebsiteFooter.module.css';
import { resolveLanguageSSR, getMenuPagesSSR } from '../../../../_lib/server-fetch';
import { FooterLinks } from './FooterLinks';

/**
 * Website Footer with optimized loading behavior.
 *
 * All footer links are now CMS-driven via `footer_position` on the page row
 * (see `useAppNavigation().footerPages`). The privacy notice ships as a
 * seeded CMS page (`pages.keyword = 'privacy'`, `is_system = 1`) so it always
 * appears here unless an admin explicitly clears its `footer_position` —
 * which is the same single source of truth the impressum / agb / disclaimer
 * pages already use.
 */
export async function WebsiteFooter() {
    // These calls to next/headers will now work because this is a Server Component
    const { id: languageId } = await resolveLanguageSSR();
    const footerPages = await getMenuPagesSSR(languageId);

    return (
        <Box component="footer" w="100%" py="xl" className={styles.footer}>
            <Container size="xl">
                <Stack gap="lg">
                    <Group justify="center" gap="xl">
                        {/* Pass the server-fetched data to the Client Component */}
                        <FooterLinks footerPages={footerPages} />
                    </Group>

                    <Text size="sm" c="dimmed" ta="center">
                        © {new Date().getFullYear()} SelfHelp. All rights reserved.
                    </Text>
                </Stack>
            </Container>
        </Box>
    );
}
