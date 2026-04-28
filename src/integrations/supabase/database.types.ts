 
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
      ad_generations: {
        Row: {
          ad_format: string | null
          created_at: string | null
          cta: string | null
          description: string
          hashtags: string | null
          headline: string
          id: string
          image_suggestions: string | null
          model_used: string
          platform: string | null
          product_description: string
          target_audience: string | null
          user_id: string
        }
        Insert: {
          ad_format?: string | null
          created_at?: string | null
          cta?: string | null
          description: string
          hashtags?: string | null
          headline: string
          id?: string
          image_suggestions?: string | null
          model_used: string
          platform?: string | null
          product_description: string
          target_audience?: string | null
          user_id: string
        }
        Update: {
          ad_format?: string | null
          created_at?: string | null
          cta?: string | null
          description?: string
          hashtags?: string | null
          headline?: string
          id?: string
          image_suggestions?: string | null
          model_used?: string
          platform?: string | null
          product_description?: string
          target_audience?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_commission_settings: {
        Row: {
          commission_rate: number
          created_at: string | null
          id: string
          min_payout_amount: number | null
          payment_type: string
          updated_at: string | null
        }
        Insert: {
          commission_rate: number
          created_at?: string | null
          id?: string
          min_payout_amount?: number | null
          payment_type: string
          updated_at?: string | null
        }
        Update: {
          commission_rate?: number
          created_at?: string | null
          id?: string
          min_payout_amount?: number | null
          payment_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          api_key: string
          balance: number | null
          balance_updated_at: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          model_name: string | null
          provider: string
          request_count: number | null
          updated_at: string | null
        }
        Insert: {
          api_key: string
          balance?: number | null
          balance_updated_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          model_name?: string | null
          provider: string
          request_count?: number | null
          updated_at?: string | null
        }
        Update: {
          api_key?: string
          balance?: number | null
          balance_updated_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          model_name?: string | null
          provider?: string
          request_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_influencers: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          description: string | null
          id: string
          language: string
          name: string
          personality: string
          user_id: string
          voice_type: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          language?: string
          name: string
          personality?: string
          user_id: string
          voice_type?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          language?: string
          name?: string
          personality?: string
          user_id?: string
          voice_type?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string | null
          encrypted_key: string
          id: string
          is_active: boolean | null
          provider: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          encrypted_key: string
          id?: string
          is_active?: boolean | null
          provider: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          encrypted_key?: string
          id?: string
          is_active?: boolean | null
          provider?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage_stats: {
        Row: {
          cost_estimate: number | null
          created_at: string | null
          date: string
          id: string
          provider: string
          request_count: number
          request_type: string
          tokens_used: number | null
        }
        Insert: {
          cost_estimate?: number | null
          created_at?: string | null
          date?: string
          id?: string
          provider: string
          request_count?: number
          request_type: string
          tokens_used?: number | null
        }
        Update: {
          cost_estimate?: number | null
          created_at?: string | null
          date?: string
          id?: string
          provider?: string
          request_count?: number
          request_type?: string
          tokens_used?: number | null
        }
        Relationships: []
      }
      assistant_conversations: {
        Row: {
          assistant_id: string
          created_at: string | null
          id: string
          messages: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assistant_id: string
          created_at?: string | null
          id?: string
          messages?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assistant_id?: string
          created_at?: string | null
          id?: string
          messages?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_conversations_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
        ]
      }
      assistants: {
        Row: {
          avatar_emoji: string | null
          created_at: string | null
          description: string | null
          id: string
          instructions: string
          is_public: boolean | null
          model: string
          name: string
          personality: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_emoji?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          instructions: string
          is_public?: boolean | null
          model?: string
          name: string
          personality?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_emoji?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          instructions?: string
          is_public?: boolean | null
          model?: string
          name?: string
          personality?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          model_name: string | null
          model_provider: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          model_name?: string | null
          model_provider: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          model_name?: string | null
          model_provider?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_packages: {
        Row: {
          bonus_credits: number
          created_at: string | null
          credits: number
          currency: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          price: number
        }
        Insert: {
          bonus_credits?: number
          created_at?: string | null
          credits: number
          currency?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          price: number
        }
        Update: {
          bonus_credits?: number
          created_at?: string | null
          credits?: number
          currency?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_summaries: {
        Row: {
          created_at: string | null
          file_name: string | null
          id: string
          model_used: string
          original_text: string
          summary_level: string | null
          summary_text: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_name?: string | null
          id?: string
          model_used: string
          original_text: string
          summary_level?: string | null
          summary_text: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string | null
          id?: string
          model_used?: string
          original_text?: string
          summary_level?: string | null
          summary_text?: string
          user_id?: string
        }
        Relationships: []
      }
      favorite_prompts: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_favorite: boolean | null
          prompt_text: string
          tags: string[] | null
          title: string
          updated_at: string | null
          use_count: number | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          prompt_text: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          use_count?: number | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          prompt_text?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          use_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      generated_images: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          model_name: string | null
          prompt: string
          provider: string
          size: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          model_name?: string | null
          prompt: string
          provider: string
          size?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          model_name?: string | null
          prompt?: string
          provider?: string
          size?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_videos: {
        Row: {
          created_at: string | null
          duration: number | null
          id: string
          model_name: string | null
          prompt: string
          provider: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          duration?: number | null
          id?: string
          model_name?: string | null
          prompt: string
          provider: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          duration?: number | null
          id?: string
          model_name?: string | null
          prompt?: string
          provider?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      image_edits: {
        Row: {
          created_at: string | null
          edit_type: string
          edited_image_url: string
          id: string
          mask_data: string | null
          model_used: string
          original_image_id: string | null
          original_image_url: string
          prompt: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          edit_type: string
          edited_image_url: string
          id?: string
          mask_data?: string | null
          model_used: string
          original_image_id?: string | null
          original_image_url: string
          prompt?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          edit_type?: string
          edited_image_url?: string
          id?: string
          mask_data?: string | null
          model_used?: string
          original_image_id?: string | null
          original_image_url?: string
          prompt?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_edits_original_image_id_fkey"
            columns: ["original_image_id"]
            isOneToOne: false
            referencedRelation: "generated_images"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_videos: {
        Row: {
          created_at: string | null
          duration: number | null
          id: string
          influencer_id: string
          script: string
          status: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          duration?: number | null
          id?: string
          influencer_id: string
          script: string
          status?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          duration?: number | null
          id?: string
          influencer_id?: string
          script?: string
          status?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_videos_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "ai_influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      music_generations: {
        Row: {
          audio_url: string | null
          created_at: string | null
          duration: number
          genre: string | null
          id: string
          mood: string | null
          prompt: string
          provider: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          duration?: number
          genre?: string | null
          id?: string
          mood?: string | null
          prompt: string
          provider: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          duration?: number
          genre?: string | null
          id?: string
          mood?: string | null
          prompt?: string
          provider?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          metadata: Json | null
          method: string
          payment_type: string
          reference_id: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          id?: string
          metadata?: Json | null
          method: string
          payment_type: string
          reference_id?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          metadata?: Json | null
          method?: string
          payment_type?: string
          reference_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          credits: number
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          last_sign_in_at: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          credits?: number
          email?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          last_sign_in_at?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          credits?: number
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_sign_in_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          clicks: number | null
          code: string
          conversions: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          total_earned: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          clicks?: number | null
          code: string
          conversions?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          total_earned?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          clicks?: number | null
          code?: string
          conversions?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          total_earned?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_earnings: {
        Row: {
          amount: number
          commission_amount: number
          commission_rate: number
          created_at: string | null
          id: string
          payment_id: string | null
          payment_type: string
          referred_user_id: string
          referrer_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          commission_amount: number
          commission_rate: number
          created_at?: string | null
          id?: string
          payment_id?: string | null
          payment_type: string
          referred_user_id: string
          referrer_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          commission_amount?: number
          commission_rate?: number
          created_at?: string | null
          id?: string
          payment_id?: string | null
          payment_type?: string
          referred_user_id?: string
          referrer_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_earnings_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_earnings_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_earnings_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_payouts: {
        Row: {
          amount: number
          bank_account: string | null
          created_at: string | null
          id: string
          method: string
          notes: string | null
          paypal_email: string | null
          processed_at: string | null
          processed_by: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          bank_account?: string | null
          created_at?: string | null
          id?: string
          method: string
          notes?: string | null
          paypal_email?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          bank_account?: string | null
          created_at?: string | null
          id?: string
          method?: string
          notes?: string | null
          paypal_email?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_payouts_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_payouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          commission_earned: number | null
          created_at: string | null
          id: string
          referral_code: string
          referred_user_id: string
          referrer_id: string
          status: string | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          commission_earned?: number | null
          created_at?: string | null
          id?: string
          referral_code: string
          referred_user_id: string
          referrer_id: string
          status?: string | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          commission_earned?: number | null
          created_at?: string | null
          id?: string
          referral_code?: string
          referred_user_id?: string
          referrer_id?: string
          status?: string | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          access_token: string | null
          account_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          platform: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          account_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          platform: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          account_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          platform: string
          published_at: string | null
          scheduled_time: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          platform: string
          published_at?: string | null
          scheduled_time?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          platform?: string
          published_at?: string | null
          scheduled_time?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_period: string
          created_at: string | null
          credits_included: number
          currency: string
          features: Json
          id: string
          is_active: boolean
          modules: Json
          name: string
          price: number
          tier: string
          updated_at: string | null
        }
        Insert: {
          billing_period: string
          created_at?: string | null
          credits_included?: number
          currency?: string
          features?: Json
          id?: string
          is_active?: boolean
          modules?: Json
          name: string
          price?: number
          tier: string
          updated_at?: string | null
        }
        Update: {
          billing_period?: string
          created_at?: string | null
          credits_included?: number
          currency?: string
          features?: Json
          id?: string
          is_active?: boolean
          modules?: Json
          name?: string
          price?: number
          tier?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          auto_renew: boolean
          cancelled_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          plan_id: string
          started_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_renew?: boolean
          cancelled_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan_id: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_renew?: boolean
          cancelled_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      viral_videos: {
        Row: {
          created_at: string | null
          duration: number
          effects: string[] | null
          id: string
          likes: number | null
          platform: string
          prompt: string
          provider: string
          status: string | null
          style: string | null
          thumbnail_url: string | null
          trend: string | null
          user_id: string
          video_url: string | null
          views: number | null
        }
        Insert: {
          created_at?: string | null
          duration: number
          effects?: string[] | null
          id?: string
          likes?: number | null
          platform: string
          prompt: string
          provider: string
          status?: string | null
          style?: string | null
          thumbnail_url?: string | null
          trend?: string | null
          user_id: string
          video_url?: string | null
          views?: number | null
        }
        Update: {
          created_at?: string | null
          duration?: number
          effects?: string[] | null
          id?: string
          likes?: number | null
          platform?: string
          prompt?: string
          provider?: string
          status?: string | null
          style?: string | null
          thumbnail_url?: string | null
          trend?: string | null
          user_id?: string
          video_url?: string | null
          views?: number | null
        }
        Relationships: []
      }
      voice_conversations: {
        Row: {
          audio_url: string | null
          created_at: string | null
          duration: number | null
          id: string
          provider: string
          response_audio_url: string | null
          response_text: string | null
          transcript: string | null
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          provider: string
          response_audio_url?: string | null
          response_text?: string | null
          transcript?: string | null
          user_id: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          provider?: string
          response_audio_url?: string | null
          response_text?: string | null
          transcript?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_credit_analytics: {
        Row: {
          credits_added: number | null
          credits_used: number | null
          date: string | null
          net_credits: number | null
          transaction_count: number | null
        }
        Relationships: []
      }
      admin_usage_by_feature: {
        Row: {
          date: string | null
          description: string | null
          total_credits: number | null
          usage_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_credits:
        | { Args: { amount: number; target_user_id: string }; Returns: number }
        | {
            Args: {
              amount: number
              description?: string
              target_user_id: string
            }
            Returns: number
          }
      admin_update_credits: {
        Args: { p_amount: number; p_description: string; p_user_id: string }
        Returns: undefined
      }
      deduct_credits:
        | { Args: { amount: number; user_id: string }; Returns: number }
        | {
            Args: { amount: number; description?: string; user_id: string }
            Returns: number
          }
      generate_referral_code: { Args: never; Returns: string }
      get_user_credits: { Args: { p_user_id: string }; Returns: number }
      increment_referral_click: {
        Args: { code_val: string }
        Returns: undefined
      }
      process_referral: {
        Args: { new_user_id: string; ref_code: string }
        Returns: undefined
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
    Enums: {},
  },
} as const
