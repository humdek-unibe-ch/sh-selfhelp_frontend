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
- **Drop Zone Areas**: Small green areas appear on the right side of empty containers during drag
- **Smart Indicator Hiding**: Sibling indicators automatically hide when hovering over drop zones
- Dragged items become semi-transparent during drag
- Descendants of dragged items are also visually muted

### 4. Debug Integration
- Added `dragDropDebug` to debug configuration
- Console logging only appears when debug mode is enabled
- Enhanced logging with emojis and clear information structure

## Technical Implementation

### Drop Target Logic
```typescript
// Check if hovering over the drop zone area (right side, small area)
const dropZoneWidth = Math.min(40, rect.width * 0.15);
const dropZoneLeft = rect.width - dropZoneWidth;
const isInDropZone = input.clientX - rect.left >= dropZoneLeft && canHaveChildren && !hasChildren;

if (isInDropZone) {
    return { type: 'drop-zone-target', ... };
}

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

{/* Drop zone area for empty containers */}
{dragContext.isDragActive && canHaveChildren && !hasChildren && !isBeingDragged && (
    <Box className={`${styles.dropZoneArea} ${styles.visible} ${dropState.isDropZoneHover ? styles.active : ''}`}>
        <IconPlus size={14} className={styles.dropZoneIcon} />
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
3. **Empty Parent Support**: Drop in the small green zone on the right to add first child to empty containers
4. **Smart Visual Feedback**: Sibling indicators automatically hide when targeting drop zones
5. **Visual Clarity**: Clear indicators show exactly where drop will occur
6. **Smooth Transitions**: All visual changes are animated for better user experience 