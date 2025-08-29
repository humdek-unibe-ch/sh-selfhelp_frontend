import React from 'react';
import {
    AlertStyle, ButtonStyle, CardStyle, CarouselStyle, ContainerStyle,
    DivStyle, FormUserInputStyle, HeadingStyle, ImageStyle, InputStyle,
    JumbotronStyle, LinkStyle, LoginStyle, MarkdownStyle, RegisterStyle,
    SelectStyle, TabsStyle, TextareaStyle, UnknownStyle, VideoStyle,
    AudioStyle, FigureStyle, PlaintextStyle, RawTextStyle, RadioStyle,
    CheckboxStyle, SliderStyle, FormStyle, ProgressBarStyle, ModalStyle,
    HtmlTagStyle, JsonStyle, QuizStyle, NavigationContainerStyle,
    AccordionListStyle, NestedListStyle, SortableListStyle, ValidateStyle,
    ResetPasswordStyle, TwoFactorAuthStyle, TableStyle, TableRowStyle,
    TableCellStyle, ShowUserInputStyle
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

    // Extract common field values from the generic fields object
    const getFieldContent = (fieldName: string): any => {
        if (fieldName in style) {
            return (style as any)[fieldName]?.content;
        }
        return style.fields?.[fieldName]?.content;
    };

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
        case 'jumbotron':
            return <JumbotronStyle style={style} />;
        case 'card':
            return <CardStyle style={style} />;
        case 'div':
            return <DivStyle style={style} />;
        case 'alert':
            return <AlertStyle style={style} />;

        // Text & Content Styles
        case 'heading':
            return <HeadingStyle style={style} />;
        case 'markdown':
        case 'markdownInline':
            return <MarkdownStyle style={style} />;
        case 'plaintext':
            return <PlaintextStyle style={style} />;
        case 'rawText':
            return <RawTextStyle style={style} />;
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
        case 'form':
            return <FormStyle style={style} />;
        case 'formUserInput':
        case 'formUserInputLog':
        case 'formUserInputRecord':
            return <FormUserInputStyle style={style as any} />;
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
            // Tab components are handled within TabsStyle
            return null;

        // Table Styles
        case 'table':
            return <TableStyle style={style} />;
        case 'tableRow':
            return <TableRowStyle style={style} />;
        case 'tableCell':
            return <TableCellStyle style={style} />;

        // Navigation & Container Styles
        case 'navigationContainer':
            return <NavigationContainerStyle style={style} />;

        // List & Navigation Styles
        case 'accordionList':
            return <AccordionListStyle style={style} />;
        case 'nestedList':
            return <NestedListStyle style={style} />;
        case 'sortableList':
            return <SortableListStyle style={style} />;

        // Progress & UI Elements
        case 'progressBar':
            return <ProgressBarStyle style={style} />;
        case 'quiz':
            return <QuizStyle style={style} />;
        case 'json':
            return <JsonStyle style={style} />;
        case 'showUserInput':
            return <ShowUserInputStyle style={style} />;

        // Unknown/Unsupported styles
        default:
            return <UnknownStyle style={style} />;
    }
};

export default BasicStyle;