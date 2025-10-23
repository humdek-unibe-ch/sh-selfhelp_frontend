# 11. 🚀 Performance & Optimization

## Critical Performance Issues & Fixes

### 1. Nested Context Providers (50% of Issues)

**🚨 Anti-Pattern: Nested MantineProvider**
```typescript
// ❌ WRONG - Causes cascading re-renders
return (
  <MantineProvider theme={theme}>  // Third provider!
    <AppShell>
      <DebugMenu />
    </AppShell>
  </MantineProvider>
);

// ✅ CORRECT - Remove unnecessary wrapper
return (
  <AppShell>
    <DebugMenu />
  </AppShell>
);
```

**Why it causes issues:**
- Multiple theme contexts cascade updates
- All child components re-render on theme changes
- Performance degrades exponentially with nesting

**Impact:** 95% reduction in renders (76-90 → 2-4 renders)

### 2. Object Dependencies in useMemo (50% of Issues)

**🚨 Anti-Pattern: Objects in useMemo Dependencies**
```typescript
// ❌ WRONG - selectedPage is object, causes unmount/remount
const asideContent = useMemo(() => {
  return <SectionInspector pageId={selectedPage?.id_pages} sectionId={sectionId} />;
}, [selectedPage]); // Object dependency = BAD

// ✅ CORRECT - Extract primitive values
const pageId = selectedPage?.id_pages; // Extract primitive first

const asideContent = useMemo(() => {
  return <SectionInspector pageId={pageId} sectionId={sectionId} />;
}, [pageId, sectionId]); // Only primitives = GOOD
```

**Why it causes unmount/remount:**
- React Query `select` creates new object references
- useMemo sees "new" dependency → recomputes
- Component unmounts/remounts (slow) instead of re-rendering (fast)

**Impact:** Typing lag reduced from 250-287ms to 2-5ms

### 3. React Query Select Optimization

**🚨 Anti-Pattern: Complex select functions**
```typescript
// ❌ WRONG - Creates new objects on every call
select: (data) => ({
  allPages: [],    // New array every time!
  systemPages: [], // New array every time!
  processed: data.map(...) // New array every time!
})
```

**✅ Best Practice: Primitive Dependencies**
```typescript
// Extract primitives OUTSIDE useMemo
const pageId = selectedPage?.id_pages;
const sectionId = selectedSection?.id_sections;

// Only depend on primitives
useMemo(() => <Component pageId={pageId} />, [pageId]);
```

## React Query Optimization

**Intelligent Caching Strategy**:
- Short cache for dynamic content (1s - `staleTime: 1000`)
- Medium cache for semi-static data (5min)
- Long cache for configuration data (10min)

**Optimal Configuration**:
```typescript
// react-query.config.ts - Production-ready settings
export const REACT_QUERY_CONFIG = {
  CACHE: {
    staleTime: 1000,    // 1 second - good balance
    gcTime: 1000,       // 1 second - quick cleanup
  },
  DEFAULT_OPTIONS: {
    queries: {
      refetchOnMount: false,     // ✅ Use cache first
      refetchOnWindowFocus: false, // ✅ No unnecessary refetches
      networkMode: 'online',       // ✅ Better deduplication
    },
  },
};
```

**Query with Select Optimization**:
```typescript
export function useAdminPages() {
    return useQuery({
        queryKey: ['admin-pages'],
        queryFn: AdminPageApi.getAllPages,
        select: (data) => {
            // Transform once, cache result
            return data.pages.map(page => ({
                ...page,
                displayName: `${page.title} (${page.keyword})`
            }));
        },
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
    });
}
```

## Component Optimization

**React.memo with Primitive Props**:
```typescript
// ✅ CORRECT - Only depend on primitives
const FieldRenderer = React.memo(function FieldRenderer({
  fieldId,      // number - stable
  sectionId,    // number - stable
  value,        // string/primitive - stable
  onChange      // function - use useCallback in parent
}: IFieldRendererProps) {
  // Component logic...
}, (prevProps, nextProps) => {
  // Only compare primitives
  return prevProps.fieldId === nextProps.fieldId &&
         prevProps.sectionId === nextProps.sectionId &&
         prevProps.value === nextProps.value;
});
```

**Lazy Loading & Code Splitting**:
```typescript
// Dynamic imports for large components
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const SectionInspector = lazy(() => import('./SectionInspector'));

// Usage with Suspense
<Suspense fallback={<Skeleton height={400} />}>
    <AdminDashboard />
</Suspense>
```

**useMemo for Expensive Operations**:
```typescript
// ✅ Memoize derived values
const processedData = useMemo(() => {
  return rawData.map(item => ({
    ...item,
    computedValue: expensiveCalculation(item)
  }));
}, [rawData]); // Only recompute when rawData changes
```

## Debug Monitoring System

### Enabling Performance Monitoring

```bash
# Add to .env.local
NEXT_PUBLIC_DEBUG_PERF=true
```

### Monitoring Hooks

```typescript
import {
  useRenderMonitor,
  useWhyDidYouUpdate,
  useMountMonitor
} from '@/utils/performance-monitor.utils';

export function SectionInspector({ pageId, sectionId }: ISectionInspectorProps) {
  // Monitor renders and performance
  useRenderMonitor('SectionInspector', { pageId, sectionId });

  // Track prop changes in detail
  useWhyDidYouUpdate('SectionInspector', { pageId, sectionId });

  // Monitor mount/unmount cycles
  useMountMonitor('SectionInspector');

  // Component logic...
}
```

### Performance Warnings

The system automatically detects:
- **Excessive Renders:** >50 renders in 10 seconds
- **Slow Renders:** >16ms per render (60fps threshold)
- **Infinite Loops:** >100 renders in 5 seconds
- **Unstable Props:** Props changing on 80%+ of renders

### Debug Menu Features

Access via floating blue bug icon (🐛):

1. **Performance Tab:** Real-time render counts and timing
2. **Why Did You Update:** Detailed prop change history
3. **Copy AI Report:** Generate comprehensive analysis
4. **Auto-refresh:** Updates every second

### Expected Performance Metrics

| Scenario | Before Fix | After Fix | Improvement |
|----------|------------|-----------|-------------|
| Initial Load | 76-90 renders | 2-4 renders | 95% ↓ |
| Typing Lag | 250-287ms | 2-5ms | 98% ↓ |
| Unmount/Remount | Every keystroke | Never | 100% ↓ |
| API Calls (dev) | 2x duplicates | 2x (Strict Mode) | Normal |
| API Calls (prod) | 2x duplicates | 1x | 50% ↓ |

## Bundle Optimization

**Code Splitting Strategy**:
- Route-based splitting with Next.js App Router
- Component-based splitting for heavy admin features
- Dynamic imports for conditional components

**Asset Optimization**:
- WebP format with JPEG fallbacks
- SVG icons for crisp scalability
- Font optimization with `next/font`
- Image lazy loading with `priority` hints

## React Strict Mode Behavior

**Important:** 2x renders and API calls in development is **NORMAL** and **EXPECTED**.

```javascript
// next.config.mjs
export default {
  reactStrictMode: true, // ✅ KEEP ENABLED - catches bugs
};
```

**What happens in Strict Mode:**
1. Component mounts → API call #1
2. Strict Mode unmounts (cleanup)
3. Strict Mode remounts → API call #2

**Benefits:**
- Catches memory leaks
- Finds missing cleanup functions
- Detects side effects in render
- Improves production reliability

**Note:** Only affects development. Production has single renders.

## Best Practices Checklist

### Code Review Checklist
- [ ] **Dependencies are primitive values only** (no objects/arrays in useMemo)
- [ ] **Context providers aren't nested unnecessarily**
- [ ] **React Query select functions don't create new references**
- [ ] **Components use explicit keys for dynamic rendering**
- [ ] **Expensive operations are memoized**
- [ ] **Event handlers use useCallback**
- [ ] **Props comparison functions in React.memo only check primitives**

### Performance Investigation Workflow
1. **Enable debug monitoring** on suspected component
2. **Reproduce the issue** with monitoring active
3. **Check render counts** in debug menu
4. **Review "Why Did You Update"** for prop changes
5. **Check parent components** for unstable references
6. **Apply fixes** (memoization, primitive dependencies)
7. **Verify improvements** with performance metrics

### Common Performance Anti-Patterns
- ❌ `useMemo(() => <Component />, [objectProp])` - Object in deps
- ❌ `<Context.Provider value={{data, update}}>` - New object every render
- ❌ `select: (data) => ({processed: data.map()})` - New references
- ❌ Nested context providers of same type
- ❌ Inline object creation in JSX props

## Production Considerations

### What Changes in Production
- **No Strict Mode:** Single renders, single API calls
- **Build Optimizations:** Minified code, tree shaking, code splitting
- **Expected Performance:** 95-98% faster than unoptimized version

### Monitoring in Production
```typescript
// Only enable in development
if (process.env.NODE_ENV === 'development') {
  useRenderMonitor('ComponentName', props);
}
```

## Related Documentation

- [Performance Monitoring Guide](../performance-monitoring-guide.md) - Detailed monitoring setup
- [React Query Caching](./04-react-query-caching.md) - Query optimization patterns
- [Component Architecture](./05-component-architecture-styling.md) - Best practices
- [Debug Configuration](../debug-configuration.md) - Debug system setup

---

**[← Previous: Responsive Design & Theming](10-responsive-design-theming.md)** | **[Next: Development Guidelines →](12-development-guidelines.md)**
