/**
 * Formats an ISO timestamp to local browser time (HH:MM:SS)
 * @param timestamp ISO timestamp string
 * @returns Formatted time string in local timezone
 */
export function formatTimeFromTimestamp(timestamp: string): string {
  // Parse ISO timestamp string into Date object
  const date = new Date(timestamp);
  
  // Format as HH:MM:SS in local browser timezone
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
} 