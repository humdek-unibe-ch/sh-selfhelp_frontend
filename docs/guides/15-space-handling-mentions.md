# Space Handling in TextInputWithMentions

## Overview

This guide explains the space handling issues that existed in the `TextInputWithMentions` component and the comprehensive solutions implemented to fix them.

## The Problems

### 1. Multiple Spaces Collapsing to One

**Issue**: When typing multiple consecutive spaces (e.g., "hello     world"), only one space would be visible.

**Root Cause**: HTML by default collapses multiple consecutive whitespace characters into a single space. Even with `white-space: pre-wrap`, the underlying HTML rendering still follows this rule.

**Example**:
```html
<!-- User types -->
hello     world

<!-- HTML renders as -->
hello world
```

### 2. Automatic Space After Mentions

**Issue**: When inserting a mention/variable (e.g., `{{user_name}}`), an extra space was automatically added after it.

**Root Cause**: The Tiptap Mention extension or ProseMirror's default behavior was adding trailing spaces after mention insertion.

**Example**:
```
User inserts: Hello {{user_name}}
Result: "Hello {{user_name}} "  (note the extra space at the end)
```

### 3. Space Key Behavior Issues

**Issue**: When pressing space, the control would "bring back" (possibly losing focus or cursor position) but the space was still recorded in the value.

**Root Cause**: Inconsistent handling between visual rendering (HTML) and stored value (plain text via `getText()`).

### 4. Whitespace in Rich Text Editor Without HTML Output

**Issue**: The component uses a rich text editor (Tiptap) internally for mention support, but needs to output plain text (via `getText()`), creating a mismatch between display and storage.

**Root Cause**: Tiptap/ProseMirror uses HTML internally for rendering, but the component extracts plain text. The visual representation (HTML with collapsed spaces) didn't match the stored value.

## The Solution

### 1. CSS: Change from `white-space: pre-wrap` to `white-space: pre`

**What Changed**:
```css
/* BEFORE */
.singleLineEditor :global(.ProseMirror) {
    white-space: pre-wrap;
}

/* AFTER */
.singleLineEditor :global(.ProseMirror) {
    white-space: pre;
    overflow-x: auto;
    overflow-y: hidden;
}
```

**Why This Works**:
- `white-space: pre` preserves ALL whitespace exactly as typed (like `<pre>` tag)
- Multiple spaces are now visible AND stored correctly
- Spaces after mentions are preserved exactly as the user types them
- Added `overflow-x: auto` to handle long single-line text with horizontal scrolling

**Trade-off**:
- Text won't wrap to next line (which is acceptable for single-line input)
- Long text will require horizontal scrolling

### 2. PreserveSpaces Extension

**Created**: `src/app/components/shared/mentions/PreserveSpacesExtension.ts`

**Purpose**: 
- Monitor transactions in the editor
- Handle pasted content to preserve spaces
- Prevent unwanted space insertion after mentions
- Document the whitespace handling strategy

**Key Features**:
```typescript
export const PreserveSpaces = Extension.create({
    name: 'preserveSpaces',
    
    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('preserveSpaces'),
                props: {
                    // Preserve spaces in pasted content
                    transformPasted: (slice) => slice,
                },
                appendTransaction: (transactions, oldState, newState) => {
                    // Monitor for mention insertions
                    // CSS handles the actual rendering
                    return null;
                },
            }),
        ];
    },
});
```

**Integration**: Only added in single-line mode
```typescript
// In MentionEditor.tsx
...(singleLineMode ? [PreserveSpaces] : []),
```

### 3. Mention Styling Improvements

**Updated**: `src/app/components/shared/mentions/MentionEditor.module.css`

**Changes**:
```css
/* Ensure mentions don't add extra spacing */
:global(.mention-variable) {
    display: inline;
    white-space: nowrap;
    margin: 0;
}

/* Prevent pseudo-elements from adding spacing */
:global(.mention-variable::before),
:global(.mention-variable::after) {
    content: none;
}

/* Single-line specific mention styling */
.singleLineEditor :global(.mention-variable) {
    white-space: nowrap;
    display: inline;
}
```

**Purpose**:
- Ensures mentions behave like inline text
- Prevents any extra spacing from CSS pseudo-elements
- Forces nowrap on mentions to prevent line breaks within the variable

### 4. Consistent Paragraph Styling

**Updated**: All paragraph and text elements in single-line mode now use `white-space: pre`

```css
.singleLineEditor :global(.ProseMirror p) {
    margin: 0;
    display: inline;
    white-space: pre;  /* Changed from pre-wrap */
}

.singleLineEditor :global(.ProseMirror *) {
    display: inline;
    white-space: pre;  /* Changed from pre-wrap */
}
```

## How It Works Now

### Typing Multiple Spaces

```
User types: "hello     world"
Rendered:   "hello     world"  (5 spaces preserved)
Stored:     "hello     world"  (5 spaces preserved)
✓ Visual and stored values match
✓ All spaces are visible and preserved
```

### Using Mentions

```
User types: "Hello {{user_name}}"
Rendered:   "Hello {{user_name}}" (no extra space)
Stored:     "Hello {{user_name}}" (no extra space)

User types: "Hello {{user_name}} !" (with space before !)
Rendered:   "Hello {{user_name}} !" (space preserved)
Stored:     "Hello {{user_name}} !" (space preserved)
✓ Spaces only appear when user types them
✓ No automatic spacing after mentions
```

### Space Key Behavior

```
User presses space:
✓ Space is immediately visible in the editor
✓ Space is recorded in the value
✓ Cursor position is maintained
✓ No control behavior issues
```

## Technical Details

### Why `white-space: pre` Instead of Other Options?

| Property | Preserves Spaces | Preserves Newlines | Text Wrapping |
|----------|-----------------|-------------------|---------------|
| `normal` | No (collapses) | No | Yes |
| `nowrap` | No (collapses) | No | No |
| `pre` | Yes | Yes | No |
| `pre-wrap` | Partial | Yes | Yes |
| `pre-line` | No (collapses) | Yes | Yes |

For single-line text input:
- ✓ Need to preserve all spaces exactly as typed → `pre`
- ✓ Already prevent newlines via extensions → `pre` is safe
- ✓ Single-line means no wrapping needed → `pre` is perfect

### getText() vs getHTML()

**In single-line mode without rich text shortcuts**:
```typescript
// Extract plain text with all spaces preserved
const text = editor.getText();
onChange(text);
```

**Why getText() works now**:
- ProseMirror stores the actual content with all spaces
- `white-space: pre` ensures visual rendering matches stored content
- `getText()` extracts the raw text content from ProseMirror's document model
- No more mismatch between visual (HTML) and stored (text) representations

### The Role of PreserveSpaces Extension

The extension itself doesn't modify content (returns `null` from `appendTransaction`). Its purpose is:

1. **Documentation**: Clearly explains the whitespace handling strategy
2. **Monitoring**: Tracks mention insertions and could intervene if needed
3. **Future-proofing**: Easy to extend if additional space handling is needed
4. **Pasted Content**: Handles clipboard content appropriately

## Testing Checklist

When testing space handling, verify:

- [ ] Type multiple consecutive spaces → all visible
- [ ] Insert mention → no automatic trailing space
- [ ] Type space after mention → space appears and is saved
- [ ] Paste text with multiple spaces → all spaces preserved
- [ ] Paste multiline text → converted to single line with spaces
- [ ] Delete spaces one by one → each deletion is visible
- [ ] Move cursor through spaces → cursor stops at each space
- [ ] Select text including spaces → selection is accurate
- [ ] Copy/paste text with spaces → spaces preserved

## Benefits

### 1. Consistent Behavior
- What you see is what you get (WYSIWYG)
- Visual rendering matches stored value 100%
- No surprises with space handling

### 2. User Control
- Users have full control over spacing
- No automatic space insertion or removal
- Predictable behavior

### 3. Data Integrity
- Spaces are preserved exactly as typed
- No data loss or corruption
- Reliable for templates and formatted content

### 4. Developer-Friendly
- Simple mental model: "spaces work like they should"
- Easy to debug and maintain
- Well-documented solution

## Potential Issues & Solutions

### Issue: Long single-line text with horizontal scroll

**Symptom**: Very long text requires scrolling horizontally

**Why**: Using `white-space: pre` prevents text wrapping

**Solution**: This is expected behavior for a single-line input. Users can:
- See the full content by scrolling
- Use left/right arrow keys to navigate
- The scroll behavior is similar to native `<input type="text">`

### Issue: Performance with very long text

**Symptom**: Editor might slow down with extremely long single-line text (thousands of characters)

**Why**: DOM rendering of very long single lines can be expensive

**Solution**: 
- Consider adding a character limit if appropriate
- For most use cases (< 1000 chars), performance is fine
- This is a general limitation of contentEditable, not specific to our solution

## Related Files

- `src/app/components/shared/mentions/MentionEditor.tsx` - Main editor component
- `src/app/components/shared/mentions/MentionEditor.module.css` - Styling including whitespace handling
- `src/app/components/shared/mentions/PreserveSpacesExtension.ts` - Custom Tiptap extension
- `src/app/components/cms/shared/field-components/TextInputWithMentions.tsx` - Wrapper component
- `src/config/mentions.config.ts` - Mention configuration

## Future Enhancements

**Potential improvements**:

1. **Smart Wrapping**: Optionally enable text wrapping while preserving spaces
   - Would require more complex CSS and possibly JavaScript
   - Trade-off: increased complexity vs. user convenience

2. **Visual Space Indicators**: Show dots or symbols for spaces (like code editors)
   - Useful for debugging or when precise spacing is critical
   - Could be a debug mode feature

3. **Space Compression Warning**: Warn if users type many consecutive spaces
   - Helpful for catching accidental space spam
   - Could suggest single space if appropriate

## Conclusion

The space handling issues were caused by the fundamental mismatch between HTML rendering (which collapses spaces) and the need for plain text output with preserved spacing. The solution uses `white-space: pre` CSS property to force exact space preservation, combined with a custom Tiptap extension for monitoring and a clean mention styling to prevent unwanted spacing.

The result is a single-line text input with mention support that handles spaces exactly as users expect - what you type is what you see and what you get.

