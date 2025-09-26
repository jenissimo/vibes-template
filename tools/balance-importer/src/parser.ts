/**
 * Data parsing and validation
 * Парсинг и валидация данных из Google Sheets
 */

import { z } from 'zod';

// Пытается распознать и преобразовать тип значения
function parseValue(value: string): unknown {
  // Пустую строку считаем null
  if (value === '') return null;
  
  // Boolean
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  
  // Number (целое или с плавающей точкой)
  if (!isNaN(Number(value)) && !isNaN(parseFloat(value))) {
    return Number(value);
  }
  
  // JSON Object
  if (value.startsWith('{') && value.endsWith('}')) {
    try {
      return JSON.parse(value);
    } catch (e) {
      // Игнорируем ошибку, если это невалидный JSON, и возвращаем как строку
      console.warn(`[Parser] Невалидный JSON: "${value}", возвращаем как строку`);
    }
  }
  
  // Array (разделенный запятыми)
  if (value.includes(',')) {
    return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
  }
  
  // String
  return value;
}

// Главная функция парсинга
export function parseSheetData<T extends Record<string, any>>(rows: any[][]): T[] {
  const [header, ...dataRows] = rows;
  
  if (!header) {
    throw new Error('Не найден заголовок (первая строка) в таблице.');
  }

  console.log(`[Parser] Заголовки: ${header.join(', ')}`);

  return dataRows
    .filter((row, rowIndex) => {
      // Пропускаем строки-заголовки (где только первый столбец заполнен, а остальные пустые)
      const firstCell = row[0] ?? '';
      const hasOtherData = row.slice(1).some(cell => cell && cell.toString().trim() !== '');
      return firstCell && hasOtherData;
    })
    .map((row, rowIndex) => {
      const entry = {} as T;
      
      header.forEach((key, colIndex) => {
        if (!key) return; // Пропускаем пустые заголовки
        
        const rawValue = row[colIndex] ?? '';
        const parsedValue = parseValue(rawValue);
        
        entry[key as keyof T] = parsedValue as any;
      });
      
      return entry;
    });
}

// Схемы валидации для разных типов конфигов
export const validationSchemas = {
    // Add your schemas here
};

// Функция валидации данных
export function validateData<T>(data: any[], schema: any, sheetName: string): T[] {
  const validatedData: T[] = [];
  const errors: string[] = [];

  data.forEach((item, index) => {
    try {
      const validated = schema.parse(item);
      validatedData.push(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues.map((err) => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        errors.push(`Строка ${index + 2}: ${errorMessages}`);
      } else {
        errors.push(`Строка ${index + 2}: Неизвестная ошибка валидации`);
      }
    }
  });

  if (errors.length > 0) {
    console.error(`[Parser] Ошибки валидации для листа "${sheetName}":`);
    errors.forEach(error => console.error(`  - ${error}`));
    throw new Error(`Валидация не пройдена для листа "${sheetName}". Исправьте ошибки в таблице.`);
  }

  console.log(`[Parser] Валидация пройдена для листа "${sheetName}": ${validatedData.length} записей`);
  return validatedData;
}
