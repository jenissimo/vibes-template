// engine/components/TweenComponent.ts
import { Component } from '../Component';
import type { GameObject } from '../GameObject';
import { gsap } from 'gsap';
import { duration, easing } from '../../shared/animation';

// Регистрируем плагины для расширенных свойств
// AttrPlugin для атрибутов DOM, MotionPathPlugin для путей анимации
gsap.registerPlugin();

type TargetSelector =
  | 'self' | 'transform' | 'renderer' | 'text'
  | string                                 // имя класса компоненты, например 'PixiTextRenderer'
  | (new (...args:any[]) => any)           // сам класс
  | ((go: GameObject) => any)              // кастомная функция
  | object;                                // уже найденный объект

type Step =
  | { kind: 'to'; sel: TargetSelector; vars: any; pos?: string | number }
  | { kind: 'fromTo'; sel: TargetSelector; fromVars: any; toVars: any; pos?: string | number }
  | { kind: 'call'; fn: () => void; pos?: string | number }
  | { kind: 'wait'; sec: number; pos?: string | number }
  | { kind: 'label'; name: string; pos?: string | number }
  | { kind: 'destroy'; pos?: string | number };

/**
 * Компонент для анимации GameObject с помощью GSAP Timeline
 * Поддерживает селекторы компонентов, цепочки анимаций и автоматическое управление жизненным циклом
 * 
 * @example
 * // Создание анимации
 * const tween = new TweenComponent()
 *   .fadeIn()
 *   .moveBy(100, 0)
 *   .scaleIn()
 *   .wait(1)
 *   .fadeOut();
 * 
 * // Управление паузой (привязать к game state)
 * tween.setPaused(gameState.isPaused);
 * 
 * // Использование с селекторами
 * tween.use('renderer')
 *   .fadeIn()
 *   .use('self')
 *   .moveBy(50, 50);
 */
export class TweenComponent extends Component {
  private steps: Step[] = [];
  private currentSel: TargetSelector = 'self';
  private tl?: any; // GSAPTimeline

  constructor() {
    super();
  }

  // === Публичное API (чейнинг) ===
  use(sel: TargetSelector) { 
    this.currentSel = sel; 
    return this; 
  }

  /** GSAP-позиция опционально можно передать вторым аргументом (нап., "<", ">" или "+=0.2") */
  to(vars: any, pos?: string | number) {
    const normalizedVars = this.normalizeTransformVars(vars);
    this.steps.push({ kind: 'to', sel: this.currentSel, vars: normalizedVars, pos }); 
    return this;
  }
  
  fromTo(fromVars: any, toVars: any, pos?: string | number) {
    const normalizedFromVars = this.normalizeTransformVars(fromVars);
    const normalizedToVars = this.normalizeTransformVars(toVars);
    this.steps.push({ kind: 'fromTo', sel: this.currentSel, fromVars: normalizedFromVars, toVars: normalizedToVars, pos }); 
    return this;
  }
  
  wait(sec: number, pos?: string | number) { 
    this.steps.push({ kind:'wait', sec, pos }); 
    return this; 
  }
  
  call(fn: () => void, pos?: string | number) { 
    this.steps.push({ kind:'call', fn, pos }); 
    return this; 
  }
  
  label(name: string, pos?: string | number) { 
    this.steps.push({ kind:'label', name, pos }); 
    return this; 
  }
  
  destroy(pos?: string | number) { 
    this.steps.push({ kind:'destroy', pos }); 
    return this; 
  }

  /**
   * Очистить все шаги анимации и остановить текущий timeline
   */
  clear() {
    // Останавливаем текущий timeline
    if (this.tl) {
      this.tl.kill();
      this.tl = undefined;
    }
    
    // Очищаем массив шагов
    this.steps.length = 0;
    this.currentSel = 'self';
    
    return this;
  }

  // === Управление паузой ===
  /**
   * Приостановить/возобновить анимацию
   */
  setPaused(paused: boolean) {
    if (this.tl) {
      this.tl.paused(paused);
    }
    return this;
  }
  
  /**
   * Получить состояние паузы
   */
  isPaused(): boolean {
    return this.tl ? this.tl.paused() : false;
  }

  // === Сахарные методы с общими константами ===
  fadeIn(dur = duration.sm, ease = easing.gsap.out, pos?: string | number) {
    return this.to({ alpha: 1, duration: dur, ease }, pos);
  }
  
  fadeOut(dur = duration.md, ease = easing.gsap.in, pos?: string | number) {
    return this.to({ alpha: 0, duration: dur, ease }, pos);
  }
  
  moveBy(dx: number, dy: number, dur = duration.lg, ease = easing.gsap.out, pos?: string | number) {
    // относительное смещение — GSAP ожидает строки "+=.."
    const x = (dx >= 0 ? '+=' + dx : String(dx));
    const y = (dy >= 0 ? '+=' + dy : String(dy));
    return this.to({ x, y, duration: dur, ease }, pos);
  }
  
  scaleIn(dur = duration.sm, ease = easing.gsap.out, pos?: string | number) {
    return this.to({ scale: 1, duration: dur, ease }, pos);
  }
  
  scaleOut(dur = duration.sm, ease = easing.gsap.in, pos?: string | number) {
    return this.to({ scale: 0, duration: dur, ease }, pos);
  }
  
  rotate(degrees: number, dur = duration.md, ease = easing.gsap.out, pos?: string | number) {
    return this.to({ rotation: degrees, duration: dur, ease }, pos);
  }

  // === Жизненный цикл ===
  onAdded() {
    // Сборка таймлайна (играем сразу; можно paused:true и .play() — как тебе удобнее)
    this.tl = gsap.timeline({ paused: false });
    
    for (const s of this.steps) {
      switch (s.kind) {
        case 'to': {
          const target = this.resolveTarget(s.sel);
          this.tl.to(target, s.vars, s.pos);
          break;
        }
        case 'fromTo': {
          const target = this.resolveTarget(s.sel);
          this.tl.fromTo(target, s.fromVars, s.toVars, s.pos);
          break;
        }
        case 'wait': {
          // «ожидание» через пустой tween
          this.tl.to({}, { duration: s.sec }, s.pos);
          break;
        }
        case 'call': {
          this.tl.call(s.fn, undefined, s.pos);
          break;
        }
        case 'label': {
          this.tl.addLabel(s.name, s.pos as any);
          break;
        }
        case 'destroy': {
          this.tl.call(() => this.gameObject?.destroy(), undefined, s.pos);
          break;
        }
      }
    }
  }

  onRemoved() {
    // На всякий — прибираемся
    if (this.tl) {
      this.tl.kill();
      this.tl = undefined;
    }
  }

  // === Резолвер целей ===
  private resolveTarget(sel: TargetSelector): any {
    const go = this.gameObject as any;

    // явный объект
    if (sel && typeof sel === 'object' && !('prototype' in (sel as any))) return sel;

    // функция-селектор
    if (typeof sel === 'function' && !('prototype' in sel)) return (sel as any)(go);

    // псевдонимы
    if (sel === 'self' || sel === 'transform') return go; // у GameObject должны быть x/y
    if (sel === 'renderer' || sel === 'text') {
      const r = this.findComponentByName(go, 'PixiTextRenderer');
      return this.componentToDisplay(r) ?? go;
    }

    // класс компоненты
    if (typeof sel === 'function' && 'prototype' in sel) {
      const c = go.get?.(sel) ?? this.findComponentByCtor(go, sel as any);
      return this.componentToDisplay(c) ?? c ?? go;
    }

    // строка — имя класса компоненты
    if (typeof sel === 'string') {
      const c = this.findComponentByName(go, sel);
      return this.componentToDisplay(c) ?? c ?? go;
    }

    return go;
  }

  private componentToDisplay(comp: any) {
    // Проверяем, является ли компонент ITweenable
    if (this.isTweenable(comp)) {
      return comp;
    }
    
    // Проверяем, является ли компонент наследником PixiSpriteRenderer
    if (this.isPixiSpriteRenderer(comp)) {
      return comp.sprite;
    }
    
    // Универсальная проверка - ищем любой display объект
    return comp?.container ?? comp?.displayObject ?? comp?.view ?? comp?.textSprite ?? comp?.sprite ?? null;
  }

  private findComponentByName(go: any, name: string) {
    const arr: any[] = go?.getComponents?.() ?? go?.components ?? go?._components ?? [];
    return arr.find(c => (c?.constructor?.name === name)) ?? null;
  }
  
  private findComponentByCtor(go: any, ctor: any) {
    const arr: any[] = go?.getComponents?.() ?? go?.components ?? go?._components ?? [];
    return arr.find(c => c instanceof ctor) ?? null;
  }

  /**
   * Проверяет, является ли компонент ITweenable
   */
  private isTweenable(comp: any): boolean {
    if (!comp || typeof comp !== 'object') return false;
    
    // Проверяем наличие стандартных свойств ITweenable
    const tweenableProps = ['alpha', 'scale', 'rotation', 'x', 'y'];
    return tweenableProps.every(prop => 
      typeof comp[prop] === 'number' || 
      (typeof comp[prop] === 'object' && comp[prop] !== null)
    );
  }

  /**
   * Проверяет, является ли компонент наследником PixiSpriteRenderer
   * Использует проверку на наличие свойства sprite и методов PixiSpriteRenderer
   */
  private isPixiSpriteRenderer(comp: any): boolean {
    if (!comp || typeof comp !== 'object') return false;
    
    // Проверяем наличие sprite (основное свойство PixiSpriteRenderer)
    if (!comp.sprite) return false;
    
    // Проверяем наличие ключевых методов PixiSpriteRenderer
    const requiredMethods = ['setAlpha', 'setTint', 'setVisible', 'setOffset'];
    const hasRequiredMethods = requiredMethods.every(method => 
      typeof comp[method] === 'function'
    );
    
    return hasRequiredMethods;
  }

  /**
   * Нормализует свойства трансформации для GSAP
   * Конвертирует scaleX/scaleY в scale или scaleX/scaleY в правильном формате
   */
  private normalizeTransformVars(vars: any): any {
    if (!vars || typeof vars !== 'object') return vars;

    const normalized = { ...vars };

    // Обрабатываем scaleX и scaleY
    if ('scaleX' in normalized || 'scaleY' in normalized) {
      const scaleX = normalized.scaleX ?? 1;
      const scaleY = normalized.scaleY ?? 1;
      
      // Если scaleX и scaleY одинаковые, используем просто scale
      if (scaleX === scaleY) {
        normalized.scale = scaleX;
        delete normalized.scaleX;
        delete normalized.scaleY;
      } else {
        // Иначе оставляем как есть, но убеждаемся что значения корректные
        normalized.scaleX = scaleX;
        normalized.scaleY = scaleY;
      }
    }

    return normalized;
  }
}
