import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../components/Button'
import Field from '../../components/Field'
import Logo from '../../components/Logo'
import { LanguageSwitch, ThemeToggle } from '../../components/Preferences'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../components/ToastProvider'
import { useAdminStore } from '../../features/admin/AdminStore'
import styles from './LoginPage.module.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type Step = 'credentials' | 'otp'

export default function LoginPage() {
  const { t } = useTranslation()
  const { loggedIn, signIn } = useAuth()
  const { currentAdmin } = useAdminStore()
  const notify = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [step, setStep] = useState<Step>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [alert, setAlert] = useState('')
  const alertRef = useRef<HTMLDivElement>(null)

  const from = (location.state as { from?: string } | null)?.from ?? '/tableau-de-bord'
  if (loggedIn) return <Navigate to={from} replace />

  const emailError =
    touched && !EMAIL_PATTERN.test(email.trim()) ? t('login.emailError') : undefined
  const passwordError = touched && !password ? t('login.passwordError') : undefined
  const otpError = touched && !/^\d{6}$/.test(otp) ? t('login.otpError') : undefined

  async function submitCredentials(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    setAlert('')
    if (!EMAIL_PATTERN.test(email.trim()) || !password) return
    setBusy(true)
    await pause(500)
    setBusy(false)
    setTouched(false)
    setStep('otp')
  }

  async function submitOtp(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    setAlert('')
    if (!/^\d{6}$/.test(otp)) return
    setBusy(true)
    await pause(500)
    setBusy(false)
    signIn()
    notify(t('login.welcome', { name: currentAdmin.name.split(' ')[0] }))
    navigate(from, { replace: true })
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
        <h1>{step === 'credentials' ? t('login.title') : t('login.otpTitle')}</h1>
        <p className={styles.lead}>
          {step === 'credentials' ? t('login.lead') : t('login.otpLead')}
        </p>
        <div className={styles.box}>
          {alert && (
            <div className={styles.alert} role="alert" tabIndex={-1} ref={alertRef}>
              {alert}
            </div>
          )}
          {step === 'credentials' ? (
            <form onSubmit={submitCredentials} noValidate>
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
                {busy ? t('login.checking') : t('login.continue')}
              </Button>
            </form>
          ) : (
            <form onSubmit={submitOtp} noValidate>
              <Field label={t('login.otp')} hint={t('login.otpHint')} error={otpError}>
                {(control) => (
                  <input
                    {...control}
                    className={`${control.className} ${styles.otp}`}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                )}
              </Field>
              <Button type="submit" variant="primary" block busy={busy} style={{ minHeight: 42 }}>
                {busy ? t('login.checking') : t('login.verify')}
              </Button>
              <Button
                variant="ghost"
                block
                style={{ marginTop: 8 }}
                onClick={() => {
                  setStep('credentials')
                  setOtp('')
                  setTouched(false)
                }}
              >
                {t('login.back')}
              </Button>
            </form>
          )}
        </div>
        <p className={styles.foot}>{t('login.demoNote')}</p>
      </div>
    </div>
  )
}
