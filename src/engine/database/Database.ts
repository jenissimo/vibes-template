/**
 * Базовый класс для работы с данными в рантайме
 * Предоставляет простой Map-based интерфейс с readonly значениями
 */
export abstract class Database<K, V> {
  protected map = new Map<K, Readonly<V>>();

  get(id: K): Readonly<V> | undefined {
    return this.map.get(id);
  }

  has(id: K): boolean {
    return this.map.has(id);
  }

  all(): Readonly<V>[] {
    return Array.from(this.map.values());
  }

  ids(): K[] {
    return Array.from(this.map.keys());
  }

  size(): number {
    return this.map.size;
  }

  protected set(id: K, value: V): void {
    this.map.set(id, Object.freeze(value));
  }

  abstract reload(): void;
}
