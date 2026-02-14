/* ═══════════════════════════════════════════════════════
   LiveOps Calendar — Editor Components
   Field renderers, loot table editor, YAML save/duplicate
   ═══════════════════════════════════════════════════════ */

import { saveYaml, clearCache } from './yamlLoader.js';

/**
 * Check if a string looks like a date
 */
function isDateString(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value);
}

/**
 * Normalize timezone offset: "+03" → "+03:00", "+0300" → "+03:00"
 */
function normalizeTz(str) {
    if (!str) return str;
    return str.replace(/([+-]\d{2})(?::?(\d{2}))?$/, (_, h, m) => `${h}:${m || '00'}`);
}

/**
 * Parse a date string that may have non-standard tz like "+03"
 */
function safeParse(value) {
    if (!value) return null;
    const d = new Date(normalizeTz(value));
    return isNaN(d.getTime()) ? null : d;
}

/**
 * Format a date for display in the input (short human-readable, no seconds)
 */
function formatDateDisplay(value) {
    if (!value) return '';
    const d = safeParse(value);
    if (!d) return value;
    const day = String(d.getDate()).padStart(2, '0');
    const mon = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    // If value has time component
    if (value.includes('T')) {
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        return `${day}.${mon}.${year}  ${hours}:${mins}`;
    }
    return `${day}.${mon}.${year}`;
}

/**
 * Render an editable field based on auto-detected type
 */
export function renderField(key, value, opts = {}) {
    const { readonly = false, path = key } = opts;
    const id = `field-${path.replace(/[.\[\]]/g, '-')}`;

    if (value === null || value === undefined) {
        return `
            <div class="editor-field">
                <label class="editor-field__label">${key}</label>
                <input class="editor-field__input" data-path="${path}" id="${id}" 
                       type="text" value="" placeholder="(empty)" ${readonly ? 'readonly' : ''} />
            </div>`;
    }

    if (typeof value === 'boolean') {
        return `
            <div class="editor-field">
                <label class="editor-field__label">${key}</label>
                <select class="editor-field__input" data-path="${path}" id="${id}" ${readonly ? 'disabled' : ''}>
                    <option value="true" ${value ? 'selected' : ''}>true</option>
                    <option value="false" ${!value ? 'selected' : ''}>false</option>
                </select>
            </div>`;
    }

    if (typeof value === 'number') {
        return `
            <div class="editor-field">
                <label class="editor-field__label">${key}</label>
                <input class="editor-field__input" data-path="${path}" id="${id}" 
                       type="number" value="${value}" step="any" ${readonly ? 'readonly' : ''} />
            </div>`;
    }

    // Date detection — render with calendar picker trigger
    if (isDateString(value) || value instanceof Date) {
        const rawValue = value instanceof Date ? value.toISOString() : value;
        const displayValue = formatDateDisplay(rawValue);
        const hasTime = rawValue.includes('T');
        return `
            <div class="editor-field editor-field--date">
                <label class="editor-field__label">${key}</label>
                <div class="editor-field__date-wrap">
                    <input class="editor-field__input editor-field__input--date" 
                           data-path="${path}" data-raw-value="${rawValue}" data-has-time="${hasTime}"
                           id="${id}" type="text" value="${displayValue}" 
                           ${readonly ? 'readonly' : 'readonly'} />
                    ${!readonly ? `<button class="dp-trigger" data-target-id="${id}" type="button" title="Выбрать дату">📅</button>` : ''}
                </div>
            </div>`;
    }

    // Default: text
    return `
        <div class="editor-field">
            <label class="editor-field__label">${key}</label>
            <input class="editor-field__input" data-path="${path}" id="${id}" 
                   type="text" value="${String(value)}" ${readonly ? 'readonly' : ''} />
        </div>`;
}

/**
 * Render a loot table with rows
 */
export function renderLootTable(loot, basePath = 'lootPerRoll') {
    if (!Array.isArray(loot) || loot.length === 0) {
        return '<p class="text-muted">Нет лута</p>';
    }

    const rows = loot.map((item, i) => {
        const cols = Object.entries(item).map(([k, v]) =>
            `<td><input class="editor-field__input editor-field__input--compact" 
                   data-path="${basePath}[${i}].${k}" 
                   type="${typeof v === 'number' ? 'number' : 'text'}" 
                   value="${v}" step="any" /></td>`
        ).join('');
        return `<tr>${cols}</tr>`;
    });

    const headers = Object.keys(loot[0]).map(k => `<th>${k}</th>`).join('');

    return `
        <div class="editor-loot-table">
            <table class="loot-table">
                <thead><tr>${headers}</tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
}

/**
 * Render schedule editor with multiple time windows 
 */
export function renderScheduleEditor(schedule) {
    if (!Array.isArray(schedule) || schedule.length === 0) {
        return '<p class="text-muted">Нет расписания</p>';
    }

    return schedule.map((window, i) => `
        <div class="editor-schedule-window" data-window-index="${i}">
            <div class="editor-schedule-window__header">
                <span class="editor-schedule-window__title">Окно #${i + 1}</span>
            </div>
            <div class="editor-schedule-window__fields">
                ${window.startPreview ? renderField('startPreview', formatDateValue(window.startPreview), { path: `schedule[${i}].startPreview` }) : ''}
                ${renderField('start', formatDateValue(window.start), { path: `schedule[${i}].start` })}
                ${window.questEnd ? renderField('questEnd', formatDateValue(window.questEnd), { path: `schedule[${i}].questEnd` }) : ''}
                ${renderField('end', formatDateValue(window.end), { path: `schedule[${i}].end` })}
            </div>
        </div>
    `).join('');
}

/**
 * Render quest slots editor (collapsible)
 */
export function renderQuestSlotsEditor(questSlots) {
    if (!Array.isArray(questSlots) || questSlots.length === 0) {
        return '<p class="text-muted">Нет квестов</p>';
    }

    return questSlots.map((slot, si) => {
        const questRows = (slot.quests || []).map((q, qi) => `
            <div class="editor-quest-row">
                <span class="editor-quest-row__id">#${q.id}</span>
                <span class="editor-quest-row__type">${q.type}</span>
                <span class="editor-quest-row__value">× ${q.value}</span>
                <span class="editor-quest-row__loot">${(q.loot || []).map(l => `${l.count} ${l.currency}`).join(', ')}</span>
            </div>
        `).join('');

        return `
            <details class="editor-quest-slot">
                <summary>Слот ${si + 1} — ${slot.quests?.length || 0} квестов</summary>
                <div class="editor-quest-slot__content">${questRows}</div>
            </details>
        `;
    }).join('');
}

/**
 * Render offers from event YAML
 */
export function renderEventOffers(offers) {
    if (!Array.isArray(offers) || offers.length === 0) {
        return '<p class="text-muted">Нет офферов</p>';
    }

    return offers.map((offer, i) => {
        const shopItem = offer.shopItem || {};
        const payment = shopItem.payment || {};
        const loot = shopItem.loot || [];

        let priceStr = 'Free';
        if (payment.internal) priceStr = `${payment.internal.price} ${payment.internal.currency}`;
        else if (payment.telegram) priceStr = `${payment.telegram.price} XTR ($${payment.telegram.priceUsd || '?'})`;
        else if (payment.xsolla) priceStr = `$${payment.xsolla.price}`;

        const lootStr = loot.map(l => {
            if (l.type === 'CURRENCY') return `${l.count} ${l.currency}`;
            return `${l.type} ${l.rarity || ''}`;
        }).join(', ');

        return `
            <div class="editor-offer-card">
                <div class="editor-offer-card__header">
                    <span class="editor-offer-card__id">Offer #${offer.id}</span>
                    <span class="editor-offer-card__type">${offer.type}</span>
                    ${offer.count ? `<span class="editor-offer-card__count">×${offer.count}</span>` : ''}
                </div>
                <div class="editor-offer-card__body">
                    <div class="editor-offer-card__price">${priceStr}</div>
                    <div class="editor-offer-card__loot">${lootStr}</div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Collect form data from all editor inputs within a container
 */
export function collectFormData(container) {
    const data = {};
    container.querySelectorAll('[data-path]').forEach(input => {
        const path = input.dataset.path;
        let value = input.value;

        // Date fields: use raw ISO value instead of display format
        if (input.classList.contains('editor-field__input--date') && input.dataset.rawValue) {
            value = input.dataset.rawValue;
        }
        // Type coerce
        else if (input.type === 'number') value = parseFloat(value);
        else if (input.tagName === 'SELECT') {
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
        }

        setNestedValue(data, path, value);
    });
    return data;
}

/**
 * Set a nested value using dot/bracket path notation
 */
function setNestedValue(obj, path, value) {
    const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        const nextKey = parts[i + 1];
        if (!(key in current)) {
            current[key] = /^\d+$/.test(nextKey) ? [] : {};
        }
        current = current[key];
    }
    current[parts[parts.length - 1]] = value;
}

/**
 * Save YAML file via API
 */
export async function saveToYaml(filePath, data) {
    return await saveYaml(filePath, data);
}

/**
 * Deep clone and increment IDs for duplication
 */
export function duplicateItem(data, type) {
    const clone = JSON.parse(JSON.stringify(data));
    if (clone.id !== undefined) clone.id = clone.id + 1000;
    if (clone.name) clone.name = clone.name + '_COPY';
    return clone;
}

/**
 * Format a date value for display
 */
function formatDateValue(d) {
    if (!d) return '';
    if (d instanceof Date) return d.toISOString().replace('Z', '+03');
    return String(d);
}
