/* ═══════════════════════════════════════════════════════
   LiveOps Calendar — YAML Loader
   Fetch + parse YAML files, cache in memory
   ═══════════════════════════════════════════════════════ */

import jsyaml from 'js-yaml';

const cache = {};

/**
 * Fetch and parse a single YAML file, with caching
 */
export async function loadYaml(path) {
    if (cache[path]) return cache[path];
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    const text = await res.text();
    const data = jsyaml.load(text);
    cache[path] = data;
    return data;
}

/**
 * Clear the cache (call after saves to force reload)
 */
export function clearCache(path) {
    if (path) {
        delete cache[path];
    } else {
        Object.keys(cache).forEach(k => delete cache[k]);
    }
}

/**
 * Load all events from the events index YAML
 * Returns array of full event objects
 */
export async function loadEvents() {
    const index = await loadYaml('/data/events/events.yaml');
    const events = await Promise.all(
        index.include.map(name => loadYaml(`/data/events/${name}.yaml`))
    );
    return events;
}

/**
 * Load offers from data/shop/offers/offers.yaml
 * Returns array of offer objects
 */
export async function loadOffers() {
    return await loadYaml('/data/shop/offers/offers.yaml');
}

/**
 * Load static shop data
 * Returns object with keys: gems, boostColas, boosterPack, heroShardPrices, starterPack
 */
export async function loadStaticShop() {
    const [gems, boostColas, boosterPack, heroShardPrices, starterPack] = await Promise.all([
        loadYaml('/data/shop/gems.yaml'),
        loadYaml('/data/shop/boost-colas.yaml'),
        loadYaml('/data/shop/booster-pack.yaml'),
        loadYaml('/data/shop/hero-shard-prices.yaml'),
        loadYaml('/data/shop/starter-pack.yaml'),
    ]);
    return { gems, boostColas, boosterPack, heroShardPrices, starterPack };
}

/**
 * Load all data at once
 */
export async function loadAllData() {
    const [events, offers, staticShop] = await Promise.all([
        loadEvents(),
        loadOffers(),
        loadStaticShop(),
    ]);
    return { events, offers, staticShop };
}

/**
 * Save data back to a YAML file via dev server API
 */
export async function saveYaml(filePath, data) {
    const yamlStr = jsyaml.dump(data, { lineWidth: -1, noRefs: true });
    const res = await fetch('/api/save-yaml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content: yamlStr }),
    });
    if (!res.ok) throw new Error(`Save failed: ${res.status}`);
    // Clear cache for the saved file
    clearCache(`/data/${filePath}`);
    return await res.json();
}
