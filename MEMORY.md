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