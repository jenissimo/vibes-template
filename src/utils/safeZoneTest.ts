/**
 * Утилита для тестирования safe zone
 */

import { readSafeInsets, computeLayout, enableLayoutDebug } from '@/engine/render';

import { logger } from '@/engine/logging';
export function testSafeZone(): void {
  logger.info('🧪 Testing Safe Zone...', { source: 'game' });
  
  // Читаем текущие insets
  const insets = readSafeInsets();
  logger.info('📐 Current insets:', { insets, source: 'game' });
  
  // Вычисляем layout
  const layout = computeLayout(window.innerWidth, window.innerHeight, insets);
  logger.info('📐 Current layout:', { layout, source: 'game' });
  
  // Проверяем, поддерживаются ли CSS env() переменные
  const testElement = document.createElement('div');
  testElement.style.paddingTop = 'env(safe-area-inset-top, 0px)';
  document.body.appendChild(testElement);
  
  const computedStyle = getComputedStyle(testElement);
  const paddingTop = computedStyle.paddingTop;
  logger.info('📐 CSS env() test - paddingTop:', { paddingTop, source: 'game' });
  
  document.body.removeChild(testElement);
  
  // Включаем debug overlay
  enableLayoutDebug();
  
  logger.info('✅ Safe zone test completed. Check the debug overlay on screen.', { source: 'game' });
}

// Добавляем в глобальный объект для доступа из консоли
(window as any).testSafeZone = testSafeZone;
