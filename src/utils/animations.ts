import { animate, stagger, type DOMKeyframesDefinition, type AnimationOptions } from 'motion';
import { duration, easing, neonColors } from '../shared/animation';

// Common animation presets
export const animations = {
  // Entrance animations
  fadeIn: (element: HTMLElement | string, delay = 0) => {
    const keyframes: DOMKeyframesDefinition = { opacity: [0, 1] };
    const options: AnimationOptions = { duration: duration.lg, delay, ease: easing.motion.out };
    return animate(element as Element, keyframes, options);
  },
    
  slideInUp: (element: HTMLElement | string, delay = 0) => {
    const keyframes: DOMKeyframesDefinition = { opacity: [0, 1], y: [20, 0] };
    const options: AnimationOptions = { duration: duration.md, delay, ease: easing.motion.out };
    return animate(element as Element, keyframes, options);
  },
    
  slideInDown: (element: HTMLElement | string, delay = 0) => {
    const keyframes: DOMKeyframesDefinition = { opacity: [0, 1], y: [-20, 0] };
    const options: AnimationOptions = { duration: duration.md, delay, ease: easing.motion.out };
    return animate(element as Element, keyframes, options);
  },
    
  scaleIn: (element: HTMLElement | string, delay = 0) => {
    const keyframes: DOMKeyframesDefinition = { opacity: [0, 1], scale: [0.8, 1] };
    const options: AnimationOptions = { duration: duration.sm, delay, ease: easing.motion.out };
    return animate(element as Element, keyframes, options);
  },
    
  // Interactive animations
  buttonPress: (element: HTMLElement | string) => {
    const keyframes: DOMKeyframesDefinition = { scale: [1, 0.95, 1] };
    const options: AnimationOptions = { duration: duration.xs, ease: easing.motion.out };
    return animate(element as Element, keyframes, options);
  },
    
  buttonHover: (element: HTMLElement | string) => {
    const keyframes: DOMKeyframesDefinition = { scale: [1, 1.05] };
    const options: AnimationOptions = { duration: duration.xs, ease: easing.motion.out };
    return animate(element as Element, keyframes, options);
  },
    
  // Spring animations for natural movement
  springBounce: (element: HTMLElement | string) => {
    const keyframes: DOMKeyframesDefinition = { scale: [1, 1.1] };
    const options: AnimationOptions = { type: 'spring', stiffness: 300, damping: 20 };
    return animate(element as Element, keyframes, options);
  },
    
  springRotate: (element: HTMLElement | string, degrees: number = 360) => {
    const keyframes: DOMKeyframesDefinition = { rotate: degrees };
    const options: AnimationOptions = { type: 'spring', stiffness: 200, damping: 15 };
    return animate(element as Element, keyframes, options);
  },
    
  glowPulse: (element: HTMLElement | string) => {
    const keyframes: DOMKeyframesDefinition = { 
      boxShadow: [
        `0 0 5px ${neonColors.primary}`,
        `0 0 20px ${neonColors.primary}, 0 0 30px ${neonColors.primary}`,
        `0 0 5px ${neonColors.primary}`
      ]
    };
    const options: AnimationOptions = { duration: 2, repeat: Infinity, ease: easing.motion.inOut };
    return animate(element as Element, keyframes, options);
  },
    
  // Resource animations
  resourceGain: (element: HTMLElement | string) => {
    if (!element) {
      console.warn('resourceGain: element is null or undefined');
      return Promise.resolve();
    }
    
    const targetElement = typeof element === 'string' ? document.querySelector(element) : element;
    if (!targetElement || !document.contains(targetElement)) {
      console.warn('resourceGain: element not found in DOM');
      return Promise.resolve();
    }
    
    const keyframes: DOMKeyframesDefinition = { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] };
    const options: AnimationOptions = { duration: duration.lg, ease: easing.motion.out };
    return animate(targetElement as Element, keyframes, options);
  },
    
  coinCollect: (element: HTMLElement | string) => {
    if (!element) {
      console.warn('coinCollect: element is null or undefined');
      return Promise.resolve();
    }
    
    const targetElement = typeof element === 'string' ? document.querySelector(element) : element;
    if (!targetElement || !document.contains(targetElement)) {
      console.warn('coinCollect: element not found in DOM');
      return Promise.resolve();
    }
    
    const keyframes: DOMKeyframesDefinition = { scale: [1, 1.5, 0], y: [0, -20, -40], opacity: [1, 0.8, 0] };
    const options: AnimationOptions = { duration: duration.xl, ease: easing.motion.out };
    return animate(targetElement as Element, keyframes, options);
  },
    
  // Panel animations
  panelSlideIn: (element: HTMLElement | string, direction: 'left' | 'right' | 'top' | 'bottom' = 'top') => {
    // Проверяем, что элемент существует и в DOM
    if (!element) {
      console.warn('panelSlideIn: element is null or undefined');
      return Promise.resolve();
    }
    
    const targetElement = typeof element === 'string' ? document.querySelector(element) : element;
    if (!targetElement || !document.contains(targetElement)) {
      console.warn('panelSlideIn: element not found in DOM');
      return Promise.resolve();
    }
    
    const transforms = {
      left: { x: [-100, 0] },
      right: { x: [100, 0] },
      top: { y: [-100, 0] },
      bottom: { y: [100, 0] }
    };
    
    const keyframes: DOMKeyframesDefinition = { opacity: [0, 1], ...transforms[direction] };
    const options: AnimationOptions = { duration: duration.lg, ease: easing.motion.out };
    return animate(targetElement as Element, keyframes, options);
  },
  
  // Stagger animations for lists
  staggerIn: (elements: HTMLElement[] | string, delay = 0.1) => {
    const keyframes: DOMKeyframesDefinition = { opacity: [0, 1], y: [20, 0] };
    const options: AnimationOptions = { duration: duration.md, delay: stagger(delay), ease: easing.motion.out };
    return animate(elements as Element[], keyframes, options);
  },
    
  // Stagger with spring for more natural feel
  staggerSpring: (elements: HTMLElement[] | string, delay = 0.1) => {
    const keyframes: DOMKeyframesDefinition = { opacity: [0, 1], y: [20, 0] };
    const options: AnimationOptions = { duration: duration.md, delay: stagger(delay), type: 'spring', stiffness: 200 };
    return animate(elements as Element[], keyframes, options);
  },
    
  // Modal animations
  modalEnter: (element: HTMLElement | string) => {
    const keyframes: DOMKeyframesDefinition = { 
      opacity: [0, 1], 
      scale: [0.8, 1],
      backgroundColor: ['rgba(17, 24, 39, 0)', 'rgba(17, 24, 39, 0.95)']
    };
    const options: AnimationOptions = { duration: duration.lg, ease: easing.motion.out };
    return animate(element as Element, keyframes, options);
  },
    
  modalExit: (element: HTMLElement | string) => {
    const keyframes: DOMKeyframesDefinition = { 
      scale: [1, 0.8], 
      opacity: [1, 0],
      backgroundColor: ['rgba(17, 24, 39, 0.95)', 'rgba(17, 24, 39, 0)']
    };
    const options: AnimationOptions = { duration: duration.md, ease: easing.motion.in };
    return animate(element as Element, keyframes, options);
  },

  // Backdrop animations
  backdropEnter: (element: HTMLElement | string) => {
    const keyframes: DOMKeyframesDefinition = { 
      opacity: [0, 1],
      backgroundColor: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.6)']
    };
    const options: AnimationOptions = { duration: duration.lg, ease: easing.motion.out };
    return animate(element as Element, keyframes, options);
  },
    
  backdropExit: (element: HTMLElement | string) => {
    const keyframes: DOMKeyframesDefinition = { 
      opacity: [1, 0],
      backgroundColor: ['rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0)']
    };
    const options: AnimationOptions = { duration: duration.md, ease: easing.motion.in };
    return animate(element as Element, keyframes, options);
  },
    
  // Special effects
  neonGlow: (element: HTMLElement | string, color: string = neonColors.primary) => {
    const keyframes: DOMKeyframesDefinition = { 
      textShadow: [
        `0 0 5px ${color}`,
        `0 0 20px ${color}, 0 0 30px ${color}`,
        `0 0 5px ${color}`
      ]
    };
    const options: AnimationOptions = { duration: 1.5, repeat: Infinity, ease: easing.motion.inOut };
    return animate(element as Element, keyframes, options);
  },
    
  // Mining animation
  miningPulse: (element: HTMLElement | string) => {
    const keyframes: DOMKeyframesDefinition = { 
      scale: [1, 1.1, 1],
      filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)']
    };
    const options: AnimationOptions = { duration: duration.lg, repeat: Infinity, ease: easing.motion.inOut };
    return animate(element as Element, keyframes, options);
  },
    
  // Upgrade purchase animation
  upgradePurchase: (element: HTMLElement | string) => {
    const keyframes: DOMKeyframesDefinition = { scale: [1, 1.2, 1], rotate: [0, 360, 0] };
    const options: AnimationOptions = { duration: duration.xl, ease: easing.motion.out };
    return animate(element as Element, keyframes, options);
  },
  
  // Resource sell animation
  resourceSell: (element: HTMLElement | string) => {
    const keyframes: DOMKeyframesDefinition = { 
      scale: [1, 1.1, 0.8], 
      opacity: [1, 0.8, 0.6],
      filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)']
    };
    const options: AnimationOptions = { duration: duration.md, ease: easing.motion.out };
    return animate(element as Element, keyframes, options);
  },
    
  // CSS selector animations
  animateSelector: (selector: string, keyframes: DOMKeyframesDefinition, options: AnimationOptions = {}) => 
    animate(selector, keyframes, options),
    
  // Hardware accelerated animations
  hardwareAccelerated: (element: HTMLElement | string) => {
    const keyframes: DOMKeyframesDefinition = { 
      opacity: [0, 1], 
      transform: ['translateY(20px) scale(0.9)', 'translateY(0) scale(1)']
    };
    const options: AnimationOptions = { duration: duration.md, ease: easing.motion.out };
    return animate(element as Element, keyframes, options);
  },
    
  // Color transitions
  colorTransition: (element: HTMLElement | string, fromColor: string, toColor: string) => {
    const keyframes: DOMKeyframesDefinition = { color: [fromColor, toColor] };
    const options: AnimationOptions = { duration: duration.sm, ease: easing.motion.out };
    return animate(element as Element, keyframes, options);
  }
};

// Animation utilities
export const animationUtils = {
  // Chain multiple animations
  chain: (...animations: Promise<any>[]) => 
    animations.reduce((prev, curr) => prev.then(() => curr), Promise.resolve()),
    
  // Create a repeating animation
  repeat: (element: HTMLElement | string, keyframes: DOMKeyframesDefinition, times: number = Infinity) => {
    const options: AnimationOptions = { repeat: times };
    return animate(element as Element, keyframes, options);
  },
    
  // Create a delayed animation
  delayed: (animation: Promise<any>, delay: number) => 
    new Promise(resolve => setTimeout(() => animation.then(resolve), delay)),
    
  // Create spring animation with custom settings
  spring: (element: HTMLElement | string, keyframes: DOMKeyframesDefinition, stiffness: number = 200, damping: number = 20) => {
    const options: AnimationOptions = { type: 'spring', stiffness, damping };
    return animate(element as Element, keyframes, options);
  },
    
  // Create sequence of animations
  sequence: async (animations: Array<() => Promise<any>>) => {
    for (const animation of animations) {
      await animation();
    }
  },
    
  // Animate multiple elements with different delays
  staggerElements: (elements: HTMLElement[], keyframes: DOMKeyframesDefinition, staggerDelay: number = 0.1) => {
    const options: AnimationOptions = { delay: stagger(staggerDelay) };
    return animate(elements as Element[], keyframes, options);
  },
    
  // Create infinite animation
  infinite: (element: HTMLElement | string, keyframes: DOMKeyframesDefinition, options: AnimationOptions = {}) => {
    const infiniteOptions: AnimationOptions = { ...options, repeat: Infinity };
    return animate(element as Element, keyframes, infiniteOptions);
  }
};

// Usage examples:
/*
// Basic animations
animations.fadeIn(document.getElementById('myElement'));
animations.slideInUp('.my-class');
animations.scaleIn('#myId', 0.2);

// Spring animations for natural movement
animations.springBounce(document.querySelector('.button'));
animations.springRotate('.icon', 180);

// Stagger animations for lists
const items = document.querySelectorAll('.list-item');
animations.staggerIn(items, 0.1);
animations.staggerSpring('.upgrade-item', 0.15);

// Interactive animations
document.querySelector('.button')?.addEventListener('click', (e) => {
  animations.buttonPress(e.target as HTMLElement);
});

// Special effects
animations.neonGlow('.title', '#ff00ff');
animations.glowPulse('.mining-button');
animations.miningPulse('.miner');

// Modal animations
animations.modalEnter('.modal');
animations.modalExit('.modal');

// Resource animations
animations.resourceGain('.coin');
animations.coinCollect('.coin-collected');

// CSS selector animations
animations.animateSelector('.panel', { x: [0, 100] }, { duration: 0.5 });

// Hardware accelerated animations
animations.hardwareAccelerated('.performance-critical');

// Color transitions
animations.colorTransition('.status', '#ff0000', '#00ff00');

// Utility functions
animationUtils.chain(
  animations.fadeIn('.step1'),
  animations.slideInUp('.step2'),
  animations.scaleIn('.step3')
);

animationUtils.sequence([
  () => animations.fadeIn('.first'),
  () => animations.slideInUp('.second'),
  () => animations.scaleIn('.third')
]);

animationUtils.spring('.bouncy', { scale: [1, 1.2] }, 400, 25);
animationUtils.infinite('.pulse', { opacity: [0.5, 1, 0.5] }, { duration: 2 });
*/
