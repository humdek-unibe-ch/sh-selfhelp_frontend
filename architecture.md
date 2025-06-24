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

## 2.1. Dynamic Page Content Rendering with Multi-Language Support (Latest Update)

### Comprehensive Page Content System
Implemented a complete page content rendering system with dynamic style component loading, multi-language support, and fallback handling for unknown styles.

#### Core Features
- **Dynamic Style Rendering**: Automatically renders page sections using appropriate style components based on `style_name`
- **Multi-Language Support**: Language selector in header for non-authenticated users with URL parameter persistence
- **Fallback System**: UnknownStyle component for unrecognized or unimplemented style types
- **Recursive Content Loading**: Handles nested sections and children properly
- **URL Parameter Management**: Language preference stored in URL query parameters
- **Auto-Language URL**: Non-authenticated users automatically redirected to include default language parameter

#### Technical Implementation
```typescript
// Public language fetching for non-authenticated users
const { languages, defaultLanguage } = usePublicLanguages();

// Auto-redirect non-authenticated users to include default language
useEffect(() => {
    if (!user && !languageParam && defaultLanguage && !languagesLoading) {
        const params = new URLSearchParams(searchParams);
        params.set('language', defaultLanguage.locale);
        router.replace(`${pathname}?${params.toString()}`);
    }
}, [user, languageParam, defaultLanguage, languagesLoading]);

// Page content rendering with locale support
const languageParam = searchParams.get('language');
const language = languageParam || undefined; // Use URL param or let backend use default
const { content: queryContent, isLoading: pageLoading } = usePageContent(keyword, language);

// Language selector with locale values
const languageOptions = languages.map(lang => ({
    value: lang.locale, // e.g., 'de-CH', 'en-GB'
    label: lang.language // e.g., 'Deutsch (Schweiz)', 'English (GB)'
}));

// Dynamic style component selection
const supportedStyles = [
    'container', 'image', 'markdown', 'heading', 'card', 
    'div', 'button', 'carousel', 'link', 'formUserInputLog', 'textarea'
];

if (supportedStyles.includes(section.style_name)) {
    return <BasicStyle key={key} style={section} />;
} else {
    return <UnknownStyle key={`unknown-${key}`} style={section} />;
}
```

#### Component Architecture
- **PageContentRenderer**: Main content rendering component with recursive section handling
- **LanguageSelector**: Multi-language dropdown with URL parameter management
- **UnknownStyle**: Developer-friendly fallback component with debugging information
- **Enhanced BasicStyle**: Centralized style component factory with type safety

#### API Integration
- **Public Language API**: Separate `/languages` endpoint for non-authenticated users
- **Language Parameter Support**: Page content API accepts optional locale parameter (e.g., 'de-CH', 'en-GB')
- **Query Key Optimization**: React Query keys include language for proper caching with fallback to 'default'
- **URL Parameter Encoding**: Proper encoding of locale codes in API requests
- **Default Language**: First language from API response used as default
- **Automatic URL Enhancement**: Non-authenticated users visiting pages without language parameter are automatically redirected to include default language

#### Benefits
- **Extensible Architecture**: Easy to add new style components without modifying core logic
- **Developer Experience**: Clear debugging information for missing style implementations
- **User Experience**: Seamless language switching with persistent URL state
- **Performance**: Proper caching and Suspense boundaries for smooth loading
- **Type Safety**: Full TypeScript support with proper interface definitions

## 2.2. Modular Inspector Components (Previous Update)

### Shared Component Architecture for Page and Section Inspectors
Implemented a comprehensive modular component system to eliminate code duplication between PageInspector and SectionInspector, improving maintainability and consistency.

#### Core Shared Components
- **FieldRenderer**: Universal field rendering component supporting all field types (text, textarea, markdown-inline, checkbox, unknown types)
- **InspectorHeader**: Reusable header component with title, badges, and action buttons
- **FieldsSection**: Collapsible section for organizing fields with multi-language tab support
- **InspectorLayout**: Main layout wrapper providing consistent structure, loading states, error handling, and empty states

#### Technical Implementation
```typescript
// Shared field data interface
interface IFieldData {
    id: number;
    name: string;
    type: string | null;
    default_value: string | null;
    help: string | null;
    disabled?: boolean;
    hidden?: number;
    display?: boolean;
}

// Modular field rendering
<FieldRenderer
    field={field}
    value={value}
    onChange={(newValue) => handleFieldChange(field.name, languageCode, newValue)}
    locale={locale}
    className={styles.fullWidthLabel}
/>

// Consistent header structure
<InspectorHeader
    title={title}
    badges={[{ label: 'ID: 123', color: 'blue' }]}
    actions={[
        { label: 'Save', icon: <IconSave />, onClick: handleSave },
        { label: 'Delete', icon: <IconTrash />, onClick: handleDelete, color: 'red' }
    ]}
/>
```

#### URL Structure Improvement
Changed from query parameters to path parameters for better SEO and user experience:
- **Before**: `/admin/pages/test?section=99`
- **After**: `/admin/pages/test/99`

#### Benefits
- **Code Reusability**: Eliminated ~60% code duplication between inspectors
- **Consistent UI**: Unified look and behavior across all inspector components
- **Maintainability**: Single source of truth for field rendering and layout logic
- **Type Safety**: Strongly typed interfaces for all shared components
- **Future-Proof**: Easy to extend for additional inspector types (e.g., StyleInspector)

#### Fixed Issues
- **Infinite Re-render**: Removed `form` object from useEffect dependencies causing infinite loops
- **URL Persistence**: Proper section selection with path-based routing
- **Type Safety**: Fixed all TypeScript compilation errors

## 2.2. Compact Professional Sections Interface (Previous Update)

### Complete Interface Redesign for Compactness and Professional Appeal
Completely redesigned the sections interface with a focus on compactness, professional styling, and enhanced usability. Fixed drag-and-drop functionality and improved visual hierarchy.

#### Major Improvements
- **Compact Design**: Reduced spacing and padding throughout the interface for better space utilization
- **Professional Styling**: Clean, modern design with hover-based interactions and subtle animations
- **Fixed Drag & Drop**: Resolved drag handle connectivity issues and improved drag feedback
- **Visual Hierarchy**: Clear indentation and color-coded levels for better parent-child relationships
- **Hover-Based Actions**: Action buttons only appear on hover to reduce visual clutter

#### Technical Implementation
- **CSS Modules**: Implemented proper CSS module structure for component styling
- **Drag Handle Fix**: Corrected drag handle connection by using element as draggable with dragHandle option
- **Compact Layout**: Reduced margins, padding, and gaps throughout the component tree
- **Level-Based Styling**: Color-coded left borders for different nesting levels
- **Responsive Design**: Mobile-friendly adjustments with proper breakpoints

#### UI/UX Enhancements
- **32px Row Height**: Compact rows for better information density
- **Hover Interactions**: Smooth transitions and hover effects for better user feedback
- **Professional Icons**: Proper file/folder icons based on section capabilities
- **Truncated Text**: Smart text truncation with tooltips for long section names
- **Empty State**: Improved empty state with friendly messaging and visual cues

#### Advanced Drag & Drop System (Following Atlassian Pattern)
- **Dual Drop Targets**: Separate handling for edge positioning and container drops
- **Visual Drop Indicators**: Clear line indicators for edge drops and container highlights for inside drops
- **Drag State Management**: Dragged elements and their children become inactive during drag operations
- **Smart Drop Zones**: Empty containers show pulsing drop zones when hovered during drag
- **Enhanced Feedback**: Real-time visual feedback with color-coded drop states (blue for edges, green for containers)
- **Accessibility**: Screen reader announcements for all drag operations and drop locations
- **Performance**: Optimized drag preview with custom styling and proper cleanup

## 2.2. Enhanced Tree Interface with Pragmatic Drag and Drop (Previous Update)

### Complete Tree Interface Overhaul
Implemented a professional-grade tree interface using Pragmatic Drag and Drop library with advanced features, improved UI/UX, and reorganized page information architecture.

#### Key Features
- **Advanced Drag & Drop**: Hitboxes, auto-scroll, visual feedback, and performance optimization
- **Smart Positioning**: Dynamic position calculation based on drop location and gap management
- **Clean UI Design**: Hover states, smooth animations, and clear visual hierarchy
- **Enhanced Tree Logic**: Circular reference prevention and context-aware operations
- **Page Info Reorganization**: Moved from main content to right inspector panel

#### Technical Architecture
```typescript
// Context-based state management
interface ISectionsTreeContext {
    dispatch: (action: ITreeAction) => void;
    uniqueContextId: symbol;
    getPathToItem: (targetId: string) => IPageField[];
    getMoveTargets: (args: { itemId: string }) => IPageField[];
    getChildrenOfItem: (itemId: string) => IPageField[];
    expandedSections: Set<number>;
    onToggleExpand: (sectionId: number) => void;
    registerTreeItem: (args: {
        itemId: string;
        element: HTMLElement;
        actionMenuTrigger: HTMLElement;
    }) => () => void;
}

// Smart positioning algorithm
const calculateNewPosition = (targetSection, edge, targetParentId) => {
    const siblings = getSiblingsAtLevel(targetParentId);
    const sortedSiblings = siblings.sort((a, b) => a.position - b.position);
    
    if (edge === 'top') {
        const targetIndex = sortedSiblings.findIndex(s => s.id === targetSection.id);
        if (targetIndex === 0) return targetSection.position - 10;
        
        const prevPosition = sortedSiblings[targetIndex - 1].position;
        const gap = targetSection.position - prevPosition;
        return gap > 2 ? Math.floor((prevPosition + targetSection.position) / 2) : prevPosition + 1;
    }
    // Similar logic for bottom edge...
};
```

#### Component Architecture
- **SectionsTreeContext**: Provides state management across tree components
- **TreeItem**: Recursive component handling individual tree nodes
- **Registry Pattern**: Manages element references for post-move effects
- **Memoization**: Optimizes performance with `memoizeOne`

#### Performance Benefits
- **Bundle Size Reduction**: ~85% smaller (31kB → 4.7kB) vs previous drag-drop library
- **Optimized Rendering**: Memoized operations and smart re-renders
- **Memory Efficiency**: Registry pattern for element management
- **Accessibility**: Built-in screen reader and keyboard navigation support

#### UI/UX Improvements
- **Visual Hierarchy**: 20px indentation per level, clear container indicators
- **Hover-Based Actions**: Controls only visible on hover for cleaner interface
- **Smooth Transitions**: 0.15s animations for all interactions
- **Color-Coded Actions**: Green (add child), Blue (add sibling), Red (remove)
- **Post-Move Feedback**: Flash effects and live region announcements

#### Page Information Architecture
- **Main Content**: Now focused solely on section tree manipulation
- **Right Inspector**: Contains page info (keyword, URL, ID, badges), content fields, and properties
- **Information Hierarchy**: Page details → Content → Properties → Actions

## 2.2. Section Management System (Previous Update)

### Comprehensive Section Operations
Implemented a complete section management system with full CRUD operations, advanced positioning capabilities, and a comprehensive section creation UI.

#### API Parameter Structure (Updated - Final)
Based on the backend SQL schema, the section operations now use precise parameter structures:

**Add Section Operations** (Adding existing sections via PUT):
- `PUT /admin/pages/{page_keyword}/sections` - Body: `{ section_id: number, position: number }`
- `PUT /admin/sections/{parent_section_id}/sections` - Body: `{ section_id: number, position: number }`

**Create Section Operations** (Create from style then add via POST):
- `POST /admin/pages/{page_keyword}/sections/create` - Body: `{ styleId: number, position: number }`
- `POST /admin/sections/{parent_section_id}/sections/create` - Body: `{ styleId: number, position: number }`

**Remove Section Operations** (DELETE with path parameters only):
- `DELETE /admin/pages/{page_keyword}/sections/{section_id}` - No body parameters
- `DELETE /admin/sections/{parent_section_id}/sections/{child_section_id}` - No body parameters

**Update Section Operations** (Deferred for later implementation):
- `PUT /admin/sections/{section_id}` - To be implemented later

#### TypeScript Interface Updates (Final)
Updated all mutation hooks and API methods to use strongly typed interfaces:

```typescript
// Add operations - for existing sections (section_id passed as parameter)
interface IAddSectionToPageData {
    position: number; // Only position in body, section_id is parameter
}

interface IAddSectionToSectionData {
    position: number; // Only position in body, section_id is parameter
}

// Create operations - create from style
interface ICreateSectionInPageData {
    styleId: number;
    position: number;
}

interface ICreateSectionInSectionData {
    styleId: number;
    position: number;
}
```

#### Operation Distinctions (Final)
- **Add Operations**: For adding existing sections (requires section_id as parameter + position in body, uses PUT)
- **Create Operations**: First create a new section from a style, then add it (requires styleId + position in body, uses POST)
- **Remove Operations**: Delete operations using path parameters only (no body, uses DELETE)
- **Backend Behavior**: Add and Create result in same outcome but serve different use cases
- **Frontend Usage**: Create operations for new section creation, Add operations for moving existing sections

#### New API Endpoints
Added 8 new API endpoints for section management:
- **Page-Section Operations**:
  - `POST /admin/pages/{pageKeyword}/sections` - Add section to page
  - `PUT /admin/pages/{pageKeyword}/sections/{sectionId}` - Update section in page
  - `DELETE /admin/pages/{pageKeyword}/sections/{sectionId}` - Remove section from page
  - `POST /admin/pages/{pageKeyword}/sections/create` - Create new section in page

- **Section-Section Operations**:
  - `POST /admin/sections/{parentSectionId}/sections` - Add section to section
  - `PUT /admin/sections/{parentSectionId}/sections/{childSectionId}` - Update section in section
  - `DELETE /admin/sections/{parentSectionId}/sections/{childSectionId}` - Remove section from section
  - `POST /admin/sections/{parentSectionId}/sections/create` - Create new section in section

- **Style Management**:
  - `GET /admin/styles` - Fetch all available styles grouped by categories

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

// Section creation mutations
useCreateSectionInPageMutation()
useCreateSectionInSectionMutation()

// Sibling creation mutations
useCreateSiblingAboveMutation()
useCreateSiblingBelowMutation()
```

#### Section Creation UI System
Implemented a comprehensive modal-based section creation system with style selection:

**AddSectionModal Component Features**:
- **Tabbed Interface**: New Section, Unassigned Section, Reference Section, Import Section
- **Style Browser**: Hierarchical display of all available styles grouped by categories
- **Search Functionality**: Real-time search across style names and descriptions
- **Style Selection**: Visual style selection with detailed descriptions and type badges
- **Context-Aware Creation**: Automatically detects whether creating in page or parent section
- **Custom Naming**: Optional custom section names with fallback to style names

**Style Management Integration**:
```typescript
// New hook for fetching style groups
const { data: styleGroups } = useStyleGroups(opened);

// Style group structure
interface IStyleGroup {
    id: number;
    name: string;
    description: string | null;
    position: number;
    styles: IStyle[];
}

interface IStyle {
    id: number;
    name: string;
    description: string | null;
    typeId: number;
    type: string;
}
```

**Integration Points**:
- **Page Level**: "Add Section" button opens modal for page-level section creation (adds as last child)
- **Child Creation**: "+" button on sections with `can_have_children` opens modal for child creation
- **Sibling Creation**: Arrow buttons above/below each section for precise positioning
  - Green arrow up (↑) button above each section creates sibling above (position - 5)
  - Green arrow down (↓) button below each section creates sibling below (position + 5)
- **Context Detection**: Modal automatically determines creation context (page vs parent section)
- **Cache Invalidation**: All creation operations invalidate relevant queries for immediate UI updates

**Position Calculation System (Updated)**:
- **First Element**: Gets position -1 (temporary)
- **Second Element**: Gets position 5
- **Subsequent Elements**: 15, 25, 35... (previous + 10)
- **Sibling Above**: Reference section position - 1
- **Sibling Below**: Reference section position + 1
- **Normalization**: Backend normalizes to clean 0, 10, 20, 30... pattern

**UI Enhancements**:
- **Fixed Layout**: Modal header and footer always visible, content scrolls between them
- **Hover-Based Controls**: Developer tools inspired border button system
- **Smart Positioning**: Automatic position calculation based on reference section context

**Hover Button System (Developer Tools Inspired)**:
Implemented a sophisticated hover-based button system that mimics browser developer tools interface:

**Layout Structure**:
- **Left Side - Add Buttons**: Sibling above (top) and sibling below (bottom) positioned at left border
- **Left Side - Menu Group**: Eye (inspect) and Square (navigate) buttons grouped with white background and blue border
- **Center - Move Buttons**: Move up (top) and move down (bottom) positioned at center of top/bottom borders
- **Right Side - Delete**: Remove button positioned at top-right corner

**Visual Design**:
- **Border Interaction**: Section border changes from gray to blue on hover with subtle shadow
- **Button Positioning**: Buttons positioned outside section borders (-18px offset)
- **Icon Styling**: 16px icons with radial gradient white background for visibility
- **Menu Grouping**: Left-side menu buttons have white background with blue border for clear grouping
- **Smooth Transitions**: CSS transitions for all hover states and button appearances

**Technical Implementation**:
```css
.sectionContainer {
    border: 1.5px solid var(--mantine-color-gray-4);
    transition: all 0.2s ease;
}

.sectionContainer:hover {
    border-color: var(--mantine-color-blue-6);
}

.buttonsHolder {
    display: none;
    position: absolute;
    top: -18px; bottom: -18px; left: -18px; right: -18px;
    justify-content: space-between;
    pointer-events: none;
}

.sectionContainer:hover .buttonsHolder {
    display: flex !important;
    z-index: 100;
}
```

**Button Categories**:
- **Green Icons**: Add operations (plus icons for sibling creation)
- **Blue Icons**: Move operations (arrow icons for reordering) and inspection (eye/square icons)
- **Red Icons**: Delete operations (trash icon for removal)

**User Experience**:
- **Hover Activation**: Buttons only appear when hovering over section
- **Clear Visual Hierarchy**: Different colors and positioning for different action types
- **Tooltip Support**: Each button has descriptive tooltips
- **Pointer Events**: Proper event handling to prevent interference with section content

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

## 2.3. Comprehensive Styles System with Database-Driven Architecture

### Complete Style Component Infrastructure
Implemented a comprehensive style system based on the database structure with 82 different style types, proper TypeScript interfaces, and modular component architecture.

#### Database-Driven Type System
Created strongly-typed interfaces for all 82 styles based on the database schema:
- **Base Interface**: Common fields shared across all styles (id, css, condition, debug, data_config)
- **Style Categories**: 
  - Authentication & User Management (login, profile, validate, register, resetPassword, twoFactorAuth)
  - Container & Layout (container, jumbotron, alert, card, div, conditionalContainer)
  - Text & Content (heading, markdown, markdownInline, plaintext, rawText)
  - Form & Input (form, formUserInput, input, textarea, select, radio, slider, checkbox)
  - Media (image, video, audio, figure, carousel)
  - Navigation & Links (button, link, navigationContainer, navigationBar)
  - List Styles (accordionList, nestedList, sortableList, entryList)
  - Tab & Table Styles (tabs, tab, table, tableRow, tableCell)
  - Specialized Styles (progressBar, quiz, chat, json, trigger, loop, etc.)

#### TypeScript Architecture
```typescript
// Base style interface with common fields
interface IBaseStyle {
    id: IIdType;
    id_styles: number;
    style_name: string;
    can_have_children: number;
    position: number;
    path: string;
    children?: TStyle[];
    fields: Record<string, IContentField<any>>;
    css?: string;
    condition?: IContentField<any> | null;
    debug?: IContentField<string>;
    data_config?: IContentField<any>;
    css_mobile?: IContentField<string>;
}

// Content field structure for all field values
export interface IContentField<T> {
    content: T;
    meta?: string;
    type?: string;
    id?: string;
    default?: string;
}

// Union type for all 82 styles
export type TStyle = ILoginStyle | IProfileStyle | IValidateStyle | ... | ILoopStyle;
```

#### Component Implementation Strategy
- **BasicStyle Factory**: Central router component that renders appropriate style components based on style_name
- **Mantine UI Integration**: All form and input components use Mantine UI v7 for consistency
- **Modular Components**: Each style has its own component file with proper interfaces
- **Field Content Helper**: Universal helper function to extract field values from both direct properties and fields object
- **Recursive Rendering**: Styles with children properly render nested content

#### Enhanced BasicStyle Component
```typescript
const BasicStyle: React.FC<IBasicStyleProps> = ({ style }) => {
    if (!style || !style.style_name) return null;

    // Universal field content extractor
    const getFieldContent = (fieldName: string): any => {
        if (fieldName in style) {
            return (style as any)[fieldName]?.content;
        }
        return style.fields?.[fieldName]?.content;
    };

    switch (style.style_name) {
        case 'container':
            return <ContainerStyle style={style} />;
        case 'input':
            return <InputStyle style={style} />;
        case 'select':
            return <SelectStyle style={style} />;
        case 'tabs':
            return <TabsStyle style={style} />;
        // ... 78 more style cases
        default:
            return <UnknownStyle style={style} />;
    }
};
```

#### Mantine UI Components Created
- **InputStyle**: TextInput, NumberInput, PasswordInput, Checkbox, ColorInput with type-based rendering
- **SelectStyle**: Select and MultiSelect with live search, clearable options, and image support
- **TabsStyle**: Mantine Tabs with icon support and proper active state management
- **AlertStyle**: Bootstrap-style alerts with dismissible option using Mantine components
- **JumbotronStyle**: Hero section component with proper styling

#### Field Mapping from Database
Based on the `styles_fields` table mapping, each style interface includes only its relevant fields:
- **Example - Card Style**: title, type, is_expanded, is_collapsible, url_edit
- **Example - Input Style**: label, type_input, placeholder, is_required, name, value, min, max, format, locked_after_submit
- **Example - Select Style**: label, alt, is_required, name, value, items, is_multiple, max, live_search, disabled, image_selector, locked_after_submit, allow_clear

#### Benefits of the New System
- **Type Safety**: Full TypeScript coverage for all 82 style types with proper field definitions
- **Maintainability**: Clear separation of concerns with modular component architecture
- **Extensibility**: Easy to add new styles by creating interface, component, and adding to BasicStyle switch
- **Database Alignment**: Types directly match database schema for consistency
- **Developer Experience**: IntelliSense support for all style properties and fields
- **Performance**: Optimized rendering with proper memoization and conditional checks
- **Consistency**: All form inputs use Mantine UI for unified theming

#### Implementation Status
- **Completed**: Core infrastructure, type system, BasicStyle router, 15+ essential style components
- **In Progress**: Remaining style components (navigation, lists, specialized styles)
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

#### Technical Implementation - Tree Architecture
```typescript
// Tree Context and Reducer for state management
const SectionsTreeContext = createContext<ISectionsTreeContext | null>(null);

function sectionsTreeReducer(state: ISectionsTreeState, action: ITreeAction): ISectionsTreeState {
    if (action.type === 'instruction') {
        // Handle tree manipulation with drag and drop
        return { ...state, data: newTreeData, lastAction: action };
    }
    return state;
}

// Main tree component with context provider
export function SectionsList({ sections, onSectionMove }: SectionsListProps) {
    const [state, dispatch] = useReducer(sectionsTreeReducer, sections, getInitialTreeState);
    const [{ registry, registerTreeItem }] = useState(createTreeItemRegistry);
    
    // Memoized operations for performance
    const getPathToItem = useMemo(() => 
        memoizeOne((targetId: string) => findPath(state.data, targetId) || [])
    , [state.data]);
    
    const contextValue = useMemo<ISectionsTreeContext>(() => ({
        dispatch,
        uniqueContextId: Symbol('sections-tree'),
        getPathToItem,
        getMoveTargets,
        getChildrenOfItem,
        expandedSections,
        onToggleExpand,
        registerTreeItem,
    }), [dependencies]);
    
    // Global monitor for tree drag operations
    useEffect(() => {
        return monitorForElements({
            canMonitor: ({ source }) => 
                source.data.uniqueContextId === contextValue.uniqueContextId,
            onDrop: ({ source, location }) => {
                const itemId = source.data.itemId as string;
                const target = location.current.dropTargets[0];
                const edge = extractClosestEdge(target.data);
                onSectionMove(createMoveData(itemId, target, edge));
            }
        });
    }, [contextValue.uniqueContextId]);
    
    return (
        <SectionsTreeContext.Provider value={contextValue}>
            <Stack gap="xs">
                {sections.map((section, index) => (
                    <TreeItem key={section.id} item={section} level={0} index={index} />
                ))}
            </Stack>
        </SectionsTreeContext.Provider>
    );
}

// Individual tree item with hierarchical rendering
function TreeItem({ item, level, index }: TreeItemProps) {
    const context = useContext(SectionsTreeContext);
    const elementRef = useRef<HTMLDivElement>(null);
    const dragHandleRef = useRef<HTMLDivElement>(null);
    
    const [dragState, setDragState] = useState<'idle' | 'preview' | 'is-dragging'>('idle');
    const [closestEdge, setClosestEdge] = useState<Edge | null>(null);
    
    const { expandedSections, onToggleExpand, registerTreeItem, uniqueContextId } = context;
    const isExpanded = expandedSections.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const canHaveChildren = !!item.can_have_children;
    
    // Register with tree registry for post-move effects
    useEffect(() => {
        if (!elementRef.current) return;
        return registerTreeItem({
            itemId: item.id.toString(),
            element: elementRef.current,
            actionMenuTrigger: elementRef.current
        });
    }, [item.id, registerTreeItem]);
    
    // Setup draggable and drop target with tree-specific logic
    useEffect(() => {
        const element = elementRef.current;
        const dragHandle = dragHandleRef.current;
        if (!element || !dragHandle) return;
        
        return combine(
            draggable({
                element: dragHandle,
                getInitialData: () => ({
                    type: 'tree-item',
                    itemId: item.id.toString(),
                    uniqueContextId,
                    level,
                    canHaveChildren
                }),
                onGenerateDragPreview: () => setDragState('preview'),
                onDragStart: () => setDragState('is-dragging'),
                onDrop: () => setDragState('idle')
            }),
            dropTargetForElements({
                element,
                canDrop: ({ source }) => 
                    source.data.uniqueContextId === uniqueContextId &&
                    source.data.itemId !== item.id.toString(),
                getData: ({ input, element }) => 
                    attachClosestEdge({
                        type: 'tree-item',
                        itemId: item.id.toString(),
                        level,
                        canHaveChildren
                    }, { input, element, allowedEdges: ['top', 'bottom'] }),
                onDragEnter: ({ self }) => setClosestEdge(extractClosestEdge(self.data)),
                onDragLeave: () => setClosestEdge(null)
            })
        );
    }, [item.id, level, uniqueContextId, canHaveChildren]);
    
    return (
        <div>
            {/* Drop indicators with precise positioning */}
            {closestEdge === 'top' && <DropIndicator edge="top" gap="8px" />}
            
            {/* Tree item with visual hierarchy */}
            <Box
                ref={elementRef}
                style={{
                    marginLeft: `${level * 24}px`, // 24px indentation per level
                    opacity: dragState === 'is-dragging' ? 0.5 : 1,
                    backgroundColor: dragState === 'is-dragging' ? 'var(--mantine-color-blue-0)' : undefined
                }}
                p="xs"
            >
                <Group gap="xs" wrap="nowrap">
                    {/* Dedicated drag handle */}
                    <div ref={dragHandleRef} style={{ cursor: 'grab', padding: '4px' }}>
                        <IconGripVertical size={16} />
                    </div>
                    
                    {/* Expand/collapse control */}
                    <ActionIcon
                        size="sm"
                        onClick={() => onToggleExpand(item.id)}
                        disabled={!hasChildren}
                        style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
                    >
                        {isExpanded ? <IconChevronDown /> : <IconChevronRight />}
                    </ActionIcon>
                    
                    {/* Section information */}
                    <Box style={{ flex: 1 }}>
                        <Group gap="xs">
                            <Text size="sm" fw={500}>{item.name}</Text>
                            <Text size="xs" c="dimmed">ID: {item.id}</Text>
                            <Text size="xs" c="dimmed">Style: {item.style_name}</Text>
                            {canHaveChildren && <Text size="xs" c="blue">Can have children</Text>}
                        </Group>
                    </Box>
                    
                    {/* Contextual action buttons */}
                    <Group gap="xs">
                        {canHaveChildren && (
                            <ActionIcon size="sm" color="green" onClick={() => onAddChild(item.id)}>
                                <IconPlus size={14} />
                            </ActionIcon>
                        )}
                        <ActionIcon size="sm" color="red" onClick={() => onRemove(item.id)}>
                            <IconTrash size={14} />
                        </ActionIcon>
                    </Group>
                </Group>
            </Box>
            
            {closestEdge === 'bottom' && <DropIndicator edge="bottom" gap="8px" />}
            
            {/* Recursive children rendering when expanded */}
            {isExpanded && hasChildren && (
                <div>
                    {item.children.map((child, childIndex) => (
                        <TreeItem
                            key={child.id}
                            item={child}
                            level={level + 1}
                            index={childIndex}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
```

#### Drag & Drop Logic - Tree-Like Interface
- **Library**: Uses **Pragmatic Drag and Drop** by Atlassian with tree-specific enhancements (~4.7kB total)
- **Tree Architecture**: Hierarchical tree structure with context-based state management
- **Registry Pattern**: Efficient element reference management for tree items
- **Context & Reducer**: React Context with useReducer for predictable state updates
- **Memoized Operations**: Performance-optimized path calculations with memoizeOne
- **Visual Hierarchy**: Clear parent-child relationships with 24px indentation per level
- **Smart Controls**: Only sections with `can_have_children` show child management options
- **Expand/Collapse**: Interactive tree navigation with visual expand/collapse indicators
- **Drag Handles**: Dedicated grip handles for intuitive drag operations
- **Live Region**: Accessibility announcements for screen reader users
- **Post-Move Flash**: Visual feedback with flourish effects after successful moves

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