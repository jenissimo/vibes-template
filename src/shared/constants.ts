/**
 * Game Constants - константы игры
 * Централизованное место для всех констант
 */

// UI константы
export const UI = {
  MINING_AREA_COLORS: {
    PRIMARY: 0x00ffff,
    SECONDARY: 0x00cccc,
    CENTER: 0x00ffff
  },
  
  PROGRESS_BAR_COLORS: {
    HIGH: 0x00ff00,
    MEDIUM: 0xffaa00,
    LOW: 0xff0000
  },
  
  FLOATING_NUMBERS: {
    CRIT_COLOR: 0xff6b35,
    NORMAL_COLOR: 0x00ffff,
    CRIT_SIZE: 72,
    NORMAL_SIZE: 54
  }
} as const;