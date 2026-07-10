/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use server";
import { Box, Container } from '@mantine/core';
import styles from './WebsiteFooter.module.css';
import { resolveLanguageSSR, getFooterMenuSSR } from '../../../../_lib/server-fetch';
import { FooterLinks } from './FooterLinks';

/**
 * Website Footer with optimized loading behavior.
 *
 * All footer links are CMS-driven via the `web_footer` navigation menu.
 *
 * The impersonation banner is intentionally NOT rendered here: it lives
 * in the admin shell (`AdminShell`), which is the only place an admin
 * actually performs impersonation actions. Mounting it on every public
 * page caused duplicate-banner stacking when an admin previewed a public
 * route from the CMS.
 */
export async function WebsiteFooter() {
    const { id: languageId } = await resolveLanguageSSR();
    const footerMenu = await getFooterMenuSSR(languageId);

    return (
        <Box component="footer" w="100%" py={{ base: 'lg', sm: 'xl' }} className={styles.footer}>
            <Container size="xl">
                <FooterLinks footerMenu={footerMenu} />
            </Container>
        </Box>
    );
}
