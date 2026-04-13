"use client"

import { useEffect, useState } from "react"

interface SimpleCounterProps {
  value: number
  className?: string
}

// Lightweight counter without framer-motion dependency
export function SimpleCounter({ value, className = "" }: SimpleCounterProps) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value === 0) {
      setDisplay(0)
      return
    }

    const duration = 1000 // 1 second
    const steps = 30
    const increment = value / steps
    const stepDuration = duration / steps

    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplay(value)
        clearInterval(timer)
      } else {
        setDisplay(Math.floor(current))
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [value])

  return <span className={className}>{display}</span>
}




