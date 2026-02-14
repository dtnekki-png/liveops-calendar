# Спецификация: Ивенты (Events)

**Версия:** 1.0  
**Дата:** 14 февраля 2026  
**Файлы:** `events.yaml` (индекс), `{N}-{name}-event.yaml` (конфиги ивентов)

---

## 1. Назначение

Ивенты — **временные игровые события** с собственной валютой, рулеткой, квестами и офферами. Каждый ивент описывается в отдельном YAML-файле. Файл `events.yaml` — индекс, подключающий все активные ивенты.

В терминологии LiveOps Toolkit ивенты — **динамические блоки** в лейне «Ивенты» с чётким расписанием и drill-down в сущности (рулетка, квесты, офферы).

---

## 2. Структура файлов

### 2.1 Индексный файл `events.yaml`

```yaml
include:
  - 3-zargates-event           # Имя файла без расширения
  - 4-vampires-event
  - 4-zargates-event
  - 2-urban-brutes-event
  - 5-shadows-event
  - 6-night-beasts-event
  - 101-vampires-winter-event
  - 102-urban-brutes-winter-event
  - 103-shadows-winter-event
```

Порядок в `include` определяет порядок загрузки. Файлы подключаются по имени (без `.yaml`).

### 2.2 Именование файлов ивентов

Формат: `{id}-{name}-event.yaml`

- `{id}` — числовой идентификатор (может быть составным: 1, 2, 101 и т.д.)
- `{name}` — slug-имя ивента в kebab-case
- Суффикс `-event` обязателен

Примеры: `4-vampires-event.yaml`, `101-vampires-winter-event.yaml`

---

## 3. Два формата ивентов

### 3.1 Формат A: Простой квестовый ивент (Zargates)

Минимальная структура — только квесты, без рулетки и офферов.

```yaml
id: <integer>                      # ОБЯЗАТЕЛЬНО. Уникальный ID ивента
name: <string>                     # ОБЯЗАТЕЛЬНО. Имя (должно содержать ZARGATES)
schedule: [ ... ]                  # ОБЯЗАТЕЛЬНО. Массив временных окон
platforms: [ <PlatformEnum> ]      # ОБЯЗАТЕЛЬНО. Платформы (TG)
uiData: { ... }                   # ОБЯЗАТЕЛЬНО. UI-данные
questSlots: [ ... ]               # ОБЯЗАТЕЛЬНО. Массив слотов квестов
```

### 3.2 Формат B: Полный гача-ивент

Расширенная структура с рулеткой, ивентовой валютой и офферами.

```yaml
id: <integer>                      # ОБЯЗАТЕЛЬНО
name: <string>                     # ОБЯЗАТЕЛЬНО
uiData: { ... }                   # ОБЯЗАТЕЛЬНО
schedule: [ ... ]                  # ОБЯЗАТЕЛЬНО
eventCurrencies: { ... }          # ОБЯЗАТЕЛЬНО. Ивентовые валюты
rollPricing: { ... }              # ОБЯЗАТЕЛЬНО. Стоимость роллов рулетки
lootPerRoll: [ ... ]              # ОБЯЗАТЕЛЬНО. Лут-таблица рулетки
questSlots: [ ... ]               # ОБЯЗАТЕЛЬНО. Квесты
offers: [ ... ]                   # ОБЯЗАТЕЛЬНО. Внутриивентовые офферы (бандлы)
```

---

## 4. Общие поля

### 4.1 `id`

Целое число. Уникально глобально среди всех ивентов.

Диапазоны:

| Диапазон | Тип |
|----------|-----|
| 1–99 | Основные ивенты |
| 100–199 | Зимние вариации |
| 1001–1099 | Zargates (итерации) |

### 4.2 `name`

Строка. Внутреннее имя ивента. Используется как идентификатор в коде.

| Имя | Ивент |
|-----|-------|
| `ZARGATES` | Квестовый ивент Zargates |
| `URBAN_BRUTES` | Гача-ивент Urban Brutes |
| `VAMPIRES` | Гача-ивент Vampires |
| `SHADOWS` | Гача-ивент Shadows |
| `NIGHT_BEASTS` | Гача-ивент Night Beasts |
| `VAMPIRES_WINTER` | Зимний Vampires |
| `URBAN_BRUTES_WINTER` | Зимний Urban Brutes |
| `SHADOWS_WINTER` | Зимний Shadows |

### 4.3 `platforms`

Массив платформ. Только в формате A (Zargates). Значения: `TG` (Telegram).

### 4.4 `schedule`

Массив временных окон. Каждый элемент:

```yaml
- start: <ISO 8601 datetime>          # ОБЯЗАТЕЛЬНО. Начало ивента
  questEnd: <ISO 8601 datetime>        # ОБЯЗАТЕЛЬНО. Конец квестов
  end: <ISO 8601 datetime>             # ОБЯЗАТЕЛЬНО. Конец ивента (показ наград/магазина)
  startPreview: <ISO 8601 datetime>    # Опционально. Начало превью (анонс до старта)
```

**Правила:**

- `startPreview < start < questEnd ≤ end`
- `start` — момент, когда ивент полноценно доступен игроку
- `questEnd` — момент, после которого нельзя выполнять квесты
- `end` — момент, после которого ивент полностью исчезает
- `startPreview` — баннер/анонс до старта (обычно за 1–2 дня)
- Таймзона: `+03` (UTC+3)
- У ивента может быть **несколько окон** (рекуррентный ивент)

**Пример:**

```yaml
schedule:
  - { startPreview: 2026-02-11T00:00:00+03, start: 2026-02-13T00:00:00+03, questEnd: 2026-02-20T00:00:00+03, end: 2026-02-21T00:00:00+03 }
```

---

## 5. Блок `uiData` (ивента)

### 5.1 Формат A (Zargates)

```yaml
uiData:
  title: <string>                      # Ключ локализации заголовка
  description: <string>                # Ключ локализации описания
  infoTitle: <string>                  # Ключ локализации заголовка инфо-попапа
  infoText: <string>                   # Ключ локализации текста инфо-попапа
  link: <string>                       # URL (ссылка на Telegram-бота)
  icon: <string>                       # Путь к иконке
  onBanner: <boolean>                  # Показывать ли на баннере
  bannerIcon: <string>                 # Путь к маленькой иконке баннера
  popupImage: <string>                 # Путь к изображению попапа
```

### 5.2 Формат B (гача-ивент)

```yaml
uiData:
  title: <string>                          # Ключ локализации заголовка
  cardBackgroundImage: <string>            # Фон карточки (десктоп)
  newEventPopupBackground: <string>        # Фон попапа нового ивента
  cardBackgroundImageMobile: <string>      # Фон карточки (мобильный)
  cardMainImage: <string>                  # Основное изображение карточки
  backgroundImage: <string>               # Фон экрана ивента (десктоп)
  backgroundImageMobile: <string>          # Фон экрана ивента (мобильный)
  firstMainImage: <string>                # Изображение 1-го пака
  secondMainImage: <string>               # Изображение 2-го пака
  thirdMainImage: <string>                # Изображение 3-го пака
  labInfoPopupContent:                    # Содержимое инфо-попапа лаборатории
    - title: <string>                      # Ключ локализации заголовка параграфа
      text: <string>                       # Ключ локализации текста параграфа
```

**Соглашение по путям:**

- Формат: `content/events/Icons/{eventN}/{filename}.{ext}`
- `{eventN}` = `event1` (Urban Brutes), `event2` (Vampires), `event3` (Shadows), `event4` (зимние), `event5` (Night Beasts)

---

## 6. Блок `eventCurrencies` (только формат B)

Определяет ивентовую валюту и правила компенсации при завершении ивента.

```yaml
eventCurrencies:
  <CURRENCY_NAME>:                     # Имя валюты (формат: {NAME}_EVENT_KEY)
    compensation:
      multiplier: <integer>            # Множитель конвертации
      currency: <CurrencyEnum>         # Валюта, в которую конвертируется остаток
```

Пример: `VAMPIRES_EVENT_KEY: { compensation: { multiplier: 30, currency: BOOST } }` — после ивента 1 ключ = 30 BOOST.

**Маппинг ивентовых валют:**

| Ивент | Валюта | Компенсация |
|-------|--------|-------------|
| URBAN_BRUTES | `URBAN_BRUTES_EVENT_KEY` | ×30 BOOST |
| VAMPIRES | `VAMPIRES_EVENT_KEY` | ×30 BOOST |
| SHADOWS | `SHADOWS_EVENT_KEY` | ×30 BOOST |
| NIGHT_BEASTS | `NIGHT_BEASTS_EVENT_KEY` | ×30 BOOST |
| VAMPIRES_WINTER | `VAMPIRES_WINTER_EVENT_KEY` | ×30 BOOST |
| URBAN_BRUTES_WINTER | `URBAN_BRUTES_WINTER_EVENT_KEY` | ×30 BOOST |
| SHADOWS_WINTER | `SHADOWS_WINTER_EVENT_KEY` | ×30 BOOST |

---

## 7. Блок `rollPricing` (только формат B)

Стоимость роллов рулетки.

```yaml
rollPricing:
  1:                                   # Количество роллов
    internal:
      price: 1                         # Стоимость
      currency: <EVENT_KEY>            # Ивентовая валюта
  10:
    internal:
      price: 10
      currency: <EVENT_KEY>
```

Всегда два варианта: 1 ролл и 10 роллов. Цена линейная (10 роллов = 10× цены 1 ролла).

---

## 8. Блок `lootPerRoll` (только формат B)

Лут-таблица рулетки. Массив из 10 позиций. **Сумма всех `probability` должна быть равна 1.0.**

```yaml
lootPerRoll:
  - type: <LootTypeEnum>
    # Поля зависят от type (см. §8.1)
    probability: <float>               # ОБЯЗАТЕЛЬНО. Вероятность (0.0–1.0)
    guaranteeId: <integer>             # Опционально. ID гарантии (pity)
    guaranteeAt: <integer>             # Опционально. Через сколько роллов гарантия
```

### 8.1 Структура позиций лут-таблицы

Стандартный порядок (от редкого к частому):

| # | type | Описание | Доп. поля | Пример probability |
|---|------|----------|-----------|-------------------|
| 1 | `CUSTOM_HERO` | Герой Mythic | `setId`, `rarity: MYTHIC`, `guaranteeId`, `guaranteeAt` | 0.0015–0.002 |
| 2 | `CUSTOM_HERO` | Герой Legendary | `setId`, `rarity: LEGENDARY`, `guaranteeId`, `guaranteeAt` | 0.0038–0.005 |
| 3 | `CUSTOM_HERO` | Герой Epic | `setId`, `rarity: EPIC`, `guaranteeId`, `guaranteeAt` | 0.0133–0.0171 |
| 4 | `CURRENCY` | Шарды Rare | `currency: RARE_SHARD_N`, `count: 20` | 0.07 |
| 5 | `CURRENCY` | Шарды Common | `currency: COMMON_SHARD_N`, `count: 20` | 0.15 |
| 6 | `CURRENCY` | BOOST | `currency: BOOST`, `count: 20–30` | 0.2–0.25 |
| 7 | `CURRENCY` | SUPER_BOOST | `currency: SUPER_BOOST`, `count: 20–30` | 0.2 |
| 8 | `CURRENCY` | ULTRA_BOOST | `currency: ULTRA_BOOST`, `count: 20–30` | 0.1–0.15 |
| 9 | `CURRENCY` | HARD | `currency: HARD`, `count: 15–20` | 0.1614–0.2159 |
| 10 | `CURRENCY` | Ивентовые ключи | `currency: <EVENT_KEY>`, `count: 2` | 0.05 |

### 8.2 Варианты лут-таблиц

**Основные ивенты** (Urban Brutes, Vampires, Shadows, Night Beasts):

- Позиции 4–5: шарды (RARE_SHARD_N + COMMON_SHARD_N)
- count = 20 для всех валют
- HARD count = 15

**Зимние ивенты** (Vampires Winter, Urban Brutes Winter, Shadows Winter):

- Позиции 3–5 заменены на героев Rare и Common (5 позиций героев вместо 3)
- Нет шардов
- count = 30 для бустов и HARD count = 20
- Улучшенные гарантии (Mythic@150, Legendary@60, Epic@35 против 200/80/45)

### 8.3 Pity-система (гарантии)

| Поле | Описание |
|------|----------|
| `guaranteeId` | Уникальный глобальный ID гарантии |
| `guaranteeAt` | Через сколько роллов без этого лута — гарантированная выдача |

Значения `guaranteeId` уникальны **глобально** (не пересекаются между ивентами).

Диапазоны `guaranteeId`:

| Ивент | guaranteeId |
|-------|-------------|
| URBAN_BRUTES | 21–23 |
| VAMPIRES | 31–33 |
| SHADOWS | 41–43 |
| VAMPIRES_WINTER | 51–53 |
| URBAN_BRUTES_WINTER | 61–63 |
| SHADOWS_WINTER | 71–73 |
| NIGHT_BEASTS | 81–83 |

---

## 9. Блок `questSlots`

Массив слотов квестов. Каждый слот = группа квестов одного типа с возрастающей сложностью.

```yaml
questSlots:
  - quests:                            # Слот 1
      - id: <integer>                 # Уникальный ID квеста в рамках ивента
        type: <QuestTypeEnum>          # Тип квеста
        value: <integer>               # Целевое значение
        parameters:                    # Опционально. Дополнительные параметры
          faction: <integer>           # ID фракции
          rarity: <RarityEnum>         # Редкость
          currencies: [ <string> ]     # Валюты для трат
        loot: [ ... ]                  # Награда за выполнение
        uiData:
          icon: <string>              # Путь к иконке квеста
```

### 9.1 Перечисление `QuestTypeEnum`

**Формат A (Zargates):**

| Тип | Описание | Параметры |
|-----|----------|-----------|
| `EVOLVE_HEROES` | Эволюция N героев | — |

**Формат B (гача-ивенты):**

| Тип | Описание | Параметры |
|-----|----------|-----------|
| `COMPLETE_EVENT_DAILY_QUESTS` | Выполнить N ежедневных квестов | — |
| `EVENT_EVOLVE_HEROES` | Эволюция N героев (ивентовый) | — |
| `EVENT_PLAY_FACTION_BATTLES` | Провести N боёв фракцией | `faction` |
| `EVENT_SELL_HERO` | Продать N героев | — |
| `CLAIM_RARITY_FACTION_HERO` | Получить героя редкости R фракции F | `rarity`, `faction` |
| `SPEND_EVENT_CURRENCIES` | Потратить N валюты | `currencies` |

### 9.2 Стандартная структура слотов (формат B)

6 слотов с фиксированной структурой:

| Слот | Тип квестов | Кол-во ступеней | Лут (валюта) |
|------|------------|----------------|-------------|
| 1 | `COMPLETE_EVENT_DAILY_QUESTS` | 7 (value: 3,6,9,12,15,18,21) или 9 (до 27) | ×1 ивентовый ключ каждая |
| 2 | `EVENT_EVOLVE_HEROES` | 4 (value: 10,30,60,100) | 1,1,2,2 ключа |
| 3 | `EVENT_PLAY_FACTION_BATTLES` | 4 (value: 10,30,60,100) | 1,1,2,2 ключа |
| 4 | `EVENT_SELL_HERO` | 4 (value: 1,3,6,10) | 1,2,3,4 ключа |
| 5 | `CLAIM_RARITY_FACTION_HERO` | 5 (COMMON,RARE,EPIC,LEGENDARY,LEGENDARY) | 1,2,3,4,4 ключа |
| 6 | `SPEND_EVENT_CURRENCIES` | 6 (value: 200,600,1200,2200,4200,8200) | 2,3,5,6,8,10 ключей |

### 9.3 Нумерация ID квестов

Внутри ивента ID квестов нумеруются по схеме:

- Слот 1: 10, 20, 30, 40, 50, 60, 70, [80, 90]
- Слот 2: 110, 120, 130, 140
- Слот 3: 210, 220, 230, 240
- Слот 4: 310, 320, 330, 340
- Слот 5: 410, 420, 430, 440, 450
- Слот 6: 510, 520, 530, 540, 550, 560

Шаг = 10, сотня = номер слота.

### 9.4 Параметр `faction`

Привязка к фракции героев:

| Ивент | faction |
|-------|---------|
| URBAN_BRUTES / URBAN_BRUTES_WINTER | 1 |
| SHADOWS / SHADOWS_WINTER | 2 |
| NIGHT_BEASTS | 4 |
| VAMPIRES / VAMPIRES_WINTER | 6 |

---

## 10. Блок `offers` (внутриивентовые, только формат B)

Массив ивентовых бандлов. Отличается от `offers.yaml` — это **встроенные офферы ивента**, показываемые внутри экрана ивента.

```yaml
offers:
  - id: <integer>                      # ID оффера внутри ивента (1–6)
    type: EventBundle                  # Всегда "EventBundle"
    count: <integer>                   # Опционально. Лимит покупок за период
    period: <integer>                  # ОБЯЗАТЕЛЬНО. Период обновления (мс). Стандарт: 86400000 (24ч)
    shopItem:
      id: <integer>                    # Глобально уникальный shopItem.id
      category: OFFER                  # Всегда "OFFER"
      payment: { ... }                # Опционально. Нет = бесплатный
      loot: [ ... ]                   # Награды
      uiData: { ... }                # UI-данные
```

### 10.1 Стандартная линейка из 6 бандлов

| # | Оплата | Цена | Лут (ивентовые ключи) | Доп. лут | count |
|---|--------|------|-----------------------|----------|-------|
| 1 | Бесплатный | — | 1 ключ | — | 1 |
| 2 | Внутренняя (HARD) | 50 HARD | 1 ключ | — | 2 |
| 3 | Telegram + Xsolla | $5 (250 XTR) | 10 ключей | 100 SUPER_BOOST | 1 |
| 4 | Telegram + Xsolla | $20 (1000 XTR) | 30 ключей | 200 SUPER_BOOST + 100 ULTRA_BOOST | 2 |
| 5 | Telegram + Xsolla | $50 (2500 XTR) | 60 ключей | 550 SUPER_BOOST + 250 ULTRA_BOOST | 2 |
| 6 | Telegram + Xsolla | $100 (5000 XTR) | 100 ключей | 800 SUPER_BOOST + 400 ULTRA_BOOST | безлимитно |

### 10.2 `shopItem.uiData` для ивентовых бандлов

```yaml
uiData:
  image: content/events/Icons/chest.webp    # Стандартная иконка сундука
  discount: <integer>                       # Опционально. Размер скидки (300, 200, 150, 100)
  onPopup: [ <integer> ]                    # Опционально. На каких попапах показывать
  timeVisual: <boolean>                     # Опционально. false = скрыть таймер (для бандла #6)
```

### 10.3 Диапазоны shopItem.id для ивентовых бандлов

| Ивент | shopItem.id |
|-------|-------------|
| URBAN_BRUTES | 21–26 |
| SHADOWS | 27–32 |
| VAMPIRES | 33–38 |
| VAMPIRES_WINTER | 39–44 |
| URBAN_BRUTES_WINTER | 45–50 |
| SHADOWS_WINTER | 51–56 |
| NIGHT_BEASTS | 57–62 |

---

## 11. Валидация и бизнес-правила

### 11.1 Уникальность

- `id` ивента: глобально уникален среди всех ивентов
- `shopItem.id` в `offers`: глобально уникален (не пересекается с offers.yaml и static shop)
- `guaranteeId`: глобально уникален
- Квест `id`: уникален в рамках одного ивента

### 11.2 Расписание

- Окна расписания одного ивента не должны пересекаться
- `startPreview < start < questEnd ≤ end`
- Все даты в таймзоне `+03`

### 11.3 Лут-таблица рулетки

- **Сумма `probability` = 1.0** (с точностью до 4 знаков)
- `setId` одинаковый для всех героев в `lootPerRoll` одного ивента
- `guaranteeAt` > 0
- `count` > 0 для всех валютных позиций

### 11.4 Ивентовая валюта

- Имя валюты должно соответствовать паттерну `{EVENT_NAME}_EVENT_KEY`
- Та же валюта используется в `rollPricing`, `questSlots` (лут), и `offers` (лут)

### 11.5 Квесты

- ID квестов нумеруются по схеме: `{slot_number}{step_number}0`
- `value` монотонно возрастает внутри слота
- `loot` в квестах: всегда ивентовая валюта, количество не убывает

### 11.6 Фракции и сеты

- `faction` в квестах (слоты 3 и 5) соответствует фракции ивента
- `setId` в `lootPerRoll` соответствует сету героев ивента
- Шарды в `lootPerRoll` соответствуют сету (RARE_SHARD_N, COMMON_SHARD_N)

### 11.7 Связи между файлами

- Ивентовая валюта из `eventCurrencies` должна использоваться в офферах из `offers.yaml` (связь через лут)
- `setId` ивента должен быть покрыт в `hero-shard-prices.yaml` (для основных ивентов)

---

## 12. Маппинг на модель данных из ТЗ

### 12.1 Ивент целиком → Block

| Поле YAML | Поле модели Block | Примечание |
|----------|-------------------|------------|
| `id` | `config.event_id` | В JSONB |
| `name` | `name` | Имя блока |
| — | `block_type` | `event` |
| `schedule[0].start` | `start_date` | Дата начала текущего окна |
| `schedule[0].end` | `end_date` | Дата конца текущего окна |
| — | `launch_time` | Определяется по `schedule.start` (00:00 = night, иначе day) |
| — | `price_category` | `standard` (базовые) или `expensive` (зимние, улучшенный лут) |
| — | `tags` | Генерируются: `[name, "event", "faction_{N}"]` |
| — | `skeleton_id` | Формат ивента (A или B) |
| — | `skin_id` | Визуальная тема (`event1`, `event2` и т.д.) |
| `eventCurrencies`, `rollPricing`, `lootPerRoll` | `metadata` | Конфигурация рулетки в JSONB |

При нескольких окнах расписания: каждое окно может быть отдельным Block в календаре (с одинаковым `name`, разными `start_date`/`end_date`).

### 12.2 Сущности ивента → Entity

Каждый гача-ивент раскладывается на несколько Entity:

| Сущность | `archetype` | `entity_type_code` | `config` содержит |
|----------|------------|-------------------|-------------------|
| Рулетка ивента | `roulette` | — | `rollPricing`, `lootPerRoll`, `eventCurrencies` |
| Каждый квест-слот | `event` | — | Массив квестов слота |
| Каждый ивентовый бандл | `offer` | — | `shopItem` бандла |

### 12.3 Элементы → Element

**Из uiData ивента:**

| Часть YAML | `element_type` | `key` |
|-----------|----------------|-------|
| `uiData.cardBackgroundImage` | `background` | `card_bg` |
| `uiData.backgroundImage` | `background` | `main_bg` |
| `uiData.cardMainImage` | `icon` | `card_main` |
| `uiData.firstMainImage` | `icon` | `pack_1` |
| `uiData.secondMainImage` | `icon` | `pack_2` |
| `uiData.thirdMainImage` | `icon` | `pack_3` |
| `uiData.title` | `text` | `title_alias` |
| `uiData.newEventPopupBackground` | `background` | `popup_bg` |

**Из рулетки (каждая позиция lootPerRoll):**

| Часть | `element_type` | `key` |
|-------|----------------|-------|
| Позиция N лут-таблицы | `reward` | `roulette_slot_{N}` |

**Из квестов:**

| Часть | `element_type` | `key` |
|-------|----------------|-------|
| `questSlots[S].quests[Q].uiData.icon` | `icon` | `quest_{S}_{Q}_icon` |
| Награда квеста | `reward` | `quest_{S}_{Q}_reward` |

**Из ивентовых бандлов:**

| Часть | `element_type` | `key` |
|-------|----------------|-------|
| `offers[N].shopItem.uiData.image` | `icon` | `bundle_{N}_icon` |
| Каждый элемент лута | `reward` | `bundle_{N}_reward_{M}` |
| Цена | `price` | `bundle_{N}_price` |

---

## 13. Шаблон нового гача-ивента

```yaml
id: <next_event_id>
name: <EVENT_NAME>
uiData: {
  title: <EVENT_NAME>_EVENT_TITLE,
  cardBackgroundImage: content/events/Icons/<eventN>/event-1.png,
  newEventPopupBackground: content/events/Icons/<eventN>/bg-popup.png,
  cardBackgroundImageMobile: content/events/Icons/<eventN>/event-1-mob.png,
  cardMainImage: content/events/Icons/<eventN>/pack_all.png,
  backgroundImage: content/events/Icons/<eventN>/bg-1.png,
  backgroundImageMobile: content/events/Icons/<eventN>/bg-1-mob.png,
  firstMainImage: content/events/Icons/<eventN>/pack-2.png,
  secondMainImage: content/events/Icons/<eventN>/pack-3.png,
  thirdMainImage: content/events/Icons/<eventN>/pack-1.png,
  labInfoPopupContent: [
    { title: EVENT_1_LAB_INFO_POPUP_PARAGRAPH_1_TITLE, text: EVENT_1_LAB_INFO_POPUP_PARAGRAPH_1_TEXT },
    { title: EVENT_1_LAB_INFO_POPUP_PARAGRAPH_2_TITLE, text: EVENT_1_LAB_INFO_POPUP_PARAGRAPH_2_TEXT }
  ]
}
schedule:
  - { startPreview: <preview_date>, start: <start_date>, questEnd: <quest_end_date>, end: <end_date> }
eventCurrencies: {
  <EVENT_NAME>_EVENT_KEY: { compensation: { multiplier: 30, currency: BOOST } },
}
rollPricing:
  1: { internal: { price: 1, currency: <EVENT_NAME>_EVENT_KEY } }
  10: { internal: { price: 10, currency: <EVENT_NAME>_EVENT_KEY } }
lootPerRoll: [
  { type: CUSTOM_HERO, setId: <SET_ID>, rarity: MYTHIC, probability: 0.0015, guaranteeId: <GID>, guaranteeAt: 200 },
  { type: CUSTOM_HERO, setId: <SET_ID>, rarity: LEGENDARY, probability: 0.0038, guaranteeId: <GID+1>, guaranteeAt: 80 },
  { type: CUSTOM_HERO, setId: <SET_ID>, rarity: EPIC, probability: 0.0133, guaranteeId: <GID+2>, guaranteeAt: 45 },
  { type: CURRENCY, currency: RARE_SHARD_<N>, count: 20, probability: 0.07 },
  { type: CURRENCY, currency: COMMON_SHARD_<N>, count: 20, probability: 0.15 },
  { type: CURRENCY, currency: BOOST, count: 20, probability: 0.25 },
  { type: CURRENCY, currency: SUPER_BOOST, count: 20, probability: 0.2 },
  { type: CURRENCY, currency: ULTRA_BOOST, count: 20, probability: 0.1 },
  { type: CURRENCY, currency: HARD, count: 15, probability: 0.1614 },
  { type: CURRENCY, currency: <EVENT_NAME>_EVENT_KEY, count: 2, probability: 0.05 }
]
questSlots:
  # Слот 1: ежедневные квесты (7 ступеней)
  - quests:
      - { id: 10, type: COMPLETE_EVENT_DAILY_QUESTS, value: 3, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 1 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
      - { id: 20, type: COMPLETE_EVENT_DAILY_QUESTS, value: 6, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 1 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
      - { id: 30, type: COMPLETE_EVENT_DAILY_QUESTS, value: 9, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 1 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
      - { id: 40, type: COMPLETE_EVENT_DAILY_QUESTS, value: 12, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 1 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
      - { id: 50, type: COMPLETE_EVENT_DAILY_QUESTS, value: 15, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 1 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
      - { id: 60, type: COMPLETE_EVENT_DAILY_QUESTS, value: 18, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 1 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
      - { id: 70, type: COMPLETE_EVENT_DAILY_QUESTS, value: 21, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 1 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
  # Слот 2: эволюция героев
  - quests:
      - { id: 110, type: EVENT_EVOLVE_HEROES, value: 10, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 1 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
      - { id: 120, type: EVENT_EVOLVE_HEROES, value: 30, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 1 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
      - { id: 130, type: EVENT_EVOLVE_HEROES, value: 60, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 2 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
      - { id: 140, type: EVENT_EVOLVE_HEROES, value: 100, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 2 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
  # Слот 3: бои фракцией
  - quests:
      - { id: 210, type: EVENT_PLAY_FACTION_BATTLES, parameters: { faction: <FACTION_ID> }, value: 10, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 1 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
      - { id: 220, type: EVENT_PLAY_FACTION_BATTLES, parameters: { faction: <FACTION_ID> }, value: 30, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 1 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
      - { id: 230, type: EVENT_PLAY_FACTION_BATTLES, parameters: { faction: <FACTION_ID> }, value: 60, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 2 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
      - { id: 240, type: EVENT_PLAY_FACTION_BATTLES, parameters: { faction: <FACTION_ID> }, value: 100, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 2 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
  # Слот 4: продажа героев
  - quests:
      - { id: 310, type: EVENT_SELL_HERO, value: 1, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 1 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
      - { id: 320, type: EVENT_SELL_HERO, value: 3, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 2 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
      - { id: 330, type: EVENT_SELL_HERO, value: 6, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 3 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
      - { id: 340, type: EVENT_SELL_HERO, value: 10, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 4 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
  # Слот 5: получение героев по редкости
  - quests:
      - { id: 410, type: CLAIM_RARITY_FACTION_HERO, value: 1, parameters: { rarity: COMMON, faction: <FACTION_ID> }, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 1 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
      - { id: 420, type: CLAIM_RARITY_FACTION_HERO, value: 1, parameters: { rarity: RARE, faction: <FACTION_ID> }, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 2 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
      - { id: 430, type: CLAIM_RARITY_FACTION_HERO, value: 1, parameters: { rarity: EPIC, faction: <FACTION_ID> }, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 3 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
      - { id: 440, type: CLAIM_RARITY_FACTION_HERO, value: 1, parameters: { rarity: LEGENDARY, faction: <FACTION_ID> }, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 4 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
      - { id: 450, type: CLAIM_RARITY_FACTION_HERO, value: 1, parameters: { rarity: LEGENDARY, faction: <FACTION_ID> }, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 4 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
  # Слот 6: трата хард-валюты
  - quests:
      - { id: 510, type: SPEND_EVENT_CURRENCIES, value: 200, parameters: { currencies: [HARD] }, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 2 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
      - { id: 520, type: SPEND_EVENT_CURRENCIES, value: 600, parameters: { currencies: [HARD] }, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 3 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
      - { id: 530, type: SPEND_EVENT_CURRENCIES, value: 1200, parameters: { currencies: [HARD] }, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 5 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
      - { id: 540, type: SPEND_EVENT_CURRENCIES, value: 2200, parameters: { currencies: [HARD] }, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 6 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
      - { id: 550, type: SPEND_EVENT_CURRENCIES, value: 4200, parameters: { currencies: [HARD] }, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 8 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
      - { id: 560, type: SPEND_EVENT_CURRENCIES, value: 8200, parameters: { currencies: [HARD] }, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 10 }], uiData: { icon: content/events/Icons/missions-icon.svg } }
offers:
  - { id: 1, type: EventBundle, count: 1, period: 86400000, shopItem: { id: <SID>, category: OFFER, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 1 }], uiData: { image: content/events/Icons/chest.webp } } }
  - { id: 2, type: EventBundle, count: 2, period: 86400000, shopItem: { id: <SID+1>, category: OFFER, payment: { internal: { price: 50, currency: HARD } }, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 1 }], uiData: { image: content/events/Icons/chest.webp, onPopup: [1] } } }
  - { id: 3, type: EventBundle, count: 1, period: 86400000, shopItem: { id: <SID+2>, category: OFFER, payment: { telegram: { title: Event pack, description: Event pack, price: 250, priceUsd: 5.00, photoUrl: content/events/Icons/chest.png }, xsolla: { title: Event pack, price: 4.99 } }, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 10 }, { type: CURRENCY, currency: SUPER_BOOST, count: 100 }], uiData: { image: content/events/Icons/chest.webp, discount: 300, onPopup: [1, 10] } } }
  - { id: 4, type: EventBundle, count: 2, period: 86400000, shopItem: { id: <SID+3>, category: OFFER, payment: { telegram: { title: Event pack, description: Event pack, price: 1000, priceUsd: 20.00, photoUrl: content/events/Icons/chest.png }, xsolla: { title: Event pack, price: 19.99 } }, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 30 }, { type: CURRENCY, currency: SUPER_BOOST, count: 200 }, { type: CURRENCY, currency: ULTRA_BOOST, count: 100 }], uiData: { image: content/events/Icons/chest.webp, discount: 200, onPopup: [10] } } }
  - { id: 5, type: EventBundle, count: 2, period: 86400000, shopItem: { id: <SID+4>, category: OFFER, payment: { telegram: { title: Event pack, description: Event pack, price: 2500, priceUsd: 50.00, photoUrl: content/events/Icons/chest.png }, xsolla: { title: Event pack, price: 49.99 } }, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 60 }, { type: CURRENCY, currency: SUPER_BOOST, count: 550 }, { type: CURRENCY, currency: ULTRA_BOOST, count: 250 }], uiData: { image: content/events/Icons/chest.webp, discount: 150 } } }
  - { id: 6, type: EventBundle, period: 86400000, shopItem: { id: <SID+5>, category: OFFER, payment: { telegram: { title: Event pack, description: Event pack, price: 5000, priceUsd: 100.00, photoUrl: content/events/Icons/chest.png }, xsolla: { title: Event pack, price: 99.99 } }, loot: [{ type: CURRENCY, currency: <EVENT_KEY>, count: 100 }, { type: CURRENCY, currency: SUPER_BOOST, count: 800 }, { type: CURRENCY, currency: ULTRA_BOOST, count: 400 }], uiData: { image: content/events/Icons/chest.webp, discount: 100, timeVisual: false } } }
```

**Плейсхолдеры для замены:**

| Плейсхолдер | Описание |
|------------|----------|
| `<next_event_id>` | Следующий уникальный ID ивента |
| `<EVENT_NAME>` | Имя ивента (UPPER_SNAKE_CASE) |
| `<EVENT_KEY>` | `<EVENT_NAME>_EVENT_KEY` |
| `<SET_ID>` | ID набора героев |
| `<FACTION_ID>` | ID фракции |
| `<GID>` | Стартовый guaranteeId (шаг 10 между ивентами) |
| `<SID>` | Стартовый shopItem.id для бандлов |
| `<eventN>` | Папка ассетов |

---

*Конец спецификации events.*
