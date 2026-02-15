export const DEFAULT_SCHEMA = {
  schemaVersion: 1,
  settings: {
    theme: 'light',
    focusUntil: null,
    timezone: 'auto',
    masterEnabled: true
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

export const STORAGE_KEY = 'rhythmData';

export async function getStorage() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || null;
}

export async function setStorage(data) {
  await chrome.storage.local.set({ [STORAGE_KEY]: data });
}

export async function initializeStorage() {
  const data = await getStorage();
  if (!data || data.schemaVersion !== DEFAULT_SCHEMA.schemaVersion) {
    await setStorage(DEFAULT_SCHEMA);
    console.log('Storage initialized with default schema');
    return DEFAULT_SCHEMA;
  }
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
