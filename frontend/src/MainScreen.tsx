import { useEffect, useRef, useState } from 'react'
import { authClient } from './lib/auth-client'
import { useDevices } from './lib/useDevices'
import { useSchedules } from './lib/useSchedules'
import DeviceCards from './DeviceCards'
import PriceChart from './PriceChart'
import { Routes, Route, NavLink } from 'react-router'
import { DevicesPage } from './DevicesPage'

type Props = {
  user: { email: string }
}

function MainScreen({ user }: Props) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { devices, updateDevice, deleteDevice, addDevice } = useDevices();
  const schedules = useSchedules(devices)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-left">
          <span className="logo">Lētstunda</span>
          <NavLink to="/" end className="nav-link">Pārskats</NavLink>
          <NavLink to="/devices" className="nav-link">Ierīces</NavLink>
        </div>
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
        <Routes>
          <Route path="/" element={<>
            <PriceChart options={selectedId ? schedules.get(selectedId) : undefined} />
            <DeviceCards
              devices={devices}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
            />
          </>} />
          <Route path="/devices" element={<DevicesPage
            devices={devices}
            updateDevice={updateDevice}
            deleteDevice={deleteDevice}
            addDevice={addDevice}
          />} />
        </Routes>
      </main>
    </div>
  )
}

export default MainScreen
