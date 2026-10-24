import { useEffect, useMemo, useRef, useState } from 'react'
import { authClient } from './lib/auth-client'
import { devices } from './lib/devices'
import { bestSchedule } from './lib/schedule'
import { usePrices } from './lib/usePrices'
import DeviceCards from './DeviceCards'
import PriceChart from './PriceChart'

type Props = {
  user: { email: string }
}

function MainScreen({ user }: Props) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)

  // Best run times per device; the selected device's times are highlighted on the chart.
  const { prices, now } = usePrices(0)
  const schedules = useMemo(
    () => new Map(devices.map((d) => [d.id, bestSchedule(prices, d, now)])),
    [prices, now],
  )
  const selectedWindows = selectedDeviceId ? schedules.get(selectedDeviceId)?.windows : undefined
  const highlight = selectedDeviceId && selectedWindows ? { id: selectedDeviceId, windows: selectedWindows } : null

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
        <PriceChart highlight={highlight} />
        <DeviceCards
          schedules={schedules}
          now={now}
          selectedId={selectedDeviceId}
          onSelect={(id) => setSelectedDeviceId(id === selectedDeviceId ? null : id)}
        />
      </main>
    </div>
  )
}

export default MainScreen
