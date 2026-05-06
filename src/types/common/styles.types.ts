/**
 * Per-style interfaces for the Mantine renderer.
 *
 * THIS FILE IS NOW A THIN SHIM OVER `@selfhelp/shared`.
 *
 * Most CMS style shapes are owned by the shared package so the web
 * frontend and the new mobile app speak the same field shape. The
 * three frontend-only legacy styles (`refContainer`, `dataContainer`,
 * `version`) and the tightened `style_name: TStyleName` discriminator
 * stay in-tree because they're either admin-only or strictly narrower
 * than the shared `string` union.
 *
 * Migration history:
 *   - 2026-05-06: bulk migration. Per-style interfaces, base shape,
 *     spacing helper, and `IUnknownStyle` now re-export from shared.
 *   - The local `IBaseStyle` keeps `fields: Record<…, IContentField<any>>`
 *     for legacy admin code that derefs `style.fields.foo.content`
 *     without an explicit cast.
 */

import type { IContentField as ISharedContentField } from '../../shared';

// ===== Mantine common types — re-exported from shared =====
import type {
    TMantineSize,
    TMantineRadius,
    TMantineVariant,
    TMantineColor,
    TMantineOrientation,
    TMantineDirection,
    TMantineWrap,
    TMantineJustify,
    TMantineAlign,
    TMantineColorFormat,
    TMantineSpacing,
    TMantineGridSpan,
    TMantineGridOverflow,
    TMantineTabsVariant,
    TMantineFileAccept,
    TMantineClampBehavior,
    TMantineChipVariant,
    TMantineFieldsetVariant,
    TMantineAccordionVariant,
    TMantineAvatarVariant,
    TMantineBadgeVariant,
    TMantineIndicatorPosition,
    TMantineKbdSize,
    TMantineThemeIconVariant,
    TMantineTimelineLineVariant,
    TMantineTitleOrder,
    TMantineCodeBlock,
    TMantineHighlight,
    TMantineSpoilerMaxHeight,
    TMantineRatingCount,
    TMantineRatingFractions,
    TMantineNotificationWithCloseButton,
    TMantineAspectRatio,
    TMantineColorPickerSwatchesPerRow,
    TMantineActionIconLoading,
    TMantineGroupWrap,
    TMantineGroupGrow,
    TMantineGridGrow,
    TMantineTabDisabled,
    TMantineColorInputSwatches,
    TMantineColorPickerSwatches,
    TMantineFileInputMultiple,
    TMantineNumberInputDecimalScale,
    TMantineRangeSliderMarks,
    TMantineChipChecked,
    TMantineChipMultiple,
    TMantineRatingReadonly,
    TMantineSpaceHorizontal,
    TMantineCenterInline,
    TMantineContainerFluid,
    TMantineFullWidth,
    TMantineCompact,
    TMantineAutoContrast,
    TMantineIsLink,
    TMantineUseMantineStyle,
    TMantineDisabled,
    TMantineOpenInNewTab,
    TMantineLoading,
    TMantineMultiple,
    TMantineChecked,
    TMantineReadonly,
    TMantineWithCloseButton,
    TMantineProcessing,
    TMantineBlock,
    TMantineWithIcon,
    TMantineAllowStepClick,
    TMantineAllowNextClicks,
    TMantineSwatches,
    TMantineGrow,
    TMantineInline,
    TMantineFluid,
} from '../mantine/common.types';

export type {
    TMantineSize,
    TMantineRadius,
    TMantineVariant,
    TMantineColor,
    TMantineOrientation,
    TMantineDirection,
    TMantineWrap,
    TMantineJustify,
    TMantineAlign,
    TMantineColorFormat,
    TMantineSpacing,
    TMantineGridSpan,
    TMantineGridOverflow,
    TMantineTabsVariant,
    TMantineFileAccept,
    TMantineClampBehavior,
    TMantineChipVariant,
    TMantineFieldsetVariant,
    TMantineAccordionVariant,
    TMantineAvatarVariant,
    TMantineBadgeVariant,
    TMantineIndicatorPosition,
    TMantineKbdSize,
    TMantineThemeIconVariant,
    TMantineTimelineLineVariant,
    TMantineTitleOrder,
    TMantineCodeBlock,
    TMantineHighlight,
    TMantineSpoilerMaxHeight,
    TMantineRatingCount,
    TMantineRatingFractions,
    TMantineNotificationWithCloseButton,
    TMantineAspectRatio,
    TMantineColorPickerSwatchesPerRow,
    TMantineActionIconLoading,
    TMantineGroupWrap,
    TMantineGroupGrow,
    TMantineGridGrow,
    TMantineTabDisabled,
    TMantineColorInputSwatches,
    TMantineColorPickerSwatches,
    TMantineFileInputMultiple,
    TMantineNumberInputDecimalScale,
    TMantineRangeSliderMarks,
    TMantineChipChecked,
    TMantineChipMultiple,
    TMantineRatingReadonly,
    TMantineSpaceHorizontal,
    TMantineCenterInline,
    TMantineContainerFluid,
    TMantineFullWidth,
    TMantineCompact,
    TMantineAutoContrast,
    TMantineIsLink,
    TMantineUseMantineStyle,
    TMantineDisabled,
    TMantineOpenInNewTab,
    TMantineLoading,
    TMantineMultiple,
    TMantineChecked,
    TMantineReadonly,
    TMantineWithCloseButton,
    TMantineProcessing,
    TMantineBlock,
    TMantineWithIcon,
    TMantineAllowStepClick,
    TMantineAllowNextClicks,
    TMantineSwatches,
    TMantineGrow,
    TMantineInline,
    TMantineFluid,
};

// ===== Web-frontend-only Mantine helper types =====
// These don't exist in the shared package because the mobile renderer
// doesn't need them; they encode rendering-time choices specific to
// Mantine v9 on the web.
export type TMantineCardShadow = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type TMantineWidth = '25%' | '50%' | '75%' | '100%' | 'auto' | 'fit-content' | 'max-content' | 'min-content' | string;
export type TMantineHeight = '25%' | '50%' | '75%' | '100%' | 'auto' | 'fit-content' | 'max-content' | 'min-content' | string;
export type TMantineDividerVariant = 'solid' | 'dashed' | 'dotted';
export type TMantinePaperShadow = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type TMantineBorder = '0' | '1';
export type TMantineRequired = '0' | '1';
export type TMantineTranslatable = '0' | '1';
export type TMantineTextInputVariant = 'default' | 'filled' | 'unstyled';
export type TMantineTextareaAutosize = '0' | '1';
export type TMantineTextareaResize = 'none' | 'vertical' | 'both';
export type TMantineTextareaVariant = 'default' | 'filled' | 'unstyled';
export type TMantineUseInputWrapper = '0' | '1';
export type TMantineImageFit = 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
export type TMantineGap = '0' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type TMantineCols = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | string;
export type TMantineScrollAreaSize = '4' | '6' | '8' | '10' | '12' | '14' | '16' | '18' | '20' | string;
export type TMantineScrollAreaType = 'hover' | 'always' | 'never' | 'scroll';
export type TMantineGridOffset = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | string;
export type TMantineGridOrder = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | string;
export type TMantineTimelineBulletSize = string;
export type TMantineTimelineLineWidth = string;
export type TMantineTimelineActive = string;
export type TMantineProgressTransitionDuration = TMantineProgressTransition;
export type TMantineAccordionMultiple = '0' | '1';
export type TMantineAccordionChevronPosition = 'left' | 'right';
export type TMantineAccordionChevronSize = string;
export type TMantineAccordionDisableChevronRotation = '0' | '1';
export type TMantineAccordionLoop = '0' | '1';
export type TMantineAccordionTransitionDuration = string;
export type TMantineAccordionDefaultValue = string;
export type TMantineTitleTextWrap = 'wrap' | 'balance' | 'nowrap';
export type TMantineTitleLineClamp = '1' | '2' | '3' | '4' | '5' | string;
export type TMantineTextFontWeight = '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
export type TMantineTextFontStyle = 'normal' | 'italic';
export type TMantineTextDecoration = 'none' | 'underline' | 'line-through';
export type TMantineTextTransform = 'none' | 'uppercase' | 'capitalize' | 'lowercase';
export type TMantineTextAlign = 'left' | 'center' | 'right' | 'justify';
export type TMantineTextVariant = 'default' | 'gradient';
export type TMantineTextTruncate = 'none' | 'end' | 'start';
export type TMantineLineClamp = '2' | '3' | '4' | '5' | string;
export type TMantineTextInherit = '0' | '1';
export type TMantineTextSpan = '0' | '1';
export type TMantineIconSize = '14' | '16' | '18' | '20' | '24' | '32' | string;
export type TMantineListType = 'ordered' | 'unordered';
export type TMantineListStyleType =
    | 'none'
    | 'disc'
    | 'circle'
    | 'square'
    | 'decimal'
    | 'decimal-leading-zero'
    | 'lower-roman'
    | 'upper-roman'
    | 'lower-alpha'
    | 'upper-alpha'
    | string;
export type TMantineListWithPadding = '0' | '1';
export type TMantineListCenter = '0' | '1';
export type TMantineTypographyUseMantineStyle = '0' | '1';
export type TMantineProgressTransition = '150' | '200' | '300' | '400' | '0' | string;
export type TMantineLabelPosition = 'left' | 'right';
export type TMantineCheckboxIcon = string;
export type TMantineCheckboxLabelPosition = TMantineLabelPosition;

// ===== Style-name discriminator =====
// Local literal union — narrower than the shared `string` discriminator
// so the legacy switch/case in the frontend renderer keeps benefiting
// from exhaustiveness. Includes admin-only styles (`refContainer`,
// `dataContainer`, `version`, `progress-label`) that aren't part of
// the shared registry and never reach the mobile app.
export type TStyleName =
    | 'login' | 'profile' | 'validate' | 'register' | 'resetPassword' | 'twoFactorAuth'
    | 'container' | 'alert' | 'refContainer' | 'dataContainer' | 'html-tag' | 'center' | 'box'
    | 'flex' | 'group' | 'stack' | 'simple-grid' | 'scroll-area' | 'space' | 'grid' | 'grid-column' | 'divider' | 'paper'
    | 'form-log' | 'form-record' | 'input' | 'text-input' | 'textarea' | 'select' | 'radio' | 'slider' | 'checkbox'
    | 'image' | 'video' | 'audio' | 'figure' | 'carousel'
    | 'button' | 'link'
    | 'entryList' | 'entryRecord' | 'entryRecordDelete'
    | 'tabs' | 'tab'
    | 'version' | 'loop'
    | 'color-input' | 'color-picker' | 'file-input' | 'number-input' | 'radio-group' | 'range-slider'
    | 'segmented-control' | 'switch' | 'combobox' | 'multiSelect' | 'action-icon' | 'rich-text-editor'
    | 'code'
    | 'badge' | 'chip' | 'avatar' | 'timeline' | 'indicator'
    | 'kbd' | 'rating' | 'theme-icon' | 'progress' | 'progress-root' | 'progress-section' | 'progress-label'
    | 'accordion' | 'accordion-item'
    | 'notification'
    | 'title' | 'highlight' | 'blockquote' | 'text'
    | 'aspect-ratio' | 'background-image' | 'fieldset' | 'spoiler'
    | 'card' | 'card-segment'
    | 'list' | 'list-item'
    | 'datepicker'
    | 'typography';

// ===== IContentField — re-exported from shared =====
export type IContentField<T> = ISharedContentField<T>;

// ===== IBaseStyle / IStyleWithSpacing =====
// The shared `IBaseStyle` types `fields` as `Record<string, IContentField<unknown>>`.
// The frontend has ~80 admin/CMS files that deref `style.fields.foo.content`
// without explicit casts. To keep those compiling, the frontend version
// loosens `fields` back to `<any>` and narrows `style_name` to `TStyleName`.
//
// The mobile app uses the strict shared `IBaseStyle` directly; the two
// shapes coexist via the field accessor helpers in `useField.ts`.
export interface IBaseStyle {
    id: number;
    id_styles: number;
    style_name: TStyleName;
    can_have_children: number | null;
    position: number;
    path: string;
    children?: TStyle[];
    section_name: string;
    section_data?: any[];
    fields: Record<string, IContentField<any>>;
    condition: string | null;
    css: string | null;
    css_mobile: string | null;
    debug: number | null;
    data_config: string | number | null;
    condition_debug?: {
        condition?: string;
        result: boolean;
        error?: any[];
        variables?: Record<string, any>;
        condition_object?: any;
    } | null;
}

export interface IStyleWithSpacing extends IBaseStyle {
    mantine_spacing_margin?: IContentField<string>;
    mantine_spacing_margin_padding?: IContentField<string>;
}

// ===== Per-style interfaces — re-exported from shared =====
// Each name below maps 1:1 to a shared interface. If a style needs
// frontend-specific fields, add them to the shared package, rebuild,
// and re-import — DO NOT fork in this file.
export type {
    ILoginStyle,
    IRegisterStyle,
    IValidateStyle,
    IResetPasswordStyle,
    ITwoFactorAuthStyle,
    IProfileStyle,
    IContainerStyle,
    IBoxStyle,
    IFlexStyle,
    IGroupStyle,
    IStackStyle,
    ISimpleGridStyle,
    IGridStyle,
    IGridColumnStyle,
    ISpaceStyle,
    IDividerStyle,
    IPaperStyle,
    ICenterStyle,
    IScrollAreaStyle,
    ICardStyle,
    ICardSegmentStyle,
    IAspectRatioStyle,
    IBackgroundImageStyle,
    ITitleStyle,
    ITextStyle,
    ICodeStyle,
    IHighlightStyle,
    IBlockquoteStyle,
    IHtmlTagStyle,
    IKbdStyle,
    ITypographyStyle,
    IFieldsetStyle,
    ISpoilerStyle,
    IImageStyle,
    IVideoStyle,
    IAudioStyle,
    IFigureStyle,
    ICarouselStyle,
    IButtonStyle,
    ILinkStyle,
    IActionIconStyle,
    IAlertStyle,
    IBadgeStyle,
    IAvatarStyle,
    IChipStyle,
    IIndicatorStyle,
    IThemeIconStyle,
    INotificationStyle,
    IFormStyle,
    IFormLogStyle,
    IFormRecordStyle,
    IInputStyle,
    ITextInputStyle,
    ITextareaStyle,
    IRichTextEditorStyle,
    ISelectStyle,
    IRadioStyle,
    ICheckboxStyle,
    ISliderStyle,
    IRangeSliderStyle,
    IDatePickerStyle,
    ISwitchStyle,
    IComboboxStyle,
    IColorInputStyle,
    IColorPickerStyle,
    IFileInputStyle,
    INumberInputStyle,
    ISegmentedControlStyle,
    IRatingStyle,
    IProgressStyle,
    IProgressRootStyle,
    IProgressSectionStyle,
    IAccordionStyle,
    IAccordionItemStyle,
    ITabsStyle,
    ITabStyle,
    ITimelineStyle,
    IListStyle,
    IListItemStyle,
    IEntryListStyle,
    IEntryRecordStyle,
    IEntryRecordDeleteStyle,
    ILoopStyle,
} from '../../shared';

// ===== Frontend-only legacy styles =====
// These three styles exist in the admin/CMS UI and are emitted by the
// page editor, but they don't reach the mobile app and aren't part of
// the shared `STYLE_REGISTRY`. They live here so the frontend's
// renderer can still discriminate them.
export interface IRefContainerStyle extends IBaseStyle {
    style_name: 'refContainer';
}

export interface IDataContainerStyle extends IBaseStyle {
    style_name: 'dataContainer';
}

export interface IVersionStyle extends IBaseStyle {
    style_name: 'version';
}

// ===== Discriminated union of all styles =====
// Imports are resolved through this file's own re-exports above.
import type {
    ILoginStyle,
    IRegisterStyle,
    IValidateStyle,
    IResetPasswordStyle,
    ITwoFactorAuthStyle,
    IProfileStyle,
    IContainerStyle,
    IBoxStyle,
    IFlexStyle,
    IGroupStyle,
    IStackStyle,
    ISimpleGridStyle,
    IGridStyle,
    IGridColumnStyle,
    ISpaceStyle,
    IDividerStyle,
    IPaperStyle,
    ICenterStyle,
    IScrollAreaStyle,
    ICardStyle,
    ICardSegmentStyle,
    IAspectRatioStyle,
    IBackgroundImageStyle,
    ITitleStyle,
    ITextStyle,
    ICodeStyle,
    IHighlightStyle,
    IBlockquoteStyle,
    IHtmlTagStyle,
    IKbdStyle,
    ITypographyStyle,
    IFieldsetStyle,
    ISpoilerStyle,
    IImageStyle,
    IVideoStyle,
    IAudioStyle,
    IFigureStyle,
    ICarouselStyle,
    IButtonStyle,
    ILinkStyle,
    IActionIconStyle,
    IAlertStyle,
    IBadgeStyle,
    IAvatarStyle,
    IChipStyle,
    IIndicatorStyle,
    IThemeIconStyle,
    INotificationStyle,
    IFormLogStyle,
    IFormRecordStyle,
    IInputStyle,
    ITextInputStyle,
    ITextareaStyle,
    IRichTextEditorStyle,
    ISelectStyle,
    IRadioStyle,
    ICheckboxStyle,
    ISliderStyle,
    IRangeSliderStyle,
    IDatePickerStyle,
    ISwitchStyle,
    IComboboxStyle,
    IColorInputStyle,
    IColorPickerStyle,
    IFileInputStyle,
    INumberInputStyle,
    ISegmentedControlStyle,
    IRatingStyle,
    IProgressStyle,
    IProgressRootStyle,
    IProgressSectionStyle,
    IAccordionStyle,
    IAccordionItemStyle,
    ITabsStyle,
    ITabStyle,
    ITimelineStyle,
    IListStyle,
    IListItemStyle,
    IEntryListStyle,
    IEntryRecordStyle,
    IEntryRecordDeleteStyle,
    ILoopStyle,
} from '../../shared';

export type TStyle =
    // auth
    | ILoginStyle | IProfileStyle | IValidateStyle | IRegisterStyle
    | IResetPasswordStyle | ITwoFactorAuthStyle
    // layout
    | IContainerStyle | IBoxStyle | IFlexStyle | IGroupStyle | IStackStyle
    | ISimpleGridStyle | IGridStyle | IGridColumnStyle | ISpaceStyle
    | IDividerStyle | IPaperStyle | ICenterStyle | IScrollAreaStyle
    | ICardStyle | ICardSegmentStyle | IAspectRatioStyle | IBackgroundImageStyle
    | IRefContainerStyle | IDataContainerStyle
    // typography
    | ITitleStyle | ITextStyle | ICodeStyle | IHighlightStyle
    | IBlockquoteStyle | IHtmlTagStyle | IKbdStyle | ITypographyStyle
    | IFieldsetStyle | ISpoilerStyle
    // media
    | IImageStyle | IVideoStyle | IAudioStyle | IFigureStyle | ICarouselStyle
    // interactive
    | IButtonStyle | ILinkStyle | IActionIconStyle | IAlertStyle
    | IBadgeStyle | IAvatarStyle | IChipStyle | IIndicatorStyle
    | IThemeIconStyle | INotificationStyle
    // forms
    | IFormLogStyle | IFormRecordStyle | IInputStyle | ITextInputStyle
    | ITextareaStyle | IRichTextEditorStyle | ISelectStyle | IRadioStyle
    | ICheckboxStyle | ISliderStyle | IRangeSliderStyle | IDatePickerStyle
    | ISwitchStyle | IComboboxStyle | IColorInputStyle | IColorPickerStyle
    | IFileInputStyle | INumberInputStyle | ISegmentedControlStyle
    | IRatingStyle | IProgressStyle | IProgressRootStyle | IProgressSectionStyle
    // composite
    | IAccordionStyle | IAccordionItemStyle | ITabsStyle | ITabStyle
    | ITimelineStyle | IListStyle | IListItemStyle
    | IEntryListStyle | IEntryRecordStyle | IEntryRecordDeleteStyle
    | ILoopStyle | IVersionStyle;

export interface IUnknownStyle extends IBaseStyle {
    style_name: TStyleName;
}
