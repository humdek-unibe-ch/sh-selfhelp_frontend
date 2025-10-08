# Memory Updates

## Loading States Rule - No isLoading for Main Page Content

**Date**: Current Session

**Rule**: `isLoading` states should NOT be used for main page content loading. Remove all loading spinners and "Loading..." messages from primary page content.

**When to Use isLoading**:
- ✅ **Buttons** - Show loading state on action buttons (Save, Delete, Submit, etc.)
- ✅ **Modals/Dialogs** - Show loading state in modal dialogs
- ✅ **Specific Components** - When explicitly requested for specific UI elements
- ❌ **Main Page Content** - Never show loading spinners for main page content
- ❌ **Section Lists** - Never show "Loading sections..." messages
- ❌ **Page Content** - Never show "Loading page..." messages

**Implementation Pattern**:
```typescript
// ❌ BAD - Don't do this for main page content
if (isLoading) {
  return <Loader />;
}

// ✅ GOOD - Show content immediately, handle empty states gracefully
if (error) {
  return <ErrorMessage />;
}

if (!data || data.length === 0) {
  return <EmptyState />;
}

return <Content />;
```

**Rationale**: Users should see content immediately without loading interruptions. React Query's `keepPreviousData` and proper caching should handle smooth transitions. Loading states should only be used for specific actions or when explicitly requested.

## Centralized Lookups Pattern for Scheduled Jobs Filters

**Date**: Current Session

**Pattern**: Use centralized `/admin/lookups` API endpoint for all filter dropdowns instead of separate API calls.

**Key Components**:

1. **Utility Functions** (`src/utils/lookup-filters.utils.ts`):
   - `filterLookupsByType(lookups, typeCode)` - Generic function to filter lookups by type_code
   - `getScheduledJobStatuses(lookups)` - Gets statuses with type_code 'scheduledJobsStatus'
   - `getScheduledJobTypes(lookups)` - Gets job types with type_code 'jobTypes'
   - `getScheduledJobSearchDateTypes(lookups)` - Gets date types with type_code 'scheduledJobsSearchDateTypes'
   - `getLookupsWithFallback(lookups, typeCode, fallbackData)` - Generic function with fallback

2. **Lookup Type Codes**:
   - `scheduledJobsStatus` - For job statuses (Queued, Done, Failed, Deleted)
   - `jobTypes` - For job types (Task, Email, Notification)
   - `scheduledJobsSearchDateTypes` - For date type filters (date_create, date_to_be_executed, date_executed)

3. **Implementation Pattern**:
   ```typescript
   // Use centralized lookups hook
   const { data: lookupsData, isLoading: lookupsLoading } = useLookups();
   
   // Process lookups for filters
   const statusOptions = lookupsData ? getScheduledJobStatuses(lookupsData.lookups) : [];
   const typeOptions = lookupsData ? getScheduledJobTypes(lookupsData.lookups) : [];
   const dateTypeOptions = lookupsData ? getScheduledJobSearchDateTypes(lookupsData.lookups) : [];
   
   // Use in Select components with fallback
   data={lookupsLoading ? [] : (statusOptions.length > 0 ? statusOptions : fallbackData)}
   ```

**Benefits**:
- Single API call instead of multiple separate calls
- Consistent data structure across all filters
- Reusable utility functions for other components
- Better performance and caching
- Centralized data management

**Usage**: This pattern should be used for all filter dropdowns that need lookup data, not just scheduled jobs. The utility functions can be extended for other lookup types as needed.

## Global Styling Rule - Mantine Components and Module CSS

**Date**: Current Session

**Rule**: Always use Mantine UI v8 components for styling. If custom styles are needed, create module CSS files (.module.css) for component-specific styling.

**Key Principles**:
- ✅ **Primary**: Use Mantine UI v8 components and their built-in styling props
- ✅ **Secondary**: Create `.module.css` files for component-specific custom styles
- ❌ **Never**: Use inline styles except for dynamic positioning/layout
- ❌ **Never**: Use global CSS classes outside of component modules
- ❌ **Never**: Use Tailwind CSS classes directly (use Mantine equivalents)

**Implementation Pattern**:
```typescript
// ✅ GOOD - Use Mantine components with props
<Stack gap="md" align="center">
  <Card withBorder shadow="sm">
    <Text size="lg" fw={600}>Title</Text>
  </Card>
</Stack>

// ✅ GOOD - Custom styles in module CSS
import classes from './Component.module.css';

<div className={classes.customLayout}>
  <Button className={classes.customButton}>Click me</Button>
</div>

// ❌ BAD - Inline styles (except for dynamic values)
<div style={{ marginTop: 16, padding: 8 }}>

// ❌ BAD - Global CSS classes
<div className="my-global-class">
```

**Benefits**:
- Consistent theming across the application
- Better maintainability with component-scoped CSS
- Leverage Mantine's comprehensive component library
- Easier responsive design with Mantine's built-in breakpoints
- Better TypeScript support and intellisense

**File Structure**:
```
src/components/
├── ComponentName/
│   ├── ComponentName.tsx
│   └── ComponentName.module.css  // Always create if custom styles needed
```

**Usage**: This rule applies to all new components and when modifying existing ones. Always prefer Mantine components over custom CSS implementations. 