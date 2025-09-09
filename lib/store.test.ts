import { describe, it, expect } from 'vitest'
import { act } from '@testing-library/react'
import { useDashboardStore } from './store'

describe('dashboard store (timer slice)', () => {
  it('starts, ticks and resets', () => {
    const get = useDashboardStore.getState
    const { start, stop, reset, tick, setSeconds } = useDashboardStore.getState()

    // initial
    expect(get().currentSeconds).toBe(0)
    expect(get().isRunning).toBe(false)

    act(() => start())
    expect(get().isRunning).toBe(true)

    act(() => tick())
    expect(get().currentSeconds).toBe(1)

    act(() => setSeconds(42))
    expect(get().currentSeconds).toBe(42)

    act(() => stop())
    expect(get().isRunning).toBe(false)

    act(() => reset())
    expect(get().currentSeconds).toBe(0)
    expect(get().isRunning).toBe(false)
  })
})

