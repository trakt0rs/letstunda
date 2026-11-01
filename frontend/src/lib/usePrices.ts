import { useEffect, useState } from 'react'
import { fetchPrices, type PricePoint, type PriceRange } from './prices'

const SLOT = 15 * 60_000

// Current time that updates at the start of every 15-minute price slot.
function useSlotClock() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timeout = setTimeout(() => setNow(Date.now()), SLOT - (Date.now() % SLOT) + 1000)
    return () => clearTimeout(timeout)
  }, [now])
  return now
}

// Refetches every slot, so tomorrow's prices appear once published and the day rolls over at midnight.
export function usePrices(range: PriceRange | null) {
  const [prices, setPrices] = useState<PricePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const now = useSlotClock()

  useEffect(() => {
    if (!range) return
    const controller = new AbortController()
    setError('')
    fetchPrices(range, controller.signal)
      .then(setPrices)
      .catch(() => {
        if (!controller.signal.aborted) setError('Could not load prices')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [range, now])

  return { prices, loading, error, now }
}
