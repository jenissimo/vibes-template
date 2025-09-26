/**
 * Shared Animation Constants - общие константы анимации
 * Используются в UI (Motion One) и Engine (GSAP) слоях
 */

// Easing функции для обоих слоев
export const easing = {
  // GSAP easing (для Engine)
  gsap: {
    out: 'power2.out',
    in: 'power2.in', 
    inOut: 'power2.inOut',
    back: 'back.out(1.7)',
    elastic: 'elastic.out(1, 0.3)',
    bounce: 'bounce.out'
  },
  
  // Motion One easing (для UI)
  motion: {
    out: 'easeOut',
    in: 'easeIn',
    inOut: 'easeInOut',
    back: 'easeOutBack',
    elastic: 'easeOutElastic',
    bounce: 'easeOutBounce'
  }
} as const;

// Длительности анимаций
export const duration = {
  xs: 0.15,    // очень быстро
  sm: 0.25,    // быстро  
  md: 0.35,    // средне
  lg: 0.5,     // медленно
  xl: 0.8,     // очень медленно
  xxl: 1.2     // супер медленно
} as const;

// Spring настройки для Motion One
export const spring = {
  gentle: { stiffness: 200, damping: 20 },
  bouncy: { stiffness: 300, damping: 15 },
  wobbly: { stiffness: 180, damping: 12 },
  stiff: { stiffness: 400, damping: 30 }
} as const;

// Stagger задержки
export const stagger = {
  fast: 0.05,
  normal: 0.1,
  slow: 0.15,
  verySlow: 0.2
} as const;

// CSS переменные для неоновых цветов (вместо хардкода)
export const neonColors = {
  primary: 'var(--neon-primary, #00ff99)',
  secondary: 'var(--neon-secondary, #00ffff)', 
  accent: 'var(--neon-accent, #ff00ff)',
  warning: 'var(--neon-warning, #ff6b35)',
  success: 'var(--neon-success, #10b981)',
  error: 'var(--neon-error, #ef4444)'
} as const;

// Общие анимационные пресеты
export const presets = {
  // UI анимации (Motion One)
  ui: {
    fadeIn: { opacity: [0, 1], duration: duration.md, ease: easing.motion.out },
    slideUp: { opacity: [0, 1], y: [20, 0], duration: duration.md, ease: easing.motion.out },
    scaleIn: { opacity: [0, 1], scale: [0.8, 1], duration: duration.sm, ease: easing.motion.out },
    buttonPress: { scale: [1, 0.95, 1], duration: duration.xs, ease: easing.motion.out },
    glowPulse: { 
      boxShadow: [
        `0 0 5px ${neonColors.primary}`,
        `0 0 20px ${neonColors.primary}, 0 0 30px ${neonColors.primary}`,
        `0 0 5px ${neonColors.primary}`
      ],
      duration: 2,
      repeat: Infinity,
      ease: easing.motion.inOut
    }
  },
  
  // Engine анимации (GSAP)
  engine: {
    fadeIn: { alpha: 1, duration: duration.md, ease: easing.gsap.out },
    fadeOut: { alpha: 0, duration: duration.md, ease: easing.gsap.in },
    scaleIn: { scale: 1, duration: duration.sm, ease: easing.gsap.out },
    moveBy: (dx: number, dy: number) => ({ 
      x: `+=${dx}`, 
      y: `+=${dy}`, 
      duration: duration.lg, 
      ease: easing.gsap.out 
    }),
    rotate: (degrees: number) => ({ 
      rotation: degrees, 
      duration: duration.md, 
      ease: easing.gsap.out 
    })
  }
} as const;

// Утилиты для работы с анимациями
export const animationUtils = {
  // Создать CSS переменную для цвета
  createColorVar: (color: string) => `var(--neon-${color}, ${color})`,
  
  // Конвертировать GSAP easing в Motion One
  gsapToMotion: (gsapEase: string): string => {
    const mapping: Record<string, string> = {
      'power2.out': 'easeOut',
      'power2.in': 'easeIn', 
      'power2.inOut': 'easeInOut',
      'back.out(1.7)': 'easeOutBack',
      'elastic.out(1, 0.3)': 'easeOutElastic',
      'bounce.out': 'easeOutBounce'
    };
    return mapping[gsapEase] || 'easeOut';
  },
  
  // Конвертировать Motion One easing в GSAP
  motionToGsap: (motionEase: string): string => {
    const mapping: Record<string, string> = {
      'easeOut': 'power2.out',
      'easeIn': 'power2.in',
      'easeInOut': 'power2.inOut', 
      'easeOutBack': 'back.out(1.7)',
      'easeOutElastic': 'elastic.out(1, 0.3)',
      'easeOutBounce': 'bounce.out'
    };
    return mapping[motionEase] || 'power2.out';
  }
} as const;

/**
 * Пример интеграции паузы игры с анимациями
 * 
 * @example
 * // В системе или компоненте
 * import { gameState } from '../stores/game/state';
 * 
 * // Подписка на изменения паузы
 * gameState.subscribe(state => {
 *   // Приостанавливаем все TweenComponent'ы при паузе
 *   tweenComponent.setPaused(state.isPaused);
 * });
 * 
 * // Или в update loop
 * if (gameState.get().isPaused) {
 *   tweenComponent.setPaused(true);
 * } else {
 *   tweenComponent.setPaused(false);
 * }
 */
