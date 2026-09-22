-- =============================================================================
-- 0008 · Storage: buckets privados e políticas
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'anexos', 'anexos', false,
    25 * 1024 * 1024, -- 25 MB por arquivo (RF014)
    array['application/pdf', 'image/jpeg', 'image/png', 'application/xml', 'text/xml']
  ),
  (
    'exportacoes', 'exportacoes', false,
    null,
    array['text/csv']
  );

-- Buckets privados (RNF021). Arquivos são abertos por URL assinada de
-- validade curta, gerada no servidor (RNF022). Mesmo assim, as políticas
-- garantem que só operadores ativos operam.

create policy "anexos: leitura" on storage.objects
  for select to authenticated
  using (bucket_id = 'anexos' and public.operador_ativo());
create policy "anexos: envio" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'anexos' and public.operador_ativo());
create policy "anexos: exclusão" on storage.objects
  for delete to authenticated
  using (bucket_id = 'anexos' and public.operador_ativo());

create policy "exportacoes: leitura" on storage.objects
  for select to authenticated
  using (bucket_id = 'exportacoes' and public.operador_ativo());
create policy "exportacoes: envio" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'exportacoes' and public.operador_ativo());
