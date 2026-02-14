/* ═══════════════════════════════════════════════════════
   LiveOps Calendar — Date Picker Component
   Inline calendar popover for date/datetime fields
   ═══════════════════════════════════════════════════════ */

const MONTH_NAMES = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];
const WEEKDAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

let activePicker = null;

/**
 * Initialize date picker: attach global close handler
 */
export function initDatePicker() {
    document.addEventListener('click', (e) => {
        if (activePicker && !activePicker.contains(e.target) && !e.target.closest('.dp-trigger')) {
            closeDatePicker();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activePicker) {
            closeDatePicker();
        }
    });
}

/**
 * Open date picker attached to a trigger element
 * @param {HTMLElement} triggerEl - the input or button that triggered it
 * @param {string} currentValue - current ISO date string
 * @param {boolean} includeTime - whether to show time picker
 * @param {function} onSelect - callback(isoString) when date selected
 */
export function openDatePicker(triggerEl, currentValue, includeTime, onSelect) {
    closeDatePicker();

    const parsed = parseInputDate(currentValue);
    const state = {
        viewYear: parsed.year,
        viewMonth: parsed.month,
        selectedDate: parsed,
        includeTime,
        onSelect,
        triggerEl,
    };

    const picker = document.createElement('div');
    picker.className = 'dp-popover';
    activePicker = picker;

    renderPicker(picker, state);
    positionPicker(picker, triggerEl);
    document.body.appendChild(picker);

    requestAnimationFrame(() => picker.classList.add('dp-popover--visible'));
}

/**
 * Close the active date picker
 */
export function closeDatePicker() {
    if (activePicker) {
        activePicker.remove();
        activePicker = null;
    }
}

/* ── Internal ── */

function parseInputDate(str) {
    if (!str) {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate(), hours: 0, minutes: 0, tz: '+03:00' };
    }
    try {
        // Normalize timezone: "+03" → "+03:00"
        const normalized = str.replace(/([+-]\d{2})(?::?(\d{2}))?$/, (_, h, m) => `${h}:${m || '00'}`);
        // Extract original tz from string
        const tzMatch = str.match(/([+-]\d{2}(?::?\d{2})?)$/);
        const tz = tzMatch ? tzMatch[1].replace(/^([+-]\d{2})$/, '$1:00') : '+03:00';

        const d = new Date(normalized);
        if (!isNaN(d.getTime())) {
            return {
                year: d.getFullYear(),
                month: d.getMonth(),
                day: d.getDate(),
                hours: d.getHours(),
                minutes: d.getMinutes(),
                tz,
            };
        }
    } catch (e) { /* fallback */ }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate(), hours: 0, minutes: 0, tz: '+03:00' };
}

function formatOutput(state) {
    const { selectedDate, includeTime } = state;
    const d = selectedDate;
    const pad = (n) => String(n).padStart(2, '0');
    if (includeTime) {
        return `${d.year}-${pad(d.month + 1)}-${pad(d.day)}T${pad(d.hours)}:${pad(d.minutes)}:00.000${d.tz}`;
    }
    return `${d.year}-${pad(d.month + 1)}-${pad(d.day)}`;
}

function renderPicker(el, state) {
    const { viewYear, viewMonth, selectedDate, includeTime } = state;

    // Calendar grid data
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    let startWeekday = firstDayOfMonth.getDay(); // 0=Sun
    startWeekday = startWeekday === 0 ? 6 : startWeekday - 1; // Convert to Mon=0
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const today = new Date();
    const isToday = (d) => today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === d;
    const isSelected = (d) => selectedDate.year === viewYear && selectedDate.month === viewMonth && selectedDate.day === d;

    // Build day cells
    let dayCells = '';
    // Empty leading cells
    for (let i = 0; i < startWeekday; i++) {
        dayCells += '<div class="dp-day dp-day--empty"></div>';
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const dayOfWeek = (startWeekday + d - 1) % 7;
        const isWknd = dayOfWeek >= 5;
        let cls = 'dp-day';
        if (isToday(d)) cls += ' dp-day--today';
        if (isSelected(d)) cls += ' dp-day--selected';
        if (isWknd) cls += ' dp-day--weekend';
        dayCells += `<div class="${cls}" data-day="${d}">${d}</div>`;
    }

    // Time picker
    let timeHtml = '';
    if (includeTime) {
        const hourOptions = Array.from({ length: 24 }, (_, i) => {
            const sel = i === selectedDate.hours ? 'selected' : '';
            return `<option value="${i}" ${sel}>${String(i).padStart(2, '0')}</option>`;
        }).join('');
        const minOptions = [0, 15, 30, 45].map(m => {
            const sel = m === selectedDate.minutes ? 'selected' : '';
            return `<option value="${m}" ${sel}>${String(m).padStart(2, '0')}</option>`;
        }).join('');

        timeHtml = `
      <div class="dp-time">
        <span class="dp-time__label">⏰</span>
        <select class="dp-time__select" data-field="hours">${hourOptions}</select>
        <span class="dp-time__colon">:</span>
        <select class="dp-time__select" data-field="minutes">${minOptions}</select>
      </div>`;
    }

    el.innerHTML = `
    <div class="dp-header">
      <button class="dp-nav" data-dir="-1">◀</button>
      <span class="dp-title">${MONTH_NAMES[viewMonth]} ${viewYear}</span>
      <button class="dp-nav" data-dir="1">▶</button>
    </div>
    <div class="dp-weekdays">
      ${WEEKDAY_SHORT.map(w => `<div class="dp-weekday">${w}</div>`).join('')}
    </div>
    <div class="dp-grid">
      ${dayCells}
    </div>
    ${timeHtml}
    <div class="dp-footer">
      <button class="dp-today-btn">Сегодня</button>
      <button class="dp-apply-btn">Применить</button>
    </div>
  `;

    // Bind events
    el.querySelectorAll('.dp-nav').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const dir = parseInt(btn.dataset.dir);
            state.viewMonth += dir;
            if (state.viewMonth < 0) { state.viewMonth = 11; state.viewYear--; }
            if (state.viewMonth > 11) { state.viewMonth = 0; state.viewYear++; }
            renderPicker(el, state);
        });
    });

    el.querySelectorAll('.dp-day[data-day]').forEach(cell => {
        cell.addEventListener('click', (e) => {
            e.stopPropagation();
            state.selectedDate = {
                ...state.selectedDate,
                year: state.viewYear,
                month: state.viewMonth,
                day: parseInt(cell.dataset.day),
            };
            renderPicker(el, state);
        });
    });

    el.querySelectorAll('.dp-time__select').forEach(sel => {
        sel.addEventListener('change', (e) => {
            e.stopPropagation();
            state.selectedDate[sel.dataset.field] = parseInt(sel.value);
        });
    });

    el.querySelector('.dp-today-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const now = new Date();
        state.viewYear = now.getFullYear();
        state.viewMonth = now.getMonth();
        state.selectedDate = {
            ...state.selectedDate,
            year: now.getFullYear(),
            month: now.getMonth(),
            day: now.getDate(),
        };
        renderPicker(el, state);
    });

    el.querySelector('.dp-apply-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const output = formatOutput(state);
        if (state.onSelect) state.onSelect(output);
        // Update trigger input
        if (state.triggerEl) {
            const input = state.triggerEl.closest('.editor-field')?.querySelector('.editor-field__input') || state.triggerEl;
            if (input.tagName === 'INPUT') input.value = output;
        }
        closeDatePicker();
    });
}

function positionPicker(picker, trigger) {
    // Position below the trigger element
    const rect = trigger.getBoundingClientRect();
    const top = rect.bottom + 6;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - 300));

    picker.style.position = 'fixed';
    picker.style.top = top + 'px';
    picker.style.left = left + 'px';
    picker.style.zIndex = '500';

    // If picker would go off-screen bottom, position above
    requestAnimationFrame(() => {
        const pickerRect = picker.getBoundingClientRect();
        if (pickerRect.bottom > window.innerHeight - 10) {
            picker.style.top = (rect.top - pickerRect.height - 6) + 'px';
        }
    });
}
