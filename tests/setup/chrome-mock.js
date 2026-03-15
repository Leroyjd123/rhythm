/**
 * Minimal Chrome API shims so source files can be imported in Node/Vitest.
 */
global.chrome = {
  storage: {
    local: {
      get: async () => ({}),
      set: async () => {}
    }
  },
  alarms: {
    create: async () => {},
    clear: async () => {},
    clearAll: async () => {}
  },
  notifications: {
    create: () => {},
    clear: () => {},
    onButtonClicked: { addListener: () => {} }
  },
  runtime: {
    sendMessage: () => {},
    getContexts: async () => [],
    getURL: (path) => `chrome-extension://fake-id/${path}`,
    onMessage: { addListener: () => {} }
  },
  offscreen: {
    createDocument: async () => {}
  }
};
