import { atom } from 'nanostores';
import { logger } from '@/engine/logging';
import type { LogRecord } from '@/engine/logging';

export type RemoteDebugStatus = 'disconnected' | 'connecting' | 'connected';

interface MessageEnvelope<K extends string = string, P = unknown> {
  v: number;
  sid: string;
  seq: number;
  t_client: number;
  t_server?: number;
  kind: K;
  prio: 0 | 1 | 2;
  id?: string;
  causationId?: string;
  correlationId?: string;
  payload: P;
}

/**
 * Handles WebSocket connection to local debug dashboard and
 * forwards telemetry from the game.
 */
export class RemoteDebugService {
  private ws: WebSocket | null = null;
  private readonly queue: MessageEnvelope[] = [];
  private readonly maxQueue = 512;
  private queueHead = 0;
  private sessionId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  private sequenceNumber = 0;
  private heartbeatInterval: number | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectTimeout: number | null = null;
  private lastConnectionUrl: string | null = null;
  readonly status = atom<RemoteDebugStatus>('disconnected');

  connect(url: string): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.lastConnectionUrl = url;
    this.status.set('connecting');
    
    try {
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.addEventListener('open', () => {
        this.status.set('connected');
        this.reconnectAttempts = 0; // Reset on successful connection
        this.initializeSession();
        this.startHeartbeat();
        this.flush();
        logger.info('Remote debug connected', { url, source: 'game' });
      });

      ws.addEventListener('message', (event) => {
        try {
          const envelope: MessageEnvelope = JSON.parse(event.data);
          this.handleServerMessage(envelope);
        } catch (error) {
          logger.error('Failed to parse server message:', error as Error, { source: 'game' });
        }
      });

      ws.addEventListener('error', (error) => {
        logger.warn('WebSocket connection error:', { error, url, source: 'game' });
        this.scheduleReconnect();
      });

      ws.addEventListener('close', (event) => {
        this.status.set('disconnected');
        this.ws = null;
        this.stopHeartbeat();
        
        // Only attempt reconnect if it wasn't a manual close
        if (event.code !== 1000) {
          this.scheduleReconnect();
        }
      });
    } catch (error) {
      logger.warn('Failed to create WebSocket connection:', { error, url, source: 'game' });
      this.scheduleReconnect();
    }
  }

  private initializeSession(): void {
    const envelope: MessageEnvelope<'init', any> = {
      v: 1,
      sid: this.sessionId,
      seq: this.getNextSeq(),
      t_client: performance.now(),
      kind: 'init',
      prio: 0,
      payload: {
        deviceInfo: {
          userAgent: navigator.userAgent,
          screenSize: { width: screen.width, height: screen.height },
          platform: navigator.platform,
          gameVersion: '1.0.0' // TODO: get from package.json
        }
      }
    };
    this.send(envelope);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      const envelope: MessageEnvelope<'hb', any> = {
        v: 1,
        sid: this.sessionId,
        seq: this.getNextSeq(),
        t_client: performance.now(),
        kind: 'hb',
        prio: 0,
        payload: { timestamp: Date.now() }
      };
      this.send(envelope);
    }, 5000); // Every 5 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.warn('Max reconnection attempts reached, giving up', { 
        attempts: this.reconnectAttempts, 
        source: 'game' 
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000); // Exponential backoff, max 30s
    
    logger.info('Scheduling reconnection attempt', { 
      attempt: this.reconnectAttempts, 
      delay, 
      source: 'game' 
    });

    this.reconnectTimeout = window.setTimeout(() => {
      if (this.lastConnectionUrl) {
        this.connect(this.lastConnectionUrl);
      }
    }, delay);
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    this.status.set('disconnected');
    this.reconnectAttempts = 0;
  }

  private getNextSeq(): number {
    return ++this.sequenceNumber;
  }

  private handleServerMessage(envelope: MessageEnvelope): void {
    switch (envelope.kind) {
      case 'ack':
        // Server acknowledged our message
        break;
      case 'cmd':
        // Server sent a command - handle it
        this.handleCommand(envelope.payload as any);
        break;
    }
  }

  private handleCommand(command: any): void {
    // TODO: Implement command handling
    logger.info('Received command:', { command, source: 'game' });
  }

  sendLog(record: LogRecord): void {
    const prio = this.levelToPrio(record.level);
    const envelope: MessageEnvelope<'log', LogRecord> = {
      v: 1,
      sid: this.sessionId,
      seq: this.getNextSeq(),
      t_client: performance.now(),
      kind: 'log',
      prio,
      payload: record,
    };
    this.send(envelope);
  }


  private send(envelope: MessageEnvelope): void {
    if (this.ws && this.status.get() === 'connected') {
      this.ws.send(JSON.stringify(envelope));
      return;
    }

    if (this.getPendingQueueLength() >= this.maxQueue) {
      let worstIndex = this.queueHead;
      for (let i = this.queueHead + 1; i < this.queue.length; i++) {
        if (this.queue[i].prio > this.queue[worstIndex].prio) {
          worstIndex = i;
        }
      }
      if (this.queue[worstIndex].prio > envelope.prio) {
        this.queue.splice(worstIndex, 1);
      } else {
        return; // drop incoming low-priority message
      }
    }

    this.queue.push(envelope);
  }

  private getPendingQueueLength(): number {
    return this.queue.length - this.queueHead;
  }

  private levelToPrio(level: LogRecord['level']): 0 | 1 | 2 {
    switch (level) {
      case 'fatal':
      case 'error':
        return 0;
      case 'warn':
      case 'info':
        return 1;
      default:
        return 2;
    }
  }

  private flush(): void {
    if (!this.ws || this.status.get() !== 'connected') {
      return;
    }

    while (this.queueHead < this.queue.length) {
      const socket = this.ws;
      if (!socket || this.status.get() !== 'connected') {
        break;
      }

      const item = this.queue[this.queueHead++];
      if (item) {
        socket.send(JSON.stringify(item));
      }
    }

    if (this.queueHead >= this.queue.length) {
      this.queue.length = 0;
      this.queueHead = 0;
    }
  }
}

export const remoteDebugService = new RemoteDebugService();
