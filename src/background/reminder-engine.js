import { getStorage, setStorage } from '/src/shared/storage.js';
import { logInfo, logError } from '/src/shared/logger.js';

/**
 * Main entry point for the reminder engine.
 */
export async function initializeEngine() {
  logInfo('Reminder engine initialized');
  await recreateAllReminders();
  await scheduleMidnightReset();
}

/**
 * Creates/Updates an alarm for a reminder.
 */
export async function createReminder(reminder, triggerNow = false) {
  if (!reminder.enabled) {
    await cancelReminder(reminder.id);
    return;
  }

  // Guard: Cancel existing alarm before recreating
  await cancelReminder(reminder.id);

  if (reminder.type === 'interval') {
    await scheduleIntervalReminder(reminder);
  } else if (reminder.type === 'fixedTime') {
    await scheduleFixedReminder(reminder);
  }

  if (triggerNow) {
    await bufferedNotification(reminder.id);
  }

  logInfo(`Reminder created/updated: ${reminder.id}`, { type: reminder.type, triggerNow });
}

/**
 * Schedules an interval-based alarm.
 */
async function scheduleIntervalReminder(reminder) {
  let interval = Math.max(1, reminder.intervalMinutes || 1);
  await chrome.alarms.create(reminder.id, {
    periodInMinutes: interval,
    delayInMinutes: interval // Start first alarm after the interval
  });
}

/**
 * Schedules a fixed-time alarm.
 */
async function scheduleFixedReminder(reminder) {
  const nextTime = calculateNextFixedTimestamp(reminder.timeOfDay, reminder.workdays);
  await chrome.alarms.create(reminder.id, {
    when: nextTime
  });
}

/**
 * Cancels an alarm for a reminder.
 */
export async function cancelReminder(id) {
  await chrome.alarms.clear(id);
  // Also clear any snooze alarms
  await chrome.alarms.clear(`snooze-${id}`);
}

/**
 * Recreates all enabled reminders from storage.
 */
export async function recreateAllReminders() {
  const storage = await getStorage();
  if (!storage) return;

  const reminders = Object.values(storage.reminders);
  for (const reminder of reminders) {
    if (reminder.enabled) {
      await createReminder(reminder);
    }
  }
}

/**
 * Handles an alarm trigger event.
 */
export async function handleAlarm(alarm) {
  logInfo(`Alarm triggered: ${alarm.name}`);

  if (alarm.name === 'midnightReset') {
    await performMidnightReset();
    return;
  }

  if (alarm.name.startsWith('clear-notif:')) {
    const notifId = alarm.name.replace('clear-notif:', '');
    await chrome.notifications.clear(notifId);
    await chrome.alarms.clear(alarm.name);
    return;
  }

  if (alarm.name.startsWith('snooze-')) {
    const id = alarm.name.replace('snooze-', '');
    await dispatchNotification([id]);
    return;
  }

  // For regular reminders
  const storage = await getStorage();
  const reminder = storage.reminders[alarm.name];

  if (reminder && reminder.enabled) {
    // Check Focus Mode
    if (storage.settings.focusUntil && Date.now() < storage.settings.focusUntil) {
      logInfo(`Reminder suppressed by Focus Mode: ${reminder.id}`);
      return;
    }

    if (!storage.settings.masterEnabled) {
      logInfo(`Reminder suppressed by Master Toggle: ${reminder.id}`);
      return;
    }

    await bufferedNotification(reminder.id);

    // For fixedTime, we need to reschedule manually
    if (reminder.type === 'fixedTime') {
      await scheduleFixedReminder(reminder);
    }
  }
}

/**
 * Snoozes a reminder for a fixed period (5 minutes).
 */
export async function handleSnooze(id) {
  await chrome.alarms.create(`snooze-${id}`, {
    delayInMinutes: 5
  });
  logInfo(`Reminder snoozed: ${id}`);
}

/**
 * Performs daily stats reset at midnight.
 */
async function performMidnightReset() {
  const storage = await getStorage();
  if (!storage) return;

  // Reset all daily counters
  for (const id in storage.stats) {
    storage.stats[id].todayCount = 0;
    storage.stats[id].lastResetDate = new Date().toISOString().split('T')[0];
  }

  await setStorage(storage);
  logInfo('Midnight reset performed');

  // Schedule next reset
  await scheduleMidnightReset();
}

/**
 * Schedules the next midnight reset alarm.
 */
export async function scheduleMidnightReset() {
  const now = new Date();
  const nextMidnight = new Date();
  nextMidnight.setHours(24, 0, 0, 0);

  await chrome.alarms.create('midnightReset', {
    when: nextMidnight.getTime()
  });
}

/**
 * Buffer for grouped notifications.
 */
let notificationBuffer = [];
let notificationTimeout = null;

async function bufferedNotification(id) {
  notificationBuffer.push(id);

  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
  }

  notificationTimeout = setTimeout(async () => {
    const ids = [...new Set(notificationBuffer)];
    notificationBuffer = [];
    notificationTimeout = null;
    await dispatchNotification(ids);
  }, 1000); // 1 second buffer
}

/**
 * Dispatches a notification for one or more reminders.
 */
async function dispatchNotification(ids) {
  const storage = await getStorage();
  const reminderDetails = ids.map(id => storage.reminders[id]).filter(Boolean);

  if (reminderDetails.length === 0) return;

  const isMulti = reminderDetails.length > 1;
  const title = isMulti ? 'Rhythm: Multiple Reminders' : `Rhythm: ${reminderDetails[0].id}`;
  const message = isMulti
    ? reminderDetails.map(r => `• ${r.id}`).join('\n')
    : `It's time for your ${reminderDetails[0].id} reminder.`;

  // Encode IDs into notificationId to retrieve them in button handler
  const notificationId = `ids:${ids.join(',')}:${Date.now()}`;
  
  chrome.notifications.create(notificationId, {
    type: 'basic',
    iconUrl: '/public/icon128.png', 
    title: title,
    message: message,
    buttons: [
      { title: 'Log/Done' },
      { title: 'Snooze (5m)' }
    ],
    priority: 2,
    requireInteraction: true
  });
  logInfo(`Notification dispatched: ${notificationId}`);
  // Auto-dismiss after 5 minutes using alarms (replaces setTimeout for SW longevity)
  const alarmName = `clear-notif:${notificationId}`;
  await chrome.alarms.create(alarmName, {
    delayInMinutes: 5
  });
}

// Global listener for notification buttons
chrome.notifications.onButtonClicked.addListener(async (notifId, btnIdx) => {
  // Clear the auto-dismiss alarm if someone clicks a button
  await chrome.alarms.clear(`clear-notif:${notifId}`);

  if (notifId.startsWith('ids:')) {
    const parts = notifId.split(':');
    const ids = parts[1].split(',');

    if (btnIdx === 0) { // Log/Done
      const storage = await getStorage();
      for (const id of ids) {
        if (storage.stats[id]) {
          storage.stats[id].todayCount++;
        }
      }
      await setStorage(storage);
      logInfo(`Acknowledge Done for: ${ids.join(', ')}`);
    } else if (btnIdx === 1) { // Snooze
      for (const id of ids) {
        await handleSnooze(id);
      }
    }
    chrome.notifications.clear(notifId);
  }
});

/**
 * Helper: Calculates the next timestamp for a fixed time of day.
 */
function calculateNextFixedTimestamp(timeOfDay, workdays) {
  const [hours, minutes] = timeOfDay.split(':').map(Number);
  let now = new Date();
  let target = new Date();
  target.setHours(hours, minutes, 0, 0);

  // If time passed today, move to tomorrow
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  // Find next valid workday if applicable
  if (workdays && workdays.length > 0) {
    while (!workdays.includes(target.getDay())) {
      target.setDate(target.getDate() + 1);
    }
  }

  return target.getTime();
}
