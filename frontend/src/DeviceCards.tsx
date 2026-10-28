import type {Device} from './lib/devices'
import { formatTime, rigaDate } from './lib/prices'
import type { Schedule, TimeWindow } from './lib/schedule'

const MAX_WINDOWS = 3

type Props = {
  schedules: Map<string, Schedule | null>
  now: number
  selectedId: string | null
  // Called with the clicked device; clicking the selected one again should deselect it.
  onSelect: (id: string) => void
  devices: Device[]
}

function DeviceCards({ schedules, now, selectedId, onSelect, devices }: Props) {
  return (
    <section className="devices">
      <h2>My devices</h2>
      <div className="device-list">
        {devices.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            schedule={schedules.get(device.id) ?? null}
            now={now}
            selected={device.id === selectedId}
            onSelect={() => onSelect(device.id)}
          />
        ))}
      </div>
    </section>
  )
}

type DeviceCardProps = {
  device: Device
  schedule: Schedule | null
  now: number
  selected: boolean
  onSelect: () => void
}

function DeviceCard({ device, schedule, now, selected, onSelect }: DeviceCardProps) {
  const hidden = schedule ? schedule.windows.length - MAX_WINDOWS : 0

  return (
    <article
      className={selected ? 'device-card selected' : 'device-card'}
      role="button"
      tabIndex={schedule ? 0 : -1}
      aria-pressed={selected}
      aria-disabled={!schedule}
      onClick={schedule ? onSelect : undefined}
      onKeyDown={(e) => {
        if (schedule && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      <div className="device-title">
        <img src={device.image} alt="" width={40} height={40} />
        <h3>{device.name}</h3>
      </div>

      {schedule ? (
        <>
          <ul className="device-windows">
            {schedule.windows.slice(0, MAX_WINDOWS).map((w) => (
              <li key={w.start}>{windowLabel(w, now)}</li>
            ))}
            {hidden > 0 && <li className="device-more">+{hidden} more</li>}
          </ul>
          <p className="device-meta">
            {formatDuration(device.durationMinutes)} · {formatKwh(schedule.energyKwh)} kWh
          </p>
          <p className="device-cost">
            ≈ {schedule.cost.toFixed(2)} €<span>exchange price only</span>
          </p>
        </>
      ) : (
        <p className="device-meta">Not enough prices yet. Tomorrow's are published around 14:00.</p>
      )}
    </article>
  )
}

function windowLabel(w: TimeWindow, now: number) {
  const day = rigaDate(w.start) === rigaDate(now) ? 'Today' : 'Tomorrow'
  return `${day} ${formatTime(w.start)}–${formatTime(w.end)}`
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

const formatKwh = (kwh: number) => String(Number(kwh.toFixed(1)))

export default DeviceCards
