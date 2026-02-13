/* ═══════════════════════════════════════════════════════
   LiveOps Calendar — Counters Panel
   ═══════════════════════════════════════════════════════ */

/**
 * Render the counters panel at the bottom
 */
export function renderCountersPanel(allBlocks, allEntities, activePeriod) {
    const totalSets = allEntities.filter(e =>
        e.entityType === 'G3T1' || e.entityType === 'G3T10'
    ).length;

    const totalBlocks = allBlocks.length;
    const totalEvents = allBlocks.filter(b => b.type === 'event').length;

    return `
    <div class="counters-panel">
      <div class="counter-group">
        <div class="counter-item">
          <span class="counter-item__value">${totalBlocks}</span>
          <span class="counter-item__label">Всего блоков</span>
        </div>
        <div class="counter-item">
          <span class="counter-item__value text-accent">${totalEvents}</span>
          <span class="counter-item__label">Ивентов</span>
        </div>
        <div class="counter-item">
          <span class="counter-item__value text-success">${totalSets}</span>
          <span class="counter-item__label">Сэтов (от 15-го)</span>
        </div>
        <div class="counter-item">
          <span class="counter-item__value">${allEntities.length}</span>
          <span class="counter-item__label">Сущностей</span>
        </div>
      </div>

      <div class="counter-separator"></div>

      <div class="counter-group">
        <span class="counter-item__label" style="margin-right:4px">Период:</span>
        <div class="period-toggle">
          <button class="period-toggle__btn ${activePeriod === 30 ? 'period-toggle__btn--active' : ''}" data-period="30">±30 дн</button>
          <button class="period-toggle__btn ${activePeriod === 60 ? 'period-toggle__btn--active' : ''}" data-period="60">±60 дн</button>
        </div>
      </div>
    </div>
  `;
}
