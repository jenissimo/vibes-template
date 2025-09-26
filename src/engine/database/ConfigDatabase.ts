import { Database } from './Database';

export type DeriveFn<T, K> = (merged: T, id: K) => Partial<T> | void;
export type ValidateFn<T, K> = (merged: T, id: K) => void;

type Options<T, K extends string | number> = {
  base: Record<K, T>;                       // кодоген
  overrides?: Record<K, Partial<T>>;        // локальные правки
  getId?: (baseVal: T, key: K) => K;        // если нужен id из объекта
  derive?: DeriveFn<T, K>;                  // расчёт производных полей
  validate?: ValidateFn<T, K>;              // лёгкая валидация
};

export class ConfigDatabase<T extends object, K extends string | number = string>
  extends Database<K, T> {
  constructor(private options: Options<T, K>) {
    super();
    this.reload();
  }

  setOverride(id: K, patch: Partial<T>): void {
    const o = (this.options.overrides ??= {} as Record<K, Partial<T>>);
    o[id] = { ...(o[id] ?? {}), ...patch };
    this.reload();
  }

  reload(): void {
    this.map.clear();

    const { base, overrides = {} as Record<K, Partial<T>>, getId, derive, validate } = this.options;
    const entries = Object.entries(base) as unknown as [K, T][];
    
    for (const [key, baseVal] of entries) {
      const id = (getId ? getId(baseVal, key) : key) as K;

      // 1) merge base + overrides
      const merged = { ...baseVal, ...(overrides[id] ?? {}) } as T;

      // 2) derive (опционально)
      const d = derive?.(merged, id);
      if (d) Object.assign(merged, d);

      // 3) validate (опционально)
      validate?.(merged, id);

      this.set(id, merged);
    }
  }
}
