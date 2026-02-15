import { initializeStorage } from '/src/shared/storage.js';
import { logInfo } from '/src/shared/logger.js';
import { initializeEngine, handleAlarm, createReminder, recreateAllReminders } from '/src/background/reminder-engine.js';

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
    createReminder(message.reminder);
  } else if (message.action === 'recreateAllReminders') {
    recreateAllReminders();
  }
});

let focusEndTimeout = null;

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === 'local' && changes.rhythmData) {
    const newData = changes.rhythmData.newValue;
    const oldData = changes.rhythmData.oldValue;

    if (newData.settings.focusUntil !== (oldData ? oldData.settings.focusUntil : null)) {
      handleFocusChange(newData.settings.focusUntil);
    }
  }
});

function handleFocusChange(focusUntil) {
  if (focusEndTimeout) clearTimeout(focusEndTimeout);

  if (focusUntil) {
    const diff = focusUntil - Date.now();
    if (diff > 0) {
      focusEndTimeout = setTimeout(() => {
        chrome.notifications.create('focus-end', {
          type: 'basic',
          iconUrl: '/public/icon128.png',
          title: 'Focus Mode Ended',
          message: 'Your focus session has completed. Reminders will now resume.',
          requireInteraction: true
        });
      }, diff);
    }
  }
}

