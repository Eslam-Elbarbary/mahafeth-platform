import { createContext, useContext } from 'react';

export type ToastTone = 'success' | 'error' | 'info';
export type ToastInput = { title: string; description?: string; tone?: ToastTone };

export const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

/** `toast({ title, description?, tone? })` — transient feedback in the corner of the screen. */
export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error('useToast must be used inside <Toaster>');
  return toast;
}
