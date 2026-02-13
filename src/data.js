/* ═══════════════════════════════════════════════════════
   LiveOps Calendar — Mock Data
   ═══════════════════════════════════════════════════════ */

/**
 * Returns number of days in a given month/year
 */
export function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * Sample event blocks
 */
export function getEventBlocks(year, month) {
    const maxDay = daysInMonth(year, month);
    const clamp = d => Math.min(d, maxDay);

    return [
        {
            id: 'evt-1',
            type: 'event',
            name: '8 Марта',
            startDay: clamp(3),
            endDay: clamp(10),
            daytime: 'day',
            skeleton: 'Marathon-3D',
            skin: 'Spring Theme',
            metrics: { rev: '$12.4K', arpu: '$0.42', us: '29.5K', sfr: '3.2%' },
            composition: 'Ивент + 2 оффера + магазин',
            tags: ['8.03', 'D15', 'promo'],
        },
        {
            id: 'evt-2',
            type: 'event',
            name: 'День рождения',
            startDay: clamp(12),
            endDay: clamp(18),
            daytime: 'night',
            skeleton: 'Event-Standard',
            skin: 'Birthday Skin',
            metrics: { rev: '$8.1K', arpu: '$0.31', us: '26.1K', sfr: '2.8%' },
            composition: 'Ивент + рулетка + магазин',
            tags: ['birthday', 'H21'],
        },
        {
            id: 'evt-3',
            type: 'event',
            name: '11×11 Турнир',
            startDay: clamp(20),
            endDay: clamp(27),
            daytime: 'day',
            skeleton: 'Tournament-Grid',
            skin: 'Neon Arena',
            metrics: { rev: '$18.7K', arpu: '$0.55', us: '34.0K', sfr: '4.1%' },
            composition: 'Турнир + марафон + 3 оффера',
            tags: ['11x11', 'H22', 'competitive'],
        },
    ];
}

/**
 * Sample static blocks
 */
export function getStaticBlocks(year, month) {
    const maxDay = daysInMonth(year, month);
    const clamp = d => Math.min(d, maxDay);

    return [
        {
            id: 'stc-1',
            type: 'static',
            name: 'Магазин Standard',
            group: 'Магазин',
            startDay: 1,
            endDay: clamp(15),
            tags: ['shop', 'always-on'],
        },
        {
            id: 'stc-2',
            type: 'static',
            name: 'Магазин Premium',
            group: 'Магазин',
            startDay: clamp(16),
            endDay: maxDay,
            tags: ['shop', 'premium'],
        },
        {
            id: 'stc-3',
            type: 'static',
            name: 'Ежедневные задания v2',
            group: 'Задания',
            startDay: 1,
            endDay: maxDay,
            tags: ['daily', 'quests'],
        },
    ];
}

/**
 * Sample static-dynamic blocks with modular fields
 */
export function getStaticDynamicBlocks(year, month) {
    const maxDay = daysInMonth(year, month);
    const clamp = d => Math.min(d, maxDay);

    return [
        {
            id: 'sd-1',
            type: 'static-dynamic',
            name: 'БП Season 4',
            startDay: 1,
            endDay: maxDay,
            daytime: 'day',
            skeleton: 'BattlePass-50',
            skin: 'Cyber Theme',
            modules: {
                rev_block: { label: 'Rev', value: '$24.3K', enabled: true },
                arpu_block: { label: 'ARPU', value: '$0.68', enabled: true },
                us: { label: 'US', value: '35.7K', enabled: true },
                sfr: { label: 'sFR', value: '5.1%', enabled: false },
                conversion: { label: 'Conv', value: '12.4%', enabled: false },
            },
            tags: ['BP', 'S4', 'D10'],
        },
        {
            id: 'sd-2',
            type: 'static-dynamic',
            name: 'Рулетка Lucky',
            startDay: clamp(5),
            endDay: clamp(25),
            daytime: 'night',
            skeleton: 'Roulette-3x',
            skin: 'Gold Rush',
            modules: {
                rev_block: { label: 'Rev', value: '$6.8K', enabled: true },
                arpu_block: { label: 'ARPU', value: '$0.22', enabled: true },
                us: { label: 'US', value: '30.9K', enabled: false },
                sfr: { label: 'sFR', value: '2.1%', enabled: true },
                conversion: { label: 'Conv', value: '8.7%', enabled: false },
            },
            tags: ['roulette', 'gold'],
        },
    ];
}

/**
 * Sample dynamic entities (per schema section 7)
 */
export function getDynamicEntities(year, month) {
    const maxDay = daysInMonth(year, month);
    const clamp = d => Math.min(d, maxDay);

    return [
        // Row 1
        { id: 'de-1', entityType: 'G3T8', label: 'grid', price: 'expensive', identifier: 'H22', startDay: 1, endDay: clamp(7), row: 0 },
        { id: 'de-2', entityType: 'G3T10', label: '3D set', price: 'standard', identifier: 'H21', startDay: clamp(8), endDay: clamp(14), row: 0 },
        { id: 'de-3', entityType: 'G3T10', label: '3D set', price: 'standard', identifier: 'D10', startDay: clamp(15), endDay: clamp(21), row: 0 },
        { id: 'de-4', entityType: 'G3T2', label: 'gacha', price: 'standard', identifier: 'D11', startDay: clamp(22), endDay: clamp(28), row: 0 },

        // Row 2
        { id: 'de-5', entityType: 'G3T1', label: 'set', price: 'standard', identifier: 'H21', startDay: 1, endDay: clamp(5), row: 1 },
        { id: 'de-6', entityType: 'G3T3', label: 'gacha', price: 'standard', identifier: 'D11', startDay: clamp(6), endDay: clamp(11), row: 1 },
        { id: 'de-7', entityType: 'G3T10', label: '3D set', price: 'standard', identifier: 'D10', startDay: clamp(12), endDay: clamp(17), row: 1 },
        { id: 'de-8', entityType: 'G3T10', label: '3D set', price: 'standard', identifier: 'D10', startDay: clamp(18), endDay: clamp(23), row: 1 },
        { id: 'de-9', entityType: 'G3T3', label: 'gacha', price: 'standard', identifier: 'D11', startDay: clamp(24), endDay: maxDay, row: 1 },

        // Row 3
        { id: 'de-10', entityType: 'G3T10', label: '3D set', price: 'standard', identifier: 'D10', startDay: clamp(10), endDay: clamp(20), row: 2 },
    ];
}
