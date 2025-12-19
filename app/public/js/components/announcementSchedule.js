(function (global) {
  const DEFAULTS = {
    apiPath: '/api/schedules',
    includeInactive: true,
    notifyDelayMs: 200,
    sessionPrefix: 'has_notified_',
    debug: false
  };

  function log(...args) {
    if (currentOptions.debug) console.debug('[announcementSchedule]', ...args);
  }

  let currentOptions = { ...DEFAULTS };

  function _getAppValues() {
    const app = global.__APP__ || {};
    return {
      role: app.role || app.roleKey || app.rawRole || null,
      id: app.currentUserId || app.currentUserId || app.userId || null
    };
  }

  async function _fetchSchedulesForTomorrow(role, id) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');

    const url = `${currentOptions.apiPath}?year=${year}&month=${parseInt(month)}&includeInactive=${currentOptions.includeInactive}`;
    log('Fetching schedules', url);

    const response = await fetch(url, { credentials: 'same-origin' });
    if (!response.ok) {
      log('Fetch failed', response.status);
      throw new Error(`Schedules fetch failed: ${response.status}`);
    }
    const payload = await response.json();
    const data = payload && Array.isArray(payload.data) ? payload.data : [];
    return { data, tomorrowKey: _formatDateKey(d) };
  }

  function _formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function _filterForLecturer(data, role, id) {
    if (role !== 'lecturer' || !id) return data;
    return data.filter(sch => String(sch.lecturer_id) === String(id));
  }

  function _matchScheduleForDay(sch, targetKey) {
    if (!sch) return false;
    if ((sch.deleted_dates || []).includes(targetKey)) return false;

    let isMatch = false;
    if (sch.effective_from && sch.effective_to && sch.effective_from === sch.effective_to) {
      if (sch.effective_from === targetKey) isMatch = true;
    } else {
      const tomDate = new Date(targetKey);
      const dayOfW = tomDate.getDay() === 0 ? 7 : tomDate.getDay();
      if (sch.day_of_week === dayOfW &&
        targetKey >= sch.effective_from &&
        (!sch.effective_to || targetKey <= sch.effective_to)) {
        isMatch = true;
      }
    }
    if (!isMatch) return false;
    const isException = (sch.cancelled_dates || []).includes(targetKey);
    return sch.is_active ? !isException : isException;
  }

  function _showToast(count, dateStr, targetDateKey) {
    const toast = document.createElement('div');
    toast.className = 'announcement-toast';
    toast.style.cssText = `
      position: fixed; top: 80px; right: 20px;
      background:#333;color:#fff;padding:12px 16px;border-radius:8px;
      box-shadow:0 6px 20px rgba(0,0,0,0.25);z-index:2147483647;
      display:flex;align-items:center;gap:10px;cursor:pointer;font-family:Arial,sans-serif;
    `;
    toast.innerHTML = `<i class="fa-solid fa-bell" style="color:#FFD700"></i>
      <div>Reminder: You have <strong>${count} classes</strong> tomorrow (${dateStr}). Click to view.</div>`;
    toast.onclick = () => {
      // navigate to timetable with targetDate
      const base = (currentOptions.role === 'student') ? '/student/timetable' : '/lecturer/timetable';
      window.location.href = `${base}?targetDate=${targetDateKey}`;
    };
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity = '1'; });
    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.remove();
      }
    }, 5000);
  }

  async function _runOnce(opts = {}) {
    try {
      const appVals = _getAppValues();
      const role = opts.role || appVals.role;
      const id = opts.id || appVals.id;
      currentOptions = { ...currentOptions, ...opts };

      if (role === 'assistant') {
        log('assistant role: skipping notifications');
        return;
      }
      if (!id) {
        log('no user id, skipping');
        return;
      }

      // compute tomorrowKey early
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowKey = _formatDateKey(tomorrow);
      const sessionKey = `${currentOptions.sessionPrefix}${tomorrowKey}_${id}`;

      if (sessionStorage.getItem(sessionKey)) {
        log('already notified this session', sessionKey);
        return;
      }

      const { data } = await _fetchSchedulesForTomorrow(role, id);
      let filtered = _filterForLecturer(data, role, id);
      const tomorrowSchedules = filtered.filter(sch => _matchScheduleForDay(sch, tomorrowKey));
      const count = tomorrowSchedules.length;

      if (count > 0) {
        const dateDisplay = new Date(tomorrowKey).toLocaleDateString();
        _showToast(count, dateDisplay, tomorrowKey);
        sessionStorage.setItem(sessionKey, 'true');
      } else {
        log('no classes tomorrow');
      }
    } catch (err) {
      log('error in announcementSchedule:', err);
    }
  }

  // Public API
  const instance = {
    init: function (opts) {
      currentOptions = { ...DEFAULTS, ...opts };
      // expose role for internal use if provided
      currentOptions.role = opts && opts.role ? opts.role : currentOptions.role;
      // small delay to allow page to set __APP__
      setTimeout(() => _runOnce(opts), currentOptions.notifyDelayMs);
    },
    runNow: function (opts) {
      return _runOnce(opts || {});
    },
    defaults: DEFAULTS
  };

  // expose globally
  global.announcementSchedule = instance;
})(window);