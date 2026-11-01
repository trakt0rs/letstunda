import type {Device} from "./lib/devices.ts"
import { useState } from "react"
import { Plus } from "lucide-react"
import { formatDuration } from "./lib/format-properties.js"

type Props = {
  devices: Device[]
  updateDevice: (device: Device) => void
}

export function DevicesPage({ devices, updateDevice }: Props) {
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
          </div>
          {/* Invisible copy of the Edit button so the columns line up with the rows. */}
          <button aria-hidden="true" tabIndex={-1}>Labot</button>
        </div>
        {devices.map(d => (<DeviceListElement
          key={d.id}
          device={d}
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
      />}
    </>
  )
}

type DeviceElProps = {
  device: Device
  onToggleMenu: () => void
}

function DeviceListElement({ device, onToggleMenu }: DeviceElProps) {
  return (
    <div className="device-list-element">
      <div className="device-properties">
        <span>{device.name}</span>
        <span>{device.powerKw} kW</span>
        <span>{device.splittable ? "Dalāms" : "Nedalāms"}</span>
        <span>{formatDuration(device.durationMinutes)}</span>
      </div>
      <button onClick={() => onToggleMenu()}>Labot</button>
    </div>
  )
}

type EditMenuProps = {
  device: Device
  onClose: () => void
  onSave: (device: Device) => void
}

function formatInputField(value: string, fallback: number) {
  const n = Number(value)
  return isNaN(n) ? fallback : n
}

function EditMenu({ device, onClose, onSave }: EditMenuProps) {
  const [draft, setDraft] = useState(device)

  // The cycle is stored in minutes but edited as hours + minutes.
  const hours = Math.floor(draft.durationMinutes / 60)
  const minutes = draft.durationMinutes % 60

  const rangeError = !draft.runFrom !== !draft.runUntil ? "Norādi abus laikus" : null

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
      <div className="edit-menu-buttons">
        <button disabled={!!rangeError} onClick={() => { onSave(draft); onClose() }}>Saglabāt</button>
        <button onClick={() => { onClose() }}>Atcelt</button>
      </div>

    </div>
  )
}
