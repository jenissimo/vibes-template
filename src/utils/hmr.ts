// HMR Utility для удобного управления горячей заменой модулей
import { logger } from '@/engine/logging';

export interface HMRBoundary {
  start: () => void;
  stop: () => void;
  accept?: (mod: any) => void;
}

/**
 * Создает HMR boundary для подсистемы
 * @param key - уникальный ключ для отладки
 * @param boundary - объект с методами start/stop/accept
 */
export function makeHmrBoundary(key: string, boundary: HMRBoundary) {
  if (!import.meta.hot) return;

  // Регистрируем teardown
  import.meta.hot.dispose(() => {
    logger.info(`🔥 HMR dispose: ${key}`, { source: 'hmr' });
    try {
      boundary.stop();
    } catch (error) {
      logger.warn(`⚠️ Error stopping ${key}`, { 
        error: error instanceof Error ? error.message : String(error),
        source: 'hmr' 
      });
    }
  });

  // Регистрируем accept если есть
  if (boundary.accept) {
    import.meta.hot.accept(boundary.accept);
  }

  logger.info(`✅ HMR boundary registered: ${key}`, { source: 'hmr' });
}

/**
 * HMR boundary для рендерера
 */
export function createRendererHMR(renderer: any) {
  return makeHmrBoundary('renderer', {
    start: () => {
      logger.info('🎨 Starting renderer HMR', { source: 'hmr' });
    },
    stop: () => {
      logger.info('🎨 Stopping renderer HMR', { source: 'hmr' });
      try {
        renderer?.destroy?.();
      } catch (error) {
        logger.warn('⚠️ Error destroying renderer', { 
          error: error instanceof Error ? error.message : String(error),
          source: 'hmr' 
        });
      }
    }
  });
}

/**
 * HMR boundary для аудио системы
 */
export function createAudioHMR(audioManager: any) {
  return makeHmrBoundary('audio', {
    start: () => {
      logger.info('🔊 Starting audio HMR', { source: 'hmr' });
    },
    stop: () => {
      logger.info('🔊 Stopping audio HMR', { source: 'hmr' });
      try {
        audioManager?.cleanup?.();
      } catch (error) {
        logger.warn('⚠️ Error cleaning up audio', { 
          error: error instanceof Error ? error.message : String(error),
          source: 'hmr' 
        });
      }
    }
  });
}

/**
 * HMR boundary для сцены
 */
export function createSceneHMR(sceneManager: any) {
  return makeHmrBoundary('scene', {
    start: () => {
      logger.info('🎬 Starting scene HMR', { source: 'hmr' });
    },
    stop: () => {
      logger.info('🎬 Stopping scene HMR', { source: 'hmr' });
      try {
        // Очищаем текущую сцену
        const currentScene = sceneManager?.current;
        if (currentScene) {
          for (const gameObject of currentScene.gameObjects) {
            gameObject._onRemovedFromScene?.();
          }
          currentScene.gameObjects.length = 0;
        }
      } catch (error) {
        logger.warn('⚠️ Error cleaning up scene', { 
          error: error instanceof Error ? error.message : String(error),
          source: 'hmr' 
        });
      }
    }
  });
}

/**
 * HMR boundary для эффектов
 */
export function createEffectsHMR(effectSystem: any) {
  return makeHmrBoundary('effects', {
    start: () => {
      logger.info('✨ Starting effects HMR', { source: 'hmr' });
    },
    stop: () => {
      logger.info('✨ Stopping effects HMR', { source: 'hmr' });
      try {
        effectSystem?.stop?.();
        effectSystem?.clear?.();
      } catch (error) {
        logger.warn('⚠️ Error cleaning up effects', { 
          error: error instanceof Error ? error.message : String(error),
          source: 'hmr' 
        });
      }
    }
  });
}

/**
 * Универсальный HMR boundary для любых сервисов
 */
export function createServiceHMR(serviceName: string, service: any) {
  return makeHmrBoundary(serviceName, {
    start: () => {
      logger.info(`🔧 Starting ${serviceName} HMR`, { source: 'hmr' });
    },
    stop: () => {
      logger.info(`🔧 Stopping ${serviceName} HMR`, { source: 'hmr' });
      try {
        // Пробуем разные методы очистки
        service?.destroy?.();
        service?.cleanup?.();
        service?.clear?.();
        service?.stop?.();
      } catch (error) {
        logger.warn(`⚠️ Error cleaning up ${serviceName}`, { 
          error: error instanceof Error ? error.message : String(error),
          source: 'hmr' 
        });
      }
    }
  });
}
