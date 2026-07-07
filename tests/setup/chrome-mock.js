/**
 * Minimal Chrome API shims so source files can be imported in Node/Vitest.
 */
global.chrome = {
  storage: {
    local: {
      get: async () => ({}),
      set: async () => {}
    },
    onChanged: { addListener: () => {} }
  },
  alarms: {
    create: async () => {},
    clear: async () => {},
    clearAll: async () => {},
    get: async () => undefined,
    getAll: async () => [],
    onAlarm: { addListener: () => {} }
  },
  notifications: {
    create: () => {},
    clear: () => {},
    getAll: async () => ({}),
    onButtonClicked: { addListener: () => {} },
    onClicked: { addListener: () => {} },
    onClosed: { addListener: () => {} }
  },
  runtime: {
    sendMessage: () => {},
    getContexts: async () => [],
    getURL: (path) => `chrome-extension://fake-id/${path}`,
    onMessage: { addListener: () => {} },
    onInstalled: { addListener: () => {} },
    onStartup: { addListener: () => {} }
  },
  offscreen: {
    createDocument: async () => {}
  }
};
