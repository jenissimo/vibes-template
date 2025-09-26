/**
 * Main balance importer entry point
 * Главный файл импортера баланса
 */

import { config } from './config';
import { fetchAllSheetsData, validateSpreadsheet } from './google';
import { parseSheetData, validateData, validationSchemas } from './parser';
import { generateTsFile, generateIndexFile, generateReadme, generateConfigType } from './generator';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('🚀 --- Запуск импортера баланса Idle Neon Miner ---');
  console.log(`📊 Таблица: ${config.spreadsheetId}`);
  console.log(`📁 Выходная директория: ${config.outputDir}`);
  console.log('');

  try {
    // 1. Очищаем выходную директорию
    console.log('🧹 Очистка выходной директории...');
    if (fs.existsSync(config.outputDir)) {
      const files = fs.readdirSync(config.outputDir);
      for (const file of files) {
        fs.unlinkSync(path.join(config.outputDir, file));
      }
    } else {
      fs.mkdirSync(config.outputDir, { recursive: true });
    }
    console.log('✅ Выходная директория очищена\n');

    // 2. Проверяем доступность таблицы
    console.log('🔍 Проверка доступности таблицы...');
    const isAccessible = await validateSpreadsheet(config.spreadsheetId!);
    if (!isAccessible) {
      throw new Error('Таблица недоступна. Проверьте ID таблицы и права доступа.');
    }
    console.log('✅ Таблица доступна\n');

    // 3. Параллельная загрузка всех листов
    console.log('🚀 Параллельная загрузка всех листов...');
    const sheetNames = config.sheets.map(sheet => sheet.sheetName);
    const allSheetsData = await fetchAllSheetsData(config.spreadsheetId!, sheetNames);
    console.log('');

    // 4. Обрабатываем каждый лист (теперь данные уже в памяти)
    for (const sheetConfig of config.sheets) {
      try {
        console.log(`📋 Обработка листа: "${sheetConfig.sheetName}"`);
        
        // Получаем уже загруженные данные
        const rawData = allSheetsData[sheetConfig.sheetName];
        if (!rawData) {
          throw new Error(`Данные для листа "${sheetConfig.sheetName}" не найдены`);
        }
        
        // Парсинг данных
        const parsedData = parseSheetData(rawData);
        
        // Валидация данных (если есть схема)
        const schema = validationSchemas[sheetConfig.outputFile as keyof typeof validationSchemas];
        const validatedData = schema ? validateData(parsedData, schema, sheetConfig.sheetName) : parsedData;
        
        // Генерация файла
        generateTsFile(sheetConfig, validatedData as Record<string, any>[], config.outputDir);
        
        console.log(`✅ Лист "${sheetConfig.sheetName}" обработан успешно\n`);
        
      } catch (error) {
        console.error(`❌ Ошибка при обработке листа "${sheetConfig.sheetName}":`);
        console.error(error);
        console.log('');
        
        // Прерываем выполнение при первой ошибке
        process.exit(1);
      }
    }

    // 5. Генерируем дополнительные файлы
    console.log('📝 Генерация дополнительных файлов...');
    generateConfigType(config.outputDir, config.sheets);
    generateIndexFile(config.outputDir, config.sheets);
    generateReadme(config.outputDir, config.sheets);
    
    console.log('');
    console.log('🎉 --- Импорт баланса успешно завершен! ---');
    console.log(`📁 Файлы сохранены в: ${config.outputDir}`);
    console.log('');
    console.log('💡 Следующие шаги:');
    console.log('   1. Проверьте сгенерированные файлы');
    console.log('   2. Обновите импорты в игре');
    console.log('   3. Запустите тесты для проверки');
    
  } catch (error) {
    console.error('');
    console.error('💥 --- КРИТИЧЕСКАЯ ОШИБКА ИМПОРТЕРА ---');
    console.error(error);
    console.error('');
    console.error('🔧 Возможные решения:');
    console.error('   - Проверьте GOOGLE_SHEET_ID в .env файле');
    console.error('   - Убедитесь, что google-credentials.json существует');
    console.error('   - Проверьте права доступа к таблице');
    console.error('   - Убедитесь, что все листы существуют в таблице');
    
    process.exit(1);
  }
}

// Обработка сигналов завершения
process.on('SIGINT', () => {
  console.log('\n⏹️  Импорт прерван пользователем');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Необработанное отклонение Promise:', reason);
  process.exit(1);
});

// Запуск
main().catch(err => {
  console.error('💥 Критическая ошибка:', err);
  process.exit(1);
});

