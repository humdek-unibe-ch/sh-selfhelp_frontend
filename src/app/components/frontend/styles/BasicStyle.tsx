import React from 'react';
import {
    AlertStyle, ButtonStyle, CarouselStyle, CardStyle, CardSegmentStyle, ContainerStyle,
    ImageStyle, InputStyle,
    LinkStyle, LoginStyle, RegisterStyle,
    SelectStyle, TabsStyle, TabStyle, VideoStyle,
    AudioStyle, FigureStyle, RadioStyle,
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
    IContainerStyle, ICenterStyle, IDividerStyle, IPaperStyle, IAlertStyle,
    IRefContainerStyle, IDataContainerStyle, IHtmlTagStyle,
    IFormStyle, IInputStyle, ITextInputStyle, ITextareaStyle, IRichTextEditorStyle,
    ISelectStyle, IRadioStyle, ISliderStyle, ICheckboxStyle, IDatePickerStyle,
    IImageStyle, IVideoStyle, IAudioStyle, IFigureStyle, ICarouselStyle, ILinkStyle,
    IEntryListStyle, IEntryRecordStyle, IEntryRecordDeleteStyle, ITabsStyle, ITabStyle, IVersionStyle,
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
    TStyle,
    IStyleWithSpacing
} from '../../../../types/common/styles.types';

/**
 * Convert spacing field value to Mantine spacing prop value
 * Maps 'none' to undefined, and other values pass through
 */
const convertSpacingValue = (value: string | undefined): string | undefined => {
    if (!value || value === 'none') {
        return undefined;
    }
    return value;
};

/**
 * Extract CSS class from a style object
 */
export const getCssClass = (style: TStyle): string => {
    return "section-" + style.id + " " + (style.css ?? '');
};

/**
 * Extract spacing props from a style object
 * Priority: mantine_spacing_margin_padding field (new) > individual spacing fields (legacy)
 */
export const getSpacingProps = (style: IStyleWithSpacing) => {
    const spacingProps: Record<string, any> = {};

    // Check for new mantine_spacing_margin_padding field first
    if (style.mantine_spacing_margin_padding || style.mantine_spacing_margin) {
        const spacingJson = style.mantine_spacing_margin_padding?.content ?? style.mantine_spacing_margin?.content;
        if (typeof spacingJson === 'string' && spacingJson !== '') {
            const parsedSpacing = JSON.parse(spacingJson);

            // Extract and convert each spacing value
            const mt = convertSpacingValue(parsedSpacing.mt);
            const mb = convertSpacingValue(parsedSpacing.mb);
            const ms = convertSpacingValue(parsedSpacing.ms);
            const me = convertSpacingValue(parsedSpacing.me);
            const pt = convertSpacingValue(parsedSpacing.pt);
            const pb = convertSpacingValue(parsedSpacing.pb);
            const ps = convertSpacingValue(parsedSpacing.ps);
            const pe = convertSpacingValue(parsedSpacing.pe);

            // Add to spacing props if they exist
            if (mt) spacingProps.mt = mt;
            if (mb) spacingProps.mb = mb;
            if (ms) spacingProps.ms = ms;
            if (me) spacingProps.me = me;
            if (pt) spacingProps.pt = pt;
            if (pb) spacingProps.pb = pb;
            if (ps) spacingProps.ps = ps;
            if (pe) spacingProps.pe = pe;
        }
    }

    return spacingProps;
};


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
            return <LoginStyle style={style as ILoginStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'register':
            return <RegisterStyle style={style as IRegisterStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'validate':
            return <ValidateStyle style={style as IValidateStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'resetPassword':
            return <ResetPasswordStyle style={style as IResetPasswordStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'twoFactorAuth':
            return <TwoFactorAuthStyle style={style as ITwoFactorAuthStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;

        // Container & Layout Styles
        case 'container':
            return <ContainerStyle style={style as IContainerStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'card':
            return <CardStyle style={style as ICardStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'card-segment':
            return <CardSegmentStyle style={style as ICardSegmentStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'alert':
            return <AlertStyle style={style as IAlertStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'center':
            return <CenterStyle style={style as ICenterStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'flex':
            return <FlexStyle style={style as IFlexStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'group':
            return <GroupStyle style={style as IGroupStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'stack':
            return <StackStyle style={style as IStackStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'simple-grid':
            return <SimpleGridStyle style={style as ISimpleGridStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'scroll-area':
            return <ScrollAreaStyle style={style as IScrollAreaStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'grid':
            return <GridStyle style={style as IGridStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'grid-column':
            return <GridColumnStyle style={style as IGridColumnStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'space':
            return <SpaceStyle style={style as ISpaceStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'background-image':
            return <BackgroundImageStyle style={style as IBackgroundImageStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'divider':
            return <DividerStyle style={style as IDividerStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'paper':
            return <PaperStyle style={style as IPaperStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;

        case 'html-tag':
            return <HtmlTagStyle style={style as IHtmlTagStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;

        // Media Styles
        case 'image':
            return <ImageStyle style={style as IImageStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'carousel':
            return <CarouselStyle style={style as ICarouselStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'video':
            return <VideoStyle style={style as IVideoStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'audio':
            return <AudioStyle style={style as IAudioStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'figure':
            return <FigureStyle style={style as IFigureStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;

        // Navigation & Links Styles
        case 'button':
            return <ButtonStyle style={style as IButtonStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'link':
            return <LinkStyle style={style as ILinkStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'action-icon':
            return <ActionIconStyle style={style as IActionIconStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;

        // Form & Input Styles
        case 'form-log':
            return <FormStyle style={style as unknown as IFormStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'form-record':
            return <FormStyle style={style as unknown as IFormStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'textarea':
            return <TextareaStyle style={style as ITextareaStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'input':
            return <InputStyle style={style as IInputStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'select':
            return <SelectStyle style={style as ISelectStyle} cssClass={getCssClass(style)} />;
        case 'radio':
            return <RadioStyle style={style as IRadioStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'checkbox':
            return <CheckboxStyle style={style as ICheckboxStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'datepicker':
            return <DatePickerStyle style={style as IDatePickerStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'slider':
            return <SliderStyle style={style as ISliderStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'color-input':
            return <ColorInputStyle style={style as IColorInputStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'color-picker':
            return <ColorPickerStyle style={style as IColorPickerStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'file-input':
            return <FileInputStyle style={style as IFileInputStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'number-input':
            return <NumberInputStyle style={style as INumberInputStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'range-slider':
            return <RangeSliderStyle style={style as IRangeSliderStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'segmented-control':
            return <SegmentedControlStyle style={style as ISegmentedControlStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'switch':
            return <SwitchStyle style={style as ISwitchStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'text-input':
            return <TextInputStyle style={style as ITextInputStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'textarea':
            return <TextareaStyle style={style as ITextareaStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'rich-text-editor':
            return <RichTextEditorStyle style={style as IRichTextEditorStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'combobox':
            return <ComboboxStyle style={style as IComboboxStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;

        // Tab Styles
        case 'tabs':
            return <TabsStyle style={style as ITabsStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'tab':
            return <TabStyle style={style as ITabStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;

        // Accordion Styles
        case 'accordion':
            return <AccordionStyle style={style as IAccordionStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'accordion-Item':
            return <AccordionItemStyle style={style as IAccordionItemStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;

        case 'avatar':
            return <AvatarStyle style={style as IAvatarStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'aspect-ratio':
            return <AspectRatioStyle style={style as IAspectRatioStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'badge':
            return <BadgeStyle style={style as IBadgeStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'box':
            return <BoxStyle style={style as unknown as IBoxStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'chip':
            return <ChipStyle style={style as IChipStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'timeline':
            return <TimelineStyle style={style as ITimelineStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'list':
            return <ListStyle style={style as IListStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'list-item':
            return <ListItemStyle style={style as IListItemStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'indicator':
            return <IndicatorStyle style={style as IIndicatorStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'kbd':
            return <KbdStyle style={style as IKbdStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'theme-icon':
            return <ThemeIconStyle style={style as IThemeIconStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'rating':
            return <RatingStyle style={style as IRatingStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'profile':
            return <ProfileStyle style={style as IProfileStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'progress':
            return <ProgressStyle style={style as IProgressStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'progress-root':
            return <ProgressRootStyle style={style as IProgressRootStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'progress-section':
            return <ProgressSectionStyle style={style as IProgressSectionStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'notification':
            return <NotificationStyle style={style as INotificationStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'title':
            return <TitleStyle style={style as ITitleStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'text':
            return <TextStyle style={style as ITextStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'code':
            return <CodeStyle style={style as ICodeStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'highlight':
            return <HighlightStyle style={style as IHighlightStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'blockquote':
            return <BlockquoteStyle style={style as IBlockquoteStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'fieldset':
            return <FieldsetStyle style={style as IFieldsetStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'spoiler':
            return <SpoilerStyle style={style as ISpoilerStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;
        case 'typography':
            return <TypographyStyle style={style as ITypographyStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />;

        // Unknown/Unsupported styles
        default:
            return <UnknownStyle style={style as any} />;
    }
};

export default BasicStyle;