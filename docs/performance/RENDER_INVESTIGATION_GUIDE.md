# Investigating 12 Renders Issue

## What We Added

### 1. **useWhyDidYouUpdate** Hook
- ✅ Added to `PageInspector` and `SectionInspector`
- Logs every prop change that caused a re-render
- Look for `[Why Did You Update]` in console

### 2. **useMountMonitor** Hook
- ✅ Added to `PageInspector` and `SectionInspector`
- Tracks component mount/unmount cycles
- Look for `[Mount Monitor]` in console

### 3. **Enhanced Debug Panel**
- ✅ Added render count guidelines
- ✅ Added troubleshooting tips

## What to Look For in Console

### Open your browser console now and refresh the page. You should see:

#### 1. Mount Monitor Logs
```
[Mount Monitor] PageInspector mounted
[Mount Monitor] SectionInspector mounted
[Mount Monitor] PageInspector unmounted  <-- ⚠️ This is BAD if it happens frequently
```

**What This Means:**
- If you see multiple mount/unmount cycles, the component is being destroyed and recreated
- This is expensive and causes state loss
- Usually caused by:
  - Parent component re-rendering with unstable `key` prop
  - Parent component conditionally rendering the component
  - Router changes

#### 2. Why Did You Update Logs
```
[Why Did You Update] PageInspector rendered
Props that changed:
  page: {old: {...}, new: {...}}
  isConfigurationPage: unchanged
```

**What This Means:**
- Shows which props changed between renders
- If you see the SAME prop changing on every render, it's not memoized
- Common culprits:
  - `page` object being recreated on every render (React Query issue)
  - Inline functions passed as props
  - Inline objects passed as props

## Expected vs Problematic Render Counts

### ✅ Normal (1-3 renders)
- Initial render
- Data loading state
- Data loaded state

### ⚠️ Acceptable but Investigate (4-10 renders)
- Multiple data sources loading
- Language switching
- Form initialization
- User authentication loading

### 🚨 Problematic (11-20 renders) - YOUR CURRENT STATE
This is what you're experiencing. Likely causes:

1. **React Query Data Instability**
   - The `page` object from `usePageDetails` might be creating a new reference on every render
   - Check if React Query is configured with proper `staleTime` and `structuralSharing`

2. **Context Updates**
   - Multiple context providers updating in sequence
   - Each context update triggers a re-render of consuming components

3. **Form State Changes**
   - Form initialization might be triggering multiple re-renders
   - Check if form libraries (like react-hook-form) are properly configured

4. **Language/Translation Loading**
   - If translations load in multiple chunks, each chunk loads triggers a re-render

### 🔥 Critical (20+ renders)
- Likely infinite loop
- Immediate investigation required

## How to Diagnose Your 12 Renders

### Step 1: Check Console for Prop Changes
Open console and look for the first few `[Why Did You Update]` logs:

**If you see:**
```
Render #1: page = undefined
Render #2: page = {...}
Render #3: page = {...} (SAME DATA, DIFFERENT REFERENCE) <-- PROBLEM
Render #4: page = {...} (SAME DATA, DIFFERENT REFERENCE) <-- PROBLEM
```

**Solution:** The `page` prop is not stable. Check where it comes from:
- Is it from a React Query hook? → Check `select` option and memoization
- Is it passed from a parent? → Check if parent is memoizing it

### Step 2: Check for Multiple Mount/Unmount Cycles
**If you see:**
```
[Mount Monitor] PageInspector mounted
[Mount Monitor] PageInspector unmounted
[Mount Monitor] PageInspector mounted  <-- PROBLEM: Re-mounting
[Mount Monitor] PageInspector unmounted
```

**Solution:** The component is being destroyed and recreated. Check:
- Does the parent have a `key` prop that's changing?
- Is the component conditionally rendered based on unstable state?

### Step 3: Look for Sequential Context Updates
**If you see:**
```
Render #1: Initial
Render #2: Languages loaded
Render #3: User loaded
Render #4: Page loaded
Render #5: Permissions loaded
Render #6: Navigation loaded
etc...
```

**Solution:** Multiple data sources loading sequentially. This is somewhat expected but can be optimized:
- Use `useQueries` to load data in parallel
- Combine related queries
- Add proper `suspense` boundaries

## Next Steps

### 1. **Check Console Logs**
Open your browser console and look for:
- `[Why Did You Update]` - shows which props changed
- `[Mount Monitor]` - shows mount/unmount cycles
- `[Render Monitor]` - shows render timing

### 2. **Common Fixes**

#### Fix 1: Memoize React Query Results
If `page` prop is causing re-renders:

```typescript
// In the hook that provides the page prop
const { data: page } = usePageDetails(pageId, {
    select: useCallback((data) => data, []), // Prevent unnecessary recalculations
});

// Or memoize before passing
const memoizedPage = useMemo(() => page, [page?.id, page?.version]); // Only re-create if ID or version changes
```

#### Fix 2: Check React Query Configuration
In `src/config/react-query.config.ts`:

```typescript
export const queryClientConfig = {
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - prevents refetching on every render
            structuralSharing: true, // Prevents creating new objects if data is the same
            refetchOnWindowFocus: false, // Prevents refetching when window regains focus
        },
    },
};
```

#### Fix 3: Memoize Page Object in Parent Component
If `PageInspector` is receiving `page` from a parent:

```typescript
// In parent component
const memoizedPage = useMemo(() => page, [
    page?.id_pages,
    page?.keyword,
    page?.updated_at, // Only fields that matter
]);

return <PageInspector page={memoizedPage} />;
```

## Performance Impact

### Current State (12 renders)
- **User Experience:** Likely still feels responsive but not optimal
- **CPU Usage:** Higher than necessary
- **Battery Impact:** More drain on mobile devices
- **Development Experience:** Makes debugging harder

### Goal State (1-3 renders)
- **User Experience:** Instant, smooth
- **CPU Usage:** Minimal
- **Battery Impact:** Optimal
- **Development Experience:** Easy to debug

## Action Items

1. ✅ **Open browser console**
2. ✅ **Navigate to a page with PageInspector**
3. ✅ **Look for `[Why Did You Update]` logs**
4. ✅ **Identify which props are changing**
5. ✅ **Check if `page` object is the culprit**
6. ✅ **Look for mount/unmount cycles**
7. ✅ **Share console logs with me** - I can help diagnose

## Useful Commands

```bash
# Search for where page prop comes from
grep -r "PageInspector.*page=" src/

# Find React Query hooks providing page data
grep -r "usePageDetails\|useQuery.*page" src/hooks/

# Check React Query configuration
cat src/config/react-query.config.ts
```

---

**Remember:** The goal is not to eliminate all re-renders (React is designed to re-render), but to eliminate **unnecessary** re-renders caused by unstable references and poor memoization.


