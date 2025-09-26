/**
 * Analyze all columns in all sheets
 * Анализ всех столбцов во всех листах
 */

import { fetchSheetData, validateSpreadsheet } from './google';
import { config } from './config';

async function analyzeAllSheets() {
  console.log('🔍 --- Анализ структуры всех листов ---');
  console.log(`📊 Таблица: ${config.spreadsheetId}`);
  console.log('');

  try {
    // Проверяем доступность таблицы
    console.log('🔍 Проверка доступности таблицы...');
    const isAccessible = await validateSpreadsheet(config.spreadsheetId!);
    if (!isAccessible) {
      throw new Error('Таблица недоступна. Проверьте ID таблицы и права доступа.');
    }
    console.log('✅ Таблица доступна\n');

    // Анализируем каждый лист
    for (const sheetConfig of config.sheets) {
      try {
        console.log(`📋 Анализ листа: "${sheetConfig.sheetName}"`);
        console.log('─'.repeat(50));
        
        // Загружаем данные
        const rawData = await fetchSheetData(config.spreadsheetId!, sheetConfig.sheetName);
        
        if (rawData.length === 0) {
          console.log('❌ Лист пуст');
          console.log('');
          continue;
        }

        const [headers, ...dataRows] = rawData;
        console.log(`📊 Строк данных: ${dataRows.length}`);
        console.log(`📋 Столбцов: ${headers.length}`);
        console.log('');
        
        // Анализируем каждый столбец
        console.log('📝 Структура столбцов:');
        headers.forEach((header, index) => {
          if (!header) {
            console.log(`   ${index + 1}. [ПУСТОЙ ЗАГОЛОВОК]`);
            return;
          }

          // Собираем примеры значений из первых 3 строк
          const sampleValues = dataRows.slice(0, 3).map(row => row[index] || '[ПУСТО]');
          const uniqueValues = [...new Set(sampleValues)];
          
          // Определяем тип данных
          let dataType = 'string';
          const nonEmptyValues = sampleValues.filter(v => v !== '[ПУСТО]' && v !== '');
          
          if (nonEmptyValues.length > 0) {
            const firstValue = nonEmptyValues[0];
            if (!isNaN(Number(firstValue)) && firstValue !== '') {
              dataType = 'number';
            } else if (firstValue.toLowerCase() === 'true' || firstValue.toLowerCase() === 'false') {
              dataType = 'boolean';
            } else if (firstValue.startsWith('{') && firstValue.endsWith('}')) {
              dataType = 'object';
            } else if (firstValue.includes(',')) {
              dataType = 'array';
            }
          }

          console.log(`   ${index + 1}. "${header}" (${dataType})`);
          console.log(`      Примеры: ${uniqueValues.join(' | ')}`);
          
          // Показываем статистику по пустым значениям
          const emptyCount = dataRows.filter(row => !row[index] || row[index] === '').length;
          if (emptyCount > 0) {
            console.log(`      Пустых значений: ${emptyCount}/${dataRows.length} (${Math.round(emptyCount/dataRows.length*100)}%)`);
          }
          console.log('');
        });

        // Показываем первые несколько строк для контекста
        console.log('📄 Первые строки данных:');
        const previewRows = dataRows.slice(0, 3);
        previewRows.forEach((row, rowIndex) => {
          console.log(`   Строка ${rowIndex + 1}: ${row.join(' | ')}`);
        });
        
        console.log('');
        console.log('═'.repeat(60));
        console.log('');
        
      } catch (error) {
        console.error(`❌ Ошибка при анализе листа "${sheetConfig.sheetName}":`, error);
        console.log('');
      }
    }

    console.log('🎉 --- Анализ завершен! ---');
    
  } catch (error) {
    console.error('💥 --- ОШИБКА АНАЛИЗА ---');
    console.error(error);
    process.exit(1);
  }
}

// Запуск
analyzeAllSheets().catch(err => {
  console.error('💥 Критическая ошибка:', err);
  process.exit(1);
});
