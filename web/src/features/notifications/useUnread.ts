import { useContext } from 'react';
import { UnreadContext } from './unreadContext';

export function useUnread() {
  const ctx = useContext(UnreadContext);
  if (!ctx) throw new Error('useUnread doit être utilisé dans un UnreadProvider');
  return ctx;
}
