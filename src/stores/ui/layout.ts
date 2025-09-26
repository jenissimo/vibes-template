import { map } from 'nanostores';
import type { LayoutResult } from '@/engine/render';

// Layout state
export interface LayoutState {
  isMobile: boolean;
  currentLayout: LayoutResult | null;
  screenWidth: number;
  screenHeight: number;
}

export const layoutState = map<LayoutState>({
  isMobile: false,
  currentLayout: null,
  screenWidth: 0,
  screenHeight: 0,
});

// UI panel positions
export interface PanelPosition {
  x: number;
  y: number;
  anchor: string;
  visible: boolean;
}