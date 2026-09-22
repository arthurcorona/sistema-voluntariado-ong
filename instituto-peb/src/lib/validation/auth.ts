import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  senha: z.string().min(1, 'Informe a senha.'),
});

export const emailSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
});

export const novaSenhaSchema = z
  .object({
    senha: z.string().min(8, 'A senha precisa ter ao menos 8 caracteres.'),
    confirmacao: z.string(),
  })
  .refine((v) => v.senha === v.confirmacao, {
    message: 'As senhas não coincidem.',
    path: ['confirmacao'],
  });
