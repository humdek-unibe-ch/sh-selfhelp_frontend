# Frontend Architecture

# Frontend Development Log

## Navigation System Implementation & UI Optimization (Latest Update)

### Overview
Implemented a comprehensive navigation system that fetches page data from the API and organizes it into different navigation contexts for header menus and footer links. Additionally, optimized all UI components to use Mantine UI v7 components with minimal Tailwind CSS for better theming and customization.

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

**Design Features:**
- Uses Mantine's `UnstyledButton`, `Group`, `Text`, and `Menu` components
- Proper hover states and accessibility
- Theme-friendly styling through Mantine props

#### 3. Enhanced `WebsiteFooter` Component (`src/app/components/website/WebsiteFooter.tsx`)
- **Mantine Components**: Replaced all custom Tailwind with Mantine components
- **Container & Stack**: Used for proper layout and spacing
- **Anchor Component**: Used for links with proper styling
- **Divider**: Added visual separation between sections

#### 4. Layout Integration (`src/app/[[...slug]]/layout.tsx`)
- **AppShell Integration**: Replaced custom flex layout with Mantine's AppShell
- **Header/Footer Structure**: Proper header and footer integration
- **Theme Consistency**: Better integration with Mantine's theme system

#### 5. Enhanced `WebsiteHeader` Component (`src/app/components/website/WebsiteHeader.tsx`)
- **Mantine Layout**: Replaced custom Tailwind with Mantine's Flex and Group components
- **Container**: Used Mantine Container for consistent spacing
- **Removed Custom Classes**: Eliminated all custom Tailwind styling

### UI Component Optimization Rules (NEW)

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
6. `architecture.md` - Updated with navigation system, React Query, and UI component rules
7. `frontend.md` - This documentation file

### Technical Decisions
- **Component Composition**: Used separate `MenuItem` component for better maintainability
- **API Response Usage**: Used existing `children` property instead of manual filtering
- **Mantine First**: Prioritized Mantine components over custom Tailwind styling
- **AppShell Layout**: Used Mantine's AppShell for better theme integration
- **Performance Strategy**: Used React Query select for optimal data transformation caching
- **Theme Strategy**: Leveraged Mantine's theme system for consistent and customizable styling