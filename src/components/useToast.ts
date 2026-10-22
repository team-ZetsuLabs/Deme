import { useContext } from 'react';
import { ToastContext } from './toastContext';

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans un ToastProvider');
  return ctx.show;
}
