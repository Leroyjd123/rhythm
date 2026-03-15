import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getLocalDateString, ensureDailyStatsReset, DEFAULT_SCHEMA } from '../src/shared/storage.js';

describe('getLocalDateString', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    const result = getLocalDateString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('matches today\'s date', () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    expect(getLocalDateString()).toBe(`${year}-${month}-${day}`);
  });
});

describe('ensureDailyStatsReset', () => {
  let storage;
  const today = getLocalDateString();
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  beforeEach(() => {
    storage = {
      stats: {
        water: { todayCount: 5, lastResetDate: yesterday },
        posture: { todayCount: 3, lastResetDate: today }
      }
    };
  });

  it('resets counters when lastResetDate differs from today', () => {
    ensureDailyStatsReset(storage);
    expect(storage.stats.water.todayCount).toBe(0);
    expect(storage.stats.water.lastResetDate).toBe(today);
  });

  it('does NOT reset counters when lastResetDate is already today', () => {
    ensureDailyStatsReset(storage);
    expect(storage.stats.posture.todayCount).toBe(3);
  });

  it('returns true when at least one stat was reset', () => {
    const result = ensureDailyStatsReset(storage);
    expect(result).toBe(true);
  });

  it('returns false when all stats are already reset for today', () => {
    storage.stats.water.lastResetDate = today;
    storage.stats.water.todayCount = 0;
    const result = ensureDailyStatsReset(storage);
    expect(result).toBe(false);
  });

  it('handles null or missing storage gracefully', () => {
    expect(ensureDailyStatsReset(null)).toBe(false);
    expect(ensureDailyStatsReset({})).toBe(false);
  });
});

describe('DEFAULT_SCHEMA', () => {
  it('has all required top-level keys', () => {
    expect(DEFAULT_SCHEMA).toHaveProperty('settings');
    expect(DEFAULT_SCHEMA).toHaveProperty('reminders');
    expect(DEFAULT_SCHEMA).toHaveProperty('stats');
    expect(DEFAULT_SCHEMA).toHaveProperty('notes');
    expect(DEFAULT_SCHEMA).toHaveProperty('logs');
  });

  it('has soundEnabled in settings', () => {
    expect(DEFAULT_SCHEMA.settings).toHaveProperty('soundEnabled');
  });

  it('has 10 reminders defined', () => {
    expect(Object.keys(DEFAULT_SCHEMA.reminders)).toHaveLength(10);
  });
});
