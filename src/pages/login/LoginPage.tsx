import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button'
import Field from '../../components/Field'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const emailError = submitted && !email.includes('@') ? t('login.emailError') : undefined
  const passwordError = submitted && password.length === 0 ? t('login.passwordError') : undefined

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (email.includes('@') && password.length > 0) navigate('/reports')
  }

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit} noValidate>
        <div>
          <p className={styles.brand}>Zetsu</p>
          <h1 className={styles.title}>{t('login.title')}</h1>
          <p className={styles.intro}>{t('login.intro')}</p>
        </div>
        <Field label={t('login.email')} error={emailError}>
          {(control) => (
            <input
              {...control}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          )}
        </Field>
        <Field label={t('login.password')} error={passwordError}>
          {(control) => (
            <input
              {...control}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          )}
        </Field>
        <Button type="submit" variant="primary">
          {t('login.submit')}
        </Button>
        <p className={styles.note}>{t('login.note')}</p>
      </form>
    </main>
  )
}
