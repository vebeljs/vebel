export class SyntheticEvent<T extends EventTarget = EventTarget> {
  public readonly nativeEvent: Event;
  public readonly type: string;
  public readonly target: T;
  public currentTarget: T | null = null;

  private _propagationStopped = false;
  private _defaultPrevented = false;

  constructor(nativeEvent: Event) {
    this.nativeEvent = nativeEvent;
    this.type = nativeEvent.type;
    this.target = nativeEvent.target as T;
  }

  stopPropagation(): void {
    this._propagationStopped = true;
    this.nativeEvent.stopPropagation();
  }

  preventDefault(): void {
    this._defaultPrevented = true;
    this.nativeEvent.preventDefault();
  }

  get propagationStopped(): boolean {
    return this._propagationStopped;
  }

  get defaultPrevented(): boolean {
    return this._defaultPrevented;
  }
}
