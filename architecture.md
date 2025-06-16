# Frontend Architecture Guidelines

## 1. Introduction

This document outlines the frontend architecture for the SH-Self-help project. The frontend is built using Next.js (App Router), React, Refine.dev, Mantine UI v7, Tailwind CSS, and TanStack React Query v5. The goal is to create a scalable, maintainable, and performant application by adhering to modern best practices.

## 2. Core Principles

*   **Modularity**: Break down the application into small, reusable, and independent modules/components.
*   **Separation of Concerns**: Keep UI, business logic, and data fetching concerns separate.
*   **React Server Components (RSC)**: Prioritize RSCs for improved performance. Minimize 'use client'.
*   **Declarative Programming**: Use declarative patterns, especially in JSX and state management.
*   **Type Safety**: Leverage TypeScript for robust and error-free code.
*   **Mobile-First Responsive Design**: Ensure the application looks and works well on all screen sizes.
*   **Performance**: Optimize for Web Vitals (LCP, CLS, FID).
*   **Accessibility (a11y)**: Build inclusive interfaces.

## 2.1. Section Management System (Latest Update)

### Comprehensive Section Operations
Implemented a complete section management system with full CRUD operations and advanced positioning capabilities.

#### New API Endpoints
Added 6 new API endpoints for section management:
- **Page-Section Operations**:
  - `POST /admin/pages/{pageKeyword}/sections` - Add section to page
  - `PUT /admin/pages/{pageKeyword}/sections/{sectionId}` - Update section in page
  - `DELETE /admin/pages/{pageKeyword}/sections/{sectionId}` - Remove section from page

- **Section-Section Operations**:
  - `POST /admin/sections/{parentSectionId}/sections` - Add section to section
  - `PUT /admin/sections/{parentSectionId}/sections/{childSectionId}` - Update section in section
  - `DELETE /admin/sections/{parentSectionId}/sections/{childSectionId}` - Remove section from section

#### React Query Mutations
Created comprehensive mutation hooks following the established pattern:

```typescript
// Page-Section mutations
useAddSectionToPageMutation()
useUpdateSectionInPageMutation()
useRemoveSectionFromPageMutation()

// Section-Section mutations  
useAddSectionToSectionMutation()
useUpdateSectionInSectionMutation()
useRemoveSectionFromSectionMutation()
```

#### Advanced Drag & Drop with Backend Integration
- **Real-time Position Updates**: Drag operations now trigger actual backend API calls
- **Smart Position Calculation**: Maintains 5, 15, 25, 35... positioning pattern
- **Hierarchical Movement**: Supports moving sections between pages and parent sections
- **Optimistic Updates**: UI updates immediately with proper error handling and rollback

#### Section Removal System
- **Context-Aware Removal**: Sections are removed from their current parent (page or section)
- **Parent ID Tracking**: System tracks parent relationships for proper API calls
- **Safe Operations**: Remove operations (not delete) preserve section data for potential restoration

#### Enhanced UI Components
- **Processing States**: Visual feedback during API operations
- **Error Handling**: Comprehensive error messages and notifications
- **Debug Integration**: Full debug logging for development and troubleshooting

#### Technical Implementation
```typescript
const handleSectionMove = async (moveData: IMoveData) => {
    const { draggedSectionId, newParentId, newPosition, pageKeyword } = moveData;
    
    const sectionUpdateData = { position: newPosition };

    if (newParentId === null) {
        // Moving to page level
        await updateSectionInPageMutation.mutateAsync({
            keyword: pageKeyword,
            sectionId: draggedSectionId,
            sectionData: sectionUpdateData
        });
    } else {
        // Moving to another section
        await updateSectionInSectionMutation.mutateAsync({
            parentSectionId: newParentId,
            childSectionId: draggedSectionId,
            sectionData: sectionUpdateData
        });
    }
};
```

#### Benefits
- ✅ **Full CRUD Operations**: Complete section management capabilities
- ✅ **Real Backend Integration**: All operations persist to database
- ✅ **Hierarchical Support**: Move sections between pages and parent sections
- ✅ **Position Management**: Intelligent position calculation and updates
- ✅ **Error Resilience**: Comprehensive error handling and user feedback
- ✅ **Debug Support**: Full logging for development and troubleshooting

## 2.2. Page Creation and Navigation System (Previous Update)

### API Schema Compliance (Latest)
Updated all page creation and update interfaces to match backend JSON schema validation requirements exactly.

#### Interface Structure Changes
**Create Page Interface**:
```typescript
export interface ICreatePageRequest {
    keyword: string;                    // Required - unique page identifier
    pageTypeId?: number;               // Optional - page type classification
    pageAccessTypeCode: string;        // Required - access control (was page_access_type_code)
    headless?: boolean;                // Optional - layout control (was is_headless)
    openAccess?: boolean;              // Optional - public access (was is_open_access)
    url?: string | null;               // Optional - URL path
    protocol?: string | null;          // Optional - HTTP methods (new field)
    navPosition?: number | null;       // Optional - header menu position (was nav_position)
    footerPosition?: number | null;    // Optional - footer menu position (was footer_position)
    parent?: number | null;            // Optional - parent page ID
}
```

**Update Page Interface** (Nested Structure):
```typescript
export interface IUpdatePageData {
    url?: string | null;
    protocol?: string | null;
    headless?: boolean;
    navPosition?: number | null;
    footerPosition?: number | null;
    openAccess?: boolean;
    pageAccessTypeCode?: string;       // Changed from pageAccessType
    parent?: number | null;
}

export interface IUpdatePageField {
    fieldId: number;                   // Field database ID
    languageId: number;                // Language database ID
    content: string | null;            // Field content (removed debug fields)
}

export interface IUpdatePageRequest {
    pageData: IUpdatePageData;         // Page properties
    fields: IUpdatePageField[];        // Field translations
}
```

#### Key Changes Made
1. **Property Name Standardization**: All properties now use camelCase consistently
2. **Nested Structure**: Update requests use proper nested structure for validation
3. **Null Safety**: Proper `| null` types for optional nullable fields
4. **Schema Compliance**: Exact match with backend JSON schema validation
5. **Clean Payloads**: Removed debugging fields from production API calls

#### Benefits
- ✅ **Backend Validation**: All requests pass JSON schema validation
- ✅ **Type Safety**: Full TypeScript validation for API requests
- ✅ **Consistency**: Uniform naming conventions across frontend
- ✅ **Maintainability**: Clear separation of concerns in nested structures

### Automatic Navigation After Page Creation
The page creation system now automatically navigates users to the newly created page for immediate editing and content management.

#### Implementation Details
- **Automatic Redirect**: After successful page creation, users are automatically redirected to `/admin/pages/{keyword}`
- **Modal Close Timing**: Modal closes before navigation to prevent UI conflicts
- **Debug Logging**: Comprehensive logging for navigation flow tracking

```typescript
const createPageMutation = useCreatePageMutation({
    onSuccess: (createdPage) => {
        debug('Page created successfully, navigating to page', 'CreatePageModal', {
            createdPage: createdPage.keyword,
            navigatingTo: `/admin/pages/${createdPage.keyword}`
        });
        
        form.reset();
        onClose();
        
        // Navigate after modal close
        setTimeout(() => {
            router.push(`/admin/pages/${createdPage.keyword}`);
        }, 100);
    }
});
```

### Enhanced Menu Positioning System
Fixed critical issues with menu positioning and duplication to ensure proper menu state management.

#### Issues Resolved
1. **Menu Duplication**: Pages no longer appear duplicated after reordering
2. **Position Accuracy**: Pages appear in their correct menu positions immediately
3. **Cache Synchronization**: Proper React Query cache invalidation prevents stale data

#### Technical Implementation
```typescript
// Enhanced cache invalidation strategy
await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['adminPages'] }),
    queryClient.invalidateQueries({ queryKey: ['pages'] }),
    queryClient.refetchQueries({ queryKey: ['adminPages'] }),
    queryClient.refetchQueries({ queryKey: ['pages'] }),
]);

// Clear stale cached data
queryClient.removeQueries({ queryKey: ['adminPages'], exact: false });
queryClient.removeQueries({ queryKey: ['pages'], exact: false });
```

#### Improved Position Calculation
- **Proper Spacing**: Menu items maintain consistent 10-unit spacing
- **Gap Detection**: Intelligent gap detection for optimal positioning
- **Boundary Handling**: Proper handling of first/last positions

```typescript
const calculateFinalPosition = (pages: IMenuPageItem[], targetIndex: number): number => {
    if (pages.length === 0) return 10;
    
    if (targetIndex === 0) {
        const firstPagePosition = pages[0].position;
        return Math.max(1, firstPagePosition - 10);
    } else if (targetIndex >= pages.length) {
        const lastPagePosition = pages[pages.length - 1].position;
        return lastPagePosition + 10;
    } else {
        const prevPage = pages[targetIndex - 1];
        const nextPage = pages[targetIndex];
        const gap = nextPage.position - prevPage.position;
        
        return gap > 2 
            ? Math.floor((prevPage.position + nextPage.position) / 2)
            : prevPage.position + 5;
    }
};
```

## 2.3. Navigation System Architecture

The application uses a centralized navigation system that fetches page data from the API and organizes it into different navigation contexts:

### Navigation Data Structure
- **pages**: All accessible pages for the current user (including non-logged-in users for public pages)
- **menuPages**: Pages with `nav_position` for header navigation (pre-sorted by API)
- **footerPages**: Pages with `footer_position` for footer navigation (sorted by `footer_position` value)

### Key Components
- **useAppNavigation Hook**: Centralized hook for fetching and organizing navigation data using TanStack React Query
- **WebsiteHeaderMenu**: Responsive header menu with nested dropdown support
- **WebsiteFooter**: Footer component displaying footer navigation links

### Design Principles
- Theme-friendly styling using CSS custom properties and Tailwind classes
- Support for dark/light mode transitions
- Responsive design with mobile-first approach
- Proper loading states with skeleton components
- Nested menu support with hover interactions

## 2.4. React Query Data Transformation Rules

**CRITICAL RULE**: Always use React Query's `select` option for data transformations to prevent recalculation on every render.

### When to Use Select
- **Data Filtering**: When filtering arrays based on conditions
- **Data Sorting**: When sorting data by specific criteria
- **Data Mapping**: When transforming data structure
- **Data Aggregation**: When combining or grouping data

### Implementation Pattern
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

### Benefits
- **Performance**: Transformations are cached and only recalculated when source data changes
- **Memory**: Prevents creating new objects on every render
- **Consistency**: Ensures transformed data remains stable across renders
- **Debugging**: Easier to track data flow and transformations

### Anti-Pattern (Avoid)
```typescript
// DON'T DO THIS - recalculates on every render
const { data } = useQuery(['data'], fetchData);
const filtered = data?.filter(condition) ?? [];
const sorted = filtered.sort(compareFn);
```

## 2.5. React Query Mutations - State-of-the-Art Data Manipulation

**CRITICAL RULE**: Always use React Query's `useMutation` for data manipulation operations (Create, Update, Delete). This is the state-of-the-art approach.

### Mutation Standards
- **All Data Manipulation**: Use mutations for POST, PUT, DELETE operations
- **Consistent Structure**: Follow standardized mutation hook patterns
- **Cache Invalidation**: Always invalidate related queries after mutations
- **Error Handling**: Use centralized error handling with notifications
- **Loading States**: Utilize built-in `isPending` states for UI feedback
- **TypeScript**: Full type safety for all mutation operations

### Implementation Pattern
```typescript
// Mutation Hook Structure
export function use[Entity][Action]Mutation(options = {}) {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (data) => [Entity]Api.[action](data),
        onSuccess: async (result) => {
            // Invalidate cache
            await queryClient.invalidateQueries({ queryKey: ['[entity]'] });
            // Show success notification
            // Call custom success handler
        },
        onError: (error) => {
            // Centralized error handling
            // Show error notification
            // Call custom error handler
        },
    });
}

// Component Usage
const createMutation = useCreateEntityMutation({
    onSuccess: () => { form.reset(); onClose(); }
});

const handleSubmit = (values) => {
    createMutation.mutate(values);
};
```

### Benefits
- **Declarative State Management**: Automatic loading, error, success states
- **Cache Synchronization**: Automatic cache invalidation and updates
- **Optimistic Updates**: Update UI immediately, rollback on failure
- **Consistent UX**: Standardized loading states and error handling
- **Developer Experience**: Excellent debugging with React Query DevTools

## 2.6. UI Component Rules - Mantine First Approach

**CRITICAL RULE**: Minimize custom Tailwind CSS and maximize Mantine UI v7 components for better theming and customization.

### Mantine First Principles
- **Use Mantine Components**: Always prefer Mantine components over custom HTML elements
- **Mantine Props**: Use Mantine's built-in props for styling (size, color, variant, etc.)
- **Minimal Tailwind**: Only use Tailwind for layout utilities when Mantine doesn't provide equivalent
- **Theme Integration**: Leverage Mantine's theme system for consistent styling

### Preferred Patterns

#### Layout and Structure
```typescript
// ✅ GOOD - Use Mantine layout components
<Container size="xl">
    <Stack gap="lg">
        <Group justify="space-between" align="center">
            <Text size="xl" fw={700}>Title</Text>
            <Button variant="filled">Action</Button>
        </Group>
    </Stack>
</Container>

// ❌ AVOID - Custom Tailwind classes
<div className="max-w-7xl mx-auto">
    <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Title</h1>
            <button className="bg-blue-500 text-white px-4 py-2">Action</button>
        </div>
    </div>
</div>
```

#### Typography
```typescript
// ✅ GOOD - Use Mantine Text component
<Text size="sm" c="dimmed" ta="center">
    Copyright text
</Text>

// ❌ AVOID - Custom classes
<p className="text-sm text-gray-500 text-center">
    Copyright text
</p>
```

#### Interactive Elements
```typescript
// ✅ GOOD - Use Mantine components
<UnstyledButton component={Link} href="/path">
    <Text size="sm" fw={500}>Link Text</Text>
</UnstyledButton>

// ❌ AVOID - Custom styled elements
<a href="/path" className="text-sm font-medium hover:text-blue-600">
    Link Text
</a>
```

### When Tailwind is Acceptable
- **Layout utilities**: `flex`, `grid` when Mantine doesn't provide equivalent
- **Spacing overrides**: Only when Mantine's spacing system is insufficient
- **Custom positioning**: `absolute`, `relative`, `fixed` positioning
- **Responsive breakpoints**: When used with Mantine's responsive props

### Benefits of Mantine First Approach
- **Theme Consistency**: Automatic theme integration and customization
- **User Customization**: Easier for users to apply custom themes
- **Maintenance**: Centralized styling through Mantine's theme system

## 2.7. Component Reusability Rules

**CRITICAL RULE**: Always extract components into separate reusable components if they are used in more than one place.

### Reusability Principles
- **Single Responsibility**: Each component should have one clear purpose
- **Prop-Based Configuration**: Use props to make components flexible and configurable
- **Consistent API**: Follow consistent patterns for prop naming and behavior
- **Documentation**: Include clear prop interfaces and usage examples

### Implementation Pattern
```typescript
// ✅ GOOD - Reusable component with clear interface
interface IReusableComponentProps {
    title: string;
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
    // ... other props
}

export function ReusableComponent({ 
    title, 
    enabled, 
    onEnabledChange,
    ...props 
}: IReusableComponentProps) {
    // Component implementation
}

// Usage in multiple places
<ReusableComponent 
    title="Header Menu" 
    enabled={headerEnabled}
    onEnabledChange={setHeaderEnabled}
/>
```

### Component Organization
- **UI Components**: Place in `src/app/components/ui/` for general-purpose components
- **Feature Components**: Place in feature-specific directories for domain components
- **Shared Logic**: Extract custom hooks for shared business logic
- **Type Definitions**: Create shared interfaces for component props

### Examples of Reusable Components
- **DragDropMenuPositioner**: Drag-and-drop menu positioning with smooth animations
- **LockedField**: Input fields with lock/unlock functionality
- **FieldLabelWithTooltip**: Labels with info tooltips for form fields
- **MenuPositionEditor**: Menu position management (deprecated - use DragDropMenuPositioner)

### Benefits
- **Code Reuse**: Eliminate duplication across the application
- **Consistency**: Ensure consistent behavior and styling
- **Maintainability**: Single source of truth for component logic
- **Testing**: Easier to test isolated, reusable components
- **Accessibility**: Built-in accessibility features in Mantine components
- **Performance**: Optimized component rendering and styling

### Migration Strategy
1. **Identify Custom Tailwind**: Find components using extensive Tailwind classes
2. **Replace with Mantine**: Use equivalent Mantine components and props
3. **Preserve Functionality**: Ensure all interactive behavior is maintained
4. **Test Theming**: Verify components work with different Mantine themes

## 2.8. Lookups System Architecture

The application uses a centralized lookups system for managing configuration data and dropdown options.

### Lookups Data Structure
- **ILookup**: Individual lookup item with id, typeCode, lookupCode, lookupValue, and lookupDescription
- **ILookupMap**: Key-value map using `typeCode_lookupCode` format for efficient access
- **ILookupsByType**: Grouped lookups by typeCode for dropdown population

### Key Components
- **LookupsApi**: API service for fetching lookup data
- **useLookups Hook**: React Query hook with 24-hour caching and data transformation
- **useLookupsByType**: Helper hook for getting lookups by specific type
- **useLookup**: Helper hook for getting specific lookup by type and code

### Lookup Constants
All lookup type codes and lookup codes are defined in `src/constants/lookups.constants.ts` for consistent access:
- Type codes: `PAGE_ACCESS_TYPES`, `PAGE_ACTIONS`, `NOTIFICATION_TYPES`, etc.
- Lookup codes: `PAGE_ACCESS_TYPES_MOBILE`, `PAGE_ACTIONS_SECTIONS`, etc.

### Implementation Pattern
```typescript
// Get lookups by type for dropdowns
const pageAccessTypes = useLookupsByType(PAGE_ACCESS_TYPES);

// Get specific lookup
const mobileLookup = useLookup(PAGE_ACCESS_TYPES, PAGE_ACCESS_TYPES_MOBILE);

// Use in Radio.Group with descriptions
<Radio.Group value={value} onChange={onChange}>
    {pageAccessTypes.map((type) => (
        <Radio
            key={type.lookupCode}
            value={type.lookupCode}
            label={
                <Box>
                    <Text size="sm">{type.lookupValue}</Text>
                    {type.lookupDescription && (
                        <Text size="xs" c="dimmed">{type.lookupDescription}</Text>
                    )}
                </Box>
            }
        />
    ))}
</Radio.Group>
```

### Caching Strategy
- **24-hour cache**: Lookups are cached for 24 hours as they rarely change
- **Data transformation**: Uses React Query's `select` option for efficient processing
- **Memory optimization**: Processed data structures prevent recalculation

## 2.9. Create Page Modal System

The create page modal provides a comprehensive interface for creating new pages with all necessary configuration options.

### Key Features
- **Form Validation**: Keyword validation with regex patterns
- **Dynamic URL Generation**: Automatic URL pattern generation based on keyword and navigation settings
- **Menu Position Management**: Drag-and-drop interface for header and footer menu positioning
- **Lookups Integration**: Uses lookups system for page types and access types
- **Real-time Updates**: Form fields update dynamically based on user input

### Form Structure
```typescript
interface ICreatePageFormValues {
    keyword: string;
    pageType: string;
    headerMenu: boolean;
    headerMenuPosition: number | null;
    footerMenu: boolean;
    footerMenuPosition: number | null;
    headlessPage: boolean;
    pageAccessType: string;
    urlPattern: string;
    navigationPage: boolean;
    openAccess: boolean;
    customUrlEdit: boolean;
}
```

### Menu Management
- **Header Menu**: Shows existing pages with nav_position, allows drag-and-drop positioning
- **Footer Menu**: Shows potential footer pages, allows drag-and-drop positioning
- **Visual Feedback**: New page highlighted in blue with drag handles
- **Position Calculation**: Automatic position calculation based on surrounding pages

### URL Pattern Logic
- **Basic Pattern**: `/{keyword}` for standard pages
- **Navigation Pattern**: `/{keyword}/[i:nav]` for navigation pages
- **Custom Edit**: Optional manual URL editing when enabled
- **Read-only Display**: Shows generated pattern when custom edit is disabled

## 2.10. Enhanced Page Creation System - Context-Aware Menu Filtering

**CRITICAL ENHANCEMENT**: The CreatePageModal now supports context-aware page creation with intelligent menu filtering based on page hierarchy.

### Context-Aware Page Creation
- **Root Page Creation**: When no parent is selected, shows only root-level pages (parent: null) in menu positioning
- **Child Page Creation**: When a parent page is selected, shows only sibling pages (children of the same parent) in menu positioning
- **Visual Context**: Modal title and alert clearly indicate whether creating root or child page

### Implementation Details
```typescript
// Enhanced Modal Props
interface ICreatePageModalProps {
    opened: boolean;
    onClose: () => void;
    parentPage?: IAdminPage | null; // New: Optional parent context
}

// Context-Aware Menu Processing
const processMenuPages = useMemo(() => {
    let pagesToProcess: IAdminPage[] = [];
    
    if (parentPage) {
        // Child page: show only siblings (children of parent)
        pagesToProcess = parentPage.children || [];
    } else {
        // Root page: show only root pages (parent: null)
        pagesToProcess = pages.filter(page => page.parent === null);
    }
    
    // Process filtered pages for menu positioning
}, [pages, parentPage]);
```

### Integration with Admin Store
- **Selected Page Context**: Uses `useSelectedPage()` from admin store to determine parent context
- **Automatic Parent Assignment**: Form automatically includes parent ID when creating child pages
- **Consistent UX**: Clear visual indicators for page creation context

### Benefits
- **Improved UX**: Users see only relevant pages for menu positioning
- **Reduced Confusion**: Clear separation between root and child page creation
- **Hierarchical Consistency**: Maintains proper page hierarchy structure
- **Context Awareness**: Modal adapts behavior based on selected parent page

### Usage Pattern
```typescript
// In AdminNavbar - passes selected page as parent context
<CreatePageModal 
    opened={isModalOpen} 
    onClose={() => setIsModalOpen(false)} 
    parentPage={selectedPage} // Current selected page becomes parent
/>
```

This enhancement ensures that page creation respects the hierarchical structure and provides users with contextually relevant menu positioning options.

## 2.11. Page Content Management System

**CRITICAL FEATURE**: Enhanced page content editing with dynamic field loading and proper form management.

### Page Content Architecture
- **Dynamic Field Loading**: Page fields are fetched from API based on selected page keyword
- **Content vs Properties Separation**: Fields with `display: true` are content fields, `display: false` are property fields
- **Locked Field Component**: Reusable component for keyword/URL editing with lock/unlock mechanism
- **Form State Management**: Mantine form with proper validation and state synchronization
- **Save Functionality**: Ctrl+S hotkey support with fixed save button

### Key Components
- **PageInspector**: Main component for editing page content and properties (renamed from PageContent for clarity)
- **LockedField**: Reusable component for fields that need lock/unlock functionality
- **Page Field Types**: Support for text, textarea, markdown-inline field types
- **Translation Support**: Handles multiple language translations for field content

### Implementation Features
```typescript
// Page Content Structure
interface IPageFormValues {
    // Page properties
    keyword: string;
    url: string;
    protocol: string;
    headless: boolean;
    navPosition: number | null;
    footerPosition: number | null;
    openAccess: boolean;
    pageAccessType: string;
    pageType: string;
    
    // Dynamic field values
    fields: Record<string, string>;
}

// Locked Field Component
<LockedField
    label="Keyword"
    initialLocked={true}
    lockedTooltip="Enable keyword editing"
    unlockedTooltip="Lock keyword editing"
    {...form.getInputProps('keyword')}
/>
```

### User Experience Features
- **Collapsible Sections**: Content and Properties sections can be collapsed/expanded
- **Fixed Save Button**: Always visible save button with scroll area for content
- **Keyboard Shortcuts**: Ctrl+S for save functionality
- **Delete Confirmation**: Type-to-confirm deletion with modal
- **Action Buttons**: Create child page and delete page functionality
- **Loading States**: Proper loading and error handling for API calls

### Benefits
- **Consistent UX**: Standardized editing interface across all pages
- **Safety Features**: Locked fields prevent accidental changes to critical properties
- **Efficient Workflow**: Keyboard shortcuts and fixed save button improve productivity
- **Data Integrity**: Proper form validation and confirmation dialogs prevent data loss

## 2.12. Page Sections Modular Architecture (Latest Update)

### Component Structure
The page sections interface has been restructured into a modular architecture with clear separation of concerns:

#### Core Components
1. **PageSections** - Main container component that handles data fetching and state management
2. **SectionsList** - Manages drag-and-drop context and section rendering
3. **PageSection** - Individual section wrapper with drag functionality
4. **SectionHeader** - Section header with drag handle, expand/collapse, and action buttons
5. **SectionChildrenArea** - Drop zone for child sections with visual feedback
6. **SectionDragOverlay** - Visual feedback during drag operations

#### Architecture Benefits
- **Separation of Concerns**: Each component has a single responsibility
- **Reusability**: Components can be used independently or combined
- **Maintainability**: Clear component boundaries make debugging easier
- **Performance**: Optimized rendering with minimal re-renders
- **Accessibility**: Proper drag-and-drop accessibility support

#### Component Hierarchy
```
PageSections (Main Container)
├── SectionsList (Drag Context)
    ├── PageSection (Individual Section)
        ├── SectionHeader (Header with Controls)
        └── SectionChildrenArea (Drop Zone)
            └── PageSection (Recursive Children)
    └── SectionDragOverlay (Drag Feedback)
```

#### Key Features
- **Smart Drag & Drop**: Parent sections automatically include all children when dragged
- **Conditional Functionality**: Only sections with `can_have_children: true` can accept drops
- **Visual Feedback**: Clear visual indicators for valid drop targets
- **Hierarchical Display**: Clean nested structure with proper indentation
- **Compact UI**: Optimized for space efficiency while maintaining clarity

#### Technical Implementation
```typescript
// Main container with state management
export function PageSections({ keyword }: PageSectionsProps) {
    const { data, isLoading, error } = usePageSections(keyword);
    const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
    
    return (
        <SectionsList
            sections={data.sections}
            expandedSections={expandedSections}
            onToggleExpand={handleToggleExpand}
            onSectionMove={handleSectionMove}
        />
    );
}

// Drag context with validation
export function SectionsList({ sections, onSectionMove }: SectionsListProps) {
    return (
        <DndContext onDragEnd={handleDragEnd}>
            <SortableContext items={allSectionIds}>
                {sections.map(section => (
                    <PageSection key={section.id} section={section} />
                ))}
            </SortableContext>
        </DndContext>
    );
}
```

#### Drag & Drop Logic
- **Library**: Uses `@hello-pangea/dnd` (maintained fork of react-beautiful-dnd) for smooth, accessible drag and drop
- **Flattened Structure**: Sections are flattened for drag operations while preserving visual hierarchy
- **Parent-Children Movement**: Dragging a parent automatically includes all descendants
- **Smart Validation**: Prevents circular references and invalid drops
- **Visual Feedback**: Clear drop zones with level-based styling and descriptive labels
- **Backend Integration**: Comprehensive logging for backend synchronization

#### Type Safety
All components use the consolidated `IPageField` interface from `pages.type.ts`, eliminating duplicate type definitions and ensuring consistency across the application.

## 3. Directory Structure

A clear directory structure is crucial for organization and scalability.

```
/
├── public/                     # Static assets (images, fonts, etc.)
├── src/
│   ├── app/                    # Next.js App Router: Pages and layouts
│   │   ├── (auth)/             # Route group for authentication pages
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (main)/             # Route group for main application pages
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── [keyword]/      # Dynamic route for content pages
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx      # Main application layout
│   │   ├── _components/        # Private components for specific routes/layouts in `app`
│   │   ├── api/                # Next.js API routes (if needed for BFF pattern)
│   │   ├── layout.tsx          # Root layout
│   │   └── global.css          # Global styles (Tailwind base, Mantine core)
│   ├── components/             # Shared, reusable UI components
│   │   ├── ui/                 # Generic UI elements (Button, Card, Modal etc.)
│   │   │   ├── button/
│   │   │   │   └── button.tsx
│   │   │   └── ...
│   │   ├── layout/             # Layout components (Navbar, Footer, Sidebar etc.)
│   │   │   ├── navbar/
│   │   │   │   └── navbar.tsx
│   │   │   └── ...
│   │   ├── forms/              # Form-related components
│   │   └── ...                 # Other shared component categories
│   ├── config/                 # Application configuration (constants, settings)
│   │   └── index.ts
│   ├── hooks/                  # Custom React hooks
│   │   └── use-example.ts
│   ├── lib/                    # Utility functions, helper modules
│   │   ├── query-client.ts     # TanStack Query client setup
│   │   ├── mantine-provider.tsx # Mantine theme and provider setup
│   │   └── utils.ts
│   ├── providers/              # React Context providers
│   │   └── theme-provider.tsx
│   ├── services/               # API interaction layer (data fetching functions)
│   │   ├── auth-service.ts
│   │   └── content-service.ts
│   ├── store/                  # Client-side state management (e.g., Zustand, if needed beyond URL state)
│   ├── styles/                 # Additional global styles or theme overrides
│   └── types/                  # TypeScript type definitions and interfaces
│       ├── index.ts
│       └── api.ts              # API response/request types
├── .env.local                  # Environment variables (local)
├── .eslintrc.json              # ESLint configuration
├── next.config.mjs             # Next.js configuration
├── package.json
├── postcss.config.js           # PostCSS configuration (for Tailwind)
├── tailwind.config.ts          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

**Key Points:**
*   **`src` directory**: Centralizes all source code.
*   **`app` directory**: For Next.js 13+ App Router. Route groups `(auth)` and `(main)` help organize sections without affecting URL paths.
*   **`components` directory**:
    *   **`ui`**: Dumb, presentational components.
    *   **`layout`**: Components defining page structure.
    *   Organize by feature or type as the application grows.
*   **`_components` (underscore prefix)**: For components co-located with routes/layouts that are not intended to be shared globally.
*   **`services` directory**: Houses functions that interact with the backend API. These functions will be used by TanStack React Query.

## 4. Component Strategy

*   **Functional Components**: Use functional components with TypeScript interfaces for props.
*   **Named Exports**: Prefer named exports for components.
*   **File Structure**:
    1.  Exported component (main component).
    2.  Sub-components (if any, used only by the main component).
    3.  Helper functions specific to the component.
    4.  Static content/data used by the component.
    5.  Type definitions/interfaces for the component's props and state.
*   **Naming**: `new-component.tsx` in `app/components/feature-or-type/new-component/`.
*   **Minimize `use client`**:
    *   Default to Server Components.
    *   Use `'use client'` only for components requiring interactivity, browser APIs, or React hooks like `useState`, `useEffect`.
    *   Keep client components small and push them to the leaves of the component tree.
    *   Wrap client components in `<Suspense>` with a fallback UI where appropriate.
*   **Dynamic Loading**: Use `next/dynamic` for non-critical components or large components to improve initial load time.
*   **Props Drilling vs. Context**: For deeply nested state, prefer React Context or a dedicated state management library over excessive props drilling. However, for server state, TanStack Query should be the primary tool.

## 5. State Management

*   **Server State**: Managed by **TanStack React Query (v5)**.
    *   Handles caching, background updates, stale-while-revalidate, mutations, etc.
    *   Centralize query keys and mutation functions.
*   **URL State**: Managed by **`nuqs`** for state that should be reflected in the URL (filters, sorting, pagination, tabs).
*   **Client State (UI State)**:
    *   **`useState` / `useReducer`**: For simple, local component state.
    *   **React Context**: For global UI state that doesn't fit TanStack Query or URL state (e.g., theme, user preferences not tied to API).
    *   **Zustand (Optional)**: If complex global client state management is needed, Zustand is a lightweight option. Avoid if not strictly necessary.
*   **Refine.dev State**: Refine manages its own internal state for data providers, resources, etc. Integrate with it as per its documentation.

## 6. Data Fetching

*   **TanStack React Query**: Primary tool for all interactions with the backend API.
    *   Define custom hooks (e.g., `useGetPageContent(keyword)`) that encapsulate `useQuery`.
    *   Place API call functions in the `src/services/` directory.
    *   Example: `src/services/content-service.ts` would contain `fetchPageContent(keyword)`.
*   **API Service Layer**: Abstract API calls into functions within `src/services/`. These functions will be consumed by TanStack React Query hooks.
    ```typescript
    // src/services/content-service.ts
    import { apiClient } from './api-client'; // Your configured Axios instance or fetch wrapper

    interface PageData { /* ... */ }

    export async function getPageByKeyword(keyword: string): Promise<PageData> {
      const response = await apiClient.get(`/api/v1/content/page/${keyword}`);
      return response.data.data; // Assuming backend structure
    }
    ```
*   **Error Handling**: Implement robust error handling within API service functions and `onError` callbacks in `useQuery`/`useMutation`.
*   **Authentication**:
    *   Store JWT tokens securely (e.g., httpOnly cookies if using BFF, or in memory/secure storage for client-side handling if directly calling external API).
    *   Implement token refresh logic. Axios interceptors can be useful here.
    *   Set `X-Client-Type: web` header for all requests.

## 7. Routing

*   **Next.js App Router**: Utilize file-system based routing within the `src/app` directory.
*   **Layouts**: Use `layout.tsx` for shared UI between multiple routes.
*   **Route Groups**: Use `(groupName)` to organize routes without affecting URL paths.
*   **Dynamic Routes**: Use `[paramName]` folders for dynamic segments.
*   **Loading UI**: Use `loading.tsx` for route-specific loading states with Suspense.
*   **Error Handling**: Use `error.tsx` for route-specific error boundaries.

## 8. Styling

*   **Mantine UI v7**: Primary component library.
    *   Customize the Mantine theme in `src/lib/mantine-provider.tsx`.
    *   Utilize Mantine components for consistency and accessibility.
*   **Tailwind CSS**: For utility-first styling and custom layouts.
    *   Configure in `tailwind.config.ts`.
    *   Use Tailwind classes for fine-grained control and responsive design.
*   **Integration**: Mantine and Tailwind can coexist. Use Mantine for core components and structure, Tailwind for utility styling and overrides where needed. Ensure PostCSS setup is correct.
*   **Global Styles**: In `src/app/global.css`, include Tailwind base styles, Mantine core styles, and any other global styles.
*   **Responsive Design**: Employ a mobile-first approach using Tailwind's responsive prefixes (sm, md, lg, xl).

## 9. Refine.dev Integration

*   **Data Provider**: Configure Refine's data provider to use your TanStack Query hooks and API service functions. This will map Refine's data operations (getList, getOne, create, update, delete) to your backend.
*   **Resources**: Define resources in Refine corresponding to your backend entities.
*   **Auth Provider**: Implement Refine's auth provider for handling login, logout, permissions, etc., integrating with your authentication service.
*   **Components**: Leverage Refine's headless components (`useTable`, `useForm`, etc.) and integrate them with Mantine UI components for the presentation layer.
*   **Live Provider (Optional)**: If real-time updates are needed, configure a live provider.

## 10. Type Safety

*   **TypeScript Everywhere**: Write all code in TypeScript.
*   **Interfaces over Types**: Prefer interfaces for defining object shapes and props, use types for unions or more complex type manipulations.
*   **API Types**: Define types/interfaces for all API request payloads and responses in `src/types/api.ts` or similar. These should align with the backend's data structures.
*   **Shared Types**: If backend types are available (e.g., via an OpenAPI spec or shared monorepo), use them to ensure consistency.

## 11. Testing

*   **Unit Tests**: Use Jest and React Testing Library for testing individual components, hooks, and utility functions.
*   **Integration Tests**: Test interactions between multiple components or modules.
*   **End-to-End Tests (Optional but Recommended)**: Use Playwright or Cypress for testing user flows across the application.
*   **Mocking**: Mock API calls (e.g., using `msw` - Mock Service Worker) for testing data fetching and mutations.

## 12. Linting and Formatting

*   **ESLint**: Enforce code style and catch potential errors. Configure with Next.js and TypeScript plugins.
*   **Prettier**: For automatic code formatting.
*   **Husky & lint-staged**: Use pre-commit hooks to run linters and formatters automatically.

## 13. Expansion Guidelines

*   **Adding a New Page/Route**:
    1.  Create a new folder in `src/app/` (e.g., `src/app/(main)/new-feature/page.tsx`).
    2.  If it requires a specific layout, add `layout.tsx` in the same folder.
    3.  Develop components specific to this page in `src/app/(main)/new-feature/_components/` or use shared components from `src/components/`.
    4.  Define data fetching needs using TanStack Query and new functions in `src/services/`.
*   **Adding a New Shared Component**:
    1.  Create a new folder in `src/components/ui/` or `src/components/layout/` (or a new category if needed).
    2.  Follow component structure and naming conventions.
    3.  Ensure it's reusable and well-documented with props.
*   **Adding a New API Interaction**:
    1.  Define request/response types in `src/types/`.
    2.  Add a new function in the relevant service file in `src/services/`.
    3.  Create a new custom hook using `useQuery` or `useMutation` that utilizes this service function.
*   **State Management**:
    *   Prioritize TanStack Query for server state.
    *   Use `nuqs` for URL state.
    *   Only resort to local state (`useState`) or context/Zustand for pure UI state not covered by the above.

## 14. Backend API Considerations (from backend.md)

*   All requests must include `X-Client-Type: web` header.
*   Authentication uses JWT (access + refresh tokens). Implement secure storage and refresh mechanism.
*   API responses follow a standard format: `{ status, message, error, logged_in, meta, data }`. Ensure data fetching logic correctly unwraps the `data` field.
*   Handle API errors (400, 401, 403, 404, 500) gracefully, providing user feedback.

This architecture provides a solid foundation. It should be treated as a living document and updated as the project evolves.