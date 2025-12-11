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
      agencies: {
        Row: {
          address: string | null
          branding_email: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          primary_color: string | null
          seat_limit: number
          secondary_color: string | null
          subscription_tier: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          branding_email?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          primary_color?: string | null
          seat_limit?: number
          secondary_color?: string | null
          subscription_tier?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          branding_email?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          primary_color?: string | null
          seat_limit?: number
          secondary_color?: string | null
          subscription_tier?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      agency_audit_logs: {
        Row: {
          action: string
          agency_id: string
          conversation_id: string | null
          id: string
          logged_at: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          agency_id: string
          conversation_id?: string | null
          id?: string
          logged_at?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          agency_id?: string
          conversation_id?: string | null
          id?: string
          logged_at?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_buddy_audit_logs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_buddy_audit_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_buddy_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_buddy_audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_permissions: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          permission: Database["public"]["Enums"]["agency_permission"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission: Database["public"]["Enums"]["agency_permission"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["agency_permission"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_buddy_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_buddy_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_buddy_conversation_documents: {
        Row: {
          attached_at: string
          conversation_id: string
          document_id: string
        }
        Insert: {
          attached_at?: string
          conversation_id: string
          document_id: string
        }
        Update: {
          attached_at?: string
          conversation_id?: string
          document_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_buddy_conversation_documents_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_buddy_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_buddy_conversation_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_buddy_conversations: {
        Row: {
          agency_id: string
          created_at: string
          deleted_at: string | null
          id: string
          project_id: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          project_id?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          project_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_buddy_conversations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_buddy_conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ai_buddy_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_buddy_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_buddy_guardrails: {
        Row: {
          agency_id: string
          ai_disclosure_enabled: boolean | null
          ai_disclosure_message: string | null
          custom_rules: Json | null
          eando_disclaimer: boolean | null
          restricted_topics: Json | null
          restricted_topics_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          agency_id: string
          ai_disclosure_enabled?: boolean | null
          ai_disclosure_message?: string | null
          custom_rules?: Json | null
          eando_disclaimer?: boolean | null
          restricted_topics?: Json | null
          restricted_topics_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          agency_id?: string
          ai_disclosure_enabled?: boolean | null
          ai_disclosure_message?: string | null
          custom_rules?: Json | null
          eando_disclaimer?: boolean | null
          restricted_topics?: Json | null
          restricted_topics_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_buddy_guardrails_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: true
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_buddy_messages: {
        Row: {
          agency_id: string
          confidence:
            | Database["public"]["Enums"]["ai_buddy_confidence_level"]
            | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["ai_buddy_message_role"]
          sources: Json | null
        }
        Insert: {
          agency_id: string
          confidence?:
            | Database["public"]["Enums"]["ai_buddy_confidence_level"]
            | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["ai_buddy_message_role"]
          sources?: Json | null
        }
        Update: {
          agency_id?: string
          confidence?:
            | Database["public"]["Enums"]["ai_buddy_confidence_level"]
            | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["ai_buddy_message_role"]
          sources?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_buddy_messages_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_buddy_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_buddy_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_buddy_project_documents: {
        Row: {
          attached_at: string
          document_id: string
          project_id: string
        }
        Insert: {
          attached_at?: string
          document_id: string
          project_id: string
        }
        Update: {
          attached_at?: string
          document_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_buddy_project_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_buddy_project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ai_buddy_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_buddy_projects: {
        Row: {
          agency_id: string
          archived_at: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_id: string
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_id?: string
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_buddy_projects_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_buddy_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_buddy_rate_limits: {
        Row: {
          messages_per_day: number
          messages_per_minute: number
          tier: string
        }
        Insert: {
          messages_per_day: number
          messages_per_minute: number
          tier: string
        }
        Update: {
          messages_per_day?: number
          messages_per_minute?: number
          tier?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          agency_id: string
          confidence: string | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          sources: Json | null
        }
        Insert: {
          agency_id: string
          confidence?: string | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          sources?: Json | null
        }
        Update: {
          agency_id?: string
          confidence?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          sources?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_data_sources: {
        Row: {
          agency_id: string
          carrier_name: string | null
          column_count: number | null
          column_mappings: Json
          created_at: string
          error_message: string | null
          expires_at: string | null
          file_type: string
          filename: string
          id: string
          parsed_at: string | null
          parsed_data: Json | null
          row_count: number | null
          statement_period_end: string | null
          statement_period_start: string | null
          status: string
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_id: string
          carrier_name?: string | null
          column_count?: number | null
          column_mappings?: Json
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          file_type: string
          filename: string
          id?: string
          parsed_at?: string | null
          parsed_data?: Json | null
          row_count?: number | null
          statement_period_end?: string | null
          statement_period_start?: string | null
          status?: string
          storage_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_id?: string
          carrier_name?: string | null
          column_count?: number | null
          column_mappings?: Json
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          file_type?: string
          filename?: string
          id?: string
          parsed_at?: string | null
          parsed_data?: Json | null
          row_count?: number | null
          statement_period_end?: string | null
          statement_period_start?: string | null
          status?: string
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_data_sources_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_data_sources_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comparisons: {
        Row: {
          agency_id: string
          comparison_data: Json
          created_at: string | null
          document_ids: string[]
          id: string
          user_id: string
        }
        Insert: {
          agency_id: string
          comparison_data?: Json
          created_at?: string | null
          document_ids: string[]
          id?: string
          user_id: string
        }
        Update: {
          agency_id?: string
          comparison_data?: Json
          created_at?: string | null
          document_ids?: string[]
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comparisons_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparisons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          agency_id: string
          created_at: string
          document_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          document_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          document_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          agency_id: string
          bounding_box: Json | null
          chunk_index: number
          chunk_type: string | null
          content: string
          created_at: string
          document_id: string
          embedding: string | null
          embedding_version: number | null
          id: string
          page_number: number
          summary: string | null
        }
        Insert: {
          agency_id: string
          bounding_box?: Json | null
          chunk_index: number
          chunk_type?: string | null
          content: string
          created_at?: string
          document_id: string
          embedding?: string | null
          embedding_version?: number | null
          id?: string
          page_number: number
          summary?: string | null
        }
        Update: {
          agency_id?: string
          bounding_box?: Json | null
          chunk_index?: number
          chunk_type?: string | null
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          embedding_version?: number | null
          id?: string
          page_number?: number
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_labels: {
        Row: {
          created_at: string
          document_id: string
          label_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          label_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          label_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_labels_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_labels_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          agency_id: string
          ai_summary: string | null
          ai_tags: string[] | null
          created_at: string
          display_name: string | null
          document_type: string | null
          extraction_data: Json | null
          extraction_error: string | null
          extraction_status: string | null
          extraction_version: number | null
          filename: string
          id: string
          metadata: Json | null
          page_count: number | null
          raw_text: string | null
          status: string
          storage_path: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          agency_id: string
          ai_summary?: string | null
          ai_tags?: string[] | null
          created_at?: string
          display_name?: string | null
          document_type?: string | null
          extraction_data?: Json | null
          extraction_error?: string | null
          extraction_status?: string | null
          extraction_version?: number | null
          filename: string
          id?: string
          metadata?: Json | null
          page_count?: number | null
          raw_text?: string | null
          status?: string
          storage_path: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          agency_id?: string
          ai_summary?: string | null
          ai_tags?: string[] | null
          created_at?: string
          display_name?: string | null
          document_type?: string | null
          extraction_data?: Json | null
          extraction_error?: string | null
          extraction_status?: string | null
          extraction_version?: number | null
          filename?: string
          id?: string
          metadata?: Json | null
          page_count?: number | null
          raw_text?: string | null
          status?: string
          storage_path?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          agency_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          agency_id: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          role?: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          agency_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      labels: {
        Row: {
          agency_id: string
          color: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          agency_id: string
          color?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          agency_id?: string
          color?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "labels_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_jobs: {
        Row: {
          agency_id: string | null
          completed_at: string | null
          created_at: string
          document_id: string
          error_category: string | null
          error_code: string | null
          error_message: string | null
          error_type: string | null
          id: string
          progress_data: Json | null
          progress_percent: number | null
          retry_count: number | null
          stage: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          agency_id?: string | null
          completed_at?: string | null
          created_at?: string
          document_id: string
          error_category?: string | null
          error_code?: string | null
          error_message?: string | null
          error_type?: string | null
          id?: string
          progress_data?: Json | null
          progress_percent?: number | null
          retry_count?: number | null
          stage?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          agency_id?: string | null
          completed_at?: string | null
          created_at?: string
          document_id?: string
          error_category?: string | null
          error_code?: string | null
          error_message?: string | null
          error_type?: string | null
          id?: string
          progress_data?: Json | null
          progress_percent?: number | null
          retry_count?: number | null
          stage?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "processing_jobs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processing_jobs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_extractions: {
        Row: {
          agency_id: string
          created_at: string | null
          document_id: string
          extracted_data: Json
          extraction_version: number | null
          id: string
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          created_at?: string | null
          document_id: string
          extracted_data?: Json
          extraction_version?: number | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          created_at?: string | null
          document_id?: string
          extracted_data?: Json
          extraction_version?: number | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_extractions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_results: {
        Row: {
          agency_id: string
          carrier_code: string
          carrier_name: string
          coverages: Json
          created_at: string
          deductible_auto: number | null
          deductible_home: number | null
          document_storage_path: string | null
          id: string
          premium_annual: number | null
          premium_monthly: number | null
          session_id: string
          status: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          carrier_code: string
          carrier_name: string
          coverages?: Json
          created_at?: string
          deductible_auto?: number | null
          deductible_home?: number | null
          document_storage_path?: string | null
          id?: string
          premium_annual?: number | null
          premium_monthly?: number | null
          session_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          carrier_code?: string
          carrier_name?: string
          coverages?: Json
          created_at?: string
          deductible_auto?: number | null
          deductible_home?: number | null
          document_storage_path?: string | null
          id?: string
          premium_annual?: number | null
          premium_monthly?: number | null
          session_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_results_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quote_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_sessions: {
        Row: {
          agency_id: string
          client_data: Json
          created_at: string
          id: string
          prospect_name: string
          quote_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_id: string
          client_data?: Json
          created_at?: string
          id?: string
          prospect_name: string
          quote_type?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_id?: string
          client_data?: Json
          created_at?: string
          id?: string
          prospect_name?: string
          quote_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_sessions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          entity_id: string
          entity_type: string
          id: string
          request_count: number | null
          window_start: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          entity_id: string
          entity_type: string
          id?: string
          request_count?: number | null
          window_start: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          entity_id?: string
          entity_type?: string
          id?: string
          request_count?: number | null
          window_start?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          agency_id: string
          ai_buddy_preferences: Json | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          last_active_at: string | null
          removed_at: string | null
          role: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          ai_buddy_preferences?: Json | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          last_active_at?: string | null
          removed_at?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          ai_buddy_preferences?: Json | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          last_active_at?: string | null
          removed_at?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      ai_buddy_usage_by_user: {
        Row: {
          agency_id: string | null
          conversations: number | null
          date: string | null
          documents: number | null
          last_active_at: string | null
          messages: number | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_buddy_conversations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_buddy_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_buddy_usage_daily: {
        Row: {
          active_users: number | null
          agency_id: string | null
          conversations: number | null
          date: string | null
          documents_uploaded: number | null
          total_messages: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_buddy_conversations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_next_pending_job: {
        Args: { p_agency_id: string }
        Returns: {
          agency_id: string | null
          completed_at: string | null
          created_at: string
          document_id: string
          error_category: string | null
          error_code: string | null
          error_message: string | null
          error_type: string | null
          id: string
          progress_data: Json | null
          progress_percent: number | null
          retry_count: number | null
          stage: string | null
          started_at: string | null
          status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "processing_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_queue_position: { Args: { p_document_id: string }; Returns: number }
      get_user_agency_id: { Args: never; Returns: string }
      has_active_processing_job: {
        Args: { p_agency_id: string }
        Returns: boolean
      }
      increment_rate_limit: {
        Args: {
          p_endpoint: string
          p_entity_id: string
          p_entity_type: string
          p_window_start: string
        }
        Returns: {
          is_new: boolean
          request_count: number
        }[]
      }
      mark_stale_jobs_failed: { Args: never; Returns: number }
      match_document_chunks: {
        Args: {
          match_count?: number
          match_document_id: string
          query_embedding: string
        }
        Returns: {
          bounding_box: Json
          content: string
          id: string
          page_number: number
          similarity: number
        }[]
      }
      process_next_document_job: { Args: never; Returns: undefined }
      refresh_ai_buddy_usage_daily: { Args: never; Returns: undefined }
      reset_stuck_processing_jobs: { Args: never; Returns: undefined }
      search_conversations: {
        Args: { p_limit?: number; p_query: string; p_user_id: string }
        Returns: {
          conversation_id: string
          conversation_title: string
          created_at: string
          highlighted_text: string
          matched_text: string
          message_id: string
          project_id: string
          project_name: string
        }[]
      }
      transfer_ownership: {
        Args: {
          p_agency_id: string
          p_current_owner_id: string
          p_new_owner_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      agency_permission:
        | "use_ai_buddy"
        | "manage_own_projects"
        | "manage_users"
        | "configure_guardrails"
        | "view_audit_logs"
        | "view_usage_analytics"
        | "manage_billing"
        | "transfer_ownership"
        | "delete_agency"
      ai_buddy_confidence_level: "high" | "medium" | "low"
      ai_buddy_message_role: "user" | "assistant" | "system"
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
      agency_permission: [
        "use_ai_buddy",
        "manage_own_projects",
        "manage_users",
        "configure_guardrails",
        "view_audit_logs",
        "view_usage_analytics",
        "manage_billing",
        "transfer_ownership",
        "delete_agency",
      ],
      ai_buddy_confidence_level: ["high", "medium", "low"],
      ai_buddy_message_role: ["user", "assistant", "system"],
    },
  },
} as const
