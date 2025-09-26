/**
 * TypeScript code generation
 * Генерация TypeScript кода и типов
 */

import fs from 'fs';
import path from 'path';
import { SheetImportConfig } from './config';

// Вспомогательная функция для преобразования 'some_name' в 'SomeName'
function toPascalCase(str: string): string {
  return str.split(/[-_]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

// Функция для создания валидных имен полей TypeScript
function toValidFieldName(str: string): string {
  // Заменяем пробелы и специальные символы на подчеркивания
  let validName = str
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  // Если имя начинается с цифры, добавляем префикс
  if (/^[0-9]/.test(validName)) {
    validName = 'field_' + validName;
  }
  
  // Если имя пустое, используем fallback
  if (!validName) {
    validName = 'unknown_field';
  }
  
  return validName;
}

// Определяет TypeScript тип для значения
function inferTsType(value: unknown): string {
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (value === null) return 'any | null';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'any[]';
    const elementType = inferTsType(value[0]);
    return `${elementType}[]`;
  }
  if (typeof value === 'object' && value !== null) {
    return 'Record<string, any>';
  }
  return 'any';
}

// Определяет TypeScript тип для поля на основе всех значений в данных
function inferFieldType(fieldName: string, allData: Record<string, any>[]): string {
  const allValues = allData.map(item => item[fieldName]);
  const nonNullValues = allValues.filter(v => v !== undefined && v !== null);
  const hasNull = allValues.some(v => v === null);
  
  if (nonNullValues.length === 0) return 'any';
  
  const types = new Set(nonNullValues.map(v => typeof v));
  
  let baseType = 'any';
  
  // Если все значения одного типа
  if (types.size === 1) {
    const type = Array.from(types)[0];
    if (type === 'string') baseType = 'string';
    else if (type === 'number') baseType = 'number';
    else if (type === 'boolean') baseType = 'boolean';
    else if (type === 'object') baseType = 'Record<string, any>';
  }
  // Если смешанные типы - создаем union
  else if (types.has('string') && types.has('number')) {
    baseType = 'string | number';
  }
  else if (types.has('string') && types.has('boolean')) {
    baseType = 'string | boolean';
  }
  else if (types.has('number') && types.has('boolean')) {
    baseType = 'number | boolean';
  }
  else if (types.has('string') && types.has('number') && types.has('boolean')) {
    baseType = 'string | number | boolean';
  }
  
  // Добавляем null, если есть null значения
  if (hasNull) {
    baseType += ' | null';
  }
  
  return baseType;
}

// Генерирует .ts файл с типами и данными
export function generateTsFile(
  config: SheetImportConfig,
  data: Record<string, any>[],
  outputDir: string
) {
  if (data.length === 0) {
    console.warn(`[Generator] Нет данных для генерации файла ${config.outputFile}.ts`);
    return;
  }

  const interfaceName = config.typeName;
  const firstItem = data[0];
  
  // 1. Генерируем интерфейс на основе всех данных
  const interfaceFields = Object.keys(firstItem)
    .map(key => {
      const tsType = inferFieldType(key, data);
      const validKey = toValidFieldName(key);
      return `  ${validKey}: ${tsType};`;
    })
    .join('\n');
  
  // Добавляем configType в интерфейс (используем правильный enum тип)
  const enumValue = config.configType.replace('ConfigType.', '');
  const configTypeField = `  configType: ConfigType.${enumValue};`;
  const allFields = `${interfaceFields}\n${configTypeField}`;
  
  const interfaceString = `export interface ${interfaceName} {\n${allFields}\n}`;

  // 2. Преобразуем имена полей в валидные и добавляем configType
  const dataWithConfigType = data.map(item => {
    const transformedItem: Record<string, any> = {};
    Object.keys(item).forEach(key => {
      const validKey = toValidFieldName(key);
      transformedItem[validKey] = item[key];
    });
    transformedItem.configType = `ConfigType.${enumValue}`;
    return transformedItem;
  });

  // 3. Генерируем константу с данными
  let dataString: string;
  if (config.primaryKey) {
    // Создаем индексированный объект
    const validPrimaryKey = toValidFieldName(config.primaryKey);
    const indexedData = dataWithConfigType.reduce((acc, item) => {
      const key = (item as any)[validPrimaryKey];
      if (key) {
        acc[key] = item;
      }
      return acc;
    }, {} as Record<string, any>);
    
    // Заменяем строковые enum значения на реальные enum значения
    const jsonString = JSON.stringify(indexedData, null, 2);
    const correctedJsonString = jsonString.replace(/"ConfigType\.(\w+)"/g, 'ConfigType.$1');
    dataString = `export const ${config.outputFile}Data: Record<string, ${interfaceName}> = ${correctedJsonString};`;
  } else {
    // Создаем массив объектов
    const jsonString = JSON.stringify(dataWithConfigType, null, 2);
    const correctedJsonString = jsonString.replace(/"ConfigType\.(\w+)"/g, 'ConfigType.$1');
    dataString = `export const ${config.outputFile}Data: ${interfaceName}[] = ${correctedJsonString};`;
  }
  
  // 3. Генерируем хелперы для доступа к данным
  let helperFunctions = '';
  if (config.primaryKey) {
    helperFunctions = `
/**
 * Get ${config.typeName} by ${config.primaryKey}
 */
export function get${toPascalCase(config.outputFile)}(id: string): ${interfaceName} | undefined {
  return ${config.outputFile}Data[id];
}

/**
 * Get all ${config.typeName} entries
 */
export function getAll${toPascalCase(config.outputFile)}(): ${interfaceName}[] {
  return Object.values(${config.outputFile}Data);
}

/**
 * Check if ${config.typeName} exists
 */
export function has${toPascalCase(config.outputFile)}(id: string): boolean {
  return id in ${config.outputFile}Data;
}`;
  } else {
    helperFunctions = `
/**
 * Get all ${config.typeName} entries
 */
export function getAll${toPascalCase(config.outputFile)}(): ${interfaceName}[] {
  return ${config.outputFile}Data;
}`;
  }

  // 3.5 Сахар для ключей (в том же файле), только для constants
  let keySugar = '';
  if (config.primaryKey && config.outputFile === 'constants') {
    // Собираем список ключей для K/ConstantKey
    let keysForMap: string[] = [];
    if (config.primaryKey) {
      // Если мы строили indexedData — используем его ключи, иначе из исходного массива
      try {
        // indexedData есть только в ветке с primaryKey; обернём в try на случай изменений выше
        // @ts-ignore
        keysForMap = Object.keys(indexedData);
      } catch {
        keysForMap = data
          .map((item) => String((item as any)[config.primaryKey!]))
          .filter(Boolean);
      }
    }

    // Утилиты для красивых имён полей (PascalCase) и валидных идентификаторов
    const RESERVED = new Set(['default', 'class', 'function', 'var', 'let', 'const', 'enum', 'export', 'import']);
    const toPascalCaseLocal = (s: string) =>
      s.split(/[^a-zA-Z0-9]+/).filter(Boolean).map(p => p[0].toUpperCase() + p.slice(1)).join('');
    const makeIdent = (s: string) => {
      let id = toPascalCaseLocal(s);
      if (!id) id = 'Key';
      if (/^[0-9]/.test(id)) id = '_' + id;
      if (RESERVED.has(id)) id = id + '_';
      return id;
    };

    // Защита от коллизий («SpawnRatePerSec» и «spawn_rate_per_sec» дадут одно имя)
    const seen = new Set<string>();
    const entries = keysForMap.map((k) => {
      let name = makeIdent(k);
      let i = 2;
      while (seen.has(name)) { name = `${name}${i++}`; }
      seen.add(name);
      return `  ${name}: '${k}',`;
    }).join('\n');

    // Сам сахар: тип и объект K
    keySugar = `

/** Typed union of keys for IDE autocomplete */
export type ${interfaceName}Key = keyof typeof ${config.outputFile}Data;

/** Readable key map (PascalCase → real key) for safer usage */
export const K = {
${entries}
} as const;

/** Alias for convenience in consumers */
export type ConstantKey = typeof K[keyof typeof K];
`;
  }
  
  const fileContent = `/**
   * ${config.description}
   * 
   * This file is auto-generated by the balance importer.
   * Do not edit manually - changes will be overwritten.
   * 
   * Generated at: ${new Date().toISOString()}
   */

import { ConfigType } from './ConfigType';

${interfaceString}

${dataString}
${helperFunctions}
${keySugar}
`;
  
  const filePath = path.join(process.cwd(), outputDir, `${config.outputFile}.ts`);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, fileContent);
  
  console.log(`[Generator] Сгенерирован файл: ${filePath}`);
}

// Генерирует индексный файл для экспорта всех конфигов
export function generateIndexFile(outputDir: string, configs: SheetImportConfig[]) {
  const exports = configs.map(config => {
    return `export * from './${config.outputFile}';`;
  }).join('\n');

  const fileContent = `/**
 * Generated game configuration exports
 * 
 * This file is auto-generated by the balance importer.
 * Do not edit manually - changes will be overwritten.
 * 
 * Generated at: ${new Date().toISOString()}
 */

${exports}
`;

  const filePath = path.join(process.cwd(), outputDir, 'index.ts');
  fs.writeFileSync(filePath, fileContent);
  
  console.log(`[Generator] Сгенерирован индексный файл: ${filePath}`);
}

// Генерирует ConfigType enum
export function generateConfigType(outputDir: string, configs: SheetImportConfig[]) {
  const enumValues = configs.map(config => {
    const enumName = config.configType.replace('ConfigType.', '');
    const enumValue = config.configType.replace('ConfigType.', '');
    return `  ${enumName} = '${enumValue}',`;
  }).join('\n');

  const fileContent = `/**
 * Game Configuration Types
 * Автоматически генерируется balance-importer
 * 
 * Этот файл автоматически генерируется на основе конфигурации balance-importer.
 * Не редактируйте вручную - изменения будут перезаписаны.
 * 
 * Generated at: ${new Date().toISOString()}
 */

export enum ConfigType {
${enumValues}
}
`;

  const filePath = path.join(process.cwd(), outputDir, 'ConfigType.ts');
  fs.writeFileSync(filePath, fileContent);
  
  console.log(`[Generator] Сгенерирован ConfigType: ${filePath}`);
}

// Генерирует README с документацией
export function generateReadme(outputDir: string, configs: SheetImportConfig[]) {
  const configsList = configs.map(config => {
    return `- **${config.outputFile}** (${config.typeName}): ${config.description}`;
  }).join('\n');

  const fileContent = `# Generated Game Configuration

This directory contains auto-generated game configuration files imported from Google Sheets.

## Files

${configsList}

## Usage

\`\`\`typescript
import { resourcesData, getResource } from './generated';

// Access data
const coinResource = getResource('coins');
const allResources = getAllResources();
\`\`\`

## Regeneration

To regenerate these files, run:

\`\`\`bash
npm run import-balance
\`\`\`

**⚠️ Warning**: Do not edit these files manually - changes will be overwritten on next import.

Generated at: ${new Date().toISOString()}
`;

  const filePath = path.join(process.cwd(), outputDir, 'README.md');
  fs.writeFileSync(filePath, fileContent);
  
  console.log(`[Generator] Сгенерирован README: ${filePath}`);
}

