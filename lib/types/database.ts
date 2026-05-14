// TypeScript types for the Supabase schema. Keep in sync with
// /supabase/migrations/ and /docs/database-schema.md.
// When the schema stabilizes, regenerate with `supabase gen types typescript`.

export type GoalDomain = "management" | "productivity" | "entrepreneurship";
export type ContentFormat = "text" | "audio" | "both";
export type MotivationVector = "approach" | "away_from";
export type EnergySource =
  | "achievement"
  | "recognition"
  | "connection"
  | "mastery";
export type TimeHorizon = "days" | "weeks" | "months" | "years";
export type ProcessingStyle = "analytical" | "intuitive";
export type LearningPace = "fast" | "medium" | "deep";
export type ModuleStatus = "generated" | "in_progress" | "completed";
export type SkillLevel = "discovered" | "growing" | "experienced" | "master";
export type SkillContextTag = "work" | "personal" | "creative" | "leadership";
export type TokenPlan = "free" | "core" | "pro";
export type TokenActionType =
  | "onboarding"
  | "module_generation"
  | "skill_detection"
  | "retrospective"
  | "purchase"
  | "renewal";

export interface ModuleContent {
  hook: {
    text: string;
    personal_reference: string;
  };
  core: {
    sections: Array<{
      text: string;
      pause?: {
        question: string;
        type: "reflection" | "application" | "recall";
      };
    }>;
    sources: Array<{
      title: string;
      author: string;
      type: "book" | "article" | "research";
      relevance: string;
    }>;
  };
  action: {
    task: string;
    reflection_prompt: string;
  };
}

export interface PauseResponse {
  question: string;
  answer: string;
  length: number;
}

export interface ClarifyingAnswer {
  question: string;
  answer: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          onboarding_completed: boolean;
          goal_domain: GoalDomain | null;
          goal_description: string | null;
          weekly_time_minutes: number | null;
          content_format: ContentFormat | null;
          motivation_vector: MotivationVector | null;
          energy_source: EnergySource | null;
          autonomy_level: number | null;
          time_horizon: TimeHorizon | null;
          depth_vs_breadth: number | null;
          ambiguity_tolerance: number | null;
          processing_style: ProcessingStyle | null;
          learning_pace: LearningPace | null;
          strengths_identified: boolean;
          strengths_data: Record<string, unknown> | null;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      modules: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          domain: string | null;
          title: string | null;
          content: ModuleContent | null;
          tokens_used: number | null;
          status: ModuleStatus;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["modules"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["modules"]["Row"]>;
      };
      module_progress: {
        Row: {
          id: string;
          module_id: string;
          user_id: string;
          created_at: string;
          time_on_hook_sec: number | null;
          time_on_core_sec: number | null;
          time_on_action_sec: number | null;
          sections_reread: number;
          sources_opened: boolean;
          task_completed: boolean | null;
          reflection_length: number | null;
          pause_responses: PauseResponse[] | null;
        };
        Insert: Partial<
          Database["public"]["Tables"]["module_progress"]["Row"]
        > & {
          module_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["module_progress"]["Row"]>;
      };
      skills: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          name: string;
          context_tag: SkillContextTag | null;
          confirmation_count: number;
          level: SkillLevel;
        };
        Insert: Partial<Database["public"]["Tables"]["skills"]["Row"]> & {
          user_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["skills"]["Row"]>;
      };
      skill_events: {
        Row: {
          id: string;
          skill_id: string;
          user_id: string;
          created_at: string;
          event_description: string;
          context_type: string | null;
          evidence: string | null;
          confirmed_by_user: boolean;
          clarifying_answers: ClarifyingAnswer[];
        };
        Insert: Partial<Database["public"]["Tables"]["skill_events"]["Row"]> & {
          skill_id: string;
          user_id: string;
          event_description: string;
        };
        Update: Partial<Database["public"]["Tables"]["skill_events"]["Row"]>;
      };
      checkins: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          day_number: number;
          applied_knowledge: boolean | null;
          application_details: string | null;
          what_changed: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["checkins"]["Row"]> & {
          user_id: string;
          day_number: number;
        };
        Update: Partial<Database["public"]["Tables"]["checkins"]["Row"]>;
      };
      tokens: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          plan: TokenPlan;
          plan_tokens_per_month: number | null;
          next_renewal_at: string | null;
          rollover_balance: number;
        };
        Insert: Partial<Database["public"]["Tables"]["tokens"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["tokens"]["Row"]>;
      };
      token_transactions: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          amount: number;
          action_type: TokenActionType;
          reference_id: string | null;
          balance_after: number;
        };
        Insert: Partial<
          Database["public"]["Tables"]["token_transactions"]["Row"]
        > & {
          user_id: string;
          amount: number;
          action_type: TokenActionType;
          balance_after: number;
        };
        Update: Partial<
          Database["public"]["Tables"]["token_transactions"]["Row"]
        >;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
