import type {Device} from "./lib/devices.ts"
import { runWindowMinutes, type Schedule } from "./lib/schedule"
import { useState } from "react"
import { Plus } from "lucide-react"
import { formatDuration, windowLabel } from "./lib/format-properties.js"

const MAX_WINDOWS = 1

type Props = {
  devices: Device[]
  schedules: Map<string, Schedule | null>
  now: number
  updateDevice: (device: Device) => void
}

export function DevicesPage({ devices, schedules, now, updateDevice }: Props) {
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
          <button aria-hidden="true" tabIndex={-1}>Labot</button>
        </div>
        {devices.map(d => (<DeviceListElement
          key={d.id}
          device={d}
          schedule={schedules.get(d.id) ?? null}
          now={now}
          onToggleMenu={() => {
            setEditMenuOpen(d.id === editMenuOpen ? null : d.id)
          }
          }
        />
        ))}
      </div>
      {editedDevice && <EditMenu
        key={editedDevice.id}
        device={editedDevice}
        onClose={() => setEditMenuOpen(null)}
        onSave={updateDevice}
        schedule={schedules.get(editedDevice.id) ?? null}
        now={now}
      />}
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
      <button onClick={() => onToggleMenu()}>Labot</button>
    </div>
  )
}

type EditMenuProps = {
  device: Device
  onClose: () => void
  onSave: (device: Device) => void
  schedule: Schedule | null
  now: number
}

function formatInputField(value: string, fallback: number) {
  const n = Number(value)
  return isNaN(n) ? fallback : n
}

function EditMenu({ device, schedule, now, onClose, onSave }: EditMenuProps) {
  const [draft, setDraft] = useState(device)

  const shownWindows = !schedule ? [] :
    draft.splittable ? schedule.windows : schedule.windows.slice(0, 1)

  // The cycle is stored in minutes but edited as hours + minutes.
  const hours = Math.floor(draft.durationMinutes / 60)
  const minutes = draft.durationMinutes % 60

  // Both ends or neither, and the window must fit a whole cycle.
  const rangeError =
    !draft.runFrom !== !draft.runUntil ? "Norādi abus laikus" :
    draft.runFrom && draft.runUntil &&
      runWindowMinutes(draft.runFrom, draft.runUntil) < draft.durationMinutes ? "Īsāks par ciklu" :
    null

  return (
    <div className="edit-menu">
      <div className="edit-menu-header">
        <div className="edit-menu-title">Labot ierīces datus</div>
        <button className="edit-menu-close" onClick={onClose} aria-label="Close">×</button>
      </div>
      <div className="edit-menu-field-name">Nosaukums</div>
      <input className="edit-menu-input" value={draft.name} onChange=
        {e => setDraft({ ...draft, name: e.target.value })}></input>
      <div className="edit-menu-field-name">Jauda</div>
      <input className="edit-menu-input" value={draft.powerKw} onChange=
        {e => setDraft({ ...draft, powerKw: formatInputField(e.target.value, draft.powerKw) })}></input>
      <div className="edit-menu-field-name">Cikls</div>
      <div className="edit-menu-range">
        <input type="number" min={0} className="edit-menu-input" value={hours} onChange=
          {e => setDraft({ ...draft, durationMinutes: formatInputField(e.target.value, hours) * 60 + minutes })} />
        <span>h</span>
        <input type="number" min={0} max={59} className="edit-menu-input" value={minutes} onChange=
          {e => setDraft({ ...draft, durationMinutes: hours * 60 + formatInputField(e.target.value, minutes) })} />
        <span>min</span>
      </div>
      <div className="edit-menu-splittable-container">
        <div className="edit-menu-field-name">Vai dalāms?</div>
        <input type="checkbox"
          checked={draft.splittable}
          onChange={e => setDraft({ ...draft, splittable: e.target.checked })} />
      </div>
      <div className="edit-menu-field-name">Atļautais laiks</div>
      <div className="edit-menu-range">
        <input type="time" step={900} className="edit-menu-input" value={draft.runFrom ?? ""}
          onChange={e => setDraft({ ...draft, runFrom: e.target.value || null })} />
        <span>–</span>
        <input type="time" step={900} className="edit-menu-input" value={draft.runUntil ?? ""}
          onChange={e => setDraft({ ...draft, runUntil: e.target.value || null })} />
      </div>
      {rangeError && <div className="edit-menu-error">{rangeError}</div>}
      <div className="edit-menu-field-name">Darbības laiki</div>
      <div className="edit-menu-schedule-container">
        <div>{schedule ? (<div className="edit-menu-schedule-list">{shownWindows
          .map(w => <span key={w.start} className="edit-menu-schedule-entry">
            <div className="edit-menu-entry-text">{windowLabel(w, now)}</div>
          </span>)}
        </div>) :
          (<span>No Schedule</span>)}</div>

      </div>
      <div className="edit-menu-buttons">
        <button disabled={!!rangeError} onClick={() => { onSave(draft); onClose() }}>Saglabāt</button>
        <button onClick={() => { onClose() }}>Atcelt</button>
      </div>

    </div>
  )
}
