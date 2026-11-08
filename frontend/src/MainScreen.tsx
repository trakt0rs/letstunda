import { useState } from 'react'
import { LayoutGrid, LogOut, Plug, Zap } from 'lucide-react'
import { NavLink, Route, Routes } from 'react-router'
import { authClient } from './lib/auth-client'
import { useDevices } from './lib/useDevices'
import { useSchedules } from './lib/useSchedules'
import PriceChart from './PriceChart'
import DeviceList from './DeviceList'
import { DevicesPage } from './DevicesPage'

type Props = {
  user: { email: string }
}

function MainScreen({ user }: Props) {
  const { devices, updateDevice, deleteDevice, addDevice } = useDevices()
  const schedules = useSchedules(devices)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="logo-mark">
            <Zap size={16} strokeWidth={2.25} />
          </span>
          Lētstunda
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className="sidebar-link">
            <LayoutGrid size={18} strokeWidth={2} />
            <span>Pārskats</span>
          </NavLink>
          <NavLink to="/devices" className="sidebar-link">
            <Plug size={18} strokeWidth={2} />
            <span>Ierīces</span>
          </NavLink>
        </nav>
        <div className="sidebar-account">
          <span className="avatar">{user.email[0].toUpperCase()}</span>
          <span className="sidebar-email">{user.email}</span>
          <button className="icon-button" aria-label="Iziet" title="Iziet" onClick={() => authClient.signOut()}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="main">
        <Routes>
          <Route
            path="/"
            element={
              <div className="overview">
                <PriceChart options={selectedId ? schedules.get(selectedId) : undefined} />
                <DeviceList
                  devices={devices}
                  schedules={schedules}
                  selectedId={selectedId}
                  onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
                />
              </div>
            }
          />
          <Route
            path="/devices"
            element={
              <div className="page">
                <DevicesPage
                  devices={devices}
                  updateDevice={updateDevice}
                  deleteDevice={deleteDevice}
                  addDevice={addDevice}
                  schedules={schedules}
                />
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export default MainScreen
