export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      businesses: {
        Row: {
          id: string;
          name: string;
          slug: string;
          currency: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          currency?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          currency?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      business_users: {
        Row: {
          id: string;
          business_id: string;
          user_id: string;
          role: Database['public']['Enums']['app_role'];
          status: Database['public']['Enums']['membership_status'];
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          user_id: string;
          role?: Database['public']['Enums']['app_role'];
          status?: Database['public']['Enums']['membership_status'];
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          user_id?: string;
          role?: Database['public']['Enums']['app_role'];
          status?: Database['public']['Enums']['membership_status'];
          created_at?: string;
        };
        Relationships: [];
      };
      expense_categories: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          color: string | null;
          icon: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          color?: string | null;
          icon?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          color?: string | null;
          icon?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vendors: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          tax_id: string | null;
          phone: string | null;
          email: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          tax_id?: string | null;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          tax_id?: string | null;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      accounts: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          type: Database['public']['Enums']['account_type'];
          initial_balance: string;
          is_primary: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          type?: Database['public']['Enums']['account_type'];
          initial_balance?: string;
          is_primary?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          type?: Database['public']['Enums']['account_type'];
          initial_balance?: string;
          is_primary?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          business_id: string;
          vendor_id: string | null;
          category_id: string;
          account_id: string | null;
          expense_date: string;
          base_amount: string;
          tax_amount: string;
          total_amount: string;
          payment_method: Database['public']['Enums']['payment_method'];
          reference: string | null;
          notes: string | null;
          attachment_count: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          vendor_id?: string | null;
          category_id: string;
          account_id?: string | null;
          expense_date: string;
          base_amount: string;
          tax_amount?: string;
          payment_method?: Database['public']['Enums']['payment_method'];
          reference?: string | null;
          notes?: string | null;
          attachment_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          vendor_id?: string | null;
          category_id?: string;
          account_id?: string | null;
          expense_date?: string;
          base_amount?: string;
          tax_amount?: string;
          payment_method?: Database['public']['Enums']['payment_method'];
          reference?: string | null;
          notes?: string | null;
          attachment_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      purchase_invoices: {
        Row: {
          id: string;
          business_id: string;
          vendor_id: string;
          invoice_number: string;
          issue_date: string;
          due_date: string;
          subtotal: string;
          tax_amount: string;
          total: string;
          status: Database['public']['Enums']['invoice_status'];
          notes: string | null;
          attachment_count: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          vendor_id: string;
          invoice_number: string;
          issue_date: string;
          due_date: string;
          subtotal: string;
          tax_amount?: string;
          status?: Database['public']['Enums']['invoice_status'];
          notes?: string | null;
          attachment_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          vendor_id?: string;
          invoice_number?: string;
          issue_date?: string;
          due_date?: string;
          subtotal?: string;
          tax_amount?: string;
          status?: Database['public']['Enums']['invoice_status'];
          notes?: string | null;
          attachment_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      purchase_invoice_installments: {
        Row: {
          id: string;
          business_id: string;
          invoice_id: string;
          sequence_number: number;
          due_date: string;
          amount: string;
          paid_amount: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          invoice_id: string;
          sequence_number: number;
          due_date: string;
          amount: string;
          paid_amount?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          invoice_id?: string;
          sequence_number?: number;
          due_date?: string;
          amount?: string;
          paid_amount?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      purchase_invoice_payments: {
        Row: {
          id: string;
          business_id: string;
          invoice_id: string;
          account_id: string;
          payment_date: string;
          amount: string;
          payment_method: Database['public']['Enums']['payment_method'];
          reference: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          invoice_id: string;
          account_id: string;
          payment_date: string;
          amount: string;
          payment_method?: Database['public']['Enums']['payment_method'];
          reference?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          invoice_id?: string;
          account_id?: string;
          payment_date?: string;
          amount?: string;
          payment_method?: Database['public']['Enums']['payment_method'];
          reference?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      account_entries: {
        Row: {
          id: string;
          business_id: string;
          account_id: string;
          entry_date: string;
          type: Database['public']['Enums']['entry_type'];
          concept: string;
          amount: string;
          source_type: string | null;
          source_id: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          account_id: string;
          entry_date: string;
          type: Database['public']['Enums']['entry_type'];
          concept: string;
          amount: string;
          source_type?: string | null;
          source_id?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          account_id?: string;
          entry_date?: string;
          type?: Database['public']['Enums']['entry_type'];
          concept?: string;
          amount?: string;
          source_type?: string | null;
          source_id?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      daily_closings: {
        Row: {
          id: string;
          business_id: string;
          account_id: string;
          closing_date: string;
          opening_balance: string;
          inflow_total: string;
          outflow_total: string;
          closing_balance: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          account_id: string;
          closing_date: string;
          opening_balance?: string;
          inflow_total?: string;
          outflow_total?: string;
          closing_balance?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          account_id?: string;
          closing_date?: string;
          opening_balance?: string;
          inflow_total?: string;
          outflow_total?: string;
          closing_balance?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      attachments: {
        Row: {
          id: string;
          business_id: string;
          entity_type: Database['public']['Enums']['attachment_entity_type'];
          entity_id: string;
          storage_path: string;
          file_name: string;
          mime_type: string | null;
          size_bytes: number | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          entity_type: Database['public']['Enums']['attachment_entity_type'];
          entity_id: string;
          storage_path: string;
          file_name: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          entity_type?: Database['public']['Enums']['attachment_entity_type'];
          entity_id?: string;
          storage_path?: string;
          file_name?: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_manage_business: {
        Args: {
          target_business_id: string;
        };
        Returns: boolean;
      };
      is_business_admin: {
        Args: {
          target_business_id: string;
        };
        Returns: boolean;
      };
      is_business_member: {
        Args: {
          target_business_id: string;
        };
        Returns: boolean;
      };
      refresh_purchase_invoice_schedule: {
        Args: {
          p_invoice_id: string;
        };
        Returns: undefined;
      };
      storage_business_id: {
        Args: {
          path: string;
        };
        Returns: string | null;
      };
    };
    Enums: {
      account_type: 'cash' | 'bank' | 'other';
      app_role: 'admin' | 'manager' | 'viewer';
      attachment_entity_type: 'expense' | 'purchase_invoice';
      entry_type: 'income' | 'expense' | 'adjustment';
      invoice_status: 'pending' | 'partially_paid' | 'paid' | 'cancelled';
      membership_status: 'active' | 'invited' | 'disabled';
      payment_method: 'cash' | 'card' | 'transfer' | 'bizum' | 'direct_debit' | 'other';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
