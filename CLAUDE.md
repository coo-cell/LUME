# Lume — інструкції для Claude Code

Цей файл — точка входу для майбутніх сесій. Перед будь-якою задачею прочитай:
- `docs/product-vision.md` — куди йдемо і чому
- `docs/prd.md` — скоуп MVP, user journey, acceptance criteria
- `docs/database-schema.md` — структура БД (Supabase)
- `docs/ai-prompts.md` — логіка AI промптів
- `docs/current-sprint.md` — поточний спринт і нотатки попередніх сесій

---

## Tech stack

- **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript 5 + Tailwind CSS 3
- **UI**: shadcn/ui (slate theme, RSC-режим)
- **Backend / БД**: Supabase (Postgres + Auth + Storage), `@supabase/ssr`
- **AI**: Anthropic Claude (Sonnet) через `@anthropic-ai/sdk`, streaming
- **Платежі**: Lemon Squeezy (token-based subscription)
- **Hosting**: Vercel (planned)

---

## Структура папок

```
app/
  (auth)/                 — auth pages (login, callback)
  (app)/                  — protected routes
    onboarding/           — 3 мікро-задачі + діалог цілі
    module/[id]/          — сторінка модуля (3 акти)
    profile/              — карта особистості (А+Б, потім В)
  api/
    ai/
      analyze-onboarding/ — POST: профіль А+Б з онбордингу
      generate-module/    — POST: триактний модуль (streaming)
  layout.tsx              — root layout з хедером (баланс токенів)
  page.tsx                — лендінг

components/
  ui/                     — shadcn компоненти (button, card, input, ...)
  onboarding/             — TaskReading, TaskDecision, TaskPriority, GoalDialog
  module/                 — Hook, Core, ActivePause, Action

lib/
  supabase/
    client.ts             — browser client
    server.ts             — server client (RSC, route handlers)
    middleware.ts         — session refresh helper
  ai/
    prompts/              — analyze-onboarding.ts, generate-module.ts, ...
  tokens/                 — списання / перевірка балансу
  types/
    database.ts           — TS типи таблиць

supabase/
  migrations/             — SQL міграції (один файл = одна міграція)
  config.toml             — Supabase CLI конфіг

docs/                     — продуктова документація (single source of truth)

middleware.ts             — Next.js middleware (Supabase session refresh)
```

---

## Конвенції

### Код
- **TypeScript strict**: ніяких `any` без коментаря-причини
- **Server Components за замовчуванням**. `'use client'` тільки коли потрібно (state, browser API, onClick)
- **Data fetching**: у Server Components через `lib/supabase/server.ts`. У клієнтських компонентах — через server actions або route handlers, не дублювати fetch на клієнті
- **Імпорти**: `@/` alias для root
- **Файли**: `kebab-case.ts` для модулів, `PascalCase.tsx` для React-компонентів
- **Без зайвих коментарів**. Коментуй тільки WHY коли не очевидно

### Supabase
- Завжди вмикай RLS на нових таблицях
- Кожна таблиця з `user_id` має policy `auth.uid() = user_id`
- Triggers/functions кладемо в той самий файл міграції що створює таблицю
- Нова міграція = новий файл з timestamp-префіксом

### AI
- Промпти живуть у `lib/ai/prompts/<name>.ts` як named exports
- Завжди витягуй структурований JSON через tool use або `response_format`
- Streaming для генерації модуля (UX)
- Перед кожним AI-викликом — перевір баланс токенів і спиши після успіху (`lib/tokens/charge.ts`)

### UI принципи (з product-vision)
- **Принцип дзеркала**: не показуй людині те, що вона сама не підтвердила
- **Тон**: доброзичливо, конкретно, без оцінок. Ніколи "ти не зробив X"
- Прогрес — через зміну дій, не gamification

---

## Workflow

1. Прочитати `docs/current-sprint.md` — де зупинились
2. Перевірити чи задача все ще валідна (продукт міг змінитись)
3. Зробити маленький крок, перевірити, закомітити
4. Після сесії — оновити `docs/current-sprint.md` (секція "Нотатки сесій") з тим що зроблено і де зупинились

---

## Що НЕ робити

- Не додавати features поза скоупом MVP без явного запиту
- Не створювати README/документацію без запиту
- Не запускати `npm install` чи зовнішні мережеві операції — пропонуй команду користувачу
- Не комітити секрети (`.env.local`, ключі)
- Не міняти схему БД без оновлення `docs/database-schema.md` і нової міграції
