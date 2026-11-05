import { Plug } from 'lucide-react'
import type { Device } from './lib/devices'
import { formatDuration } from './lib/format-properties.js'

type Props = {
  devices: Device[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function DeviceCards({ devices, selectedId, onSelect }: Props) {
  return (
    <section className="devices">
      <h2>My devices</h2>
      <div className="device-list">
        {devices.map((device) => (
          <button
            key={device.id}
            className={device.id === selectedId ? 'device-card selected' : 'device-card'}
            aria-pressed={device.id === selectedId}
            onClick={() => onSelect(device.id)}
          >
            <div className="device-title">
              <Plug size={28} strokeWidth={1.5} />
              <h3>{device.name}</h3>
            </div>
            <p className="device-meta">
              {formatDuration(device.durationMinutes)} · {device.powerKw} kW
            </p>
          </button>
        ))}
      </div>
    </section>
  )
}

export default DeviceCards
