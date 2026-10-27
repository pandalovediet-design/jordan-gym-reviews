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
      analytics_events: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          id: number
          organization_id: string
          product_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          id?: never
          organization_id: string
          product_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["analytics_event_type"]
          id?: never
          organization_id?: string
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: never
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: never
          metadata?: Json
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          channel: string
          created_at: string
          id: string
          idempotency_key: string | null
          message: string | null
          organization_id: string
          product_id: string | null
          sender_name: string | null
          sender_phone: string | null
          status: Database["public"]["Enums"]["inquiry_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          idempotency_key?: string | null
          message?: string | null
          organization_id: string
          product_id?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          idempotency_key?: string | null
          message?: string | null
          organization_id?: string
          product_id?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_product_id_organization_id_fkey"
            columns: ["product_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      org_promotions: {
        Row: {
          glow_color: string | null
          glow_until: string | null
          created_at: string
          featured_rank: number
          featured_until: string | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          glow_color?: string | null
          glow_until?: string | null
          created_at?: string
          featured_rank?: number
          featured_until?: string | null
          organization_id: string
          updated_at?: string
        }
        Update: {
          glow_color?: string | null
          glow_until?: string | null
          created_at?: string
          featured_rank?: number
          featured_until?: string | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      membership_plans: {
        Row: {
          created_at: string
          duration_days: number
          id: string
          is_active: boolean
          name_ar: string
          organization_id: string
          price_jod: number | null
        }
        Insert: {
          created_at?: string
          duration_days: number
          id?: string
          is_active?: boolean
          name_ar: string
          organization_id: string
          price_jod?: number | null
        }
        Update: {
          created_at?: string
          duration_days?: number
          id?: string
          is_active?: boolean
          name_ar?: string
          organization_id?: string
          price_jod?: number | null
        }
        Relationships: []
      }
      org_members: {
        Row: {
          access_token: string
          coach_note: string | null
          created_at: string
          ends_on: string
          full_name: string
          id: string
          notes: string | null
          organization_id: string
          phone: string
          plan_id: string | null
          starts_on: string
          updated_at: string
        }
        Insert: {
          access_token?: string
          coach_note?: string | null
          created_at?: string
          ends_on: string
          full_name: string
          id?: string
          notes?: string | null
          organization_id: string
          phone: string
          plan_id?: string | null
          starts_on?: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          coach_note?: string | null
          created_at?: string
          ends_on?: string
          full_name?: string
          id?: string
          notes?: string | null
          organization_id?: string
          phone?: string
          plan_id?: string | null
          starts_on?: string
          updated_at?: string
        }
        Relationships: []
      }
      member_files: {
        Row: { created_at: string; id: string; member_id: string; organization_id: string; size_bytes: number; storage_path: string; title: string }
        Insert: { created_at?: string; id?: string; member_id: string; organization_id: string; size_bytes: number; storage_path: string; title: string }
        Update: { created_at?: string; id?: string; member_id?: string; organization_id?: string; size_bytes?: number; storage_path?: string; title?: string }
        Relationships: []
      }
      member_checkins: {
        Row: { checked_in_at: string; checked_in_by: string | null; id: string; member_id: string; organization_id: string; was_expired: boolean }
        Insert: { checked_in_at?: string; checked_in_by?: string | null; id?: string; member_id: string; organization_id: string; was_expired?: boolean }
        Update: { checked_in_at?: string; checked_in_by?: string | null; id?: string; member_id?: string; organization_id?: string; was_expired?: boolean }
        Relationships: []
      }
      member_programs: {
        Row: {
          access_token: string
          body: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["program_kind"]
          member_id: string
          organization_id: string
          title: string
        }
        Insert: {
          access_token?: string
          body: string
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["program_kind"]
          member_id: string
          organization_id: string
          title: string
        }
        Update: {
          access_token?: string
          body?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["program_kind"]
          member_id?: string
          organization_id?: string
          title?: string
        }
        Relationships: []
      }
      ads: {
        Row: {
          clicks: number
          created_at: string
          ends_at: string
          id: string
          image_path: string | null
          is_active: boolean
          link_url: string
          organization_id: string | null
          placement: string
          starts_at: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          clicks?: number
          created_at?: string
          ends_at: string
          id?: string
          image_path?: string | null
          is_active?: boolean
          link_url: string
          organization_id?: string | null
          placement: string
          starts_at: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          clicks?: number
          created_at?: string
          ends_at?: string
          id?: string
          image_path?: string | null
          is_active?: boolean
          link_url?: string
          organization_id?: string | null
          placement?: string
          starts_at?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ad_accounting: {
        Row: {
          ad_id: string
          advertiser_name: string | null
          advertiser_phone: string | null
          notes: string | null
          price_jod: number | null
        }
        Insert: {
          ad_id: string
          advertiser_name?: string | null
          advertiser_phone?: string | null
          notes?: string | null
          price_jod?: number | null
        }
        Update: {
          ad_id?: string
          advertiser_name?: string | null
          advertiser_phone?: string | null
          notes?: string | null
          price_jod?: number | null
        }
        Relationships: []
      }
      org_subscriptions: {
        Row: {
          amount_jod: number
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          paid_at: string
          period_end: string
          period_start: string
          plan_name: string
        }
        Insert: {
          amount_jod: number
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          paid_at?: string
          period_end: string
          period_start?: string
          plan_name: string
        }
        Update: {
          amount_jod?: number
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          paid_at?: string
          period_end?: string
          period_start?: string
          plan_name?: string
        }
        Relationships: []
      }
      org_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          organization_id: string
          status: string
          verification: Json | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          organization_id: string
          status?: string
          verification?: Json | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          organization_id?: string
          status?: string
          verification?: Json | null
          verified_at?: string | null
        }
        Relationships: []
      }
      offers: {
        Row: {
          branch_id: string | null
          created_at: string
          description_ar: string | null
          discount_percent: number | null
          ends_at: string
          id: string
          is_active: boolean
          kind: string
          offer_price_jod: number | null
          organization_id: string
          product_id: string | null
          starts_at: string
          title_ar: string
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          description_ar?: string | null
          discount_percent?: number | null
          ends_at: string
          id?: string
          is_active?: boolean
          kind?: string
          offer_price_jod?: number | null
          organization_id: string
          product_id?: string | null
          starts_at: string
          title_ar: string
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          description_ar?: string | null
          discount_percent?: number | null
          ends_at?: string
          id?: string
          is_active?: boolean
          kind?: string
          offer_price_jod?: number | null
          organization_id?: string
          product_id?: string | null
          starts_at?: string
          title_ar?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_product_id_organization_id_fkey"
            columns: ["product_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      organization_hours: {
        Row: {
          branch_id: string
          closes_at: string | null
          id: string
          is_closed: boolean
          opens_at: string | null
          organization_id: string
          updated_at: string
          weekday: number
        }
        Insert: {
          branch_id?: string | null
          closes_at?: string | null
          id?: string
          is_closed?: boolean
          opens_at?: string | null
          organization_id: string
          updated_at?: string
          weekday: number
        }
        Update: {
          branch_id?: string
          closes_at?: string | null
          id?: string
          is_closed?: boolean
          opens_at?: string | null
          organization_id?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "organization_hours_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_media: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          is_cover: boolean
          organization_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_cover?: boolean
          organization_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_cover?: boolean
          organization_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_media_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          organization_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_services: {
        Row: {
          branch_id: string | null
          billing_period: Database["public"]["Enums"]["billing_period"] | null
          created_at: string
          description_ar: string | null
          id: string
          is_active: boolean
          name_ar: string
          organization_id: string
          price_jod: number | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          billing_period?: Database["public"]["Enums"]["billing_period"] | null
          created_at?: string
          description_ar?: string | null
          id?: string
          is_active?: boolean
          name_ar: string
          organization_id: string
          price_jod?: number | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          billing_period?: Database["public"]["Enums"]["billing_period"] | null
          created_at?: string
          description_ar?: string | null
          id?: string
          is_active?: boolean
          name_ar?: string
          organization_id?: string
          price_jod?: number | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_classes: {
        Row: {
          branch_id: string | null
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          note: string | null
          organization_id: string
          starts_at: string
          title_ar: string
          updated_at: string
          weekday: number
          women_only: boolean
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          note?: string | null
          organization_id: string
          starts_at: string
          title_ar: string
          updated_at?: string
          weekday: number
          women_only?: boolean
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          note?: string | null
          organization_id?: string
          starts_at?: string
          title_ar?: string
          updated_at?: string
          weekday?: number
          women_only?: boolean
        }
        Relationships: []
      }
      org_branches: {
        Row: {
          address: string | null
          area: string | null
          city: string | null
          created_at: string
          id: string
          is_active: boolean
          is_main: boolean
          latitude: number | null
          longitude: number | null
          maps_url: string | null
          name_ar: string
          organization_id: string
          phone: string | null
          sort_order: number
          updated_at: string
          whatsapp: string | null
          women_access: string
          women_hours_note: string | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_main?: boolean
          latitude?: number | null
          longitude?: number | null
          maps_url?: string | null
          name_ar: string
          organization_id: string
          phone?: string | null
          sort_order?: number
          updated_at?: string
          whatsapp?: string | null
          women_access?: string
          women_hours_note?: string | null
        }
        Update: {
          address?: string | null
          area?: string | null
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_main?: boolean
          latitude?: number | null
          longitude?: number | null
          maps_url?: string | null
          name_ar?: string
          organization_id?: string
          phone?: string | null
          sort_order?: number
          updated_at?: string
          whatsapp?: string | null
          women_access?: string
          women_hours_note?: string | null
        }
        Relationships: []
      }
      sponsor_leads: {
        Row: { company: string | null; created_at: string; id: string; message: string | null; name: string; package: string | null; phone: string }
        Insert: { company?: string | null; created_at?: string; id?: string; message?: string | null; name: string; package?: string | null; phone: string }
        Update: { company?: string | null; created_at?: string; id?: string; message?: string | null; name?: string; package?: string | null; phone?: string }
        Relationships: []
      }
      offer_codes: {
        Row: { code: string; created_at: string; details_ar: string | null; ends_at: string | null; id: string; is_active: boolean; organization_id: string; reveals: number; title_ar: string }
        Insert: { code: string; created_at?: string; details_ar?: string | null; ends_at?: string | null; id?: string; is_active?: boolean; organization_id: string; reveals?: number; title_ar: string }
        Update: { code?: string; created_at?: string; details_ar?: string | null; ends_at?: string | null; id?: string; is_active?: boolean; organization_id?: string; reveals?: number; title_ar?: string }
        Relationships: [
          {
            foreignKeyName: "offer_codes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_listings: {
        Row: { condition: string; created_at: string; description_ar: string | null; expires_at: string; id: string; image_path: string | null; kind: string; organization_id: string; price_jod: number | null; status: string; swap_for: string | null; title_ar: string; updated_at: string }
        Insert: { condition: string; created_at?: string; description_ar?: string | null; expires_at?: string; id?: string; image_path?: string | null; kind: string; organization_id: string; price_jod?: number | null; status?: string; swap_for?: string | null; title_ar: string; updated_at?: string }
        Update: { condition?: string; created_at?: string; description_ar?: string | null; expires_at?: string; id?: string; image_path?: string | null; kind?: string; organization_id?: string; price_jod?: number | null; status?: string; swap_for?: string | null; title_ar?: string; updated_at?: string }
        Relationships: [
          {
            foreignKeyName: "equipment_listings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_reports: {
        Row: { created_at: string; id: string; listing_id: string; reason: string | null }
        Insert: { created_at?: string; id?: string; listing_id: string; reason?: string | null }
        Update: { created_at?: string; id?: string; listing_id?: string; reason?: string | null }
        Relationships: [
          {
            foreignKeyName: "equipment_reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "equipment_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: { cover_path: string | null; created_at: string; id: string; kind: string; organization_id: string; platform: string; status: string; title_ar: string | null; url: string; views: number }
        Insert: { cover_path?: string | null; created_at?: string; id?: string; kind: string; organization_id: string; platform?: string; status?: string; title_ar?: string | null; url: string; views?: number }
        Update: { cover_path?: string | null; created_at?: string; id?: string; kind?: string; organization_id?: string; platform?: string; status?: string; title_ar?: string | null; url?: string; views?: number }
        Relationships: [
          {
            foreignKeyName: "videos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      video_reports: {
        Row: { created_at: string; id: string; reason: string | null; video_id: string }
        Insert: { created_at?: string; id?: string; reason?: string | null; video_id: string }
        Update: { created_at?: string; id?: string; reason?: string | null; video_id?: string }
        Relationships: [
          {
            foreignKeyName: "video_reports_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: { created_at: string; gear_ar: string | null; id: string; is_active: boolean; level: string; muscle_group: string; name_ar: string; secondary_ar: string | null; slug: string; sort_order: number; summary_ar: string | null }
        Insert: { created_at?: string; gear_ar?: string | null; id?: string; is_active?: boolean; level?: string; muscle_group: string; name_ar: string; secondary_ar?: string | null; slug: string; sort_order?: number; summary_ar?: string | null }
        Update: { created_at?: string; gear_ar?: string | null; id?: string; is_active?: boolean; level?: string; muscle_group?: string; name_ar?: string; secondary_ar?: string | null; slug?: string; sort_order?: number; summary_ar?: string | null }
        Relationships: []
      }
      exercise_explanations: {
        Row: { created_at: string; exercise_id: string; id: string; mistake_ar: string | null; organization_id: string; platform: string | null; status: string; steps_ar: string[]; video_url: string | null }
        Insert: { created_at?: string; exercise_id: string; id?: string; mistake_ar?: string | null; organization_id: string; platform?: string | null; status?: string; steps_ar: string[]; video_url?: string | null }
        Update: { created_at?: string; exercise_id?: string; id?: string; mistake_ar?: string | null; organization_id?: string; platform?: string | null; status?: string; steps_ar?: string[]; video_url?: string | null }
        Relationships: [
          {
            foreignKeyName: "exercise_explanations_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_explanations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      home_workouts: {
        Row: { cover_path: string | null; created_at: string; equipment: string; focus: string; id: string; is_active: boolean; level: string; mistake_ar: string | null; platform: string | null; slug: string; sets_ar: string | null; sort_order: number; steps_ar: string[]; summary_ar: string | null; title_ar: string; video_url: string }
        Insert: { cover_path?: string | null; created_at?: string; equipment?: string; focus: string; id?: string; is_active?: boolean; level?: string; mistake_ar?: string | null; platform?: string | null; slug: string; sets_ar?: string | null; sort_order?: number; steps_ar: string[]; summary_ar?: string | null; title_ar: string; video_url: string }
        Update: { cover_path?: string | null; created_at?: string; equipment?: string; focus?: string; id?: string; is_active?: boolean; level?: string; mistake_ar?: string | null; platform?: string | null; slug?: string; sets_ar?: string | null; sort_order?: number; steps_ar?: string[]; summary_ar?: string | null; title_ar?: string; video_url?: string }
        Relationships: []
      }
      home_workout_products: {
        Row: { clicks: number; created_at: string; id: string; image_path: string | null; name_ar: string; price_text: string | null; sort_order: number; store_label: string | null; url: string; workout_id: string }
        Insert: { clicks?: number; created_at?: string; id?: string; image_path?: string | null; name_ar: string; price_text?: string | null; sort_order?: number; store_label?: string | null; url: string; workout_id: string }
        Update: { clicks?: number; created_at?: string; id?: string; image_path?: string | null; name_ar?: string; price_text?: string | null; sort_order?: number; store_label?: string | null; url?: string; workout_id?: string }
        Relationships: [
          {
            foreignKeyName: "home_workout_products_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "home_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      named_series: {
        Row: { created_at: string; description_ar: string | null; id: string; is_active: boolean; item_ids: string[]; kind: string; slug: string; sort_order: number; title_ar: string }
        Insert: { created_at?: string; description_ar?: string | null; id?: string; is_active?: boolean; item_ids: string[]; kind: string; slug: string; sort_order?: number; title_ar: string }
        Update: { created_at?: string; description_ar?: string | null; id?: string; is_active?: boolean; item_ids?: string[]; kind?: string; slug?: string; sort_order?: number; title_ar?: string }
        Relationships: []
      }
      nutrition_items: {
        Row: { body_ar: string | null; calories: number | null; carbs_g: number | null; cover_path: string | null; created_at: string; fat_g: number | null; id: string; is_active: boolean; kind: string; meal: string; platform: string | null; protein_g: number | null; slug: string; sort_order: number; summary_ar: string | null; title_ar: string; video_url: string | null }
        Insert: { body_ar?: string | null; calories?: number | null; carbs_g?: number | null; cover_path?: string | null; created_at?: string; fat_g?: number | null; id?: string; is_active?: boolean; kind?: string; meal: string; platform?: string | null; protein_g?: number | null; slug: string; sort_order?: number; summary_ar?: string | null; title_ar: string; video_url?: string | null }
        Update: { body_ar?: string | null; calories?: number | null; carbs_g?: number | null; cover_path?: string | null; created_at?: string; fat_g?: number | null; id?: string; is_active?: boolean; kind?: string; meal?: string; platform?: string | null; protein_g?: number | null; slug?: string; sort_order?: number; summary_ar?: string | null; title_ar?: string; video_url?: string | null }
        Relationships: []
      }
      nutrition_products: {
        Row: { clicks: number; created_at: string; id: string; image_path: string | null; item_id: string; name_ar: string; price_text: string | null; sort_order: number; store_label: string | null; url: string }
        Insert: { clicks?: number; created_at?: string; id?: string; image_path?: string | null; item_id: string; name_ar: string; price_text?: string | null; sort_order?: number; store_label?: string | null; url: string }
        Update: { clicks?: number; created_at?: string; id?: string; image_path?: string | null; item_id?: string; name_ar?: string; price_text?: string | null; sort_order?: number; store_label?: string | null; url?: string }
        Relationships: [
          {
            foreignKeyName: "nutrition_products_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "nutrition_items"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_votes: {
        Row: { category: string; created_at: string; id: string; nominee_org_id: string; vote_month: string; voter_id: string }
        Insert: { category: string; created_at?: string; id?: string; nominee_org_id: string; vote_month?: string; voter_id?: string }
        Update: { category?: string; created_at?: string; id?: string; nominee_org_id?: string; vote_month?: string; voter_id?: string }
        Relationships: []
      }
      facility_slots: {
        Row: { created_at: string; ends_at: string; id: string; note: string | null; organization_id: string; slot_date: string; starts_at: string; status: string }
        Insert: { created_at?: string; ends_at: string; id?: string; note?: string | null; organization_id: string; slot_date: string; starts_at: string; status?: string }
        Update: { created_at?: string; ends_at?: string; id?: string; note?: string | null; organization_id?: string; slot_date?: string; starts_at?: string; status?: string }
        Relationships: [
          {
            foreignKeyName: "facility_slots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_profiles: {
        Row: { certificates: string | null; created_at: string; education: string | null; education_place: string | null; experience_years: number | null; organization_id: string; role_label: string | null; session_mode: string | null; specialties: string | null; updated_at: string }
        Insert: { certificates?: string | null; created_at?: string; education?: string | null; education_place?: string | null; experience_years?: number | null; organization_id: string; role_label?: string | null; session_mode?: string | null; specialties?: string | null; updated_at?: string }
        Update: { certificates?: string | null; created_at?: string; education?: string | null; education_place?: string | null; experience_years?: number | null; organization_id?: string; role_label?: string | null; session_mode?: string | null; specialties?: string | null; updated_at?: string }
        Relationships: []
      }
      coach_gym_links: {
        Row: { approved_at: string | null; coach_org_id: string; created_at: string; gym_org_id: string; id: string; status: string }
        Insert: { approved_at?: string | null; coach_org_id: string; created_at?: string; gym_org_id: string; id?: string; status?: string }
        Update: { approved_at?: string | null; coach_org_id?: string; created_at?: string; gym_org_id?: string; id?: string; status?: string }
        Relationships: []
      }
      org_trainers: {
        Row: {
          bio_ar: string | null
          branch_id: string | null
          created_at: string
          education: string | null
          education_place: string | null
          experience_years: number | null
          id: string
          is_active: boolean
          is_head: boolean
          name_ar: string
          organization_id: string
          photo_path: string | null
          sort_order: number
          specialties: string | null
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          bio_ar?: string | null
          branch_id?: string | null
          created_at?: string
          education?: string | null
          education_place?: string | null
          experience_years?: number | null
          id?: string
          is_active?: boolean
          is_head?: boolean
          name_ar: string
          organization_id: string
          photo_path?: string | null
          sort_order?: number
          specialties?: string | null
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          bio_ar?: string | null
          branch_id?: string | null
          created_at?: string
          education?: string | null
          education_place?: string | null
          experience_years?: number | null
          id?: string
          is_active?: boolean
          is_head?: boolean
          name_ar?: string
          organization_id?: string
          photo_path?: string | null
          sort_order?: number
          specialties?: string | null
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      flash_slots: {
        Row: { created_at: string; description_ar: string | null; discount_percent: number | null; ends_at: string; id: string; organization_id: string; price_jod: number | null; starts_at: string; title_ar: string | null; updated_at: string }
        Insert: { created_at?: string; description_ar?: string | null; discount_percent?: number | null; ends_at: string; id?: string; organization_id: string; price_jod?: number | null; starts_at: string; title_ar?: string | null; updated_at?: string }
        Update: { created_at?: string; description_ar?: string | null; discount_percent?: number | null; ends_at?: string; id?: string; organization_id?: string; price_jod?: number | null; starts_at?: string; title_ar?: string | null; updated_at?: string }
        Relationships: [
          {
            foreignKeyName: "flash_slots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_reports: {
        Row: { contact: string | null; created_at: string; details: string | null; id: string; organization_id: string; reason: string; status: string }
        Insert: { contact?: string | null; created_at?: string; details?: string | null; id?: string; organization_id: string; reason: string; status?: string }
        Update: { contact?: string | null; created_at?: string; details?: string | null; id?: string; organization_id?: string; reason?: string; status?: string }
        Relationships: [
          {
            foreignKeyName: "listing_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: { created_at: string; ends_at: string | null; id: string; is_active: boolean; link_url: string | null; logo_path: string; name_ar: string; organization_id: string | null; sort_order: number }
        Insert: { created_at?: string; ends_at?: string | null; id?: string; is_active?: boolean; link_url?: string | null; logo_path: string; name_ar: string; organization_id?: string | null; sort_order?: number }
        Update: { created_at?: string; ends_at?: string | null; id?: string; is_active?: boolean; link_url?: string | null; logo_path?: string; name_ar?: string; organization_id?: string | null; sort_order?: number }
        Relationships: [
          {
            foreignKeyName: "partners_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      trails: {
        Row: { created_at: string; description_ar: string | null; difficulty: string; distance_km: number | null; duration_min: number | null; elevation_gain_m: number | null; id: string; image_path: string | null; is_published: boolean; maps_url: string | null; name_ar: string; region: string; slug: string; tips_ar: string | null; trail_type: string; updated_at: string }
        Insert: { created_at?: string; description_ar?: string | null; difficulty?: string; distance_km?: number | null; duration_min?: number | null; elevation_gain_m?: number | null; id?: string; image_path?: string | null; is_published?: boolean; maps_url?: string | null; name_ar: string; region: string; slug: string; tips_ar?: string | null; trail_type?: string; updated_at?: string }
        Update: { created_at?: string; description_ar?: string | null; difficulty?: string; distance_km?: number | null; duration_min?: number | null; elevation_gain_m?: number | null; id?: string; image_path?: string | null; is_published?: boolean; maps_url?: string | null; name_ar?: string; region?: string; slug?: string; tips_ar?: string | null; trail_type?: string; updated_at?: string }
        Relationships: []
      }
      menu_items: {
        Row: { branch_id: string | null; calories: number | null; carbs_g: number | null; created_at: string; description_ar: string | null; fat_g: number | null; id: string; image_path: string | null; is_available: boolean; name_ar: string; organization_id: string; price_jod: number; protein_g: number | null; section: string | null; sort_order: number; updated_at: string }
        Insert: { branch_id?: string | null; calories?: number | null; carbs_g?: number | null; created_at?: string; description_ar?: string | null; fat_g?: number | null; id?: string; image_path?: string | null; is_available?: boolean; name_ar: string; organization_id: string; price_jod: number; protein_g?: number | null; section?: string | null; sort_order?: number; updated_at?: string }
        Update: { branch_id?: string | null; calories?: number | null; carbs_g?: number | null; created_at?: string; description_ar?: string | null; fat_g?: number | null; id?: string; image_path?: string | null; is_available?: boolean; name_ar?: string; organization_id?: string; price_jod?: number; protein_g?: number | null; section?: string | null; sort_order?: number; updated_at?: string }
        Relationships: []
      }
      org_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name_ar: string
          org_type: Database["public"]["Enums"]["org_type"]
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar: string
          org_type: Database["public"]["Enums"]["org_type"]
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar?: string
          org_type?: Database["public"]["Enums"]["org_type"]
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      organizations: {
        Row: {
          delivery_areas: string | null
          delivery_modes: string[]
          maps_url: string | null
          women_access: string
          women_hours_note: string | null
          free_trial_note: string | null
        has_mosque: boolean
        no_music: boolean
        has_kids_area: boolean
        kids_friendly: boolean
        kids_transport: boolean
        transport_note: string | null
        accessibility: string[]
          address: string | null
          area: string | null
          category_id: string | null
          city: string
          created_at: string
          created_by: string
          description_ar: string | null
          id: string
          instagram: string | null
          is_claimed: boolean
          theme: string | null
          license_authority: string | null
          license_number: string | null
          latitude: number | null
          longitude: number | null
          name_ar: string
          name_en: string | null
          phone: string | null
          slug: string
          status: Database["public"]["Enums"]["org_status"]
          type: Database["public"]["Enums"]["org_type"]
          updated_at: string
          verified_at: string | null
          video_url: string | null
          verified_until: string | null
          review_done_at: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          delivery_areas?: string | null
          delivery_modes?: string[]
          category_id?: string | null
          maps_url?: string | null
          women_access?: string
          women_hours_note?: string | null
          free_trial_note?: string | null
        has_mosque?: boolean
        no_music?: boolean
        has_kids_area?: boolean
        kids_friendly?: boolean
        kids_transport?: boolean
        transport_note?: string | null
        accessibility?: string[]
          address?: string | null
          area?: string | null
          city?: string
          created_at?: string
          created_by: string
          description_ar?: string | null
          id?: string
          instagram?: string | null
          is_claimed?: boolean
          theme?: string | null
          license_authority?: string | null
          license_number?: string | null
          latitude?: number | null
          longitude?: number | null
          name_ar: string
          name_en?: string | null
          phone?: string | null
          slug: string
          status?: Database["public"]["Enums"]["org_status"]
          type: Database["public"]["Enums"]["org_type"]
          updated_at?: string
          verified_at?: string | null
          video_url?: string | null
          verified_until?: string | null
          review_done_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          delivery_areas?: string | null
          delivery_modes?: string[]
          category_id?: string | null
          maps_url?: string | null
          women_access?: string
          women_hours_note?: string | null
          free_trial_note?: string | null
        has_mosque?: boolean
        no_music?: boolean
        has_kids_area?: boolean
        kids_friendly?: boolean
        kids_transport?: boolean
        transport_note?: string | null
        accessibility?: string[]
          address?: string | null
          area?: string | null
          city?: string
          created_at?: string
          created_by?: string
          description_ar?: string | null
          id?: string
          instagram?: string | null
          is_claimed?: boolean
          theme?: string | null
          license_authority?: string | null
          license_number?: string | null
          latitude?: number | null
          longitude?: number | null
          name_ar?: string
          name_en?: string | null
          phone?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["org_status"]
          type?: Database["public"]["Enums"]["org_type"]
          updated_at?: string
          verified_at?: string | null
          video_url?: string | null
          verified_until?: string | null
          review_done_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          id: string
          name_ar: string
          name_en: string
          requires_review: boolean
          slug: string
          sort_order: number
        }
        Insert: {
          id?: string
          name_ar: string
          name_en: string
          requires_review?: boolean
          slug: string
          sort_order?: number
        }
        Update: {
          id?: string
          name_ar?: string
          name_en?: string
          requires_review?: boolean
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          branch_id: string | null
          availability: Database["public"]["Enums"]["availability_status"]
          availability_updated_at: string
          brand: string | null
          category_id: string
          created_at: string
          description_ar: string | null
          id: string
          image_path: string | null
          ingredients: string | null
          is_published: boolean
          manufacturer: string | null
          moderation_status: Database["public"]["Enums"]["moderation_status"]
          name_ar: string
          name_en: string | null
          old_price_jod: number | null
          net_size: string | null
          nutrition_facts: Json | null
          organization_id: string
          price_jod: number
          price_updated_at: string
          size_info: string | null
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          availability?: Database["public"]["Enums"]["availability_status"]
          availability_updated_at?: string
          brand?: string | null
          category_id: string
          created_at?: string
          description_ar?: string | null
          id?: string
          image_path?: string | null
          ingredients?: string | null
          is_published?: boolean
          manufacturer?: string | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          name_ar: string
          name_en?: string | null
          old_price_jod?: number | null
          net_size?: string | null
          nutrition_facts?: Json | null
          organization_id: string
          price_jod: number
          price_updated_at?: string
          size_info?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          availability?: Database["public"]["Enums"]["availability_status"]
          availability_updated_at?: string
          brand?: string | null
          category_id?: string
          created_at?: string
          description_ar?: string | null
          id?: string
          image_path?: string | null
          ingredients?: string | null
          is_published?: boolean
          manufacturer?: string | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          name_ar?: string
          name_en?: string | null
          old_price_jod?: number | null
          net_size?: string | null
          nutrition_facts?: Json | null
          organization_id?: string
          price_jod?: number
          price_updated_at?: string
          size_info?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          review_id: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          review_id: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          review_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_responses: {
        Row: {
          body: string
          created_at: string
          created_by: string
          id: string
          organization_id: string
          review_id: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by: string
          id?: string
          organization_id: string
          review_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          review_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_responses_review_id_organization_id_fkey"
            columns: ["review_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_name: string
          body: string | null
          created_at: string
          id: string
          organization_id: string
          rating: number
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name?: string
          body?: string | null
          created_at?: string
          id?: string
          organization_id: string
          rating: number
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string
          body?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          rating?: number
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      organizations_listing: {
        Row: {
          has_mosque: boolean | null
          no_music: boolean | null
          has_kids_area: boolean | null
          kids_friendly: boolean | null
          kids_transport: boolean | null
          accessibility: string[] | null
          area: string | null
          category_id: string | null
          category_name: string | null
          category_slug: string | null
          city: string | null
          created_at: string | null
          description_ar: string | null
          featured_rank: number | null
          id: string | null
          is_featured: boolean | null
          name_ar: string | null
          name_en: string | null
          slug: string | null
          type: Database["public"]["Enums"]["org_type"] | null
          verified_at: string | null
          women_access: string | null
          women_hours_note: string | null
          free_trial_note: string | null
          latitude: number | null
          longitude: number | null
          min_price_jod: number | null
          branch_count: number | null
          branch_cities: string[] | null
          branch_women_only: boolean | null
          branch_women_hours: boolean | null
          branch_points: Json | null
          glow_color: string | null
        }
        Relationships: []
      }
      organization_ratings: {
        Row: {
          average_rating: number | null
          organization_id: string | null
          review_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          display_name: string | null
          email: string
          email_confirmed: boolean
          id: string
          is_admin: boolean
          last_sign_in_at: string | null
          org_count: number
        }[]
      }
      admin_stats: { Args: never; Returns: Json }
      admin_top_orgs: {
        Args: { p_days?: number }
        Returns: {
          name_ar: string
          organization_id: string
          phone: number
          qr: number
          slug: string
          views: number
          whatsapp: number
        }[]
      }
      record_checkin: {
        Args: { p_token: string }
        Returns: { checked_in_at: string; days_left: number; duplicate: boolean; ends_on: string; expired: boolean; member_name: string; org_name: string }[]
      }
      get_member_by_token: {
        Args: { p_token: string }
        Returns: { coach_note: string | null; days_left: number; ends_on: string; member_name: string; org_name: string; org_slug: string; org_whatsapp: string | null; plan_name: string | null; starts_on: string }[]
      }
      get_public_stats: {
        Args: Record<PropertyKey, never>
        Returns: { cities: number; inquiries_30d: number; orgs: number; phone_30d: number; views_30d: number; whatsapp_30d: number }[]
      }
      submit_sponsor_lead: {
        Args: { p_company: string; p_message: string; p_name: string; p_package: string; p_phone: string }
        Returns: boolean
      }
      list_public_codes: {
        Args: { p_org?: string }
        Returns: { details_ar: string | null; ends_at: string | null; id: string; org_city: string; org_name: string; org_slug: string; reveals: number; title_ar: string }[]
      }
      reveal_offer_code: {
        Args: { p_id: string }
        Returns: string
      }
      report_equipment: {
        Args: { p_id: string; p_reason: string }
        Returns: boolean
      }
      count_video_view: {
        Args: { p_id: string }
        Returns: undefined
      }
      report_video: {
        Args: { p_id: string; p_reason: string }
        Returns: boolean
      }
      get_member_streak: {
        Args: { p_token: string }
        Returns: { best_weeks: number; streak_weeks: number; total_visits: number }[]
      }
      get_vote_results: {
        Args: { p_category: string; p_month?: string }
        Returns: { city: string; name_ar: string; slug: string; votes: number }[]
      }
      get_gym_partners: {
        Args: { p_gym: string }
        Returns: { bio_ar: string | null; certificates: string | null; coach_slug: string; education: string | null; education_place: string | null; experience_years: number | null; name_ar: string; partner_type: string; photo_path: string | null; role_label: string | null; specialties: string | null; verified: boolean; whatsapp: string | null }[]
      }
      get_gym_coaches: {
        Args: { p_gym: string }
        Returns: { bio_ar: string | null; coach_slug: string; education: string | null; education_place: string | null; experience_years: number | null; name_ar: string; photo_path: string | null; role_label: string | null; specialties: string | null }[]
      }
      get_coach_gyms: {
        Args: { p_coach: string }
        Returns: { gym_name: string; gym_slug: string }[]
      }
      list_gym_coach_links: {
        Args: { p_gym: string }
        Returns: { coach_name: string; coach_slug: string; created_at: string; link_id: string; status: string }[]
      }
      list_coach_gym_links: {
        Args: { p_coach: string }
        Returns: { created_at: string; gym_name: string; gym_slug: string; link_id: string; status: string }[]
      }
      get_member_files: {
        Args: { p_token: string }
        Returns: { created_at: string; id: string; size_bytes: number; title: string }[]
      }
      get_member_file_path: {
        Args: { p_file: string; p_token: string }
        Returns: string
      }
      get_member_page: {
        Args: { p_token: string }
        Returns: { coach_note: string | null; days_left: number; ends_on: string; member_name: string; org_name: string; org_slug: string; org_whatsapp: string | null; plan_name: string | null; starts_on: string }[]
      }
      get_member_attendance: {
        Args: { p_token: string }
        Returns: { checked_in_at: string; month_count: number }[]
      }
      get_member_programs: {
        Args: { p_token: string }
        Returns: { body: string; created_at: string; kind: Database["public"]["Enums"]["program_kind"]; title: string }[]
      }
      get_program_by_token: {
        Args: { p_token: string }
        Returns: {
          body: string
          created_at: string
          kind: Database["public"]["Enums"]["program_kind"]
          member_name: string
          org_name: string
          title: string
        }[]
      }
      is_org_member: {
        Args: {
          p_org: string
          p_roles?: Database["public"]["Enums"]["member_role"][]
        }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
      org_is_published: { Args: { p_org: string }; Returns: boolean }
      org_type_of: {
        Args: { p_org: string }
        Returns: Database["public"]["Enums"]["org_type"]
      }
      storage_org_id: { Args: { p_name: string }; Returns: string }
    }
    Enums: {
      program_kind: "workout" | "nutrition"
      analytics_event_type:
        | "qr_scan"
        | "page_view"
        | "product_view"
        | "whatsapp_click"
        | "phone_click"
        | "inquiry"
      availability_status: "available" | "limited" | "out_of_stock" | "unknown"
      billing_period: "session" | "day" | "week" | "month" | "quarter" | "year"
      inquiry_status: "new" | "seen" | "closed"
      member_role: "owner" | "manager" | "staff"
      moderation_status: "pending" | "approved" | "rejected"
      org_status: "draft" | "pending" | "published" | "suspended"
      org_type: "gym" | "independent_coach" | "sports_facility" | "store" | "nutritionist" | "healthy_food" | "sports_health"
      review_status: "published" | "hidden"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T]
