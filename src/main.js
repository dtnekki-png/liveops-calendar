/* ═══════════════════════════════════════════════════════
   LiveOps Calendar — Main Entry Point
   Async init with YAML data loading
   ═══════════════════════════════════════════════════════ */

import './styles/main.css';
import { daysInMonth, getEventBlocks, getOfferBlocks, getStaticShopBlocks } from './data.js';
import { loadAllData, clearCache } from './yamlLoader.js';
import { renderMonthNav, renderTimelineHeader, renderSection, renderAnalyticsBar, getColWidth } from './calendar.js';
import { renderCountersPanel } from './counters.js';
import { showOverlay, closeOverlay, initOverlay, setOnDataChanged } from './overlay.js';

/* ── State ── */
const state = {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    colWidth: 90,
    activePeriod: 30,
    selectedBlockId: null,
    // YAML data
    rawEvents: [],
    rawOffers: [],
    rawStaticShop: {},
    loaded: false,
};

/* ── Init (async) ── */
async function init() {
    const app = document.getElementById('app');

    // Show loading state
    app.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#94a3b8;">
            <div style="text-align:center;">
                <div style="font-size:2em;margin-bottom:12px;">⏳</div>
                <div>Загрузка данных из YAML...</div>
            </div>
        </div>
    `;

    try {
        const data = await loadAllData();
        state.rawEvents = data.events;
        state.rawOffers = data.offers;
        state.rawStaticShop = data.staticShop;
        state.loaded = true;

        // Annotate events with file names for save
        state.rawEvents.forEach(evt => {
            const fileName = guessEventFileName(evt);
            evt._fileName = `events/${fileName}.yaml`;
        });

    } catch (err) {
        app.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#f87171;">
                <div style="text-align:center;">
                    <div style="font-size:2em;margin-bottom:12px;">❌</div>
                    <div>Ошибка загрузки YAML</div>
                    <pre style="font-size:12px;margin-top:8px;color:#94a3b8;">${err.message}</pre>
                </div>
            </div>
        `;
        console.error('YAML load error:', err);
        return;
    }

    // Static overlay elements
    app.insertAdjacentHTML('beforeend', `
        <div class="overlay-backdrop" id="overlay-backdrop"></div>
        <div class="overlay-panel" id="overlay-panel"></div>
    `);

    initOverlay();
    setOnDataChanged(async () => {
        clearCache();
        try {
            const data = await loadAllData();
            state.rawEvents = data.events;
            state.rawOffers = data.offers;
            state.rawStaticShop = data.staticShop;
            state.rawEvents.forEach(evt => {
                evt._fileName = `events/${guessEventFileName(evt)}.yaml`;
            });
        } catch (e) {
            console.error('Reload error:', e);
        }
        render();
    });

    render();
    bindGlobalEvents();
}

/**
 * Guess event file name from the include list or from event data
 */
function guessEventFileName(evt) {
    // Convert numeric id + name to file name pattern: e.g. "4-vampires-event"
    const name = (evt.name || '').toLowerCase().replace(/_/g, '-');
    return `${evt.id}-${name}-event`;
}

/* ── Full Render ── */
function render() {
    const app = document.getElementById('app');

    // Preserve overlay elements
    const backdrop = document.getElementById('overlay-backdrop');
    const panel = document.getElementById('overlay-panel');

    // Get blocks for current month from YAML data
    const events = getEventBlocks(state.year, state.month, state.rawEvents);
    const offers = getOfferBlocks(state.year, state.month, state.rawOffers);
    const statics = getStaticShopBlocks(state.rawStaticShop);

    // Clamp static block endDay to actual month length
    const maxDay = daysInMonth(state.year, state.month);
    statics.forEach(b => { b.endDay = Math.min(b.endDay, maxDay); });

    const allBlocks = [...events, ...offers, ...statics];

    // Apply column width
    document.documentElement.style.setProperty('--col-width', state.colWidth + 'px');

    const html = `
    <!-- Top Bar -->
    <div class="top-bar">
      <div class="top-bar__title">Live<span>Ops</span> Calendar</div>
      <div class="top-bar__separator"></div>
      ${renderMonthNav(state.year, state.month)}
      
      <div class="zoom-control">
        <span class="zoom-control__label">Zoom</span>
        <input type="range" class="zoom-control__slider" id="zoom-slider" 
               min="40" max="200" value="${state.colWidth}" step="5" />
        <span class="zoom-control__value" id="zoom-value">${state.colWidth}px</span>
      </div>
    </div>

    <!-- Analytics Bar (shown on block select) -->
    ${renderAnalyticsBar()}

    <!-- Calendar -->
    <div class="calendar-container">
      <div class="calendar-scroll" id="calendar-scroll">
        ${renderTimelineHeader(state.year, state.month)}
        
        ${renderSection('Ивенты', 'event', events, null, true)}
        ${renderSection('Офферы', 'offer', offers, null, true)}
        ${renderSection('Магазин (статический)', 'static', statics)}
      </div>
    </div>

    <!-- Counters Panel -->
    ${renderCountersPanel(allBlocks, [], state.activePeriod)}
  `;

    // Set inner content but keep overlay
    app.innerHTML = html;
    if (backdrop) app.appendChild(backdrop);
    if (panel) app.appendChild(panel);

    // Bind events after render
    bindCalendarEvents(events, offers, statics);

    // Sync section header widths with visible scroll area
    syncScrollViewportWidth();
}

/* ── Bind Calendar Events ── */
function bindCalendarEvents(events, offers, statics) {
    // Month navigation
    document.getElementById('prev-month')?.addEventListener('click', () => {
        state.month--;
        if (state.month < 0) { state.month = 11; state.year--; }
        render();
    });

    document.getElementById('next-month')?.addEventListener('click', () => {
        state.month++;
        if (state.month > 11) { state.month = 0; state.year++; }
        render();
    });

    document.getElementById('today-btn')?.addEventListener('click', () => {
        const now = new Date();
        state.year = now.getFullYear();
        state.month = now.getMonth();
        render();
        // Scroll to today column
        requestAnimationFrame(() => {
            const todayEl = document.querySelector('.timeline-day--today');
            if (todayEl) {
                todayEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        });
    });

    // Zoom slider
    document.getElementById('zoom-slider')?.addEventListener('input', (e) => {
        state.colWidth = parseInt(e.target.value);
        document.documentElement.style.setProperty('--col-width', state.colWidth + 'px');
        document.getElementById('zoom-value').textContent = state.colWidth + 'px';
        render();
    });

    // Section collapse/expand
    document.querySelectorAll('.row-section__header').forEach(header => {
        header.addEventListener('click', (e) => {
            if (e.target.closest('.row-section__hide')) return;
            const section = header.closest('.row-section');
            section.classList.toggle('row-section--collapsed');
        });
    });

    // Section hide button
    document.querySelectorAll('.row-section__hide').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const section = btn.closest('.row-section');
            section.style.display = 'none';
        });
    });

    // Block click → drill-down
    const allDataMap = {};
    events.forEach(b => { allDataMap[b.id] = { data: b, type: 'event' }; });
    offers.forEach(b => { allDataMap[b.id] = { data: b, type: 'offer' }; });
    statics.forEach(b => { allDataMap[b.id] = { data: b, type: 'static' }; });

    document.querySelectorAll('.block-bar').forEach(bar => {
        bar.addEventListener('click', () => {
            const id = bar.dataset.blockId;
            const entry = allDataMap[id];
            if (!entry) return;

            // Deselect previous
            document.querySelectorAll('.block-bar--selected').forEach(el => el.classList.remove('block-bar--selected'));
            bar.classList.add('block-bar--selected');
            state.selectedBlockId = id;

            // Open overlay
            showOverlay(entry.data, entry.type);
        });
    });

    // "+ Новый" buttons in section headers
    document.querySelectorAll('.row-section__add').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const type = btn.dataset.addType;
            if (type) showOverlay(null, type, { editMode: true });
        });
    });

    // Period toggle
    document.querySelectorAll('.period-toggle__btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.activePeriod = parseInt(btn.dataset.period);
            document.querySelectorAll('.period-toggle__btn').forEach(b => b.classList.remove('period-toggle__btn--active'));
            btn.classList.add('period-toggle__btn--active');
        });
    });
}

/* ── Sync section header width with scroll container ── */
function syncScrollViewportWidth() {
    const scrollEl = document.getElementById('calendar-scroll');
    if (!scrollEl) return;
    document.documentElement.style.setProperty('--scroll-viewport-w', scrollEl.clientWidth + 'px');
}

/* ── Global events ── */
function bindGlobalEvents() {
    // Ctrl+scroll for zoom
    document.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -5 : 5;
            state.colWidth = Math.max(40, Math.min(200, state.colWidth + delta));
            render();
        }
    }, { passive: false });

    // Keep header width in sync on resize
    window.addEventListener('resize', syncScrollViewportWidth);

    // Initial sync
    syncScrollViewportWidth();
}

/* ── Start ── */
document.addEventListener('DOMContentLoaded', init);
