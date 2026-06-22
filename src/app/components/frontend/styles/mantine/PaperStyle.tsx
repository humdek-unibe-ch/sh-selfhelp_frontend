/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Paper, Text } from '@mantine/core';
import { type IPaperStyle } from '../../../../../types/common/styles.types';
import { castMantineRadius } from '../../../../../utils/style-field-extractor';
import { stripHtmlTags } from '../../../../../utils/html-sanitizer.utils';
import BasicStyle from '../BasicStyle';

/**
 * Props interface for PaperStyle component
 */
/**
 * Props interface for IPaperStyle component
 */
interface IPaperStyleProps {
    style: IPaperStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

/**
 * PaperStyle component renders a Mantine Paper component for elevated surfaces.
 * Supports shadow, radius, padding, and border configurations.
 *
 * @component
 * @param {IPaperStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Paper with styled configuration
 */
const PaperStyle: React.FC<IPaperStyleProps> = ({ style, styleProps, cssClass }) => {

    // Extract Mantine-specific props
    const shadow = style.web_paper_shadow?.content || 'sm';
    const radius = castMantineRadius(style.shared_radius?.content);
    const withBorder = style.shared_border?.content === '1';

    // Optional auto-styled heading: rendered only when filled (empty = a plain
    // surface). Never replaces manual composition and never creates a section.
    const rawTitle = style.title?.content;
    const paperTitle = rawTitle ? stripHtmlTags(rawTitle).trim() : '';

    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    return (
        <Paper
            shadow={shadow === 'none' ? undefined : shadow as 'xs' | 'sm' | 'md' | 'lg' | 'xl'}
            radius={radius === 'none' ? 0 : radius}
            // Fixed inner padding default; authors tune it via the portable
            // `shared_spacing` field (pt/pb/ps/pe) which arrives in `styleProps`.
            // There is no web-only px/py field anymore.
            p="md"
            withBorder={withBorder}
            {...styleProps} className={cssClass}
        >
            {paperTitle ? (
                <Text fw={600} size="lg" mb="xs">
                    {paperTitle}
                </Text>
            ) : null}
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
            ))}
        </Paper>
    );
};

export default PaperStyle;
