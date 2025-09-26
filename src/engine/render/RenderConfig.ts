export interface RenderConfig {
  /**
   * Maximum device pixel ratio that should be used for PixiJS rendering.
   * Higher values can severely impact performance on high DPI displays.
   */
  readonly maxResolution: number;
  
  /**
   * Target FPS for the game loop. Set to 0 to disable FPS limiting.
   * Recommended: 60 for smooth gameplay, 30 for battery saving.
   */
  readonly targetFPS: number;
  
  /**
   * Enable FPS limiting for better performance and battery life.
   * When disabled, the game will run at maximum possible FPS.
   */
  readonly enableFPSLimit: boolean;

  /**
   * Design reference resolution for game scaling.
   */
  readonly referenceResolution: { w: number; h: number };
}

export const RENDER_CONFIG: RenderConfig = {
  maxResolution: 2,
  targetFPS: 60,
  enableFPSLimit: true,
  referenceResolution: { w: 1000, h: 2000 },
};

// Mobile-specific optimizations
export const MOBILE_RENDER_CONFIG: RenderConfig = {
  maxResolution: 1.5, // Lower resolution for mobile
  targetFPS: 30,      // Lower FPS for battery life
  enableFPSLimit: true,
  referenceResolution: { w: 1000, h: 2000 },
};

// High-end mobile devices (flagship phones)
export const HIGH_END_MOBILE_RENDER_CONFIG: RenderConfig = {
  maxResolution: 2,   // Full resolution for flagship devices
  targetFPS: 60,      // 60 FPS for smooth experience
  enableFPSLimit: true,
  referenceResolution: { w: 1000, h: 2000 },
};