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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          booking_type: string
          confirmation_code: string | null
          cost_amount: number | null
          cost_currency: string | null
          created_at: string
          end_datetime: string | null
          id: string
          notes: string | null
          provider: string | null
          start_datetime: string | null
          title: string
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_type: string
          confirmation_code?: string | null
          cost_amount?: number | null
          cost_currency?: string | null
          created_at?: string
          end_datetime?: string | null
          id?: string
          notes?: string | null
          provider?: string | null
          start_datetime?: string | null
          title: string
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_type?: string
          confirmation_code?: string | null
          cost_amount?: number | null
          cost_currency?: string | null
          created_at?: string
          end_datetime?: string | null
          id?: string
          notes?: string | null
          provider?: string | null
          start_datetime?: string | null
          title?: string
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      destinations: {
        Row: {
          budget_level: string | null
          country: string
          cover_image_url: string | null
          created_at: string | null
          crowd_level: number | null
          description: string | null
          dietary_friendly: string[] | null
          experience_tags: string[] | null
          freshness_score: number | null
          id: string
          landscape_type: string[] | null
          mood_affinities: Json | null
          name: string
          pace: string | null
          region: string | null
          trend_direction: string | null
          updated_at: string | null
          visa_status_in: string | null
        }
        Insert: {
          budget_level?: string | null
          country: string
          cover_image_url?: string | null
          created_at?: string | null
          crowd_level?: number | null
          description?: string | null
          dietary_friendly?: string[] | null
          experience_tags?: string[] | null
          freshness_score?: number | null
          id?: string
          landscape_type?: string[] | null
          mood_affinities?: Json | null
          name: string
          pace?: string | null
          region?: string | null
          trend_direction?: string | null
          updated_at?: string | null
          visa_status_in?: string | null
        }
        Update: {
          budget_level?: string | null
          country?: string
          cover_image_url?: string | null
          created_at?: string | null
          crowd_level?: number | null
          description?: string | null
          dietary_friendly?: string[] | null
          experience_tags?: string[] | null
          freshness_score?: number | null
          id?: string
          landscape_type?: string[] | null
          mood_affinities?: Json | null
          name?: string
          pace?: string | null
          region?: string | null
          trend_direction?: string | null
          updated_at?: string | null
          visa_status_in?: string | null
        }
        Relationships: []
      }
      itineraries: {
        Row: {
          budget_summary: Json | null
          cities: string[]
          content: Json
          created_at: string
          days_count: number
          edit_history: Json[] | null
          generated_by: string | null
          id: string
          is_user_edited: boolean
          title: string
          total_est_cost_inr: number | null
          trip_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_summary?: Json | null
          cities?: string[]
          content?: Json
          created_at?: string
          days_count?: number
          edit_history?: Json[] | null
          generated_by?: string | null
          id?: string
          is_user_edited?: boolean
          title?: string
          total_est_cost_inr?: number | null
          trip_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_summary?: Json | null
          cities?: string[]
          content?: Json
          created_at?: string
          days_count?: number
          edit_history?: Json[] | null
          generated_by?: string | null
          id?: string
          is_user_edited?: boolean
          title?: string
          total_est_cost_inr?: number | null
          trip_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itineraries_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_sessions: {
        Row: {
          created_at: string | null
          energy_level: string
          expires_at: string
          id: string
          mood_state: string
          planning_horizon: string
          ranked_destinations: Json | null
          trip_mode: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          energy_level?: string
          expires_at?: string
          id?: string
          mood_state?: string
          planning_horizon?: string
          ranked_destinations?: Json | null
          trip_mode?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          energy_level?: string
          expires_at?: string
          id?: string
          mood_state?: string
          planning_horizon?: string
          ranked_destinations?: Json | null
          trip_mode?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          cover_image_url: string | null
          created_at: string
          destination: string | null
          end_date: string | null
          id: string
          notes: string | null
          start_date: string | null
          status: string
          title: string
          traveller_count: number | null
          trip_mode: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          destination?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
          status?: string
          title: string
          traveller_count?: number | null
          trip_mode?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          destination?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
          status?: string
          title?: string
          traveller_count?: number | null
          trip_mode?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          cultural_preferences: Json | null
          experience_level: string | null
          experience_preferences: Json | null
          food_preferences: Json | null
          full_name: string | null
          home_city: string | null
          home_country: string | null
          id: string
          onboarding_completed: boolean | null
          past_trips: Json | null
          place_preferences: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          cultural_preferences?: Json | null
          experience_level?: string | null
          experience_preferences?: Json | null
          food_preferences?: Json | null
          full_name?: string | null
          home_city?: string | null
          home_country?: string | null
          id?: string
          onboarding_completed?: boolean | null
          past_trips?: Json | null
          place_preferences?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          cultural_preferences?: Json | null
          experience_level?: string | null
          experience_preferences?: Json | null
          food_preferences?: Json | null
          full_name?: string | null
          home_city?: string | null
          home_country?: string | null
          id?: string
          onboarding_completed?: boolean | null
          past_trips?: Json | null
          place_preferences?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vibe_searches: {
        Row: {
          created_at: string
          extracted_vibe: Json | null
          id: string
          image_url_temp: string | null
          match_explanation: string | null
          matched_destinations: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          extracted_vibe?: Json | null
          id?: string
          image_url_temp?: string | null
          match_explanation?: string | null
          matched_destinations?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          extracted_vibe?: Json | null
          id?: string
          image_url_temp?: string | null
          match_explanation?: string | null
          matched_destinations?: Json | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
