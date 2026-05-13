import type Anthropic from "@anthropic-ai/sdk";

import type {
  ContentFormat,
  EnergySource,
  GoalDomain,
  LearningPace,
  MotivationVector,
  ProcessingStyle,
  TimeHorizon,
} from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Input from the client — raw behavioural and dialog data.
// We analyze BEHAVIOUR (timing, choices, style), not what the user says about
// themselves. The dialog covers explicit goal + time + format only.
// ---------------------------------------------------------------------------

export interface OnboardingInput {
  task_reading: {
    passage_topic: string;
    comprehension_q1_answer: string;
    comprehension_q2_answer: string;
    open_question: string;
    open_answer: string;
    time_to_read_sec: number;
    time_to_answer_sec: number;
    reread: boolean;
  };
  task_decision: {
    scenario: string;
    options: string[];
    selected_option_index: number | null;
    custom_answer: string | null;
    time_to_decide_sec: number;
  };
  task_priority: {
    tasks: string[];
    final_order: number[];
    explanation: string;
    time_to_order_sec: number;
  };
  goal_dialog: {
    what_to_learn: string;
    why_now: string;
    weekly_time_minutes: number;
    content_format: ContentFormat;
  };
}

// ---------------------------------------------------------------------------
// Output — profile A (motivation) + profile B (cognitive style) + goal_domain
// ---------------------------------------------------------------------------

export interface OnboardingAnalysis {
  goal_domain: GoalDomain;
  motivation_vector: MotivationVector;
  energy_source: EnergySource;
  autonomy_level: number;
  time_horizon: TimeHorizon;
  depth_vs_breadth: number;
  ambiguity_tolerance: number;
  processing_style: ProcessingStyle;
  learning_pace: LearningPace;
  reasoning: string;
}

// ---------------------------------------------------------------------------
// Tool schema — Claude must emit JSON that matches this shape exactly.
// ---------------------------------------------------------------------------

export const ANALYZE_ONBOARDING_TOOL: Anthropic.Tool = {
  name: "save_user_profile",
  description:
    "Save the analyzed motivation and cognitive-style profile based on the user's onboarding behaviour.",
  input_schema: {
    type: "object",
    properties: {
      goal_domain: {
        type: "string",
        enum: ["management", "productivity", "entrepreneurship"],
        description:
          "Closest domain inferred from what_to_learn + why_now. Pick the best fit.",
      },
      motivation_vector: {
        type: "string",
        enum: ["approach", "away_from"],
        description:
          "'approach' = moving toward a desired future. 'away_from' = escaping a current threat or pain.",
      },
      energy_source: {
        type: "string",
        enum: ["achievement", "recognition", "connection", "mastery"],
        description: "What gives the user energy, judged from their language.",
      },
      autonomy_level: {
        type: "integer",
        minimum: 1,
        maximum: 5,
        description:
          "1 = needs explicit structure and steps. 5 = wants full autonomy and minimal hand-holding.",
      },
      time_horizon: {
        type: "string",
        enum: ["days", "weeks", "months", "years"],
        description: "Native planning horizon inferred from priority + goal answers.",
      },
      depth_vs_breadth: {
        type: "integer",
        minimum: 1,
        maximum: 5,
        description:
          "1 = scans broadly. 5 = drills into one thing deeply. Read from reading task + reorder logic.",
      },
      ambiguity_tolerance: {
        type: "integer",
        minimum: 1,
        maximum: 5,
        description:
          "1 = stalls under ambiguity, needs structure. 5 = speeds up in chaos. Read from decision task time + custom-answer presence.",
      },
      processing_style: {
        type: "string",
        enum: ["analytical", "intuitive"],
        description:
          "'analytical' = breaks things into parts, cites criteria. 'intuitive' = pattern-based, holistic explanations.",
      },
      learning_pace: {
        type: "string",
        enum: ["fast", "medium", "deep"],
        description:
          "'fast' = quick passes. 'medium' = standard. 'deep' = slow, thorough, rereads.",
      },
      reasoning: {
        type: "string",
        description:
          "2–4 sentences explaining the most distinctive observations in the user's behaviour. Concrete, factual, no labels or judgments. This text is shown to the user.",
      },
    },
    required: [
      "goal_domain",
      "motivation_vector",
      "energy_source",
      "autonomy_level",
      "time_horizon",
      "depth_vs_breadth",
      "ambiguity_tolerance",
      "processing_style",
      "learning_pace",
      "reasoning",
    ],
  },
};

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

export const ANALYZE_ONBOARDING_SYSTEM = `Ти — аналітик навчальної платформи Lume.

Твоя задача: з'ясувати профіль мотивації (А) і когнітивного стилю (Б) людини, спираючись на ПОВЕДІНКУ під час трьох мікро-задач і коротке самовизначення цілі. Не аналізуй те, що людина сказала про себе — аналізуй те, ЯК вона діяла.

Сигнали з кожної задачі:

ЗАДАЧА 1 (читання тексту):
- Час читання vs середній (швидкий = fast, повільний з перечитуванням = deep, середній = medium)
- Стиль відкритої відповіді: коротка і структурована = analytical; образна, асоціативна = intuitive
- Чи виділив "найважливіше" фокусно або широко (depth_vs_breadth)

ЗАДАЧА 2 (рішення в невизначеності):
- Швидкість рішення: швидко = висока ambiguity_tolerance, довго = низька
- Чи написав "інше" (custom_answer): так = автономія, "мені треба інакше"
- Якщо вибрав варіант: який саме (формулювання варіантів дають сигнал)

ЗАДАЧА 3 (пріоритизація):
- Логіка в explanation: дедлайн = days/weeks horizon; вплив = months/years; делегування = high autonomy
- Чи структурно (1, 2, 3...) чи наративно описав вибір (analytical vs intuitive)

ДІАЛОГ ЦІЛІ:
- "Навіщо саме зараз": "щоб не..." / "уникнути" / "не страждати" = away_from; "хочу", "стати", "досягти" = approach
- Тон самоопису підказує energy_source: "успіх", "виграти" = achievement; "щоб поважали" = recognition; "разом з командою" = connection; "розібратися глибоко" = mastery

ВАЖЛИВО:
- Якщо сигналів мало — обирай більш середнє значення, не крайнє
- reasoning — конкретні факти ("ти прочитав за X сек і не повертався", "ти написав власний варіант у задачі 2"). НЕ оцінки, НЕ ярлики, НЕ "ти інтроверт".
- Тон reasoning — дзеркало. Повертаєш людині те, що вона зробила, її ж словами де можливо.
- Завжди викликай tool save_user_profile. Не давай текстову відповідь поза tool call.`;

export function buildAnalyzeOnboardingUserMessage(input: OnboardingInput): string {
  return `Ось дані онбордингу. Проаналізуй і виклич save_user_profile.

== ЗАДАЧА 1 — РОЗУМІННЯ ТЕКСТУ ==
Тема уривка: ${input.task_reading.passage_topic}
Час читання: ${input.task_reading.time_to_read_sec} сек
Перечитував: ${input.task_reading.reread ? "так" : "ні"}
Час на відповіді: ${input.task_reading.time_to_answer_sec} сек
Відповідь 1: ${input.task_reading.comprehension_q1_answer}
Відповідь 2: ${input.task_reading.comprehension_q2_answer}
Відкрите питання: "${input.task_reading.open_question}"
Відповідь: ${input.task_reading.open_answer}

== ЗАДАЧА 2 — РІШЕННЯ В НЕВИЗНАЧЕНОСТІ ==
Сценарій: ${input.task_decision.scenario}
Варіанти:
${input.task_decision.options.map((o, i) => `${i + 1}. ${o}`).join("\n")}
Вибрано: ${
    input.task_decision.selected_option_index !== null
      ? `варіант ${input.task_decision.selected_option_index + 1}`
      : "власна відповідь"
  }
${input.task_decision.custom_answer ? `Власна відповідь: ${input.task_decision.custom_answer}` : ""}
Час на рішення: ${input.task_decision.time_to_decide_sec} сек

== ЗАДАЧА 3 — ПРІОРИТИЗАЦІЯ ==
Задачі:
${input.task_priority.tasks.map((t, i) => `${i + 1}. ${t}`).join("\n")}
Підсумковий порядок (за пріоритетом): ${input.task_priority.final_order
    .map((i) => i + 1)
    .join(" → ")}
Пояснення: ${input.task_priority.explanation}
Час: ${input.task_priority.time_to_order_sec} сек

== ДІАЛОГ ЦІЛІ ==
Що хоче навчитись: ${input.goal_dialog.what_to_learn}
Чому зараз: ${input.goal_dialog.why_now}
Часу на тиждень: ${input.goal_dialog.weekly_time_minutes} хв
Формат: ${input.goal_dialog.content_format}`;
}
