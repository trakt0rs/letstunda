import { useEffect, useState } from "react"
import type { Device } from "./devices"

export type ScheduleOption = {
  windows: { start: number; end: number }[]
  energyKwh: number
  avgPrice: number
  cost: number
  rating: "cheap" | "normal" | "expensive" | null
}

export function useSchedules(devices: Device[]) {
  const [schedules, setSchedules] = useState(new Map<string, ScheduleOption[]>())

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/schedules", { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then((res: { deviceId: string; options: ScheduleOption[] }[]) =>
        setSchedules(new Map(res.map(s => [s.deviceId, s.options]))))
      .catch(() => {})
    return () => controller.abort()
  }, [devices])

  return schedules
}
