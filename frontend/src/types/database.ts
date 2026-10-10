export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      batch_devices: {
        Row: {
          batch_id: string;
          device_id: string;
          id: string;
          status: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          batch_id: string;
          device_id: string;
          id?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          batch_id?: string;
          device_id?: string;
          id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "batch_devices_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "batch_devices_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "devices";
            referencedColumns: ["id"];
          },
        ];
      };
      batches: {
        Row: {
          completed_at: string | null;
          failed_count: number;
          id: string;
          name: string;
          rollout_id: string;
          sequence_order: number;
          started_at: string | null;
          status: string;
          success_count: number;
          target_count: number;
        };
        ComputedFields: never;
        Insert: {
          completed_at?: string | null;
          failed_count?: number;
          id?: string;
          name: string;
          rollout_id: string;
          sequence_order: number;
          started_at?: string | null;
          status?: string;
          success_count?: number;
          target_count?: number;
        };
        Update: {
          completed_at?: string | null;
          failed_count?: number;
          id?: string;
          name?: string;
          rollout_id?: string;
          sequence_order?: number;
          started_at?: string | null;
          status?: string;
          success_count?: number;
          target_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "batches_rollout_id_fkey";
            columns: ["rollout_id"];
            isOneToOne: false;
            referencedRelation: "rollouts";
            referencedColumns: ["id"];
          },
        ];
      };
      devices: {
        Row: {
          created_at: string;
          id: string;
          model: string | null;
          region: string | null;
          serial: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          model?: string | null;
          region?: string | null;
          serial: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          model?: string | null;
          region?: string | null;
          serial?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          role: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          role?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          role?: string;
        };
        Relationships: [];
      };
      rollout_events: {
        Row: {
          batch_device_id: string;
          changed_at: string;
          id: string;
          new_status: string;
          old_status: string | null;
        };
        ComputedFields: never;
        Insert: {
          batch_device_id: string;
          changed_at?: string;
          id?: string;
          new_status: string;
          old_status?: string | null;
        };
        Update: {
          batch_device_id?: string;
          changed_at?: string;
          id?: string;
          new_status?: string;
          old_status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "rollout_events_batch_device_id_fkey";
            columns: ["batch_device_id"];
            isOneToOne: false;
            referencedRelation: "batch_devices";
            referencedColumns: ["id"];
          },
        ];
      };
      rollouts: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
          status: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rollouts_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
