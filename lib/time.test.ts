import { describe, it, expect } from 'vitest'
import { formatHMS, parseHMS } from './time'

describe('time utils', () => {
  it('formats seconds to HH:MM:SS', () => {
    expect(formatHMS(0)).toBe('00:00:00')
    expect(formatHMS(59)).toBe('00:00:59')
    expect(formatHMS(60)).toBe('00:01:00')
    expect(formatHMS(3600)).toBe('01:00:00')
    expect(formatHMS(3661)).toBe('01:01:01')
  })

  it('parses HH:MM:SS to seconds', () => {
    expect(parseHMS('00:00:00')).toBe(0)
    expect(parseHMS('00:01:00')).toBe(60)
    expect(parseHMS('01:00:00')).toBe(3600)
    expect(parseHMS('01:01:01')).toBe(3661)
  })

  it('rejects invalid formats', () => {
    expect(parseHMS('')).toBeNull()
    expect(parseHMS('1:2:3')).toBeNull()
    expect(parseHMS('25:00:00')).toBeNull()
    expect(parseHMS('00:60:00')).toBeNull()
    expect(parseHMS('00:00:60')).toBeNull()
  })
})

