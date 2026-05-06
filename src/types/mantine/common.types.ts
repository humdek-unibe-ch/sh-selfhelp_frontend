/**
 * Mantine common semantic types — now re-exported from
 * `@selfhelp/shared` so the web frontend and the mobile app speak
 * the SAME field shape.
 *
 * Why this is a re-export shim and not a direct import:
 *   - 80+ files in this codebase import from this path. A flag-day
 *     rewrite would dirty every file in the styles tree; this shim
 *     keeps every existing import line working.
 *   - Future renames / removals stay backwards-compatible: deprecate
 *     a name in shared, alias it here, ship.
 *
 * If you need a Mantine type that isn't here, add it to
 * `sh-selfhelp_shared/src/types/mantine/common.ts` (or the relevant
 * `styles/<group>.ts`), rebuild the shared package (`npm run build`),
 * and re-export it from below.
 */

export type {
    TMantineSize,
    TMantineRadius,
    TMantineSpacing,
    TMantineVariant,
    TMantineColor,
    TMantineOrientation,
    TMantineDirection,
    TMantineWrap,
    TMantineJustify,
    TMantineAlign,
    TMantineColorFormat,
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
} from '@selfhelp/shared';

// ===== local-only data shapes =====
// These are option-list shapes used by Mantine inputs. They're React-
// component-specific and don't affect the backend payload, so they
// stay in-tree.
export interface IMantineSegmentedControlData {
    value: string;
    label: string;
    disabled?: boolean;
}
export interface IMantineRadioOption {
    value: string;
    label: string;
}
export interface IMantineComboboxData {
    value: string;
    label: string;
    disabled?: boolean;
}
export interface IMantineMultiSelectData {
    value: string;
    label: string;
    disabled?: boolean;
}

// ===== aliases preserved for back-compat =====
// The pre-migration file exposed several `*Alias` aliases that other
// files import. Keep them so consumers don't break.
export type TMantineFullWidthAlias = boolean;
export type TMantineCompactAlias = boolean;
export type TMantineAutoContrastAlias = boolean;
export type TMantineIsLinkAlias = boolean;
export type TMantineUseMantineStyleAlias = boolean;
export type TMantineDisabledAlias = boolean;
export type TMantineOpenInNewTabAlias = boolean;
export type TMantineLoadingAlias = boolean;
export type TMantineMultipleAlias = boolean;
export type TMantineCheckedAlias = boolean;
export type TMantineReadonlyAlias = boolean;
export type TMantineWithCloseButtonAlias = boolean;
export type TMantineProcessingAlias = boolean;
export type TMantineBlockAlias = boolean;
export type TMantineWithIconAlias = boolean;
export type TMantineAllowStepClickAlias = boolean;
export type TMantineAllowNextClicksAlias = boolean;
export type TMantineSwatchesAlias = boolean;
export type TMantineWrapAlias = boolean;
export type TMantineGrowAlias = boolean;
export type TMantineInlineAlias = boolean;
export type TMantineFluidAlias = boolean;
