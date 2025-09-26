/**
 * List all sheets in Google Spreadsheet
 * Показать все листы в Google таблице
 */

import { getSheetsClient } from './google';
import { config } from './config';

async function listAllSheets() {
  console.log('🔍 --- Список всех листов в таблице ---');
  console.log(`📊 Таблица: ${config.spreadsheetId}`);
  console.log('');

  try {
    const sheets = await getSheetsClient();
    
    const response = await sheets.spreadsheets.get({
      spreadsheetId: config.spreadsheetId!,
    });
    
    const spreadsheet = response.data;
    console.log(`📋 Название таблицы: "${spreadsheet.properties?.title}"`);
    console.log('');
    
    if (spreadsheet.sheets && spreadsheet.sheets.length > 0) {
      console.log('📄 Доступные листы:');
      spreadsheet.sheets.forEach((sheet, index) => {
        const properties = sheet.properties;
        console.log(`   ${index + 1}. "${properties?.title}"`);
        console.log(`      ID: ${properties?.sheetId}`);
        console.log(`      Тип: ${properties?.sheetType}`);
        console.log(`      Строк: ${properties?.gridProperties?.rowCount || 'неизвестно'}`);
        console.log(`      Колонок: ${properties?.gridProperties?.columnCount || 'неизвестно'}`);
        console.log('');
      });
    } else {
      console.log('❌ Листы не найдены');
    }
    
  } catch (error) {
    console.error('💥 Ошибка при получении списка листов:', error);
    process.exit(1);
  }
}

// Запуск
listAllSheets().catch(err => {
  console.error('💥 Критическая ошибка:', err);
  process.exit(1);
});
