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
    const sortedNotes = [...storage.notes].sort((a, b) => a.completed - b.completed);
    
    sortedNotes.forEach((note, index) => {
      const item = document.createElement('div');
      item.className = `note-item ${note.completed ? 'completed' : ''}`;
      item.innerHTML = `
        <input type="checkbox" class="note-checkbox" ${note.completed ? 'checked' : ''}>
        <textarea class="note-textarea" placeholder="Note...">${note.text}</textarea>
        <button class="delete-note-btn icon-btn">×</button>
      `;

      const checkbox = item.querySelector('.note-checkbox');
      const textarea = item.querySelector('.note-textarea');
      const deleteBtn = item.querySelector('.delete-note-btn');

      checkbox.addEventListener('change', async () => {
        note.completed = checkbox.checked;
        await setStorage(storage);
        renderNotes();
      });

      textarea.addEventListener('input', async () => {
        note.text = textarea.value;
        await setStorage(storage);
      });

      deleteBtn.addEventListener('click', async () => {
        storage.notes = storage.notes.filter(n => n.id !== note.id);
        await setStorage(storage);
        renderNotes();
      });

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

  const wellbeingReminders = ['water', 'posture', 'break', 'eye', 'stand', 'stretch', 'breathing'];
  const workReminders = ['workStart', 'workLunch', 'workEnd'];

  const sectionH3 = (title) => {
    const h3 = document.createElement('h3');
    h3.textContent = title;
    h3.className = 'dashboard-section-title';
    return h3;
  };

  dashboard.appendChild(sectionH3('Wellbeing Reminders'));
  wellbeingReminders.forEach(id => {
    const reminder = storage.reminders[id];
    const stats = storage.stats[id];
    if (reminder) dashboard.appendChild(createReminderCard(reminder, stats));
  });

  dashboard.appendChild(sectionH3('Work Reminders'));
  workReminders.forEach(id => {
    const reminder = storage.reminders[id];
    if (reminder) dashboard.appendChild(createReminderCard(reminder, null));
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
        <input type="number" class="interval-input" value="${reminder.intervalMinutes}" min="1">
      </div>
      <div class="action-row">
        <button class="primary log-btn">${reminder.id === 'water' ? '+ Log' : 'Done'}</button>
        <button class="secondary save-btn">Save</button>
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
      <div class="action-row">
        <button class="secondary save-btn">Save</button>
      </div>
    `;
  }

  card.appendChild(header);
  card.appendChild(expanded);

  // Toggle Listener
  header.querySelector('input').addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    await updateReminder(reminder.id, { enabled });
    chrome.runtime.sendMessage({ action: 'createReminder', reminder: { ...reminder, enabled }, triggerNow: enabled });
  });

  // Expand Listener
  header.addEventListener('click', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.className === 'slider' || e.target.className.includes('btn') || e.target.tagName === 'BUTTON') return;
    card.classList.toggle('open');
  });

  // Save Button Listener
  const saveBtn = expanded.querySelector('.save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const updates = {};
      if (reminder.type === 'interval') {
        const input = expanded.querySelector('.interval-input');
        updates.intervalMinutes = Math.max(1, parseInt(input.value) || 1);
        input.value = updates.intervalMinutes;
      } else {
        updates.timeOfDay = expanded.querySelector('.time-input').value;
        const activeDays = Array.from(expanded.querySelectorAll('.day-btn.active')).map(btn => parseInt(btn.dataset.day));
        updates.workdays = activeDays;
      }
      
      await updateReminder(reminder.id, updates);
      chrome.runtime.sendMessage({ 
        action: 'createReminder', 
        reminder: { ...reminder, ...updates, enabled: true }, 
        triggerNow: true 
      });
      
      const originalText = saveBtn.textContent;
      saveBtn.textContent = 'Saved!';
      setTimeout(() => saveBtn.textContent = originalText, 1500);
    });
  }

  // Day Button Listener (Fixed Time)
  expanded.querySelectorAll('.day-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
    });
  });

  // Log Button
  const logBtn = expanded.querySelector('.log-btn');
  if (logBtn) {
    logBtn.addEventListener('click', async () => {
      const storage = await getStorage();
      storage.stats[reminder.id].todayCount++;
      await setStorage(storage);
      renderDashboard(storage);
      
      if (stats && storage.stats[reminder.id].todayCount >= (reminder.metadata.dailyTarget || 0)) {
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
