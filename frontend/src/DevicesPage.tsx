import type {Device} from "./lib/devices.ts"
import type { Schedule } from "./lib/schedule"
import { useState } from "react"
import { Plus } from "lucide-react"
import {formatDuration, windowLabel} from "./lib/format-properties.js"

const MAX_WINDOWS = 1

type Props = {
  devices: Device[]
  schedules: Map<string, Schedule | null>
  now: number
}

export function DevicesPage({ devices, schedules, now }: Props) {
  const [editMenuOpen, setEditMenuOpen] = useState<string | null>(null)
  const editedDevice = devices.find(d => d.id === editMenuOpen)

  return (
    <>
      <div className="devices-page-header">
        <h1>My Devices</h1>
        <button className="add-device-btn" aria-label="Pievienot" title="Pievienot">
          <Plus size={18} />
        </button>
      </div>
      <div className="device-page-device-list">
        <div className="device-list-element device-list-header">
          <div className="device-properties">
            <span>Nosaukums</span>
            <span>Jauda</span>
            <span>Dalāms</span>
            <span>Cikls</span>
            <span>Darbības laiki</span>
          </div>
          {/* Invisible copy of the Edit button so the columns line up with the rows. */}
          <button aria-hidden="true" tabIndex={-1}>Rediģēt</button>
        </div>
        {devices.map(d => (<DeviceListElement
          key={d.id}
          device={d}
          schedule={schedules.get(d.id) ?? null}
          now={now}
          onToggleMenu={() => setEditMenuOpen(d.id === editMenuOpen ? null : d.id)}
        />
        ))}
      </div>
      {editedDevice && <EditMenu device={editedDevice} onClose={() => setEditMenuOpen(null)} />}
    </>
  )
}

type DeviceElProps = {
  device: Device
  schedule: Schedule | null
  now: number
  onToggleMenu: () => void
}

function DeviceListElement({ device, schedule, now, onToggleMenu }: DeviceElProps) {
  const [expanded, setExpand] = useState(false)

  const visible = !schedule ? [] : expanded ? schedule.windows :
    schedule.windows.slice(0, MAX_WINDOWS)

  const hidden = schedule ? schedule.windows.length - MAX_WINDOWS : 0

  return (
    <div className="device-list-element">
      <div className="device-properties">
        <span>{device.name}</span>
        <span>{device.powerKw} kW</span>
        <span>{device.splittable ? "Dalāms" : "Nedalāms"}</span>
        <span>{formatDuration(device.durationMinutes)}</span>
        {schedule ? (
          <div className="schedules-field" onClick={() => setExpand(!expanded)}>
            <div className="schedule-entries">{
              visible.map((w) => (
                <span key={w.start}>{windowLabel(w, now)}</span>
              ))}
            </div>
            {hidden > 0 && <div className="device-more">{expanded ? "show less" :
              `expand (${schedule.windows.length})`}</div>}
          </div>
        ) : (
            <span>No Schedule</span>
        )}

      </div>
      <button onClick={() => onToggleMenu()}>Rediģēt</button>
    </div>
  )
}

type EditMenuProps = {
  device: Device
  onClose: () => void
}

function EditMenu({ device, onClose }: EditMenuProps) {
  return (
    <div className="edit-menu">
      <div className="edit-menu-header">
        <div className="edit-menu-title">Edit Menu</div>
        <button className="edit-menu-close" onClick={onClose} aria-label="Close">×</button>
      </div>
      <div className="edit-menu-device-name">{device.name}</div>
    </div>
  )
}
