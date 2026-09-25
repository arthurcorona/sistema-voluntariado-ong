import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/*
 * Campo transparente com borda fina; o acento aparece no foco.
 * data-sugestao: valor lido do arquivo, ainda não conferido (RF022) — borda
 * esquerda grossa e fundo claro no acento, distinto do digitado.
 */
export const inputClass =
  'min-h-9 w-full rounded-md border border-divider bg-transparent px-2.5 py-1.5 text-sm text-ink caret-accent-500 ' +
  'placeholder:text-neutral-600 hover:border-ink/45 focus:border-accent-500 focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:opacity-60 ' +
  'aria-[invalid=true]:border-danger-500 aria-[invalid=true]:bg-danger-50 ' +
  'data-[sugestao=true]:border-l-[3px] data-[sugestao=true]:border-l-accent-500 data-[sugestao=true]:bg-accent-100';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} {...rest} className={cn(inputClass, className)} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <select ref={ref} {...rest} className={cn(inputClass, 'pr-8', className)}>
      {children}
    </select>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return <textarea ref={ref} {...rest} className={cn(inputClass, 'min-h-[72px] resize-y', className)} />;
  },
);
