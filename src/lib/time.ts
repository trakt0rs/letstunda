export function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

export function intervalMinutes(from: string, until: string) {
  const diff = toMinutes(until) - toMinutes(from)
  return diff >= 0 ? diff : diff + 24 * 60
}
