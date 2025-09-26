/**
 * Google Sheets API integration
 * Интеграция с Google Sheets API
 */

import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import path from 'path';

const CREDENTIALS_PATH = path.join(process.cwd(), '../../google-credentials.json');

// Создаем аутентифицированный клиент
export async function getSheetsClient() {
  try {
    const auth = new GoogleAuth({
      keyFile: CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const authClient = await auth.getClient();
    // Приводим к правильному типу для совместимости с googleapis
    return google.sheets({ version: 'v4', auth: authClient as any });
  } catch (error) {
    console.error('[Google] Ошибка аутентификации:', error);
    throw new Error(`Не удалось аутентифицироваться с Google API. Проверьте файл ${CREDENTIALS_PATH}`);
  }
}

// Кеш для клиента Google Sheets (создаем один раз)
let sheetsClientCache: any = null;

// Получаем кешированный клиент
async function getCachedSheetsClient() {
  if (!sheetsClientCache) {
    sheetsClientCache = await getSheetsClient();
  }
  return sheetsClientCache;
}

// Функция для загрузки данных с листа
export async function fetchSheetData(spreadsheetId: string, sheetName: string): Promise<any[][]> {
  try {
    const sheets = await getCachedSheetsClient();
    console.log(`[Google] Загрузка данных с листа: "${sheetName}"...`);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName, // Загружаем весь лист
    });

    const values = response.data.values;
    if (!values || values.length === 0) {
      throw new Error(`Лист "${sheetName}" пуст или не найден.`);
    }

    console.log(`[Google] Загружено ${values.length - 1} строк данных.`);
    return values;
  } catch (error) {
    console.error(`[Google] Ошибка при загрузке листа "${sheetName}":`, error);
    throw error;
  }
}

// Новая функция для параллельной загрузки всех листов
export async function fetchAllSheetsData(spreadsheetId: string, sheetNames: string[]): Promise<Record<string, any[][]>> {
  try {
    const sheets = await getCachedSheetsClient();
    console.log(`[Google] Параллельная загрузка ${sheetNames.length} листов...`);
    
    // Создаем массив промисов для параллельного выполнения
    const promises = sheetNames.map(async (sheetName) => {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: sheetName,
        });

        const values = response.data.values;
        if (!values || values.length === 0) {
          throw new Error(`Лист "${sheetName}" пуст или не найден.`);
        }

        console.log(`[Google] ✅ Загружен лист "${sheetName}": ${values.length - 1} строк`);
        return { sheetName, data: values };
      } catch (error) {
        console.error(`[Google] ❌ Ошибка при загрузке листа "${sheetName}":`, error);
        throw error;
      }
    });

    // Ждем завершения всех загрузок
    const results = await Promise.all(promises);
    
    // Преобразуем в объект для удобства
    const dataMap: Record<string, any[][]> = {};
    results.forEach(({ sheetName, data }) => {
      dataMap[sheetName] = data;
    });

    console.log(`[Google] 🎉 Все ${sheetNames.length} листов загружены параллельно!`);
    return dataMap;
  } catch (error) {
    console.error('[Google] Критическая ошибка при параллельной загрузке:', error);
    throw error;
  }
}

// Функция для проверки доступности таблицы
export async function validateSpreadsheet(spreadsheetId: string): Promise<boolean> {
  try {
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    
    console.log(`[Google] Таблица найдена: "${response.data.properties?.title}"`);
    return true;
  } catch (error) {
    console.error('[Google] Ошибка доступа к таблице:', error);
    return false;
  }
}

