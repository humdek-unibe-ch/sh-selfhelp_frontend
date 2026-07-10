/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
 */
import { describe, expect, it, vi } from 'vitest';
import slugLayoutStyles from '../../../../[[...slug]]/SlugLayout/SlugLayout.module.css';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import { LivePreviewWebPane } from '../LivePreviewWebPane';

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
    usePathname: () => '/about',
}));

vi.mock('../../../../[[...slug]]/DynamicPageClient', () => ({
    default: () => <div>Preview page body</div>,
}));

vi.mock('../../../frontend/layout/header/WebsiteHeaderLayout', () => ({
    WebsiteHeaderLayout: () => <div>Header</div>,
}));

vi.mock('../../../frontend/layout/footer/FooterLinks', () => ({
    FooterLinks: () => <div>Footer links</div>,
}));

vi.mock('../../../shared/common/PreviewModeIndicator', () => ({
    PreviewModeIndicator: () => null,
}));

vi.mock('../../../../../hooks/useAppNavigation', () => ({
    useAppNavigation: () => ({
        routes: [{ keyword: 'about', is_headless: false, id_pages: 1 }],
        footerMenu: { items: [{ id: 1, label: 'Legal' }], preset: 'columns' },
        headerMenu: { preset: 'dropdown', items: [{ id: 2, label: 'Home' }] },
        navigation: null,
        profilePages: [],
    }),
}));

vi.mock('../../../contexts/PreviewModeContext', () => ({
    usePreviewMode: () => ({ isPreviewMode: false }),
}));

describe('LivePreviewWebPane layout', () => {
    it('uses the same sticky-footer wrappers as the public slug shell', () => {
        const { container } = renderWithProviders(
            <LivePreviewWebPane keyword="about" onNavigate={vi.fn()} />,
        );

        expect(container.querySelector(`.${slugLayoutStyles.contentArea}`)).toBeTruthy();
        expect(container.querySelector(`.${slugLayoutStyles.footerWrapper}`)).toBeTruthy();
    });
});
