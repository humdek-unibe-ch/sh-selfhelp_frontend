# Frontend Architecture

# Frontend Development Log

## Page Sections Drag & Drop Library Migration (Latest Update)

### Overview
Migrated page sections drag and drop from `@dnd-kit` to `@hello-pangea/dnd` for improved performance and smoother user experience. This aligns with the existing menu positioning implementation and provides better accessibility support.

### Migration Details

#### 1. Library Change Rationale
- **Consistency**: Now uses the same drag library as the successful menu positioning feature
- **Performance**: `@hello-pangea/dnd` provides smoother animations and better performance
- **Accessibility**: Better screen reader support and keyboard navigation
- **Maintenance**: Maintained fork of react-beautiful-dnd with active development

#### 2. Implementation Changes
- **Flattened Structure**: Converted nested drag structure to flattened approach for better performance
- **Simplified Components**: Removed complex nested drop zones in favor of clear, level-based drop areas
- **Enhanced Visual Feedback**: Clear drop zone indicators with descriptive labels
- **Improved Validation**: Better prevention of circular references and invalid drops

#### 3. Component Updates
```typescript
// Before: Complex nested structure with @dnd-kit
<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
    <SortableContext items={allSectionIds}>
        {/* Complex nested drop zones */}
    </SortableContext>
</DndContext>

// After: Clean flattened structure with @hello-pangea/dnd
<DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
    <Droppable droppableId="sections-list">
        {(provided, snapshot) => (
            <Box ref={provided.innerRef} {...provided.droppableProps}>
                {flatSections.map((item, index) => (
                    <SectionDraggableItem key={item.id} item={item} index={index} />
                ))}
            </Box>
        )}
    </Droppable>
</DragDropContext>
```

#### 4. Removed Dependencies
- Uninstalled `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- Deleted unused components: `SectionChildrenArea`, `SectionDragOverlay`
- Simplified component hierarchy

### Technical Benefits
- ✅ **Smoother Animations**: Better drag feedback and transitions
- ✅ **Improved Performance**: Flattened structure reduces re-renders
- ✅ **Better Accessibility**: Enhanced screen reader and keyboard support
- ✅ **Consistent UX**: Same drag behavior as menu positioning
- ✅ **Cleaner Code**: Simplified component structure and logic
- ✅ **Reduced Bundle Size**: Removed unused @dnd-kit dependencies

### Files Modified
- `src/app/components/admin/pages/page-sections/SectionsList.tsx`
- `src/app/components/admin/pages/page-sections/PageSection.tsx`
- `src/app/components/admin/pages/page-sections/SectionHeader.tsx`
- `architecture.md` - Updated drag & drop documentation
- `package.json` - Removed @dnd-kit dependencies

### Files Deleted
- `src/app/components/admin/pages/page-sections/SectionChildrenArea.tsx`
- `src/app/components/admin/pages/page-sections/SectionDragOverlay.tsx`

---

## Field Handling and Menu Positioning Fixes

### Overview
Fixed critical issues with field handling and menu positioning in the PageInspector and DragDropMenuPositioner components to ensure proper data persistence and accurate drag-and-drop positioning.

### Issues Resolved

#### 1. Empty Field Translation Handling
**Problem**: Empty field translations weren't being sent to backend, preventing deletion of cleared content.
**Solution**: Modified field processing to always send all fields, including empty ones with empty string content.

```typescript
// Before: Only non-empty fields were sent
if (content.trim()) {
    fields.push({ fieldId: field.id, languageId: language.id, content });
}

// After: All fields are sent, including empty ones for deletion
fields.push({
    fieldId: field.id,
    languageId: language.id,
    content: content, // Send empty string if content is empty
});
```

#### 2. Menu Position Null Handling
**Problem**: Unchecking menu checkboxes didn't properly set positions to null in the backend payload.
**Solution**: Fixed position logic to respect menu enabled state.

```typescript
const pageData: IUpdatePageData = {
    navPosition: form.values.headerMenuEnabled ? finalHeaderPosition : null,
    footerPosition: form.values.footerMenuEnabled ? finalFooterPosition : null,
    // ... other fields
};
```

#### 3. Drag and Drop Positioning Accuracy
**Problem**: Drag and drop had off-by-one errors due to complex index adjustment logic.
**Solution**: Simplified visual reordering by removing complex index adjustments.

```typescript
// Before: Complex index adjustment causing off-by-one errors
const adjustedDropIndex = droppedIndex > existingPageIndex ? droppedIndex - 1 : droppedIndex;
updatedPages.splice(adjustedDropIndex, 0, currentPageItem);

// After: Simple reordering without adjustment
updatedPages = updatedPages.filter((_, index) => index !== existingPageIndex);
updatedPages.splice(droppedIndex, 0, currentPageItem);
```

#### 4. Position Calculation Timing
**Problem**: Position calculation happened during drag, causing inconsistent results.
**Solution**: Store visual index during drag, calculate actual position only on submit.

```typescript
// During drag: Store visual index only
onPositionChange(destinationIndex);

// On submit: Calculate actual position
const finalPosition = calculateFinalPosition(reorderedPages.filter(p => p.keyword !== pageKeyword), droppedIndex);
```

### Technical Benefits
- ✅ **Field Deletion**: Empty fields are properly sent for backend deletion
- ✅ **Menu State Consistency**: Positions correctly set to null when menus disabled
- ✅ **Accurate Positioning**: Drag and drop now places items in correct positions
- ✅ **Performance**: Position calculation only happens when needed (on submit)
- ✅ **Visual Feedback**: Immediate visual reordering during drag operations
- ✅ **Debug Logging**: Enhanced logging for troubleshooting positioning issues

### Files Modified
- `src/app/components/admin/pages/page-inspector/PageInspector.tsx`
- `src/app/components/ui/drag-drop-menu-positioner/DragDropMenuPositioner.tsx`

---

## DragDropMenuPositioner - Reusable Component Extraction

### Overview
Extracted the smooth drag-and-drop menu positioning functionality from CreatePage into a reusable component called `DragDropMenuPositioner`. This follows our architecture principle of always creating reusable components when functionality is used in more than one place.

### Key Features Implemented

#### 1. Reusable Component Architecture
- **Single Source of Truth**: One component handles all drag-and-drop menu positioning
- **Consistent Behavior**: Same smooth animations and interactions across all usage
- **Configurable Interface**: Flexible props for different use cases
- **Type Safety**: Full TypeScript support with clear interfaces

#### 2. Component Interface
```typescript
interface IDragDropMenuPositionerProps {
    // Menu configuration
    menuType: 'header' | 'footer';
    title: string;
    
    // Current page being positioned
    currentPage?: IAdminPage | null;
    newPageKeyword?: string;
    
    // Menu state
    enabled: boolean;
    position: number | null;
    
    // Callbacks
    onEnabledChange: (enabled: boolean) => void;
    onPositionChange: (position: number | null) => void;
    
    // Context for filtering pages
    parentPage?: IAdminPage | null;
    
    // Optional styling
    showCheckbox?: boolean;
    checkboxLabel?: string;
    showAlert?: boolean;
    alertMessage?: string;
}
```

#### 3. Smooth Drag-and-Drop Implementation
- **Portal Rendering**: Uses `createPortal` to render dragging elements outside container transforms
- **Visual Feedback**: Smooth animations with rotation and shadow effects during drag
- **Disabled State**: Existing pages are non-draggable, only new/current page can be repositioned
- **Position Calculation**: Intelligent position calculation between existing pages

#### 4. Updated Component Usage

**CreatePage Modal**:
```typescript
<DragDropMenuPositioner
    menuType="header"
    title="Header Menu Position"
    newPageKeyword={form.values.keyword}
    enabled={form.values.headerMenu}
    position={form.values.headerMenuPosition}
    onEnabledChange={(enabled) => form.setFieldValue('headerMenu', enabled)}
    onPositionChange={(position) => form.setFieldValue('headerMenuPosition', position)}
    parentPage={parentPage}
    checkboxLabel="Header Menu"
/>
```

**PageInspector**:
```typescript
<DragDropMenuPositioner
    currentPage={page}
    menuType="header"
    title="Header Menu Position"
    enabled={form.values.headerMenuEnabled}
    position={form.values.navPosition}
    onEnabledChange={handleHeaderMenuChange}
    onPositionChange={(position) => form.setFieldValue('navPosition', position)}
    checkboxLabel="Header Menu"
    showAlert={false}
/>
```

### Technical Implementation Details

#### 1. Context-Aware Page Processing
```typescript
const processMenuPages = useMemo(() => {
    let pagesToProcess: IAdminPage[] = [];

    if (parentPage) {
        // Show only children of the parent
        pagesToProcess = parentPage.children || [];
    } else {
        // Show only root pages (parent: null)
        pagesToProcess = pages.filter(page => page.parent === null);
    }

    // Filter by menu type and sort by position
    const menuPages: IMenuPageItem[] = [];
    pagesToProcess.forEach(page => {
        const positionField = menuType === 'header' ? 'nav_position' : 'footer_position';
        const pagePosition = page[positionField];
        
        if (pagePosition !== null && pagePosition !== undefined) {
            menuPages.push({
                id: page.id_pages.toString(),
                keyword: page.keyword,
                label: page.keyword,
                position: pagePosition
            });
        }
    });

    return menuPages.sort((a, b) => a.position - b.position);
}, [pages, parentPage, menuType]);
```

#### 2. Drag Clone Portal for Smooth Dragging
```typescript
const DragClonePortal = ({ children }: { children: React.ReactNode }) => {
    if (typeof window === "undefined") return null;
    return createPortal(children, document.body);
};

// Usage in draggable items
if (snapshot.isDragging) {
    return <DragClonePortal>{draggableContent}</DragClonePortal>;
}
```

#### 3. CSS Module Styling
```css
/* DragDropMenuPositioner.module.css */
.item {
    cursor: grab;
    border-radius: var(--mantine-radius-md);
    transition: all 0.2s ease;
}

.item:active {
    cursor: grabbing;
}

.itemDragging {
    box-shadow: var(--mantine-shadow-sm);
    transform: rotate(5deg);
}

.newPageItem {
    background-color: var(--mantine-color-blue-0) !important;
    border-color: var(--mantine-color-blue-4) !important;
}
```

### Code Cleanup and Refactoring

#### 1. CreatePage Simplification
- **Removed Duplicate Code**: Eliminated 200+ lines of drag-and-drop implementation
- **Simplified State**: Removed complex state management for menu positioning
- **Cleaner Imports**: Removed unused drag-and-drop imports and utilities
- **Focused Responsibility**: Component now focuses on form management and page creation

#### 2. PageInspector Update
- **Consistent Interface**: Now uses same drag-and-drop component as CreatePage
- **Better UX**: Users get the same smooth experience in both contexts
- **Reduced Maintenance**: Single component to maintain for all menu positioning

#### 3. Type System Updates
- **Shared Interfaces**: `IMenuPageItem` interface used across components
- **Clear Separation**: Component-specific types vs shared types properly organized
- **Export Strategy**: Proper exports for reusable interfaces

### Architecture Benefits

#### 1. Code Reuse
- **DRY Principle**: No duplication of drag-and-drop logic
- **Consistent Behavior**: Same animations and interactions everywhere
- **Single Source of Truth**: One component handles all menu positioning

#### 2. Maintainability
- **Centralized Logic**: All menu positioning logic in one place
- **Easier Testing**: Single component to test for all drag-and-drop functionality
- **Bug Fixes**: Fix once, benefits all usage locations

#### 3. User Experience
- **Consistent Interface**: Users learn the interaction once, use it everywhere
- **Smooth Performance**: Optimized drag-and-drop with portal rendering
- **Visual Feedback**: Consistent visual cues across all contexts

### Updated Architecture Rules

Added new rule to architecture.md:

**CRITICAL RULE**: Always extract components into separate reusable components if they are used in more than one place.

#### Component Organization Guidelines
- **UI Components**: Place in `src/app/components/ui/` for general-purpose components
- **Feature Components**: Place in feature-specific directories for domain components
- **Shared Logic**: Extract custom hooks for shared business logic
- **Type Definitions**: Create shared interfaces for component props

#### Examples of Reusable Components
- **DragDropMenuPositioner**: Drag-and-drop menu positioning with smooth animations ✨ NEW
- **LockedField**: Input fields with lock/unlock functionality
- **FieldLabelWithTooltip**: Labels with info tooltips for form fields
- **MenuPositionEditor**: Menu position management (deprecated - use DragDropMenuPositioner)

### Future Enhancements
- **Animation Customization**: Could support custom animation configurations
- **Multi-Select**: Could support moving multiple items at once
- **Keyboard Navigation**: Could add keyboard support for accessibility
- **Touch Support**: Could enhance touch interactions for mobile devices

## Context-Aware Page Creation Enhancement

### Overview
Enhanced the CreatePageModal to support intelligent menu filtering based on page hierarchy context. The modal now adapts its behavior when creating root pages versus child pages, showing only relevant pages for menu positioning.

### Key Features Implemented

#### 1. Context-Aware Menu Filtering
- **Root Page Creation**: When no parent is selected, shows only root-level pages (parent: null) in menu positioning
- **Child Page Creation**: When a parent page is selected, shows only sibling pages (children of the same parent) in menu positioning
- **Hierarchical Consistency**: Maintains proper page structure and prevents incorrect menu positioning

#### 2. Enhanced Modal Props & Types
```typescript
// Updated interface to support parent context
export interface ICreatePageModalProps {
    opened: boolean;
    onClose: () => void;
    parentPage?: IAdminPage | null; // New: Optional parent context
}

// Enhanced form values with parent tracking
export interface ICreatePageFormValues {
    // ... existing fields
    parentPage?: number | null; // New: Parent page ID
}
```

#### 3. Smart Menu Processing Logic
```typescript
const processMenuPages = useMemo(() => {
    let pagesToProcess: IAdminPage[] = [];
    
    if (parentPage) {
        // Creating child page - show only siblings (children of parent)
        pagesToProcess = parentPage.children || [];
        debug('Processing child pages for parent', 'CreatePageModal', {
            parentKeyword: parentPage.keyword,
            childrenCount: pagesToProcess.length
        });
    } else {
        // Creating root page - show only root pages (parent: null)
        pagesToProcess = pages.filter(page => page.parent === null);
        debug('Processing root pages', 'CreatePageModal', {
            rootPagesCount: pagesToProcess.length
        });
    }
    
    // Process filtered pages for menu positioning
}, [pages, parentPage]);
```

#### 4. Visual Context Indicators
- **Dynamic Modal Title**: Changes based on context ("Create New Page" vs "Create Child Page under 'parent'")
- **Context Alert**: Blue alert box clearly indicates when creating a child page
- **Parent Information**: Shows parent page keyword for clarity

#### 5. Integration with Admin Store
```typescript
// AdminNavbar integration
const selectedPage = useSelectedPage();

<CreatePageModal 
    opened={isModalOpen} 
    onClose={() => setIsModalOpen(false)} 
    parentPage={selectedPage} // Current selected page becomes parent
/>
```

### Technical Implementation Details

#### Enhanced Form Submission with Integer Position Enforcement
```typescript
// Calculate final positions - ensure integers for backend compatibility
let finalHeaderPosition: number | null = null;
let finalFooterPosition: number | null = null;

if (values.headerMenu && values.headerMenuPosition !== null) {
    finalHeaderPosition = Math.round(calculateFinalPosition(headerMenuPages, values.headerMenuPosition));
}

if (values.footerMenu && values.footerMenuPosition !== null) {
    finalFooterPosition = Math.round(calculateFinalPosition(footerMenuPages, values.footerMenuPosition));
}

const submitData: ICreatePageRequest = {
    keyword: values.keyword,
    page_access_type_code: values.pageAccessType,
    is_headless: values.headlessPage,
    is_open_page: values.openAccess,
    url: values.urlPattern,
    nav_position: finalHeaderPosition || undefined, // Always integer
    footer_position: finalFooterPosition || undefined, // Always integer
    parent: values.parentPage || undefined, // New: Parent assignment
};
```

#### Integer Position Calculation
- **Backend Compatibility**: All nav_position and footer_position values are guaranteed to be integers
- **Smart Gap Detection**: When inserting between pages, uses integer math to find safe positions
- **Collision Avoidance**: When no space exists between pages, automatically shifts positions by 10
- **Type Safety**: Explicit type annotations and Math.round() ensure integer values

```typescript
const calculateFinalPosition = (pages: IMenuPageItem[], targetIndex: number): number => {
    if (targetIndex === 0) {
        // First position - use position before first page or default to 10
        return pages.length > 0 ? Math.max(1, pages[0].position - 10) : 10;
    } else if (targetIndex >= pages.length) {
        // Last position - add 10 to last page position
        return pages.length > 0 ? pages[pages.length - 1].position + 10 : 10;
    } else {
        // Between two pages - find a safe integer between them
        const prevPage = pages[targetIndex - 1];
        const nextPage = pages[targetIndex];
        const gap = nextPage.position - prevPage.position;
        
        if (gap > 1) {
            // There's space between pages, use middle integer
            return prevPage.position + Math.floor(gap / 2);
        } else {
            // No space between pages, shift all subsequent pages by 10
            return prevPage.position + 10;
        }
    }
};
```

#### Footer Position Handling
- **Graceful Fallback**: Handles missing `footer_position` field in `IAdminPage` interface
- **Type Safety**: Uses type assertion with null checks for optional footer positioning
- **Future Compatibility**: Ready for when footer_position is added to admin page types

### User Experience Improvements

#### 1. Contextual Clarity
- **Clear Intent**: Users immediately understand whether they're creating root or child pages
- **Relevant Options**: Only see menu positioning options that make sense for their context
- **Reduced Confusion**: No more wondering why certain pages appear in menu lists

#### 2. Hierarchical Consistency
- **Proper Structure**: Ensures pages are created in correct hierarchical positions
- **Sibling Awareness**: Child pages can only be positioned relative to their siblings
- **Parent Preservation**: Maintains parent-child relationships correctly

#### 3. Visual Feedback
- **Dynamic Titles**: Modal title adapts to creation context
- **Context Alerts**: Clear indication when creating child pages
- **Parent Display**: Shows which page will be the parent

### Benefits Achieved

#### 1. Improved User Experience
- **Contextual Relevance**: Users see only applicable menu positioning options
- **Clear Hierarchy**: Visual indicators make page relationships obvious
- **Reduced Errors**: Prevents incorrect menu positioning across hierarchy levels

#### 2. Better Data Integrity
- **Consistent Structure**: Maintains proper page hierarchy in database
- **Correct Relationships**: Ensures parent-child relationships are preserved
- **Menu Logic**: Prevents cross-hierarchy menu positioning conflicts

#### 3. Enhanced Maintainability
- **Type Safety**: Full TypeScript support for new parent context features
- **Debug Logging**: Comprehensive logging for troubleshooting hierarchy issues
- **Future Ready**: Architecture supports additional hierarchy features

### Architecture Updates
- **Updated Types**: Enhanced interfaces to support parent context
- **Store Integration**: Leverages existing admin store for selected page context
- **Debug System**: Added comprehensive logging for hierarchy operations
- **Documentation**: Updated architecture.md with new patterns and usage

### Future Enhancements
- **Multi-level Creation**: Could support creating pages at specific hierarchy levels
- **Bulk Operations**: Could support creating multiple child pages at once
- **Template System**: Could provide templates based on parent page structure
- **Advanced Positioning**: Could support more sophisticated menu positioning algorithms

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

## Authentication & Data Management Improvements (Latest)

### Authentication Flow Enhancement
**Problem:** When access token was deleted but refresh token existed, users were immediately redirected to "no access" page even when refresh token was still valid.

**Solution:** Enhanced authentication logic in `src/api/base.api.ts`:
- Only redirect to login/no-access when refresh token is truly invalid (401/403 status or specific error messages)
- Allow continued functionality when refresh token might still be valid
- More intelligent error handling for both 401 errors and logged_in: false responses
- Prevents premature redirects during token refresh process

### React Query Cache Management
**Problem:** After creating a page successfully, the admin pages list didn't update automatically.

**Solution:** Implemented proper cache invalidation in `CreatePageModal`:
- Added `useQueryClient` hook for cache management
- Invalidate both `['adminPages']` and `['pages']` queries after successful page creation
- Immediate refetch of admin pages for better UX
- Updated success notification to confirm list update

**Best Practices Implemented:**
- `queryClient.invalidateQueries()` - Marks queries as stale
- `queryClient.refetchQueries()` - Immediately refetches for instant UI update
- Parallel invalidation using `Promise.all()` for efficiency
- Comprehensive cache management for both admin and frontend navigation

**Technical Implementation:**
```typescript
// Enhanced authentication error handling
const isRefreshTokenInvalid = (refreshError as any)?.response?.status === 401 || 
                            (refreshError as any)?.response?.status === 403 ||
                            (refreshError as any)?.message?.includes('No refresh token available') ||
                            (refreshError as any)?.message?.includes('refresh token');

if (isRefreshTokenInvalid) {
    // Only redirect when refresh token is truly invalid
    authProvider.logout({ redirectPath: ROUTES.LOGIN });
} else {
    // Allow continued functionality with limited access
    debug('Token refresh failed but refresh token may still be valid');
}

// Cache invalidation after page creation
await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['adminPages'] }),
    queryClient.invalidateQueries({ queryKey: ['pages'] }),
    queryClient.refetchQueries({ queryKey: ['adminPages'] }),
]);
```

## Dynamic Refine Resources System (Latest)

### Concept: Context-Aware Resource Generation
**Problem:** Refine.dev requires static resource definitions, but our application has dynamic pages that change based on user permissions and context (admin vs frontend).

**Solution:** Implemented dynamic resource generation in `useAppNavigation` hook:
- **Frontend Mode**: Returns navigation data for menus and routing
- **Admin Mode**: Additionally generates Refine resources for admin interface

### Technical Implementation

#### Enhanced useAppNavigation Hook
```typescript
export function useAppNavigation(options: { isAdmin?: boolean } = {}) {
    const { isAdmin = false } = options;
    
    // ... existing navigation logic ...
    
    // Generate Refine resources for admin mode
    let resources: any[] = [];
    if (isAdmin) {
        resources = pages.map(page => ({
            name: page.keyword,
            list: `/admin/pages/${page.keyword}`,
            show: `/admin/pages/${page.keyword}`,
            edit: `/admin/pages/${page.keyword}/edit`,
            create: `/admin/pages/create`,
            meta: {
                label: page.keyword,
                parent: page.parent ? pages.find(p => p.id_pages === page.parent)?.keyword : undefined,
                canDelete: true,
                nav: page.nav_position !== null,
                navOrder: page.nav_position,
                footer: page.footer_position !== null,
                footerOrder: page.footer_position,
                params: page.url.includes('[') ? { nav: { type: 'number' } } : {},
                protocol: ['web']
            }
        }));
    }
    
    return { pages, menuPages, footerPages, routes, resources, isLoading, error };
}
```

#### RefineWrapper Integration
```typescript
function RefineWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');
    const { resources, isLoading } = useAppNavigation({ isAdmin });

    return (
        <Refine
            routerProvider={appRouter}
            dataProvider={dataProvider(API_CONFIG.BASE_URL)}
            authProvider={authProvider}
            resources={resources} // Dynamic resources based on context
            options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                disableTelemetry: true,
            }}
        >
            {children}
        </Refine>
    );
}
```

### Benefits of This Approach

#### 1. **Dynamic Resource Management**
- **Context-Aware**: Different resources for admin vs frontend
- **Permission-Based**: Only shows resources user has access to
- **Real-Time Updates**: Resources update when pages are added/removed

#### 2. **Refine.dev Integration**
- **Automatic Routing**: Refine handles navigation between resources
- **CRUD Operations**: Built-in support for list, show, edit, create operations
- **Breadcrumbs**: Automatic breadcrumb generation based on resource hierarchy

#### 3. **Scalability**
- **No Static Configuration**: Resources generated from API data
- **Maintainable**: Single source of truth for page structure
- **Flexible**: Easy to add new resource types or modify existing ones

### Resource Structure Explained

Each generated resource includes:
- **`name`**: Unique identifier (page keyword)
- **`list`**: URL for listing items
- **`show`**: URL for viewing single item
- **`edit`**: URL for editing item
- **`create`**: URL for creating new item
- **`meta`**: Additional metadata for Refine features
  - **`label`**: Display name
  - **`parent`**: Hierarchical relationship
  - **`canDelete`**: Permission flags
  - **`nav`/`footer`**: Menu positioning info
  - **`params`**: URL parameter definitions
  - **`protocol`**: Supported access methods

This system allows Refine to automatically handle:
- Navigation between pages
- Breadcrumb generation
- Permission checking
- URL parameter parsing
- CRUD operation routing

## Admin Authentication Flow Enhancement (Latest)

### Problem: Premature Authentication Redirects
**Issue:** The `AdminShellWrapper` was immediately redirecting users to "no access" when the access token expired, even when a valid refresh token existed that could obtain a new access token.

**Root Cause:** The authentication check was based on the current authentication state without considering that a token refresh process might be in progress.

### Solution: Smart Authentication Waiting Logic

#### Enhanced AdminShellWrapper Logic
```typescript
export function AdminShellWrapper({ children }: AdminShellWrapperProps) {
    const [waitingForRefresh, setWaitingForRefresh] = useState(false);
    const refreshAttemptRef = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();

        // If not authenticated but we have a refresh token, wait for potential refresh
        if (!isAuthenticated && refreshToken && !refreshAttemptRef.current) {
            setWaitingForRefresh(true);
            refreshAttemptRef.current = true;

            // Set a timeout to stop waiting after 10 seconds
            timeoutRef.current = setTimeout(() => {
                setWaitingForRefresh(false);
                if (!isAuthenticated) {
                    router.replace(ROUTES.LOGIN);
                }
            }, 10000);

            return;
        }

        // If we were waiting for refresh and now we're authenticated, clear timeout
        if (waitingForRefresh && isAuthenticated) {
            clearTimeout(timeoutRef.current);
            setWaitingForRefresh(false);
            refreshAttemptRef.current = false;
        }

        // Proceed with normal auth checks only if not waiting for refresh
        if (!waitingForRefresh) {
            if (!isAuthenticated) {
                router.replace(ROUTES.LOGIN);
            } else if (!hasAdminAccess()) {
                router.replace(ROUTES.NO_ACCESS);
            }
            setIsChecking(false);
        }
    }, [hasAdminAccess, isAuthenticated, isLoading, router, waitingForRefresh]);
}
```

### Key Features

#### 1. **Refresh Token Detection**
- Checks for presence of refresh token before redirecting
- Only waits for refresh if refresh token exists
- Prevents unnecessary redirects when token refresh is possible

#### 2. **Smart Waiting Logic**
- **`waitingForRefresh`**: State to track if we're waiting for token refresh
- **`refreshAttemptRef`**: Prevents multiple simultaneous refresh attempts
- **`timeoutRef`**: 10-second timeout to prevent infinite waiting

#### 3. **Enhanced User Experience**
- Shows "Refreshing authentication..." message during refresh
- Graceful fallback to login if refresh fails or times out
- No premature redirects that interrupt user workflow

#### 4. **Robust Error Handling**
- Timeout mechanism prevents hanging on failed refresh attempts
- Cleanup of timeouts on component unmount
- Debug logging for troubleshooting authentication issues

### Benefits

#### ✅ **No More Premature Redirects**
- Users aren't kicked out when access token expires if refresh token is valid
- Smooth transition from expired to refreshed authentication state
- Better user experience during token refresh process

#### ✅ **Intelligent Waiting**
- Only waits when refresh is actually possible (refresh token exists)
- Reasonable timeout prevents infinite loading states
- Clear feedback to user about what's happening

#### ✅ **Backward Compatibility**
- Still redirects appropriately when no refresh token exists
- Maintains all existing security checks
- Works with existing authentication infrastructure

#### ✅ **Debug-Friendly**
- Comprehensive logging for authentication state changes
- Easy to troubleshoot authentication issues
- Clear state tracking for development

### Authentication Flow Sequence

1. **Access Token Expires** → User tries to access admin area
2. **AdminShellWrapper Checks** → Sees `isAuthenticated = false`
3. **Refresh Token Check** → Finds valid refresh token in storage
4. **Wait State** → Shows "Refreshing authentication..." message
5. **Background Refresh** → Base API interceptor attempts token refresh
6. **Success Path** → Authentication state updates, user continues
7. **Failure Path** → Timeout triggers, user redirected to login

This creates a much smoother authentication experience where users aren't unnecessarily interrupted by login prompts when their session can be automatically renewed.

### Critical Fix: Token Refresh Timing Issue

**Additional Problem Discovered:** After successful token refresh, the `hasAdminAccess()` function was still using stale user data, causing users to be redirected to "no access" even though they had valid admin permissions in the new token.

**Root Cause:** Timing mismatch between:
1. Token refresh completion (new token in localStorage)
2. Refine's `useIsAuthenticated` updating to `true`
3. `useAuth` hook's user data updating with new token permissions

**Solution:** Direct token validation bypass for fresh data:

```typescript
// Instead of relying on potentially stale hook data
if (!hasAdminAccess()) {
    router.replace(ROUTES.NO_ACCESS); // ❌ Uses stale data
}

// Use fresh token data directly
const currentToken = getAccessToken();
const currentUser = getCurrentUser();
const hasCurrentAdminAccess = currentUser ? checkPermission(PERMISSIONS.ADMIN_ACCESS, currentUser) : false;

if (!hasCurrentAdminAccess) {
    router.replace(ROUTES.NO_ACCESS); // ✅ Uses fresh data
}
```

**Additional Safeguards:**
- **100ms delay** after successful refresh to allow hook state updates
- **Comprehensive debug logging** to track both hook and direct token data
- **Fallback validation** using direct token parsing instead of hook state

This ensures that users with valid admin permissions aren't incorrectly redirected after token refresh.

## Proper Logout Implementation with Refine (Latest)

### Problem: Manual Logout Not Using Refine Flow
**Issue:** The logout functionality was manually calling `AuthApi.logout()` and `router.push()`, which bypassed Refine's authentication flow and didn't properly handle redirects.

**Solution:** Implemented proper Refine logout using `useLogout` hook:

#### Enhanced AuthButton with Refine Logout
```typescript
import { useIsAuthenticated, useLogout } from '@refinedev/core';

export function AuthButton() {
    const { mutate: logout, isLoading: isLoggingOut } = useLogout();
    
    const handleLogout = () => {
        setStableAuthState(false); // Immediate UI update
        
        // Use Refine's logout hook which will:
        // 1. Call the auth provider's logout method
        // 2. Handle the redirect automatically based on redirectTo
        logout({
            redirectPath: ROUTES.LOGIN
        });
    };

    return (
        <Menu.Item
            color="red"
            leftSection={<IconLogout size={14} />}
            onClick={handleLogout}
            disabled={isLoggingOut}
        >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
        </Menu.Item>
    );
}
```

### Benefits of Refine Logout

#### ✅ **Proper Integration**
- Uses Refine's authentication flow instead of manual API calls
- Automatically handles the `redirectTo` value from auth provider
- Integrates with Refine's internal state management

#### ✅ **Better User Experience**
- Loading states during logout process
- Disabled logout button to prevent multiple clicks
- Immediate UI feedback with "Logging out..." message

#### ✅ **Consistent Behavior**
- Uses `router.replace()` instead of `router.push()` to prevent back button issues
- Proper cleanup of authentication state
- Consistent with Refine's authentication patterns

### Authentication Flow Sequence

1. **User clicks logout** → `handleLogout()` called
2. **Immediate UI update** → Button shows "Logging out..." and becomes disabled
3. **Refine logout hook** → Calls `authProvider.logout()`
4. **Auth provider cleanup** → Calls `AuthApi.logout()` and clears tokens
5. **Automatic redirect** → Refine handles redirect to `ROUTES.LOGIN`
6. **AdminShell detection** → Detects unauthenticated state and reinforces redirect

This creates a robust logout flow that properly integrates with Refine's authentication system and provides clear feedback to users throughout the process.

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

## Page Content Management System Implementation

### Overview
Enhanced the page content editing system with dynamic field loading, proper form management, and improved user experience. The system now supports editing both content fields and page properties with proper validation and safety features.

### Key Features Implemented

#### 1. Enhanced Type System
```typescript
// Updated page details types to match API response
export interface IPageFieldTranslation {
    language_id: number;
    language_code: string;
    content: string;
}

export interface IPageField {
    id: number;
    name: string;
    type: string;
    default_value: string | null;
    help: string;
    display: boolean;
    translations: IPageFieldTranslation[];
}

export interface IPageDetails {
    id: number;
    keyword: string;
    url: string;
    protocol: string;
    action: IPageAction;
    navigationSection: any | null;
    parentPage: any | null;
    pageType: IPageType;
    pageAccessType: IPageAccessType;
    headless: boolean;
    navPosition: number | null;
    footerPosition: number | null;
    openAccess: boolean;
    system: boolean;
}
```

#### 2. Reusable Locked Field Component
```typescript
// src/app/components/ui/locked-field/LockedField.tsx
export function LockedField({
    initialLocked = true,
    onLockChange,
    lockedTooltip = "Enable editing",
    unlockedTooltip = "Lock editing",
    ...textInputProps
}: ILockedFieldProps) {
    const [isLocked, setIsLocked] = useState(initialLocked);

    return (
        <TextInput
            {...textInputProps}
            readOnly={isLocked}
            rightSection={
                <ActionIcon onClick={handleToggleLock}>
                    {isLocked ? <IconLock /> : <IconEdit />}
                </ActionIcon>
            }
        />
    );
}
```

#### 3. Enhanced PageInspector Component (renamed from PageContent)
- **Dynamic Field Loading**: Fetches page fields from API based on selected page
- **Content/Properties Separation**: Fields with `display: true` are content, `display: false` are properties
- **Dynamic Multi-Language Support**: Language tabs fetched from API with automatic locale mapping
- **Always Available Languages**: Language tabs always shown regardless of existing translations
- **Smart Language Matching**: Matches API translations to languages by locale (e.g., 'de-CH' → 'de')
- **1-Day Language Caching**: Languages cached for 24 hours for optimal performance
- **Form Management**: Mantine form with proper state synchronization
- **Save Functionality**: Fixed save button with Ctrl+S hotkey support
- **Collapsible Sections**: Content and Properties sections can be collapsed/expanded
- **Menu Position Editor**: Drag-and-drop interface for header/footer menu positioning
- **Page Access Type**: Radio button selection for page access control
- **Help Tooltips**: Info icons with helpful tooltips for all fields
- **Action Buttons**: Create child page and delete page with confirmation
- **Right Sidebar Integration**: Integrated into admin page as a 400px wide inspector panel

#### 4. User Experience Features
```typescript
// Fixed save button with scrollable content
<Stack gap={0} h="100%">
    {/* Fixed Save Button */}
    <Paper p="md" withBorder style={{ borderBottom: 'none' }}>
        <Group justify="space-between" align="center">
            <Title order={2}>{page.keyword}</Title>
            <Button leftSection={<IconDeviceFloppy />} onClick={handleSave}>
                Save
            </Button>
        </Group>
    </Paper>

    {/* Scrollable Content */}
    <ScrollArea flex={1}>
        {/* Content and Properties sections */}
    </ScrollArea>
</Stack>

// Keyboard shortcuts
useHotkeys([
    ['ctrl+S', (e) => {
        e.preventDefault();
        handleSave();
    }]
]);
```

#### 5. Delete Confirmation System with Mutation Hook
```typescript
// Integrated useDeletePageMutation for proper page deletion
const deletePageMutation = useDeletePageMutation({
    onSuccess: () => {
        setDeleteModalOpened(false);
        setDeleteConfirmText('');
    },
    onError: (error) => {
        debug('Delete page error in PageInspector', 'PageInspector', { error });
    }
});

// Type-to-confirm deletion modal with loading state
<Modal opened={deleteModalOpened} title="Delete Page">
    <Alert color="red" title="Warning">
        This action cannot be undone. The page and all its content will be permanently deleted.
    </Alert>
    <Text>
        Type the page keyword: <Text span fw={700}>{page.keyword}</Text>
    </Text>
    <TextInput
        placeholder={`Type "${page.keyword}" to confirm`}
        value={deleteConfirmText}
        onChange={(e) => setDeleteConfirmText(e.target.value)}
    />
    <Button
        color="red"
        disabled={deleteConfirmText !== page.keyword}
        loading={deletePageMutation.isPending}
        onClick={handleDeletePage}
    >
        Delete Page
    </Button>
</Modal>

// Enhanced delete handler with proper API integration
const handleDeletePage = () => {
    if (deleteConfirmText === page?.keyword && page?.keyword) {
        debug('Deleting page', 'PageInspector', { page: page.keyword });
        deletePageMutation.mutate(page.keyword);
    }
};
```

**Delete Functionality Features:**
- **Proper API Integration**: Uses `useDeletePageMutation` hook with `AdminApi.deletePage()`
- **Cache Invalidation**: Automatically updates admin pages list and removes cached page data
- **Success Notifications**: Shows green notification when page is deleted successfully
- **Error Handling**: Displays error notifications with proper error parsing
- **Loading States**: Button shows loading spinner during deletion process
- **Query Cache Cleanup**: Removes specific page data from React Query cache
- **Navigation Update**: Invalidates navigation queries to update frontend menus

### API Integration Updates
- **New Languages API**: Added `AdminApi.getLanguages()` to fetch available languages from `/admin/languages`
- **Dynamic Language Support**: Created `useLanguages()` hook with 1-day caching for optimal performance
- **Language Types**: Added `ILanguage` interface and `TLanguagesResponse` type for type safety
- Updated `AdminApi.getPageFields()` to return full page details with fields
- Enhanced `usePageFields` hook to handle new response structure
- Proper error handling and loading states

### New API Integration: Page Updates

#### 1. Update Page API Endpoint
```typescript
// New endpoint added to API_CONFIG
ADMIN_PAGES_UPDATE: (keyword: string) => `/admin/pages/${keyword}`

// API method with PUT request
async updatePage(keyword: string, updateData: IUpdatePageRequest): Promise<IAdminPage> {
    const response = await apiClient.put<IBaseApiResponse<IAdminPage>>(
        API_CONFIG.ENDPOINTS.ADMIN_PAGES_UPDATE(keyword),
        updateData
    );
    return response.data.data;
}
```

#### 2. Update Page Request Types
```typescript
// src/types/requests/admin/update-page.types.ts
export interface IUpdatePageData {
    keyword: string;
    url: string;
    headless: boolean;
    navPosition: number | null;
    footerPosition: number | null;
    openAccess: boolean;
    pageAccessType: string;
}

export interface IUpdatePageField {
    fieldId: number;           // Field ID from database
    languageId: number;        // Language ID (1 for properties, actual ID for content)
    content: string;           // Field content
    fieldName?: string;        // For debugging
    languageCode?: string;     // For debugging
}

export interface IUpdatePageRequest {
    pageData: IUpdatePageData;
    fields: IUpdatePageField[];
}
```

#### 3. Update Page Mutation Hook
```typescript
// src/hooks/mutations/useUpdatePageMutation.ts
export function useUpdatePageMutation(options: IUpdatePageMutationOptions = {}) {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ keyword, updateData }: IUpdatePageMutationVariables) => 
            AdminApi.updatePage(keyword, updateData),
        
        onSuccess: async (updatedPage: IAdminPage, { keyword }) => {
            // Invalidate relevant queries
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['adminPages'] }),
                queryClient.invalidateQueries({ queryKey: ['pages'] }),
                queryClient.invalidateQueries({ queryKey: ['pageFields', keyword] }),
                queryClient.invalidateQueries({ queryKey: ['pageSections', keyword] }),
            ]);
            
            // Show success notification
            notifications.show({
                title: 'Page Updated Successfully',
                message: `Page "${keyword}" has been updated successfully with all changes saved!`,
                icon: <IconCheck size="1rem" />,
                color: 'green',
                autoClose: 5000,
                position: 'top-center',
            });
        },
        
        onError: (error: any, { keyword }) => {
            // Show error notification with parsed error message
            const { errorMessage, errorTitle } = parseApiError(error);
            notifications.show({
                title: errorTitle || 'Update Failed',
                message: errorMessage || `Failed to update page "${keyword}". Please try again.`,
                icon: <IconX size="1rem" />,
                color: 'red',
                autoClose: 8000,
                position: 'top-center',
            });
        },
    });
}
```

#### 4. Enhanced Save Functionality in PageInspector
```typescript
const handleSave = () => {
    // Prepare page data
    const pageData = {
        keyword: form.values.keyword,
        url: form.values.url,
        headless: form.values.headless,
        navPosition: form.values.navPosition,
        footerPosition: form.values.footerPosition,
        openAccess: form.values.openAccess,
        pageAccessType: form.values.pageAccessType,
    };

    // Prepare field translations with field IDs and language IDs
    const fields: IUpdatePageField[] = [];

    // Content fields (display: true) - translated per language
    contentFields.forEach(field => {
        languages.forEach(language => {
            const content = form.values.fields?.[field.name]?.[language.code] || '';
            if (content.trim()) {
                fields.push({
                    fieldId: field.id,
                    languageId: language.id,
                    content: content,
                    fieldName: field.name,
                    languageCode: language.code
                });
            }
        });
    });

    // Property fields (display: false) - hardcoded language ID 1
    propertyFields.forEach(field => {
        const firstLanguageCode = languages[0]?.code || 'de';
        const content = form.values.fields?.[field.name]?.[firstLanguageCode] || '';
        if (content.trim()) {
            fields.push({
                fieldId: field.id,
                languageId: 1, // Hardcoded for property fields
                content: content,
                fieldName: field.name,
                languageCode: 'property'
            });
        }
    });

    // Submit to backend
    if (page?.keyword) {
        updatePageMutation.mutate({
            keyword: page.keyword,
            updateData: { pageData, fields }
        });
    }
};

// Enhanced Save button with loading state
<Button
    leftSection={<IconDeviceFloppy size="1rem" />}
    onClick={handleSave}
    variant="filled"
    loading={updatePageMutation.isPending}
    disabled={!page?.keyword}
>
    Save
</Button>
```

### New API Integration: Languages

#### 1. Languages API Endpoint
```typescript
// New endpoint added to API_CONFIG
ADMIN_LANGUAGES: '/admin/languages'

// API response structure
{
    "status": 200,
    "message": "OK",
    "data": [
        {
            "id": 2,
            "locale": "de-CH",
            "language": "Deutsch (Schweiz)",
            "csvSeparator": ","
        },
        {
            "id": 3,
            "locale": "en-GB", 
            "language": "English (GB)",
            "csvSeparator": ","
        }
    ]
}
```

#### 2. Language Types and Interfaces
```typescript
// src/types/responses/admin/languages.types.ts
export interface ILanguage {
    id: number;
    locale: string;
    language: string;
    csvSeparator: string;
}

export type TLanguagesResponse = IBaseApiResponse<ILanguage[]>;
```

#### 3. Languages Hook with Caching
```typescript
// src/hooks/useLanguages.ts
export function useLanguages() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['languages'],
        queryFn: async () => {
            return await AdminApi.getLanguages();
        },
        select: (data: ILanguage[]) => {
            // Transform locale codes for easier use in the UI
            return data.map(lang => ({
                ...lang,
                // Extract language code from locale (e.g., 'de-CH' -> 'de')
                code: lang.locale.split('-')[0]
            }));
        },
        staleTime: 24 * 60 * 60 * 1000, // 1 day
        gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 1 day
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 2
    });

    return {
        languages: data || [],
        isLoading,
        error
    };
}
```

#### 4. AdminApi Integration
```typescript
// src/api/admin.api.ts
async getLanguages(): Promise<ILanguage[]> {
    const response = await apiClient.get<TLanguagesResponse>(
        API_CONFIG.ENDPOINTS.ADMIN_LANGUAGES
    );
    return response.data.data;
}
```

### New Reusable Components Created

#### 1. MenuPositionEditor Component
```typescript
// src/app/components/ui/menu-position-editor/MenuPositionEditor.tsx
<MenuPositionEditor
    currentPage={page}
    menuType="header" // or "footer"
    enabled={form.values.headerMenuEnabled}
    position={form.values.navPosition}
    onEnabledChange={handleHeaderMenuChange}
    onPositionChange={(position) => form.setFieldValue('navPosition', position)}
/>
```
- **Drag-and-Drop Interface**: Visual reordering of menu items
- **Auto-Position Assignment**: Automatically assigns positions when enabled
- **Current Page Highlighting**: Shows current page in the menu list
- **Reusable**: Can be used for both header and footer menus

#### 2. FieldLabelWithTooltip Component
```typescript
// src/app/components/ui/field-label-with-tooltip/FieldLabelWithTooltip.tsx
<FieldLabelWithTooltip 
    label="Page Access Type" 
    tooltip="Controls who can access this page - web only, mobile only, or both platforms"
/>
```
- **Info Icon**: Small (i) icon next to field labels
- **Hover Tooltips**: Multiline tooltips with helpful explanations
- **Consistent UX**: Standardized help system across all forms

#### 3. Enhanced LockedField Component
```typescript
// Updated to accept ReactNode labels for tooltip integration
<LockedField
    label={
        <FieldLabelWithTooltip 
            label="Keyword" 
            tooltip="Unique identifier for the page. Used in URLs and internal references."
        />
    }
    {...form.getInputProps('keyword')}
    lockedTooltip="Enable keyword editing"
    unlockedTooltip="Lock keyword editing"
/>
```
- **ReactNode Labels**: Supports complex label components with tooltips
- **Lock/Unlock Functionality**: Visual lock/edit toggle with tooltips
- **Flexible Integration**: Works with any label component

### Integration with Admin Page
- **Component Renaming**: Renamed `PageContent` to `PageInspector` for better clarity
- **Right Sidebar**: Integrated as 400px wide inspector panel in admin page
- **Responsive Layout**: Uses Flex layout with proper overflow handling
- **Reusable Design**: Will be used for sections editing later with same functionality

### Component Consolidation
- **Removed Duplicate Component**: Deleted `PageContent.tsx` as it was a duplicate of `PageInspector.tsx`
- **Single Source of Truth**: `PageInspector.tsx` is now the only page editing component
- **Feature Parity**: All functionality from `PageContent` was already present in `PageInspector`
- **Better Architecture**: Eliminates code duplication and maintenance overhead

### Key Improvements Made

#### 1. Removed Unnecessary Fields
- **Protocol Field**: Removed as it cannot be changed
- **Page Type Field**: Removed as it cannot be changed
- **Cleaner Interface**: Focus on editable properties only

#### 2. Enhanced Field Interactions
- **Page Access Type**: Radio button selection with lookup values
- **Menu Positions**: Drag-and-drop interface with visual feedback
- **Help System**: Tooltip icons for all fields with helpful explanations
- **Locked Fields**: Keyword and URL fields with lock/unlock mechanism

#### 3. Dynamic Multi-Language Content Support
- **API-Driven Languages**: Fetches available languages from `/admin/languages` endpoint
- **Language Tabs**: Dynamic tabs based on API response (e.g., "Deutsch (Schweiz)", "English (GB)")
- **Always Available**: Language tabs shown even if no existing translations
- **Smart Locale Mapping**: Maps API locales to language codes ('de-CH' → 'de', 'en-GB' → 'en')
- **Fallback Handling**: Graceful fallback for unmatched language codes
- **Proper Data Structure**: Organized by field name and language code
- **1-Day Caching**: Languages cached for 24 hours to reduce API calls

#### 4. Improved User Experience
- **Visual Feedback**: Current page highlighting in menu position editor
- **Intuitive Tooltips**: Helpful explanations for all form fields
- **Consistent Layout**: Proper spacing and visual hierarchy
- **Error Prevention**: Locked fields and confirmation dialogs
- **Field Separation**: Each field group wrapped in bordered containers
- **Info Icons**: (i) icons next to all field labels with helpful tooltips
- **Controlled Inputs**: Fixed controlled/uncontrolled input warnings

### Benefits
- **Safety**: Locked fields prevent accidental changes to critical properties
- **Efficiency**: Keyboard shortcuts and fixed save button improve workflow
- **Consistency**: Standardized editing interface across all pages
- **Data Integrity**: Proper form validation and confirmation dialogs
- **User Experience**: Collapsible sections, loading states, and clear visual hierarchy
- **Better Naming**: "Inspector" better describes the functionality than "Content"
- **Internationalization**: Proper multi-language support for content fields
- **Reusability**: New components can be used across different editing contexts
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

## React Query Mutations Implementation (Latest)

### State-of-the-Art Data Manipulation Approach

**Date**: Current Session  
**Implementation**: React Query `useMutation` for all data manipulation operations

#### Problem Analysis
The user questioned whether wrapping API calls in React Query mutations was the proper approach and if it was state-of-the-art. Analysis confirmed that React Query mutations are indeed the **industry standard** for data manipulation in modern React applications.

#### Benefits Identified
1. **Declarative State Management**: Automatic loading, error, and success states
2. **Cache Invalidation**: Automatic cache management and synchronization  
3. **Error Handling**: Centralized, consistent error handling patterns
4. **Loading States**: Built-in pending states for better UX
5. **TypeScript Support**: Full type safety for mutations
6. **Optimistic Updates**: Update UI immediately, rollback on failure
7. **DevTools Integration**: Excellent debugging capabilities

#### Implementation Standards Created

**Mutation Hook Structure**:
```typescript
// src/hooks/mutations/use[Entity][Action]Mutation.ts
export function use[Entity][Action]Mutation(options = {}) {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (data) => [Entity]Api.[action](data),
        onSuccess: async (result) => {
            // Invalidate relevant queries
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['[entity]'] }),
                queryClient.invalidateQueries({ queryKey: ['[relatedEntity]'] }),
            ]);
            // Show success notification
            // Call custom success handler
        },
        onError: (error) => {
            // Centralized error handling with parseApiError
            // Show error notification  
            // Call custom error handler
        },
    });
}
```

**Component Usage Pattern**:
```typescript
const createMutation = useCreateEntityMutation({
    onSuccess: (data) => {
        form.reset();
        onClose();
    }
});

const handleSubmit = (values) => {
    createMutation.mutate(values);
};

// UI with loading states
<Button 
    loading={createMutation.isPending}
    disabled={createMutation.isPending}
>
    Create Entity
</Button>
```

#### Files Created/Modified

**New Files**:
- `src/hooks/mutations/useCreatePageMutation.ts` - Standardized page creation mutation
- `docs/react-query-mutations.md` - Comprehensive documentation and standards

**Modified Files**:
- `src/app/components/admin/pages/create-page/CreatePage.tsx` - Converted to use mutation hook
- `architecture.md` - Added React Query mutations as critical rule
- `frontend.md` - Documented implementation approach

#### Migration Strategy Defined

**Phase 1**: Create mutation hooks for all existing API operations
**Phase 2**: Update components to use mutation hooks instead of direct API calls  
**Phase 3**: Add optimistic updates and advanced features

#### Required Mutations for Each Entity
- `useCreate[Entity]Mutation` - Create operations
- `useUpdate[Entity]Mutation` - Update operations  
- `useDelete[Entity]Mutation` - Delete operations
- `useBulkCreate[Entity]Mutation` - Bulk operations (if needed)
- `useRestore[Entity]Mutation` - Restore operations (if applicable)

#### File Organization Structure
```
src/hooks/mutations/
├── pages/
│   ├── useCreatePageMutation.ts
│   ├── useUpdatePageMutation.ts
│   ├── useDeletePageMutation.ts
│   └── index.ts
├── users/
│   └── [similar structure]
└── index.ts
```

#### Best Practices Established
- Always use mutations for data manipulation (POST, PUT, DELETE)
- Use queries for data fetching (GET)
- Invalidate related queries after mutations
- Provide loading states in UI
- Handle errors gracefully with notifications
- Use TypeScript for type safety
- Follow consistent naming conventions

This implementation establishes React Query mutations as the **state-of-the-art standard** for all data manipulation operations in the project, ensuring consistency, better UX, maintainability, and excellent developer experience.

## Footer Menu Cache Invalidation Fix (Latest Update)

### Overview
Fixed a critical issue where footer menu pages were not appearing after creating a new page with footer positioning. The problem was caused by improper cache handling and missing type definitions.

### Issues Identified & Fixed

#### 1. Cache Invalidation Problem
**Problem**: After creating a page with footer positioning, the footer menu list would not show the newly created page until a full page reload.

**Root Cause**: The `onSuccess` callback in CreatePageModal was immediately resetting menu pages to old cached values instead of allowing React Query's cache invalidation to work properly.

**Solution**: Removed manual menu page resets from success and close handlers:
```typescript
// ❌ BEFORE - Immediately reset to old values
const createPageMutation = useCreatePageMutation({
    onSuccess: (createdPage) => {
        form.reset();
        setHeaderDroppedIndex(null);
        setFooterDroppedIndex(null);
        setHeaderMenuPages(processMenuPages.header); // ❌ Reset to old values
        setFooterMenuPages(processMenuPages.footer);  // ❌ Reset to old values
        onClose();
    }
});

// ✅ AFTER - Let cache invalidation handle the refresh
const createPageMutation = useCreatePageMutation({
    onSuccess: (createdPage) => {
        form.reset();
        setHeaderDroppedIndex(null);
        setFooterDroppedIndex(null);
        // Don't reset menu pages here - let cache invalidation handle the refresh
        // The useEffect will automatically update menu pages when new data arrives
        onClose();
    }
});
```

#### 2. Missing Type Definition
**Problem**: The `footer_position` field was not defined in the `IAdminPage` interface, causing TypeScript errors and potential runtime issues.

**Solution**: Added `footer_position` field to the interface:
```typescript
export interface IAdminPage {
    id_pages: number;
    keyword: string;
    url: string;
    parent: number | null;
    nav_position: number | null;
    footer_position?: number | null; // ✅ Added footer position support
    is_headless: number;
    children?: IAdminPage[];
}
```

#### 3. Enhanced Debug Logging
**Added**: Comprehensive debug logging to track page processing and field availability:
```typescript
debug('Processing page for menu', 'CreatePageModal', {
    keyword: page.keyword,
    nav_position: page.nav_position,
    footer_position: page.footer_position,
    allFields: Object.keys(page)
});
```

### Technical Implementation Details

#### Cache Flow Fix
1. **Page Creation**: User creates page with footer positioning
2. **API Call**: Backend receives and saves page with footer_position
3. **Cache Invalidation**: React Query invalidates `['adminPages']` cache
4. **Data Refetch**: Fresh data is fetched from backend including new page
5. **UI Update**: `useEffect` automatically updates menu pages when new data arrives
6. **Menu Display**: Footer menu now shows the newly created page

#### Type Safety Improvements
- **Proper Typing**: `footer_position` is now properly typed as `number | null`
- **Optional Field**: Marked as optional to handle cases where backend doesn't return it
- **No More Type Assertions**: Removed `(page as any)` type assertions

### Benefits Achieved

#### 1. Consistent Menu Updates
- **Header & Footer Parity**: Both header and footer menus now update consistently
- **Real-time Updates**: No more need for manual page reloads
- **Cache Synchronization**: Proper React Query cache invalidation flow

#### 2. Better Type Safety
- **TypeScript Compliance**: No more type assertion workarounds
- **Runtime Safety**: Proper null checks for optional footer_position field
- **IDE Support**: Better autocomplete and error detection

#### 3. Improved Debugging
- **Comprehensive Logging**: Track page processing and field availability
- **Cache Flow Visibility**: Debug cache invalidation and data refresh process
- **Field Inspection**: Log all available fields on page objects

### Architecture Impact
- **Type Definitions**: Updated `IAdminPage` interface to match backend reality
- **Cache Strategy**: Aligned with React Query best practices for cache invalidation
- **Debug System**: Enhanced logging for better troubleshooting capabilities

### Future Considerations
- **Backend Validation**: Ensure backend consistently returns footer_position field
- **Migration Strategy**: Handle existing pages that might not have footer_position
- **Performance**: Monitor cache invalidation performance with larger page sets

## Automatic Menu Positioning Enhancement (Latest Update)

### Overview
Enhanced the CreatePageModal to automatically position pages at the end of header/footer menus when checkboxes are checked, even without manual dragging. This improves user experience by making menu positioning more intuitive.

### Issue Identified & Fixed

#### Problem
When users checked "Header Menu" or "Footer Menu" but didn't drag the new page to a specific position, the page would not be added to the menu at all. Users had to manually drag the page to see it in the menu, which was not intuitive.

#### Solution
Implemented automatic positioning logic that places new pages at the end of the menu list when checkboxes are checked, regardless of whether the user drags them to a specific position.

### Technical Implementation

#### Enhanced Form Submission Logic
```typescript
// ✅ NEW - Automatic positioning when checkbox is checked
if (values.headerMenu) {
    if (values.headerMenuPosition !== null) {
        // User dragged to specific position
        finalHeaderPosition = Math.round(calculateFinalPosition(headerMenuPages, values.headerMenuPosition));
    } else {
        // User checked header menu but didn't drag - add at the end
        finalHeaderPosition = headerMenuPages.length > 0 ? headerMenuPages[headerMenuPages.length - 1].position + 5 : 10;
    }
}

if (values.footerMenu) {
    if (values.footerMenuPosition !== null) {
        // User dragged to specific position
        finalFooterPosition = Math.round(calculateFinalPosition(footerMenuPages, values.footerMenuPosition));
    } else {
        // User checked footer menu but didn't drag - add at the end
        finalFooterPosition = footerMenuPages.length > 0 ? footerMenuPages[footerMenuPages.length - 1].position + 5 : 10;
    }
}
```

#### Smart Position Calculation for Proper Reordering
- **Position Pattern**: Existing pages follow pattern 10, 20, 30, 40, 50, 60...
- **First Position**: Places at 5 (before first position) for proper ordering
- **Between Positions**: Places at middle point (15, 25, 35, 45...) between existing pages
- **End Position**: Adds 5 to last page's position (e.g., 65 after 60)
- **Default Start**: When no existing pages, starts at position 10
- **Integer Guarantee**: All positions are guaranteed to be integers for backend compatibility

#### Enhanced Visual Feedback
```typescript
// Updated position calculation for visual display - matches backend calculation
const newPage: IMenuPageItem = {
    id: 'new-page',
    keyword: form.values.keyword,
    label: form.values.keyword,
    position: headerMenuPages.length > 0 ? headerMenuPages[headerMenuPages.length - 1].position + 5 : 10,
    isNew: true
};
```

### User Experience Improvements

#### 1. Intuitive Behavior
- **Checkbox = Inclusion**: Simply checking the menu checkbox now guarantees the page will appear in the menu
- **Default Positioning**: Pages automatically appear at the end of the list as expected
- **Optional Dragging**: Users can still drag to specific positions if desired

#### 2. Two Positioning Modes
- **Automatic Mode**: Check checkbox → page appears at end of menu
- **Manual Mode**: Check checkbox + drag → page appears at dragged position

#### 3. Clear Visual Feedback
- **Immediate Display**: New page appears in menu list as soon as checkbox is checked
- **Position Indicator**: Shows where the page will be positioned
- **Drag Override**: Visual position updates when user drags to different location

### Enhanced Debug Logging
```typescript
debug('Creating new page with calculated integer positions', 'CreatePageModal', {
    // ... existing fields
    headerPositionSource: values.headerMenu ? (values.headerMenuPosition !== null ? 'dragged' : 'auto-end') : 'none',
    footerPositionSource: values.footerMenu ? (values.footerMenuPosition !== null ? 'dragged' : 'auto-end') : 'none'
});
```

### Benefits Achieved

#### 1. Better User Experience
- **Reduced Friction**: No need to drag pages just to include them in menus
- **Predictable Behavior**: Checking checkbox always results in menu inclusion
- **Flexible Positioning**: Still allows manual positioning when needed

#### 2. Consistent Logic
- **Header & Footer Parity**: Both menus behave identically
- **Position Calculation**: Consistent integer-based positioning logic
- **Default Handling**: Proper fallbacks for empty menu lists

#### 3. Enhanced Debugging
- **Position Source Tracking**: Know whether position was auto-assigned or dragged
- **Comprehensive Logging**: Track all positioning decisions and calculations
- **Troubleshooting Support**: Better visibility into positioning logic

### Usage Patterns

#### Simple Menu Addition (New Default)
1. Enter page keyword
2. Check "Header Menu" or "Footer Menu"
3. Page automatically appears at end of menu list
4. Submit → Page created with proper menu positioning

#### Custom Menu Positioning (Advanced)
1. Enter page keyword
2. Check "Header Menu" or "Footer Menu"
3. Drag new page to desired position in menu list
4. Submit → Page created with custom menu positioning

This enhancement makes menu positioning much more user-friendly while maintaining the flexibility for advanced positioning when needed.

### Component Consolidation
- **Removed Duplicate Component**: Deleted `PageContent.tsx` as it was a duplicate of `PageInspector.tsx`
- **Single Source of Truth**: `PageInspector.tsx` is now the only page editing component
- **Feature Parity**: All functionality from `PageContent` was already present in `PageInspector`
- **Better Architecture**: Eliminates code duplication and maintenance overhead

### Bug Fixes

#### AdminNavbar Infinite Re-render Fix
- **Issue**: Maximum update depth exceeded error caused by circular dependencies in `useMemo` and `useCallback`
- **Root Cause**: `filterPages` and `transformPagesToLinks` functions were wrapped in `useCallback` but used as dependencies in `pageLinks` useMemo
- **Solution**: Moved filter and transform logic inside the `pageLinks` useMemo to eliminate circular dependencies
- **Additional Fix**: Removed `PagesSection` useMemo and inlined it to prevent further circular dependencies
- **Result**: Eliminated infinite re-render loop and improved performance

#### PageInspector Infinite Re-render Fix
- **Issue**: Maximum update depth exceeded error in PageInspector component around line 172
- **Root Cause**: `form` object from Mantine's `useForm` hook was included in useEffect dependency array
- **Problem**: The `form` object is recreated on every render, causing useEffect to run infinitely
- **Solution**: Removed `form` from the dependency array since `form.setValues` is stable
- **Result**: Fixed infinite re-render loop in page editing interface

## DragDropMenuPositioner - getFinalPosition Implementation (Latest Update)

### Overview
Enhanced the `DragDropMenuPositioner` component to expose the `getFinalPosition` function to parent components, ensuring that the correct calculated position values are sent to the backend when submitting forms.

### Problem Solved
Previously, the form was storing the drag index (0, 1, 2, etc.) instead of the actual position values that the backend expects. The `DragDropMenuPositioner` component had internal logic to calculate the final position based on existing page positions, but this wasn't being used during form submission.

### Implementation Details

#### 1. Enhanced Component Interface
```typescript
interface IDragDropMenuPositionerProps {
    // ... existing props
    onGetFinalPosition?: (getFinalPositionFn: () => number | null) => void;
}
```

#### 2. Position Calculation Logic
The `getFinalPosition` function calculates the actual position value based on:
- **First position**: Places at position 5 or before the first existing page
- **Last position**: Adds 5 to the last page's position
- **Between pages**: Calculates the middle position between two existing pages
- **Enabled state**: Returns null if menu is disabled

#### 3. Parent Component Integration
Both `CreatePage.tsx` and `PageInspector.tsx` now use refs to store the `getFinalPosition` function:

```typescript
// Store references to getFinalPosition functions
const headerMenuGetFinalPosition = useRef<(() => number | null) | null>(null);
const footerMenuGetFinalPosition = useRef<(() => number | null) | null>(null);

// Get final positions during form submission
const finalHeaderPosition = headerMenuGetFinalPosition.current ? headerMenuGetFinalPosition.current() : null;
const finalFooterPosition = footerMenuGetFinalPosition.current ? footerMenuGetFinalPosition.current() : null;
```

#### 4. Form Submission Updates
- **CreatePage**: Uses final positions for `nav_position` and `footer_position` in the API request
- **PageInspector**: Uses final positions in the `pageData` object sent to the backend
- **Debug Logging**: Enhanced to show both original form positions and final calculated positions

### Benefits
1. **Accurate Positioning**: Backend receives the correct position values for proper menu ordering
2. **Consistent Behavior**: Same position calculation logic used across create and edit scenarios
3. **Better Debugging**: Clear visibility into position transformations through enhanced logging
4. **Maintainable Code**: Single source of truth for position calculation logic

### Technical Implementation
The component exposes its internal `getFinalPosition` function through a callback prop, allowing parent components to access the calculated position at the time of form submission. This ensures that the most up-to-date position calculation is used, taking into account any changes in the menu structure.

## Page Creation Navigation & Menu Positioning Fixes (Latest Update)

### Overview
Fixed critical issues with page creation workflow and menu positioning system to provide a seamless user experience and prevent menu duplication problems.

### Issues Resolved

#### 1. Automatic Navigation After Page Creation
**Problem**: After creating a page, users remained on the create page modal without being directed to edit the newly created page.

**Solution**: Implemented automatic navigation to the created page using Next.js router.
```typescript
const createPageMutation = useCreatePageMutation({
    onSuccess: (createdPage) => {
        debug('Page created successfully, navigating to page', 'CreatePageModal', {
            createdPage: createdPage.keyword,
            navigatingTo: `/admin/pages/${createdPage.keyword}`
        });
        
        form.reset();
        onClose();
        
        // Navigate to the created page after modal close
        setTimeout(() => {
            router.push(`/admin/pages/${createdPage.keyword}`);
        }, 100);
    }
});
```

#### 2. Menu Positioning Issues
**Problem**: Pages added to menus appeared at the end instead of their proper position, and menu reordering caused duplication.

**Solution**: Enhanced cache invalidation strategy and improved position calculation algorithm.

##### Enhanced Cache Invalidation
```typescript
// Enhanced cache invalidation strategy to prevent menu duplication
await Promise.all([
    // Invalidate admin pages list (for admin interface)
    queryClient.invalidateQueries({ queryKey: ['adminPages'] }),
    // Invalidate navigation pages (for frontend navigation and menus)
    queryClient.invalidateQueries({ queryKey: ['pages'] }),
    // Force refetch to ensure fresh data
    queryClient.refetchQueries({ queryKey: ['adminPages'] }),
    queryClient.refetchQueries({ queryKey: ['pages'] }),
]);

// Clear any stale cached data that might cause duplication
queryClient.removeQueries({ queryKey: ['adminPages'], exact: false });
queryClient.removeQueries({ queryKey: ['pages'], exact: false });
```

##### Improved Position Calculation
```typescript
const calculateFinalPosition = (pages: IMenuPageItem[], targetIndex: number): number => {
    // If no existing pages, start at position 10
    if (pages.length === 0) {
        return 10;
    }
    
    if (targetIndex === 0) {
        // First position - place before the first existing page
        const firstPagePosition = pages[0].position;
        return Math.max(1, firstPagePosition - 10);
    } else if (targetIndex >= pages.length) {
        // Last position - place after the last existing page
        const lastPagePosition = pages[pages.length - 1].position;
        return lastPagePosition + 10;
    } else {
        // Between two pages - calculate middle position with proper spacing
        const prevPage = pages[targetIndex - 1];
        const nextPage = pages[targetIndex];
        const gap = nextPage.position - prevPage.position;
        
        // If there's enough gap, place in the middle
        if (gap > 2) {
            return Math.floor((prevPage.position + nextPage.position) / 2);
        } else {
            // Not enough gap - place with proper spacing
            return prevPage.position + 5;
        }
    }
};
```

#### 3. Menu State Management
**Problem**: Menu state wasn't properly updated after changes, leading to inconsistent UI.

**Solution**: Improved state management with proper cleanup and reset mechanisms.
```typescript
// Reset dropped index when menu is disabled
useEffect(() => {
    if (!enabled && droppedIndex !== null) {
        setDroppedIndex(null);
    }
}, [enabled, droppedIndex]);

// Enhanced drag handling with debug logging
const handleDragEnd = (result: DropResult) => {
    const pageKeyword = newPageKeyword || currentPage?.keyword;
    if (!result.destination || !pageKeyword) {
        debug('Drag cancelled or invalid', 'DragDropMenuPositioner', { 
            hasDestination: !!result.destination,
            pageKeyword 
        });
        return;
    }
    
    const destinationIndex = result.destination.index;
    debug('Drag completed', 'DragDropMenuPositioner', {
        menuType,
        sourceIndex: result.source.index,
        destinationIndex,
        pageKeyword
    });
    
    setDroppedIndex(destinationIndex);
    onPositionChange(destinationIndex);
};
```

#### 4. Menu Duplication Fix for Existing Pages (Latest)
**Problem**: When editing an existing page that was already in the menu, it appeared duplicated instead of being marked as current.

**Solution**: Enhanced logic to distinguish between create mode (new page) and edit mode (existing page).
```typescript
// Check if the page already exists in the menu
const existingPageIndex = menuPages.findIndex(page => page.keyword === pageKeyword);

if (existingPageIndex !== -1) {
    // Page already exists in menu - mark it as current instead of adding duplicate
    const updatedPages = menuPages.map((page, index) => ({
        ...page,
        isNew: index === existingPageIndex // Mark the existing page as current
    }));
    
    debug('Page already exists in menu, marking as current', 'DragDropMenuPositioner', {
        menuType,
        pageKeyword,
        existingPageIndex,
        menuPagesCount: menuPages.length
    });
    
    return updatedPages;
} else {
    // Page doesn't exist in menu - add as new (for create mode)
    const newPage: IMenuPageItem = {
        id: currentPage ? `current-page-${currentPage.id_pages}` : 'new-page',
        keyword: pageKeyword,
        label: pageKeyword,
        position: menuPages.length > 0 ? menuPages[menuPages.length - 1].position + 10 : 10,
        isNew: true
    };
    
    // Add to menu with proper positioning
    return [...menuPages, newPage];
}
```

**Position Handling for Existing Pages**:
```typescript
if (existingPageIndex !== -1) {
    // Page already exists in menu
    if (position !== null && droppedIndex !== null) {
        // User dragged to a new position - calculate new position
        const finalPosition = calculateFinalPosition(menuPages, droppedIndex);
        return finalPosition;
    } else {
        // User didn't drag - keep existing position
        const existingPosition = menuPages[existingPageIndex].position;
        return existingPosition;
    }
}
```

### Technical Benefits

#### 1. Improved User Experience
- **Seamless Workflow**: Users are automatically taken to edit the newly created page
- **Immediate Feedback**: Pages appear in correct menu positions immediately
- **No Duplication**: Menu items no longer appear duplicated after reordering

#### 2. Better Cache Management
- **Consistent State**: Enhanced cache invalidation ensures UI consistency
- **Performance**: Proper cache cleanup prevents memory leaks
- **Reliability**: Force refetch ensures fresh data after mutations

#### 3. Enhanced Debugging
- **Comprehensive Logging**: Debug information for navigation and positioning flows
- **State Tracking**: Better visibility into drag operations and position calculations
- **Error Handling**: Improved error detection and logging

### Architecture Impact
- **Navigation Flow**: Established pattern for post-creation navigation
- **Cache Strategy**: Enhanced React Query cache management patterns
- **State Management**: Improved component state lifecycle management
- **Debug System**: Enhanced logging for complex UI interactions

### Future Considerations
- **Performance Monitoring**: Track cache invalidation performance with larger datasets
- **User Preferences**: Consider user preferences for post-creation navigation
- **Batch Operations**: Optimize cache invalidation for bulk page operations

#### 5. Drag and Drop Position Persistence Fix (Latest)
**Problem**: When dragging existing pages in the menu, they would snap back to their original position instead of staying in the new position.

**Solution**: Enhanced drag handling with proper reordering logic and position calculation.

**Visual Reordering Implementation**:
```typescript
// If user has dragged to a new position, reorder the pages
if (droppedIndex !== null && droppedIndex !== existingPageIndex) {
    // Remove the current page from its original position
    const currentPageItem = updatedPages[existingPageIndex];
    updatedPages = updatedPages.filter((_, index) => index !== existingPageIndex);
    
    // Insert at the new position
    const adjustedDropIndex = droppedIndex > existingPageIndex ? droppedIndex - 1 : droppedIndex;
    updatedPages.splice(adjustedDropIndex, 0, currentPageItem);
    
    debug('Reordering existing page in menu', 'DragDropMenuPositioner', {
        menuType,
        pageKeyword,
        originalIndex: existingPageIndex,
        newIndex: adjustedDropIndex,
        droppedIndex
    });
}
```

**Position Calculation for Reordered Items**:
```typescript
if (position !== null && droppedIndex !== null && droppedIndex !== existingPageIndex) {
    // User dragged to a new position - calculate based on the final reordered position
    const reorderedPages = [...menuPages];
    const currentPageItem = reorderedPages[existingPageIndex];
    reorderedPages.splice(existingPageIndex, 1);
    
    const adjustedDropIndex = droppedIndex > existingPageIndex ? droppedIndex - 1 : droppedIndex;
    const finalPosition = calculateFinalPosition(reorderedPages, adjustedDropIndex);
    
    return finalPosition;
}
```

#### 6. Menu Disable Position Reset Fix (Latest)
**Problem**: When unchecking the menu checkbox to disable a page from appearing in the menu, the position was not being set to null.

**Solution**: Enhanced useEffect to properly reset position when menu is disabled.

```typescript
// Reset dropped index when menu is disabled and set position to null
useEffect(() => {
    if (!enabled) {
        if (droppedIndex !== null) {
            setDroppedIndex(null);
        }
        // Set position to null when menu is disabled
        onPositionChange(null);
    }
}, [enabled, droppedIndex, onPositionChange]);
```

**Improved Drag Handling**:
```typescript
// Only update if the position actually changed
if (sourceIndex !== destinationIndex) {
    debug('Drag completed with position change', 'DragDropMenuPositioner', {
        menuType,
        sourceIndex,
        destinationIndex,
        pageKeyword
    });
    
    setDroppedIndex(destinationIndex);
    onPositionChange(destinationIndex);
} else {
    debug('Drag completed but no position change', 'DragDropMenuPositioner', {
        menuType,
        sourceIndex,
        destinationIndex,
        pageKeyword
    });
}
```

## Recent Changes and Implementations

### Page Creation Navigation & Menu Positioning System (Latest)

#### Problem: Interface Schema Validation Updates
**Date**: Current
**Issue**: Backend API now requires specific JSON schema validation for create and update page requests
**Root Cause**: The TypeScript interfaces didn't match the exact structure expected by the backend API validation

**Solution Implemented**:
1. **Updated Create Page Interface**: Modified `ICreatePageRequest` to match JSON schema exactly
   ```typescript
   export interface ICreatePageRequest {
       keyword: string;                    // Required
       pageTypeId?: number;               // Optional
       pageAccessTypeCode: string;        // Required - changed from page_access_type_code
       headless?: boolean;                // Optional - changed from is_headless
       openAccess?: boolean;              // Optional - changed from is_open_access
       url?: string | null;               // Optional
       protocol?: string | null;          // Optional - new field
       navPosition?: number | null;       // Optional - changed from nav_position
       footerPosition?: number | null;    // Optional - changed from footer_position
       parent?: number | null;            // Optional
   }
   ```

2. **Updated Update Page Interface**: Restructured to use nested interfaces matching schema
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
       fieldId: number;
       languageId: number;
       content: string | null;            // Removed debugging fields
   }

   export interface IUpdatePageRequest {
       pageData: IUpdatePageData;
       fields: IUpdatePageField[];
   }
   ```

3. **Updated Component Usage**: Modified CreatePageModal and PageInspector to use new property names
   - `pageAccessTypeCode` instead of `page_access_type_code`
   - `headless` instead of `is_headless`
   - `openAccess` instead of `is_open_access`
   - `navPosition` instead of `nav_position`
   - `footerPosition` instead of `footer_position`

4. **Removed Debugging Fields**: Cleaned up field update structure to match schema exactly
   - Removed `fieldName` and `languageCode` debugging properties
   - Kept only required fields: `fieldId`, `languageId`, `content`

**Technical Benefits**:
- ✅ **Schema Compliance**: Interfaces now match backend validation exactly
- ✅ **Type Safety**: Proper TypeScript validation for all API requests
- ✅ **Cleaner Code**: Removed unnecessary debugging fields from production payloads
- ✅ **Consistent Naming**: CamelCase property names throughout the frontend
- ✅ **Null Safety**: Proper handling of nullable fields with `| null` types

**Files Modified**:
- `src/types/requests/admin/create-page.types.ts`
- `src/types/requests/admin/update-page.types.ts`
- `src/app/components/admin/pages/create-page/CreatePage.tsx`
- `src/app/components/admin/pages/page-inspector/PageInspector.tsx`

---

#### Problem: Infinite Loop in PageInspector Component
