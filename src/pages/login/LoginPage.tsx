import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { errorMessage } from '../../api/errorMessage'
import Button from '../../components/Button'
import Field from '../../components/Field'
import Logo from '../../components/Logo'
import { LanguageSwitch, ThemeToggle } from '../../components/Preferences'
import { useToast } from '../../components/ToastProvider'
import { useAuth } from '../../hooks/useAuth'
import styles from './LoginPage.module.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default function LoginPage() {
  const { t } = useTranslation()
  const { status, me, access, signIn } = useAuth()
  const notify = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [alert, setAlert] = useState('')

  const from = (location.state as { from?: string } | null)?.from
  if (status === 'ready' && me && access) {
    return (
      <Navigate to={from ?? (access === 'referent' ? '/referent' : '/tableau-de-bord')} replace />
    )
  }

  const emailError =
    touched && !EMAIL_PATTERN.test(email.trim()) ? t('login.emailError') : undefined
  const passwordError = touched && !password ? t('login.passwordError') : undefined

  async function submit(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    setAlert('')
    if (!EMAIL_PATTERN.test(email.trim()) || !password) return
    setBusy(true)
    try {
      await signIn(email.trim(), password)
      notify(t('login.welcome'))
      navigate(from ?? '/tableau-de-bord', { replace: true })
    } catch (error) {
      setAlert(errorMessage(t, error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.login}>
      <div className={styles.tools}>
        <LanguageSwitch />
        <ThemeToggle />
      </div>
      <div className={styles.card}>
        <div className={styles.logo}>
          <Logo />
          <span className={styles.env}>admin</span>
        </div>
        <h1>{t('login.title')}</h1>
        <p className={styles.lead}>{t('login.lead')}</p>
        <div className={styles.box}>
          {alert && (
            <div className={styles.alert} role="alert">
              {alert}
            </div>
          )}
          <form onSubmit={submit} noValidate>
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
            <Button type="submit" variant="primary" block busy={busy} style={{ minHeight: 42 }}>
              {busy ? t('login.checking') : t('login.submit')}
            </Button>
          </form>
        </div>
        <p className={styles.foot}>{t('login.attempts')}</p>
      </div>
    </div>
  )
}
