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
      admin_role_assignments: {
        Row: {
          admin_id: string
          assigned_at: string
          assigned_by_admin_id: string | null
          role_id: string
        }
        Insert: {
          admin_id: string
          assigned_at?: string
          assigned_by_admin_id?: string | null
          role_id: string
        }
        Update: {
          admin_id?: string
          assigned_at?: string
          assigned_by_admin_id?: string | null
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ara_admin_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ara_assigned_by_fkey"
            columns: ["assigned_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ara_role_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "backoffice_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          active: boolean
          auth_user_id: string | null
          full_name: string
          id: string
          login_attempts: number
          role: Database["public"]["Enums"]["admin_role"]
          secret_code_hash: string | null
          whatsapp_number: string | null
        }
        Insert: {
          active?: boolean
          auth_user_id?: string | null
          full_name: string
          id?: string
          login_attempts?: number
          role: Database["public"]["Enums"]["admin_role"]
          secret_code_hash?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          active?: boolean
          auth_user_id?: string | null
          full_name?: string
          id?: string
          login_attempts?: number
          role?: Database["public"]["Enums"]["admin_role"]
          secret_code_hash?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      audit_records: {
        Row: {
          admin_id: string | null
          id: string
          partner_id: string | null
          proof_url: string | null
          recorded_at: string
          transaction_id: string
        }
        Insert: {
          admin_id?: string | null
          id?: string
          partner_id?: string | null
          proof_url?: string | null
          recorded_at?: string
          transaction_id: string
        }
        Update: {
          admin_id?: string | null
          id?: string
          partner_id?: string | null
          proof_url?: string | null
          recorded_at?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_records_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_records_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_records_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_records_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "v_transaction_operations"
            referencedColumns: ["id"]
          },
        ]
      }
      backoffice_permissions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          label: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          label: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          label?: string
        }
        Relationships: []
      }
      backoffice_role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brp_permission_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "backoffice_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brp_role_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "backoffice_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      backoffice_roles: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          id: string
          label: string
          scope: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          id?: string
          label: string
          scope: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          scope?: string
        }
        Relationships: []
      }
      bank_settlement_proofs: {
        Row: {
          description: string | null
          file_url: string
          id: string
          settlement_id: string
          uploaded_at: string
          uploaded_by_admin_id: string | null
          uploaded_by_partner_id: string | null
        }
        Insert: {
          description?: string | null
          file_url: string
          id?: string
          settlement_id: string
          uploaded_at?: string
          uploaded_by_admin_id?: string | null
          uploaded_by_partner_id?: string | null
        }
        Update: {
          description?: string | null
          file_url?: string
          id?: string
          settlement_id?: string
          uploaded_at?: string
          uploaded_by_admin_id?: string | null
          uploaded_by_partner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bsp_admin_fkey"
            columns: ["uploaded_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bsp_partner_fkey"
            columns: ["uploaded_by_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bsp_settlement_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "bank_settlements"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_settlements: {
        Row: {
          admin_id: string | null
          amount: number
          batch_id: string | null
          completed_at: string | null
          currency: string
          destination_account_name: string | null
          destination_account_reference: string | null
          executed_at: string | null
          external_reference: string | null
          failure_reason: string | null
          id: string
          initiated_at: string
          metadata: Json | null
          notes: string | null
          partner_id: string | null
          settlement_type: string
          source_account_name: string | null
          source_account_reference: string | null
          status: string
          transaction_id: string | null
        }
        Insert: {
          admin_id?: string | null
          amount: number
          batch_id?: string | null
          completed_at?: string | null
          currency?: string
          destination_account_name?: string | null
          destination_account_reference?: string | null
          executed_at?: string | null
          external_reference?: string | null
          failure_reason?: string | null
          id?: string
          initiated_at?: string
          metadata?: Json | null
          notes?: string | null
          partner_id?: string | null
          settlement_type: string
          source_account_name?: string | null
          source_account_reference?: string | null
          status?: string
          transaction_id?: string | null
        }
        Update: {
          admin_id?: string | null
          amount?: number
          batch_id?: string | null
          completed_at?: string | null
          currency?: string
          destination_account_name?: string | null
          destination_account_reference?: string | null
          executed_at?: string | null
          external_reference?: string | null
          failure_reason?: string | null
          id?: string
          initiated_at?: string
          metadata?: Json | null
          notes?: string | null
          partner_id?: string | null
          settlement_type?: string
          source_account_name?: string | null
          source_account_reference?: string | null
          status?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bs_admin_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bs_batch_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "daily_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bs_partner_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bs_transaction_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bs_transaction_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "v_transaction_operations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_batches: {
        Row: {
          bank_proof_url: string | null
          batch_date: string
          id: string
          notified_at: string | null
          partner_id: string | null
          processed_at: string | null
          processed_by: string | null
          scheduled_at: string | null
          status: string
          transfer_reference: string | null
        }
        Insert: {
          bank_proof_url?: string | null
          batch_date: string
          id?: string
          notified_at?: string | null
          partner_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          scheduled_at?: string | null
          status?: string
          transfer_reference?: string | null
        }
        Update: {
          bank_proof_url?: string | null
          batch_date?: string
          id?: string
          notified_at?: string | null
          partner_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          scheduled_at?: string | null
          status?: string
          transfer_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_batches_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_batches_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      kd_action_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          id: string
          kma_id: string | null
          new_value: Json | null
          old_value: Json | null
          partner_id: string | null
          resource_id: string | null
          resource_type: string
          user_id: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          id?: string
          kma_id?: string | null
          new_value?: Json | null
          old_value?: Json | null
          partner_id?: string | null
          resource_id?: string | null
          resource_type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          id?: string
          kma_id?: string | null
          new_value?: Json | null
          old_value?: Json | null
          partner_id?: string | null
          resource_id?: string | null
          resource_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kd_action_logs_admin_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_action_logs_kma_fkey"
            columns: ["kma_id"]
            isOneToOne: false
            referencedRelation: "kmerdiaspora_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_action_logs_partner_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_action_logs_user_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kd_driver_matches: {
        Row: {
          contact_revealed_at: string | null
          created_automatically: boolean
          created_by_admin_id: string | null
          created_by_kma_id: string | null
          created_by_partner_id: string | null
          driver_notified_at: string | null
          driver_request_id: string
          id: string
          job_request_id: string
          match_score: number | null
          matched_at: string
          recruiter_notified_at: string | null
          status: string
        }
        Insert: {
          contact_revealed_at?: string | null
          created_automatically?: boolean
          created_by_admin_id?: string | null
          created_by_kma_id?: string | null
          created_by_partner_id?: string | null
          driver_notified_at?: string | null
          driver_request_id: string
          id?: string
          job_request_id: string
          match_score?: number | null
          matched_at?: string
          recruiter_notified_at?: string | null
          status?: string
        }
        Update: {
          contact_revealed_at?: string | null
          created_automatically?: boolean
          created_by_admin_id?: string | null
          created_by_kma_id?: string | null
          created_by_partner_id?: string | null
          driver_notified_at?: string | null
          driver_request_id?: string
          id?: string
          job_request_id?: string
          match_score?: number | null
          matched_at?: string
          recruiter_notified_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "kd_dm_admin_fkey"
            columns: ["created_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_dm_driver_request_fkey"
            columns: ["driver_request_id"]
            isOneToOne: false
            referencedRelation: "kd_driver_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_dm_job_request_fkey"
            columns: ["job_request_id"]
            isOneToOne: false
            referencedRelation: "kd_job_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_dm_kma_fkey"
            columns: ["created_by_kma_id"]
            isOneToOne: false
            referencedRelation: "kmerdiaspora_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_dm_partner_fkey"
            columns: ["created_by_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      kd_driver_requests: {
        Row: {
          city: string | null
          contact_phone: string
          country: string
          created_at: string
          description: string | null
          drivers_needed: number
          id: string
          latitude: number | null
          longitude: number | null
          managed_by_admin_id: string | null
          managed_by_kma_id: string | null
          managed_by_partner_id: string | null
          neighborhood: string | null
          requester_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          contact_phone: string
          country: string
          created_at?: string
          description?: string | null
          drivers_needed: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          managed_by_admin_id?: string | null
          managed_by_kma_id?: string | null
          managed_by_partner_id?: string | null
          neighborhood?: string | null
          requester_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          contact_phone?: string
          country?: string
          created_at?: string
          description?: string | null
          drivers_needed?: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          managed_by_admin_id?: string | null
          managed_by_kma_id?: string | null
          managed_by_partner_id?: string | null
          neighborhood?: string | null
          requester_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kd_driver_requests_admin_fkey"
            columns: ["managed_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_driver_requests_kma_fkey"
            columns: ["managed_by_kma_id"]
            isOneToOne: false
            referencedRelation: "kmerdiaspora_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_driver_requests_partner_fkey"
            columns: ["managed_by_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_driver_requests_user_fkey"
            columns: ["requester_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kd_job_requests: {
        Row: {
          closed_at: string | null
          country: string
          created_at: string
          description: string | null
          full_name: string
          id: string
          managed_by_admin_id: string | null
          managed_by_kma_id: string | null
          managed_by_partner_id: string | null
          mobility_area: string
          phone_number: string
          profile_id: string
          published_at: string | null
          region: string | null
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          country: string
          created_at?: string
          description?: string | null
          full_name: string
          id?: string
          managed_by_admin_id?: string | null
          managed_by_kma_id?: string | null
          managed_by_partner_id?: string | null
          mobility_area: string
          phone_number: string
          profile_id: string
          published_at?: string | null
          region?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          country?: string
          created_at?: string
          description?: string | null
          full_name?: string
          id?: string
          managed_by_admin_id?: string | null
          managed_by_kma_id?: string | null
          managed_by_partner_id?: string | null
          mobility_area?: string
          phone_number?: string
          profile_id?: string
          published_at?: string | null
          region?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kd_job_requests_admin_fkey"
            columns: ["managed_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_job_requests_kma_fkey"
            columns: ["managed_by_kma_id"]
            isOneToOne: false
            referencedRelation: "kmerdiaspora_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_job_requests_partner_fkey"
            columns: ["managed_by_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_job_requests_profile_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "kd_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kd_moderation_actions: {
        Row: {
          action: string
          admin_id: string | null
          content_id: string
          content_type: string
          created_at: string
          id: string
          kma_id: string | null
          new_status: string | null
          old_status: string | null
          reason: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          kma_id?: string | null
          new_status?: string | null
          old_status?: string | null
          reason?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          kma_id?: string | null
          new_status?: string | null
          old_status?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kd_ma_admin_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_ma_kma_fkey"
            columns: ["kma_id"]
            isOneToOne: false
            referencedRelation: "kmerdiaspora_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      kd_profiles: {
        Row: {
          active: boolean
          bio: string | null
          city: string | null
          created_at: string
          full_name: string
          id: string
          mobility_area: string | null
          neighborhood: string | null
          phone_number: string
          profile_type: string
          region: string | null
          residence_country: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          bio?: string | null
          city?: string | null
          created_at?: string
          full_name: string
          id?: string
          mobility_area?: string | null
          neighborhood?: string | null
          phone_number: string
          profile_type?: string
          region?: string | null
          residence_country: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          bio?: string | null
          city?: string | null
          created_at?: string
          full_name?: string
          id?: string
          mobility_area?: string | null
          neighborhood?: string | null
          phone_number?: string
          profile_type?: string
          region?: string | null
          residence_country?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kd_profiles_user_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kd_quest_contributions: {
        Row: {
          amount: number
          confirmed_at: string | null
          contributed_at: string
          contributor_user_id: string
          id: string
          is_creator_initial_contribution: boolean
          metadata: Json | null
          quest_id: string
          reversed_at: string | null
          status: string
          wallet_ledger_entry_id: string | null
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          contributed_at?: string
          contributor_user_id: string
          id?: string
          is_creator_initial_contribution?: boolean
          metadata?: Json | null
          quest_id: string
          reversed_at?: string | null
          status?: string
          wallet_ledger_entry_id?: string | null
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          contributed_at?: string
          contributor_user_id?: string
          id?: string
          is_creator_initial_contribution?: boolean
          metadata?: Json | null
          quest_id?: string
          reversed_at?: string | null
          status?: string
          wallet_ledger_entry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kd_qc_ledger_fkey"
            columns: ["wallet_ledger_entry_id"]
            isOneToOne: false
            referencedRelation: "wallet_ledger_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_qc_quest_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "kd_quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_qc_quest_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "v_kd_quest_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_qc_user_fkey"
            columns: ["contributor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kd_quest_events: {
        Row: {
          actor_admin_id: string | null
          actor_kma_id: string | null
          actor_partner_id: string | null
          actor_user_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          new_status: string | null
          note: string | null
          previous_status: string | null
          quest_id: string
        }
        Insert: {
          actor_admin_id?: string | null
          actor_kma_id?: string | null
          actor_partner_id?: string | null
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          new_status?: string | null
          note?: string | null
          previous_status?: string | null
          quest_id: string
        }
        Update: {
          actor_admin_id?: string | null
          actor_kma_id?: string | null
          actor_partner_id?: string | null
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          new_status?: string | null
          note?: string | null
          previous_status?: string | null
          quest_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kd_qe_admin_fkey"
            columns: ["actor_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_qe_kma_fkey"
            columns: ["actor_kma_id"]
            isOneToOne: false
            referencedRelation: "kmerdiaspora_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_qe_partner_fkey"
            columns: ["actor_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_qe_quest_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "kd_quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_qe_quest_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "v_kd_quest_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_qe_user_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kd_quests: {
        Row: {
          beneficiary_user_id: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          creator_initial_contribution_id: string | null
          creator_initial_contribution_required: boolean
          creator_user_id: string | null
          currency: string
          current_amount: number
          description: string | null
          duration_end: string | null
          duration_start: string
          id: string
          managed_by_admin_id: string | null
          managed_by_kma_id: string | null
          managed_by_partner_id: string | null
          moderated_at: string | null
          moderated_by_kma_id: string | null
          published_at: string | null
          status: string
          target_amount: number
          title: string
          updated_at: string
        }
        Insert: {
          beneficiary_user_id?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          creator_initial_contribution_id?: string | null
          creator_initial_contribution_required?: boolean
          creator_user_id?: string | null
          currency?: string
          current_amount?: number
          description?: string | null
          duration_end?: string | null
          duration_start?: string
          id?: string
          managed_by_admin_id?: string | null
          managed_by_kma_id?: string | null
          managed_by_partner_id?: string | null
          moderated_at?: string | null
          moderated_by_kma_id?: string | null
          published_at?: string | null
          status?: string
          target_amount: number
          title: string
          updated_at?: string
        }
        Update: {
          beneficiary_user_id?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          creator_initial_contribution_id?: string | null
          creator_initial_contribution_required?: boolean
          creator_user_id?: string | null
          currency?: string
          current_amount?: number
          description?: string | null
          duration_end?: string | null
          duration_start?: string
          id?: string
          managed_by_admin_id?: string | null
          managed_by_kma_id?: string | null
          managed_by_partner_id?: string | null
          moderated_at?: string | null
          moderated_by_kma_id?: string | null
          published_at?: string | null
          status?: string
          target_amount?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kd_quests_admin_fkey"
            columns: ["managed_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_quests_beneficiary_fkey"
            columns: ["beneficiary_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_quests_creator_fkey"
            columns: ["creator_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_quests_kma_fkey"
            columns: ["managed_by_kma_id"]
            isOneToOne: false
            referencedRelation: "kmerdiaspora_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_quests_moderated_kma_fkey"
            columns: ["moderated_by_kma_id"]
            isOneToOne: false
            referencedRelation: "kmerdiaspora_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_quests_partner_fkey"
            columns: ["managed_by_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      kd_reports: {
        Row: {
          admin_id: string | null
          content: string | null
          created_at: string
          file_url: string | null
          id: string
          kma_id: string | null
          report_date: string
          report_type: string
          title: string | null
        }
        Insert: {
          admin_id?: string | null
          content?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          kma_id?: string | null
          report_date?: string
          report_type: string
          title?: string | null
        }
        Update: {
          admin_id?: string | null
          content?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          kma_id?: string | null
          report_date?: string
          report_type?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kd_reports_admin_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_reports_kma_fkey"
            columns: ["kma_id"]
            isOneToOne: false
            referencedRelation: "kmerdiaspora_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      kmerdiaspora_admins: {
        Row: {
          active: boolean
          auth_user_id: string | null
          created_at: string
          full_name: string
          id: string
          login_attempts: number
          notes: string | null
          phone_number: string | null
          role: string
          secret_code_hash: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          active?: boolean
          auth_user_id?: string | null
          created_at?: string
          full_name: string
          id?: string
          login_attempts?: number
          notes?: string | null
          phone_number?: string | null
          role?: string
          secret_code_hash?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          active?: boolean
          auth_user_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          login_attempts?: number
          notes?: string | null
          phone_number?: string | null
          role?: string
          secret_code_hash?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      momo_deposit_numbers: {
        Row: {
          active: boolean
          holder_name: string
          id: string
          max_amount: number | null
          min_amount: number | null
          phone_number: string
        }
        Insert: {
          active?: boolean
          holder_name: string
          id?: string
          max_amount?: number | null
          min_amount?: number | null
          phone_number: string
        }
        Update: {
          active?: boolean
          holder_name?: string
          id?: string
          max_amount?: number | null
          min_amount?: number | null
          phone_number?: string
        }
        Relationships: []
      }
      notifications_log: {
        Row: {
          admin_id: string | null
          channel: Database["public"]["Enums"]["notif_channel"]
          event_type: string | null
          failure_reason: string | null
          id: string
          kmerdiaspora_admin_id: string | null
          message: string
          metadata: Json | null
          partner_id: string | null
          sent_at: string
          status: string | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          admin_id?: string | null
          channel: Database["public"]["Enums"]["notif_channel"]
          event_type?: string | null
          failure_reason?: string | null
          id?: string
          kmerdiaspora_admin_id?: string | null
          message: string
          metadata?: Json | null
          partner_id?: string | null
          sent_at?: string
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          admin_id?: string | null
          channel?: Database["public"]["Enums"]["notif_channel"]
          event_type?: string | null
          failure_reason?: string | null
          id?: string
          kmerdiaspora_admin_id?: string | null
          message?: string
          metadata?: Json | null
          partner_id?: string | null
          sent_at?: string
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_log_kma_fkey"
            columns: ["kmerdiaspora_admin_id"]
            isOneToOne: false
            referencedRelation: "kmerdiaspora_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_log_partner_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_log_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_log_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "v_transaction_operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_codes: {
        Row: {
          attempts_count: number
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          purpose: Database["public"]["Enums"]["otp_purpose"]
          verified: boolean
          whatsapp_number: string
        }
        Insert: {
          attempts_count?: number
          code_hash: string
          created_at?: string
          expires_at: string
          id?: string
          purpose: Database["public"]["Enums"]["otp_purpose"]
          verified?: boolean
          whatsapp_number: string
        }
        Update: {
          attempts_count?: number
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          purpose?: Database["public"]["Enums"]["otp_purpose"]
          verified?: boolean
          whatsapp_number?: string
        }
        Relationships: []
      }
      partner_role_assignments: {
        Row: {
          assigned_at: string
          assigned_by_admin_id: string | null
          partner_id: string
          role_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by_admin_id?: string | null
          partner_id: string
          role_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by_admin_id?: string | null
          partner_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pra_assigned_by_fkey"
            columns: ["assigned_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pra_partner_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pra_role_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "backoffice_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          active: boolean
          auth_user_id: string | null
          created_at: string
          full_name: string
          id: string
          login_attempts: number
          notes: string | null
          phone_number: string | null
          secret_code_hash: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          active?: boolean
          auth_user_id?: string | null
          created_at?: string
          full_name: string
          id?: string
          login_attempts?: number
          notes?: string | null
          phone_number?: string | null
          secret_code_hash?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          active?: boolean
          auth_user_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          login_attempts?: number
          notes?: string | null
          phone_number?: string | null
          secret_code_hash?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          country: Database["public"]["Enums"]["user_country"]
          created_at: string
          id: string
          login_attempts: number
          otp_attempts: number
          secret_code_hash: string | null
          username: string
          whatsapp_number: string
        }
        Insert: {
          country: Database["public"]["Enums"]["user_country"]
          created_at?: string
          id: string
          login_attempts?: number
          otp_attempts?: number
          secret_code_hash?: string | null
          username: string
          whatsapp_number: string
        }
        Update: {
          country?: Database["public"]["Enums"]["user_country"]
          created_at?: string
          id?: string
          login_attempts?: number
          otp_attempts?: number
          secret_code_hash?: string | null
          username?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          active: boolean
          admin_id: string | null
          expo_push_token: string
          id: string
          kmerdiaspora_admin_id: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean
          admin_id?: string | null
          expo_push_token: string
          id?: string
          kmerdiaspora_admin_id?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean
          admin_id?: string | null
          expo_push_token?: string
          id?: string
          kmerdiaspora_admin_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_tokens_kma_fkey"
            columns: ["kmerdiaspora_admin_id"]
            isOneToOne: false
            referencedRelation: "kmerdiaspora_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_assignments: {
        Row: {
          acknowledged_at: string | null
          admin_id: string | null
          assigned_at: string
          completed_at: string | null
          id: string
          notes: string | null
          partner_id: string | null
          responsibility: string
          status: string
          transaction_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          admin_id?: string | null
          assigned_at?: string
          completed_at?: string | null
          id?: string
          notes?: string | null
          partner_id?: string | null
          responsibility: string
          status?: string
          transaction_id: string
        }
        Update: {
          acknowledged_at?: string | null
          admin_id?: string | null
          assigned_at?: string
          completed_at?: string | null
          id?: string
          notes?: string | null
          partner_id?: string | null
          responsibility?: string
          status?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ta_admin_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ta_partner_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ta_transaction_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ta_transaction_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "v_transaction_operations"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_execution_proofs: {
        Row: {
          description: string | null
          file_name: string | null
          file_url: string
          id: string
          mime_type: string | null
          transaction_id: string
          uploaded_at: string
          uploaded_by_admin_id: string | null
          uploaded_by_partner_id: string | null
        }
        Insert: {
          description?: string | null
          file_name?: string | null
          file_url: string
          id?: string
          mime_type?: string | null
          transaction_id: string
          uploaded_at?: string
          uploaded_by_admin_id?: string | null
          uploaded_by_partner_id?: string | null
        }
        Update: {
          description?: string | null
          file_name?: string | null
          file_url?: string
          id?: string
          mime_type?: string | null
          transaction_id?: string
          uploaded_at?: string
          uploaded_by_admin_id?: string | null
          uploaded_by_partner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_execution_proofs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_execution_proofs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "v_transaction_operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_execution_proofs_uploaded_by_admin_id_fkey"
            columns: ["uploaded_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_execution_proofs_uploaded_by_partner_id_fkey"
            columns: ["uploaded_by_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_proofs: {
        Row: {
          file_url: string
          id: string
          transaction_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          file_url: string
          id?: string
          transaction_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          file_url?: string
          id?: string
          transaction_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_proofs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_proofs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "v_transaction_operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_proofs_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_reviews: {
        Row: {
          admin_id: string | null
          created_at: string
          decision: string
          id: string
          metadata: Json | null
          partner_id: string | null
          proof_url: string | null
          reason: string | null
          transaction_id: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          decision: string
          id?: string
          metadata?: Json | null
          partner_id?: string | null
          proof_url?: string | null
          reason?: string | null
          transaction_id: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          decision?: string
          id?: string
          metadata?: Json | null
          partner_id?: string | null
          proof_url?: string | null
          reason?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tr_admin_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tr_partner_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tr_transaction_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tr_transaction_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "v_transaction_operations"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_status_history: {
        Row: {
          changed_by_admin_id: string | null
          changed_by_partner_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          new_stage: string | null
          new_status: string
          previous_stage: string | null
          previous_status: string | null
          reason: string | null
          transaction_id: string
        }
        Insert: {
          changed_by_admin_id?: string | null
          changed_by_partner_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          new_stage?: string | null
          new_status: string
          previous_stage?: string | null
          previous_status?: string | null
          reason?: string | null
          transaction_id: string
        }
        Update: {
          changed_by_admin_id?: string | null
          changed_by_partner_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          new_stage?: string | null
          new_status?: string
          previous_stage?: string | null
          previous_status?: string | null
          reason?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tsh_admin_fkey"
            columns: ["changed_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tsh_partner_fkey"
            columns: ["changed_by_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tsh_transaction_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tsh_transaction_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "v_transaction_operations"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          admin_id: string | null
          amount: number
          assigned_at: string | null
          batch_id: string | null
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string
          executed_at: string | null
          expired_at: string | null
          fee_amount: number
          first_reviewed_at: string | null
          id: string
          last_action_at: string | null
          momo_deposit_number_id: string | null
          partner_id: string | null
          recipient_country: Database["public"]["Enums"]["user_country"] | null
          recipient_location: string | null
          recipient_mobile_number: string | null
          recipient_name: string | null
          reference_note: string | null
          rejected_at: string | null
          rejection_reason: string | null
          review_deadline: string | null
          sender_name: string | null
          sender_phone_number: string | null
          settled_at: string | null
          status: Database["public"]["Enums"]["txn_status"]
          type: Database["public"]["Enums"]["txn_type"]
          user_id: string
          workflow_stage: string | null
        }
        Insert: {
          admin_id?: string | null
          amount: number
          assigned_at?: string | null
          batch_id?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          executed_at?: string | null
          expired_at?: string | null
          fee_amount?: number
          first_reviewed_at?: string | null
          id?: string
          last_action_at?: string | null
          momo_deposit_number_id?: string | null
          partner_id?: string | null
          recipient_country?: Database["public"]["Enums"]["user_country"] | null
          recipient_location?: string | null
          recipient_mobile_number?: string | null
          recipient_name?: string | null
          reference_note?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          review_deadline?: string | null
          sender_name?: string | null
          sender_phone_number?: string | null
          settled_at?: string | null
          status?: Database["public"]["Enums"]["txn_status"]
          type: Database["public"]["Enums"]["txn_type"]
          user_id: string
          workflow_stage?: string | null
        }
        Update: {
          admin_id?: string | null
          amount?: number
          assigned_at?: string | null
          batch_id?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          executed_at?: string | null
          expired_at?: string | null
          fee_amount?: number
          first_reviewed_at?: string | null
          id?: string
          last_action_at?: string | null
          momo_deposit_number_id?: string | null
          partner_id?: string | null
          recipient_country?: Database["public"]["Enums"]["user_country"] | null
          recipient_location?: string | null
          recipient_mobile_number?: string | null
          recipient_name?: string | null
          reference_note?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          review_deadline?: string | null
          sender_name?: string | null
          sender_phone_number?: string | null
          settled_at?: string | null
          status?: Database["public"]["Enums"]["txn_status"]
          type?: Database["public"]["Enums"]["txn_type"]
          user_id?: string
          workflow_stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "daily_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_momo_deposit_number_id_fkey"
            columns: ["momo_deposit_number_id"]
            isOneToOne: false
            referencedRelation: "momo_deposit_numbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_fee_tariffs: {
        Row: {
          country_a: Database["public"]["Enums"]["user_country"]
          country_b: Database["public"]["Enums"]["user_country"]
          fee_amount: number
          id: string
          max_amount: number
          min_amount: number
        }
        Insert: {
          country_a: Database["public"]["Enums"]["user_country"]
          country_b: Database["public"]["Enums"]["user_country"]
          fee_amount: number
          id?: string
          max_amount: number
          min_amount: number
        }
        Update: {
          country_a?: Database["public"]["Enums"]["user_country"]
          country_b?: Database["public"]["Enums"]["user_country"]
          fee_amount?: number
          id?: string
          max_amount?: number
          min_amount?: number
        }
        Relationships: []
      }
      wallet_ledger_entries: {
        Row: {
          amount: number
          balance_after: number | null
          balance_before: number | null
          created_at: string
          created_by_admin_id: string | null
          created_by_partner_id: string | null
          entry_type: string
          id: string
          idempotency_key: string | null
          metadata: Json | null
          source_id: string | null
          source_type: string | null
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string
          created_by_admin_id?: string | null
          created_by_partner_id?: string | null
          entry_type: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          source_id?: string | null
          source_type?: string | null
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string
          created_by_admin_id?: string | null
          created_by_partner_id?: string | null
          entry_type?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          source_id?: string | null
          source_type?: string | null
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wle_admin_fkey"
            columns: ["created_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wle_partner_fkey"
            columns: ["created_by_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wle_user_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wle_wallet_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          available_balance: number
          id: string
          pending_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_balance?: number
          id?: string
          pending_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_balance?: number
          id?: string
          pending_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_kd_matching_operations: {
        Row: {
          contact_revealed_at: string | null
          created_automatically: boolean | null
          created_by_admin_id: string | null
          created_by_kma_id: string | null
          created_by_partner_id: string | null
          driver_notified_at: string | null
          driver_request_id: string | null
          id: string | null
          job_request_id: string | null
          match_score: number | null
          matched_at: string | null
          recruiter_notified_at: string | null
          status: string | null
        }
        Insert: {
          contact_revealed_at?: string | null
          created_automatically?: boolean | null
          created_by_admin_id?: string | null
          created_by_kma_id?: string | null
          created_by_partner_id?: string | null
          driver_notified_at?: string | null
          driver_request_id?: string | null
          id?: string | null
          job_request_id?: string | null
          match_score?: number | null
          matched_at?: string | null
          recruiter_notified_at?: string | null
          status?: string | null
        }
        Update: {
          contact_revealed_at?: string | null
          created_automatically?: boolean | null
          created_by_admin_id?: string | null
          created_by_kma_id?: string | null
          created_by_partner_id?: string | null
          driver_notified_at?: string | null
          driver_request_id?: string | null
          id?: string | null
          job_request_id?: string | null
          match_score?: number | null
          matched_at?: string | null
          recruiter_notified_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kd_dm_admin_fkey"
            columns: ["created_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_dm_driver_request_fkey"
            columns: ["driver_request_id"]
            isOneToOne: false
            referencedRelation: "kd_driver_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_dm_job_request_fkey"
            columns: ["job_request_id"]
            isOneToOne: false
            referencedRelation: "kd_job_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_dm_kma_fkey"
            columns: ["created_by_kma_id"]
            isOneToOne: false
            referencedRelation: "kmerdiaspora_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_dm_partner_fkey"
            columns: ["created_by_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      v_kd_quest_summary: {
        Row: {
          beneficiary_user_id: string | null
          contributor_count: number | null
          created_at: string | null
          creator_user_id: string | null
          currency: string | null
          current_amount: number | null
          description: string | null
          duration_end: string | null
          duration_start: string | null
          id: string | null
          status: string | null
          target_amount: number | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kd_quests_beneficiary_fkey"
            columns: ["beneficiary_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_quests_creator_fkey"
            columns: ["creator_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_transaction_operations: {
        Row: {
          admin_id: string | null
          amount: number | null
          confirmed_at: string | null
          created_at: string | null
          executed_at: string | null
          fee_amount: number | null
          id: string | null
          partner_id: string | null
          review_deadline: string | null
          settled_at: string | null
          status: Database["public"]["Enums"]["txn_status"] | null
          type: Database["public"]["Enums"]["txn_type"] | null
          user_id: string | null
          workflow_stage: string | null
        }
        Insert: {
          admin_id?: string | null
          amount?: number | null
          confirmed_at?: string | null
          created_at?: string | null
          executed_at?: string | null
          fee_amount?: number | null
          id?: string | null
          partner_id?: string | null
          review_deadline?: string | null
          settled_at?: string | null
          status?: Database["public"]["Enums"]["txn_status"] | null
          type?: Database["public"]["Enums"]["txn_type"] | null
          user_id?: string | null
          workflow_stage?: string | null
        }
        Update: {
          admin_id?: string | null
          amount?: number | null
          confirmed_at?: string | null
          created_at?: string | null
          executed_at?: string | null
          fee_amount?: number | null
          id?: string | null
          partner_id?: string | null
          review_deadline?: string | null
          settled_at?: string | null
          status?: Database["public"]["Enums"]["txn_status"] | null
          type?: Database["public"]["Enums"]["txn_type"] | null
          user_id?: string | null
          workflow_stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_transfer_fee: {
        Args: {
          p_amount: number
          p_country_a: Database["public"]["Enums"]["user_country"]
          p_country_b: Database["public"]["Enums"]["user_country"]
        }
        Returns: number
      }
      is_current_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      admin_role: "admin" | "partner"
      notif_channel: "whatsapp" | "push"
      otp_purpose: "registration" | "secret_code_recovery"
      txn_status:
        | "pending_proof"
        | "under_review"
        | "confirmed"
        | "rejected"
        | "cancelled"
      txn_type: "deposit" | "transfer" | "withdrawal"
      user_country: "mali" | "guinee" | "cameroun"
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
      admin_role: ["admin", "partner"],
      notif_channel: ["whatsapp", "push"],
      otp_purpose: ["registration", "secret_code_recovery"],
      txn_status: [
        "pending_proof",
        "under_review",
        "confirmed",
        "rejected",
        "cancelled",
      ],
      txn_type: ["deposit", "transfer", "withdrawal"],
      user_country: ["mali", "guinee", "cameroun"],
    },
  },
} as const
