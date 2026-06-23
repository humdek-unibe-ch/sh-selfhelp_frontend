/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Box, Image, Text } from '@mantine/core';
import BasicStyle from './BasicStyle';
import { type IFigureStyle } from '../../../../types/common/styles.types';
import { getAssetUrl } from '../../../../utils/asset-url.utils';

/**
 * Props interface for IFigureStyle component
 */
interface IFigureStyleProps {
    style: IFigureStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

const FigureStyle: React.FC<IFigureStyleProps> = ({ style }) => {
    const captionTitle = style.caption_title?.content;
    const caption = style.caption?.content;
    // Optional built-in image: render it automatically when set, without an
    // explicit child image section. Never auto-creates a section.
    const imgSrc = style.img_src?.content;
    const builtInSrc = imgSrc ? getAssetUrl(imgSrc) : undefined;
    const alt = style.alt?.content;

    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    return (
        <Box component="figure" className={style.css ?? ""}>
            {builtInSrc ? <Image src={builtInSrc} alt={alt} /> : null}
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
            ))}
            {(captionTitle || caption) && (
                <Text component="figcaption" size="sm" c="dimmed" mt="xs">
                    {captionTitle && <Text component="strong">{captionTitle}</Text>}
                    {captionTitle && caption && ': '}
                    {caption}
                </Text>
            )}
        </Box>
    );
};

export default FigureStyle; 