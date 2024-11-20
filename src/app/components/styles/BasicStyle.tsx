import React from 'react';
import { Style } from '@/types/api/styles.types';
import { ButtonStyle, CardStyle, CarouselStyle, ContainerStyle, DivStyle, HeadingStyle, ImageStyle, LinkStyle, MarkdownStyle } from './index';

interface BasicStyleProps {
    style: Style;
}

const BasicStyle: React.FC<BasicStyleProps> = ({ style }) => {
    // Type guard functions to ensure proper type casting
    const isContainer = (style: Style): style is ContainerStyle => style.style_name === 'container';
    const isImage = (style: Style): style is ImageStyle => style.style_name === 'image';
    const isMarkdown = (style: Style): style is MarkdownStyle => style.style_name === 'markdown';
    const isHeading = (style: Style): style is HeadingStyle => style.style_name === 'heading';
    const isCard = (style: Style): style is CardStyle => style.style_name === 'card';
    const isDiv = (style: Style): style is DivStyle => style.style_name === 'div';
    const isButton = (style: Style): style is ButtonStyle => style.style_name === 'button';
    const isCarousel = (style: Style): style is CarouselStyle => style.style_name === 'carousel';
    const isLink = (style: Style): style is LinkStyle => style.style_name === 'link';

    const renderStyle = () => {
        switch (style.style_name) {
            case 'container':
                if (isContainer(style)) return <ContainerStyle style={style} />;
                break;
            case 'image':
                if (isImage(style)) return <ImageStyle style={style} />;
                break;
            case 'markdown':
                if (isMarkdown(style)) return <MarkdownStyle style={style} />;
                break;
            case 'heading':
                if (isHeading(style)) return <HeadingStyle style={style} />;
                break;
            case 'card':
                if (isCard(style)) return <CardStyle style={style} />;
                break;
            case 'div':
                if (isDiv(style)) return <DivStyle style={style} />;
                break;
            case 'button':
                if (isButton(style)) return <ButtonStyle style={style} />;
                break;
            case 'carousel':
                if (isCarousel(style)) return <CarouselStyle style={style} />;
                break;
            case 'link':
                if (isLink(style)) return <LinkStyle style={style} />;
                break;
        }
        return <div>Unsupported style type: {style.style_name}</div>;
    };

    // Render with error boundary
    try {
        return renderStyle();
    } catch (error) {
        console.error('Error rendering style:', error);
        return <div>Error rendering style: {style.style_name}</div>;
    }
};

export default BasicStyle;