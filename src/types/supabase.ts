export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      subscriptions: {
        Row: {
          id: string
          user_id: string
          status: string
          created_at: string
          updated_at: string | null
          plan_id: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: string
          created_at?: string
          updated_at?: string | null
          plan_id: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: string
          created_at?: string
          updated_at?: string | null
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      whatsapp_links: {
        Row: {
          id: string
          user_id: string
          phone_number: string
          verification_code: string | null
          is_verified: boolean
          created_at: string
          updated_at: string | null
          verified_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          phone_number: string
          verification_code?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string | null
          verified_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          phone_number?: string
          verification_code?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_links_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          name: string | null
          email: string | null
          avatar_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_access: {
        Args: { user_uuid: string }
        Returns: boolean
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
