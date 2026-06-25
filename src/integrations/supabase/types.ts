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
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["approval_status"]
          updated_at: string
          mobile_no: string | null
          roll_number: string | null
          department: string | null
          year: string | null
          semester: string | null
          linkedin_url: string | null
          career_goal: string | null
          profile_picture_url: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
          mobile_no?: string | null
          roll_number?: string | null
          department?: string | null
          year?: string | null
          semester?: string | null
          linkedin_url?: string | null
          career_goal?: string | null
          profile_picture_url?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
          mobile_no?: string | null
          roll_number?: string | null
          department?: string | null
          year?: string | null
          semester?: string | null
          linkedin_url?: string | null
          career_goal?: string | null
          profile_picture_url?: string | null
        }
        Relationships: []
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
      assignments: {
        Row: {
          id: string
          title: string
          description: string | null
          format: string
          content: string
          deadline: string
          created_at: string
          updated_at: string
          subject_id: string | null
          assigned_date: string | null
          max_coins: number | null
          daily_reduction: number | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          format: string
          content: string
          deadline: string
          created_at?: string
          updated_at?: string
          subject_id?: string | null
          assigned_date?: string | null
          max_coins?: number | null
          daily_reduction?: number | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          format?: string
          content?: string
          deadline?: string
          created_at?: string
          updated_at?: string
          subject_id?: string | null
          assigned_date?: string | null
          max_coins?: number | null
          daily_reduction?: number | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          id: string
          assignment_id: string
          student_id: string
          format: string
          content: string
          submitted_at: string
          status: Database["public"]["Enums"]["submission_status"]
          reviewed_by: string | null
          reviewed_at: string | null
          review_comments: string | null
          approval_points: number | null
          approval_coins: number | null
          resubmission_count: number
        }
        Insert: {
          id?: string
          assignment_id: string
          student_id: string
          format: string
          content: string
          submitted_at?: string
          status?: Database["public"]["Enums"]["submission_status"]
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_comments?: string | null
          approval_points?: number | null
          approval_coins?: number | null
          resubmission_count?: number
        }
        Update: {
          id?: string
          assignment_id?: string
          student_id?: string
          format?: string
          content?: string
          submitted_at?: string
          status?: Database["public"]["Enums"]["submission_status"]
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_comments?: string | null
          approval_points?: number | null
          approval_coins?: number | null
          resubmission_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          id: string
          name: string
          code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          created_at?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          id: string
          user_id: string
          total_points: number
          current_level: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_points?: number
          current_level?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_points?: number
          current_level?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_coins: {
        Row: {
          id: string
          user_id: string
          total_coins: number
          coin_level: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_coins?: number
          coin_level?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_coins?: number
          coin_level?: number
          updated_at?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          id: string
          title: string
          description: string
          icon: string
          points_reward: number
          coins_reward: number
        }
        Insert: {
          id?: string
          title: string
          description: string
          icon?: string
          points_reward?: number
          coins_reward?: number
        }
        Update: {
          id?: string
          title?: string
          description?: string
          icon?: string
          points_reward?: number
          coins_reward?: number
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          earned_at?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          reference_type: string | null
          reference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          reference_type?: string | null
          reference_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          reference_type?: string | null
          reference_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard: {
        Row: {
          user_id: string
          name: string | null
          total_points: number
          rank: number
        }
        Insert: never
        Update: never
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "student"
      approval_status: "pending" | "approved" | "rejected"
      submission_status:
      | "submitted"
      | "under_review"
      | "approved"
      | "rejected"
      | "resubmitted"
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
      app_role: ["admin", "student"],
      approval_status: ["pending", "approved", "rejected"],
      submission_status: [
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "resubmitted"
      ],
    },
  },
} as const
