// Этот файл определяет "рецепты" эффектов, комбинируя частицы, звуки и тряску камеры.
// Обновлено для работы с новым ParticleSystem API
export const effectDefinitions = {
  smallExplosion: {
    particles: [
      { 
        config: { 
          textureId: 'bordered_square',
          count: 25,
          spread: Math.PI * 2,
          speed: [300, 600] as [number, number], // Увеличиваем скорость
          life: [0.6, 1.2] as [number, number],
          size: [4, 8] as [number, number],
          startColor: 0x00FFFF, // Cyan neon
          endColor: 0x0080FF,   // Blue neon
          alpha: [1.0, 0],
          gravity: 0,
          friction: 0.88, // Меньше трение = больше разлет
          scaleSpeed: -0.8,
          rotationSpeed: [-20, 20] as [number, number] // Быстрее вращение
        } 
      },
      { 
        config: { 
          textureId: 'bordered_square',
          count: 20,
          spread: Math.PI * 2,
          speed: [250, 500] as [number, number], // Увеличиваем скорость
          life: [0.4, 0.8] as [number, number],
          size: [2, 4] as [number, number],
          startColor: 0x00FF00, // Green neon
          endColor: 0x00AA00,
          alpha: [1.0, 0] as [number, number],
          gravity: 80, // Больше гравитация для разнообразия
          friction: 0.90, // Меньше трение
          rotationSpeed: [-18, 18] as [number, number] // Быстрее вращение
        } 
      },
      { 
        config: { 
          textureId: 'bordered_square',
          count: 15,
          spread: Math.PI * 2,
          speed: [200, 400] as [number, number], // Увеличиваем скорость
          life: [0.8, 1.4] as [number, number],
          size: [1.5, 3] as [number, number],
          startColor: 0xFF00FF, // Magenta neon
          endColor: 0x8000FF,
          alpha: [0.8, 0] as [number, number],
          gravity: 0,
          friction: 0.92, // Меньше трение
          scaleSpeed: -0.5,
          rotationSpeed: [-15, 15] as [number, number] // Быстрее вращение
        } 
      }
    ],
    sound: { name: 'explosion_small' },
    screenShake: { intensity: 7, duration: 0.3 } // Увеличиваем тряску
  },
  largeExplosion: {
    particles: [
      { 
        config: { 
          textureId: 'bordered_square',
          count: 45, // Больше частиц
          spread: Math.PI * 2,
          speed: [600, 1200] as [number, number], // Значительно увеличиваем скорость
          life: [1.2, 2.0] as [number, number],
          size: [6, 12] as [number, number],
          startColor: 0x00FFFF, // Cyan neon
          endColor: 0x0080FF,   // Blue neon
          alpha: [1.0, 0] as [number, number],
          gravity: 0,
          friction: 0.85, // Меньше трение = больше разлет
          scaleSpeed: -0.6,
          rotationSpeed: [-25, 25] as [number, number] // Быстрее вращение
        } 
      },
      { 
        config: { 
          textureId: 'bordered_square',
          count: 40, // Больше частиц
          spread: Math.PI * 2,
          speed: [500, 1000] as [number, number], // Увеличиваем скорость
          life: [0.8, 1.6] as [number, number],
          size: [3, 6] as [number, number],
          startColor: 0xFF00FF, // Magenta neon
          endColor: 0x8000FF,
          alpha: [1.0, 0] as [number, number],
          gravity: 150, // Больше гравитация
          friction: 0.87, // Меньше трение
          rotationSpeed: [-22, 22] as [number, number] // Быстрее вращение
        } 
      },
      { 
        config: { 
          textureId: 'bordered_square',
          count: 35, // Больше частиц
          spread: Math.PI * 2,
          speed: [700, 1400] as [number, number], // Максимальная скорость
          life: [0.6, 1.2] as [number, number],
          size: [2, 4] as [number, number],
          startColor: 0x00FF00, // Green neon
          endColor: 0x00AA00,
          alpha: [1.0, 0] as [number, number],
          gravity: 300, // Больше гравитация
          friction: 0.82, // Минимальное трение
          rotationSpeed: [-30, 30] as [number, number] // Максимальное вращение
        } 
      },
      { 
        config: { 
          textureId: 'bordered_square',
          count: 30, // Больше частиц
          spread: Math.PI * 2,
          speed: [400, 800] as [number, number], // Увеличиваем скорость
          life: [1.5, 2.5] as [number, number],
          size: [4, 8] as [number, number],
          startColor: 0xFFFFFF, // White neon
          endColor: 0x00FFFF,
          alpha: [0.9, 0] as [number, number],
          gravity: 0,
          friction: 0.90, // Меньше трение
          scaleSpeed: -0.3,
          rotationSpeed: [-18, 18] as [number, number] // Быстрее вращение
        } 
      },
      { 
        config: { 
          textureId: 'bordered_square',
          count: 25, // Дополнительный слой для мощности
          spread: Math.PI * 2,
          speed: [800, 1600] as [number, number], // Экстремальная скорость
          life: [0.4, 0.8] as [number, number],
          size: [1, 2] as [number, number],
          startColor: 0xFFD700, // Золотой для яркости
          endColor: 0xFF4500,
          alpha: [1.0, 0] as [number, number],
          gravity: 0,
          friction: 0.80, // Минимальное трение
          rotationSpeed: [-35, 35] as [number, number] // Максимальное вращение
        } 
      }
    ],
    sound: { name: 'explosion_large' },
    screenShake: { intensity: 20, duration: 0.7 } // Увеличиваем тряску
  },
  mining: {
    particles: [
      { 
        config: { 
          textureId: 'bordered_square',
          count: 10,
          spread: Math.PI * 0.4,
          speed: [100, 200] as [number, number],
          life: [0.6, 1.2] as [number, number],
          size: [1, 2] as [number, number],
          startColor: 0xFFFFFF, // Белый неон
          endColor: 0x00FFFF,   // Cyan для перехода
          alpha: [1.0, 0] as [number, number],
          gravity: 0,
          friction: 0.88,
          rotationSpeed: [-12, 12] as [number, number]
        } 
      },
      { 
        config: { 
          textureId: 'bordered_square',
          count: 8,
          spread: Math.PI * 0.5,
          speed: [80, 180] as [number, number],
          life: [0.8, 1.4] as [number, number],
          size: [0.7, 1.5] as [number, number],
          startColor: 0xFFFFFF, // Белый неон
          endColor: 0x808080,   // Серый для затухания
          alpha: [0.9, 0.3] as [number, number],
          gravity: 80,
          friction: 0.92,
          rotationSpeed: [-10, 10] as [number, number]
        } 
      },
      { 
        config: { 
          textureId: 'bordered_square',
          count: 6,
          spread: Math.PI * 0.3,
          speed: [60, 120] as [number, number],
          life: [1.0, 1.8] as [number, number],
          size: [0.5, 1] as [number, number],
          startColor: 0xFFFFFF, // Белый неон
          endColor: 0x00FFFF,   // Cyan для перехода
          alpha: [0.8, 0.2] as [number, number],
          gravity: 0,
          friction: 0.95,
          rotationSpeed: [-8, 8] as [number, number]
        } 
      }
    ],
    sound: { name: 'mining_medium_loop', loop: true },
  },
  debris: {
    particles: [
      { 
        config: { 
          textureId: 'bordered_square',
          count: 15,
          spread: Math.PI * 2,
          speed: [80, 250] as [number, number],
          life: [2.0, 3.5] as [number, number],
          size: [3, 6] as [number, number],
          startColor: 0x808080, // Gray neon
          endColor: 0x404040,
          alpha: [0.8, 0.3] as [number, number],
          gravity: 500,
          friction: 0.88,
          rotationSpeed: [-10, 10] as [number, number]
        } 
      },
      { 
        config: { 
          textureId: 'bordered_square',
          count: 10,
          spread: Math.PI * 2,
          speed: [60, 180] as [number, number],
          life: [1.8, 3.2] as [number, number],
          size: [2, 4] as [number, number],
          startColor: 0x606060, // Darker gray neon
          endColor: 0x202020,
          alpha: [0.7, 0.2] as [number, number],
          gravity: 600,
          friction: 0.85,
          rotationSpeed: [-8, 8] as [number, number]
        } 
      },
      { 
        config: { 
          textureId: 'bordered_square',
          count: 8,
          spread: Math.PI * 2,
          speed: [40, 150] as [number, number],
          life: [2.5, 4.0] as [number, number],
          size: [1.5, 3] as [number, number],
          startColor: 0x404040, // Very dark gray neon
          endColor: 0x101010,
          alpha: [0.6, 0.1] as [number, number],
          gravity: 400,
          friction: 0.92,
          rotationSpeed: [-6, 6] as [number, number]
        } 
      }
    ],
    sound: { name: 'debris_fall' },
    screenShake: { intensity: 1, duration: 0.1 }
  },
  sparks: {
    particles: [
      { 
        config: { 
          textureId: 'bordered_square',
          count: 20, // Больше искр
          spread: Math.PI * 0.8, // Больше разброс
          speed: [200, 400] as [number, number], // Увеличиваем скорость
          life: [0.4, 0.9] as [number, number],
          size: [1.5, 3] as [number, number],
          startColor: 0x00FFFF, // Cyan neon
          endColor: 0x0080FF,   // Blue neon
          alpha: [1.0, 0] as [number, number],
          gravity: 0,
          friction: 0.75, // Меньше трение = больше разлет
          rotationSpeed: [-25, 25] as [number, number] // Быстрее вращение
        } 
      },
      { 
        config: { 
          textureId: 'bordered_square',
          count: 15, // Больше искр
          spread: Math.PI * 0.6, // Больше разброс
          speed: [150, 300] as [number, number], // Увеличиваем скорость
          life: [0.3, 0.7] as [number, number],
          size: [1, 2.5] as [number, number],
          startColor: 0xFF00FF, // Magenta neon
          endColor: 0x8000FF,
          alpha: [0.9, 0] as [number, number],
          gravity: 0,
          friction: 0.80, // Меньше трение
          rotationSpeed: [-20, 20] as [number, number] // Быстрее вращение
        } 
      },
      { 
        config: { 
          textureId: 'bordered_square',
          count: 10, // Дополнительный слой
          spread: Math.PI * 1.0, // Максимальный разброс
          speed: [300, 600] as [number, number], // Максимальная скорость
          life: [0.2, 0.5] as [number, number],
          size: [0.8, 1.5] as [number, number],
          startColor: 0xFFD700, // Золотой для яркости
          endColor: 0xFF4500,
          alpha: [1.0, 0] as [number, number],
          gravity: 0,
          friction: 0.70, // Минимальное трение
          rotationSpeed: [-30, 30] as [number, number] // Максимальное вращение
        } 
      }
    ],
    sound: { name: 'sparks' },
    screenShake: { intensity: 0.5, duration: 0.05 } // Увеличиваем тряску
  },
  dust: {
    particles: [
      { 
        config: { 
          textureId: 'bordered_square',
          count: 20,
          spread: Math.PI * 2,
          speed: [15, 60] as [number, number],
          life: [1.2, 2.8] as [number, number],
          size: [2, 4] as [number, number],
          startColor: 0x404040, // Dark gray neon
          alpha: [0.3, 0] as [number, number],
          gravity: -40,
          friction: 0.97,
          rotationSpeed: [-3, 3] as [number, number]
        } 
      },
      { 
        config: { 
          textureId: 'bordered_square',
          count: 15,
          spread: Math.PI * 2,
          speed: [8, 40] as [number, number],
          life: [1.5, 3.0] as [number, number],
          size: [1.5, 3] as [number, number],
          startColor: 0x606060, // Medium gray neon
          alpha: [0.2, 0] as [number, number],
          gravity: -20,
          friction: 0.99,
          rotationSpeed: [-2, 2] as [number, number]
        } 
      }
    ],
    sound: { name: 'dust' },
    screenShake: { intensity: 0.2, duration: 0.05 }
  },
  glow: {
    particles: [
      { 
        config: { 
          textureId: 'bordered_square',
          count: 10,
          spread: Math.PI * 2,
          speed: [25, 50] as [number, number],
          life: [1.2, 1.8] as [number, number],
          size: [1.5, 2.5] as [number, number],
          startColor: 0x00FFFF, // Cyan neon (будет переопределен)
          endColor: 0x0080FF,   // Blue neon
          alpha: [0.8, 0] as [number, number],
          gravity: 0,
          friction: 0.97,
          rotationSpeed: [-4, 4] as [number, number]
        } 
      },
      { 
        config: { 
          textureId: 'bordered_square',
          count: 6,
          spread: Math.PI * 2,
          speed: [15, 35] as [number, number],
          life: [1.0, 1.6] as [number, number],
          size: [1, 2] as [number, number],
          startColor: 0xFFFFFF, // White neon
          endColor: 0x00FFFF,
          alpha: [0.6, 0] as [number, number],
          gravity: 0,
          friction: 0.99,
          rotationSpeed: [-3, 3] as [number, number]
        } 
      }
    ],
    sound: { name: 'collect_coin' },
    screenShake: { intensity: 0.1, duration: 0.02 }
  },

  // Collection effects
  collection: {
    particles: [
      { 
        config: { 
          textureId: 'bordered_square',
          count: 8,
          spread: Math.PI * 2,
          speed: [50, 100] as [number, number],
          life: [0.8, 1.2] as [number, number],
          size: [2, 4] as [number, number],
          startColor: 0xFFFFFF, // White
          endColor: 0x00FFFF,   // Cyan
          alpha: [1.0, 0] as [number, number],
          gravity: 0,
          friction: 0.95,
          rotationSpeed: [-8, 8] as [number, number]
        } 
      }
    ],
    sound: { name: 'collect_coin' },
    screenShake: { intensity: 0.05, duration: 0.01 }
  },

  coinCollection: {
    particles: [
      { 
        config: { 
          textureId: 'bordered_square',
          count: 12,
          spread: Math.PI * 2,
          speed: [60, 120] as [number, number],
          life: [0.6, 1.0] as [number, number],
          size: [3, 6] as [number, number],
          startColor: 0xffd700, // Gold
          endColor: 0xffed4e,   // Light gold
          alpha: [1.0, 0] as [number, number],
          gravity: 0,
          friction: 0.92,
          rotationSpeed: [-10, 10] as [number, number]
        } 
      }
    ],
    sound: { name: 'collect_coin' },
    screenShake: { intensity: 0.08, duration: 0.02 }
  },

  oreCollection: {
    particles: [
      { 
        config: { 
          textureId: 'bordered_square',
          count: 10,
          spread: Math.PI * 2,
          speed: [40, 80] as [number, number],
          life: [0.8, 1.4] as [number, number],
          size: [2, 5] as [number, number],
          startColor: 0x10b981, // Green
          endColor: 0x34d399,   // Light green
          alpha: [1.0, 0] as [number, number],
          gravity: 0,
          friction: 0.94,
          rotationSpeed: [-6, 6] as [number, number]
        } 
      }
    ],
    sound: { name: 'collect_ore' },
    screenShake: { intensity: 0.06, duration: 0.015 }
  },

  energyCollection: {
    particles: [
      { 
        config: { 
          textureId: 'bordered_square',
          count: 8,
          spread: Math.PI * 2,
          speed: [70, 140] as [number, number],
          life: [0.5, 0.9] as [number, number],
          size: [2, 4] as [number, number],
          startColor: 0x3b82f6, // Blue
          endColor: 0x60a5fa,   // Light blue
          alpha: [1.0, 0] as [number, number],
          gravity: 0,
          friction: 0.90,
          rotationSpeed: [-12, 12] as [number, number]
        } 
      }
    ],
    sound: { name: 'collect_energy' },
    screenShake: { intensity: 0.07, duration: 0.018 }
  },

  rareCollection: {
    particles: [
      { 
        config: { 
          textureId: 'bordered_square',
          count: 15,
          spread: Math.PI * 2,
          speed: [80, 160] as [number, number],
          life: [1.0, 1.6] as [number, number],
          size: [3, 7] as [number, number],
          startColor: 0x8b5cf6, // Purple
          endColor: 0xa78bfa,   // Light purple
          alpha: [1.0, 0] as [number, number],
          gravity: 0,
          friction: 0.88,
          rotationSpeed: [-15, 15] as [number, number]
        } 
      },
      { 
        config: { 
          textureId: 'bordered_square',
          count: 8,
          spread: Math.PI * 2,
          speed: [40, 80] as [number, number],
          life: [1.2, 2.0] as [number, number],
          size: [1, 3] as [number, number],
          startColor: 0xffffff, // White
          endColor: 0x8b5cf6,   // Purple
          alpha: [0.8, 0] as [number, number],
          gravity: 0,
          friction: 0.95,
          rotationSpeed: [-8, 8] as [number, number]
        } 
      }
    ],
    sound: { name: 'collect_rare' },
    screenShake: { intensity: 0.12, duration: 0.03 }
  },

  bigCollection: {
    particles: [
      { 
        config: { 
          textureId: 'bordered_square',
          count: 20,
          spread: Math.PI * 2,
          speed: [100, 200] as [number, number],
          life: [1.0, 1.8] as [number, number],
          size: [4, 8] as [number, number],
          startColor: 0x00ff00, // Bright green
          endColor: 0x00aa00,   // Dark green
          alpha: [1.0, 0] as [number, number],
          gravity: 0,
          friction: 0.85,
          rotationSpeed: [-20, 20] as [number, number]
        } 
      }
    ],
    sound: { name: 'collect_rare' },
    screenShake: { intensity: 0.15, duration: 0.05 }
  }
};
