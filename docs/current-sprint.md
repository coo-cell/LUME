# Поточний спринт — Спринт 1

**Мета**: Повний робочий флоу від реєстрації до першого модуля.
**Статус**: 🟡 В процесі

---

## Задачі спринту

### 1. Scaffold і базова інфраструктура
- [ ] Next.js 14 + TypeScript + Tailwind + shadcn/ui
- [ ] Supabase проект: таблиці users, profiles, modules, module_progress, tokens
- [ ] Supabase Auth: Google SSO
- [ ] Базовий layout: хедер з балансом токенів, навігація

### 2. Онбординг
- [ ] Сторінка /onboarding з прогрес-баром
- [ ] Три мікро-задачі (компоненти TaskReading, TaskDecision, TaskPriority)
- [ ] Чат-інтерфейс для діалогу цілі (4 питання)
- [ ] API route /api/ai/analyze-onboarding → Claude API → запис профілю А+Б

### 3. Генерація першого модуля
- [ ] Промпт generate-module.ts з профілем і ціллю
- [ ] Streaming відповіді Claude API
- [ ] Збереження модуля в Supabase
- [ ] Сторінка /module/[id] — відображення трьох актів

### 4. Базова карта особистості
- [ ] Сторінка /profile — профіль А+Б після онбордингу
- [ ] Читабельний формат: конкретні спостереження, не тести

### 5. Токени — базова логіка
- [ ] Таблиця tokens в Supabase
- [ ] Free план: 3000 токенів при реєстрації
- [ ] Списання при кожному API call
- [ ] Відображення балансу в хедері

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
- **Що далі**: `npm install`, налаштувати Supabase проект, прогнати міграцію, запустити онбординг flow (Задача 2)
