export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          location: string | null;
          country: string | null;
          languages: Json;
          headline: string | null;
          employment_status: string | null;
          education: Json;
          experience: Json;
          skills_primary: string[];
          skills_secondary: string[];
          domain_expertise: string[];
          dealbreakers: string[];
          target_roles: string[];
          target_sectors: string[];
          onboarding_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      jobs: {
        Row: {
          id: string;
          user_id: string;
          ingest_channel: "paste" | "url" | "portal";
          portal: string | null;
          source_url: string | null;
          title: string | null;
          company: string | null;
          location: string | null;
          raw_text: string;
          fetch_status: "pending" | "ok" | "failed" | "login_wall";
          fetched_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          ingest_channel?: "paste" | "url" | "portal";
          portal?: string | null;
          source_url?: string | null;
          title?: string | null;
          company?: string | null;
          location?: string | null;
          raw_text?: string;
          fetch_status?: "pending" | "ok" | "failed" | "login_wall";
        };
        Update: Partial<Database["public"]["Tables"]["jobs"]["Insert"]>;
      };
      evaluations: {
        Row: {
          id: string;
          job_id: string;
          user_id: string;
          fit_score: number | null;
          skills_match: Json;
          experience_match: Json;
          gaps: Json;
          recommendation: string | null;
          eligibility_notes: string | null;
          language_notes: string | null;
          model: string | null;
          prompt_version: string | null;
          cost_tokens: number;
          raw_output: Json | null;
          created_at: string;
        };
        Insert: {
          job_id: string;
          user_id: string;
          fit_score?: number | null;
          skills_match?: Json;
          experience_match?: Json;
          gaps?: Json;
          recommendation?: string | null;
          cost_tokens?: number;
          raw_output?: Json | null;
          model?: string | null;
          prompt_version?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["evaluations"]["Insert"]>;
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          job_id: string;
          status: "active" | "interview" | "offer" | "hired" | "closed";
          channel: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          job_id: string;
          status?: "active" | "interview" | "offer" | "hired" | "closed";
          channel?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["applications"]["Insert"]>;
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          application_id: string;
          doc_type: "resume" | "cover";
          markdown_body: string;
          pdf_path: string | null;
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          application_id: string;
          doc_type: "resume" | "cover";
          markdown_body?: string;
          pdf_path?: string | null;
          version?: number;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
      };
      usage_quotas: {
        Row: {
          user_id: string;
          plan: string;
          applies_used_month: number;
          applies_limit_month: number;
          period_yyyymm: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          updated_at: string;
        };
      };
      feature_flags: {
        Row: { key: string; enabled: boolean; notes: string | null };
      };
    };
  };
};
