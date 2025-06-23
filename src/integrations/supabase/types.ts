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
      chatbot_messages: {
        Row: {
          admin_reply_count: number
          closed_at: string | null
          email: string | null
          id: string
          last_admin_reply_at: string | null
          messages: Json
          status: string
          submitted_at: string | null
          support_ticket_code: string | null
          ticket_status: string | null
        }
        Insert: {
          admin_reply_count?: number
          closed_at?: string | null
          email?: string | null
          id?: string
          last_admin_reply_at?: string | null
          messages: Json
          status?: string
          submitted_at?: string | null
          support_ticket_code?: string | null
          ticket_status?: string | null
        }
        Update: {
          admin_reply_count?: number
          closed_at?: string | null
          email?: string | null
          id?: string
          last_admin_reply_at?: string | null
          messages?: Json
          status?: string
          submitted_at?: string | null
          support_ticket_code?: string | null
          ticket_status?: string | null
        }
        Relationships: []
      }
      chatbot_replies: {
        Row: {
          body: string | null
          chatbot_message_id: string
          created_at: string
          email: string
          file_url: string | null
          id: string
          subject: string
        }
        Insert: {
          body?: string | null
          chatbot_message_id: string
          created_at?: string
          email: string
          file_url?: string | null
          id?: string
          subject: string
        }
        Update: {
          body?: string | null
          chatbot_message_id?: string
          created_at?: string
          email?: string
          file_url?: string | null
          id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_replies_chatbot_message_id_fkey"
            columns: ["chatbot_message_id"]
            isOneToOne: false
            referencedRelation: "chatbot_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string
          description: string | null
          file_url: string
          id: string
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          file_url: string
          id?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          file_url?: string
          id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          created_at: string | null
          document_id: string | null
          email: string
          expires_at: string | null
          id: string
          link_token: string | null
          paypal_transaction_id: string | null
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          document_id?: string | null
          email: string
          expires_at?: string | null
          id?: string
          link_token?: string | null
          paypal_transaction_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          document_id?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          link_token?: string | null
          paypal_transaction_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      support_replies: {
        Row: {
          chatbot_message_id: string
          created_at: string
          file_url: string | null
          id: string
          message: string
          sender: string
        }
        Insert: {
          chatbot_message_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          message: string
          sender: string
        }
        Update: {
          chatbot_message_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          message?: string
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_replies_chatbot_message_id_fkey"
            columns: ["chatbot_message_id"]
            isOneToOne: false
            referencedRelation: "chatbot_messages"
            referencedColumns: ["id"]
          },
        ]
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
      increment_document_views: {
        Args: Record<PropertyKey, never> | { document_id: string }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never> | { _user_id: string }
        Returns: boolean
      }
      log_security_event: {
        Args: { event_type: string; user_id?: string; details?: Json }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
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
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
