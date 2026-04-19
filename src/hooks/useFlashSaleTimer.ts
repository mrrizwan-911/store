'use client'

import { useState, useEffect, useRef } from 'react'

export function useFlashSaleTimer(saleEndTimeUTC: string) {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const clockOffsetMs = useRef<number>(0)

  useEffect(() => {
    fetch('/api/time')
      .then((r) => r.json())
      .then((data) => {
        if (data.serverTime) {
          clockOffsetMs.current = new Date(data.serverTime).getTime() - Date.now()
        }
      })
      .catch(() => {
        // Fall back to 0 offset on failure
        clockOffsetMs.current = 0
      })
  }, [])

  useEffect(() => {
    const tick = () => {
      const correctedNow = Date.now() + clockOffsetMs.current
      const endMs = new Date(saleEndTimeUTC).getTime()
      setTimeLeft(Math.max(0, endMs - correctedNow))
    }

    tick() // Initial tick
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [saleEndTimeUTC])

  const hours = Math.floor(timeLeft / 3_600_000)
  const minutes = Math.floor((timeLeft % 3_600_000) / 60_000)
  const seconds = Math.floor((timeLeft % 60_000) / 1000)
  const isExpired = timeLeft === 0

  return { hours, minutes, seconds, isExpired, timeLeft }
}
