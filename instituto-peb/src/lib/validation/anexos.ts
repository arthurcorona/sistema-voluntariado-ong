import { z } from 'zod';
import { MIME_PERMITIDOS, TAMANHO_MAXIMO_BYTES } from '@/types/aliases';
import { uuid, uuidOpcional } from './comum';

export const hashSha256 = z.string().regex(/^[0-9a-f]{64}$/, 'Hash inválido.');

export const registrarUploadSchema = z.object({
  storagePath: z.string().regex(/^\d{4}\/\d{2}\/[0-9a-f-]{36}\.(pdf|jpg|png|xml)$/, 'Caminho inválido.'),
  nomeOriginal: z.string().trim().min(1).max(255),
  mimeType: z.enum(MIME_PERMITIDOS),
  hashSha256,
  tamanhoBytes: z.number().int().positive().max(TAMANHO_MAXIMO_BYTES),
  /** Quando informado, vincula a um lançamento existente (RF016). */
  lancamentoId: uuidOpcional,
});

export type RegistrarUploadInput = z.infer<typeof registrarUploadSchema>;

export const anexoIdSchema = z.object({ id: uuid });
