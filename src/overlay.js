/* ═══════════════════════════════════════════════════════
   LiveOps Calendar — Overlay Panel (Drill-down)
   Full YAML data display with edit/view mode,
   date picker integration, create new, delete
   ═══════════════════════════════════════════════════════ */

import { renderField, renderLootTable, renderScheduleEditor, renderQuestSlotsEditor, renderEventOffers, collectFormData, saveToYaml, duplicateItem } from './editor.js';
import { openDatePicker, initDatePicker } from './datePicker.js';

let currentOverlay = null;
let onDataChanged = null;
let editMode = false;

/**
 * Set callback for when data is saved/duplicated
 */
export function setOnDataChanged(cb) {
  onDataChanged = cb;
}

/**
 * Show the drill-down overlay for a block or entity
 * @param {object|null} data - block data, or null for new item
 * @param {string} type - 'event', 'offer', 'static', 'entity'
 * @param {object} opts - { editMode: boolean }
 */
export function showOverlay(data, type, opts = {}) {
  editMode = opts.editMode || false;
  currentOverlay = { data, type, isNew: !data };

  // For new items, generate template
  if (!data) {
    data = generateTemplate(type);
    currentOverlay.data = data;
  }

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

  // Bind action buttons
  bindOverlayActions(panel, data, type);

  // Bind date pickers
  bindDatePickers(panel);

  // Apply edit mode visuals
  applyEditMode(panel);
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

  editMode = false;
  currentOverlay = null;
}

/**
 * Generate a blank template for creating new items
 */
function generateTemplate(type) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const startStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T00:00:00.000+03`;
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 14);
  const endStr = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T23:59:00.000+03`;

  if (type === 'event') {
    return {
      id: `evt-new-${Date.now()}`,
      type: 'event',
      name: 'NEW_EVENT',
      _yamlData: {
        id: Math.floor(Math.random() * 9000) + 1000,
        name: 'NEW_EVENT',
        schedule: [{ start: startStr, end: endStr }],
        eventCurrencies: {},
        rollPricing: {},
        lootPerRoll: [],
        questSlots: [],
        offers: [],
      },
      _scheduleWindow: { start: startStr, end: endStr },
      _fileName: 'events/new-event.yaml',
      startDay: now.getDate(),
      endDay: endDate.getDate(),
    };
  }

  if (type === 'offer') {
    return {
      id: `offer-new-${Date.now()}`,
      type: 'offer',
      name: 'New Offer',
      _yamlData: {
        id: Math.floor(Math.random() * 9000) + 1000,
        type: 'STANDARD',
        count: 1,
        startDate: startStr,
        endDate: endStr,
        shopItem: {
          id: Math.floor(Math.random() * 9000) + 1000,
          category: 'DEFAULT',
          payment: {},
          loot: [],
          uiData: {},
        },
      },
      startDay: now.getDate(),
      endDay: endDate.getDate(),
    };
  }

  return { _yamlData: {} };
}

/**
 * Render overlay content based on block type
 */
function renderOverlayContent(data, type) {
  if (type === 'event') return renderEventOverlay(data);
  if (type === 'offer') return renderOfferOverlay(data);
  if (type === 'static') return renderStaticShopOverlay(data);
  if (type === 'entity') return renderEntityOverlay(data);
  return '<div class="overlay-panel__body"><p>Неизвестный тип</p></div>';
}

/**
 * Apply edit mode visuals
 */
function applyEditMode(panel) {
  if (editMode) {
    panel.classList.add('overlay-panel--editing');
  } else {
    panel.classList.remove('overlay-panel--editing');
  }

  // Toggle readonly on inputs
  panel.querySelectorAll('.editor-field__input').forEach(input => {
    if (input.dataset.path === 'id' || input.closest('[data-readonly="true"]')) return;
    if (input.classList.contains('editor-field__input--date')) {
      // Date fields are always readonly (edited via picker)
      return;
    }
    if (editMode) {
      input.removeAttribute('readonly');
      input.removeAttribute('disabled');
    } else {
      if (input.tagName === 'SELECT') {
        input.setAttribute('disabled', '');
      } else {
        input.setAttribute('readonly', '');
      }
    }
  });

  // Show/hide date picker triggers
  panel.querySelectorAll('.dp-trigger').forEach(btn => {
    btn.style.display = editMode ? '' : 'none';
  });
}

/**
 * Render edit mode toggle + header controls
 */
function renderEditToggle() {
  return `
    <button class="overlay-mode-toggle" id="overlay-mode-toggle" title="${editMode ? 'Переключить в просмотр' : 'Переключить в редактирование'}">
      ${editMode ? '👁 Просмотр' : '✏️ Редакт.'}
    </button>
  `;
}

/**
 * Render action buttons based on edit mode
 */
function renderActionButtons(yaml, isNew = false) {
  if (editMode) {
    return `
      <div class="overlay-panel__actions">
        <button class="btn btn--primary" id="overlay-save-btn">💾 ${isNew ? 'Создать' : 'Сохранить'}</button>
        ${!isNew ? '<button class="btn btn--danger" id="overlay-delete-btn">🗑 Удалить</button>' : ''}
        <button class="btn btn--ghost" id="overlay-cancel-btn">Отмена</button>
      </div>
    `;
  }
  return `
    <div class="overlay-panel__actions">
      <button class="btn btn--secondary" id="overlay-duplicate-btn">📋 Дублировать</button>
      <button class="btn btn--ghost" onclick="navigator.clipboard.writeText(JSON.stringify(${JSON.stringify(yaml).replace(/"/g, '&quot;')}, null, 2))">
        📋 JSON
      </button>
    </div>
  `;
}

/* ── Event Block Overlay ── */
function renderEventOverlay(block) {
  const yaml = block._yamlData || {};
  const window = block._scheduleWindow || {};
  const isNew = currentOverlay?.isNew || false;

  // Format date range
  const start = window.start ? new Date(window.start) : null;
  const end = window.end ? new Date(window.end) : null;
  const dateRange = start && end
    ? `${formatDate(start)} — ${formatDate(end)}`
    : `День ${block.startDay} — ${block.endDay}`;

  return `
    <div class="overlay-panel__header">
      <div class="overlay-panel__title">${isNew ? '✨ Новый ивент' : (yaml.name || block.name)}</div>
      ${renderEditToggle()}
      <button class="overlay-panel__close">✕</button>
    </div>
    <div class="overlay-panel__body">

      <div class="detail-section">
        <div class="detail-section__title">Общая информация</div>
        <div class="detail-grid">
          ${renderField('id', yaml.id, { readonly: true })}
          ${renderField('name', yaml.name)}
          <div class="detail-item">
            <span class="detail-item__label">Период</span>
            <span class="detail-item__value detail-item__value--mono">${dateRange}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">📅 Расписание (${(yaml.schedule || []).length} окон)</div>
        <div class="editor-schedule-list">
          ${renderScheduleEditor(yaml.schedule)}
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">💰 Валюты ивента</div>
        <div class="detail-grid">
          ${Object.entries(yaml.eventCurrencies || {}).map(([curr, data]) => `
            <div class="detail-item">
              <span class="detail-item__label">${curr}</span>
              <span class="detail-item__value detail-item__value--mono">
                compensation: ×${data.compensation?.multiplier || '?'} ${data.compensation?.currency || ''}
              </span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">🎰 Roll Pricing</div>
        <div class="detail-grid">
          ${Object.entries(yaml.rollPricing || {}).map(([count, data]) => `
            <div class="detail-item">
              <span class="detail-item__label">${count}× roll</span>
              <span class="detail-item__value detail-item__value--mono">
                ${data.internal ? `${data.internal.price} ${data.internal.currency}` : '—'}
              </span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">🎁 Лут на каждый ролл (${(yaml.lootPerRoll || []).length} items)</div>
        ${renderLootTable(yaml.lootPerRoll)}
      </div>

      <div class="detail-section">
        <div class="detail-section__title">📋 Квесты (${(yaml.questSlots || []).length} слотов)</div>
        ${renderQuestSlotsEditor(yaml.questSlots)}
      </div>

      <div class="detail-section">
        <div class="detail-section__title">🛒 Офферы ивента (${(yaml.offers || []).length})</div>
        ${renderEventOffers(yaml.offers)}
      </div>

    </div>

    ${renderActionButtons(yaml, isNew)}
  `;
}

/* ── Offer Block Overlay ── */
function renderOfferOverlay(block) {
  const yaml = block._yamlData || {};
  const shopItem = yaml.shopItem || {};
  const payment = shopItem.payment || {};
  const uiData = shopItem.uiData || {};
  const isNew = currentOverlay?.isNew || false;

  return `
    <div class="overlay-panel__header">
      <div class="overlay-panel__title">${isNew ? '✨ Новый оффер' : `Оффер #${yaml.id}`}</div>
      ${renderEditToggle()}
      <button class="overlay-panel__close">✕</button>
    </div>
    <div class="overlay-panel__body">

      <div class="detail-section">
        <div class="detail-section__title">Общая информация</div>
        <div class="detail-grid">
          ${renderField('id', yaml.id, { readonly: true })}
          ${renderField('type', yaml.type)}
          ${renderField('count', yaml.count)}
          ${renderField('startDate', formatDateValue(yaml.startDate))}
          ${renderField('endDate', formatDateValue(yaml.endDate))}
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">🏪 Shop Item</div>
        <div class="detail-grid">
          ${renderField('shopItem.id', shopItem.id, { readonly: true })}
          ${renderField('category', shopItem.category)}
        </div>
      </div>

      ${payment.telegram ? `
      <div class="detail-section">
        <div class="detail-section__title">💳 Payment — Telegram</div>
        <div class="detail-grid">
          ${renderField('title', payment.telegram.title)}
          ${renderField('price (XTR)', payment.telegram.price)}
          ${renderField('priceUsd', payment.telegram.priceUsd)}
        </div>
      </div>` : ''}

      ${payment.xsolla ? `
      <div class="detail-section">
        <div class="detail-section__title">💳 Payment — Xsolla</div>
        <div class="detail-grid">
          ${renderField('title', payment.xsolla.title)}
          ${renderField('price (USD)', payment.xsolla.price)}
        </div>
      </div>` : ''}

      ${payment.internal ? `
      <div class="detail-section">
        <div class="detail-section__title">💳 Payment — Internal</div>
        <div class="detail-grid">
          ${renderField('price', payment.internal.price)}
          ${renderField('currency', payment.internal.currency)}
        </div>
      </div>` : ''}

      <div class="detail-section">
        <div class="detail-section__title">🎁 Лут (${(shopItem.loot || []).length} items)</div>
        ${renderLootTable(shopItem.loot, 'shopItem.loot')}
      </div>

      <div class="detail-section">
        <div class="detail-section__title">🎨 UI Data</div>
        <div class="detail-grid">
          ${Object.entries(uiData).map(([k, v]) =>
    renderField(k, typeof v === 'object' ? JSON.stringify(v) : v, { path: `uiData.${k}` })
  ).join('')}
        </div>
      </div>

    </div>

    ${renderActionButtons(yaml, isNew)}
  `;
}

/* ── Static Shop Overlay ── */
function renderStaticShopOverlay(block) {
  const items = block._yamlData || [];
  const category = block._shopCategory || 'unknown';

  const itemsList = items.map((item, i) => {
    const payment = item.payment || {};
    const priceStr = payment.telegram
      ? `${payment.telegram.price} XTR`
      : payment.xsolla
        ? `$${payment.xsolla.price}`
        : 'No price';
    const lootStr = (item.loot || []).map(l => {
      if (l.type === 'CURRENCY') return `${l.count} ${l.currency}`;
      return `${l.type} ${l.rarity || ''}`;
    }).join(', ');

    return `
            <div class="editor-shop-item">
                <div class="editor-shop-item__header">
                    <span class="editor-shop-item__id">ID: ${item.id}</span>
                    <span class="editor-shop-item__price">${priceStr}</span>
                </div>
                <div class="editor-shop-item__loot">${lootStr}</div>
            </div>
        `;
  }).join('');

  return `
    <div class="overlay-panel__header">
      <div class="overlay-panel__title">${block.name}</div>
      <button class="overlay-panel__close">✕</button>
    </div>
    <div class="overlay-panel__body">
      <div class="detail-section">
        <div class="detail-section__title">${items.length} items in ${category}</div>
        <div class="editor-shop-items">${itemsList}</div>
      </div>
    </div>
    <div class="overlay-panel__actions">
      <button class="btn btn--ghost" onclick="navigator.clipboard.writeText(JSON.stringify(${JSON.stringify(items).replace(/"/g, '&quot;')}, null, 2))">
        📋 Копировать JSON
      </button>
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
      <button class="btn btn--ghost">✏️ Настройка сущности</button>
    </div>
  `;
}

/* ── Bind date picker triggers ── */
function bindDatePickers(panel) {
  panel.querySelectorAll('.dp-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = btn.dataset.targetId;
      const input = document.getElementById(targetId);
      if (!input) return;

      const rawValue = input.dataset.rawValue || input.value;
      const hasTime = input.dataset.hasTime === 'true';

      openDatePicker(btn, rawValue, hasTime, (newValue) => {
        // Update the raw value and display
        input.dataset.rawValue = newValue;
        // Format for display
        const d = new Date(newValue);
        if (!isNaN(d.getTime())) {
          const day = String(d.getDate()).padStart(2, '0');
          const mon = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          if (hasTime) {
            const hours = String(d.getHours()).padStart(2, '0');
            const mins = String(d.getMinutes()).padStart(2, '0');
            input.value = `${day}.${mon}.${year} ${hours}:${mins}`;
          } else {
            input.value = `${day}.${mon}.${year}`;
          }
        }
      });
    });
  });
}

/* ── Bind overlay action buttons ── */
function bindOverlayActions(panel, data, type) {
  // Edit mode toggle
  const toggleBtn = panel.querySelector('#overlay-mode-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      editMode = !editMode;
      // Re-render overlay to apply mode
      const newData = currentOverlay?.data || data;
      showOverlay(newData, type, { editMode });
    });
  }

  const saveBtn = panel.querySelector('#overlay-save-btn');
  const duplicateBtn = panel.querySelector('#overlay-duplicate-btn');
  const deleteBtn = panel.querySelector('#overlay-delete-btn');
  const cancelBtn = panel.querySelector('#overlay-cancel-btn');

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const yamlData = data._yamlData;
      const fileName = data._fileName;
      if (!fileName) {
        showToast('Файл не указан', 'error');
        return;
      }
      try {
        const formData = collectFormData(panel);
        // Merge form data into yaml data
        Object.assign(yamlData, formData);
        await saveToYaml(fileName, yamlData);
        showToast('Сохранено ✓', 'success');
        if (onDataChanged) onDataChanged();
        closeOverlay();
      } catch (err) {
        showToast(`Ошибка: ${err.message}`, 'error');
      }
    });
  }

  if (duplicateBtn) {
    duplicateBtn.addEventListener('click', () => {
      const yamlData = data._yamlData;
      if (!yamlData) return;
      const clone = duplicateItem(yamlData, type);
      const json = JSON.stringify(clone, null, 2);
      navigator.clipboard.writeText(json);
      showToast('Дубликат скопирован в буфер', 'success');
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      showConfirmDialog(
        'Удалить этот элемент?',
        'Это действие нельзя отменить.',
        async () => {
          // For now, just copy delete info to clipboard and show notice
          const yamlData = data._yamlData;
          const fileName = data._fileName;
          showToast(`Удаление: ${fileName || 'файл не указан'}`, 'info');
          // TODO: implement delete API when available
          closeOverlay();
        }
      );
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      editMode = false;
      if (currentOverlay) {
        showOverlay(currentOverlay.data, currentOverlay.type, { editMode: false });
      }
    });
  }
}

/* ── Confirmation Dialog ── */
function showConfirmDialog(title, message, onConfirm) {
  const existing = document.querySelector('.confirm-dialog-backdrop');
  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-dialog-backdrop';
  backdrop.innerHTML = `
    <div class="confirm-dialog">
      <div class="confirm-dialog__title">${title}</div>
      <div class="confirm-dialog__message">${message}</div>
      <div class="confirm-dialog__actions">
        <button class="btn btn--danger" id="confirm-yes">Удалить</button>
        <button class="btn btn--ghost" id="confirm-no">Отмена</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => backdrop.classList.add('confirm-dialog-backdrop--visible'));

  backdrop.querySelector('#confirm-yes').addEventListener('click', () => {
    backdrop.remove();
    onConfirm();
  });
  backdrop.querySelector('#confirm-no').addEventListener('click', () => {
    backdrop.remove();
  });
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) backdrop.remove();
  });
}

/* ── Helpers ── */
function formatDate(d) {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateValue(d) {
  if (!d) return '';
  if (d instanceof Date) return d.toISOString();
  return String(d);
}

function showToast(msg, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast--visible'));
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

/**
 * Init overlay: add ESC key handler + date picker
 */
export function initOverlay() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentOverlay) {
      closeOverlay();
    }
  });
  initDatePicker();
}
