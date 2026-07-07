import { getStorage, updateReminder, setStorage, getLocalDateString, initializeStorage } from '/src/shared/storage.js';

/**
 * Debounce helper to limit storage writes
 */
function debounce(fn, delay = 400) {
  let timeout;
  let lastArgs;

  const debounced = (...args) => {
    lastArgs = args;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn(...args);
      timeout = null;
    }, delay);
  };

  debounced.flush = () => {
    if (timeout) {
      clearTimeout(timeout);
      fn(...lastArgs);
      timeout = null;
    }
  };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

const debouncedSetStorage = debounce(async (storage) => {
  try {
    await setStorage(storage);
    console.log('Debounced storage update successful');
  } catch (err) {
    console.error('Debounced storage update failed:', err);
  }
}, 400);

async function init() {
  console.log('Popup initializing...');
  try {
    const storage = await getStorage();
    if (!storage) {
      console.warn('Storage not found, extension might not be initialized');
      document.body.innerHTML = '<div style="padding:20px; text-align:center;">Extension initializing... Please wait a moment and reopen.</div>';
      return;
    }

    // Apply saved theme before rendering
    document.documentElement.setAttribute('data-theme', storage.settings.theme === 'dark' ? 'dark' : '');

    // Show live version from manifest
    const versionEl = document.getElementById('theme-status');
    if (versionEl) versionEl.textContent = `v${chrome.runtime.getManifest().version}`;

    renderDashboard(storage);
    startNextReminderTicker();

    // Live-sync data changed outside this popup (e.g. "Mark as Done" on a
    // notification is handled by the background worker) so counters update
    // while the popup is open. Also keeps this snapshot's stats/logs fresh,
    // so the popup's own debounced writes can't clobber background updates.
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !changes.rhythmData?.newValue) return;
      const newData = changes.rhythmData.newValue;
      if (newData.stats) storage.stats = newData.stats;
      if (newData.logs) storage.logs = newData.logs;
      updateCardCounters(storage);
    });

    initFocusMode(storage);
    initNotes(storage);
    initAdvanced(storage);
    initSupport();

    // Flush pending storage writes on close
    window.addEventListener('pagehide', () => debouncedSetStorage.flush());
    window.addEventListener('beforeunload', () => debouncedSetStorage.flush());

    console.log('Popup initialized successfully');
  } catch (err) {
    console.error('Failed to initialize popup:', err);
    document.body.innerHTML = '<div style="padding:20px; color:red;">Error loading extension data. Please restart Chrome or reload the extension.</div>';
  }
}

function initAdvanced(storage) {
  const section = document.getElementById('advanced-section');
  const trigger = section.querySelector('.collapsible-trigger');
  
  // Set default state
  const isAdvancedOpen = storage.settings.advancedOpen;
  if (isAdvancedOpen) section.classList.add('open');
  trigger.setAttribute('aria-expanded', !!isAdvancedOpen);
  
  const masterToggle = document.getElementById('master-toggle');
  const exportBtn = document.getElementById('export-btn');
  const resetBtn = document.getElementById('reset-btn');
  const logList = document.getElementById('log-list');

  masterToggle.checked = storage.settings.masterEnabled;
  masterToggle.addEventListener('change', async (e) => {
    storage.settings.masterEnabled = e.target.checked;
    await setStorage(storage);
    // Notify background
    chrome.runtime.sendMessage({ action: 'recreateAllReminders' });
  });

  const themeToggle = document.getElementById('theme-toggle');
  themeToggle.checked = storage.settings.theme === 'dark';
  themeToggle.addEventListener('change', async (e) => {
    storage.settings.theme = e.target.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', e.target.checked ? 'dark' : '');
    await setStorage(storage);
  });

  const soundToggle = document.getElementById('sound-toggle');
  soundToggle.checked = storage.settings.soundEnabled !== false;
  soundToggle.addEventListener('change', async (e) => {
    storage.settings.soundEnabled = e.target.checked;
    await setStorage(storage);
  });

  trigger.addEventListener('click', () => {
    const isOpen = section.classList.toggle('open');
    trigger.setAttribute('aria-expanded', isOpen);
    storage.settings.advancedOpen = isOpen;
    debouncedSetStorage(storage);
  });

  exportBtn.addEventListener('click', () => {
    try {
      const blob = new Blob([JSON.stringify(storage, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rhythm-backup-${getLocalDateString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    }
  });

  resetBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      debouncedSetStorage.cancel();
      await chrome.storage.local.clear();
      await initializeStorage(); // Re-initialize so popup reloads cleanly
      window.location.reload();
    }
  });

  // Render logs
  logList.innerHTML = storage.logs.map(log => `
    <div class="log-entry">
      <span class="log-time">[${new Date(log.timestamp).toLocaleTimeString()}]</span>
      <span class="log-level-${log.level}">${log.level}</span>: ${log.message}
    </div>
  `).join('');
}

function initSupport() {
  const donateBtn = document.getElementById('donate-btn');
  if (donateBtn) {
    donateBtn.addEventListener('click', () => {
      const supportUrl = 'https://paypal.me/leroyjd';
      window.open(supportUrl, '_blank');
    });
  }
}

function initNotes(storage) {
  const notesSection = document.getElementById('notes-section');
  const trigger = notesSection.querySelector('.collapsible-trigger');
  const addBtn = document.getElementById('add-note-btn');
  const notesList = document.getElementById('notes-list');

  // Accordion logic
  const isNotesOpen = storage.settings.notesOpen;
  if (isNotesOpen) notesSection.classList.add('open');
  trigger.setAttribute('aria-expanded', !!isNotesOpen);

  const toggleNotes = (e) => {
    if (e.target.closest('#add-note-btn')) return;
    if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
    if (e.type === 'keydown') e.preventDefault();
    
    const isOpen = notesSection.classList.toggle('open');
    trigger.setAttribute('aria-expanded', isOpen);
    storage.settings.notesOpen = isOpen;
    debouncedSetStorage(storage);
  };

  trigger.addEventListener('click', toggleNotes);
  trigger.addEventListener('keydown', toggleNotes);

  const autoResize = (el) => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  const renderNotes = () => {
    notesList.innerHTML = '';
    const sortedNotes = [...storage.notes].sort((a, b) => a.completed - b.completed);

    if (sortedNotes.length === 0) {
      notesList.innerHTML = '<div class="notes-empty">No notes yet. Tap + to add one.</div>';
      return;
    }

    sortedNotes.forEach((note) => {
      const item = document.createElement('div');
      item.className = `note-item${note.completed ? ' completed' : ''}`;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'note-checkbox';
      checkbox.checked = note.completed;
      checkbox.setAttribute('aria-label', 'Mark note complete');

      const textarea = document.createElement('textarea');
      textarea.className = 'note-textarea';
      textarea.placeholder = 'Write your note...';
      textarea.rows = 1;
      textarea.value = note.text;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-note-btn';
      deleteBtn.textContent = '×';
      deleteBtn.setAttribute('aria-label', 'Delete note');

      checkbox.addEventListener('change', async () => {
        note.completed = checkbox.checked;
        await setStorage(storage);
        renderNotes();
      });

      textarea.addEventListener('input', () => {
        autoResize(textarea);
        note.text = textarea.value;
        debouncedSetStorage(storage);
      });

      textarea.addEventListener('blur', async () => {
        debouncedSetStorage.flush();
        // Delete empty notes on blur
        if (note.text.trim() === '') {
          storage.notes = storage.notes.filter(n => n.id !== note.id);
          await setStorage(storage);
          renderNotes();
        }
      });

      textarea.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          debouncedSetStorage.flush();
          // Create new note and focus
          await addBtn.click();
        }
      });

      deleteBtn.addEventListener('click', async () => {
        storage.notes = storage.notes.filter(n => n.id !== note.id);
        await setStorage(storage);
        renderNotes();
      });

      item.appendChild(checkbox);
      item.appendChild(textarea);
      item.appendChild(deleteBtn);
      notesList.appendChild(item);

      // Apply initial height after DOM insertion
      autoResize(textarea);
    });
  };

  addBtn.addEventListener('click', async (e) => {
    if (e) e.stopPropagation();
    storage.notes.unshift({
      id: Date.now().toString(),
      text: '',
      completed: false,
      timestamp: Date.now()
    });
    await setStorage(storage);
    renderNotes();
    
    // Auto-focus the newly created note (which is at the top because of unshift)
    const newTextarea = notesList.querySelector('.note-item:first-child .note-textarea');
    if (newTextarea) {
      setTimeout(() => {
        newTextarea.focus();
        // If the accordion was closed, open it naturally
        if (!notesSection.classList.contains('open')) {
          notesSection.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
          storage.settings.notesOpen = true;
          debouncedSetStorage(storage);
        }
      }, 50);
    }
  });

  renderNotes();
}

function initFocusMode(storage) {
  const focusToggle = document.getElementById('focus-toggle');
  const focusStatus = document.getElementById('focus-status');
  const chipsContainer = document.getElementById('focus-chips');
  let timerInterval = null;

  const updateUI = () => {
    const focusUntil = storage.settings.focusUntil;
    const active = focusUntil && Date.now() < focusUntil;

    chipsContainer.hidden = active;
    focusToggle.hidden = !active;

    if (active) {
      const updateTimer = () => {
        const remaining = Math.max(0, focusUntil - Date.now());
        if (remaining === 0) {
          clearInterval(timerInterval);
          window.location.reload();
          return;
        }
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        focusStatus.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
      };

      updateTimer();
      clearInterval(timerInterval);
      timerInterval = setInterval(updateTimer, 1000);
    } else {
      focusStatus.textContent = 'Focus';
      clearInterval(timerInterval);
    }
  };

  // Duration chips: start a focus session with one click (Pomodoro-style).
  // The background schedules a focus-end alarm and notifies when it's done.
  chipsContainer.querySelectorAll('.focus-chip').forEach(chip => {
    chip.addEventListener('click', async () => {
      const minutes = parseInt(chip.dataset.minutes, 10);
      storage.settings.focusDurationMinutes = minutes;
      storage.settings.focusUntil = Date.now() + minutes * 60 * 1000;
      await setStorage(storage);
      updateUI();
    });
  });

  focusToggle.addEventListener('click', async () => {
    storage.settings.focusUntil = null;
    await setStorage(storage);
    updateUI();
  });

  updateUI();
}

const ICONS = {
  water: '💧',
  posture: '🧘',
  break: '☕',
  eye: '👁️',
  stand: '🚶',
  stretch: '🙆',
  breathing: '✨',
  workStart: '🕒',
  workLunch: '🍎',
  workEnd: '🌙'
};

function renderDashboard(storage) {
  const dashboard = document.getElementById('dashboard');
  if (!dashboard) return;
  dashboard.innerHTML = '';

  const wellbeingReminders = ['water', 'posture', 'break', 'eye', 'stand', 'stretch', 'breathing'];
  const workReminders = ['workStart', 'workLunch', 'workEnd'];

  const createSection = (title, reminderIds, sectionId) => {
    const section = document.createElement('section');
    section.className = 'section-container dashboard-section';
    
    const isOpen = storage.settings[`${sectionId}Open`];
    if (isOpen) section.classList.add('open');

    const header = document.createElement('button');
    header.type = 'button';
    header.className = 'section-header collapsible-trigger';
    header.setAttribute('aria-expanded', !!isOpen);
    header.setAttribute('aria-controls', `${sectionId}-content`);
    
    header.innerHTML = `
      <h2>${title}</h2>
      <span class="chevron">▼</span>
    `;

    const content = document.createElement('div');
    content.id = `${sectionId}-content`;
    content.className = 'collapsible-content';

    header.addEventListener('click', () => {
      const isNowOpen = section.classList.toggle('open');
      header.setAttribute('aria-expanded', isNowOpen);
      storage.settings[`${sectionId}Open`] = isNowOpen;
      debouncedSetStorage(storage);
    });

    reminderIds.forEach(id => {
      const reminder = storage.reminders[id];
      const stats = storage.stats[id];
      if (reminder) {
        content.appendChild(createReminderCard(reminder, stats));
      }
    });

    section.appendChild(header);
    section.appendChild(content);
    return section;
  };

  dashboard.appendChild(createSection('Wellbeing', wellbeingReminders, 'wellbeing'));
  dashboard.appendChild(createSection('Work Schedule', workReminders, 'workSchedule'));
}

/**
 * Updates each card's daily counter in place (no full re-render, so the
 * open/expanded card state is preserved). Pops a small bump animation
 * when a value actually changes.
 */
function updateCardCounters(storage) {
  document.querySelectorAll('#dashboard .card').forEach(card => {
    const id = card.dataset.reminderId;
    const stats = storage.stats[id];
    const counterEl = card.querySelector('.card-counter');
    if (!counterEl || !stats) return;

    const target = storage.reminders[id]?.metadata?.dailyTarget;
    const text = `${stats.todayCount}${target ? ` / ${target}` : ''}`;
    if (counterEl.textContent.trim() !== text) {
      counterEl.textContent = text;
      counterEl.classList.remove('bump');
      void counterEl.offsetWidth; // restart the animation
      counterEl.classList.add('bump');
    }
  });
}

/**
 * Formats the timestamp of the next reminder occurrence for display.
 * Under an hour it renders a live MM:SS countdown (updated every second
 * by the ticker); beyond that it falls back to a readable time/day.
 */
function formatNextReminder(ts) {
  const totalSecs = Math.max(0, Math.round((ts - Date.now()) / 1000));
  if (totalSecs < 3600) {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  const target = new Date(ts);
  const time = target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const now = new Date();
  if (target.toDateString() === now.toDateString()) return `today at ${time}`;

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (target.toDateString() === tomorrow.toDateString()) return `tomorrow at ${time}`;

  return `${target.toLocaleDateString([], { weekday: 'short' })} at ${time}`;
}

/**
 * Reads the reminder's scheduled alarm (and any pending snooze) and
 * updates the "Next reminder" label on the card.
 */
async function refreshNextReminderLabel(card) {
  const el = card.querySelector('.next-reminder-value');
  if (!el) return;

  const reminderId = card.dataset.reminderId;
  if (!card.querySelector('.toggle input').checked) {
    el.textContent = 'Off';
    el.classList.remove('live');
    return;
  }

  const [main, snooze] = await Promise.all([
    chrome.alarms.get(reminderId),
    chrome.alarms.get(`snooze-${reminderId}`)
  ]);
  const times = [main, snooze]
    .filter(a => a && a.scheduledTime > Date.now())
    .map(a => a.scheduledTime);

  if (times.length === 0) {
    // Enabled but no alarm scheduled — master toggle is off, or the
    // background is mid-reschedule; the periodic refresh will catch up.
    el.textContent = 'Paused';
    el.classList.remove('live');
    return;
  }

  el.textContent = formatNextReminder(Math.min(...times));
  el.classList.add('live');
}

function startNextReminderTicker() {
  const refreshOpenCards = () => {
    document.querySelectorAll('.card.open').forEach(card => refreshNextReminderLabel(card));
  };
  refreshOpenCards();
  setInterval(refreshOpenCards, 1000);
}

function createReminderCard(reminder, stats) {
  const card = document.createElement('div');
  card.className = `card ${reminder.id}-card`;
  card.dataset.reminderId = reminder.id;
  card.tabIndex = 0;
  card.role = 'button';
  card.ariaExpanded = 'false';
  card.ariaLabel = `Reminder: ${reminder.id}`;
  
  const hasDailyTarget = reminder.metadata && reminder.metadata.dailyTarget;
  const counterHtml = stats ? `
    <div class="card-counter">
      ${stats.todayCount}${hasDailyTarget ? ` / ${reminder.metadata.dailyTarget}` : ''}
    </div>
  ` : '';

  card.innerHTML = `
    <div class="card-header">
      <div class="card-icon">${ICONS[reminder.id] || '🔔'}</div>
      <div class="card-label">${reminder.id.charAt(0).toUpperCase() + reminder.id.slice(1)}</div>
      ${counterHtml}
      <label class="toggle">
        <input type="checkbox" ${reminder.enabled ? 'checked' : ''}>
        <span class="slider"></span>
      </label>
    </div>
    <div class="card-expanded">
      <div class="expanded-content">
        <div class="setting-row">
          <label>Next reminder</label>
          <span class="next-reminder-value">–</span>
        </div>
        ${reminder.type === 'interval' ? `
          <div class="setting-row">
            <label>Interval (minutes)</label>
            <input type="number" class="interval-input" value="${reminder.intervalMinutes}" min="1">
          </div>
          <div class="action-row">
            <button class="primary log-btn">${reminder.id === 'water' ? '+ Log Water' : 'Mark as Done'}</button>
            <button class="secondary save-btn">Save</button>
          </div>
        ` : `
          <div class="setting-row">
            <label>Time</label>
            <input type="time" class="time-input" value="${reminder.timeOfDay}">
          </div>
          <div class="setting-row">
            <label>Workdays</label>
            <div class="weekday-selector">
              ${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => `
                <button class="day-btn ${reminder.workdays.includes(i) ? 'active' : ''}" data-day="${i}">${day}</button>
              `).join('')}
            </div>
          </div>
          <div class="action-row">
            <button class="primary save-btn">Update Schedule</button>
          </div>
        `}
      </div>
    </div>
  `;

  // --- Listeners ---

  // Toggle Listener (Checkbox)
  const toggleInput = card.querySelector('.toggle input');
  toggleInput.addEventListener('change', async (e) => {
    e.stopPropagation();
    const enabled = e.target.checked;
    await updateReminder(reminder.id, { enabled });
    // Keep triggerNow: true only for explicit manual enabling
    chrome.runtime.sendMessage({ action: 'createReminder', id: reminder.id, triggerNow: enabled });
    // Give the background a moment to (re)schedule, then update the label
    setTimeout(() => refreshNextReminderLabel(card), 400);
  });

  const toggleOpen = () => {
    // Close other cards first for a clean look
    document.querySelectorAll('.card.open').forEach(c => {
      if (c !== card) {
        c.classList.remove('open');
        c.ariaExpanded = 'false';
      }
    });

    const isOpen = card.classList.toggle('open');
    card.ariaExpanded = isOpen;
    if (isOpen) refreshNextReminderLabel(card);
  };

  // Expand Listener (Card Body)
  card.addEventListener('click', (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.toggle')) return;
    toggleOpen();
  });

  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.toggle')) return;
      e.preventDefault();
      toggleOpen();
    }
  });

  // Save Button
  const saveBtn = card.querySelector('.save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const updates = {};
      if (reminder.type === 'interval') {
        const input = card.querySelector('.interval-input');
        updates.intervalMinutes = Math.max(1, parseInt(input.value) || 1);
        input.value = updates.intervalMinutes;
      } else {
        updates.timeOfDay = card.querySelector('.time-input').value;
        const selectedDays = Array.from(card.querySelectorAll('.day-btn.active')).map(btn => parseInt(btn.dataset.day));
        
        if (selectedDays.length === 0) {
          alert('Please select at least one workday.');
          return;
        }
        updates.workdays = selectedDays;
      }
      
      await updateReminder(reminder.id, updates);
      chrome.runtime.sendMessage({
        action: 'createReminder',
        id: reminder.id,
        triggerNow: false // Only reschedule without immediate firing
      });
      setTimeout(() => refreshNextReminderLabel(card), 400);

      const originalText = saveBtn.textContent;
      saveBtn.textContent = 'Saved!';
      setTimeout(() => saveBtn.textContent = originalText, 1500);
    });
  }

  // Log Button
  const logBtn = card.querySelector('.log-btn');
  if (logBtn) {
    logBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const storage = await getStorage();
      if (!storage.stats[reminder.id]) {
        storage.stats[reminder.id] = { todayCount: 0, lastResetDate: getLocalDateString() };
      }
      storage.stats[reminder.id].todayCount++;
      await setStorage(storage);
      // Update counters in place — a full re-render would collapse the card
      updateCardCounters(storage);

      if (reminder.metadata.dailyTarget && storage.stats[reminder.id].todayCount === reminder.metadata.dailyTarget) {
        triggerConfetti();
      }
    });
  }

  // Day Buttons
  card.querySelectorAll('.day-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      btn.classList.toggle('active');
    });
  });

  return card;
}

function triggerConfetti() {
  const container = document.getElementById('confetti-container');
  if (!container) return;

  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 70%)`;
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    container.appendChild(confetti);

    setTimeout(() => confetti.remove(), 2000);
  }
}

document.addEventListener('DOMContentLoaded', init);
