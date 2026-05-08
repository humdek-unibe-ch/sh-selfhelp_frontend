"use server";
import { Box, Container, Group, Stack, Text } from '@mantine/core';
import styles from './WebsiteFooter.module.css';
import { resolveLanguageSSR, getFooterPagesSSR } from '../../../../_lib/server-fetch';
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
 *
 * The impersonation banner is intentionally NOT rendered here: it lives
 * in the admin shell (`AdminShell`), which is the only place an admin
 * actually performs impersonation actions. Mounting it on every public
 * page caused duplicate-banner stacking when an admin previewed a public
 * route from the CMS.
 */
export async function WebsiteFooter() {
    const { id: languageId } = await resolveLanguageSSR();
    const footerPages = await getFooterPagesSSR(languageId);

    return (
        <Box component="footer" w="100%" py="xl" className={styles.footer}>
            <Container size="xl">
                <Stack gap="lg">
                    <Group justify="center" gap="xl">
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
