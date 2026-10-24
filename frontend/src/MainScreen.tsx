import { useEffect, useRef, useState } from 'react'
import { authClient } from './lib/auth-client'
import PriceChart from './PriceChart'

type Props = {
  user: { email: string }
}

function MainScreen({ user }: Props) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <>
      <nav className="navbar">
        <span className="logo">Lētstunda</span>
        <div className="profile" ref={dropdownRef}>
          <button className="profile-button" onClick={() => setOpen(!open)}>
            <span className="avatar">{user.email[0].toUpperCase()}</span>
            {user.email}
          </button>
          {open && (
            <div className="dropdown">
              <button onClick={() => authClient.signOut()}>Logout</button>
            </div>
          )}
        </div>
      </nav>
      <main className="content">
        <PriceChart />
      </main>
    </>
  )
}

export default MainScreen
