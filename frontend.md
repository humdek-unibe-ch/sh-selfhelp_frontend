# Frontend Architecture

# Frontend Development Log

## Navigation System Implementation & UI Optimization (Latest Update)

### Overview
Implemented a comprehensive navigation system that fetches page data from the API and organizes it into different navigation contexts for header menus and footer links. Additionally, optimized all UI components to use Mantine UI v7 components with minimal Tailwind CSS for better theming and customization. Fixed critical interface mismatch causing 404 errors for existing pages.

### Changes Made

#### 1. Updated `useAppNavigation` Hook (`src/hooks/useAppNavigation.ts`)
- **Enhanced Return Structure**: Now returns organized data with `pages`, `menuPages`, and `footerPages`
- **Smart Filtering**: Automatically filters and sorts pages based on their navigation properties
- **Type Safety**: Added proper TypeScript interface `INavigationData` for return type
- **Caching**: Uses TanStack React Query with 1-second stale time for optimal performance
- **OPTIMIZATION**: Uses React Query's `select` option to transform data once and cache results

**Key Features:**
- `menuPages`: Pages with `nav_position` (already ordered from API)
- `footerPages`: Pages with `footer_position` (sorted by position value, smallest first)
- Filters out headless pages (`is_headless: 1`)
- **Performance**: Data transformations are cached and only recalculated when source data changes

#### 2. Enhanced `WebsiteHeaderMenu` Component (`src/app/components/website/WebsiteHeaderMenu.tsx`)
- **Fixed Children Usage**: Now uses existing `children` property from API response instead of manual filtering
- **Mantine Components**: Replaced custom Tailwind classes with Mantine UI components
- **UnstyledButton**: Used for better theme integration and accessibility
- **Simplified Logic**: Removed redundant filtering since children are already sorted in API response
- **Interface Fix**: Updated to use correct field names (`id` instead of `id_pages`, `parent_page_id` instead of `parent`)

**Design Features:**
- Uses Mantine's `UnstyledButton`, `Group`, `Text`, and `Menu` components
- Proper hover states and accessibility
- Theme-friendly styling through Mantine props

#### 3. Enhanced `WebsiteFooter` Component (`src/app/components/website/WebsiteFooter.tsx`)
- **Mantine Components**: Replaced all custom Tailwind with Mantine components
- **Container & Stack**: Used for proper layout and spacing
- **Anchor Component**: Used for links with proper styling
- **Divider**: Added visual separation between sections
- **Interface Fix**: Updated to use correct field names

#### 4. Layout Integration (`src/app/[[...slug]]/layout.tsx`)
- **AppShell Integration**: Replaced custom flex layout with Mantine's AppShell
- **Header/Footer Structure**: Proper header and footer integration
- **Theme Consistency**: Better integration with Mantine's theme system

#### 5. Enhanced `WebsiteHeader` Component (`src/app/components/website/WebsiteHeader.tsx`)
- **Mantine Layout**: Replaced custom Tailwind with Mantine's Flex and Group components
- **Container**: Used Mantine Container for consistent spacing
- **Removed Custom Classes**: Eliminated all custom Tailwind styling

#### 6. Fixed Page Routing Logic (`src/app/[[...slug]]/page.tsx`) - CRITICAL FIX
- **Removed Navigation Dependency**: Fixed 404 errors by removing dependency on navigation pages for existence checking
- **API-Based Existence**: Now relies on page content API response for determining if page exists
- **Proper Error Handling**: Uses API error status codes to determine 404 vs other errors
- **Mantine Loading**: Added proper loading states using Mantine components

#### 7. Updated Interface (`src/types/responses/frontend/frontend.types.ts`) - CRITICAL FIX
- **API Response Alignment**: Updated interface to match actual API response structure
- **Field Name Corrections**: Changed `parent` to `parent_page_id`, `id_pages` to `id`, etc.
- **Boolean Types**: Updated `is_headless` from `0 | 1` to `boolean`
- **Simplified Structure**: Removed unused fields and aligned with actual API

### Critical Bug Fixes

#### 404 Error Resolution
**Problem**: Pages like `/task1` were showing 404 even though they existed in the API
**Root Cause**: 
1. Interface mismatch between API response and TypeScript interface
2. Page existence logic was checking navigation pages instead of actual page content API

**Solution**:
1. Updated interface to match actual API response structure
2. Changed page existence logic to rely on page content API response
3. Updated all components to use correct field names

#### Interface Alignment
**Before**: 
```typescript
interface IPageItem {
    id_pages: number;
    parent: number | null;
    is_headless: 0 | 1;
    // ... other mismatched fields
}
```

**After**:
```typescript
interface IPageItem {
    id: number;
    parent_page_id: number | null;
    is_headless: boolean;
    // ... aligned with API response
}
```

### UI Component Optimization Rules

#### Critical Rule
**Minimize custom Tailwind CSS and maximize Mantine UI v7 components for better theming and customization.**

#### Mantine First Principles
- **Use Mantine Components**: Always prefer Mantine components over custom HTML elements
- **Mantine Props**: Use Mantine's built-in props for styling (size, color, variant, etc.)
- **Minimal Tailwind**: Only use Tailwind for layout utilities when Mantine doesn't provide equivalent
- **Theme Integration**: Leverage Mantine's theme system for consistent styling

#### Benefits
- **Theme Consistency**: Automatic theme integration and customization
- **User Customization**: Easier for users to apply custom themes
- **Maintenance**: Centralized styling through Mantine's theme system
- **Accessibility**: Built-in accessibility features in Mantine components
- **Performance**: Optimized component rendering and styling

### React Query Optimization Rules

#### Critical Rule
**Always use React Query's `select` option for data transformations to prevent recalculation on every render.**

#### Implementation Pattern
```typescript
const { data } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
    select: (rawData) => {
        // Transform data once and cache the result
        return {
            filtered: rawData.filter(condition),
            sorted: rawData.sort(compareFn),
            mapped: rawData.map(transformFn)
        };
    }
});
```

#### Benefits
- **Performance**: Transformations are cached and only recalculated when source data changes
- **Memory**: Prevents creating new objects on every render
- **Consistency**: Ensures transformed data remains stable across renders
- **Debugging**: Easier to track data flow and transformations

### API Integration
The system integrates with the existing API structure:
- **Endpoint**: Uses existing `NavigationApi.getPages()` method
- **Response Structure**: Handles the complete API response with envelope structure
- **Error Handling**: Proper error states and fallbacks
- **Caching**: Optimized with React Query for performance

### Design System Considerations
- **Theming Ready**: All components use Mantine UI components and props
- **Customizable**: Easy to modify through Mantine's theme system
- **Consistent**: Follows Mantine design patterns
- **Accessible**: Built-in accessibility features from Mantine components

### Performance Optimizations
- **React Query Caching**: 1-second stale time prevents unnecessary API calls
- **Select Optimization**: Data transformations cached using React Query's select
- **Mantine Components**: Optimized rendering and styling
- **Conditional Rendering**: Components only render when data is available
- **Optimized Re-renders**: Proper dependency management

### Future Enhancements
- **Multi-level Nesting**: Can be extended to support deeper menu hierarchies
- **Custom Themes**: Theme system can be expanded for user customization
- **Animation Library**: Can integrate with Framer Motion for advanced animations
- **Mobile Menu**: Can add mobile hamburger menu for better mobile experience

### Files Modified/Created
1. `src/hooks/useAppNavigation.ts` - Enhanced navigation hook with React Query select optimization
2. `src/app/components/website/WebsiteHeaderMenu.tsx` - Updated to use children and Mantine components
3. `src/app/components/website/WebsiteFooter.tsx` - Converted to use Mantine components
4. `src/app/components/website/WebsiteHeader.tsx` - Converted to use Mantine components
5. `src/app/[[...slug]]/layout.tsx` - Updated to use Mantine AppShell
6. `src/app/[[...slug]]/page.tsx` - Fixed page existence logic and error handling
7. `src/types/responses/frontend/frontend.types.ts` - Updated interface to match API response
8. `architecture.md` - Updated with navigation system, React Query, and UI component rules
9. `frontend.md` - This documentation file

### Technical Decisions
- **Component Composition**: Used separate `MenuItem` component for better maintainability
- **API Response Usage**: Used existing `children` property instead of manual filtering
- **Mantine First**: Prioritized Mantine components over custom Tailwind styling
- **AppShell Layout**: Used Mantine's AppShell for better theme integration
- **Performance Strategy**: Used React Query select for optimal data transformation caching
- **Theme Strategy**: Leveraged Mantine's theme system for consistent and customizable styling
- **Error Handling**: Separated page existence logic from navigation logic for better reliability
- **Interface Alignment**: Ensured TypeScript interfaces match actual API responses

# Frontend Development Documentation

## Navigation System Implementation

### Overview
The navigation system fetches page data from API and organizes it into different categories for various UI components. It uses React Query for efficient data fetching and caching.

### Key Components

#### `useAppNavigation` Hook
- **Location**: `src/hooks/useAppNavigation.ts`
- **Purpose**: Unified hook for fetching and managing navigation data
- **Features**:
  - Uses React Query's `select` option for data transformation caching
  - Flattens all pages (including children) into routes array
  - Separates pages into categories: `pages`, `menuPages`, `footerPages`, `routes`
  - Stores transformed data in `window.__NAVIGATION_DATA__` for debugging

#### Data Structure
```typescript
interface INavigationData {
    pages: IPageItem[];        // All pages from API
    menuPages: IPageItem[];    // Pages with nav_position (sorted)
    footerPages: IPageItem[];  // Pages with footer_position (sorted)
    routes: IPageItem[];       // Flattened array of ALL pages for route checking
}
```

#### Page Existence Logic
- Uses flattened `routes` array to check if a page exists
- Includes all pages and their children recursively
- Prevents 404 errors for valid nested pages

### UI Components

#### `WebsiteHeaderMenu`
- **Location**: `src/app/components/website/WebsiteHeaderMenu.tsx`
- **Features**: Nested dropdown support using Mantine components
- **Data Source**: `menuPages` from `useAppNavigation`

#### `WebsiteFooter`
- **Location**: `src/app/components/website/WebsiteFooter.tsx`
- **Features**: Proper Mantine styling and responsive design
- **Data Source**: `footerPages` from `useAppNavigation`

### Performance Optimizations

#### React Query Select
- Uses `select` option to transform data once and cache results
- Prevents recalculation on every render
- Improves performance for complex data transformations

#### Mantine-First Approach
- Minimizes custom Tailwind CSS
- Maximizes Mantine UI v7 components for better theming
- Enables user customization through Mantine's theme system

## Debug System

### Overview
Comprehensive debug system with flag-based configuration for development and testing environments.

### Key Features

#### Debug Configuration
- **Location**: `src/config/debug.config.ts`
- **Purpose**: Centralized debug feature management
- **Environment-based**: Automatically enables in development, configurable for production

#### Debug Logger
- **Location**: `src/utils/debug-logger.ts`
- **Features**:
  - Structured logging with levels (debug, info, warn, error)
  - Component-based logging for better traceability
  - Performance timing utilities
  - Log storage and export functionality
  - Memory management (max 1000 logs)

#### Debug Menu
- **Location**: `src/app/components/common/debug/DebugMenu.tsx`
- **Features**:
  - Central debug control panel
  - Real-time log viewer
  - Configuration display
  - Log export/clear functionality
  - Tabbed interface for different debug aspects

#### Debug Components
- **Folder**: `src/app/components/common/debug/`
- **Components**:
  - `DebugMenu`: Main debug control panel
  - `NavigationDebug`: Navigation data inspector
  - Extensible for additional debug tools

### Usage Examples

#### Debug Logging
```typescript
import { debug, info, warn, error } from '../utils/debug-logger';

debug('Debug message', 'ComponentName', optionalData);
info('Info message', 'ComponentName');
warn('Warning message', 'ComponentName');
error('Error message', 'ComponentName', errorObject);
```

#### Component Debug Checks
```typescript
import { isDebugEnabled, isDebugComponentEnabled } from '../config/debug.config';

if (isDebugComponentEnabled('navigationDebug')) {
    // Debug-specific code
}
```

### Environment Configuration
Debug features can be controlled via environment variables:
- `NEXT_PUBLIC_DEBUG=true` - Master debug flag
- `NEXT_PUBLIC_DEBUG_LOGGING=true` - Enable logging
- `NEXT_PUBLIC_DEBUG_NAV=true` - Enable navigation debug
- See `docs/debug-configuration.md` for complete list

## Bug Fixes and Technical Decisions

### Interface Alignment Issue (Fixed)
- **Problem**: Interface mismatch between API response and TypeScript interface
- **Solution**: Updated interface to match actual API field names
- **Impact**: Fixed 404 errors for existing pages

### Page Existence Logic (Fixed)
- **Problem**: Checking navigation pages instead of actual page content
- **Solution**: Use flattened routes array for comprehensive page checking
- **Impact**: Proper route validation for all pages including nested ones

### Performance Optimization
- **Implementation**: React Query `select` option for data transformation
- **Benefit**: Prevents unnecessary recalculations on every render
- **Rule**: Always use `select` for data transformations in React Query

### UI Architecture
- **Decision**: Mantine-first approach over custom Tailwind
- **Reasoning**: Better theming, user customization, and component consistency
- **Implementation**: Maximize Mantine UI v7 components, minimize custom CSS

## Development Guidelines

### React Query Usage
- Always use `select` option for data transformations
- Cache transformed data to prevent recalculation
- Use appropriate stale times for different data types

### Debug System Usage
- Use structured logging with component names
- Enable appropriate debug levels for different environments
- Export logs for analysis when needed

### Component Organization
- Debug components in `src/app/components/common/debug/`
- Flag-based enabling/disabling of debug features
- Extensible architecture for additional debug tools

### Testing Considerations
- Debug logging can be enabled for test debugging
- Environment-based configuration for different test scenarios
- Log export functionality for test analysis

## Architecture Notes

### Data Flow
1. API call via `NavigationApi.getPages`
2. React Query caching and transformation via `select`
3. Data distribution to UI components via `useAppNavigation`
4. Route checking via flattened routes array

### Debug Flow
1. Configuration check via `isDebugEnabled`/`isDebugComponentEnabled`
2. Structured logging via debug logger
3. Log storage and management
4. UI display via debug menu components

### Performance Considerations
- React Query select optimization
- Memory management for debug logs
- Conditional rendering of debug components
- Efficient data transformation and caching

## Recent Changes and Improvements

### Token Refresh Duplicate Prevention (Latest)
- **Problem**: Multiple concurrent API calls were triggering duplicate refresh token requests
- **Solution**: Implemented centralized refresh state management with request queuing
- **Files Modified**: `src/api/base.api.ts`, `src/providers/auth.provider.ts`
- **Key Features**:
  - Single refresh guarantee using shared state
  - Request queue management for concurrent requests
  - Preserved both admin (strict) and frontend (lenient) authentication modes
  - Comprehensive debug logging for troubleshooting
- **Documentation**: `docs/token-refresh-solution.md`

### AuthButton Stability Fix (Latest)
- **Problem**: AuthButton was flickering between "Login" and "Profile" during token refresh
- **Root Cause**: Refine's `useIsAuthenticated` hook was too reactive during token refresh process
- **Solution**: Implemented stable authentication state management
- **Files Modified**: `src/app/components/auth/AuthButton.tsx`
- **Key Features**:
  - Stable auth state that doesn't flicker during refresh
  - Token-based authentication check (access_token OR refresh_token)
  - Storage event listeners for real-time token updates
  - Refresh state detection with visual feedback (opacity change)
  - Immediate UI update on logout for better UX
  - Comprehensive debug logging for auth state changes
- **Benefits**:
  - No more UI flickering during token refresh
  - Better user experience with stable authentication state
  - Visual feedback during refresh process
  - Proper error handling and state recovery

### Admin Pages List Implementation (Latest)
- **Problem**: Need to display admin pages in a nested, searchable list with proper state management
- **Solution**: Created comprehensive admin pages management system
- **Files Created/Modified**: 
  - `src/app/components/admin/pages/admin-pages-list/AdminPagesList.tsx`
  - `src/app/components/admin/pages/admin-pages-list/AdminPagesList.module.css`
  - `src/app/store/admin.store.ts`
  - `src/hooks/useAdminPages.ts`
  - `src/api/admin.api.ts`
  - `src/app/components/common/navbar-links-group/NavbarLinksGroup.tsx`
- **Key Features**:
  - **Nested Tree Structure**: Transforms flat API data into hierarchical tree
  - **Search Functionality**: Real-time filtering by keyword and URL
  - **State Management**: Zustand store for selected page state
  - **Mantine-First UI**: Minimal custom CSS, maximum Mantine components
  - **React Query Integration**: Optimized data fetching with select transformation
  - **Collapsible Navigation**: Expandable/collapsible parent pages
  - **Visual Feedback**: Selected state, hover effects, loading states
  - **Type Safety**: Full TypeScript integration with proper interfaces
- **UI Optimizations**:
  - Replaced custom CSS with Mantine theme variables
  - Used Mantine's built-in components (ThemeIcon, UnstyledButton, Collapse)
  - Implemented proper loading and error states
  - Added visual hierarchy with icons and indentation
- **Performance Features**:
  - React Query's `select` option for data transformation caching
  - Memoized tree building and filtering
  - Efficient state management with Zustand
- **Benefits**:
  - Clean, maintainable code structure
  - Consistent UI with Mantine design system
  - Proper separation of concerns
  - Scalable architecture for future features