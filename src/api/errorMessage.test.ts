import i18n from '../i18n'
import { ApiError } from './api'
import { errorMessage } from './errorMessage'

test('traduit le code connu et se replie sur le message générique', async () => {
  await i18n.changeLanguage('fr')
  const t = i18n.t.bind(i18n)
  expect(errorMessage(t, new ApiError(403, 'ACCOUNT_SUSPENDED'))).toBe('Ce compte est suspendu.')
  expect(errorMessage(t, new ApiError(500, 'CODE_INCONNU'))).toBe('Une erreur est survenue.')
  expect(errorMessage(t, new Error('x'))).toBe('Une erreur est survenue.')
})
