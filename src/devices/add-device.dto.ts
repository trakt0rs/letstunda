export type CreateDeviceDto = {
  name: string
  image: string
  durationMinutes: number
  powerKw: number
  splittable: boolean
  deadline: string | null
}
