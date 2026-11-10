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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      account_invitations: {
        Row: {
          created_at: string
          email: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          email: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          email?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      activation_codes: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          email: string
          expires_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          email: string
          expires_at: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          email?: string
          expires_at?: string
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean
          published_at: string | null
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          summary?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_info: {
        Row: {
          content: string
          key: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          key: string
          title?: string
          updated_at?: string
        }
        Update: {
          content?: string
          key?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_notifications: {
        Row: {
          attempts: number
          body: string
          created_at: string
          event_type: string
          feedback_id: string | null
          id: string
          last_error: string | null
          recipient_email: string
          recipient_role: string
          sent_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          body: string
          created_at?: string
          event_type: string
          feedback_id?: string | null
          id?: string
          last_error?: string | null
          recipient_email: string
          recipient_role: string
          sent_at?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          body?: string
          created_at?: string
          event_type?: string
          feedback_id?: string | null
          id?: string
          last_error?: string | null
          recipient_email?: string
          recipient_role?: string
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_notifications_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string
          foto_url: string | null
          id: string
          is_read: boolean
          isi_pesan: string
          jenis_feedback: string
          judul: string
          kategori: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          foto_url?: string | null
          id?: string
          is_read?: boolean
          isi_pesan: string
          jenis_feedback: string
          judul: string
          kategori: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          foto_url?: string | null
          id?: string
          is_read?: boolean
          isi_pesan?: string
          jenis_feedback?: string
          judul?: string
          kategori?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_internal_notes: {
        Row: {
          author_id: string
          author_name: string
          created_at: string
          feedback_id: string
          id: string
          note: string
        }
        Insert: {
          author_id: string
          author_name?: string
          created_at?: string
          feedback_id: string
          id?: string
          note: string
        }
        Update: {
          author_id?: string
          author_name?: string
          created_at?: string
          feedback_id?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_internal_notes_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_replies: {
        Row: {
          admin_id: string
          created_at: string
          feedback_id: string
          id: string
          isi_tanggapan: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          feedback_id: string
          id?: string
          isi_tanggapan: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          feedback_id?: string
          id?: string
          isi_tanggapan?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_replies_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          activity_status: string | null
          address: string
          created_at: string
          description: string | null
          id: string
          is_verified: boolean
          latitude: number | null
          longitude: number | null
          name: string
          schedule_date: string | null
          schedule_time: string | null
          schedule_title: string | null
        }
        Insert: {
          activity_status?: string | null
          address?: string
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          schedule_date?: string | null
          schedule_time?: string | null
          schedule_title?: string | null
        }
        Update: {
          activity_status?: string | null
          address?: string
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          schedule_date?: string | null
          schedule_time?: string | null
          schedule_title?: string | null
        }
        Relationships: []
      }
      processes: {
        Row: {
          created_at: string
          description: string
          id: string
          step_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          step_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          step_order?: number
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          kelurahan: string | null
          rt_rw: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          is_active?: boolean
          kelurahan?: string | null
          rt_rw?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          kelurahan?: string | null
          rt_rw?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      schedules: {
        Row: {
          area: string
          created_at: string
          day_of_week: number
          end_time: string | null
          id: string
          notes: string | null
          schedule_date: string | null
          start_time: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          area?: string
          created_at?: string
          day_of_week: number
          end_time?: string | null
          id?: string
          notes?: string | null
          schedule_date?: string | null
          start_time: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          area?: string
          created_at?: string
          day_of_week?: number
          end_time?: string | null
          id?: string
          notes?: string | null
          schedule_date?: string | null
          start_time?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      sorting_guides: {
        Row: {
          detail: string
          key: string
          name: string
          position: number
          short: string
          updated_at: string
        }
        Insert: {
          detail?: string
          key: string
          name: string
          position?: number
          short?: string
          updated_at?: string
        }
        Update: {
          detail?: string
          key?: string
          name?: string
          position?: number
          short?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      assign_created_account_role: {
        Args: {
          assigned_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: undefined
      }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      set_user_role: {
        Args: {
          assigned_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "petugas" | "masyarakat"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "petugas", "masyarakat"],
    },
  },
} as const
