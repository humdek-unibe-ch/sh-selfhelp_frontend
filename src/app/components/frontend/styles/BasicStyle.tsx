import React from 'react';
import {
    AlertStyle, ButtonStyle, CarouselStyle, CardStyle, CardSegmentStyle, ContainerStyle,
    DivStyle, HeadingStyle, ImageStyle, InputStyle,
    LinkStyle, LoginStyle, MarkdownStyle, RegisterStyle,
    SelectStyle, TabsStyle, TabStyle, VideoStyle,
    AudioStyle, FigureStyle, PlaintextStyle, RadioStyle,
    ScrollAreaStyle, CheckboxStyle, DatePickerStyle, SliderStyle,
    HtmlTagStyle, ValidateStyle,
    ResetPasswordStyle, TwoFactorAuthStyle, CenterStyle,
    FlexStyle, GroupStyle, StackStyle, SimpleGridStyle, GridStyle,
    GridColumnStyle, SpaceStyle, AccordionStyle, AccordionItemStyle,
    ActionIconStyle, AspectRatioStyle, AvatarStyle,
    // Additional Mantine Components
    BackgroundImageStyle, BadgeStyle, BlockquoteStyle, ChipStyle,
    CodeStyle, ColorInputStyle, ColorPickerStyle, ComboboxStyle,
    DividerStyle, PaperStyle, FieldsetStyle, FileInputStyle, HighlightStyle, IndicatorStyle,
    KbdStyle, ListStyle, ListItemStyle, NotificationStyle, NumberInputStyle,
    ProgressStyle, ProgressRootStyle, ProgressSectionStyle, RangeSliderStyle, RatingStyle, SegmentedControlStyle,
    SpoilerStyle,
    SwitchStyle, TextInputStyle, TextareaStyle, RichTextEditorStyle, ThemeIconStyle, TimelineStyle,
    TitleStyle, TextStyle, TypographyStyle,
    // Special Components
    UnknownStyle,
    FormStyle,
    ProfileStyle
} from './SelfHelpStyles';
import { TStyle } from '../../../../types/common/styles.types';

/**
 * Props interface for BasicStyle component
 * @property {TStyle} style - The style configuration object
 * @property {number} [parentActive] - Active index from parent Timeline
 * @property {number} [childIndex] - Index of this child in parent Timeline
 */
interface IBasicStyleProps {
    style: TStyle;
    parentActive?: number;
    childIndex?: number;
    parentColor?: string;
}

/**
 * BasicStyle is a component factory that renders different style components
 * based on the style_name property. It acts as a router for all style types.
 *
 * @param {IBasicStyleProps} props - Component props
 * @returns {JSX.Element | null} The appropriate styled component or null
 */
const BasicStyle: React.FC<IBasicStyleProps> = ({ style, parentActive, childIndex, parentColor }) => {
    if (!style || !style.style_name) {
        return null;
    }

    /**
     * Renders the appropriate style component based on style_name
     */
    switch (style.style_name as string) {
        // Authentication Styles
        case 'login':
            return <LoginStyle style={style as any} />;
        case 'register':
            return <RegisterStyle style={style as any} />;
        case 'validate':
            return <ValidateStyle style={style as any} />;
        case 'resetPassword':
            return <ResetPasswordStyle style={style as any} />;
        case 'twoFactorAuth':
            return <TwoFactorAuthStyle style={style as any} />;

        // Container & Layout Styles
        case 'container':
            return <ContainerStyle style={style as any} />;
        case 'card':
            return <CardStyle style={style as any} />;
        case 'card-segment':
            return <CardSegmentStyle style={style as any} />;
        case 'div':
            return <DivStyle style={style as any} />;
        case 'alert':
            return <AlertStyle style={style as any} />;
        case 'center':
            return <CenterStyle style={style as any} />;
        case 'flex':
            return <FlexStyle style={style as any} />;
        case 'group':
            return <GroupStyle style={style as any} />;
        case 'stack':
            return <StackStyle style={style as any} />;
        case 'simple-grid':
            return <SimpleGridStyle style={style as any} />;
        case 'scroll-area':
            return <ScrollAreaStyle style={style as any} />;
        case 'grid':
            return <GridStyle style={style as any} />;
        case 'grid-column':
            return <GridColumnStyle style={style as any} />;
        case 'space':
            return <SpaceStyle style={style as any} />;
        case 'background-image':
            return <BackgroundImageStyle style={style as any} />;
        case 'divider':
            return <DividerStyle style={style as any} />;
        case 'paper':
            return <PaperStyle style={style as any} />;

        // Text & Content Styles
        case 'heading':
            return <HeadingStyle style={style as any} />;
        case 'markdown':
            return <MarkdownStyle style={style as any} />;
        case 'plaintext':
            return <PlaintextStyle style={style as any} />;
        case 'html-tag':
            return <HtmlTagStyle style={style as any} />;

        // Media Styles
        case 'image':
            return <ImageStyle style={style as any} />;
        case 'carousel':
            return <CarouselStyle style={style as any} />;
        case 'video':
            return <VideoStyle style={style as any} />;
        case 'audio':
            return <AudioStyle style={style as any} />;
        case 'figure':
            return <FigureStyle style={style as any} />;

        // Navigation & Links Styles
        case 'button':
            return <ButtonStyle style={style as any} />;
        case 'link':
            return <LinkStyle style={style as any} />;
        case 'action-icon':
            return <ActionIconStyle style={style as any} />;

        // Form & Input Styles
        case 'form-log':
            return <FormStyle style={style as any} />;
        case 'form-record':
            return <FormStyle style={style as any} />;
        case 'textarea':
            return <TextareaStyle style={style as any} />;
        case 'input':
            return <InputStyle style={style as any} />;
        case 'select':
            return <SelectStyle style={style as any} />;
        case 'radio':
            return <RadioStyle style={style as any} />;
        case 'checkbox':
            return <CheckboxStyle style={style as any} />;
        case 'datepicker':
            return <DatePickerStyle style={style as any} />;
        case 'slider':
            return <SliderStyle style={style as any} />;
        case 'color-input':
            return <ColorInputStyle style={style as any} />;
        case 'color-picker':
            return <ColorPickerStyle style={style as any} />;
        case 'file-input':
            return <FileInputStyle style={style as any} />;
        case 'number-input':
            return <NumberInputStyle style={style as any} />;
        case 'range-slider':
            return <RangeSliderStyle style={style as any} />;
        case 'segmented-control':
            return <SegmentedControlStyle style={style as any} />;
        case 'switch':
            return <SwitchStyle style={style as any} />;
        case 'text-input':
            return <TextInputStyle style={style as any} />;
        case 'textarea':
            return <TextareaStyle style={style as any} />;
        case 'rich-text-editor':
            return <RichTextEditorStyle style={style as any} />;
        case 'combobox':
            return <ComboboxStyle style={style as any} />;

        // Tab Styles
        case 'tabs':
            return <TabsStyle style={style as any} />;
        case 'tab':
            return <TabStyle style={style as any} />;

        // Accordion Styles
        case 'accordion':
            return <AccordionStyle style={style as any} />;
        case 'accordion-Item':
            return <AccordionItemStyle style={style as any} />;

        case 'avatar':
            return <AvatarStyle style={style as any} />;
        case 'aspect-ratio':
            return <AspectRatioStyle style={style as any} />;
        case 'badge':
            return <BadgeStyle style={style as any} />;
        case 'chip':
            return <ChipStyle style={style as any} />;
        case 'timeline':
            return <TimelineStyle style={style as any} />;
        case 'list':
            return <ListStyle style={style as any} />;
        case 'list-item':
            return <ListItemStyle style={style as any} />;
        case 'indicator':
            return <IndicatorStyle style={style as any} />;
        case 'kbd':
            return <KbdStyle style={style as any} />;
        case 'theme-icon':
            return <ThemeIconStyle style={style as any} />;
        case 'rating':
            return <RatingStyle style={style as any} />;
        case 'profile':
            return <ProfileStyle style={style as any} />;
        case 'progress':
            return <ProgressStyle style={style as any} />;
        case 'progress-root':
            return <ProgressRootStyle style={style as any} />;
        case 'progress-section':
            return <ProgressSectionStyle style={style as any} />;
        case 'notification':
            return <NotificationStyle style={style as any} />;
        case 'title':
            return <TitleStyle style={style as any} />;
        case 'text':
            return <TextStyle style={style as any} />;
        case 'code':
            return <CodeStyle style={style as any} />;
        case 'highlight':
            return <HighlightStyle style={style as any} />;
        case 'blockquote':
            return <BlockquoteStyle style={style as any} />;
        case 'fieldset':
            return <FieldsetStyle style={style as any} />;
        case 'spoiler':
            return <SpoilerStyle style={style as any} />;
        case 'typography':
            return <TypographyStyle style={style as any} />;

        // Unknown/Unsupported styles
        default:
            return <UnknownStyle style={style as any} />;
    }
};

export default BasicStyle;