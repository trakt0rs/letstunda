import { dayLabel, formatTime } from './lib/prices'
import type { ScheduleOption } from './lib/useSchedules'

function spanLabel(start: number, end: number) {
  const startDay = dayLabel(start)
  const endDay = dayLabel(end - 1)
  return (
    <>
      <span>
        {startDay} {formatTime(start)} –
      </span>{' '}
      <span>{endDay === startDay ? formatTime(end) : `${endDay} ${formatTime(end)}`}</span>
    </>
  )
}

type Props = {
  options: ScheduleOption[]
  className?: string
}

function OptionList({ options, className }: Props) {
  return (
    <ol className={className ? `option-rows ${className}` : 'option-rows'}>
      {options.map((option, rank) => {
        const start = option.windows[0].start
        const end = option.windows[option.windows.length - 1].end
        const span = end - start
        return (
          <li key={rank}>
            <span className="option-rank">{rank + 1}</span>
            <div className="option-main">
              <span className="option-time">{spanLabel(start, end)}</span>
              {option.windows.length > 1 && (
                <div className="option-sub">
                  <span className="option-timeline" aria-hidden="true">
                    {option.windows.map((w) => (
                      <i
                        key={w.start}
                        style={{ left: `${((w.start - start) / span) * 100}%`, width: `${((w.end - w.start) / span) * 100}%` }}
                      />
                    ))}
                  </span>
                  {option.windows.length} posmi
                </div>
              )}
            </div>
            <div className="option-side">
              <span className="option-cost">{option.cost.toFixed(2)} €</span>
              {option.rating === 'cheap' && <span className="chip-cheap">Lēti</span>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default OptionList
