# Поточний спринт — Спринт 1

**Мета**: Повний робочий флоу від реєстрації до першого модуля.
**Статус**: 🟡 В процесі

---

## Задачі спринту

### 1. Scaffold і базова інфраструктура
- [x] Next.js 14 + TypeScript + Tailwind + shadcn/ui
- [x] Supabase проект: таблиці users, profiles, modules, module_progress, tokens (SQL міграція готова, треба прогнати на реальному проекті)
- [x] Supabase Auth: Google SSO (`/login`, `/register`, `/auth/callback`, `/auth/signout`)
- [x] Базовий layout: хедер з балансом токенів, навігація (Dashboard / Модулі / Скіли / Профіль) + mobile hamburger

### 2. Онбординг
- [x] Сторінка /onboarding з прогрес-баром
- [x] Три мікро-задачі (компоненти TaskReading, TaskDecision, TaskPriority)
- [x] Чат-інтерфейс для діалогу цілі (4 питання)
- [x] API route /api/ai/analyze-onboarding → Claude API → запис профілю А+Б

### 3. Генерація першого модуля
- [ ] Промпт generate-module.ts з профілем і ціллю
- [ ] Streaming відповіді Claude API
- [ ] Збереження модуля в Supabase
- [ ] Сторінка /module/[id] — відображення трьох актів

### 4. Базова карта особистості
- [x] Сторінка /profile — профіль А+Б після онбордингу
- [ ] Читабельний формат: конкретні спостереження, не тести (зараз — рядки label/value, треба переробити після перших юзерів)

### 5. Токени — базова логіка
- [x] Таблиця tokens в Supabase
- [x] Free план: 3000 токенів при реєстрації (через handle_new_user trigger)
- [x] Списання при кожному API call (lib/tokens/charge.ts)
- [x] Відображення балансу в хедері

---

## Наступний спринт (після цього)

Спринт 2: Карта скілів + архів подій + check-in автоматизація

---

## Нотатки сесій

*Тут Claude Code залишає нотатки після кожної сесії — що зроблено, що відкрито, де зупинились.*

### Сесія 1 (2026-05-13) — Scaffold
- Створено docs/ з product-vision, prd, database-schema, current-sprint, ai-prompts
- Створено CLAUDE.md з інструкціями для майбутніх сесій
- Scaffold Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui
- Налаштовано Supabase client (browser/server/middleware)
- SQL міграція `20260513000001_initial_schema.sql`: всі таблиці + RLS + trigger `handle_new_user` (3000 free токенів)
- Базовий layout з хедером, плейсхолдер лендінг на `/`

### Сесія 2 (2026-05-13) — Auth + Онбординг (Задача 2)
- **Auth flow**: `/login` (Google OAuth кнопка), `/auth/callback`, `/auth/signout`. Middleware вже захищає `/onboarding|/module|/profile`.
- **Інфра**: `lib/supabase/admin.ts` (service-role клієнт), `lib/tokens/charge.ts` (`getBalance`, `assertBalance`, `charge` + TOKEN_COSTS), `lib/ai/client.ts` (`createAnthropic` + `CLAUDE_MODEL = "claude-sonnet-4-6"`).
- **AI**: `lib/ai/prompts/analyze-onboarding.ts` — system prompt + tool schema `save_user_profile` + `buildAnalyzeOnboardingUserMessage`. Аналізує ПОВЕДІНКУ (час, вибори, стиль), не самоопис.
- **API route** `POST /api/ai/analyze-onboarding`: auth → `assertBalance(500)` → Claude tool call → `admin.update(profiles)` → `charge('onboarding')` → повертає `{analysis, balance}`. Статуси: 401, 402 (мало токенів), 502 (модель не повернула tool_use), 500.
- **Онбординг UI**: `components/onboarding/onboarding-content.ts` з хардкодним контентом 3 задач + 4 питань діалогу. Компоненти: `TaskReading` (фаза reading→questions з трекінгом часу і reread), `TaskDecision` (3 опції + "інше"), `TaskPriority` (up/down reorder, не drag — надійно на мобільному), `GoalDialog` (чат, парсить хвилини і формат), `Generating` (спіннер).
- **Orchestrator** `app/(app)/onboarding/onboarding-flow.tsx`: client state, прогрес-бар, шлях `reading → decision → priority → dialog → analyzing → /profile`. Обробка помилок з retry.
- **Profile** `/profile`: показує goal + блок А + блок Б рядком з лейблом/значенням. Редірект на `/onboarding` якщо не завершено.

### Сесія 4 (2026-05-13) — Онбординг V2 (MC + DnD + 5-step + generating)
- **TaskReading V2**: 2 питання з multiple-choice + 1 відкрите. Додав `comprehension_q1_options`, `comprehension_q2_options` у `onboarding-content.ts`. `Q1_CORRECT/Q2_CORRECT` як hint для аналізатора (сигнал уваги, не оцінка).
- **TaskPriority V2**: HTML5 native drag-and-drop (`onDragStart/onDragOver/onDrop/onDragEnd`) з візуальним feedback (opacity на джерело, border highlight на target). Кнопки ↑↓ збережені як touch/a11y fallback. Drag handle ⋮⋮.
- **OnboardingInput schema**: переробив `task_reading` — замість `comprehension_q*_answer: string` тепер `comprehension_q*: string` (текст питання) + `comprehension_q*_options: string[]` + `comprehension_q*_choice_index: number | null` + `comprehension_q*_correct_index: number`. Промпт `analyze-onboarding` оновлений: показує що обрано, що було правильно.
- **Onboarding flow V2**: 5-step progress bar — список кроків "Задача 1 / Задача 2 / Задача 3 / Діалог / Готово" з підсвічуванням поточного. Прогрес = (currentIdx + (analyzing ? 1 : 0)) / 5.
- **Redirect** на `/module/generating` (не на `/dashboard` напряму). `onboarding-flow` → `router.push("/module/generating")`.
- **`/module/generating`**: placeholder page зі спіннером і кнопкою "Перейти в Dashboard". Auth-guarded, редіректить незавершених на `/onboarding`. Після `/api/ai/generate-module` (Задача 3) тут запуститься streaming.

### Сесія 3 (2026-05-13) — Auth UX + Layout + nav
- **Middleware**: тепер захищає також `/dashboard|/modules|/skills` (плюс попередні `/onboarding|/module|/profile`).
- **`/register`**: окрема сторінка з тим самим Google OAuth flow (sign-up framing). `LoginForm` параметризований (`label`, `next`).
- **`/login`**: додав посилання на `/register`. Post-onboarding redirect тепер на `/dashboard` (не `/profile`).
- **Хедер** (`components/header.tsx` server + `components/header-nav.tsx` client): nav з 4 пунктами, активний пункт виділений, баланс токенів, signout. На мобільному — hamburger toggle з повноекранною панеллю; `body.overflow=hidden` коли відкрита; авто-закриття на зміну роуту.
- **Placeholder pages**:
  - `/dashboard` — сьогоднішні модулі (з БД), картки на Скіли і Профіль.
  - `/modules` — список усіх модулів юзера (поки порожньо).
  - `/skills` — карта скілів (поки порожньо, з поясненням принципу дзеркала).
- **Лендінг `/`**: якщо юзер залогінений — auto-redirect на `/dashboard` (або `/onboarding`).
- **Onboarding flow**: фініш редіректить на `/dashboard`. `/onboarding/page.tsx` редіректить завершених на `/dashboard`.

**Що далі (Задача 3 — генерація першого модуля)**:
1. `lib/ai/prompts/generate-module.ts` + tool schema (`hook`, `core.sections[]`, `core.sources[]`, `action`)
2. `app/api/ai/generate-module/route.ts` зі streaming через `messages.stream()`
3. `app/(app)/module/[id]/page.tsx` — рендер трьох актів
4. Після онбордингу — переходити на екран генерації, що пушить юзера на `/module/[id]` (зараз веде на `/dashboard`)
5. Спочатку треба `npm install`, налаштувати Supabase проект (URL, ключі, Google OAuth) і прогнати міграцію

