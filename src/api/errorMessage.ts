import type { TFunction } from 'i18next'
import { ApiError } from './api'

/** Message traduit à partir du `code` stable de l'API, avec repli générique. */
export function errorMessage(t: TFunction, error: unknown): string {
  if (error instanceof ApiError) {
    return t(`errors.codes.${error.code}`, { defaultValue: t('common.error') })
  }
  return t('common.error')
}
