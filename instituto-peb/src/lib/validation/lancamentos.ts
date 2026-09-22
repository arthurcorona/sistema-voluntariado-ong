import { z } from 'zod';
import { SITUACOES } from '@/types/aliases';
import { dataObrigatoria, dataOpcional, textoOpcional, uuid, uuidOpcional, valorCentavosOpcional } from './comum';

/** Formulário de cadastro do lançamento. Tudo opcional, de propósito (RF033). */
export const lancamentoFormSchema = z.object({
  id: uuid,
  fornecedor_id: uuidOpcional,
  numero_nota: textoOpcional,
  serie_nota: textoOpcional,
  data_nota: dataOpcional,
  valor_centavos: valorCentavosOpcional,
  descricao: textoOpcional,
  conta_bancaria_id: uuidOpcional,
  /** true = "Lançar" (marca revisado); false = salvar sem lançar. */
  lancar: z.boolean(),
  /** Depois de salvar, ir para o próximo pendente de revisão. */
  irParaProximo: z.boolean().default(false),
});

export type LancamentoFormInput = z.input<typeof lancamentoFormSchema>;
export type LancamentoFormData = z.output<typeof lancamentoFormSchema>;

export const filtrosLancamentosSchema = z.object({
  de: dataObrigatoria.optional(),
  ate: dataObrigatoria.optional(),
  conta: uuidOpcional,
  situacao: z.enum(SITUACOES).optional(),
  q: z.string().trim().max(100).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
});

export type FiltrosLancamentos = z.output<typeof filtrosLancamentosSchema>;

export const idsSchema = z.object({
  ids: z.array(uuid).min(1, 'Selecione ao menos um lançamento.'),
});

export const atribuirContaSchema = idsSchema.extend({
  conta_bancaria_id: uuid,
});
