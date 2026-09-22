# actions

Server Actions finas. Cada uma faz três coisas e nada mais:

1. valida a entrada com Zod (`src/lib/validation`);
2. chama uma função de `src/services`;
3. devolve o resultado para o componente, em formato que a tela consegue mostrar.

Nenhuma regra de negócio aqui. Nenhum acesso ao Supabase aqui.
