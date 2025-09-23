import React from 'react';
import { Box } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { IBoxStyle } from '../../../../../types/common/styles.types';
import { castMantineSize, castMantineRadius } from '../../../../../utils/style-field-extractor';
import parse from "html-react-parser";
import DOMPurify from 'dompurify';

/**
 * Props interface for BoxStyle component
 */
interface IBoxStyleProps {
    style: IBoxStyle;
}

/**
 * BoxStyle component renders a Mantine Box component for layout and styling.
 * Box is the base component for all Mantine components, providing style props
 * support for spacing, colors, borders, and layout. Can contain child components.
 *
 * @component
 * @param {IBoxStyleProps} props - Component props
 * @returns {JSX.Element | null} Rendered Mantine Box with children or null when styling is disabled
 */
const BoxStyle: React.FC<IBoxStyleProps> = ({ style }) => {
    // Extract field values using direct style property access
    const use_mantine_style = style.use_mantine_style?.content === '1';

    const content = parse(DOMPurify.sanitize(style.content?.content || ''));

    // Color and background
    const backgroundColor = style.mantine_background_color?.content;
    const color = style.mantine_color?.content;

    // Border properties
    const border = style.mantine_border?.content || 'none';
    const borderSize = style.mantine_border_size?.content || '1';
    const borderColor = style.mantine_border_color?.content;
    const radius = castMantineRadius(style.mantine_radius?.content);

    // Shadow property
    const shadow = style.mantine_shadow?.content || 'none';

    // Spacing - global fields
    const paddingInline = style.mantine_padding_inline?.content;
    const paddingBlock = style.mantine_padding_block?.content;
    const marginInline = style.mantine_margin_inline?.content;
    const marginBlock = style.mantine_margin_block?.content;

    // Directional spacing
    const pt = style.mantine_pt?.content;
    const pb = style.mantine_pb?.content;
    const pl = style.mantine_pl?.content;
    const pr = style.mantine_pr?.content;
    const mt = style.mantine_mt?.content;
    const mb = style.mantine_mb?.content;
    const ml = style.mantine_ml?.content;
    const mr = style.mantine_mr?.content;

    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object for inline styles
    const styleObj: React.CSSProperties = {};

    // Handle border styling
    if (border && border !== 'none') {
        styleObj.borderStyle = border;
        styleObj.borderWidth = `${borderSize}px`;
        if (borderColor) {
            styleObj.borderColor = borderColor;
        }
    }

    // Handle shadow styling - Box component doesn't have shadow prop, so use CSS
    if (shadow && shadow !== 'none') {
        // Mantine shadow values map to CSS box-shadow
        const shadowMap: Record<string, string> = {
            'xs': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
            'sm': '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
            'md': '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
            'lg': '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
            'xl': '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)'
        };
        styleObj.boxShadow = shadowMap[shadow] || shadow;
    }

    return (
        <Box
            bdrs={radius === 'none' ? 0 : radius}
            bg={backgroundColor || undefined}
            c={color || undefined}
            px={paddingInline && paddingInline !== 'none' ? paddingInline : undefined}
            py={paddingBlock && paddingBlock !== 'none' ? paddingBlock : undefined}
            mx={marginInline && marginInline !== 'none' ? marginInline : undefined}
            my={marginBlock && marginBlock !== 'none' ? marginBlock : undefined}
            pt={pt && pt !== 'none' ? pt : undefined}
            pb={pb && pb !== 'none' ? pb : undefined}
            pl={pl && pl !== 'none' ? pl : undefined}
            pr={pr && pr !== 'none' ? pr : undefined}
            mt={mt && mt !== 'none' ? mt : undefined}
            mb={mb && mb !== 'none' ? mb : undefined}
            ml={ml && ml !== 'none' ? ml : undefined}
            mr={mr && mr !== 'none' ? mr : undefined}
            className={cssClass}
            style={styleObj}
        >
            {content}
            {children.length > 0 ? (
                children.map((child: any, index: number) => (
                    child ? <BasicStyle key={index} style={child} /> : null
                ))
            ) : null}
        </Box>
    );

};

export default BoxStyle;
