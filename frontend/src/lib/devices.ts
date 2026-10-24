import sampleDevices from '../data/devices.json'

export type Device = {
  id: string
  name: string
  image: string
  durationMinutes: number
  powerKw: number
  // true: can run in several separate cheapest slots (e.g. car charging).
  // false: has to run in one continuous block (e.g. washing machine).
  splittable: boolean
  // "HH:mm" in Riga time the run has to be finished by, or null.
  deadline: string | null
}

// TODO(backend): replace the sample data with the user's devices from the API.
export const devices: Device[] = sampleDevices
