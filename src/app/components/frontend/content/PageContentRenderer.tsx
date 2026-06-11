/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import React, { useEffect } from 'react';
import { Stack } from '@mantine/core';
import type { TStyle } from '../../../../types/common/styles.types';
import BasicStyle from '../styles/BasicStyle';

interface IPageContentRendererProps {
    sections: TStyle[];
}

export function PageContentRenderer({ sections }: IPageContentRendererProps) {
    useEffect(() => {
        const scrollToId = (id: string) => {
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };

        // ?anchorId=value — scroll to section whose anchor matches
        const params = new URLSearchParams(window.location.search);
        const anchorId = params.get('anchorId');
        if (anchorId) scrollToId(anchorId);

        // #hash — scroll to section-{id} wrapper
        const hash = window.location.hash.slice(1);
        if (hash) scrollToId(hash);

        const onHashChange = () => {
            const h = window.location.hash.slice(1);
            if (h) scrollToId(h);
        };
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, [sections]);

    if (!sections || sections.length === 0) {
        return null;
    }

    return (
        <div>
            <Stack gap={0}>
                {sections.map((section) => {
                    if (!section) return null;
                    const anchor = (section as any).anchor?.content;
                    const sectionId = `section-${section.id}`;
                    return (
                        <div key={sectionId} id={anchor || sectionId}>
                            <BasicStyle style={section} />
                        </div>
                    );
                })}
            </Stack>
        </div>
    );
}
