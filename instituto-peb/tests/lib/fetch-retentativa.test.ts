import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchComRetentativa } from '@/lib/supabase/fetch-retentativa';

const URL = 'https://supabase.example/rest/v1/lancamentos';
const futuro = () => Response.json({ code: 'PGRST303', message: 'JWT issued at future' }, { status: 401 });

describe('recuperação da recusa temporária do JWT', () => {
  const fetch = vi.fn<typeof globalThis.fetch>();

  beforeEach(() => {
    vi.useFakeTimers();
    fetch.mockReset();
    vi.stubGlobal('fetch', fetch);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('recupera quando o token só passa a ser aceito depois de mais de uma tentativa', async () => {
    fetch.mockResolvedValueOnce(futuro()).mockResolvedValueOnce(futuro())
      .mockResolvedValueOnce(futuro()).mockResolvedValueOnce(Response.json([{ id: 'nota' }]));
    const resposta = fetchComRetentativa(URL);
    await vi.runAllTimersAsync();
    expect(await (await resposta).json()).toEqual([{ id: 'nota' }]);
    expect(fetch).toHaveBeenCalledTimes(4);
    expect(Date.now()).toBeGreaterThan(0);
  });

  it('para após três retentativas e preserva o corpo do erro final', async () => {
    fetch.mockImplementation(async () => futuro());
    const inicio = Date.now();
    const resposta = fetchComRetentativa(URL);
    await vi.runAllTimersAsync();
    expect(fetch).toHaveBeenCalledTimes(4);
    expect(Date.now() - inicio).toBe(10500);
    expect(await (await resposta).json()).toEqual({ code: 'PGRST303', message: 'JWT issued at future' });
  });

  it.each([
    [401, 'PGRST303', 'JWT expired'],
    [403, '42501', 'permission denied'],
    [500, 'PGRST303', 'JWT issued at future'],
  ])('não repete erro %s/%s/%s', async (status, code, message) => {
    const original = Response.json({ code, message }, { status });
    fetch.mockResolvedValue(original);
    const resposta = await fetchComRetentativa(URL);
    expect(resposta).toBe(original);
    expect(await resposta.json()).toEqual({ code, message });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('não repete resposta de sucesso nem uma falha de rede', async () => {
    const original = Response.json([]);
    fetch.mockResolvedValueOnce(original);
    expect(await fetchComRetentativa(URL)).toBe(original);
    fetch.mockRejectedValueOnce(new TypeError('Falha de rede'));
    await expect(fetchComRetentativa(URL)).rejects.toThrow('Falha de rede');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('não repete erro com corpo que não seja JSON', async () => {
    fetch.mockResolvedValue(new Response('PGRST303', { status: 401 }));
    expect(await (await fetchComRetentativa(URL)).text()).toBe('PGRST303');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('reenvia o corpo de um Request sem consumi-lo para as próximas tentativas', async () => {
    const bodies: string[] = [];
    fetch.mockImplementation(async (input) => {
      bodies.push(await (input as Request).text());
      return bodies.length === 1 ? futuro() : Response.json({ ok: true });
    });
    const request = new Request(URL, { method: 'POST', body: '{"descricao":"Papel"}' });
    const resposta = fetchComRetentativa(request);
    await vi.runAllTimersAsync();
    expect((await resposta).ok).toBe(true);
    expect(bodies).toEqual(['{"descricao":"Papel"}', '{"descricao":"Papel"}']);
    expect(request.bodyUsed).toBe(false);
  });

  it('interrompe a espera quando a requisição é cancelada', async () => {
    const controller = new AbortController();
    fetch.mockResolvedValue(futuro());
    const resposta = fetchComRetentativa(URL, { signal: controller.signal });
    const rejeicao = expect(resposta).rejects.toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(vi.getTimerCount()).toBe(1));
    controller.abort();
    await rejeicao;
    await vi.runAllTimersAsync();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
