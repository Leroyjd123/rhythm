/**
 * Manages the offscreen document and triggers audio playback.
 * Kept in its own module to avoid circular imports with service-worker.js.
 */
export async function playNotificationSound() {
  try {
    const existing = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
    if (existing.length === 0) {
      await chrome.offscreen.createDocument({
        url: chrome.runtime.getURL('src/offscreen/offscreen.html'),
        reasons: ['AUDIO_PLAYBACK'],
        justification: 'Play notification chime'
      });
    }
    chrome.runtime.sendMessage({ type: 'playSound' });
  } catch (err) {
    // Non-critical: sound failure should not block notifications
    console.warn('Sound playback failed:', err);
  }
}
