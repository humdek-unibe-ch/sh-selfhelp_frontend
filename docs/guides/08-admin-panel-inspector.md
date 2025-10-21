# 8. 🛠️ Admin Panel & Inspector System

## Admin Shell Layout

The admin panel uses a shell layout with navigation sidebar and main content area:

```typescript
// Admin Shell Structure
<AdminShell>
    <AdminNavbar />      // Left sidebar navigation
    <AdminContent>       // Main content area
        <Inspector />    // Right panel for editing
    </AdminContent>
</AdminShell>
```

## Inspector Architecture

**Modular Inspector Components**:
- `InspectorLayout`: Main layout wrapper
- `InspectorHeader`: Title, badges, and actions
- `FieldsSection`: Collapsible field groups
- `FieldRenderer`: Universal field rendering

```typescript
// Inspector component pattern
<InspectorLayout loading={isLoading} error={error}>
    <InspectorHeader
        title="Page Inspector"
        badges={[{ label: `ID: ${page.id}`, color: 'blue' }]}
        actions={[
            { label: 'Save', icon: <IconSave />, onClick: handleSave },
            { label: 'Delete', icon: <IconTrash />, onClick: handleDelete }
        ]}
    />

    <FieldsSection title="Content" collapsible>
        {contentFields.map(field => (
            <FieldRenderer
                key={field.id}
                field={field}
                value={fieldValues[field.name]}
                onChange={handleFieldChange}
            />
        ))}
    </FieldsSection>
</InspectorLayout>
```

## Page Inspector Features

**Content Management**:
- Dynamic field loading based on page configuration
- Multi-language field editing with tabs
- Real-time form validation
- Auto-save functionality (Ctrl+S)

**Page Properties**:
- Locked field editing (keyword, URL)
- Menu position management
- Access control settings
- SEO configuration

## Section Inspector Features

**Section Management**:
- Hierarchical section tree with drag-and-drop
- Section creation from style templates
- Position management
- Nested section support

**Drag & Drop System**:
- Professional visual feedback
- Edge-based drop indicators
- Auto-scroll during drag
- Accessibility support

```typescript
// Drag & Drop Implementation
const handleSectionMove = async (moveData: IMoveData) => {
    const { draggedSectionId, newParentId, newPosition } = moveData;

    if (newParentId === null) {
        // Moving to page level
        await updateSectionInPageMutation.mutateAsync({
            keyword: pageKeyword,
            sectionId: draggedSectionId,
            sectionData: { position: newPosition }
        });
    } else {
        // Moving to another section
        await updateSectionInSectionMutation.mutateAsync({
            parentSectionId: newParentId,
            childSectionId: draggedSectionId,
            sectionData: { position: newPosition }
        });
    }
};
```

---

**[← Previous: Language System & Internationalization](07-language-internationalization.md)** | **[Next: User Permissions & ACL System →](09-user-permissions-acl.md)**
