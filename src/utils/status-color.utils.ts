/**
 * Generates a consistent color for status values using a hash function
 * This ensures the same status always gets the same color across sessions
 */
export function getStatusColor(status: string): string {
  if (!status) return 'gray';
  
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < status.length; i++) {
    const char = status.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // List of Mantine color options that work well for statuses
  const colors = [
    'blue', 'green', 'red', 'orange', 'yellow', 'purple', 
    'cyan', 'pink', 'indigo', 'teal', 'lime', 'grape'
  ];
  
  // Use absolute value of hash to get consistent positive index
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
}

/**
 * Gets status color with special handling for common status types
 */
export function getUserStatusColor(status: string): string {
  // Handle special cases first
  switch (status.toLowerCase()) {
    case 'active':
      return 'green';
    case 'blocked':
    case 'inactive':
      return 'red';
    case 'pending':
    case 'invited':
      return 'yellow';
    case 'interested':
      return 'blue';
    case 'auto_created':
      return 'purple';
    default:
      // For any other status, use the hash-based color
      return getStatusColor(status);
  }
} 