type EventCallback = (...args: any[]) => void;

class GameEventBus {
  private listeners = new Map<string, Set<{ cb: EventCallback; ctx?: any }>>();
  private gameInstance: { destroy?: () => void } | null = null;

  setGameInstance(game: { destroy?: () => void } | null) {
    this.gameInstance = game;
  }

  getGameInstance() {
    return this.gameInstance;
  }

  emit(event: string, ...args: any[]) {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const { cb, ctx } of [...set]) {
      cb.apply(ctx, args);
    }
  }

  on(event: string, callback: EventCallback, context?: any) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add({ cb: callback, ctx: context });
  }

  once(event: string, callback: EventCallback, context?: any) {
    const wrap: EventCallback = (...args) => {
      this.off(event, wrap);
      callback.apply(context, args);
    };
    this.on(event, wrap);
  }

  off(event: string, callback?: EventCallback, _context?: any) {
    const set = this.listeners.get(event);
    if (!set) return;
    if (!callback) {
      set.clear();
      return;
    }
    for (const entry of [...set]) {
      if (entry.cb === callback) set.delete(entry);
    }
  }
}

export const EventBus = new GameEventBus();
