import React from 'react';
import {
    AlertStyle, ButtonStyle, CarouselStyle, ContainerStyle,
    DivStyle, FormUserInputStyle, HeadingStyle, ImageStyle, InputStyle,
    LinkStyle, LoginStyle, MarkdownStyle, RegisterStyle,
    SelectStyle, TabsStyle, TabStyle, TextareaStyle, VideoStyle,
    AudioStyle, FigureStyle, PlaintextStyle, RadioStyle,
    CheckboxStyle, SliderStyle, ProgressBarStyle,
    HtmlTagStyle, ValidateStyle,
    ResetPasswordStyle, TwoFactorAuthStyle, TableStyle, TableRowStyle,
    TableCellStyle, ShowUserInputStyle, CenterStyle,
    FlexStyle, GroupStyle, StackStyle, SimpleGridStyle, GridStyle,
    GridColumnStyle, SpaceStyle, AccordionStyle, AccordionItemStyle
} from './SelfHelpStyles';
import { TStyle } from '../../../../types/common/styles.types';

/**
 * Props interface for BasicStyle component
 * @property {TStyle} style - The style configuration object
 */
interface IBasicStyleProps {
    style: TStyle;
}

/**
 * BasicStyle is a component factory that renders different style components
 * based on the style_name property. It acts as a router for all style types.
 *
 * @param {IBasicStyleProps} props - Component props
 * @returns {JSX.Element | null} The appropriate styled component or null
 */
const BasicStyle: React.FC<IBasicStyleProps> = ({ style }) => {
    if (!style || !style.style_name) {
        return null;
    }

    /**
     * Renders the appropriate style component based on style_name
     */
    switch (style.style_name) {
        // Authentication Styles
        case 'login':
            return <LoginStyle style={style} />;
        case 'register':
            return <RegisterStyle style={style} />;
        case 'validate':
            return <ValidateStyle style={style} />;
        case 'resetPassword':
            return <ResetPasswordStyle style={style} />;
        case 'twoFactorAuth':
            return <TwoFactorAuthStyle style={style} />;

        // Container & Layout Styles
        case 'container':
            return <ContainerStyle style={style} />;
        case 'div':
            return <DivStyle style={style} />;
        case 'alert':
            return <AlertStyle style={style} />;
        case 'center':
            return <CenterStyle style={style} />;
        case 'flex':
            return <FlexStyle style={style} />;
        case 'group':
            return <GroupStyle style={style} />;
        case 'stack':
            return <StackStyle style={style} />;
        case 'simpleGrid':
            return <SimpleGridStyle style={style} />;
        case 'grid':
            return <GridStyle style={style} />;
        case 'grid-column':
            return <GridColumnStyle style={style} />;
        case 'space':
            return <SpaceStyle style={style} />;

        // Text & Content Styles
        case 'heading':
            return <HeadingStyle style={style} />;
        case 'markdown':
            return <MarkdownStyle style={style} />;
        case 'plaintext':
            return <PlaintextStyle style={style} />;
        case 'htmlTag':
            return <HtmlTagStyle style={style} />;

        // Media Styles
        case 'image':
            return <ImageStyle style={style} />;
        case 'carousel':
            return <CarouselStyle style={style} />;
        case 'video':
            return <VideoStyle style={style} />;
        case 'audio':
            return <AudioStyle style={style} />;
        case 'figure':
            return <FigureStyle style={style} />;

        // Navigation & Links Styles
        case 'button':
            return <ButtonStyle style={style} />;
        case 'link':
            return <LinkStyle style={style} />;

        // Form & Input Styles
        case 'formUserInputLog':
        case 'formUserInputRecord':
            return <FormUserInputStyle style={style} />;
        case 'textarea':
            return <TextareaStyle style={style} />;
        case 'input':
            return <InputStyle style={style} />;
        case 'select':
            return <SelectStyle style={style} />;
        case 'radio':
            return <RadioStyle style={style} />;
        case 'checkbox':
            return <CheckboxStyle style={style} />;
        case 'slider':
            return <SliderStyle style={style} />;

        // Tab Styles
        case 'tabs':
            return <TabsStyle style={style} />;
        case 'tab':
            return <TabStyle style={style} />;

        // Accordion Styles
        case 'accordion':
            return <AccordionStyle style={style} />;
        case 'accordion-Item':
            return <AccordionItemStyle style={style} />;

        // Table Styles
        case 'table':
            return <TableStyle style={style} />;
        case 'tableRow':
            return <TableRowStyle style={style} />;
        case 'tableCell':
            return <TableCellStyle style={style} />;

        // Progress & UI Elements
        case 'progressBar':
            return <ProgressBarStyle style={style} />;
        case 'showUserInput':
            return <ShowUserInputStyle style={style} />;

        // Unknown/Unsupported styles
        default:
            return null;
    }
};

export default BasicStyle;