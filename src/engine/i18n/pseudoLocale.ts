import type { TranslationDictionary } from './types';

const CHAR_MAP: Record<string, string> = {
  a: 'á', b: 'ƀ', c: 'ç', d: 'ð', e: 'é', f: 'ƒ', g: 'ğ', h: 'ĥ',
  i: 'í', j: 'ĵ', k: 'ķ', l: 'ĺ', m: 'ṁ', n: 'ñ', o: 'ó', p: 'ṗ',
  q: 'q', r: 'ŕ', s: 'ṡ', t: 'ẗ', u: 'ú', v: 'ṽ', w: 'ŵ', x: 'ẋ',
  y: 'ý', z: 'ż',
  A: 'Á', B: 'Ɓ', C: 'Ç', D: 'Ð', E: 'É', F: 'Ƒ', G: 'Ğ', H: 'Ĥ',
  I: 'Í', J: 'Ĵ', K: 'Ķ', L: 'Ĺ', M: 'Ṁ', N: 'Ñ', O: 'Ó', P: 'Ṗ',
  Q: 'Q', R: 'Ŕ', S: 'Ṡ', T: 'T̈', U: 'Ú', V: 'Ṽ', W: 'Ŵ', X: 'Ẋ',
  Y: 'Ý', Z: 'Ż',
};

function accentChar(ch: string): string {
  return CHAR_MAP[ch] ?? ch;
}

function accentString(value: string): string {
  let result = '';
  let i = 0;
  while (i < value.length) {
    if (value[i] === '[') {
      const closeBracket = value.indexOf(']', i);
      if (closeBracket !== -1) {
        const inner = value.substring(i + 1, closeBracket);
        // Preserve interpolation tokens: [param] or [param|form1|form2]
        if (/^[a-zA-Z0-9_]+(\|[^[\]]*)*$/.test(inner)) {
          result += value.substring(i, closeBracket + 1);
          i = closeBracket + 1;
          continue;
        }
      }
    }
    result += accentChar(value[i]);
    i++;
  }
  return result;
}

function padString(value: string): string {
  const padLength = Math.ceil(value.length * 0.4);
  return value + '~'.repeat(padLength);
}

export function generatePseudoDictionary(source: TranslationDictionary): TranslationDictionary {
  const result: TranslationDictionary = {};
  for (const [key, value] of Object.entries(source)) {
    result[key] = `[${padString(accentString(value))}]`;
  }
  return result;
}
