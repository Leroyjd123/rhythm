export const DEFAULT_SCHEMA = {
  schemaVersion: 1,
  settings: {
    theme: 'light',
    focusUntil: null,
    timezone: 'auto',
    masterEnabled: true,
    soundEnabled: true,
    advancedOpen: false,
    notesOpen: true,
    wellbeingOpen: true,
    workScheduleOpen: true
  },
  reminders: {
    water: {
      id: 'water',
      enabled: false,
      type: 'interval',
      intervalMinutes: 15,
      metadata: { dailyTarget: 8, unit: 'glasses', soundEnabled: true },
      lastTriggered: null
    },
    posture: {
      id: 'posture',
      enabled: false,
      type: 'interval',
      intervalMinutes: 30,
      metadata: { soundEnabled: true },
      lastTriggered: null
    },
    break: {
      id: 'break',
      enabled: false,
      type: 'interval',
      intervalMinutes: 60,
      metadata: { soundEnabled: true },
      lastTriggered: null
    },
    eye: {
      id: 'eye',
      enabled: false,
      type: 'interval',
      intervalMinutes: 20,
      metadata: { soundEnabled: true },
      lastTriggered: null
    },
    stand: {
      id: 'stand',
      enabled: false,
      type: 'interval',
      intervalMinutes: 45,
      metadata: { soundEnabled: true },
      lastTriggered: null
    },
    stretch: {
      id: 'stretch',
      enabled: false,
      type: 'interval',
      intervalMinutes: 60,
      metadata: { soundEnabled: true },
      lastTriggered: null
    },
    breathing: {
      id: 'breathing',
      enabled: false,
      type: 'interval',
      intervalMinutes: 90,
      metadata: { soundEnabled: true },
      lastTriggered: null
    },
    workStart: {
      id: 'workStart',
      enabled: false,
      type: 'fixedTime',
      timeOfDay: '09:00',
      workdays: [1, 2, 3, 4, 5],
      metadata: { soundEnabled: true },
      lastTriggered: null
    },
    workLunch: {
      id: 'workLunch',
      enabled: false,
      type: 'fixedTime',
      timeOfDay: '12:00',
      workdays: [1, 2, 3, 4, 5],
      metadata: { soundEnabled: true },
      lastTriggered: null
    },
    workEnd: {
      id: 'workEnd',
      enabled: false,
      type: 'fixedTime',
      timeOfDay: '22:00',
      workdays: [1, 2, 3, 4, 5],
      metadata: { soundEnabled: true },
      lastTriggered: null
    }
  },
  stats: {
    water: { todayCount: 0, lastResetDate: null },
    posture: { todayCount: 0, lastResetDate: null },
    break: { todayCount: 0, lastResetDate: null },
    eye: { todayCount: 0, lastResetDate: null },
    stand: { todayCount: 0, lastResetDate: null },
    stretch: { todayCount: 0, lastResetDate: null },
    breathing: { todayCount: 0, lastResetDate: null }
  },
  notes: [],
  logs: []
};

/**
 * Helper to get a YYYY-MM-DD date string in local time.
 * @returns {string}
 */
export function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Ensures that daily stats (counters) are reset if the date has changed.
 * @param {Object} storage - The storage object to check and modify.
 * @returns {boolean} - True if any stats were reset.
 */
export function ensureDailyStatsReset(storage) {
  if (!storage || !storage.stats) return false;

  const today = getLocalDateString();
  let changed = false;

  for (const id in storage.stats) {
    if (storage.stats[id].lastResetDate !== today) {
      storage.stats[id].todayCount = 0;
      storage.stats[id].lastResetDate = today;
      changed = true;
    }
  }

  return changed;
}

export const STORAGE_KEY = "rhythmData";

export async function getStorage() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const data = result[STORAGE_KEY] || null;

  if (data && ensureDailyStatsReset(data)) {
    await setStorage(data);
    console.log("Stats auto-reset for new day");
  }

  return data;
}

export async function setStorage(data) {
  await chrome.storage.local.set({ [STORAGE_KEY]: data });
}

export async function initializeStorage() {
  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const data = await getStorage();

  if (!data) {
    const schema = { ...DEFAULT_SCHEMA, settings: { ...DEFAULT_SCHEMA.settings, timezone: detectedTimezone } };
    await setStorage(schema);
    console.log("Storage initialized with default schema");
    return schema;
  }

  // Merge any new settings keys added since user first installed (avoids data loss)
  let changed = false;
  for (const key of Object.keys(DEFAULT_SCHEMA.settings)) {
    if (!(key in data.settings)) {
      data.settings[key] = DEFAULT_SCHEMA.settings[key];
      changed = true;
    }
  }

  // Merge any top-level keys like notes, logs, stats that might be missing
  for (const key of Object.keys(DEFAULT_SCHEMA)) {
    if (!(key in data)) {
      data[key] = DEFAULT_SCHEMA[key];
      changed = true;
    }
  }

  // Always keep timezone current (resolve 'auto' placeholder)
  if (data.settings.timezone === 'auto' || !data.settings.timezone) {
    data.settings.timezone = detectedTimezone;
    changed = true;
  }

  if (changed) await setStorage(data);
  return data;
}

export async function updateSettings(settings) {
  const data = await getStorage();
  data.settings = { ...data.settings, ...settings };
  await setStorage(data);
}

export async function updateReminder(id, reminder) {
  const data = await getStorage();
  data.reminders[id] = { ...data.reminders[id], ...reminder };
  await setStorage(data);
}
