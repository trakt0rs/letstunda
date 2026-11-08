import { useState, type FormEvent } from 'react'
import { Zap } from 'lucide-react'
import { authClient } from './lib/auth-client'

type Mode = 'login' | 'register'

const AUTH_ERRORS: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'Nepareizs e-pasts vai parole',
  INVALID_EMAIL: 'E-pasta adrese nav pareizā formātā',
  USER_ALREADY_EXISTS: 'Konts ar šo e-pastu jau eksistē',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'Konts ar šo e-pastu jau eksistē',
  PASSWORD_TOO_SHORT: 'Parolei jābūt vismaz 8 rakstzīmes garai',
  PASSWORD_TOO_LONG: 'Parole ir pārāk gara',
}

function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (mode === 'register' && password !== confirmPassword) {
      setError('Paroles nesakrīt')
      return
    }
    setSubmitting(true)
    const { error } =
      mode === 'login'
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, password, name: email })
    setSubmitting(false)
    if (error) setError(AUTH_ERRORS[error.code ?? ''] ?? 'Kaut kas nogāja greizi. Mēģini vēlreiz.')
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
  }

  return (
    <main className="auth">
      <aside className="auth-panel">
        <div className="auth-brand">
          <span className="auth-mark">
            <Zap size={20} strokeWidth={2.25} />
          </span>
          Lētstunda
        </div>

        <div className="auth-pitch">
          <h2>Izmanto ierīces, kad elektrība ir lētākā.</h2>
          <p>Seko cenām ik pēc 15 minūtēm un atrod labāko laiku katrai tavai ierīcei.</p>
        </div>

        <svg className="auth-curve" viewBox="0 0 360 140" aria-hidden="true">
          <defs>
            <linearGradient id="authCurveFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect className="auth-curve-window" x="272" y="0" width="56" height="140" rx="6" />
          <path
            className="auth-curve-area"
            d="M0 62 C26 52 46 24 76 28 S126 84 156 88 S204 34 232 26 S282 106 300 112 S340 96 360 90 L360 140 L0 140 Z"
            fill="url(#authCurveFill)"
          />
          <path
            className="auth-curve-line"
            d="M0 62 C26 52 46 24 76 28 S126 84 156 88 S204 34 232 26 S282 106 300 112 S340 96 360 90"
            pathLength="1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            className="auth-curve-now"
            x1="118"
            y1="0"
            x2="118"
            y2="140"
            stroke="currentColor"
            strokeOpacity="0.35"
            strokeDasharray="4 5"
          />
          <circle cx="300" cy="112" r="5" className="auth-curve-pulse" />
          <circle cx="300" cy="112" r="5" className="auth-curve-dot" />
        </svg>
        <p className="auth-curve-label">
          <span className="auth-curve-swatch" />
          Lētākais laiks izcelts katrai ierīcei
        </p>
      </aside>

      <section className="auth-main">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="tabs" role="tablist">
            <span className={mode === 'register' ? 'tabs-pill right' : 'tabs-pill'} aria-hidden="true" />
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={mode === 'login' ? 'active' : ''}
              onClick={() => switchMode('login')}
            >
              Ienākt
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={mode === 'register' ? 'active' : ''}
              onClick={() => switchMode('register')}
            >
              Reģistrēties
            </button>
          </div>

          <div className="auth-heading">
            <h1>{mode === 'login' ? 'Sveicināts atpakaļ' : 'Izveido kontu'}</h1>
            <p>{mode === 'login' ? 'Ienāc, lai redzētu šodienas labākos laikus.' : 'Tas aizņems mazāk par minūti.'}</p>
          </div>

          <label className="auth-field">
            <span>E-pasts</span>
            <input
              type="email"
              autoComplete="email"
              placeholder="tu@piemers.lv"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="auth-field">
            <span>Parole</span>
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={mode === 'login' ? '••••••••' : 'Vismaz 8 rakstzīmes'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </label>
          {mode === 'register' && (
            <label className="auth-field">
              <span>Atkārto paroli</span>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Ievadi paroli vēlreiz"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </label>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {mode === 'login' ? 'Ienākt' : 'Izveidot kontu'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default AuthPage
