import type { Device, NewDevice } from "./lib/devices.ts"
import { useEffect, useRef, useState } from "react"
import { Plus, Trash2, X } from "lucide-react"
import type { ScheduleOption } from "./lib/useSchedules"
import { formatDuration } from "./lib/format-properties.js"
import { formatDay, formatTime } from "./lib/prices.ts"

type Props = {
  devices: Device[]
  updateDevice: (device: Device) => void
  deleteDevice: (id: string) => void
  addDevice: (device: NewDevice) => void
  schedules: Map<string, ScheduleOption[]>
}

export function DevicesPage({ schedules, devices, updateDevice, deleteDevice, addDevice }: Props) {
  const [editMenuOpen, setEditMenuOpen] = useState<string | null>(null)
  const editedDevice = devices.find(d => d.id === editMenuOpen)
  const [popupOpen, setPopupOpen] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)

  // Close the popup when clicking anywhere outside the + button and popup.
  useEffect(() => {
    if (!popupOpen) return
    function handleClick(e: MouseEvent) {
      if (!anchorRef.current?.contains(e.target as Node)) setPopupOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [popupOpen])

  return (
    <>
      <div className="devices-page-header">
        <h1>Manas ierīces</h1>
        <div className="add-device-anchor" ref={anchorRef}>
          <button className="add-device-btn" onClick={() => setPopupOpen(!popupOpen)}
            aria-label="Pievienot" title="Pievienot">
            <Plus size={18} />
          </button>
          {popupOpen && <AddDevicePopup
            onClose={() => setPopupOpen(false)}
            onSave={addDevice}
          />}
        </div>
      </div>
      <div className="device-page-device-list">
        <div className="device-list-element device-list-header">
          <div className="device-properties">
            <span>Nosaukums</span>
            <span>Jauda</span>
            <span>Patēriņa režīms</span>
            <span>Cikls</span>
            <span>Tuvākie darbības laiki</span>
          </div>
          {/* Invisible copy of the Edit button so the columns line up with the rows. */}
          <button aria-hidden="true" tabIndex={-1}>Labot</button>
          <button aria-hidden="true" tabIndex={-1}><Trash2 size={16} /></button>
        </div>
        {devices.map(d => (
          <DeviceListElement
            key={d.id}
            device={d}
            onToggleMenu={() => setEditMenuOpen(d.id === editMenuOpen ? null : d.id)}
            onDeleteDevice={() => deleteDevice(d.id)}
            options={schedules.get(d.id)}
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
  onDeleteDevice: () => void
  options: ScheduleOption[] | undefined
}

function DeviceListElement({ options, device, onToggleMenu, onDeleteDevice }: DeviceElProps) {
  const next = options?.flatMap(o => o.windows).sort((a, b) => a.start - b.start)[0]

  return (
    <div className="device-list-element">
      <div className="device-properties">
        <span>{device.name}</span>
        <span>{device.powerKw} kW</span>
        <span>{device.splittable ? "Dalāms" : "Nedalāms"}</span>
        <span>{formatDuration(device.durationMinutes)}</span>
        <span>
          {next
            ? `${formatDay(next.start)} ${formatTime(next.start)} - ${formatTime(next.end)}`
            : "-"}
        </span>
      </div>
      <button onClick={onToggleMenu}>Labot</button>
      <button aria-label="Dzēst" title="Dzēst" onClick={() => {
        if (confirm(`Dzēst "${device.name}"?`)) onDeleteDevice()
      }}>
        <Trash2 size={16} />
      </button>
    </div>
  )
}

function formatInputField(value: string, fallback: number) {
  const n = Number(value)
  return isNaN(n) ? fallback : n
}

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function intervalMinutes(from: string, until: string) {
  const diff = toMinutes(until) - toMinutes(from)
  return diff >= 0 ? diff : diff + 24 * 60
}

// Checks shared by the add popup and the edit menu.
function getErrors(draft: NewDevice) {
  const rangeError = !draft.runFrom !== !draft.runUntil ? "Norādi abus laikus" : null
  const durationMinutesError =
    draft.runFrom && draft.runUntil &&
    draft.durationMinutes > intervalMinutes(draft.runFrom, draft.runUntil)
      ? "Cikls neietilpst laikā"
      : null
  return { rangeError, durationMinutesError }
}

type AddPopupProps = {
  onClose: () => void
  onSave: (device: NewDevice) => void
}

function AddDevicePopup({ onClose, onSave }: AddPopupProps) {
  const [draft, setDraft] = useState<NewDevice>({
    name: "",
    image: "",
    powerKw: 0,
    durationMinutes: 0,
    splittable: false,
    runFrom: null,
    runUntil: null,
  })
  const [nameTouched, setNameTouched] = useState(false)

  // The cycle is stored in minutes but edited as hours + minutes.
  const hours = Math.floor(draft.durationMinutes / 60)
  const minutes = draft.durationMinutes % 60

  const nameError = !draft.name.trim() ? "Lūdzu ievadiet nosaukumu" : null
  const { rangeError, durationMinutesError } = getErrors(draft)

  return (
    <div className="add-device-popup">
      <div className="add-device-popup-header">
        <div className="add-device-popup-title">Jauna ierīce</div>
        <button className="add-device-popup-close" onClick={onClose} aria-label="Aizvērt">
          <X size={18} />
        </button>
      </div>

      <div className="edit-menu-field-name">Nosaukums</div>
      <input className="edit-menu-input"
        onChange={e => setDraft({ ...draft, name: e.target.value })}
        onBlur={() => setNameTouched(true)} />
      {nameTouched && nameError && <div className="edit-menu-error">{nameError}</div>}

      <div className="edit-menu-field-name">Jauda (kW)</div>
      <input className="edit-menu-input"
        onChange={e => setDraft({ ...draft, powerKw: formatInputField(e.target.value, draft.powerKw) })} />

      <div className="edit-menu-field-name">Cikls</div>
      <div className="edit-menu-range">
        <input type="number" min={0} className="edit-menu-input"
          onChange={e => setDraft({ ...draft, durationMinutes: formatInputField(e.target.value, hours) * 60 + minutes })} />
        <span>h</span>
        <input type="number" min={0} max={59} className="edit-menu-input"
          onChange={e => setDraft({ ...draft, durationMinutes: hours * 60 + formatInputField(e.target.value, minutes) })} />
        <span>min</span>
      </div>

      <div className="edit-menu-splittable-container">
        <div className="edit-menu-field-name">Vai patēriņš dalāms?</div>
        <input type="checkbox"
          onChange={e => setDraft({ ...draft, splittable: e.target.checked })} />
      </div>

      <div className="edit-menu-field-name">Atļautais laiks</div>
      <div className="edit-menu-range">
        <input type="time" step={900} className="edit-menu-input"
          onChange={e => setDraft({ ...draft, runFrom: e.target.value || null })} />
        <span>–</span>
        <input type="time" step={900} className="edit-menu-input"
          onChange={e => setDraft({ ...draft, runUntil: e.target.value || null })} />
      </div>
      {rangeError && <div className="edit-menu-error">{rangeError}</div>}
      {durationMinutesError && <div className="edit-menu-error">{durationMinutesError}</div>}

      <div className="edit-menu-buttons">
        <button disabled={!!nameError || !!rangeError || !!durationMinutesError}
          onClick={() => { onSave(draft); onClose() }}>Pievienot</button>
        <button onClick={onClose}>Atcelt</button>
      </div>
    </div>
  )
}

type EditMenuProps = {
  device: Device
  onClose: () => void
  onSave: (device: Device) => void
}

function EditMenu({ device, onClose, onSave }: EditMenuProps) {
  const [draft, setDraft] = useState(device)

  // The cycle is stored in minutes but edited as hours + minutes.
  const hours = Math.floor(draft.durationMinutes / 60)
  const minutes = draft.durationMinutes % 60

  const { rangeError, durationMinutesError } = getErrors(draft)

  return (
    <div className="edit-menu">
      <div className="edit-menu-header">
        <div className="edit-menu-title">Labot ierīces datus</div>
        <button className="edit-menu-close" onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className="edit-menu-field-name">Nosaukums</div>
      <input className="edit-menu-input" value={draft.name}
        onChange={e => setDraft({ ...draft, name: e.target.value })} />

      <div className="edit-menu-field-name">Jauda</div>
      <input className="edit-menu-input" value={draft.powerKw}
        onChange={e => setDraft({ ...draft, powerKw: formatInputField(e.target.value, draft.powerKw) })} />

      <div className="edit-menu-field-name">Cikls</div>
      <div className="edit-menu-range">
        <input type="number" min={0} className="edit-menu-input" value={hours}
          onChange={e => setDraft({ ...draft, durationMinutes: formatInputField(e.target.value, hours) * 60 + minutes })} />
        <span>h</span>
        <input type="number" min={0} max={59} className="edit-menu-input" value={minutes}
          onChange={e => setDraft({ ...draft, durationMinutes: hours * 60 + formatInputField(e.target.value, minutes) })} />
        <span>min</span>
      </div>

      <div className="edit-menu-splittable-container">
        <div className="edit-menu-field-name">Vai patēriņš dalāms?</div>
        <input type="checkbox" checked={draft.splittable}
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
      {durationMinutesError && <div className="edit-menu-error">{durationMinutesError}</div>}

      <div className="edit-menu-buttons">
        <button disabled={!!rangeError || !!durationMinutesError}
          onClick={() => { onSave(draft); onClose() }}>Saglabāt</button>
        <button onClick={onClose}>Atcelt</button>
      </div>
    </div>
  )
}
