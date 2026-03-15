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

    renderDashboard(storage);
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
  const addBtn = document.getElementById('add-note-btn');
  const notesList = document.getElementById('notes-list');

  const renderNotes = () => {
    notesList.innerHTML = '';
    const sortedNotes = [...storage.notes].sort((a, b) => a.completed - b.completed);
    
    sortedNotes.forEach((note) => {
      const item = document.createElement('div');
      item.className = `note-item ${note.completed ? 'completed' : ''}`;
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'note-checkbox';
      checkbox.checked = note.completed;
      checkbox.ariaLabel = 'Complete note';

      const textarea = document.createElement('textarea');
      textarea.className = 'note-textarea';
      textarea.placeholder = 'New note...';
      textarea.rows = 1;
      textarea.value = note.text;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-note-btn icon-btn';
      deleteBtn.textContent = '×';
      deleteBtn.ariaLabel = 'Delete note';

      checkbox.addEventListener('change', async () => {
        note.completed = checkbox.checked;
        await setStorage(storage);
        renderNotes();
      });

      textarea.addEventListener('input', () => {
        note.text = textarea.value;
        debouncedSetStorage(storage);
      });

      textarea.addEventListener('blur', () => {
        debouncedSetStorage.flush();
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
    });
  };

  addBtn.addEventListener('click', async () => {
    storage.notes.push({
      id: Date.now().toString(),
      text: '',
      completed: false,
      timestamp: Date.now()
    });
    await setStorage(storage);
    renderNotes();
  });

  renderNotes();
}

function initFocusMode(storage) {
  const focusToggle = document.getElementById('focus-toggle');
  const focusStatus = document.getElementById('focus-status');
  let timerInterval = null;

  const updateUI = () => {
    const now = Date.now();
    const focusUntil = storage.settings.focusUntil;

    if (focusUntil && now < focusUntil) {
      focusToggle.textContent = 'End Focus';
      focusToggle.classList.add('active');
      
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
      focusToggle.textContent = 'Focus 1h';
      focusToggle.classList.remove('active');
      focusStatus.textContent = 'Normal Mode';
      clearInterval(timerInterval);
    }
  };

  focusToggle.addEventListener('click', async () => {
    if (storage.settings.focusUntil && Date.now() < storage.settings.focusUntil) {
      storage.settings.focusUntil = null;
    } else {
      storage.settings.focusUntil = Date.now() + (60 * 60 * 1000); // 1 hour
    }
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

  const createSection = (title, reminderIds) => {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    const h3 = document.createElement('h3');
    h3.textContent = title;
    h3.className = 'dashboard-section-title';
    section.appendChild(h3);

    reminderIds.forEach(id => {
      const reminder = storage.reminders[id];
      const stats = storage.stats[id];
      if (reminder) {
        section.appendChild(createReminderCard(reminder, stats));
      }
    });
    return section;
  };

  dashboard.appendChild(createSection('Wellbeing', wellbeingReminders));
  dashboard.appendChild(createSection('Work Schedule', workReminders));
}

function createReminderCard(reminder, stats) {
  const card = document.createElement('div');
  card.className = `card ${reminder.id}-card`;
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
    chrome.runtime.sendMessage({ action: 'createReminder', reminder: { ...reminder, enabled }, triggerNow: enabled });
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
      
      const isEnabled = toggleInput.checked;
      await updateReminder(reminder.id, updates);
      chrome.runtime.sendMessage({ 
        action: 'createReminder', 
        reminder: { ...reminder, ...updates, enabled: isEnabled }, 
        triggerNow: false // Only reschedule without immediate firing
      });
      
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
      renderDashboard(storage);
      
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
