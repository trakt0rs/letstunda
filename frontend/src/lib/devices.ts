export type Device = {
  id: string
  name: string
  image: string
  durationMinutes: number
  powerKw: number
  splittable: boolean
  deadline: string | null
}
