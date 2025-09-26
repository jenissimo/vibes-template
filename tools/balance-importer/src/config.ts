/**
 * Configuration for balance importer
 * Настройки импортера баланса из Google Sheets
 */

import 'dotenv/config';
import path from 'path';

// Описание одной таблицы для импорта
export interface SheetImportConfig {
  sheetName: string; // Имя листа в Google Sheets (например, "resources")
  outputFile: string; // Имя выходного файла без расширения (например, "resources")
  primaryKey?: string; // По какому полю делать индексированный объект (опционально)
  typeName: string; // Имя TypeScript интерфейса (например, "ResourceConfig")
  configType: string; // Тип конфига для ConfigManager (например, "ConfigType.RESOURCE")
  description: string; // Описание таблицы для документации
}

// Главная конфигурация
export const config = {
  // ID вашей таблицы (из URL: docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit)
  spreadsheetId: process.env.GOOGLE_SHEET_ID,
  
  // Директория для сгенерированных файлов относительно корня проекта
  outputDir: process.env.OUTPUT_DIR || path.join(process.cwd(), '../../src/generated'),
  
  // Путь к файлу с credentials
  credentialsPath: process.env.GOOGLE_CREDENTIALS_PATH || path.join(process.cwd(), '../../google-credentials.json'),
  
  // Список таблиц для импорта (обновлено под новую структуру)
  sheets: [
    /*
    {
      sheetName: 'constants',
      outputFile: 'constants',
      primaryKey: 'key',
      typeName: 'ConstantsConfig',
      configType: 'ConfigType.GAME_CONSTANTS',
      description: 'Game constants and base values'
    },
   */
  ] as SheetImportConfig[],
};

if (!config.spreadsheetId) {
  throw new Error("Переменная окружения GOOGLE_SHEET_ID не установлена! Создайте .env файл на основе env.example");
}

console.log(`[Config] Spreadsheet ID: ${config.spreadsheetId}`);
console.log(`[Config] Output directory: ${config.outputDir}`);
console.log(`[Config] Credentials path: ${config.credentialsPath}`);

