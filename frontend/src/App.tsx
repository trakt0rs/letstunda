import { useState, type FormEvent } from 'react'
import { authClient } from './lib/auth-client'
import MainScreen from './MainScreen'

function App() {
  const { data: session, isPending } = authClient.useSession()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (isPending) return null

  if (session) return <MainScreen user={session.user} />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const { error } =
      mode === 'login'
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, password, name: email })
    if (error) setError(error.message ?? 'Something went wrong')
  }

  return (
    <main className="center">
      <form onSubmit={handleSubmit}>
        <h1>{mode === 'login' ? 'Login' : 'Register'}</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">{mode === 'login' ? 'Login' : 'Register'}</button>
        <button
          type="button"
          className="link"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'No account? Register' : 'Have an account? Login'}
        </button>
      </form>
    </main>
  )
}

export default App
