/**
 * Common Mantine component types and interfaces
 * Following the I-prefixed interface naming convention
 * Following the T-prefixed type naming convention
 */

// ===========================================
// FIELD TYPE DEFINITIONS
// ===========================================

/**
 * Mantine size options
 */
export type TMantineSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Mantine variant options for various components
 */
export type TMantineVariant =
  | 'filled'
  | 'light'
  | 'outline'
  | 'subtle'
  | 'default'
  | 'transparent'
  | 'white'
  | 'pills'
  | 'contained'
  | 'separated';

/**
 * Mantine color options
 */
export type TMantineColor =
  | 'gray'
  | 'red'
  | 'grape'
  | 'violet'
  | 'blue'
  | 'cyan'
  | 'green'
  | 'lime'
  | 'yellow'
  | 'orange';

/**
 * Mantine radius options
 */
export type TMantineRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'none';

/**
 * Mantine orientation options
 */
export type TMantineOrientation = 'horizontal' | 'vertical';

/**
 * Mantine direction options
 */
export type TMantineDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';

/**
 * Mantine wrap options
 */
export type TMantineWrap = 'wrap' | 'nowrap' | 'wrap-reverse';

/**
 * Mantine justify options
 */
export type TMantineJustify =
  | 'flex-start'
  | 'center'
  | 'flex-end'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';

/**
 * Mantine align options
 */
export type TMantineAlign =
  | 'flex-start'
  | 'center'
  | 'flex-end'
  | 'stretch'
  | 'baseline';

/**
 * Mantine color format options
 */
export type TMantineColorFormat = 'hex' | 'rgba' | 'hsla';

/**
 * Mantine spacing values (gap, padding, margin)
 */
export type TMantineSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'none';

/**
 * Mantine grid span values
 */
export type TMantineGridSpan = 'auto' | 'content' | number;

/**
 * Mantine grid overflow options
 */
export type TMantineGridOverflow = 'visible' | 'hidden';

/**
 * Mantine tabs variant options
 */
export type TMantineTabsVariant = 'default' | 'outline' | 'pills';

/**
 * Mantine segmented control data
 */
export interface IMantineSegmentedControlData {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Mantine radio options
 */
export interface IMantineRadioOption {
  value: string;
  label: string;
}

/**
 * Mantine combobox data
 */
export interface IMantineComboboxData {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Mantine multi-select data
 */
export interface IMantineMultiSelectData {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Mantine file input accept options
 */
export type TMantineFileAccept =
  | 'image/*'
  | 'audio/*'
  | 'video/*'
  | '.pdf'
  | '.doc,.docx'
  | '.xls,.xlsx'
  | string;

/**
 * Mantine number input clamp behavior
 */
export type TMantineClampBehavior = 'strict' | 'blur';

/**
 * Mantine chip variant options
 */
export type TMantineChipVariant = 'filled' | 'outline' | 'light';

/**
 * Mantine fieldset variant options
 */
export type TMantineFieldsetVariant = 'default' | 'filled';

/**
 * Mantine accordion variant options
 */
export type TMantineAccordionVariant = 'default' | 'contained' | 'filled' | 'separated';

/**
 * Mantine avatar variant options
 */
export type TMantineAvatarVariant = 'filled' | 'light' | 'outline' | 'transparent' | 'white' | 'default';

/**
 * Mantine badge variant options
 */
export type TMantineBadgeVariant = 'filled' | 'light' | 'outline' | 'dot' | 'gradient';

/**
 * Mantine indicator position options
 */
export type TMantineIndicatorPosition =
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'middle-start'
  | 'middle-center'
  | 'middle-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end';

/**
 * Mantine kbd size options
 */
export type TMantineKbdSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Mantine theme icon variant options
 */
export type TMantineThemeIconVariant = 'filled' | 'light' | 'outline' | 'transparent' | 'white' | 'default' | 'gradient';

/**
 * Mantine timeline item line variant options
 */
export type TMantineTimelineLineVariant = 'solid' | 'dashed' | 'dotted';

/**
 * Mantine title order (heading level)
 */
export type TMantineTitleOrder = number | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Mantine code block option
 */
export type TMantineCodeBlock = boolean;

/**
 * Mantine highlight text
 */
export type TMantineHighlight = string | string[];

/**
 * Mantine spoiler max height
 */
export type TMantineSpoilerMaxHeight = number | string;

/**
 * Mantine rating count
 */
export type TMantineRatingCount = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * Mantine rating fractions
 */
export type TMantineRatingFractions = 1 | 2 | 3 | 4 | 5;
/**
 * Mantine notification with close button
 */
export type TMantineNotificationWithCloseButton = boolean;

/**
 * Mantine aspect ratio ratio
 */
export type TMantineAspectRatio = number | string;

/**
 * Mantine color picker swatches per row
 */
export type TMantineColorPickerSwatchesPerRow = 3 | 4 | 5 | 6 | 7 | 8;

/**
 * Mantine action icon loading
 */
export type TMantineActionIconLoading = boolean;

/**
 * Mantine group wrap
 */
export type TMantineGroupWrap = 0 | 1;

/**
 * Mantine group grow
 */
export type TMantineGroupGrow = boolean;

/**
 * Mantine grid grow
 */
export type TMantineGridGrow = boolean;

/**
 * Mantine tab disabled
 */
export type TMantineTabDisabled = boolean;

/**
 * Mantine color input swatches
 */
export type TMantineColorInputSwatches = boolean;

/**
 * Mantine color picker swatches
 */
export type TMantineColorPickerSwatches = boolean;

/**
 * Mantine file input multiple
 */
export type TMantineFileInputMultiple = boolean;

/**
 * Mantine number input decimal scale
 */
export type TMantineNumberInputDecimalScale = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Mantine range slider marks
 */
export type TMantineRangeSliderMarks = boolean;

/**
 * Mantine chip checked
 */
export type TMantineChipChecked = boolean;

/**
 * Mantine chip multiple
 */
export type TMantineChipMultiple = boolean;

/**
 * Mantine rating readonly
 */
export type TMantineRatingReadonly = boolean;

/**
 * Mantine space horizontal
 */
export type TMantineSpaceHorizontal = 0 | 1;

/**
 * Mantine center inline
 */
export type TMantineCenterInline = boolean;

/**
 * Mantine container fluid
 */
export type TMantineContainerFluid = boolean;

/**
 * Mantine full width
 */
export type TMantineFullWidth = boolean;

/**
 * Mantine compact
 */
export type TMantineCompact = boolean;

/**
 * Mantine auto contrast
 */
export type TMantineAutoContrast = boolean;

/**
 * Mantine is link
 */
export type TMantineIsLink = boolean;

/**
 * Mantine use Mantine style
 */
export type TMantineUseMantineStyle = boolean;

/**
 * Mantine disabled
 */
export type TMantineDisabled = boolean;

/**
 * Mantine open in new tab
 */
export type TMantineOpenInNewTab = boolean;

/**
 * Mantine loading
 */
export type TMantineLoading = boolean;

/**
 * Mantine multiple
 */
export type TMantineMultiple = boolean;

/**
 * Mantine checked
 */
export type TMantineChecked = boolean;

/**
 * Mantine readonly
 */
export type TMantineReadonly = boolean;

/**
 * Mantine with close button
 */
export type TMantineWithCloseButton = boolean;

/**
 * Mantine processing
 */
export type TMantineProcessing = boolean;

/**
 * Mantine block
 */
export type TMantineBlock = boolean;

/**
 * Mantine with icon
 */
export type TMantineWithIcon = boolean;

/**
 * Mantine allow step click
 */
export type TMantineAllowStepClick = boolean;

/**
 * Mantine allow next clicks
 */
export type TMantineAllowNextClicks = boolean;

/**
 * Mantine swatches
 */
export type TMantineSwatches = boolean;

/**
 * Mantine grow
 */
export type TMantineGrow = boolean;

/**
 * Mantine inline
 */
export type TMantineInline = boolean;

/**
 * Mantine fluid
 */
export type TMantineFluid = boolean;

/**
 * Mantine full width
 */
export type TMantineFullWidthAlias = boolean;

/**
 * Mantine compact
 */
export type TMantineCompactAlias = boolean;

/**
 * Mantine auto contrast
 */
export type TMantineAutoContrastAlias = boolean;

/**
 * Mantine is link
 */
export type TMantineIsLinkAlias = boolean;

/**
 * Mantine use Mantine style
 */
export type TMantineUseMantineStyleAlias = boolean;

/**
 * Mantine disabled
 */
export type TMantineDisabledAlias = boolean;

/**
 * Mantine open in new tab
 */
export type TMantineOpenInNewTabAlias = boolean;

/**
 * Mantine loading
 */
export type TMantineLoadingAlias = boolean;

/**
 * Mantine multiple
 */
export type TMantineMultipleAlias = boolean;

/**
 * Mantine checked
 */
export type TMantineCheckedAlias = boolean;

/**
 * Mantine readonly
 */
export type TMantineReadonlyAlias = boolean;

/**
 * Mantine with close button
 */
export type TMantineWithCloseButtonAlias = boolean;

/**
 * Mantine processing
 */
export type TMantineProcessingAlias = boolean;

/**
 * Mantine block
 */
export type TMantineBlockAlias = boolean;

/**
 * Mantine with icon
 */
export type TMantineWithIconAlias = boolean;

/**
 * Mantine allow step click
 */
export type TMantineAllowStepClickAlias = boolean;

/**
 * Mantine allow next clicks
 */
export type TMantineAllowNextClicksAlias = boolean;

/**
 * Mantine swatches
 */
export type TMantineSwatchesAlias = boolean;

/**
 * Mantine wrap
 */
export type TMantineWrapAlias = boolean;

/**
 * Mantine grow
 */
export type TMantineGrowAlias = boolean;

/**
 * Mantine inline
 */
export type TMantineInlineAlias = boolean;

/**
 * Mantine fluid
 */
export type TMantineFluidAlias = boolean;

