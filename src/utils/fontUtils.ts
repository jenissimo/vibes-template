import { FONT_FAMILIES, type FontType } from '@/assets/fonts/fonts';

/**
 * Утилиты для работы со шрифтами
 * Обеспечивают консистентность между CSS и PixiJS
 */

/**
 * Получить CSS-совместимое имя шрифта
 * Использует те же значения, что и в theme.css
 */
export function getCSSFontFamily(fontType: FontType): string {
  return FONT_FAMILIES[fontType];
}

/**
 * Получить PixiJS-совместимое имя шрифта
 * Убирает кавычки для PixiJS Text объектов
 */
export function getPixiFontFamily(fontType: FontType): string {
  const cssFamily = FONT_FAMILIES[fontType];
  // Убираем кавычки для PixiJS
  return cssFamily.replace(/['"]/g, '');
}

/**
 * Проверить, поддерживается ли тип шрифта
 */
export function isSupportedFontType(fontType: string): fontType is FontType {
  return fontType in FONT_FAMILIES;
}

/**
 * Получить все доступные типы шрифтов
 */
export function getAvailableFontTypes(): FontType[] {
  return Object.keys(FONT_FAMILIES) as FontType[];
}

/**
 * Создать CSS-правило для @font-face
 * Полезно для динамического добавления шрифтов
 */
export function createFontFaceCSS(
  fontFamily: string,
  fontPath: string,
  fontWeight: number = 400,
  fontStyle: string = 'normal'
): string {
  return `
@font-face {
  font-family: '${fontFamily}';
  font-style: ${fontStyle};
  font-weight: ${fontWeight};
  font-display: swap;
  src: url('${fontPath}') format('woff2');
}
  `.trim();
}
