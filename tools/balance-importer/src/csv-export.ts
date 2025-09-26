/**
 * CSV Export utility for Google Sheets
 * Утилита для экспорта Google Sheets в CSV с фильтрацией листов
 */

import { fetchSheetData, validateSpreadsheet, getSheetsClient } from './google';
import { config } from './config';
import fs from 'fs';
import path from 'path';

// Интерфейс для информации о листе
interface SheetInfo {
  name: string;
  title: string;
  description?: string;
  isService: boolean;
  isContext: boolean;
  isData: boolean;
}

// Функция для конвертации данных в CSV
function convertToCSV(data: any[][]): string {
  if (!data || data.length === 0) {
    return '';
  }

  return data
    .map(row => 
      row.map(cell => {
        // Экранируем кавычки и оборачиваем в кавычки если есть запятые или переносы
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    )
    .join('\n');
}

// Функция для получения списка всех листов с их описаниями
export async function getAllSheetsInfo(): Promise<SheetInfo[]> {
  try {
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.get({
      spreadsheetId: config.spreadsheetId!,
    });

    const sheetsInfo: SheetInfo[] = [];
    
    if (response.data.sheets) {
      for (const sheet of response.data.sheets) {
        const title = sheet.properties?.title || '';
        const isService = title.startsWith('!');
        const isContext = title.startsWith('?');
        const isData = !isService && !isContext;
        
        sheetsInfo.push({
          name: title,
          title: title,
          description: isContext ? 'Контекстный лист с описанием' : undefined,
          isService,
          isContext,
          isData
        });
      }
    }

    return sheetsInfo;
  } catch (error) {
    console.error('[CSV Export] Ошибка при получении списка листов:', error);
    throw error;
  }
}

// Функция для экспорта всех листов в CSV с фильтрацией
export async function exportAllSheetsToCSV(): Promise<void> {
  console.log('🚀 --- Экспорт Google Sheets в CSV ---');
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

    // Получаем информацию о всех листах
    console.log('📋 Получение списка листов...');
    const sheetsInfo = await getAllSheetsInfo();
    
    // Фильтруем листы
    const serviceSheets = sheetsInfo.filter(s => s.isService);
    const contextSheets = sheetsInfo.filter(s => s.isContext);
    const dataSheets = sheetsInfo.filter(s => s.isData);
    
    console.log(`📊 Найдено листов:`);
    console.log(`   🔧 Служебные (!): ${serviceSheets.length}`);
    console.log(`   📝 Контекстные (?): ${contextSheets.length}`);
    console.log(`   📊 Данные: ${dataSheets.length}`);
    console.log('');

    // Создаем директорию для CSV файлов
    const csvDir = path.join(process.cwd(), 'csv-export');
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
    }

    // Экспортируем контекстные листы (для понимания структуры)
    if (contextSheets.length > 0) {
      console.log('📝 --- Экспорт контекстных листов ---');
      for (const sheetInfo of contextSheets) {
        try {
          console.log(`📋 Экспорт контекстного листа: "${sheetInfo.title}"`);
          
          const rawData = await fetchSheetData(config.spreadsheetId!, sheetInfo.title);
          const csvContent = convertToCSV(rawData);
          
          const csvPath = path.join(csvDir, `context_${sheetInfo.title.replace('?', '')}.csv`);
          fs.writeFileSync(csvPath, csvContent, 'utf8');
          
          console.log(`✅ Контекстный лист экспортирован в ${csvPath}`);
          console.log(`   📊 Строк: ${rawData.length}, Колонок: ${rawData[0]?.length || 0}`);
          console.log('');
          
        } catch (error) {
          console.error(`❌ Ошибка при экспорте контекстного листа "${sheetInfo.title}":`, error);
        }
      }
    }

    // Экспортируем листы с данными
    if (dataSheets.length > 0) {
      console.log('📊 --- Экспорт листов с данными ---');
      for (const sheetInfo of dataSheets) {
        try {
          console.log(`📋 Экспорт листа: "${sheetInfo.title}"`);
          
          const rawData = await fetchSheetData(config.spreadsheetId!, sheetInfo.title);
          const csvContent = convertToCSV(rawData);
          
          const csvPath = path.join(csvDir, `${sheetInfo.title}.csv`);
          fs.writeFileSync(csvPath, csvContent, 'utf8');
          
          console.log(`✅ Лист экспортирован в ${csvPath}`);
          console.log(`   📊 Строк: ${rawData.length}, Колонок: ${rawData[0]?.length || 0}`);
          
          // Показываем структуру данных
          if (rawData.length > 0) {
            console.log('   📋 Структура данных:');
            const headers = rawData[0];
            const dataRows = rawData.slice(1);
            
            console.log(`      Заголовки (${headers.length}): ${headers.join(', ')}`);
            
            if (dataRows.length > 0) {
              console.log(`      Первая строка данных: ${dataRows[0].join(' | ')}`);
              if (dataRows.length > 1) {
                console.log(`      Вторая строка данных: ${dataRows[1].join(' | ')}`);
              }
              if (dataRows.length > 2) {
                console.log(`      ... и еще ${dataRows.length - 2} строк`);
              }
            }
          }
          console.log('');
          
        } catch (error) {
          console.error(`❌ Ошибка при экспорте листа "${sheetInfo.title}":`, error);
          console.log('');
        }
      }
    }

    // Создаем сводный файл с информацией о листах
    const summaryPath = path.join(csvDir, 'sheets_summary.json');
    const summary = {
      totalSheets: sheetsInfo.length,
      serviceSheets: serviceSheets.map(s => s.title),
      contextSheets: contextSheets.map(s => s.title),
      dataSheets: dataSheets.map(s => s.title),
      exportedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
    console.log(`📄 Сводка по листам сохранена в: ${summaryPath}`);

    console.log('🎉 --- Экспорт завершен! ---');
    console.log(`📁 CSV файлы сохранены в: ${csvDir}`);
    
  } catch (error) {
    console.error('💥 --- ОШИБКА ЭКСПОРТА ---');
    console.error(error);
    process.exit(1);
  }
}

// Функция для экспорта конкретного листа
export async function exportSheetToCSV(sheetName: string): Promise<void> {
  console.log(`🚀 --- Экспорт листа "${sheetName}" в CSV ---`);
  
  try {
    const rawData = await fetchSheetData(config.spreadsheetId!, sheetName);
    const csvContent = convertToCSV(rawData);
    
    const csvDir = path.join(process.cwd(), 'csv-export');
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
    }
    
    const csvPath = path.join(csvDir, `${sheetName}.csv`);
    fs.writeFileSync(csvPath, csvContent, 'utf8');
    
    console.log(`✅ Лист экспортирован в ${csvPath}`);
    console.log(`📊 Строк: ${rawData.length}, Колонок: ${rawData[0]?.length || 0}`);
    
    // Показываем все данные для анализа
    console.log('\n📋 Полные данные:');
    rawData.forEach((row, index) => {
      console.log(`${index.toString().padStart(3)}: ${row.join(' | ')}`);
    });
    
  } catch (error) {
    console.error('💥 Ошибка экспорта:', error);
    throw error;
  }
}

// Если скрипт запущен напрямую
if (require.main === module) {
  const sheetName = process.argv[2];
  
  if (sheetName) {
    // Экспорт конкретного листа
    exportSheetToCSV(sheetName).catch(err => {
      console.error('💥 Критическая ошибка:', err);
      process.exit(1);
    });
  } else {
    // Экспорт всех листов
    exportAllSheetsToCSV().catch(err => {
      console.error('💥 Критическая ошибка:', err);
      process.exit(1);
    });
  }
}