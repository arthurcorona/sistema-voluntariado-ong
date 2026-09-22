import { z } from 'zod';
import { normalizarDocumento, validarDocumento } from '@/lib/documento';
import { uuid } from './comum';

const documento = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : normalizarDocumento(v)))
  .nullable()
  .optional()
  .transform((v) => v ?? null)
  .refine((v) => v === null || validarDocumento(v), {
    message: 'CPF ou CNPJ inválido. Confira os dígitos.',
  });

export const fornecedorSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome.').max(200, 'Máximo de 200 caracteres.'),
  documento,
});

export const fornecedorUpdateSchema = fornecedorSchema.extend({
  id: uuid,
});

export const alternarAtivoSchema = z.object({
  id: uuid,
  ativo: z.boolean(),
});

export type FornecedorInput = z.infer<typeof fornecedorSchema>;
