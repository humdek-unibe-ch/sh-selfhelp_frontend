import React from 'react';
import { Box } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { IBoxStyle } from '../../../../../types/common/styles.types';
import parse from "html-react-parser";
import DOMPurify from 'dompurify';
import { getFieldContent } from '../../../../../utils/style-field-extractor';

/**
 * Props interface for BoxStyle component
 */
interface IBoxStyleProps {
    style: IBoxStyle;
    styleProps: Record<string, any>;
    cssClass: string;
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
const BoxStyle: React.FC<IBoxStyleProps> = ({ style, styleProps, cssClass }) => {

    const content = parse(DOMPurify.sanitize(style.content?.content || ''));
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    console.log(style);
    console.log('new spacing', getFieldContent(style, 'mantine_manitne_spacing'));

    console.log('legacy spacing', styleProps);

    return (
        <Box
            {...styleProps}
            className={cssClass}
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
