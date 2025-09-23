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
    BackgroundImageStyle, BadgeStyle, BlockquoteStyle, BoxStyle, ChipStyle,
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
import {
    ILoginStyle, IProfileStyle, IValidateStyle, IRegisterStyle, IResetPasswordStyle, ITwoFactorAuthStyle,
    IContainerStyle, ICenterStyle, IDividerStyle, IPaperStyle, IAlertStyle, IDivStyle,
    IRefContainerStyle, IDataContainerStyle, IHtmlTagStyle, IHeadingStyle, IMarkdownStyle,
    IPlaintextStyle, IFormStyle, IInputStyle, ITextInputStyle, ITextareaStyle, IRichTextEditorStyle,
    ISelectStyle, IRadioStyle, ISliderStyle, ICheckboxStyle, IDatePickerStyle,
    IImageStyle, IVideoStyle, IAudioStyle, IFigureStyle, ICarouselStyle, ILinkStyle,
    IEntryListStyle, IEntryRecordStyle, IEntryRecordDeleteStyle, ITabsStyle, ITabStyle,
    ITableStyle, ITableRowStyle, ITableCellStyle, IShowUserInputStyle, IVersionStyle,
    ILoopStyle, IFlexStyle, IGroupStyle, ISimpleGridStyle, IScrollAreaStyle, ISpaceStyle,
    IGridStyle, IGridColumnStyle, IStackStyle, IButtonStyle, IColorInputStyle,
    IColorPickerStyle, IFileInputStyle, INumberInputStyle, IRangeSliderStyle,
    ISegmentedControlStyle, ISwitchStyle, IComboboxStyle, IActionIconStyle,
    IBadgeStyle, IBoxStyle, IChipStyle, IAvatarStyle, ITimelineStyle, IIndicatorStyle,
    IKbdStyle, IRatingStyle, IProgressStyle, IProgressRootStyle, IProgressSectionStyle,
    IThemeIconStyle, IAccordionStyle, IAccordionItemStyle, INotificationStyle,
    ITitleStyle, ITextStyle, ICodeStyle, IHighlightStyle, IBlockquoteStyle,
    IAspectRatioStyle, ICardStyle, ICardSegmentStyle, IListStyle, IListItemStyle,
    IBackgroundImageStyle, IFieldsetStyle, ISpoilerStyle, ITypographyStyle,
    TStyle
} from '../../../../types/common/styles.types';

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
            return <LoginStyle style={style as ILoginStyle} />;
        case 'register':
            return <RegisterStyle style={style as IRegisterStyle} />;
        case 'validate':
            return <ValidateStyle style={style as IValidateStyle} />;
        case 'resetPassword':
            return <ResetPasswordStyle style={style as IResetPasswordStyle} />;
        case 'twoFactorAuth':
            return <TwoFactorAuthStyle style={style as ITwoFactorAuthStyle} />;

        // Container & Layout Styles
        case 'container':
            return <ContainerStyle style={style as IContainerStyle} />;
        case 'card':
            return <CardStyle style={style as ICardStyle} />;
        case 'card-segment':
            return <CardSegmentStyle style={style as ICardSegmentStyle} />;
        case 'div':
            return <DivStyle style={style as IDivStyle} />;
        case 'alert':
            return <AlertStyle style={style as IAlertStyle} />;
        case 'center':
            return <CenterStyle style={style as ICenterStyle} />;
        case 'flex':
            return <FlexStyle style={style as IFlexStyle} />;
        case 'group':
            return <GroupStyle style={style as IGroupStyle} />;
        case 'stack':
            return <StackStyle style={style as IStackStyle} />;
        case 'simple-grid':
            return <SimpleGridStyle style={style as ISimpleGridStyle} />;
        case 'scroll-area':
            return <ScrollAreaStyle style={style as IScrollAreaStyle} />;
        case 'grid':
            return <GridStyle style={style as IGridStyle} />;
        case 'grid-column':
            return <GridColumnStyle style={style as IGridColumnStyle} />;
        case 'space':
            return <SpaceStyle style={style as ISpaceStyle} />;
        case 'background-image':
            return <BackgroundImageStyle style={style as IBackgroundImageStyle} />;
        case 'divider':
            return <DividerStyle style={style as IDividerStyle} />;
        case 'paper':
            return <PaperStyle style={style as IPaperStyle} />;

        // Text & Content Styles
        case 'heading':
            return <HeadingStyle style={style as IHeadingStyle} />;
        case 'markdown':
            return <MarkdownStyle style={style as IMarkdownStyle} />;
        case 'plaintext':
            return <PlaintextStyle style={style as IPlaintextStyle} />;
        case 'html-tag':
            return <HtmlTagStyle style={style as IHtmlTagStyle} />;

        // Media Styles
        case 'image':
            return <ImageStyle style={style as IImageStyle} />;
        case 'carousel':
            return <CarouselStyle style={style as ICarouselStyle} />;
        case 'video':
            return <VideoStyle style={style as IVideoStyle} />;
        case 'audio':
            return <AudioStyle style={style as IAudioStyle} />;
        case 'figure':
            return <FigureStyle style={style as IFigureStyle} />;

        // Navigation & Links Styles
        case 'button':
            return <ButtonStyle style={style as IButtonStyle} />;
        case 'link':
            return <LinkStyle style={style as ILinkStyle} />;
        case 'action-icon':
            return <ActionIconStyle style={style as IActionIconStyle} />;

        // Form & Input Styles
        case 'form-log':
            return <FormStyle style={style as unknown as IFormStyle} />;
        case 'form-record':
            return <FormStyle style={style as unknown as IFormStyle} />;
        case 'textarea':
            return <TextareaStyle style={style as ITextareaStyle} />;
        case 'input':
            return <InputStyle style={style as IInputStyle} />;
        case 'select':
            return <SelectStyle style={style as ISelectStyle} />;
        case 'radio':
            return <RadioStyle style={style as IRadioStyle} />;
        case 'checkbox':
            return <CheckboxStyle style={style as ICheckboxStyle} />;
        case 'datepicker':
            return <DatePickerStyle style={style as IDatePickerStyle} />;
        case 'slider':
            return <SliderStyle style={style as ISliderStyle} />;
        case 'color-input':
            return <ColorInputStyle style={style as IColorInputStyle} />;
        case 'color-picker':
            return <ColorPickerStyle style={style as IColorPickerStyle} />;
        case 'file-input':
            return <FileInputStyle style={style as IFileInputStyle} />;
        case 'number-input':
            return <NumberInputStyle style={style as INumberInputStyle} />;
        case 'range-slider':
            return <RangeSliderStyle style={style as IRangeSliderStyle} />;
        case 'segmented-control':
            return <SegmentedControlStyle style={style as ISegmentedControlStyle} />;
        case 'switch':
            return <SwitchStyle style={style as ISwitchStyle} />;
        case 'text-input':
            return <TextInputStyle style={style as ITextInputStyle} />;
        case 'textarea':
            return <TextareaStyle style={style as ITextareaStyle} />;
        case 'rich-text-editor':
            return <RichTextEditorStyle style={style as IRichTextEditorStyle} />;
        case 'combobox':
            return <ComboboxStyle style={style as IComboboxStyle} />;

        // Tab Styles
        case 'tabs':
            return <TabsStyle style={style as ITabsStyle} />;
        case 'tab':
            return <TabStyle style={style as ITabStyle} />;

        // Accordion Styles
        case 'accordion':
            return <AccordionStyle style={style as IAccordionStyle} />;
        case 'accordion-Item':
            return <AccordionItemStyle style={style as IAccordionItemStyle} />;

        case 'avatar':
            return <AvatarStyle style={style as IAvatarStyle} />;
        case 'aspect-ratio':
            return <AspectRatioStyle style={style as IAspectRatioStyle} />;
        case 'badge':
            return <BadgeStyle style={style as IBadgeStyle} />;
        case 'box':
            return <BoxStyle style={style as unknown as IBoxStyle} />;
        case 'chip':
            return <ChipStyle style={style as IChipStyle} />;
        case 'timeline':
            return <TimelineStyle style={style as ITimelineStyle} />;
        case 'list':
            return <ListStyle style={style as IListStyle} />;
        case 'list-item':
            return <ListItemStyle style={style as IListItemStyle} />;
        case 'indicator':
            return <IndicatorStyle style={style as IIndicatorStyle} />;
        case 'kbd':
            return <KbdStyle style={style as IKbdStyle} />;
        case 'theme-icon':
            return <ThemeIconStyle style={style as IThemeIconStyle} />;
        case 'rating':
            return <RatingStyle style={style as IRatingStyle} />;
        case 'profile':
            return <ProfileStyle style={style as IProfileStyle} />;
        case 'progress':
            return <ProgressStyle style={style as IProgressStyle} />;
        case 'progress-root':
            return <ProgressRootStyle style={style as IProgressRootStyle} />;
        case 'progress-section':
            return <ProgressSectionStyle style={style as IProgressSectionStyle} />;
        case 'notification':
            return <NotificationStyle style={style as INotificationStyle} />;
        case 'title':
            return <TitleStyle style={style as ITitleStyle} />;
        case 'text':
            return <TextStyle style={style as ITextStyle} />;
        case 'code':
            return <CodeStyle style={style as ICodeStyle} />;
        case 'highlight':
            return <HighlightStyle style={style as IHighlightStyle} />;
        case 'blockquote':
            return <BlockquoteStyle style={style as IBlockquoteStyle} />;
        case 'fieldset':
            return <FieldsetStyle style={style as IFieldsetStyle} />;
        case 'spoiler':
            return <SpoilerStyle style={style as ISpoilerStyle} />;
        case 'typography':
            return <TypographyStyle style={style as ITypographyStyle} />;

        // Unknown/Unsupported styles
        default:
            return <UnknownStyle style={style as any} />;
    }
};

export default BasicStyle;