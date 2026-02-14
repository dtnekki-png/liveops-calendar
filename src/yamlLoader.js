/* ═══════════════════════════════════════════════════════
   LiveOps Calendar — YAML Loader
   In production: data is embedded in the JS bundle via Vite YAML plugin
   In dev: also supports fetch + save via dev server API
   ═══════════════════════════════════════════════════════ */

import jsyaml from 'js-yaml';

// ── Static imports: embedded at build time ──────────────
import eventsIndex from '../data/events/events.yaml';
import ev3Zargates from '../data/events/3-zargates-event.yaml';
import ev4Vampires from '../data/events/4-vampires-event.yaml';
import ev4Zargates from '../data/events/4-zargates-event.yaml';
import ev2UrbanBrutes from '../data/events/2-urban-brutes-event.yaml';
import ev5Shadows from '../data/events/5-shadows-event.yaml';
import ev6NightBeasts from '../data/events/6-night-beasts-event.yaml';
import ev1Zargates from '../data/events/1-zargates-event.yaml';
import ev101VampiresWinter from '../data/events/101-vampires-winter-event.yaml';
import ev102UrbanBrutesWinter from '../data/events/102-urban-brutes-winter-event.yaml';
import ev103ShadowsWinter from '../data/events/103-shadows-winter-event.yaml';

import shopGems from '../data/shop/gems.yaml';
import shopBoostColas from '../data/shop/boost-colas.yaml';
import shopBoosterPack from '../data/shop/booster-pack.yaml';
import shopHeroShardPrices from '../data/shop/hero-shard-prices.yaml';
import shopStarterPack from '../data/shop/starter-pack.yaml';
import shopOffers from '../data/shop/offers/offers.yaml';
import shopOnboardingOffers from '../data/shop/offers/onboarding-offers.yaml';

// ── Event registry ──────────────────────────────────────
const eventMap = {
    '1-zargates-event': ev1Zargates,
    '2-urban-brutes-event': ev2UrbanBrutes,
    '3-zargates-event': ev3Zargates,
    '4-vampires-event': ev4Vampires,
    '4-zargates-event': ev4Zargates,
    '5-shadows-event': ev5Shadows,
    '6-night-beasts-event': ev6NightBeasts,
    '101-vampires-winter-event': ev101VampiresWinter,
    '102-urban-brutes-winter-event': ev102UrbanBrutesWinter,
    '103-shadows-winter-event': ev103ShadowsWinter,
};

// ── Path-based registry for loadYaml compatibility ──────
const dataRegistry = {
    '/data/events/events.yaml': eventsIndex,
    '/data/shop/gems.yaml': shopGems,
    '/data/shop/boost-colas.yaml': shopBoostColas,
    '/data/shop/booster-pack.yaml': shopBoosterPack,
    '/data/shop/hero-shard-prices.yaml': shopHeroShardPrices,
    '/data/shop/starter-pack.yaml': shopStarterPack,
    '/data/shop/offers/offers.yaml': shopOffers,
    '/data/shop/offers/onboarding-offers.yaml': shopOnboardingOffers,
};

// Add event files to registry
for (const [name, data] of Object.entries(eventMap)) {
    dataRegistry[`/data/events/${name}.yaml`] = data;
}

const cache = {};

/**
 * Load a YAML file — uses embedded data (production-safe)
 * Falls back to fetch for dev-only paths not in the registry
 */
export async function loadYaml(path) {
    if (cache[path]) return cache[path];

    // Use embedded data from static imports
    if (dataRegistry[path]) {
        cache[path] = dataRegistry[path];
        return dataRegistry[path];
    }

    // Fallback: runtime fetch (dev server only)
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
