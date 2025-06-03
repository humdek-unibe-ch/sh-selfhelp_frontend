# Frontend Architecture

# Frontend Development Log

## Navigation System Implementation (Latest Update)

### Overview
Implemented a comprehensive navigation system that fetches page data from the API and organizes it into different navigation contexts for header menus and footer links.

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
- **Nested Menu Support**: Properly handles parent-child page relationships
- **Improved Design**: Modern styling with hover effects and transitions
- **Loading States**: Skeleton loading component for better UX
- **Theme-Friendly**: Dark/light mode support with CSS custom properties
- **Responsive**: Mobile-first approach with proper breakpoints

**Design Features:**
- Hover-triggered dropdowns for nested pages
- Smooth transitions and animations
- Proper spacing and typography
- Icon integration with Tabler Icons

#### 3. New `WebsiteFooter` Component (`src/app/components/website/WebsiteFooter.tsx`)
- **Footer Navigation**: Displays pages with `footer_position`
- **Responsive Layout**: Centered layout with proper spacing
- **Loading States**: Skeleton component for loading state
- **Copyright Section**: Automatic year update
- **Conditional Rendering**: Only shows if footer pages exist

#### 4. Layout Integration (`src/app/[[...slug]]/layout.tsx`)
- **Footer Integration**: Added WebsiteFooter to the main layout
- **Flex Layout**: Implemented proper flex layout for sticky footer
- **Responsive**: Ensures footer stays at bottom on all screen sizes

### React Query Optimization Rules (NEW)

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
- **Theming Ready**: All components use CSS custom properties and Tailwind classes
- **Customizable**: Easy to modify colors, spacing, and typography
- **Consistent**: Follows established design patterns
- **Accessible**: Proper ARIA attributes and keyboard navigation support

### Performance Optimizations
- **React Query Caching**: 1-second stale time prevents unnecessary API calls
- **Select Optimization**: Data transformations cached using React Query's select
- **Skeleton Loading**: Improves perceived performance
- **Conditional Rendering**: Components only render when data is available
- **Optimized Re-renders**: Proper dependency management

### Future Enhancements
- **Multi-level Nesting**: Can be extended to support deeper menu hierarchies
- **Custom Themes**: Theme system can be expanded for user customization
- **Animation Library**: Can integrate with Framer Motion for advanced animations
- **Mobile Menu**: Can add mobile hamburger menu for better mobile experience

### Files Modified/Created
1. `src/hooks/useAppNavigation.ts` - Enhanced navigation hook with React Query select optimization
2. `src/app/components/website/WebsiteHeaderMenu.tsx` - Updated header menu
3. `src/app/components/website/WebsiteFooter.tsx` - New footer component
4. `src/app/[[...slug]]/layout.tsx` - Added footer integration with flex layout
5. `architecture.md` - Updated with navigation system and React Query optimization rules
6. `frontend.md` - This documentation file

### Technical Decisions
- **Component Composition**: Used separate `MenuItem` component for better maintainability
- **Prop Naming**: Renamed `children` to `childPages` to avoid React prop conflicts
- **Loading Strategy**: Implemented skeleton loading for better UX
- **Styling Approach**: Combined Mantine components with Tailwind utilities for flexibility
- **Performance Strategy**: Used React Query select for optimal data transformation caching