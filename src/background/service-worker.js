import { initializeStorage } from '/src/shared/storage.js';
import { logInfo } from '/src/shared/logger.js';
import { initializeEngine, handleAlarm, createReminderById, recreateAllReminders } from '/src/background/reminder-engine.js';

chrome.runtime.onInstalled.addListener(async () => {
  await initializeStorage();
  await initializeEngine();
  logInfo('Extension installed/updated');
});

chrome.runtime.onStartup.addListener(async () => {
  logInfo('Extension startup');
  await initializeEngine();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  handleAlarm(alarm);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'createReminder') {
    // Re-read the reminder from storage so scheduling always uses the
    // persisted state, never a stale object from the popup.
    const id = message.id || message.reminder?.id;
    createReminderById(id, message.triggerNow);
  } else if (message.action === 'recreateAllReminders') {
    recreateAllReminders();
  }
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === 'local' && changes.rhythmData) {
    const newData = changes.rhythmData.newValue;
    const oldData = changes.rhythmData.oldValue;

    // Guard: newData is undefined when storage is cleared (e.g. reset)
    if (!newData || !newData.settings) {
      await handleFocusChange(null);
      return;
    }

    if (newData.settings.focusUntil !== (oldData?.settings?.focusUntil ?? null)) {
      await handleFocusChange(newData.settings.focusUntil);
    }
  }
});

/**
 * Schedules (or clears) the end-of-focus notification via chrome.alarms.
 * A setTimeout would silently die when the service worker is suspended,
 * which is guaranteed to happen during a one-hour focus session.
 */
async function handleFocusChange(focusUntil) {
  await chrome.alarms.clear('focus-end');

  if (focusUntil && focusUntil > Date.now()) {
    await chrome.alarms.create('focus-end', { when: focusUntil });
  }
}
