/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Stack } from '@mantine/core';
import type { TStyle } from '../../../../types/common/styles.types';
import BasicStyle from '../styles/BasicStyle';

interface IPageContentRendererProps {
    sections: TStyle[];
}

export function PageContentRenderer({ sections }: IPageContentRendererProps) {
    if (!sections || sections.length === 0) {
        return null;
    }

    return (
        <div>
            <Stack gap={0}>
                {sections.map((section) => {
                    if (!section) return null;
                    const sectionId = `section-${section.id}`;
                    return (
                        <div key={sectionId} id={sectionId}>
                            <BasicStyle style={section} />
                        </div>
                    );
                })}
            </Stack>
        </div>
    );
}
