import type { LogSink, LogRecord } from '../types';

export class RingBufferSink implements LogSink {
  private buffer: LogRecord[];
  private head = 0;
  private isFull = false;

  constructor(private capacity: number = 1000) {
    this.buffer = new Array(capacity);
  }

  write(batch: LogRecord[]): void {
    for (const record of batch) {
      this.buffer[this.head] = record;
      this.head = (this.head + 1) % this.capacity;
      if (this.head === 0) {
        this.isFull = true;
      }
    }
  }
  
  /** Returns a snapshot of records in chronological order. */
  getRecent(count: number): LogRecord[] {
    const records: LogRecord[] = [];
    const limit = Math.min(count, this.capacity);
    const start = this.isFull ? this.head : 0;
    const currentSize = this.isFull ? this.capacity : this.head;

    for (let i = 0; i < Math.min(limit, currentSize); i++) {
        const index = (start + i) % this.capacity;
        records.push(this.buffer[index]);
    }
    return records;
  }

  async flush(): Promise<void> {
    // Ring buffer doesn't need flushing
  }

  async destroy(): Promise<void> {
    this.buffer = [];
    this.head = 0;
    this.isFull = false;
  }
}
