import type Anthropic from "@anthropic-ai/sdk";

import type { SkillContextTag } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Skill detection — two-stage flow
//   1. User describes a moment they're proud of (≥3 sentences).
//   2. AI asks 2–3 clarifying questions. User answers.
//   3. AI proposes 3–5 skills with evidence. User confirms / edits names.
// Principle of the mirror: never suggest a skill the user hasn't shown.
// ---------------------------------------------------------------------------

export interface SkillSuggestion {
  name: string;
  evidence: string;
  context_tag: SkillContextTag;
}

// ---------------------------------------------------------------------------
// Stage 1 — clarifying questions
// ---------------------------------------------------------------------------

export const DETECT_SKILLS_QUESTIONS_TOOL: Anthropic.Tool = {
  name: "ask_clarifying_questions",
  description:
    "Return 2-3 short questions that surface the specific actions, decisions, or moves the user made in the event. Goal: extract concrete behaviour, not feelings or labels.",
  input_schema: {
    type: "object",
    properties: {
      clarifying_questions: {
        type: "array",
        minItems: 2,
        maxItems: 3,
        items: {
          type: "string",
          description:
            "A single short open question (≤ 140 chars). Ask about a concrete action, decision, or constraint. Avoid 'how did it feel' or 'why was it important' — too abstract.",
        },
      },
    },
    required: ["clarifying_questions"],
  },
};

export const DETECT_SKILLS_QUESTIONS_SYSTEM = `Ти — інтерв'юер карти скілів у платформі Lume.

Людина описала момент, яким пишається. Твоя задача: знайти 2–3 короткі питання, які витягнуть КОНКРЕТНІ дії, рішення і ходи. Скіли ми визначаємо з поведінки, не з самоопису.

Принципи:
- Питання короткі, відкриті, по одній темі кожне.
- Питай про ДІЇ: "що саме ти зробив першим", "як ти обрав цей підхід", "що було найскладніше і як ти це обійшов".
- Не питай "як ти почувався", "чому це важливо" — занадто абстрактно.
- Якщо в описі вже є конкретика — копай глибше в найцікавіше місце.
- Українською, на "ти", доброзичливо.

Завжди викликай tool ask_clarifying_questions. Не давай текстову відповідь поза tool call.`;

export function buildQuestionsUserMessage(eventDescription: string): string {
  return `Ось опис події. Сформулюй 2–3 уточнюючих питання.

== ОПИС ПОДІЇ ==
${eventDescription}`;
}

// ---------------------------------------------------------------------------
// Stage 2 — suggest skills
// ---------------------------------------------------------------------------

export const DETECT_SKILLS_SUGGEST_TOOL: Anthropic.Tool = {
  name: "suggest_skills",
  description:
    "Return 3–5 skills the user demonstrated in the event. Each skill must be grounded in concrete words or actions from the description or clarifying answers.",
  input_schema: {
    type: "object",
    properties: {
      suggested_skills: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description:
                "Skill name, 2–4 words, in Ukrainian. Concrete and behavioural (e.g. 'пріоритизація під дедлайн', 'переговори у конфлікті'). Avoid generic labels ('лідерство', 'комунікація').",
            },
            evidence: {
              type: "string",
              description:
                "1–2 sentences quoting or paraphrasing the specific action/decision from the event that demonstrates this skill. Must be groundable in the user's words.",
            },
            context_tag: {
              type: "string",
              enum: ["work", "personal", "creative", "leadership"],
              description:
                "Context category. 'leadership' if the skill was about influencing/coordinating others; 'creative' if it was a craft/design/writing output; 'work' for professional execution; 'personal' for life outside work.",
            },
          },
          required: ["name", "evidence", "context_tag"],
        },
      },
    },
    required: ["suggested_skills"],
  },
};

export const DETECT_SKILLS_SUGGEST_SYSTEM = `Ти — аналітик карти скілів у платформі Lume.

Принцип дзеркала: пропонуй ТІЛЬКИ ті скіли, які людина прямо показала в описі або в уточнюючих відповідях. Ніколи не вигадуй "ймовірних" скілів. Якщо сигналів менше 3 — пропонуй 3, не натягуй до 5.

Як називати скіл:
- Конкретно і поведінково: "пріоритизація під дедлайн", "переговори у конфлікті", "розбивка задачі на кроки".
- НЕ загальні ярлики: "лідерство", "комунікація", "вміння працювати в команді".
- 2–4 слова, українською.

Evidence:
- Цитуй або переказуй конкретний крок з опису. Без оцінок, без "ти молодець".
- Якщо доказ слабкий — не додавай скіл.

Context_tag:
- 'leadership' — якщо скіл був про вплив/координацію людей.
- 'creative' — ремесло/дизайн/текст/код як артефакт.
- 'work' — професійне виконання.
- 'personal' — життя поза роботою.

Завжди викликай tool suggest_skills. Не давай текстову відповідь поза tool call.`;

export function buildSuggestUserMessage(
  eventDescription: string,
  clarifyingAnswers: { question: string; answer: string }[],
): string {
  const qa = clarifyingAnswers
    .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
    .join("\n\n");

  return `Ось опис події і відповіді на уточнюючі питання. Запропонуй 3–5 скілів.

== ОПИС ПОДІЇ ==
${eventDescription}

== УТОЧНЕННЯ ==
${qa || "(уточнень не було)"}`;
}
