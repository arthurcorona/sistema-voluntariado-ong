import { z } from 'zod';
import { textoOpcional, uuid } from './comum';

export const contaBancariaSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome da conta.').max(120, 'Máximo de 120 caracteres.'),
  banco: textoOpcional,
  numero: textoOpcional,
});

export const contaBancariaUpdateSchema = contaBancariaSchema.extend({
  id: uuid,
});

export type ContaBancariaInput = z.infer<typeof contaBancariaSchema>;
