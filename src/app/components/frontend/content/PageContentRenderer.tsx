/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import type { SyntheticEvent } from 'react';
import { Stack } from '@mantine/core';
import type { TStyle } from '../../../../types/common/styles.types';
import BasicStyle from '../styles/BasicStyle';

interface IPageContentRendererProps {
    sections: TStyle[];
    /**
     * Called for every input and change event inside the page (capture phase). The live page uses it
     * to know which forms the person typed into (`useVanishedFormNotice`).
     */
    onInputCapture?: (event: SyntheticEvent) => void;
}

export function PageContentRenderer({ sections, onInputCapture }: IPageContentRendererProps) {
    if (!sections || sections.length === 0) {
        return null;
    }

    return (
        <div onInputCapture={onInputCapture} onChangeCapture={onInputCapture}>
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
