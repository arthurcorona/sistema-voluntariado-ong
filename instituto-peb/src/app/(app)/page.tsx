import Link from 'next/link';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, PageHeader } from '@/components/ui/card';
import { formatDateBR } from '@/lib/dates';
import { formatBRL } from '@/lib/money';
import { createClient } from '@/lib/supabase/server';
import * as painel from '@/services/painel';

export default async function PainelPage() {
  const db = await createClient();
  const r = await painel.resumo(db);
  const mes = new Date(`${r.periodo.de}T12:00:00Z`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Painel"
        description={`${mes.charAt(0).toUpperCase()}${mes.slice(1)} · ${formatDateBR(r.periodo.de)} a ${formatDateBR(r.periodo.ate)}`}
        actions={
          <>
            <Link href="/envio">
              <Button>Enviar documentos</Button>
            </Link>
            <Link href="/exportar">
              <Button variant="secondary">Exportar</Button>
            </Link>
          </>
        }
      />

      {r.semContas && (
        <Alert tone="info" className="mb-4">
          <strong>Primeiro uso.</strong> Antes de lançar notas, cadastre as contas bancárias em{' '}
          <Link href="/cadastros?aba=contas" className="underline">
            Cadastros
          </Link>
          . Fornecedores podem ser criados na hora, direto na tela do lançamento.
        </Alert>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Lançado no mês</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{formatBRL(r.totalCentavos)}</p>
          <p className="text-xs text-zinc-500">{r.lancados} lançamento(s) revisado(s)</p>
        </Card>
        <Link href="/lancamentos?situacao=pendente_revisao" className="block">
          <Card className={r.pendentesRevisao > 0 ? 'border-amber-300 bg-amber-50' : ''}>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Pendentes de revisão</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{r.pendentesRevisao}</p>
            <p className="text-xs text-zinc-500">documentos enviados e não conferidos</p>
          </Card>
        </Link>
        <Link href={`/lancamentos?de=${r.periodo.de}&ate=${r.periodo.ate}`} className="block">
          <Card>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Incompletos no mês</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{r.incompletos}</p>
            <p className="text-xs text-zinc-500">revisados com algum campo em branco</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
