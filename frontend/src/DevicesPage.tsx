import { useEffect, useMemo, useState, type FormEvent } from "react"
import { ChevronDown, Pencil, Plug, Plus, Trash2, X } from "lucide-react"
import { Area, AreaChart, ReferenceArea, ResponsiveContainer, XAxis, YAxis } from "recharts"
import type { Device, NewDevice } from "./lib/devices.ts"
import type { ScheduleOption } from "./lib/useSchedules"
import { formatDuration } from "./lib/format-properties.js"
import { dayLabel, formatTime, type PricePoint } from "./lib/prices.ts"
import { usePrices } from "./lib/usePrices"
import OptionList from "./OptionList"

type Props = {
  devices: Device[]
  updateDevice: (device: Device) => void
  deleteDevice: (id: string) => void
  addDevice: (device: NewDevice) => void
  schedules: Map<string, ScheduleOption[]>
}

type Sheet = { mode: "add" } | { mode: "edit"; device: Device }

const EMPTY_DEVICE: NewDevice = {
  name: "",
  image: "",
  powerKw: 0,
  durationMinutes: 0,
  splittable: false,
  runFrom: null,
  runUntil: null,
}

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function intervalMinutes(from: string, until: string) {
  const diff = toMinutes(until) - toMinutes(from)
  return diff >= 0 ? diff : diff + 24 * 60
}

export function DevicesPage({ schedules, devices, updateDevice, deleteDevice, addDevice }: Props) {
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const { prices, now } = usePrices("upcoming")
  const upcoming = useMemo(() => prices.filter(p => p.end > now), [prices, now])

  function confirmDelete(device: Device) {
    if (!confirm(`Dzēst "${device.name}"?`)) return false
    deleteDevice(device.id)
    return true
  }

  return (
    <div className="devices-page">
      <header className="page-head">
        <div>
          <p className="market-label">Tavas ierīces</p>
          <div className="market-price">
            <strong>{devices.length}</strong>
            <span>{devices.length === 1 ? "ierīce" : "ierīces"}</span>
          </div>
        </div>
        <button className="button-primary" onClick={() => setSheet({ mode: "add" })}>
          <Plus size={18} strokeWidth={2.5} />
          Pievienot ierīci
        </button>
      </header>

      {devices.length === 0 ? (
        <div className="empty-card">
          <span className="empty-icon">
            <Plug size={28} strokeWidth={1.75} />
          </span>
          <h2>Vēl nav nevienas ierīces</h2>
          <p>Pievieno ierīci, un mēs atradīsim lētāko laiku tās darbināšanai.</p>
          <button className="button-primary" onClick={() => setSheet({ mode: "add" })}>
            <Plus size={18} strokeWidth={2.5} />
            Pievienot ierīci
          </button>
        </div>
      ) : (
        <div className="appliance-grid">
          {devices.map(device => (
            <ApplianceCard
              key={device.id}
              device={device}
              options={schedules.get(device.id)}
              prices={upcoming}
              onEdit={() => setSheet({ mode: "edit", device })}
              onDelete={() => confirmDelete(device)}
            />
          ))}
        </div>
      )}

      {sheet && (
        <DeviceSheet
          key={sheet.mode === "edit" ? sheet.device.id : "new"}
          initial={sheet.mode === "edit" ? sheet.device : EMPTY_DEVICE}
          title={sheet.mode === "edit" ? "Labot ierīci" : "Jauna ierīce"}
          submitLabel={sheet.mode === "edit" ? "Saglabāt" : "Pievienot"}
          onClose={() => setSheet(null)}
          onSave={draft => (sheet.mode === "edit" ? updateDevice({ ...sheet.device, ...draft }) : addDevice(draft))}
          onDelete={sheet.mode === "edit" ? () => confirmDelete(sheet.device) : undefined}
        />
      )}
    </div>
  )
}

type CardProps = {
  device: Device
  options: ScheduleOption[] | undefined
  prices: PricePoint[]
  onEdit: () => void
  onDelete: () => void
}

function ApplianceCard({ device, options, prices, onEdit, onDelete }: CardProps) {
  const [expanded, setExpanded] = useState(false)
  const best = options?.[0]
  const start = best?.windows[0].start

  return (
    <article className="appliance">
      <div className="appliance-top">
        <span className="device-avatar large">
          <Plug size={22} strokeWidth={2} />
        </span>
        <div className="appliance-title">
          <h3>{device.name}</h3>
          <span>
            {device.powerKw} kW · {formatDuration(device.durationMinutes)} ·{" "}
            {device.runFrom && device.runUntil ? `${device.runFrom}–${device.runUntil}` : "jebkad"}
          </span>
        </div>
        <div className="appliance-actions">
          <button className="icon-button" aria-label="Labot" title="Labot" onClick={onEdit}>
            <Pencil size={17} />
          </button>
          <button className="icon-button danger" aria-label="Dzēst" title="Dzēst" onClick={onDelete}>
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      <div className="appliance-best">
        <div>
          <strong className="appliance-time">{start !== undefined ? formatTime(start) : "—"}</strong>
          <span className="appliance-day">{start !== undefined ? dayLabel(start) : "Gaida cenas"}</span>
        </div>
        {best && (
          <div className="appliance-cost">
            <strong>{best.cost.toFixed(2)} €</strong>
            {best.rating === "cheap" && <span className="chip-cheap">Cheap</span>}
          </div>
        )}
      </div>

      <div className="spark">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={prices} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`spark-${device.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" type="number" scale="time" domain={["dataMin", "dataMax"]} hide />
            <YAxis hide domain={["dataMin - 0.02", "dataMax + 0.02"]} />
            {best?.windows.map(w => (
              <ReferenceArea key={w.start} x1={w.start} x2={w.end} ifOverflow="hidden" fill="var(--primary)" fillOpacity={0.16} stroke="none" />
            ))}
            <Area
              type="monotone"
              dataKey="price"
              stroke="var(--primary)"
              strokeWidth={2}
              fill={`url(#spark-${device.id})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="spark-axis">
        <span>Tagad</span>
        <span>{prices.length > 0 ? `${dayLabel(prices[prices.length - 1].end - 1)} ${formatTime(prices[prices.length - 1].end)}` : ""}</span>
      </div>

      {options && options.length > 1 && (
        <>
          <button className={expanded ? "appliance-toggle open" : "appliance-toggle"} onClick={() => setExpanded(!expanded)}>
            {expanded ? "Paslēpt" : options.length === 2 ? "Vēl 1 variants" : `Vēl ${options.length - 1} varianti`}
            <ChevronDown size={16} />
          </button>
          {expanded && <OptionList options={options} className="card-options" />}
        </>
      )}
    </article>
  )
}

type SheetProps = {
  initial: NewDevice
  title: string
  submitLabel: string
  onClose: () => void
  onSave: (device: NewDevice) => void
  onDelete?: () => boolean
}

function DeviceSheet({ initial, title, submitLabel, onClose, onSave, onDelete }: SheetProps) {
  const [draft, setDraft] = useState(initial)
  const [power, setPower] = useState(initial.powerKw ? String(initial.powerKw) : "")
  const [limited, setLimited] = useState(Boolean(initial.runFrom && initial.runUntil))
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  const hours = Math.floor(draft.durationMinutes / 60)
  const minutes = draft.durationMinutes % 60
  const powerKw = Number(power.replace(",", "."))

  const error =
    !draft.name.trim() ? "Ievadi ierīces nosaukumu" :
    !(powerKw > 0) ? "Ievadi jaudu kilovatos" :
    !(draft.durationMinutes > 0) ? "Ievadi cikla ilgumu" :
    limited && (!draft.runFrom || !draft.runUntil) ? "Norādi abus laikus" :
    limited && draft.runFrom && draft.runUntil && draft.durationMinutes > intervalMinutes(draft.runFrom, draft.runUntil)
      ? "Cikls neietilpst atļautajā laikā" :
    null

  function setLimitedWindow(on: boolean) {
    setLimited(on)
    if (on && !draft.runFrom && !draft.runUntil) setDraft({ ...draft, runFrom: "22:00", runUntil: "07:00" })
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (error) return
    onSave({
      ...draft,
      name: draft.name.trim(),
      powerKw,
      runFrom: limited ? draft.runFrom : null,
      runUntil: limited ? draft.runUntil : null,
    })
    onClose()
  }

  return (
    <div className="sheet-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <form className="sheet" role="dialog" aria-modal="true" aria-label={title} onSubmit={handleSubmit}>
        <header className="sheet-header">
          <h2>{title}</h2>
          <button type="button" className="icon-button" aria-label="Aizvērt" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <label className="field">
          <span>Nosaukums</span>
          <input
            autoFocus
            placeholder="Piem., veļasmašīna"
            value={draft.name}
            onChange={e => setDraft({ ...draft, name: e.target.value })}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Jauda</span>
            <div className="input-suffix">
              <input inputMode="decimal" placeholder="2,0" value={power} onChange={e => setPower(e.target.value)} />
              <em>kW</em>
            </div>
          </label>
          <div className="field">
            <span>Cikla ilgums</span>
            <div className="field-pair">
              <div className="input-suffix">
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  aria-label="Stundas"
                  value={hours || ""}
                  onChange={e => setDraft({ ...draft, durationMinutes: (Number(e.target.value) || 0) * 60 + minutes })}
                />
                <em>h</em>
              </div>
              <div className="input-suffix">
                <input
                  type="number"
                  min={0}
                  max={59}
                  placeholder="0"
                  aria-label="Minūtes"
                  value={minutes || ""}
                  onChange={e => setDraft({ ...draft, durationMinutes: hours * 60 + Math.min(59, Number(e.target.value) || 0) })}
                />
                <em>min</em>
              </div>
            </div>
          </div>
        </div>

        <div className="field">
          <span>Patēriņa veids</span>
          <div className="segmented full" role="radiogroup">
            <button
              type="button"
              role="radio"
              aria-checked={!draft.splittable}
              className={draft.splittable ? "" : "active"}
              onClick={() => setDraft({ ...draft, splittable: false })}
            >
              Nepārtraukts
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={draft.splittable}
              className={draft.splittable ? "active" : ""}
              onClick={() => setDraft({ ...draft, splittable: true })}
            >
              Dalāms
            </button>
          </div>
          <small>
            {draft.splittable
              ? "Var darboties ar pārtraukumiem, piem., auto uzlāde."
              : "Darbojas bez pārtraukuma no sākuma līdz beigām, piem., veļasmašīna."}
          </small>
        </div>

        <div className="field">
          <div className="switch-row">
            <span>Ierobežot darbības laiku</span>
            <button
              type="button"
              role="switch"
              aria-checked={limited}
              aria-label="Ierobežot darbības laiku"
              className={limited ? "switch on" : "switch"}
              onClick={() => setLimitedWindow(!limited)}
            />
          </div>
          {limited && (
            <div className="field-pair">
              <input
                type="time"
                step={900}
                aria-label="No"
                value={draft.runFrom ?? ""}
                onChange={e => setDraft({ ...draft, runFrom: e.target.value || null })}
              />
              <span className="field-dash">–</span>
              <input
                type="time"
                step={900}
                aria-label="Līdz"
                value={draft.runUntil ?? ""}
                onChange={e => setDraft({ ...draft, runUntil: e.target.value || null })}
              />
            </div>
          )}
        </div>

        {submitted && error && <p className="sheet-error">{error}</p>}

        <footer className="sheet-footer">
          {onDelete && (
            <button type="button" className="button-danger-text" onClick={() => onDelete() && onClose()}>
              <Trash2 size={17} />
              Dzēst
            </button>
          )}
          <button type="button" className="button-secondary" onClick={onClose}>
            Atcelt
          </button>
          <button type="submit" className="button-primary">
            {submitLabel}
          </button>
        </footer>
      </form>
    </div>
  )
}
