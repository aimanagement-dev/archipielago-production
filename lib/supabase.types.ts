// Auto-generated types for Supabase schema
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
      chat_rooms: {
        Row: {
          id: string
          name: string
          description: string | null
          type: string
          area: string | null
          created_by: string
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          type?: string
          area?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          type?: string
          area?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      messages: {
        Row: {
          id: string
          chat_room_id: string
          sender_email: string
          sender_name: string
          content: string
          mentions: string[] | null
          attachments: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
          is_edited: boolean
        }
        Insert: {
          id?: string
          chat_room_id: string
          sender_email: string
          sender_name: string
          content: string
          mentions?: string[] | null
          attachments?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          is_edited?: boolean
        }
        Update: {
          id?: string
          chat_room_id?: string
          sender_email?: string
          sender_name?: string
          content?: string
          mentions?: string[] | null
          attachments?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          is_edited?: boolean
        }
      }
      notifications: {
        Row: {
          id: string
          user_email: string
          type: string
          title: string
          message: string
          action_url: string | null
          related_id: string | null
          is_read: boolean
          created_at: string
          read_at: string | null
        }
        Insert: {
          id?: string
          user_email: string
          type: string
          title: string
          message: string
          action_url?: string | null
          related_id?: string | null
          is_read?: boolean
          created_at?: string
          read_at?: string | null
        }
        Update: {
          id?: string
          user_email?: string
          type?: string
          title?: string
          message?: string
          action_url?: string | null
          related_id?: string | null
          is_read?: boolean
          created_at?: string
          read_at?: string | null
        }
      }
      file_attachments: {
        Row: {
          id: string
          drive_file_id: string
          name: string
          mime_type: string
          size_bytes: number | null
          drive_url: string
          thumbnail_url: string | null
          uploaded_by: string
          uploaded_at: string
          related_type: string
          related_id: string
          is_deleted: boolean
        }
        Insert: {
          id?: string
          drive_file_id: string
          name: string
          mime_type: string
          size_bytes?: number | null
          drive_url: string
          thumbnail_url?: string | null
          uploaded_by: string
          uploaded_at?: string
          related_type: string
          related_id: string
          is_deleted?: boolean
        }
        Update: {
          id?: string
          drive_file_id?: string
          name?: string
          mime_type?: string
          size_bytes?: number | null
          drive_url?: string
          thumbnail_url?: string | null
          uploaded_by?: string
          uploaded_at?: string
          related_type?: string
          related_id?: string
          is_deleted?: boolean
        }
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
  }
}
