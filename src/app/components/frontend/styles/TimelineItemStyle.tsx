/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Text } from '@mantine/core';
import BasicStyle from './BasicStyle';
import { type ITimelineItemStyle, type TStyle } from '../../../../types/common/styles.types';

interface ITimelineItemStyleProps {
    style: ITimelineItemStyle;
    cssClass: string;
}

// timeline-item is a child of `timeline`; the parent Timeline renders its items
// inline (TimelineStyle). This standalone renderer is the fallback for a
// timeline-item dispatched directly (e.g. previewing a single child) so it never
// falls through to UnknownStyle. Mirrors the mobile TimelineItem (bullet + an
// optional title + child content); the web-only bullet/line/color fields are
// owned by the parent Timeline layout.
const TimelineItemStyle: React.FC<ITimelineItemStyleProps> = ({ style, cssClass }) => {
    const children = Array.isArray(style.children) ? style.children : [];
    const title = style.title?.content;
    return (
        <div className={cssClass} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div
                aria-hidden
                style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: 'var(--mantine-color-blue-6)',
                    marginTop: 4,
                    flexShrink: 0,
                }}
            />
            <div style={{ flex: 1 }}>
                {title ? (
                    <Text fw={700} size="sm" mb={4}>
                        {title}
                    </Text>
                ) : null}
                {children.map((child: TStyle, index: number) =>
                    child ? <BasicStyle key={index} style={child} /> : null
                )}
            </div>
        </div>
    );
};

export default TimelineItemStyle;
