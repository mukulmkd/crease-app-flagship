/**
 * Hand-authored Database types for Ranches Thunders MVP schema.
 * Replace with: npx supabase gen types typescript --linked > src/types/database.ts
 */

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
          phone: string | null;
          avatar_url: string | null;
          profile_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          profile_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          upi_vpa: string | null;
          whatsapp_notify_url: string | null;
          carpool_fee_inr: number;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          upi_vpa?: string | null;
          whatsapp_notify_url?: string | null;
          carpool_fee_inr?: number;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["teams"]["Insert"]>;
        Relationships: [];
      };
      team_memberships: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: "admin" | "player";
          status: "active" | "invited" | "suspended" | "left";
          joined_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role?: "admin" | "player";
          status?: "active" | "invited" | "suspended" | "left";
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["team_memberships"]["Insert"]
        >;
        Relationships: [];
      };
      tournaments: {
        Row: {
          id: string;
          team_id: string;
          name: string;
          planned_match_count: number;
          total_fees_inr: number;
          status: "draft" | "active" | "completed" | "cancelled";
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          name: string;
          planned_match_count: number;
          total_fees_inr: number;
          status?: "draft" | "active" | "completed" | "cancelled";
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tournaments"]["Insert"]>;
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          team_id: string;
          match_date: string;
          classification: "warmup" | "tournament";
          tournament_id: string | null;
          opposition: string | null;
          ground_maps_url: string | null;
          start_time: string | null;
          match_fees_inr: number | null;
          status:
            | "draft"
            | "pending_confirm"
            | "confirmed"
            | "completed"
            | "cancelled";
          polls_frozen: boolean;
          confirmed_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          match_date: string;
          classification?: "warmup" | "tournament";
          tournament_id?: string | null;
          opposition?: string | null;
          ground_maps_url?: string | null;
          start_time?: string | null;
          match_fees_inr?: number | null;
          status?:
            | "draft"
            | "pending_confirm"
            | "confirmed"
            | "completed"
            | "cancelled";
          polls_frozen?: boolean;
          confirmed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["matches"]["Insert"]>;
        Relationships: [];
      };
      polls: {
        Row: {
          id: string;
          team_id: string;
          match_id: string;
          type: "availability" | "carpool";
          status: "draft" | "active" | "frozen" | "closed";
          frozen_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          match_id: string;
          type: "availability" | "carpool";
          status?: "draft" | "active" | "frozen" | "closed";
          frozen_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["polls"]["Insert"]>;
        Relationships: [];
      };
      poll_votes: {
        Row: {
          id: string;
          poll_id: string;
          user_id: string;
          availability: "yes" | "no" | null;
          carpool: "carpool" | "self" | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          poll_id: string;
          user_id: string;
          availability?: "yes" | "no" | null;
          carpool?: "carpool" | "self" | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["poll_votes"]["Insert"]>;
        Relationships: [];
      };
      weekend_settlements: {
        Row: {
          id: string;
          team_id: string;
          week_start_date: string;
          status: "open" | "collecting" | "settled" | "cancelled";
          notified_at: string | null;
          settled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          week_start_date: string;
          status?: "open" | "collecting" | "settled" | "cancelled";
          notified_at?: string | null;
          settled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["weekend_settlements"]["Insert"]
        >;
        Relationships: [];
      };
      settlement_charges: {
        Row: {
          id: string;
          settlement_id: string;
          match_id: string;
          team_id: string;
          user_id: string;
          match_fee_share_inr: number;
          carpool_fee_inr: number;
          total_inr: number;
          status: "pending" | "paid" | "offline_paid" | "waived";
          utr: string | null;
          screenshot_path: string | null;
          paid_at: string | null;
          marked_paid_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          settlement_id: string;
          match_id: string;
          team_id: string;
          user_id: string;
          match_fee_share_inr?: number;
          carpool_fee_inr?: number;
          total_inr: number;
          status?: "pending" | "paid" | "offline_paid" | "waived";
          utr?: string | null;
          screenshot_path?: string | null;
          paid_at?: string | null;
          marked_paid_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["settlement_charges"]["Insert"]
        >;
        Relationships: [];
      };
      team_fund_accounts: {
        Row: {
          id: string;
          team_id: string;
          balance_inr: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          balance_inr?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["team_fund_accounts"]["Insert"]
        >;
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          team_id: string;
          amount_inr: number;
          category: string;
          note: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          amount_inr: number;
          category?: string;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
        Relationships: [];
      };
      team_fund_transactions: {
        Row: {
          id: string;
          team_id: string;
          account_id: string;
          direction: "credit" | "debit";
          amount_inr: number;
          note: string | null;
          expense_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          account_id: string;
          direction: "credit" | "debit";
          amount_inr: number;
          note?: string | null;
          expense_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["team_fund_transactions"]["Insert"]
        >;
        Relationships: [];
      };
      fund_contribution_asks: {
        Row: {
          id: string;
          team_id: string;
          amount_per_player_inr: number;
          note: string | null;
          status: "draft" | "sent" | "closed";
          sent_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          amount_per_player_inr?: number;
          note?: string | null;
          status?: "draft" | "sent" | "closed";
          sent_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["fund_contribution_asks"]["Insert"]
        >;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          team_id: string | null;
          user_id: string | null;
          type: "match" | "poll" | "payment" | "fund" | "membership" | "system";
          title: string;
          body: string;
          data: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id?: string | null;
          user_id?: string | null;
          type?:
            "match" | "poll" | "payment" | "fund" | "membership" | "system";
          title: string;
          body: string;
          data?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["notifications"]["Insert"]
        >;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          team_id: string | null;
          actor_id: string | null;
          action:
            | "create"
            | "update"
            | "soft_delete"
            | "restore"
            | "status_change"
            | "role_change";
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id?: string | null;
          actor_id?: string | null;
          action:
            | "create"
            | "update"
            | "soft_delete"
            | "restore"
            | "status_change"
            | "role_change";
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      app_is_active_member: {
        Args: { p_team_id: string };
        Returns: boolean;
      };
      app_is_team_admin: {
        Args: { p_team_id: string };
        Returns: boolean;
      };
      app_is_any_active_member: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      membership_role: "admin" | "player";
      membership_status: "active" | "invited" | "suspended" | "left";
      match_classification: "warmup" | "tournament";
      match_status:
        "draft" | "pending_confirm" | "confirmed" | "completed" | "cancelled";
      poll_type: "availability" | "carpool";
      poll_status: "draft" | "active" | "frozen" | "closed";
      availability_vote: "yes" | "no";
      carpool_vote: "carpool" | "self";
      settlement_status: "open" | "collecting" | "settled" | "cancelled";
      charge_status: "pending" | "paid" | "offline_paid" | "waived";
      fund_txn_direction: "credit" | "debit";
      contribution_ask_status: "draft" | "sent" | "closed";
      notification_type:
        "match" | "poll" | "payment" | "fund" | "membership" | "system";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
