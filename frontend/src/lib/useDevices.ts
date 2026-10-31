import { useEffect, useState } from "react"
import type { Device } from "./devices"

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  function updateDevice(updated: Device) {
    setDevices(devices.map(d => d.id === updated.id ? updated : d))
  }

  useEffect(() => {
    const controller = new AbortController()

    fetch("/api/devices", { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then(res => setDevices(res))
      .catch(() => {
        if (!controller.signal.aborted) setError("Could not load devices")
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      })
    return () => controller.abort()
    }, [])

  return { devices, loading, error, updateDevice }
}
