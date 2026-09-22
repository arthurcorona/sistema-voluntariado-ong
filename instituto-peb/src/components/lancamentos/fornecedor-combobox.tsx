'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { criarFornecedor } from '@/actions/fornecedores';
import { FornecedorForm } from '@/components/cadastros/fornecedores-tab';
import { inputClass } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { formatarDocumento } from '@/lib/documento';
import type { Fornecedor } from '@/types/aliases';

type Props = {
  id?: string;
  fornecedores: Fornecedor[];
  value: string | null;
  onChange: (id: string | null) => void;
  onNovoFornecedor: (f: Fornecedor) => void;
  sugestao?: boolean;
  /** Pré-preenche o formulário de criação (emitente lido do XML). */
  novoSugerido?: { nome: string; documento: string | null };
  invalid?: boolean;
};

export function FornecedorCombobox({ id, fornecedores, value, onChange, onNovoFornecedor, sugestao, novoSugerido, invalid }: Props) {
  const listId = useId();
  const selecionado = fornecedores.find((f) => f.id === value) ?? null;
  const [texto, setTexto] = useState(selecionado?.nome ?? '');
  const [aberto, setAberto] = useState(false);
  const [indice, setIndice] = useState(0);
  const [criando, setCriando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const raiz = useRef<HTMLDivElement>(null);

  const filtrados = useMemo(() => {
    const t = normalizar(texto);
    const base = t ? fornecedores.filter((f) => normalizar(f.nome).includes(t) || (f.documento ?? '').includes(t.replace(/\D/g, '') || '§')) : fornecedores;
    return base.slice(0, 8);
  }, [texto, fornecedores]);

  const podeCriar = texto.trim().length > 0 && !fornecedores.some((f) => normalizar(f.nome) === normalizar(texto));
  const opcoes = filtrados.length + (podeCriar ? 1 : 0);

  useEffect(() => {
    function fora(e: MouseEvent) {
      if (raiz.current && !raiz.current.contains(e.target as Node)) {
        setAberto(false);
        setCriando(false);
      }
    }
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, []);

  function selecionar(f: Fornecedor) {
    onChange(f.id);
    setTexto(f.nome);
    setAberto(false);
  }

  function abrirCriacao() {
    setAberto(false);
    setCriando(true);
  }

  return (
    <div ref={raiz} className="relative">
      <div className="flex gap-1">
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={aberto}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={invalid || undefined}
          data-sugestao={sugestao || undefined}
          className={cn(inputClass)}
          placeholder="Digite para buscar…"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setAberto(true);
            setIndice(0);
            if (value) onChange(null);
          }}
          onFocus={() => setAberto(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setAberto(true);
              setIndice((i) => Math.min(i + 1, opcoes - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setIndice((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter' && aberto) {
              e.preventDefault();
              if (indice < filtrados.length) selecionar(filtrados[indice]);
              else if (podeCriar) abrirCriacao();
            } else if (e.key === 'Escape') {
              setAberto(false);
            } else if (e.key === 'Tab') {
              // Tab com um único resultado seleciona: menos cliques.
              if (aberto && !value && filtrados.length === 1) selecionar(filtrados[0]);
              setAberto(false);
            }
          }}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            className="rounded-md px-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            aria-label="Limpar fornecedor"
            onClick={() => {
              onChange(null);
              setTexto('');
              inputRef.current?.focus();
            }}
          >
            ×
          </button>
        )}
      </div>

      {selecionado?.documento && !aberto && (
        <p className="mt-1 text-xs text-zinc-500">{formatarDocumento(selecionado.documento)}</p>
      )}

      {aberto && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-zinc-200 bg-white py-1 text-sm shadow-lg"
        >
          {filtrados.map((f, i) => (
            <li
              key={f.id}
              role="option"
              aria-selected={i === indice}
              className={cn('cursor-pointer px-3 py-1.5', i === indice ? 'bg-blue-50 text-blue-900' : 'hover:bg-zinc-50')}
              onMouseEnter={() => setIndice(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                selecionar(f);
              }}
            >
              <span className="font-medium">{f.nome}</span>
              {f.documento && <span className="ml-2 text-xs text-zinc-500">{formatarDocumento(f.documento)}</span>}
            </li>
          ))}
          {podeCriar && (
            <li
              role="option"
              aria-selected={indice === filtrados.length}
              className={cn('cursor-pointer border-t border-zinc-100 px-3 py-1.5', indice === filtrados.length ? 'bg-blue-50 text-blue-900' : 'hover:bg-zinc-50')}
              onMouseEnter={() => setIndice(filtrados.length)}
              onMouseDown={(e) => {
                e.preventDefault();
                abrirCriacao();
              }}
            >
              + Criar fornecedor &quot;{texto.trim()}&quot;
            </li>
          )}
          {filtrados.length === 0 && !podeCriar && <li className="px-3 py-1.5 text-zinc-500">Nenhum fornecedor.</li>}
        </ul>
      )}

      {!criando && novoSugerido && !value && (
        <button
          type="button"
          className="mt-1 text-left text-xs text-amber-800 underline decoration-dotted hover:text-amber-900"
          onClick={() => {
            setTexto(novoSugerido.nome);
            abrirCriacao();
          }}
        >
          Emitente lido do arquivo sem cadastro: criar &quot;{novoSugerido.nome || formatarDocumento(novoSugerido.documento)}&quot;
        </button>
      )}

      {criando && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-zinc-200 bg-white p-3 shadow-lg">
          <p className="mb-2 text-sm font-medium text-zinc-800">Novo fornecedor</p>
          <FornecedorForm
            compacto
            titulo="novo"
            inicial={{
              nome: texto.trim() || novoSugerido?.nome || '',
              documento: (!value && novoSugerido?.documento) || null,
            }}
            onSubmit={(dados) => criarFornecedor(dados)}
            onSaved={(f) => {
              onNovoFornecedor(f);
              setCriando(false);
              selecionar(f);
            }}
            onCancel={() => {
              setCriando(false);
              inputRef.current?.focus();
            }}
          />
        </div>
      )}
    </div>
  );
}

function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
