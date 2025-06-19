# Drag and Drop Implementation

## Overview
The drag and drop functionality for page sections has been enhanced with smooth visual indicators and improved user experience rules.

## Key Features

### 1. Smooth Drop Indicators
- Uses `@atlaskit/pragmatic-drag-and-drop-react-drop-indicator` for professional drop indicators
- Shows clear visual feedback for where items will be dropped
- Replaced custom CSS indicators with library-provided smooth animations

### 2. Smart Drop Rules
- **Edge Drops**: Always allowed for sibling positioning (top/bottom edges)
- **Container Drops**: Allowed if the target section already has children (center area)
- **Drop Zone Drops**: New feature for sections that can have children but don't have any yet
- **Smart Visual Feedback**: Sibling indicators hide when hovering over drop zones
- **Self-Drop Prevention**: Cannot drop a section on itself or its descendants

### 3. Visual Feedback
- Green drop indicators show exact drop position for sibling drops
- Container drop targets have subtle background highlighting
- **Enhanced Drop Zone Areas**: Large, interactive green areas (120px wide) on the right side of empty containers
- **Clear Text Labels**: "Add as First Child" text with icon for better UX
- **Direct Drop Support**: Drop zones are independent drop targets - no need to move to section
- **Smart Indicator Hiding**: Sibling indicators automatically hide when hovering over drop zones
- **Smooth Animations**: Drop zones scale and highlight when active
- Dragged items become semi-transparent during drag
- Descendants of dragged items are also visually muted

### 4. Debug Integration
- Added `dragDropDebug` to debug configuration
- Console logging only appears when debug mode is enabled
- Enhanced logging with emojis and clear information structure

## Technical Implementation

### Drop Target Logic
```typescript
// Separate drop target for drop zone areas
useEffect(() => {
    const dropZoneElement = dropZoneRef.current;
    if (!dropZoneElement || !canHaveChildren || hasChildren) return;

    return dropTargetForElements({
        element: dropZoneElement,
        getData: () => ({
            type: 'drop-zone-target',
            sectionId: section.id,
            // ... other data
        }),
        // Independent drag enter/leave handling
    });
}, [section, canHaveChildren, hasChildren]);

// Main section drop target (simplified)
// Allow container drops if section already has children
if (hasChildren && canHaveChildren && relativeY >= 0.25 && relativeY <= 0.75) {
    return { type: 'container-drop-target', ... };
}

// Always allow edge-based positioning for siblings
return attachClosestEdge(data, {
    input,
    element,
    allowedEdges: ['top', 'bottom']
});
```

### Visual Indicators
```jsx
{/* Top drop indicator - hide when drop zone is active */}
{dropState.closestEdge === 'top' && !dropState.isDropZoneHover && (
    <DropIndicator edge="top" gap="8px" />
)}

{/* Enhanced drop zone area with text and independent drop target */}
{dragContext.isDragActive && canHaveChildren && !hasChildren && !isBeingDragged && (
    <Box 
        ref={dropZoneRef}
        className={`${styles.dropZoneArea} ${styles.visible} ${dropState.isDropZoneHover ? styles.active : ''}`}
    >
        <IconPlus size={16} className={styles.dropZoneIcon} />
        <Text className={styles.dropZoneText}>
            Add as<br />First Child
        </Text>
    </Box>
)}
```

### Debug Output
When `dragDropDebug` is enabled, you'll see:
- 🚀 DRAG STARTED: Shows dragged section and drop rules
- 🎯 DROP COMPLETED: Shows complete drop information with enhanced type detection:
  - 📏 Edge Drop: Sibling positioning
  - 📦 Container Drop: Inside existing parent with children
  - 🎯 Drop Zone Drop: First child of empty parent

## Environment Variables
- `NEXT_PUBLIC_DEBUG_DRAGDROP=true` - Enable drag and drop debug logging
- Debug is automatically enabled in development mode

## User Experience Rules
1. **Sibling Positioning**: Drop on top/bottom edges to reorder at same level
2. **Child Addition**: Drop in center of sections that already have children
3. **Empty Parent Support**: Drop directly in the large green "Add as First Child" zone for empty containers
4. **Independent Drop Targets**: Drop zones work independently - no need to move to section after hovering
5. **Smart Visual Feedback**: Sibling indicators automatically hide when targeting drop zones
6. **Clear Text Instructions**: "Add as First Child" text with icon removes guesswork
7. **Large Target Areas**: 120px wide drop zones for easy interaction
8. **Visual Clarity**: Clear indicators show exactly where drop will occur
9. **Smooth Transitions**: All visual changes are animated with scaling and highlighting 