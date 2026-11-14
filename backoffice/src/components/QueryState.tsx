import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { errorMessage } from '../api/errorMessage'
import type { Query } from '../api/useQuery'
import StateMessage from './StateMessage'

export type QueryStateProps<T> = {
  query: Query<T>
  /** Vrai quand la réponse est vide : affiche l'état « liste vide » fourni par l'écran. */
  isEmpty?: (data: T) => boolean
  empty?: ReactNode
  children: (data: T) => ReactNode
}

/** Chaque appel réseau a trois états visibles : chargement, erreur (message traduit), liste vide. */
export default function QueryState<T>({ query, isEmpty, empty, children }: QueryStateProps<T>) {
  const { t } = useTranslation()
  if (query.error && query.data === undefined) {
    return (
      <StateMessage kind="error" message={errorMessage(t, query.error)} onRetry={query.reload} />
    )
  }
  if (query.data === undefined) return <StateMessage kind="loading" />
  if (isEmpty?.(query.data)) return <>{empty ?? <StateMessage kind="empty" />}</>
  return <>{children(query.data)}</>
}
