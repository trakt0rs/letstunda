import { Plug } from 'lucide-react'
import type { Device } from './lib/devices'
import { formatDuration } from './lib/format-properties.js'

type Props = {
  devices: Device[]
}

function DeviceCards({ devices }: Props) {
  return (
    <section className="devices">
      <h2>My devices</h2>
      <div className="device-list">
        {devices.map((device) => (
          <article key={device.id} className="device-card">
            <div className="device-title">
              <Plug size={28} strokeWidth={1.5} />
              <h3>{device.name}</h3>
            </div>
            <p className="device-meta">
              {formatDuration(device.durationMinutes)} · {device.powerKw} kW
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default DeviceCards
