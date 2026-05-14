# Поточний спринт — Спринт 2

**Мета**: Карта скілів через архів подій + токени і монетизація. Далі — check-in автоматизація і 30-денна ретроспектива.
**Статус**: 🟡 У роботі — скіли + монетизація готові, check-in/ретроспектива далі

---

## Задачі Sprint 2

### 2. Токени і монетизація (Lemon Squeezy)
- [x] `components/token-balance.tsx` — баланс у хедері з кольоровими порогами: <20% жовтий, <5% червоний + посилання на `/pricing`. Працює як на десктопі так і в мобільному меню.
- [x] `lib/tokens/api-guard.ts` — `guardAITokens(userId, actionType)` повертає `null` або `NextResponse 402 {error, balance, required, redirect_to: "/pricing"}`. Перевикористовується в analyze-onboarding, generate-module, detect-skills/questions, detect-skills/suggest.
- [x] `lib/pricing/plans.ts` — три плани (Free 3000, Core 12000/$9, Pro 40000/$29) + три token-pack (5k/$5, 15k/$12, 50k/$35). variantId і checkoutUrl приходять з env. `lookupPurchase(variantId)` → ефект на токени і план для webhook.
- [x] `/pricing` page — публічна сторінка (поза protected middleware), показує поточний план/баланс якщо залогінений. До checkout URL додає `checkout[custom][user_id]` + `checkout[email]` через `withCustomData`, щоб webhook знав кому нараховувати.
- [x] `/api/webhooks/lemonsqueezy` — verify HMAC SHA256 з `LEMONSQUEEZY_WEBHOOK_SECRET` (constant-time compare), парсить `order_created` (= purchase) і `subscription_payment_success` (= renewal). Idempotency: перевіряє чи нема transaction з тим самим amount/action_type в останню годину. Нараховує токени, оновлює план + plan_tokens_per_month + next_renewal_at, пише в `token_transactions`.
- [x] `.env.local.example` оновлений: LEMONSQUEEZY_WEBHOOK_SECRET, VARIANT_* і CHECKOUT_*_URL для 5 продуктів.

**Що не зроблено в цій задачі (на майбутнє)**:
- Окрема таблиця payments для повної idempotency (зараз евристика на amount+action_type+timestamp window)
- Rollover cap 50% при renewal (PRD F-05): зараз балас просто додається
- Lemon Squeezy API для programmatic checkout creation (зараз використовуємо hosted URL)
- Email повідомлення на 20% і 5% (зараз тільки колір у хедері)

### 1. Карта скілів — детектор + UI
- [x] Міграція `20260514000001_skill_events_clarifying.sql` — додає `clarifying_answers jsonb` у `skill_events`
- [x] `lib/ai/prompts/detect-skills.ts` — два tool schemas (`ask_clarifying_questions`, `suggest_skills`) + system prompts (принцип дзеркала, конкретні скіли а не загальні ярлики)
- [x] API `POST /api/ai/detect-skills/questions` — приймає опис події (≥80 chars), повертає 2–3 уточнюючих питання. `assertBalance(300)` без charge.
- [x] API `POST /api/ai/detect-skills/suggest` — приймає опис + відповіді, повертає 3–5 запропонованих скілів `{name, evidence, context_tag}`. `assertBalance(300)` без charge.
- [x] API `POST /api/skills/confirm` — створює/знаходить `skills` row (за `user_id + name`), пише `skill_events` з `clarifying_answers`, recompute `confirmation_count = COUNT(DISTINCT context_type)`, перерахунок `level` через `lib/skills/level.ts`. Charge `skill_detection` (300) одноразово в кінці.
- [x] UI `/skills/new` — `NewSkillEvent` state machine: `event → questions → suggestions → saving`. Прогрес-бар з 4 кроків. Чек-бокси "Зберегти" + редаговані назви + перемикач контексту + evidence.
- [x] `/skills` page оновлено — прогрес-бар до наступного рівня (порогові пункти 2 / 5 / 8 контекстів), кнопка "+ Додати подію", empty state з CTA.
- [x] Логіка рівнів (`lib/skills/level.ts`): 1=discovered, 2–3=growing, 5–6=experienced, 8+=master. Один скіл в одному контексті = одне підтвердження (через `DISTINCT context_type`).

---

## Sprint 1 — завершено

**Мета**: Повний робочий флоу від реєстрації до першого модуля.
**Статус**: 🟢 Готово

---

## Задачі Sprint 1

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
- [x] Промпт generate-module.ts з профілем і ціллю
- [x] Streaming відповіді Claude API
- [x] Збереження модуля в Supabase
- [x] Сторінка /module/[id] — відображення трьох актів

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

Спринт 3: Check-in (7/14 днів), 30-денна ретроспектива (AI-наратив), behaviour-tracking для модулів (час на акти, reread)

---

## Нотатки сесій

*Тут Claude Code залишає нотатки після кожної сесії — що зроблено, що відкрито, де зупинились.*

### Сесія 7 (2026-05-14) — Sprint 2 Task 2: токени + Lemon Squeezy
- **TokenBalance**: винесений з `header-nav` в окремий `components/token-balance.tsx`. Кольори на основі `balance / monthlyAllocation` (monthly = `plan_tokens_per_month` або 3000 для free). Червоний клікабельний з підказкою "Купити токени" → `/pricing`.
- **`lib/tokens/api-guard.ts`**: `guardAITokens` стандартизує 402 з `redirect_to: "/pricing"`. Замінили inline `assertBalance` блоки в 4 AI route handlers.
- **`lib/pricing/plans.ts`**: PLANS і TOKEN_PACKS з env-driven variantId+checkoutUrl. `lookupPurchase(variantId)` повертає `{tokens, plan?, planTokensPerMonth?, source, label}`.
- **`/pricing`** (server component): показує всі плани + поточний план/баланс. Free → "Створити акаунт" або "Поточний план". Платні → лінк на LS checkout з `checkout[custom][user_id]` параметром. Token-pack секція внизу.
- **Webhook** `/api/webhooks/lemonsqueezy`:
  - HMAC SHA256 verify через `crypto.timingSafeEqual` (constant-time).
  - Слухає тільки `order_created` (purchase) і `subscription_payment_success` (renewal); інші 200 без дії.
  - Idempotency: select `token_transactions` за останню годину з тим самим `user_id + action_type + amount` — якщо знайдено, skip.
  - Оновлює `tokens.balance += amount`. Для плану — також `plan, plan_tokens_per_month, next_renewal_at (+30 днів)`.
  - Пише `token_transactions` row з action_type `purchase` або `renewal`.
- **.env.local.example**: 5 змінних VARIANT_*, 5 CHECKOUT_*_URL, WEBHOOK_SECRET.

**Що відкрито**:
- Webhook покладається на меню `meta.custom_data.user_id` яке має бути проставлене в checkout URL — це сторінка /pricing робить.
- Rollover cap (PRD F-05) не реалізований — це наступна ітерація.
- Сторінка не показує "Cancel subscription" — це через LS customer portal, посилання можна додати окремо.

### Сесія 6 (2026-05-14) — Sprint 2 Task 1: карта скілів
- **Міграція** `20260514000001_skill_events_clarifying.sql` — `alter table skill_events add column clarifying_answers jsonb default '[]'`. Треба прогнати на реальному проекті.
- **Промпти** `lib/ai/prompts/detect-skills.ts`: два tool schemas з принципом дзеркала.
  - `ask_clarifying_questions` → 2–3 коротких відкритих питань про КОНКРЕТНІ дії, не про "як ти почувався".
  - `suggest_skills` → 3–5 скілів `{name (2–4 слова, конкретні; забороняє "лідерство" як ярлик), evidence (1–2 речення з опису), context_tag (work|leadership|creative|personal)}`. "Якщо сигналів менше 3 — пропонуй 3, не натягуй до 5".
- **API endpoints**:
  - `POST /api/ai/detect-skills/questions` — мін. 80 chars опис, `assertBalance(300)` без charge, `anthropic.messages.create` з `tool_choice`. Повертає `{questions}`.
  - `POST /api/ai/detect-skills/suggest` — описание + `clarifying_answers[]`, `assertBalance(300)` без charge. Повертає `{suggestions}`.
  - `POST /api/skills/confirm` — приймає `{event_description, clarifying_answers, confirmed: [{name, context_tag, evidence}]}`. Для кожного скілу: find-or-create `skills` row by `(user_id, name)` exact match, insert `skill_events` row (з `clarifying_answers` JSON), recompute `confirmation_count = COUNT(DISTINCT context_type)` через select по подіях, оновити `level` (`lib/skills/level.ts`). `charge('skill_detection', 300)` один раз в кінці з `referenceId = першого skillId`.
- **`lib/skills/level.ts`** — `levelForCount`: 8+ → master, 5–6 → experienced, 2–3 → growing, інакше → discovered. 4 і 7 округлюються вниз. Контексти DISTINCT — один скіл в одному `context_tag` рахується як одне підтвердження, навіть якщо подія записана двічі.
- **UI `/skills/new`** (server wrapper `page.tsx` + client `components/skills/new-skill-event.tsx`):
  - Phase state machine: `event → questions → suggestions → saving`.
  - Step 1: textarea з лічильником символів (мін. 80).
  - Step 2: textarea на кожне з 2–3 питань.
  - Step 3: `SkillReviewList` — інлайн редагування назви, чекбокс "Зберегти" на кожен пункт, перемикач контексту (4 кнопки), evidence показано read-only.
  - Прогрес-бар `SkillStepProgress` з кроками "Опис / Уточнення / Скіли / Готово".
  - Error handling з retry (без abort на cleanup, як у /module/generating).
- **`/skills` page** оновлено: прогрес-бари до наступного рівня (порогові пункти 1→2 / 2→5 / 5→8), кнопка "+ Додати подію" у хедері, empty state з CTA "Додати першу подію".

**Що не зроблено в цій сесії (Sprint 2 далі)**:
- Check-in (день 7 і 14): email/push тригери, форма
- 30-денна ретроспектива (`generate-retrospective` промпт + AI-наратив)
- Behaviour tracking для модулів: time_on_hook_sec / time_on_core_sec / time_on_action_sec, sections_reread (scroll-based)
- Попередження про малий баланс токенів (20% / 5%) у хедері
- Re-engagement якщо людина пропала після онбордингу

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

### Сесія 5 (2026-05-13) — Задача 3: генерація і відображення модуля
- **Промпт** `lib/ai/prompts/generate-module.ts` — system prompt + tool `save_module` (схема з `docs/ai-prompts.md`: title, hook, core.sections[3-5] з опційними паузами, core.sources[2-4], action). Адаптація під профіль (motivation_vector, energy_source, autonomy_level, time_horizon, depth_vs_breadth, ambiguity_tolerance, processing_style, learning_pace) описана в system prompt.
- **API** `POST /api/ai/generate-module`:
  - Auth → fetch profile → перевірка `onboarding_completed` і обов'язкових полів профілю (409 якщо нема)
  - Dedup window 5 хв: якщо є модуль зі статусом `generated|in_progress` створений нещодавно — повертає його `module_id` без нової генерації (захист від StrictMode double-mount і подвійних кліків)
  - `assertBalance(1500)` → 402 при нестачі
  - `anthropic.messages.stream()` + `tool_choice: save_module` → `await stream.finalMessage()` → парс `tool_use.input`
  - `admin.insert(modules)` з `content`, `tokens_used`, `status='generated'` → `charge('module_generation', referenceId=moduleId)`
  - Повертає `{module_id, balance}`. `maxDuration = 60`.
- **API** `POST /api/module/start` — переводить модуль `generated → in_progress`, ставить `started_at`. Викликається з ModuleView fire-and-forget на першому маунті якщо `status='generated'`.
- **API** `POST /api/module/complete` — пише `module_progress` row (pause_responses, task_completed, reflection_length, sources_opened) + ставить `modules.status='completed'`, `completed_at=now()`. Ownership check.
- **`/module/generating`** активований: server wrapper `page.tsx` + client `generating-trigger.tsx`. Useeffect → POST generate-module → on success `router.push("/module/[id]")`. Ротація 4 повідомлень кожні 4 сек. Error UI з retry. StrictMode-safe (ref guard, без abort у cleanup).
- **`/module/[id]`**: server fetch + ownership check + 404 при відсутності. Передає в `ModuleView`.
- **Module components**:
  - `module-view.tsx` (client) — orchestrator: auto-start, state для pause-відповідей, sources_opened, task_completed, reflection; кнопка "Завершити модуль" → complete API → `/dashboard`
  - `act-hook.tsx` (server) — Hook з personal_reference як заголовок + text
  - `act-core.tsx` (client) — секції з активними паузами між ними + sources list
  - `active-pause.tsx` (client) — питання + textarea з типом (recall/application/reflection)
  - `sources-list.tsx` (client) — закладки з кнопкою "позначити переглянуте"
  - `act-action.tsx` (client) — task в highlighted блоці + чекбокс "виконав" + reflection textarea

**Що не входило в Task 3 (наступні задачі)**:
- Детальний behaviour tracking: time_on_hook_sec / time_on_core_sec / time_on_action_sec, sections_reread, scroll-based reread detection
- Streaming partial content до клієнта (зараз тільки SDK streaming сервер→Claude)
- Попередження про малий баланс токенів (20%/5%) у хедері
- Re-engagement якщо людина пропала після онбордингу

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

