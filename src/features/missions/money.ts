import type { Budget } from '../../api/types';

/** Monnaies proposées pour un budget indicatif, la première par défaut. */
export const CURRENCIES = ['XOF', 'XAF', 'GHS', 'NGN', 'KES', 'MAD', 'EUR'];

/** « 75 000 F CFA », dans la langue de l'interface. */
export function formatMoney(money: Budget, language: string): string {
  try {
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency: money.currency,
      maximumFractionDigits: 0,
    }).format(money.amount);
  } catch {
    return `${money.amount.toLocaleString(language)} ${money.currency}`;
  }
}
