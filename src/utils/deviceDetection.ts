/**
 * Device performance detection utilities
 * Detects device capabilities for optimal rendering configuration
 */

export type DevicePerformance = 'desktop' | 'high-end-mobile' | 'low-end-mobile';

export interface DeviceCapabilities {
  performance: DevicePerformance;
  isMobile: boolean;
  hasWebGL2: boolean;
  hasHighDPI: boolean;
  memoryGB?: number;
  cpuCores?: number;
  devicePixelRatio: number;
}

/**
 * Detect device performance capabilities
 * Uses multiple indicators to determine optimal rendering settings
 */
export function detectDevicePerformance(): DeviceCapabilities {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const hasWebGL2 = !!document.createElement('canvas').getContext('webgl2');
  const hasHighDPI = window.devicePixelRatio >= 2;
  const memoryGB = (navigator as any).deviceMemory;
  const cpuCores = navigator.hardwareConcurrency;
  const devicePixelRatio = window.devicePixelRatio;

  if (!isMobile) {
    return {
      performance: 'desktop',
      isMobile: false,
      hasWebGL2,
      hasHighDPI,
      memoryGB,
      cpuCores,
      devicePixelRatio,
    };
  }

  // High-end mobile indicators
  const hasGoodMemory = memoryGB && memoryGB >= 4; // 4GB+ RAM
  const hasGoodCPU = cpuCores && cpuCores >= 6; // 6+ cores
  
  // Flagship device detection
  const isFlagship = hasHighDPI && hasWebGL2 && (hasGoodMemory || hasGoodCPU);

  return {
    performance: isFlagship ? 'high-end-mobile' : 'low-end-mobile',
    isMobile: true,
    hasWebGL2,
    hasHighDPI,
    memoryGB,
    cpuCores,
    devicePixelRatio,
  };
}

/**
 * Get device performance level as string for logging
 */
export function getDevicePerformanceLabel(capabilities: DeviceCapabilities): string {
  const { performance, memoryGB, cpuCores } = capabilities;
  
  if (performance === 'desktop') {
    return 'Desktop';
  }
  
  if (performance === 'high-end-mobile') {
    return `High-end Mobile (${memoryGB}GB RAM, ${cpuCores} cores)`;
  }
  
  return `Standard Mobile (${memoryGB ? `${memoryGB}GB RAM` : 'Unknown RAM'}, ${cpuCores || 'Unknown'} cores)`;
}
