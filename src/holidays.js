/* ═══════════════════════════════════════════════════════
   LiveOps Calendar — Global Holidays Database
   Comprehensive list of holidays relevant for LiveOps
   ═══════════════════════════════════════════════════════ */

/**
 * Fixed-date holidays (month is 0-indexed)
 * Format: { m: month(0-11), d: day, icon: emoji, name: string }
 */
const FIXED_HOLIDAYS = [
    // ── January ──
    { m: 0, d: 1, icon: '🎆', name: 'Новый Год / New Year' },
    { m: 0, d: 6, icon: '👑', name: 'Epiphany / Día de Reyes' },
    { m: 0, d: 7, icon: '🎄', name: 'Рождество (православное)' },
    { m: 0, d: 13, icon: '🎊', name: 'Старый Новый Год' },
    { m: 0, d: 14, icon: '🇯🇵', name: 'Coming of Age Day (Japan)' },
    { m: 0, d: 26, icon: '🇦🇺', name: 'Australia Day' },

    // ── February ──
    { m: 1, d: 2, icon: '🦫', name: 'Groundhog Day' },
    { m: 1, d: 14, icon: '💘', name: 'День Святого Валентина' },
    { m: 1, d: 23, icon: '🎖️', name: 'День Защитника Отечества' },

    // ── March ──
    { m: 2, d: 1, icon: '🌸', name: 'Мэрцишор / Martisor' },
    { m: 2, d: 3, icon: '🎎', name: 'Hina Matsuri (Japan)' },
    { m: 2, d: 8, icon: '🌷', name: 'Международный Женский День' },
    { m: 2, d: 14, icon: '🥧', name: 'Pi Day' },
    { m: 2, d: 17, icon: '☘️', name: "St. Patrick's Day" },
    { m: 2, d: 20, icon: '🌱', name: 'Spring Equinox' },
    { m: 2, d: 22, icon: '💧', name: 'World Water Day' },

    // ── April ──
    { m: 3, d: 1, icon: '🤡', name: 'April Fools / День Смеха' },
    { m: 3, d: 12, icon: '🚀', name: 'День Космонавтики' },
    { m: 3, d: 22, icon: '🌍', name: 'Earth Day' },
    { m: 3, d: 23, icon: '📖', name: 'World Book Day' },

    // ── May ──
    { m: 4, d: 1, icon: '⚒️', name: 'День Труда / May Day' },
    { m: 4, d: 4, icon: '⭐', name: 'Star Wars Day (May the 4th)' },
    { m: 4, d: 5, icon: '🇲🇽', name: 'Cinco de Mayo' },
    { m: 4, d: 9, icon: '🎗️', name: 'День Победы' },
    { m: 4, d: 17, icon: '📡', name: 'World Telecommunication Day' },

    // ── June ──
    { m: 5, d: 1, icon: '👶', name: 'День Защиты Детей' },
    { m: 5, d: 5, icon: '🌿', name: 'World Environment Day' },
    { m: 5, d: 12, icon: '🇷🇺', name: 'День России' },
    { m: 5, d: 21, icon: '☀️', name: 'Summer Solstice' },
    { m: 5, d: 21, icon: '🎵', name: 'World Music Day' },

    // ── July ──
    { m: 6, d: 1, icon: '🇨🇦', name: 'Canada Day' },
    { m: 6, d: 4, icon: '🇺🇸', name: 'Independence Day (USA)' },
    { m: 6, d: 14, icon: '🇫🇷', name: 'Bastille Day (France)' },
    { m: 6, d: 20, icon: '🌙', name: 'International Moon Day' },
    { m: 6, d: 30, icon: '🤝', name: 'International Friendship Day' },

    // ── August ──
    { m: 7, d: 1, icon: '🇨🇭', name: 'Swiss National Day' },
    { m: 7, d: 12, icon: '🎮', name: 'International Youth Day' },
    { m: 7, d: 15, icon: '🇮🇳', name: 'Independence Day (India)' },
    { m: 7, d: 19, icon: '📸', name: 'World Photography Day' },
    { m: 7, d: 26, icon: '🐕', name: 'International Dog Day' },

    // ── September ──
    { m: 8, d: 1, icon: '📚', name: 'День Знаний' },
    { m: 8, d: 16, icon: '🇲🇽', name: 'Mexican Independence Day' },
    { m: 8, d: 19, icon: '🏴‍☠️', name: 'Talk Like a Pirate Day' },
    { m: 8, d: 21, icon: '☮️', name: 'International Peace Day' },
    { m: 8, d: 22, icon: '🍂', name: 'Autumn Equinox' },
    { m: 8, d: 27, icon: '🎭', name: 'World Tourism Day' },

    // ── October ──
    { m: 9, d: 1, icon: '🎶', name: 'International Music Day' },
    { m: 9, d: 3, icon: '🇩🇪', name: 'German Unity Day' },
    { m: 9, d: 4, icon: '🐾', name: 'World Animal Day' },
    { m: 9, d: 16, icon: '🍔', name: 'World Food Day' },
    { m: 9, d: 31, icon: '🎃', name: 'Halloween' },

    // ── November ──
    { m: 10, d: 1, icon: '💀', name: 'Día de los Muertos' },
    { m: 10, d: 5, icon: '🎆', name: 'Guy Fawkes Night (UK)' },
    { m: 10, d: 11, icon: '🎖️', name: "Veterans Day / Remembrance Day" },
    { m: 10, d: 11, icon: '🛒', name: 'Singles Day (11.11)' },

    // ── December ──
    { m: 11, d: 6, icon: '🎅', name: 'St. Nicholas Day' },
    { m: 11, d: 21, icon: '❄️', name: 'Winter Solstice' },
    { m: 11, d: 24, icon: '🎄', name: 'Christmas Eve' },
    { m: 11, d: 25, icon: '🎁', name: 'Christmas / Рождество' },
    { m: 11, d: 26, icon: '📦', name: 'Boxing Day' },
    { m: 11, d: 31, icon: '🥂', name: 'New Year\'s Eve' },
];

/**
 * Floating holidays computed per year
 * Returns array of { m, d, icon, name }
 */
function getFloatingHolidays(year) {
    const floating = [];

    // ── Chinese New Year (approximate — 1st new moon after Jan 20) ──
    const cnyDates = {
        2024: [1, 10], 2025: [0, 29], 2026: [1, 17], 2027: [1, 6],
        2028: [0, 26], 2029: [1, 13], 2030: [1, 3], 2031: [0, 23],
        2032: [1, 11], 2033: [0, 31],
    };
    if (cnyDates[year]) {
        floating.push({ m: cnyDates[year][0], d: cnyDates[year][1], icon: '🧧', name: 'Китайский Новый Год / Chinese New Year' });
    }

    // ── Easter (Western) — Computus algorithm ──
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const mm = Math.floor((a + 11 * h + 22 * l) / 451);
    const easterMonth = Math.floor((h + l - 7 * mm + 114) / 31) - 1; // 0-indexed
    const easterDay = ((h + l - 7 * mm + 114) % 31) + 1;

    floating.push({ m: easterMonth, d: easterDay, icon: '🐣', name: 'Easter / Пасха (зап.)' });

    // Good Friday (2 days before Easter)
    const goodFriday = new Date(year, easterMonth, easterDay - 2);
    floating.push({ m: goodFriday.getMonth(), d: goodFriday.getDate(), icon: '✝️', name: 'Good Friday' });

    // Carnival / Mardi Gras (47 days before Easter)
    const mardiGras = new Date(year, easterMonth, easterDay - 47);
    floating.push({ m: mardiGras.getMonth(), d: mardiGras.getDate(), icon: '🎭', name: 'Mardi Gras / Карнавал' });

    // ── Orthodox Easter ──
    const oA = year % 4;
    const oB = year % 7;
    const oC = year % 19;
    const oD = (19 * oC + 15) % 30;
    const oE = (2 * oA + 4 * oB - oD + 34) % 7;
    const oMonth = Math.floor((oD + oE + 114) / 31);
    const oDay = ((oD + oE + 114) % 31) + 1;
    // Convert from Julian to Gregorian (+13 days in 20th-21st century)
    const orthEaster = new Date(year, oMonth - 1, oDay + 13);
    floating.push({ m: orthEaster.getMonth(), d: orthEaster.getDate(), icon: '🥚', name: 'Пасха (православная)' });

    // ── US Thanksgiving (4th Thursday in November) ──
    const nov1 = new Date(year, 10, 1);
    const firstThursdayOffset = (4 - nov1.getDay() + 7) % 7;
    const thanksgiving = 1 + firstThursdayOffset + 21; // 4th Thursday
    floating.push({ m: 10, d: thanksgiving, icon: '🦃', name: 'Thanksgiving (USA)' });

    // ── Black Friday (day after Thanksgiving) ──
    floating.push({ m: 10, d: thanksgiving + 1, icon: '🏷️', name: 'Black Friday' });

    // ── Cyber Monday (Monday after Thanksgiving) ──
    floating.push({ m: 10, d: thanksgiving + 4, icon: '💻', name: 'Cyber Monday' });

    // ── US Mother's Day (2nd Sunday in May) ──
    const may1 = new Date(year, 4, 1);
    const firstSundayMay = (7 - may1.getDay()) % 7;
    const mothersDay = 1 + firstSundayMay + 7;
    floating.push({ m: 4, d: mothersDay, icon: '💐', name: "Mother's Day (US)" });

    // ── US Father's Day (3rd Sunday in June) ──
    const jun1 = new Date(year, 5, 1);
    const firstSundayJun = (7 - jun1.getDay()) % 7;
    const fathersDay = 1 + firstSundayJun + 14;
    floating.push({ m: 5, d: fathersDay, icon: '👔', name: "Father's Day (US)" });

    // ── US Memorial Day (last Monday in May) ──
    const may31 = new Date(year, 4, 31);
    const memorialDay = 31 - ((may31.getDay() + 6) % 7);
    floating.push({ m: 4, d: memorialDay, icon: '🇺🇸', name: 'Memorial Day' });

    // ── US Labor Day (1st Monday in September) ──
    const sep1 = new Date(year, 8, 1);
    const laborDay = 1 + (1 - sep1.getDay() + 7) % 7;
    floating.push({ m: 8, d: laborDay, icon: '👷', name: 'Labor Day (US)' });

    // ── Diwali (approximate — varies each year) ──
    const diwaliDates = {
        2024: [9, 31], 2025: [9, 20], 2026: [10, 8], 2027: [9, 29],
        2028: [9, 17], 2029: [10, 5], 2030: [9, 26], 2031: [9, 16],
    };
    if (diwaliDates[year]) {
        floating.push({ m: diwaliDates[year][0], d: diwaliDates[year][1], icon: '🪔', name: 'Diwali' });
    }

    // ── Ramadan Start (approximate) ──
    const ramadanDates = {
        2024: [2, 11], 2025: [1, 28], 2026: [1, 18], 2027: [1, 8],
        2028: [0, 28], 2029: [0, 16], 2030: [0, 6],
    };
    if (ramadanDates[year]) {
        floating.push({ m: ramadanDates[year][0], d: ramadanDates[year][1], icon: '🌙', name: 'Начало Рамадана' });
    }

    // ── Eid al-Fitr (approximate, end of Ramadan) ──
    const eidDates = {
        2024: [3, 10], 2025: [2, 30], 2026: [2, 20], 2027: [2, 10],
        2028: [1, 27], 2029: [1, 14], 2030: [1, 5],
    };
    if (eidDates[year]) {
        floating.push({ m: eidDates[year][0], d: eidDates[year][1], icon: '🕌', name: 'Eid al-Fitr' });
    }

    // ── Hanukkah Start (approximate) ──
    const hanukkahDates = {
        2024: [11, 25], 2025: [11, 14], 2026: [11, 4], 2027: [11, 24],
        2028: [11, 12], 2029: [11, 1], 2030: [11, 20],
    };
    if (hanukkahDates[year]) {
        floating.push({ m: hanukkahDates[year][0], d: hanukkahDates[year][1], icon: '🕎', name: 'Hanukkah' });
    }

    return floating;
}

/**
 * Get all holidays for a given year+month
 * Returns a Map: day → [{ icon, name }, ...]
 */
export function getHolidaysForMonth(year, month) {
    const map = new Map();

    const all = [...FIXED_HOLIDAYS, ...getFloatingHolidays(year)];

    all.forEach(h => {
        if (h.m === month) {
            if (!map.has(h.d)) map.set(h.d, []);
            map.get(h.d).push({ icon: h.icon, name: h.name });
        }
    });

    return map;
}
