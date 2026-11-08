import { authClient } from './lib/auth-client'
import AuthPage from './AuthPage'
import MainScreen from './MainScreen'

function App() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) return null
  if (session) return <MainScreen user={session.user} />
  return <AuthPage />
}

export default App
