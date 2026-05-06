/**
 * Bridge re-exports from `@selfhelp/shared`.
 *
 * Use this path (`@/shared`) for any type / constant / helper that's
 * shared with the mobile app. Over time the in-tree counterparts in
 * `src/types/*` and `src/api/*` will be deleted in favour of these.
 *
 * This is a mechanical PR with no behaviour change: existing imports
 * keep working until they're migrated.
 *
 * Migration order (lowest risk first):
 *   1. API endpoint constants -> `@selfhelp/shared` ENDPOINTS.
 *   2. JSON-Logic condition evaluator -> shared `evaluateCondition`.
 *   3. {{field}} interpolator (PageDb mirror) -> shared `replaceCalcedValues`.
 *   4. Mantine semantic types (`TMantineSize`, ...) -> shared types.
 *   5. Per-style interfaces (~70 files) -> shared `IFooStyle`.
 *   6. Style registry -> shared `STYLE_REGISTRY`.
 */

export * from '@selfhelp/shared';
export {
    STYLE_REGISTRY,
    isKnownStyleName,
    getRegistryEntry,
} from '@selfhelp/shared/registry';
export {
    sharedTailwindExtend,
    sharedTailwindPreset,
} from '@selfhelp/shared/tailwind';
