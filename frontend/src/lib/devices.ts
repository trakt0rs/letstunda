export type Device = {
  id: string
  name: string
  image: string
  durationMinutes: number
  powerKw: number
  splittable: boolean
  runFrom: string | null
  runUntil: string | null
}

export type NewDevice = Omit<Device, "id">
