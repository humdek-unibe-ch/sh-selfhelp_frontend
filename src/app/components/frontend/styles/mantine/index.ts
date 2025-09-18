// ===========================================
// MANTINE COMPONENTS INDEX FILE
// ===========================================

// Layout Components
export { default as CenterStyle } from './CenterStyle';
export { default as ContainerStyle } from './ContainerStyle';
export { default as FlexStyle } from './FlexStyle';
export { default as GroupStyle } from './GroupStyle';
export { default as SimpleGridStyle } from './SimpleGridStyle';
export { default as ScrollAreaStyle } from './ScrollAreaStyle';
export { default as SpaceStyle } from './SpaceStyle';
export { default as GridStyle } from './GridStyle';
export { default as GridColumnStyle } from './GridColumnStyle';
export { default as StackStyle } from './StackStyle';
export { default as DividerStyle } from './DividerStyle';
export { default as PaperStyle } from './PaperStyle';

// Form Components
export { default as ColorInputStyle } from './ColorInputStyle';
export { default as ColorPickerStyle } from './ColorPickerStyle';
export { default as FileInputStyle } from './FileInputStyle';
export { default as NumberInputStyle } from './NumberInputStyle';
export { default as RadioStyle } from './RadioStyle';
export { default as CheckboxStyle } from './CheckboxStyle';
export { default as DatePickerStyle } from './DatePickerStyle';
export { default as RangeSliderStyle } from './RangeSliderStyle';
export { default as SliderStyle } from './SliderStyle';
export { default as SegmentedControlStyle } from './SegmentedControlStyle';
export { default as SwitchStyle } from './SwitchStyle';
export { default as ComboboxStyle } from './ComboboxStyle';
// export { default as MultiSelectStyle } from './MultiSelectStyle';
export { default as ActionIconStyle } from './ActionIconStyle';

// Data Display Components
export { default as BadgeStyle } from './BadgeStyle';
export { default as ChipStyle } from './ChipStyle';
export { default as AvatarStyle } from './AvatarStyle';
export { default as TimelineStyle } from './TimelineStyle';
export { default as IndicatorStyle } from './IndicatorStyle';
export { default as KbdStyle } from './KbdStyle';
export { default as ThemeIconStyle } from './ThemeIconStyle';
export { default as ListStyle } from './list/ListStyle';
export { default as ListItemStyle } from './list/ListItemStyle';
export { ProgressStyle, ProgressRootStyle, ProgressSectionStyle } from './progress';

// Navigation Components
export { default as AccordionStyle } from './accordion/AccordionStyle';
export { default as AccordionItemStyle } from './accordion/AccordionItemStyle';

// Feedback Components
export { default as AlertStyle } from './AlertStyle';
export { default as NotificationStyle } from './NotificationStyle';

// Data Display Components (continued)
export { default as RatingStyle } from './RatingStyle';
export { default as ImageStyle } from '../ImageStyle';

// Typography Components
export { default as TitleStyle } from './TitleStyle';
export { default as TextStyle } from './TextStyle';
// export { default as CodeStyle } from './CodeStyle';
export { default as HighlightStyle } from './HighlightStyle';
export { default as BlockquoteStyle } from './BlockquoteStyle';

// Utility Components
export { default as AspectRatioStyle } from './AspectRatioStyle';
export { default as BackgroundImageStyle } from './BackgroundImageStyle';
export { default as FieldsetStyle } from './FieldsetStyle';
export { default as SpoilerStyle } from './SpoilerStyle';
export { default as TypographyStyle } from './TypographyStyle';

// Re-export types for convenience
export type {
    TMantineSize,
    TMantineVariant,
    TMantineColor,
    TMantineRadius,
    TMantineOrientation,
    TMantineDirection,
    TMantineJustify,
    TMantineAlign,
    TMantineColorFormat,
    TMantineSpacing,
    TMantineGridSpan,
    TMantineGridOverflow,
    TMantineTabsVariant,
    IMantineSegmentedControlData,
    IMantineRadioOption,
    IMantineComboboxData,
    IMantineMultiSelectData,
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
    TMantineWrap,
    TMantineGrow,
    TMantineInline,
    TMantineFluid,
    TMantineFullWidthAlias,
    TMantineCompactAlias,
    TMantineAutoContrastAlias,
    TMantineIsLinkAlias,
    TMantineUseMantineStyleAlias,
    TMantineDisabledAlias,
    TMantineOpenInNewTabAlias,
    TMantineLoadingAlias,
    TMantineMultipleAlias,
    TMantineCheckedAlias,
    TMantineReadonlyAlias,
    TMantineWithCloseButtonAlias,
    TMantineProcessingAlias,
    TMantineBlockAlias,
    TMantineWithIconAlias,
    TMantineAllowStepClickAlias,
    TMantineAllowNextClicksAlias,
    TMantineSwatchesAlias,
    TMantineWrapAlias,
    TMantineGrowAlias,
    TMantineInlineAlias,
    TMantineFluidAlias
} from '../../../../../types/mantine/common.types';

// ===========================================
// COMPONENT MAPPING UTILITY
// ===========================================

/**
 * Mapping of style names to their corresponding component implementations
 */
export const MANTINE_COMPONENT_MAP = {
    // Layout Components
    'center': 'CenterStyle',
    'container': 'ContainerStyle',
    'flex': 'FlexStyle',
    'group': 'GroupStyle',
    'simple-grid': 'SimpleGridStyle',
    'space': 'SpaceStyle',
    'grid': 'GridStyle',
    'grid-column': 'GridColumnStyle',
    'stack': 'StackStyle',
    'divider': 'DividerStyle',
    'paper': 'PaperStyle',

    // Form Components
    'button': 'ButtonStyle',
    'color-input': 'ColorInputStyle',
    'color-picker': 'ColorPickerStyle',
    'fileInput': 'FileInputStyle',
    'numberInput': 'NumberInputStyle',
    'radio': 'RadioStyle',
    'range-slider': 'RangeSliderStyle',
    'slider': 'SliderStyle',
    'segmented-control': 'SegmentedControlStyle',
    'switch': 'SwitchStyle',
    'combobox': 'ComboboxStyle',
    'multiSelect': 'MultiSelectStyle',
    'actionIcon': 'ActionIconStyle',

    // Data Display Components
    'badge': 'BadgeStyle',
    'chip': 'ChipStyle',
    'avatar': 'AvatarStyle',
    'timeline': 'TimelineStyle',
    'indicator': 'IndicatorStyle',
    'kbd': 'KbdStyle',
    'theme-icon': 'ThemeIconStyle',
    'list': 'ListStyle',
    'listItem': 'ListItemStyle',
    'rating': 'RatingStyle',
    'image': 'ImageStyle',
    'progress': 'ProgressStyle',
    'progress-root': 'ProgressRootStyle',
    'progress-section': 'ProgressSectionStyle',
    'progress-label': 'ProgressLabelStyle',

    // Navigation Components
    'accordion': 'AccordionStyle',
    'accordion-Item': 'AccordionItemStyle',

    // Feedback Components
    'alert': 'AlertStyle',
    'notification': 'NotificationStyle',

    // Typography Components
    'title': 'TitleStyle',
    'text': 'TextStyle',
    'code': 'CodeStyle',
    'highlight': 'HighlightStyle',
    'blockquote': 'BlockquoteStyle',

    // Utility Components
    'aspect-ratio': 'AspectRatioStyle',
    'background-image': 'BackgroundImageStyle',
    'fieldset': 'FieldsetStyle',
    'spoiler': 'SpoilerStyle',
    'typography': 'TypographyStyle'
} as const;

/**
 * Get the component name for a given style name
 */
export const getMantineComponentName = (styleName: string): string | undefined => {
    return MANTINE_COMPONENT_MAP[styleName as keyof typeof MANTINE_COMPONENT_MAP];
};

/**
 * Check if a style name is a Mantine component
 */
export const isMantineComponent = (styleName: string): boolean => {
    return styleName in MANTINE_COMPONENT_MAP;
};
