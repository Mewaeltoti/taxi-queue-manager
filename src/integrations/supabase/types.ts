export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      association_fermatas: {
        Row: {
          association_id: string
          created_at: string
          fermata_id: string
          id: string
          is_authorized: boolean
        }
        Insert: {
          association_id: string
          created_at?: string
          fermata_id: string
          id?: string
          is_authorized?: boolean
        }
        Update: {
          association_id?: string
          created_at?: string
          fermata_id?: string
          id?: string
          is_authorized?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "association_fermatas_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_fermatas_fermata_id_fkey"
            columns: ["fermata_id"]
            isOneToOne: false
            referencedRelation: "fermatas"
            referencedColumns: ["id"]
          },
        ]
      }
      associations: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          fermata_id: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          taxi_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          fermata_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          taxi_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          fermata_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          taxi_id?: string | null
        }
        Relationships: []
      }
      auto_report_config: {
        Row: {
          created_at: string
          id: string
          skip_threshold: number
          timeout_minutes: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          skip_threshold?: number
          timeout_minutes?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          skip_threshold?: number
          timeout_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      dispatch_logs: {
        Row: {
          dispatched_at: string
          dispatcher_id: string | null
          driver_name: string | null
          fermata_id: string
          id: string
          plate_number: string | null
          queue_entry_id: string | null
          taxi_id: string
        }
        Insert: {
          dispatched_at?: string
          dispatcher_id?: string | null
          driver_name?: string | null
          fermata_id: string
          id?: string
          plate_number?: string | null
          queue_entry_id?: string | null
          taxi_id: string
        }
        Update: {
          dispatched_at?: string
          dispatcher_id?: string | null
          driver_name?: string | null
          fermata_id?: string
          id?: string
          plate_number?: string | null
          queue_entry_id?: string | null
          taxi_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_logs_fermata_id_fkey"
            columns: ["fermata_id"]
            isOneToOne: false
            referencedRelation: "fermatas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_logs_queue_entry_id_fkey"
            columns: ["queue_entry_id"]
            isOneToOne: false
            referencedRelation: "queue_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_logs_taxi_id_fkey"
            columns: ["taxi_id"]
            isOneToOne: false
            referencedRelation: "taxis"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatcher_fermatas: {
        Row: {
          created_at: string
          dispatcher_id: string
          fermata_id: string
          id: string
        }
        Insert: {
          created_at?: string
          dispatcher_id: string
          fermata_id: string
          id?: string
        }
        Update: {
          created_at?: string
          dispatcher_id?: string
          fermata_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispatcher_fermatas_fermata_id_fkey"
            columns: ["fermata_id"]
            isOneToOne: false
            referencedRelation: "fermatas"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          association_id: string | null
          created_at: string
          id: string
          license_id: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          association_id?: string | null
          created_at?: string
          id?: string
          license_id?: string | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          association_id?: string | null
          created_at?: string
          id?: string
          license_id?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drivers_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      fermatas: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      queue_activity_logs: {
        Row: {
          action: string
          created_at: string
          dispatcher_id: string | null
          fermata_id: string
          id: string
          metadata: Json | null
          new_position: number | null
          new_status: Database["public"]["Enums"]["queue_status"] | null
          old_position: number | null
          old_status: Database["public"]["Enums"]["queue_status"] | null
          queue_entry_id: string | null
          taxi_id: string
        }
        Insert: {
          action: string
          created_at?: string
          dispatcher_id?: string | null
          fermata_id: string
          id?: string
          metadata?: Json | null
          new_position?: number | null
          new_status?: Database["public"]["Enums"]["queue_status"] | null
          old_position?: number | null
          old_status?: Database["public"]["Enums"]["queue_status"] | null
          queue_entry_id?: string | null
          taxi_id: string
        }
        Update: {
          action?: string
          created_at?: string
          dispatcher_id?: string | null
          fermata_id?: string
          id?: string
          metadata?: Json | null
          new_position?: number | null
          new_status?: Database["public"]["Enums"]["queue_status"] | null
          old_position?: number | null
          old_status?: Database["public"]["Enums"]["queue_status"] | null
          queue_entry_id?: string | null
          taxi_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_activity_logs_fermata_id_fkey"
            columns: ["fermata_id"]
            isOneToOne: false
            referencedRelation: "fermatas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_activity_logs_queue_entry_id_fkey"
            columns: ["queue_entry_id"]
            isOneToOne: false
            referencedRelation: "queue_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_activity_logs_taxi_id_fkey"
            columns: ["taxi_id"]
            isOneToOne: false
            referencedRelation: "taxis"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_entries: {
        Row: {
          arrival_time: string
          created_at: string
          dispatched_at: string | null
          dispatcher_id: string | null
          fermata_id: string
          id: string
          last_skip_at: string | null
          queue_number: number
          skip_count: number
          status: Database["public"]["Enums"]["queue_status"]
          taxi_id: string
          updated_at: string
        }
        Insert: {
          arrival_time?: string
          created_at?: string
          dispatched_at?: string | null
          dispatcher_id?: string | null
          fermata_id: string
          id?: string
          last_skip_at?: string | null
          queue_number: number
          skip_count?: number
          status?: Database["public"]["Enums"]["queue_status"]
          taxi_id: string
          updated_at?: string
        }
        Update: {
          arrival_time?: string
          created_at?: string
          dispatched_at?: string | null
          dispatcher_id?: string | null
          fermata_id?: string
          id?: string
          last_skip_at?: string | null
          queue_number?: number
          skip_count?: number
          status?: Database["public"]["Enums"]["queue_status"]
          taxi_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_entries_fermata_id_fkey"
            columns: ["fermata_id"]
            isOneToOne: false
            referencedRelation: "fermatas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_entries_taxi_id_fkey"
            columns: ["taxi_id"]
            isOneToOne: false
            referencedRelation: "taxis"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          admin_comments: string | null
          created_at: string
          description: string | null
          dispatcher_id: string | null
          fermata_id: string | null
          id: string
          is_auto_generated: boolean
          metadata: Json | null
          reason: Database["public"]["Enums"]["report_reason"]
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          taxi_id: string | null
          updated_at: string
        }
        Insert: {
          admin_comments?: string | null
          created_at?: string
          description?: string | null
          dispatcher_id?: string | null
          fermata_id?: string | null
          id?: string
          is_auto_generated?: boolean
          metadata?: Json | null
          reason: Database["public"]["Enums"]["report_reason"]
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          taxi_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_comments?: string | null
          created_at?: string
          description?: string | null
          dispatcher_id?: string | null
          fermata_id?: string | null
          id?: string
          is_auto_generated?: boolean
          metadata?: Json | null
          reason?: Database["public"]["Enums"]["report_reason"]
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          taxi_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_fermata_id_fkey"
            columns: ["fermata_id"]
            isOneToOne: false
            referencedRelation: "fermatas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_taxi_id_fkey"
            columns: ["taxi_id"]
            isOneToOne: false
            referencedRelation: "taxis"
            referencedColumns: ["id"]
          },
        ]
      }
      taxis: {
        Row: {
          association_id: string | null
          created_at: string
          driver_id: string | null
          id: string
          is_suspended: boolean
          plate_number: string
          type: string
          updated_at: string
        }
        Insert: {
          association_id?: string | null
          created_at?: string
          driver_id?: string | null
          id?: string
          is_suspended?: boolean
          plate_number: string
          type?: string
          updated_at?: string
        }
        Update: {
          association_id?: string | null
          created_at?: string
          driver_id?: string | null
          id?: string
          is_suspended?: boolean
          plate_number?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "taxis_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taxis_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_taxi_fermata_authorization: {
        Args: { _fermata_id: string; _taxi_id: string }
        Returns: boolean
      }
      dispatch_taxi: {
        Args: { _dispatcher_id: string; _entry_id: string }
        Returns: Json
      }
      get_next_queue_number: { Args: { _fermata_id: string }; Returns: number }
      has_fermata_access: {
        Args: { _fermata_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      normalize_queue_positions: {
        Args: { _fermata_id: string }
        Returns: undefined
      }
      skip_taxi_in_queue: {
        Args: { _dispatcher_id: string; _entry_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "dispatcher"
      audit_action:
        | "queue_created"
        | "queue_updated"
        | "queue_skipped"
        | "queue_dispatched"
        | "queue_canceled"
        | "taxi_not_ready"
        | "taxi_returned"
        | "unauthorized_attempt"
        | "report_created"
        | "report_resolved"
        | "dispatcher_assigned"
        | "fermata_created"
        | "driver_created"
        | "taxi_created"
      queue_status:
        | "waiting"
        | "dispatched"
        | "skipped"
        | "not_ready"
        | "returned"
        | "canceled"
      report_reason:
        | "wrong_fermata"
        | "wrong_association"
        | "unauthorized_dispatch"
        | "excessive_skips"
        | "timeout"
        | "other"
      report_status: "open" | "in_progress" | "resolved" | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "dispatcher"],
      audit_action: [
        "queue_created",
        "queue_updated",
        "queue_skipped",
        "queue_dispatched",
        "queue_canceled",
        "taxi_not_ready",
        "taxi_returned",
        "unauthorized_attempt",
        "report_created",
        "report_resolved",
        "dispatcher_assigned",
        "fermata_created",
        "driver_created",
        "taxi_created",
      ],
      queue_status: [
        "waiting",
        "dispatched",
        "skipped",
        "not_ready",
        "returned",
        "canceled",
      ],
      report_reason: [
        "wrong_fermata",
        "wrong_association",
        "unauthorized_dispatch",
        "excessive_skips",
        "timeout",
        "other",
      ],
      report_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
} as const
