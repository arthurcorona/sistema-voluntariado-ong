import { z } from 'zod';
import { dataObrigatoria } from './comum';

export const periodoSchema = z
  .object({
    de: dataObrigatoria,
    ate: dataObrigatoria,
  })
  .refine((p) => p.ate >= p.de, {
    message: 'A data final precisa ser igual ou posterior à inicial.',
    path: ['ate'],
  });

export type Periodo = z.output<typeof periodoSchema>;
