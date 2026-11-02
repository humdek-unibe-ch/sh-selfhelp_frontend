/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Per-style VISUAL metadata (row icon + accent HUE) for the CMS page-sections
 * tree.
 *
 * The backend style catalog (`IStyle`) and `@selfhelp/shared` carry NO UI icon /
 * colour hint — those are purely a frontend affordance so an editor can tell a
 * `container` from an `image` from a `login` at a glance in the section list.
 * This registry is therefore a frontend-only lookup keyed by the cross-repo
 * `style_name` (kebab-case, see the CMS naming contract in AGENTS.md).
 *
 * ── Colour model ────────────────────────────────────────────────────────────
 * Every style gets its OWN unique colour. Mantine only ships 14 palette hues, far
 * fewer than the ~90 styles, so we can NOT use palette keys and stay unique.
 * Instead each style carries a single number — an HSL **hue** (0–359) — and the
 * actual colours are built in CSS from that hue with a FIXED saturation/lightness
 * tuned per theme:
 *
 *   background tint : hsl(var(--style-hue)  70%  92%)   (light)   / …  25%  22% (dark)
 *   foreground/text : hsl(var(--style-hue)  65%  32%)   (light)   / …  70%  75% (dark)
 *   accent (border) : hsl(var(--style-hue)  70%  45%)
 *
 * Only the HUE varies per style; S/L are constant, so every chip keeps consistent
 * contrast and the set reads as a designed palette (not a random-colour generator)
 * and stays legible in light and dark. See `--style-hue` usage in
 * `PageSection.module.css` / `SectionsList.module.css`.
 *
 * Hues are assigned in FAMILY BANDS: each family owns a contiguous arc of the
 * colour wheel and its styles are spread evenly INSIDE that arc. So a category
 * still reads as a soft colour band (layout ≈ blues, form ≈ magentas, media ≈
 * greens…) while every style within it gets a distinct, unique hue. The icon
 * remains the PRIMARY disambiguator — colour is a secondary identity cue, which
 * matters because ~90 evenly-spread hues are only a few degrees apart and not all
 * pairs are reliably distinguishable by eye (incl. colour-vision deficiency).
 */

import {
    IconBox,
    IconLayoutGrid,
    IconLayoutColumns,
    IconStack2,
    IconColumns,
    IconContainer,
    IconAlignJustified,
    IconLayoutDistributeHorizontal,
    IconLayoutList,
    IconLayoutBoardSplit,
    IconSpace,
    IconSeparator,
    IconFold,
    IconScript,
    IconHeading,
    IconLetterCase,
    IconAlignLeft,
    IconQuote,
    IconCode,
    IconList,
    IconListDetails,
    IconTypography,
    IconPhoto,
    IconVideo,
    IconMusic,
    IconCarouselHorizontal,
    IconUserCircle,
    IconAspectRatio,
    IconForms,
    IconInputSearch,
    IconTextCaption,
    IconSelect,
    IconCalendar,
    IconSquareCheck,
    IconCircleDot,
    IconToggleLeft,
    IconAdjustmentsHorizontal,
    IconStar,
    IconNumbers,
    IconPalette,
    IconColorPicker,
    IconUpload,
    IconTags,
    IconLogin,
    IconUserPlus,
    IconLockOpen,
    IconShieldLock,
    IconMailCheck,
    IconShieldOff,
    IconError404,
    IconDatabase,
    IconDatabaseCog,
    IconTable,
    IconRepeat,
    IconLink,
    IconLayoutNavbar,
    IconTimeline,
    IconAlertTriangle,
    IconBell,
    IconProgress,
    IconBadge,
    IconChartBar,
    IconClipboardText,
    IconInfoCircle,
    IconKeyboard,
    IconTag,
    IconFrame,
    IconBoxMargin,
    IconApps,
    IconFileText,
    type Icon,
} from '@tabler/icons-react';

export interface IStyleVisual {
    /** Tabler icon component rendered inside the row's icon chip. */
    icon: Icon;
    /**
     * Unique HSL hue (0–359) for this style. Emitted as the `--style-hue` CSS var;
     * the tint / foreground / accent colours are derived from it in CSS with fixed
     * saturation + lightness, so they stay theme-aware and consistent.
     */
    hue: number;
}

/**
 * Family definition: the ordered list of styles in a family plus the hue ARC that
 * family occupies on the colour wheel. Styles are spread evenly across `[start,
 * end)` so each gets a unique hue while the family stays a recognisable band.
 *
 * The arcs are chosen to sit in the intuitive neighbourhood for each family and
 * to not overlap, so cross-family collisions are minimised too.
 */
interface IStyleFamily {
    /** Icon per style, in the order the hues are spread across the arc. */
    styles: Array<{ name: string; icon: Icon }>;
    /** Inclusive hue the family band starts at. */
    hueStart: number;
    /** Exclusive hue the family band ends at. */
    hueEnd: number;
}

const STYLE_FAMILIES: IStyleFamily[] = [
    // ── layout / structure — blue (206–250) ────────────────────────────────
    {
        hueStart: 206,
        hueEnd: 250,
        styles: [
            { name: 'container', icon: IconContainer },
            { name: 'box', icon: IconBox },
            { name: 'paper', icon: IconFileText },
            { name: 'card', icon: IconBox },
            { name: 'card-segment', icon: IconLayoutBoardSplit },
            { name: 'center', icon: IconLayoutDistributeHorizontal },
            { name: 'flex', icon: IconColumns },
            { name: 'stack', icon: IconStack2 },
            { name: 'grid', icon: IconLayoutGrid },
            { name: 'grid-column', icon: IconLayoutColumns },
            { name: 'simple-grid', icon: IconLayoutGrid },
            { name: 'group', icon: IconLayoutColumns },
            { name: 'fieldset', icon: IconFrame },
            { name: 'aspect-ratio', icon: IconAspectRatio },
            { name: 'scroll-area', icon: IconScript },
            { name: 'space', icon: IconSpace },
            { name: 'divider', icon: IconSeparator },
            { name: 'spoiler', icon: IconFold },
            { name: 'ref-container', icon: IconBoxMargin },
        ],
    },
    // ── content / text — teal (150–185) ────────────────────────────────────
    {
        hueStart: 150,
        hueEnd: 185,
        styles: [
            { name: 'text', icon: IconAlignLeft },
            { name: 'title', icon: IconHeading },
            { name: 'typography', icon: IconTypography },
            { name: 'highlight', icon: IconLetterCase },
            { name: 'rich-text-editor', icon: IconAlignJustified },
            { name: 'html-tag', icon: IconCode },
            { name: 'code', icon: IconCode },
            { name: 'kbd', icon: IconKeyboard },
            { name: 'blockquote', icon: IconQuote },
            { name: 'list', icon: IconList },
            { name: 'list-item', icon: IconListDetails },
        ],
    },
    // ── media — green → lime (90–140) ───────────────────────────────────────
    {
        hueStart: 90,
        hueEnd: 140,
        styles: [
            { name: 'image', icon: IconPhoto },
            { name: 'background-image', icon: IconPhoto },
            { name: 'figure', icon: IconPhoto },
            { name: 'video', icon: IconVideo },
            { name: 'audio', icon: IconMusic },
            { name: 'carousel', icon: IconCarouselHorizontal },
            { name: 'avatar', icon: IconUserCircle },
        ],
    },
    // ── form / input — purple → magenta (269–330) ──────────────────────────
    {
        hueStart: 269,
        hueEnd: 330,
        styles: [
            { name: 'form-log', icon: IconForms },
            { name: 'form-record', icon: IconForms },
            { name: 'input', icon: IconInputSearch },
            { name: 'text-input', icon: IconInputSearch },
            { name: 'textarea', icon: IconTextCaption },
            { name: 'number-input', icon: IconNumbers },
            { name: 'select', icon: IconSelect },
            { name: 'combobox', icon: IconSelect },
            { name: 'segmented-control', icon: IconAdjustmentsHorizontal },
            { name: 'datepicker', icon: IconCalendar },
            { name: 'checkbox', icon: IconSquareCheck },
            { name: 'radio', icon: IconCircleDot },
            { name: 'switch', icon: IconToggleLeft },
            { name: 'slider', icon: IconAdjustmentsHorizontal },
            { name: 'range-slider', icon: IconAdjustmentsHorizontal },
            { name: 'rating', icon: IconStar },
            { name: 'color-input', icon: IconPalette },
            { name: 'color-picker', icon: IconColorPicker },
            { name: 'file-input', icon: IconUpload },
            { name: 'chip', icon: IconTags },
        ],
    },
    // ── auth flow — red → pink (331–379, wraps past 360) ────────────────────
    {
        hueStart: 331,
        hueEnd: 379, // wraps to ~19 via modulo 360
        styles: [
            { name: 'login', icon: IconLogin },
            { name: 'register', icon: IconUserPlus },
            { name: 'reset-password', icon: IconLockOpen },
            { name: 'two-factor-auth', icon: IconShieldLock },
            { name: 'validate', icon: IconMailCheck },
            { name: 'profile', icon: IconUserCircle },
            { name: 'no-access', icon: IconShieldOff },
            { name: 'not-found', icon: IconError404 },
            { name: 'missing', icon: IconAlertTriangle },
        ],
    },
    // ── data / dynamic — cyan → azure (186–205) ─────────────────────────────
    {
        hueStart: 186,
        hueEnd: 205,
        styles: [
            { name: 'data-container', icon: IconDatabase },
            { name: 'entry-list', icon: IconTable },
            { name: 'entry-record', icon: IconClipboardText },
            { name: 'entry-record-delete', icon: IconDatabaseCog },
            { name: 'show-user-input', icon: IconTable },
            { name: 'loop', icon: IconRepeat },
        ],
    },
    // ── navigation — indigo (251–268) ──────────────────────────────────────
    {
        hueStart: 251,
        hueEnd: 268,
        styles: [
            { name: 'link', icon: IconLink },
            { name: 'action-icon', icon: IconApps },
            { name: 'button', icon: IconApps },
            { name: 'tabs', icon: IconLayoutNavbar },
            { name: 'tab', icon: IconLayoutNavbar },
            { name: 'accordion', icon: IconLayoutList },
            { name: 'accordion-item', icon: IconLayoutList },
            { name: 'timeline', icon: IconTimeline },
            { name: 'timeline-item', icon: IconTimeline },
        ],
    },
    // ── feedback / status — orange → amber (25–55) ──────────────────────────
    {
        hueStart: 25,
        hueEnd: 55,
        styles: [
            { name: 'alert', icon: IconAlertTriangle },
            { name: 'notification', icon: IconBell },
            { name: 'badge', icon: IconBadge },
            { name: 'indicator', icon: IconInfoCircle },
            { name: 'progress', icon: IconProgress },
            { name: 'progress-root', icon: IconProgress },
            { name: 'progress-section', icon: IconChartBar },
            { name: 'theme-icon', icon: IconApps },
            { name: 'version', icon: IconTag },
        ],
    },
];

/**
 * Build the `style_name` → visual lookup by spreading each family's styles evenly
 * across its hue arc. A single style in an arc sits at the arc start; N styles are
 * placed at `start + i * (end - start) / N`, wrapped into 0–359. This is
 * deterministic: the same catalog always yields the same hues.
 */
const STYLE_VISUALS: Record<string, IStyleVisual> = (() => {
    const map: Record<string, IStyleVisual> = {};
    for (const family of STYLE_FAMILIES) {
        const span = family.hueEnd - family.hueStart;
        const n = family.styles.length;
        family.styles.forEach((entry, i) => {
            const hue = Math.round((family.hueStart + (span * i) / n) % 360);
            map[entry.name] = { icon: entry.icon, hue };
        });
    }
    return map;
})();

/**
 * All `style_name`s that carry an explicit visual — exported so tests can assert
 * global hue uniqueness across the whole catalog (a future arc overlap must fail
 * CI, not just be caught by a sampled subset).
 */
export const KNOWN_STYLE_NAMES: readonly string[] = Object.keys(STYLE_VISUALS);

/**
 * Fallback hue for styles not in the registry — a neutral blue (matches the
 * `--section-hue` CSS fallback). The colour is built from hue with FIXED
 * saturation in CSS, so a fallback can't be truly grey; container vs leaf differ
 * only by icon (folder-ish container vs box leaf), not colour.
 */
const DEFAULT_HUE = 220;
const DEFAULT_CONTAINER_VISUAL: IStyleVisual = { icon: IconContainer, hue: DEFAULT_HUE };
const DEFAULT_LEAF_VISUAL: IStyleVisual = { icon: IconBox, hue: DEFAULT_HUE };

/**
 * Resolve the row icon + accent hue for a style. Falls back to a container-aware
 * default (folder-style icon when the style can nest children, box leaf icon
 * otherwise; both on the neutral fallback hue) so a style not yet in
 * {@link STYLE_VISUALS} still renders a sane, recognisable row instead of a blank
 * slot.
 */
export function getStyleVisual(styleName: string, canHaveChildren: boolean): IStyleVisual {
    return (
        STYLE_VISUALS[styleName] ??
        (canHaveChildren ? DEFAULT_CONTAINER_VISUAL : DEFAULT_LEAF_VISUAL)
    );
}
