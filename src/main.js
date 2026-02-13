/* ═══════════════════════════════════════════════════════
   LiveOps Calendar — Main Entry Point
   ═══════════════════════════════════════════════════════ */

import './styles/main.css';
import { getEventBlocks, getStaticBlocks, getStaticDynamicBlocks, getDynamicEntities } from './data.js';
import { renderMonthNav, renderTimelineHeader, renderSection, renderAnalyticsBar, getColWidth } from './calendar.js';
import { renderCountersPanel } from './counters.js';
import { showOverlay, closeOverlay, initOverlay } from './overlay.js';

/* ── State ── */
const state = {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    colWidth: 90,
    activePeriod: 30,
    selectedBlockId: null,
};

/* ── Init ── */
function init() {
    const app = document.getElementById('app');

    // Static overlay elements
    app.insertAdjacentHTML('beforeend', `
    <div class="overlay-backdrop" id="overlay-backdrop"></div>
    <div class="overlay-panel" id="overlay-panel"></div>
  `);

    initOverlay();
    render();
    bindGlobalEvents();
}

/* ── Full Render ── */
function render() {
    const app = document.getElementById('app');

    // Preserve overlay elements
    const backdrop = document.getElementById('overlay-backdrop');
    const panel = document.getElementById('overlay-panel');

    // Get data for current month
    const events = getEventBlocks(state.year, state.month);
    const statics = getStaticBlocks(state.year, state.month);
    const staticDynamic = getStaticDynamicBlocks(state.year, state.month);
    const entities = getDynamicEntities(state.year, state.month);
    const allBlocks = [...events, ...statics, ...staticDynamic];

    // Group entities by row
    const entityRows = [];
    entities.forEach(e => {
        if (!entityRows[e.row]) entityRows[e.row] = [];
        entityRows[e.row].push(e);
    });

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
        
        ${renderSection('Ивенты', 'event', events)}
        ${renderSection('Статичные блоки', 'static', statics)}
        ${renderSection('Статико-динамические', 'static-dynamic', staticDynamic)}
        ${renderSection('Динамические сущности', 'entities', null, entityRows)}
      </div>
    </div>

    <!-- Counters Panel -->
    ${renderCountersPanel(allBlocks, entities, state.activePeriod)}
  `;

    // Set inner content but keep overlay
    app.innerHTML = html;
    app.appendChild(backdrop);
    app.appendChild(panel);

    // Bind events after render
    bindCalendarEvents(events, statics, staticDynamic, entities);

    // Sync section header widths with visible scroll area
    syncScrollViewportWidth();
}

/* ── Bind Calendar Events ── */
function bindCalendarEvents(events, statics, staticDynamic, entities) {
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

        // Re-render block positions (they use absolute px)
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
    statics.forEach(b => { allDataMap[b.id] = { data: b, type: 'static' }; });
    staticDynamic.forEach(b => { allDataMap[b.id] = { data: b, type: 'static-dynamic' }; });

    document.querySelectorAll('.block-bar').forEach(bar => {
        bar.addEventListener('click', () => {
            const id = bar.dataset.blockId;
            const entry = allDataMap[id];
            if (!entry) return;

            // Deselect previous
            document.querySelectorAll('.block-bar--selected').forEach(el => el.classList.remove('block-bar--selected'));
            bar.classList.add('block-bar--selected');
            state.selectedBlockId = id;

            // Show analytics bar
            updateAnalyticsBar(entry.data);

            // Open overlay
            showOverlay(entry.data, entry.type);
        });
    });

    // Entity chip click → drill-down
    const entityMap = {};
    entities.forEach(e => { entityMap[e.id] = e; });

    document.querySelectorAll('.entity-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const id = chip.dataset.entityId;
            const entity = entityMap[id];
            if (!entity) return;

            document.querySelectorAll('.entity-chip--selected').forEach(el => el.classList.remove('entity-chip--selected'));
            chip.classList.add('entity-chip--selected');

            showOverlay(entity, 'entity');
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

/* ── Update analytics bar on selection ── */
function updateAnalyticsBar(block) {
    const bar = document.getElementById('analytics-bar');
    if (!bar) return;

    bar.classList.add('analytics-bar--visible');

    const metrics = block.metrics || {};
    document.getElementById('ab-rev').textContent = metrics.rev || '—';
    document.getElementById('ab-arpdau').textContent = metrics.arpu || '—';
    document.getElementById('ab-us').textContent = metrics.us || '—';
    document.getElementById('ab-pus').textContent = metrics.sfr || '—';
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
