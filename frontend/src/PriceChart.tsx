import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Area, AreaChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { dailyAverages, dayLabel, formatDay, formatTime, type PricePoint } from './lib/prices'
import { usePrices } from './lib/usePrices'
import type { ScheduleOption } from './lib/useSchedules'

const formatPrice = (price: number) => price.toFixed(4)

type Props = {
  options: ScheduleOption[] | undefined
}

function PriceChart({ options }: Props) {
  const [showMonth, setShowMonth] = useState(false)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const upcoming = usePrices('upcoming')
  const month = usePrices(showMonth ? 'month' : null)
  const { prices, loading, error } = showMonth ? month : upcoming
  const { now } = upcoming

  const current = upcoming.prices.find((p) => p.time <= now && now < p.end)
  const points = useMemo(
    () => (showMonth ? dailyAverages(prices) : prices.filter((p) => p.end > now)),
    [prices, showMonth, now],
  )
  const average = points.length ? points.reduce((s, p) => s + p.price, 0) / points.length : 0
  const lowest = points.reduce<PricePoint | null>((min, p) => (!min || p.price < min.price ? p : min), null)
  const highest = points.reduce<PricePoint | null>((max, p) => (!max || p.price > max.price ? p : max), null)

  const hovered = hoverIndex !== null ? points[hoverIndex] : undefined
  const shown = hovered ?? (showMonth ? undefined : current)
  const delta = shown && average ? ((shown.price - average) / average) * 100 : null
  const shownOptions = showMonth ? undefined : options

  const pointLabel = (p: PricePoint) =>
    showMonth ? `${formatDay(p.time)} · dienas vidējā` : `${dayLabel(p.time, now)} · ${formatTime(p.time)}–${formatTime(p.end)}`

  return (
    <section className="market">
      <header className="market-header">
        <div>
          <p className="market-label">{shown ? (hovered ? pointLabel(shown) : 'Elektrības cena tagad') : '30 dienu vidējā'}</p>
          <div className="market-price">
            <strong>{formatPrice(shown ? shown.price : average)}</strong>
            <span>€/kWh</span>
          </div>
          {delta !== null ? (
            <span className={delta <= 0 ? 'market-delta down' : 'market-delta up'}>
              {delta <= 0 ? <ArrowDownRight size={16} strokeWidth={2.5} /> : <ArrowUpRight size={16} strokeWidth={2.5} />}
              {Math.abs(delta).toFixed(0)}% {delta <= 0 ? 'zem' : 'virs'} vidējās
            </span>
          ) : (
            <span className="market-delta placeholder" aria-hidden="true">
              <ArrowDownRight size={16} strokeWidth={2.5} />
              vidējās
            </span>
          )}
        </div>
        <div className="segmented" role="tablist">
          <button role="tab" aria-selected={!showMonth} className={showMonth ? '' : 'active'} onClick={() => setShowMonth(false)}>
            Šodien un rīt
          </button>
          <button role="tab" aria-selected={showMonth} className={showMonth ? 'active' : ''} onClick={() => setShowMonth(true)}>
            30 dienas
          </button>
        </div>
      </header>

      {error ? (
        <p className="error">{error}</p>
      ) : (
        <div className={loading ? 'market-chart loading' : 'market-chart'}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={points}
              margin={{ top: 16, right: 8, bottom: 0, left: 8 }}
              onMouseMove={(state) => {
                const index = Number(state.activeTooltipIndex)
                setHoverIndex(Number.isFinite(index) ? index : null)
              }}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <defs>
                <linearGradient id="marketFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                minTickGap={64}
                tickFormatter={(t: number) => (showMonth ? formatDay(t) : formatTime(t))}
                tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                dy={8}
              />
              <YAxis hide domain={['dataMin - 0.02', 'dataMax + 0.02']} />
              <Tooltip content={() => null} cursor={{ stroke: 'var(--text-muted)', strokeWidth: 1, strokeDasharray: '3 3' }} />
              {shownOptions?.flatMap((option, rank) =>
                option.windows.map((w) => (
                  <ReferenceArea
                    key={`${rank}-${w.start}`}
                    x1={w.start}
                    x2={w.end}
                    ifOverflow="hidden"
                    fill="var(--primary)"
                    fillOpacity={rank === 0 ? 0.12 : 0.06}
                    stroke="none"
                    label={{ value: rank + 1, position: 'insideTop', fill: 'var(--primary)', fontSize: 12, fontWeight: 800 }}
                  />
                )),
              )}
              <Area
                type="monotone"
                dataKey="price"
                stroke="var(--primary)"
                strokeWidth={2.5}
                fill="url(#marketFill)"
                dot={false}
                activeDot={{ r: 6, fill: 'var(--primary)', stroke: 'var(--surface)', strokeWidth: 3 }}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
          {!loading && points.length === 0 && <p className="market-empty">Cenas nav pieejamas</p>}
        </div>
      )}

      <div className="market-stats">
        <Stat label="Zemākā" point={lowest} caption={lowest && pointLabel(lowest)} />
        <Stat label="Augstākā" point={highest} caption={highest && pointLabel(highest)} />
        <div className="stat">
          <span>Vidējā</span>
          <strong>{formatPrice(average)}</strong>
          <small>{showMonth ? 'Pēdējās 30 dienas' : 'Šodien un rīt'}</small>
        </div>
      </div>
    </section>
  )
}

function Stat({ label, point, caption }: { label: string; point: PricePoint | null; caption: string | null }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{point ? formatPrice(point.price) : '—'}</strong>
      <small>{caption ?? ' '}</small>
    </div>
  )
}

export default PriceChart
