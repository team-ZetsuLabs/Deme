import { useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { errorMessage } from '../../api/errorMessage'
import Button from '../../components/Button'
import Field from '../../components/Field'
import Icon from '../../components/Icon'
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
  const [reveal, setReveal] = useState(false)
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
  const points = t('login.points', { returnObjects: true }) as string[]

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
    <div className={styles.page}>
      <aside
        className={styles.brand}
        style={{ '--logo-color': 'var(--brand-text)' } as CSSProperties}
      >
        <Logo height={36} />
        <div className={styles.pitch}>
          <h2>
            {t('login.brandTitle')} <span>{t('login.brandAccent')}</span>
          </h2>
          <p>{t('login.brandLead')}</p>
          <ul>
            {points.map((point) => (
              <li key={point}>
                <Icon name="check" size={16} />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.note}>
          <Icon name="shield" size={20} />
          <div>
            <p>{t('login.note')}</p>
            <small>{t('login.noteSource')}</small>
          </div>
        </div>
      </aside>

      <main className={styles.formSide}>
        <div className={styles.tools}>
          <LanguageSwitch />
          <ThemeToggle />
        </div>
        <div className={styles.card}>
          <h1>{t('login.greeting')}</h1>
          <p className={styles.lead}>{t('login.lead')}</p>
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
                  placeholder={t('login.emailPlaceholder')}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              )}
            </Field>
            <Field label={t('login.password')} error={passwordError}>
              {(control) => (
                <div className={styles.reveal}>
                  <input
                    {...control}
                    type={reveal ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={reveal ? t('login.hidePassword') : t('login.showPassword')}
                    aria-pressed={reveal}
                    onClick={() => setReveal((v) => !v)}
                  >
                    <Icon name={reveal ? 'eyeOff' : 'eye'} size={18} />
                  </button>
                </div>
              )}
            </Field>
            <Button type="submit" variant="primary" block busy={busy} style={{ minHeight: 44 }}>
              {busy ? t('login.checking') : t('login.submit')}
            </Button>
          </form>
          <p className={styles.attempts}>{t('login.attempts')}</p>
        </div>
        <p className={styles.footer}>{t('login.footer')}</p>
      </main>
    </div>
  )
}
