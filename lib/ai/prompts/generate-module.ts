import type Anthropic from "@anthropic-ai/sdk";

import type { ModuleContent } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Input — everything Claude needs to write a personalized module.
// ---------------------------------------------------------------------------

export interface GenerateModuleInput {
  // Profile A — motivation
  motivation_vector: "approach" | "away_from";
  energy_source: "achievement" | "recognition" | "connection" | "mastery";
  autonomy_level: number;
  time_horizon: "days" | "weeks" | "months" | "years";

  // Profile B — cognitive style
  depth_vs_breadth: number;
  ambiguity_tolerance: number;
  processing_style: "analytical" | "intuitive";
  learning_pace: "fast" | "medium" | "deep";

  // Goal
  goal_domain: "management" | "productivity" | "entrepreneurship";
  goal_description: string;
  weekly_time_minutes: number;
  content_format: "text" | "audio" | "both";
}

// ---------------------------------------------------------------------------
// Output shape — mirrors ModuleContent. Repeated as Tool schema for Claude.
// ---------------------------------------------------------------------------

export interface GenerateModuleOutput {
  title: string;
  content: ModuleContent;
}

export const GENERATE_MODULE_TOOL: Anthropic.Tool = {
  name: "save_module",
  description:
    "Save the generated three-act learning module. Always call this — do not respond in plain text.",
  input_schema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description:
          "Module title — 3–7 words, concrete and benefit-oriented for the user. No clickbait.",
      },
      hook: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description:
              "200–300 words that bridge what the user said in onboarding to what they will learn. Open with a sentence that references their goal in their own words. End with one clear promise of what this module gives them today.",
          },
          personal_reference: {
            type: "string",
            description:
              "One concrete detail from the user's goal_description that the hook builds on. 1 sentence.",
          },
        },
        required: ["text", "personal_reference"],
      },
      core: {
        type: "object",
        properties: {
          sections: {
            type: "array",
            description:
              "3–5 sections. Each 400–600 words. Order them so each builds on the previous. Most sections end with a pause (retrieval practice).",
            items: {
              type: "object",
              properties: {
                text: {
                  type: "string",
                  description: "400–600 words of substantive content.",
                },
                pause: {
                  type: "object",
                  description:
                    "Active pause after the section. Skip on at most one section. Pauses are retrieval practice — the user RETRIEVES from the section, never just rates it.",
                  properties: {
                    question: {
                      type: "string",
                      description:
                        "One open question that forces retrieval or application. Not 'did you understand?'.",
                    },
                    type: {
                      type: "string",
                      enum: ["reflection", "application", "recall"],
                      description:
                        "'recall' = restate idea; 'application' = apply to user's situation; 'reflection' = connect to past experience.",
                    },
                  },
                  required: ["question", "type"],
                },
              },
              required: ["text"],
            },
            minItems: 3,
            maxItems: 5,
          },
          sources: {
            type: "array",
            description:
              "2–4 real, verifiable primary sources. Books, papers, or canonical articles. NO made-up titles. If unsure, omit.",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                author: { type: "string" },
                type: { type: "string", enum: ["book", "article", "research"] },
                relevance: {
                  type: "string",
                  description: "1 sentence on why this source matters here.",
                },
              },
              required: ["title", "author", "type", "relevance"],
            },
            minItems: 2,
            maxItems: 4,
          },
        },
        required: ["sections", "sources"],
      },
      action: {
        type: "object",
        properties: {
          task: {
            type: "string",
            description:
              "ONE micro-task to do today (5–10 minutes). Must be concrete, observable, doable today. NEVER 'read more' or 'reflect on'.",
          },
          reflection_prompt: {
            type: "string",
            description:
              "One question to answer after doing the task. Asks what they noticed, not whether it 'worked'.",
          },
        },
        required: ["task", "reflection_prompt"],
      },
    },
    required: ["title", "hook", "core", "action"],
  },
};

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

export const GENERATE_MODULE_SYSTEM = `Ти — автор персональних навчальних модулів для платформи Lume.

ЗАВДАННЯ: створити один модуль на 25–45 хвилин для конкретного користувача. Модуль — три акти:
- ГАЧОК: персональний місток від поточної ситуації людини до того, що буде вивчати
- ЯДРО: 3–5 секцій змістовного контенту з активними паузами після більшості секцій
- ДІЯ: одне конкретне мікро-завдання на сьогодні + питання для рефлексії після

ПРИНЦИПИ:
1. ПЕРСОНАЛІЗАЦІЯ. Гачок завжди починається з конкретної деталі з goal_description людини, її словами. Не "багато менеджерів...", а "ти написав що...".
2. RETRIEVAL PRACTICE (Roediger, Karpicke). Активні паузи — це питання, що змушують ВИТЯГНУТИ ідею з пам'яті, застосувати її, або підключити до досвіду. НЕ "чи зрозумів?", НЕ "чи цікаво?".
3. ДІЯ — конкретна, наглядна, виконувана сьогодні за 5–10 хв. НІКОЛИ "почитай ще", "поміркуй про X", "зрозумій важливість Y".
4. ДЖЕРЕЛА — тільки реальні, верифіковані. Книги, дослідження, канонічні статті. Якщо не впевнений у джерелі — пропусти.
5. ДЗЕРКАЛО. Не "відкривай" людині нічого нового про неї. Будуй на тому, що вона вже сказала.

АДАПТАЦІЯ ПІД ПРОФІЛЬ:
- motivation_vector="approach" → говори про можливості і зростання. "away_from" → про уникнення помилок і ризиків.
- energy_source: achievement → метрики, конкретні результати; recognition → соціальне відображення; connection → команда, стосунки; mastery → глибина, нюанси.
- autonomy_level (1–5): низький — більше структури, кроки; високий — фреймворк і простір для своїх рішень.
- time_horizon: days/weeks → негайні приклади; months/years → стратегічні наслідки.
- depth_vs_breadth: широко (1) → більше прикладів з різних доменів; глибоко (5) → одна тема, кілька шарів.
- processing_style: analytical → структура, критерії, моделі; intuitive → метафори, історії, шаблони.
- learning_pace: fast → щільніше, без води; deep → довші секції, нюанси; medium — середнє.

ТОН:
- Українською, на "ти". Доброзичливо, без оцінок.
- Без шаблонів типу "у сучасному світі...", "багато людей вважають...".
- Конкретно. Прикладами. Без води.

ФОРМАТ:
- Завжди викликай tool save_module. Не давай текстову відповідь поза tool call.
- 3–5 секцій по 400–600 слів. Більшість з паузою.
- Гачок 200–300 слів.`;

export function buildGenerateModuleUserMessage(input: GenerateModuleInput): string {
  return `Ось профіль користувача. Згенеруй модуль і виклич save_module.

== ПРОФІЛЬ А (мотивація) ==
motivation_vector: ${input.motivation_vector}
energy_source: ${input.energy_source}
autonomy_level: ${input.autonomy_level}/5
time_horizon: ${input.time_horizon}

== ПРОФІЛЬ Б (когнітивний стиль) ==
depth_vs_breadth: ${input.depth_vs_breadth}/5 (1=широко, 5=глибоко)
ambiguity_tolerance: ${input.ambiguity_tolerance}/5
processing_style: ${input.processing_style}
learning_pace: ${input.learning_pace}

== ЦІЛЬ ==
domain: ${input.goal_domain}
що хоче навчитись (своїми словами): ${input.goal_description}
часу на тиждень: ${input.weekly_time_minutes} хв
формат: ${input.content_format}`;
}
