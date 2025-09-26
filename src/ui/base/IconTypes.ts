// Icon system types and constants

export type IconSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export type IconColor = 'neon-green' | 'neon-blue' | 'neon-purple' | 'neon-pink' | 'neon-orange' | 'gray' | 'white';

export type IconVariant = 'resource' | 'action' | 'danger' | 'success' | 'default';

export type IconHover = 'glow' | 'scale' | 'pulse' | 'none';

// Icon categories for better organization
export const ICON_CATEGORIES = {
  // Game modes
  GAME_MODES: ['warehouse', 'upgrades', 'research', 'market'] as const,
  
  // UI controls
  UI_CONTROLS: ['settings', 'close', 'chevron-right', 'chevron-left', 'chevron-up', 'chevron-down', 'plus', 'minus', 'check', 'alert', 'info'] as const,
  
  // Game elements
  GAME_ELEMENTS: ['star', 'heart', 'shield', 'sword', 'crown', 'coins', 'battery', 'energy'] as const,
  
  // Actions
  ACTIONS: ['wrench', 'lock', 'unlock', 'play', 'pause', 'stop', 'reset', 'refresh', 'download', 'upload', 'trash', 'edit', 'save', 'copy', 'share', 'external-link'] as const,
  
  // Navigation
  NAVIGATION: ['menu', 'search', 'filter', 'sort-asc', 'sort-desc'] as const,
  
  // Visibility
  VISIBILITY: ['eye', 'eye-off', 'bell', 'bell-off', 'volume', 'volume-off'] as const,
  
  // Themes
  THEMES: ['sun', 'moon', 'monitor', 'smartphone', 'tablet', 'laptop', 'desktop'] as const,
  
  // Tech
  TECH: ['server', 'database', 'hard-drive', 'cpu', 'memory', 'wifi', 'wifi-off'] as const,
  
  // Signal strength
  SIGNAL: ['signal', 'signal-zero', 'signal-low', 'signal-medium', 'signal-high', 'signal-full'] as const,
} as const;

// Color mappings for different contexts
export const ICON_COLOR_CONTEXTS = {
  // Game modes
  warehouse: 'neon-green' as const,
  upgrades: 'neon-blue' as const,
  research: 'neon-purple' as const,
  market: 'neon-pink' as const,
  
  // Resource types
  coins: 'neon-orange' as const,
  energy: 'neon-blue' as const,
  neon_iron: 'neon-green' as const,
  
  // Actions
  danger: 'neon-orange' as const,
  success: 'neon-green' as const,
  warning: 'neon-orange' as const,
  info: 'neon-blue' as const,
  
  // States
  locked: 'gray' as const,
  unlocked: 'neon-green' as const,
  disabled: 'gray' as const,
  active: 'neon-green' as const,
} as const;

// Size mappings for different contexts
export const ICON_SIZE_CONTEXTS = {
  // Buttons
  button: 'md' as const,
  buttonLarge: 'lg' as const,
  buttonSmall: 'sm' as const,
  
  // Lists
  listItem: 'sm' as const,
  listItemLarge: 'md' as const,
  
  // Headers
  header: 'lg' as const,
  headerLarge: 'xl' as const,
  
  // Overlays
  overlay: 'sm' as const,
  overlayLarge: 'md' as const,
} as const;

// Variant mappings for different contexts
export const ICON_VARIANT_CONTEXTS = {
  // Game modes
  warehouse: 'resource' as const,
  upgrades: 'action' as const,
  research: 'action' as const,
  market: 'action' as const,
  
  // Resources
  coins: 'resource' as const,
  energy: 'resource' as const,
  neon_iron: 'resource' as const,
  
  // Actions
  danger: 'danger' as const,
  success: 'success' as const,
  warning: 'danger' as const,
  info: 'action' as const,
} as const;

// Helper function to get icon configuration for a context
export function getIconConfig(context: string, overrides: Partial<{
  size: IconSize;
  color: IconColor;
  variant: IconVariant;
  hover: IconHover;
}> = {}) {
  return {
    size: ICON_SIZE_CONTEXTS[context as keyof typeof ICON_SIZE_CONTEXTS] || 'md',
    color: ICON_COLOR_CONTEXTS[context as keyof typeof ICON_COLOR_CONTEXTS] || 'neon-green',
    variant: ICON_VARIANT_CONTEXTS[context as keyof typeof ICON_VARIANT_CONTEXTS] || 'default',
    hover: 'glow' as IconHover,
    ...overrides
  };
}
