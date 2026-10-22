import type { TFunction } from 'i18next';
import type { FieldError } from './useValidatedForm';

export function fieldErrorText(t: TFunction, error?: FieldError): string | null {
  if (!error) return null;
  return 'key' in error ? t(error.key) : error.text;
}
