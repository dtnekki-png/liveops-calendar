# Спецификация: Офферы (Offers)

**Версия:** 1.0  
**Дата:** 14 февраля 2026  
**Файлы:** `offers.yaml`

---

## 1. Назначение

Офферы — **временные предложения** с календарными датами. Появляются в магазине на ограниченный срок, часто привязаны к ивентам или праздникам. Файл `offers.yaml` — единый реестр всех офферов с расписанием.

В терминологии LiveOps Toolkit офферы — **динамические блоки** (статико-динамические строки календаря), управляемые через даты и привязки к ивентам.

---

## 2. Структура файла

`offers.yaml` — YAML-массив офферов верхнего уровня. Каждый оффер — обёртка над `shopItem` с добавлением расписания и лимитов покупок.

```yaml
- id: <integer>                    # ОБЯЗАТЕЛЬНО. Уникальный ID оффера (в рамках offers.yaml)
  type: Offer                      # ОБЯЗАТЕЛЬНО. Всегда "Offer"
  count: <integer>                 # Опционально. Макс. количество покупок. Без поля = безлимитно
  startDate: <ISO 8601 datetime>   # ОБЯЗАТЕЛЬНО. Начало показа
  endDate: <ISO 8601 datetime>     # ОБЯЗАТЕЛЬНО. Конец показа
  shopItem:                        # ОБЯЗАТЕЛЬНО. Описание товара
    id: <integer>                  # ОБЯЗАТЕЛЬНО. Глобально уникальный ID товара (shopItem)
    category: OFFER                # ОБЯЗАТЕЛЬНО. Всегда "OFFER"
    payment: { ... }               # Опционально. Если нет — оффер бесплатный
    loot: [ ... ]                  # ОБЯЗАТЕЛЬНО. Массив наград
    uiData: { ... }               # ОБЯЗАТЕЛЬНО. Данные для отображения
```

---

## 3. Поля верхнего уровня (обёртка оффера)

### 3.1 `id`

Целое число. Уникально **в рамках `offers.yaml`**. Используется для идентификации оффера в бизнес-логике. Нумерация последовательная от 1.

### 3.2 `type`

Всегда строка `Offer`.

### 3.3 `count`

Максимальное количество покупок оффера одним игроком за период его действия. Если поле отсутствует — покупка не ограничена.

### 3.4 `startDate` / `endDate`

Формат: ISO 8601 с таймзоной. Стандартная таймзона проекта: `+03` (UTC+3).

```yaml
startDate: 2026-02-20T00:00:00+03
endDate: 2026-02-22T00:00:00+03
```

Оффер виден игроку в интервале `[startDate, endDate)`.

---

## 4. Блок `shopItem`

Вложенный объект, описывающий сам товар. Структура повторяет позицию из Static Shop, но с фиксированной категорией `OFFER`.

### 4.1 `shopItem.id`

Глобально уникальный ID товара. **Не должен пересекаться** с ID позиций из Static Shop и с shopItem.id из ивентовых офферов.

Диапазон ID: **10001+** (офферы из `offers.yaml`).

### 4.2 `shopItem.category`

Всегда `OFFER`.

### 4.3 `shopItem.payment`

Аналогично Static Shop. Три вида оплаты:

```yaml
# Реальные деньги — Telegram + Xsolla (обычно оба)
payment:
  telegram:
    title: <string>
    description: <string>
    price: <integer>               # XTR (Telegram Stars)
    priceUsd: <float>              # USD эквивалент (аналитика)
    photoUrl: <string>             # Путь к изображению
  xsolla:
    title: <string>
    price: <float>                 # USD

# Внутренняя валюта
payment:
  internal:
    price: <integer>
    currency: <CurrencyEnum>       # Обычно HARD
```

**Бесплатный оффер:** если `payment` отсутствует, оффер бесплатный (free loot).

### 4.4 `shopItem.loot`

Массив наград. Структура элемента:

```yaml
- type: <LootTypeEnum>            # CURRENCY / STANDARD_HERO / CUSTOM_HERO
  currency: <CurrencyEnum>        # Для CURRENCY
  count: <integer>                # Для CURRENCY
  rarity: <RarityEnum>           # Для STANDARD_HERO / CUSTOM_HERO
  setId: <integer>               # Для CUSTOM_HERO
```

**Ивентовые валюты в луте:** офферы, привязанные к ивентам, выдают ивентовую валюту (например `VAMPIRES_EVENT_KEY`). Это основная связь оффера с ивентом.

### 4.5 `shopItem.uiData`

```yaml
uiData:
  kind: <OfferKindEnum>           # ОБЯЗАТЕЛЬНО. HORIZONTAL или VERTICAL
  showPosition: <integer>         # Опционально. Позиция в списке (1 = первый). Только для HORIZONTAL
  colorImage: <string>            # Опционально. Путь к цветовому оформлению
  discount: <integer>             # Опционально. Размер скидки (отображение)
  resourseType: <string>          # Опционально. "vertical" или "horizontal" — лейаут ресурсов
  title: <string>                 # Опционально. Ключ локализации заголовка (для HORIZONTAL)
  description: <string>           # Опционально. Ключ локализации описания (для HORIZONTAL)
  image: <string>                 # Опционально. Путь к основному изображению (для HORIZONTAL)
  backgroundImage: <string>       # Опционально. Путь к фоновому изображению (для HORIZONTAL)
  multipliers: [ <integer> ]      # Опционально. Множители (для ивентовых офферов)
```

---

## 5. Классификация офферов

### 5.1 По формату отображения (`kind`)

| `kind` | Описание | Обязательные поля uiData |
|--------|----------|------------------------|
| `HORIZONTAL` | Горизонтальная карточка с изображением. Используется для крупных офферов | `showPosition`, `title`, `description`, `image`, `backgroundImage`, `colorImage` |
| `VERTICAL` | Вертикальная компактная карточка. Используется для мелких/бесплатных офферов | `colorImage` |

### 5.2 По типу контента

| Тип | Признаки | Примеры |
|-----|----------|---------|
| **Праздничный** | Не привязан к ивенту, приурочен к дате | Black Friday (id 1–4) |
| **Ивент-стартовый** | Привязан к началу ивента, лут содержит ивентовые ключи + героев Epic | id 5, 7, 9, 30 |
| **Ивент-финальный** | Привязан к концу ивента, лут содержит ивентовые ключи + героев Legendary | id 6, 8, 10, 31 |
| **Бесплатный герой** | Нет `payment`, лут = один герой Rare | id 13, 18, 23 |
| **Бесплатный лут** | Нет `payment`, лут = валюта или бусты | id 14, 15, 19, 20, 24, 25 |
| **Промо-пак героев** | Множественные герои одной фракции, не привязан к ивентовой валюте | id 26–29 |

### 5.3 По ценовым тирам

| Тир | Цена (XTR / USD) | Типичный лут |
|-----|------------------|-------------|
| Бесплатный | 0 | 1 герой Rare / 5 ивентовых ключей / бусты |
| $10 | 500 XTR / $9.99 | 1 герой Epic + ивентовые ключи + 200 HARD |
| $15 | 750 XTR / $14.99 | Ивентовые ключи + HARD |
| $20 | 1000 XTR / $19.99 | 1 герой Legendary + ивентовые ключи + 300 HARD |
| $30 | 1500 XTR / $29.99 | 3 героя Legendary + все тиры бустов |
| $50 | 2500 XTR / $49.99 | Большой пак бустов |
| $100 | 5000 XTR / $99.99 | 3 героя Mythic + все тиры бустов |

---

## 6. Привязка к ивентам

Офферы привязываются к ивентам **через ивентовую валюту** в лут-таблице, а не через явную ссылку. Связь логическая:

| Ивент | Ивентовая валюта | Фракция/setId |
|-------|-----------------|---------------|
| VAMPIRES | `VAMPIRES_EVENT_KEY` | setId: 5 |
| SHADOWS | `SHADOWS_EVENT_KEY` | setId: 6 |
| URBAN_BRUTES | `URBAN_BRUTES_EVENT_KEY` | setId: 1 |
| NIGHT_BEASTS | `NIGHT_BEASTS_EVENT_KEY` | setId: 2 |
| VAMPIRES_WINTER | `VAMPIRES_WINTER_EVENT_KEY` | setId: 7 |
| URBAN_BRUTES_WINTER | `URBAN_BRUTES_WINTER_EVENT_KEY` | setId: 8 |
| SHADOWS_WINTER | `SHADOWS_WINTER_EVENT_KEY` | setId: 9 |

**Паттерн ивентовых офферов:** обычно пара — «start» оффер (за 2 дня до конца, Epic герой, $10) и «end» оффер (последние 2 дня, Legendary герой, $20). Зимние ивенты дополнительно включают 3 бесплатных оффера (герой Rare, ивентовые ключи, бусты).

### 6.1 Временная согласованность

- `startDate` оффера должен попадать в `schedule` соответствующего ивента
- «Start» оффер: начало ≈ дата старта ивента, длительность 2 дня
- «End» оффер: конец ≈ дата `questEnd` ивента, длительность 2 дня
- Бесплатные офферы: покрывают весь период ивента или вторую половину

---

## 7. Валидация и бизнес-правила

### 7.1 ID

- `id` (верхний уровень): уникален в `offers.yaml`, последовательная нумерация
- `shopItem.id`: глобально уникален, диапазон 10001+

### 7.2 Даты

- `startDate < endDate`
- Формат ISO 8601 с таймзоной `+03`
- Офферы не должны конфликтовать по позиции (`showPosition`) в одном временном окне

### 7.3 Бесплатные офферы

- Если `payment` отсутствует — оффер бесплатный
- Бесплатные офферы обычно имеют `count: 1`

### 7.4 Ценообразование

- `payment.telegram.price` (XTR) и `priceUsd` (USD) согласованы (50 XTR ≈ $1.00)
- `payment.xsolla.price` — USD, обычно на $0.01 ниже целого
- `photoUrl` в `telegram` блоке должен указывать на существующий ассет

### 7.5 Лут

- Минимум один элемент в `loot`
- Если лут содержит ивентовую валюту — оффер логически привязан к ивенту
- `setId` в лут-героях должен соответствовать ивенту (см. таблицу в §6)

### 7.6 `showPosition`

- Только для `kind: HORIZONTAL`
- В один момент времени не должно быть двух HORIZONTAL-офферов с одинаковым `showPosition`
- Значение 1 = верхняя позиция

### 7.7 `multipliers`

- Массив целых чисел
- Используется для ивентовых офферов, определяет множитель стоимости при повторной покупке
- `[1]` — цена не меняется при каждой покупке
- `[3]` — цена утраивается

---

## 8. Маппинг на модель данных из ТЗ

### 8.1 `offers.yaml` целиком → Block

Весь файл `offers.yaml` можно рассматривать как один мета-блок «Планирование офферов». Однако более точный маппинг — **каждый логический кластер офферов → Block**:

| Кластер | Block name | Block type | start_date | end_date |
|---------|-----------|------------|------------|----------|
| Black Friday (id 1–4) | Black Friday | `event` | 2025-11-28 | 2025-12-01 |
| Vampires start+end (id 5–6) | Vampires Offers Feb | `static_dynamic` | 2026-02-20 | 2026-02-28 |
| Night Beasts promo (id 26–29) | Night Beasts Promo | `static_dynamic` | 2026-01-28 | 2026-02-12 |

Альтернативный вариант: каждый оффер = отдельный Block в лейне «Офферы».

### 8.2 Каждый оффер → Entity

| Поле YAML | Поле модели Entity | Примечание |
|----------|-------------------|------------|
| `id` | `config.offer_id` | ID оффера в JSONB |
| `type` | — | Всегда "Offer" |
| `shopItem.id` | `config.shop_item_id` | ID товара |
| `shopItem.category` | `archetype` | `offer` |
| — | `entity_type_code` | По ивенту: `VAMPIRES_OFFER`, `SHADOWS_OFFER` и т.д. |
| — | `name` | Из `uiData.title` или генерация |
| `count` | `config.purchase_limit` | Лимит покупок |
| `startDate` | `config.start_date` | Начало показа |
| `endDate` | `config.end_date` | Конец показа |
| `shopItem.payment` + `loot` + `uiData` | `config` | Весь конфиг в JSONB |

### 8.3 Компоненты оффера → Element

| Часть YAML | `element_type` | `key` |
|-----------|----------------|-------|
| `shopItem.uiData.image` | `icon` | `main_icon` |
| `shopItem.uiData.backgroundImage` | `background` | `background_1` |
| `shopItem.uiData.colorImage` | `background` | `color_image` |
| `shopItem.uiData.title` | `text` | `title_alias` |
| `shopItem.uiData.description` | `text` | `description_alias` |
| `shopItem.payment.telegram.price` | `price` | `telegram_price` |
| `shopItem.payment.xsolla.price` | `price` | `xsolla_price` |
| `shopItem.payment.internal.price` | `price` | `internal_price` |
| каждый `shopItem.loot[N]` | `reward` | `reward_slot_{N}` |
| `shopItem.uiData.discount` | `price` | `discount_display` |

---

## 9. Шаблоны типовых офферов

### 9.1 Ивентовый стартовый оффер ($10, Epic герой)

```yaml
- id: <next_id>
  type: Offer
  count: 3
  startDate: <event_start>T00:00:00+03
  endDate: <event_start + 2d>T00:00:00+03
  shopItem:
    id: <next_shop_id>
    category: OFFER
    payment:
      telegram:
        title: Offer
        description: Offer
        price: 500
        priceUsd: 10.00
        photoUrl: <image_path>
      xsolla:
        title: Offer
        price: 9.99
    loot: [
      { type: CUSTOM_HERO, setId: <event_set_id>, rarity: EPIC },
      { type: CURRENCY, currency: <EVENT_KEY>, count: 10 },
      { type: CURRENCY, currency: HARD, count: 200 }
    ]
    uiData: {
      kind: HORIZONTAL,
      showPosition: 2,
      colorImage: content/shop/colors/epic_1.svg,
      discount: 300,
      resourseType: vertical,
      title: <TITLE_KEY>,
      description: <DESCRIPTION_KEY>,
      image: <image_path>,
      backgroundImage: <bg_path>,
      multipliers: [ 1 ]
    }
```

### 9.2 Ивентовый финальный оффер ($20, Legendary герой)

```yaml
- id: <next_id>
  type: Offer
  count: 3
  startDate: <event_questEnd - 2d>T00:00:00+03
  endDate: <event_end>T00:00:00+03
  shopItem:
    id: <next_shop_id>
    category: OFFER
    payment:
      telegram:
        title: Offer
        description: Offer
        price: 1000
        priceUsd: 20.00
        photoUrl: <image_path>
      xsolla:
        title: Offer
        price: 19.99
    loot: [
      { type: CUSTOM_HERO, setId: <event_set_id>, rarity: LEGENDARY },
      { type: CURRENCY, currency: <EVENT_KEY>, count: 30 },
      { type: CURRENCY, currency: HARD, count: 300 }
    ]
    uiData: {
      kind: HORIZONTAL,
      showPosition: 1,
      colorImage: content/shop/colors/legendary_1.svg,
      discount: 500,
      resourseType: vertical,
      title: <TITLE_KEY>,
      description: <DESCRIPTION_KEY>,
      image: <image_path>,
      backgroundImage: <bg_path>,
      multipliers: [ 1 ]
    }
```

### 9.3 Бесплатный оффер (герой Rare)

```yaml
- id: <next_id>
  type: Offer
  count: 1
  startDate: <event_start>T00:00:00+03
  endDate: <event_end>T00:00:00+03
  shopItem:
    id: <next_shop_id>
    category: OFFER
    loot: [
      { type: CUSTOM_HERO, setId: <event_set_id>, rarity: RARE }
    ]
    uiData: {
      kind: HORIZONTAL,
      colorImage: content/shop/colors/rare_1.svg,
      title: <TITLE_KEY>,
      description: <DESCRIPTION_KEY>,
      image: <image_path>,
      backgroundImage: <bg_path>,
      multipliers: [ 1 ]
    }
```

---

## 10. Соглашения

| Параметр | Соглашение |
|----------|-----------|
| ID оффера | Последовательная нумерация от 1 |
| shopItem.id | Диапазон 10001+ |
| Таймзона | `+03` (UTC+3) |
| Время начала/конца | `T00:00:00` (полночь) |
| `count` по умолчанию | 3 (для платных), 1 (для бесплатных) |
| `showPosition` | 1 = верхний, 2 = второй |
| Курс XTR/USD | 50 XTR ≈ $1.00 |

---

*Конец спецификации offers.*
