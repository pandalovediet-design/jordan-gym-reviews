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
          created_at: string
          featured_rank: number
          featured_until: string | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          featured_rank?: number
          featured_until?: string | null
          organization_id: string
          updated_at?: string
        }
        Update: {
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
      offers: {
        Row: {
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
          closes_at: string | null
          id: string
          is_closed: boolean
          opens_at: string | null
          organization_id: string
          updated_at: string
          weekday: number
        }
        Insert: {
          closes_at?: string | null
          id?: string
          is_closed?: boolean
          opens_at?: string | null
          organization_id: string
          updated_at?: string
          weekday: number
        }
        Update: {
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
      organizations: {
        Row: {
          address: string | null
          area: string | null
          city: string
          created_at: string
          created_by: string
          description_ar: string | null
          id: string
          instagram: string | null
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
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          city?: string
          created_at?: string
          created_by: string
          description_ar?: string | null
          id?: string
          instagram?: string | null
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
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          area?: string | null
          city?: string
          created_at?: string
          created_by?: string
          description_ar?: string | null
          id?: string
          instagram?: string | null
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
          net_size: string | null
          nutrition_facts: Json | null
          organization_id: string
          price_jod: number
          price_updated_at: string
          size_info: string | null
          updated_at: string
        }
        Insert: {
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
          net_size?: string | null
          nutrition_facts?: Json | null
          organization_id: string
          price_jod: number
          price_updated_at?: string
          size_info?: string | null
          updated_at?: string
        }
        Update: {
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
          area: string | null
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
      org_type: "gym" | "independent_coach" | "sports_facility" | "store" | "nutritionist"
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
