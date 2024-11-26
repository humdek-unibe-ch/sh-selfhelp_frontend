import React from 'react';
import { TStyle } from '@/types/api/styles.types';
import {
    IContainerStyle, IButtonStyle, ICardStyle, ICarouselStyle,
    IDivStyle, IHeadingStyle, IImageStyle, ILinkStyle, IMarkdownStyle,
    ITextareaStyle
} from '@/types/api/styles.types';
import {
    ButtonStyle, CardStyle, CarouselStyle, ContainerStyle,
    DivStyle, HeadingStyle, ImageStyle, LinkStyle, MarkdownStyle
} from './SelfHelpStyles';
import FormUserInputLogStyle from './FormUserInputStyle';
import TextareaStyle from './TextareaStyle';

/**
 * Props interface for BasicStyle component
 * @property {TStyle} style - The style configuration object
 */
interface IBasicStyleProps {
    style: TStyle;
}

/**
 * BasicStyle is a component factory that renders different style components
 * based on the style_name property. It uses type guards to ensure type safety
 * when passing props to child components.
 *
 * @param {IBasicStyleProps} props - Component props
 * @returns {JSX.Element} The appropriate styled component
 */
const BasicStyle: React.FC<IBasicStyleProps> = ({ style }) => {
    // Type guard functions for each style type
    const isContainer = (style: TStyle): style is IContainerStyle => style.style_name === 'container';
    const isImage = (style: TStyle): style is IImageStyle => style.style_name === 'image';
    const isMarkdown = (style: TStyle): style is IMarkdownStyle => style.style_name === 'markdown';
    const isHeading = (style: TStyle): style is IHeadingStyle => style.style_name === 'heading';
    const isCard = (style: TStyle): style is ICardStyle => style.style_name === 'card';
    const isDiv = (style: TStyle): style is IDivStyle => style.style_name === 'div';
    const isButton = (style: TStyle): style is IButtonStyle => style.style_name === 'button';
    const isCarousel = (style: TStyle): style is ICarouselStyle => style.style_name === 'carousel';
    const isLink = (style: TStyle): style is ILinkStyle => style.style_name === 'link';
    const isFormUserInput = (style: TStyle): style is TStyle => style.style_name === 'formUserInputLog';
    const isTextarea = (style: TStyle): style is ITextareaStyle => style.style_name === 'textarea';

    /**
     * Renders the appropriate style component based on style_name
     * Uses type guards to ensure type safety
     */
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
            case 'formUserInputLog':
                if (isFormUserInput(style)) return <FormUserInputLogStyle style={style} />;
                break;
            case 'textarea':
                if (isTextarea(style)) return <TextareaStyle style={style} />;
                break;
            default:
                return null;
        }
        return null;
    };

    return renderStyle();
};

export default BasicStyle;