'use client';

import { useEffect } from 'react';
import { sair } from '@/actions/auth';

const EVENTOS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;

/** Encerra a sessão após inatividade (RF004). Padrão: 30 minutos. */
export function IdleLogout({ minutos = 30 }: { minutos?: number }) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void sair(), minutos * 60 * 1000);
    };
    EVENTOS.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      EVENTOS.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [minutos]);
  return null;
}
