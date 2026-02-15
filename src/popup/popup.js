import { getStorage, updateReminder, setStorage } from '/src/shared/storage.js';

async function init() {
  console.log('Popup initializing...');
  try {
    const storage = await getStorage();
    if (!storage) {
      console.warn('Storage not found, extension might not be initialized');
      document.body.innerHTML = '<div style="padding:20px; text-align:center;">Extension initializing... Please wait a moment and reopen.</div>';
      return;
    }

    renderDashboard(storage);
    initFocusMode(storage);
    initNotes(storage);
    initAdvanced(storage);
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

  trigger.addEventListener('click', () => {
    section.classList.toggle('open');
  });

  masterToggle.checked = storage.settings.masterEnabled;
  masterToggle.addEventListener('change', async (e) => {
    storage.settings.masterEnabled = e.target.checked;
    await setStorage(storage);
    // Notify background
    chrome.runtime.sendMessage({ action: 'recreateAllReminders' });
  });

  exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(storage, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rhythm-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  });

  resetBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      await chrome.storage.local.clear();
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

function initNotes(storage) {
  const addBtn = document.getElementById('add-note-btn');
  const notesList = document.getElementById('notes-list');

  const renderNotes = () => {
    notesList.innerHTML = '';
    // Sort completed to bottom
    const sortedNotes = [...storage.notes].sort((a, b) => a.completed - b.completed);
    
    sortedNotes.forEach(note => {
      const item = document.createElement('div');
      item.className = `note-item ${note.completed ? 'completed' : ''}`;
      item.innerHTML = `
        <input type="checkbox" class="note-checkbox" ${note.completed ? 'checked' : ''}>
        <textarea class="note-textarea" placeholder="Note...">${note.text}</textarea>
      `;

      const textarea = item.querySelector('.note-textarea');
      const checkbox = item.querySelector('.note-checkbox');

      textarea.addEventListener('input', async (e) => {
        note.text = e.target.value;
        if (note.text.trim() === '') {
          // Auto-delete on empty will be handled separately on popup close or blur
        }
        await setStorage(storage);
      });

      textarea.addEventListener('blur', async () => {
        if (note.text.trim() === '') {
          storage.notes = storage.notes.filter(n => n.id !== note.id);
          await setStorage(storage);
          renderNotes();
        }
      });

      checkbox.addEventListener('change', async (e) => {
        note.completed = e.target.checked;
        await setStorage(storage);
        renderNotes();
      });

      notesList.appendChild(item);
    });

    if (storage.notes.length >= 50) {
      const warning = document.createElement('div');
      warning.className = 'empty-state';
      warning.textContent = 'Note limit reached (50).';
      notesList.appendChild(warning);
    }
  };

  addBtn.addEventListener('click', async () => {
    const newNote = {
      id: `note-${Date.now()}`,
      text: '',
      completed: false,
      createdAt: Date.now()
    };
    storage.notes.unshift(newNote);
    await setStorage(storage);
    renderNotes();
    // Focus the new textarea
    setTimeout(() => {
      const firstTextarea = notesList.querySelector('.note-textarea');
      if (firstTextarea) firstTextarea.focus();
    }, 0);
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
      const diff = focusUntil - now;
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      focusStatus.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
      focusToggle.textContent = 'Stop';
      focusToggle.className = 'focus-btn btn-stop';
    } else {
      focusStatus.textContent = 'Normal Mode';
      focusToggle.textContent = 'Focus 1h';
      focusToggle.className = 'focus-btn';
      if (timerInterval) clearInterval(timerInterval);
    }
  };

  focusToggle.addEventListener('click', async () => {
    const now = Date.now();
    if (storage.settings.focusUntil && now < storage.settings.focusUntil) {
      // Stop focus
      storage.settings.focusUntil = null;
    } else {
      // Start focus (1 hour)
      storage.settings.focusUntil = now + (60 * 60 * 1000);
    }
    await setStorage(storage);
    updateUI();
    if (storage.settings.focusUntil) {
      timerInterval = setInterval(updateUI, 1000);
    }
  });

  if (storage.settings.focusUntil) {
    timerInterval = setInterval(updateUI, 1000);
  }
  updateUI();
}

const ICONS = {
  water: '💧',
  posture: '🪑',
  break: '☕',
  eye: '👁️',
  stand: '🚶',
  stretch: '🤸',
  breathing: '🧘',
  workStart: '🏁',
  workLunch: '🍲',
  workEnd: '🏠'
};

function renderDashboard(storage) {
  const dashboard = document.getElementById('dashboard');
  if (!dashboard) return;
  dashboard.innerHTML = '';

  const reminderGroups = {
    wellbeing: ['water', 'posture', 'break', 'eye', 'stand', 'stretch', 'breathing'],
    work: ['workStart', 'workLunch', 'workEnd']
  };

  // Render Wellbeing Reminders
  reminderGroups.wellbeing.forEach(id => {
    const reminder = storage.reminders[id];
    const stats = storage.stats[id];
    if (reminder) {
      dashboard.appendChild(createReminderCard(reminder, stats));
    }
  });

  // Render Work Reminders
  reminderGroups.work.forEach(id => {
    const reminder = storage.reminders[id];
    if (reminder) {
      dashboard.appendChild(createReminderCard(reminder, null));
    }
  });
}

function createReminderCard(reminder, stats) {
  const card = document.createElement('div');
  card.className = `card ${reminder.id}-card`;
  
  const header = document.createElement('div');
  header.className = 'card-header';
  header.innerHTML = `
    <div class="card-icon">${ICONS[reminder.id] || '🔔'}</div>
    <div class="card-label">${reminder.id.charAt(0).toUpperCase() + reminder.id.slice(1)}</div>
    ${stats ? `<div class="card-counter">${stats.todayCount}${reminder.metadata.dailyTarget ? ` / ${reminder.metadata.dailyTarget}` : ''}</div>` : ''}
    <label class="toggle">
      <input type="checkbox" ${reminder.enabled ? 'checked' : ''}>
      <span class="slider"></span>
    </label>
  `;

  const expanded = document.createElement('div');
  expanded.className = 'card-expanded';
  
  if (reminder.type === 'interval') {
    expanded.innerHTML = `
      <div class="setting-row">
        <label>Interval (mins)</label>
        <input type="number" class="interval-input" value="${reminder.intervalMinutes}" min="5">
      </div>
      <div class="action-row">
        <button class="primary log-btn">${reminder.id === 'water' ? '+ Log' : 'Done'}</button>
      </div>
    `;
  } else {
    expanded.innerHTML = `
      <div class="setting-row">
        <label>Time</label>
        <input type="time" class="time-input" value="${reminder.timeOfDay}">
      </div>
      <div class="setting-row">
        <label>Days</label>
        <div class="weekday-selector">
          ${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => `
            <button class="day-btn ${reminder.workdays.includes(i) ? 'active' : ''}" data-day="${i}">${day}</button>
          `).join('')}
        </div>
      </div>
    `;
  }

  card.appendChild(header);
  card.appendChild(expanded);

  // Toggle Listener
  header.querySelector('input').addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    await updateReminder(reminder.id, { enabled });
    chrome.runtime.sendMessage({ action: 'createReminder', reminder: { ...reminder, enabled } });
  });

  // Expand Listener
  header.addEventListener('click', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.className === 'slider') return;
    card.classList.toggle('open');
  });

  // Interval Validation Listener
  const intervalInput = expanded.querySelector('.interval-input');
  if (intervalInput) {
    intervalInput.addEventListener('change', async (e) => {
      let value = parseInt(e.target.value);
      if (isNaN(value) || value < 5) {
        value = 5;
        e.target.value = 5;
      }
      await updateReminder(reminder.id, { intervalMinutes: value });
      if (reminder.enabled) {
        chrome.runtime.sendMessage({ action: 'createReminder', reminder: { ...reminder, intervalMinutes: value } });
      }
    });
  }

  // Time Input Listener
  const timeInput = expanded.querySelector('.time-input');
  if (timeInput) {
    timeInput.addEventListener('change', async (e) => {
      const value = e.target.value;
      await updateReminder(reminder.id, { timeOfDay: value });
      if (reminder.enabled) {
        chrome.runtime.sendMessage({ action: 'createReminder', reminder: { ...reminder, timeOfDay: value } });
      }
    });
  }

  // Weekday Toggle Listener
  const dayBtns = expanded.querySelectorAll('.day-btn');
  dayBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const day = parseInt(btn.dataset.day);
      let workdays = [...reminder.workdays];
      if (workdays.includes(day)) {
        workdays = workdays.filter(d => d !== day);
      } else {
        workdays.push(day);
      }
      await updateReminder(reminder.id, { workdays });
      btn.classList.toggle('active');
      if (reminder.enabled) {
        chrome.runtime.sendMessage({ action: 'createReminder', reminder: { ...reminder, workdays } });
      }
    });
  });

  // Log Button
  const logBtn = expanded.querySelector('.log-btn');
  if (logBtn) {
    logBtn.addEventListener('click', async () => {
      const storage = await getStorage();
      storage.stats[reminder.id].todayCount++;
      await setStorage(storage);
      renderDashboard(storage); // Re-render
      
      if (storage.stats[reminder.id].todayCount >= (reminder.metadata.dailyTarget || 0)) {
        triggerConfetti();
      }
    });
  }

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
