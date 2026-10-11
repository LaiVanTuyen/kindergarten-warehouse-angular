/** Absolute deadlines keep time correct when a browser suspends background timers. */
export class ActivityClock {
  private deadline = 0;
  private remaining = 0;
  running = false;
  reset(minutes: number | null | undefined): void {
    this.running = false;
    this.remaining = Math.max(0, Number(minutes) || 0) * 60000;
  }
  start(now: number): void {
    if (this.running || this.remaining <= 0) return;
    this.deadline = now + this.remaining;
    this.running = true;
  }
  pause(now: number): void {
    this.remaining = this.milliseconds(now);
    this.running = false;
  }
  seconds(now: number): number {
    const value = Math.ceil(this.milliseconds(now) / 1000);
    if (!value) { this.remaining = 0; this.running = false; }
    return value;
  }
  private milliseconds(now: number): number {
    return this.running ? Math.max(0, this.deadline - now) : this.remaining;
  }
}
