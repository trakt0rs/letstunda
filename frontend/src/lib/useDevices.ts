import { useEffect, useState } from "react"
import type { Device, NewDevice } from "./devices"

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  function updateDevice(updated: Device) {
    setDevices(devices.map(d => d.id === updated.id ? updated : d))
  }

  async function deleteDevice(id: string) {
    const res = await fetch(`/api/devices/${id}`, { method: "DELETE" })
    if (!res.ok) setError("Could not delete a device")
    setDevices(prev => prev.filter(d => d.id !== id))
  }

  async function addDevice(newDevice: NewDevice) {
    const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDevice),
      })
    if (!res.ok) { setError("Could not add a new device"); return }
    const saved: Device = await res.json()
    setDevices(prev => [...prev, saved])
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

  return { devices, loading, error, updateDevice, deleteDevice, addDevice }
}
