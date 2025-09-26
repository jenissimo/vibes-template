// Icon asset URLs (Vite will fingerprint in prod). Works in dev & prod.
import creditUrl from './credit.png?url';

export const ITEM_ICON_URLS = {
  'credit.png': creditUrl,
} as const;

/**
 * Get the correct URL for an item icon
 * @param iconPath - Path like "icons/credit.png" or "credit.png"
 * @returns Proper Vite URL that works in dev and prod
 */
export function getItemIconUrl(iconPath: string): string {
  // Extract filename from path like "icons/credit.png" -> "credit.png"
  const filename = iconPath.includes('/') 
    ? iconPath.split('/').pop() || 'credit.png'
    : iconPath;
  
  // Return the proper Vite URL
  return ITEM_ICON_URLS[filename as keyof typeof ITEM_ICON_URLS] || creditUrl;
}
