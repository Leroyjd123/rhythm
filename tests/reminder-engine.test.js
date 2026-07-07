import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateNextFixedTimestamp, handleAlarm } from '../src/background/reminder-engine.js';

describe('calculateNextFixedTimestamp', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a timestamp in the future', () => {
    const now = Date.now();
    // Use a time far enough in the future today (23:59) - if it's already past, it will be tomorrow
    const result = calculateNextFixedTimestamp('23:59', []);
    expect(result).toBeGreaterThan(now);
  });

  it('schedules for tomorrow when the specified time has already passed today', () => {
    // Pin "now" to 14:00 on a Monday (day 1)
    const fakeNow = new Date();
    fakeNow.setHours(14, 0, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(fakeNow);

    // 09:00 has already passed today
    const result = calculateNextFixedTimestamp('09:00', []);
    const resultDate = new Date(result);

    const tomorrow = new Date(fakeNow);
    tomorrow.setDate(tomorrow.getDate() + 1);

    expect(resultDate.getDate()).toBe(tomorrow.getDate());
    expect(resultDate.getHours()).toBe(9);
    expect(resultDate.getMinutes()).toBe(0);
  });

  it('schedules for today when the specified time is still in the future', () => {
    const fakeNow = new Date();
    fakeNow.setHours(8, 0, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(fakeNow);

    const result = calculateNextFixedTimestamp('09:00', []);
    const resultDate = new Date(result);

    expect(resultDate.getDate()).toBe(fakeNow.getDate());
    expect(resultDate.getHours()).toBe(9);
  });

  it('skips to the next valid workday when workdays are specified', () => {
    // Pin to Sunday (day 0) at 10:00 — workdays only Mon-Fri [1,2,3,4,5]
    const fakeNow = new Date();
    // Set to next Sunday
    const daysUntilSunday = (7 - fakeNow.getDay()) % 7 || 7;
    fakeNow.setDate(fakeNow.getDate() + daysUntilSunday);
    fakeNow.setHours(10, 0, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(fakeNow);

    const result = calculateNextFixedTimestamp('09:00', [1, 2, 3, 4, 5]);
    const resultDate = new Date(result);

    // Should land on Monday (day 1)
    expect(resultDate.getDay()).toBe(1);
  });

  it('works correctly with no workdays array (fires any day)', () => {
    const fakeNow = new Date();
    fakeNow.setHours(8, 0, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(fakeNow);

    const result = calculateNextFixedTimestamp('09:00', null);
    expect(result).toBeGreaterThan(Date.now());
  });

  it('works correctly with empty workdays array (fires any day)', () => {
    const fakeNow = new Date();
    fakeNow.setHours(8, 0, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(fakeNow);

    const result = calculateNextFixedTimestamp('09:00', []);
    expect(result).toBeGreaterThan(Date.now());
  });
});

describe('handleAlarm — fixed-time rescheduling', () => {
  let createdAlarms;
  let originalGet;
  let originalCreate;

  const makeStorage = (settingsOverrides = {}) => ({
    settings: { masterEnabled: true, focusUntil: null, soundEnabled: false, ...settingsOverrides },
    reminders: {
      workStart: {
        id: 'workStart',
        enabled: true,
        type: 'fixedTime',
        timeOfDay: '09:00',
        workdays: [0, 1, 2, 3, 4, 5, 6]
      }
    },
    stats: {},
    logs: []
  });

  beforeEach(() => {
    createdAlarms = [];
    originalGet = chrome.storage.local.get;
    originalCreate = chrome.alarms.create;
    chrome.alarms.create = async (name, info) => {
      createdAlarms.push({ name, info });
    };
  });

  afterEach(() => {
    chrome.storage.local.get = originalGet;
    chrome.alarms.create = originalCreate;
  });

  it('reschedules the next occurrence even when suppressed by Focus Mode', async () => {
    const data = makeStorage({ focusUntil: Date.now() + 60 * 60 * 1000 });
    chrome.storage.local.get = async () => ({ rhythmData: data });

    await handleAlarm({ name: 'workStart' });

    const rescheduled = createdAlarms.find(a => a.name === 'workStart');
    expect(rescheduled).toBeDefined();
    expect(rescheduled.info.when).toBeGreaterThan(Date.now());
  });

  it('reschedules the next occurrence on a normal trigger', async () => {
    const data = makeStorage();
    chrome.storage.local.get = async () => ({ rhythmData: data });

    await handleAlarm({ name: 'workStart' });

    const rescheduled = createdAlarms.find(a => a.name === 'workStart');
    expect(rescheduled).toBeDefined();
    expect(rescheduled.info.when).toBeGreaterThan(Date.now());
  });

  it('does not reschedule a disabled reminder', async () => {
    const data = makeStorage();
    data.reminders.workStart.enabled = false;
    chrome.storage.local.get = async () => ({ rhythmData: data });

    await handleAlarm({ name: 'workStart' });

    expect(createdAlarms.find(a => a.name === 'workStart')).toBeUndefined();
  });
});
