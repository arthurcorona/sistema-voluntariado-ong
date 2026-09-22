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
      anexos: {
        Row: {
          criado_em: string
          dados_extraidos: Json | null
          hash_sha256: string
          id: string
          lancamento_id: string
          mime_type: string
          nome_original: string
          storage_path: string
          tamanho_bytes: number
        }
        Insert: {
          criado_em?: string
          dados_extraidos?: Json | null
          hash_sha256: string
          id?: string
          lancamento_id: string
          mime_type: string
          nome_original: string
          storage_path: string
          tamanho_bytes: number
        }
        Update: {
          criado_em?: string
          dados_extraidos?: Json | null
          hash_sha256?: string
          id?: string
          lancamento_id?: string
          mime_type?: string
          nome_original?: string
          storage_path?: string
          tamanho_bytes?: number
        }
        Relationships: [
          {
            foreignKeyName: "anexos_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anexos_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "vw_lancamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_bancarias: {
        Row: {
          ativo: boolean
          atualizado_em: string
          banco: string | null
          criado_em: string
          id: string
          nome: string
          numero: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          banco?: string | null
          criado_em?: string
          id?: string
          nome: string
          numero?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          banco?: string | null
          criado_em?: string
          id?: string
          nome?: string
          numero?: string | null
        }
        Relationships: []
      }
      exportacoes: {
        Row: {
          arquivo_path: string
          gerada_em: string
          gerada_por: string | null
          id: string
          periodo_fim: string
          periodo_inicio: string
          total_centavos: number
          total_lancamentos: number
        }
        Insert: {
          arquivo_path: string
          gerada_em?: string
          gerada_por?: string | null
          id?: string
          periodo_fim: string
          periodo_inicio: string
          total_centavos: number
          total_lancamentos: number
        }
        Update: {
          arquivo_path?: string
          gerada_em?: string
          gerada_por?: string | null
          id?: string
          periodo_fim?: string
          periodo_inicio?: string
          total_centavos?: number
          total_lancamentos?: number
        }
        Relationships: [
          {
            foreignKeyName: "exportacoes_gerada_por_fkey"
            columns: ["gerada_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          documento: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          documento?: string | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          documento?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      itens_exportacao: {
        Row: {
          criado_em: string
          exportacao_id: string
          id: string
          lancamento_id: string
        }
        Insert: {
          criado_em?: string
          exportacao_id: string
          id?: string
          lancamento_id: string
        }
        Update: {
          criado_em?: string
          exportacao_id?: string
          id?: string
          lancamento_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_exportacao_exportacao_id_fkey"
            columns: ["exportacao_id"]
            isOneToOne: false
            referencedRelation: "exportacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_exportacao_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_exportacao_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "vw_lancamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos: {
        Row: {
          atualizado_em: string
          atualizado_por: string | null
          bloqueado: boolean
          conta_bancaria_id: string | null
          criado_em: string
          criado_por: string | null
          data_nota: string | null
          descricao: string | null
          fornecedor_id: string | null
          id: string
          numero_nota: string | null
          revisado_em: string | null
          revisado_por: string | null
          serie_nota: string | null
          valor_centavos: number | null
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          bloqueado?: boolean
          conta_bancaria_id?: string | null
          criado_em?: string
          criado_por?: string | null
          data_nota?: string | null
          descricao?: string | null
          fornecedor_id?: string | null
          id?: string
          numero_nota?: string | null
          revisado_em?: string | null
          revisado_por?: string | null
          serie_nota?: string | null
          valor_centavos?: number | null
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          bloqueado?: boolean
          conta_bancaria_id?: string | null
          criado_em?: string
          criado_por?: string | null
          data_nota?: string | null
          descricao?: string | null
          fornecedor_id?: string | null
          id?: string
          numero_nota?: string | null
          revisado_em?: string | null
          revisado_por?: string | null
          serie_nota?: string | null
          valor_centavos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_atualizado_por_fkey"
            columns: ["atualizado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_revisado_por_fkey"
            columns: ["revisado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id: string
          nome: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
    }
    Views: {
      vw_lancamentos: {
        Row: {
          atualizado_em: string | null
          atualizado_por: string | null
          atualizado_por_nome: string | null
          bloqueado: boolean | null
          completo: boolean | null
          conta_bancaria_id: string | null
          conta_bancaria_nome: string | null
          criado_em: string | null
          criado_por: string | null
          criado_por_nome: string | null
          data_nota: string | null
          descricao: string | null
          exportado: boolean | null
          exportavel: boolean | null
          fornecedor_documento: string | null
          fornecedor_id: string | null
          fornecedor_nome: string | null
          id: string | null
          numero_nota: string | null
          pendente_revisao: boolean | null
          revisado_em: string | null
          revisado_por: string | null
          revisado_por_nome: string | null
          serie_nota: string | null
          situacao: string | null
          total_anexos: number | null
          valor_centavos: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_atualizado_por_fkey"
            columns: ["atualizado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_revisado_por_fkey"
            columns: ["revisado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      operador_ativo: { Args: never; Returns: boolean }
      registrar_exportacao: {
        Args: {
          p_arquivo_path: string
          p_lancamentos: string[]
          p_periodo_fim: string
          p_periodo_inicio: string
        }
        Returns: string
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
    Enums: {},
  },
} as const

