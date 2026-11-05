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
import { dailyAverages, formatDay, formatTime, type PricePoint } from './lib/prices'
import { usePrices } from './lib/usePrices'
import type { ScheduleOption } from './lib/useSchedules'

const formatPrice = (price: number) => price.toFixed(4)

const OPTION_OPACITY = [0.35, 0.26, 0.19, 0.13, 0.08]

type Props = {
  options: ScheduleOption[] | undefined
}

function PriceChart({ options }: Props) {
  const [showMonth, setShowMonth] = useState(false)
  const upcoming = usePrices('upcoming')
  const month = usePrices(showMonth ? 'month' : null)
  const { prices, loading, error } = showMonth ? month : upcoming
  const { now } = upcoming

  const points = useMemo(() => (showMonth ? dailyAverages(prices) : prices), [prices, showMonth])
  const current = upcoming.prices.find((p) => p.time <= now && now < p.end)

  return (
    <section className="prices">
      <div className="prices-header">
        <div>
          <h2>Electricity exchange price · LV</h2>
          {current && (
            <p className="prices-now">
              <strong>{formatPrice(current.price)}</strong> €/kWh
              <span>
                now, {formatTime(current.time)}–{formatTime(current.end)}
              </span>
            </p>
          )}
        </div>
        <div className="controls">
          <div className="segmented" role="group" aria-label="View">
            <button className={showMonth ? '' : 'active'} onClick={() => setShowMonth(false)}>
              Now & upcoming
            </button>
            <button className={showMonth ? 'active' : ''} onClick={() => setShowMonth(true)}>
              1 month
            </button>
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
                minTickGap={40}
                tickFormatter={(t: number) => (showMonth ? formatDay(t) : formatTime(t))}
                tick={{ fill: '#898781', fontSize: 12 }}
                stroke="#c3c2b7"
              />
              <YAxis
                width={56}
                tick={{ fill: '#898781', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => <PriceTooltip active={active} payload={payload} daily={showMonth} />}
              />
              {!showMonth &&
                options?.flatMap((option, rank) =>
                  option.windows.map((w) => (
                    <ReferenceArea
                      key={`${rank}-${w.start}`}
                      x1={w.start}
                      x2={w.end}
                      ifOverflow="hidden"
                      fill="#1baf7a"
                      fillOpacity={OPTION_OPACITY[rank]}
                      stroke="none"
                      label={{ value: rank + 1, position: 'insideTop', fill: '#0e7a52', fontSize: 12 }}
                    />
                  )),
                )}
              {!showMonth && <ReferenceLine x={now} stroke="#898781" strokeDasharray="4 4" />}
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

      {!showMonth && options && (
        options.length === 0 ? (
          <p className="schedule-none">No run fits the known prices yet</p>
        ) : (
          <ol className="schedule-options">
            {options.map((option, rank) => (
              <li key={rank}>
                <span className="schedule-rank">{rank + 1}</span>
                <span className="schedule-times">
                  {option.windows.map((w) => `${formatDay(w.start)} ${formatTime(w.start)}–${formatTime(w.end)}`).join(', ')}
                </span>
                <strong>{option.cost.toFixed(2)} €</strong>
                {option.rating && <span className={`schedule-rating ${option.rating}`}>{option.rating}</span>}
              </li>
            ))}
          </ol>
        )
      )}
    </section>
  )
}

function PriceTooltip({
  active,
  payload,
  daily,
}: {
  active?: boolean
  payload?: readonly { payload?: unknown }[]
  daily: boolean
}) {
  const point = payload?.[0]?.payload as PricePoint | undefined
  if (!active || !point) return null
  return (
    <div className="tooltip">
      <strong>{formatPrice(point.price)} €/kWh</strong>
      <span>
        {daily
          ? `${formatDay(point.time)}, daily average`
          : `${formatDay(point.time)} ${formatTime(point.time)}–${formatTime(point.end)}`}
      </span>
    </div>
  )
}

export default PriceChart
