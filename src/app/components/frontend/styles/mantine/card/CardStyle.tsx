/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Card, Image, Text } from '@mantine/core';
import BasicStyle from '../../BasicStyle';
import { type ICardStyle } from '../../../../../../types/common/styles.types';
import { castMantineRadius } from '../../../../../../utils/style-field-extractor';
import { getAssetUrl } from '../../../../../../utils/asset-url.utils';
import { stripHtmlTags } from '../../../../../../utils/html-sanitizer.utils';

/**
 * Props interface for ICardStyle component
 */
interface ICardStyleProps {
    style: ICardStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

/**
 * CardStyle renders a Mantine Card container.
 *
 * Optional authoring-UX convenience: when the `title` and/or `img_src` content
 * fields are filled the renderer draws a styled heading / top image
 * automatically (empty = a plain card). These never replace manual composition
 * with child sections and never auto-create a section.
 */
const CardStyle: React.FC<ICardStyleProps> = ({ style, styleProps, cssClass }) => {
    const shadow = style.web_card_shadow?.content || 'sm';
    const radius = castMantineRadius(style.radius?.content);
    const withBorder = style.border?.content === '1';

    const rawTitle = style.title?.content;
    const cardTitle = rawTitle ? stripHtmlTags(rawTitle).trim() : '';
    const rawImg = style.img_src?.content?.trim();
    const imgSrc = rawImg ? getAssetUrl(rawImg) : '';

    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    return (
        <Card
            shadow={shadow === 'none' ? undefined : (shadow as 'xs' | 'sm' | 'md' | 'lg' | 'xl')}
            radius={radius === 'none' ? 0 : radius}
            withBorder={withBorder}
            // Fixed inner padding (also the Card.Section image-bleed reference).
            // Authors tune spacing via the portable `spacing` field, which
            // arrives as pt/pb/ps/pe through `styleProps` — there is no separate
            // web-only card-padding field.
            padding="md"
            {...styleProps} className={cssClass}
        >
            {imgSrc ? (
                <Card.Section>
                    <Image src={imgSrc} alt={cardTitle || undefined} />
                </Card.Section>
            ) : null}
            {cardTitle ? (
                <Text fw={600} size="lg" mt={imgSrc ? 'md' : undefined} mb="xs">
                    {cardTitle}
                </Text>
            ) : null}
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
            ))}
        </Card>
    );
};

export default CardStyle;
