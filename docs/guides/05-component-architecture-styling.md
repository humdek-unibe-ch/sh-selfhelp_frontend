# 5. 🎨 Component Architecture & Styling

## Component Hierarchy

**Mantine-First Approach**: Always prefer Mantine components over custom HTML/Tailwind:

```typescript
// ✅ GOOD - Use Mantine components
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

## Dynamic Field Configuration System

The application supports dynamic field configuration through the `fieldConfig` property, enabling advanced select fields with API-driven options.

### Field Configuration Structure

```typescript
interface IFieldConfig {
    multiSelect?: boolean;        // Enable multi-select functionality
    creatable?: boolean;          // Allow custom value creation
    separator?: string;           // Separator for multi-select values (default: " ")
    options?: Array<{            // Static options array
        value: string;
        text: string;
    }>;
    apiUrl?: string;             // API endpoint for dynamic options
}
```

### Supported Field Types

**select-css**: Dynamic CSS class selection with API integration
- **Multi-select support**: Select multiple CSS classes
- **API integration**: Fetches options from `/frontend/css-classes`
- **Searchable**: Real-time filtering of options
- **Separator handling**: Configurable separator for multi-select values (default: space)

**select-group**: Dynamic group selection with API integration
- **Multi-select support**: Select multiple groups
- **API integration**: Fetches options from `/frontend/groups-options`
- **Searchable**: Real-time filtering of options
- **Separator handling**: Configurable separator for multi-select values (default: comma)

**select-data_table**: Dynamic data table selection
- **Single select only**: Select one data table
- **API integration**: Fetches options from `/frontend/data-tables-options`
- **Searchable**: Real-time filtering of options
- **Separator handling**: Configurable separator (default: comma)

**select-page-keyword**: Dynamic page keyword selection with API integration
- **Multi-select support**: Select multiple page keywords
- **API integration**: Fetches options from `/frontend/page-keywords-options`
- **Searchable**: Real-time filtering of options
- **Separator handling**: Configurable separator for multi-select values (default: comma)

### Implementation Example

```typescript
// CSS field configuration from backend
{
    "id": 23,
    "name": "css",
    "title": "CSS Classes",
    "type": "select-css",
    "fieldConfig": {
        "multiSelect": true,
        "creatable": true,
        "separator": " ",
        "apiUrl": "/cms-api/v1/frontend/css-classes"
    }
}
```

### Field Renderer Integration

The `FieldRenderer` component automatically handles field configuration:

```typescript
// Automatic field type detection and rendering
if (field.type === 'select-css') {
    const { data: cssClasses, isLoading } = useCssClasses();
    const fieldConfig = field.fieldConfig;

    // Convert API options to Mantine format
    const options = (fieldConfig.options || cssClasses || []).map(option => ({
        value: option.value,
        label: option.text
    }));

    // Render appropriate select component
    if (fieldConfig.multiSelect) {
        return <MultiSelect data={options} searchable clearable />;
    } else {
        return <Select data={options} searchable clearable />;
    }
}
```

## Style System Architecture

**Dynamic Style Components**: 82+ components for different content types

```typescript
// BasicStyle.tsx - Component factory
const BasicStyle: React.FC<IBasicStyleProps> = ({ style }) => {
    switch (style.style_name) {
        case 'container': return <ContainerStyle style={style} />;
        case 'heading': return <HeadingStyle style={style} />;
        case 'markdown': return <MarkdownStyle style={style} />;
        case 'image': return <ImageStyle style={style} />;
        // ... 78+ more cases
        default: return <UnknownStyle style={style} />;
    }
};
```

**Style Categories**:
- **Layout**: container, div, card, jumbotron
- **Content**: heading, markdown, plaintext, rawText
- **Media**: image, video, audio, carousel
- **Forms**: input, textarea, select, checkbox, radio
- **Navigation**: button, link, navigationContainer
- **Interactive**: tabs, accordion, modal, quiz

## Component Organization

The component architecture follows a clear separation based on usage context:

```
src/app/components/
├── cms/                # CMS Backend Components (Admin Panel)
│   ├── admin-shell/    # Admin layout and navigation shell
│   ├── pages/          # Page management (inspector, list, create)
│   ├── sections/       # Section management and editing
│   ├── users/          # User management and forms
│   ├── groups/         # Group management and ACL editing
│   ├── roles/          # Role management
│   ├── assets/         # Asset management and upload
│   ├── cache/          # Cache management and monitoring
│   ├── data/           # Data table management
│   ├── actions/        # Action configuration and management
│   ├── scheduled-jobs/ # Job scheduling and monitoring
│   ├── unused-sections/# Cleanup and maintenance tools
│   ├── shared/         # Shared CMS components
│   │   ├── field-components/     # Form field types
│   │   ├── field-renderer/       # Universal field renderer
│   │   ├── inspector-layout/     # Inspector UI framework
│   │   │   ├── inspector-header/     # Inspector header component
│   │   │   ├── fields-section/       # Collapsible field sections
│   │   └── acl-selector/         # ACL management component
│   └── ui/             # CMS-specific UI components
├── frontend/           # Frontend User-Facing Components
│   ├── content/        # Page content rendering
│   │   ├── PageContentRenderer.tsx    # Main content renderer
│   │   ├── PageRenderer.tsx           # Page wrapper
│   │   └── PageContentRendererClient.tsx # Client-side renderer
│   ├── layout/         # Website layout components
│   │   ├── WebsiteHeader.tsx          # Main header
│   │   ├── WebsiteHeaderOptimized.tsx # Optimized header
│   │   ├── WebsiteHeaderServer.tsx    # Server header
│   │   ├── WebsiteHeaderMenu.tsx      # Header navigation
│   │   ├── WebsiteFooter.tsx          # Main footer
│   │   └── WebsiteFooterOptimized.tsx # Optimized footer
│   └── styles/         # Dynamic style components (82+ types)
│       ├── BasicStyle.tsx             # Main style component factory
│       ├── SelfHelpStyles.ts          # Style exports
│       ├── ContainerStyle.tsx         # Layout styles
│       ├── HeadingStyle.tsx           # Typography styles
│       ├── ImageStyle.tsx             # Media styles
│       ├── FormStyle.tsx              # Form styles
│       ├── ButtonStyle.tsx            # Interactive styles
│       ├── MarkdownStyle.tsx          # Content styles
│       ├── TabsStyle.tsx              # Navigation styles
│       └── ... (75+ more style components)
├── shared/             # Components Used in Both CMS and Frontend
│   ├── auth/           # Authentication components
│   │   └── AuthButton.tsx             # Login/logout button
│   ├── common/         # Common utilities and UI
│   │   ├── LoadingScreen.tsx          # Loading spinner
│   │   ├── CustomModal.tsx            # Modal wrapper
│   │   ├── LanguageSelector.tsx       # Language switcher
│   │   ├── ThemeToggle.tsx            # Dark/light mode toggle
│   │   ├── SelfHelpLogo.tsx           # Brand logo
│   │   ├── BurgerMenuClient.tsx       # Mobile menu
│   │   ├── navbar-links-group/        # Navigation components
│   │   └── debug/                     # Debug system components
│   └── ui/             # Shared UI components
│       └── InternalLink.tsx           # Internal navigation link
└── contexts/           # React Contexts
    ├── LanguageContext.tsx            # Language management
    ├── EnhancedLanguageProvider.tsx   # Enhanced language features
    └── PageContentContext.tsx         # Page content state
```

## Component Usage Guidelines

**CMS Components** (`src/app/components/cms/`):
- Used exclusively in the admin panel (`/admin` routes)
- Include inspectors, forms, management interfaces
- Have admin-specific styling and functionality
- Examples: `PageInspector`, `UsersList`, `AdminShell`

**Frontend Components** (`src/app/components/frontend/`):
- Used exclusively on the public website
- Include page rendering, layout, and dynamic styles
- Optimized for end-user experience
- Examples: `PageRenderer`, `WebsiteHeader`, `BasicStyle`

**Shared Components** (`src/app/components/shared/`):
- Used in both CMS and frontend contexts
- Include authentication, common utilities, and basic UI
- Must work seamlessly in both environments
- Examples: `AuthButton`, `LoadingScreen`, `LanguageSelector`

## Theming System

```typescript
// theme.ts - Mantine theme configuration
export const theme = createTheme({
    primaryColor: 'blue',
    defaultColorScheme: 'auto',
    fontFamily: 'Inter, sans-serif',
    headings: {
        fontFamily: 'Inter, sans-serif',
    },
    components: {
        Button: Button.extend({
            defaultProps: {
                size: 'sm',
            },
        }),
    },
});
```

**Dark/Light Theme Support**: Automatic theme switching based on system preference

---

**[← Previous: React Query & Caching Strategy](04-react-query-caching.md)** | **[Next: API Layer & Endpoint Management →](06-api-layer-endpoints.md)**
