/* ═══════════════════════════════════════════════════════
   LiveOps Calendar — Data Layer (YAML-based)
   Transforms parsed YAML into calendar-compatible blocks
   ═══════════════════════════════════════════════════════ */

/**
 * Returns number of days in a given month/year
 */
export function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * Parse a YAML date string into a JS Date
 */
function parseDate(dateStr) {
    if (dateStr instanceof Date) return dateStr;
    return new Date(dateStr);
}

/**
 * Convert events from YAML into calendar blocks for a given month.
 * Each event may have multiple schedule windows — each window that
 * intersects the displayed month produces a separate block.
 */
export function getEventBlocks(year, month, events) {
    const monthStart = new Date(year, month, 1);
    const maxDay = daysInMonth(year, month);
    const monthEnd = new Date(year, month, maxDay, 23, 59, 59);
    const blocks = [];

    events.forEach(event => {
        if (!event.schedule) return;
        event.schedule.forEach((window, wi) => {
            const start = parseDate(window.start || window.startPreview);
            const end = parseDate(window.end);

            // Check intersection with current month
            if (end < monthStart || start > monthEnd) return;

            const startDay = start < monthStart ? 1 : start.getDate();
            const endDay = end > monthEnd ? maxDay : end.getDate();

            blocks.push({
                id: `evt-${event.id}-w${wi}`,
                type: 'event',
                name: event.name,
                startDay,
                endDay: Math.min(endDay, maxDay),
                // Store full YAML data for overlay drill-down
                _yamlData: event,
                _scheduleWindow: window,
                _fileName: event._fileName,
                // Visual metadata
                tags: [
                    `ID: ${event.id}`,
                    window.startPreview ? 'preview' : '',
                    `${Object.keys(event.eventCurrencies || {}).length} currencies`,
                ].filter(Boolean),
            });
        });
    });

    return blocks;
}

/**
 * Convert offers from YAML into calendar blocks for a given month.
 * Only offers with startDate/endDate intersecting the month appear.
 */
export function getOfferBlocks(year, month, offers) {
    const monthStart = new Date(year, month, 1);
    const maxDay = daysInMonth(year, month);
    const monthEnd = new Date(year, month, maxDay, 23, 59, 59);
    const blocks = [];

    offers.forEach(offer => {
        if (!offer.startDate || !offer.endDate) return;
        const start = parseDate(offer.startDate);
        const end = parseDate(offer.endDate);

        if (end < monthStart || start > monthEnd) return;

        const startDay = start < monthStart ? 1 : start.getDate();
        const endDay = end > monthEnd ? maxDay : end.getDate();

        // Determine label from loot or title
        const shopItem = offer.shopItem || {};
        const uiData = shopItem.uiData || {};
        const title = uiData.title || `Offer #${offer.id}`;
        const payment = shopItem.payment || {};
        const price = payment.telegram?.price
            ? `${payment.telegram.price} XTR`
            : payment.xsolla?.price
                ? `$${payment.xsolla.price}`
                : 'Free';

        blocks.push({
            id: `offer-${offer.id}`,
            type: 'offer',
            name: title,
            startDay,
            endDay: Math.min(endDay, maxDay),
            _yamlData: offer,
            tags: [
                offer.type,
                price,
                uiData.discount ? `-${uiData.discount}%` : '',
            ].filter(Boolean),
        });
    });

    return blocks;
}

/**
 * Convert static shop data into always-on blocks (span full month).
 */
export function getStaticShopBlocks(shopData) {
    const categories = [
        { key: 'gems', name: 'Gems Shop', category: 'GEMS' },
        { key: 'boostColas', name: 'Boost Colas', category: 'BOOST_COLA' },
        { key: 'boosterPack', name: 'Booster Packs', category: 'BOOSTER_PACK' },
        { key: 'heroShardPrices', name: 'Hero Shard Prices', category: 'HERO_SHARD' },
        { key: 'starterPack', name: 'Starter Packs', category: 'STARTER_PACK' },
    ];

    return categories
        .filter(c => shopData[c.key] && shopData[c.key].length > 0)
        .map(c => ({
            id: `shop-${c.key}`,
            type: 'static',
            name: c.name,
            group: 'Магазин',
            startDay: 1,
            endDay: 31, // will be clamped by renderer
            _yamlData: shopData[c.key],
            _shopCategory: c.key,
            tags: ['shop', `${shopData[c.key].length} items`],
        }));
}
