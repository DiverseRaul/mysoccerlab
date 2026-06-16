import { describe, it, expect } from 'vitest'
import { durationToEndsAt, isProActive, banDurationToGoString } from '../../src/lib/proDuration'

const now = new Date('2026-06-15T12:00:00Z')

describe('durationToEndsAt', () => {
  it('permanent and falsy → null', () => {
    expect(durationToEndsAt('permanent', now)).toBeNull()
    expect(durationToEndsAt(null, now)).toBeNull()
    expect(durationToEndsAt('', now)).toBeNull()
  })

  it('1w adds exactly 7 days', () => {
    expect(durationToEndsAt('1w', now)).toBe('2026-06-22T12:00:00.000Z')
  })

  it('1m / 3m / 1y advance the calendar', () => {
    expect(durationToEndsAt('1m', now)).toBe('2026-07-15T12:00:00.000Z')
    expect(durationToEndsAt('3m', now)).toBe('2026-09-15T12:00:00.000Z')
    expect(durationToEndsAt('1y', now)).toBe('2027-06-15T12:00:00.000Z')
  })

  it('custom uses the provided date, else null', () => {
    expect(durationToEndsAt('custom', now, '2026-08-01')).toBe('2026-08-01T00:00:00.000Z')
    expect(durationToEndsAt('custom', now, null)).toBeNull()
  })
})

describe('isProActive', () => {
  it('free tier is never active', () => {
    expect(isProActive('free', null, now)).toBe(false)
    expect(isProActive('free', '2099-01-01', now)).toBe(false)
  })

  it('pro with no end date is permanent', () => {
    expect(isProActive('pro', null, now)).toBe(true)
    expect(isProActive('pro', '', now)).toBe(true)
  })

  it('pro with a future end date is active', () => {
    expect(isProActive('pro', '2026-06-22T12:00:00Z', now)).toBe(true)
  })

  it('pro with a past end date has lapsed → not active', () => {
    expect(isProActive('pro', '2026-06-01T12:00:00Z', now)).toBe(false)
  })

  it('an unparseable end date fails open to active', () => {
    expect(isProActive('pro', 'not-a-date', now)).toBe(true)
  })
})

describe('banDurationToGoString', () => {
  it('maps tokens to Go duration strings', () => {
    expect(banDurationToGoString('none')).toBe('none')
    expect(banDurationToGoString('1d')).toBe('24h')
    expect(banDurationToGoString('1w')).toBe('168h')
    expect(banDurationToGoString('1m')).toBe('720h')
  })

  it('permanent / unknown → ~100 years', () => {
    expect(banDurationToGoString('permanent')).toBe('876000h')
    expect(banDurationToGoString(undefined)).toBe('876000h')
    expect(banDurationToGoString('weird')).toBe('876000h')
  })
})
