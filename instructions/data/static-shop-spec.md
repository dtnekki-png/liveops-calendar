# Спецификация: Статичные позиции магазина (Static Shop)

**Версия:** 1.0  
**Дата:** 14 февраля 2026  
**Файлы:** `gems.yaml`, `boost-colas.yaml`, `booster-pack.yaml`, `hero-shard-prices.yaml`, `starter-pack.yaml`, `onboarding-offers.yaml`

---

## 1. Назначение

Статичные позиции магазина — товары, которые **всегда доступны** игроку (или становятся доступны по условию, но без привязки к календарным датам). У них нет `startDate`/`endDate`. Каждый файл описывает одну товарную категорию и содержит YAML-массив позиций.

В терминологии LiveOps Toolkit это **статичные блоки** — строки календаря без временной привязки.

---

## 2. Перечень файлов и категорий

| Файл | Категория (`category`) | Описание | Оплата |
|------|----------------------|----------|--------|
| `gems.yaml` | `GEMS` | Пакеты премиум-валюты (HARD) | Реальные деньги (Telegram Stars + Xsolla) |
| `boost-colas.yaml` | `BOOST_COLA` | Бусты трёх тиров | Внутренняя (HARD) |
| `booster-pack.yaml` | `BOOSTER_PACK` | Бустер-паки с героями | Внутренняя (HARD) |
| `hero-shard-prices.yaml` | `HERO_SHARD` | Обмен шардов на героев | Внутренняя (шарды) |
| `starter-pack.yaml` | `STARTER_PACK` | Последовательная цепочка стартовых паков | Реальные деньги (Telegram Stars + Xsolla) |
| `onboarding-offers.yaml` | — | Онбординговые офферы (зарезервирован) | — |

---

## 3. Общая структура позиции (ShopItem)

Все позиции во всех файлах следуют единой корневой структуре:

```yaml
- id: <integer>                    # ОБЯЗАТЕЛЬНО. Уникальный ID позиции (глобально уникальный)
  category: <CategoryEnum>         # ОБЯЗАТЕЛЬНО. Тип товара
  payment:                         # ОБЯЗАТЕЛЬНО (кроме бесплатных). Способы оплаты
    telegram: { ... }              # Опционально. Оплата через Telegram Stars
    xsolla: { ... }               # Опционально. Оплата через Xsolla
    internal: { ... }             # Опционально. Оплата внутренней валютой
  loot: [ ... ]                    # ОБЯЗАТЕЛЬНО. Массив наград
  uiData: { ... }                 # ОБЯЗАТЕЛЬНО (может быть пустым). Данные для отображения
```

### 3.1 Дополнительные поля (зависят от категории)

| Поле | Тип | Категории | Описание |
|------|-----|-----------|----------|
| `starterPackIndex` | integer | `STARTER_PACK` | Порядковый номер в цепочке стартовых паков (1–N) |

---

## 4. Блок `payment`

Позиция имеет **один или несколько** способов оплаты. Способы не являются взаимоисключающими — для товаров за реальные деньги обычно указываются и `telegram`, и `xsolla`.

### 4.1 `payment.telegram` — оплата через Telegram Stars

```yaml
telegram:
  title: <string>                  # ОБЯЗАТЕЛЬНО. Название в Telegram-платёжке
  description: <string>            # ОБЯЗАТЕЛЬНО. Описание в Telegram-платёжке
  price: <integer>                 # ОБЯЗАТЕЛЬНО. Цена в XTR (Telegram Stars)
  priceUsd: <float>                # ОБЯЗАТЕЛЬНО. Эквивалент в USD (для аналитики sum_of_payments)
  photoUrl: <string>               # ОБЯЗАТЕЛЬНО. Путь к изображению для платёжки
```

### 4.2 `payment.xsolla` — оплата через Xsolla

```yaml
xsolla:
  title: <string>                  # ОБЯЗАТЕЛЬНО. Название товара в Xsolla
  price: <float>                   # ОБЯЗАТЕЛЬНО. Цена в USD
```

### 4.3 `payment.internal` — оплата внутренней валютой

```yaml
internal:
  price: <integer>                 # ОБЯЗАТЕЛЬНО. Количество валюты
  currency: <CurrencyEnum>         # ОБЯЗАТЕЛЬНО. Тип валюты (HARD, шарды и т.д.)
```

---

## 5. Блок `loot`

Массив наград. Каждый элемент:

```yaml
- type: <LootTypeEnum>            # ОБЯЗАТЕЛЬНО. Тип лута
  # Дополнительные поля в зависимости от type:
  currency: <CurrencyEnum>        # Для type: CURRENCY. Какая валюта
  count: <integer>                # Для type: CURRENCY. Количество
  rarity: <RarityEnum>           # Для type: STANDARD_HERO / CUSTOM_HERO. Редкость
  setId: <integer>               # Для type: CUSTOM_HERO. ID сета героев
  probability: <float>           # Для бустер-паков. Вероятность (0.0–1.0)
  guaranteeId: <integer>         # Опционально. ID гарантии (pity-система)
  guaranteeAt: <integer>         # Опционально. После скольких попыток гарантия срабатывает
```

### 5.1 Перечисление `LootTypeEnum`

| Значение | Описание | Обязательные доп. поля |
|----------|----------|----------------------|
| `CURRENCY` | Выдача валюты | `currency`, `count` |
| `STANDARD_HERO` | Случайный стандартный герой | `rarity` |
| `CUSTOM_HERO` | Герой из конкретного сета | `rarity`, `setId` |

### 5.2 Перечисление `RarityEnum`

`COMMON` → `RARE` → `EPIC` → `LEGENDARY` → `MYTHIC`

### 5.3 Перечисление `CurrencyEnum` (в контексте Static Shop)

**Основные валюты:**

| Валюта | Описание |
|--------|----------|
| `HARD` | Премиум-валюта (гемы) |
| `BOOST` | Буст базовый |
| `SUPER_BOOST` | Буст продвинутый |
| `ULTRA_BOOST` | Буст максимальный |

**Шарды** (формат `{RARITY}_SHARD_{N}`, где N = номер набора):

`COMMON_SHARD_1` … `MYTHIC_SHARD_1`, `COMMON_SHARD_2` … `MYTHIC_SHARD_2`, и т.д.  
Покрывают наборы 1–6.

---

## 6. Блок `uiData`

Структура `uiData` зависит от категории. Общие поля:

```yaml
uiData:
  image: <string>                  # Путь к иконке/изображению товара
  discount: <integer>              # Опционально. Размер скидки (в процентах, отображается на UI)
```

### 6.1 Специфичные поля по категориям

**GEMS:** только `image` и `discount`.

**BOOST_COLA:** только `image` и `discount`.

**BOOSTER_PACK:**

```yaml
uiData:
  kind: <BoosterKindEnum>          # COMMON / RARE / EPIC / SUMMER и т.д.
  title: <string>                  # Ключ локализации заголовка
  description: <string>            # Ключ локализации описания
  subDescription: <string>         # Опционально. Ключ локализации подзаголовка
  image: <string>                  # Путь к изображению
```

**HERO_SHARD:** `uiData` пустой (нет визуальных данных на уровне конфига, рендерится клиентом по типу шарда).

**STARTER_PACK:**

```yaml
uiData:
  kind: <BoosterKindEnum>          # COMMON / LEGENDARY и т.д.
  discount: <integer>              # Размер скидки
  title: <string>                  # Ключ локализации заголовка
  description: <string>            # Ключ локализации описания
  image: <string>                  # Путь к изображению
```

---

## 7. Спецификация по файлам

### 7.1 `gems.yaml`

Пакеты покупки премиум-валюты за реальные деньги.

**Правила:**

- Всегда `category: GEMS`
- Оплата: обязательно и `telegram`, и `xsolla`
- Лут: ровно один элемент `{ type: CURRENCY, currency: HARD, count: N }`
- Скидки (`discount`) растут с размером пакета (от 0% до 40%)
- Соотношение XTR к USD: примерно 50 XTR = $1.00

**Пример минимальной позиции:**

```yaml
- id: 1001
  category: GEMS
  payment:
    telegram:
      title: 100 gems
      description: 100 gems
      price: 100
      priceUsd: 2.00
      photoUrl: content/shop/Icons/gems_medium.png
    xsolla:
      title: Gem Pack 1
      price: 1.99
  loot: [ { type: CURRENCY, currency: HARD, count: 100 } ]
  uiData: {
    image: content/shop/Icons/gems_medium.png
  }
```

### 7.2 `boost-colas.yaml`

Бусты, покупаемые за HARD-валюту. Три тира × четыре размера.

**Правила:**

- Всегда `category: BOOST_COLA`
- Оплата: только `internal` за `HARD`
- Лут: ровно один элемент `{ type: CURRENCY, currency: <BOOST|SUPER_BOOST|ULTRA_BOOST>, count: N }`
- Четыре размера: 100, 200, 500, 1000 единиц
- Скидки: 0% (мин. пакет), 10%, 25%, 40%
- Цена за единицу снижается с тиром

**Диапазоны ID:**

| Тир | ID-диапазон | Валюта лута |
|-----|------------|-------------|
| BOOST | 4011–4014 | `BOOST` |
| SUPER_BOOST | 4021–4024 | `SUPER_BOOST` |
| ULTRA_BOOST | 4031–4034 | `ULTRA_BOOST` |

**Пример минимальной позиции:**

```yaml
- id: 4011
  category: BOOST_COLA
  payment:
    internal:
      price: 100
      currency: HARD
  loot: [ { type: CURRENCY, currency: BOOST, count: 100 } ]
  uiData: {
    image: content/shop/Icons/boost-cola-one.svg
  }
```

### 7.3 `booster-pack.yaml`

Бустер-паки с героями и вероятностной механикой.

**Правила:**

- Всегда `category: BOOSTER_PACK`
- Оплата: только `internal` за `HARD`
- Лут: 2 элемента — основная и редкая награда с вероятностями. Сумма вероятностей = 1.0
- Pity-система (`guaranteeId`, `guaranteeAt`) опциональна, применяется к редкому луту

**Закомментированные записи:** IDs 2004–2012 зарезервированы под ивенты. Не использовать.

**Пример минимальной позиции:**

```yaml
- id: 2001
  category: BOOSTER_PACK
  payment:
    internal:
      price: 50
      currency: HARD
  loot: [
    { type: STANDARD_HERO, rarity: COMMON, probability: 0.9 },
    { type: STANDARD_HERO, rarity: RARE, probability: 0.1 }
  ]
  uiData: {
    kind: COMMON,
    title: SHOP_OFFERS_COMMON_PACK_TITLE,
    description: SHOP_OFFERS_COMMON_PACK_TEXT,
    image: content/shop/Icons/common_pack.png
  }
```

### 7.4 `hero-shard-prices.yaml`

Обмен шардов на героев конкретного сета и редкости.

**Правила:**

- Всегда `category: HERO_SHARD`
- Оплата: только `internal`, цена всегда `100`, валюта — шард соответствующего типа
- Лут: ровно один элемент `{ type: CUSTOM_HERO, rarity: <R>, setId: <N> }`
- `uiData` пустой (допустимо `uiData:` без значения)
- Каждый сет героев покрывает 5 редкостей (COMMON → MYTHIC)

**Маппинг шардов на сеты:**

| Суффикс шарда (_N) | setId | Диапазон ID |
|--------------------|-------|-------------|
| `_1` | 1 | 3001–3005 |
| `_2` | 6 | 3011–3015 |
| `_4` | 2 | 3031–3035 |
| `_5` | 3 | 3041–3045 |
| `_6` | 5 | 3046–3050 |

> Примечание: суффикс `_3` (setId 99) закомментирован.

**Пример минимальной позиции:**

```yaml
- id: 3001
  category: HERO_SHARD
  payment:
    internal:
      price: 100
      currency: COMMON_SHARD_1
  loot: [ { type: CUSTOM_HERO, rarity: COMMON, setId: 1 } ]
  uiData:
```

### 7.5 `starter-pack.yaml`

Последовательная цепочка стартовых паков для новых игроков.

**Правила:**

- Всегда `category: STARTER_PACK`
- Обязательно поле `starterPackIndex` (1–N) — определяет порядок показа
- Оплата: обязательно и `telegram`, и `xsolla`
- Лут: комбинация героев и валют, растущая с индексом
- Каждый пак покупается один раз, после чего открывается следующий

**Пример минимальной позиции:**

```yaml
- id: 9001
  category: STARTER_PACK
  starterPackIndex: 1
  payment:
    telegram:
      title: Starter Pack
      description: Starter Pack
      price: 250
      priceUsd: 5.00
      photoUrl: content/shop/Icons/epic_pack.png
    xsolla:
      title: Starter Pack
      price: 4.99
  loot: [
    { type: STANDARD_HERO, rarity: EPIC },
    { type: CURRENCY, currency: HARD, count: 200 },
    { type: CURRENCY, currency: BOOST, count: 300 }
  ]
  uiData: {
    kind: COMMON,
    discount: 200,
    title: SHOP_STARTER_PACK_1_TITLE,
    description: SHOP_STARTER_PACK_1_DESCRIPTION,
    image: content/shop/Icons/epic_pack.png
  }
```

### 7.6 `onboarding-offers.yaml`

Зарезервированный файл. Пустой массив:

```yaml
[]
```

---

## 8. Валидация и бизнес-правила

### 8.1 Уникальность ID

- `id` глобально уникален **в рамках всех файлов Static Shop и Offers** (shopItem.id)
- Не должен пересекаться с ID из `offers.yaml` и ивентовых офферов

### 8.2 Ценообразование

- Для `payment.telegram`: `price` (XTR) и `priceUsd` (USD) должны быть согласованы. Примерный курс: 50 XTR ≈ $1.00
- Для `payment.xsolla`: `price` в USD. Обычно на $0.01 ниже целого числа ($4.99, $9.99)
- Для `payment.internal`: `price` — целое число, `currency` — валидный `CurrencyEnum`

### 8.3 Вероятности (booster-pack)

- Сумма `probability` всех элементов лута в позиции **должна быть равна 1.0**
- Если используется pity-система: `guaranteeId` уникален глобально, `guaranteeAt` > 0

### 8.4 Пути к ассетам

- Все пути в `image`, `photoUrl` — относительные от корня контента
- Формат: `content/{раздел}/{подраздел}/{filename}.{ext}`
- Допустимые расширения: `.png`, `.svg`, `.webp`

### 8.5 Ключи локализации

- Поля `title`, `description`, `subDescription` — строковые ключи, а не сам текст
- Формат: `SHOP_{CATEGORY}_{ITEM}_{FIELD}` (например `SHOP_OFFERS_COMMON_PACK_TITLE`)

---

## 9. Маппинг на модель данных из ТЗ

### 9.1 Каждый файл → Block

| Поле файла | Поле модели Block | Примечание |
|-----------|-------------------|------------|
| имя файла | `name` | `gems`, `boost-colas` и т.д. |
| — | `block_type` | `static` |
| — | `start_date` / `end_date` | Не задаются (бессрочные) |
| — | `launch_time` | Не применимо |
| — | `price_category` | Не применимо на уровне блока |
| — | `status` | Управляется через пайплайн |
| — | `tags` | Можно добавить при импорте (`["shop", "gems"]`) |
| набор позиций | `metadata` | JSONB — мета-информация о блоке |

### 9.2 Каждая позиция → Entity

| Поле YAML | Поле модели Entity | Примечание |
|----------|-------------------|------------|
| `id` | `config.original_id` | Сохраняется внутри JSONB `config` |
| `category` | `archetype` | Маппинг: GEMS/BOOST_COLA/HERO_SHARD → `currency`, BOOSTER_PACK → `boosterpack`, STARTER_PACK → `offer`, OFFER → `offer` |
| — | `entity_type_code` | Заполняется по категории |
| — | `name` | Генерируется из `category` + `id` или из `uiData.title` |
| `payment` + `loot` + `uiData` | `config` | Весь конфиг позиции сериализуется в JSONB |
| `starterPackIndex` | `sort_order` | Для STARTER_PACK |

### 9.3 Компоненты позиции → Element

| Часть YAML | Поле модели Element | `element_type` | `key` |
|-----------|-------------------|----------------|-------|
| `uiData.image` | `value` | `icon` | `main_icon` |
| `uiData.title` | `value` | `text` | `title_alias` |
| `uiData.description` | `value` | `text` | `description_alias` |
| `payment.telegram.price` | `value` | `price` | `telegram_price` |
| `payment.xsolla.price` | `value` | `price` | `xsolla_price` |
| `payment.internal.price` | `value` | `price` | `internal_price` |
| каждый элемент `loot[]` | `value` (JSON) | `reward` | `reward_slot_{N}` |
| `uiData.backgroundImage` | `value` | `background` | `background_1` |

---

## 10. Соглашения по именованию и нумерации ID

| Категория | Диапазон ID | Шаг |
|-----------|------------|-----|
| `GEMS` | 1001–1099 | +1 |
| `BOOSTER_PACK` | 2001–2099 | +1 |
| `HERO_SHARD` | 3001–3099 | +1 |
| `BOOST_COLA` | 4001–4099 | +1 |
| `STARTER_PACK` | 9001–9099 | +1 |
| `ONBOARDING` | (зарезервировано) | — |

---

*Конец спецификации static-shop.*
