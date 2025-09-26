type Disposable = { dispose: () => void } | { destroy: () => void } | { teardown: () => void };

const runDispose = (service: unknown) => {
  if (!service) return;
  const candidate = service as Partial<Disposable>;
  if (typeof (candidate as { dispose?: () => void }).dispose === 'function') {
    (candidate as { dispose: () => void }).dispose();
    return;
  }
  if (typeof (candidate as { destroy?: () => void }).destroy === 'function') {
    (candidate as { destroy: () => void }).destroy();
    return;
  }
  if (typeof (candidate as { teardown?: () => void }).teardown === 'function') {
    (candidate as { teardown: () => void }).teardown();
  }
};

export class ServiceRegistry {
  private static services = new Map<string, unknown>();

  static register<T>(key: string, service: T, options: { replace?: boolean } = {}): void {
    const already = this.services.get(key);
    if (already && !options.replace) {
      throw new Error(`Service already registered: ${key}`);
    }

    if (already) {
      runDispose(already);
    }

    this.services.set(key, service);
  }

  static get<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service not found: ${key}`);
    }
    return service as T;
  }

  static has(key: string): boolean {
    return this.services.has(key);
  }

  static unregister(key: string): void {
    const service = this.services.get(key);
    if (!service) return;
    runDispose(service);
    this.services.delete(key);
  }

  static clear(): void {
    for (const [, service] of this.services) {
      runDispose(service);
    }
    this.services.clear();
  }
}

export const enum ServiceKeys {
  PixiApp = 'pixiApp',
  PixiRenderer = 'pixiRenderer',
  BackgroundContainer = 'backgroundContainer',
  GameContainer = 'gameContainer',
  UIContainer = 'uiContainer',
  RenderSystem = 'renderSystem',
  InputManager = 'inputManager',
  RemoteDebug = 'remoteDebug',
  AssetLoader = 'assetLoader',
  AssetManager = 'assetManager',
}
