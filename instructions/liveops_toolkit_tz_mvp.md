# Техническое задание: LiveOps Toolkit MVP

**Версия:** 1.0  
**Дата:** 13 февраля 2026  
**Статус:** черновик  
**Базовые документы:** liveops_toolkit_v3.md, calendar_schema_full.md

---

## 1. Назначение и границы MVP

### 1.1 Что делает продукт

LiveOps Toolkit — веб-приложение для управления игровым контентом без участия клиентской разработки. Оператор (гейм-дизайнер, далее «ГД») собирает, настраивает и публикует блоки лайвопс-контента: ивенты, офферы, магазин, рулетки и т.д.

### 1.2 Границы MVP

**Входит в MVP:**

- Редактор с drill-down: Календарь → Блок → Сущность → Элемент
- Система шаблонов (блоков и сущностей)
- Пайплайн апрува (3 обязательных чекпоинта)
- Базовая аналитика (read-only из Elastic/ClickHouse)
- Коммит конфигов в Git-репозиторий
- Управление ролями (ГД, Лид)

**НЕ входит в MVP:**

- Предикт выручки
- ML-локализация
- Агентское авто-тестирование (мариобрики)
- Имитация флоу и плейтеста
- Плейтест на билде

---

## 2. Роли и доступ

| Роль | Возможности |
|------|-------------|
| **ГД (оператор)** | Создание/редактирование блоков и сущностей. Отправка на проверку. Просмотр аналитики. |
| **Лид** | Все возможности ГД + апрув/реджект на каждом чекпоинте. Управление шаблонами (создание глобальных). |
| **Админ** | Управление пользователями, проектами, настройками подключений (Git, Elastic). |

Авторизация: OAuth 2.0 (через корпоративный SSO). RBAC на уровне API.

---

## 3. Модель данных

### 3.1 Основные сущности

```
Project {
  id: UUID
  name: string
  slug: string
  git_repo_url: string
  elastic_endpoint: string
  created_at: timestamp
  settings: JSONB              -- настройки лейнов, видимости полей и т.д.
}

Block {
  id: UUID
  project_id: UUID → Project
  name: string
  template_id: UUID? → Template
  block_type: enum(event, static, static_dynamic)
  start_date: date
  end_date: date
  launch_time: enum(night, day) -- night = 03:00, day = 14:00
  price_category: enum(standard, expensive)
  tags: text[]
  status: enum(draft, review_schema, review_entities, review_dates, ready, committed)
  skeleton_id: string?         -- идентификатор скелета (структура)
  skin_id: string?             -- идентификатор скина (визуал)
  metadata: JSONB              -- модульные поля, вспомогательная инфа
  created_by: UUID → User
  created_at: timestamp
  updated_at: timestamp
}

Entity {
  id: UUID
  block_id: UUID → Block
  archetype: enum(marathon, event, offer, currency, boosterpack, poll, popup, shop, roulette)
  entity_type_code: string?    -- G3T8, G3T10, G3T1, G3T2, G3T3 и т.д.
  template_id: UUID? → Template
  name: string
  sort_order: int
  config: JSONB                -- все параметры, специфичные для архетипа
  created_at: timestamp
  updated_at: timestamp
}

Element {
  id: UUID
  entity_id: UUID → Entity
  element_type: enum(icon, background, price, reward, alias, asset_path, text, currency_amount)
  key: string                  -- например "main_icon", "background_1", "reward_slot_3"
  value: text
  metadata: JSONB              -- доп. параметры (вероятность для рулетки, сегмент и т.д.)
}

Template {
  id: UUID
  project_id: UUID → Project
  level: enum(block, entity)
  name: string
  archetype: enum?             -- для entity-шаблонов
  is_global: boolean           -- глобальный (лид) или пользовательский
  config: JSONB                -- дефолтная конфигурация
  entity_templates: JSONB?     -- для block-шаблонов: массив вложенных entity-шаблонов
  created_by: UUID → User
  created_at: timestamp
}

Review {
  id: UUID
  block_id: UUID → Block
  checkpoint: enum(schema, entities, dates)
  status: enum(pending, approved, rejected)
  reviewer_id: UUID? → User
  comment: text?
  reviewed_at: timestamp?
  created_at: timestamp
}

User {
  id: UUID
  email: string
  name: string
  role: enum(gd, lead, admin)
  project_ids: UUID[]
}
```

### 3.2 Почему JSONB

Поля `config`, `metadata`, `entity_templates` — JSONB. Причина: архетипы сущностей сильно отличаются друг от друга (у оффера — цена и условия показа, у рулетки — слоты и вероятности, у марафона — этапы прогрессии). Жёсткая реляционная схема для каждого типа на данном этапе — оверинжиниринг. JSONB позволяет:

- быстро добавлять новые поля без миграций
- хранить конфиг шаблона и конфиг инстанса в одном формате
- валидировать на уровне API через JSON Schema (по одной схеме на архетип)

Со временем часто используемые поля можно выносить в колонки.

### 3.3 Индексы

- `Block`: индекс по `(project_id, start_date, end_date)` — для быстрой отрисовки календаря
- `Block`: индекс по `(project_id, status)` — для фильтрации по статусу
- `Entity`: индекс по `block_id`
- `Element`: индекс по `entity_id`
- `Template`: индекс по `(project_id, level, archetype)`
- `Block.tags`: GIN-индекс для поиска по тегам

---

## 4. Архитектура

### 4.1 Стек

| Слой | Технология | Обоснование |
|------|-----------|-------------|
| **Frontend** | React 18 + TypeScript | SPA, быстрый drill-down без перезагрузки |
| **State management** | Zustand или Jotai | Легковесный, без бойлерплейта Redux |
| **UI-библиотека** | Radix UI + Tailwind CSS | Примитивы без навязанного стиля, быстрая кастомизация |
| **Канвас блока** | React Flow | Node-based editor для модульных схем |
| **Drag-and-drop** | dnd-kit | Перетаскивание элементов, визуалов, слотов |
| **Backend** | Python 3.12 + FastAPI | Async, автодокументация API, JSON Schema валидация |
| **ORM** | SQLAlchemy 2.0 (async) | Типизированные запросы, поддержка JSONB |
| **БД** | PostgreSQL 16 | JSONB, GIN-индексы, надёжность |
| **Кеш** | Redis | Счётчики, кеш аналитики, сессии |
| **Аналитика (read)** | Elastic / ClickHouse | Существующая инфраструктура, подключение read-only |
| **Git-интеграция** | GitPython / API GitLab/GitHub | Коммит конфигов в репозиторий |

### 4.2 Структура проекта (Backend)

```
backend/
├── app/
│   ├── main.py                  # FastAPI app, middleware, CORS
│   ├── config.py                # Настройки (env-переменные)
│   ├── database.py              # Подключение к PostgreSQL
│   ├── models/                  # SQLAlchemy-модели
│   │   ├── block.py
│   │   ├── entity.py
│   │   ├── element.py
│   │   ├── template.py
│   │   ├── review.py
│   │   └── user.py
│   ├── schemas/                 # Pydantic-схемы (request/response)
│   │   ├── block.py
│   │   ├── entity.py
│   │   ├── element.py
│   │   ├── template.py
│   │   └── review.py
│   ├── api/                     # Роутеры
│   │   ├── calendar.py          # GET /calendar — блоки за период
│   │   ├── blocks.py            # CRUD блоков
│   │   ├── entities.py          # CRUD сущностей внутри блока
│   │   ├── elements.py          # CRUD элементов внутри сущности
│   │   ├── templates.py         # CRUD шаблонов
│   │   ├── reviews.py           # Создание/апрув/реджект ревью
│   │   ├── analytics.py         # Proxy к Elastic/ClickHouse
│   │   ├── git.py               # Коммит конфигов
│   │   └── auth.py              # Авторизация
│   ├── services/                # Бизнес-логика
│   │   ├── block_service.py
│   │   ├── template_service.py
│   │   ├── review_service.py
│   │   ├── git_service.py
│   │   ├── analytics_service.py
│   │   └── config_builder.py    # Сборка конфига для Git из блока
│   ├── archetype_schemas/       # JSON Schema для каждого архетипа
│   │   ├── marathon.json
│   │   ├── event.json
│   │   ├── offer.json
│   │   ├── shop.json
│   │   ├── roulette.json
│   │   ├── poll.json
│   │   └── currency.json
│   └── utils/
│       ├── permissions.py       # RBAC-декораторы
│       └── validators.py        # Валидация config по archetype_schemas
├── migrations/                  # Alembic
├── tests/
└── docker-compose.yml
```

### 4.3 Структура проекта (Frontend)

```
frontend/
├── src/
│   ├── app/                     # Роутинг, layout
│   ├── pages/
│   │   ├── CalendarPage/        # Главная — таймлайн
│   │   ├── BlockEditorPage/     # Модульная схема блока
│   │   ├── EntityEditorPage/    # Редактор сущности (табы)
│   │   └── AnalyticsPage/       # Дашборд аналитики
│   ├── components/
│   │   ├── calendar/
│   │   │   ├── Timeline.tsx         # Горизонтальная шкала дней
│   │   │   ├── Lane.tsx             # Лейн (ивенты / статичные / стат.-дин.)
│   │   │   ├── BlockCard.tsx        # Плашка блока на таймлайне
│   │   │   ├── BlockSidebar.tsx     # Боковая панель при выделении блока
│   │   │   ├── Counters.tsx         # Счётчики сэтов / блоков
│   │   │   └── ZoomControls.tsx     # Управление масштабом
│   │   ├── block-editor/
│   │   │   ├── BlockCanvas.tsx      # React Flow канвас
│   │   │   ├── EntityNode.tsx       # Карточка сущности на канвасе
│   │   │   ├── TemplatePicker.tsx   # Панель выбора шаблонов
│   │   │   └── PipelineStatus.tsx   # Статус чекпоинтов
│   │   ├── entity-editor/
│   │   │   ├── GeneralTab.tsx       # Основные параметры
│   │   │   ├── LootTab.tsx          # Награды, лут-таблица
│   │   │   ├── TriggersTab.tsx      # Условия, сегменты, кондишены
│   │   │   ├── VisualsTab.tsx       # Иконки, фоны, ассеты
│   │   │   └── PreviewTab.tsx       # Превью
│   │   ├── shared/
│   │   │   ├── OverlayPanel.tsx     # Оверлей для drill-down
│   │   │   ├── TagInput.tsx
│   │   │   └── MetricBadge.tsx
│   │   └── analytics/
│   │       ├── BlockMetrics.tsx
│   │       └── ComparisonChart.tsx
│   ├── stores/                  # Zustand stores
│   │   ├── calendarStore.ts
│   │   ├── blockStore.ts
│   │   └── uiStore.ts
│   ├── api/                     # API-клиент (fetch/axios wrappers)
│   │   └── client.ts
│   ├── types/                   # TypeScript типы
│   │   └── index.ts
│   └── utils/
```

---

## 5. API: ключевые эндпоинты

### 5.1 Календарь

```
GET /api/v1/projects/{project_id}/calendar?from=2026-03-01&to=2026-03-31
```

Возвращает все блоки за период, сгруппированные по `block_type` (лейнам). Включает вложенные сущности (только id, name, archetype — без элементов). Это основной запрос для отрисовки таймлайна.

**Response:**

```json
{
  "lanes": {
    "event": [ { "id": "...", "name": "8 марта", "start_date": "2026-03-06", "end_date": "2026-03-10", "launch_time": "night", "status": "ready", "tags": ["8.03"], "metrics": { "rev_block": 12500, "arpu_block": 3.2 }, "entities": [ { "id": "...", "name": "Оффер сэта", "archetype": "offer" } ] } ],
    "static": [ ... ],
    "static_dynamic": [ ... ]
  },
  "dynamic_blocks": [ ... ],
  "counters": {
    "sets_30d": 8,
    "sets_60d": 15,
    "blocks_30d": 12,
    "blocks_60d": 23,
    "anchor_date": "2026-03-15"
  }
}
```

### 5.2 Блоки (CRUD)

```
POST   /api/v1/projects/{project_id}/blocks
GET    /api/v1/projects/{project_id}/blocks/{block_id}
PATCH  /api/v1/projects/{project_id}/blocks/{block_id}
DELETE /api/v1/projects/{project_id}/blocks/{block_id}
POST   /api/v1/projects/{project_id}/blocks/{block_id}/copy
```

`POST .../copy` — дублирование блока со всеми сущностями и элементами. Новый блок получает статус `draft` и сдвинутые даты (настраиваемый offset в body запроса).

### 5.3 Сущности (CRUD)

```
POST   /api/v1/blocks/{block_id}/entities
GET    /api/v1/blocks/{block_id}/entities/{entity_id}
PATCH  /api/v1/blocks/{block_id}/entities/{entity_id}
DELETE /api/v1/blocks/{block_id}/entities/{entity_id}
```

При создании сущности `config` валидируется по JSON Schema из `archetype_schemas/{archetype}.json`. Если не проходит — 422 с описанием ошибок.

### 5.4 Элементы (CRUD)

```
POST   /api/v1/entities/{entity_id}/elements
PATCH  /api/v1/entities/{entity_id}/elements/{element_id}
DELETE /api/v1/entities/{entity_id}/elements/{element_id}
GET    /api/v1/entities/{entity_id}/elements
```

### 5.5 Шаблоны

```
GET    /api/v1/projects/{project_id}/templates?level=block&archetype=offer
POST   /api/v1/projects/{project_id}/templates
POST   /api/v1/projects/{project_id}/templates/{template_id}/instantiate
```

`POST .../instantiate` — создаёт блок или сущность из шаблона. Для block-шаблона — создаёт блок + все вложенные сущности с дефолтными элементами.

### 5.6 Ревью (пайплайн апрува)

```
POST   /api/v1/blocks/{block_id}/reviews
          body: { "checkpoint": "schema" }
PATCH  /api/v1/reviews/{review_id}
          body: { "status": "approved", "comment": "ОК" }
GET    /api/v1/blocks/{block_id}/reviews
```

Бизнес-правила:
- ГД может создать ревью только для текущего чекпоинта (последовательно: schema → entities → dates).
- Только лид может апрувить/реджектить.
- При апруве всех 3 чекпоинтов статус блока автоматически меняется на `ready`.
- При реджекте статус блока откатывается на `draft`.

### 5.7 Git-коммит

```
POST   /api/v1/blocks/{block_id}/commit
```

Доступен только для блоков в статусе `ready`. Собирает конфиг из блока → сущностей → элементов, форматирует в формат игровых конфигов, коммитит в Git-репозиторий проекта. Возвращает commit hash.

### 5.8 Аналитика (read-only)

```
GET    /api/v1/projects/{project_id}/analytics/blocks?block_ids=...&metrics=rev_block,arpu_block,us,sfr
GET    /api/v1/projects/{project_id}/analytics/compare?block_id_a=...&block_id_b=...
```

Proxy к Elastic/ClickHouse. На MVP — простой проброс запросов с кешированием в Redis (TTL 5 минут).

---

## 6. UI: спецификация экранов

### 6.1 Экран «Календарь» (главный)

**Layout:** full-width, без боковой навигации (навигация в хедере).

**Зоны экрана:**

```
┌──────────────────────────────────────────────────────────┐
│  [Проект ▼]  [Месяц ◄ Март 2026 ►]  [Zoom: −  ●  +]    │  ← Хедер
├──────────────────────────────────────────────────────────┤
│  01  02  03  04  05  06  07  08  09  10  ...  30         │  ← Шкала дней
├──────────────────────────────────────────────────────────┤
│  ИВЕНТЫ          [скрыть]                                │  ← Лейн 1
│  ┌──[8 марта]────────┐  ┌──[11×11]──┐                    │
│  │ ◑ Rev 12.5K  US 8%│  │ ◑ Rev ... │                    │
│  └───────────────────┘  └───────────┘                    │
├──────────────────────────────────────────────────────────┤
│  СТАТИЧНЫЕ       [скрыть]                                │  ← Лейн 2
│  ┌──[ДР]────────────────────────────┐                    │
│  └──────────────────────────────────┘                    │
├──────────────────────────────────────────────────────────┤
│  СТАТ-ДИНАМ      [скрыть]                                │  ← Лейн 3
│  ...                                                     │
├──────────────────────────────────────────────────────────┤
│  ДИНАМИЧЕСКИЕ БЛОКИ                                      │  ← Нижняя зона
│  [G3T8/H22] [G3T10/H21] [G3T10/D10] [G3T2/D11]         │
│  [G3T1/H21] [G3T3/D11]  [G3T10/D10] ...                 │
├──────────────────────────────────────────────────────────┤
│  Сэтов 30д: 8 | Сэтов 60д: 15 | Блоков 30д: 12         │  ← Счётчики
└──────────────────────────────────────────────────────────┘
```

**Поведение элементов:**

| Элемент | Действие | Результат |
|---------|----------|-----------|
| Плашка блока | Клик | Открывается sidebar справа с summary блока |
| Плашка блока | Двойной клик | Переход в BlockEditor (drill-down) |
| Плашка блока | Drag по горизонтали | Перенос дат блока |
| Плашка блока | Ctrl+Click | Мульти-выбор → сравнение метрик в sidebar |
| Плашка блока | ПКМ / контекстное меню | Копировать, Удалить, Отправить на ревью |
| Название блока | Клик | Выделяются все блоки с таким же именем, в sidebar — агрегированные метрики |
| Пустое место на таймлайне | Клик + «Добавить» | Открывается TemplatePicker → создаётся новый блок |
| Zoom | Ползунок / кнопки ±  | Масштабирование: при zoom-out метки сжимаются, при крайнем zoom-out скрываются |
| Лейн «скрыть» | Клик | Лейн сворачивается до одной строки |

**Sidebar (при выделении блока):**

- Название и даты
- Статус пайплайна (3 чекпоинта, визуально: ● зелёный = approved, ○ серый = pending, ● красный = rejected)
- Метрики: Rev_block, ARPU_block, US, sFR (если есть данные)
- Состав: список сущностей (имя + архетип)
- Теги
- Кнопки: «Открыть», «Копировать», «Удалить», «На ревью»

**Модульные поля блока:** каждый блок на плашке показывает настраиваемый набор полей. ГД может в настройках проекта выбрать, какие поля отображать на плашке (аналитика, скелет/скин, теги). По умолчанию: название + Rev + ARPU.

**Копирование:** при копировании блока создаётся полный дубликат (блок + все сущности + все элементы) со статусом `draft`. Даты смещаются на заданный offset.

### 6.2 Экран «Редактор блока» (drill-down уровень 1)

Открывается как overlay поверх календаря (не отдельная страница — календарь остаётся видимым на фоне, затемнённый).

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│  ← Назад к календарю     Блок: «8 марта»   [Сохранить]  │  ← Хедер
├──────────────────────────────────────────────────────────┤
│  Чек 1: ○ schema  →  Чек 2: ○ entities  →  Чек 3: ○ dates │  ← Пайплайн
├────────────┬─────────────────────────────────────────────┤
│ ШАБЛОНЫ    │                                             │
│            │     ┌─────────┐       ┌─────────┐           │
│ ▸ Офферы   │     │ Ивент   │──────▸│ Марафон │           │
│   · дешёвый│     │ (event) │       │(marathon│           │
│   · стд    │     └────┬────┘       └─────────┘           │
│   · дорогой│          │                                  │
│ ▸ Магазин  │     ┌────▼────┐  ┌─────────┐                │
│ ▸ Рулетки  │     │ Оффер 1 │  │ Магазин │                │
│ ▸ Ивенты   │     │ (offer) │  │ (shop)  │                │
│            │     └─────────┘  └─────────┘                │
│ [+ Шаблон] │                                             │  ← Канвас
├────────────┴─────────────────────────────────────────────┤
│  Баланс: 3 оффера, ~$8.50 средн. чек | Дата: 06–10.03   │  ← Футер
└──────────────────────────────────────────────────────────┘
```

**Канвас (React Flow):**

- Каждая сущность — нода на канвасе: иконка архетипа, название, мини-статус (draft/configured/approved), превью скина (если есть)
- Связи между нодами — визуальные линии (обозначают зависимости: «оффер появляется после ивента» и т.д.)
- Drag-and-drop шаблона из левой панели на канвас = создание сущности
- Двойной клик на ноду = переход в EntityEditor
- Delete / Backspace на выделенной ноде = удаление сущности (с подтверждением)

**Левая панель (шаблоны):**

- Дерево шаблонов, сгруппированное по архетипу
- Поиск по названию
- Кнопка «+ Создать шаблон» (сохранить текущую сущность как шаблон)

**Пайплайн (верхняя полоска):**

- Три чекпоинта визуально
- Кнопка «Отправить на ревью» (доступна ГД, создаёт Review в статусе pending)
- Кнопки «Апрув» / «Реджект» (доступны лиду, появляются при наличии pending review)

### 6.3 Экран «Редактор сущности» (drill-down уровень 2)

Открывается как overlay поверх BlockEditor.

**Layout: форма с табами**

**Таб «Основное»:**

| Поле | Тип контрола | Описание |
|------|-------------|----------|
| Архетип | Dropdown (disabled если из шаблона) | marathon, event, offer, shop, roulette, poll, currency |
| Тип сущности | Dropdown | G3T8, G3T10, G3T1, G3T2, G3T3 (зависит от архетипа) |
| Название | Text input | Человекочитаемое название |
| Ценовая категория | Toggle: Стандарт / Дорогой | — |
| Скелет | Dropdown / text | ID скелета |
| Скин | Dropdown / text | ID скина |
| Час запуска | Toggle: Ночное (03:00) / Дневное (14:00) | — |

**Таб «Лут и награды»:**

- Таблица: каждая строка = предмет + количество + (для рулеток) вероятность
- Кнопка «+ Добавить награду»
- Drag-and-drop для перестановки строк
- Автоподсчёт суммарной стоимости лута

**Таб «Триггеры и сегменты»:**

- Визуальный билдер условий. На MVP — простая форма:
  - Сегмент: dropdown (список предзаданных сегментов из конфигов)
  - Кондишен: key-value пары (ключ = параметр, оператор = >/</=, значение = число)
  - Время показа: date-time picker
- Кнопка «+ Добавить условие»

**Таб «Визуалы»:**

- Сетка карточек: каждый элемент типа icon/background/asset_path
- Drag-and-drop загрузка файлов
- Выбор из библиотеки ассетов (поиск по имени файла)
- Превью загруженного изображения
- Поле алиаса текста (ключ локализации)

**Таб «Превью»:**

На MVP — статичный мокап: карточка, как сущность будет выглядеть в клиенте, с подставленными иконками и текстами. Не интерактивный. Рендерится на фронте из заполненных данных.

---

## 7. Бизнес-логика

### 7.1 Статусная модель блока

```
                    ┌────────────────────┐
                    │                    ▼
draft ──▸ review_schema ──▸ review_entities ──▸ review_dates ──▸ ready ──▸ committed
  ▲            │                  │                   │
  └────────────┴──────────────────┴───────────────────┘
                    (reject на любом этапе → draft)
```

- Переход `draft → review_schema`: ГД нажимает «На ревью», создаётся Review (checkpoint=schema, status=pending)
- Переход `review_schema → review_entities`: Лид апрувит schema, автоматически создаётся следующий Review
- `reject` на любом этапе: статус блока → `draft`, ГД видит комментарий лида
- `ready → committed`: только через эндпоинт `/commit`, только для `ready`

### 7.2 Создание блока из шаблона

1. ГД выбирает block-шаблон из библиотеки
2. API создаёт Block + парсит `entity_templates` из шаблона
3. Для каждого entity-шаблона создаётся Entity с `config` из шаблона + дефолтные Element'ы
4. Блок получает статус `draft`

### 7.3 Валидация конфига сущности

При каждом сохранении Entity (PATCH) бэкенд валидирует `config` по JSON Schema из `archetype_schemas/{archetype}.json`. Если валидация не прошла — 422 с массивом ошибок. Фронт подсвечивает невалидные поля.

### 7.4 Счётчики

Вычисляются на бэкенде при запросе `/calendar`:

- **Сэтов за 30д / 60д:** количество Entity с archetype in (offer, currency, boosterpack) в блоках, пересекающихся с периодом ±30/60 дней от 15-го числа текущего месяца
- **Блоков за 30д / 60д:** количество Block в том же периоде

Кешируются в Redis (TTL 1 минута, инвалидация при CRUD блоков).

### 7.5 Коммит в Git

1. `config_builder.py` собирает из Block → Entities → Elements итоговый конфиг в формате, который понимает игровой сервер (формат уточняется под конкретный проект)
2. `git_service.py` клонирует/пуллит репозиторий, записывает файл конфига, коммитит с автоматическим сообщением (`[LiveOps Toolkit] Block "{name}" committed by {user}`)
3. Возвращает commit hash, записывает его в Block.metadata

---

## 8. Требования к производительности

| Метрика | Цель |
|---------|------|
| Загрузка календаря (30 дней, ~50 блоков) | < 500ms |
| Открытие BlockEditor | < 300ms |
| Сохранение сущности (PATCH) | < 200ms |
| Копирование блока (с 10 сущностями) | < 1s |
| Коммит в Git | < 5s |
| Подгрузка метрик из Elastic | < 2s (с кешем < 100ms) |

---

## 9. Фазы разработки

### Фаза 1 (MVP) — 8–10 недель

| Неделя | Что делаем |
|--------|-----------|
| 1–2 | Настройка инфраструктуры: проект, CI/CD, БД, миграции. Модели данных. Базовое API (CRUD блоков, сущностей, элементов). Авторизация. |
| 3–4 | Фронт: Calendar page (таймлайн, лейны, плашки блоков, zoom, sidebar). API календаря. |
| 5–6 | Фронт: BlockEditor (канвас React Flow, шаблоны, drag-and-drop). API шаблонов. |
| 7–8 | Фронт: EntityEditor (все табы). Валидация JSON Schema. Пайплайн ревью (статусы, кнопки апрува). |
| 9–10 | Git-коммит. Базовая аналитика (метрики на плашках). Счётчики. Полировка, баги. |

### Фаза 2 — после MVP

- Имитация флоу (валидация кондишенов и сегментов)
- Имитация плейтеста (расчёт балансной системы)
- ML-локализация + интеграция с Jira
- Предикт выручки

### Фаза 3

- Агентское авто-тестирование (мариобрики)
- Плейтест на билде с записью видео
- Расширенная аналитика с графиками и сравнением

---

## 10. Открытые вопросы

| # | Вопрос | Влияние |
|---|--------|---------|
| 1 | Формат игровых конфигов (JSON? YAML? кастомный?) | Реализация `config_builder.py` |
| 2 | Какие именно поля в config для каждого архетипа | JSON Schema для валидации |
| 3 | Структура Git-репозитория (один файл на блок? директория на проект?) | `git_service.py` |
| 4 | Список предзаданных сегментов и кондишенов | UI триггеров |
| 5 | Источник библиотеки ассетов (S3? локальная папка?) | Загрузка/выбор визуалов |
| 6 | Формат метрик в Elastic/ClickHouse (какие индексы, какие поля) | `analytics_service.py` |
| 7 | Нужна ли real-time коллаборация (несколько ГД одновременно) | Архитектура стейта (WebSocket?) |
| 8 | Связи между сущностями на канвасе — это визуальные или логические зависимости? | React Flow edges: cosmetic vs. functional |

---

*Конец документа. Требует ревью и уточнения открытых вопросов перед началом разработки.*
