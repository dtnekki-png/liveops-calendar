/* ═══════════════════════════════════════════════════════
   LiveOps Calendar — Block Renderers
   ═══════════════════════════════════════════════════════ */

/**
 * Entity type → CSS class mapping
 */
const ENTITY_CLASS_MAP = {
    'G3T8': 'grid',
    'G3T10': '3dset',
    'G3T1': 'set',
    'G3T2': 'gacha2',
    'G3T3': 'gacha3',
};

/**
 * Render an event block bar
 */
export function renderEventBlock(block, colWidth) {
    const left = (block.startDay - 1) * colWidth;
    const width = (block.endDay - block.startDay + 1) * colWidth - 4;

    const daytimeClass = block.daytime === 'night' ? 'block-bar__daytime--night' : 'block-bar__daytime--day';
    const daytimeLabel = block.daytime === 'night' ? '🌙 03:00' : '☀️ 14:00';

    return `
    <div class="block-bar block-bar--event" 
         data-block-id="${block.id}" 
         data-block-type="event"
         style="left:${left}px; width:${width}px;">
      <div class="block-bar__inner">
        <div class="block-bar__top">
          <span class="block-bar__daytime ${daytimeClass}">${daytimeLabel}</span>
          <span class="block-bar__name">${block.name}</span>
        </div>
        <div class="block-bar__meta">
          <span class="block-bar__tag">${block.skeleton}</span>
          <span class="block-bar__tag">${block.skin}</span>
          ${block.metrics ? `<span class="block-bar__metric">$${block.metrics.rev}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render a static block bar
 */
export function renderStaticBlock(block, colWidth) {
    const left = (block.startDay - 1) * colWidth;
    const width = (block.endDay - block.startDay + 1) * colWidth - 4;

    return `
    <div class="block-bar block-bar--static" 
         data-block-id="${block.id}"
         data-block-type="static"
         style="left:${left}px; width:${width}px;">
      <div class="block-bar__inner">
        <div class="block-bar__top">
          <span class="block-bar__name">${block.name}</span>
        </div>
        <div class="block-bar__meta">
          ${block.tags.map(t => `<span class="block-bar__tag">${t}</span>`).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render a static-dynamic block bar
 */
export function renderStaticDynamicBlock(block, colWidth) {
    const left = (block.startDay - 1) * colWidth;
    const width = (block.endDay - block.startDay + 1) * colWidth - 4;

    const daytimeClass = block.daytime === 'night' ? 'block-bar__daytime--night' : 'block-bar__daytime--day';
    const daytimeLabel = block.daytime === 'night' ? '🌙 03:00' : '☀️ 14:00';

    const enabledModules = Object.values(block.modules).filter(m => m.enabled);

    return `
    <div class="block-bar block-bar--static-dynamic" 
         data-block-id="${block.id}"
         data-block-type="static-dynamic"
         style="left:${left}px; width:${width}px;">
      <div class="block-bar__inner">
        <div class="block-bar__top">
          <span class="block-bar__daytime ${daytimeClass}">${daytimeLabel}</span>
          <span class="block-bar__name">${block.name}</span>
        </div>
        <div class="block-bar__meta">
          ${enabledModules.map(m => `<span class="block-bar__metric">${m.label}: ${m.value}</span>`).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render a dynamic entity chip
 */
export function renderEntityChip(entity, colWidth) {
    const left = (entity.startDay - 1) * colWidth;
    const width = (entity.endDay - entity.startDay + 1) * colWidth - 4;
    const cssType = ENTITY_CLASS_MAP[entity.entityType] || 'set';
    const priceClass = entity.price === 'expensive' ? 'expensive' : 'standard';

    return `
    <div class="entity-chip entity-chip--${cssType}"
         data-entity-id="${entity.id}"
         style="left:${left}px; width:${width}px;">
      <span class="entity-chip__type">${entity.entityType}</span>
      <span class="entity-chip__name">${entity.label}</span>
      <span class="entity-chip__price entity-chip__price--${priceClass}">${entity.price === 'expensive' ? 'Дорогой' : 'Стандарт'}</span>
      <span class="entity-chip__id">${entity.identifier}</span>
    </div>
  `;
}
