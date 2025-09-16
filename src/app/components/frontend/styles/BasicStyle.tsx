import React from 'react';
import {
    AlertStyle, ButtonStyle, CarouselStyle, CardStyle, CardSegmentStyle, ContainerStyle,
    DivStyle, FormUserInputStyle, HeadingStyle, ImageStyle, InputStyle,
    LinkStyle, LoginStyle, MarkdownStyle, RegisterStyle,
    SelectStyle, TabsStyle, TabStyle, TextareaStyle, VideoStyle,
    AudioStyle, FigureStyle, PlaintextStyle, RadioStyle,
    CheckboxStyle, SliderStyle,
    HtmlTagStyle, ValidateStyle,
    ResetPasswordStyle, TwoFactorAuthStyle, TableStyle, TableRowStyle,
    TableCellStyle, ShowUserInputStyle, CenterStyle,
    FlexStyle, GroupStyle, StackStyle, SimpleGridStyle, GridStyle,
    GridColumnStyle, SpaceStyle, AccordionStyle, AccordionItemStyle,
    ActionIconStyle, AspectRatioStyle, AvatarStyle,
    // Additional Mantine Components
    BackgroundImageStyle, BadgeStyle, BlockquoteStyle, ChipStyle,
    CodeStyle, ColorInputStyle, ColorPickerStyle, ComboboxStyle,
    DividerStyle, PaperStyle, FieldsetStyle, FileInputStyle, HighlightStyle, IndicatorStyle,
    KbdStyle, ListStyle, ListItemStyle, NotificationStyle, NumberInputStyle,
    ProgressStyle, ProgressRootStyle, ProgressSectionStyle, RangeSliderStyle, RatingStyle, SegmentedControlStyle,
    SpoilerStyle, StepperStyle, StepperStepStyle, StepperCompleteStyle,
    SwitchStyle, ThemeIconStyle, TimelineStyle, TimelineItemStyle,
    TitleStyle, TypographyStyle,
    // Special Components
    UnknownStyle
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
        case 'card':
            return <CardStyle style={style} />;
        case 'card-segment':
            return <CardSegmentStyle style={style} />;
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
        case 'background-image':
            return <BackgroundImageStyle style={style} />;
        case 'divider':
            return <DividerStyle style={style} />;
        case 'paper':
            return <PaperStyle style={style} />;

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
        case 'actionIcon':
            return <ActionIconStyle style={style} />;

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
        case 'color-input':
            return <ColorInputStyle style={style} />;
        case 'color-picker':
            return <ColorPickerStyle style={style} />;
        case 'fileInput':
            return <FileInputStyle style={style} />;
        case 'numberInput':
            return <NumberInputStyle style={style} />;
        case 'range-slider':
            return <RangeSliderStyle style={style} />;
        case 'segmentedControl':
            return <SegmentedControlStyle style={style} />;
        case 'switch':
            return <SwitchStyle style={style} />;
        case 'combobox':
            return <ComboboxStyle style={style} />;

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
        case 'stepper':
            return <StepperStyle style={style} />;
        case 'stepper-Step':
            return <StepperStepStyle style={style} />;
        case 'stepper-Complete':
            return <StepperCompleteStyle style={style} />;

        // Table Styles
        case 'table':
            return <TableStyle style={style} />;
        case 'tableRow':
            return <TableRowStyle style={style} />;
        case 'tableCell':
            return <TableCellStyle style={style} />;
            
        case 'showUserInput':
            return <ShowUserInputStyle style={style} />;
        case 'avatar':
            return <AvatarStyle style={style} />;
        case 'aspectRatio':
            return <AspectRatioStyle style={style} />;
        case 'badge':
            return <BadgeStyle style={style} />;
        case 'chip':
            return <ChipStyle style={style} />;
        case 'timeline':
            return <TimelineStyle style={style} />;
        case 'timeline-item':
            return <TimelineItemStyle style={style} />;
        case 'list':
            return <ListStyle style={style} />;
        case 'list-item':
            return <ListItemStyle style={style} />;
        case 'indicator':
            return <IndicatorStyle style={style} />;
        case 'kbd':
            return <KbdStyle style={style} />;
        case 'themeIcon':
            return <ThemeIconStyle style={style} />;
        case 'rating':
            return <RatingStyle style={style} />;
        case 'progress':
            return <ProgressStyle style={style} />;
        case 'progress-root':
            return <ProgressRootStyle style={style} />;
        case 'progress-section':
            return <ProgressSectionStyle style={style} />;
        case 'notification':
            return <NotificationStyle style={style} />;
        case 'title':
            return <TitleStyle style={style} />;
        case 'code':
            return <CodeStyle style={style} />;
        case 'highlight':
            return <HighlightStyle style={style} />;
        case 'blockquote':
            return <BlockquoteStyle style={style} />;
        case 'fieldset':
            return <FieldsetStyle style={style} />;
        case 'spoiler':
            return <SpoilerStyle style={style} />;
        case 'typography':
            return <TypographyStyle style={style} />;

        // Unknown/Unsupported styles
        default:
            return <UnknownStyle style={style} />;
    }
};

export default BasicStyle;