/**
 * O Auth e o PostgREST do Supabase rodam em máquinas diferentes, e o relógio
 * do Auth costuma estar ~1 s à frente. Um token recém-emitido pode chegar ao
 * PostgREST com "iat" no futuro e ser recusado (PGRST303, "JWT issued at
 * future"). Um segundo depois o mesmo token é aceito. Este fetch repete a
 * requisição uma vez nesse caso, em vez de derrubar a tela.
 */
const ESPERA_MS = 1500;

export const fetchComRetentativa: typeof fetch = async (input, init) => {
  const res = await fetch(input, init);
  if (res.status !== 401 && res.status !== 403) return res;

  let corpo = '';
  try {
    corpo = await res.clone().text();
  } catch {
    return res;
  }
  if (!corpo.includes('PGRST303')) return res;

  await new Promise((r) => setTimeout(r, ESPERA_MS));
  return fetch(input, init);
};
