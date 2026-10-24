import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { dailyAverages, formatDay, formatTime, rigaDate, rigaHour, type PricePoint } from './lib/prices'
import type { TimeWindow } from './lib/schedule'
import { usePrices } from './lib/usePrices'

// Today / Tomorrow: 15-minute prices for one day. 1d: daily averages for the last 30 days.
type View = 'today' | 'tomorrow' | '1d'

const VIEWS: { value: View; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: '1d', label: '1d' },
]

type Unit = 'MWh' | 'kWh'

const UNITS: Unit[] = ['MWh', 'kWh']

// Prices come in EUR/MWh; per kWh is 1000x smaller, so it gets more decimals.
const formatPrice = (mwh: number, unit: Unit) => (unit === 'MWh' ? mwh.toFixed(2) : (mwh / 1000).toFixed(4))

const HISTORY_DAYS = 30

type Props = {
  // Time windows to shade on the chart, e.g. the selected device's best run times.
  highlight: { id: string; windows: TimeWindow[] } | null
}

function PriceChart({ highlight }: Props) {
  const [view, setView] = useState<View>('today')
  const [unit, setUnit] = useState<Unit>('MWh')

  // Today and Tomorrow share the same data, so switching between them doesn't refetch.
  const { prices: raw, loading, error, now } = usePrices(view === '1d' ? HISTORY_DAYS : 0)

  const today = rigaDate(now)

  // When a new device is selected, jump to the day its first run window is on.
  const [highlightId, setHighlightId] = useState<string | null>(null)
  if ((highlight?.id ?? null) !== highlightId) {
    setHighlightId(highlight?.id ?? null)
    if (highlight && highlight.windows.length > 0) {
      setView(rigaDate(highlight.windows[0].start) === today ? 'today' : 'tomorrow')
    }
  }

  // Tomorrow's prices are fixed by the day-ahead auction and published around 14:00.
  const hasTomorrow = raw.some((p) => rigaDate(p.time) > today)
  const selectedView = view === 'tomorrow' && !hasTomorrow ? 'today' : view

  const points = useMemo(() => {
    if (selectedView === '1d') return dailyAverages(raw)
    return raw.filter((p) => (selectedView === 'today' ? rigaDate(p.time) === today : rigaDate(p.time) > today))
  }, [raw, selectedView, today])
  const ticks = useMemo(() => xTicks(points, selectedView), [points, selectedView])
  const current = raw.find((p) => p.time <= now && now < p.end)
  const dayAheadStart = selectedView === '1d' ? points.find((p) => rigaDate(p.time) > today)?.time : undefined

  return (
    <section className="prices">
      <div className="prices-header">
        <div>
          <h2>Electricity exchange price · LV</h2>
          {current && (
            <p className="prices-now">
              <strong>{formatPrice(current.price, unit)}</strong> €/{unit}
              <span>
                now, {formatTime(current.time)}–{formatTime(current.end)}
              </span>
            </p>
          )}
        </div>
        <div className="controls">
          <div className="segmented" role="group" aria-label="Unit">
            {UNITS.map((u) => (
              <button key={u} className={u === unit ? 'active' : ''} onClick={() => setUnit(u)}>
                €/{u}
              </button>
            ))}
          </div>
          <div className="segmented" role="group" aria-label="View">
            {VIEWS.map((v) => (
              <button
                key={v.value}
                className={v.value === selectedView ? 'active' : ''}
                onClick={() => setView(v.value)}
                disabled={v.value === 'tomorrow' && !loading && !hasTomorrow}
                title={v.value === 'tomorrow' && !hasTomorrow ? 'Published around 14:00' : undefined}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <p className="error">{error}</p>
      ) : (
        <div className={loading ? 'chart loading' : 'chart'}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2a78d6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#2a78d6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#e1e0d9" />
              <XAxis
                dataKey="time"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                ticks={ticks}
                tickFormatter={(t: number) => (selectedView === '1d' ? formatDay(t) : formatTime(t))}
                tick={{ fill: '#898781', fontSize: 12 }}
                stroke="#c3c2b7"
              />
              <YAxis
                width={unit === 'MWh' ? 44 : 56}
                tickFormatter={(v: number) => (unit === 'MWh' ? String(v) : String(Number((v / 1000).toFixed(4))))}
                tick={{ fill: '#898781', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => (
                  <PriceTooltip active={active} payload={payload} daily={selectedView === '1d'} unit={unit} />
                )}
              />
              {highlight?.windows.map((w) => (
                <ReferenceArea
                  key={w.start}
                  x1={w.start}
                  x2={w.end}
                  ifOverflow="hidden"
                  fill="#1baf7a"
                  fillOpacity={0.18}
                  stroke="none"
                />
              ))}
              <ReferenceLine x={now} stroke="#898781" strokeDasharray="4 4" />
              {dayAheadStart !== undefined && (
                <ReferenceLine
                  x={dayAheadStart}
                  stroke="#c3c2b7"
                  label={{ value: 'Day-ahead', position: 'insideTopLeft', fill: '#898781', fontSize: 12 }}
                />
              )}
              <Area
                type="monotone"
                dataKey="price"
                stroke="#2a78d6"
                strokeWidth={2}
                fill="url(#priceFill)"
                activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
          {!loading && points.length === 0 && <p className="empty">No prices available</p>}
        </div>
      )}
    </section>
  )
}

function PriceTooltip({
  active,
  payload,
  daily,
  unit,
}: {
  active?: boolean
  payload?: readonly { payload?: unknown }[]
  daily: boolean
  unit: Unit
}) {
  const point = payload?.[0]?.payload as PricePoint | undefined
  if (!active || !point) return null
  return (
    <div className="tooltip">
      <strong>
        {formatPrice(point.price, unit)} €/{unit}
      </strong>
      <span>
        {daily
          ? `${formatDay(point.time)}, daily average`
          : `${formatDay(point.time)} ${formatTime(point.time)}–${formatTime(point.end)}`}
      </span>
    </div>
  )
}

// One day: every 3 hours (Riga time). 1d: about 8 evenly spaced days.
function xTicks(points: PricePoint[], view: View) {
  if (view !== '1d') {
    return points
      .filter((p) => rigaHour(p.time) % 3 === 0 && new Date(p.time).getUTCMinutes() === 0)
      .map((p) => p.time)
  }
  const every = Math.ceil(points.length / 8)
  return points.filter((_, i) => i % every === 0).map((p) => p.time)
}

export default PriceChart
