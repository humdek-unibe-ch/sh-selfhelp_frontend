# CMS Preferences and Timezones Guide

## Overview

This guide covers the CMS preferences system and timezone management functionality in the SelfHelp frontend application. The system allows administrators to configure global CMS settings and users to manage their timezone preferences.

## CMS Preferences

### System Preferences

CMS preferences are global settings that affect the entire CMS system behavior. These preferences are managed through the admin panel and apply to all users and frontend functionality.

#### Available Preferences

| Preference | Type | Description | Required Permissions |
|------------|------|-------------|---------------------|
| `default_language_id` | number | Default language ID for the CMS | `admin.cms_preferences.read/write` |
| `anonymous_users` | boolean | Enable access for non-authenticated users | `admin.cms_preferences.read/write` |
| `firebase_config` | string (JSON) | Firebase configuration in JSON format | `admin.cms_preferences.read/write` |

#### API Endpoints

```typescript
// Get current CMS preferences
GET /admin/cms-preferences

// Update CMS preferences
PUT /admin/cms-preferences
```

#### React Hooks

```typescript
import { useCmsPreferences, useUpdateCmsPreferences } from '@/hooks/usePreferences';

// Fetch current preferences
const { data: preferences, isLoading, error } = useCmsPreferences();

// Update preferences
const updateMutation = useUpdateCmsPreferences();
updateMutation.mutate({
    default_language_id: 1,
    anonymous_users: false,
    firebase_config: '{"apiKey": "..."}'
});
```

#### Preference Details

##### Callback API Key
- **Purpose**: Used for external service integrations that require API authentication
- **Validation**: Free-form string, no specific format required
- **Usage**: Automatically included in callback requests to external services

##### Default Language
- **Purpose**: Sets the fallback language when user language is not available
- **Validation**: Must be a valid language ID from the languages table
- **Usage**: Used when rendering content for anonymous users or when user language preference is not set

##### Anonymous Users
- **Purpose**: Controls whether non-authenticated users can access the CMS
- **Validation**: Boolean value
- **Usage**: When enabled, allows public access to pages; when disabled, requires authentication

##### Firebase Configuration
- **Purpose**: Stores Firebase SDK configuration for push notifications and other Firebase services
- **Validation**: Must be valid JSON format
- **Usage**: Parsed and used to initialize Firebase SDK in the frontend

### Implementation Files

#### API Layer
- `src/api/admin/preferences.api.ts` - API client for preferences operations
- `src/types/responses/admin/preferences.types.ts` - TypeScript types (if separate from API file)

#### Frontend Components
- `src/app/components/cms/preferences/preferences-page/PreferencesPage.tsx` - Admin preferences UI
- `src/hooks/usePreferences.ts` - React Query hooks for preferences management

#### Permissions
- `admin.cms_preferences.read` - View preferences
- `admin.cms_preferences.update` - Modify preferences

## Timezone Management

### User Timezone Preferences

Unlike CMS preferences, timezones are managed at the user level and stored as part of the user's profile. Each authenticated user can set their preferred timezone for date/time display.

#### Timezone Structure

```typescript
interface IUserTimezone {
    id: number | null;           // Timezone lookup ID
    lookupCode: string | null;   // Timezone code (e.g., "UTC", "America/New_York")
    lookupValue: string | null;  // Display name (e.g., "UTC", "Eastern Time")
}
```

#### API Endpoints

```typescript
// Update user timezone
PUT /auth/user/timezone
Body: { timezone_id: number }

// Get user data (includes timezone)
GET /auth/user-data
```

#### Timezone Lookups

Timezones are stored as lookup values in the backend. Available timezones can be fetched through:

```typescript
// Get all lookups (includes timezones)
GET /admin/lookups
```

The timezone lookup type is typically identified by the `typeCode` field in the response.

#### React Hooks

```typescript
import { useUpdateTimezoneMutation } from '@/hooks/mutations/useProfileMutations';

// Update user timezone
const updateTimezoneMutation = useUpdateTimezoneMutation();
updateTimezoneMutation.mutate({ timezoneId: 1 });
```

### Timezone vs CMS Preferences

| Aspect | CMS Preferences | User Timezones |
|--------|----------------|----------------|
| Scope | Global system settings | Per-user preference |
| Access | Admin panel only | User profile/settings |
| Permissions | `admin.cms_preferences.*` | No special permissions |
| Storage | Database preferences table | User profile data |
| Caching | React Query with static data config | User data cache |

## Implementation Guidelines

### Adding New Preferences

1. **Update API Types**:
   ```typescript
   export interface ICMSPreferences {
       // existing fields...
       new_preference?: string;
   }
   ```

2. **Update API Client**:
   - Add new field to the interface
   - Ensure proper validation in the update method

3. **Update Frontend Component**:
   - Add new form field in `PreferencesPage.tsx`
   - Handle validation and state management

4. **Add Permissions** (if admin-only):
   - Update permission constants in `jwt-payload.types.ts`
   - Add to API endpoint permissions

### Timezone Integration

When implementing timezone-aware features:

1. **Always use user timezone for display**:
   ```typescript
   const userTimezone = userData?.timezone?.lookupValue || 'UTC';
   ```

2. **Convert dates for display**:
   ```typescript
   // Use a date formatting library that supports timezones
   const formattedDate = formatInTimeZone(date, userTimezone, 'yyyy-MM-dd HH:mm:ss');
   ```

3. **Store dates in UTC**:
   - Always store dates in UTC in the database
   - Convert to user timezone only for display

## Best Practices

### Preferences Management
- Validate JSON fields (like Firebase config) on the frontend
- Use proper error handling for API failures
- Provide clear user feedback for preference changes
- Cache preferences appropriately (they change infrequently)

### Timezone Handling
- Default to UTC when user timezone is not set
- Use timezone-aware date libraries (e.g., `date-fns-tz`)
- Consider daylight saving time implications
- Test with different timezone scenarios

### Security Considerations
- CMS preferences may contain sensitive data (API keys)
- Ensure proper permission checks on the backend
- Validate Firebase config format to prevent injection
- Log preference changes for audit purposes

## Troubleshooting

### Common Issues

**Preferences not loading**:
- Check network connectivity
- Verify admin permissions
- Check browser console for API errors

**Timezone not updating**:
- Ensure user is authenticated
- Check that timezone ID is valid
- Verify user data cache is invalidated after update

**Firebase config validation errors**:
- Ensure JSON is properly formatted
- Check for missing required fields
- Validate Firebase project configuration

### Debug Information

Enable debug mode to see:
- API request/response details
- Cache invalidation events
- Permission check results
- Timezone conversion logs

## Future Enhancements

### Planned Features
- Bulk preference updates
- Preference change history/audit
- Timezone auto-detection
- Regional timezone groups
- Preference templates per environment

### Extension Points
- Custom preference validators
- Preference change hooks
- Timezone-specific formatting rules
- Multi-timezone support for scheduled content
