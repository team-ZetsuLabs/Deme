import type { TFunction } from 'i18next'
import { ApiError } from './api'

/**
 * Message traduit à partir du `code` stable de l'API. Sans traduction, on affiche le message
 * du serveur (déjà rédigé en français), puis le message générique.
 */
export function errorMessage(t: TFunction, error: unknown): string {
  if (error instanceof ApiError) {
    const generic =
      error.message && error.message !== error.code ? error.message : t('common.error')
    return t(`errors.codes.${error.code}`, { defaultValue: generic })
  }
  return t('common.error')
}
