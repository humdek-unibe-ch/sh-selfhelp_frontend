import React from 'react';
import {
    AlertStyle, ButtonStyle, CarouselStyle, ContainerStyle,
    DivStyle, FormUserInputStyle, HeadingStyle, ImageStyle, InputStyle,
    LinkStyle, LoginStyle, MarkdownStyle, RegisterStyle,
    SelectStyle, TabsStyle, TextareaStyle, VideoStyle,
    AudioStyle, FigureStyle, PlaintextStyle, RadioStyle,
    CheckboxStyle, SliderStyle, ProgressBarStyle,
    HtmlTagStyle, ValidateStyle,
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

    // Extract common field values from the generic fields object and global fields
    const getFieldContent = (fieldName: string): any => {
        // Check for global fields first (css, cssmobile, debug_condition, dataconfig)
        const globalFields = ['css', 'cssmobile', 'debug_condition', 'dataconfig'];
        if (globalFields.includes(fieldName) && fieldName in style) {
            return (style as any)[fieldName]?.content;
        }

        // Check for direct properties (like title, text, etc.)
        if (fieldName in style) {
            return (style as any)[fieldName]?.content;
        }

        // Finally check the fields object
        return style.fields?.[fieldName]?.content;
    };

    // Helper to get global field values specifically
    const getGlobalField = (fieldName: string): any => {
        const globalFields = ['css', 'cssmobile', 'debug_condition', 'dataconfig'];
        if (globalFields.includes(fieldName) && fieldName in style) {
            return (style as any)[fieldName];
        }
        return null;
    };

    // Extract global fields for easier access
    const globalCss = getGlobalField('css');
    const globalCssMobile = getGlobalField('cssmobile');
    const debugCondition = getGlobalField('debug_condition');
    const dataConfig = getGlobalField('dataconfig');

    // Create enhanced style object with global fields
    const enhancedStyle = {
        ...style,
        globalCss,
        globalCssMobile,
        debugCondition,
        dataConfig,
        getFieldContent,
        getGlobalField
    };

    /**
     * Renders the appropriate style component based on style_name
     */
    switch (style.style_name) {
        // Authentication Styles
        case 'login':
            return <LoginStyle style={enhancedStyle as any} />;
        case 'register':
            return <RegisterStyle style={enhancedStyle as any} />;
        case 'validate':
            return <ValidateStyle style={enhancedStyle as any} />;
        case 'resetPassword':
            return <ResetPasswordStyle style={enhancedStyle as any} />;
        case 'twoFactorAuth':
            return <TwoFactorAuthStyle style={enhancedStyle as any} />;

        // Container & Layout Styles
        case 'container':
            return <ContainerStyle style={enhancedStyle as any} />;
        case 'div':
            return <DivStyle style={enhancedStyle as any} />;
        case 'alert':
            return <AlertStyle style={enhancedStyle as any} />;

        // Text & Content Styles
        case 'heading':
            return <HeadingStyle style={enhancedStyle as any} />;
        case 'markdown':
        case 'markdownInline':
            return <MarkdownStyle style={enhancedStyle as any} />;
        case 'plaintext':
            return <PlaintextStyle style={enhancedStyle as any} />;
        case 'htmlTag':
            return <HtmlTagStyle style={enhancedStyle as any} />;

        // Media Styles
        case 'image':
            return <ImageStyle style={enhancedStyle as any} />;
        case 'carousel':
            return <CarouselStyle style={enhancedStyle as any} />;
        case 'video':
            return <VideoStyle style={enhancedStyle as any} />;
        case 'audio':
            return <AudioStyle style={enhancedStyle as any} />;
        case 'figure':
            return <FigureStyle style={enhancedStyle as any} />;

        // Navigation & Links Styles
        case 'button':
            return <ButtonStyle style={enhancedStyle as any} />;
        case 'link':
            return <LinkStyle style={enhancedStyle as any} />;

        // Form & Input Styles
        case 'formUserInput':
        case 'formUserInputLog':
        case 'formUserInputRecord':
            return <FormUserInputStyle style={enhancedStyle as any} />;
        case 'textarea':
            return <TextareaStyle style={enhancedStyle as any} />;
        case 'input':
            return <InputStyle style={enhancedStyle as any} />;
        case 'select':
            return <SelectStyle style={enhancedStyle as any} />;
        case 'radio':
            return <RadioStyle style={enhancedStyle as any} />;
        case 'checkbox':
            return <CheckboxStyle style={enhancedStyle as any} />;
        case 'slider':
            return <SliderStyle style={enhancedStyle as any} />;

        // Tab Styles
        case 'tabs':
            return <TabsStyle style={enhancedStyle as any} />;
        case 'tab':
            // Tab components are handled within TabsStyle
            return null;

        // Table Styles
        case 'table':
            return <TableStyle style={enhancedStyle as any} />;
        case 'tableRow':
            return <TableRowStyle style={enhancedStyle as any} />;
        case 'tableCell':
            return <TableCellStyle style={enhancedStyle as any} />;

        // Progress & UI Elements
        case 'progressBar':
            return <ProgressBarStyle style={enhancedStyle as any} />;
        case 'showUserInput':
            return <ShowUserInputStyle style={enhancedStyle as any} />;

        // Unknown/Unsupported styles
        default:
            return null;
    }
};

export default BasicStyle;