import React from 'react';
import { TStyle } from '@/types/api/styles.types';
import { IContainerStyle, IButtonStyle, ICardStyle, ICarouselStyle, IDivStyle, IHeadingStyle, IImageStyle, ILinkStyle, IMarkdownStyle } from '@/types/api/styles.types';
import { ButtonStyle, CardStyle, CarouselStyle, ContainerStyle, DivStyle, HeadingStyle, ImageStyle, LinkStyle, MarkdownStyle } from './SelfHelpStyles';

interface IBasicStyleProps {
    style: TStyle;
}

const BasicStyle: React.FC<IBasicStyleProps> = ({ style }) => {
    // Type guard functions to ensure proper type casting
    const isContainer = (style: TStyle): style is IContainerStyle => style.style_name === 'container';
    const isImage = (style: TStyle): style is IImageStyle => style.style_name === 'image';
    const isMarkdown = (style: TStyle): style is IMarkdownStyle => style.style_name === 'markdown';
    const isHeading = (style: TStyle): style is IHeadingStyle => style.style_name === 'heading';
    const isCard = (style: TStyle): style is ICardStyle => style.style_name === 'card';
    const isDiv = (style: TStyle): style is IDivStyle => style.style_name === 'div';
    const isButton = (style: TStyle): style is IButtonStyle => style.style_name === 'button';
    const isCarousel = (style: TStyle): style is ICarouselStyle => style.style_name === 'carousel';
    const isLink = (style: TStyle): style is ILinkStyle => style.style_name === 'link';

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

    return renderStyle();
};

export default BasicStyle;