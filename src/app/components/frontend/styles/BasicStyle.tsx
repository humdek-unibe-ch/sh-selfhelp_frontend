/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
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
    BackgroundImageStyle, BadgeStyle, BlockquoteStyle, BoxStyle, ChipStyle,
    CodeStyle, ColorInputStyle, ColorPickerStyle, ComboboxStyle,
    DividerStyle, PaperStyle, FieldsetStyle, FileInputStyle, HighlightStyle, IndicatorStyle,
    KbdStyle, ListStyle, ListItemStyle, NotificationStyle, NumberInputStyle,
    ProgressStyle, ProgressRootStyle, ProgressSectionStyle, RangeSliderStyle, RatingStyle, SegmentedControlStyle,
    SpoilerStyle,
    SwitchStyle, TextInputStyle, TextareaStyle, RichTextEditorStyle, ThemeIconStyle, TimelineStyle,
    TitleStyle, TextStyle, TypographyStyle,
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
import { usePluginRuntime, usePluginStyleComponent } from '../plugin-runtime';

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
 * Tokens that already encode a viewport gate, dark mode, or pseudo-state.
 * If a `css_mobile` token starts with one of these, we leave it alone instead
 * of prepending `max-md:` (which would create unreachable selectors like
 * `max-md:md:hidden`).
 */
const RESPONSIVE_PREFIX_RE = /^(max-(?:sm|md|lg|xl|2xl):|sm:|md:|lg:|xl:|2xl:)/;

/**
 * Auto-prefix every Tailwind utility in `cssMobile` with `max-md:` so the
 * tokens only apply below the `md` breakpoint (typically <768px = mobile).
 *
 * - Empty / whitespace-only input returns `''`.
 * - Tokens that already carry a viewport prefix (`md:`, `max-md:`, `lg:`, …)
 *   are kept verbatim — the editor opted out of auto-mobile-scoping.
 * - Other Tailwind variants on the token (`dark:`, `hover:`, …) are preserved
 *   because Tailwind allows stacking variants
 *   (`max-md:dark:bg-gray-900` is valid).
 *
 * This keeps `css_mobile` portable: a future React Native / react-expo
 * renderer can read the raw field directly and do its own mapping; the web
 * renderer is the only place this transformation runs.
 */
const transformMobileCss = (cssMobile: string | null | undefined): string => {
    if (!cssMobile) return '';
    const tokens = cssMobile.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return '';
    return tokens
        .map(token => (RESPONSIVE_PREFIX_RE.test(token) ? token : `max-md:${token}`))
        .join(' ');
};

/**
 * Extract CSS class from a style object.
 *
 * Composition order:
 *   `section-{id}` → `style.css` → mobile-prefixed `style.css_mobile`
 *
 * The mobile classes win on viewports below the `md` breakpoint thanks to
 * Tailwind's `max-md:` modifier.
 */
export const getCssClass = (style: TStyle): string => {
    const base = `section-${style.id} ${style.css ?? ''}`;
    const mobile = transformMobileCss((style as TStyle & { css_mobile?: string | null }).css_mobile);
    return mobile ? `${base} ${mobile}`.replace(/\s+/g, ' ').trim() : base.replace(/\s+/g, ' ').trim();
};

/**
 * Extract spacing props from a style object.
 *
 * The spacing field value is expected to be a JSON object, e.g.
 *   {"mt":"md","mb":"md","pt":"lg","pb":"lg","ms":"sm","me":"sm","ps":"xs","pe":"xs"}
 * Anything that fails to parse or isn't a JSON object is ignored so the page
 * keeps rendering; in development we surface the bad value via `console.warn`
 * so the editor can fix it. The invalid value stays in the DB until an
 * editor saves a new value.
 */
export const getSpacingProps = (style: IStyleWithSpacing) => {
    const spacingProps: Record<string, string> = {};
    const warnInvalid = (reason: string, value: unknown): void => {
        if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.warn(
                `[getSpacingProps] section ${style.id} (${style.style_name}): ${reason}`,
                value
            );
        }
    };

    const spacingField = style.mantine_spacing_margin_padding ?? style.mantine_spacing_margin;

    if (!spacingField) {
        return spacingProps;
    }

    const spacingJson = spacingField.content;
    if (typeof spacingJson !== 'string' || spacingJson.trim() === '') {
        return spacingProps;
    }

    const trimmed = spacingJson.trim();
    if (trimmed[0] !== '{' && trimmed[0] !== '[') {
        warnInvalid('spacing value is not a JSON object', trimmed);
        return spacingProps;
    }

    let parsedSpacing: Record<string, string | undefined>;
    try {
        parsedSpacing = JSON.parse(trimmed);
    } catch (error) {
        warnInvalid('spacing JSON parse failed', { trimmed, error });
        return spacingProps;
    }
    if (!parsedSpacing || typeof parsedSpacing !== 'object') {
        warnInvalid('spacing JSON did not produce an object', parsedSpacing);
        return spacingProps;
    }

    const mt = convertSpacingValue(parsedSpacing.mt);
    const mb = convertSpacingValue(parsedSpacing.mb);
    const ms = convertSpacingValue(parsedSpacing.ms);
    const me = convertSpacingValue(parsedSpacing.me);
    const pt = convertSpacingValue(parsedSpacing.pt);
    const pb = convertSpacingValue(parsedSpacing.pb);
    const ps = convertSpacingValue(parsedSpacing.ps);
    const pe = convertSpacingValue(parsedSpacing.pe);

    if (mt) spacingProps.mt = mt;
    if (mb) spacingProps.mb = mb;
    if (ms) spacingProps.ms = ms;
    if (me) spacingProps.me = me;
    if (pt) spacingProps.pt = pt;
    if (pb) spacingProps.pb = pb;
    if (ps) spacingProps.ps = ps;
    if (pe) spacingProps.pe = pe;

    return spacingProps;
};

/**
 * Renderer signature shared by every entry in `styleImpls`.
 *
 * Receiving these explicit props (instead of cloning the parent's
 * `<BasicStyle>` props) gives each renderer a typed surface and keeps
 * the dispatcher hot path branch-free.
 */
interface IStyleRendererProps {
    style: TStyle;
    styleProps: Record<string, string>;
    cssClass: string;
    parentActive?: number;
    childIndex?: number;
    parentColor?: string;
}

type TStyleRenderer = (props: IStyleRendererProps) => React.ReactElement;

/**
 * Core style implementation map. Keyed by `style_name`; every plugin
 * style merges into the same shape via `PluginRuntime.snapshot.styleComponents`.
 *
 * Adding a new core style:
 *   1. Add the renderer below.
 *   2. Add the entry to `BASE_STYLE_REGISTRY` in `@selfhelp/shared`.
 *   3. Add the matching mobile renderer in `sh-selfhelp_mobile`.
 */
const styleImpls: Record<string, TStyleRenderer> = {
    // ===== auth =====
    login: ({ style, styleProps, cssClass }) =>
        <LoginStyle style={style as ILoginStyle} styleProps={styleProps} cssClass={cssClass} />,
    register: ({ style, styleProps, cssClass }) =>
        <RegisterStyle style={style as IRegisterStyle} styleProps={styleProps} cssClass={cssClass} />,
    validate: ({ style, styleProps, cssClass }) =>
        <ValidateStyle style={style as IValidateStyle} styleProps={styleProps} cssClass={cssClass} />,
    resetPassword: ({ style, styleProps, cssClass }) =>
        <ResetPasswordStyle style={style as IResetPasswordStyle} styleProps={styleProps} cssClass={cssClass} />,
    twoFactorAuth: ({ style, styleProps, cssClass }) =>
        <TwoFactorAuthStyle style={style as ITwoFactorAuthStyle} styleProps={styleProps} cssClass={cssClass} />,
    profile: ({ style, styleProps, cssClass }) =>
        <ProfileStyle style={style as IProfileStyle} styleProps={styleProps} cssClass={cssClass} />,

    // ===== layout =====
    container: ({ style, styleProps, cssClass }) =>
        <ContainerStyle style={style as IContainerStyle} styleProps={styleProps} cssClass={cssClass} />,
    card: ({ style, styleProps, cssClass }) =>
        <CardStyle style={style as ICardStyle} styleProps={styleProps} cssClass={cssClass} />,
    'card-segment': ({ style, styleProps, cssClass }) =>
        <CardSegmentStyle style={style as ICardSegmentStyle} styleProps={styleProps} cssClass={cssClass} />,
    alert: ({ style, styleProps, cssClass }) =>
        <AlertStyle style={style as IAlertStyle} styleProps={styleProps} cssClass={cssClass} />,
    center: ({ style, styleProps, cssClass }) =>
        <CenterStyle style={style as ICenterStyle} styleProps={styleProps} cssClass={cssClass} />,
    flex: ({ style, styleProps, cssClass }) =>
        <FlexStyle style={style as IFlexStyle} styleProps={styleProps} cssClass={cssClass} />,
    group: ({ style, styleProps, cssClass }) =>
        <GroupStyle style={style as IGroupStyle} styleProps={styleProps} cssClass={cssClass} />,
    stack: ({ style, styleProps, cssClass }) =>
        <StackStyle style={style as IStackStyle} styleProps={styleProps} cssClass={cssClass} />,
    'simple-grid': ({ style, styleProps, cssClass }) =>
        <SimpleGridStyle style={style as ISimpleGridStyle} styleProps={styleProps} cssClass={cssClass} />,
    'scroll-area': ({ style, styleProps, cssClass }) =>
        <ScrollAreaStyle style={style as IScrollAreaStyle} styleProps={styleProps} cssClass={cssClass} />,
    grid: ({ style, styleProps, cssClass }) =>
        <GridStyle style={style as IGridStyle} styleProps={styleProps} cssClass={cssClass} />,
    'grid-column': ({ style, styleProps, cssClass }) =>
        <GridColumnStyle style={style as IGridColumnStyle} styleProps={styleProps} cssClass={cssClass} />,
    space: ({ style, styleProps, cssClass }) =>
        <SpaceStyle style={style as ISpaceStyle} styleProps={styleProps} cssClass={cssClass} />,
    'background-image': ({ style, styleProps, cssClass }) =>
        <BackgroundImageStyle style={style as IBackgroundImageStyle} styleProps={styleProps} cssClass={cssClass} />,
    divider: ({ style, styleProps, cssClass }) =>
        <DividerStyle style={style as IDividerStyle} styleProps={styleProps} cssClass={cssClass} />,
    paper: ({ style, styleProps, cssClass }) =>
        <PaperStyle style={style as IPaperStyle} styleProps={styleProps} cssClass={cssClass} />,
    'html-tag': ({ style, styleProps, cssClass }) =>
        <HtmlTagStyle style={style as IHtmlTagStyle} styleProps={styleProps} cssClass={cssClass} />,

    // ===== media =====
    image: ({ style, styleProps, cssClass }) =>
        <ImageStyle style={style as IImageStyle} styleProps={styleProps} cssClass={cssClass} />,
    carousel: ({ style, styleProps, cssClass }) =>
        <CarouselStyle style={style as ICarouselStyle} styleProps={styleProps} cssClass={cssClass} />,
    video: ({ style, styleProps, cssClass }) =>
        <VideoStyle style={style as IVideoStyle} styleProps={styleProps} cssClass={cssClass} />,
    audio: ({ style, styleProps, cssClass }) =>
        <AudioStyle style={style as IAudioStyle} styleProps={styleProps} cssClass={cssClass} />,
    figure: ({ style, styleProps, cssClass }) =>
        <FigureStyle style={style as IFigureStyle} styleProps={styleProps} cssClass={cssClass} />,

    // ===== navigation & links =====
    button: ({ style, styleProps, cssClass }) =>
        <ButtonStyle style={style as IButtonStyle} styleProps={styleProps} cssClass={cssClass} />,
    link: ({ style, styleProps, cssClass }) =>
        <LinkStyle style={style as ILinkStyle} styleProps={styleProps} cssClass={cssClass} />,
    'action-icon': ({ style, styleProps, cssClass }) =>
        <ActionIconStyle style={style as IActionIconStyle} styleProps={styleProps} cssClass={cssClass} />,

    // ===== form & input =====
    'form-log': ({ style, styleProps, cssClass }) =>
        <FormStyle style={style as unknown as IFormStyle} styleProps={styleProps} cssClass={cssClass} />,
    'form-record': ({ style, styleProps, cssClass }) =>
        <FormStyle style={style as unknown as IFormStyle} styleProps={styleProps} cssClass={cssClass} />,
    textarea: ({ style, styleProps, cssClass }) =>
        <TextareaStyle style={style as ITextareaStyle} styleProps={styleProps} cssClass={cssClass} />,
    input: ({ style, cssClass }) =>
        <InputStyle style={style as IInputStyle} cssClass={cssClass} />,
    select: ({ style, cssClass }) =>
        <SelectStyle style={style as ISelectStyle} cssClass={cssClass} />,
    radio: ({ style, styleProps, cssClass }) =>
        <RadioStyle style={style as IRadioStyle} styleProps={styleProps} cssClass={cssClass} />,
    checkbox: ({ style, styleProps, cssClass }) =>
        <CheckboxStyle style={style as ICheckboxStyle} styleProps={styleProps} cssClass={cssClass} />,
    datepicker: ({ style, styleProps, cssClass }) =>
        <DatePickerStyle style={style as IDatePickerStyle} styleProps={styleProps} cssClass={cssClass} />,
    slider: ({ style, styleProps, cssClass }) =>
        <SliderStyle style={style as ISliderStyle} styleProps={styleProps} cssClass={cssClass} />,
    'color-input': ({ style, styleProps, cssClass }) =>
        <ColorInputStyle style={style as IColorInputStyle} styleProps={styleProps} cssClass={cssClass} />,
    'color-picker': ({ style, styleProps, cssClass }) =>
        <ColorPickerStyle style={style as IColorPickerStyle} styleProps={styleProps} cssClass={cssClass} />,
    'file-input': ({ style, styleProps, cssClass }) =>
        <FileInputStyle style={style as IFileInputStyle} styleProps={styleProps} cssClass={cssClass} />,
    'number-input': ({ style, styleProps, cssClass }) =>
        <NumberInputStyle style={style as INumberInputStyle} styleProps={styleProps} cssClass={cssClass} />,
    'range-slider': ({ style, styleProps, cssClass }) =>
        <RangeSliderStyle style={style as IRangeSliderStyle} styleProps={styleProps} cssClass={cssClass} />,
    'segmented-control': ({ style, styleProps, cssClass }) =>
        <SegmentedControlStyle style={style as ISegmentedControlStyle} styleProps={styleProps} cssClass={cssClass} />,
    switch: ({ style, styleProps, cssClass }) =>
        <SwitchStyle style={style as ISwitchStyle} styleProps={styleProps} cssClass={cssClass} />,
    'text-input': ({ style, styleProps, cssClass }) =>
        <TextInputStyle style={style as ITextInputStyle} styleProps={styleProps} cssClass={cssClass} />,
    'rich-text-editor': ({ style, styleProps, cssClass }) =>
        <RichTextEditorStyle style={style as IRichTextEditorStyle} styleProps={styleProps} cssClass={cssClass} />,
    combobox: ({ style, styleProps, cssClass }) =>
        <ComboboxStyle style={style as IComboboxStyle} styleProps={styleProps} cssClass={cssClass} />,

    // ===== tabs / accordion =====
    tabs: ({ style, styleProps, cssClass }) =>
        <TabsStyle style={style as ITabsStyle} styleProps={styleProps} cssClass={cssClass} />,
    tab: ({ style, styleProps, cssClass }) =>
        <TabStyle style={style as ITabStyle} styleProps={styleProps} cssClass={cssClass} />,
    accordion: ({ style, styleProps, cssClass }) =>
        <AccordionStyle style={style as IAccordionStyle} styleProps={styleProps} cssClass={cssClass} />,
    'accordion-item': ({ style, styleProps, cssClass }) =>
        <AccordionItemStyle style={style as IAccordionItemStyle} styleProps={styleProps} cssClass={cssClass} />,

    // ===== misc / composite =====
    avatar: ({ style, styleProps, cssClass }) =>
        <AvatarStyle style={style as IAvatarStyle} styleProps={styleProps} cssClass={cssClass} />,
    'aspect-ratio': ({ style, styleProps, cssClass }) =>
        <AspectRatioStyle style={style as IAspectRatioStyle} styleProps={styleProps} cssClass={cssClass} />,
    badge: ({ style, styleProps, cssClass }) =>
        <BadgeStyle style={style as IBadgeStyle} styleProps={styleProps} cssClass={cssClass} />,
    box: ({ style, styleProps, cssClass }) =>
        <BoxStyle style={style as unknown as IBoxStyle} styleProps={styleProps} cssClass={cssClass} />,
    chip: ({ style, styleProps, cssClass }) =>
        <ChipStyle style={style as IChipStyle} styleProps={styleProps} cssClass={cssClass} />,
    timeline: ({ style, styleProps, cssClass }) =>
        <TimelineStyle style={style as ITimelineStyle} styleProps={styleProps} cssClass={cssClass} />,
    list: ({ style, styleProps, cssClass }) =>
        <ListStyle style={style as IListStyle} styleProps={styleProps} cssClass={cssClass} />,
    'list-item': ({ style, styleProps, cssClass }) =>
        <ListItemStyle style={style as IListItemStyle} styleProps={styleProps} cssClass={cssClass} />,
    indicator: ({ style, styleProps, cssClass }) =>
        <IndicatorStyle style={style as IIndicatorStyle} styleProps={styleProps} cssClass={cssClass} />,
    kbd: ({ style, styleProps, cssClass }) =>
        <KbdStyle style={style as IKbdStyle} styleProps={styleProps} cssClass={cssClass} />,
    'theme-icon': ({ style, styleProps, cssClass }) =>
        <ThemeIconStyle style={style as IThemeIconStyle} styleProps={styleProps} cssClass={cssClass} />,
    rating: ({ style, styleProps, cssClass }) =>
        <RatingStyle style={style as IRatingStyle} styleProps={styleProps} cssClass={cssClass} />,
    progress: ({ style, styleProps, cssClass }) =>
        <ProgressStyle style={style as IProgressStyle} styleProps={styleProps} cssClass={cssClass} />,
    'progress-root': ({ style, styleProps, cssClass }) =>
        <ProgressRootStyle style={style as IProgressRootStyle} styleProps={styleProps} cssClass={cssClass} />,
    'progress-section': ({ style, styleProps, cssClass }) =>
        <ProgressSectionStyle style={style as IProgressSectionStyle} styleProps={styleProps} cssClass={cssClass} />,
    notification: ({ style, styleProps, cssClass }) =>
        <NotificationStyle style={style as INotificationStyle} styleProps={styleProps} cssClass={cssClass} />,
    title: ({ style, styleProps, cssClass }) =>
        <TitleStyle style={style as ITitleStyle} styleProps={styleProps} cssClass={cssClass} />,
    text: ({ style, styleProps, cssClass }) =>
        <TextStyle style={style as ITextStyle} styleProps={styleProps} cssClass={cssClass} />,
    code: ({ style, styleProps, cssClass }) =>
        <CodeStyle style={style as ICodeStyle} styleProps={styleProps} cssClass={cssClass} />,
    highlight: ({ style, styleProps, cssClass }) =>
        <HighlightStyle style={style as IHighlightStyle} styleProps={styleProps} cssClass={cssClass} />,
    blockquote: ({ style, styleProps, cssClass }) =>
        <BlockquoteStyle style={style as IBlockquoteStyle} styleProps={styleProps} cssClass={cssClass} />,
    fieldset: ({ style, styleProps, cssClass }) =>
        <FieldsetStyle style={style as IFieldsetStyle} styleProps={styleProps} cssClass={cssClass} />,
    spoiler: ({ style, styleProps, cssClass }) =>
        <SpoilerStyle style={style as ISpoilerStyle} styleProps={styleProps} cssClass={cssClass} />,
    typography: ({ style, styleProps, cssClass }) =>
        <TypographyStyle style={style as ITypographyStyle} styleProps={styleProps} cssClass={cssClass} />,
};

/**
 * Expose the read-only dispatcher map for tests + developer tools.
 */
export const STYLE_IMPLS: Readonly<Record<string, TStyleRenderer>> = styleImpls;

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
 * BasicStyle is a dispatcher: it looks up the renderer by `style_name`
 * in the core `styleImpls` map first, then falls back to the plugin
 * runtime's contributed renderer, and finally to `UnknownStyle`.
 *
 * Mantine spacing + cssClass extraction are computed once here so each
 * renderer receives the same props and never has to read the global
 * spacing JSON on its own.
 */
const BasicStyle: React.FC<IBasicStyleProps> = ({ style, parentActive, childIndex, parentColor }) => {
    const pluginRenderer = usePluginStyleComponent(style?.style_name ?? '');
    const { isLoading: isPluginRuntimeLoading } = usePluginRuntime();

    if (!style || !style.style_name) {
        return null;
    }

    const wrapWithDebug = (component: React.ReactElement) => {
        return <DebugWrapper style={style}>{component}</DebugWrapper>;
    };

    const styleProps = getSpacingProps(style);
    const cssClass = getCssClass(style);

    const renderer = styleImpls[style.style_name];
    if (renderer) {
        return wrapWithDebug(renderer({ style, styleProps, cssClass, parentActive, childIndex, parentColor }));
    }

    if (pluginRenderer) {
        const PluginComponent = pluginRenderer as unknown as React.ComponentType<{
            style: TStyle;
            styleProps: Record<string, string>;
            cssClass: string;
            parentActive?: number;
            childIndex?: number;
            parentColor?: string;
        }>;
        return wrapWithDebug(
            <PluginComponent
                style={style}
                styleProps={styleProps}
                cssClass={cssClass}
                parentActive={parentActive}
                childIndex={childIndex}
                parentColor={parentColor}
            />,
        );
    }

    if (isPluginRuntimeLoading) {
        return null;
    }

    return wrapWithDebug(<UnknownStyle style={style as never} />);
};

export default BasicStyle;
