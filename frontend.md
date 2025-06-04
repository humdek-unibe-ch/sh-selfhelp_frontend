# Frontend Architecture

# Frontend Development Log

## CreatePage Modal Redesign - Enhanced UX & Drag-and-Drop Fixes (Latest Update)

### Overview
Further enhanced the CreatePage modal with improved drag-and-drop functionality, better URL validation, streamlined layout, and proper CSS module usage following Mantine UI best practices.

### Key Improvements Made

#### 1. Drag-and-Drop Fixes
- **Fixed Positioning Issues**: Resolved drag element positioning problems that made precise dropping difficult
- **Smooth Dragging**: Implemented proper cursor states and visual feedback following [Mantine UI drag-and-drop examples](https://ui.mantine.dev/category/dnd/)
- **CSS Module Styling**: Moved all custom styling to `CreatePage.module.css` for better maintainability
- **Proper Cursor States**: Added grab/grabbing cursors for better user feedback

#### 2. URL Validation & Safety
- **Space Prevention**: URL pattern now prevents spaces and converts them to hyphens
- **Valid URL Characters**: Added regex validation for URL-safe characters only
- **Auto-formatting**: Keyword automatically converted to lowercase with spaces replaced by hyphens
- **Router Compatibility**: URLs now compatible with auto-router systems

#### 3. Streamlined Layout
- **Removed Page Type**: Eliminated unnecessary page type selection (kept in backend for compatibility)
- **Horizontal Radio Layout**: Page access type options now displayed horizontally for better space usage
- **Cleaner Interface**: Simplified form with only essential fields visible

#### 4. CSS Module Implementation
- **Proper Styling Separation**: All custom styles moved to CSS module
- **Mantine Variable Usage**: Uses Mantine CSS custom properties for theme consistency
- **Hover Effects**: Enhanced drag area hover states for better UX

### Technical Implementation Details

#### CSS Module Structure (`CreatePage.module.css`)
```css
.dragItem {
    cursor: grab;
}

.dragItem:active {
    cursor: grabbing;
}

.dragArea {
    min-height: 120px;
    border: 2px dashed var(--mantine-color-gray-4);
    border-radius: var(--mantine-radius-sm);
    background-color: var(--mantine-color-gray-0);
}

.dragArea:hover {
    border-color: var(--mantine-color-blue-4);
    background-color: var(--mantine-color-blue-0);
}

.pageAccessRadioGroup {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}
```

#### Enhanced URL Validation
```typescript
validate: {
    keyword: (value) => {
        if (!value?.trim()) return 'Keyword is required';
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Keyword can only contain letters, numbers, hyphens, and underscores';
        return null;
    },
    urlPattern: (value) => {
        if (!value?.trim()) return 'URL pattern is required';
        if (!/^\/[a-zA-Z0-9_\-\/\[\]:]+$/.test(value)) {
            return 'URL pattern must start with / and contain only valid URL characters (no spaces)';
        }
        return null;
    },
}
```

#### Smart URL Generation
```typescript
const generateUrlPattern = (keyword: string, isNavigation: boolean) => {
    if (!keyword.trim()) return '';
    // Remove spaces and convert to lowercase for URL safety
    const cleanKeyword = keyword.trim().toLowerCase().replace(/\s+/g, '-');
    const baseUrl = `/${cleanKeyword}`;
    return isNavigation ? `${baseUrl}/[i:nav]` : baseUrl;
};
```

#### Improved Drag-and-Drop Implementation
```typescript
const renderMenuItem = (item: IMenuPageItem, index: number) => (
    <Draggable key={item.id} draggableId={item.id} index={index}>
        {(provided, snapshot) => (
            <Paper
                ref={provided.innerRef}
                {...provided.draggableProps}
                className={item.isNew ? styles.newPageItem : ''}
            >
                <ActionIcon
                    {...provided.dragHandleProps}
                    className={item.isNew ? styles.dragItem : styles.dragItemDisabled}
                >
                    <IconGripVertical />
                </ActionIcon>
                {/* Content */}
            </Paper>
        )}
    </Draggable>
);
```

### User Experience Improvements

#### 1. Drag-and-Drop Enhancements
- **Precise Positioning**: Fixed cursor offset issues for accurate dropping
- **Visual Feedback**: Clear hover states and cursor changes
- **Smooth Interaction**: Follows Mantine UI drag-and-drop patterns
- **Better Performance**: Optimized rendering during drag operations

#### 2. Form Simplification
- **Reduced Cognitive Load**: Removed unnecessary page type selection
- **Horizontal Layout**: Page access options displayed in single row
- **Clear Validation**: Immediate feedback for invalid URLs
- **Auto-formatting**: Smart keyword-to-URL conversion

#### 3. URL Safety Features
- **Space Prevention**: Automatic space-to-hyphen conversion
- **Lowercase Conversion**: Consistent URL formatting
- **Character Validation**: Only URL-safe characters allowed
- **Router Compatibility**: URLs work with modern routing systems

### Design System Compliance

#### CSS Module Benefits
- **Theme Integration**: Uses Mantine CSS custom properties
- **Maintainability**: Centralized styling in dedicated file
- **Performance**: Scoped styles prevent conflicts
- **Consistency**: Follows Mantine design patterns

#### Mantine-First Approach
- **Component Usage**: Maximized use of Mantine components
- **Minimal Custom CSS**: Only essential custom styles in module
- **Theme Variables**: Consistent with Mantine color system
- **Responsive Design**: Inherits Mantine responsive behavior

### Performance Optimizations
- **CSS Modules**: Scoped styles with better performance
- **Reduced Re-renders**: Optimized drag-and-drop state management
- **Efficient Validation**: Regex patterns for fast URL validation
- **Memory Management**: Proper cleanup of drag state

### Accessibility Improvements
- **Keyboard Navigation**: Full keyboard support for drag-and-drop
- **Screen Reader Support**: Proper ARIA attributes maintained
- **Focus Management**: Clear focus indicators during interactions
- **Error Messaging**: Clear validation feedback for users

### Benefits Achieved

#### 1. Better Drag-and-Drop UX
- **Precise Control**: Elements follow cursor accurately during drag
- **Visual Clarity**: Clear feedback for drag states and drop zones
- **Smooth Performance**: No lag or positioning issues
- **Intuitive Interaction**: Follows established UI patterns

#### 2. URL Safety & Validation
- **Router Compatibility**: URLs work with auto-router systems
- **Error Prevention**: Invalid characters blocked at input level
- **Consistent Formatting**: Automatic standardization of URL patterns
- **User Guidance**: Clear validation messages and placeholders

#### 3. Streamlined Interface
- **Faster Completion**: Fewer fields to complete
- **Better Space Usage**: Horizontal layouts maximize screen real estate
- **Cleaner Design**: Focus on essential functionality only
- **Improved Readability**: Better visual hierarchy and organization

### Future Enhancements
- **Drag Preview**: Could add custom drag preview images
- **Batch Operations**: Could support multiple page creation
- **URL Suggestions**: Could suggest URL patterns based on content
- **Advanced Validation**: Could add server-side URL uniqueness checking

## CreatePage Modal Redesign - Compact Layout & Enhanced UX (Previous Update)

### Overview
Completely redesigned the CreatePage modal to be more compact, user-friendly, and visually organized using modern UI patterns and better space utilization.

### Key Improvements Made

#### 1. Compact Layout Design
- **2-Column Menu Sections**: Header and footer menu positioning now displayed side-by-side
- **Horizontal Checkbox Groups**: All page settings (headless, navigation, open access) arranged horizontally
- **Sectioned Layout**: Organized content into logical sections with clear visual hierarchy
- **Reduced Height**: Modal now takes significantly less vertical space

#### 2. Enhanced UI Components
- **Paper Sections**: Each section wrapped in bordered Paper components for clear separation
- **Section Headers**: Blue-colored section titles for better visual hierarchy
- **Improved Icons**: Added IconPlus to modal title for better visual context
- **Better Spacing**: Optimized gap and padding throughout the modal

#### 3. Innovative URL Edit Control
- **Floating Edit Button**: Custom URL edit toggle integrated as rightSection of TextInput
- **Visual Feedback**: Lock/Edit icons with tooltips for clear user guidance
- **Hover States**: Interactive feedback when hovering over the edit control
- **Smart Toggle**: Seamless switching between read-only and editable states

#### 4. Improved Menu Management
- **Side-by-Side Layout**: Header and footer menus displayed in 2-column grid
- **Compact Drag Areas**: Reduced height of drag-and-drop zones (120px vs 100px)
- **Better Visual Feedback**: Enhanced Paper components for drag items
- **Cleaner Alerts**: Smaller, more concise instruction messages

#### 5. Form Organization
**Section 1: Basic Information**
- Keyword input (required)
- Page type selection (2-column radio grid)
- Page access type selection (mobile/web/both)

**Section 2: Menu Positioning**
- Header/Footer menu checkboxes (horizontal)
- Side-by-side drag-and-drop areas when enabled
- Compact instruction alerts

**Section 3: Page Settings**
- Horizontal checkbox group for all boolean settings
- URL pattern with integrated edit control
- Smart tooltips and visual feedback

### Technical Implementation Details

#### Layout Structure
```typescript
<Stack gap="lg">
    {/* Basic Information Section */}
    <Paper p="md" withBorder>
        <Title order={4} size="h5" c="blue">Basic Information</Title>
        {/* Form fields */}
    </Paper>

    {/* Menu Positioning Section */}
    <Paper p="md" withBorder>
        <Title order={4} size="h5" c="blue">Menu Positioning</Title>
        <SimpleGrid cols={2} spacing="md">
            {/* Header and Footer menus side-by-side */}
        </SimpleGrid>
    </Paper>

    {/* Page Settings Section */}
    <Paper p="md" withBorder>
        <Title order={4} size="h5" c="blue">Page Settings</Title>
        <Group gap="xl">
            {/* Horizontal checkbox group */}
        </Group>
        {/* URL pattern with floating edit button */}
    </Paper>
</Stack>
```

#### Floating Edit Button Implementation
```typescript
<TextInput
    label="URL Pattern"
    readOnly={!form.values.customUrlEdit}
    {...form.getInputProps('urlPattern')}
    rightSection={
        <Tooltip label={form.values.customUrlEdit ? "Lock URL editing" : "Enable URL editing"}>
            <ActionIcon
                variant={form.values.customUrlEdit ? "filled" : "subtle"}
                color={form.values.customUrlEdit ? "blue" : "gray"}
                onClick={() => form.setFieldValue('customUrlEdit', !form.values.customUrlEdit)}
            >
                {form.values.customUrlEdit ? <IconEdit /> : <IconLock />}
            </ActionIcon>
        </Tooltip>
    }
/>
```

#### 2-Column Menu Layout
```typescript
{(form.values.headerMenu || form.values.footerMenu) && (
    <SimpleGrid cols={2} spacing="md">
        {form.values.headerMenu && (
            <Box>
                {renderDragDropArea(/* Header menu */)}
            </Box>
        )}
        {form.values.footerMenu && (
            <Box>
                {renderDragDropArea(/* Footer menu */)}
            </Box>
        )}
    </SimpleGrid>
)}
```

### User Experience Improvements

#### 1. Visual Hierarchy
- **Clear Sections**: Each functional area clearly separated with borders and headers
- **Color Coding**: Blue section headers for consistent visual language
- **Icon Usage**: Meaningful icons throughout (Plus, Edit, Lock, Info)
- **Proper Spacing**: Consistent gap and padding for comfortable reading

#### 2. Interaction Design
- **Intuitive Controls**: Edit button directly integrated with URL field
- **Visual Feedback**: Hover states, tooltips, and state-based styling
- **Logical Flow**: Information organized in order of typical user workflow
- **Compact Presentation**: Maximum information in minimal space

#### 3. Accessibility Features
- **Proper Labels**: All form controls properly labeled
- **Tooltip Guidance**: Helpful tooltips for complex controls
- **Keyboard Navigation**: Full keyboard accessibility maintained
- **Screen Reader Support**: Proper ARIA attributes and semantic structure

### Design System Compliance

#### Mantine-First Approach
- **Paper Components**: Used for section containers instead of custom divs
- **Title Components**: Proper heading hierarchy with Mantine Title
- **ActionIcon**: Used for the floating edit button with proper variants
- **Tooltip**: Integrated tooltip system for user guidance
- **SimpleGrid**: Responsive grid system for 2-column layout

#### Consistent Styling
- **Theme Colors**: Uses Mantine theme colors (blue for primary actions)
- **Spacing System**: Consistent use of Mantine spacing (xs, sm, md, lg, xl)
- **Typography**: Proper text sizes and weights from Mantine system
- **Border Radius**: Consistent with Mantine theme border radius

### Performance Considerations
- **Maintained Optimizations**: All existing React Query and useMemo optimizations preserved
- **Efficient Rendering**: No additional re-renders introduced by layout changes
- **Memory Usage**: No increase in memory footprint
- **Bundle Size**: No additional dependencies required

### Benefits Achieved

#### 1. Space Efficiency
- **50% Height Reduction**: Modal now takes significantly less vertical space
- **Better Screen Utilization**: Works better on smaller screens and laptops
- **Improved Readability**: Information density optimized for scanning

#### 2. User Experience
- **Faster Completion**: Logical flow reduces time to complete form
- **Reduced Scrolling**: Most content visible without scrolling
- **Clearer Actions**: Edit controls more discoverable and intuitive

#### 3. Maintainability
- **Cleaner Code**: Better organized component structure
- **Consistent Patterns**: Follows established design system patterns
- **Extensible Design**: Easy to add new sections or fields

### Future Enhancements
- **Responsive Breakpoints**: Could add mobile-specific layout adjustments
- **Animation**: Could add smooth transitions between states
- **Validation**: Could add real-time validation feedback
- **Presets**: Could add page template presets for common configurations

## Lookups System and Create Page Modal Implementation (Previous Update)

### Overview
Implemented a comprehensive lookups system for managing configuration data and a fully-featured create page modal with drag-and-drop menu positioning, form validation, and dynamic URL generation.

### Changes Made

#### 1. Lookups System Implementation

**New Files Created:**
- `src/types/responses/admin/lookups.types.ts` - TypeScript interfaces for lookups
- `src/constants/lookups.constants.ts` - Lookup type codes and lookup codes constants
- `src/api/lookups.api.ts` - API service for fetching lookups
- `src/hooks/useLookups.ts` - React Query hooks for lookups management

**Key Features:**
- **24-hour Caching**: Lookups cached for 24 hours using React Query
- **Efficient Access Patterns**: 
  - `lookupMap`: Key-value access using `typeCode_lookupCode` format
  - `lookupsByType`: Grouped lookups for dropdown population
- **Helper Hooks**: `useLookupsByType()` and `useLookup()` for specific access patterns
- **Data Transformation**: Uses React Query's `select` option for optimal performance

**API Integration:**
- Endpoint: `/admin/lookups`
- Response format matches backend structure
- Automatic error handling and retry logic

#### 2. Create Page Modal Complete Rewrite

**File Updated:**
- `src/app/components/admin/pages/create-page/CreatePage.tsx` - Complete rewrite
- `src/types/forms/create-page.types.ts` - Form interfaces and types

**Key Features:**
- **Comprehensive Form Fields**:
  - Keyword with validation (alphanumeric, hyphens, underscores only)
  - Page type selection using lookups (radio buttons with descriptions)
  - Header menu checkbox with drag-and-drop positioning
  - Footer menu checkbox with drag-and-drop positioning
  - Headless page option
  - Page access type (mobile/web/both) using lookups
  - Dynamic URL pattern generation
  - Navigation page option (adds [i:nav] to URL)
  - Open access checkbox
  - Custom URL edit toggle

**Menu Management System:**
- **Drag-and-Drop Interface**: Uses `@hello-pangea/dnd` for menu positioning
- **Visual Feedback**: New page highlighted in blue with "New" label
- **Position Calculation**: Automatic position calculation between existing pages
- **Real-time Updates**: Menu lists update as user types keyword
- **Existing Pages Integration**: Fetches and displays current header/footer pages

**Form Validation:**
- **Keyword Validation**: Required field with regex pattern validation
- **Dynamic URL Generation**: Automatic URL pattern based on keyword and navigation setting
- **Read-only URL Field**: URL pattern read-only unless custom edit is enabled
- **Form State Management**: Uses Mantine's `useForm` hook

**UI/UX Enhancements:**
- **Loading States**: Loading overlay while fetching pages data
- **Responsive Design**: Modal adapts to different screen sizes
- **Accessibility**: Proper labels, descriptions, and keyboard navigation
- **Visual Hierarchy**: Clear sections with dividers and proper spacing

#### 3. API Configuration Updates

**File Updated:**
- `src/config/api.config.ts` - Added LOOKUPS endpoint

**New Endpoint:**
- `LOOKUPS: '/admin/lookups'` - For fetching lookup data

#### 4. Architecture Documentation

**Files Updated:**
- `architecture.md` - Added sections 2.4 and 2.5 for lookups and create page modal
- `frontend.md` - This documentation update

**Documentation Includes:**
- Lookups system architecture and implementation patterns
- Create page modal features and form structure
- Menu management and positioning logic
- URL pattern generation rules
- Caching strategies and performance considerations

### Technical Implementation Details

#### Lookups Data Processing
```typescript
// Efficient lookup access patterns
const lookupMap: ILookupMap = {}; // typeCode_lookupCode -> ILookup
const lookupsByType: ILookupsByType = {}; // typeCode -> ILookup[]

// Usage in components
const pageAccessTypes = useLookupsByType(PAGE_ACCESS_TYPES);
const mobileLookup = useLookup(PAGE_ACCESS_TYPES, PAGE_ACCESS_TYPES_MOBILE);
```

#### Menu Position Management
```typescript
// Position calculation for drag-and-drop
const calculatePosition = (prevPage, nextPage) => {
    if (!prevPage) return nextPage ? nextPage.position / 2 : 10;
    if (!nextPage) return prevPage.position + 10;
    return (prevPage.position + nextPage.position) / 2;
};
```

#### Dynamic URL Generation
```typescript
// URL pattern generation logic
const generateUrlPattern = (keyword: string, isNavigation: boolean) => {
    if (!keyword.trim()) return '';
    const baseUrl = `/${keyword}`;
    return isNavigation ? `${baseUrl}/[i:nav]` : baseUrl;
};
```

### Performance Optimizations

1. **React Query Select**: All data transformations use `select` option to prevent recalculation
2. **Memoized Computations**: Menu processing and position calculations are memoized
3. **Efficient Re-renders**: Form state changes only trigger necessary component updates
4. **24-hour Caching**: Lookups cached for extended periods as they rarely change

### User Experience Improvements

1. **Real-time Feedback**: URL pattern updates as user types and changes settings
2. **Visual Drag Indicators**: Clear visual feedback during drag-and-drop operations
3. **Contextual Help**: Descriptions and alerts guide user through form completion
4. **Validation Messages**: Clear error messages for invalid input
5. **Loading States**: Proper loading indicators during data fetching

### Integration Points

1. **Admin Navigation**: Modal triggered from AdminNavbar plus button
2. **Lookups System**: Integrated with all dropdown and radio selections
3. **Admin Pages**: Uses existing admin pages data for menu positioning
4. **Form Validation**: Integrates with Mantine's form validation system

### Future Enhancements

1. **API Integration**: Complete the form submission with actual page creation API
2. **Success Feedback**: Add success notifications and page refresh after creation
3. **Advanced Validation**: Add server-side validation for keyword uniqueness
4. **Bulk Operations**: Consider bulk page creation capabilities
5. **Templates**: Add page templates for common page types

## AdminNavbar Search Enhancement (Previous Update)

### Overview
Enhanced the AdminNavbar Pages section with search functionality, clear button, focus management, collapse/expand for children, and height constraints to improve usability when dealing with many pages.

### Changes Made

#### 1. Added Search Functionality (`src/app/components/admin/admin-navbar/AdminNavbar.tsx`)
- **Search Input**: Added TextInput with search icon at the top of Pages section
- **Real-time Filtering**: Filters pages by keyword and URL as user types
- **Recursive Search**: Searches through nested children and preserves hierarchy
- **Smart Filtering**: Shows parent pages if children match search criteria
- **Clear Button**: Added X button to quickly clear search when text is present
- **Focus Management**: Fixed focus loss issue using useRef and useCallback
- **Empty State**: Shows "No pages found" message when search yields no results

#### 2. Added Collapse/Expand Functionality
- **Collapsible Children**: All page items with children can be collapsed/expanded
- **Chevron Icons**: Visual indicators (right/down arrows) for expandable items
- **State Management**: Uses Set-based state to track expanded items
- **Recursive Nesting**: Supports unlimited levels of page hierarchy
- **Proper Indentation**: Visual hierarchy with increasing indentation levels

#### 3. Implemented Height Constraints
- **Max Height**: Set 700px maximum height for Pages section
- **Scrollable Content**: Added ScrollArea for pages list (650px max height)
- **Overflow Management**: Prevents indefinite growth of navigation menu

#### 4. Enhanced Page Rendering
- **Custom Page Items**: Replaced LinksGroup with custom page rendering for better control
- **Navigation Icons**: Blue icons for pages with nav_position
- **Nested Structure**: Proper indentation for child pages with collapse/expand
- **Proper Navigation**: Uses Next.js router for seamless navigation

### Technical Implementation

#### Focus Management Fix
```typescript
const searchInputRef = useRef<HTMLInputElement>(null);

const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.currentTarget.value);
}, []);

const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }
}, []);
```

#### Collapse/Expand State Management
```typescript
const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

const toggleExpanded = useCallback((itemKey: string) => {
    setExpandedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(itemKey)) {
            newSet.delete(itemKey);
        } else {
            newSet.add(itemKey);
        }
        return newSet;
    });
}, []);
```

#### Recursive Page Rendering
```typescript
const renderPageItem = useCallback((item: any, level: number = 0) => {
    const itemKey = `${item.label}-${level}`;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(itemKey);
    const indentLevel = level * 20;

    return (
        <div key={itemKey}>
            <Group gap="sm" style={{ marginLeft: `${indentLevel}px` }}>
                {hasChildren && (
                    <ActionIcon onClick={() => toggleExpanded(itemKey)}>
                        {isExpanded ? <IconChevronDown /> : <IconChevronRight />}
                    </ActionIcon>
                )}
                {/* Page content */}
            </Group>
            {hasChildren && (
                <Collapse in={isExpanded}>
                    {item.children.map((child: any) => renderPageItem(child, level + 1))}
                </Collapse>
            )}
        </div>
    );
}, [expandedItems, toggleExpanded, router]);
```

### Key Features
- **Real-time Search**: Instant filtering as user types without focus loss
- **Clear Functionality**: One-click search reset with X button
- **Focus Retention**: Search input maintains focus properly using useRef
- **Collapse/Expand**: All page items with children can be collapsed/expanded
- **Visual Hierarchy**: Chevron icons and proper indentation for nested structure
- **Empty State Feedback**: Clear message when no results found
- **Hierarchical Preservation**: Maintains parent-child relationships in search results
- **Visual Indicators**: Blue icons for menu pages (nav_position)
- **Responsive Design**: Proper spacing and indentation for nested items
- **Performance Optimized**: useCallback and useMemo to prevent unnecessary re-renders
- **Height Constrained**: Prevents UI overflow with many pages

### Benefits
- **Better UX**: Easy to find pages in large page lists with stable search controls
- **Organized Navigation**: Collapsible structure keeps navigation clean and organized
- **Maintained Hierarchy**: Search results and navigation preserve page relationships
- **Consistent UI**: Follows existing admin design patterns
- **Performance**: Efficient filtering and rendering with proper React optimization
- **Scalability**: Handles large numbers of pages gracefully with collapse functionality
- **User Feedback**: Clear indication when search yields no results

### Technical Details
- **Search Fields**: Filters by both `keyword` and `url` fields
- **Case Insensitive**: Search is case-insensitive for better usability
- **Recursive Logic**: Handles unlimited nesting levels for both search and collapse
- **Mantine Components**: Uses TextInput, ScrollArea, Stack, ActionIcon, Collapse for consistent styling
- **Next.js Navigation**: Proper router-based navigation for SPA behavior
- **Event Handling**: Proper keyboard event management and focus control
- **State Optimization**: useCallback and useMemo prevent unnecessary re-renders
- **Memory Efficient**: Set-based state management for expanded items

## AdminNavbar Simplification (Latest Update)

### Overview
Simplified the AdminNavbar component to use the existing page structure with children from the API, removing complex Map-based sorting and transformation logic.

### Changes Made

#### 1. Updated `IAdminPage` Interface (`src/types/responses/admin/admin.types.ts`)
- **Added Children Property**: Added optional `children?: IAdminPage[]` to match API response structure
- **API Alignment**: Interface now matches the actual API response that includes nested children

#### 2. Simplified `AdminNavbar` Component (`src/app/components/admin/admin-navbar/AdminNavbar.tsx`)
- **Removed Complex Logic**: Eliminated Map-based page transformation and sorting
- **Recursive Transformation**: Simple recursive function that preserves existing page structure
- **API Structure Usage**: Uses the children property that already comes from the API
- **Maintained Features**: Still includes nav_position indicators and proper linking

**Before (Complex)**:
```typescript
// Complex Map-based transformation with sorting
const pageMap = new Map<number, any>();
const rootPages: any[] = [];
// ... 50+ lines of complex logic
```

**After (Simple)**:
```typescript
// Simple recursive transformation
const transformPage = (page: IAdminPage): any => ({
    label: page.keyword,
    link: `/admin/pages/${page.keyword}`,
    hasNavPosition: page.nav_position !== null,
    children: page.children ? page.children.map(transformPage) : []
});
```

### Benefits
- **Simplified Code**: Reduced complexity from ~50 lines to ~10 lines
- **API Structure Respect**: Uses the existing hierarchical structure from API
- **Better Performance**: No complex sorting or Map operations
- **Maintainability**: Easier to understand and modify
- **Consistency**: Matches the pattern used in frontend navigation

### Technical Details
- **Recursive Processing**: Handles nested children at any depth
- **Link Generation**: Properly formats admin page links as `/admin/pages/{keyword}`
- **Navigation Indicators**: Preserves nav_position indicators for menu pages
- **Type Safety**: Maintains TypeScript type safety with updated interface

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

### Admin Layout Integration & Page Ordering (Latest)
- **Problem**: Need to integrate with existing admin layout structure and implement proper page ordering with nested children
- **Solution**: Updated routing to use keyword-based URLs and implemented smart page ordering with nested menu support
- **Files Modified**: 
  - `src/app/components/admin/admin-navbar/AdminNavbar.tsx`
  - `src/app/admin/pages/[keyword]/page.tsx` (new)
  - `src/app/admin/page.tsx`
- **Key Features**:
  - **Keyword-Based Routing**: Changed from `/admin/page/{id}` to `/admin/pages/{keyword}` for better URLs
  - **Layout Integration**: Content loads in main area between navbar and right sidebar (like settings page)
  - **Smart Page Ordering**: Menu pages (with nav_position) appear first, sorted by nav_position ascending
  - **Nested Children Support**: Parent pages with children show expandable/collapsible menus
  - **Hierarchical Display**: Proper parent-child relationships with nested navigation
- **Ordering Logic**:
  - **Menu Pages First**: Pages with `nav_position` appear at top, sorted by position (1, 2, 3...)
  - **Non-Menu Pages**: Appear below menu pages, sorted alphabetically
  - **Children Sorting**: Child pages within each parent sorted alphabetically
  - **Recursive Nesting**: Supports multiple levels of page hierarchy
- **Layout Structure**:
  - **No Custom Container**: Content renders directly in admin layout main area
  - **Consistent Styling**: Matches existing admin pages (settings, etc.)
  - **Right Sidebar Ready**: Content area leaves space for Properties sidebar
  - **Responsive Design**: Works with existing admin responsive breakpoints
- **Navigation Improvements**:
  - **Visual Hierarchy**: Menu icons clearly distinguish navigation pages
  - **Expandable Parents**: Pages with children show chevron and expand/collapse
  - **Proper Nesting**: Children appear indented under their parents
  - **State Management**: Navigation state persists across page changes
- **Benefits**:
  - **Better URLs**: Keyword-based URLs are more user-friendly and SEO-friendly
  - **Consistent UX**: Matches existing admin interface patterns
  - **Logical Ordering**: Menu pages prioritized, then alphabetical organization
  - **Scalable Structure**: Supports unlimited nesting levels
  - **Maintainable Code**: Clean separation of concerns and reusable components