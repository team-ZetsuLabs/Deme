import { useCallback, useState } from 'react';

/** Erreur d'un champ : une clé de traduction (règle client) ou un texte renvoyé par le serveur. */
export type FieldError = { key: string } | { text: string };

type Values = Record<string, string>;
type Validator<T extends Values> = (value: string, values: T) => string | null;
export type Validators<T extends Values> = Partial<Record<keyof T, Validator<T>>>;
export type FieldErrors<T extends Values> = Partial<Record<keyof T, FieldError>>;

/**
 * État d'un formulaire avec validation :
 * - au blur, seulement si le champ est rempli (pas d'erreur sur un champ qu'on traverse) ;
 * - pendant la saisie, seulement pour corriger un champ déjà en erreur ;
 * - à l'envoi, sur tous les champs.
 */
export function useValidatedForm<T extends Values>(initial: T, validators: Validators<T>) {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<FieldErrors<T>>({});

  const check = useCallback(
    (name: keyof T, vals: T): FieldError | undefined => {
      const key = validators[name]?.(vals[name], vals);
      return key ? { key } : undefined;
    },
    [validators],
  );

  const setValue = (name: keyof T, value: string) => {
    const next = { ...values, [name]: value };
    setValues(next);
    if (errors[name]) setErrors((e) => ({ ...e, [name]: check(name, next) }));
  };

  const onBlur = (name: keyof T) => {
    if (values[name]) setErrors((e) => ({ ...e, [name]: check(name, values) }));
  };

  /** Valide tout et renvoie les champs invalides, dans l'ordre du formulaire. */
  const validateAll = (): (keyof T)[] => {
    const next: FieldErrors<T> = {};
    for (const name of Object.keys(values) as (keyof T)[]) next[name] = check(name, values);
    setErrors(next);
    return (Object.keys(next) as (keyof T)[]).filter((name) => next[name]);
  };

  /** Erreurs de validation renvoyées par l'API (`fields`). */
  const setServerErrors = (fields: Record<string, string>) => {
    const next: FieldErrors<T> = {};
    for (const [name, text] of Object.entries(fields)) {
      if (text && name in values) next[name as keyof T] = { text };
    }
    setErrors((e) => ({ ...e, ...next }));
  };

  /** Remet toutes les valeurs d'un coup et efface les erreurs (bouton Annuler). */
  const reset = (next: T) => {
    setValues(next);
    setErrors({});
  };

  return { values, errors, setValue, onBlur, validateAll, setServerErrors, reset };
}
