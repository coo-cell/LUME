# База даних — Схема

Supabase (PostgreSQL). Всі міграції у /supabase/migrations/

---

## Таблиці

### users
Автоматично створюється Supabase Auth.
Розширюємо через profiles.

### profiles
```sql
id              uuid references auth.users primary key
created_at      timestamp default now()

-- Онбординг
onboarding_completed  boolean default false
goal_domain           text        -- 'management' | 'productivity' | 'entrepreneurship'
goal_description      text        -- вільний текст з діалогу
weekly_time_minutes   integer     -- скільки хвилин на тиждень
content_format        text        -- 'text' | 'audio' | 'both'

-- Профіль А — Мотивація
motivation_vector     text        -- 'approach' | 'away_from'
energy_source         text        -- 'achievement' | 'recognition' | 'connection' | 'mastery'
autonomy_level        integer     -- 1-5
time_horizon          text        -- 'days' | 'weeks' | 'months' | 'years'

-- Профіль Б — Когнітивний стиль
depth_vs_breadth      integer     -- 1-5
ambiguity_tolerance   integer     -- 1-5
processing_style      text        -- 'analytical' | 'intuitive'
learning_pace         text        -- 'fast' | 'medium' | 'deep'

-- Профіль В — з'являється після 4 тижнів
strengths_identified  boolean default false
strengths_data        jsonb       -- виявлені сильні сторони
```

### modules
```sql
id              uuid primary key default gen_random_uuid()
user_id         uuid references auth.users
created_at      timestamp default now()

domain          text
title           text
content         jsonb       -- {hook, core: {sections, sources}, action}
tokens_used     integer

-- Статус
status          text default 'generated'  -- 'generated' | 'in_progress' | 'completed'
started_at      timestamp
completed_at    timestamp
```

### module_progress
```sql
id              uuid primary key default gen_random_uuid()
module_id       uuid references modules
user_id         uuid references auth.users
created_at      timestamp default now()

-- Поведінковий трекінг
time_on_hook_sec    integer
time_on_core_sec    integer
time_on_action_sec  integer
sections_reread     integer default 0
sources_opened      boolean default false
task_completed      boolean
reflection_length   integer     -- кількість символів у рефлексії

-- Активні паузи
pause_responses     jsonb       -- [{question, answer, length}]
```

### skills
```sql
id              uuid primary key default gen_random_uuid()
user_id         uuid references auth.users
created_at      timestamp default now()

name            text        -- назва скілу (людина може редагувати)
context_tag     text        -- 'work' | 'personal' | 'creative' | 'leadership'
confirmation_count  integer default 0
level           text        -- 'discovered' | 'growing' | 'experienced' | 'master'

-- Level логіка:
-- discovered: 1
-- growing: 2-3
-- experienced: 5-6
-- master: 8+
```

### skill_events
```sql
id              uuid primary key default gen_random_uuid()
skill_id        uuid references skills
user_id         uuid references auth.users
created_at      timestamp default now()

event_description   text        -- оригінальний опис події
context_type        text        -- унікальний контекст (різні контексти = різні підтвердження)
evidence            text        -- конкретне підтвердження з події (від AI)
confirmed_by_user   boolean default false
```

### checkins
```sql
id              uuid primary key default gen_random_uuid()
user_id         uuid references auth.users
created_at      timestamp default now()

day_number      integer     -- 7 або 14
applied_knowledge   boolean
application_details text
what_changed    text        -- тільки день 14
```

### tokens
```sql
id              uuid primary key default gen_random_uuid()
user_id         uuid references auth.users unique
balance         integer default 0
plan            text default 'free'  -- 'free' | 'core' | 'pro'
plan_tokens_per_month   integer
next_renewal_at timestamp
rollover_balance    integer default 0
```

### token_transactions
```sql
id              uuid primary key default gen_random_uuid()
user_id         uuid references auth.users
created_at      timestamp default now()

amount          integer     -- від'ємне = списання, додатнє = поповнення
action_type     text        -- 'onboarding' | 'module_generation' | 'skill_detection' | 'retrospective' | 'purchase' | 'renewal'
reference_id    uuid        -- id модуля або іншого об'єкту
balance_after   integer
```

---

## Row Level Security (RLS)

Всі таблиці мають RLS увімкнений.
Базове правило: користувач бачить тільки свої дані.

```sql
-- Приклад для profiles
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);
```
