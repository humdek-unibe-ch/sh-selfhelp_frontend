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
- **Container Drops**: Only allowed if the target section already has children
- **No Parent Highlighting**: Sections without children won't show as drop targets for container drops
- **Self-Drop Prevention**: Cannot drop a section on itself or its descendants

### 3. Visual Feedback
- Green drop indicators show exact drop position
- Container drop targets have subtle background highlighting
- Dragged items become semi-transparent during drag
- Descendants of dragged items are also visually muted

### 4. Debug Integration
- Added `dragDropDebug` to debug configuration
- Console logging only appears when debug mode is enabled
- Enhanced logging with emojis and clear information structure

## Technical Implementation

### Drop Target Logic
```typescript
// Only allow container drops if section already has children
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
{/* Top drop indicator using react-drop-indicator */}
{dropState.closestEdge === 'top' && (
    <DropIndicator edge="top" gap="8px" />
)}
```

### Debug Output
When `dragDropDebug` is enabled, you'll see:
- 🚀 DRAG STARTED: Shows dragged section and drop rules
- 🎯 DROP COMPLETED: Shows complete drop information including target, position, and affected items

## Environment Variables
- `NEXT_PUBLIC_DEBUG_DRAGDROP=true` - Enable drag and drop debug logging
- Debug is automatically enabled in development mode

## User Experience Rules
1. **Sibling Positioning**: Drop on top/bottom edges to reorder at same level
2. **Child Addition**: Drop in center of sections that already have children
3. **No Empty Parents**: Cannot drop inside sections that don't have children yet
4. **Visual Clarity**: Clear indicators show exactly where drop will occur 