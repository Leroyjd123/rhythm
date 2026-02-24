import { getStorage, setStorage } from '/src/shared/storage.js';

const LOG_LIMIT = 100;

async function addLog(level, message, data = null) {
  const storage = await getStorage();
  if (!storage) return;

  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data
  };

  storage.logs.unshift(logEntry);
  if (storage.logs.length > LOG_LIMIT) {
    storage.logs = storage.logs.slice(0, LOG_LIMIT);
  }

  await setStorage(storage);
}

export const logInfo = (message, data) => addLog('INFO', message, data);
export const logWarn = (message, data) => addLog('WARN', message, data);
export const logError = (message, data) => addLog('ERROR', message, data);
