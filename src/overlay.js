/* ═══════════════════════════════════════════════════════
   LiveOps Calendar — Overlay Panel (Drill-down)
   ═══════════════════════════════════════════════════════ */

let currentOverlay = null;

/**
 * Show the drill-down overlay for a block or entity
 */
export function showOverlay(data, type) {
    currentOverlay = { data, type };
    const backdrop = document.getElementById('overlay-backdrop');
    const panel = document.getElementById('overlay-panel');

    panel.innerHTML = renderOverlayContent(data, type);

    requestAnimationFrame(() => {
        backdrop.classList.add('overlay-backdrop--visible');
        panel.classList.add('overlay-panel--visible');
    });

    // Close handlers
    backdrop.onclick = closeOverlay;
    panel.querySelector('.overlay-panel__close').onclick = closeOverlay;
}

/**
 * Close the overlay
 */
export function closeOverlay() {
    const backdrop = document.getElementById('overlay-backdrop');
    const panel = document.getElementById('overlay-panel');

    backdrop.classList.remove('overlay-backdrop--visible');
    panel.classList.remove('overlay-panel--visible');

    // Deselect blocks
    document.querySelectorAll('.block-bar--selected, .entity-chip--selected').forEach(el => {
        el.classList.remove('block-bar--selected', 'entity-chip--selected');
    });

    currentOverlay = null;
}

/**
 * Render overlay content based on block/entity type
 */
function renderOverlayContent(data, type) {
    if (type === 'event') return renderEventOverlay(data);
    if (type === 'static') return renderStaticOverlay(data);
    if (type === 'static-dynamic') return renderStaticDynamicOverlay(data);
    if (type === 'entity') return renderEntityOverlay(data);
    return '<div class="overlay-panel__body"><p>Неизвестный тип</p></div>';
}

/* ── Event Block Overlay ── */
function renderEventOverlay(block) {
    return `
    <div class="overlay-panel__header">
      <div class="overlay-panel__title">${block.name}</div>
      <button class="overlay-panel__close">✕</button>
    </div>
    <div class="overlay-panel__body">
      <div class="detail-section">
        <div class="detail-section__title">Общая информация</div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-item__label">Тип</span>
            <span class="detail-item__value">Ивент</span>
          </div>
          <div class="detail-item">
            <span class="detail-item__label">Период</span>
            <span class="detail-item__value detail-item__value--mono">День ${block.startDay} — ${block.endDay}</span>
          </div>
          <div class="detail-item">
            <span class="detail-item__label">Час запуска</span>
            <span class="detail-item__value">${block.daytime === 'night' ? '🌙 Ночное (03:00)' : '☀️ Дневное (14:00)'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-item__label">Состав</span>
            <span class="detail-item__value">${block.composition || '—'}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">Скелет & Скин</div>
        <div class="skeleton-skin">
          <div class="skeleton-skin__section skeleton-skin__section--skeleton">
            <div class="skeleton-skin__label">Скелет</div>
            <div class="skeleton-skin__value">${block.skeleton}</div>
          </div>
          <div class="skeleton-skin__section skeleton-skin__section--skin">
            <div class="skeleton-skin__label">Скин</div>
            <div class="skeleton-skin__value">${block.skin}</div>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">Аналитика блока</div>
        <div class="detail-grid">
          ${block.metrics ? Object.entries(block.metrics).map(([key, val]) => `
            <div class="detail-item">
              <span class="detail-item__label">${formatMetricLabel(key)}</span>
              <span class="detail-item__value detail-item__value--mono detail-item__value--${metricColor(key)}">${val}</span>
            </div>
          `).join('') : '<p class="text-muted">Нет данных</p>'}
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">Теги</div>
        <div class="tags-line">
          ${(block.tags || []).map(t => `<span class="tag-chip">${t}</span>`).join('')}
        </div>
      </div>
    </div>

    <div class="overlay-panel__actions">
      <button class="btn btn--primary" onclick="navigator.clipboard.writeText(JSON.stringify(${JSON.stringify(block).replace(/"/g, '&quot;')}, null, 2))">
        📋 Копировать блок
      </button>
      <button class="btn btn--ghost">✏️ Редактировать</button>
    </div>
  `;
}

/* ── Static Block Overlay ── */
function renderStaticOverlay(block) {
    return `
    <div class="overlay-panel__header">
      <div class="overlay-panel__title">${block.name}</div>
      <button class="overlay-panel__close">✕</button>
    </div>
    <div class="overlay-panel__body">
      <div class="detail-section">
        <div class="detail-section__title">Общая информация</div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-item__label">Тип</span>
            <span class="detail-item__value">Статичный блок</span>
          </div>
          <div class="detail-item">
            <span class="detail-item__label">Группа</span>
            <span class="detail-item__value">${block.group || '—'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-item__label">Период</span>
            <span class="detail-item__value detail-item__value--mono">День ${block.startDay} — ${block.endDay}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">Теги</div>
        <div class="tags-line">
          ${(block.tags || []).map(t => `<span class="tag-chip">${t}</span>`).join('')}
        </div>
      </div>
    </div>

    <div class="overlay-panel__actions">
      <button class="btn btn--primary" onclick="navigator.clipboard.writeText(JSON.stringify(${JSON.stringify(block).replace(/"/g, '&quot;')}, null, 2))">
        📋 Копировать блок
      </button>
      <button class="btn btn--ghost">✏️ Редактировать</button>
    </div>
  `;
}

/* ── Static-Dynamic Block Overlay ── */
function renderStaticDynamicOverlay(block) {
    return `
    <div class="overlay-panel__header">
      <div class="overlay-panel__title">${block.name}</div>
      <button class="overlay-panel__close">✕</button>
    </div>
    <div class="overlay-panel__body">
      <div class="detail-section">
        <div class="detail-section__title">Общая информация</div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-item__label">Тип</span>
            <span class="detail-item__value">Статико-динамический</span>
          </div>
          <div class="detail-item">
            <span class="detail-item__label">Период</span>
            <span class="detail-item__value detail-item__value--mono">День ${block.startDay} — ${block.endDay}</span>
          </div>
          <div class="detail-item">
            <span class="detail-item__label">Час запуска</span>
            <span class="detail-item__value">${block.daytime === 'night' ? '🌙 Ночное (03:00)' : '☀️ Дневное (14:00)'}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">Скелет & Скин</div>
        <div class="skeleton-skin">
          <div class="skeleton-skin__section skeleton-skin__section--skeleton">
            <div class="skeleton-skin__label">Скелет</div>
            <div class="skeleton-skin__value">${block.skeleton}</div>
          </div>
          <div class="skeleton-skin__section skeleton-skin__section--skin">
            <div class="skeleton-skin__label">Скин</div>
            <div class="skeleton-skin__value">${block.skin}</div>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">Модульные поля</div>
        <div class="detail-grid">
          ${Object.entries(block.modules || {}).map(([key, mod]) => `
            <div class="detail-item">
              <span class="detail-item__label">${mod.label} ${mod.enabled ? '✅' : '⬜'}</span>
              <span class="detail-item__value detail-item__value--mono ${mod.enabled ? '' : 'text-muted'}">${mod.value}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">Теги</div>
        <div class="tags-line">
          ${(block.tags || []).map(t => `<span class="tag-chip">${t}</span>`).join('')}
        </div>
      </div>
    </div>

    <div class="overlay-panel__actions">
      <button class="btn btn--primary" onclick="navigator.clipboard.writeText(JSON.stringify(${JSON.stringify(block).replace(/"/g, '&quot;')}, null, 2))">
        📋 Копировать блок
      </button>
      <button class="btn btn--ghost">✏️ Редактировать</button>
    </div>
  `;
}

/* ── Entity Overlay ── */
function renderEntityOverlay(entity) {
    return `
    <div class="overlay-panel__header">
      <div class="overlay-panel__title">${entity.entityType} — ${entity.label}</div>
      <button class="overlay-panel__close">✕</button>
    </div>
    <div class="overlay-panel__body">
      <div class="detail-section">
        <div class="detail-section__title">Сущность</div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-item__label">Тип</span>
            <span class="detail-item__value detail-item__value--accent">${entity.entityType}</span>
          </div>
          <div class="detail-item">
            <span class="detail-item__label">Описание</span>
            <span class="detail-item__value">${entity.label}</span>
          </div>
          <div class="detail-item">
            <span class="detail-item__label">Ценовая категория</span>
            <span class="detail-item__value ${entity.price === 'expensive' ? 'text-danger' : 'text-success'}">${entity.price === 'expensive' ? 'Дорогой' : 'Стандарт'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-item__label">Идентификатор</span>
            <span class="detail-item__value detail-item__value--mono">${entity.identifier}</span>
          </div>
          <div class="detail-item">
            <span class="detail-item__label">Период</span>
            <span class="detail-item__value detail-item__value--mono">День ${entity.startDay} — ${entity.endDay}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="overlay-panel__actions">
      <button class="btn btn--ghost">✏️настройка сущности</button>
    </div>
  `;
}

/* ── Helpers ── */
function formatMetricLabel(key) {
    const map = { rev: 'Revenue', arpu: 'ARPU', us: 'Unique Sessions', sfr: 'sFR' };
    return map[key] || key;
}

function metricColor(key) {
    if (key === 'rev') return 'success';
    if (key === 'arpu') return 'accent';
    return '';
}

/**
 * Init overlay: add ESC key handler
 */
export function initOverlay() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentOverlay) {
            closeOverlay();
        }
    });
}
