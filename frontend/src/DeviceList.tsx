import { ChevronDown, ChevronRight, Plug } from 'lucide-react'
import { NavLink } from 'react-router'
import type { Device } from './lib/devices'
import { formatDuration } from './lib/format-properties.js'
import { dayLabel, formatTime } from './lib/prices'
import type { ScheduleOption } from './lib/useSchedules'
import OptionList from './OptionList'

type Props = {
  devices: Device[]
  schedules: Map<string, ScheduleOption[]>
  selectedId: string | null
  onSelect: (id: string) => void
}

function DeviceList({ devices, schedules, selectedId, onSelect }: Props) {
  return (
    <section className="panel">
      <header className="panel-header">
        <h2>Ierīces</h2>
        <NavLink to="/devices" className="panel-link">
          Pārvaldīt
        </NavLink>
      </header>

      {devices.length === 0 ? (
        <p className="panel-empty">
          Vēl nav nevienas ierīces. <NavLink to="/devices">Pievieno pirmo</NavLink>
        </p>
      ) : (
        <ul className="device-rows">
          {devices.map((device) => {
            const options = schedules.get(device.id)
            const best = options?.[0]
            const selected = device.id === selectedId
            return (
              <li key={device.id} className={selected ? 'selected' : ''}>
                <button className="device-row" aria-expanded={selected} onClick={() => onSelect(device.id)}>
                  <span className="device-avatar">
                    <Plug size={18} strokeWidth={2} />
                  </span>
                  <span className="device-row-main">
                    <strong>{device.name}</strong>
                    <span>
                      {formatDuration(device.durationMinutes)} · {device.powerKw} kW
                    </span>
                  </span>
                  <span className="device-row-side">
                    {best ? (
                      <>
                        <strong>{formatTime(best.windows[0].start)}</strong>
                        <span>
                          {dayLabel(best.windows[0].start)} · {best.cost.toFixed(2)} €
                        </span>
                      </>
                    ) : (
                      <span>Gaida cenas</span>
                    )}
                  </span>
                  {selected ? (
                    <ChevronDown className="device-row-chevron" size={18} />
                  ) : (
                    <ChevronRight className="device-row-chevron" size={18} />
                  )}
                </button>

                {selected && options && options.length > 0 && <OptionList options={options} />}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default DeviceList
