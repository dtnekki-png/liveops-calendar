/* ═══════════════════════════════════════════════════════
   LiveOps Calendar — Core Calendar Renderer
   ═══════════════════════════════════════════════════════ */

import { daysInMonth } from './data.js';
import { renderEventBlock, renderStaticBlock, renderStaticDynamicBlock, renderEntityChip } from './blocks.js';
import { getHolidaysForMonth } from './holidays.js';

const WEEKDAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

/**
 * Get current column width from CSS variable
 */
export function getColWidth() {
  return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--col-width'));
}

/**
 * Render the month navigation in the top bar
 */
export function renderMonthNav(year, month) {
  return `
    <div class="month-nav">
      <button class="month-nav__btn" id="prev-month">◀</button>
      <span class="month-nav__label" id="month-label">${MONTH_NAMES[month]} ${year}</span>
      <button class="month-nav__btn" id="next-month">▶</button>
      <button class="month-nav__today" id="today-btn">Сегодня</button>
    </div>
  `;
}

/**
 * Render the timeline header with real calendar dates
 */
export function renderTimelineHeader(year, month) {
  const numDays = daysInMonth(year, month);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();
  const holidays = getHolidaysForMonth(year, month);

  let daysHtml = '';
  for (let d = 1; d <= numDays; d++) {
    const date = new Date(year, month, d);
    const weekday = date.getDay(); // 0=Sun
    const isToday = isCurrentMonth && d === todayDate;
    const isWeekend = weekday === 0 || weekday === 6;
    const dayHolidays = holidays.get(d);

    let classes = 'timeline-day';
    if (isToday) classes += ' timeline-day--today';
    if (isWeekend) classes += ' timeline-day--weekend';
    if (dayHolidays) classes += ' timeline-day--holiday';

    // Holiday indicator HTML
    let holidayHtml = '';
    if (dayHolidays) {
      const icons = dayHolidays.map(h => h.icon).join('');
      const tooltipLines = dayHolidays.map(h => `${h.icon} ${h.name}`).join('\n');
      holidayHtml = `<div class="timeline-day__holiday" title="${tooltipLines}">${icons}</div>`;
    }

    daysHtml += `
      <div class="${classes}" data-day="${d}">
        ${holidayHtml}
        <div class="timeline-day__weekday">${WEEKDAY_NAMES[weekday]}</div>
        <div class="timeline-day__number">${String(d).padStart(2, '0')}</div>
      </div>
    `;
  }

  return `
    <div class="timeline-header">
      <div class="timeline-header__sidebar">Блоки / Дни</div>
      <div class="timeline-header__days">
        ${daysHtml}
      </div>
    </div>
  `;
}

/**
 * Render a section with rows
 */
export function renderSection(title, type, blocks, entityRows) {
  const blockCount = blocks ? blocks.length : (entityRows ? entityRows.flat().length : 0);
  const colWidth = getColWidth();

  let contentHtml = '';

  if (type === 'entities' && entityRows) {
    // Dynamic entities: multiple rows
    entityRows.forEach((rowEntities, ri) => {
      contentHtml += `
        <div class="calendar-row entity-row">
          <div class="calendar-row__sidebar">
            <span class="calendar-row__sidebar-name">Ряд ${ri + 1}</span>
          </div>
          <div class="calendar-row__cells" style="position:relative; height:44px;">
            ${rowEntities.map(e => renderEntityChip(e, colWidth)).join('')}
          </div>
        </div>
      `;
    });
  } else if (blocks) {
    // Group blocks by name or render individually
    blocks.forEach(block => {
      const renderer = type === 'event' ? renderEventBlock :
        type === 'static' ? renderStaticBlock :
          renderStaticDynamicBlock;

      contentHtml += `
        <div class="calendar-row">
          <div class="calendar-row__sidebar">
            <span class="calendar-row__sidebar-name">${block.name}</span>
          </div>
          <div class="calendar-row__cells" style="position:relative;">
            ${renderer(block, colWidth)}
          </div>
        </div>
      `;
    });
  }

  return `
    <div class="row-section" data-section-type="${type}">
      <div class="row-section__header">
        <span class="row-section__chevron">▼</span>
        <span class="row-section__title">${title}</span>
        <span class="row-section__badge">${blockCount}</span>
        <button class="row-section__hide" title="Скрыть секцию">✕</button>
      </div>
      <div class="row-section__content">
        ${contentHtml}
      </div>
    </div>
  `;
}

/**
 * Render the analytics bar (hidden by default, shown on block selection)
 */
export function renderAnalyticsBar() {
  return `
    <div class="analytics-bar" id="analytics-bar">
      <div class="analytics-bar__item">
        <span class="analytics-bar__label">Rev</span>
        <span class="analytics-bar__value" id="ab-rev">—</span>
      </div>
      <div class="analytics-bar__sep"></div>
      <div class="analytics-bar__item">
        <span class="analytics-bar__label">ARPDAU</span>
        <span class="analytics-bar__value" id="ab-arpdau">—</span>
      </div>
      <div class="analytics-bar__sep"></div>
      <div class="analytics-bar__item">
        <span class="analytics-bar__label">US</span>
        <span class="analytics-bar__value" id="ab-us">—</span>
      </div>
      <div class="analytics-bar__sep"></div>
      <div class="analytics-bar__item">
        <span class="analytics-bar__label">PUS</span>
        <span class="analytics-bar__value" id="ab-pus">—</span>
      </div>
    </div>
  `;
}
