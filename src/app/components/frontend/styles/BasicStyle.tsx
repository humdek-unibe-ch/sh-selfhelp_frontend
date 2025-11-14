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
import DebugWrapper from './shared/debug-wrapper/DebugWrapper';
import {
    ILoginStyle, IProfileStyle, IValidateStyle, IRegisterStyle, IResetPasswordStyle, ITwoFactorAuthStyle,
    IContainerStyle, ICenterStyle, IDividerStyle, IPaperStyle, IAlertStyle, IHtmlTagStyle,
    IFormStyle, IInputStyle, ITextInputStyle, ITextareaStyle, IRichTextEditorStyle,
    ISelectStyle, IRadioStyle, ISliderStyle, ICheckboxStyle, IDatePickerStyle,
    IImageStyle, IVideoStyle, IAudioStyle, IFigureStyle, ICarouselStyle, ILinkStyle, ITabsStyle, ITabStyle, IFlexStyle, IGroupStyle, ISimpleGridStyle, IScrollAreaStyle, ISpaceStyle,
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
     * Helper function to wrap components with debug wrapper when debug is enabled
     */
    const wrapWithDebug = (component: React.ReactElement) => {
        return <DebugWrapper style={style}>{component}</DebugWrapper>;
    };

    /**
     * Renders the appropriate style component based on style_name
     */
    switch (style.style_name as string) {
        // Authentication Styles
        case 'login':
            return wrapWithDebug(<LoginStyle style={style as ILoginStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'register':
            return wrapWithDebug(<RegisterStyle style={style as IRegisterStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'validate':
            return wrapWithDebug(<ValidateStyle style={style as IValidateStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'resetPassword':
            return wrapWithDebug(<ResetPasswordStyle style={style as IResetPasswordStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'twoFactorAuth':
            return wrapWithDebug(<TwoFactorAuthStyle style={style as ITwoFactorAuthStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);

        // Container & Layout Styles
        case 'container':
            return wrapWithDebug(<ContainerStyle style={style as IContainerStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'card':
            return wrapWithDebug(<CardStyle style={style as ICardStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'card-segment':
            return wrapWithDebug(<CardSegmentStyle style={style as ICardSegmentStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'alert':
            return wrapWithDebug(<AlertStyle style={style as IAlertStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'center':
            return wrapWithDebug(<CenterStyle style={style as ICenterStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'flex':
            return wrapWithDebug(<FlexStyle style={style as IFlexStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'group':
            return wrapWithDebug(<GroupStyle style={style as IGroupStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'stack':
            return wrapWithDebug(<StackStyle style={style as IStackStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'simple-grid':
            return wrapWithDebug(<SimpleGridStyle style={style as ISimpleGridStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'scroll-area':
            return wrapWithDebug(<ScrollAreaStyle style={style as IScrollAreaStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'grid':
            return wrapWithDebug(<GridStyle style={style as IGridStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'grid-column':
            return wrapWithDebug(<GridColumnStyle style={style as IGridColumnStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'space':
            return wrapWithDebug(<SpaceStyle style={style as ISpaceStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'background-image':
            return wrapWithDebug(<BackgroundImageStyle style={style as IBackgroundImageStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'divider':
            return wrapWithDebug(<DividerStyle style={style as IDividerStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'paper':
            return wrapWithDebug(<PaperStyle style={style as IPaperStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);

        case 'html-tag':
            return wrapWithDebug(<HtmlTagStyle style={style as IHtmlTagStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);

        // Media Styles
        case 'image':
            return wrapWithDebug(<ImageStyle style={style as IImageStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'carousel':
            return wrapWithDebug(<CarouselStyle style={style as ICarouselStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'video':
            return wrapWithDebug(<VideoStyle style={style as IVideoStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'audio':
            return wrapWithDebug(<AudioStyle style={style as IAudioStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'figure':
            return wrapWithDebug(<FigureStyle style={style as IFigureStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);

        // Navigation & Links Styles
        case 'button':
            return wrapWithDebug(<ButtonStyle style={style as IButtonStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'link':
            return wrapWithDebug(<LinkStyle style={style as ILinkStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'action-icon':
            return wrapWithDebug(<ActionIconStyle style={style as IActionIconStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);

        // Form & Input Styles
        case 'form-log':
            return wrapWithDebug(<FormStyle style={style as unknown as IFormStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'form-record':
            return wrapWithDebug(<FormStyle style={style as unknown as IFormStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'textarea':
            return wrapWithDebug(<TextareaStyle style={style as ITextareaStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'input':
            return wrapWithDebug(<InputStyle style={style as IInputStyle} cssClass={getCssClass(style)} />);
        case 'select':
            return wrapWithDebug(<SelectStyle style={style as ISelectStyle} cssClass={getCssClass(style)} />);
        case 'radio':
            return wrapWithDebug(<RadioStyle style={style as IRadioStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'checkbox':
            return wrapWithDebug(<CheckboxStyle style={style as ICheckboxStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'datepicker':
            return wrapWithDebug(<DatePickerStyle style={style as IDatePickerStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'slider':
            return wrapWithDebug(<SliderStyle style={style as ISliderStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'color-input':
            return wrapWithDebug(<ColorInputStyle style={style as IColorInputStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'color-picker':
            return wrapWithDebug(<ColorPickerStyle style={style as IColorPickerStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'file-input':
            return wrapWithDebug(<FileInputStyle style={style as IFileInputStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'number-input':
            return wrapWithDebug(<NumberInputStyle style={style as INumberInputStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'range-slider':
            return wrapWithDebug(<RangeSliderStyle style={style as IRangeSliderStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'segmented-control':
            return wrapWithDebug(<SegmentedControlStyle style={style as ISegmentedControlStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'switch':
            return wrapWithDebug(<SwitchStyle style={style as ISwitchStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'text-input':
            return wrapWithDebug(<TextInputStyle style={style as ITextInputStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'textarea':
            return wrapWithDebug(<TextareaStyle style={style as ITextareaStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'rich-text-editor':
            return wrapWithDebug(<RichTextEditorStyle style={style as IRichTextEditorStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'combobox':
            return wrapWithDebug(<ComboboxStyle style={style as IComboboxStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);

        // Tab Styles
        case 'tabs':
            return wrapWithDebug(<TabsStyle style={style as ITabsStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'tab':
            return wrapWithDebug(<TabStyle style={style as ITabStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);

        // Accordion Styles
        case 'accordion':
            return wrapWithDebug(<AccordionStyle style={style as IAccordionStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'accordion-Item':
            return wrapWithDebug(<AccordionItemStyle style={style as IAccordionItemStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);

        case 'avatar':
            return wrapWithDebug(<AvatarStyle style={style as IAvatarStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'aspect-ratio':
            return wrapWithDebug(<AspectRatioStyle style={style as IAspectRatioStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'badge':
            return wrapWithDebug(<BadgeStyle style={style as IBadgeStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'box':
            return wrapWithDebug(<BoxStyle style={style as unknown as IBoxStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'chip':
            return wrapWithDebug(<ChipStyle style={style as IChipStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'timeline':
            return wrapWithDebug(<TimelineStyle style={style as ITimelineStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'list':
            return wrapWithDebug(<ListStyle style={style as IListStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'list-item':
            return wrapWithDebug(<ListItemStyle style={style as IListItemStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'indicator':
            return wrapWithDebug(<IndicatorStyle style={style as IIndicatorStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'kbd':
            return wrapWithDebug(<KbdStyle style={style as IKbdStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'theme-icon':
            return wrapWithDebug(<ThemeIconStyle style={style as IThemeIconStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'rating':
            return wrapWithDebug(<RatingStyle style={style as IRatingStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'profile':
            return wrapWithDebug(<ProfileStyle style={style as IProfileStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'progress':
            return wrapWithDebug(<ProgressStyle style={style as IProgressStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'progress-root':
            return wrapWithDebug(<ProgressRootStyle style={style as IProgressRootStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'progress-section':
            return wrapWithDebug(<ProgressSectionStyle style={style as IProgressSectionStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'notification':
            return wrapWithDebug(<NotificationStyle style={style as INotificationStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'title':
            return wrapWithDebug(<TitleStyle style={style as ITitleStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'text':
            return wrapWithDebug(<TextStyle style={style as ITextStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'code':
            return wrapWithDebug(<CodeStyle style={style as ICodeStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'highlight':
            return wrapWithDebug(<HighlightStyle style={style as IHighlightStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'blockquote':
            return wrapWithDebug(<BlockquoteStyle style={style as IBlockquoteStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'fieldset':
            return wrapWithDebug(<FieldsetStyle style={style as IFieldsetStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'spoiler':
            return wrapWithDebug(<SpoilerStyle style={style as ISpoilerStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);
        case 'typography':
            return wrapWithDebug(<TypographyStyle style={style as ITypographyStyle} styleProps={getSpacingProps(style)} cssClass={getCssClass(style)} />);

        // Unknown/Unsupported styles
        default:
            return wrapWithDebug(<UnknownStyle style={style as any} />);
    }
};

export default BasicStyle;