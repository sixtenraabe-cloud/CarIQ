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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      cars: {
        Row: {
          created_at: string
          fuel: string
          id: string
          make: string
          mileage_km: number
          model: string
          nickname: string | null
          transmission: string
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          fuel: string
          id?: string
          make: string
          mileage_km: number
          model: string
          nickname?: string | null
          transmission: string
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          fuel?: string
          id?: string
          make?: string
          mileage_km?: number
          model?: string
          nickname?: string | null
          transmission?: string
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      diagnoses: {
        Row: {
          advice: string
          car_id: string | null
          car_summary: string
          causes: Json
          checks: Json
          confidence: number
          created_at: string
          estimated_cost: string | null
          had_audio: boolean
          headline: string
          id: string
          symptom: string
          symptom_tags: string[]
          user_id: string
          verdict: string
        }
        Insert: {
          advice?: string
          car_id?: string | null
          car_summary: string
          causes?: Json
          checks?: Json
          confidence?: number
          created_at?: string
          estimated_cost?: string | null
          had_audio?: boolean
          headline: string
          id?: string
          symptom: string
          symptom_tags?: string[]
          user_id: string
          verdict: string
        }
        Update: {
          advice?: string
          car_id?: string | null
          car_summary?: string
          causes?: Json
          checks?: Json
          confidence?: number
          created_at?: string
          estimated_cost?: string | null
          had_audio?: boolean
          headline?: string
          id?: string
          symptom?: string
          symptom_tags?: string[]
          user_id?: string
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnoses_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      entitlements: {
        Row: {
          credits: number
          period_anchor: string | null
          period_uses: number
          updated_at: string
          user_id: string
        }
        Insert: {
          credits?: number
          period_anchor?: string | null
          period_uses?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          credits?: number
          period_anchor?: string | null
          period_uses?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          created_at: string
          event_id: string
          event_type: string
        }
        Insert: {
          created_at?: string
          event_id: string
          event_type?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          event_type?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id: string
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workshop_leads: {
        Row: {
          car_summary: string
          consent: boolean
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string
          estimated_cost: string
          headline: string
          id: string
          location: string
          note: string
          partner: string
          status: string
          symptom: string
          user_id: string
          verdict: string
        }
        Insert: {
          car_summary?: string
          consent?: boolean
          contact_email?: string
          contact_name: string
          contact_phone: string
          created_at?: string
          estimated_cost?: string
          headline?: string
          id?: string
          location?: string
          note?: string
          partner: string
          status?: string
          symptom?: string
          user_id: string
          verdict?: string
        }
        Update: {
          car_summary?: string
          consent?: boolean
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          estimated_cost?: string
          headline?: string
          id?: string
          location?: string
          note?: string
          partner?: string
          status?: string
          symptom?: string
          user_id?: string
          verdict?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_entitlement: { Args: { _user_id: string }; Returns: Json }
      entitlement_state: { Args: { _user_id: string }; Returns: Json }
      grant_credits: {
        Args: { _amount: number; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
