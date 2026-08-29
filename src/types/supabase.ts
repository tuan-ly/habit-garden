export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string | null
          description: string | null
          description_vi: string | null
          icon: string
          id: string
          is_hidden: boolean | null
          name: string
          name_vi: string
          requirement_data: Json | null
          requirement_type: string
          requirement_value: number | null
          xp_reward: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          description_vi?: string | null
          icon: string
          id: string
          is_hidden?: boolean | null
          name: string
          name_vi: string
          requirement_data?: Json | null
          requirement_type: string
          requirement_value?: number | null
          xp_reward?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          description_vi?: string | null
          icon?: string
          id?: string
          is_hidden?: boolean | null
          name?: string
          name_vi?: string
          requirement_data?: Json | null
          requirement_type?: string
          requirement_value?: number | null
          xp_reward?: number | null
        }
        Relationships: []
      }
      daily_weather: {
        Row: {
          created_at: string | null
          date: string | null
          description: string | null
          growth_modifier: number | null
          id: string
          moisture_modifier: number | null
          weather_type: string
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          description?: string | null
          growth_modifier?: number | null
          id?: string
          moisture_modifier?: number | null
          weather_type: string
        }
        Update: {
          created_at?: string | null
          date?: string | null
          description?: string | null
          growth_modifier?: number | null
          id?: string
          moisture_modifier?: number | null
          weather_type?: string
        }
        Relationships: []
      }
      goal_adjustments: {
        Row: {
          adjustment_type: string
          auto_applied: boolean | null
          created_at: string | null
          goal_id: string
          id: string
          new_value: Json | null
          old_value: Json | null
          performance_data: Json | null
          responded_at: string | null
          response: string | null
          suggested_at: string | null
          trigger_reason: string | null
        }
        Insert: {
          adjustment_type: string
          auto_applied?: boolean | null
          created_at?: string | null
          goal_id: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          performance_data?: Json | null
          responded_at?: string | null
          response?: string | null
          suggested_at?: string | null
          trigger_reason?: string | null
        }
        Update: {
          adjustment_type?: string
          auto_applied?: boolean | null
          created_at?: string | null
          goal_id?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          performance_data?: Json | null
          responded_at?: string | null
          response?: string | null
          suggested_at?: string | null
          trigger_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_adjustments_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_logs: {
        Row: {
          created_at: string | null
          exceeded_target: boolean | null
          goal_id: string
          id: string
          is_personal_record: boolean | null
          logged_at: string | null
          logged_date: string | null
          notes: string | null
          plant_id: string
          user_id: string
          value: number
          week_number: number | null
          weekly_target: number | null
        }
        Insert: {
          created_at?: string | null
          exceeded_target?: boolean | null
          goal_id: string
          id?: string
          is_personal_record?: boolean | null
          logged_at?: string | null
          logged_date?: string | null
          notes?: string | null
          plant_id: string
          user_id: string
          value: number
          week_number?: number | null
          weekly_target?: number | null
        }
        Update: {
          created_at?: string | null
          exceeded_target?: boolean | null
          goal_id?: string
          id?: string
          is_personal_record?: boolean | null
          logged_at?: string | null
          logged_date?: string | null
          notes?: string | null
          plant_id?: string
          user_id?: string
          value?: number
          week_number?: number | null
          weekly_target?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_logs_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_logs_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          adaptive_mode: string | null
          adjustment_count: number | null
          created_at: string | null
          current_value: number | null
          duration_weeks: number
          goal_mode: string
          id: string
          initial_amount: number | null
          last_adjusted_at: string | null
          plant_id: string
          progression_type: string | null
          start_value: number | null
          started_at: string | null
          step_size: number | null
          target_date: string | null
          target_value: number
          tracking_metric: string
          unit: string
          updated_at: string | null
          weekly_targets: Json | null
        }
        Insert: {
          adaptive_mode?: string | null
          adjustment_count?: number | null
          created_at?: string | null
          current_value?: number | null
          duration_weeks: number
          goal_mode: string
          id?: string
          initial_amount?: number | null
          last_adjusted_at?: string | null
          plant_id: string
          progression_type?: string | null
          start_value?: number | null
          started_at?: string | null
          step_size?: number | null
          target_date?: string | null
          target_value: number
          tracking_metric: string
          unit: string
          updated_at?: string | null
          weekly_targets?: Json | null
        }
        Update: {
          adaptive_mode?: string | null
          adjustment_count?: number | null
          created_at?: string | null
          current_value?: number | null
          duration_weeks?: number
          goal_mode?: string
          id?: string
          initial_amount?: number | null
          last_adjusted_at?: string | null
          plant_id?: string
          progression_type?: string | null
          start_value?: number | null
          started_at?: string | null
          step_size?: number | null
          target_date?: string | null
          target_value?: number
          tracking_metric?: string
          unit?: string
          updated_at?: string | null
          weekly_targets?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          dedupe_key: string | null
          id: string
          message: string
          message_vi: string | null
          read: boolean | null
          title: string
          title_vi: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          dedupe_key?: string | null
          id?: string
          message: string
          message_vi?: string | null
          read?: boolean | null
          title: string
          title_vi?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          dedupe_key?: string | null
          id?: string
          message?: string
          message_vi?: string | null
          read?: boolean | null
          title?: string
          title_vi?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_types: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          description_vi: string | null
          difficulty: string | null
          frequency_target: number | null
          frequency_type: string
          icon: string
          id: string
          is_premium: boolean | null
          maturity_days: number
          moisture_boost: number | null
          moisture_decay_rate: number | null
          name: string
          name_vi: string
          special_effect: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          description_vi?: string | null
          difficulty?: string | null
          frequency_target?: number | null
          frequency_type?: string
          icon: string
          id: string
          is_premium?: boolean | null
          maturity_days: number
          moisture_boost?: number | null
          moisture_decay_rate?: number | null
          name: string
          name_vi: string
          special_effect?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          description_vi?: string | null
          difficulty?: string | null
          frequency_target?: number | null
          frequency_type?: string
          icon?: string
          id?: string
          is_premium?: boolean | null
          maturity_days?: number
          moisture_boost?: number | null
          moisture_decay_rate?: number | null
          name?: string
          name_vi?: string
          special_effect?: Json | null
        }
        Relationships: []
      }
      plants: {
        Row: {
          adaptive_mode: string | null
          created_at: string | null
          current_moisture: number | null
          current_streak: number | null
          death_reason: string | null
          died_at: string | null
          goal_mode: string | null
          growth_percentage: number | null
          habit_description: string | null
          id: string
          last_watered_at: string | null
          longest_streak: number | null
          matured_at: string | null
          name: string
          plant_type_id: string
          position: number | null
          reminder_enabled: boolean | null
          reminder_time: string | null
          started_at: string | null
          status: string | null
          total_waterings: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          adaptive_mode?: string | null
          created_at?: string | null
          current_moisture?: number | null
          current_streak?: number | null
          death_reason?: string | null
          died_at?: string | null
          goal_mode?: string | null
          growth_percentage?: number | null
          habit_description?: string | null
          id?: string
          last_watered_at?: string | null
          longest_streak?: number | null
          matured_at?: string | null
          name: string
          plant_type_id: string
          position?: number | null
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          started_at?: string | null
          status?: string | null
          total_waterings?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          adaptive_mode?: string | null
          created_at?: string | null
          current_moisture?: number | null
          current_streak?: number | null
          death_reason?: string | null
          died_at?: string | null
          goal_mode?: string | null
          growth_percentage?: number | null
          habit_description?: string | null
          id?: string
          last_watered_at?: string | null
          longest_streak?: number | null
          matured_at?: string | null
          name?: string
          plant_type_id?: string
          position?: number | null
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          started_at?: string | null
          status?: string | null
          total_waterings?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plants_plant_type_id_fkey"
            columns: ["plant_type_id"]
            isOneToOne: false
            referencedRelation: "plant_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          level: number | null
          timezone: string | null
          updated_at: string | null
          username: string | null
          water_reserves: number | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          level?: number | null
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
          water_reserves?: number | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          level?: number | null
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
          water_reserves?: number | null
          xp?: number | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      watering_logs: {
        Row: {
          created_at: string | null
          difficulty: string | null
          id: string
          morning_bonus: boolean | null
          notes: string | null
          plant_id: string
          streak_bonus: number | null
          user_id: string
          watered_at: string | null
          watered_date: string | null
          xp_earned: number | null
        }
        Insert: {
          created_at?: string | null
          difficulty?: string | null
          id?: string
          morning_bonus?: boolean | null
          notes?: string | null
          plant_id: string
          streak_bonus?: number | null
          user_id: string
          watered_at?: string | null
          watered_date?: string | null
          xp_earned?: number | null
        }
        Update: {
          created_at?: string | null
          difficulty?: string | null
          id?: string
          morning_bonus?: boolean | null
          notes?: string | null
          plant_id?: string
          streak_bonus?: number | null
          user_id?: string
          watered_at?: string | null
          watered_date?: string | null
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "watering_logs_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watering_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_growth: { Args: { plant_id: string }; Returns: number }
      get_dashboard_bootstrap: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_garden_snapshot: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      habit_level_from_xp: { Args: { p_xp: number }; Returns: number }
      habit_weather_for_date: { Args: { p_date: string }; Returns: Json }
      record_activity_atomic: {
        Args: {
          p_mutation_id: string
          p_plant_id: string
          p_activity_type: string
          p_value?: number | null
          p_notes?: string | null
          p_is_welcome_back?: boolean
        }
        Returns: Json
      }
      create_notification: {
        Args: {
          p_user_id: string
          p_type: string
          p_title: string
          p_title_vi: string
          p_message: string
          p_message_vi: string
          p_data?: Json
        }
        Returns: string
      }
      generate_daily_weather: { Args: Record<PropertyKey, never>; Returns: undefined }
      get_plant_health: { Args: { p_moisture: number }; Returns: string }
      get_unread_notification_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      mark_notifications_read: {
        Args: { p_notification_ids: string[] }
        Returns: number
      }
      revive_plant: {
        Args: { p_plant_id: string; p_user_id: string }
        Returns: Json
      }
      trigger_moisture_decay: { Args: Record<PropertyKey, never>; Returns: Json }
      update_daily_moisture: { Args: Record<PropertyKey, never>; Returns: undefined }
      water_plant: {
        Args: {
          p_plant_id: string
          p_user_id: string
          p_difficulty?: string
          p_notes?: string
        }
        Returns: Json
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

// Custom types for the app
export type Notification = Tables<'notifications'>
export type Plant = Tables<'plants'>
export type PlantType = Tables<'plant_types'>
export type Profile = Tables<'profiles'>
export type WateringLog = Tables<'watering_logs'>
export type Achievement = Tables<'achievements'>
export type UserAchievement = Tables<'user_achievements'>
export type Goal = Tables<'goals'>
export type GoalLog = Tables<'goal_logs'>
export type GoalAdjustment = Tables<'goal_adjustments'>
export type DailyWeather = Tables<'daily_weather'>

// Plant health status type
export type PlantHealthStatus = 'dead' | 'critical' | 'wilting' | 'thirsty' | 'healthy' | 'thriving'

// Notification types
export type NotificationType = 'plant_critical' | 'plant_died' | 'plant_matured' | 'achievement' | 'streak' | 'reminder'
