import { ActivityClock } from './activity-clock';

describe('Đồng hồ hoạt động', () => {
  it('counts elapsed wall time even when the browser pauses callbacks', () => {
    const c = new ActivityClock(); c.reset(2); c.start(1000);
    expect(c.seconds(61000)).toBe(60);
    expect(c.seconds(121000)).toBe(0);
    expect(c.running).toBe(false);
  });
  it('pause freezes remaining time and resume does not lose it', () => {
    const c = new ActivityClock(); c.reset(1); c.start(0); c.pause(15000);
    expect(c.seconds(999999)).toBe(45);
    c.start(1000000); expect(c.seconds(1010000)).toBe(35);
    c.reset(2); expect(c.seconds(2000000)).toBe(120);
    expect(c.running).toBe(false);
  });
  it('does not start an unspecified or completed timer', () => {
    const c = new ActivityClock(); c.reset(null); c.start(0);
    expect(c.running).toBe(false); expect(c.seconds(0)).toBe(0);
  });
});
