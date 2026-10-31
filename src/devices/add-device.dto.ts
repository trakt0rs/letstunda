export type CreateDeviceDto = {
  name: string
  image: string
  durationMinutes: number
  powerKw: number
  splittable: boolean
  runFrom: string | null
  runUntil: string | null
}
