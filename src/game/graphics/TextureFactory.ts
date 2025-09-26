import * as PIXI from 'pixi.js';

import { logger } from '../../engine/logging';
import type { CacheMetrics } from '../../shared/game-types';
import { TextureCache } from './TextureCache';
import { ServiceRegistry, ServiceKeys } from '../../engine/registry';

/**
 * TextureFactory - сервис для создания текстур из PIXI.Graphics и SVG
 * Генерирует неоновые текстуры и эффекты для игровых объектов
 */
export class TextureFactory {
  private static instance: TextureFactory;
  private cache: TextureCache;

  private constructor() {
    // Initialize cache with reasonable limits
    this.cache = new TextureCache(200, 100);
  }

  public static getInstance(): TextureFactory {
    if (!TextureFactory.instance) {
      TextureFactory.instance = new TextureFactory();
    }
    return TextureFactory.instance;
  }

  /**
   * Инициализация фабрики текстур
   */
  public initialize(): void {
    logger.info('✅ TextureFactory: Инициализирован', { source: 'game' });
  }

  /**
   * Get cache metrics for monitoring
   */
  public getCacheMetrics(): CacheMetrics {
    return this.cache.getCacheMetrics();
  }

  /**
   * Reset cache metrics
   */
  public resetMetrics(): void {
    this.cache.resetMetrics();
  }

  /**
   * Загрузка SVG как РАСТРА с умной предобработкой (contain/cover, padding, square size).
   * Можно передать либо URL/путь, либо сырую строку SVG (начинается с "<svg").
   */
  public async loadSVGTexture(
    svgPathOrMarkup: string,
    size: number = 64,
    opts?: {
      fit?: 'contain' | 'cover';   // как вписывать в квадрат, по умолчанию 'contain'
      padding?: number;            // внутренний отступ в px (в координатах итоговой текстуры)
      background?: string | null;  // цвет фона для SVG (например '#000' или 'none'), по умолчанию null (прозрачно)
      mipmaps?: boolean;           // генерить мипмапы у итоговой текстуры
    }
  ): Promise<PIXI.Texture> {
    const fit = opts?.fit ?? 'contain';
    const padding = Math.max(0, opts?.padding ?? 0);
    const bg = (opts?.background ?? null);
    const key = `svg_pre_${size}_${fit}_${padding}_${bg ?? 'transparent'}_${opts?.mipmaps ? 'mm' : 'no'}_${svgPathOrMarkup}`;

    const cached = this.cache.getTexture(key);
    if (cached) { return cached; }

    try {
      // 1) Получаем сырой SVG-текст: либо это уже <svg...>, либо тянем по URL
      const rawSvg = svgPathOrMarkup.trim().startsWith('<')
        ? svgPathOrMarkup
        : await this.fetchText(svgPathOrMarkup);

      // 2) Предобработка: нормализуем viewBox, width/height, fit/padding/фон
      const processedSvg = this.prepareSvgForSize(rawSvg, size, size, { fit, padding, background: bg });

      // 3) В data URL (без лишних пробелов/переносов)
      const dataUrl = this.svgToDataUrl(processedSvg);

      // 4) Загружаем как текстуру (растр уже нужного размера)
      const tex = await PIXI.Assets.load<PIXI.Texture>(dataUrl);

      // Текстура загружена, можно использовать

      this.cache.setTexture(key, tex);
      return tex;
    } catch (error) {
      logger.warn('loadSVGTexture(preprocess) failed', { error, source: 'game' });
      throw error;
    }
  }

  /** Получить текст по URL (same-origin желательно, иначе CORS) */
  private async fetchText(url: string): Promise<string> {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status} while fetching ${url}`);
    return await resp.text();
  }

  /**
   * Преобразуем SVG в строку нужного размера:
   * - Гарантируем viewBox
   * - Проставляем width/height = targetW/targetH
   * - Устанавливаем preserveAspectRatio (meet/slice)
   * - Применяем padding через расширение viewBox
   * - Опционально добавляем фон <rect> под содержимое
   */
  private prepareSvgForSize(
    svg: string,
    targetW: number,
    targetH: number,
    opts: { fit: 'contain' | 'cover'; padding: number; background: string | null }
  ): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const root = doc.documentElement;

    // Validate that we actually got an <svg> root, not HTML (e.g., SPA index fallback)
    const isSvg = root && root.nodeName.toLowerCase() === 'svg';
    const hasParserError = doc.getElementsByTagName('parsererror').length > 0;
    if (!isSvg || hasParserError) {
      const preview = svg.slice(0, 180).replace(/\s+/g, ' ');
      throw new Error(`Invalid SVG content. Expected <svg> root. Got: ${root?.nodeName || 'unknown'}. Preview: ${preview}`);
    }

    // 1) viewBox
    let vb = root.getAttribute('viewBox');
    if (!vb) {
      // если нет viewBox, берём width/height
      let wAttr = root.getAttribute('width') || '0';
      let hAttr = root.getAttribute('height') || '0';
      const w = this.parseSizeToNumber(wAttr);
      const h = this.parseSizeToNumber(hAttr);
      // если совсем ничего — fallback на 0 0 100 100
      const vbW = w > 0 ? w : 100;
      const vbH = h > 0 ? h : 100;
      vb = `0 0 ${vbW} ${vbH}`;
      root.setAttribute('viewBox', vb);
    }
    const [vx, vy, vwRaw, vhRaw] = (root.getAttribute('viewBox') || vb!).split(/\s+|,/).map(Number);
    let vw = vwRaw || 100;
    let vh = vhRaw || 100;

    // 2) padding → расширяем viewBox на долю пикселей итоговой текстуры.
    // Пересчёт: padding (px вывода) → padding в координатах viewBox:
    const pxToVbX = vw / targetW;
    const pxToVbY = vh / targetH;
    const padX = opts.padding * pxToVbX;
    const padY = opts.padding * pxToVbY;
    const newVx = vx - padX;
    const newVy = vy - padY;
    const newVw = vw + padX * 2;
    const newVh = vh + padY * 2;
    root.setAttribute('viewBox', `${newVx} ${newVy} ${newVw} ${newVh}`);

    // 3) preserveAspectRatio (contain/cover)
    const par = opts.fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet';
    root.setAttribute('preserveAspectRatio', par);

    // 4) Итоговые физические размеры в пикселях вывода
    root.setAttribute('width', String(targetW));
    root.setAttribute('height', String(targetH));

    // 5) Фон (если нужен, иначе прозрачность)
    if (opts.background && opts.background !== 'none') {
      // добавим в начало body прямоугольник фона
      const rect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', String(newVx));
      rect.setAttribute('y', String(newVy));
      rect.setAttribute('width', String(newVw));
      rect.setAttribute('height', String(newVh));
      rect.setAttribute('fill', opts.background);
      // вставим самым первым ребёнком
      const first = root.firstChild;
      root.insertBefore(rect, first);
    }

    // 6) Чистим потенциально мешающие атрибуты масштабированию (не обязательно)
    // root.removeAttribute('style'); // если нужно пожёстче

    const serialized = new XMLSerializer().serializeToString(root);
    return serialized;
  }

  /** Превращаем SVG-текст в data:image/svg+xml URL */
  private svgToDataUrl(svg: string): string {
    // Нормализуем пробелы и убираем BOM/лишние переносы
    const compact = svg.replace(/\s{2,}/g, ' ').trim();
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(compact)}`;
  }

  /** Парсер '96', '96px' → 96 */
  private parseSizeToNumber(v: string): number {
    const m = String(v).match(/([\d.]+)/);
    return m ? parseFloat(m[1]) : 0;
  }

  /**
   * Очистить кэш текстур
   */
  public clearCache(): void {
    this.cache.clearCache();
  }

  /**
   * Get cache size information
   */
  public getCacheSize(): { textures: number; graphics: number; total: number } {
    return this.cache.getCacheSize();
  }

  /**
   * Set cache size limits
   */
  public setCacheLimits(textureLimit: number, graphicsLimit: number): void {
    this.cache.setCacheLimits(textureLimit, graphicsLimit);
  }

  /**
   * Инвалидация кеша по префиксу (универсальный метод)
   */
  public invalidateCacheByPrefix(prefix: string): number {
    return this.cache.deleteTexturesByPrefix(prefix);
  }

  /**
   * Получить информацию о кеше для отладки
   */
  public getCacheDebugInfo(): {
    textureKeys: string[];
    graphicsKeys: string[];
    metrics: CacheMetrics;
  } {
    return {
      textureKeys: this.cache.getTextureKeys(),
      graphicsKeys: this.cache.getGraphicsKeys(),
      metrics: this.cache.getCacheMetrics()
    };
  }

  /**
   * Универсальный метод для запекания PIXI.Graphics в текстуру
   * Принимает готовый Graphics объект и рендерит его в RenderTexture
   */
  public bakeGraphicsToTexture(
    graphics: PIXI.Graphics,
    width: number,
    height: number,
    cacheKey?: string
  ): PIXI.Texture {
    // Если есть ключ кеша, проверяем кеш
    if (cacheKey) {
      const cached = this.cache.getTexture(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Создаем RenderTexture
    const renderTexture = PIXI.RenderTexture.create({
      width,
      height,
      resolution: window.devicePixelRatio || 1
    });

    // Получаем рендерер из ServiceRegistry
    const app = ServiceRegistry.get<PIXI.Application>(ServiceKeys.PixiApp);
    if (app && app.renderer) {
      // Рендерим Graphics в текстуру (как в bakeSpaceBackground)
      app.renderer.render({ container: graphics, target: renderTexture });
    }

    // Кешируем результат если есть ключ
    if (cacheKey) {
      this.cache.setTexture(cacheKey, renderTexture);
    }

    return renderTexture;
  }
}